import { useEffect, useRef, useState } from "react";
import {
  versusStartStream,
  versusInjectStream,
  soloStartStream,
  soloInjectStream,
  daStartStream,
  daInjectStream,
  fetchSummary,
  fetchGrade,
  postVoice,
  type JsonlEvent,
  type ChatHistory,
} from "../api/debateClient";

import { sanitizeUserSeed, unwrapJson } from "../lib/text";
import { resolveAudioPath } from "../lib/audio";
import {
  appendDeltaByTurnId,
  setSourcesByTurnId,
  updateAudioByTurnId,
  updateAudioOnLatestBySpeaker,
} from "../lib/messageOps";
import { SPEAKER_USER, type DebateModeKey, type Message } from "../lib/chat";

// NOTE: if your local debounce takes (fn, waitMs), you can add the wait back.
import {
  debounce,
  saveSession,
  loadSession,
  newSessionFromSeed,
  type StoredSession,
} from "../lib/persist";

import { detectTargetSpeakers, normalizeAddressees } from "../lib/targets";

type UseDebateArgs = { mode: DebateModeKey; userId: string };

export default function useDebate({ mode, userId }: UseDebateArgs) {
  // ---------------- state ----------------
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const [c1, setC1] = useState("Donald Trump");
  const [c2, setC2] = useState("Karl Marx");

  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);

  // For UI: character-aware typing indicator and caret target
  const [typingSpeaker, setTypingSpeaker] = useState<string | null>(null);
  const [streamingTurnId, setStreamingTurnId] = useState<number | null>(null);

  // ---------------- refs ----------------
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const streamAbortRef = useRef<AbortController | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);
  const audioCacheRef = useRef<Map<number, string>>(new Map());

  // Buffer deltas & flush at ~60fps
  const deltaBufferRef = useRef<Map<number, string>>(new Map());
  const rafRef = useRef<number | null>(null);

  // Track first visible paint per turn, to optionally hide the indicator
  const firstDeltaSeenRef = useRef<Set<number>>(new Set());

  // Pre-roll dwell timer per turn
  const turnStartAtRef = useRef<Map<number, number>>(new Map());

  // Avoid stale closures in raf: mirror streamingTurnId into a ref
  const streamingTurnIdRef = useRef<number | null>(null);
  useEffect(() => {
    streamingTurnIdRef.current = streamingTurnId;
  }, [streamingTurnId]);

  // Tuning knobs
  const MIN_TYPING_DWELL_MS = 120; // 0 => no dwell; try 80–150ms
  const HIDE_INDICATOR_ON_FIRST_PAINT = true;

  // ---------------- persist session ----------------
  const debouncedSave = useRef(
    debounce((s: StoredSession) => {
      saveSession(userId, s);
    })
  ).current;

  useEffect(() => {
    if (!sessionId) return;
    const firstUser = messages.find((m) => m.role === "user")?.text || "New chat";
    const existing = loadSession(userId, sessionId);
    const createdAt = existing?.createdAt || Date.now();
    const s: StoredSession = {
      id: sessionId,
      userId,
      title: firstUser.slice(0, 60),
      createdAt,
      updatedAt: Date.now(),
      messages,
    };
    debouncedSave(s);
  }, [messages, sessionId, userId, debouncedSave]);

  // ---------------- helpers ----------------
  function pushUser(text: string) {
    setMessages((prev) => [...prev, { role: "user", speaker: SPEAKER_USER, text }]);
  }

  function scheduleFlush() {
    if (rafRef.current != null) return;

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;

      // Guaranteed pre-roll: if the active turn hasn't dwelled long enough
      const activeId = streamingTurnIdRef.current;
      if (activeId != null && !firstDeltaSeenRef.current.has(activeId)) {
        const startedAt = turnStartAtRef.current.get(activeId) || 0;
        const elapsed = performance.now() - startedAt;
        if (elapsed < MIN_TYPING_DWELL_MS) {
          const remain = MIN_TYPING_DWELL_MS - elapsed;
          setTimeout(() => scheduleFlush(), remain);
          return;
        }
      }

      // Apply all buffered deltas in one state update
      setMessages((prev) => {
        let next = prev;
        let paintedActive = false;
        const active = streamingTurnIdRef.current;

        deltaBufferRef.current.forEach((buf, tId) => {
          if (!buf) return;
          next = appendDeltaByTurnId(next, tId, buf);
          if (HIDE_INDICATOR_ON_FIRST_PAINT && active != null && tId === active && !firstDeltaSeenRef.current.has(active)) {
            paintedActive = true;
          }
        });
        deltaBufferRef.current.clear();

        // Mark first paint; optionally hide the typing indicator immediately
        if (active != null && paintedActive) {
          firstDeltaSeenRef.current.add(active);
          if (HIDE_INDICATOR_ON_FIRST_PAINT) setTypingSpeaker(null);
        }
        return next;
      });
    });
  }

  function appendDelta(turnId: number, raw: string) {
    const { text, audio } = unwrapJson(raw);

    if (text) {
      const prev = deltaBufferRef.current.get(turnId) || "";
      deltaBufferRef.current.set(turnId, prev + text);
      scheduleFlush();
    }

    if (audio) {
      setMessages((prev) => updateAudioByTurnId(prev, turnId, audio));
    }
  }

  function maybeAttachAnnotatedAudio(rawSpeaker: string, filename?: string | null) {
    if (!filename) return;
    const url = resolveAudioPath(rawSpeaker, filename);
    setMessages((prev) => updateAudioOnLatestBySpeaker(prev, rawSpeaker, url));
  }

  function buildHistory(): { chatml: ChatHistory } {
    const chatml: ChatHistory = messages.map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text,
    }));
    return { chatml };
  }

  function buildAddressees(text: string): string[] | undefined {
    const candidates = [c1, c2].filter(Boolean);

    let targets: string[];
    const fn: any = detectTargetSpeakers as any;
    if (typeof fn === "function" && fn.length >= 2) {
      targets = fn(text, candidates);
    } else {
      targets = fn(text);
      if (Array.isArray(targets) && candidates.length) {
        targets = targets.filter((t: string) =>
          candidates.some((c) => c.toLowerCase() === String(t).toLowerCase())
        );
      }
    }
    const addrs = normalizeAddressees(targets);
    return addrs && addrs.length ? addrs : undefined;
  }

  // ---------------- event handler ----------------
  function onEvent(evt: JsonlEvent) {
    switch (evt.type) {
      case "session": {
        const id = String(evt.session_id);
        setSessionId(id);
        const firstUser = messages.find((m) => m.role === "user")?.text || "New chat";
        const base = newSessionFromSeed(userId, id, firstUser);
        saveSession(userId, { ...base, messages });
        break;
      }

      case "turn": {
        setLoading(true);
        setTypingSpeaker(evt.speaker || "Assistant");
        setStreamingTurnId(evt.turn_id);
        streamingTurnIdRef.current = evt.turn_id;

        // start dwell timer for this turn
        turnStartAtRef.current.set(evt.turn_id, performance.now());
        firstDeltaSeenRef.current.delete(evt.turn_id);

        // add empty assistant bubble
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            speaker: evt.speaker,
            text: "",
            turnId: evt.turn_id,
            sources: [],
          },
        ]);
        break;
      }

      case "sources": {
        setMessages((prev) => setSourcesByTurnId(prev, evt.turn_id, evt.items as any));
        break;
      }

      case "delta": {
        appendDelta(evt.turn_id, evt.delta);

        // optional inline audio annotation: [AUDIO::<speaker>::<filename>::]
        const m = evt.delta.match(/\[AUDIO::([^:]+)::([^:]+)::\]/i);
        if (m) {
          const [, rawSpeaker, filename] = m;
          maybeAttachAnnotatedAudio(rawSpeaker, filename);
        }
        break;
      }

      case "endturn": {
        setLoading(false);

        // ensure any remaining buffer paints now
        if (deltaBufferRef.current.size) {
          setMessages((prev) => {
            let next = prev;
            deltaBufferRef.current.forEach((buf, tId) => {
              if (buf) next = appendDeltaByTurnId(next, tId, buf);
            });
            deltaBufferRef.current.clear();
            return next;
          });
        }

        if (streamingTurnIdRef.current === evt.turn_id) {
          setTypingSpeaker(null);
          setStreamingTurnId(null);
          streamingTurnIdRef.current = null;
        }
        turnStartAtRef.current.delete(evt.turn_id);

        if (sessionId) {
          const existing = loadSession(userId, sessionId);
          if (existing) {
            saveSession(userId, { ...existing, updatedAt: Date.now() });
          }
        }
        break;
      }

      case "error": {
        console.error("[stream error]", evt.message);
        setLoading(false);
        setTypingSpeaker(null);
        if (streamingTurnIdRef.current != null) {
          turnStartAtRef.current.delete(streamingTurnIdRef.current);
        }
        setStreamingTurnId(null);
        streamingTurnIdRef.current = null;
        // we do not clear buffers here—let the UI keep whatever text arrived
        break;
      }
    }
  }

  // ---------------- session adoption ----------------
  async function adoptSession(existingId: string) {
    const stored = loadSession(userId, existingId);
    if (!stored) return;
    setSessionId(existingId);
    setMessages(stored.messages || []);
    setStarted(true);
    setLoading(false);
  }

  // ---------------- actions ----------------
  async function start() {
    if (started) return;
    const seed = sanitizeUserSeed(input.trim(), [c1, c2].filter(Boolean));
    if (mode !== "Versus" && !seed) return;
    if (mode === "Versus" && (!seed || !c1 || !c2)) return;

    setStarted(true);
    pushUser(seed);
    setLoading(true);

    streamAbortRef.current?.abort();
    streamAbortRef.current = new AbortController();
    const signal = streamAbortRef.current.signal;

    const { chatml } = buildHistory();

    try {
      if (mode === "Versus") {
        await versusStartStream({ topic: seed, c1, c2, history: chatml, onEvent, signal });
      } else if (mode === "Solo") {
        await soloStartStream({ character: c1, topic: seed, history: chatml, onEvent, signal });
      } else {
        await daStartStream({ character: c1, thesis: seed, history: chatml, onEvent, signal });
      }
    } catch (e) {
      console.error("[stream start] failed:", e);
      setLoading(false);
      setTypingSpeaker(null);
      setStreamingTurnId(null);
      streamingTurnIdRef.current = null;
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || !started || !sessionId) return;
    pushUser(text);
    setLoading(true);

    streamAbortRef.current?.abort();
    streamAbortRef.current = new AbortController();
    const signal = streamAbortRef.current.signal;

    try {
      if (mode === "Versus") {
        await versusInjectStream({
          session_id: Number(sessionId),
          user_inject: text,
          addressed_to: buildAddressees(text),
          onEvent,
          signal,
        });
      } else if (mode === "Solo") {
        await soloInjectStream({ session_id: Number(sessionId), user_inject: text, onEvent, signal });
      } else {
        await daInjectStream({ session_id: Number(sessionId), user_inject: text, onEvent, signal });
      }
    } catch (e) {
      console.error("[stream inject] failed:", e);
      setLoading(false);
      setTypingSpeaker(null);
      setStreamingTurnId(null);
      streamingTurnIdRef.current = null;
    }
  }

  function handlePrimary() {
    (started ? send : start)();
    setInput("");
  }

  async function summarize() {
    if (!sessionId) return;
    try {
      const data = await fetchSummary(Number(sessionId), "concise");
      setMessages((m) => [
        ...m,
        { role: "system", speaker: "Judge", text: "Summary:\n" + JSON.stringify((data as any).summary, null, 2) },
      ]);
    } catch (e) {
      console.error("[summary] failed:", e);
    }
  }

  async function grade() {
    if (!sessionId) return;
    try {
      const data = await fetchGrade(Number(sessionId));
      setMessages((m) => [
        ...m,
        {
          role: "system",
          speaker: "Judge",
          text: "Grade:\n" + JSON.stringify((data as any).grade ?? (data as any).grading, null, 2),
        },
      ]);
    } catch (e) {
      console.error("[grade] failed:", e);
    }
  }

  async function speak(turnId?: number) {
    if (!turnId) return;
    const cached = audioCacheRef.current.get(turnId);
    if (cached) {
      setMessages((prev) => updateAudioByTurnId(prev, turnId, cached));
      return;
    }

    ttsAbortRef.current?.abort();
    ttsAbortRef.current = new AbortController();

    try {
      const ready = await postVoice(turnId, ttsAbortRef.current.signal);
      const url = ready.audio_url || resolveAudioPath("", ready.filename || "");
      if (!url) throw new Error("No audio URL returned");
      setMessages((prev) => updateAudioByTurnId(prev, turnId, url));
      audioCacheRef.current.set(turnId, url);
    } catch (e) {
      console.error("[tts] failed:", e);
    }
  }

  function reset() {
    streamAbortRef.current?.abort();
    ttsAbortRef.current?.abort();
    setSessionId(null);
    setMessages([]);
    setInput("");
    setStarted(false);
    setLoading(false);
    setTypingSpeaker(null);
    setStreamingTurnId(null);
    streamingTurnIdRef.current = null;
    deltaBufferRef.current.clear();
    audioCacheRef.current.clear();
    firstDeltaSeenRef.current.clear();
    turnStartAtRef.current.clear();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handlePrimary();
    }
  }

  return {
    // reactive state for UI
    messages,
    input,
    setInput,
    c1,
    setC1,
    c2,
    setC2,
    started,
    loading,
    sessionId,

    // NEW: for MessageList typing indicator + caret
    typingSpeaker,
    streamingTurnId,

    // actions
    handlePrimary,
    summarize,
    grade,
    speak,
    reset,
    adoptSession,
    onKeyDown,

    // scroll anchor if you auto-scroll elsewhere
    scrollRef,
  };
}
