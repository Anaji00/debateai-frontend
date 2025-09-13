// Import core React hooks for managing component state and side effects.
import React, { useEffect, useState } from "react";
// Import hooks from `react-router-dom` for navigation and accessing URL details.
import { Link, useLocation, useNavigate } from "react-router-dom";
// Import our custom hook to handle authentication logic like logging in.
import { useAuth } from "../auth/authProvider";

/**
 * LoginPage
 * ---
 * Glassy sign-in card with amber accent button. Maintains original
 * authentication logic while enhancing visual polish.
 */
export default function LoginPage() {
  // Get authentication functions and state from our custom `useAuth` hook.
  const { login, isAuthenticated, isLoading } = useAuth();
  // `useNavigate` gives us a function to programmatically redirect the user.
  const navigate = useNavigate();
  // `useLocation` gives us information about the current URL, including any state passed during navigation.
  const location = useLocation() as { state?: { from?: Location } };

  // --- Component State ---
  // We use `useState` to manage the form's data and UI state.
  // When this state changes, the component re-renders.
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  // `submitting` tracks if the login request is in progress, used to disable the button.
  const [submitting, setSubmitting] = useState(false);
  // `error` holds any error message to display to the user.
  const [error, setError] = useState<string | null>(null);

  // `useEffect` runs side effects. This one handles redirecting the user after they log in.
  useEffect(() => {
    // We only want to redirect if the auth check is done (`!isLoading`) and the user is authenticated.
    if (!isLoading && isAuthenticated) {
      // If the user was sent here from a protected page, `location.state.from` will have their original destination.
      // We redirect them back there. Otherwise, we send them to the main `/debate` page.
      const dest = location.state?.from?.pathname || "/debate";
      navigate(dest, { replace: true });
    }
    // This effect runs whenever any of these values change.
  }, [isAuthenticated, isLoading, location.state, navigate]);

  // This function is called when the user submits the form.
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // `e.preventDefault()` stops the browser from doing a full page reload on form submission.
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await login(username, password);
      // If login is successful, the `useEffect` above will handle the redirect.
    } catch (err: any) {
      // Show a user-friendly error message instead of a technical one from the API.
      const msg = "Login failed. Please check your credentials and try again.";
      setError(msg);
    } finally {
      // The `finally` block always runs, making it perfect for cleanup. We re-enable the form here.
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-b from-neutral-950 to-black px-4">
      <form
        className="w-full max-w-md bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 text-white backdrop-blur shadow-xl shadow-black/30"
        onSubmit={handleSubmit}
        noValidate
        // `aria-busy` is a great accessibility feature, telling screen readers when the form is processing.
        aria-busy={submitting || isLoading}
      >
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="text-sm text-neutral-400 mb-6">
          Welcome back—enter your credentials.
        </p>

        {/* Each input is paired with a label for accessibility. The `htmlFor` attribute links them. */}
        <label htmlFor="username" className="block text-sm opacity-80">
          Username
        </label>
        <input
          id="username"
          className="mt-1 mb-4 w-full rounded-xl bg-neutral-800 border border-neutral-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
          value={username}
          // This `onChange` handler updates our state, keeping the UI and component state in sync (a "controlled component").
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />

        <label htmlFor="password" className="block text-sm opacity-80">
          Password
        </label>
        <input
          id="password"
          type="password"
          className="mt-1 mb-4 w-full rounded-xl bg-neutral-800 border border-neutral-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {/* This is conditional rendering: the error message only appears if the `error` state is not null. */}
        {error && (
          <div className="mb-4 text-sm text-red-300 border border-red-700 rounded p-2 bg-red-950/30">
            {error}
          </div>
        )}

        <button
          type="submit"
          // Disabling the button during submission prevents the user from sending duplicate requests.
          disabled={submitting}
          className="w-full rounded-xl bg-amber-400 text-black font-medium py-2 disabled:opacity-50 hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
        >
          {/* Changing the button text gives the user clear feedback about the form's status. */}
          {submitting ? "Signing in…" : "Sign in"}
        </button>

        <div className="mt-4 text-sm text-neutral-400">
          Don’t have an account?{" "}
          {/* The `Link` component from react-router-dom provides fast, client-side navigation without a full page reload. */}
          <Link
            to="/register"
            className="text-amber-300 hover:underline focus:outline-none focus:ring-2 focus:ring-amber-400/40 rounded"
          >
            Register
          </Link>
        </div>
      </form>
    </div>
  );
}
