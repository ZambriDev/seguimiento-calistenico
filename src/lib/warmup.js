// Calentamiento: duraciones y tips específicos
export const DURATIONS = [
  { label: "Rápido (4 min)", total: 4 * 60 },
  { label: "Normal (7 min)", total: 7 * 60 },
  { label: "Extendido (10 min)", total: 10 * 60 },
];

export function getSpecificTipsForDay(dayIdx) {
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
