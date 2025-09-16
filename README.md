# DebateAI Frontend

This project is the frontend for the DebateAI application, built with React and TypeScript. It provides a user interface for real-time, multi-character debate streaming, session management, and more.

## Key Features

*   **Real-time Debate Streaming:** Watch characters debate topics in real-time with a typing animation.
*   **Multiple Debate Modes:**
    *   **Versus:** Two AI characters debate each other on a given topic.
    *   **Solo:** A single AI character explores a topic.
    *   **Devil's Advocate:** An AI character takes a contrary position to a user's thesis.
*   **Session Management:**
    *   Save and load debate sessions.
    *   Create, rename, and delete sessions.
*   **Retrieval-Augmented Generation (RAG):**
    *   Upload reference documents (PDF, TXT, MD) to provide context for the debate.
    *   The AI characters will use the information from these documents in their arguments.
*   **Text-to-Speech:** Listen to the debate with generated audio for each character's turn.
*   **User Authentication:** Secure login and registration system.

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## Project Structure

The project is organized into the following main directories:

*   `src/api`: Contains functions for communicating with the backend API, including debate streaming and document management.
*   `src/assets`: Static assets like images and SVGs.
*   `src/auth`: Handles user authentication, including the auth provider and API calls for login/register.
*   `src/components`: Reusable React components that make up the UI, such as the `Sidebar`, `CharacterSelector`, and `MessageList`.
*   `src/data`: Static data used in the application, like character information.
*   `src/hooks`: Custom React hooks for managing complex state and logic, such as `useDebate` and `useSessions`.
*   `src/lib`: Utility functions for various tasks like audio playback, chat message processing, and data persistence.
*   `src/pages`: Top-level page components that correspond to different routes in the application (e.g., `DebatePage`, `LoginPage`).
*   `src/Routes`: Defines the application's routing structure.
*   `src/types`: TypeScript type definitions used throughout the project.

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