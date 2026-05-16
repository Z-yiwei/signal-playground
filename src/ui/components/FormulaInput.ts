/**
 * LaTeX formula input component: textarea + KaTeX preview + parser feedback.
 * Subscribes to language changes and rebuilds itself when the locale flips.
 */
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { latexToMath } from '@/utils/formula';
import { compileExpression } from '@/core/formulaParser';
import { store } from '@/core/store';
import { debounce } from '@/utils/debounce';
import { i18n, t } from '@/i18n';

const QUICK_INSERTS: Array<{ label: string; latex: string }> = [
  { label: 'sin', latex: '\\sin(2\\pi \\cdot 5 t)' },
  { label: 'cos', latex: '\\cos(2\\pi \\cdot 10 t)' },
  { label: 'exp', latex: 'e^{-2 t}' },
  { label: 'sinc', latex: '\\mathrm{sinc}(10 t)' },
  { label: 'rect', latex: '\\mathrm{rect}(t - 0.5)' },
  { label: 'gauss', latex: 'e^{-(t - 0.5)^2 / 0.005}' },
  { label: 'u(t)', latex: 'u(t - 0.2)' },
  { label: 'AM', latex: '(1 + 0.5\\cos(2\\pi \\cdot 3 t))\\cos(2\\pi \\cdot 30 t)' }
];

export class FormulaInput {
  private root: HTMLElement;
  private textarea!: HTMLTextAreaElement;
  private preview!: HTMLDivElement;
  private debug!: HTMLDivElement;
  private banner!: HTMLDivElement;
  private titleEl!: HTMLSpanElement;
  private unsubLang: () => void = () => {};

  constructor() {
    this.root = document.createElement('div');
    this.root.className = 'formula-input';
    this.build();
    // Rebuild on language change.
    this.unsubLang = i18n.subscribe(() => this.rebuild());
  }

  get element(): HTMLElement {
    return this.root;
  }

  private rebuild(): void {
    this.unsubLang();
    this.root.innerHTML = '';
    this.build();
    this.unsubLang = i18n.subscribe(() => this.rebuild());
  }

  private build(): void {
    this.root.innerHTML = '';

    // Header / title
    const head = document.createElement('div');
    head.className = 'formula-head';
    this.titleEl = document.createElement('span');
    this.titleEl.className = 'formula-title';
    this.titleEl.textContent = t('formula.title');
    head.appendChild(this.titleEl);
    this.root.appendChild(head);

    // Banner shown according to the current signal kind.
    this.banner = document.createElement('div');
    this.banner.className = 'formula-banner';
    this.root.appendChild(this.banner);
    this.updateBanner();

    // KaTeX preview
    this.preview = document.createElement('div');
    this.preview.className = 'formula-preview';
    this.root.appendChild(this.preview);

    // Text area
    this.textarea = document.createElement('textarea');
    this.textarea.className = 'formula-textarea';
    this.textarea.rows = 2;
    this.textarea.spellcheck = false;
    this.textarea.placeholder = t('formula.placeholder');
    this.textarea.value = store.getFormula();
    this.root.appendChild(this.textarea);

    // Quick-insert chips
    const inserts = document.createElement('div');
    inserts.className = 'formula-quick';
    QUICK_INSERTS.forEach((q) => {
      const b = document.createElement('button');
      b.className = 'formula-chip';
      b.textContent = q.label;
      b.title = q.latex;
      b.addEventListener('click', () => {
        this.textarea.value = q.latex;
        this.handleChange();
      });
      inserts.appendChild(b);
    });
    this.root.appendChild(inserts);

    // Parser output / errors
    this.debug = document.createElement('div');
    this.debug.className = 'formula-debug';
    this.root.appendChild(this.debug);

    // Wire up events.
    const onChange = debounce(() => this.handleChange(), 250);
    this.textarea.addEventListener('input', onChange);

    this.refresh();
  }

  private updateBanner(): void {
    const kind = store.getSignalKind();
    if (kind === 'discrete') {
      this.banner.className = 'formula-banner banner-discrete';
      this.banner.innerHTML = t('formula.banner.discrete');
    } else {
      this.banner.className = 'formula-banner banner-continuous';
      this.banner.innerHTML = t('formula.banner.continuous');
    }
  }

  private handleChange(): void {
    store.setFormula(this.textarea.value);
    this.refresh();
  }

  private refresh(): void {
    const latex = this.textarea.value || '0';

    // KaTeX render
    try {
      katex.render(latex, this.preview, {
        throwOnError: false,
        displayMode: true,
        errorColor: '#f87171'
      });
    } catch {
      this.preview.textContent = t('formula.invalid');
    }

    // mathjs compile check
    const mathExpr = latexToMath(latex);
    const { error } = compileExpression(mathExpr);
    if (error) {
      this.debug.innerHTML = `<span class="debug-err">⚠ ${this.escapeHtml(error)}</span>`;
    } else {
      this.debug.innerHTML = `<span class="debug-ok">→ <code>${this.escapeHtml(mathExpr)}</code></span>`;
    }
  }

  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** Re-read the formula from the store (e.g. after a preset is applied). */
  syncFromStore(): void {
    this.textarea.value = store.getFormula();
    this.refresh();
  }
}
