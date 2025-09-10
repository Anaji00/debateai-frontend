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
    setInput,
    setC1,
    setC2,
    // actions
    handlePrimary,
    summarize,
    typingSpeaker,
    streamingTurnId,
    grade,
    speak,
    onKeyDown,   // typed for HTMLTextAreaElement in your hook
    reset,
    scrollRef,
    adoptSession,
  } = useDebate({ mode, userId });

  // `useEffect` runs on component mount to load the last used session.
  useEffect(() => {
    const last = getLastSessionId(userId);
    // If a previous session ID is found and the debate hasn't started, load it.
    if (!started && last) adoptSession(last);
  }, [userId, started, adoptSession]); // Dependencies ensure this runs only when these values change.

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 to-black text-emerald">
      <TopNav/>

      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-4 grid grid-cols-1 md:grid-cols-[280px,1fr] gap-4">
        <aside className="hidden md:block">
          {/* The Sidebar is sticky so it stays in place while the user scrolls the main content. */}
          <div className="sticky top-16">
            <div className="sticky top-16">
              <Sidebar userId={userId} onOpen={(id) => adoptSession(id)} />
            </div>
          </div>
        </aside>

        {/* Main content area for the debate interface. */}
        <main className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl shadow-black/20 backdrop-blur">
          <div className="border-b border-neutral-800">
            <ModeSelector mode={mode} onChange={setMode} />
          </div>
          {/* Conditionally render either the setup screen or the chat interface. */}
          {!started ? (
            // Before the debate starts, show the character and topic setup component.
            <CharacterSetup
              mode = {mode}
              character_1= {c1}
              setCharacter_1 = {setC1}
              character_2 = {c2}
              setCharacter_2 = {setC2}
              input = {input}
              setInput = {setInput}
              debateStarted = {started}
              loading = {loading}
              handlePrimaryAction={handlePrimary}
              resetDebate={reset}
            />
          ) : (
            // Once the debate starts, show the chat interface.
            <div className="grid grid-rows-[1fr,auto] h-[calc(100vh-160px)]">
              <div 
                ref = {scrollRef}
                className="overflow-y-auto p-4 md:p-6 space-y-4 custom-scroll"
                aria-live="polite"
                aria-busy={loading}
              >
                  {/* The MessageList component displays all debate messages. */}
                  <MessageList
                    messages={messages}
                    loading={loading}
                    // Pass streaming state so MessageList can show the typing indicator and caret.
                    typingSpeaker={typingSpeaker}
                    streamingTurnId={streamingTurnId}
                    mode={mode}
                    onGenerateAudio={turnId => speak(turnId)}
                  />
                  <div className="h-2"/>
                </div>

                {/* The composer area at the bottom for user input and actions. */}
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
                      onKeyDown={onKeyDown}
                      // The `onKeyDown` handler allows submitting with the Enter key.
                      placeholder="Enter your point..."
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

                        {/* Action buttons for summarizing or grading the debate. */}
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
                        {/* A small footer to show character names, session ID, and loading status. */}
                        <div className="mt-2 flex justify-between text-xs text-neutral-400">
                          <div className="flex items-center gap-1">
                            {c1 && <span>👤 {c1}</span>}
                            {c2 && mode === "Versus" && <span>🆚 👤 {c2}</span>}
                            {sessionId && <span className="opacity-70"># {sessionId}</span>}
                          </div>
                          {loading && typingSpeaker && (
                            <span className="opacity-70">{typingSpeaker} is thinking…</span>
                          )}
                        </div>
                    </div>
                  </div>
                )}
              </main>
            </div>
          </div>
  );
}