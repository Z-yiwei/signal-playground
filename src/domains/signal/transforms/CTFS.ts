/** Continuous-Time Fourier Series (decomposes a periodic signal into harmonic coefficients). */
import type { ITransform, DataBuffer, ComplexBuffer } from '@/core/types';

export const CTFS: ITransform = {
  id: 'ctfs',
  name: 'CTFS (Fourier Series)',
  shortName: 'CTFS',
  description: 'Fourier-series expansion of a periodic continuous signal -> discrete harmonic coefficients',
  category: 'fourier-continuous',
  inputDomain: 'time',
  outputDomain: 'frequency',
  supportedDimensions: [1],
  compatibleSignalKinds: ['continuous'],
  isComplexOutput: true,
  latexFormula: 'c_k = \\frac{1}{T}\\!\\int_{0}^{T} x(t)\\, e^{-jk\\omega_0 t}\\, dt,\\quad \\omega_0 = \\frac{2\\pi}{T}',
  teachingHints: {
    inputRequirement: 'Periodic signal; user must specify the period T',
    outputSemantics: 'Discrete harmonic amplitudes (line spectrum at +/- k * omega_0)',
    commonPitfalls: 'Wrong period T causes coefficient leakage - the key distinction from CTFT',
    relatedTransforms: ['CTFT', 'DFS']
  },
  params: [
    {
      name: 'period',
      type: 'number',
      default: 0.2,
      min: 0.01,
      max: 4,
      step: 0.01,
      label: 'Period T',
      unit: 's'
    },
    {
      name: 'numHarmonics',
      type: 'number',
      default: 20,
      min: 1,
      max: 100,
      step: 1,
      label: 'Harmonics K',
      description: 'Keep +/- K harmonics'
    }
  ],

  async forward(input: DataBuffer, params): Promise<ComplexBuffer> {
    const x = input.data;
    const N = x.length;
    const fs = input.metadata.sampleRate ?? 1;
    const dt = 1 / fs;
    const T = Number(params?.period ?? 0.2);
    const K = Math.round(Number(params?.numHarmonics ?? 20));
    const omega0 = (2 * Math.PI) / T;

    // Integrate over one period (clamped to the available samples).
    const NT = Math.min(N, Math.max(2, Math.round(T * fs)));
    const M = 2 * K + 1;
    const real = new Float32Array(M);
    const imag = new Float32Array(M);

    for (let i = 0; i < M; i++) {
      const k = i - K;
      let re = 0, im = 0;
      for (let n = 0; n < NT; n++) {
        const t = n * dt;
        const w = (n === 0 || n === NT - 1) ? 0.5 : 1.0;
        const phi = -k * omega0 * t;
        re += w * x[n] * Math.cos(phi);
        im += w * x[n] * Math.sin(phi);
      }
      real[i] = (re * dt) / T;
      imag[i] = (im * dt) / T;
    }

    return {
      real,
      imag,
      shape: [M],
      metadata: {
        ...input.metadata,
        domain: 'frequency',
        extra: {
          ...input.metadata.extra,
          isCTFS: true,
          K,
          omega0,
          period: T
        }
      }
    };
  }
};
