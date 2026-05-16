/**
 * LaTeX -> mathjs expression preprocessor.
 * Converts user-written LaTeX into a string mathjs can evaluate, and provides
 * helpers to compile and sample a formula on a numeric grid.
 */
import { create, all } from 'mathjs';

/** Minimal interface of a compiled mathjs expression. */
type EvalFunction = { evaluate: (scope?: Record<string, unknown>) => unknown };

const math = create(all);

// ---------- Custom DSP helper functions ----------

math.import({
  /** Rectangular pulse: |t| < 1/2 -> 1, otherwise 0 */
  rect(t: number): number {
    return Math.abs(t) < 0.5 ? 1 : Math.abs(t) === 0.5 ? 0.5 : 0;
  },
  /** Triangular pulse: |t| < 1 -> 1 - |t|, otherwise 0 */
  tri(t: number): number {
    const a = Math.abs(t);
    return a < 1 ? 1 - a : 0;
  },
  /** Unit step u(t) */
  u(t: number): number {
    return t < 0 ? 0 : t === 0 ? 0.5 : 1;
  },
  /** Sign function */
  sgn(t: number): number {
    return t > 0 ? 1 : t < 0 ? -1 : 0;
  },
  /** Normalised sinc: sinc(t) = sin(pi*t)/(pi*t), sinc(0) = 1 */
  sinc(t: number): number {
    if (t === 0) return 1;
    const x = Math.PI * t;
    return Math.sin(x) / x;
  },
  /** Discrete approximation of the Dirac delta (placeholder for teaching) */
  delta(t: number): number {
    return Math.abs(t) < 1e-9 ? 1 : 0;
  }
}, { override: true });

// ---------- LaTeX text preprocessing ----------

/** Convert a LaTeX expression into a mathjs-parsable string. */
export function latexToMath(latex: string): string {
  let s = latex.trim();

  // Strip \left and \right
  s = s.replace(/\\left/g, '').replace(/\\right/g, '');

  // \frac{a}{b} -> ((a)/(b)); loop for nested fractions
  let prev = '';
  while (prev !== s) {
    prev = s;
    s = s.replace(/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '(($1)/($2))');
  }

  // \sqrt{a} -> sqrt(a); \sqrt[n]{a} -> nthRoot(a, n)
  prev = '';
  while (prev !== s) {
    prev = s;
    s = s.replace(/\\sqrt\s*\[([^\]]+)\]\s*\{([^{}]*)\}/g, 'nthRoot(($2),($1))');
    s = s.replace(/\\sqrt\s*\{([^{}]*)\}/g, 'sqrt(($1))');
  }

  // e^{...} -> exp(...)
  s = s.replace(/\be\s*\^\s*\{([^{}]*)\}/g, 'exp(($1))');
  s = s.replace(/\be\s*\^\s*([a-zA-Z0-9_.]+)/g, 'exp($1)');

  // ^{...} -> ^(...)
  prev = '';
  while (prev !== s) {
    prev = s;
    s = s.replace(/\^\s*\{([^{}]*)\}/g, '^($1)');
  }

  // \sin -> sin, \cos -> cos, ...
  const fnMap: Record<string, string> = {
    sin: 'sin', cos: 'cos', tan: 'tan',
    arcsin: 'asin', arccos: 'acos', arctan: 'atan',
    sinh: 'sinh', cosh: 'cosh', tanh: 'tanh',
    exp: 'exp', log: 'log10', ln: 'log',
    abs: 'abs', sgn: 'sign', sign: 'sign',
    sinc: 'sinc',
    Re: 're', Im: 'im',
    Heaviside: 'heaviside'
  };
  for (const k of Object.keys(fnMap)) {
    const re = new RegExp(`\\\\${k}\\b`, 'g');
    s = s.replace(re, fnMap[k]);
  }

  // \mathrm{xxx} / \operatorname{xxx} / \text{xxx} -> xxx
  s = s.replace(/\\mathrm\s*\{([^{}]*)\}/g, '$1');
  s = s.replace(/\\operatorname\s*\{([^{}]*)\}/g, '$1');
  s = s.replace(/\\text\s*\{([^{}]*)\}/g, '$1');

  // Greek letters -> their pinyin/name
  const greek = [
    'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta',
    'eta', 'theta', 'iota', 'kappa', 'lambda', 'mu',
    'nu', 'xi', 'pi', 'rho', 'sigma', 'tau',
    'upsilon', 'phi', 'chi', 'psi', 'omega',
    'Gamma', 'Delta', 'Theta', 'Lambda', 'Pi', 'Sigma', 'Phi', 'Psi', 'Omega'
  ];
  for (const g of greek) {
    s = s.replace(new RegExp(`\\\\${g}\\b`, 'g'), g);
  }

  // Operators
  s = s.replace(/\\cdot/g, '*');
  s = s.replace(/\\times/g, '*');
  s = s.replace(/\\div/g, '/');
  s = s.replace(/\\pm/g, '+');
  s = s.replace(/\\ast/g, '*');

  // Drop any remaining backslashes; keep the bare name
  s = s.replace(/\\([a-zA-Z]+)/g, '$1');

  // Insert implicit multiplication (e.g. 2pi -> 2*pi, )( -> )*( )
  s = insertImplicitMultiplication(s);

  // Tidy whitespace
  s = s.replace(/\s+/g, ' ').trim();

  return s;
}

