
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../auth/authProvider";

/**
 * Route guard for protected sections.
 * - Shows a lightweight loading state while auth is checking cookies.
 * - If unauthenticated, redirects to /login and preserves the intended target in location.state.from.
 * - If authenticated, renders the nested route via <Outlet/>.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // While we’re checking /auth/me on mount, keep UI stable
  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center text-neutral-400">
        Checking session…
      </div>
    );
  }

  // No valid cookie session → go to /login and remember where user wanted to go
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Authenticated → render the protected child route
  return <Outlet />;
}
