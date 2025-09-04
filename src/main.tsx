// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Cookie-auth provider (exposes user, isAuthenticated, isLoading, login, logout)
import { AuthProvider } from "./auth/authProvider";

// Global styles (Tailwind + your resets/utilities)
import "./index.css";

/**
 * Entry point
 * -----------
 * - Wraps the app in <AuthProvider> so cookie sessions are available everywhere.
 * - <App /> contains BrowserRouter, ErrorBoundary, Suspense fallback, and your routes.
 * - React.StrictMode = dev-only double-invocation of effects to help catch issues.
 */
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
