/** Short-Time Fourier Transform: sliding-window FFT producing a spectrogram (numFrames x numBins). */
import type { ITransform, DataBuffer } from '@/core/types';
import { fft1D } from '@/domains/shared/fftCore';
import { Hann } from '@/domains/signal/windows/Windows';

export const STFT: ITransform = {
  id: 'stft',
  name: 'Short-Time Fourier Transform',
  shortName: 'STFT',
  description: 'Sliding-window FFT producing a spectrogram',
  category: 'time-frequency',
  inputDomain: 'time',
  outputDomain: 'spectral',
  supportedDimensions: [1],
  compatibleSignalKinds: ['discrete', 'continuous'],
  isComplexOutput: false,
  latexFormula: 'X(m,k) = \\sum_{n=0}^{L-1} x[n+mH]\\,w[n]\\,e^{-j 2\\pi k n / L}',
  teachingHints: {
    inputRequirement: 'Sequence at least one frame long',
    outputSemantics: 'Time-frequency representation; x = time, y = frequency, color = magnitude (dB)',
    commonPitfalls: 'Frame length vs frequency resolution trade-off; smaller hop -> smoother but slower',
    relatedTransforms: ['DFT', 'Wavelet']
  },
  params: [
    { name: 'frameSize', type: 'number', default: 256, min: 64, max: 1024, step: 64,  label: 'Frame Size' },
    { name: 'hopSize',   type: 'number', default: 128, min: 16, max: 512,  step: 16,  label: 'Hop Size' }
  ],

  async forward(input: DataBuffer, params): Promise<DataBuffer> {
    const x = input.data;
    const N = x.length;
    const frameSize = Math.min(Number(params?.frameSize ?? 256), N);
    const hop = Number(params?.hopSize ?? 128);
    const win = Hann.generate(frameSize);

    const numFrames = Math.max(1, Math.floor((N - frameSize) / hop) + 1);
    const numBins = Math.floor(frameSize / 2) + 1;
    const out = new Float32Array(numFrames * numBins);

    const buf = new Float32Array(frameSize);
    for (let f = 0; f < numFrames; f++) {
      const start = f * hop;
      for (let i = 0; i < frameSize; i++) {
        buf[i] = (start + i < N ? x[start + i] : 0) * win[i];
      }
      const { real, imag, N: NF } = fft1D(buf);
      const ratio = NF / frameSize;
      for (let k = 0; k < numBins; k++) {
        const idx = Math.floor(k * ratio);
        const mag = Math.hypot(real[idx], imag[idx]);
        out[f * numBins + k] = 20 * Math.log10(Math.max(mag, 1e-10));
      }
    }

    return {
      data: out,
      shape: [numFrames, numBins],
      dtype: 'float32',
      metadata: {
        ...input.metadata,
        domain: 'spectral',
        extra: { frameSize, hop, numFrames, numBins }
      }
    };
  }
};
