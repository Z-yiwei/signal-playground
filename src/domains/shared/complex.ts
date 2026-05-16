/** Complex-number utilities (magnitude, phase, dB conversion). */

export function complexMagnitude(real: ArrayLike<number>, imag: ArrayLike<number>): Float32Array {
  const N = real.length;
  const out = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    out[i] = Math.hypot(real[i], imag[i]);
  }
  return out;
}

export function complexPhase(real: ArrayLike<number>, imag: ArrayLike<number>): Float32Array {
  const N = real.length;
  const out = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    out[i] = Math.atan2(imag[i], real[i]);
  }
  return out;
}

/** Convert linear magnitudes to dB relative to `ref`, clamped at `floor`. */
export function toDecibels(magnitude: ArrayLike<number>, ref = 1, floor = -120): Float32Array {
  const N = magnitude.length;
  const out = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const v = 20 * Math.log10(Math.max(magnitude[i] / ref, 1e-12));
    out[i] = Math.max(v, floor);
  }
  return out;
}
