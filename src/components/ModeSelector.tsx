import {MODE_LABELS, type DebateModeKey  } from '../types/DebateMode';


const MODES: DebateModeKey[] = ['Solo', 'Versus', "Devil's Advocate"];


export default function ModeSelector({ mode, onChange }: { mode: DebateModeKey; onChange: (m: DebateModeKey) => void }) {
  const base = 'px-3 py-2 rounded-xl border text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const variant = (active: boolean) => active ? 'bg-indigo-600 border-indigo-500' : 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700';

  return (
    <div className="p-4">
      <div className="inline-flex gap-2" role="tablist" aria-label="Debate modes">
        {MODES.map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={mode === k}
            aria-pressed={mode === k}
            className={`${base} ${variant(mode === k)}`}
            onClick={() => onChange(k)}
          >
            {MODE_LABELS[k]}
          </button>
        ))}
      </div>
    </div>
  );
}