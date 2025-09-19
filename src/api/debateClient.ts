// src/api/useDebate.ts
import { streamJSON } from "../lib/stream";

/** All debate calls now go through the proxy on 8080 in dev. */
export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";

/** TTS types */
export type TtsReady = { state: "ready"; audio_url?: string; filename?: string };
export type TtsError = { state: "error"; message: string };
export type TtsResp = TtsReady | TtsError;

function toAbsoluteAudioUrl(u: string): string {
  if (u.startsWith("http://") || u.startsWith("https://") || u.startsWith("data:")) return u;
  if (u.startsWith("/")) return `${API_BASE}${u}`;
  return `${API_BASE}/${u}`;
}

/** NDJSON events */
export type JsonlEvent =
  | { type: "session"; session_id: number }
  | { type: "turn"; turn_id: number; speaker: string }
  | { type: "sources"; turn_id: number; speaker: string; items: any[] }
  | { type: "delta"; turn_id: number; speaker: string; delta: string }
  | { type: "endturn"; turn_id: number; speaker: string }
  | { type: "error"; message: string };

export type ChatHistoryItem = { role: "user" | "assistant"; content: string };
export type ChatHistory = ChatHistoryItem[];
export type SpeakerTurn = [string, string];

/** Post + stream (NDJSON) with cookies */
async function postAndStream(
  path: string,
  body: unknown,
  onEvent: (evt: JsonlEvent) => void,
  signal?: AbortSignal
) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/x-ndjson"
    },
    body: JSON.stringify(body ?? {}),
    signal,
    credentials: "include",       // ✅ send cookies (session auth)
    cache: "no-store",            // (dev) avoid any proxy/browser caching
  });
  await streamJSON(res, (e) => onEvent(e as JsonlEvent), { signal });
}

/* ============================ SOLO ============================ */

export function soloStartStream(p: {
  character: string; topic: string; history?: ChatHistory;
  onEvent: (evt: JsonlEvent) => void; signal?: AbortSignal;
}) {
  return postAndStream("/debate/solo/start", p, p.onEvent, p.signal);
}

export function soloInjectStream(p: {
  session_id: number; user_inject: string;
  onEvent: (evt: JsonlEvent) => void; signal?: AbortSignal;
}) {
  return postAndStream("/debate/solo/inject", p, p.onEvent, p.signal);
}

/* ====================== DEVIL'S ADVOCATE ====================== */

export function daStartStream(p: {
  character: string; thesis: string; history?: ChatHistory;
  onEvent: (evt: JsonlEvent) => void; signal?: AbortSignal;
}) {
  return postAndStream("/debate/da/start", p, p.onEvent, p.signal);
}

export function daInjectStream(p: {
  session_id: number; user_inject: string;
  onEvent: (evt: JsonlEvent) => void; signal?: AbortSignal;
}) {
  return postAndStream("/debate/da/inject", p, p.onEvent, p.signal);
}

/* =========================== VERSUS =========================== */

export function versusStartStream(p: {
  c1: string; c2: string; topic: string; history?: ChatHistory;
  onEvent: (evt: JsonlEvent) => void; signal?: AbortSignal;
}) {
  return postAndStream("/debate/versus/start", p, p.onEvent, p.signal);
}

export function versusInjectStream(p: {
  session_id: number; user_inject: string; addressed_to?: string[];
  onEvent: (evt: JsonlEvent) => void; signal?: AbortSignal;
}) {
  return postAndStream("/debate/versus/inject", p, p.onEvent, p.signal);
}

/* ============= NON-STREAM: summary, grade, voice, docs ========= */

function withCreds(init?: RequestInit): RequestInit {
  return { credentials: "include", cache: "no-store", ...(init ?? {}) };
}

export async function fetchSummary(session_id: number, style: "concise" | "detailed" = "concise") {
  const res = await fetch(`${API_BASE}/debate/summary`, withCreds({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload: { session_id, style } }),
  }));
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ ok: boolean; session_id: number; summary: unknown }>;
}

