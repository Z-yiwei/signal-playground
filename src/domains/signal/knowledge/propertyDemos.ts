/**
 * Configuration for transform-property demos.
 * Each entry pairs a baseline signal with a modified variant; the UI runs both
 * pipelines and overlays the magnitude / phase spectra.
 */
import type { ParamValues } from '@/core/types';

export interface PropertyDemo {
  id: string;
  title: string;
  description: string;
  /** Property relation in LaTeX, rendered by KaTeX */
  relationLatex: string;
  /** What the student should observe in the spectra */
  observe: string;
  /** Baseline vs. variant signal configurations */
  baseline: { sourceId: string; sourceParams: ParamValues; signalKind: 'continuous' | 'discrete' };
  variant:  { sourceId: string; sourceParams: ParamValues; signalKind: 'continuous' | 'discrete'; label: string };
  /** Recommended transform for the demo */
  transformId: string;
}

export const PROPERTY_DEMOS: PropertyDemo[] = [
  {
    id: 'linearity',
    title: 'Linearity',
    description: 'The transform is linear: scaling the input scales the spectrum; superposed inputs give superposed spectra.',
    relationLatex: '\\mathcal{F}\\{a x_1 + b x_2\\} = a\\,\\mathcal{F}\\{x_1\\} + b\\,\\mathcal{F}\\{x_2\\}',
    observe: 'Changing amplitude scales spectrum magnitude proportionally.',
    baseline: { sourceId: 'sine', sourceParams: { freq: 10, amp: 1, phase: 0, sampleRate: 1000, duration: 1 }, signalKind: 'continuous' },
    variant:  { sourceId: 'sine', sourceParams: { freq: 10, amp: 2, phase: 0, sampleRate: 1000, duration: 1 }, signalKind: 'continuous', label: '2x amplitude' },
    transformId: 'ctft'
  },
  {
    id: 'time-shift',
    title: 'Time Shift -> Linear Phase',
    description: 'A time shift leaves the magnitude spectrum unchanged but introduces a linear slope in phase.',
    relationLatex: 'x(t-t_0)\\;\\leftrightarrow\\;X(j\\omega)\\,e^{-j\\omega t_0}',
    observe: 'Magnitude spectrum is unchanged; phase shows a -omega*t0 linear slope.',
    baseline: { sourceId: 'gaussian', sourceParams: { center: 0.3, sigma: 0.05, amp: 1, sampleRate: 1000, duration: 1 }, signalKind: 'continuous' },
    variant:  { sourceId: 'gaussian', sourceParams: { center: 0.6, sigma: 0.05, amp: 1, sampleRate: 1000, duration: 1 }, signalKind: 'continuous', label: 'shifted by 0.3 s' },
    transformId: 'ctft'
  },
  {
    id: 'modulation',
    title: 'Modulation -> Frequency Shift',
    description: 'Multiplying by a carrier in time domain shifts the spectrum to +/- omega_0.',
    relationLatex: 'x(t)\\cos(\\omega_0 t)\\;\\leftrightarrow\\;\\tfrac12[X(j(\\omega-\\omega_0))+X(j(\\omega+\\omega_0))]',
    observe: 'A low-frequency signal is replicated at +/- omega_0.',
    baseline: { sourceId: 'gaussian', sourceParams: { center: 0.5, sigma: 0.08, amp: 1, sampleRate: 2000, duration: 1 }, signalKind: 'continuous' },
    variant:  { sourceId: 'formula',  sourceParams: { formula: 'e^{-((t-0.5)/0.08)^2}\\cos(2\\pi \\cdot 50 t)', sampleRate: 2000, duration: 1, nLength: 64 }, signalKind: 'continuous', label: 'modulated by cos(2*pi*50*t)' },
    transformId: 'ctft'
  },
  {
    id: 'duality-rect-sinc',
    title: 'Rect <-> Sinc Duality',
    description: 'A rectangular pulse has a sinc spectrum; narrower pulses produce wider spectra.',
    relationLatex: '\\text{rect}(t/T)\\;\\leftrightarrow\\;T\\,\\text{sinc}(\\omega T/2\\pi)',
    observe: 'Smaller T (narrower pulse) -> wider sinc.',
    baseline: { sourceId: 'formula', sourceParams: { formula: '\\text{rect}((t-0.5)/0.2)',  sampleRate: 2000, duration: 1, nLength: 64 }, signalKind: 'continuous' },
    variant:  { sourceId: 'formula', sourceParams: { formula: '\\text{rect}((t-0.5)/0.05)', sampleRate: 2000, duration: 1, nLength: 64 }, signalKind: 'continuous', label: 'narrower (T=0.05)' },
    transformId: 'ctft'
  }
];
