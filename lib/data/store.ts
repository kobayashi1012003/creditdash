"use client";

import {
  emptyState,
  parseStored,
  seededState,
  STORAGE_KEY,
  type Persisted,
} from "@/lib/data/schema";

/**
 * The browser-storage backing for lib/data.
 *
 * Nothing outside lib/data imports this. Phase 6 replaces the four functions
 * at the bottom with Supabase calls and the public API in index.ts, along
 * with every page, stays as it is.
 */

type Listener = () => void;

const listeners = new Set<Listener>();

/**
 * Cached so getSnapshot can return a stable reference. useSyncExternalStore
 * compares snapshots by identity and would loop forever if this parsed
 * storage afresh on every call.
 */
let cache: Persisted | null = null;

/** Set once storage has actually been read, so the UI can show a skeleton. */
let loaded = false;

function read(): Persisted {
  if (cache) return cache;

  let next: Persisted;
  try {
    const stored = parseStored(window.localStorage.getItem(STORAGE_KEY));
    if (stored) {
      next = stored;
    } else {
      // First visit, or storage held something unusable. Seed rather than
      // show an empty shell.
      next = seededState();
      persist(next);
    }
  } catch {
    // Private mode, blocked site data, or a quota error. The app still works
    // for this session; it just will not be remembered.
    next = seededState();
  }

  cache = next;
  loaded = true;
  return next;
}

function persist(state: Persisted) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Saving is best effort. Losing it is better than crashing on it.
  }
}

function emit() {
  for (const l of listeners) l();
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  // Another tab writing the same key should move this one too.
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cache = null;
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getSnapshot(): Persisted {
  return read();
}

/**
 * The server has no storage, so it renders the loading state. A stable
 * frozen object keeps the snapshot identity constant across calls.
 */
const SERVER_SNAPSHOT = Object.freeze(emptyState());

export function getServerSnapshot(): Persisted {
  return SERVER_SNAPSHOT;
}

export function isLoaded() {
  return loaded;
}

/**
 * Apply a change. Async on purpose: localStorage is synchronous but Supabase
 * will not be, and every call site already awaiting means Phase 6 is a change
 * inside this file rather than across the app.
 */
export async function mutate(
  fn: (current: Persisted) => Persisted,
): Promise<void> {
  const next = fn(read());
  cache = next;
  persist(next);
  emit();
}

/** Wipes everything this browser holds, leaving a genuinely empty wallet. */
export async function clearAll(): Promise<void> {
  const next = emptyState();
  cache = next;
  persist(next);
  emit();
}
