import { useAuth } from '../auth/authProvider';
import { Link } from 'react-router-dom';

export default function TopNav() {
  const { user, isAuthenticated, logout } = useAuth();
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-950/70 backdrop-blur text-white">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link to={isAuthenticated ? "/debate" : "/"} className="font-semibold text-emerald-400 hover:text-emerald-300 transition">DebateAI</Link>
        <div className="flex items-center gap-3 text-sm">
          {isAuthenticated && <span className="text-neutral-400">Signed in as <b className="text-neutral-200">{user?.identifier}</b></span>}
          {isAuthenticated ? (
            <button onClick={logout} className="px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 hover:bg-neutral-700">Logout</button>
          ) : (
            <Link to="/login" className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500">Login</Link>
          )}
        </div>
      </div>
    </header>
  );
}