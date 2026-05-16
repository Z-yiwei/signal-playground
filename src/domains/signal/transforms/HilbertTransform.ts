/**
 * Hilbert transform via FFT.
 * Steps: FFT -> keep positive frequencies (x2) and zero negatives -> IFFT.
 * Output: real part = x(t); imag part = Hilbert transform; magnitude = envelope.
 */
import type { ITransform, DataBuffer, ComplexBuffer } from '@/core/types';
import { fft1D, ifft1D } from '@/domains/shared/fftCore';

export const HilbertTransform: ITransform = {
  id: 'hilbert',
  name: 'Hilbert Transform',
  shortName: 'Hilbert',
  description: 'Produces the analytic signal; magnitude = envelope, phase = instantaneous phase',
  category: 'analytic',
  inputDomain: 'time',
  outputDomain: 'time',
  supportedDimensions: [1],
  compatibleSignalKinds: ['discrete', 'continuous'],
  isComplexOutput: true,
  latexFormula: '\\hat{x}(t) = \\frac{1}{\\pi}\\,\\text{p.v.}\\!\\int \\frac{x(\\tau)}{t-\\tau}\\, d\\tau',
  teachingHints: {
    inputRequirement: 'Real-valued signal',
    outputSemantics: 'Complex signal x_a(t) = x(t) + j*x_hat(t); |x_a| is envelope, arg(x_a) is instantaneous phase',
    commonPitfalls: 'The Hilbert filter is a 90-degree phase shifter; edge effects are noticeable',
    relatedTransforms: ['DFT', 'CTFT']
  },
  params: [],

  async forward(input: DataBuffer): Promise<ComplexBuffer> {
    const x = input.data;
    const { real, imag, N } = fft1D(x);

    // Build the one-sided multiplier H[k].
    const half = Math.floor(N / 2);
    const newReal = new Float32Array(N);
    const newImag = new Float32Array(N);

    // k=0 and k=N/2 are kept as is.
    newReal[0] = real[0];
    newImag[0] = imag[0];
    if (N % 2 === 0) {
      newReal[half] = real[half];
      newImag[half] = imag[half];
    }
    // 0 < k < N/2: multiply by 2.
    for (let k = 1; k < half; k++) {
      newReal[k] = 2 * real[k];
      newImag[k] = 2 * imag[k];
    }
    // N/2 < k < N: zeroed (already zero).

    const xaReal = ifft1D(newReal, newImag);
    // Multiply spectrum by -j to recover the imaginary part of the analytic signal.
    const tempReal = new Float32Array(N);
    const tempImag = new Float32Array(N);
    for (let k = 0; k < N; k++) {
      tempReal[k] = newImag[k];
      tempImag[k] = -newReal[k];
    }
    const xaImag = ifft1D(tempReal, tempImag);

    return {
      real: xaReal,
      imag: xaImag,
      shape: [N],
      metadata: {
        ...input.metadata,
        domain: 'time',
        extra: { ...input.metadata.extra, isHilbert: true }
      }
    };
  }
};
