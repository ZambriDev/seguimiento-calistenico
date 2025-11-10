import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  ChangeEvent,
} from "react";

const LS_KEY = "spiderfit_v1";

// ---------- Tipos ----------
type Energy = "low" | "normal" | "high";

type ParsedReps = {
  raw: string;
  sets: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
};

type ExerciseConfig = {
  label: string;
  reps: string;
};

type DayConfig = {
  name: string;
  type: string;
  exercises: ExerciseConfig[];
  skill: string;
};

type ExerciseState = {
  label: string;
  repsRaw: string;
  parsed: ParsedReps | null;
};

type DayState = {
  notes: string;
  completionCount: number;
  lastCompletedISO: string | null;
  energy: Energy;
  energyISO: string | null;
  exercises: ExerciseState[];
};

type MonthMetrics = {
  weight: string;
  waist: string;
  chest: string;
  shoulders: string;
  comment: string;
};

type AppState = {
  days: DayState[];
  metricsByMonth: Record<string, MonthMetrics>;
};

// ---------- Utils ----------
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const todayISO = () => new Date().toISOString().slice(0, 10);
const currentMonthKey = () => todayISO().slice(0, 7);

// map JS 0-6 → nuestro 0-6 (Lun a Dom)
const todayIndex = (): number => {
  const m = [6, 0, 1, 2, 3, 4, 5];
  return m[new Date().getDay()] ?? 0;
};

const emptyMetrics = (): MonthMetrics => ({
  weight: "",
  waist: "",
  chest: "",
  shoulders: "",
  comment: "",
});

