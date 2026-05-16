/** Lightweight state container for the current pipeline configuration. */
import type { PipelineConfig } from './pipeline';
import type { SignalKind } from './types';
import { eventBus, Events } from './eventBus';

interface AppState extends PipelineConfig {
  signalKind: SignalKind;
  /** Latex formula stored separately from sourceParams. */
  formulaLatex: string;
}

const DEFAULT_STATE: AppState = {
  signalKind: 'continuous',
  formulaLatex: '\\sin(2\\pi \\cdot 5 t) + 0.5\\sin(2\\pi \\cdot 12 t)',
  sourceId: 'sine',
  sourceParams: { freq: 5, amp: 1, phase: 0, sampleRate: 1000, duration: 1 },
  windowId: 'rect',
  transformId: 'dft',
  transformParams: {}
};

class Store {
  private state: AppState = JSON.parse(JSON.stringify(DEFAULT_STATE));

  getConfig(): PipelineConfig {
    // For the formula source, inject the latex into sourceParams.
    const cfg: PipelineConfig = {
      sourceId: this.state.sourceId,
      sourceParams: { ...this.state.sourceParams },
      windowId: this.state.windowId,
      transformId: this.state.transformId,
      transformParams: { ...this.state.transformParams },
      signalKind: this.state.signalKind,
      extraComponents: this.state.extraComponents
    };
    if (this.state.sourceId === 'formula') {
      cfg.sourceParams.latex = this.state.formulaLatex;
      cfg.sourceParams.kind = this.state.signalKind;
    }
    return cfg;
  }

  getSignalKind(): SignalKind {
    return this.state.signalKind;
  }

  getFormula(): string {
    return this.state.formulaLatex;
  }

  setSignalKind(kind: SignalKind): void {
    this.state.signalKind = kind;
    eventBus.emit(Events.ParamsChange, this.getConfig());
  }

  setFormula(latex: string): void {
    this.state.formulaLatex = latex;
    eventBus.emit(Events.ParamsChange, this.getConfig());
  }

  setConfig(patch: Partial<AppState>): void {
    this.state = { ...this.state, ...patch };
    eventBus.emit(Events.ParamsChange, this.getConfig());
  }

  setSourceParam(name: string, value: number | string | boolean): void {
    this.state.sourceParams = { ...this.state.sourceParams, [name]: value };
    eventBus.emit(Events.ParamsChange, this.getConfig());
  }

  setTransformParam(name: string, value: number | string | boolean): void {
    this.state.transformParams = { ...this.state.transformParams, [name]: value };
    eventBus.emit(Events.ParamsChange, this.getConfig());
  }

  reset(): void {
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    eventBus.emit(Events.ParamsChange, this.getConfig());
  }

  /** Serialize the full state into a URL-friendly snapshot. */
  serialize(): string {
    return btoa(unescape(encodeURIComponent(JSON.stringify(this.state))));
  }

  /** Hydrate from an encoded snapshot; returns false on parse failure. */
  hydrate(encoded: string): boolean {
    try {
      const json = decodeURIComponent(escape(atob(encoded)));
      const obj = JSON.parse(json);
      this.state = { ...DEFAULT_STATE, ...obj };
      eventBus.emit(Events.ParamsChange, this.getConfig());
      return true;
    } catch {
      return false;
    }
  }
}

export const store = new Store();
