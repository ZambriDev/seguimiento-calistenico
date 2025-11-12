// Fechas/indices
export function todayIndex() {
  // JS: 0=Dom..6=Sab → App: 0=Lun..6=Dom
  const map = [6, 0, 1, 2, 3, 4, 5];
  return map[new Date().getDay()] ?? 0;
}
export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
export function currentMonthKey() {
  return todayISO().slice(0, 7); // YYYY-MM
}
export function getWeekStartISO() {
  const d = new Date();
  const day = d.getDay(); // 0=Dom..6=Sab
  const offset = (day + 6) % 7; // lunes inicio
  d.setDate(d.getDate() - offset);
  return d.toISOString().slice(0, 10);
}
export function dayIndexFromDate(date) {
  const map = [6, 0, 1, 2, 3, 4, 5];
  return map[date.getDay()] ?? 0;
}
