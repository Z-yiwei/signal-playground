/**
 * Processing pipeline: declaratively chains Source -> Window -> Transform.
 *
 *   const pipeline = new Pipeline(config);
 *   const result = await pipeline.run();
 */

import {
  sourceRegistry,
  transformRegistry,
  windowRegistry
} from './registry';
import type {
  ComplexBuffer,
  DataBuffer,
  ParamValues,
  SignalKind
} from './types';

export interface PipelineResult {
  /** Raw source data (time / spatial domain) */
  source: DataBuffer;
  /** Windowed data, if a window other than rect was applied */
  windowed?: DataBuffer;
  /** Transform output */
  transformed: DataBuffer | ComplexBuffer;
  /** Wall-clock elapsed time in milliseconds */
  elapsedMs: number;
}

export interface PipelineConfig {
  sourceId: string;
  sourceParams: ParamValues;
  windowId?: string;
  transformId: string;
  transformParams: ParamValues;
  /** Continuous vs. discrete; controls rendering and transform compatibility */
  signalKind: SignalKind;
  /** Optional extra signals summed into the primary signal */
  extraComponents?: Array<{ sourceId: string; params: ParamValues }>;
}

export class Pipeline {
  constructor(private config: PipelineConfig) {}

  async run(): Promise<PipelineResult> {
    const t0 = performance.now();

    // 1) Generate primary source.
    const source = sourceRegistry.get(this.config.sourceId);
    if (!source) throw new Error(`Source not found: ${this.config.sourceId}`);
    let buf = await source.generate({
      ...this.config.sourceParams,
      __signalKind: this.config.signalKind
    });
    // Pin signalKind into metadata so visualisers can read it.
    buf.metadata = {
      ...buf.metadata,
      extra: { ...(buf.metadata.extra ?? {}), signalKind: this.config.signalKind }
    };

    // 2) Sum extra signal components (1D only).
    if (this.config.extraComponents?.length && buf.shape.length === 1) {
      for (const comp of this.config.extraComponents) {
        const compSrc = sourceRegistry.get(comp.sourceId);
        if (!compSrc) continue;
        const compBuf = await compSrc.generate(comp.params);
        const len = Math.min(buf.data.length, compBuf.data.length);
        for (let i = 0; i < len; i++) buf.data[i] += compBuf.data[i];
      }
    }

    const sourceBuf = buf;

    // 3) Apply window (1D only, skip rectangular).
    let windowed: DataBuffer | undefined;
    if (this.config.windowId && this.config.windowId !== 'rect' && buf.shape.length === 1) {
      const win = windowRegistry.get(this.config.windowId);
      if (win) {
        const N = buf.data.length;
        const coeffs = win.generate(N);
        const out = new Float32Array(N);
        for (let i = 0; i < N; i++) out[i] = buf.data[i] * coeffs[i];
        windowed = {
          data: out,
          shape: [N],
          dtype: 'float32',
          metadata: { ...buf.metadata }
        };
        buf = windowed;
      }
    }

    // 4) Run the transform.
    const transform = transformRegistry.get(this.config.transformId);
    if (!transform) throw new Error(`Transform not found: ${this.config.transformId}`);
    const transformed = await transform.forward(buf, this.config.transformParams);

    return {
      source: sourceBuf,
      windowed,
      transformed,
      elapsedMs: performance.now() - t0
    };
  }
}
