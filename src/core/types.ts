/**
 * Core type definitions: dimension- and domain-agnostic contracts shared by
 * every plugin (data sources, transforms, windows, visualizers, presets).
 */

// ============ Data buffers ============

/** Semantic domain a buffer lives in. */
export type DataDomain =
  | 'time'
  | 'frequency'
  | 'spatial'
  | 'spectral'
  | 'wavelet'
  | 'phase'
  | 's-plane'
  | 'z-plane'
  | 'magnitude';

/**
 * Signal nature.
 * - continuous: x(t), rendered as a dense polyline.
 * - discrete:   x[n], rendered as a stem plot.
 */
export type SignalKind = 'continuous' | 'discrete';

/** Real-valued buffer (1D / 2D / 3D). */
export interface DataBuffer {
  /** Flat storage; for 2D the layout is row-major: index = row * width + col. */
  data: Float32Array | Float64Array;
  /** Shape: [N] for 1D, [H, W] for 2D, [H, W, C] for multi-channel. */
  shape: number[];
  dtype: 'float32' | 'float64';
  metadata: BufferMetadata;
}

/** Complex-valued buffer (output of FFT-style transforms). */
export interface ComplexBuffer {
  real: Float32Array | Float64Array;
  imag: Float32Array | Float64Array;
  shape: number[];
  metadata: BufferMetadata;
}

export interface BufferMetadata {
  /** Sample rate (Hz) for time-domain signals. */
  sampleRate?: number;
  /** Pixel spacing [dy, dx] for image-domain buffers. */
  pixelSpacing?: [number, number];
  /** Unit label (e.g. 'V', 'pixel'). */
  units?: string;
  domain: DataDomain;
  /** Free-form metadata propagated through the pipeline. */
  extra?: Record<string, unknown>;
}

// ============ Parameter schema (drives auto-generated UI) ============

export type ParamType = 'number' | 'enum' | 'boolean' | 'range';

export interface ParamSchema {
  name: string;
  type: ParamType;
  default: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ value: string; label: string }>;
  label: string;
  description?: string;
  /** Unit suffix shown next to the label (e.g. 'Hz', 'dB'). */
  unit?: string;
}

export type ParamValues = Record<string, number | string | boolean>;

// ============ Data source ============

export interface IDataSource {
  readonly id: string;
  readonly name: string;
  readonly domain: 'signal' | 'image';
  readonly description?: string;
  /** Signal nature; use 'both' to let the user choose at runtime. */
  readonly signalKind: SignalKind | 'both';
  /** LaTeX-formatted definition shown in teaching cards (optional). */
  readonly latex?: string;
  readonly params: ParamSchema[];
  generate(params: ParamValues): Promise<DataBuffer>;
}

// ============ Transform ============

/** Transform category, used for UI grouping. */
export type TransformCategory =
  | 'fourier-continuous'
  | 'fourier-discrete'
  | 'cosine-sine'
  | 'complex-plane'
  | 'time-frequency'
  | 'analytic';

export interface ITransform {
  readonly id: string;
  readonly name: string;
  readonly shortName?: string;
  readonly description?: string;
  readonly category: TransformCategory;
  readonly inputDomain: DataDomain;
  readonly outputDomain: DataDomain;
  readonly supportedDimensions: ReadonlyArray<1 | 2 | 3>;
  /** Restricts which signal kinds this transform accepts. */
  readonly compatibleSignalKinds: ReadonlyArray<SignalKind>;
  /** Mathematical definition (LaTeX), rendered by TransformInfo. */
  readonly latexFormula: string;
  /** Teaching hints surfaced in the side panel. */
  readonly teachingHints?: {
    inputRequirement?: string;
    outputSemantics?: string;
    commonPitfalls?: string;
    relatedTransforms?: string[];
  };
  readonly params: ParamSchema[];
  /** Whether the forward output is complex-valued. */
  readonly isComplexOutput: boolean;

  forward(
    input: DataBuffer,
    params?: ParamValues
  ): Promise<DataBuffer | ComplexBuffer>;

  inverse?(
    input: DataBuffer | ComplexBuffer,
    params?: ParamValues
  ): Promise<DataBuffer>;
}

// ============ Window ============

export interface IWindow {
  readonly id: string;
  readonly name: string;
  /** Generate a length-N window coefficient array. */
  generate(N: number): Float32Array;
}

// ============ Visualizer ============

export interface VisualizerAccepts {
  domain?: DataDomain[];
  dimensions?: number[];
}

export interface IVisualizer {
  readonly id: string;
  readonly name: string;
  readonly accepts: VisualizerAccepts;
  mount(container: HTMLElement): void;
  render(data: DataBuffer | ComplexBuffer, options?: Record<string, unknown>): void;
  destroy(): void;
}

// ============ Preset ============

export interface IPreset {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly domain: 'signal' | 'image';
  /** Materialise the preset into a full pipeline configuration. */
  apply(): PresetConfig;
}

export interface PresetConfig {
  sourceId: string;
  sourceParams: ParamValues;
  transformId: string;
  transformParams: ParamValues;
  windowId?: string;
  /** Override the data source's default signal kind. */
  signalKind?: SignalKind;
  /** Extra components added on top of the main signal. */
  extraComponents?: Array<{ sourceId: string; params: ParamValues }>;
}
