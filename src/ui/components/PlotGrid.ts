/**
 * Multi-plot grid renderer.
 * Picks a layout based on the transform's output:
 *   complex frequency  -> time + magnitude + phase
 *   real coefficients  -> time + stem coefficients
 *   spectrogram        -> time + heatmap
 *   analytic (Hilbert) -> Hilbert / envelope / instantaneous phase
 *   complex plane      -> time + 2D log-magnitude heatmap
 */
import type { PipelineResult } from '@/core/pipeline';
import type { ITransform } from '@/core/types';
import { transformRegistry } from '@/core/registry';
import { LinePlot } from '@/visualizers/LinePlot';
import { Heatmap } from '@/visualizers/Heatmap';
import { complexMagnitude, complexPhase, toDecibels } from '@/domains/shared/complex';
import { frequencyAxis } from '@/domains/shared/fftCore';
import { accent } from '@/visualizers/theme';
import { store } from '@/core/store';
import { t } from '@/i18n';

interface PlotCell {
  el: HTMLElement;
  visualizer: LinePlot | Heatmap;
  title: string;
}

export class PlotGrid {
  private root: HTMLElement;
  private cells: PlotCell[] = [];

  constructor(container: HTMLElement) {
    this.root = container;
  }

  render(result: PipelineResult, transformId: string): void {
    this.destroy();

    const transform = transformRegistry.get(transformId);
    if (!transform) return;

    // Prefer signalKind from metadata (set by the source itself).
    const metaKind = (result.source.metadata.extra as any)?.signalKind;
    const isDiscrete = metaKind ? metaKind === 'discrete' : store.getSignalKind() === 'discrete';

    // Time / spatial domain plot
    const N = result.source.data.length;
    this.addLine({
      title: isDiscrete ? t('plot.timeDomain.discrete', { N }) : t('plot.timeDomain.continuous'),
      xLabel: isDiscrete ? t('plot.axis.sampleIndex') : t('plot.axis.time'),
      yLabel: t('plot.axis.amplitude'),
      yData: result.source.data,
      xData: this.buildTimeAxis(result.source, isDiscrete),
      color: accent.primary,
      // Discrete: stem when N <= 512, otherwise fall back to markers to keep Plotly snappy.
      stem: isDiscrete && N <= 512,
      markers: isDiscrete && N > 512 && N <= 2048
    });

    // Layout depends on the transform output type.
    if (transform.outputDomain === 's-plane' || transform.outputDomain === 'z-plane') {
      this.renderComplexPlane(result, transform);
    } else if (transform.id === 'hilbert') {
      this.renderHilbert(result);
    } else if (transform.outputDomain === 'spectral') {
      this.renderSpectrogram(result);
    } else if (transform.isComplexOutput) {
      this.renderFrequencyPlots(result, transform);
    } else {
      this.renderRealSpectrum(result, transform);
    }

    this.layout();
  }

