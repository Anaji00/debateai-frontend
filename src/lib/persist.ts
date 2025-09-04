/**
 * This module handles all persistence logic for debate sessions using the browser's
 * `localStorage`. It's designed to be a self-contained "service" for creating,
 * reading, updating, and deleting sessions on the client-side.
 *
 * It uses a user-specific namespace to allow multiple users on the same browser
 * to have their own separate session histories.
 */
import type { Message } from "../lib/chat";

const EVT = "debateai:sessions";
function notify(userId: string) {
  window.dispatchEvent(new CustomEvent(EVT, { detail: { userId } }));
}

export function onSessionsChanged(
  handler: (userId: string) => void

): () => void {
  const fn = (e: Event) => {
    const ce = e as CustomEvent<{ userId: string }>;
    if (ce?.detail?.userId) handler(ce.detail.userId);
  };
  window.addEventListener(EVT, fn);
  return () => window.removeEventListener(EVT, fn);
}
/** Lightweight session metadata, used for listing sessions without loading all messages. */
export interface SessionMeta {
  id: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

/** The full session object, including all messages. This is what gets stored per-session. */
export interface StoredSession extends SessionMeta {
  messages: Message[];
}

// --- localStorage Key Management ---

/** A namespace to prevent key collisions with other apps on the same domain. */
const NS = "debateai/v1";
/** Key for storing the ID of the user's most recently active session. */
const LS_LAST = (userId: string) => `${NS}/last/${userId}`;
/** Key for storing the array of all session metadata for a user. */
const LS_META = (userId: string) => `${NS}/meta/${userId}`;
/** Key for storing the full data of a single session. */
const LS_SESSION = (userId:string, id: string) => `${NS}/sessions/${userId}/${id}`;

/** Returns the current timestamp as a number. */
function now() {
  return Date.now();
}

/** Retrieves the ID of the last active session for a given user. */
export function getLastSessionId(userId: string): string | null {
  return localStorage.getItem(LS_LAST(userId)) || null;
}

/** Sets the ID of the last active session for a given user. */
export function setLastSessionId(userId: string, id: string) {
  localStorage.setItem(LS_LAST(userId), id);
  notify(userId);
}

/**
 * Lists all session metadata for a user, sorted by most recently updated.
 * This is fast because it reads a single list of metadata, not every full session.
 */
export function listLocalSessions(userId: string): SessionMeta[] {
  const raw = localStorage.getItem(LS_META(userId));
  const arr: SessionMeta[] = raw ? JSON.parse(raw) : [];
  return arr.sort((a, b) => b.updatedAt - a.updatedAt);
}

/** (Internal) Writes the entire metadata array back to localStorage. */
function writeMeta(userId: string, meta: SessionMeta[]) {
  localStorage.setItem(LS_META(userId), JSON.stringify(meta));
  notify(userId);
}

/** (Internal) Updates or inserts a metadata entry into the list. */
function upsertMeta(userId: string, meta: SessionMeta) {
  const all = listLocalSessions(userId);
  const idx = all.findIndex((s) => s.id === meta.id);
  if (idx >= 0) {
    all[idx] = meta;
  } else {
    all.unshift(meta); // Add new sessions to the top
  }
  writeMeta(userId, all);
}
export function loadSession(userId: string, id: string): StoredSession | null {
    const raw = localStorage.getItem(LS_SESSION(userId, id));
    if (!raw) return null;
    try { return JSON.parse(raw) as StoredSession; } catch {return null;}
}
export function saveSession(userId: string, s: StoredSession) {
  const meta: SessionMeta = {
    id: s.id,
    userId,
    title: s.title,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
  
  localStorage.setItem(LS_SESSION(userId, s.id), JSON.stringify(s));
  upsertMeta(userId, meta);
  setLastSessionId(userId, s.id);
}

/**
 * Renames a session by loading it, changing its title, and saving it back.
 * @param userId The user who owns the session.
 * @param id The ID of the session to rename.
 * @param title The new title for the session.
 */
export function renameSession(userId: string, id: string, title: string) {
  const s = loadSession(userId, id);
  if (!s) return;
  s.title = title;
  s.updatedAt = now();
  saveSession(userId, s);
}

/** Delete one session. */
 export function deleteSession(userId: string, id: string) {
   // Remove from the metadata list
   const all = listLocalSessions(userId).filter((s) => s.id !== id);
   writeMeta(userId, all);
   // Remove the full session data
   localStorage.removeItem(LS_SESSION(userId, id));
   // If it was the last active session, clear that pointer
   const last = getLastSessionId(userId);
   if (last === id) localStorage.removeItem(LS_LAST(userId));
   notify(userId);
 }
 
 /**
  * Creates a new session object in memory.
  * @param userId The user creating the session.
  * @param id A unique ID for the new session.
  * @param firstUserText The initial text from the user, used to generate a title.
  * @returns A new `StoredSession` object, ready to be saved.
  */
 export function newSessionFromSeed(userId: string, id: string, firstUserText: string): StoredSession {
  const t = now();
  const title = firstUserText?.slice(0, 60) || "New chat";
  return { id, userId, title, createdAt: t, updatedAt: t, messages: [] };
}

/**
 * A simple debounce utility. It delays invoking a function until after `ms`
 * milliseconds have elapsed since the last time it was invoked. Useful for
 * operations like auto-saving.
 */
export function debounce<T extends (...args: any[]) => void>(fn: T, ms = 300) {
  let t: any;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
