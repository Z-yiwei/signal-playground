/**
 * Laplace transform surface: X(s) = integral_{0..inf} x(t) * exp(-s*t) dt, s = sigma + j*omega.
 * Computes |X(s)| as a 2D magnitude surface on a grid in the s-plane.
 */
import type { ITransform, DataBuffer } from '@/core/types';

export const LaplaceTransform: ITransform = {
  id: 'laplace',
  name: 'Laplace Transform Surface',
  shortName: 'Laplace',
  description: '|X(s)| computed over the s-plane grid; the j*omega axis equals CTFT',
  category: 'complex-plane',
  inputDomain: 'time',
  outputDomain: 's-plane',
  supportedDimensions: [1],
  compatibleSignalKinds: ['continuous'],
  isComplexOutput: false,
  latexFormula: 'X(s) = \\int_{0}^{\\infty} x(t)\\, e^{-st}\\, dt,\\quad s = \\sigma + j\\omega',
  teachingHints: {
    inputRequirement: 'Causal continuous signal x(t), t >= 0',
    outputSemantics: '2D magnitude surface in the s-plane; slice at sigma=0 (j*omega axis) equals CTFT',
    commonPitfalls: 'sigma must lie inside the region of convergence (ROC)',
    relatedTransforms: ['CTFT', 'Z-Transform']
  },
  params: [
    {
      name: 'sigmaRange',
      type: 'number',
      default: 5,
      min: 1,
      max: 20,
      step: 0.5,
      label: 'Sigma Range',
      description: 'Real-axis sweep range [-sigma, sigma]'
    },
    {
      name: 'omegaRange',
      type: 'number',
      default: 100,
      min: 10,
      max: 500,
      step: 10,
      label: 'Omega Range',
      unit: 'rad/s'
    },
    {
      name: 'gridSize',
      type: 'number',
      default: 80,
      min: 40,
      max: 160,
      step: 20,
      label: 'Grid Size'
    }
  ],

  async forward(input: DataBuffer, params): Promise<DataBuffer> {
    const x = input.data;
    const N = x.length;
    const fs = input.metadata.sampleRate ?? 1;
    const dt = 1 / fs;

    const sigmaR = Number(params?.sigmaRange ?? 5);
    const omegaR = Number(params?.omegaRange ?? 100);
    const G = Math.round(Number(params?.gridSize ?? 80));

    const out = new Float32Array(G * G);

    for (let i = 0; i < G; i++) {
      const omega = -omegaR + (2 * omegaR * i) / (G - 1);
      for (let j = 0; j < G; j++) {
        const sigma = -sigmaR + (2 * sigmaR * j) / (G - 1);
        let re = 0, im = 0;
        for (let n = 0; n < N; n++) {
          const t = n * dt;
          const decay = Math.exp(-sigma * t);
          const w = (n === 0 || n === N - 1) ? 0.5 : 1.0;
          re += w * x[n] * decay * Math.cos(-omega * t);
          im += w * x[n] * decay * Math.sin(-omega * t);
        }
        const mag = Math.hypot(re * dt, im * dt);
        out[i * G + j] = 20 * Math.log10(Math.max(mag, 1e-10));
      }
    }

    return {
      data: out,
      shape: [G, G],
      dtype: 'float32',
      metadata: {
        ...input.metadata,
        domain: 's-plane',
        extra: {
          ...input.metadata.extra,
          sigmaRange: sigmaR,
          omegaRange: omegaR,
          gridSize: G,
          xLabel: 'sigma (real)',
          yLabel: 'omega (imag)'
        }
      }
    };
  }
};
