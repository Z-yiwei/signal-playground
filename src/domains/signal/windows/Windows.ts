/** Window function set used to reduce FFT spectral leakage. */
import type { IWindow } from '@/core/types';

export const Rectangular: IWindow = {
  id: 'rect',
  name: 'Rectangular (None)',
  generate(N: number) {
    const out = new Float32Array(N);
    out.fill(1);
    return out;
  }
};

export const Hann: IWindow = {
  id: 'hann',
  name: 'Hann',
  generate(N: number) {
    const out = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      out[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (N - 1)));
    }
    return out;
  }
};

export const Hamming: IWindow = {
  id: 'hamming',
  name: 'Hamming',
  generate(N: number) {
    const out = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      out[i] = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (N - 1));
    }
    return out;
  }
};

export const Blackman: IWindow = {
  id: 'blackman',
  name: 'Blackman',
  generate(N: number) {
    const out = new Float32Array(N);
    const a0 = 0.42, a1 = 0.5, a2 = 0.08;
    for (let i = 0; i < N; i++) {
      const x = (2 * Math.PI * i) / (N - 1);
      out[i] = a0 - a1 * Math.cos(x) + a2 * Math.cos(2 * x);
    }
    return out;
  }
};
