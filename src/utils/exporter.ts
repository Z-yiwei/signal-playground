/** CSV / PNG export utilities. */
import type { DataBuffer, ComplexBuffer } from '@/core/types';

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function bufferToCSV(
  buf: DataBuffer | ComplexBuffer,
  xValues?: ArrayLike<number>
): string {
  const lines: string[] = [];
  if ('real' in buf) {
    lines.push('index,x,real,imag,magnitude,phase');
    const N = buf.real.length;
    for (let i = 0; i < N; i++) {
      const x = xValues ? (xValues as ArrayLike<number>)[i] ?? i : i;
      const re = buf.real[i], im = buf.imag[i];
      const mag = Math.hypot(re, im);
      const ph = Math.atan2(im, re);
      lines.push(`${i},${x},${re},${im},${mag},${ph}`);
    }
  } else {
    lines.push('index,x,value');
    for (let i = 0; i < buf.data.length; i++) {
      const x = xValues ? (xValues as ArrayLike<number>)[i] ?? i : i;
      lines.push(`${i},${x},${buf.data[i]}`);
    }
  }
  return lines.join('\n');
}

export function exportCSV(
  buf: DataBuffer | ComplexBuffer,
  filename = 'signal-playground.csv',
  xValues?: ArrayLike<number>
): void {
  const csv = bufferToCSV(buf, xValues);
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), filename);
}
