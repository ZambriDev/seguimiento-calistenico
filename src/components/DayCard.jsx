import React from "react";
import ExerciseRow from "./ExerciseRow";
import { VARIATIONS as VARIATIONS_REP } from "../lib/program/baseProgram";
import { getNextVariation } from "../lib/program/variations";
import {
  isTimeHold,
  HOLD_RULES,
  bumpHoldSeconds,
  formatRepsFromParsed,
} from "../lib/program/progressionRules";

// helpers locales
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function todayIndex() {
  const map = [6, 0, 1, 2, 3, 4, 5];
  return map[new Date().getDay()] ?? 0;
}

export default function DayCard({
  WEEK,
  dayIdx,
  state,
  setState,
  parseReps,
  formatReps,
}) {
  const day = WEEK[dayIdx];
  const sday = state.days[dayIdx];
  const isToday = dayIdx === todayIndex();
  const isCompletedToday = sday.lastCompletedISO === todayISO();

  // --- vuelve el uso de ExerciseRow (+/–) ---
  const updateExercise = (i, updated) => {
    const days = [...state.days];
    const exs = [...days[dayIdx].exercises];
    exs[i] = updated;
    days[dayIdx] = { ...days[dayIdx], exercises: exs };
    setState({ ...state, days });
  };

  const updateNotes = val => {
    const days = [...state.days];
    days[dayIdx] = { ...days[dayIdx], notes: val };
    setState({ ...state, days });
  };

  const toggleCompletion = () => {
    if (!isToday) return;
    const days = [...state.days];
    const d = { ...days[dayIdx] };

    if (isCompletedToday) {
      d.lastCompletedISO = null;
      d.completionCount = Math.max((d.completionCount || 1) - 1, 0);
    } else {
      d.lastCompletedISO = todayISO();
      d.completionCount = (d.completionCount || 0) + 1;

      // Progresión cada N completados
      if (d.completionCount % HOLD_RULES.everyCompletions === 0) {
        let hasRepRoom = false,
          hasRepVariation = false,
          hasHoldRoom = false,
          hasHoldVariation = false;

        d.exercises.forEach(ex => {
          const p = ex.parsed;
          if (!p) return;
          const isHold = isTimeHold(p);

          // reps clásicas
          if (!isHold && !/fallo|min|s\b/i.test(p.suffix || "")) {
            if (p.min < p.max) hasRepRoom = true;
            else if (VARIATIONS_REP[ex.label]) hasRepVariation = true;
          }
          // holds
          if (isHold) {
            const cap =
              p.max && p.max !== p.min ? p.max : HOLD_RULES.defaultCapSec;
            if ((p.min || 0) < cap) hasHoldRoom = true;
            else if (getNextVariation(ex.label, true)) hasHoldVariation = true;
          }
        });

        let doAddReps = false,
          doRepVar = false,
          doAddHold = false,
          doHoldVar = false;

        if (hasRepRoom)
          doAddReps = window.confirm(
            "Progreso: ¿subir repeticiones en algunos ejercicios?"
          );
        if (!doAddReps && hasRepVariation)
          doRepVar = window.confirm(
            "Tope de reps alcanzado. ¿Probar variaciones más desafiantes?"
          );
        if (hasHoldRoom)
          doAddHold = window.confirm(
            "Progreso (holds): ¿aumentar segundos en varios ejercicios de tiempo?"
          );
        if (!doAddHold && hasHoldVariation)
          doHoldVar = window.confirm(
            "Holds al tope. ¿Probar variación más avanzada?"
          );

        d.exercises = d.exercises.map(ex => {
          const p = ex.parsed;
          if (!p) return ex;

          const isHold = isTimeHold(p);

          // holds por tiempo
          if (isHold) {
            const cap =
              p.max && p.max !== p.min ? p.max : HOLD_RULES.defaultCapSec;
            if (doAddHold && (p.min || 0) < cap) {
              const np = bumpHoldSeconds(p);
              return { ...ex, parsed: np, repsRaw: formatRepsFromParsed(np) };
            }
            if (doHoldVar && (p.min || 0) >= cap) {
              const nextLabel = getNextVariation(ex.label, true);
              if (nextLabel) {
                const base = parseReps("3x20-30 s");
                return {
                  label: nextLabel,
                  repsRaw: formatReps(base),
                  parsed: base,
                };
              }
            }
            return ex;
          }

          // reps clásicas
          if (!/fallo|min|s\b/i.test(p.suffix || "")) {
            if (doAddReps && p.min < p.max) {
              const nextMin = clamp(p.min + 1, 1, p.max);
              const np = { ...p, min: nextMin };
              return { ...ex, parsed: np, repsRaw: formatReps(np) };
            }
            if (doRepVar && p.min >= p.max) {
              const nextLabel = VARIATIONS_REP[ex.label];
              if (nextLabel) {
                const base = parseReps("3x8-12");
                return {
                  label: nextLabel,
                  repsRaw: formatReps(base),
                  parsed: base,
                };
              }
            }
          }
          return ex;
        });
      }
    }

    days[dayIdx] = d;
    setState({ ...state, days });
    navigator.vibrate?.(40);
  };

  return (
    <div className="rounded-2xl bg-zinc-900/60 border border-red-800/40 p-4 shadow transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-red-300">{day.name}</h3>
          <p className="text-sm text-zinc-400">{day.type}</p>
        </div>
        <button
          onClick={toggleCompletion}
          disabled={!isToday}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 border ${
            !isToday
              ? "opacity-40 cursor-not-allowed border-zinc-700 bg-zinc-800 text-zinc-400"
              : isCompletedToday
              ? "bg-green-700 border-green-500 text-white"
              : "bg-zinc-800 hover:bg-green-600 border-zinc-600 text-white"
          }`}
        >
          <span
            className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] ${
              isCompletedToday
                ? "bg-green-500 border-green-300"
                : "bg-zinc-900 border-zinc-500"
            }`}
          >
            {isCompletedToday ? "✓" : ""}
          </span>
          {isCompletedToday ? "Día completado (desmarcar)" : "Marcar día completado"}
        </button>
      </div>

      <div className="mt-2 text-xs text-zinc-400">
        Progreso completado:{" "}
        <span className="text-green-400 font-semibold">
          {sday.completionCount}
        </span>
      </div>

      {/* Aquí vuelven los ± por ejercicio */}
      <div className="mt-4 divide-y divide-zinc-800">
        {sday.exercises.map((ex, i) => (
          <ExerciseRow key={i} ex={ex} onChange={u => updateExercise(i, u)} />
        ))}
      </div>

      <div className="mt-4 text-sm text-emerald-300">Skill: {day.skill}</div>

      <div className="mt-4">
        <label className="block text-sm text-zinc-300 mb-1">Notas del día</label>
        <textarea
          className="w-full rounded-xl bg-black/40 border border-zinc-700 p-3 text-sm min-h-[90px]"
          placeholder="Dolores, PRs, sensaciones, sueño, etc."
          value={sday.notes}
          onChange={e => updateNotes(e.target.value)}
        />
      </div>
    </div>
  );
}
