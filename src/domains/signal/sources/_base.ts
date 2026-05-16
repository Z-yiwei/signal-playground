/**
 * Shared parameter schema and grid builders for 1D signal sources.
 * In continuous mode N = sampleRate * duration; in discrete mode the user picks N directly.
 */
import type { ParamSchema } from '@/core/types';

export const baseSignalParams: ParamSchema[] = [
  {
    name: 'sampleRate',
    type: 'number',
    default: 1000,
    min: 50,
    max: 8000,
    step: 50,
    label: 'Sample Rate',
    unit: 'Hz',
    description: 'Sample rate fs'
  },
  {
    name: 'duration',
    type: 'number',
    default: 1,
    min: 0.1,
    max: 4,
    step: 0.1,
    label: 'Duration',
    unit: 's',
    description: 'Signal duration (continuous mode)'
  },
  {
    name: 'numSamples',
    type: 'number',
    default: 64,
    min: 4,
    max: 1024,
    step: 1,
    label: 'Num Samples',
    unit: 'pts',
    description: 'Sequence length N (discrete mode)'
  }
];

/** Continuous mode: time grid driven by sampleRate * duration. */
export function buildTimeSignal(
  sampleRate: number,
  duration: number,
  fn: (t: number, i: number) => number
): { data: Float32Array; N: number } {
  const N = Math.max(2, Math.round(sampleRate * duration));
  const data = new Float32Array(N);
  const dt = 1 / sampleRate;
  for (let i = 0; i < N; i++) data[i] = fn(i * dt, i);
  return { data, N };
}

/** Discrete mode: integer-index grid of length numSamples. */
export function buildDiscreteSignal(
  numSamples: number,
  fn: (n: number, i: number) => number
): { data: Float32Array; N: number } {
  const N = Math.max(2, Math.round(numSamples));
  const data = new Float32Array(N);
  for (let i = 0; i < N; i++) data[i] = fn(i, i);
  return { data, N };
}