// parse: "3x8-12", "3x10-15 s", "3x8-10 / pierna"
function parseReps(str: string): ParsedReps | null {
  if (!str) return null;
  const clean = String(str)
    .replace(/×|\*/g, "x")
    .replace(/–|—/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  const suffixMatch = clean.match(
    /(\/\s*pierna|\/\s*brazo|min|fallo|fallo\s*-?1|s\b)/i
  );
  const suffix = suffixMatch ? suffixMatch[0] : "";

  const m = clean.match(/(\d+)\s*x\s*(\d+)(?:\s*-\s*(\d+))?/i);
  if (!m) {
    return {
      raw: str,
      sets: 0,
      min: 0,
      max: 0,
      step: 1,
      suffix,
    };
  }

  const sets = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const max = m[3] ? parseInt(m[3], 10) : min;

  return {
    raw: str,
    sets,
    min,
    max,
    step: 1,
    suffix,
  };
}

function formatReps(p: ParsedReps | null): string {
  if (!p) return "";
  const base = `${p.sets}x${p.min}${
    p.max && p.max !== p.min ? `-${p.max}` : ""
  }`;
  return p.suffix ? `${base} ${p.suffix}` : base;
}

// ---------- Programa base ----------
const VARIATIONS: Record<string, string> = {
  Lagartijas: "Lagartijas declinadas",
  "Lagartijas inclinadas": "Lagartijas declinadas lastradas",
  "Pike push-ups": "Pike ROM profunda",
  "Fondos en sillas (asistidos)": "Fondos en sillas",
  "Dominadas pronas": "Dominadas pronas (lastradas)",
  "Dominadas supinas": "Dominadas supinas (lastradas)",
  "Remo invertido": "Remo invertido pies elevados",
  "Remo invertido pies elevados": "Remo invertido lastrado",
  "Australianas supinas": "Australianas supinas pies elevados",
  Sentadillas: "Sentadillas con salto / Pistol asistida",
  "Squat jumps": "Pistol completa / variaciones explosivas",
};

const WEEK: DayConfig[] = [
  {
    name: "Día 1 · Empuje",
    type: "Pecho · hombro · tríceps",
    exercises: [
      { label: "Lagartijas", reps: "3x8-12" },
      { label: "Lagartijas inclinadas", reps: "3x10-15" },
      { label: "Pike push-ups", reps: "3x6-8" },
    ],
    skill: "Skill: Handstand asistido 3x15 s",
  },
  {
    name: "Día 2 · Tirón",
    type: "Espalda · bíceps",
    exercises: [
      { label: "Dominadas pronas", reps: "3x4-6" },
      { label: "Remo invertido", reps: "3x8-10" },
    ],
    skill: "Skill: Hollow hold 3x25 s",
  },
  {
    name: "Día 3 · Piernas & Core",
    type: "Piernas · abdomen",
    exercises: [
      { label: "Sentadillas", reps: "4x12-20" },
      { label: "Zancadas alternas", reps: "3x10-12 / pierna" },
      { label: "Plancha", reps: "3x25-35 s" },
    ],
    skill: "Skill: Pistol asistida / Búlgara",
  },
  {
    name: "Día 4 · Empuje Plus",
    type: "Progresión empuje",
    exercises: [
      { label: "Lagartijas declinadas", reps: "3x8-12" },
      { label: "Pike ROM profunda", reps: "3x6-8" },
      { label: "Fondos en sillas", reps: "3x6-10" },
    ],
    skill: "Skill: Handstand libre asistido",
  },
  {
    name: "Día 5 · Tirón Plus",
    type: "Progresión tirón",
    exercises: [
      { label: "Dominadas supinas", reps: "3x4-6" },
      { label: "Remo invertido pies elevados", reps: "3x8-10" },
    ],
    skill: "Skill: Transición muscle-up",
  },
  {
    name: "Día 6 · Piernas & HIIT",
    type: "Explosividad · core",
    exercises: [
      { label: "Squat jumps", reps: "3x8-12" },
      { label: "Pistol / Búlgara", reps: "3x6-8 / pierna" },
    ],
    skill: "Skill: Sprints suaves",
  },
  {
    name: "Día 7 · Descanso activo",
    type: "Movilidad · recuperación",
    exercises: [
      { label: "Movilidad general", reps: "10-15 min" },
      { label: "Caminata / trote", reps: "20-40 min" },
    ],
    skill: "Skill: Planificar próxima semana",
  },
];

// ---------- Estado ----------
const defaultState = (): AppState => ({
  days: WEEK.map(day => ({
    notes: "",
    completionCount: 0,
    lastCompletedISO: null,
    energy: "normal",
    energyISO: null,
    exercises: day.exercises.map(ex => ({
      label: ex.label,
      repsRaw: ex.reps,
      parsed: parseReps(ex.reps),
    })),
  })),
  metricsByMonth: {
    [currentMonthKey()]: emptyMetrics(),
  },
});

const loadState = (): AppState => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultState();
    const data = JSON.parse(raw) as Partial<AppState>;
    const base = defaultState();

    const days: DayState[] = WEEK.map((day, i) => {
      const d = data.days?.[i] ?? {};
      return {
        notes: d.notes ?? "",
        completionCount: d.completionCount ?? 0,
        lastCompletedISO: d.lastCompletedISO ?? null,
        energy: (d.energy as Energy) ?? "normal",
        energyISO: d.energyISO ?? null,
        exercises: day.exercises.map((ex, j) => {
          const src = d.exercises?.[j] ?? {
            label: ex.label,
            repsRaw: ex.reps,
          };
          const repsRaw = (src as any).repsRaw ?? (src as any).reps ?? ex.reps;
          return {
            label: (src as any).label ?? ex.label,
            repsRaw,
            parsed: parseReps(repsRaw),
          };
        }),
      };
    });

    const mbm: Record<string, MonthMetrics> = {
      ...base.metricsByMonth,
      ...(data.metricsByMonth ?? {}),
    };

    const cm = currentMonthKey();
    if (!mbm[cm]) mbm[cm] = emptyMetrics();

    return { days, metricsByMonth: mbm };
  } catch {
    return defaultState();
  }
};

const saveState = (s: AppState) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
};

// ---------- Helpers energía ----------
const getEffectiveEnergy = (d: DayState | undefined): Energy => {
  if (!d || !d.energyISO) return "normal";
  return d.energyISO === todayISO() ? d.energy : "normal";
};

