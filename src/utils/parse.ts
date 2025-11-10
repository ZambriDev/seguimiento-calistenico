import type { ParsedReps } from "../types"; // Ajusta el path según tu estructura

export function parseReps(str: string) {
  if (!str) return null;
  const clean = str
    .replace(/×|\*/g, "x")
    .replace(/–|—/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  const suffixMatch = clean.match(/(\/\s*pierna|\/\s*brazo|min|fallo|s\b)/i);
  const suffix = suffixMatch ? suffixMatch[0] : "";

  const m = clean.match(/(\d+)\s*x\s*(\d+)(?:\s*-\s*(\d+))?/i);
  if (!m) return { raw: str, sets: 0, min: 0, max: 0, step: 1, suffix };

  const sets = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const max = m[3] ? parseInt(m[3], 10) : min;
  return { raw: str, sets, min, max, step: 1, suffix };
}

export function formatReps(p: ParsedReps | null | undefined): string {
  if (!p) return "";
  const base = `${p.sets}x${p.min}${p.max && p.max !== p.min ? `-${p.max}` : ""}`;
  return p.suffix ? `${base} ${p.suffix}` : base;
}