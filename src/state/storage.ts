import { WEEK } from "../data/program";
import { parseReps } from "../utils/parse";
import { currentMonthKey } from "../utils/time";
import type { State } from "../types"; // Asegúrate de tener este tipo definido

const LS_KEY = "scalist_mvp_v1";

function emptyMetrics() {
  return {
    weight: "",
    waist: "",
    chest: "",
    shoulders: "",
    comment: "",
  };
}

export function defaultState() {
  return {
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
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    return defaultState();
  }
}

export function saveState(state: State) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Error saving state:", err);
  }
}