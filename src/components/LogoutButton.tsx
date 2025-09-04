// src/components/LogoutButton.tsx
import { useState } from "react";
import { useAuth } from "../auth/authProvider";

export default function LogoutButton() {
  const { logout } = useAuth();
  const [busy, setBusy] = useState(false);

  async function handle() {
    setBusy(true);
    try {
      await logout();
      // Protected wrapper will swap content after logout
    } catch {
      // silently ignore; you could show a toast
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handle}
      className="px-3 py-1.5 rounded-lg border border-neutral-700 text-sm hover:bg-neutral-900 disabled:opacity-50"
      disabled={busy}
      title="Sign out"
      type="button"
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
