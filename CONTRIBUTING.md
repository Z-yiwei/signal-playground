# 🤝 Contributing to Signal Playground

Thanks for considering a contribution! This guide shows you how to **add a new transform,
signal source, or visualizer in 5 minutes** — that's the whole point of the architecture.

## Setup

```bash
git clone https://github.com/<you>/signal-playground.git
cd signal-playground
npm install
npm run dev
```

## Add a New Transform (e.g. DWT, Hilbert, ...)

### Step 1 — Implement `ITransform`

Create `src/domains/signal/transforms/MyTransform.ts`:

```ts
import type { ITransform, DataBuffer } from '@/core/types';

export const MyTransform: ITransform = {
  id: 'my-transform',
  name: 'My Awesome Transform',
  description: 'Short description shown in tooltips',
  inputDomain: 'time',
  outputDomain: 'frequency',
  supportedDimensions: [1],
  isComplexOutput: false,            // true → output ComplexBuffer
  params: [                          // auto-generates UI sliders/dropdowns
    { name: 'order', type: 'number', default: 4, min: 1, max: 16, step: 1, label: 'Order' }
  ],
  async forward(input, params) {
    // your math here
    return {
      data: /* Float32Array */,
      shape: [/* N */],
      dtype: 'float32',
      metadata: { ...input.metadata, domain: 'frequency' }
    };
  }
  // optional: inverse(input, params) { ... }
};
```

### Step 2 — Register it

Open `src/domains/signal/index.ts` and add **two lines**:

```ts
import { MyTransform } from './transforms/MyTransform';
// ...
[DFT, DCT, STFT, MyTransform].forEach((t) => transformRegistry.register(t));
```

### Step 3 — Done.

The transform appears in the dropdown, parameters auto-render, and the visualizer picks
itself based on `outputDomain` and `isComplexOutput`. No UI code required.

## Add a New Signal Source

Same pattern — implement `IDataSource` in `src/domains/signal/sources/`, register in `index.ts`.

## Add a New Visualizer

Implement `IVisualizer` in `src/visualizers/` and use it from `PlotGrid` for a specific
output domain.

## Add a Teaching Preset

Implement `IPreset` in `src/domains/signal/presets/` — describe a memorable combination of
source + transform + parameters. Great presets are short, illustrative, and tell a story.

## Code Style

- TypeScript strict mode is on — please keep it green.
- Run `npm run typecheck` before opening a PR.
- Prefer **pure functions** for math; keep DOM/UI separate.
- Use `Float32Array` for numeric buffers (worker-transferable later).

## Pull Request Checklist

- [ ] Code compiles (`npm run build`)
- [ ] No new TypeScript errors
- [ ] New plugin registers in the corresponding `index.ts`
- [ ] Added a brief mention in `README.md` if user-facing
- [ ] (Bonus) New teaching preset that exercises the new feature

Thanks again — happy hacking! 🌊
