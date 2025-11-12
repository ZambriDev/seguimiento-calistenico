import { useEffect, useMemo, useRef, useState } from "react";
import ConfirmModal from "./ConfirmModal";
import { DURATIONS, getSpecificTipsForDay } from "../lib/utils/warmupUtils";
import { REP_DURATION_SEC } from "../lib/utils/repDurations";

export default function WarmupTimer({ dayIdx }) {
  const [selTotal, setSelTotal] = useState(DURATIONS[0].total);
  const [remaining, setRemaining] = useState(DURATIONS[0].total);
  const [activeKey, setActiveKey] = useState(null);
  const [running, setRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingBlock, setPendingBlock] = useState(null);

  const timerRef = useRef(null);
  const lastKeyRef = useRef(null);
  const audioRef = useRef(null);
  const planRef = useRef([]);
  const awaitingConfirmRef = useRef(false); // true cuando paramos para mostrar modal

  // ---------- audio ----------
  const ensureAudio = () => {
    if (!audioRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioRef.current = new AC();
    }
    return audioRef.current;
  };
  const beep = (f = 880, ms = 120, vol = 0.03) => {
    const ctx = ensureAudio(); if (!ctx) return;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = "sine"; o.frequency.value = f; g.gain.value = vol;
    o.connect(g).connect(ctx.destination);
    const now = ctx.currentTime; o.start(now); o.stop(now + ms / 1000);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(vol, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + ms / 1000);
  };

  // ---------- bloques ----------
  const WARMUP_BLOCKS = useMemo(
    () => [
      {
        key: "mov",
        label: "Movilidad general",
        pct: 25,
        tips: [
          "Cuello: círculos",
          "Hombros: círculos",
          "Cadera: flex-ext y círculos",
          "Tobillos: círculos",
        ],
      },
      {
        key: "core",
        label: "Core & escápulas",
        pct: 30,
        tips: ["Hollow hold", "Scapular push-ups", "Y-T-W", "Dead bug"],
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
        tips: ["Jumping jacks", "Skips o soga", "Respiración nasal"],
      },
    ],
    [dayIdx]
  );

  const buildPlan = (total) => {
    const base = WARMUP_BLOCKS.map((b) => Math.floor((b.pct / 100) * total));
    const used = base.reduce((a, b) => a + b, 0);
    base[base.length - 1] += total - used;
    let acc = 0;
    return WARMUP_BLOCKS.map((b, i) => {
      const sec = base[i]; const from = acc; const to = acc + sec; acc = to;
      return { ...b, sec, from, to };
    });
  };

  // ---------- util ----------
  const fmtSec = (s) =>
    s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : `${s}s`;

  const splitEven = (total, n) => {
    const base = Math.floor((total || 0) / (n || 1));
    const rem = (total || 0) % (n || 1);
    return Array.from({ length: n || 1 }, (_, i) => base + (i < rem ? 1 : 0));
  };

  const isRepLike = (raw) => {
    const t = String(raw).toLowerCase();
    if (t.includes("hollow") || t.includes("respiración")) return false;
    if (/\b(min|s)\b/.test(t)) return false;
    if (/\d+\s*x\s*\d+/.test(t)) return true;
    if (/\/\s*pierna|\/\s*brazo/.test(t)) return true;
    if (/\b\d{1,3}\b/.test(t)) return true;
    return /push|pull|rem|curl|bug|y-t-w|jack|soga|círcul|zancad|fondos|sentad/i.test(t);
  };

  const perRepFor = (raw) => {
    const t = String(raw).toLowerCase();
    if (t.includes("scapular")) return REP_DURATION_SEC["Scapular push-ups"] || 4;
    if (t.includes("y-t-w")) return REP_DURATION_SEC["Y-T-W"] || 3;
    if (t.includes("dead bug")) return REP_DURATION_SEC["Dead bug"] || 4;
    if (t.includes("círculos")) return 2.5;
    if (t.includes("zancad")) return 4;
    if (t.includes("jumping") || t.includes("soga")) return 1;
    return 3;
  };

  const tipTextFromSecs = (raw, secs) => {
    const low = String(raw).toLowerCase();
    if (low.includes("hollow") || low.includes("cardio") || low.includes("respiración"))
      return `${raw} · ${fmtSec(secs)}`;
    if (isRepLike(raw)) {
      const reps = Math.max(1, Math.floor(secs / perRepFor(raw)));
      return `${raw.replace(/\s*\d+\s*x\s*\d+.*$/i, "").trim()} · ≈ ${reps} reps`;
    }
    return `${raw} · ${fmtSec(secs)}`;
  };

  // ---------- estado derivado ----------
  const plan = useMemo(() => buildPlan(selTotal), [selTotal, WARMUP_BLOCKS]);

  const totalForBar = selTotal;
  const elapsed = totalForBar - remaining;
  const overallPct = totalForBar
    ? Math.max(0, Math.min(100, (elapsed / totalForBar) * 100))
    : 0;

  /**
   * Mantener estado cuando cambia plan/duración.
   * No cerrar el modal aquí (era el bug).
   */
  useEffect(() => {
    planRef.current = plan;

    if (!running) {
      if (!hasStarted) {
        setRemaining(selTotal);
        setActiveKey(plan[0]?.key ?? null);
        lastKeyRef.current = plan[0]?.key ?? null;
      } else {
        // en pausa → conserva remaining (clamp si bajaste duración)
        setRemaining((prev) => Math.min(prev, selTotal));
        const elapsedNow = selTotal - Math.min(remaining, selTotal);
        const block =
          plan.find((p) => elapsedNow > p.from && elapsedNow <= p.to) || plan[0];
        setActiveKey(block?.key ?? null);
        lastKeyRef.current = block?.key ?? null;
      }
    }
    // ⛔️ ya no: awaitingConfirmRef.current=false / setShowConfirm(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, running, selTotal, hasStarted]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // ---------- ticker ----------
  const startTick = (total) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setRunning(false);
          setHasStarted(false);
          navigator.vibrate?.([100, 60, 100, 60, 200]);
          [880, 980, 1180].forEach((f, i) => setTimeout(() => beep(f, 110), i * 140));
          setActiveKey(null); lastKeyRef.current = null; planRef.current = [];
          awaitingConfirmRef.current = false; setShowConfirm(false); setPendingBlock(null);
          return 0;
        }
        const now = prev - 1;
        const elapsedNow = total - now;
        const block = planRef.current.find((p) => elapsedNow > p.from && elapsedNow <= p.to);
        const newKey = block?.key ?? null;

        if (newKey !== lastKeyRef.current) {
          if (!awaitingConfirmRef.current) {
            awaitingConfirmRef.current = true;
            if (timerRef.current) clearInterval(timerRef.current);
            setRunning(false);             // pausa técnica
            navigator.vibrate?.(40); beep(900, 90);
            setActiveKey(null);
            setPendingBlock(block || null);
            setShowConfirm(true);           // ← mostrar modal
          }
          return now;
        }
        setActiveKey(newKey);
        return now;
      });
    }, 1000);
  };

  // ---------- controles ----------
  const start = async () => {
    const total = selTotal;
    const ctx = ensureAudio(); try { if (ctx && ctx.state === "suspended") await ctx.resume(); } catch {}

    if (planRef.current.length === 0 || remaining === total) {
      planRef.current = plan;
      setRemaining(total);
      setActiveKey(plan[0]?.key ?? null);
      lastKeyRef.current = plan[0]?.key ?? null;
    } else {
      const elapsedNow = total - remaining;
      const block = planRef.current.find((p) => elapsedNow > p.from && elapsedNow <= p.to);
      lastKeyRef.current = block?.key ?? null; setActiveKey(lastKeyRef.current);
    }

    setHasStarted(true);
    setRunning(true);
    awaitingConfirmRef.current = false; // listo para próximas transiciones
    setShowConfirm(false);
    setPendingBlock(null);
    navigator.vibrate?.(60); beep(1000, 120);
    startTick(total);
  };

  const pause = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRunning(false);
    // hasStarted queda true para mostrar "Reanudar"
    awaitingConfirmRef.current = false;
  };

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRunning(false);
    setHasStarted(false);
    setRemaining(selTotal);
    setActiveKey(null);
    lastKeyRef.current = null;
    planRef.current = [];
    awaitingConfirmRef.current = false;
    setShowConfirm(false);
    setPendingBlock(null);
  };

  // ---------- confirm modal ----------
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
    // se queda pausado; no alteramos remaining
  };

  // ---------- UI ----------
  const mm = Math.floor(remaining / 60);
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div className="w-full rounded-2xl bg-zinc-900/60 border border-red-800/40 p-4 shadow">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-red-300">Calentamiento</h3>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            className="w-full sm:w-auto bg-black/40 border border-zinc-700 rounded-xl px-3 py-2 text-sm disabled:opacity-50"
            value={String(selTotal)}
            disabled={running}
            onChange={(e) => { if (running) return; setSelTotal(Number(e.target.value)); }}
          >
            {DURATIONS.map((d) => (
              <option key={d.total} value={String(d.total)}>{d.label}</option>
            ))}
          </select>

          <div className="grid grid-cols-3 gap-2 sm:flex">
            <button
              onClick={start}
              disabled={running}
              className="min-h-11 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm w-full sm:w-auto"
            >
              {hasStarted && !running ? "Reanudar" : "Iniciar"}
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

      <div className="mt-3 flex items-baseline gap-2">
        <div className="text-3xl tabular-nums font-bold text-green-300">{mm}:{ss}</div>
        <div className="text-xs text-zinc-400">restante</div>
      </div>

      <div className="mt-3 h-2 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full bg-green-500 transition-[width] duration-1000"
          style={{ width: `${overallPct}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {plan.map((b) => {
          const blockElapsed = totalForBar - remaining;
          const pct =
            blockElapsed <= b.from
              ? 0
              : blockElapsed >= b.to
              ? 100
              : ((blockElapsed - b.from) / (b.sec || 1)) * 100;

          const isActive = activeKey === b.key;
          const perTip = splitEven(b.sec || 0, b.tips.length || 1);

          return (
            <div
              key={b.key}
              className={`rounded-xl p-3 border ${
                isActive ? "border-green-400 bg-green-900/20" : "border-zinc-700 bg-black/30"
              }`}
            >
              <div className="text-sm font-medium text-zinc-100 flex items-center justify-between">
                <span>{b.label}</span>
                <span className="text-xs text-zinc-400">
                  {`${Math.floor(b.sec / 60)}:${String(b.sec % 60).padStart(2, "0")}`}
                </span>
              </div>

              <div className="mt-2 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={`${isActive ? "bg-green-400" : "bg-zinc-600"} h-full transition-[width] duration-1000`}
                  style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                />
              </div>

              <ul className="mt-2 text-xs text-zinc-300 list-disc ml-4 space-y-1">
                {b.tips.map((t, i) => (
                  <li key={i}>{tipTextFromSecs(t, perTip[i])}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

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
