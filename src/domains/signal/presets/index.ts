/** Teaching presets: one-click classroom scenarios for DSP learning. */
import type { IPreset } from '@/core/types';

export const AliasingPreset: IPreset = {
  id: 'aliasing',
  name: '🌀 Aliasing Demo',
  description: '60 Hz signal sampled at 80 Hz -> spectrum folds back to 20 Hz (aliasing)',
  domain: 'signal',
  apply: () => ({
    sourceId: 'sine',
    sourceParams: { freq: 60, amp: 1, phase: 0, sampleRate: 80, duration: 1 },
    transformId: 'dft',
    transformParams: {},
    windowId: 'rect'
  })
};

export const BeatingPreset: IPreset = {
  id: 'beating',
  name: '🥁 Beat Frequency',
  description: '50 Hz + 53 Hz superposition -> 3 Hz beat envelope appears',
  domain: 'signal',
  apply: () => ({
    sourceId: 'sine',
    sourceParams: { freq: 50, amp: 1, phase: 0, sampleRate: 1000, duration: 2 },
    transformId: 'dft',
    transformParams: {},
    windowId: 'hann',
    extraComponents: [
      { sourceId: 'sine', params: { freq: 53, amp: 1, phase: 0, sampleRate: 1000, duration: 2 } }
    ]
  })
};

export const FourierSeriesPreset: IPreset = {
  id: 'fourier-series',
  name: '🎵 Square Wave Spectrum',
  description: 'Odd harmonics (1/3/5/7...) of a square wave at a glance',
  domain: 'signal',
  apply: () => ({
    sourceId: 'square',
    sourceParams: { freq: 10, amp: 1, sampleRate: 2000, duration: 1 },
    transformId: 'dft',
    transformParams: {},
    windowId: 'hann'
  })
};

export const ChirpSpectrogramPreset: IPreset = {
  id: 'chirp-spectrogram',
  name: '🚀 Chirp Spectrogram',
  description: 'Chirp spectrogram - frequency increasing linearly with time',
  domain: 'signal',
  apply: () => ({
    sourceId: 'chirp',
    sourceParams: { f0: 5, f1: 200, amp: 1, sampleRate: 1000, duration: 2 },
    transformId: 'stft',
    transformParams: { frameSize: 256, hopSize: 64 },
    windowId: 'rect'
  })
};

export const DCTCompactionPreset: IPreset = {
  id: 'dct-compaction',
  name: '📦 DCT Energy Compaction',
  description: 'Compare DCT vs DFT - DCT concentrates energy in low frequencies, just like JPEG',
  domain: 'signal',
  apply: () => ({
    sourceId: 'sine',
    sourceParams: { freq: 5, amp: 1, phase: 0, sampleRate: 256, duration: 1 },
    transformId: 'dct',
    transformParams: { normalize: true },
    windowId: 'rect'
  })
};

export const DTFTvsDFTPreset: IPreset = {
  id: 'dtft-vs-dft',
  name: '🔍 DTFT vs DFT',
  description: 'DTFT is continuous, DFT is its N-point sampling - try switching',
  domain: 'signal',
  apply: () => ({
    sourceId: 'sine',
    sourceParams: { freq: 8, amp: 1, phase: 0, sampleRate: 64, duration: 1 },
    transformId: 'dtft',
    transformParams: { numFreqs: 1024 },
    windowId: 'rect',
    signalKind: 'discrete'
  })
};

export const FormulaSinusoidsPreset: IPreset = {
  id: 'formula-sin',
  name: '✏️ Formula: 2-tone',
  description: 'Two sinusoids written as LaTeX; verify the spectrum',
  domain: 'signal',
  apply: () => ({
    sourceId: 'formula',
    sourceParams: {
      latex: '\\sin(2\\pi \\cdot 5 t) + 0.5\\sin(2\\pi \\cdot 12 t)',
      kind: 'continuous',
      sampleRate: 1000,
      duration: 1
    },
    transformId: 'dft',
    transformParams: {},
    windowId: 'hann',
    signalKind: 'continuous'
  })
};

export const FormulaGaussianPreset: IPreset = {
  id: 'formula-gaussian',
  name: '✏️ Formula: Gaussian',
  description: 'Gaussian e^{-t^2/0.005} - verifies "Gaussian <-> Gaussian"',
  domain: 'signal',
  apply: () => ({
    sourceId: 'formula',
    sourceParams: {
      latex: 'e^{-t^2 / 0.005}',
      kind: 'continuous',
      sampleRate: 2000,
      duration: 1
    },
    transformId: 'ctft',
    transformParams: { fmax: 100, numFreqs: 512 },
    windowId: 'rect',
    signalKind: 'continuous'
  })
};

export const HilbertEnvelopePreset: IPreset = {
  id: 'hilbert-envelope',
  name: '📈 Hilbert Envelope',
  description: 'Instantaneous envelope of an AM signal - the classic Hilbert use case',
  domain: 'signal',
  apply: () => ({
    sourceId: 'formula',
    sourceParams: {
      latex: '(1 + 0.5\\cos(2\\pi \\cdot 3 t)) \\cos(2\\pi \\cdot 30 t)',
      kind: 'continuous',
      sampleRate: 1000,
      duration: 1
    },
    transformId: 'hilbert',
    transformParams: {},
    windowId: 'rect',
    signalKind: 'continuous'
  })
};

export const ZSurfacePreset: IPreset = {
  id: 'z-surface',
  name: '🌐 Z-Plane Surface',
  description: 'Visualise |X(z)|; the unit circle is DTFT magnitude',
  domain: 'signal',
  apply: () => ({
    sourceId: 'gaussian',
    sourceParams: { center: 0.0, sigma: 0.05, amp: 1, sampleRate: 32, duration: 1 },
    transformId: 'z-transform',
    transformParams: { rMax: 2, gridSize: 80 },
    windowId: 'rect',
    signalKind: 'discrete'
  })
};

export const ALL_PRESETS = [
  AliasingPreset,
  BeatingPreset,
  FourierSeriesPreset,
  ChirpSpectrogramPreset,
  DCTCompactionPreset,
  DTFTvsDFTPreset,
  FormulaSinusoidsPreset,
  FormulaGaussianPreset,
  HilbertEnvelopePreset,
  ZSurfacePreset
];
