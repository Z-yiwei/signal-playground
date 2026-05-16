/** Minimal pub/sub event bus that decouples UI from compute. */

type Handler<T = unknown> = (payload: T) => void;

class EventBus {
  private handlers = new Map<string, Set<Handler>>();

  on<T = unknown>(event: string, handler: Handler<T>): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler as Handler);
    return () => this.off(event, handler);
  }

  off<T = unknown>(event: string, handler: Handler<T>): void {
    this.handlers.get(event)?.delete(handler as Handler);
  }

  emit<T = unknown>(event: string, payload?: T): void {
    this.handlers.get(event)?.forEach((h) => {
      try {
        h(payload as T);
      } catch (err) {
        console.error(`[EventBus] handler error for "${event}":`, err);
      }
    });
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const eventBus = new EventBus();

// Event-name constants to avoid typos.
export const Events = {
  ParamsChange: 'params:change',
  PresetApply: 'preset:apply',
  PipelineRun: 'pipeline:run',
  PipelineDone: 'pipeline:done',
  PipelineError: 'pipeline:error',
  StatusUpdate: 'status:update',
  ExportPNG: 'export:png',
  ExportCSV: 'export:csv'
} as const;
