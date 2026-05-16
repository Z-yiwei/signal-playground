/** Signal-domain entrypoint: registers every plugin belonging to this domain. */
import {
  sourceRegistry,
  transformRegistry,
  windowRegistry,
  presetRegistry
} from '@/core/registry';

// Sources
import { SineSource } from './sources/SineSource';
import {
  SquareSource,
  TriangleSource,
  SawtoothSource,
  GaussianPulseSource,
  NoiseSource,
  ChirpSource
} from './sources/BasicSources';
import { FormulaSource } from './sources/FormulaSource';

// Transforms
import { DFT } from './transforms/DFT';
import { DCT } from './transforms/DCT';
import { STFT } from './transforms/STFT';
import { DTFT } from './transforms/DTFT';
import { CTFT } from './transforms/CTFT';
import { CTFS } from './transforms/CTFS';
import { DFS } from './transforms/DFS';
import { DST } from './transforms/DST';
import { HilbertTransform } from './transforms/HilbertTransform';
import { ZTransform } from './transforms/ZTransform';
import { LaplaceTransform } from './transforms/LaplaceTransform';

// Windows
import { Rectangular, Hann, Hamming, Blackman } from './windows/Windows';

// Presets
import { ALL_PRESETS } from './presets';

export function registerSignalDomain(): void {
  // sources
  [
    SineSource,
    SquareSource,
    TriangleSource,
    SawtoothSource,
    GaussianPulseSource,
    NoiseSource,
    ChirpSource,
    FormulaSource
  ].forEach((s) => sourceRegistry.register(s));

  // transforms
  [
    DFT, DTFT, DFS, DCT, DST,                  // discrete
    CTFT, CTFS,                                 // continuous
    STFT,                                       // time-frequency
    HilbertTransform,                           // analytic
    ZTransform, LaplaceTransform                // complex-plane
  ].forEach((t) => transformRegistry.register(t));

  // windows
  [Rectangular, Hann, Hamming, Blackman].forEach((w) => windowRegistry.register(w));

  // presets
  ALL_PRESETS.forEach((p) => presetRegistry.register(p));
}
