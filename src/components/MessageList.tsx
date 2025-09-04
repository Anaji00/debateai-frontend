// src/components/MessageList.tsx
import { useState, memo } from "react";
import type { Message } from "../lib/chat";

export default memo(function MessageList({
  messages,
  onGenerateAudio,
}: {
  messages: Message[];
  onGenerateAudio?: (turnId: number) => void;
}) {
  return (
    <div className="space-y-4">
      {messages.map((m, i) => (
        <MessageItem key={m.turnId ?? i} msg={m} onGenerateAudio={onGenerateAudio} />
      ))}
    </div>
  );
});

function MessageItem({ msg, onGenerateAudio }: { msg: Message; onGenerateAudio?: (turnId: number) => void }) {
  const [showSources, setShowSources] = useState(false);
  const bubble = msg.role === "user" ? "bg-neutral-800 border-neutral-700" : "bg-neutral-900 border-neutral-800";

function JudgeBlock ({raw}: {raw: string}) {
  const m = raw.match(/^([^:]+):\s*\r?\n([\s\S]*)$/)
  const label = m ? m[1] : "Judge";
  const jsonText = m ? m[2] : raw;
  
  let parsed: any = null;
  try {
    parsed = JSON.parse(jsonText);
  } catch {}
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

  return (
    <div className={`border rounded-xl p-3 ${bubble} transition-shadow hover:shadow-inner hover:shadow-black/20`}>
      <div className="text-xs mb-1 opacity-70">{msg.role === "user" ? "You" : msg.speaker}</div>
      {msg.speaker == "Judge" && /^(Summary|Grade):/.test(msg.text) ? (
        <JudgeBlock raw ={msg.text} />
      ) : (
      <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
      )}
      {!!msg.sources?.length && (
        <div className="mt-2">
          <button onClick={() => setShowSources((s) => !s)} className="text-xs underline opacity-80 hover:opacity-100">
            {showSources ? "Hide excerpts" : "Show excerpts"}
          </button>
          {showSources && (
            <ul className="mt-2 space-y-2 text-xs opacity-90">
              {msg.sources.map((s, j) => (
                <li key={j} className="border border-neutral-800 rounded p-2 bg-neutral-900/40">
                  <div className="font-medium">{s.title}</div>
                  {typeof s.chunk_index === "number" && <div className="opacity-70">chunk {s.chunk_index}</div>}
                  <div className="mt-1 whitespace-pre-wrap">{s.snippet}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {onGenerateAudio && typeof msg.turnId === "number" &&(
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
  );
}
