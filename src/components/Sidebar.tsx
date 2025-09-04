// src/components/Sidebar.tsx

// Import the `useState` hook from React to manage component-level state.
import { useState } from "react";
// Import a custom hook that manages the logic for fetching and updating chat sessions.
import useSessions from "../hooks/useSessions";

// This is a React Functional Component named `Sidebar`.
// It accepts `props` (properties) as an argument. Here, we destructure the props
// to directly get `userId` and `onOpen`.
// The TypeScript `{ userId: string; onOpen: (id: string) => void }` defines the expected shape of the props.
export default function Sidebar({ userId, onOpen }: { userId: string; onOpen: (id: string) => void }) {
  // We use our custom hook to get the list of sessions and functions to interact with them.
  const { sessions, activeId, select, rename, remove } = useSessions(userId);

  // `useState` is a hook to add state to a component.
  // `editing` will store the ID of the session being edited, or `null` if none are.
  const [editing, setEditing] = useState<string | null>(null);
  // `titleDraft` will store the text inside the input field while editing a session title.
  const [titleDraft, setTitleDraft] = useState("");

  // This function is called when the user clicks the "Rename" button.
  function beginEdit(id: string, current: string) {
    // It sets the `editing` state to the ID of the item, triggering a re-render.
    setEditing(id);
    // It pre-fills the input field with the current title.
    setTitleDraft(current);
  }

  // This function is called when the user finishes editing (e.g., by pressing Enter or clicking away).
  function commitEdit(id: string) {
    // It calls the `rename` function from our `useSessions` hook to save the change.
    rename(id, titleDraft.trim() || "Untitled");
    // It resets the `editing` state to `null`, which will hide the input field.
    setEditing(null);
  }

  // The JSX returned by the component, which describes the UI structure.
  return (
    // `<aside>` is a semantic HTML tag, perfect for a sidebar.
    // `className` is how you apply CSS classes in JSX. These are Tailwind CSS utility classes.
    <aside className="text-sm space-y-2">
      {/* This `div` acts as a simple, non-interactive label for the section. */}
      <div className="opacity-60 px-2">Sessions</div>

      {/* This `div` is a container for the list of session items. `space-y-1` adds space between them. */}
      <div className="space-y-1">
        {/* 
          This is the standard way to render a list in React.
          We use the `.map()` array method to transform each `session` object into a JSX element.
        */}
        {sessions.map((s) => {
          // Check if the current session in the loop is the active one.
          const active = activeId === s.id;
          return (
            // This is the main container `div` for a single session item in the list.
            // The `key` prop is essential for React to efficiently update the list. It must be a unique string or number.
            <div
              key={s.id}
              // The `className` is dynamic. It changes based on whether the item is `active`.
              // `group` is a special Tailwind class that lets child elements react to the parent's hover state.
              className={`group rounded-lg px-2 py-2 cursor-pointer transition
                ${active ? "bg-neutral-800/80" : "hover:bg-neutral-900"}`}
              // When this `div` is clicked, we select the session and notify the parent component.
              onClick={() => { select(s.id); onOpen(s.id); }}
            >
              {/* 
                This is conditional rendering.
                If `editing` state matches this session's ID, we render an `<input>` field.
                Otherwise, we render the normal display view.
              */}
              {editing === s.id ? (
                // The input field for renaming a session.
                <input
                  autoFocus // Automatically focuses the input when it appears.
                  value={titleDraft} // The input's value is controlled by our `titleDraft` state.
                  onChange={(e) => setTitleDraft(e.target.value)} // Updates the state on every keystroke.
                  onBlur={() => commitEdit(s.id)} // `onBlur` fires when the input loses focus (user clicks away).
                  onKeyDown={(e) => (e.key === "Enter" ? commitEdit(s.id) : null)} // Commits the edit if Enter is pressed.
                  className="w-full bg-transparent outline-none border-b border-neutral-700"
                />
              ) : (
                // This is the normal view when not editing.
                // This `div` uses flexbox to arrange the title and buttons side-by-side.
                <div className="flex items-center justify-between gap-2">
                  {/* This `div` holds the session title. `truncate` prevents long titles from breaking the layout. */}
                  <div className="truncate">{s.title}</div>
                  {/* This `div` contains the action buttons. It's invisible by default (`opacity-0`)
                      but becomes visible when the parent `div` (with the `group` class) is hovered. */}
                  <div className="opacity-0 group-hover:opacity-100 transition flex gap-1">
                    {/* The "Rename" button. */}
                    <button
                      className="text-xs px-2 py-1 rounded border border-neutral-700"
                      // `e.stopPropagation()` is crucial here. It prevents the `onClick` of the parent `div`
                      // from firing. Without it, clicking "Rename" would also trigger `select(s.id)`.
                      onClick={(e) => { e.stopPropagation(); beginEdit(s.id, s.title); }}
                    >
                      Rename
                    </button>
                    {/* The "Delete" button. */}
                    <button
                      className="text-xs px-2 py-1 rounded border border-red-700 text-red-300"
                      // It also uses `stopPropagation` for the same reason.
                      onClick={(e) => { e.stopPropagation(); remove(s.id); }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
              {/* This `div` simply displays the last updated timestamp for the session. */}
              <div className="text-[11px] opacity-50 mt-1">{new Date(s.updatedAt).toLocaleString()}</div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
