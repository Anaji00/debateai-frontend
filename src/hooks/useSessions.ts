// src/hooks/useSessions.ts
/**
 * Custom hook to manage the state and interactions for a user's debate sessions.
 * It handles fetching, selecting, renaming, and deleting sessions.
 */

import { useEffect, useMemo, useState } from "react";
import {
  listLocalSessions,
  loadSession,
  renameSession as persistRename,
  deleteSession as persistDelete,
  getLastSessionId,
  setLastSessionId,
  type SessionMeta,
  onSessionsChanged,
} from "../lib/persist";

/**
 * @param userId The current user's unique ID, used to namespace sessions.
 */
export default function useSessions(userId: string) {
  // State for the list of all session metadata.
  const [sessions, setSessions] = useState<SessionMeta[]>(() => listLocalSessions(userId));

  // State for the ID of the currently selected session.
  const [activeId, setActiveId] = useState<string | null>(() => getLastSessionId(userId));

  // Syncs session state with localStorage when the user ID changes or when
  // changes are made in other browser tabs.
  useEffect(() => {
    setSessions(listLocalSessions(userId));
    setActiveId(getLastSessionId(userId));
    const off = onSessionsChanged((changedUserId) => {
      if (changedUserId !== userId) return;
      setSessions(listLocalSessions(userId));
      setActiveId(getLastSessionId(userId));
    });
    return off;
  }, [userId]);

  // Memoize the active session data to avoid re-loading it on every render.
  // This only re-runs when the activeId or the list of sessions changes.
  const active = useMemo(() => {
    if (!activeId) return null;
    return loadSession(userId, activeId);
  }, [userId, activeId, sessions]);

  /** Selects a session by its ID. */
  function select(id: string) {
    setActiveId(id);
    setLastSessionId(userId, id);
  }

  /** Renames a session. The state updates via the `onSessionsChanged` listener. */
  function rename(id: string, title: string) {
    persistRename(userId, id, title);
  }

  /**
   * Deletes a session.
   * The session list updates via the `onSessionsChanged` listener.
   */
  function remove(id: string) {
    persistDelete(userId, id);
    // If the deleted session was the active one, clear the active selection.
    if (activeId === id) setActiveId(null);
  }

  // Expose the public API of the hook.
  return { sessions, activeId, active, select, rename, remove, refresh: () => setSessions(listLocalSessions(userId)),
   };
}
