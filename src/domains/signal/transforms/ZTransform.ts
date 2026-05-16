/**
 * Z-transform surface: X(z) = sum_n x[n] * z^{-n}, z = r * exp(j*omega).
 * Evaluated on a grid in the z-plane to render |X(z)| as a 2D surface.
 */
import type { ITransform, DataBuffer } from '@/core/types';

export const ZTransform: ITransform = {
  id: 'z-transform',
  name: 'Z-Transform Surface',
  shortName: 'Z',
  description: '|X(z)| computed over the z-plane grid; the unit circle equals DTFT',
  category: 'complex-plane',
  inputDomain: 'time',
  outputDomain: 'z-plane',
  supportedDimensions: [1],
  compatibleSignalKinds: ['discrete'],
  isComplexOutput: false,
  latexFormula: 'X(z) = \\sum_{n=0}^{N-1} x[n]\\, z^{-n},\\quad z = r e^{j\\omega}',
  teachingHints: {
    inputRequirement: 'Causal discrete sequence x[n]',
    outputSemantics: '2D magnitude surface in the z-plane; slice at r=1 (unit circle) equals DTFT',
    commonPitfalls: 'The region of convergence (ROC) determines stability and causality',
    relatedTransforms: ['DTFT', 'Laplace']
  },
  params: [
    {
      name: 'rMax',
      type: 'number',
      default: 2,
      min: 1.2,
      max: 4,
      step: 0.1,
      label: 'Radius Max'
    },
    {
      name: 'gridSize',
      type: 'number',
      default: 80,
      min: 40,
      max: 160,
      step: 20,
      label: 'Grid Size',
      description: '2D grid resolution on the z-plane'
    }
  ],

  async forward(input: DataBuffer, params): Promise<DataBuffer> {
    const x = input.data;
    const N = x.length;
    const rMax = Number(params?.rMax ?? 2);
    const G = Math.round(Number(params?.gridSize ?? 80));

    // Grid: real in [-rMax, rMax], imag in [-rMax, rMax].
    const out = new Float32Array(G * G);
    for (let i = 0; i < G; i++) {
      const im = -rMax + (2 * rMax * i) / (G - 1);
      for (let j = 0; j < G; j++) {
        const re = -rMax + (2 * rMax * j) / (G - 1);
        // Compute X(z) = sum_n x[n] * z^{-n} using polar form to keep things stable.
        const r = Math.hypot(re, im);
        if (r < 1e-6) {
          out[i * G + j] = NaN;
          continue;
        }
        const theta = Math.atan2(im, re);
        let xr = 0, xi = 0;
        for (let n = 0; n < N; n++) {
          const rn = Math.pow(r, -n);
          const ang = -n * theta;
          xr += x[n] * rn * Math.cos(ang);
          xi += x[n] * rn * Math.sin(ang);
        }
        const mag = Math.hypot(xr, xi);
        out[i * G + j] = 20 * Math.log10(Math.max(mag, 1e-6));
      }
    }

    return {
      data: out,
      shape: [G, G],
      dtype: 'float32',
      metadata: {
        ...input.metadata,
        domain: 'z-plane',
        extra: {
          ...input.metadata.extra,
          rMax,
          gridSize: G,
          xLabel: 'Re(z)',
          yLabel: 'Im(z)'
        }
      }
    };
  }
};
