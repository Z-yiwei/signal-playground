/** Discrete Fourier Series for periodic discrete signals (rendered over multiple periods). */
import type { ITransform, DataBuffer, ComplexBuffer } from '@/core/types';
import { fft1D } from '@/domains/shared/fftCore';

export const DFS: ITransform = {
  id: 'dfs',
  name: 'DFS (Discrete Fourier Series)',
  shortName: 'DFS',
  description: 'Fourier series of a periodic discrete signal: periodic -> periodic',
  category: 'fourier-discrete',
  inputDomain: 'time',
  outputDomain: 'frequency',
  supportedDimensions: [1],
  compatibleSignalKinds: ['discrete'],
  isComplexOutput: true,
  latexFormula: '\\tilde{X}[k] = \\sum_{n=0}^{N-1} \\tilde{x}[n]\\, e^{-j 2\\pi k n / N}',
  teachingHints: {
    inputRequirement: 'Periodic discrete signal x[n] with period N',
    outputSemantics: 'Periodic discrete spectrum X[k] (3 periods shown)',
    commonPitfalls: 'DFS shares the formula with DFT but acts on infinite-length periodic sequences',
    relatedTransforms: ['DFT', 'CTFS']
  },
  params: [
    {
      name: 'periodsToShow',
      type: 'number',
      default: 3,
      min: 1,
      max: 5,
      step: 1,
      label: 'Periods Shown',
      description: 'Number of periods drawn'
    }
  ],

  async forward(input: DataBuffer, params): Promise<ComplexBuffer> {
    const x = input.data;
    const { real: r0, imag: i0, N: N0 } = fft1D(x);
    const periods = Math.round(Number(params?.periodsToShow ?? 3));
    const M = N0 * periods;
    const real = new Float32Array(M);
    const imag = new Float32Array(M);
    for (let p = 0; p < periods; p++) {
      for (let k = 0; k < N0; k++) {
        real[p * N0 + k] = r0[k];
        imag[p * N0 + k] = i0[k];
      }
    }
    return {
      real,
      imag,
      shape: [M],
      metadata: {
        ...input.metadata,
        domain: 'frequency',
        extra: { ...input.metadata.extra, isDFS: true, basePeriod: N0, periods }
      }
    };
  }
};
