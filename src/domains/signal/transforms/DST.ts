/** DST-I: discrete sine transform for odd-symmetric extension. */
import type { ITransform, DataBuffer } from '@/core/types';

export const DST: ITransform = {
  id: 'dst',
  name: 'DST-I',
  shortName: 'DST',
  description: 'Discrete sine transform; suited for odd-symmetric extension',
  category: 'cosine-sine',
  inputDomain: 'time',
  outputDomain: 'frequency',
  supportedDimensions: [1],
  compatibleSignalKinds: ['discrete', 'continuous'],
  isComplexOutput: false,
  latexFormula: 'X[k] = \\sum_{n=0}^{N-1} x[n]\\sin\\!\\left[\\frac{\\pi (n+1)(k+1)}{N+1}\\right]',
  teachingHints: {
    inputRequirement: 'Real sequence; endpoints treated as zero',
    outputSemantics: 'Real coefficients; complementary to DCT, captures odd-symmetric content',
    commonPitfalls: 'DST-I/II/III/IV differ in boundary conditions',
    relatedTransforms: ['DCT', 'DFT']
  },
  params: [],

  async forward(input: DataBuffer): Promise<DataBuffer> {
    const x = input.data;
    const N = x.length;
    const out = new Float32Array(N);
    const piOverNp1 = Math.PI / (N + 1);
    for (let k = 0; k < N; k++) {
      let s = 0;
      for (let n = 0; n < N; n++) {
        s += x[n] * Math.sin((n + 1) * (k + 1) * piOverNp1);
      }
      out[k] = s;
    }
    return {
      data: out,
      shape: [N],
      dtype: 'float32',
      metadata: { ...input.metadata, domain: 'frequency' }
    };
  }
};
