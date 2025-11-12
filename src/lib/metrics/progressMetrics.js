import { todayISO, getWeekStartISO, dayIndexFromDate } from "../utils/dateUtils";

export function computeWeeklyCompletion(days) {
  if (!Array.isArray(days) || days.length === 0) return 0;
  const weekStart = getWeekStartISO();
  const today = todayISO();
  let done = 0;
  for (let i = 0; i < 7; i++) {
    const d = days[i];
    if (!d || !d.lastCompletedISO) continue;
    if (d.lastCompletedISO >= weekStart && d.lastCompletedISO <= today) done += 1;
  }
  return Math.max(0, Math.min(100, Math.round((done / 7) * 100)));
}

export function computeStreak(days) {
  if (!Array.isArray(days) || days.length === 0) return 0;
  let streak = 0;
  const today = new Date();
  while (true) {
    const d = new Date(today);
    d.setDate(today.getDate() - streak);
    const iso = d.toISOString().slice(0, 10);
    const idx = dayIndexFromDate(d);
    const dayState = days[idx];
    if (dayState && dayState.lastCompletedISO === iso) streak += 1;
    else break;
  }
  return streak;
}
