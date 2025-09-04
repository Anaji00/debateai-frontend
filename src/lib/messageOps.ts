// src/lib/messageOps.ts
import type { Message, SourceItem } from "./chat";

export function appendDeltaByTurnId(prev: Message[], turnId: number, text: string): Message[] {
  const idx = prev.findIndex((m) => m.turnId === turnId);
  if (idx < 0) return prev;
  const out = [...prev];
  out[idx] = { ...out[idx], text: (out[idx].text || "") + text };
  return out;
}

export function updateAudioByTurnId(prev: Message[], turnId: number, audioUrl: string): Message[] {
  const idx = prev.findIndex((m) => m.turnId === turnId);
  if (idx < 0) return prev;
  const out = [...prev];
  out[idx] = { ...out[idx], audio: audioUrl };
  return out;
}

export function updateAudioOnLatestBySpeaker(prev: Message[], rawSpeaker: string, audioUrl: string | null): Message[] {
  if (!audioUrl) return prev;
  const out = [...prev];
  for (let i = out.length - 1; i >= 0; i--) {
    if (out[i].speaker === rawSpeaker && out[i].audio == null) {
      out[i] = { ...out[i], audio: audioUrl };
      break;
    }
  }
  return out;
}

export function setSourcesByTurnId(prev: Message[], turnId: number, items: SourceItem[]): Message[] {
  const idx = prev.findIndex((m) => m.turnId === turnId);
  if (idx < 0) return prev;
  const out = [...prev];
  out[idx] = { ...out[idx], sources: items };
  return out;
}
