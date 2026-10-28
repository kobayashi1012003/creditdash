"use client";

import {
  emptyState,
  parseStored,
  SCHEMA_VERSION,
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

/**
 * True once a read or a write has failed. Private mode, blocked site data
 * and a full quota all end up here. The app keeps working from memory, but
 * nothing will survive a reload, and saying so is the difference between a
 * notice now and a lost wallet later.
 */
let unsaved = false;

function read(): Persisted {
  if (cache) return cache;

  let next: Persisted;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const stored = parseStored(raw);
    if (stored) {
      next = stored;
      // parseStored may have migrated an older payload. Write the result
      // back, or every future load would migrate the same stale data again
      // and the stored version would never move forward.
      if (!raw?.includes(`"version":${SCHEMA_VERSION}`)) {
        persist(next);
      }
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
    unsaved = true;
  }

  cache = next;
  loaded = true;
  return next;
}

function persist(state: Persisted) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    // A later write succeeding means the problem has cleared, for example
    // after space was freed.
    unsaved = false;
  } catch {
    // Losing a save is better than crashing on it, but it is not silent:
    // the shell reads this flag and tells the user.
    unsaved = true;
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

export function isUnsaved() {
  return unsaved;
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