// ---------- Warmup muy compacto (versión canvas) ----------
const DURATIONS = [
  { label: "Rápido (4 min)", total: 4 * 60 },
  { label: "Normal (7 min)", total: 7 * 60 },
  { label: "Extendido (10 min)", total: 10 * 60 },
] as const;

function WarmupTimer({ dayIdx }: { dayIdx: number }) {
  const [sel, setSel] = useState(DURATIONS[1]);
  const [remaining, setRemaining] = useState(sel.total);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<number | null>(null);

  const tips = useMemo(() => {
    const base = [
      "Movilidad cuello / hombros",
      "Scapular push-ups",
      "Core ligero",
    ];
    if (dayIdx === 0 || dayIdx === 3)
      return [...base, "Pike push-ups suaves, fondos apoyo"];
    if (dayIdx === 1 || dayIdx === 4)
      return [...base, "Dominadas asistidas, remo fácil"];
    if (dayIdx === 2 || dayIdx === 5)
      return [...base, "Sentadillas aire, zancadas, skipping suave"];
    return [...base, "Movilidad global, respiración nasal"];
  }, [dayIdx]);

  useEffect(() => {
    if (!running) return;
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          window.clearInterval(timerRef.current!);
          setRunning(false);
          navigator.vibrate?.([80, 40, 120]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [running]);

  useEffect(() => {
    if (!running) setRemaining(sel.total);
  }, [sel, running]);

  const mm = Math.floor(remaining / 60);
  const ss = String(remaining % 60).padStart(2, "0");
  const pct =
    sel.total > 0 ? Math.max(0, Math.min(100, ((sel.total - remaining) / sel.total) * 100)) : 0;

  return (
    <div className="card mt-4 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-red-400">
            Calentamiento guiado
          </h3>
          <p className="text-xs text-zinc-400">
            Bloques rápidos, vibración y contador simple antes de la rutina.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="bg-black/70 text-xs px-3 py-2 rounded-xl border border-zinc-700"
            disabled={running}
            value={sel.total}
            onChange={e => {
              const v = Number(e.target.value);
              const found = DURATIONS.find(d => d.total === v) || DURATIONS[1];
              setSel(found);
            }}
          >
            {DURATIONS.map(d => (
              <option key={d.total} value={d.total}>
                {d.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              if (remaining === 0) setRemaining(sel.total);
              setRunning(r => !r);
              navigator.vibrate?.(20);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-medium ${
              running
                ? "bg-zinc-800 text-zinc-200"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            {running ? "Pausar" : "Iniciar"}
          </button>
          <button
            onClick={() => {
              setRunning(false);
              setRemaining(sel.total);
            }}
            className="px-3 py-2 rounded-xl text-xs bg-zinc-900 text-zinc-300 border border-zinc-700"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <div className="text-2xl font-semibold text-emerald-400 tabular-nums">
          {mm}:{ss}
        </div>
        <div className="text-[10px] text-zinc-500">tiempo restante</div>
      </div>

      <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-900 overflow-hidden">
        <div
          className="h-full bg-red-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="mt-3 text-[10px] text-zinc-300 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {tips.map((t, i) => (
          <li key={i} className="bg-black/40 border border-zinc-800 px-2 py-1 rounded-xl">
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- ExerciseRow ----------
function ExerciseRow(props: {
  ex: ExerciseState;
  energy: Energy;
  onChange: (next: ExerciseState) => void;
}) {
  const { ex, energy, onChange } = props;

  const adjustable =
    !!ex.parsed &&
    !!ex.parsed.max &&
    !/fallo|min|s\b/i.test(ex.parsed.suffix || "");

  const tweak = (delta: number) => {
    if (!adjustable || !ex.parsed) return;
    const p = { ...ex.parsed };
    const nextMin = clamp(p.min + delta, 1, p.max);
    const nextParsed: ParsedReps = { ...p, min: nextMin };
    onChange({
      ...ex,
      parsed: nextParsed,
      repsRaw: formatReps(nextParsed),
    });
  };

  const renderTarget = () => {
    const p = ex.parsed;
    if (!p || !p.sets) return ex.repsRaw;

    let { sets, min, max } = p;
    const suffix = (p.suffix || "").toLowerCase();

    if (/fallo|min/.test(suffix)) return ex.repsRaw;

    const isTime = /s\b/.test(suffix);

    const factor =
      energy === "high" ? 1.15 : energy === "low" ? 0.85 : 1.0;

    min = Math.max(1, Math.round(min * factor));
    max = Math.max(min, Math.round(max * factor));

    const base = `${sets}x${min}${max !== min ? `-${max}` : ""}`;
    return suffix ? `${base} ${suffix}` : base;
  };

  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-zinc-800/60">
      <div>
        <div className="text-sm text-zinc-100">{ex.label}</div>
        <div className="text-[10px] text-zinc-500">{renderTarget()}</div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => tweak(-1)}
          disabled={!adjustable}
          className="w-7 h-7 rounded-xl bg-zinc-900 text-zinc-300 border border-zinc-700 text-sm disabled:opacity-30"
        >
          –
        </button>
        <button
          onClick={() => tweak(1)}
          disabled={!adjustable}
          className="w-7 h-7 rounded-xl bg-red-600 text-white text-sm disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  );
}

// ---------- DayCard ----------
function DayCard(props: {
  idx: number;
  cfg: DayConfig;
  state: AppState;
  setState: (next: AppState) => void;
}) {
  const { idx, cfg, state, setState } = props;
  const sday = state.days[idx];
  const isToday = idx === todayIndex();
  const energy = getEffectiveEnergy(sday);
  const isCompletedToday = sday.lastCompletedISO === todayISO();

  const updateExercise = (i: number, updated: ExerciseState) => {
    const days = [...state.days];
    const exs = [...days[idx].exercises];
    exs[i] = updated;
    days[idx] = { ...days[idx], exercises: exs };
    setState({ ...state, days });
  };

  const setEnergy = (e: Energy) => {
    if (!isToday) return;
    const days = [...state.days];
    days[idx] = {
      ...days[idx],
      energy: e,
      energyISO: todayISO(),
    };
    setState({ ...state, days });
    navigator.vibrate?.(15);
  };

  const toggleCompletion = () => {
    if (!isToday) return;
    const days = [...state.days];
    const d = { ...days[idx] };

    if (isCompletedToday) {
      d.lastCompletedISO = null;
      d.completionCount = Math.max((d.completionCount ?? 1) - 1, 0);
    } else {
      d.lastCompletedISO = todayISO();
      d.completionCount = (d.completionCount ?? 0) + 1;
    }

    days[idx] = d;
    setState({ ...state, days });
    navigator.vibrate?.(40);
  };

  const updateNotes = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const days = [...state.days];
    days[idx] = { ...days[idx], notes: e.target.value };
    setState({ ...state, days });
  };

  return (
    <section className="card p-4 space-y-3">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-red-400">
            {cfg.name}
          </h3>
          <p className="text-xs text-zinc-400">{cfg.type}</p>
        </div>

        <button
          onClick={toggleCompletion}
          disabled={!isToday}
          className={`px-3 py-2 rounded-xl text-[10px] font-medium flex items-center gap-2 border ${
            !isToday
              ? "opacity-30 cursor-not-allowed border-zinc-700 text-zinc-500"
              : isCompletedToday
              ? "bg-emerald-600 border-emerald-400 text-white"
              : "bg-black/60 hover:bg-emerald-600/80 border-zinc-700 text-zinc-100"
          }`}
        >
          <span
            className={`w-4 h-4 rounded-md border flex items-center justify-center text-[9px] ${
              isCompletedToday
                ? "bg-emerald-400 border-emerald-200 text-black"
                : "bg-black border-zinc-600"
            }`}
          >
            {isCompletedToday ? "✓" : ""}
          </span>
          {isCompletedToday ? "Completado hoy" : "Marcar día completado"}
        </button>
      </div>

      {isToday && (
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-zinc-400">Energía de hoy:</span>
          <div className="flex gap-1">
            {(["low", "normal", "high"] as Energy[]).map(val => (
              <button
                key={val}
                onClick={() => setEnergy(val)}
                className={`px-2 py-1 rounded-lg border text-[9px] ${
                  energy === val
                    ? val === "low"
                      ? "bg-yellow-700/70 border-yellow-400 text-white"
                      : val === "high"
                      ? "bg-red-700/80 border-red-400 text-white"
                      : "bg-emerald-700/80 border-emerald-400 text-white"
                    : "border-zinc-700 text-zinc-300"
                }`}
              >
                {val === "low"
                  ? "Baja"
                  : val === "high"
                  ? "Alta"
                  : "Normal"}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="text-[10px] text-zinc-500">
        Completado veces:{" "}
        <span className="text-emerald-400 font-semibold">
          {sday.completionCount}
        </span>
      </div>

      <div className="mt-1 divide-y divide-zinc-800/60">
        {sday.exercises.map((ex, i) => (
          <ExerciseRow
            key={i}
            ex={ex}
            energy={energy}
            onChange={u => updateExercise(i, u)}
          />
        ))}
      </div>

      <div className="text-[11px] text-emerald-300 mt-2">{cfg.skill}</div>

      <div className="mt-2">
        <label className="block text-[10px] text-zinc-400 mb-1">
          Notas del día
        </label>
        <textarea
          className="w-full rounded-xl bg-black/50 border border-zinc-800 p-2 text-xs min-h-[70px]"
          placeholder="Cómo dormiste, dolores, PRs, etc."
          value={sday.notes}
          onChange={updateNotes}
        />
      </div>
    </section>
  );
}

// ---------- Progreso semanal simple ----------
function computeWeeklyPct(days: DayState[]): number {
  const weekStart = (() => {
    const d = new Date();
    const dow = d.getDay(); // 0=Dom..6=Sab
    const offset = (dow + 6) % 7; // lunes
    d.setDate(d.getDate() - offset);
    return d.toISOString().slice(0, 10);
  })();

  const today = todayISO();
  let done = 0;
  for (let i = 0; i < 7; i++) {
    const d = days[i];
    if (!d?.lastCompletedISO) continue;
    if (d.lastCompletedISO >= weekStart && d.lastCompletedISO <= today) {
      done++;
    }
  }
  return Math.round((done / 7) * 100);
}

function ProgressBar({ state }: { state: AppState }) {
  const pct = computeWeeklyPct(state.days);
  const completed = state.days.filter(d => d.lastCompletedISO).length;
  return (
    <section className="card mb-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-emerald-300">
            Progreso semanal
          </h2>
          <p className="text-[10px] text-zinc-500">
            Días marcados como completados: {completed}/7
          </p>
        </div>
        <div className="text-2xl font-bold text-emerald-400 tabular-nums">
          {pct}%
        </div>
      </div>
      <div className="mt-2 h-2 rounded-full bg-zinc-900 overflow-hidden">
        <div
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </section>
  );
}

// ---------- App ----------
const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const todayIdx = todayIndex();

  return (
    <div className="min-h-screen bg-linear-to-b from-black to-zinc-950 text-zinc-50">
      <div className="max-w-4xl mx-auto px-4 pb-10 pt-4 space-y-4">
        {/* Header */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center shadow-[0_0_25px_rgba(239,68,68,0.6)]">
              <img
                src="public/spider-192.png"
                alt="Spider icon"
                className="w-7 h-7"
              />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-red-100">
                SpiderCalisténico
              </h1>
              <p className="text-[10px] text-zinc-400">
                Rutina guiada · progreso local 
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[9px] text-zinc-500">Hoy</span>
            <span className="px-3 py-1 rounded-xl text-[10px] border border-red-500/60 text-red-400">
              Día {todayIdx + 1}
            </span>
          </div>
        </header>

        {/* Progreso */}
        <ProgressBar state={state} />

        {/* Calentamiento */}
        <WarmupTimer dayIdx={todayIdx} />

        {/* Días */}
        <div className="space-y-4 mt-4">
          {WEEK.map((cfg, i) => (
            <DayCard
              key={cfg.name}
              idx={i}
              cfg={cfg}
              state={state}
              setState={setState}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
