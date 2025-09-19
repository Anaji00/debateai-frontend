// src/components/Sidebar.tsx

import { useState, useMemo, useEffect, useRef } from "react";
import useSessions from "../hooks/useSessions";
import { uploadDoc, listDocs, deleteDocsForOwner } from "../api/debateClient";

type Accent = "amber" | "sky";

interface SidebarProps {
  userId: string;
  sessionId?: string | null;
  onOpen: (id: string) => void;
  onNew?: () => void;
  reset?: () => void;
  adoptSession?: (id: string) => void;
  accent?: Accent;
  /** NEW: collapsed state controlled by parent (DebatePage) */
  collapsed?: boolean;
  /** NEW: toggle collapse callback */
  onToggleCollapse?: () => void;
}

type DocEntry = {
  id?: string | number;
  title?: string;
  size_bytes?: number;
};

const ACCENT: Record<
  Accent,
  { ring: string; textDim: string; hoverBtn: string; focusRing: string }
> = {
  amber: {
    ring: "ring-amber-400",
    textDim: "text-amber-200",
    hoverBtn: "hover:bg-amber-600/20",
    focusRing: "focus:ring-amber-400",
  },
  sky: {
    ring: "ring-sky-400",
    textDim: "text-sky-200",
    hoverBtn: "hover:bg-sky-600/20",
    focusRing: "focus:ring-sky-400",
  },
};

