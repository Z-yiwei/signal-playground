/** Compile mathjs expressions and evaluate them on numeric grids. */
import { create, all } from 'mathjs';

const math = create(all, { number: 'number' });

// Inject the DSP helper functions mathjs lacks.
math.import(
  {
    sinc: (x: number) => {
      if (x === 0) return 1;
      const px = Math.PI * x;
      return Math.sin(px) / px;
    },
    u: (x: number) => (x >= 0 ? 1 : 0),
    heaviside: (x: number) => (x >= 0 ? 1 : 0),
    rect: (x: number) => (Math.abs(x) < 0.5 ? 1 : Math.abs(x) === 0.5 ? 0.5 : 0),
    tri: (x: number) => (Math.abs(x) >= 1 ? 0 : 1 - Math.abs(x)),
    sgn: (x: number) => (x > 0 ? 1 : x < 0 ? -1 : 0),
    delta: (x: number) => (x === 0 ? 1 : 0)
  },
  { override: true }
);

export interface CompiledExpr {
  evaluate: (scope: Record<string, number>) => number;
}

/** Compile an expression with graceful error reporting. */
export function compileExpression(expr: string): { compiled: CompiledExpr | null; error: string | null } {
  try {
    const c = math.compile(expr);
    return { compiled: c as unknown as CompiledExpr, error: null };
  } catch (e: any) {
    return { compiled: null, error: e?.message ?? String(e) };
  }
}

/**
 * Evaluate a compiled expression on a numeric grid.
 *
 * Both `t` and `n` are injected into scope when a companion variable is provided,
 * so the same formula works in continuous and discrete modes (t = n / fs).
 *
 * @param compiled  Compiled mathjs expression
 * @param varName   Primary independent variable name
 * @param grid      Values for the primary variable
 * @param companion Optional companion variable and its parallel values
 */
export function evaluateOnGrid(
  compiled: CompiledExpr,
  varName: string,
  grid: ArrayLike<number>,
  companion?: { name: string; values: ArrayLike<number> }
): Float32Array {
  const N = grid.length;
  const out = new Float32Array(N);
  const scope: Record<string, number> = { pi: Math.PI, e: Math.E };
  for (let i = 0; i < N; i++) {
    scope[varName] = grid[i];
    if (companion) scope[companion.name] = companion.values[i];
    try {
      const v = compiled.evaluate(scope);
      out[i] = typeof v === 'number' && Number.isFinite(v) ? v : 0;
    } catch {
      out[i] = 0;
    }
  }
  return out;
}
