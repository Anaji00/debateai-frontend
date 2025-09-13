import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/authProvider";

/**
 * TopNav
 * ------
 * A glassy, gradient header with sign-in/out controls. Uses amber/sky
 * accents exclusively (no indigo) and focuses states for accessibility.
 */
export default function TopNav() {
  const { user, isAuthenticated, logout } = useAuth();
  const { pathname } = useLocation();
  const isAuthRoute = pathname === "/login" || pathname === "/register";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-950/70 backdrop-blur text-white shadow-[0_5px_15px_rgba(0,0,0,0.2)]">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link
          to={isAuthenticated ? "/debate" : "/"}
          className="font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-sky-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 rounded"
          aria-label="Go to start"
        >
          DebateAI
        </Link>

        <div className="flex items-center gap-3 text-sm">
          {isAuthenticated && (
            <span className="text-neutral-400">
              Signed in as <b className="text-neutral-100">{user?.identifier}</b>
            </span>
          )}
          {isAuthenticated ? (
            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
              title="Sign out"
            >
              Logout
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className={`px-3 py-1.5 rounded-lg border transition focus:outline-none focus:ring-2 ${
                  isAuthRoute
                    ? "border-amber-400 text-amber-300 focus:ring-amber-400/40"
                    : "border-neutral-700 text-neutral-200 hover:border-amber-400 hover:text-amber-300 focus:ring-amber-400/40"
                }`}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-3 py-1.5 rounded-lg bg-amber-400 text-black hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
