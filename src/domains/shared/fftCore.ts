/**
 * FFT core wrapper.
 * Built on fft.js (radix-2 Cooley-Tukey); inputs are zero-padded to the next
 * power of two. Currently exposes 1D real-input FFT.
 */

// fft.js ships without official .d.ts, so we import as any.
// @ts-ignore
import FFT from 'fft.js';

export interface FFTResult {
  real: Float32Array;
  imag: Float32Array;
  /** Actual transform length (next power of two). */
  N: number;
}

/** Smallest power of two >= n. */
export function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

/** 1D real-input FFT with automatic zero-padding. */
export function fft1D(input: ArrayLike<number>): FFTResult {
  const N = nextPow2(input.length);
  // @ts-ignore
  const f = new FFT(N);
  const padded = f.createComplexArray() as Float64Array;
  for (let i = 0; i < N; i++) {
    padded[2 * i] = i < input.length ? input[i] : 0;
    padded[2 * i + 1] = 0;
  }
  const out = f.createComplexArray() as Float64Array;
  f.transform(out, padded);

  const real = new Float32Array(N);
  const imag = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    real[i] = out[2 * i];
    imag[i] = out[2 * i + 1];
  }
  return { real, imag, N };
}

/** 1D inverse FFT (length must be a power of two). */
export function ifft1D(real: ArrayLike<number>, imag: ArrayLike<number>): Float32Array {
  const N = real.length;
  if ((N & (N - 1)) !== 0) {
    throw new Error('ifft1D requires power-of-2 length');
  }
  // @ts-ignore
  const f = new FFT(N);
  const input = f.createComplexArray() as Float64Array;
  for (let i = 0; i < N; i++) {
    input[2 * i] = real[i];
    input[2 * i + 1] = imag[i];
  }
  const out = f.createComplexArray() as Float64Array;
  f.inverseTransform(out, input);

  const result = new Float32Array(N);
  for (let i = 0; i < N; i++) result[i] = out[2 * i] / N;
  return result;
}

/** Build a frequency-axis array in Hz; one-sided returns [0, fs/2]. */
export function frequencyAxis(N: number, sampleRate: number, oneSided = true): Float32Array {
  const len = oneSided ? Math.floor(N / 2) + 1 : N;
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) out[i] = (i * sampleRate) / N;
  return out;
}