/** Function names that must NOT be split by the implicit-multiplication pass. */
const KNOWN_FUNCTIONS = new Set([
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
  'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh',
  'exp', 'log', 'log10', 'log2', 'ln',
  'abs', 'sqrt', 'cbrt', 'nthRoot', 'pow',
  'floor', 'ceil', 'round', 'sign', 'sgn',
  'sinc', 'rect', 'tri', 'u', 'heaviside', 'delta',
  're', 'im', 'arg', 'conj',
  'min', 'max', 'mean', 'sum'
]);

function insertImplicitMultiplication(s: string): string {
  let prev = '';
  let cur = s;
  let safety = 0;
  while (prev !== cur && safety++ < 8) {
    prev = cur;
    // digit + letter/openParen: 2pi, 2(, 2.5x
    cur = cur.replace(/(\d(?:\.\d+)?)\s*([a-zA-Z(])/g, '$1*$2');
    // closeParen + letter/openParen/digit: )x, )(, )2
    cur = cur.replace(/(\))\s*([a-zA-Z(0-9])/g, '$1*$2');
    // letter(s) + space + letter: pi t -> pi*t (skip when first token is a function)
    cur = cur.replace(/([a-zA-Z_]+)\s+([a-zA-Z_])/g, (_m: string, a: string, b: string) => {
      if (KNOWN_FUNCTIONS.has(a)) return `${a} ${b}`;
      return `${a}*${b}`;
    });
    // pi(...) / e(...) -> pi*(...) / e*(...)  (constants, not functions)
    cur = cur.replace(/\b(pi|e)\s*\(/g, '$1*(');
  }
  return cur;
}

/** Detect the free variable used in the expression: defaults to 't' (continuous) or 'n' (discrete). */
export function detectVariable(expr: string, hint?: 'continuous' | 'discrete'): 't' | 'n' {
  const hasT = /\bt\b/.test(expr);
  const hasN = /\bn\b/.test(expr);
  // Whatever appears in the expression wins.
  if (hasT && !hasN) return 't';
  if (hasN && !hasT) return 'n';
  // Otherwise fall back to the hint.
  if (hint === 'discrete') return 'n';
  return 't';
}

// ---------- Compile + evaluate ----------

export interface CompiledFormula {
  /** Raw user input */
  raw: string;
  /** Normalised mathjs expression */
  normalized: string;
  /** Detected free variable name */
  variable: 't' | 'n';
  /** Compiled mathjs expression */
  evalFn: EvalFunction;
}

/**
 * Compile a formula and probe-evaluate it once to surface syntax errors early.
 */
export function compileFormula(raw: string, variable: 't' | 'n' = 't'): CompiledFormula {
  const normalized = latexToMath(raw);
  if (!normalized) throw new Error('Empty formula');
  const evalFn = math.compile(normalized);
  try {
    const probe = evalFn.evaluate({ [variable]: 0, t: 0, n: 0, pi: Math.PI });
    if (typeof probe !== 'number' && (typeof probe !== 'object' || !probe || typeof (probe as any).re !== 'number')) {
      throw new Error('Formula must evaluate to a real or complex number');
    }
  } catch (err: any) {
    throw new Error(`Cannot evaluate formula: ${err.message}`);
  }
  return { raw, normalized, variable, evalFn };
}

/** Evaluate a compiled formula on a numeric grid; complex outputs collapse to their real part. */
export function evaluateFormula(formula: CompiledFormula, xs: ArrayLike<number>): Float32Array {
  const out = new Float32Array(xs.length);
  const scope: Record<string, number> = { pi: Math.PI };
  for (let i = 0; i < xs.length; i++) {
    scope[formula.variable] = xs[i];
    scope.t = xs[i];
    scope.n = xs[i];
    try {
      const v = formula.evalFn.evaluate(scope);
      if (typeof v === 'object' && v !== null && 're' in v) {
        out[i] = (v as any).re;
      } else {
        out[i] = Number(v);
      }
    } catch {
      out[i] = NaN;
    }
  }
  return out;
}
