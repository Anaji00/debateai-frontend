// src/lib/history.ts
// This file contains helper functions for formatting chat history data.
// In frontend development, it's common to have data in one shape for the UI
// and need to convert it to a different shape for a backend API.

// --- Type Imports ---
// We import type definitions from other files. This allows TypeScript to check
// our code for correctness without bundling the actual code from those files.
import type { Message } from "./chat";
import type { ChatHistory } from "../api/debateClient";

// --- toChatML Function ---
// This function converts our internal `Message` array into the "ChatML" format,
// which is a standard structure that many AI models expect.

// The function signature defines its inputs and outputs.
// `messages: Message[]`: It accepts one argument, an array of `Message` objects.
// `: Array<{ role: string; content: string }>`: It returns a new array where each object has a `role` and `content`.
export function toChatML(messages: Message[]): Array<{ role: string; content: string }> {
  // We use a chain of array methods to transform the data. This is a functional
  // and declarative style, which is very common in modern JavaScript/React.
  return messages
    // First, `.filter()` creates a new array containing only the messages
    // that are from the 'user' or 'assistant'. We exclude 'system' messages here.
    .filter((m) => m.role === "user" || m.role === "assistant")
    // Next, `.map()` creates another new array. For each message that passed the
    // filter, it transforms it into a new, simpler object with just the `role` and `text` (renamed to `content`).
    .map((m) => ({ role: m.role, content: m.text }));
}

// --- toPairHistory Function ---
// This function creates a very simple version of the history, often useful for
// logging, analytics, or simpler backend services.

// The return type `Array<[string, string]>` describes an array of tuples.
// A tuple is a fixed-size array where the type of each element is known.
// In this case, it's an array of [speaker, text] pairs.
export function toPairHistory(messages: Message[]): Array<[string, string]> {
  // `.map()` iterates over every message and returns a new array.
  // For each message `m`, it creates a two-element array `[m.speaker, m.text]`.
  return messages.map((m) => [m.speaker, m.text]);
}

// --- coerceChatML Function ---
// This is a data validation and sanitization function. Its job is to take
// potentially messy data and force ("coerce") it into a strict, clean format
// that our backend API guarantees it can handle. This is a crucial safety step.

// The input type `Array<{ role?: string | null; content?: unknown }>` is very loose.
// `role?` means the role property is optional. `| null` means it could be null.
// `content?: unknown` means the content is optional and could be any type.
// The return type `ChatHistory` is a strict type imported from our API client.
export function coerceChatML(raw: Array<{ role?: string | null; content?: unknown }>): ChatHistory {
  // This is a local helper function defined inside `coerceChatML`.
  // It validates and normalizes the 'role' string.
  const mapRole = (v: string): "user" | "assistant" | null => {
    const r = v.toLowerCase().trim();
    if (r === "user") return "user";
    // We map several possible assistant-like roles to the single 'assistant' role.
    if (["assistant", "system", "tool", "function", "developer"].includes(r)) return "assistant";
    // If the role is not recognized, we return `null` to signal it's invalid.
    return null;
  };
  // `.reduce()` is a powerful array method that processes an array and "reduces"
  // it down to a single value. Here, we're reducing it to a new, clean array.
  // The `[]` at the end is the initial value for our accumulator (`acc`).
  return raw.reduce<ChatHistory>((acc, item) => { // `acc` is the array we are building, `item` is the current element.
    // We call our helper to get a validated role. `String(item.role ?? "")` safely handles if `role` is missing or null.
    const role = mapRole(String(item.role ?? ""));
    // We also safely convert `content` to a string and trim whitespace.
    const content = String(item.content ?? "").trim();
    // This is the core validation logic. We only add the item to our new array
    // if both the `role` and `content` are valid (i.e., not null or empty).
    if (role && content) acc.push({ role, content });
    // It's essential to return the accumulator in each step of the reduce function.
    return acc;
  }, []);
}
