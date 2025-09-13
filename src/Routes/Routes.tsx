import { Routes, Route, Navigate } from "react-router-dom";
import {lazy, Suspense} from 'react';

// Public pages
const LandingPage = lazy(() => import( "../pages/LandingPage"));
const LoginPage = lazy(() => import("../pages/LoginPage"));
const RegisterPage = lazy(() => import("../pages/RegisterPage"));

// Protected "../pages/RegisterPage";

// Protected area
import ProtectedRoute from "../pages/ProtectedRoute"; // <-- guard that returns <Outlet/>
const DebatePage = lazy(() => import("../pages/DebatePage"));

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
    <Suspense
      fallback= {
        <div className="min-h-[60vh] grid place-items-center text-neutral-400">
          Loading.....
        </div>
      }
      >
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
  </Suspense>
  );
}
