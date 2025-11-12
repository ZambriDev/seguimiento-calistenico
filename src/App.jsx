import React, { useEffect, useMemo, useRef, useState } from "react";

// Seguimiento Calisténico — MVP (React single-file)
// - Vista HOY / semana
// - Calentamiento guiado con bloques, barra, sonido y vibración (mobile-first)
// - Progresión: cada 2 completados puede subir reps o variar ejercicios
// - Botón de completado solo para HOY (checkbox claro)
// - Notas por día
// - Progreso & historial de medidas mensuales
// - Export / Import / Reiniciar (localStorage)
// - Logo araña estilo Spider

const LS_KEY = "scalist_mvp_v1";

// ---------- Utilidades ----------
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function todayIndex() {
  // JS: 0=Dom..6=Sab → App: 0=Lun..6=Dom
  const map = [6, 0, 1, 2, 3, 4, 5];
  return map[new Date().getDay()] ?? 0;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonthKey() {
  return todayISO().slice(0, 7); // YYYY-MM
}

function emptyMetrics() {
  return {
    weight: "",
    waist: "",
    chest: "",
    shoulders: "",
    comment: "",
  };
}

// Parse "3x12-20", "3x10-12 / pierna", etc.
function parseReps(str) {
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
  if (!m) return { raw: str, sets: 0, min: 0, max: 0, step: 1, suffix };

  const sets = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const max = m[3] ? parseInt(m[3], 10) : min;
  return { raw: str, sets, min, max, step: 1, suffix };
}

function formatReps(p) {
  if (!p) return "";
  const base = `${p.sets}x${p.min}${
    p.max && p.max !== p.min ? `-${p.max}` : ""
  }`;
  return p.suffix ? `${base} ${p.suffix}` : base;
}

// ---------- Programa base ----------
const VARIATIONS = {
  "Lagartijas": "Lagartijas declinadas",
  "Lagartijas inclinadas": "Lagartijas declinadas lastradas",
  "Pike push-ups": "Pike ROM profunda",
  "Fondos en sillas": "Fondos en sillas (lastre/ROM)",
  "Fondos en sillas (asistidos)": "Fondos en sillas",
  "Dominadas pronas": "Dominadas pronas (lastradas/negativas de MU)",
  "Dominadas supinas": "Dominadas supinas (lastradas)",
  "Remo invertido": "Remo invertido pies elevados",
  "Remo invertido pies elevados": "Remo invertido lastrado",
  "Australianas supinas": "Australianas supinas pies elevados",
  "Sentadillas": "Sentadillas con salto / Pistol asistida",
  "Squat jumps": "Pistol completa / variaciones explosivas",
};

const WEEK = [
  {
    name: "Empuje (base)",
    type: "Pecho · hombros · tríceps",
    exercises: [
      { label: "Lagartijas", reps: "3x8-12" },
      { label: "Lagartijas inclinadas", reps: "3x10-15" },
      { label: "Pike push-ups", reps: "3x6-8" },
      { label: "Fondos en sillas (asistidos)", reps: "2x5-8" },
      { label: "Flexiones pliométricas", reps: "2x4-6" },
    ],
    skill: "Handstand asistido (3x15 s)",
  },
  {
    name: "Tirón (base)",
    type: "Espalda · bíceps",
    exercises: [
      { label: "Dominadas pronas", reps: "3x4-6" },
      { label: "Remo invertido", reps: "3x8-10" },
      { label: "Australianas supinas", reps: "2x10-12" },
      { label: "Curl bíceps DB", reps: "3x10-12" },
      { label: "Face pulls / Y-T-W", reps: "2x12-15" },
    ],
    skill: "Hollow hold 3x25 s",
  },
  {
    name: "Piernas & Core (base)",
    type: "Inferior · abdomen",
    exercises: [
      { label: "Sentadillas", reps: "4x12-20" },
      { label: "Zancadas alternas", reps: "3x10-12 / pierna" },
      { label: "Hip thrust / Puente glúteos", reps: "3x12-15" },
      { label: "Elev. pantorrilla", reps: "3x15-25" },
      { label: "Plancha", reps: "3x25-35 s" },
      { label: "Elev. piernas", reps: "3x8-12" },
    ],
    skill: "Pistol asistida / Búlgara 3x6-8 / pierna",
  },
  {
    name: "Empuje (plus)",
    type: "Pecho · hombros · tríceps (progresión)",
    exercises: [
      { label: "Lagartijas declinadas", reps: "3x8-12" },
      { label: "Pike ROM profunda", reps: "3x6-8" },
      { label: "Fondos en sillas", reps: "3x6-10" },
      { label: "Extensión tríceps DB", reps: "2x10-12" },
      { label: "Flexiones pliométricas", reps: "2x6" },
    ],
    skill: "Handstand libre asistido / kick-ups",
  },
  {
    name: "Tirón (plus)",
    type: "Espalda · bíceps (progresión)",
    exercises: [
      { label: "Dominadas supinas", reps: "3x4-6" },
      { label: "Remo invertido pies elevados", reps: "3x8-10" },
      { label: "Australianas supinas", reps: "2x12-15" },
      { label: "Curl martillo DB", reps: "3x8-10" },
      { label: "Face pulls / Y-T-W", reps: "2x15" },
    ],
    skill: "Negativas / transición de muscle-up",
  },
  {
    name: "Piernas & HIIT",
    type: "Explosividad · core",
    exercises: [
      { label: "Squat jumps", reps: "3x8-12" },
      { label: "Pistol / Búlgara", reps: "3x6-8 / pierna" },
      { label: "Buenos días / RDL", reps: "3x10-12" },
      { label: "Tabata ABS", reps: "4 min" },
    ],
    skill: "Sprints suaves / cambios de dirección",
  },
  {
    name: "Descanso activo",
    type: "Recuperación",
    exercises: [
      { label: "Movilidad", reps: "10-15 min" },
      { label: "Caminata/trote", reps: "20-40 min" },
      { label: "HS suave + L-sit", reps: "libre" },
      { label: "Revisión semanal", reps: "libre" },
    ],
    skill: "Planificación próxima semana",
  },
];

// ---------- Persistencia ----------
const defaultState = () => ({
  days: WEEK.map(day => ({
    notes: "",
    completionCount: 0,
    lastCompletedISO: null,
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

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultState();
    const data = JSON.parse(raw);
    const base = defaultState();
    const next = { ...base };

    if (Array.isArray(data.days)) {
      next.days = WEEK.map((day, i) => {
        const d = data.days[i] || {};
        return {
          notes: d.notes || "",
          completionCount:
            typeof d.completionCount === "number" ? d.completionCount : 0,
          lastCompletedISO: d.lastCompletedISO || null,
          exercises: day.exercises.map((ex, j) => {
            const src = d.exercises && d.exercises[j] ? d.exercises[j] : ex;
            const repsRaw = src.repsRaw || src.reps || ex.reps;
            return {
              label: src.label || ex.label,
              repsRaw,
              parsed: parseReps(repsRaw),
            };
          }),
        };
      });
    }

    const mbm = { ...(data.metricsByMonth || {}) };

    // Migración desde estructura vieja `metrics`
    if (data.metrics) {
      const legacy = data.metrics;
      const mKey = legacy.month || currentMonthKey();
      mbm[mKey] = {
        weight: legacy.weight || "",
        waist: legacy.waist || "",
        chest: legacy.chest || "",
        shoulders: legacy.shoulders || "",
        comment: legacy.comment || "",
      };
    }

    const cm = currentMonthKey();
    if (!mbm[cm]) mbm[cm] = emptyMetrics();

    next.metricsByMonth = mbm;

    return next;
  } catch {
    return defaultState();
  }
}

function saveState(state) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

// ---------- Calentamiento helpers ----------
function getSpecificTipsForDay(dayIdx) {
  const tipsMap = {
    0: ["Empuje: pike lean 2x15 s, fondos apoyo 2x5"],
    1: ["Tirón: excéntricas de dominada 2x3, remo 1x10"],
    2: ["Piernas: sentadilla 2x15, zancadas 1x10/pierna"],
    3: ["Empuje: pike lean 2x15 s, fondos apoyo 2x5"],
    4: ["Tirón: excéntricas de dominada 2x3, remo 1x10"],
    5: ["Piernas: sentadilla 2x15, zancadas 1x10/pierna"],
    6: ["Descanso activo: movilidad general ligera"],
  };
  return tipsMap[dayIdx] || ["Movilidad general"];
}

const DURATIONS = [
  { label: "Rápido (4 min)", total: 4 * 60 },
  { label: "Normal (7 min)", total: 7 * 60 },
  { label: "Extendido (10 min)", total: 10 * 60 },
];

// ---------- Calentamiento ----------
function WarmupTimer({ dayIdx }) {
  const [sel, setSel] = useState(DURATIONS[0]);
  const [remaining, setRemaining] = useState(DURATIONS[0].total);
  const [activeKey, setActiveKey] = useState(null);
  const [running, setRunning] = useState(false);
  const timerRef = useRef(null);
  const lastKeyRef = useRef(null);
  const audioRef = useRef(null);

  const ensureAudio = () => {
    if (!audioRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioRef.current = new AC();
    }
    return audioRef.current;
  };

  const beep = (freq = 880, durMs = 120, vol = 0.03) => {
    const ctx = ensureAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.value = vol;
    osc.connect(gain).connect(ctx.destination);
    const now = ctx.currentTime;
    osc.start(now);
    osc.stop(now + durMs / 1000);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durMs / 1000);
  };

  const WARMUP_BLOCKS = useMemo(
    () => [
      {
        key: "mov",
        label: "Movilidad general",
        pct: 25,
        tips: [
          "Cuello: círculos 2x10/lado",
          "Hombros: círculos 2x10",
          "Cadera: flex-ext y círculos 2x10",
          "Tobillos: círculos 2x10/lado",
        ],
      },
      {
        key: "core",
        label: "Core & escápulas",
        pct: 30,
        tips: [
          "Hollow hold 2x20–30 s",
          "Scapular push-ups 2x12",
          "Y-T-W 2x10",
          "Dead bug 2x10/lado",
        ],
      },
      {
        key: "spec",
        label: "Específico del día",
        pct: 35,
        tips: getSpecificTipsForDay(dayIdx),
      },
      {
        key: "cardio",
        label: "Cardio breve",
        pct: 10,
        tips: [
          "Jumping jacks 30–45 s",
          "Skips o soga 30–45 s",
          "Respiración nasal",
        ],
      },
    ],
    [dayIdx]
  );

  const plan = useMemo(() => {
    const total = Number(sel?.total) || 0;
    if (!total) return [];
    const base = WARMUP_BLOCKS.map(b => Math.floor((b.pct / 100) * total));
    const used = base.reduce((a, b) => a + b, 0);
    base[base.length - 1] += total - used;
    let acc = 0;
    return WARMUP_BLOCKS.map((b, i) => {
      const sec = base[i];
      const from = acc;
      const to = acc + sec;
      acc = to;
      return { ...b, sec, from, to };
    });
  }, [sel, WARMUP_BLOCKS]);

  const start = async () => {
    if (running) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const ctx = ensureAudio();
    try {
      if (ctx && ctx.state === "suspended") await ctx.resume();
    } catch {}

    const selSafe = Number(sel?.total) ? sel : DURATIONS[0];

    const base = WARMUP_BLOCKS.map(b =>
      Math.floor((b.pct / 100) * selSafe.total)
    );
    const used = base.reduce((a, b) => a + b, 0);
    base[base.length - 1] += selSafe.total - used;
    let acc = 0;
    const safePlan = WARMUP_BLOCKS.map((b, i) => {
      const sec = base[i];
      const from = acc;
      const to = acc + sec;
      acc = to;
      return { ...b, sec, from, to };
    });

    setRemaining(selSafe.total);
    setActiveKey(safePlan[0]?.key ?? null);
    lastKeyRef.current = safePlan[0]?.key ?? null;
    setRunning(true);
    navigator.vibrate?.(60);
    beep(1000, 120);

    timerRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setRunning(false);
          navigator.vibrate?.([100, 60, 100, 60, 200]);
          [880, 980, 1180].forEach((f, i) =>
            setTimeout(() => beep(f, 110), i * 140)
          );
          setActiveKey(null);
          lastKeyRef.current = null;
          return 0;
        }

        const now = prev - 1;
        const total = selSafe.total;
        const elapsed = total - now;
        const block = safePlan.find(
          p => elapsed > p.from && elapsed <= p.to
        );
        const newKey = block?.key ?? null;
        if (newKey !== lastKeyRef.current) {
          navigator.vibrate?.(30);
          beep(900, 90);
          lastKeyRef.current = newKey;
        }
        setActiveKey(newKey);
        return now;
      });
    }, 1000);
  };

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRunning(false);
    setRemaining(Number(sel?.total) || DURATIONS[0].total);
    setActiveKey(null);
    lastKeyRef.current = null;
  };

  useEffect(() => {
    if (!running) {
      setRemaining(Number(sel?.total) || DURATIONS[0].total);
    }
  }, [sel, running]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const mm = Math.floor(remaining / 60);
  const ss = String(remaining % 60).padStart(2, "0");
  const totalForBar = Number(sel?.total) || DURATIONS[0].total;
  const elapsed = totalForBar - remaining;
  const overallPct = totalForBar
    ? Math.max(0, Math.min(100, (elapsed / totalForBar) * 100))
    : 0;

  return (
    <div className="w-full rounded-2xl bg-zinc-900/60 border border-red-800/40 p-4 shadow">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <h3 className="text-lg font-semibold text-red-300">Calentamiento</h3>
        <div className="flex items-center gap-2">
          <select
            className="bg-black/40 border border-zinc-700 rounded-xl px-3 py-2 text-sm disabled:opacity-50"
            value={Number(sel?.total) || DURATIONS[0].total}
            disabled={running}
            onChange={e => {
              if (running) return;
              const newSel =
                DURATIONS.find(d => d.total === Number(e.target.value)) ||
                DURATIONS[0];
              setSel(newSel);
              setRemaining(newSel.total);
            }}
          >
            {DURATIONS.map(d => (
              <option key={d.total} value={d.total}>
                {d.label}
              </option>
            ))}
          </select>
          <button
            onClick={start}
            disabled={running}
            className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm"
          >
            Iniciar
          </button>
          <button
            onClick={stop}
            disabled={!running}
            className="px-3 py-2 rounded-xl bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white text-sm"
          >
            Detener
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <div className="text-3xl tabular-nums font-bold text-green-300">
          {mm}:{ss}
        </div>
        <div className="text-xs text-zinc-400">restante</div>
      </div>

      <div className="mt-3 h-2 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full bg-green-500 transition-[width] duration-1000"
          style={{ width: `${overallPct}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {plan.length === 0 ? (
          <div className="col-span-2 sm:col-span-4 text-xs text-zinc-400">
            Selecciona una duración válida.
          </div>
        ) : (
          plan.map(b => {
            const blockPct =
              elapsed <= b.from
                ? 0
                : elapsed >= b.to
                ? 100
                : ((elapsed - b.from) / (b.sec || 1)) * 100;
            const isActive = activeKey === b.key;
            return (
              <div
                key={b.key}
                className={`rounded-xl p-3 border ${
                  isActive
                    ? "border-green-400 bg-green-900/20"
                    : "border-zinc-700 bg-black/30"
                }`}
              >
                <div className="text-sm font-medium text-zinc-100 flex items-center justify-between">
                  <span>{b.label}</span>
                  <span className="text-xs text-zinc-400">
                    {`${Math.floor(b.sec / 60)}:${String(
                      b.sec % 60
                    ).padStart(2, "0")}`}
                  </span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={`${
                      isActive ? "bg-green-400" : "bg-zinc-600"
                    } h-full transition-[width] duration-1000`}
                    style={{
                      width: `${Math.max(0, Math.min(100, blockPct))}%`,
                    }}
                  />
                </div>
                <ul className="mt-2 text-xs text-zinc-300 list-disc ml-4 space-y-1">
                  {b.tips.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ---------- Ejercicio ----------
function ExerciseRow({ ex, onChange }) {
  const adjustable =
    !!ex.parsed &&
    !!ex.parsed.max &&
    !/fallo|min|s$/i.test(ex.parsed.suffix || "");

  const inc = () => {
    if (!adjustable || !ex.parsed) return;
    const p = { ...ex.parsed };
    const next = clamp(p.min + (p.step || 1), 1, p.max);
    onChange({
      ...ex,
      parsed: { ...p, min: next },
      repsRaw: formatReps({ ...p, min: next }),
    });
  };

  const dec = () => {
    if (!adjustable || !ex.parsed) return;
    const p = { ...ex.parsed };
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
        >
          –
        </button>
        <button
          onClick={inc}
          disabled={!adjustable}
          className="w-8 h-8 rounded-xl bg-red-600 text-white disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}

// ---------- Día ----------
function DayCard({ dayIdx, state, setState }) {
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
          doAdd = window.confirm(
            "Has completado este día varias veces. ¿Subimos un poco las repeticiones en algunos ejercicios?"
          );
        }

        if (!doAdd && hasVariation) {
          doVar = window.confirm(
            "Ya estás en el máximo en varios ejercicios. ¿Pasamos a variaciones más desafiantes?"
          );
        }

        if (doAdd || doVar) {
          d.exercises = d.exercises.map(ex => {
            const p = ex.parsed;
            if (!p || /fallo|min|s$/i.test(p.suffix || "")) return ex;

            if (doAdd && p.min < p.max) {
              const nextMin = clamp(p.min + 1, 1, p.max);
              return {
                ...ex,
                parsed: { ...p, min: nextMin },
                repsRaw: formatReps({ ...p, min: nextMin }),
              };
            }

            if (doVar && p.min >= p.max) {
              const nextLabel = VARIATIONS[ex.label];
              if (nextLabel) {
                const base = parseReps("3x8-12");
                return {
                  label: nextLabel,
                  repsRaw: formatReps(base),
                  parsed: base,
                };
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
          {isCompletedToday
            ? "Día completado (desmarcar)"
            : "Marcar día completado"}
        </button>
      </div>

      <div className="mt-2 text-xs text-zinc-400">
        Progreso completado:{" "}
        <span className="text-green-400 font-semibold">
          {sday.completionCount}
        </span>
      </div>

      <div className="mt-4 divide-y divide-zinc-800">
        {sday.exercises.map((ex, i) => (
          <ExerciseRow
            key={i}
            ex={ex}
            onChange={u => updateExercise(i, u)}
          />
        ))}
      </div>

      <div className="mt-4 text-sm text-emerald-300">
        Skill: {day.skill}
      </div>

      <div className="mt-4">
        <label className="block text-sm text-zinc-300 mb-1">
          Notas del día
        </label>
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

// ---------- Progreso & Medidas ----------
function getWeekStartISO() {
  const d = new Date();
  const day = d.getDay(); // 0=Dom..6=Sab
  const offset = (day + 6) % 7; // lunes inicio
  d.setDate(d.getDate() - offset);
  return d.toISOString().slice(0, 10);
}

function dayIndexFromDate(date) {
  const map = [6, 0, 1, 2, 3, 4, 5];
  return map[date.getDay()] ?? 0;
}

function computeWeeklyCompletion(days) {
  if (!Array.isArray(days) || days.length === 0) return 0;
  const weekStart = getWeekStartISO();
  const today = todayISO();
  let done = 0;
  for (let i = 0; i < 7; i++) {
    const d = days[i];
    if (!d || !d.lastCompletedISO) continue;
    if (d.lastCompletedISO >= weekStart && d.lastCompletedISO <= today) {
      done += 1;
    }
  }
  return Math.max(0, Math.min(100, Math.round((done / 7) * 100)));
}

function computeStreak(days) {
  if (!Array.isArray(days) || days.length === 0) return 0;
  let streak = 0;
  const today = new Date();
  while (true) {
    const d = new Date(today);
    d.setDate(today.getDate() - streak);
    const iso = d.toISOString().slice(0, 10);
    const idx = dayIndexFromDate(d);
    const dayState = days[idx];
    if (dayState && dayState.lastCompletedISO === iso) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

function ProgressSection({ state, setState }) {
  const days = state.days || [];
  const weeklyPct = computeWeeklyCompletion(days);
  const streak = computeStreak(days);

  const CURRENT_MONTH = currentMonthKey();
  const metricsByMonth = state.metricsByMonth || {};

  const availableMonths = (Object.keys(metricsByMonth).length
    ? Object.keys(metricsByMonth)
    : [CURRENT_MONTH]
  ).sort();

  const [selectedMonth, setSelectedMonth] = useState(
    availableMonths.includes(CURRENT_MONTH)
      ? CURRENT_MONTH
      : availableMonths[availableMonths.length - 1]
  );

  useEffect(() => {
    if (!availableMonths.includes(selectedMonth)) {
      const fallback = availableMonths.includes(CURRENT_MONTH)
        ? CURRENT_MONTH
        : availableMonths[availableMonths.length - 1];
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
      const nextMBM = {
        ...prevMBM,
        [CURRENT_MONTH]: {
          ...base,
          ...patch,
        },
      };
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
      <h2 className="text-lg font-semibold text-emerald-300">
        Progreso &amp; Medidas
      </h2>

      {/* Selector de mes / historial */}
      <div className="flex items-center gap-2 text-[10px] text-zinc-400 flex-wrap">
        <span>Historial mensual:</span>
        <div className="flex flex-wrap gap-1">
          {availableMonths.map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setSelectedMonth(m)}
              className={`px-2 py-1 rounded-lg border transition-all ${
                m === selectedMonth
                  ? "bg-emerald-700 text-white border-emerald-400"
                  : "bg-transparent text-emerald-300 border-emerald-700/40 hover:bg-emerald-900/40"
              }`}
            >
              {m}
              {m === CURRENT_MONTH ? " (actual)" : ""}
            </button>
          ))}
        </div>
      </div>

      {/* Resumen numérico sobre el mes seleccionado */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl bg-zinc-900/80 border border-zinc-700 px-3 py-2">
          <div className="text-[10px] text-zinc-400 uppercase tracking-wide">
            Cumplimiento semanal
          </div>
          <div className="text-2xl font-bold text-emerald-400">{weeklyPct}%</div>
        </div>
        <div className="rounded-xl bg-zinc-900/80 border border-zinc-700 px-3 py-2">
          <div className="text-[10px] text-zinc-400 uppercase tracking-wide">
            Racha
          </div>
          <div className="text-2xl font-bold text-emerald-400">{streak}</div>
        </div>
        <div className="rounded-xl bg-zinc-900/80 border border-zinc-700 px-3 py-2">
          <div className="text-[10px] text-zinc-400 uppercase tracking-wide">
            Peso (kg) {isCurrent ? "(actual)" : ""}
          </div>
          <div className="text-xl font-semibold text-zinc-100">
            {fmt(currentMetrics.weight)}
          </div>
        </div>
        <div className="rounded-xl bg-zinc-900/80 border border-zinc-700 px-3 py-2">
          <div className="text-[10px] text-zinc-400 uppercase tracking-wide">
            Cintura (cm) {isCurrent ? "(actual)" : ""}
          </div>
          <div className="text-xl font-semibold text-zinc-100">
            {fmt(currentMetrics.waist)}
          </div>
        </div>
      </div>

      <div className="mt-2">
        <details className="group" open>
          <summary className="flex items-center justify-between cursor-pointer text-base font-medium text-zinc-200 select-none py-2 px-3 rounded-lg bg-emerald-900/30 border border-emerald-700 hover:bg-emerald-800/70 transition-all">
            <span>
              {isCurrent
                ? "Editar medidas del mes actual"
                : "Ver medidas guardadas de este mes"}
            </span>
            <span className="transition-transform duration-200 group-open:rotate-90">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_4px_rgba(34,197,94,0.8)]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="8 4 16 12 8 20" />
              </svg>
            </span>
          </summary>

          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Peso (kg)</label>
              <input
                type="number"
                inputMode="decimal"
                className="w-full rounded-lg bg-black/40 border border-zinc-700 px-2 py-1 text-sm disabled:opacity-40"
                value={currentMetrics.weight || ""}
                onChange={e => updateMetrics({ weight: e.target.value })}
                disabled={!isCurrent}
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Cintura (cm)</label>
              <input
                type="number"
                inputMode="decimal"
                className="w-full rounded-lg bg-black/40 border border-zinc-700 px-2 py-1 text-sm disabled:opacity-40"
                value={currentMetrics.waist || ""}
                onChange={e => updateMetrics({ waist: e.target.value })}
                disabled={!isCurrent}
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Pecho (cm)</label>
              <input
                type="number"
                inputMode="decimal"
                className="w-full rounded-lg bg-black/40 border border-zinc-700 px-2 py-1 text-sm disabled:opacity-40"
                value={currentMetrics.chest || ""}
                onChange={e => updateMetrics({ chest: e.target.value })}
                disabled={!isCurrent}
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Hombros (cm)</label>
              <input
                type="number"
                inputMode="decimal"
                className="w-full rounded-lg bg-black/40 border border-zinc-700 px-2 py-1 text-sm disabled:opacity-40"
                value={currentMetrics.shoulders || ""}
                onChange={e => updateMetrics({ shoulders: e.target.value })}
                disabled={!isCurrent}
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-xs text-zinc-400 mb-1">
              Comentario mensual
            </label>
            <textarea
              className="w-full rounded-lg bg-black/40 border border-zinc-700 px-2 py-1 text-sm min-h-[70px] disabled:opacity-40"
              placeholder={
                isCurrent
                  ? "Cómo te ves/sientes este mes, progresos visibles, ropa, energía, etc."
                  : "Comentario guardado para este mes"
              }
              value={currentMetrics.comment || ""}
              onChange={e => updateMetrics({ comment: e.target.value })}
              disabled={!isCurrent}
            />
          </div>

          <button
            onClick={onSave}
            disabled={!isCurrent}
            className="mt-3 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-sm disabled:opacity-40"
          >
            Guardar medidas del mes actual
          </button>
        </details>
      </div>
    </div>
  );
}

// ---------- Extras ----------
function DietCard() {
  return (
    <div className="rounded-2xl bg-zinc-900/60 border border-green-800/40 p-4 shadow">
      <h3 className="text-lg font-semibold text-green-300">Dieta sugerida</h3>
      <ul className="mt-2 text-sm text-zinc-200 list-disc ml-5 space-y-1">
        <li>Prioriza proteína magra.</li>
        <li>Evita ultraprocesados y bebidas calóricas.</li>
        <li>Base de vegetales, frutas, legumbres y agua.</li>
        <li>3–4 comidas constantes.</li>
        <li>Constancia &gt; perfección diaria.</li>
      </ul>
    </div>
  );
}

function Header({ showWeek, setShowWeek }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-red-700 grid place-items-center text-white">
          {/* Logo araña */}
          <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
            <g
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2v6" />
              <path d="M7 4l2.5 3" />
              <path d="M17 4L14.5 7" />
              <ellipse cx="12" cy="10" rx="3" ry="4" />
              <path d="M5 9l3 1.5" />
              <path d="M19 9l-3 1.5" />
              <path d="M6 14l3-1" />
              <path d="M18 14l-3-1" />
              <path d="M9 13v5" />
              <path d="M15 13v5" />
              <path d="M8 21l2-2" />
              <path d="M16 21l-2-2" />
            </g>
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-100">
            Seguimiento Calisténico
          </h1>
          <p className="text-xs text-zinc-400">Tema Spider · móvil primero</p>
        </div>
      </div>
      <button
        onClick={() => setShowWeek(v => !v)}
        className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm"
      >
        {showWeek ? "Ver solo HOY" : "Ver plan semanal"}
      </button>
    </div>
  );
}

function ExportImport({ state, setState }) {
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seguimiento_calistenico_${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImport = e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const data = JSON.parse(String(rd.result));
        if (
          data &&
          Array.isArray(data.days) &&
          data.days.length === WEEK.length
        ) {
          setState(data);
          saveState(data);
        } else {
          alert("Archivo inválido o incompatible.");
        }
      } catch {
        alert("No se pudo leer el JSON.");
      }
    };
    rd.readAsText(file);
  };

  const resetAll = () => {
    const ok = window.confirm(
      "¿Estás seguro de que quieres reiniciar todo el progreso? Esta acción no se puede deshacer."
    );
    if (!ok) return;
    const fresh = defaultState();
    setState(fresh);
    saveState(fresh);
    navigator.vibrate?.(40);
    alert("Progreso reiniciado correctamente");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={exportJson}
        className="px-3 py-2 rounded-xl bg-zinc-800 text-zinc-100 text-sm"
      >
        Exportar JSON
      </button>
      <label className="px-3 py-2 rounded-xl bg-zinc-800 text-zinc-100 text-sm cursor-pointer">
        Importar JSON
        <input
          type="file"
          accept="application/json"
          className="hidden"
          onChange={onImport}
        />
      </label>
      <button
        onClick={resetAll}
        className="px-3 py-2 rounded-xl bg-zinc-800 text-red-300 text-sm"
      >
        Reiniciar
      </button>
    </div>
  );
}

// ---------- App ----------
export default function SeguimientoCalistenicoApp() {
  const [state, setState] = useState(loadState());
  const [showWeek, setShowWeek] = useState(false);
  const [idxToday, setIdxToday] = useState(todayIndex());

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    const id = setInterval(() => setIdxToday(todayIndex()), 60000);
    return () => clearInterval(id);
  }, []);

  // Mini tests en runtime (no rompen UI)
  useEffect(() => {
    try {
      const p = parseReps("3x10-15");
      console.assert(p && p.sets === 3 && p.max === 15, "parseReps ok");
      const st = defaultState();
      console.assert(Array.isArray(st.days) && st.days.length === WEEK.length);
    } catch {}
  }, []);

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top,rgba(255,0,0,0.08),transparent_60%)] bg-black text-zinc-100">
      <div className="max-w-screen-sm mx-auto p-4 pb-24">
        <Header showWeek={showWeek} setShowWeek={setShowWeek} />

        <div className="mt-4">
          <ExportImport state={state} setState={setState} />
        </div>

        <ProgressSection state={state} setState={setState} />

        <div className="mt-4">
          <WarmupTimer dayIdx={idxToday} />
        </div>

        {!showWeek ? (
          <div className="mt-4 space-y-4">
            <div className="text-sm text-zinc-400">
              Hoy:{" "}
              <span className="text-zinc-100 font-medium">
                {WEEK[idxToday].name}
              </span>
            </div>
            <DayCard
              dayIdx={idxToday}
              state={state}
              setState={setState}
            />
            <DietCard />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4">
            {WEEK.map((_, i) => (
              <div
                key={i}
                className={
                  i === idxToday
                    ? "ring-2 ring-green-500 rounded-2xl"
                    : ""
                }
              >
                <DayCard
                  dayIdx={i}
                  state={state}
                  setState={setState}
                />
              </div>
            ))}
          </div>
        )}

        <footer className="mt-8 text-center text-xs text-zinc-500">
          v1 · Datos guardados localmente · Tema Spider
        </footer>
      </div>
    </div>
  );
}
