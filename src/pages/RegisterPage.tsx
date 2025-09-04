// src/pages/RegisterPage.tsx

// Import core React functionality and hooks.
import React, { useState } from "react";
// Import components and hooks from `react-router-dom` for navigation.
import { useNavigate, Link } from "react-router-dom";
// Import our custom `useAuth` hook to access authentication functions.
import { useAuth } from "../auth/authProvider";

// This is a React Functional Component. It's a JavaScript function that returns JSX.
export default function RegisterPage() {
  // `useNavigate` is a hook from react-router-dom that gives us a function to programmatically navigate.
  const nav = useNavigate();
  // `useAuth` is our custom hook. We're destructuring the `register` function from it.
  const { register } = useAuth();

  // `useState` is a React hook for adding state to a component.
  // `form` holds the values of our input fields.
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  // `busy` is a boolean to track if an async operation (like form submission) is in progress.
  // This is useful for disabling buttons or showing loading indicators.
  const [busy, setBusy] = useState(false);
  // `error` holds any error message we want to display to the user.
  const [error, setError] = useState<string | null>(null);

  // This function handles changes in any of our input fields.
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    // We update the `form` state.
    // The spread syntax `...form` copies the existing state.
    // `[e.target.name]` is a "computed property name". It lets us use the `name` attribute
    // of the input field (e.g., "username", "email") as the key to update.
    setForm({ ...form, [e.target.name]: e.target.value });

  // This function handles the form submission. It's `async` because it calls an API.
  async function onSubmit(e: React.FormEvent) {
    // `e.preventDefault()` stops the browser's default behavior of reloading the page on form submission.
    e.preventDefault();
    // Set our UI state to "busy" and clear any previous errors.
    setBusy(true); setError(null);

    // A `try...catch...finally` block is great for handling async operations.
    try {
      // Call the `register` function from our auth context. The `?.` is optional chaining,
      // in case `register` is not defined on the context.
      await register?.(form); // creates user (JSON), logs in (form-encoded), refreshes /me
      // If registration is successful, navigate the user to the debate page.
      nav("/debate");
    } catch (err: any) {
      // If an error occurs, we catch it and set the error message in our state.
      setError(err?.message || "Registration failed");
    } finally {
      // The `finally` block always runs, whether the `try` succeeded or failed.
      // We set `busy` back to false to re-enable the form.
      setBusy(false);
    }
  }

  // The JSX returned by the component, which describes the UI.
  return (
    <div className="min-h-screen grid place-items-center bg-neutral-950 text-neutral-100 p-4">
      <div className="w-full max-w-md bg-neutral-900/60 backdrop-blur rounded-2xl p-6 shadow-xl border border-neutral-800">
        <h1 className="text-2xl font-semibold mb-1">Create your account</h1>
        <p className="text-neutral-400 mb-6">Join DebateAI in seconds.</p>

        {/* This is conditional rendering. The error message div is only rendered if `error` is not null. */}
        {error && (
          <div className="mb-4 text-sm text-red-300 bg-red-900/30 border border-red-800 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* This is a "controlled component" form. The value of each input is controlled by React state. */}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm mb-1">Username</label>
            <input
              // The `value` is tied to our `form` state.
              // The `onChange` handler updates the state.
              id="username" name="username" value={form.username} onChange={onChange}
              className="w-full rounded-xl bg-neutral-800 border border-neutral-700 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm mb-1">Email</label>
            <input
              id="email" name="email" type="email" value={form.email} onChange={onChange}
              className="w-full rounded-xl bg-neutral-800 border border-neutral-700 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm mb-1">Password</label>
            <input
              id="password" name="password" type="password" value={form.password} onChange={onChange}
              className="w-full rounded-xl bg-neutral-800 border border-neutral-700 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          <button
            // The button is disabled when `busy` is true to prevent multiple submissions.
            type="submit" disabled={busy}
            className="w-full rounded-xl py-2 font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 transition"
          >
            {/* The button text changes based on the `busy` state to give the user feedback. */}
            {busy ? "Creating account…" : "Create account"}
          </button>
        </form>

        <div className="text-sm text-neutral-400 mt-4">
          Already have an account?{" "}
          {/* The `Link` component from react-router-dom creates a client-side navigation link. */}
          {/* This avoids a full page reload, making the app feel faster (like a Single Page Application). */}
          <Link className="text-emerald-400 hover:underline" to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
