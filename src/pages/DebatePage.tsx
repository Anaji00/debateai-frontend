// src/pages/DebatePage.tsx
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import useDebate from "../hooks/useDebate";
import Sidebar from "../components/Sidebar";
import MessageList from "../components/MessageList";
import ModeSelector from "../components/ModeSelector";
import CharacterSetup from "../components/CharacterSetup";
import TopNav from "../components/TopNav";
import type { DebateModeKey } from "../lib/chat";

import { getLastSessionId, newSessionFromSeed, saveSession } from "../lib/persist";
import { useAuth } from "../auth/authProvider";

export default function DebatePage() {
  // Auth (or use "anon-1")
  const { user } = useAuth?.() ?? { user: null as any };
  const userId = user?.identifier ?? "anon-1";

  const [mode, setMode] = useState<DebateModeKey>("Versus");

  // ⬇️ Sidebar collapse state (wired into Sidebar via props)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Layout constants (match your Sidebar width + TopNav height)
  const NAV_H = 56;                // px; adjust if your TopNav is taller/shorter
  const SIDEBAR_W_OPEN = 400;      // px
  const SIDEBAR_W_COLLAPSED = 64;  // px (icon rail)
  const sidebarWidth = sidebarCollapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W_OPEN;

  const {
    // state
    messages, input, c1, c2, started, loading, sessionId,
    setInput, setC1, setC2,
    // actions
    handlePrimary, summarize, typingSpeaker, streamingTurnId, grade, speak, onKeyDown,
    hardReset, reset, scrollRef, adoptSession,
  } = useDebate({ mode, userId });

  // Hydrate last session once
  const hydratedOnceRef = useRef(false);
  useEffect(() => {
    if (hydratedOnceRef.current) return;
    hydratedOnceRef.current = true;
    const last = getLastSessionId(userId);
    if (!started && last) adoptSession(last);
  }, [userId, started, adoptSession]);

  const handleModeChange = useCallback((next: DebateModeKey) => {
    if (next === mode) return;
    hardReset();
    setMode(next);
  }, [mode, hardReset]);

  const HandleNewSession = useCallback(() => {
    reset();
    const id = String(Date.now());
    const seed = newSessionFromSeed(userId, id, "New Chat");
    saveSession(userId, { ...seed, messages: [] });
    adoptSession(id);
  }, [reset, adoptSession, userId]);

  const onOpenSession = useCallback((id: string) => {
    adoptSession(id);
  }, [adoptSession]);

  const isSendDisabled = useMemo(() => {
    if (!started) return loading;
    return loading || input.trim().length === 0;
  }, [started, loading, input]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 to-black text-emerald">
      <TopNav />

      {/* FIXED left rail (permanent), custom scroll on the rail container */}
      <aside
        className="fixed left-0 z-30 border-r border-amber-200 bg-neutral-900/60 overflow-y-auto custom-scroll"
        style={{ top: NAV_H, bottom: 0, width: sidebarWidth }}
      >
        <Sidebar
          userId={userId}
          sessionId={sessionId}
          onOpen={onOpenSession}
          onNew={HandleNewSession}
          reset={reset}
          adoptSession={adoptSession}
          collapsed={sidebarCollapsed}                          // ⬅️ wire collapse
          onToggleCollapse={() => setSidebarCollapsed(v => !v)} // ⬅️ wire toggle
        />
      </aside>

      {/* Main column, shifted to the right by current sidebar width */}
      <div
        className="pr-4 md:pr-6 lg:pr-9 pl-0 py-0"
        style={{ marginLeft: sidebarWidth }}
      >
        <main className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl shadow-black/20 backdrop-blur custom-scroll">
          <div className="border-b border-amber-200">
            <ModeSelector mode={mode} onChange={handleModeChange} />
          </div>

          {!started ? (
            <CharacterSetup
              mode={mode}
              character_1={c1}
              setCharacter_1={setC1}
              character_2={c2}
              setCharacter_2={setC2}
              input={input}
              setInput={setInput}
              debateStarted={started}
              loading={loading}
              handlePrimaryAction={handlePrimary}
              resetDebate={reset}
            />
          ) : (
            <div key={sessionId || "setup"} className="grid grid-rows-[1fr,auto] h-[calc(100vh-160px)]">
              <div
                ref={scrollRef}
                className="overflow-y-auto p-4 md:p-4 space-y-4 custom-scroll"
                role="log"
                aria-live="polite"
                aria-relevant="additions"
                aria-busy={loading}
                id="debate-log"
              >
                <MessageList
                  messages={messages}
                  loading={loading}
                  typingSpeaker={typingSpeaker}
                  streamingTurnId={streamingTurnId}
                  mode={mode}
                  onGenerateAudio={(turnId) => speak(turnId)}
                />
                <div className="h-2" />
              </div>

              <div className="border-t border-neutral-800 p-3 md:p-4 bg-neutral-900/60 backdrop-blur sticky bottom-0">
                <div className="flex gap-2">
                  <label htmlFor="composer" className="sr-only">Message composer</label>
                  <textarea
                    id="composer"
                    className="flex-1 min-h-[42px] max-h-40 rounded-xl bg-neutral-800 border border-neutral-700 px-3 py-2 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-600 resize-none"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    aria-controls="debate-log"
                    placeholder="Enter your point..."
                    rows={1}
                  />
                  <button
                    className="px-4 py-2 rounded-xl border border-amber-200 disabled:opacity-100 text-sky-200"
                    onClick={handlePrimary}
                    disabled={isSendDisabled}
                    title={started ? "Send message" : "Start debate"}
                    type="button"
                  >
                    {started ? "Send" : "Start"}
                  </button>

                  <button
                    className="px-3 py-2 rounded-xl border border-amber-200 disabled:opacity-50 text-sky-200"
                    onClick={summarize}
                    disabled={!sessionId}
                    title="Summarize this session"
                    type="button"
                  >
                    Summary
                  </button>
                  <button
                    className="px-3 py-2 rounded-xl border border-amber-200 disabled:opacity-50 text-sky-200"
                    onClick={grade}
                    disabled={!sessionId}
                    title="Grade this session"
                    type="button"
                  >
                    Grade
                  </button>
                </div>
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
