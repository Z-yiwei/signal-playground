/** Encode/decode the store snapshot in the URL hash for shareable links. */
import { store } from '@/core/store';

const HASH_PREFIX = '#cfg=';

export function readSnapshotFromURL(): boolean {
  const hash = window.location.hash;
  if (!hash.startsWith(HASH_PREFIX)) return false;
  const encoded = hash.slice(HASH_PREFIX.length);
  return store.hydrate(encoded);
}

export function writeSnapshotToURL(): string {
  const encoded = store.serialize();
  const url = `${window.location.origin}${window.location.pathname}${HASH_PREFIX}${encoded}`;
  history.replaceState(null, '', `${HASH_PREFIX}${encoded}`);
  return url;
}

export async function copyShareLink(): Promise<string> {
  const url = writeSnapshotToURL();
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    // ignore
  }
  return url;
}
