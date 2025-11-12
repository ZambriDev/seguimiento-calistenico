// Helpers de progresión para reps y holds

// Detecta si el parsed es un hold en segundos (s)
export function isTimeHold(parsed) {
  if (!parsed) return false;
  const suf = (parsed.suffix || "").toLowerCase();
  return /\bs\b/.test(suf); // sufijo con "s"
}

// Reglas globales (puedes ajustar por etiqueta si quieres granularidad)
export const HOLD_RULES = {
  // how many completions to trigger a step
  everyCompletions: 2,
  // cuánto subir por paso (segundos)
  stepSec: 5,
  // tope por set (si el ejercicio trae rango, se usa el max del rango)
  // si el ejercicio NO trae rango (min==max), usamos este cap
  defaultCapSec: 60,
};

// Aplica una progresión de tiempo a un parsed (devuelve nuevo objeto)
export function bumpHoldSeconds(parsed) {
  if (!parsed) return parsed;
  const p = { ...parsed };
  const cap = p.max && p.max !== p.min ? p.max : HOLD_RULES.defaultCapSec;
  const nextMin = Math.min(cap, (p.min || 0) + HOLD_RULES.stepSec);
  return { ...p, min: nextMin };
}

// Formatea parsed → "3x25-35 s"
export function formatRepsFromParsed(p) {
  if (!p) return "";
  const base = `${p.sets}x${p.min}${p.max && p.max !== p.min ? `-${p.max}` : ""}`;
  return p.suffix ? `${base} ${p.suffix}` : base;
}