  // ---- Complex frequency: DFT / DTFT / CTFT / CTFS / DFS ----
  private renderFrequencyPlots(result: PipelineResult, transform: ITransform): void {
    const tr = result.transformed;
    if (!('real' in tr)) return;

    const N = tr.real.length;
    const fs = tr.metadata.sampleRate ?? 1;
    const extra = (tr.metadata.extra ?? {}) as Record<string, any>;

    let xData: Float32Array;
    let xLabel = t('plot.axis.freqHz');
    let half = Math.floor(N / 2) + 1;

    if (extra.isDTFT) {
      xData = new Float32Array(N);
      const [w0, w1] = extra.omegaRange as [number, number];
      for (let i = 0; i < N; i++) xData[i] = w0 + ((w1 - w0) * i) / (N - 1);
      xLabel = t('plot.axis.omega');
      half = N; // DTFT covers full [-pi, pi]
    } else if (extra.isCTFT) {
      xData = new Float32Array(N);
      const [f0, f1] = extra.freqRange as [number, number];
      for (let i = 0; i < N; i++) xData[i] = f0 + ((f1 - f0) * i) / (N - 1);
      half = N;
    } else if (extra.isCTFS) {
      xData = new Float32Array(N);
      const K = extra.K as number;
      for (let i = 0; i < N; i++) xData[i] = i - K;
      xLabel = t('plot.axis.harmonic');
      half = N;
    } else if (extra.isDFS) {
      xData = new Float32Array(N);
      for (let i = 0; i < N; i++) xData[i] = i;
      xLabel = t('plot.axis.kExtended');
      half = N;
    } else {
      // Default DFT: one-sided spectrum
      xData = frequencyAxis(N, fs, true);
    }

    const mag = complexMagnitude(tr.real, tr.imag);
    const phase = complexPhase(tr.real, tr.imag);

    // Take the lower half (only meaningful for one-sided DFT etc.).
    const magSlice = mag.subarray(0, half);
    const phaseSlice = phase.subarray(0, half);
    const xSlice = xData.subarray(0, half);

    const magDB = toDecibels(magSlice, Math.max(N / 4, 1));

    const isLine = !(extra.isCTFS || extra.isDFS);

    this.addLine({
      title: t('plot.title.magSpectrum'),
      xLabel,
      yLabel: extra.isCTFS || extra.isDFS ? t('plot.axis.magCk') : t('plot.axis.magDb'),
      yData: extra.isCTFS || extra.isDFS ? magSlice : magDB,
      xData: xSlice,
      color: accent.magenta,
      stem: !isLine
    });

    this.addLine({
      title: t('plot.title.phaseSpectrum'),
      xLabel,
      yLabel: t('plot.axis.phaseRad'),
      yData: phaseSlice,
      xData: xSlice,
      color: accent.purple,
      stem: !isLine
    });
  }

  // ---- Real-valued spectrum: DCT / DST ----
  private renderRealSpectrum(result: PipelineResult, _transform: ITransform): void {
    const tr = result.transformed;
    if ('real' in tr) return;
    const N = tr.data.length;
    const x = new Float32Array(N);
    for (let i = 0; i < N; i++) x[i] = i;
    this.addLine({
      title: t('plot.title.coefficients'),
      xLabel: t('plot.axis.coeffIndex'),
      yLabel: t('plot.axis.value'),
      yData: tr.data,
      xData: x,
      color: accent.yellow,
      stem: true
    });
  }

  // ---- STFT spectrogram ----
  private renderSpectrogram(result: PipelineResult): void {
    const tr = result.transformed;
    if ('real' in tr) return;
    if (tr.shape.length !== 2) return;
    const titleFull = t('plot.title.spectrogram');
    const titleShort = t('plot.title.spectrogramShort');
    const cell = this.makeCell(titleFull);
    const hm = new Heatmap();
    hm.mount(cell.querySelector('.cell-body') as HTMLElement);
    const fs = tr.metadata.sampleRate ?? 1;
    const numFrames = tr.shape[0];
    const extra = tr.metadata.extra as { hop?: number } | undefined;
    const hop = extra?.hop ?? 128;
    const tMax = (numFrames * hop) / fs;
    hm.render(tr, {
      title: titleShort,
      xLabel: t('plot.axis.time'),
      yLabel: t('plot.axis.freqHz'),
      colorscale: 'Viridis',
      xRange: [0, tMax],
      yRange: [0, fs / 2]
    });
    this.cells.push({ el: cell, visualizer: hm as any, title: titleShort });
    this.root.appendChild(cell);
  }

  // ---- Hilbert: analytic-signal triptych ----
  private renderHilbert(result: PipelineResult): void {
    const tr = result.transformed;
    if (!('real' in tr)) return;
    const N = tr.real.length;
    const fs = tr.metadata.sampleRate ?? 1;
    const tAxis = new Float32Array(N);
    for (let i = 0; i < N; i++) tAxis[i] = i / fs;

    const envelope = complexMagnitude(tr.real, tr.imag);
    const instPhase = complexPhase(tr.real, tr.imag);

    // The imaginary part itself IS the Hilbert transform (90-degree shift).
    const hilbertImag = new Float32Array(tr.imag as Float32Array);

    this.addLine({
      title: t('plot.title.hilbert'),
      xLabel: t('plot.axis.time'),
      yLabel: t('plot.axis.xhat'),
      yData: hilbertImag,
      xData: tAxis,
      color: accent.magenta
    });

    this.addLine({
      title: t('plot.title.envelope'),
      xLabel: t('plot.axis.time'),
      yLabel: t('plot.axis.envelope'),
      yData: envelope,
      xData: tAxis,
      color: accent.yellow
    });

    this.addLine({
      title: t('plot.title.instPhase'),
      xLabel: t('plot.axis.time'),
      yLabel: t('plot.axis.phaseRad'),
      yData: instPhase,
      xData: tAxis,
      color: accent.purple
    });
  }

