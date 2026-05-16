/**
 * Formula source: compile a user-written LaTeX expression and evaluate it on
 * a sample grid.
 *
 * Convention (DSP textbook style):
 *   - `t` is always physical time (s):  t = i / fs
 *   - `n` is always the integer index:  n = i
 *   - The two are linked by t = n / fs
 *
 * The two modes only differ in who picks N:
 *   - continuous: N = sampleRate * duration
 *   - discrete:   N = numSamples
 */
import type { IDataSource, DataBuffer, ParamValues } from '@/core/types';
import { latexToMath, detectVariable } from '@/utils/formula';
import { compileExpression, evaluateOnGrid } from '@/core/formulaParser';

export const FormulaSource: IDataSource = {
  id: 'formula',
  name: '✏️ Custom Formula (LaTeX)',
  domain: 'signal',
  description: 'Write any LaTeX expression - sin/cos/exp/sqrt/sinc/u(t)/rect/tri all supported',
  signalKind: 'both',
  latex: 'x(t) = \\text{your formula}',
  params: [
    {
      name: 'latex',
      type: 'enum',
      default: '\\sin(2\\pi \\cdot 5 t) + 0.5\\sin(2\\pi \\cdot 12 t)',
      label: 'LaTeX Expression',
      options: [
        { value: '\\sin(2\\pi \\cdot 5 t) + 0.5\\sin(2\\pi \\cdot 12 t)', label: 'two sinusoids' }
      ],
      description: 'Owned by FormulaInput; the actual value is kept in store.'
    },
    {
      name: 'kind',
      type: 'enum',
      default: 'continuous',
      label: 'Signal Kind',
      options: [
        { value: 'continuous', label: 'Continuous x(t)' },
        { value: 'discrete', label: 'Discrete x[n]' }
      ]
    },
    {
      name: 'sampleRate',
      type: 'number',
      default: 1000,
      min: 50,
      max: 20000,
      step: 50,
      label: 'Sample Rate',
      unit: 'Hz',
      description: 'Sample rate fs; t and n are linked by t = n / fs'
    },
    {
      name: 'duration',
      type: 'number',
      default: 1,
      min: 0.1,
      max: 4,
      step: 0.1,
      label: 'Duration',
      unit: 's',
      description: 'Continuous mode only'
    },
    {
      name: 'numSamples',
      type: 'number',
      default: 64,
      min: 4,
      max: 1024,
      step: 1,
      label: 'Num Samples',
      unit: 'pts',
      description: 'Discrete mode only: sequence length N'
    }
  ],

  async generate(p: ParamValues): Promise<DataBuffer> {
    const latex = String(p.latex ?? '0');
    const kind = String(p.kind ?? 'continuous') as 'continuous' | 'discrete';

    const mathExpr = latexToMath(latex);
    // Whatever variable the formula uses wins; hint is fallback.
    const variable = detectVariable(mathExpr, kind);
    const { compiled, error } = compileExpression(mathExpr);

    const fs = Number(p.sampleRate ?? 1000);

    const N = kind === 'discrete'
      ? Math.max(2, Math.round(Number(p.numSamples ?? 64)))
      : Math.max(2, Math.round(fs * Number(p.duration ?? 1)));

    // Build both coordinate arrays: t = i/fs, n = i.
    const tArr = new Float32Array(N);
    const nArr = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      tArr[i] = i / fs;
      nArr[i] = i;
    }

    // Pick primary variable based on the formula; inject the companion variable too.
    const mainGrid = variable === 'n' ? nArr : tArr;
    const companion = variable === 'n'
      ? { name: 't', values: tArr }
      : { name: 'n', values: nArr };

    const data = compiled
      ? evaluateOnGrid(compiled, variable, mainGrid, companion)
      : new Float32Array(N);

    return {
      data,
      shape: [N],
      dtype: 'float32',
      metadata: {
        sampleRate: fs,
        domain: 'time',
        units: 'a.u.',
        extra: {
          formula: latex,
          mathExpr,
          variable,
          kind,
          parseError: error
        }
      }
    };
  }
};
