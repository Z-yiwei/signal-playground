/** DCT-II (direct O(N^2) implementation; same kernel used by JPEG and MP3). */
import type { ITransform, DataBuffer } from '@/core/types';

export const DCT: ITransform = {
  id: 'dct',
  name: 'DCT-II',
  shortName: 'DCT',
  description: 'Same kernel as JPEG/MP3; better energy compaction than DFT',
  category: 'cosine-sine',
  inputDomain: 'time',
  outputDomain: 'frequency',
  supportedDimensions: [1],
  compatibleSignalKinds: ['discrete', 'continuous'],
  isComplexOutput: false,
  latexFormula: 'X[k] = \\sum_{n=0}^{N-1} x[n]\\cos\\!\\left[\\frac{\\pi}{N}\\!\\left(n+\\tfrac{1}{2}\\right)k\\right]',
  teachingHints: {
    inputRequirement: 'Real-valued finite sequence',
    outputSemantics: 'Real coefficients; low-frequency coefficients carry most energy',
    commonPitfalls: 'DCT-II and DCT-III are mutually inverse; libraries differ on normalization',
    relatedTransforms: ['DFT', 'DST']
  },
  params: [
    {
      name: 'normalize',
      type: 'boolean',
      default: true,
      label: 'Orthonormal',
      description: 'Orthonormal scaling (matches scipy.fft.dct(norm="ortho"))'
    }
  ],

  async forward(input: DataBuffer, params): Promise<DataBuffer> {
    const x = input.data;
    const N = x.length;
    const out = new Float32Array(N);
    const piOver2N = Math.PI / (2 * N);
    for (let k = 0; k < N; k++) {
      let s = 0;
      for (let n = 0; n < N; n++) {
        s += x[n] * Math.cos((2 * n + 1) * k * piOver2N);
      }
      out[k] = s;
    }
    if (params?.normalize) {
      const f0 = Math.sqrt(1 / N);
      const fk = Math.sqrt(2 / N);
      out[0] *= f0;
      for (let k = 1; k < N; k++) out[k] *= fk;
    } else {
      for (let k = 0; k < N; k++) out[k] *= 2;
    }
    return {
      data: out,
      shape: [N],
      dtype: 'float32',
      metadata: { ...input.metadata, domain: 'frequency' }
    };
  },

  async inverse(input: DataBuffer | { real: Float32Array; imag: Float32Array; shape: number[]; metadata: any }, params) {
    if ('real' in input) throw new Error('DCT inverse expects real input');
    const X = (input as DataBuffer).data;
    const N = X.length;
    const out = new Float32Array(N);
    const piOver2N = Math.PI / (2 * N);

    let X0 = X[0], scale = 1;
    if (params?.normalize) {
      X0 = X[0] / Math.sqrt(1 / N);
      scale = Math.sqrt(2 / N);
    }
    for (let n = 0; n < N; n++) {
      let s = 0.5 * X0;
      for (let k = 1; k < N; k++) {
        const Xk = params?.normalize ? X[k] / scale : X[k] / 2;
        s += Xk * Math.cos((2 * n + 1) * k * piOver2N);
      }
      out[n] = (2 / N) * s;
    }
    return {
      data: out,
      shape: [N],
      dtype: 'float32',
      metadata: { ...(input as DataBuffer).metadata, domain: 'time' }
    };
  }
};
