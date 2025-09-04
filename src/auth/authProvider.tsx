// src/auth/authProvider.tsx

// Import necessary hooks and types from React.
import React, {
  createContext, // A way to pass data through the component tree without having to pass props down manually at every level.
  useContext,    // A hook to "consume" or use the value from a React Context.
  useEffect,     // A hook to perform side effects in function components (e.g., data fetching, subscriptions).
  useMemo,       // A hook to memoize expensive calculations, so they are not re-computed on every render.
  useRef,        // A hook to get a reference to a DOM element or to store a mutable value that doesn't cause a re-render.
  useState,      // A hook to add state to functional components.
  type ReactNode, // A TypeScript type for anything React can render (JSX, strings, numbers, etc.).
} from "react";

// Import API functions for authentication. These handle the actual network requests.
import {
  getMe,
  postLogin,
  postLogout,
  postRegister,
  type MeResponse, // TypeScript type for the response from the 'getMe' endpoint.
} from "../auth/api";

// Define the shape of the user object we'll store in our state.
export type AuthUser = { identifier: string };

// Define the shape of the data that our AuthContext will provide.
// This is like a contract for what `useAuth()` will return.
type AuthContextType = {
  user: AuthUser | null; // The current user object, or null if not logged in.
  isAuthenticated: boolean; // A quick boolean flag to check if the user is logged in.
  isLoading: boolean; // True while we are checking the user's session (e.g., on page load).
  login: (username: string, password: string) => Promise<void>; // Function to log the user in.
  logout: () => Promise<void>; // Function to log the user out.
  refresh: () => Promise<void>; // Function to re-fetch the user's data.
  register?: (u: { username: string; email: string; password: string }) => Promise<void>; // Optional function to register a new user.
};

/**
 * Create the React Context.
 * It's initialized with `null` because we will provide the actual value
 * inside the `AuthProvider` component.
 */
const AuthContext = createContext<AuthContextType | null>(null);

/**
 * A helper function to safely extract a user identifier from the API response.
 * It tries to find 'username', 'identifier', or 'email' in that order.
 * me The user object from the API.
 * returns A string identifier or null if none is found.
 */
function extractIdentifier(me: MeResponse | null): string | null {
  if (!me) return null;
  // This is a common pattern to gracefully handle different possible shapes of an API response.
  return (
    (typeof me.username === "string" && me.username) ||
    (typeof me.identifier === "string" && me.identifier) ||
    (typeof me.email === "string" && me.email) ||
    null
  );
}

/**
 * The AuthProvider component.
 * This component will wrap our entire application (or parts of it)
 * to provide authentication state and functions to all children components.
 * This is a common pattern called the "Provider Pattern".
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // `useState` is used to manage the component's internal state.
  // When state changes, React re-renders the component.
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Tracks loading state, initially true.

  // `useRef` is used to store a mutable value that does not cause a re-render when it changes.
  // Here, we use it to keep track of the AbortController for our `refresh` API call.
  // This allows us to cancel an ongoing request if a new one is made.
  const refreshAbort = useRef<AbortController | null>(null);

  // `useEffect` runs side effects. This one runs only once when the component first mounts,
  // because its dependency array `[]` is empty.
  useEffect(() => {
    // We try to refresh the user's session on initial app load to see if they are already logged in.
    refresh().finally(() => setIsLoading(false)); // `finally` ensures we stop loading, even if `refresh` fails.

    // The function returned from `useEffect` is a "cleanup" function.
    // It runs when the component is unmounted. Here, we abort any ongoing refresh request
    // to prevent memory leaks or state updates on an unmounted component.
    return () => refreshAbort.current?.abort();
  }, []); // <-- Empty dependency array means this effect runs only once on mount.

  /**
   * Fetches the current user's data from the server and updates the state.
   * This is used to check if a user has an active session (e.g., via a cookie).
   */
  async function refresh() {
    try {
      // If there's an ongoing refresh request, cancel it before starting a new one.
      refreshAbort.current?.abort();
      // Create a new AbortController for the new request.
      refreshAbort.current = new AbortController();
      // Call the API to get the user data.
      const me = await getMe(refreshAbort.current.signal);
      // Extract a unique identifier from the response.
      const id = extractIdentifier(me);
      // Update the user state. If `id` is found, create a user object; otherwise, set to null.
      setUser(id ? { identifier: id } : null);
    } catch (err: any) {
      // We ignore 'AbortError' because that's an expected error when we cancel a request.
      // For any other error, we assume the user is not logged in and set user to null.
      if (err?.name !== "AbortError") setUser(null);
    }
  }

  /**
   * Logs a user in by calling the login API and then refreshing the user data.
   */
  async function login(username: string, password: string) {
    await postLogin({ username, password });
    // After a successful login, we refresh the session to get the user data.
    await refresh();
  }

  /**
   * Logs the user out.
   */
  async function logout() {
    try {
      // Tell the backend to invalidate the user's session/cookie.
      await postLogout();
    } finally {
      // Regardless of whether the API call succeeds or fails,
      // we clear the user from the local state to log them out on the frontend.
      setUser(null);
    }
  }

  /**
   * Registers a new user, logs them in, and refreshes the session.
   */
  async function register(data: { username: string; email: string; password: string }) {
    await postRegister(data); // <-- uses the named export we just ensured exists
    // After successful registration, we immediately log the new user in.
    await postLogin({ username: data.username, password: data.password });
    // Then, we refresh the session to get their data and update the UI.
    await refresh();
  }

  // `useMemo` is a performance optimization.
  // It ensures that the `value` object is only recreated when `user` or `isLoading` changes.
  // Without `useMemo`, a new `value` object would be created on every render,
  // causing all components that consume this context to re-render unnecessarily.
  const value = useMemo<AuthContextType>(
    () => ({ user, isAuthenticated: !!user, isLoading, login, logout, refresh, register }),
    [user, isLoading], // <-- Dependencies for `useMemo`.
  );

  // The Provider component makes the `value` available to all child components.
  // Any component inside `<AuthProvider>` can now access the auth state and functions via `useAuth()`.
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * A custom hook for consuming the AuthContext.
 * Custom hooks are a convention for reusing stateful logic between components.
 * They must start with the word "use".
 * @returns The authentication context value.
 */
export function useAuth() {
  // `useContext` gets the current value from the nearest `AuthContext.Provider`.
  const ctx = useContext(AuthContext);
  // This check is a safeguard. If a component tries to `useAuth()` outside of an `<AuthProvider>`,
  // it will throw a helpful error instead of failing silently.
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
