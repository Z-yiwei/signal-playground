/**
 * Control panel: signal-kind switcher, source selector, optional formula input,
 * window/transform selectors and a transform-info card. All static text uses
 * t() and the panel is re-rendered on language change.
 */
import {
  sourceRegistry,
  transformRegistry,
  windowRegistry
} from '@/core/registry';
import { store } from '@/core/store';
import { ParameterForm } from './ParameterForm';
import { FormulaInput } from './FormulaInput';
import { TransformInfo } from './TransformInfo';
import type { ParamValues, SignalKind, IDataSource, ITransform } from '@/core/types';
import { i18n, t } from '@/i18n';
import {
  sourceName,
  transformName,
  transformGroupLabel,
  windowName
} from '@/i18n/display';

export class ControlPanel {
  private root: HTMLElement;
  private formulaInput: FormulaInput | null = null;
  private transformInfo: TransformInfo;
  private sourceForm: ParameterForm | null = null;
  private transformForm: ParameterForm | null = null;

  constructor(container: HTMLElement) {
    this.root = container;
    this.transformInfo = new TransformInfo();
    this.render();
    // Re-render the whole panel whenever the language changes.
    i18n.subscribe(() => this.render());
  }

  private render(): void {
    this.root.innerHTML = '';
    const cfg = store.getConfig();
    const kind = store.getSignalKind();

    // ===== Section: Signal Kind Switcher =====
    this.root.appendChild(this.section(t('panel.section.kind'), this.buildKindSwitcher(kind)));

    // ===== Section: Source =====
    this.root.appendChild(this.section(t('panel.section.source'), this.buildSourceSection(cfg.sourceId, cfg.sourceParams, kind)));

    // ===== Section: Formula (only for FormulaSource) =====
    if (cfg.sourceId === 'formula') {
      const formulaSec = document.createElement('div');
      formulaSec.className = 'panel-section';
      this.formulaInput = new FormulaInput();
      formulaSec.appendChild(this.formulaInput.element);
      this.root.appendChild(formulaSec);
    }

    // ===== Section: Window =====
    this.root.appendChild(this.section(t('panel.section.window'), this.buildWindowSection(cfg.windowId ?? 'rect')));

    // ===== Section: Transform =====
    this.root.appendChild(this.section(t('panel.section.transform'), this.buildTransformSection(cfg.transformId, cfg.transformParams, kind)));

    // ===== Section: Transform Info =====
    const infoSec = document.createElement('div');
    infoSec.className = 'panel-section panel-section-info';
    const infoTitle = document.createElement('h3');
    infoTitle.className = 'panel-section-title';
    infoTitle.textContent = t('panel.section.tfInfo');
    infoSec.appendChild(infoTitle);
    infoSec.appendChild(this.transformInfo.element);
    this.transformInfo.render(cfg.transformId);
    this.root.appendChild(infoSec);

    // ===== Section: Actions =====
    const actions = document.createElement('div');
    actions.className = 'panel-actions';
    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn btn-ghost';
    resetBtn.textContent = t('panel.btn.reset');
    resetBtn.addEventListener('click', () => {
      store.reset();
      this.render();
    });
    actions.appendChild(resetBtn);
    this.root.appendChild(actions);
  }

