/**
 * i18n runtime: singleton language state, t() with {placeholder} substitution,
 * subscribe() for language-change notifications, and localStorage persistence.
 */
import { DICT, type Lang, SUPPORTED_LANGS } from './dict';

const STORAGE_KEY = 'spg-lang';

function detectInitialLang(): Lang {
  // 1. URL parameter ?lang=xx wins.
  try {
    const u = new URL(window.location.href);
    const q = u.searchParams.get('lang') as Lang | null;
    if (q && SUPPORTED_LANGS.includes(q)) return q;
  } catch { /* SSR fallback */ }
  // 2. localStorage
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
  } catch { /* private mode */ }
  // 3. Browser default
  const nav = (navigator?.language ?? 'en').toLowerCase();
  if (nav.startsWith('zh')) return 'zh';
  return 'en';
}

class I18n {
  private lang: Lang = detectInitialLang();
  private listeners = new Set<(l: Lang) => void>();

  current(): Lang {
    return this.lang;
  }

  set(lang: Lang): void {
    if (!SUPPORTED_LANGS.includes(lang)) return;
    if (lang === this.lang) return;
    this.lang = lang;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ }
    // Keep <html lang> in sync.
    try { document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'; } catch { /* ignore */ }
    this.listeners.forEach((cb) => cb(lang));
  }

  toggle(): void {
    this.set(this.lang === 'en' ? 'zh' : 'en');
  }

  /**
   * Translate a key with optional {placeholder} substitution.
   * Falls back to English then to the raw key if the lookup misses.
   */
  t(key: string, vars?: Record<string, string | number>): string {
    let msg = DICT[this.lang]?.[key] ?? DICT.en[key] ?? key;
    if (vars) {
      msg = msg.replace(/\{(\w+)\}/g, (_, k) => {
        const v = vars[k];
        return v === undefined ? `{${k}}` : String(v);
      });
    }
    return msg;
  }

  subscribe(cb: (l: Lang) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
}

export const i18n = new I18n();

/** Convenience alias for i18n.t(). */
export const t = (key: string, vars?: Record<string, string | number>): string => i18n.t(key, vars);

// Keep <html lang> in sync on first load.
try { document.documentElement.lang = i18n.current() === 'zh' ? 'zh-CN' : 'en'; } catch { /* ignore */ }

export type { Lang };
