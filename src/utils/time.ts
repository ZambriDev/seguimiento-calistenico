export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function currentMonthKey() {
  return todayISO().slice(0, 7);
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
