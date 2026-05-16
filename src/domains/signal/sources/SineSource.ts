/**
 * Sine wave source for both continuous and discrete modes.
 * Continuous: N = sampleRate * duration, x(t) = A * sin(2*pi*f*t + phi)
 * Discrete:   N = numSamples,             x[n] = A * sin(2*pi*f*n/fs + phi)
 */
import type { IDataSource, DataBuffer, ParamValues } from '@/core/types';
import { baseSignalParams, buildTimeSignal, buildDiscreteSignal } from './_base';

export const SineSource: IDataSource = {
  id: 'sine',
  name: 'Sine Wave',
  domain: 'signal',
  signalKind: 'both',
  latex: 'A\\sin(2\\pi f t + \\varphi)',
  description: 'A·sin(2π·f·t + φ)',
  params: [
    { name: 'freq',  type: 'number', default: 5,   min: 0.5, max: 500, step: 0.5, label: 'Frequency',  unit: 'Hz' },
    { name: 'amp',   type: 'number', default: 1,   min: 0,   max: 5,   step: 0.05, label: 'Amplitude' },
    { name: 'phase', type: 'number', default: 0,   min: -180, max: 180, step: 1,   label: 'Phase',     unit: '°' },
    ...baseSignalParams
  ],
  async generate(p: ParamValues): Promise<DataBuffer> {
    const freq = Number(p.freq);
    const amp = Number(p.amp);
    const phaseRad = (Number(p.phase) * Math.PI) / 180;
    const fs = Number(p.sampleRate ?? 1000);
    const isDiscrete = p.__signalKind === 'discrete';

    if (isDiscrete) {
      const Ns = Math.max(2, Math.round(Number(p.numSamples ?? 64)));
      const { data, N } = buildDiscreteSignal(Ns, (n) =>
        amp * Math.sin(2 * Math.PI * freq * n / fs + phaseRad)
      );
      return {
        data,
        shape: [N],
        dtype: 'float32',
        metadata: { sampleRate: fs, domain: 'time', units: 'a.u.' }
      };
    }
    const dur = Number(p.duration ?? 1);
    const { data, N } = buildTimeSignal(fs, dur, (t) =>
      amp * Math.sin(2 * Math.PI * freq * t + phaseRad)
    );
    return {
      data,
      shape: [N],
      dtype: 'float32',
      metadata: { sampleRate: fs, domain: 'time', units: 'a.u.' }
    };
  }
};