  private section(title: string, body: HTMLElement): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'panel-section';
    const h = document.createElement('h3');
    h.className = 'panel-section-title';
    h.textContent = title;
    wrap.appendChild(h);
    wrap.appendChild(body);
    return wrap;
  }

  private buildKindSwitcher(current: SignalKind): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'kind-switcher-wrap';

    const switcher = document.createElement('div');
    switcher.className = 'kind-switcher';

    const opts: Array<{ value: SignalKind; label: string; tip: string }> = [
      { value: 'continuous', label: t('panel.kind.continuous'), tip: t('panel.kind.continuous.tip') },
      { value: 'discrete',   label: t('panel.kind.discrete'),   tip: t('panel.kind.discrete.tip') }
    ];
    for (const o of opts) {
      const btn = document.createElement('button');
      btn.className = `kind-btn${current === o.value ? ' active' : ''}`;
      btn.textContent = o.label;
      btn.title = o.tip;
      btn.addEventListener('click', () => {
        store.setSignalKind(o.value);
        // Make sure default params for this mode exist.
        this.fillMissingSourceDefaults(o.value);
        // The current transform may be incompatible; pick the first compatible one.
        this.ensureTransformCompatible(o.value);
        this.render();
      });
      switcher.appendChild(btn);
    }
    wrap.appendChild(switcher);

    // Status note describing the current grid.
    const cfg = store.getConfig();
    const note = document.createElement('div');
    note.className = 'kind-note';
    if (current === 'discrete') {
      const N = Number(cfg.sourceParams.numSamples ?? 64);
      const fs = Number(cfg.sourceParams.sampleRate ?? 1000);
      const tMax = ((N - 1) / fs).toPrecision(3);
      note.innerHTML = t('panel.kind.note.discrete', { N, fs, tMax });
    } else {
      const fs = Number(cfg.sourceParams.sampleRate ?? 1000);
      const dur = Number(cfg.sourceParams.duration ?? 1);
      const N = Math.round(fs * dur);
      note.innerHTML = t('panel.kind.note.continuous', { fs, dur, N });
    }
    wrap.appendChild(note);

    return wrap;
  }

  /** Ensure sourceParams contains the keys this mode expects. */
  private fillMissingSourceDefaults(kind: SignalKind): void {
    const cfg = store.getConfig();
    const src = sourceRegistry.get(cfg.sourceId);
    if (!src) return;

    // sampleRate is required in both modes (t = n / fs).
    const wantNames = kind === 'discrete'
      ? ['numSamples', 'sampleRate']
      : ['sampleRate', 'duration'];

    for (const name of wantNames) {
      if (cfg.sourceParams[name] === undefined) {
        const schema = src.params.find((p) => p.name === name);
        if (schema) store.setSourceParam(name, schema.default);
      }
    }
  }

  private ensureTransformCompatible(kind: SignalKind): void {
    const cfg = store.getConfig();
    const tr = transformRegistry.get(cfg.transformId);
    if (tr && tr.compatibleSignalKinds.includes(kind)) return;
    // Pick the first compatible transform.
    const fallback = transformRegistry.list((x) => x.compatibleSignalKinds.includes(kind))[0];
    if (fallback) {
      const defaults: ParamValues = {};
      for (const p of fallback.params) defaults[p.name] = p.default;
      store.setConfig({ transformId: fallback.id, transformParams: defaults });
    }
  }

  private buildSourceSection(currentId: string, currentParams: ParamValues, kind: SignalKind): HTMLElement {
    const body = document.createElement('div');

    // Filter sources by signalKind (sources marked 'both' always show).
    const visibleSources: IDataSource[] = sourceRegistry.list(
      (s) => s.signalKind === 'both' || s.signalKind === kind
    );

    const sel = document.createElement('select');
    sel.className = 'panel-select';
    for (const src of visibleSources) {
      const o = document.createElement('option');
      o.value = src.id;
      o.textContent = sourceName(src);
      if (src.id === currentId) o.selected = true;
      sel.appendChild(o);
    }
    sel.addEventListener('change', () => {
      const src = sourceRegistry.get(sel.value);
      if (!src) return;
      const defaults: ParamValues = {};
      for (const p of src.params) defaults[p.name] = p.default;
      store.setConfig({ sourceId: sel.value, sourceParams: defaults });
      this.render();
    });
    body.appendChild(sel);

    const src = sourceRegistry.get(currentId);
    if (src) {
      // Exclude meta params (latex/kind) handled by FormulaInput.
      let editableParams = src.params.filter((p) => p.name !== 'latex' && p.name !== 'kind');

      // Show the right "length" parameters depending on signal kind:
      //   discrete  -> numSamples + sampleRate (fs is needed for t = n / fs)
      //   continuous -> sampleRate + duration
      if (kind === 'discrete') {
        editableParams = editableParams.filter((p) => p.name !== 'duration');
      } else {
        editableParams = editableParams.filter((p) => p.name !== 'numSamples');
      }

      // For FormulaSource, skip rendering the form when only meta params remain.
      if (src.id === 'formula' && editableParams.length === 0) {
        return body;
      }

      this.sourceForm = new ParameterForm({
        schemas: editableParams,
        values: currentParams,
        contextId: src.id,
        onChange: (name, value) => store.setSourceParam(name, value)
      });
      body.appendChild(this.sourceForm.element);
    }
    return body;
  }

  private buildWindowSection(currentId: string): HTMLElement {
    const body = document.createElement('div');
    const sel = document.createElement('select');
    sel.className = 'panel-select';
    for (const w of windowRegistry.list()) {
      const o = document.createElement('option');
      o.value = w.id;
      o.textContent = windowName(w);
      if (w.id === currentId) o.selected = true;
      sel.appendChild(o);
    }
    sel.addEventListener('change', () => {
      store.setConfig({ windowId: sel.value });
    });
    body.appendChild(sel);
    return body;
  }

  private buildTransformSection(currentId: string, currentParams: ParamValues, kind: SignalKind): HTMLElement {
    const body = document.createElement('div');

    // Group transforms by category.
    const all: ITransform[] = transformRegistry.list();
    const groups = new Map<string, ITransform[]>();
    for (const tr of all) {
      if (!groups.has(tr.category)) groups.set(tr.category, []);
      groups.get(tr.category)!.push(tr);
    }

    const sel = document.createElement('select');
    sel.className = 'panel-select';
    const kindLabel = kind === 'discrete' ? t('panel.kind.discrete') : t('panel.kind.continuous');

    for (const [cat, ts] of groups) {
      const og = document.createElement('optgroup');
      og.label = transformGroupLabel(cat);
      for (const tr of ts) {
        const compatible = tr.compatibleSignalKinds.includes(kind);
        const o = document.createElement('option');
        o.value = tr.id;
        o.textContent = compatible
          ? transformName(tr)
          : `${transformName(tr)}  ${t('panel.transform.incompatible', { kind: kindLabel })}`;
        o.disabled = !compatible;
        if (tr.id === currentId) o.selected = true;
        og.appendChild(o);
      }
      sel.appendChild(og);
    }
    sel.addEventListener('change', () => {
      const tr = transformRegistry.get(sel.value);
      if (!tr) return;
      const defaults: ParamValues = {};
      for (const p of tr.params) defaults[p.name] = p.default;
      store.setConfig({ transformId: sel.value, transformParams: defaults });
      this.render();
    });
    body.appendChild(sel);

    const tr = transformRegistry.get(currentId);
    if (tr && tr.params.length > 0) {
      this.transformForm = new ParameterForm({
        schemas: tr.params,
        values: currentParams,
        contextId: tr.id,
        onChange: (name, value) => store.setTransformParam(name, value)
      });
      body.appendChild(this.transformForm.element);
    } else if (tr) {
      const hint = document.createElement('div');
      hint.className = 'panel-hint';
      hint.textContent = t('panel.transform.noParams');
      body.appendChild(hint);
    }
    return body;
  }

  /** Force a full re-render (used after a preset is applied). */
  refresh(): void {
    this.render();
  }
}
