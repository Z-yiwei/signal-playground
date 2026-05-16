/**
 * App orchestrator: registers domain plugins, restores URL snapshots, builds
 * the UI, wires header buttons (Cheatsheet / Share / PNG / CSV / language),
 * runs the pipeline on parameter changes and refreshes static text on locale
 * changes.
 */
import { registerSignalDomain } from '@/domains/signal';
import { presetRegistry } from '@/core/registry';
import { store } from '@/core/store';
import { eventBus, Events } from '@/core/eventBus';
import { Pipeline, type PipelineResult } from '@/core/pipeline';
import { ControlPanel } from '@/ui/components/ControlPanel';
import { PlotGrid } from '@/ui/components/PlotGrid';
import { Cheatsheet } from '@/ui/components/Cheatsheet';
import { debounce } from '@/utils/debounce';
import { exportCSV } from '@/utils/exporter';
import { readSnapshotFromURL, copyShareLink } from '@/utils/urlState';
import { i18n, t } from '@/i18n';
import { presetName, transformName, sourceName } from '@/i18n/display';
import { sourceRegistry, transformRegistry } from '@/core/registry';
import Plotly from 'plotly.js-dist-min';

export class App {
  private controlPanel!: ControlPanel;
  private plotGrid!: PlotGrid;
  private cheatsheet!: Cheatsheet;
  private lastResult: PipelineResult | null = null;

  async start(): Promise<void> {
    // Register all domain plugins.
    registerSignalDomain();

    // Hydrate from URL hash before the UI is built.
    readSnapshotFromURL();

    // Translate static HTML text.
    this.applyStaticI18n();

    // Build UI components.
    const panelEl = document.getElementById('control-panel');
    const gridEl = document.getElementById('plot-grid');
    if (!panelEl || !gridEl) throw new Error('Missing UI containers');

    this.controlPanel = new ControlPanel(panelEl);
    this.plotGrid = new PlotGrid(gridEl);
    this.cheatsheet = new Cheatsheet();

    // Header dropdown / buttons.
    this.populatePresets();
    this.bindHeaderButtons();

    // On language change: re-translate static text, refill presets, rerun pipeline.
    i18n.subscribe(() => {
      this.applyStaticI18n();
      this.populatePresets();
      this.runPipeline();
    });

    // Re-run pipeline whenever any parameter changes.
    const runDebounced = debounce(() => this.runPipeline(), 80);
    eventBus.on(Events.ParamsChange, runDebounced);

    // Initial run.
    await this.runPipeline();
  }

  /** Apply translations to every [data-i18n] / [data-i18n-title] node in HTML. */
  private applyStaticI18n(): void {
    document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) el.textContent = t(key);
    });
    document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      if (key) el.title = t(key);
    });
    // Document title.
    document.title = `🌊 ${t('header.title')}`;
  }

  private populatePresets(): void {
    const sel = document.getElementById('preset-select') as HTMLSelectElement | null;
    if (!sel) return;
    // Keep the placeholder (first option), drop the rest.
    while (sel.options.length > 1) sel.remove(1);
    for (const p of presetRegistry.list()) {
      const o = document.createElement('option');
      o.value = p.id;
      o.textContent = presetName(p);
      o.title = p.description;
      sel.appendChild(o);
    }
    // Reassign onchange (avoids stacking listeners on re-population).
    sel.onchange = () => {
      const p = presetRegistry.get(sel.value);
      if (!p) return;
      const cfg = p.apply();
      const patch: any = {
        sourceId: cfg.sourceId,
        sourceParams: cfg.sourceParams,
        windowId: cfg.windowId,
        transformId: cfg.transformId,
        transformParams: cfg.transformParams,
        extraComponents: cfg.extraComponents
      };
      if (cfg.signalKind) patch.signalKind = cfg.signalKind;
      if (cfg.sourceId === 'formula' && cfg.sourceParams?.latex) {
        store.setConfig(patch);
        store.setFormula(String(cfg.sourceParams.latex));
      } else {
        store.setConfig(patch);
      }
      this.controlPanel.refresh();
      this.setStatus(t('status.presetLoaded', { name: presetName(p) }));
      sel.value = '';
    };
  }

  private bindHeaderButtons(): void {
    document.getElementById('export-png')?.addEventListener('click', () => this.exportPNG());
    document.getElementById('export-csv')?.addEventListener('click', () => this.exportCSV());

    document.getElementById('btn-cheatsheet')?.addEventListener('click', () => {
      this.cheatsheet.toggle();
    });

    document.getElementById('btn-share')?.addEventListener('click', async () => {
      const url = await copyShareLink();
      this.setStatus(t('status.shareCopied', { url: url.slice(0, 60) }));
    });

    // Language switcher.
    document.getElementById('btn-lang')?.addEventListener('click', () => {
      i18n.toggle();
    });
  }

  private async runPipeline(): Promise<void> {
    const cfg = store.getConfig();
    try {
      const pipe = new Pipeline(cfg);
      const result = await pipe.run();
      this.lastResult = result;
      this.plotGrid.render(result, cfg.transformId);

      const formulaErr = (result.source.metadata.extra as any)?.parseError;
      if (formulaErr) {
        this.setStatus(t('status.formulaErr', { err: formulaErr }));
      } else {
        const src = sourceRegistry.get(cfg.sourceId);
        const tr = transformRegistry.get(cfg.transformId);
        this.setStatus(t('status.pipelineOk', {
          src: src ? sourceName(src) : cfg.sourceId,
          trans: tr ? transformName(tr) : cfg.transformId,
          N: result.source.data.length,
          ms: result.elapsedMs.toFixed(1)
        }));
      }
    } catch (err: any) {
      this.setStatus(t('status.pipelineErr', { msg: err?.message ?? String(err) }));
      console.error(err);
    }
  }

  private setStatus(msg: string): void {
    const bar = document.getElementById('status-bar');
    if (bar) {
      bar.textContent = msg;
      // Dynamic messages must not be overwritten by the next applyStaticI18n() call.
      bar.removeAttribute('data-i18n');
    }
  }

  private async exportPNG(): Promise<void> {
    const cells = this.plotGrid.getCells();
    if (!cells.length) return;
    for (let i = 0; i < cells.length; i++) {
      const body = cells[i].el.querySelector('.cell-body') as HTMLElement;
      if (!body) continue;
      try {
        await Plotly.downloadImage(body, {
          format: 'png',
          width: 1200,
          height: 600,
          filename: `signal-playground-${i + 1}-${cells[i].title.replace(/\s+/g, '_')}`
        });
      } catch (e) {
        console.warn('PNG export failed', e);
      }
    }
    this.setStatus(t('status.pngExported', { n: cells.length }));
  }

  private exportCSV(): void {
    if (!this.lastResult) return;
    exportCSV(this.lastResult.source, 'signal-playground-time.csv');
    exportCSV(this.lastResult.transformed, 'signal-playground-transformed.csv');
    this.setStatus(t('status.csvExported'));
  }
}
