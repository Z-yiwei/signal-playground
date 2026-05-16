/** Minimal type declarations for third-party libraries without their own .d.ts. */

declare module 'plotly.js-dist-min' {
  const Plotly: any;
  export default Plotly;
  export const newPlot: any;
  export const react: any;
  export const purge: any;
  export const downloadImage: any;
  export const toImage: any;
}

declare module 'mathjs' {
  export function create(all: any, config?: any): any;
  export const all: any;
}

declare module 'fft.js' {
  const FFT: any;
  export default FFT;
}

declare module 'katex' {
  const katex: {
    render: (latex: string, el: HTMLElement, options?: any) => void;
    renderToString: (latex: string, options?: any) => string;
  };
  export default katex;
}

declare module 'katex/dist/katex.min.css';
