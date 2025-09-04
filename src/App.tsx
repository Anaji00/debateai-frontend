// src/App.tsx
// App root: mounts the router and your route table.
// Keep this file tiny; put most routing in src/Routes/Routes.tsx

import { StrictMode, useEffect } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";

// Your route definitions (no <BrowserRouter> inside this file)
import AppRoutes from "./Routes/Routes";

// Global styles (Tailwind + any custom CSS in index.css)
import "./index.css";

/**
 * ScrollToTop
 * React Router v6 doesn't auto-restore scroll on route change.
 * This tiny helper scrolls to top whenever the pathname changes.
 */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    // Smooth is fine; change to 'auto' if you prefer instant.
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [pathname]);
  return null;
}

/**
 * If you deploy under a subdirectory (e.g., /app),
 * set VITE_BASENAME=/app in your .env and BrowserRouter
 * will generate the correct URLs.
 */
const BASENAME =
  (import.meta as any).env?.VITE_BASENAME
    ? String((import.meta as any).env.VITE_BASENAME).replace(/\/+$/, "")
    : undefined;

export default function App() {
  return (
    <StrictMode>
      {/* The single router for the entire app */}
      <BrowserRouter basename={BASENAME}>
        {/* Scroll to top on route changes */}
        <ScrollToTop />
        {/* AppRoutes contains only <Routes> and <Route> entries */}
        <AppRoutes />
      </BrowserRouter>
    </StrictMode>
  );
}