export default function Sidebar(props: SidebarProps) {
  const {
    userId,
    sessionId,
    onOpen,
    onNew,
    reset,
    accent = "amber",
    collapsed = false,
    onToggleCollapse,
  } = props;

  const { sessions, activeId, select, rename, remove } = useSessions(userId);

  // Renaming state
  const [editing, setEditing] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");

  // RAG state
  const [docs, setDocs] = useState<DocEntry[]>([]);
  const [ragBusy, setRagBusy] = useState(false);
  const [ragPaused, setRagPaused] = useState(false);
  const hasActiveSession = !!sessionId;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const A = useMemo(() => ACCENT[accent], [accent]);

  function beginEdit(id: string, current: string) {
    setEditing(id);
    setTitleDraft(current);
  }
  function commitEdit(id: string) {
    rename(id, titleDraft.trim() || "Untitled");
    setEditing(null);
  }
  function cancelEdit() {
    setEditing(null);
  }

  // Load docs whenever the active session changes (owner = "shared" for now)
  useEffect(() => {
    if (!sessionId || ragPaused) {
      setDocs([]);
      return;
    }
    (async () => {
      try {
        const { docs: arr = [] } = (await listDocs(Number(sessionId))) as { docs: DocEntry[] };
        setDocs(arr);
      } catch (e) {
        console.error("[Sidebar] listDocs failed:", e);
      }
    })();
  }, [sessionId, ragPaused]);

  async function handleUploadFiles(files: FileList | null) {
    if (!files || !sessionId || ragPaused) return;
    setRagBusy(true);
    try {
      for (const f of Array.from(files)) {
        await uploadDoc(Number(sessionId), f, "shared", f.name);
      }
      const { docs: arr = [] } = (await listDocs(Number(sessionId))) as { docs: DocEntry[] };
      setDocs(arr);
    } catch (e) {
      console.error("[Sidebar] uploadDoc failed:", e);
    } finally {
      setRagBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDeleteAllDocs() {
    if (!sessionId || ragPaused) return;
    setRagBusy(true);
    try {
      await deleteDocsForOwner(Number(sessionId), "shared");
      const { docs: arr = [] } = (await listDocs(Number(sessionId))) as { docs: DocEntry[] };
      setDocs(arr);
    } catch (e) {
      console.error("[Sidebar] deleteDocsForOwner failed:", e);
    } finally {
      setRagBusy(false);
    }
  }

  function handleClearChat() {
    reset?.();
  }

  return (
    <aside
      data-collapsed={collapsed ? "true" : "false"}
      className={[
        "h-full min-h-0 flex flex-col bg-neutral-900/60 border-r border-neutral-800",
        "transition-[width] duration-300 ease-out",
        collapsed ? "w-[60px]" : "w-full",
      ].join(" ")}
    >
      {/* Header row with collapse + actions */}
      <div className="px-3 py-2 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1 rounded hover:bg-neutral-800 text-sky-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {/* Double chevron left/right */}
            {collapsed ? (
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M20 19l-7-7 7-7" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M4 5l7 7-7 7" />
              </svg>
            )}
          </button>

          {!collapsed && (
            <span className="text-lg font-bold tracking-wide text-neutral-300 uppercase">
              Debate Sessions
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Clear Chat (reset) */}
          <button
            type="button"
            onClick={handleClearChat}
            className="p-1 rounded text-neutral-200 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-400/40"
            title="Clear chat/history"
            aria-label="Clear chat"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="9" />
              <path d="M15 9l-6 6M9 9l6 6" />
            </svg>
          </button>

          {/* New Session */}
          <button
            type="button"
            onClick={() => onNew?.()}
            className="p-1 rounded text-neutral-200 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
            title="New session"
            aria-label="New session"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full grid grid-rows-[auto,1fr]">
          {/* RAG PANEL */}
          <section
            className={[
              "m-3 rounded-xl border border-neutral-800 bg-neutral-900/60 backdrop-blur p-3 shadow-inner shadow-black/10",
            ].join(" ")}
            aria-labelledby="rag-panel-title"
          >
            <div className="flex items-center justify-between">
              {!collapsed ? (
                <h3
                  id="rag-panel-title"
                  className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-sky-400"
                >
                  Documents (RAG)
                </h3>
              ) : (
                <span className="sr-only" id="rag-panel-title">
                  Documents (RAG)
                </span>
              )}

              <div className="flex items-center gap-2">
                {/* Pause toggle (UI-only for now) */}
                <button
                  type="button"
                  onClick={() => setRagPaused((v) => !v)}
                  className={[
                    "px-2 py-1.5 rounded-md border border-neutral-700 bg-neutral-800 text-xs text-neutral-200",
                    "transition hover:border-sky-400 hover:text-sky-300",
                    "focus:outline-none focus:ring-2 focus:ring-sky-400/40",
                    ragPaused ? "opacity-80" : "",
                  ].join(" ")}
                  title={ragPaused ? "Resume RAG panel" : "Pause RAG panel"}
                  aria-pressed={ragPaused}
                  aria-label="Pause or resume RAG panel"
                >
                  {collapsed ? (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 9v6M14 9v6" />
                    </svg>
                  ) : (
                    <span>{ragPaused ? "Resume" : "Pause"}</span>
                  )}
                </button>

                {/* Upload */}
                <label
                  className={[
                    "inline-flex items-center gap-2 px-2 py-1.5 rounded-md border border-neutral-700 bg-neutral-800 text-xs text-neutral-200",
                    "transition hover:border-amber-400 hover:text-amber-300",
                    "focus-within:ring-2 focus-within:ring-amber-400/40",
                    !hasActiveSession || ragBusy || ragPaused ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                  ].join(" ")}
                  title={!hasActiveSession ? "Start a session first" : "Upload documents"}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 9l5-5 5 5" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12" />
                  </svg>
                  {!collapsed && <span>Upload</span>}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="sr-only"
                    disabled={!hasActiveSession || ragBusy || ragPaused}
                    onChange={(e) => handleUploadFiles(e.currentTarget.files)}
                    accept=".pdf,.txt,.md,.mdx"
                    multiple
                  />
                </label>

                {/* Clear */}
                <button
                  type="button"
                  className={[
                    "px-2 py-1.5 rounded-md border border-neutral-700 bg-neutral-800 text-xs text-neutral-200",
                    "transition hover:border-red-400 hover:text-red-300",
                    "focus:outline-none focus:ring-2 focus:ring-red-400/40",
                  ].join(" ")}
                  onClick={handleDeleteAllDocs}
                  disabled={!hasActiveSession || ragBusy || ragPaused || docs.length === 0}
                  title="Remove all uploaded docs for this session"
                >
                  {collapsed ? (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6v12m8-12v12M5 6l1 14a2 2 0 002 2h8a2 2 0 002-2L19 6" />
                    </svg>
                  ) : (
                    "Clear"
                  )}
                </button>
              </div>
            </div>

            {/* Doc list — hide text when collapsed */}
            {hasActiveSession ? (
              docs.length === 0 ? (
                !collapsed ? (
                  <p className="mt-2 text-xs text-sky-200">No docs yet.</p>
                ) : null
              ) : (
                <ul className="mt-2 space-y-1 max-h-40 overflow-auto pr-1 custom-scroll">
                  {docs.map((d, i) => (
                    <li
                      key={String(d.id ?? `${d.title}-${i}`)}
                      className="text-xs text-neutral-200 truncate border border-neutral-800 rounded-md px-2 py-1 bg-neutral-900/50"
                      title={d.title}
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" aria-hidden="true" />
                        {!collapsed && (d.title || "Untitled")}
                      </span>
                    </li>
                  ))}
                </ul>
              )
            ) : !collapsed ? (
              <p className="mt-2 text-xs text-neutral-400">Start a session to attach reference documents.</p>
            ) : null}
          </section>

          {/* SESSIONS (own scroll) */}
          <div className="min-h-0 overflow-y-auto pr-1 pb-3 custom-scroll">
            <ul className="px-3 space-y-1">
              {sessions.map((s) => {
                const active = activeId === s.id;
                return (
                  <li key={s.id}>
                    <div
                      className={[
                        "group relative rounded-lg flex items-center justify-between border px-2 py-1.5",
                        "transition-colors cursor-pointer",
                        active
                          ? `bg-neutral-900/80 border-amber-400/50 ring-2 ${A.ring}`
                          : "bg-neutral-900/50 border-neutral-800 hover:border-amber-400/40",
                      ].join(" ")}
                      onClick={() => {
                        select(s.id);
                        onOpen(s.id);
                      }}
                      role="button"
                      aria-pressed={active}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          select(s.id);
                          onOpen(s.id);
                        }
                      }}
                      title={s.title || "Untitled Debate Session"}
                    >
                      <div className="flex-1 min-w-0">
                        {editing === s.id ? (
                          <input
                            autoFocus
                            value={titleDraft}
                            onChange={(e) => setTitleDraft(e.target.value)}
                            onBlur={() => commitEdit(s.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitEdit(s.id);
                              else if (e.key === "Escape") cancelEdit();
                            }}
                            className={[
                              "w-full bg-neutral-800 border border-neutral-600 rounded-sm px-1 py-0.5",
                              "text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-400/40",
                            ].join(" ")}
                            aria-label="Rename Debate Session"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 truncate text-sm text-neutral-200 font-bold">
                              {!collapsed ? s.title || "Untitled Debate Session" : "\u200b"}
                            </div>
                          </div>
                        )}
                        {!collapsed && (
                          <div className="text-[11px] opacity-100 mt-1 text-sky-200">
                            {new Date(s.updatedAt).toLocaleString()}
                          </div>
                        )}
                      </div>

                      {editing !== s.id && (
                        <div className="flex items-center gap-1 opacity-90 ml-1 text-amber-200">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              beginEdit(s.id, s.title);
                            }}
                            className={[
                              "p-1 rounded hover:bg-neutral-800",
                              "focus:outline-none focus:ring-2 focus:ring-sky-400/40",
                              A.hoverBtn,
                            ].join(" ")}
                            title="Rename"
                            aria-label={`Rename ${s.title || "session"}`}
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M4 20h4l10.5-10.5a2.5 2.5 0 00-3.536-3.536L4 16v4z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              remove(s.id);
                            }}
                            className="p-1 rounded hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-400/40"
                            title="Delete"
                            aria-label={`Delete ${s.title || "session"}`}
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7m3 0V5a2 2 0 012-2h4a2 2 0 012 2v2M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
              {sessions.length === 0 && (
                <li className="text-neutral-500 text-sm italic px-2 py-1.5">No sessions yet</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </aside>
  );
}
