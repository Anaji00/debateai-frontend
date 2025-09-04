// src/pages/DebatePage.tsx
import { useState, useEffect } from "react";
import useDebate from "../hooks/useDebate";
import Sidebar from "../components/Sidebar";
import MessageList from "../components/MessageList";
import ModeSelector from "../components/ModeSelector";
import CharacterSetup from "../components/CharacterSetup";
import TopNav from "../components/TopNav";
import type { DebateModeKey } from "../lib/chat";

import { getLastSessionId } from "../lib/persist";

// If you have cookie-auth wired:
import { useAuth } from "../auth/authProvider";

export default function DebatePage() {
  // Stable user id (from cookie session). If you haven't set up AuthContext yet,
  // you can temporarily keep const userId = "anon-1";
  const { user } = useAuth?.() ?? { user: null as any };
  const userId = user?.identifier ?? "anon-1";

  const [mode, setMode] = useState<DebateModeKey>("Versus");

  const {
    // state
    messages,
    input,
    c1,
    c2,
    started,
    loading,
    sessionId,
    // setters
    setInput,
    setC1,
    setC2,
    // actions
    handlePrimary,
    summarize,
    grade,
    speak,
    onKeyDown,   // typed for HTMLTextAreaElement in your hook
    reset,
    scrollRef,
    adoptSession,
  } = useDebate({ mode, userId });

  useEffect(() => {
    const last = getLastSessionId(userId);
    if (!started && last) adoptSession(last);
    }, [userId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 to-black text-white">
      <TopNav />
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-4 grid grid-cols-1 md:grid-cols-[280px,1fr] gap-4">
        {/* Sidebar */}
        <aside className="hidden md:block">
          <div className="sticky top-16">
            <div className="border border-neutral-800 rounded-2xl p-3 bg-neutral-900/50 backdrop-blur">
              <Sidebar userId={userId} onOpen={(id) => adoptSession(id)} />
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl shadow-black/20 backdrop-blur">
          <div className="border-b border-neutral-800">
            <ModeSelector mode={mode} onChange={setMode} />
          </div>

          {!started ? (
            <CharacterSetup
              // IMPORTANT: CharacterSetup expects these exact prop names:
              mode={mode}
              character_1={c1}
              setCharacter_1={setC1}
              character_2={c2}
              setCharacter_2={setC2}
              input={input}
              setInput={setInput}
              // Your hook exposes handlePrimary; map it to the prop name expected by CharacterSetup
              handlePrimaryAction={handlePrimary}
              loading={loading}
              // This component uses these prop names:
              resetDebate={reset}
              debateStarted={started}
            />
          ) : (
            <div className="grid grid-rows-[1fr,auto] h-[calc(100vh-160px)]">
              <div
                ref={scrollRef}
                className="overflow-y-auto p-4 md:p-6 space-y-4 custom-scroll"
                aria-live="polite"
                aria-busy={loading}
              >
                {/* MessageList's onGenerateAudio receives the MESSAGE INDEX (idx), not a turnId.
                   We adapt it here by looking up the turnId for that message. */}
                <MessageList
                  messages={messages}
                  onGenerateAudio={(turnId) =>  speak(turnId) }
                />
                <div className="h-2" />
              </div>

              {/* Composer row (use TEXTAREA so onKeyDown typing matches your hook) */}
              <div className="border-t border-neutral-800 p-3 md:p-4 bg-neutral-900/60 backdrop-blur sticky bottom-0">
                <div className="flex gap-2">
                  <label htmlFor="composer" className="sr-only">Message composer</label>
                  <textarea
                    id="composer"
                    className="flex-1 min-h-[42px] max-h-40 rounded-xl bg-neutral-800 border border-neutral-700 px-3 py-2
                               text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-600
                               resize-none"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKeyDown} // supports Enter to send, Shift+Enter for newline
                    placeholder="Type your point (shown as You)…"
                    disabled={loading}
                    rows={1}
                  />
                  <button
                    className="px-4 py-2 rounded-xl bg-white text-black font-medium disabled:opacity-50"
                    onClick={handlePrimary}
                    disabled={loading}
                    title={started ? "Send message" : "Start debate"}
                    type="button"
                  >
                    {started ? "Send" : "Start"}
                  </button>
                  <button
                    className="px-3 py-2 rounded-xl border border-neutral-700 disabled:opacity-50"
                    onClick={summarize}
                    disabled={!sessionId}
                    title="Summarize this session"
                    type="button"
                  >
                    Summary
                  </button>
                  <button
                    className="px-3 py-2 rounded-xl border border-neutral-700 disabled:opacity-50"
                    onClick={grade}
                    disabled={!sessionId}
                    title="Grade this session"
                    type="button"
                  >
                    Grade
                  </button>
                </div>
                <div className="mt-2 flex justify-between text-xs text-neutral-400">
                  <div>
                    {c1 && <span>👤 {c1}</span>}
                    {c2 && mode === "Versus" && <span className="ml-3">🆚 - 👤{c2}</span>}
                    {sessionId && <span className="ml-3 opacity-70"># {sessionId}</span>}
                  </div>
                  {loading && <span className="typing-caret">Thinking</span>}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
