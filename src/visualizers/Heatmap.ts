/** Heatmap visualiser used for spectrograms and 2D complex-plane surfaces. */
import Plotly from 'plotly.js-dist-min';
import type { IVisualizer, DataBuffer, ComplexBuffer } from '@/core/types';
import { darkTheme } from './theme';

export interface HeatmapOptions {
  title?: string;
  xLabel?: string;
  yLabel?: string;
  colorscale?: string;
  xRange?: [number, number];
  yRange?: [number, number];
}

export class Heatmap implements IVisualizer {
  readonly id = 'heatmap';
  readonly name = 'Heatmap';
  readonly accepts = { dimensions: [2] };

  private container: HTMLElement | null = null;

  mount(container: HTMLElement): void {
    this.container = container;
  }

  render(
    data: DataBuffer | ComplexBuffer,
    options: HeatmapOptions = {}
  ): void {
    if (!this.container) return;
    if ('real' in data) throw new Error('Heatmap expects real 2D DataBuffer');
    if (data.shape.length !== 2) throw new Error('Heatmap requires 2D shape');

    const [rows, cols] = data.shape;
    const z: number[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: number[] = new Array(cols);
      for (let c = 0; c < cols; c++) row[c] = data.data[r * cols + c];
      z.push(row);
    }
    // Spectrogram convention: time on X, frequency on Y -> transpose.
    const zT: number[][] = [];
    for (let c = 0; c < cols; c++) {
      const row: number[] = new Array(rows);
      for (let r = 0; r < rows; r++) row[r] = z[r][c];
      zT.push(row);
    }

    const trace: any = {
      z: zT,
      type: 'heatmap',
      colorscale: options.colorscale ?? 'Viridis',
      colorbar: { thickness: 12, len: 0.85, tickfont: { color: '#cfd6e4', size: 10 } }
    };
    if (options.xRange) {
      trace.x0 = options.xRange[0];
      trace.dx = (options.xRange[1] - options.xRange[0]) / Math.max(1, rows - 1);
    }
    if (options.yRange) {
      trace.y0 = options.yRange[0];
      trace.dy = (options.yRange[1] - options.yRange[0]) / Math.max(1, cols - 1);
    }

    const layout: any = {
      ...darkTheme,
      title: { text: options.title ?? '', font: { size: 13, color: '#cfd6e4' } },
      xaxis: { ...darkTheme.xaxis, title: { text: options.xLabel ?? '' } },
      yaxis: { ...darkTheme.yaxis, title: { text: options.yLabel ?? '' } },
      autosize: true
    };

    Plotly.react(this.container, [trace], layout, {
      responsive: true,
      displaylogo: false
    });
  }

  destroy(): void {
    if (this.container) Plotly.purge(this.container);
    this.container = null;
  }
}
