import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * LandingPage
 * -----------
 * - Dark gradient background with a subtle radial accent
 * - Glassy card + glowing feature tiles ("hover points")
 * - Accessible hover/focus states (keyboard-friendly)
 * - CTA buttons: Login / Register
 */
const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  // Reusable descriptor for hover cards
  const features: Array<{ title: string; desc: string }> = [
    { title: "Solo Mode", desc: "Argue as a single persona with focused, streaming responses." },
    { title: "Versus Mode", desc: "Pit two characters against each other on any topic." },
    { title: "Devil’s Advocate", desc: "Challenge your thesis with the strongest opposing case." },
    { title: "Judge on Demand", desc: "Get real-time summaries and grades while you debate." },
    { title: "Per-Turn TTS", desc: "Click ▶ on any turn to generate speech (cached per turn)." },
    { title: "Adaptive RAG", desc: "Attach sources inline; show excerpts with one click." },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-neutral-950 to-black text-white overflow-hidden">
      {/* Radial glow accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(600px 300px at 80% 0%, rgba(16,185,129,0.12), transparent 60%)",
        }}
      />

      {/* Page container */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        {/* Header / hero */}
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Devil’s Advocate <span className="text-emerald-400">AI</span>
          </h1>
          <p className="mt-4 text-neutral-300 max-w-2xl mx-auto">
            The most immersive debate simulator. Choose a side, challenge iconic voices,
            or sharpen your arguments with an on-demand judge.
          </p>
        </header>

        {/* Feature grid (hover points) */}
        <section
          aria-label="Key capabilities"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-10"
        >
          {features.map((f, i) => (
            <article
              key={i}
              tabIndex={0}
              className="
                group relative rounded-2xl border border-neutral-800 bg-neutral-900/50
                backdrop-blur p-4 transition
                hover:-translate-y-0.5 hover:shadow-emerald-500/10 hover:shadow-xl
                focus:outline-none focus:ring-2 focus:ring-emerald-500/40
              "
            >
              {/* Glow ring on hover */}
              <div className="
                absolute inset-0 rounded-2xl opacity-0 transition
                group-hover:opacity-100 group-focus:opacity-100
                ring-1 ring-emerald-500/30
              " />
              <h3 className="relative font-semibold text-emerald-300">
                {f.title}
              </h3>
              <p className="relative mt-1 text-sm text-neutral-300">
                {f.desc}
              </p>

              {/* Subtle bottom gradient on hover */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 rounded-b-2xl 
                           bg-gradient-to-t from-emerald-500/10 to-transparent opacity-0
                           group-hover:opacity-100 group-focus:opacity-100 transition"
              />
            </article>
          ))}
        </section>

        {/* CTA Card */}
        <div className="
          mx-auto max-w-xl rounded-2xl border border-neutral-800 bg-neutral-900/60
          backdrop-blur p-6 text-center shadow-xl shadow-black/20
        ">
          <h2 className="text-lg font-semibold">Ready to spar?</h2>
          <p className="mt-1 text-neutral-300">
            Sign in to manage sessions and sync history across devices.
          </p>

          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-600 
                         text-black font-semibold rounded-xl transition focus:outline-none
                         focus:ring-2 focus:ring-emerald-500/40"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate("/register")}
              className="w-full sm:w-auto px-6 py-3 border border-emerald-400 
                         text-emerald-300 hover:bg-emerald-900/40 rounded-xl transition
                         focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              Create account
            </button>
          </div>

          {/* Optional: small reassurance line */}
          <p className="mt-3 text-xs text-neutral-400">
            Cookie-based session. No tokens stored in the browser.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
