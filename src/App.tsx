// src/App.tsx
import { StrictMode, useEffect } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import AppRoutes from "./Routes/Routes";
import "./index.css";

/** Smoothly scroll to top on route changes */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [pathname]);
  return null;
}

/** If deploying under a subpath, set VITE_BASENAME in .env */
const BASENAME =
  (import.meta as any).env?.VITE_BASENAME
    ? String((import.meta as any).env.VITE_BASENAME).replace(/\/+$/, "")
    : undefined;

export default function App() {
  return (
    <StrictMode>
      <BrowserRouter basename={BASENAME}>
        <ScrollToTop />
        {/* AppRoutes is wrapped with <Suspense> internally for lazy-loaded pages */}
        <AppRoutes />
      </BrowserRouter>
    </StrictMode>
  );
}
