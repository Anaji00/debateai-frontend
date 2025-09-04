import { Routes, Route, Navigate } from "react-router-dom";

// Public pages
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";

// Protected area
import ProtectedRoute from "../pages/ProtectedRoute"; // <-- guard that returns <Outlet/>
import DebatePage from "../pages/DebatePage";

/**
 * AppRoutes
 * ---------
 * - "/"          (public)   → LandingPage (welcome + Sign in / Register)
 * - "/login"     (public)   → LoginPage (cookie auth form)
 * - "/register"  (public)   → RegisterPage
 * - "/debate"    (protected)→ DebatePage (requires valid cookie session)
 *
 * NOTE: This file intentionally does NOT include <BrowserRouter>.
 * Wrap this component with <BrowserRouter> in your top-level (e.g., main.tsx/App.tsx)
 * to avoid double Router instances.
 */
export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected branch: Mount the guard as the element, render children via <Outlet/> */}
      <Route element={<ProtectedRoute />}>
        <Route path="/debate" element={<DebatePage />} />
        {/* Add more protected routes here if needed */}
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
