/**
 * Schema-driven parameter form.
 * Number fields use slider + number input (two-way synced); enums become
 * dropdowns and booleans become checkboxes. Labels are translated through
 * paramLabel / paramDescription / paramOptionLabel.
 */
import type { ParamSchema, ParamValues } from '@/core/types';
import { paramLabel, paramDescription, paramOptionLabel } from '@/i18n/display';

export interface ParameterFormOptions {
  schemas: ParamSchema[];
  values: ParamValues;
  /** Owning source/transform id, used to disambiguate shared param names. */
  contextId?: string;
  onChange: (name: string, value: number | string | boolean) => void;
}

export class ParameterForm {
  private root: HTMLElement;
  private inputs = new Map<string, HTMLInputElement | HTMLSelectElement>();

  constructor(private opts: ParameterFormOptions) {
    this.root = document.createElement('div');
    this.root.className = 'param-form';
    this.build();
  }

  get element(): HTMLElement {
    return this.root;
  }

  private build(): void {
    this.root.innerHTML = '';
    this.inputs.clear();
    for (const schema of this.opts.schemas) {
      this.root.appendChild(this.buildField(schema));
    }
  }

  private buildField(schema: ParamSchema): HTMLElement {
    const value = this.opts.values[schema.name] ?? schema.default;
    const wrap = document.createElement('div');
    wrap.className = 'param-field';

    const labelRow = document.createElement('div');
    labelRow.className = 'param-label-row';
    const label = document.createElement('label');
    label.textContent = paramLabel(schema, this.opts.contextId);
    label.title = paramDescription(schema, this.opts.contextId);
    labelRow.appendChild(label);

    if (schema.unit) {
      const unitTag = document.createElement('span');
      unitTag.className = 'param-unit';
      unitTag.textContent = schema.unit;
      labelRow.appendChild(unitTag);
    }
    wrap.appendChild(labelRow);

    if (schema.type === 'enum') {
      wrap.appendChild(this.buildEnum(schema, value));
    } else if (schema.type === 'boolean') {
      wrap.appendChild(this.buildBoolean(schema, value));
    } else {
      // number / range -- slider + number input combo
      wrap.appendChild(this.buildNumber(schema, Number(value)));
    }
    return wrap;
  }

  private buildEnum(schema: ParamSchema, value: number | string | boolean): HTMLElement {
    const sel = document.createElement('select');
    sel.className = 'param-input';
    for (const opt of schema.options ?? []) {
      const o = document.createElement('option');
      o.value = opt.value;
      o.textContent = paramOptionLabel(schema.name, opt.value, opt.label);
      if (String(value) === opt.value) o.selected = true;
      sel.appendChild(o);
    }
    sel.addEventListener('change', () => {
      this.opts.onChange(schema.name, sel.value);
    });
    this.inputs.set(schema.name, sel);
    return sel;
  }

  private buildBoolean(schema: ParamSchema, value: number | string | boolean): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'param-bool';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'param-checkbox';
    cb.checked = Boolean(value);
    const txt = document.createElement('span');
    txt.className = 'param-bool-text';
    txt.textContent = cb.checked ? 'on' : 'off';
    cb.addEventListener('change', () => {
      this.opts.onChange(schema.name, cb.checked);
      txt.textContent = cb.checked ? 'on' : 'off';
    });
    wrap.appendChild(cb);
    wrap.appendChild(txt);
    this.inputs.set(schema.name, cb);
    return wrap;
  }

  private buildNumber(schema: ParamSchema, initial: number): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'param-number';

    const sliderMin = schema.min ?? 0;
    const sliderMax = schema.max ?? 100;
    const step = schema.step ?? 1;

    // Slider (coarse)
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'param-slider';
    slider.min = String(sliderMin);
    slider.max = String(sliderMax);
    slider.step = String(step);
    slider.value = String(this.clampForSlider(initial, sliderMin, sliderMax));

    // Numeric input (precise; allows out-of-range values)
    const num = document.createElement('input');
    num.type = 'number';
    num.className = 'param-numinput';
    num.step = String(step);
    num.value = String(initial);
    num.title = `Range: [${sliderMin}, ${sliderMax}] (you can also type values outside)`;
    num.inputMode = 'decimal';

    // Slider -> number input
    slider.addEventListener('input', () => {
      const v = Number(slider.value);
      num.value = String(v);
      this.opts.onChange(schema.name, v);
    });

    // Number input -> slider
    const commit = () => {
      const raw = num.value.trim();
      if (raw === '' || raw === '-' || raw === '.') return;
      const v = Number(raw);
      if (!Number.isFinite(v)) {
        num.value = String(initial);
        return;
      }
      // Number input may exceed slider bounds; the slider just clamps for display.
      slider.value = String(this.clampForSlider(v, sliderMin, sliderMax));
      this.opts.onChange(schema.name, v);
    };
    num.addEventListener('input', commit);
    num.addEventListener('change', commit);
    num.addEventListener('blur', commit);

    wrap.appendChild(slider);
    wrap.appendChild(num);
    this.inputs.set(schema.name, num);
    return wrap;
  }

  private clampForSlider(v: number, min: number, max: number): number {
    if (!Number.isFinite(v)) return min;
    if (v < min) return min;
    if (v > max) return max;
    return v;
  }

  /** Replace schemas + values and rebuild (e.g. after a preset is applied). */
  update(schemas: ParamSchema[], values: ParamValues): void {
    this.opts.schemas = schemas;
    this.opts.values = values;
    this.build();
  }
}
