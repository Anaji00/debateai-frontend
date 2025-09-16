# DebateAI Frontend

This project is the frontend for the DebateAI application, built with React and TypeScript.

## Key Features

- Real-time, multi-character debate streaming.
- Support for different debate modes (Versus, Solo, etc.).
- Session management (saving and loading debates).
- Text-to-speech audio generation for debate turns.

## Sidebar Component

The `Sidebar.tsx` component renders the sidebar UI for the application. It is responsible for managing debate sessions and handling Retrieval-Augmented Generation (RAG) documents.

### Debate Sessions

The sidebar allows users to:
- **List existing debate sessions:** Previously saved debates are listed, showing their title and last updated time.
- **Create new sessions:** A "New" button allows users to start a fresh debate.
- **Rename sessions:** An inline editing feature lets users rename existing sessions.
- **Delete sessions:** Users can remove sessions they no longer need.
- **Switch between sessions:** Clicking on a session in the list makes it the active one.

### Documents (RAG) Panel

This panel, located at the top of the sidebar, manages documents for the currently active debate session. This functionality is crucial for providing context to the AI debaters.

- **Upload Documents:** Users can upload files (PDF, TXT, MD) to be associated with a session.
- **List Documents:** Uploaded documents are listed within the panel.
- **Delete Documents:** A "Clear" button removes all documents for the current session.
- **Pause/Resume:** A control allows pausing and resuming the RAG functionality.

---

## Technical Deep Dive: Fixing the Streaming Text Animation

A key feature of the UI is the "typing animation" where a new message from a character has a slight delay before the first letters appear. This gives the user a moment to see who is "about to speak." We recently fixed a critical bug in this animation logic.

### The Problem: Scrambled Text

When a new message stream began, the first few characters would often appear scrambled. For example, "Your" would render as "ourY". This happened because multiple text "delta" events were arriving from the server faster than our animation delay.

### The Root Cause: A Race Condition

The issue was a classic race condition in our `useDebate.ts` hook:

1.  **Event 1 (`Y`) arrives:** The code would see this was the first character of a new message and schedule it to be rendered after a `250ms` delay using `setTimeout`. It would also *immediately* flag that we had "seen" the first character.
2.  **Event 2 (`o`) arrives:** This event would arrive *before* the `250ms` timer for `Y` was finished.
3.  **Incorrect Rendering:** The code would check the "seen" flag, see it was `true`, and immediately render `o`.
4.  **Timer Finishes:** The `250ms` timer for `Y` would finally fire and append `Y` to the already-rendered `o`, resulting in the scrambled text `oY`.

### The Solution: Buffering and Delayed Flagging

We implemented a two-part solution in `useDebate.ts` to make the animation robust.

#### 1. Buffering Initial Deltas

We introduced a `initialDeltaBufferRef` (a `useRef` holding a `Map`). When delta events arrive during the initial animation delay, we don't try to render them. Instead, we collect them in this buffer.

```typescript
// In useDebate.ts
const initialDeltaBufferRef = useRef<Map<number, string>>(new Map());
```

#### 2. Correctly Timed Logic

The `setTimeout` is now only set for the very first delta of a turn. When its timer completes:

1.  It appends the **entire buffered string** at once, ensuring all characters collected during the delay are in the correct order.
2.  **Only then** does it set the `firstDeltaSeenRef` flag. This is the critical change.
3.  It clears the buffer for that turn.

By waiting to set the `firstDeltaSeenRef` flag until *after* the initial buffer is flushed, we guarantee that any subsequent deltas that arrive are correctly treated as "immediate appends" without interfering with the initial animated chunk.

This approach makes the animation reliable, prevents race conditions, and maintains a smooth user experience, even with very fast-streaming backends.