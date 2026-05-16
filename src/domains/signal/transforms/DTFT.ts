/** Discrete-Time Fourier Transform (densely sampled on omega in [-pi, pi]). */
import type { ITransform, DataBuffer, ComplexBuffer } from '@/core/types';

export const DTFT: ITransform = {
  id: 'dtft',
  name: 'DTFT (Dense Sampling)',
  shortName: 'DTFT',
  description: 'Discrete -> continuous: dense sampling on omega in [-pi, pi]',
  category: 'fourier-discrete',
  inputDomain: 'time',
  outputDomain: 'frequency',
  supportedDimensions: [1],
  compatibleSignalKinds: ['discrete'],
  isComplexOutput: true,
  latexFormula: 'X(e^{j\\omega}) = \\sum_{n=-\\infty}^{\\infty} x[n]\\, e^{-j\\omega n}',
  teachingHints: {
    inputRequirement: 'Absolutely summable discrete sequence x[n]',
    outputSemantics: 'Omega is continuous; spectrum is 2*pi-periodic; rendered on [-pi, pi]',
    commonPitfalls: 'DFT is DTFT sampled at omega_k = 2*pi*k/N; more DFT points -> closer to DTFT',
    relatedTransforms: ['DFT', 'DFS', 'CTFT']
  },
  params: [
    {
      name: 'numFreqs',
      type: 'number',
      default: 1024,
      min: 256,
      max: 4096,
      step: 256,
      label: 'Frequency Resolution',
      description: 'Number of points on omega axis (more = closer to true continuous DTFT)'
    }
  ],

  async forward(input: DataBuffer, params): Promise<ComplexBuffer> {
    const x = input.data;
    const N = x.length;
    const M = Number(params?.numFreqs ?? 1024);

    const real = new Float32Array(M);
    const imag = new Float32Array(M);

    // Sweep omega from -pi to pi.
    for (let m = 0; m < M; m++) {
      const omega = -Math.PI + (2 * Math.PI * m) / (M - 1);
      let re = 0, im = 0;
      for (let n = 0; n < N; n++) {
        const phi = -omega * n;
        re += x[n] * Math.cos(phi);
        im += x[n] * Math.sin(phi);
      }
      real[m] = re;
      imag[m] = im;
    }

    return {
      real,
      imag,
      shape: [M],
      metadata: {
        ...input.metadata,
        domain: 'frequency',
        extra: { ...input.metadata.extra, omegaRange: [-Math.PI, Math.PI], isDTFT: true }
      }
    };
  }
};
