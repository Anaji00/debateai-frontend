// src/components/Sidebar.tsx

// Import the `useState` hook from React to manage component-level state.
import { useState, useMemo } from "react";
// Import a custom hook that manages the logic for fetching and updating chat sessions.
import useSessions from "../hooks/useSessions";


type Accent = "amber" | "sky";

interface SidebarProps {
  userId: string,
  onOpen: (id:string) => void;
  onNew?: () => void;
  accent?: Accent;
}

// Maps accent names to specific Tailwind CSS classes for styling.
const ACCENT: Record<Accent, {ring: string; textDim: string; hoverBtn: string; focusRing: string}> = {
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

// The Sidebar component displays a list of debate sessions.
export default function Sidebar({ userId, onOpen, onNew, accent = "amber"}: SidebarProps) {
  // `useSessions` is a custom hook that fetches and manages session data.
  const { sessions, activeId, select, rename, remove } = useSessions(userId);

  // `editing` state holds the ID of the session currently being renamed.
  const [editing, setEditing] = useState<string | null>(null);
  // `titleDraft` state holds the new title text while editing.
  const [titleDraft, setTitleDraft] = useState("");

  // `useMemo` optimizes performance by only recalculating the accent styles when `accent` prop changes.
  const A = useMemo(() => ACCENT[accent], [accent]);

  // Puts a session into "edit mode".
  function beginEdit(id: string, current: string) {
    setEditing(id);
    setTitleDraft(current);
  }

  // Saves the new title for a session.
  function commitEdit(id: string) {
    rename(id, titleDraft.trim() || "Untitled");
    setEditing(null);
  }

  // Exits "edit mode" without saving changes.
  function cancelEdit() {
    setEditing(null);
  }

  return (
    // The `<aside>` tag is used for content that is tangentially related to the main content, like a sidebar.
    <aside className="text-w-64 bg-neutral-900 border-r border-neutral-800 p-4 flex flex-col space-y-2">
      {/* Header with title and "New Session" button */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-neutral-300 uppercase tracking-wide">
          Debate Sessions
        </span>

        <button
          // The `className` array is joined into a single string of CSS classes.
          type="button"
          className= {[
            "p-1 rounded text-neutral-200 bg-neutral-800",
            "hover:bg-neutral-700 transition-colors",
            A.focusRing,
            "focus:outline-none focus:ring-2 ring-offset-0",
          ].join(" ")}
          onClick={() => onNew?.()}
          title="New Debate Session"
          aria-label="New Debate Session"
          >
            ➕
          </button>
      </div>

      {/* This div contains the scrollable list of all debate sessions. */}
      <div className="space-y-1 overflow-y-auto flex-1 pr-1">
        {/* We loop through the `sessions` array to render each session item. */}
        {sessions.map((s) => {
          // Check if the current session is the one that's active.
          const active = activeId === s.id;

          return (
            <div
              key = {s.id}
              className= {[
                "group relative p-2 rounded-lg flex items-center justify-betweeen",
                "transition-color cursor-pointer border border-transparent",
                active
                  ? `bg-neutral-900 ring-2 ${A.ring}`
                  : "bg-neutral-900 hover:bg-neutral-800",
              ].join(" ")}
              // When a session is clicked, it becomes the active one.
              onClick={() => {
                select(s.id);
                onOpen(s.id);
              }}
              role="button"
              aria-pressed={active}
              tabIndex={0}
              // Allows selection with Enter or Spacebar for accessibility.
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  select(s.id);
                  onOpen(s.id);
                }
              }}
              title= {s.title || "Untitled Debate Session"}
              >
                {/* Main content of the session item */}
                <div className="flex-1 min-w-0">
                  {editing === s.id ? (
                    // If in edit mode, show an input field to rename the session.
                    <input
                      autoFocus
                      value={titleDraft}
                      onChange={(e) => setTitleDraft(e.target.value)}
                      onBlur={() => commitEdit(s.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit(s.id);
                        else if (e.key === "Escape") cancelEdit();
                      }}
                      className= {[
                        "w-full bg-transparent outline-none",
                        "border-b border-neutral-700 focus:border-neutral-400",
                        "text-sm"
                      ].join(" ")}
                      aria-label="Rename Debate Session"
                      />
                  ) : (
                    // Otherwise, just display the session title.
                    <div className="flex items-center gap-2">
                      <div className="flex-1 truncate text-sm text-neutral-200">
                      {s.title || "Untitled Debate Session"}
                  </div> 
                </div>
                )}

                {/* Display the last updated timestamp for the session. */}
                <div className="text-[11px] opacity-60 mt-1">
                  {new Date(s.updatedAt).toLocaleString()}
                </div>
              </div>

              {/* Show rename and delete buttons only on hover and if not currently editing. */}
              {editing !== s.id && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                  <button
                    type="button"
                    // `e.stopPropagation()` prevents the click from bubbling up to the parent div's `onClick`.
                    onClick={(e) => {
                      e.stopPropagation();
                      beginEdit(s.id, s.title);
                    }}
                    className={[
                      "px-2 py-1 rounded text-xs text-neutral-200",
                      "hover:bg-neutral-700 transition-colors",
                      A.focusRing,
                      "focus:outline-none focus:ring-2 ring-offset-0",
                      A.hoverBtn,
                    ].join(" ")}
                    title="Rename"
                    aria-label= {`Rename ${s.title} || "session"}`}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      // This button calls the `remove` function from the `useSessions` hook.
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(s.id);
                      }}
                      className={[
                        "px-2 py-1 rounded text-xs text-red-300",
                        "hover:bg-red-700/30 transition-colors",
                        "focus:outline-none focus:ring-2 focus:ring-red-500",
                      ].join (" ")}
                      title= "Delete"
                      aria-label = {`Delete ${s.title} || "session}`}
                      >
                        🗑️
                      </button>
                </div>
              )}
              </div>
          );
        })}

        {/* If there are no sessions, display a helpful message. */}
        {sessions.length === 0 && (
          <div className="text-neutral-500 text-sm italic">No sessions yet</div>
          )}
      </div>
    </aside>
  );
}