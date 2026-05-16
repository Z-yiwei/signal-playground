/** Tiny shared helpers. */

export function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timer: number | null = null;
  return ((...args: any[]) => {
    if (timer !== null) window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), ms);
  }) as T;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