  // ---- s / z plane ----
  private renderComplexPlane(result: PipelineResult, transform: ITransform): void {
    const tr = result.transformed;
    if ('real' in tr) return;
    if (tr.shape.length !== 2) return;
    const extra = tr.metadata.extra as Record<string, any>;

    let xRange: [number, number];
    let yRange: [number, number];
    let xLabel = 'Re';
    let yLabel = 'Im';
    let title = '|X(·)| (dB)';

    if (transform.outputDomain === 'z-plane') {
      const r = extra.rMax as number;
      xRange = [-r, r];
      yRange = [-r, r];
      xLabel = t('plot.axis.reZ');
      yLabel = t('plot.axis.imZ');
      title = t('plot.title.zPlane');
    } else {
      // s-plane
      const sigma = extra.sigmaRange as number;
      const omega = extra.omegaRange as number;
      xRange = [-sigma, sigma];
      yRange = [-omega, omega];
      xLabel = t('plot.axis.sigma');
      yLabel = t('plot.axis.omegaShort');
      title = t('plot.title.sPlane');
    }

    const cell = this.makeCell(title);
    const hm = new Heatmap();
    hm.mount(cell.querySelector('.cell-body') as HTMLElement);
    hm.render(tr, {
      title,
      xLabel,
      yLabel,
      colorscale: 'Plasma',
      xRange,
      yRange
    });
    this.cells.push({ el: cell, visualizer: hm as any, title });
    this.root.appendChild(cell);
  }

  // ---- helpers ----

  private buildTimeAxis(
    buf: { data: ArrayLike<number>; metadata: { sampleRate?: number } },
    discrete: boolean
  ): Float32Array {
    const N = buf.data.length;
    const fs = buf.metadata.sampleRate ?? 1;
    const out = new Float32Array(N);
    if (discrete) {
      for (let i = 0; i < N; i++) out[i] = i;
    } else {
      for (let i = 0; i < N; i++) out[i] = i / fs;
    }
    return out;
  }

  private addLine(opts: {
    title: string; xLabel: string; yLabel: string;
    yData: ArrayLike<number>; xData: ArrayLike<number>;
    color: string; stem?: boolean; markers?: boolean;
  }): void {
    const cell = this.makeCell(opts.title);
    const vis = new LinePlot();
    vis.mount(cell.querySelector('.cell-body') as HTMLElement);
    vis.render(
      { data: opts.yData as Float32Array, shape: [opts.yData.length], dtype: 'float32', metadata: { domain: 'time' } },
      {
        title: opts.title,
        xLabel: opts.xLabel,
        yLabel: opts.yLabel,
        color: opts.color,
        xValues: opts.xData,
        stem: opts.stem,
        markers: opts.markers
      }
    );
    this.cells.push({ el: cell, visualizer: vis, title: opts.title });
    this.root.appendChild(cell);
  }

  private makeCell(title: string): HTMLElement {
    const cell = document.createElement('div');
    cell.className = 'plot-cell';
    cell.innerHTML = `<div class="cell-title">${title}</div><div class="cell-body"></div>`;
    return cell;
  }

  private layout(): void {
    const n = this.cells.length;
    this.root.classList.remove('grid-1', 'grid-2', 'grid-3', 'grid-4');
    this.root.classList.add(`grid-${Math.min(n, 4)}`);
  }

  destroy(): void {
    for (const c of this.cells) c.visualizer.destroy();
    this.cells = [];
    this.root.innerHTML = '';
  }

  getCells(): PlotCell[] {
    return this.cells;
  }
}
