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

// NOTE: your local debounce likely only accepts (fn) — not (fn, wait).
// I’m calling it with one arg to satisfy TS2554.
import {
  debounce,
  saveSession,
  loadSession,
  newSessionFromSeed,
  type StoredSession,
} from "../lib/persist";

import {
  detectTargetSpeakers,
  normalizeAddressees,
} from "../lib/targets";

type UseDebateArgs = { mode: DebateModeKey; userId: string };

export default function useDebate({ mode, userId }: UseDebateArgs) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [c1, setC1] = useState("Donald Trump");
  const [c2, setC2] = useState("Karl Marx");
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const streamAbortRef = useRef<AbortController | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);
  const audioCacheRef = useRef<Map<number, string>>(new Map());

  // --- Persist session changes ------------------------------------------------
  // Your debounce typing likely only accepts (fn) — not (fn, waitMs)
  // If your debounce DOES accept a wait, feel free to re-add the 400ms arg.
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

  // --- Helpers ----------------------------------------------------------------
  function pushUser(text: string) {
    setMessages((prev) => [
      ...prev,
      { role: "user", speaker: SPEAKER_USER, text },
    ]);
  }

  function appendDelta(turnId: number, raw: string) {
    const { text, audio } = unwrapJson(raw);
    setMessages((prev) => {
      let next = appendDeltaByTurnId(prev, turnId, text);
      if (audio) next = updateAudioByTurnId(next, turnId, audio);
      return next;
    });
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

  // Returns undefined when no targets — safe to pass to API (it’s optional)
// Returns undefined when no targets — safe to pass to API (it’s optional)
  function buildAddressees(text: string): string[] | undefined {
  // Compatibility: some versions of detectTargetSpeakers accept (text) only,
  // others accept (text, candidates). We check the declared arity at runtime
  // and cast to any so TS is satisfied in both cases.
    const candidates = [c1, c2].filter(Boolean);

    let targets: string[];
    const fn: any = detectTargetSpeakers as any;
    if (typeof fn === "function" && fn.length >= 2) {
      // signature: (text, candidates[])
      targets = fn(text, candidates);
    } else {
      // signature: (text)
      targets = fn(text);
      // Optional: if your 1-arg version returns things beyond c1/c2, narrow here:
      if (Array.isArray(targets) && candidates.length) {
        targets = targets.filter((t: string) =>
          candidates.some((c) => c.toLowerCase() === String(t).toLowerCase())
        );
      }
  }

  const addrs = normalizeAddressees(targets);
  return addrs && addrs.length ? addrs : undefined;
}


  // --- Stream event handler ---------------------------------------------------
  function onEvent(evt: JsonlEvent) {
    switch (evt.type) {
      case "session": {
        const id = String(evt.session_id);
        setSessionId(id);
        const firstUser = messages.find((m) => m.role === "user")?.text || "New chat";
        const base = newSessionFromSeed(userId, id, firstUser);
        saveSession(userId,{ ...base, messages });
        break;
      }
      case "turn":
        setLoading(true);
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

      case "sources":
        setMessages((prev) => setSourcesByTurnId(prev, evt.turn_id, evt.items as any));
        break;

      case "delta":
        appendDelta(evt.turn_id, evt.delta);
        {
          // optional inline audio annotation: [AUDIO::<speaker>::<filename>::]
          const m = evt.delta.match(/\[AUDIO::([^:]+)::([^:]+)::\]/i);
          if (m) {
            const [, rawSpeaker, filename] = m;
            maybeAttachAnnotatedAudio(rawSpeaker, filename);
          }
        }
        break;

      case "endturn":
        setLoading(false);
  

        if (sessionId) {
          const existing = loadSession(userId, sessionId);
          if (existing) {
            saveSession(userId, {
              ...existing,
              updatedAt: Date.now(),
            });
          }
        }
        break;

      case "error":
        console.error("[stream error]", evt.message);
        setLoading(false);
        break;
    }
  }

  // --- Session adoption -------------------------------------------------------
  async function adoptSession(existingId: string) {
    const stored = loadSession(userId, existingId);
    if (!stored) return;
    setSessionId(existingId);
    setMessages(stored.messages || []);
    setStarted(true);
    setLoading(false);
  }

  // --- Actions ----------------------------------------------------------------
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
        // Versus START payload — start routes do NOT accept addressed_to or session_id
        await versusStartStream({
          topic: seed,
          c1,
          c2,
          history: chatml,
          onEvent,
          signal,
        });
      } else if (mode === "Solo") {
        // Solo START requires character + topic
        await soloStartStream({
          character: c1,
          topic: seed,
          history: chatml,
          onEvent,
          signal,
        });
      } else {
        // Devil’s Advocate START requires character + thesis
        await daStartStream({
          character: c1,
          thesis: seed,
          history: chatml,
          onEvent,
          signal,
        });
      }
    } catch (e) {
      console.error("[stream start] failed:", e);
      setLoading(false);
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
        // Versus INJECT payload — can pass addressed_to as optional hint
        await versusInjectStream({
          session_id: Number(sessionId),
          user_inject: text,
          addressed_to: buildAddressees(text), // undefined is fine
          onEvent,
          signal,
        });
      } else if (mode === "Solo") {
        await soloInjectStream({
          session_id: Number(sessionId),
          user_inject: text,
          onEvent,
          signal,
        });
      } else {
        await daInjectStream({
          session_id: Number(sessionId),
          user_inject: text,
          onEvent,
          signal,
        });
      }
    } catch (e) {
      console.error("[stream inject] failed:", e);
      setLoading(false);
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
        {
          role: "system",
          speaker: "Judge",
          text: "Summary:\n" + JSON.stringify((data as any).summary, null, 2),
        },
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
          text:
            "Grade:\n" +
            JSON.stringify(
              (data as any).grade ?? (data as any).grading,
              null,
              2
            ),
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
    audioCacheRef.current.clear();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handlePrimary();
    }
  }

  return {
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
    handlePrimary,
    summarize,
    grade,
    speak,
    reset,
    adoptSession,
    onKeyDown,
    scrollRef,
  };
}
