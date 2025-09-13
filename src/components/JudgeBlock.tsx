
export default function JudgeBlock({ raw }: { raw: string }) {
  // Accepts input like:
  // "Summary:\n{...json...}" or "Grade:\n{...json...}"
  const match = raw.match(/^(Summary|Grade)\s*:?\s*\n([\s\S]+)$/i);
  const kind = match ? match[1] : "Judge";
  const jsonPart = match ? match[2] : raw;

  let parsed: unknown = jsonPart;
  try {
    parsed = JSON.parse(jsonPart);
  } catch {
    // Not JSON; show as text
  }

  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-950/70 p-3">
      <div className="text-xs font-semibold text-amber-300 mb-2">
        Judge — Output ({kind})
      </div>
      {typeof parsed === "object" ? (
        <pre className="text-xs text-neutral-200 overflow-auto whitespace-pre-wrap">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      ) : (
        <div className="text-sm text-neutral-200 whitespace-pre-wrap">
          {String(parsed)}
        </div>
      )}
    </div>
  );
}
