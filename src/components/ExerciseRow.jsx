import React from "react";
import { formatReps } from "../lib/utils/repParser";
import {
  isTimeHold,
  HOLD_RULES,
  formatRepsFromParsed,
} from "../lib/program/progressionRules";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function ExerciseRow({ ex, onChange }) {
  const p = ex.parsed;
  const hold = isTimeHold(p);

  // Permitimos ajustar: reps clásicas y también holds (antes estaban bloqueados por 's')
  const adjustable =
    !!p && !!p.max ? !/fallo|min\b/i.test(p.suffix || "") : false;

  const inc = () => {
    if (!adjustable || !p) return;

    // --- Holds (segundos) ---
    if (hold) {
      const step = HOLD_RULES.stepSec || 5;
      const cap =
        p.max && p.max !== p.min ? p.max : HOLD_RULES.defaultCapSec || 60;
      const nextMin = clamp((p.min || step) + step, step, cap);
      const np = { ...p, min: nextMin };
      onChange({
        ...ex,
        parsed: np,
        repsRaw: formatRepsFromParsed(np),
      });
      return;
    }

    // --- Reps clásicas ---
    const next = clamp(p.min + (p.step || 1), 1, p.max);
    onChange({
      ...ex,
      parsed: { ...p, min: next },
      repsRaw: formatReps({ ...p, min: next }),
    });
  };

  const dec = () => {
    if (!adjustable || !p) return;

    // --- Holds (segundos) ---
    if (hold) {
      const step = HOLD_RULES.stepSec || 5;
      // No dejar bajar de 'step' para evitar 0 s
      const floor = step;
      const nextMin = clamp((p.min || step) - step, floor, p.max || floor);
      const np = { ...p, min: nextMin };
      onChange({
        ...ex,
        parsed: np,
        repsRaw: formatRepsFromParsed(np),
      });
      return;
    }

    // --- Reps clásicas ---
    const next = clamp(p.min - (p.step || 1), 1, p.max);
    onChange({
      ...ex,
      parsed: { ...p, min: next },
      repsRaw: formatReps({ ...p, min: next }),
    });
  };

  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-zinc-800">
      <div>
        <div className="text-zinc-100 text-sm font-medium">{ex.label}</div>
        <div className="text-xs text-zinc-400">{ex.repsRaw}</div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={dec}
          disabled={!adjustable}
          className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-200 disabled:opacity-40"
          title={hold ? "− segundos" : "− repeticiones"}
        >
          –
        </button>
        <button
          onClick={inc}
          disabled={!adjustable}
          className="w-8 h-8 rounded-xl bg-red-600 text-white disabled:opacity-40"
          title={hold ? "+ segundos" : "+ repeticiones"}
        >
          +
        </button>
      </div>
    </div>
  );
}
