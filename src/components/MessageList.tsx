// src/components/MessageList.tsx
// Live-stream-ready message list:
// - Avatars (user generic; AI resolved from DEFAULT_CHARACTERS)
// - Renders streamed text directly (no simulated typewriter while streaming)
// - Character-aware TypingIndicator while a turn is in-flight
// - Blinking caret at the end of the currently streaming assistant bubble
// - Preserves JudgeBlock (JSON pretty view) and the per-turn TTS button
// - NOTE: Session-level RAG upload only — per-turn source toggles removed

import { memo, useMemo } from "react";
import JudgeBlock from "./JudgeBlock";
import TypingIndicator from "./TypingIndicator";
import BlinkingCaret from "./BlinkingCaret";
import type { Message } from "../lib/chat";
import type { DebateModeKey } from "../types/DebateMode";
import { DEFAULT_CHAR } from "../data/CharData";

const genericAvatar =
  "https://source.unsplash.com/featured/80x80/?silhouette,portrait";

function findAvatar(name?: string) {
  if (!name) return genericAvatar;
  const match = DEFAULT_CHAR.find(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  );
  return match?.imageUrl || genericAvatar;
}

export interface MessageListProps {
  messages: Message[];
  loading: boolean;
  typingSpeaker?: string | null;    // from useDebate()
  streamingTurnId?: number | null;  // from useDebate()
  mode?: DebateModeKey;             // to display "Devil's Advocate" label in DA mode
  onGenerateAudio?: (turnId: number) => void;
}

export default memo(function MessageList({
  messages,
  loading,
  typingSpeaker,
  streamingTurnId,
  mode,
  onGenerateAudio,
}: MessageListProps) {
  // If mode is DA, we force the visible label to "Devil's Advocate"
  const typingLabel = useMemo(
    () => (mode === "Devil's Advocate" ? "Devil's Advocate" : typingSpeaker || undefined),
    [mode, typingSpeaker]
  );

  const typingAvatar = useMemo(
    () => findAvatar(typingSpeaker || undefined),
    [typingSpeaker]
  );

  return (
    <div className="flex flex-col gap-4 px-4 py-2 overflow-y-auto" aria-live="polite">
      {messages.map((msg, i) => (
        <MessageItem
          key={msg.turnId ?? i}
          msg={msg}
          isStreaming={
            typeof msg.turnId === "number" && msg.turnId === streamingTurnId
          }
          onGenerateAudio={onGenerateAudio}
        />
      ))}

      {/* Character-aware typing status while backend is producing a turn */}
      {loading && typingLabel && (
        <TypingIndicator
          name={typingSpeaker || undefined}
          labelOverride={mode === "Devil's Advocate" ? "Devil's Advocate" : undefined}
          avatarUrl={typingAvatar}
          accent="amber"
        />
      )}
    </div>
  );
});

function MessageItem({
  msg,
  isStreaming,
  onGenerateAudio,
}: {
  msg: Message;
  isStreaming: boolean;
  onGenerateAudio?: (turnId: number) => void;
}) {
  const isUser = msg.role === "user";

  // User bubble uses amber accent for visibility on dark bg; AI stays neutral.
  const bubble = isUser
    ? "bg-amber-500/90 border-amber-400 text-black"
    : "bg-neutral-800 border-neutral-700 text-neutral-100";

  const avatarUrl = isUser ? genericAvatar : findAvatar(msg.speaker);

  const isJudgeJson =
    msg.speaker === "Judge" && /^(Summary|Grade)\s*:?/i.test(msg.text);

  return (
    <div className="flex items-start gap-3">
      <img
        src={avatarUrl}
        alt={isUser ? "You" : msg.speaker || "Assistant"}
        className="w-8 h-8 rounded-full object-cover border border-neutral-600"
        loading="lazy"
      />

      <div className="flex-1 min-w-0">
        <div className="text-xs text-neutral-400 mb-1">
          {isUser ? "You" : msg.speaker || "Assistant"}
        </div>

        <div
          className={[
            "p-3 rounded-lg border text-sm leading-relaxed whitespace-pre-wrap",
            "transition-shadow hover:shadow-inner hover:shadow-black/20",
            bubble,
          ].join(" ")}
        >
          {isJudgeJson ? (
            <JudgeBlock raw={msg.text} />
          ) : (
            <>
              {msg.text}
              {/* caret only while this message is the active streaming turn */}
              {isStreaming && !isUser && <BlinkingCaret />}
            </>
          )}
        </div>

        {/* Per-turn TTS */}
        {onGenerateAudio && typeof msg.turnId === "number" && (
          <div className="mt-2">
            {!msg.audio ? (
              <button
                className="text-xs bg-white text-black rounded px-2 py-1 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                onClick={() => onGenerateAudio(msg.turnId as number)}
                title="Generate Audio"
                aria-label="Generate Audio"
              >
                ▶ Generate Audio
              </button>
            ) : (
              <audio className="mt-2 w-full" src={msg.audio} controls />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
