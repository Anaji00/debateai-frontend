// src/auth/api.ts

// This file centralizes all communication with our backend API.
// It's a good practice to keep all API-related code in one place.

// Define the base URL for our API.
// It tries to read from a Vite environment variable `VITE_API_BASE`.
// If it's not found, it defaults to "http://localhost:8000" for local development.
// The `.replace(/\/$/, "")` removes any trailing slash to prevent double slashes in URLs.
export const API_BASE =
  (import.meta as any).env?.VITE_API_BASE?.replace(/\/$/, "") || "http://localhost:8000";

// A constant for the authentication part of the API path.
// This makes it easy to change if the backend API routes are updated.
const AUTH_PREFIX = "/auth";

// A custom TypeScript type for the `fetch` options.
// It extends the standard `RequestInit` and adds our own optional `csrf` flag.
type ApiInit = RequestInit & { csrf?: boolean };

/**
 * A wrapper around the native `fetch` API.
 * This function is a central place to configure all our API requests.
 * It automatically adds the base URL and handles common headers.
 */
export async function apiFetch(path: string, init: ApiInit = {}) {
  // Construct the full URL by combining the base URL and the specific path.
  const url = `${API_BASE}${path}`;
  // Create a new Headers object, copying any headers passed in `init`.
  const headers = new Headers(init.headers || {});

  // Placeholder for Cross-Site Request Forgery (CSRF) protection.
  // If a request needs CSRF protection (`init.csrf` is true), this is where you'd add the token.
  if (init.csrf && !headers.has("X-CSRF-Token")) {
    const token = ""; // wire this up if/when you add CSRF
    if (token) headers.set("X-CSRF-Token", token);
  }

  // Call the native `fetch` with our constructed URL and options.
  return fetch(url, {
    ...init,
    headers,
    // `credentials: "include"` is crucial for cookie-based authentication.
    // It tells the browser to send cookies along with the request to the API domain.
    credentials: "include",
  });
}

// ---------- Types ----------

// A TypeScript type defining the expected shape of the user object from the `/me` endpoint.
// Using types helps prevent bugs by ensuring we access properties that actually exist.
export type MeResponse = {
  id?: number;
  username?: string;
  identifier?: string;
  email?: string;
  [k: string]: unknown; // Allows for other unexpected properties without causing a type error.
};

// ---------- Auth endpoints (all are NAMED exports) ----------

/**
 * Sends a login request to the server.
 * The backend expects the data in `x-www-form-urlencoded` format.
 */
export async function postLogin(payload: { username: string; password: string }) {
  // `URLSearchParams` is a browser API that helps build a URL-encoded string.
  const body = new URLSearchParams();
  body.set("username", payload.username);
  body.set("password", payload.password);

  const res = await apiFetch(`${AUTH_PREFIX}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    csrf: true,
  });
  // `res.ok` is true if the HTTP status code is in the 200-299 range.
  // If the request fails, we throw an error with the response text from the server.
  if (!res.ok) throw new Error(await res.text());
  // On success, the server sets an HttpOnly cookie in the browser. We don't need to return the body.
  return res;
}

/**
 * Sends a logout request to the server.
 */
export async function postLogout() {
  const res = await apiFetch(`${AUTH_PREFIX}/logout`, { method: "POST", csrf: true });
  if (!res.ok) throw new Error(await res.text());
}

/**
 * Fetches the current user's data.
 * This is used to check if the user has a valid session (cookie).
 * It accepts an optional `AbortSignal` to make the request cancellable.
 */
export async function getMe(signal?: AbortSignal): Promise<MeResponse | null> {
  const res = await apiFetch(`${AUTH_PREFIX}/me`, { signal });
  // If the user is not authenticated (401) or the response is empty (204), they are not logged in.
  if (res.status === 401 || res.status === 204) return null;
  // For any other non-successful response, throw an error.
  if (!res.ok) {
    const text = await res.text();
    // If the error response has no body, we can't get more info, so we just return null.
    if (!text) return null;
    throw new Error(text);
  }
  // A `try...catch` block here is a robust way to handle potential JSON parsing errors.
  // For example, if the server returns an empty or malformed response.
  try {
    // Parse the JSON response body and cast it to our `MeResponse` type.
    const data = (await res.json()) as MeResponse;
    return data ?? null;
  } catch {
    // If JSON parsing fails, assume no user data is available.
    return null;
  }
}

/**
 * Sends a registration request to the server.
 * The backend expects the data as a JSON object.
 */
export async function postRegister(payload: { username: string; email: string; password: string }) {
  // Note the difference from `postLogin`: here we send a JSON string.
  const res = await apiFetch(`${AUTH_PREFIX}/users`, {
    method: "POST",
    // We must set the `Content-Type` header to `application/json` so the server knows how to parse the body.
    headers: { "Content-Type": "application/json" },
    // `JSON.stringify` converts our JavaScript object into a JSON string.
    body: JSON.stringify(payload),
    csrf: true,
  });
  // Standard error handling.
  if (!res.ok) throw new Error(await res.text());
  return res;
}
