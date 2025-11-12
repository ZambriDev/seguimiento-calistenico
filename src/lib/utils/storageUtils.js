import { WEEK } from "../program/baseProgram";
import { parseReps } from "./repParser";
import { currentMonthKey } from "./dateUtils";

const LS_KEY = "scalist_mvp_v1";

export function emptyMetrics() {
  return { weight: "", waist: "", chest: "", shoulders: "", comment: "" };
}

export function defaultState() {
  return {
    days: WEEK.map((day) => ({
      notes: "",
      completionCount: 0,
      lastCompletedISO: null,
      exercises: day.exercises.map((ex) => ({
        label: ex.label,
        repsRaw: ex.reps,
        parsed: parseReps(ex.reps),
      })),
    })),
    metricsByMonth: { [currentMonthKey()]: emptyMetrics() },
  };
}

export function loadState() {
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
          completionCount: typeof d.completionCount === "number" ? d.completionCount : 0,
          lastCompletedISO: d.lastCompletedISO || null,
          exercises: day.exercises.map((ex, j) => {
            const src = d.exercises && d.exercises[j] ? d.exercises[j] : ex;
            const repsRaw = src.repsRaw || src.reps || ex.reps;
            return { label: src.label || ex.label, repsRaw, parsed: parseReps(repsRaw) };
          }),
        };
      });
    }

    const mbm = { ...(data.metricsByMonth || {}) };

    // migración desde legacy metrics
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

export function saveState(state) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch {}
}
