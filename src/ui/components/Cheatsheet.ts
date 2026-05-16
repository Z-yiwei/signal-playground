/**
 * Slide-out cheatsheet panel. Each formula is rendered with KaTeX; the panel
 * rebuilds on language change.
 */
import katex from 'katex';
import { CHEATSHEET } from '@/domains/signal/knowledge/cheatsheet';
import { i18n, t } from '@/i18n';

export class Cheatsheet {
  private root: HTMLElement;
  private overlay: HTMLElement;
  private isOpen = false;

  constructor() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'cheatsheet-overlay';
    this.overlay.addEventListener('click', () => this.close());

    this.root = document.createElement('aside');
    this.root.className = 'cheatsheet';

    this.build();

    document.body.appendChild(this.overlay);
    document.body.appendChild(this.root);

    // Rebuild on language change.
    i18n.subscribe(() => this.rebuild());
  }

  private rebuild(): void {
    this.root.innerHTML = '';
    this.build();
  }

  private build(): void {
    const head = document.createElement('div');
    head.className = 'cheatsheet-head';
    head.innerHTML = `
      <span class="cheatsheet-title">${this.escapeHtml(t('cs.title'))}</span>
      <button class="cheatsheet-close" aria-label="${this.escapeHtml(t('cs.close'))}">✕</button>
    `;
    head.querySelector('.cheatsheet-close')?.addEventListener('click', () => this.close());
    this.root.appendChild(head);

    const body = document.createElement('div');
    body.className = 'cheatsheet-body';

    for (const cat of CHEATSHEET) {
      const sec = document.createElement('section');
      sec.className = 'cheatsheet-section';

      const title = document.createElement('h4');
      title.className = 'cheatsheet-section-title';
      title.innerHTML = `${cat.icon} ${this.escapeHtml(t(cat.titleKey))}`;
      sec.appendChild(title);

      for (const item of cat.items) {
        const row = document.createElement('div');
        row.className = 'cheatsheet-item';

        const formula = document.createElement('div');
        formula.className = 'cheatsheet-formula';
        try {
          katex.render(item.latex, formula, {
            throwOnError: false,
            displayMode: false,
            errorColor: '#f87171'
          });
        } catch {
          formula.textContent = item.latex;
        }

        const note = document.createElement('div');
        note.className = 'cheatsheet-note';
        note.textContent = t(item.noteKey);

        row.appendChild(formula);
        row.appendChild(note);
        sec.appendChild(row);
      }

      body.appendChild(sec);
    }

    this.root.appendChild(body);
  }

  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  open(): void {
    this.isOpen = true;
    this.overlay.classList.add('show');
    this.root.classList.add('open');
  }

  close(): void {
    this.isOpen = false;
    this.overlay.classList.remove('show');
    this.root.classList.remove('open');
  }

  toggle(): void {
    this.isOpen ? this.close() : this.open();
  }
}
