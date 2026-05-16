/**
 * Transform info card: shows the LaTeX definition plus teaching hints
 * (input requirement, output semantics, common pitfalls, related transforms).
 */
import katex from 'katex';
import { transformRegistry } from '@/core/registry';
import { t } from '@/i18n';
import {
  transformName,
  transformInputReq,
  transformOutputSem,
  transformPitfall,
  transformGroupLabel
} from '@/i18n/display';

export class TransformInfo {
  private root: HTMLElement;

  constructor() {
    this.root = document.createElement('div');
    this.root.className = 'transform-info';
  }

  get element(): HTMLElement {
    return this.root;
  }

  render(transformId: string): void {
    const tr = transformRegistry.get(transformId);
    if (!tr) {
      this.root.innerHTML = '';
      return;
    }

    const formulaWrap = document.createElement('div');
    formulaWrap.className = 'tf-formula';

    const formulaInner = document.createElement('div');
    katex.render(tr.latexFormula, formulaInner, {
      throwOnError: false,
      displayMode: true,
      errorColor: '#f87171'
    });
    formulaWrap.appendChild(formulaInner);

    const inReq = transformInputReq(tr);
    const outSem = transformOutputSem(tr);
    const pit = transformPitfall(tr);
    const related = tr.teachingHints?.relatedTransforms ?? [];

    const parts: string[] = [];
    if (inReq) parts.push(`<div class="tf-hint"><span class="tf-tag tf-tag-in">${this.esc(t('tf.tag.input'))}</span> ${this.esc(inReq)}</div>`);
    if (outSem) parts.push(`<div class="tf-hint"><span class="tf-tag tf-tag-out">${this.esc(t('tf.tag.output'))}</span> ${this.esc(outSem)}</div>`);
    if (pit) parts.push(`<div class="tf-hint"><span class="tf-tag tf-tag-warn">${this.esc(t('tf.tag.pitfall'))}</span> ${this.esc(pit)}</div>`);
    if (related.length) {
      parts.push(`<div class="tf-hint"><span class="tf-tag tf-tag-rel">${this.esc(t('tf.tag.related'))}</span> ${related.map((r) => `<code>${this.esc(r)}</code>`).join(', ')}</div>`);
    }

    this.root.innerHTML = `
      <div class="tf-head">
        <div class="tf-name">${this.esc(transformName(tr))}</div>
        <div class="tf-cat">${this.esc(transformGroupLabel(tr.category))}</div>
      </div>
    `;
    this.root.appendChild(formulaWrap);
    if (parts.length) {
      const w = document.createElement('div');
      w.className = 'tf-hints';
      w.innerHTML = parts.join('');
      this.root.appendChild(w);
    }
  }

  private esc(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
