// src/components/MessageList.tsx
// Live-stream-ready message list:
// - Avatars (user generic; AI resolved from DEFAULT_CHARACTERS)
// - Renders streamed text directly (no simulated typewriter while streaming)
// - Character-aware TypingIndicator while a turn is in-flight
// - Blinking caret at the end of the currently streaming assistant bubble
// - Preserves JudgeBlock (JSON pretty view), sources, and audio button

import { useState, memo } from "react";
import TypingIndicator from "./TypingIndicator";
import BlinkingCaret from "./BlinkingCaret";
import type { Message, DebateModeKey } from "../lib/chat";
import { DEFAULT_CHAR } from "../data/CharData";
const genericAvatar = "https://source.unsplash.com/featured/80x80/?silhouette,portrait";

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
  const label = mode === "Devil's Advocate" ? "Devil's Advocate" : (typingSpeaker || undefined);
  const avatar = findAvatar(typingSpeaker || undefined);

  return (
    <div className="flex flex-col gap-4 px-4 py-2 overflow-y-auto">
      {messages.map((msg, i) => (
        <MessageItem
          key={msg.turnId ?? i}
          msg={msg}
          isStreaming={typeof msg.turnId === "number" && msg.turnId === streamingTurnId}
          onGenerateAudio={onGenerateAudio}
        />
      ))}

      {/* Character-aware typing status while backend is producing a turn */}
      {loading && label && (
        <TypingIndicator
          name={typingSpeaker || undefined}
          labelOverride={mode === "Devil's Advocate" ? "Devil's Advocate" : undefined}
          avatarUrl={avatar}
          accent="amber"
        />
      )}
    </div>
  );
});

function JudgeBlock({ raw }: { raw: string }) {
  const m = raw.match(/^([^:]+):\s*\r?\n([\s\S]*)$/);
  const label = m ? m[1] : "Judge";
  const jsonText = m ? m[2] : raw;

  let parsed: unknown = null;
  try { parsed = JSON.parse(jsonText); } catch {}

  return (
    <div className="space-y-2">
      <div className="font-medium">{label}</div>
      {parsed ? (
        <pre className="text-xs overflow-auto max-h-64 border border-neutral-800 rounded p-2 bg-neutral-900/50">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      ) : (
        <div className="whitespace-pre-wrap leading-relaxed">{raw}</div>
      )}
    </div>
  );
}

function MessageItem({
  msg,
  isStreaming,
  onGenerateAudio,
}: {
  msg: Message;
  isStreaming: boolean;
  onGenerateAudio?: (turnId: number) => void;
}) {
  const [showSources, setShowSources] = useState(false);
  const isUser = msg.role === "user";

  // No indigo; user bubble uses amber accent for visibility on dark bg
  const bubble = isUser
    ? "bg-amber-500/90 border-amber-400 text-black"
    : "bg-neutral-800 border-neutral-700 text-neutral-100";

  const avatarUrl = isUser ? genericAvatar : findAvatar(msg.speaker);

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
          {msg.speaker === "Judge" && /^(Summary|Grade):/.test(msg.text) ? (
            <JudgeBlock raw={msg.text} />
          ) : (
            <>
              {msg.text}
              {/* caret only while this message is the active streaming turn */}
              {isStreaming && !isUser && <BlinkingCaret />}
            </>
          )}
        </div>

        {!!msg.sources?.length && (
          <div className="mt-2">
            <button
              onClick={() => setShowSources((s) => !s)}
              className="text-xs underline opacity-80 hover:opacity-100"
            >
              {showSources ? "Hide excerpts" : "Show excerpts"}
            </button>
            {showSources && (
              <ul className="mt-2 space-y-2 text-xs opacity-90">
                {msg.sources.map((s, j) => (
                  <li key={j} className="border border-neutral-800 rounded p-2 bg-neutral-900/40">
                    <div className="font-medium">{s.title}</div>
                    {typeof s.chunk_index === "number" && (
                      <div className="opacity-70">chunk {s.chunk_index}</div>
                    )}
                    <div className="mt-1 whitespace-pre-wrap">{s.snippet}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {onGenerateAudio && typeof msg.turnId === "number" && (
          <div className="mt-2">
            {!msg.audio ? (
              <button
                className="text-xs bg-white text-black rounded px-2 py-1 hover:opacity-90"
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
