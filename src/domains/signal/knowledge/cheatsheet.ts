/**
 * Cheatsheet data: common transform definitions, properties and pairs.
 * Titles and notes are stored as i18n keys; the Cheatsheet component resolves
 * them at render time via t().
 */

export interface CheatsheetItem {
  /** LaTeX expression rendered by KaTeX */
  latex: string;
  /** i18n key whose value is shown next to the formula */
  noteKey: string;
}

export interface CheatsheetCategory {
  id: string;
  /** i18n key for the category title */
  titleKey: string;
  icon: string;
  items: CheatsheetItem[];
}

export const CHEATSHEET: CheatsheetCategory[] = [
  {
    id: 'definitions',
    titleKey: 'cs.cat.definitions',
    icon: '📘',
    items: [
      { latex: 'X(j\\omega) = \\int_{-\\infty}^{\\infty} x(t)\\, e^{-j\\omega t}\\, dt', noteKey: 'cs.note.ctft' },
      { latex: 'X(e^{j\\omega}) = \\sum_{n=-\\infty}^{\\infty} x[n]\\, e^{-j\\omega n}', noteKey: 'cs.note.dtft' },
      { latex: 'X[k] = \\sum_{n=0}^{N-1} x[n]\\, e^{-j 2\\pi k n / N}', noteKey: 'cs.note.dft' },
      { latex: 'c_k = \\frac{1}{T}\\!\\int_{0}^{T} x(t)\\, e^{-jk\\omega_0 t}\\, dt', noteKey: 'cs.note.ctfs' },
      { latex: 'X(s) = \\int_{0}^{\\infty} x(t)\\, e^{-st}\\, dt', noteKey: 'cs.note.laplace' },
      { latex: 'X(z) = \\sum_{n=0}^{\\infty} x[n]\\, z^{-n}', noteKey: 'cs.note.zt' },
      { latex: 'X^{C}[k] = \\sum_{n=0}^{N-1} x[n]\\cos\\!\\left[\\frac{\\pi}{N}(n+\\tfrac{1}{2})k\\right]', noteKey: 'cs.note.dct' },
      { latex: '\\hat{x}(t) = \\frac{1}{\\pi}\\,\\text{p.v.}\\!\\int \\frac{x(\\tau)}{t-\\tau}\\, d\\tau', noteKey: 'cs.note.hilbert' }
    ]
  },
  {
    id: 'properties',
    titleKey: 'cs.cat.properties',
    icon: '📗',
    items: [
      { latex: 'a x_1(t) + b x_2(t)\\;\\xleftrightarrow{\\mathcal{F}}\\; a X_1(j\\omega) + b X_2(j\\omega)', noteKey: 'cs.note.linearity' },
      { latex: 'x(t-t_0)\\;\\xleftrightarrow{\\mathcal{F}}\\; X(j\\omega)\\, e^{-j\\omega t_0}', noteKey: 'cs.note.timeshift' },
      { latex: 'x(t)\\, e^{j\\omega_0 t}\\;\\xleftrightarrow{\\mathcal{F}}\\; X(j(\\omega-\\omega_0))', noteKey: 'cs.note.modulation' },
      { latex: 'x(at)\\;\\xleftrightarrow{\\mathcal{F}}\\; \\tfrac{1}{|a|} X\\!\\left(\\tfrac{j\\omega}{a}\\right)', noteKey: 'cs.note.scaling' },
      { latex: '\\tfrac{d}{dt}x(t)\\;\\xleftrightarrow{\\mathcal{F}}\\; j\\omega X(j\\omega)', noteKey: 'cs.note.derivative' },
      { latex: '(x*h)(t)\\;\\xleftrightarrow{\\mathcal{F}}\\; X(j\\omega)\\,H(j\\omega)', noteKey: 'cs.note.convolution' },
      { latex: '\\int |x(t)|^2 dt = \\tfrac{1}{2\\pi}\\!\\int |X(j\\omega)|^2 d\\omega', noteKey: 'cs.note.parseval' }
    ]
  },
  {
    id: 'pairs',
    titleKey: 'cs.cat.pairs',
    icon: '📕',
    items: [
      { latex: '\\delta(t)\\;\\xleftrightarrow{\\mathcal{F}}\\; 1', noteKey: 'cs.note.delta' },
      { latex: '1\\;\\xleftrightarrow{\\mathcal{F}}\\; 2\\pi\\delta(\\omega)', noteKey: 'cs.note.dc' },
      { latex: 'e^{-at}u(t)\\;\\xleftrightarrow{\\mathcal{F}}\\; \\frac{1}{a + j\\omega}', noteKey: 'cs.note.expDecay' },
      { latex: '\\text{rect}\\!\\left(\\tfrac{t}{T}\\right)\\;\\xleftrightarrow{\\mathcal{F}}\\; T\\,\\text{sinc}\\!\\left(\\tfrac{\\omega T}{2\\pi}\\right)', noteKey: 'cs.note.rectSinc' },
      { latex: '\\cos(\\omega_0 t)\\;\\xleftrightarrow{\\mathcal{F}}\\; \\pi[\\delta(\\omega-\\omega_0)+\\delta(\\omega+\\omega_0)]', noteKey: 'cs.note.cosine' },
      { latex: 'e^{-t^2/(2\\sigma^2)}\\;\\xleftrightarrow{\\mathcal{F}}\\; \\sqrt{2\\pi}\\,\\sigma\\, e^{-\\sigma^2\\omega^2/2}', noteKey: 'cs.note.gauss' }
    ]
  },
  {
    id: 'discrete-pairs',
    titleKey: 'cs.cat.discretePairs',
    icon: '📙',
    items: [
      { latex: '\\delta[n]\\;\\xleftrightarrow{\\text{DTFT}}\\; 1', noteKey: 'cs.note.delta_n' },
      { latex: 'a^n u[n],|a|<1\\;\\xleftrightarrow{\\text{DTFT}}\\; \\frac{1}{1 - a e^{-j\\omega}}', noteKey: 'cs.note.geom' },
      { latex: '\\cos(\\omega_0 n)\\;\\xleftrightarrow{\\text{DTFT}}\\; \\pi\\!\\sum_k [\\delta(\\omega-\\omega_0+2\\pi k) + \\delta(\\omega+\\omega_0+2\\pi k)]', noteKey: 'cs.note.discCos' }
    ]
  }
];
