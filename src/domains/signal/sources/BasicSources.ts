/**
 * Square / triangle / sawtooth / gaussian pulse / white noise / linear chirp.
 * All sources support both continuous and discrete modes via __signalKind.
 */
import type { IDataSource, DataBuffer, ParamValues } from '@/core/types';
import { baseSignalParams, buildTimeSignal, buildDiscreteSignal } from './_base';

const commonFreqAmp = [
  { name: 'freq', type: 'number' as const, default: 10, min: 0.5, max: 200, step: 0.5, label: 'Frequency', unit: 'Hz' },
  { name: 'amp',  type: 'number' as const, default: 1,  min: 0,   max: 5,   step: 0.05, label: 'Amplitude' }
];

function makeBuf(data: Float32Array, fs: number): DataBuffer {
  return {
    data,
    shape: [data.length],
    dtype: 'float32',
    metadata: { sampleRate: fs, domain: 'time', units: 'a.u.' }
  };
}

/**
 * Pick discrete or continuous grid based on __signalKind.
 * Both modes are mathematically equivalent (sampling theorem); they differ only in who controls N.
 */
function buildBy(p: ParamValues, fs: number, fn: (t: number, i: number) => number): { data: Float32Array; N: number } {
  if (p.__signalKind === 'discrete') {
    const Ns = Math.max(2, Math.round(Number(p.numSamples ?? 64)));
    const { data, N } = buildDiscreteSignal(Ns, (n, i) => fn(n / fs, i));
    return { data, N };
  }
  const dur = Number(p.duration ?? 1);
  return buildTimeSignal(fs, dur, fn);
}

// ============ Square ============
export const SquareSource: IDataSource = {
  id: 'square',
  name: 'Square Wave',
  domain: 'signal',
  signalKind: 'both',
  latex: 'A\\,\\text{sgn}(\\sin(2\\pi f t))',
  description: 'Ideal square wave (rich odd harmonics)',
  params: [...commonFreqAmp, ...baseSignalParams],
  async generate(p: ParamValues) {
    const freq = Number(p.freq), amp = Number(p.amp), fs = Number(p.sampleRate ?? 1000);
    const { data } = buildBy(p, fs, (t) =>
      amp * (Math.sin(2 * Math.PI * freq * t) >= 0 ? 1 : -1)
    );
    return makeBuf(data, fs);
  }
};

// ============ Triangle ============
export const TriangleSource: IDataSource = {
  id: 'triangle',
  name: 'Triangle Wave',
  domain: 'signal',
  signalKind: 'both',
  latex: '\\text{tri}(2 f t)',
  params: [...commonFreqAmp, ...baseSignalParams],
  async generate(p: ParamValues) {
    const freq = Number(p.freq), amp = Number(p.amp), fs = Number(p.sampleRate ?? 1000);
    const T = 1 / freq;
    const { data } = buildBy(p, fs, (t) => {
      const x = ((t % T) + T) % T;
      const r = x / T;
      return amp * (r < 0.5 ? 4 * r - 1 : 3 - 4 * r);
    });
    return makeBuf(data, fs);
  }
};

// ============ Sawtooth ============
export const SawtoothSource: IDataSource = {
  id: 'sawtooth',
  name: 'Sawtooth Wave',
  domain: 'signal',
  signalKind: 'both',
  latex: '2(ft - \\lfloor ft + 1/2 \\rfloor)',
  params: [...commonFreqAmp, ...baseSignalParams],
  async generate(p: ParamValues) {
    const freq = Number(p.freq), amp = Number(p.amp), fs = Number(p.sampleRate ?? 1000);
    const T = 1 / freq;
    const { data } = buildBy(p, fs, (t) => {
      const x = ((t % T) + T) % T;
      return amp * (2 * (x / T) - 1);
    });
    return makeBuf(data, fs);
  }
};

// ============ Gaussian Pulse ============
export const GaussianPulseSource: IDataSource = {
  id: 'gaussian',
  name: 'Gaussian Pulse',
  domain: 'signal',
  signalKind: 'both',
  latex: 'A\\,e^{-(t-c)^2/(2\\sigma^2)}',
  description: 'Gaussian-modulated pulse (radar / comms)',
  params: [
    { name: 'center', type: 'number', default: 0.5, min: 0,    max: 4,    step: 0.05, label: 'Center', unit: 's' },
    { name: 'sigma',  type: 'number', default: 0.05, min: 0.005, max: 0.5, step: 0.005, label: 'Sigma', unit: 's' },
    { name: 'amp',    type: 'number', default: 1,    min: 0,    max: 5,    step: 0.05, label: 'Amplitude' },
    ...baseSignalParams
  ],
  async generate(p: ParamValues) {
    const c = Number(p.center), s = Number(p.sigma), amp = Number(p.amp);
    const fs = Number(p.sampleRate ?? 1000);
    const { data } = buildBy(p, fs, (t) => {
      const u = (t - c) / s;
      return amp * Math.exp(-0.5 * u * u);
    });
    return makeBuf(data, fs);
  }
};

// ============ Noise ============
export const NoiseSource: IDataSource = {
  id: 'noise',
  name: 'White Noise',
  domain: 'signal',
  signalKind: 'both',
  latex: '\\eta(t) \\sim \\mathcal{U}(-A, A)',
  description: 'Uniform white noise',
  params: [
    { name: 'amp', type: 'number', default: 0.5, min: 0, max: 3, step: 0.05, label: 'Amplitude' },
    ...baseSignalParams
  ],
  async generate(p: ParamValues) {
    const amp = Number(p.amp), fs = Number(p.sampleRate ?? 1000);
    const { data } = buildBy(p, fs, () =>
      amp * (Math.random() * 2 - 1)
    );
    return makeBuf(data, fs);
  }
};

// ============ Chirp (linear) ============
export const ChirpSource: IDataSource = {
  id: 'chirp',
  name: 'Linear Chirp',
  domain: 'signal',
  signalKind: 'both',
  latex: 'A\\sin(2\\pi(f_0 t + \\tfrac{1}{2} k t^2))',
  description: 'Frequency sweeps linearly from f0 to f1 - perfect for spectrograms',
  params: [
    { name: 'f0',  type: 'number', default: 5,   min: 0.5, max: 200, step: 0.5, label: 'Start Freq', unit: 'Hz' },
    { name: 'f1',  type: 'number', default: 100, min: 1,   max: 500, step: 1,   label: 'End Freq',   unit: 'Hz' },
    { name: 'amp', type: 'number', default: 1,   min: 0,   max: 5,   step: 0.05, label: 'Amplitude' },
    ...baseSignalParams
  ],
  async generate(p: ParamValues) {
    const f0 = Number(p.f0), f1 = Number(p.f1), amp = Number(p.amp);
    const fs = Number(p.sampleRate ?? 1000);
    // Chirp needs a total duration to compute its sweep slope; in discrete mode, derive it from numSamples/fs.
    const dur = p.__signalKind === 'discrete'
      ? Math.max(2, Math.round(Number(p.numSamples ?? 64))) / fs
      : Number(p.duration ?? 1);
    const k = (f1 - f0) / dur;
    const { data } = buildBy(p, fs, (t) =>
      amp * Math.sin(2 * Math.PI * (f0 * t + 0.5 * k * t * t))
    );
    return makeBuf(data, fs);
  }
};
