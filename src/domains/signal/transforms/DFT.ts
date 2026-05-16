/** Discrete Fourier Transform (FFT-accelerated). */
import type { ITransform, DataBuffer, ComplexBuffer } from '@/core/types';
import { fft1D, ifft1D } from '@/domains/shared/fftCore';

export const DFT: ITransform = {
  id: 'dft',
  name: 'DFT (FFT)',
  shortName: 'DFT',
  description: 'Radix-2 Cooley-Tukey FFT with auto zero-pad; finite discrete sequence -> discrete bins',
  category: 'fourier-discrete',
  inputDomain: 'time',
  outputDomain: 'frequency',
  supportedDimensions: [1],
  compatibleSignalKinds: ['discrete', 'continuous'],
  isComplexOutput: true,
  latexFormula: 'X[k] = \\sum_{n=0}^{N-1} x[n]\\, e^{-j 2\\pi k n / N}, \\quad k = 0,\\dots,N-1',
  teachingHints: {
    inputRequirement: 'Discrete finite sequence x[n] of length N',
    outputSemantics: 'N discrete bins; bin k corresponds to frequency f_k = k * fs / N',
    commonPitfalls: 'DFT is the DTFT sampled on a uniform N-point grid; window choice changes energy distribution',
    relatedTransforms: ['DTFT', 'DFS', 'DCT']
  },
  params: [],

  async forward(input: DataBuffer): Promise<ComplexBuffer> {
    const { real, imag, N } = fft1D(input.data);
    return {
      real,
      imag,
      shape: [N],
      metadata: { ...input.metadata, domain: 'frequency' }
    };
  },

  async inverse(input: DataBuffer | ComplexBuffer): Promise<DataBuffer> {
    if (!('real' in input)) throw new Error('IFFT requires complex input');
    const data = ifft1D(input.real, input.imag);
    return {
      data,
      shape: [data.length],
      dtype: 'float32',
      metadata: { ...input.metadata, domain: 'time' }
    };
  }
};
