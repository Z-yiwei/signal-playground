/** Continuous-Time Fourier Transform via trapezoidal numerical integration. */
import type { ITransform, DataBuffer, ComplexBuffer } from '@/core/types';

export const CTFT: ITransform = {
  id: 'ctft',
  name: 'CTFT (Numerical)',
  shortName: 'CTFT',
  description: 'Continuous -> continuous: trapezoidal numerical integration over omega',
  category: 'fourier-continuous',
  inputDomain: 'time',
  outputDomain: 'frequency',
  supportedDimensions: [1],
  compatibleSignalKinds: ['continuous'],
  isComplexOutput: true,
  latexFormula: 'X(j\\omega) = \\int_{-\\infty}^{\\infty} x(t)\\, e^{-j\\omega t}\\, dt',
  teachingHints: {
    inputRequirement: 'Continuous signal x(t) with finite energy',
    outputSemantics: 'Complex spectrum X(j*omega); magnitude |X(j*omega)| and phase angle X(j*omega)',
    commonPitfalls: 'Truncated duration introduces Gibbs ripples; dense sampling approximates continuity',
    relatedTransforms: ['DTFT', 'CTFS', 'Laplace']
  },
  params: [
    {
      name: 'fmax',
      type: 'number',
      default: 100,
      min: 10,
      max: 1000,
      step: 10,
      label: 'Max Frequency',
      unit: 'Hz',
      description: 'Upper limit of frequency sweep'
    },
    {
      name: 'numFreqs',
      type: 'number',
      default: 512,
      min: 128,
      max: 2048,
      step: 128,
      label: 'Frequency Points'
    }
  ],

  async forward(input: DataBuffer, params): Promise<ComplexBuffer> {
    const x = input.data;
    const N = x.length;
    const fs = input.metadata.sampleRate ?? 1;
    const dt = 1 / fs;
    const fmax = Number(params?.fmax ?? 100);
    const M = Number(params?.numFreqs ?? 512);

    const real = new Float32Array(M);
    const imag = new Float32Array(M);

    // Sweep omega from -2*pi*fmax to +2*pi*fmax.
    for (let m = 0; m < M; m++) {
      const f = -fmax + (2 * fmax * m) / (M - 1);
      const omega = 2 * Math.PI * f;
      let re = 0, im = 0;
      // Trapezoidal rule: half-weight on endpoints.
      for (let n = 0; n < N; n++) {
        const t = n * dt;
        const w = (n === 0 || n === N - 1) ? 0.5 : 1.0;
        const phi = -omega * t;
        re += w * x[n] * Math.cos(phi);
        im += w * x[n] * Math.sin(phi);
      }
      real[m] = re * dt;
      imag[m] = im * dt;
    }

    return {
      real,
      imag,
      shape: [M],
      metadata: {
        ...input.metadata,
        domain: 'frequency',
        extra: { ...input.metadata.extra, freqRange: [-fmax, fmax], isCTFT: true }
      }
    };
  }
};