export async function fetchGrade(
  session_id: number,
  weights?: Partial<Record<"logic" | "evidence" | "rebuttal" | "clarity" | "persuasion", number>>,
  style: "balanced" | "harsh" | "kind" = "balanced",
  target: "user" | "all" | string = "user"
) {
  const res = await fetch(`${API_BASE}/debate/grade`, withCreds({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload: { session_id, weights, style, target } }),
  }));
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ ok: boolean; session_id: number; grading: unknown }>;
}

export async function postVoice(turnId: number, signal?: AbortSignal): Promise<TtsReady> {
  const res = await fetch(`${API_BASE}/debate/voice/${turnId}`, withCreds({ method: "POST", signal }));
  const ctype = res.headers.get("content-type") || "";
  if (res.ok && ctype.startsWith("audio/")) {
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    return { state: "ready", audio_url: url };
  }
  if (!res.ok) throw new Error(await res.text());
  const body = (await res.json()) as TtsResp;
  if ((body as TtsError).state === "error") throw new Error((body as TtsError).message || "TTS failed");

  const ok = body as TtsReady;
  if (ok.audio_url) ok.audio_url = toAbsoluteAudioUrl(ok.audio_url);
  if (!ok.audio_url && ok.filename) ok.audio_url = toAbsoluteAudioUrl(`/static/audio/generated/${encodeURIComponent(ok.filename)}`);
  if (!ok.audio_url) throw new Error("TTS response did not provide a playable audio URL.");
  return ok;
}

async function safeJson <T = unknown>(res: Response): Promise<T | null> {
  const txt = await res.text();
  if (!txt) return null;
  try { return JSON.parse(txt) as T; } catch { return null; }
}

async function ensureOk(res: Response) {
  if (res.ok) return;
  const maybe = await safeJson<any>(res);
  const msg = (maybe && (maybe.detail || maybe.message || maybe.error)) || `${res.status} ${res.statusText}`;
  throw new Error(msg);
}

export async function listSessions() {
  const res = await fetch(`${API_BASE}/debate/sessions`, withCreds());
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}


export type DocEntry = {
  id?: string | number;
  title?: string;
  size_bytes?: number;
}
export type DocList = {docs: DocEntry[]};

function normalizeDocsShape(payload: any): DocList {
  if (!payload) return { docs: [] };
  if (Array.isArray(payload)) return { docs: payload as DocEntry[] };
  if (payload.docs && Array.isArray(payload.docs)) return { docs: payload.docs as DocEntry[] };
  return { docs: [] };
}

export async function uploadDoc(
  session_id: number,
  file: File,
  owner = "shared",
  title?: string
) {
  const fd = new FormData();
  fd.append("session_id", String(session_id));
  fd.append("owner", owner);
  if (title) fd.append("title", title);
  fd.append("file", file);

  const res = await fetch(`${API_BASE}/debate/docs/upload`, withCreds({ method: "POST", body: fd }));
  await ensureOk(res);
  // Some servers return created doc; others return {ok:true}. Return something useful either way.
  const json = await safeJson<any>(res);
  return json ?? { ok: true };
}

export async function listDocs(session_id: number, owner?: string): Promise<DocList> {
  const url = new URL(`${API_BASE}/debate/docs/list`);
  url.searchParams.set("session_id", String(session_id));
  if (owner) url.searchParams.set("owner", owner); // safe if backend ignores this
  const res = await fetch(url, withCreds());
  await ensureOk(res);
  const json = await safeJson<any>(res);
  return normalizeDocsShape(json);
}

export async function deleteDocsForOwner(session_id: number, owner: string) {
  const res = await fetch(
    `${API_BASE}/debate/docs/owner/${encodeURIComponent(String(session_id))}/${encodeURIComponent(owner)}`,
    withCreds({ method: "DELETE" })
  );
  await ensureOk(res);
  return { ok: true};
}
