// src/types/chat.ts
// Central place for chat UI types and speaker labels (no React imports).

export type DebateModeKey = "Solo" | "Versus" | "Devil's Advocate";

export type Role = "user" | "assistant" | "system";

export interface SourceItem {
  title: string;
  snippet: string;
  chunk_index?: number;
  [k: string]: any;
}

export interface Message {
  role: Role;            // "user" | "assistant" | "system"
  speaker: string;       // bubble header ("You", "Judge", "Karl Marx", etc.)
  text: string;          // chat content (streamed)
  turnId?: number;       // backend turn id (assistant only)
  audio?: string | null; // resolved audio URL for TTS
  sources?: SourceItem[];// optional RAG snippets
}

// Speaker labels used across UI + reducers
export const SPEAKER_USER = "You";
export const SPEAKER_SYSTEM = "System";
