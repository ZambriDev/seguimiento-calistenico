import { useEffect, useState } from "react";
import { computeWeeklyCompletion, computeStreak } from "../lib/progress";
import { currentMonthKey } from "../lib/date";
import { emptyMetrics, saveState } from "../lib/storage";

export default function ProgressSection({ state, setState }) {
  const days = state.days || [];
  const weeklyPct = computeWeeklyCompletion(days);
  const streak = computeStreak(days);

  const CURRENT_MONTH = currentMonthKey();
  const metricsByMonth = state.metricsByMonth || {};
  const availableMonths = (Object.keys(metricsByMonth).length ? Object.keys(metricsByMonth) : [CURRENT_MONTH]).sort();

  const [selectedMonth, setSelectedMonth] = useState(
    availableMonths.includes(CURRENT_MONTH) ? CURRENT_MONTH : availableMonths[availableMonths.length - 1]
  );

  useEffect(() => {
    if (!availableMonths.includes(selectedMonth)) {
      const fallback = availableMonths.includes(CURRENT_MONTH) ? CURRENT_MONTH : availableMonths[availableMonths.length - 1];
      setSelectedMonth(fallback);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableMonths.join("|"), CURRENT_MONTH]);

  const isCurrent = selectedMonth === CURRENT_MONTH;
  const currentMetrics = metricsByMonth[selectedMonth] || emptyMetrics();

  const updateMetrics = patch => {
    if (!isCurrent) return; // Solo edita mes actual
    setState(prev => {
      const prevMBM = prev.metricsByMonth || {};
      const base = prevMBM[CURRENT_MONTH] || emptyMetrics();
      const nextMBM = { ...prevMBM, [CURRENT_MONTH]: { ...base, ...patch } };
      const next = { ...prev, metricsByMonth: nextMBM };
      saveState(next);
      return next;
    });
  };

  const onSave = () => {
    if (!isCurrent) {
      alert("Solo puedes guardar/editar las medidas del mes actual.");
      return;
    }
    navigator.vibrate?.(30);
    alert("Medidas del mes actual guardadas");
  };

  const fmt = v => (v && v !== "0" ? v : "—");

  return (
    <div className="mt-4 rounded-2xl bg-zinc-900/70 border border-emerald-700/40 p-4 space-y-4">
      <h2 className="text-lg font-semibold text-emerald-300">Progreso &amp; Medidas</h2>

      <div className="flex items-center gap-2 text-[10px] text-zinc-400 flex-wrap">
        <span>Historial mensual:</span>
        <div className="flex flex-wrap gap-1">
          {availableMonths.map(m => (
            <button key={m} type="button" onClick={() => setSelectedMonth(m)}
              className={`px-2 py-1 rounded-lg border transition-all ${
                m === selectedMonth ? "bg-emerald-700 text-white border-emerald-400"
                                    : "bg-transparent text-emerald-300 border-emerald-700/40 hover:bg-emerald-900/40"}`}>
              {m}{m === CURRENT_MONTH ? " (actual)" : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl bg-zinc-900/80 border border-zinc-700 px-3 py-2">
          <div className="text-[10px] text-zinc-400 uppercase tracking-wide">Cumplimiento semanal</div>
          <div className="text-2xl font-bold text-emerald-400">{weeklyPct}%</div>
        </div>
        <div className="rounded-xl bg-zinc-900/80 border border-zinc-700 px-3 py-2">
          <div className="text-[10px] text-zinc-400 uppercase tracking-wide">Racha</div>
          <div className="text-2xl font-bold text-emerald-400">{streak}</div>
        </div>
        <div className="rounded-xl bg-zinc-900/80 border border-zinc-700 px-3 py-2">
          <div className="text-[10px] text-zinc-400 uppercase tracking-wide">Peso (kg) {isCurrent ? "(actual)" : ""}</div>
          <div className="text-xl font-semibold text-zinc-100">{fmt(currentMetrics.weight)}</div>
        </div>
        <div className="rounded-xl bg-zinc-900/80 border border-zinc-700 px-3 py-2">
          <div className="text-[10px] text-zinc-400 uppercase tracking-wide">Cintura (cm) {isCurrent ? "(actual)" : ""}</div>
          <div className="text-xl font-semibold text-zinc-100">{fmt(currentMetrics.waist)}</div>
        </div>
      </div>

      <div className="mt-2">
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer text-base font-medium text-zinc-200 select-none py-2 px-3 rounded-lg bg-emerald-900/30 border border-emerald-700 hover:bg-emerald-800/70 transition-all">
            <span>{isCurrent ? "Editar medidas del mes actual" : "Ver medidas guardadas de este mes"}</span>
            <span className="transition-transform duration-200 group-open:rotate-90">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_4px_rgba(34,197,94,0.8)]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="8 4 16 12 8 20" />
              </svg>
            </span>
          </summary>

          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Peso (kg)</label>
              <input type="number" inputMode="decimal" className="w-full rounded-lg bg-black/40 border border-zinc-700 px-2 py-1 text-sm disabled:opacity-40"
                value={currentMetrics.weight || ""} onChange={e => updateMetrics({ weight: e.target.value })} disabled={!isCurrent}/>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Cintura (cm)</label>
              <input type="number" inputMode="decimal" className="w-full rounded-lg bg-black/40 border border-zinc-700 px-2 py-1 text-sm disabled:opacity-40"
                value={currentMetrics.waist || ""} onChange={e => updateMetrics({ waist: e.target.value })} disabled={!isCurrent}/>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Pecho (cm)</label>
              <input type="number" inputMode="decimal" className="w-full rounded-lg bg-black/40 border border-zinc-700 px-2 py-1 text-sm disabled:opacity-40"
                value={currentMetrics.chest || ""} onChange={e => updateMetrics({ chest: e.target.value })} disabled={!isCurrent}/>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Hombros (cm)</label>
              <input type="number" inputMode="decimal" className="w-full rounded-lg bg-black/40 border border-zinc-700 px-2 py-1 text-sm disabled:opacity-40"
                value={currentMetrics.shoulders || ""} onChange={e => updateMetrics({ shoulders: e.target.value })} disabled={!isCurrent}/>
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-xs text-zinc-400 mb-1">Comentario mensual</label>
            <textarea className="w-full rounded-lg bg-black/40 border border-zinc-700 px-2 py-1 text-sm min-h-[70px] disabled:opacity-40"
              placeholder={isCurrent ? "Cómo te ves/sientes este mes, progresos visibles, ropa, energía, etc." : "Comentario guardado para este mes"}
              value={currentMetrics.comment || ""} onChange={e => updateMetrics({ comment: e.target.value })} disabled={!isCurrent}/>
          </div>

          <button onClick={onSave} disabled={!isCurrent} className="mt-3 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-sm disabled:opacity-40">
            Guardar medidas del mes actual
          </button>
        </details>
      </div>
    </div>
  );
}
