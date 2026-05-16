/**
 * Line-plot visualiser used for time-domain, magnitude and phase plots.
 * Render styles:
 *   1) lines   - default continuous polyline
 *   2) stem    - true discrete stem plot ((x, 0) -> (x, y) verticals + dots)
 *   3) markers - dots only (fallback when there are many points)
 */
import Plotly from 'plotly.js-dist-min';
import type { IVisualizer, DataBuffer, ComplexBuffer } from '@/core/types';
import { darkTheme, accent } from './theme';

export interface LinePlotOptions {
  title?: string;
  xLabel?: string;
  yLabel?: string;
  color?: string;
  /** Custom X-axis values; falls back to index when omitted. */
  xValues?: ArrayLike<number>;
  /** True stem plot for discrete signals. */
  stem?: boolean;
  /** Markers-only fallback for large discrete signals. */
  markers?: boolean;
}

export class LinePlot implements IVisualizer {
  readonly id = 'line-plot';
  readonly name = 'Line Plot';
  readonly accepts = { dimensions: [1] };

  private container: HTMLElement | null = null;

  mount(container: HTMLElement): void {
    this.container = container;
  }

  render(
    data: DataBuffer | ComplexBuffer,
    options: LinePlotOptions = {}
  ): void {
    if (!this.container) return;
    if ('real' in data) throw new Error('LinePlot expects real DataBuffer');

    const N = data.data.length;
    const y = Array.from(data.data);
    const x = options.xValues
      ? Array.from(options.xValues as ArrayLike<number>).slice(0, N)
      : y.map((_, i) => i);

    const color = options.color ?? accent.primary;
    const traces: any[] = [];

    if (options.stem) {
      // True stem: (x, 0) -> (x, y) line segments plus markers on top.
      const stemX: (number | null)[] = [];
      const stemY: (number | null)[] = [];
      for (let i = 0; i < N; i++) {
        stemX.push(x[i], x[i], null);
        stemY.push(0, y[i], null);
      }
      // Stems
      traces.push({
        x: stemX,
        y: stemY,
        type: 'scattergl',
        mode: 'lines',
        line: { color, width: 1.2 },
        showlegend: false,
        hoverinfo: 'skip'
      });
      // Top markers
      traces.push({
        x,
        y,
        type: 'scattergl',
        mode: 'markers',
        marker: { color, size: 6, line: { color, width: 1 } },
        showlegend: false,
        hovertemplate:
          `${options.xLabel ?? 'x'}: %{x}<br>${options.yLabel ?? 'y'}: %{y:.4f}<extra></extra>`
      });
      // Zero baseline (faint dotted line)
      traces.push({
        x: [x[0], x[N - 1]],
        y: [0, 0],
        type: 'scattergl',
        mode: 'lines',
        line: { color: '#2a3142', width: 1, dash: 'dot' },
        showlegend: false,
        hoverinfo: 'skip'
      });
    } else {
      // Lines / markers-only mode
      traces.push({
        x,
        y,
        type: 'scattergl',
        mode: options.markers ? 'markers' : 'lines',
        line: { color, width: 1.5 },
        marker: { color, size: options.markers ? 3 : 4 },
        hovertemplate:
          `${options.xLabel ?? 'x'}: %{x:.4f}<br>${options.yLabel ?? 'y'}: %{y:.4f}<extra></extra>`
      });
    }

    const layout: any = {
      ...darkTheme,
      title: { text: options.title ?? '', font: { size: 13, color: '#cfd6e4' } },
      xaxis: { ...darkTheme.xaxis, title: { text: options.xLabel ?? '' } },
      yaxis: { ...darkTheme.yaxis, title: { text: options.yLabel ?? '' } },
      autosize: true,
      showlegend: false
    };

    Plotly.react(this.container, traces, layout, {
      responsive: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['lasso2d', 'select2d']
    });
  }

  destroy(): void {
    if (this.container) Plotly.purge(this.container);
    this.container = null;
  }

  exportPNG(): Promise<Blob> {
    if (!this.container) return Promise.reject(new Error('Not mounted'));
    return Plotly.toImage(this.container, { format: 'png', width: 1200, height: 600 })
      .then((url: string) => fetch(url).then((r) => r.blob()));
  }
}
