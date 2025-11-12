import { WEEK, VARIATIONS } from "../lib/constants";
import { todayIndex, todayISO } from "../lib/date";
import { clamp, formatReps, parseReps } from "../lib/reps";
import ExerciseRow from "./ExerciseRow";

export default function DayCard({ dayIdx, state, setState }) {
  const day = WEEK[dayIdx];
  const sday = state.days[dayIdx];
  const isToday = dayIdx === todayIndex();
  const isCompletedToday = sday.lastCompletedISO === todayISO();

  const updateExercise = (i, updated) => {
    const days = [...state.days];
    const exs = [...days[dayIdx].exercises];
    exs[i] = updated;
    days[dayIdx] = { ...days[dayIdx], exercises: exs };
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

      if (d.completionCount % 2 === 0) {
        let hasRoom = false;
        let hasVariation = false;

        d.exercises.forEach(ex => {
          const p = ex.parsed;
          if (!p || /fallo|min|s$/i.test(p.suffix || "")) return;
          if (p.min < p.max) hasRoom = true;
          else if (VARIATIONS[ex.label]) hasVariation = true;
        });

        let doAdd = false;
        let doVar = false;

        if (hasRoom) {
          doAdd = window.confirm("Has completado este día varias veces. ¿Subimos un poco las repeticiones en algunos ejercicios?");
        }
        if (!doAdd && hasVariation) {
          doVar = window.confirm("Ya estás en el máximo en varios ejercicios. ¿Pasamos a variaciones más desafiantes?");
        }

        if (doAdd || doVar) {
          d.exercises = d.exercises.map(ex => {
            const p = ex.parsed;
            if (!p || /fallo|min|s$/i.test(p.suffix || "")) return ex;

            if (doAdd && p.min < p.max) {
              const nextMin = clamp(p.min + 1, 1, p.max);
              return { ...ex, parsed: { ...p, min: nextMin }, repsRaw: formatReps({ ...p, min: nextMin }) };
            }

            if (doVar && p.min >= p.max) {
              const nextLabel = VARIATIONS[ex.label];
              if (nextLabel) {
                const base = parseReps("3x8-12");
                return { label: nextLabel, repsRaw: formatReps(base), parsed: base };
              }
            }
            return ex;
          });
        }
      }
    }

    days[dayIdx] = d;
    setState({ ...state, days });
    navigator.vibrate?.(40);
  };

  const updateNotes = val => {
    const days = [...state.days];
    days[dayIdx] = { ...days[dayIdx], notes: val };
    setState({ ...state, days });
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
          }`}>
          <span className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] ${
              isCompletedToday ? "bg-green-500 border-green-300" : "bg-zinc-900 border-zinc-500"}`}>
            {isCompletedToday ? "✓" : ""}
          </span>
          {isCompletedToday ? "Día completado (desmarcar)" : "Marcar día completado"}
        </button>
      </div>

      <div className="mt-2 text-xs text-zinc-400">
        Progreso completado: <span className="text-green-400 font-semibold">{sday.completionCount}</span>
      </div>

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
