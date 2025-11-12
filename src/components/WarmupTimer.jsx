import { useEffect, useMemo, useRef, useState } from "react";
import ConfirmModal from "./ConfirmModal";
import { DURATIONS, getSpecificTipsForDay } from "../lib/warmup";

export default function WarmupTimer({ dayIdx }) {
  // Selector controlado por PRIMITIVO (evita lag del primer cambio)
  const [selTotal, setSelTotal] = useState(DURATIONS[0].total);
  const sel = useMemo(
    () => DURATIONS.find((d) => d.total === selTotal) || DURATIONS[0],
    [selTotal]
  );

  const [remaining, setRemaining] = useState(DURATIONS[0].total);
  const [activeKey, setActiveKey] = useState(null);
  const [running, setRunning] = useState(false);

  // Modal de confirmación
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingBlock, setPendingBlock] = useState(null);

  // Refs de control
  const timerRef = useRef(null);
  const lastKeyRef = useRef(null);
  const audioRef = useRef(null);
  const planRef = useRef([]);                // plan persistente de bloques
  const awaitingConfirmRef = useRef(false);  // evita prompts duplicados

  // ---------- Audio ----------
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

  // ---------- Bloques ----------
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
        tips: ["Jumping jacks 30–45 s", "Skips o soga 30–45 s", "Respiración nasal"],
      },
    ],
    [dayIdx]
  );

  const buildPlan = (total) => {
    const base = WARMUP_BLOCKS.map((b) => Math.floor((b.pct / 100) * total));
    const used = base.reduce((a, b) => a + b, 0);
    base[base.length - 1] += total - used; // ajustar residuos
    let acc = 0;
    return WARMUP_BLOCKS.map((b, i) => {
      const sec = base[i];
      const from = acc;
      const to = acc + sec;
      acc = to;
      return { ...b, sec, from, to };
    });
  };

  // --- Helpers para tiempos dinámicos por tip ---
  const fmtSec = (s) =>
    s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : `${s}s`;
  const splitEven = (total, n) => {
    const base = Math.floor(total / n || 0);
    const rem = total % (n || 1);
    return Array.from({ length: n || 1 }, (_, i) => base + (i < rem ? 1 : 0));
  };
  const makeTipText = (raw, secs) => {
    const replaced = String(raw)
      .replace(/\b\d+\s*(?:–|-|to)?\s*\d*\s*(?:s|min)\b/gi, "")
      .replace(/\b\d+\s*min\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    return `${replaced} · ${fmtSec(secs)}`;
  };

  // Totales basados en PRIMITIVO (sin lag)
  const totalForBar = selTotal;
  const elapsed = totalForBar - remaining;
  const overallPct = totalForBar
    ? Math.max(0, Math.min(100, (elapsed / totalForBar) * 100))
    : 0;

  // ---------- Tick con pausa entre bloques (controlado por modal) ----------
  const startTick = (total) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setRunning(false);
          navigator.vibrate?.([100, 60, 100, 60, 200]);
          [880, 980, 1180].forEach((f, i) =>
            setTimeout(() => beep(f, 110), i * 140)
          );
          setActiveKey(null);
          lastKeyRef.current = null;
          planRef.current = [];
          awaitingConfirmRef.current = false;
          setShowConfirm(false);
          setPendingBlock(null);
          return 0;
        }

        const now = prev - 1;
        const elapsedNow = total - now;
        const block = planRef.current.find(
          (p) => elapsedNow > p.from && elapsedNow <= p.to
        );
        const newKey = block?.key ?? null;

        // Cambio de bloque -> mostrar modal UNA vez
        if (newKey !== lastKeyRef.current) {
          if (!awaitingConfirmRef.current) {
            awaitingConfirmRef.current = true;
            if (timerRef.current) clearInterval(timerRef.current);
            setRunning(false); // pausa dura
            navigator.vibrate?.(40);
            beep(900, 90);
            setActiveKey(null);
            setPendingBlock(block || null);
            setShowConfirm(true);
          }
          return now; // conservar tiempo exacto
        }

        setActiveKey(newKey);
        return now;
      });
    }, 1000);
  };

  // ---------- Controles ----------
  const start = async () => {
    const total = selTotal;
    const ctx = ensureAudio();
    try {
      if (ctx && ctx.state === "suspended") await ctx.resume();
    } catch {}

    if (planRef.current.length === 0 || remaining === total) {
      // inicio nuevo
      planRef.current = buildPlan(total);
      setRemaining(total);
      setActiveKey(planRef.current[0]?.key ?? null);
      lastKeyRef.current = planRef.current[0]?.key ?? null;
    } else {
      // reanudar
      const elapsedNow = total - remaining;
      const block = planRef.current.find(
        (p) => elapsedNow > p.from && elapsedNow <= p.to
      );
      lastKeyRef.current = block?.key ?? null;
      setActiveKey(lastKeyRef.current);
    }

    setRunning(true);
    awaitingConfirmRef.current = false;
    setShowConfirm(false);
    setPendingBlock(null);
    navigator.vibrate?.(60);
    beep(1000, 120);
    startTick(total);
  };

  const pause = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRunning(false);
    awaitingConfirmRef.current = false;
  };

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRunning(false);
    setRemaining(selTotal);
    setActiveKey(null);
    lastKeyRef.current = null;
    planRef.current = [];
    awaitingConfirmRef.current = false;
    setShowConfirm(false);
    setPendingBlock(null);
  };

  // ---------- Recalcular plan al cambiar duración o bloques ----------
  useEffect(() => {
    const total = selTotal;
    planRef.current = buildPlan(total);
    if (!running) {
      setRemaining(total);
      setActiveKey(planRef.current[0]?.key ?? null);
      lastKeyRef.current = planRef.current[0]?.key ?? null;
    }
    awaitingConfirmRef.current = false;
    setShowConfirm(false);
    setPendingBlock(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selTotal, WARMUP_BLOCKS]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ---------- Acciones del modal ----------
  const handleConfirmContinue = () => {
    const total = selTotal;
    if (pendingBlock?.key) {
      lastKeyRef.current = pendingBlock.key;
      setActiveKey(pendingBlock.key);
    }
    setShowConfirm(false);
    setPendingBlock(null);
    awaitingConfirmRef.current = false;
    setRunning(true);
    startTick(total);
  };

  const handleCancelPause = () => {
    setShowConfirm(false);
    awaitingConfirmRef.current = false;
  };

  // ---------- UI ----------
  const mm = Math.floor(remaining / 60);
  const ss = String(remaining % 60).padStart(2, "0");

  const plan = useMemo(
    () =>
      planRef.current.length ? planRef.current : buildPlan(selTotal),
    [selTotal, WARMUP_BLOCKS]
  );

  return (
    <div className="w-full rounded-2xl bg-zinc-900/60 border border-red-800/40 p-4 shadow">
      {/* Barra de controles — MOBILE FIRST */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-red-300">Calentamiento</h3>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Select duración: full-width en móvil */}
          <select
            className="w-full sm:w-auto bg-black/40 border border-zinc-700 rounded-xl px-3 py-2 text-sm disabled:opacity-50"
            value={String(selTotal)}
            disabled={running}
            onChange={(e) => {
              if (running) return;
              setSelTotal(Number(e.target.value)); // ← PRIMITIVO (sin lag)
            }}
          >
            {DURATIONS.map((d) => (
              <option key={d.total} value={String(d.total)}>
                {d.label}
              </option>
            ))}
          </select>

          {/* Botones: grid 3 cols en móvil, fila en desktop */}
          <div className="grid grid-cols-3 gap-2 sm:flex">
            <button
              onClick={start}
              disabled={running}
              className="min-h-11 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm w-full sm:w-auto"
            >
              {planRef.current.length && !running ? "Reanudar" : "Iniciar"}
            </button>
            <button
              onClick={pause}
              disabled={!running}
              className="min-h-11 px-3 py-2 rounded-xl bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white text-sm w-full sm:w-auto"
            >
              Pausar
            </button>
            <button
              onClick={stop}
              disabled={!running && planRef.current.length === 0}
              className="min-h-11 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white text-sm w-full sm:w-auto"
            >
              Detener
            </button>
          </div>
        </div>
      </div>

      {/* Timer */}
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

      {/* Tarjetas de bloques */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {plan.length === 0 ? (
          <div className="col-span-1 sm:col-span-4 text-xs text-zinc-400">
            Selecciona una duración válida.
          </div>
        ) : (
          plan.map((b) => {
            const blockElapsed = totalForBar - remaining;
            const pct =
              blockElapsed <= b.from
                ? 0
                : blockElapsed >= b.to
                ? 100
                : ((blockElapsed - b.from) / (b.sec || 1)) * 100;
            const isActive = activeKey === b.key;

            // repartir tiempo del bloque entre tips
            const perTip = splitEven(b.sec || 0, b.tips.length || 1);

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
                    {`${Math.floor(b.sec / 60)}:${String(b.sec % 60).padStart(
                      2,
                      "0"
                    )}`}
                  </span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={`${
                      isActive ? "bg-green-400" : "bg-zinc-600"
                    } h-full transition-[width] duration-1000`}
                    style={{
                      width: `${Math.max(0, Math.min(100, pct))}%`,
                    }}
                  />
                </div>
                <ul className="mt-2 text-xs text-zinc-300 list-disc ml-4 space-y-1">
                  {b.tips.map((t, i) => (
                    <li key={i}>{makeTipText(t, perTip[i])}</li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Spider */}
      <ConfirmModal
        open={showConfirm}
        title="Siguiente bloque"
        message={
          pendingBlock
            ? `¿Continuar con "${pendingBlock.label}"?`
            : "¿Continuar con el siguiente bloque?"
        }
        onConfirm={handleConfirmContinue}
        onCancel={handleCancelPause}
      />
    </div>
  );
}
