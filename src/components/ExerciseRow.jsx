import { clamp, formatReps } from "../lib/reps";

export default function ExerciseRow({ ex, onChange }) {
  const adjustable = !!ex.parsed && !!ex.parsed.max && !/fallo|min|s$/i.test(ex.parsed.suffix || "");

  const inc = () => {
    if (!adjustable || !ex.parsed) return;
    const p = { ...ex.parsed };
    const next = clamp(p.min + (p.step || 1), 1, p.max);
    onChange({ ...ex, parsed: { ...p, min: next }, repsRaw: formatReps({ ...p, min: next }) });
  };

  const dec = () => {
    if (!adjustable || !ex.parsed) return;
    const p = { ...ex.parsed };
    const next = clamp(p.min - (p.step || 1), 1, p.max);
    onChange({ ...ex, parsed: { ...p, min: next }, repsRaw: formatReps({ ...p, min: next }) });
  };

  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-zinc-800">
      <div>
        <div className="text-zinc-100 text-sm font-medium">{ex.label}</div>
        <div className="text-xs text-zinc-400">{ex.repsRaw}</div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={dec} disabled={!adjustable} className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-200 disabled:opacity-40">–</button>
        <button onClick={inc} disabled={!adjustable} className="w-8 h-8 rounded-xl bg-red-600 text-white disabled:opacity-40">+</button>
      </div>
    </div>
  );
}
