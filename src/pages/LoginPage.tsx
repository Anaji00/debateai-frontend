// src/pages/LoginPage.tsx
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/authProvider";

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  // If user hit a protected page first, ProtectedRoute sent them here with state.from
  const location = useLocation() as { state?: { from?: Location } };

  // Local form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // UX state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // After a successful cookie login, the provider's refresh() sets user → isAuthenticated flips to true.
  // We react to that here and navigate away from /login.
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const dest = location.state?.from?.pathname || "/debate";
      navigate(dest, { replace: true });
    }
  }, [isAuthenticated, isLoading, location.state, navigate]);

  // ---- THIS is the handleSubmit you want ----
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();          // Stop the browser from doing a full page post
    if (submitting) return;      // Block rapid double-clicks / keypresses

    setSubmitting(true);
    setError(null);

    try {
      // Calls POST /auth/login (x-www-form-urlencoded) and then /auth/me (in your provider)
      await login(username, password);

      // DO NOT navigate here imperatively; let the effect above handle it once isAuthenticated flips.
      // That guarantees the cookie round-trip + /auth/me completed before moving pages.

    } catch (err: any) {
      // Show a friendly message; include server text if available
      const msg =
        err?.message?.trim() ||
        "Login failed. Please check your credentials and try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <form
        className="w-full max-w-md bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 text-white backdrop-blur"
        onSubmit={handleSubmit}
        noValidate
        aria-busy={submitting || isLoading}
      >
        <h1 className="text-2xl font-semibold mb-2">Sign in</h1>
        <p className="text-sm text-neutral-400 mb-6">Welcome back.</p>

        <label htmlFor="username" className="block text-sm opacity-80">Username</label>
        <input
          id="username"
          className="mt-1 mb-4 w-full rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-600"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />

        <label htmlFor="password" className="block text-sm opacity-80">Password</label>
        <input
          id="password"
          type="password"
          className="mt-1 mb-4 w-full rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-600"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error && (
          <div className="mb-4 text-sm text-red-300 border border-red-700 rounded p-2 bg-red-950/30">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-white text-black font-medium py-2 disabled:opacity-50"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>

        <div className="mt-4 text-sm text-neutral-400">
          Don’t have an account?{" "}
          <Link to="/register" className="text-white underline">Register</Link>
        </div>
      </form>
    </div>
  );
}
