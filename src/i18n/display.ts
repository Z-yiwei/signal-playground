/**
 * Display-name adapters for registry items.
 * IDataSource / ITransform / IWindow / IPreset all carry an `id`, so we look up
 * translations under `<area>.<id>.<field>` keys. If a translation is missing,
 * we fall back to the object's own `name` / `description`. Param schemas use
 * a shared lookup table so common parameter names need only one translation.
 */
import { t } from './index';
import type {
  IDataSource,
  ITransform,
  IWindow,
  IPreset,
  ParamSchema
} from '@/core/types';

// Look up a key, fall back to the original string if missing.
function tryT(key: string, fallback: string): string {
  const out = t(key);
  return out === key ? fallback : out;
}

// ---------- Source ----------
export function sourceName(s: IDataSource): string {
  return tryT(`source.${s.id}.name`, s.name);
}
export function sourceDescription(s: IDataSource): string {
  return tryT(`source.${s.id}.desc`, s.description ?? '');
}

// ---------- Transform ----------
export function transformName(tr: ITransform): string {
  return tryT(`transform.${tr.id}.name`, tr.name);
}
export function transformDescription(tr: ITransform): string {
  return tryT(`transform.${tr.id}.desc`, tr.description ?? '');
}
export function transformInputReq(tr: ITransform): string {
  return tryT(`transform.${tr.id}.input`, tr.teachingHints?.inputRequirement ?? '');
}
export function transformOutputSem(tr: ITransform): string {
  return tryT(`transform.${tr.id}.output`, tr.teachingHints?.outputSemantics ?? '');
}
export function transformPitfall(tr: ITransform): string {
  return tryT(`transform.${tr.id}.pitfall`, tr.teachingHints?.commonPitfalls ?? '');
}
export function transformGroupLabel(category: string): string {
  return tryT(`group.${category}`, category);
}

// ---------- Window ----------
export function windowName(w: IWindow): string {
  return tryT(`window.${w.id}`, w.name);
}

// ---------- Preset ----------
const presetIdToKey: Record<string, string> = {
  'aliasing': 'preset.aliasing',
  'beating': 'preset.beating',
  'fourier-series': 'preset.fourierSeries',
  'chirp-spectrogram': 'preset.chirpSpec',
  'dct-compaction': 'preset.dctCompaction',
  'dtft-vs-dft': 'preset.dtftVsDft',
  'formula-sin': 'preset.formulaSin',
  'formula-gaussian': 'preset.formulaGauss',
  'hilbert-envelope': 'preset.hilbert',
  'z-surface': 'preset.zSurface'
};
export function presetName(p: IPreset): string {
  const base = presetIdToKey[p.id];
  return base ? tryT(`${base}.name`, p.name) : p.name;
}
export function presetDescription(p: IPreset): string {
  const base = presetIdToKey[p.id];
  return base ? tryT(`${base}.desc`, p.description) : p.description;
}

// ---------- ParamSchema ----------
const paramLabelKeys: Record<string, string> = {
  freq: 'param.freq',
  amp: 'param.amp',
  phase: 'param.phase',
  center: 'param.center',
  sigma: 'param.sigma',
  f0: 'param.f0',
  f1: 'param.f1',
  sampleRate: 'param.sampleRate',
  duration: 'param.duration',
  numSamples: 'param.numSamples',
  kind: 'param.kind',
  latex: 'param.latex',
  fmax: 'param.fmax',
  numFreqs: 'param.numFreqs',
  period: 'param.period',
  numHarmonics: 'param.harmonics',
  normalize: 'param.normalize',
  periodsToShow: 'param.periodsToShow',
  frameSize: 'param.frameSize',
  hopSize: 'param.hopSize',
  sigmaRange: 'param.sigmaRange',
  omegaRange: 'param.omegaRange',
  gridSize: 'param.gridSize',
  rMax: 'param.rMax'
};
const paramDescKeys: Record<string, string> = {
  numHarmonics: 'param.harmonics.desc',
  normalize: 'param.normalize.desc',
  periodsToShow: 'param.periodsToShow.desc',
  sigmaRange: 'param.sigmaRange.desc',
  gridSize: 'param.gridSize.desc',
  fmax: 'param.fmax.desc',
  sampleRate: 'param.sampleRate.tip',
  duration: 'param.duration.tip',
  numSamples: 'param.numSamples.tip'
};

/** Resolve the display label for a param: prefer i18n, otherwise the schema label. */
export function paramLabel(schema: ParamSchema, contextId?: string): string {
  // Disambiguate: numFreqs has a different meaning under DTFT.
  if (contextId === 'dtft' && schema.name === 'numFreqs') {
    return tryT('param.numFreqs.dtft', schema.label);
  }
  const key = paramLabelKeys[schema.name];
  return key ? tryT(key, schema.label) : schema.label;
}

export function paramDescription(schema: ParamSchema, contextId?: string): string {
  const fallback = schema.description ?? '';
  if (contextId === 'dtft' && schema.name === 'numFreqs') {
    return tryT('param.numFreqs.dtft.desc', fallback);
  }
  const key = paramDescKeys[schema.name];
  return key ? tryT(key, fallback) : fallback;
}

/** Translate an enum option label using `param.<name>.<value>`, with a fallback. */
export function paramOptionLabel(paramName: string, value: string, fallback: string): string {
  return tryT(`param.${paramName}.${value}`, fallback);
}
