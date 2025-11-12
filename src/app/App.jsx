import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import ExportImport from "../components/ExportImport";
import ProgressSection from "../components/ProgressSection";
import WarmupTimer from "../components/WarmupTimer";
import DayCard from "../components/DayCard";
import DietCard from "../components/DietCard";

import { WEEK } from "../lib/program/baseProgram";
import { parseReps, formatReps } from "../lib/utils/repParser";
import { loadState, saveState } from "../lib/utils/storageUtils";
import { todayIndex } from "../lib/utils/dateUtils";

export default function App() {
  const [state, setState] = useState(loadState());
  const [showWeek, setShowWeek] = useState(false);
  const [idxToday, setIdxToday] = useState(todayIndex());

  useEffect(() => { saveState(state); }, [state]);
  useEffect(() => { const id = setInterval(() => setIdxToday(todayIndex()), 60000); return () => clearInterval(id); }, []);

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top,rgba(255,0,0,0.08),transparent_60%)] bg-black text-zinc-100">
      <div className="max-w-screen-sm mx-auto p-4 pb-24">
        <Header showWeek={showWeek} setShowWeek={setShowWeek} />

        <div className="mt-4"><ExportImport state={state} setState={setState} /></div>
        <ProgressSection state={state} setState={setState} />
        <div className="mt-4"><WarmupTimer dayIdx={idxToday} /></div>

        {!showWeek ? (
          <div className="mt-4 space-y-4">
            <div className="text-sm text-zinc-400">
              Hoy: <span className="text-zinc-100 font-medium">{WEEK[idxToday].name}</span>
            </div>
            <DayCard WEEK={WEEK} dayIdx={idxToday} state={state} setState={setState} parseReps={parseReps} formatReps={formatReps} />
            <DietCard />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4">
            {WEEK.map((_, i) => (
              <div key={i} className={i === idxToday ? "ring-2 ring-green-500 rounded-2xl" : ""}>
                <DayCard WEEK={WEEK} dayIdx={i} state={state} setState={setState} parseReps={parseReps} formatReps={formatReps} />
              </div>
            ))}
          </div>
        )}

        <footer className="mt-8 text-center text-xs text-zinc-500">v1 · Datos guardados localmente · Tema Spider</footer>
      </div>
    </div>
  );
}
