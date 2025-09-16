// src/components/Sidebar.tsx

/**
 * Renders the sidebar UI for the application.
 * This component is responsible for:
 * - Listing, creating, renaming, and deleting debate sessions.
 * - Managing Retrieval-Augmented Generation (RAG) documents for the active session.
 */
import { useState, useMemo, useEffect, useRef } from "react";
import useSessions from "../hooks/useSessions";
import { uploadDoc, listDocs, deleteDocsForOwner } from "../api/debateClient";

type Accent = "amber" | "sky";

/**
 * Props for the Sidebar component.
 */
interface SidebarProps {
  userId: string;
  sessionId?: string | null;
  onOpen: (id: string) => void;
  onNew?: () => void;
  reset?: () => void;
  adoptSession?: (id: string) => void;
  accent?: Accent;
}

/**
 * Represents a single document entry in the RAG panel.
 */
type DocEntry = {
  id?: string | number;
  title?: string;
  size_bytes?: number;
};

/**
 * A map of accent color names to their corresponding Tailwind CSS classes.
 * This allows for easy theming of UI elements like rings, text, and buttons.
 */
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

export default function Sidebar(props: SidebarProps){
  const {
  userId,
  sessionId,
  onOpen,
  onNew,
  reset,
  accent = "amber",
} = props
  const { sessions, activeId, select, rename, remove } = useSessions(userId);

  // --- Component State ---
  // State for inline renaming of session titles.
  const [editing, setEditing] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");

  // State for the RAG (Retrieval-Augmented Generation) panel.
  const [docs, setDocs] = useState<DocEntry[]>([]);
  const [ragBusy, setRagBusy] = useState(false);
  const [ragPaused, setRagPaused] = useState(false);
  const hasActiveSession = !!sessionId;

  // Ref for the hidden file input to programmatically trigger file selection.
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memoized accent color classes to avoid recalculating on every render.
  const A = useMemo(() => ACCENT[accent], [accent]);

  // Starts the editing mode for a session title.
  function beginEdit(id: string, current: string) {
    setEditing(id);
    setTitleDraft(current);
  }
  // Commits the new title for a session.
  function commitEdit(id: string) {
    rename(id, titleDraft.trim() || "Untitled");
    setEditing(null);
  }
  function cancelEdit() {
    setEditing(null);
  }

  // Fetches and loads documents for the currently active session.
  useEffect(() => {
    if (!sessionId || ragPaused) {
      setDocs([]);
      return;
    }
    (async () => {
      try {
        const {docs: arr = []} = (await listDocs(Number(sessionId))) as {docs:DocEntry[] };
        setDocs(arr);
      } catch (e) {
        console.error("[Sidebar] listDocs failed:", e);
      }
    })();
  }, [sessionId, ragPaused]);

  // Handles the file upload process for RAG documents.
  async function handleUploadFiles(files: FileList | null) {
    if (!files || !sessionId || ragPaused) return;
    setRagBusy(true);
    try {
      for (const f of Array.from(files)) {
        await uploadDoc(Number(sessionId), f, "shared", f.name);
      }
      const {docs: arr = []} = await listDocs(Number(sessionId));
      setDocs(arr);
    } catch (e) {
      console.error("[Sidebar] uploadDoc failed:", e);
    } finally {
      setRagBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // Deletes all documents associated with the current session.
  async function handleDeleteAllDocs() {
    if (!sessionId || ragPaused) return;
    setRagBusy(true);
    try {
      await deleteDocsForOwner(Number(sessionId), "shared");
      const {docs: arr = []} = await listDocs(Number(sessionId));
      setDocs(arr);
    } catch (e) {
      console.error("[Sidebar] deleteDocsForOwner failed:", e);
    } finally {
      setRagBusy(false);
    }
  }
  // Calls the reset function provided via props.
  function handleReset() {
    reset?.();
  }


  return (
    <aside className="w-64 bg-neutral-900 border-r border-neutral-800 p-4 flex flex-col space-y-3">
      {/* --- Documents (RAG) panel — pinned above sessions --- */}
      <section
        className="rounded-xl border border-neutral-800 bg-neutral-900/60 backdrop-blur p-3 shadow-inner shadow-black/10"
        aria-labelledby="rag-panel-title"
      >
        <div className="flex items-center justify-between">
          <h3
            id="rag-panel-title"
            className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-sky-400"
          >
            Documents (RAG)
          </h3>

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
              {ragPaused ? "Resume" : "Pause"}
            </button>

            {/* Upload */}
            <label
              className={[
                "inline-flex items-center gap-2 px-2 py-1.5 rounded-md border border-neutral-700 bg-neutral-800 text-xs text-neutral-200",
                "transition hover:border-amber-400 hover:text-amber-300",
                "focus-within:ring-2 focus-within:ring-amber-400/40",
                (!hasActiveSession || ragBusy || ragPaused) ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
              ].join(" ")}
              title={!hasActiveSession ? "Start a session first" : "Upload documents"}
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                <path d="M7 9l5-5 5 5" />
                <path d="M12 4v12" />
              </svg>
              <span>Upload</span>
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
              Clear
            </button>
          </div>
        </div>

        {!hasActiveSession ? (
          <p className="mt-2 text-xs text-neutral-400">
            Start a session to attach reference documents.
          </p>
        ) : (
          <ul className="mt-2 space-y-1 max-h-40 overflow-auto pr-1 custom-scroll">
            {docs.length === 0 ? (
              <li className="text-xs text-neutral-500">No docs yet.</li>
            ) : (
              docs.map((d, i) => (
                <li
                  key={String(d.id ?? `${d.title}-${i}`)}
                  className="text-xs text-neutral-200 truncate border border-neutral-800 rounded-md px-2 py-1 bg-neutral-900/50"
                  title={d.title}
                >
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"
                      aria-hidden="true"
                    />
                    {d.title || "Untitled"}
                  </span>
                </li>
              ))
            )}
          </ul>
        )}
      </section>

      {/* --- Sessions header + New button --- */}
      <div className="mt-1 mb-1 flex items-center justify-between">
        <span className="text-sm font-semibold text-neutral-300 uppercase tracking-wide">
          Debate Sessions
        </span>
        <div className="flex items-center gap-1">
          <button
            type = "button"
            onClick={handleReset}
            className={[
              "p-1 rounded text-neutral-200 bg-neutral-800",
              "transition-colors hover:bg-neutral-700",
              "focus:outline-none focus:ring-2 focus:ring-red-400/40",
            ].join(" ")}
            title="Reset Session"
            aria-label="Reset Session"
          >
            {/* Circle-X icon */}
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx={12} cy={12} r={9} />
              <path d="M15 9l-6 6m9 9l6 6" />
            </svg>
          </button>
              {/* New Session */}
        <button
          type="button"
          className={[
            "p-1 rounded text-neutral-200 bg-neutral-800",
            "transition-colors transition-shadow hover:bg-neutral-700",
            A.focusRing,
            "focus:outline-none focus:ring-2 ring-offset-0",
          ].join(" ")}
          onClick={() => onNew?.()}
          title="New Debate Session"
          aria-label="New Debate Session"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </div>
      
      {/* --- Sessions list --- */}
      <div className="space-y-1 overflow-y-auto flex-1 pr-1">
        {sessions.map((s) => {
          const active = activeId === s.id;

          return (
            <div
              key={s.id}
              className={[
                "group relative p-2 rounded-lg flex items-center justify-between",
                "transition-colors cursor-pointer border",
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
                    <div className="flex-1 truncate text-sm text-neutral-200">
                      {s.title || "Untitled Debate Session"}
                    </div>
                  </div>
                )}
                <div className="text-[11px] opacity-60 mt-1">
                  {new Date(s.updatedAt).toLocaleString()}
                </div>
              </div>

              {editing !== s.id && (
                <div className="flex items-center gap-1 opacity-90">
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
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M15.232 5.232l3.536 3.536M4 20h4l10.5-10.5a2.5 2.5 0 00-3.536-3.536L4 16v4z" />
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
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M19 7l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7m3 0V5a2 2 0 012-2h4a2 2 0 012 2v2M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {sessions.length === 0 && (
          <div className="text-neutral-500 text-sm italic">No sessions yet</div>
        )}
      </div>
    </aside>
  );
}
