/**
 * Generic plugin registry. Sources, transforms, windows, visualisers and presets
 * are all stored here so the main loop only depends on stable interfaces.
 */

import type {
  IDataSource,
  ITransform,
  IVisualizer,
  IWindow,
  IPreset
} from './types';

export class Registry<T extends { id: string }> {
  private items = new Map<string, T>();

  register(item: T): void {
    if (this.items.has(item.id)) {
      console.warn(`[Registry] Duplicate id: ${item.id}, overwriting.`);
    }
    this.items.set(item.id, item);
  }

  unregister(id: string): boolean {
    return this.items.delete(id);
  }

  get(id: string): T | undefined {
    return this.items.get(id);
  }

  has(id: string): boolean {
    return this.items.has(id);
  }

  list(filter?: (item: T) => boolean): T[] {
    const all = [...this.items.values()];
    return filter ? all.filter(filter) : all;
  }

  size(): number {
    return this.items.size;
  }

  clear(): void {
    this.items.clear();
  }
}

// Global singleton registries.

export const sourceRegistry = new Registry<IDataSource>();
export const transformRegistry = new Registry<ITransform>();
export const visualizerRegistry = new Registry<IVisualizer>();
export const windowRegistry = new Registry<IWindow>();
export const presetRegistry = new Registry<IPreset>();
