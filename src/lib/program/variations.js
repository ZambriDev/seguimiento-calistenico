// Variaciones de ejercicios por repeticiones (las que ya usabas)
export const VARIATIONS_REP = {
  "Lagartijas": "Lagartijas declinadas",
  "Lagartijas inclinadas": "Lagartijas declinadas lastradas",
  "Pike push-ups": "Pike ROM profunda",
  "Fondos en sillas": "Fondos en sillas (lastre/ROM)",
  "Fondos en sillas (asistidos)": "Fondos en sillas",
  "Dominadas pronas": "Dominadas pronas (lastradas/negativas de MU)",
  "Dominadas supinas": "Dominadas supinas (lastradas)",
  "Remo invertido": "Remo invertido pies elevados",
  "Remo invertido pies elevados": "Remo invertido lastrado",
  "Australianas supinas": "Australianas supinas pies elevados",
  "Sentadillas": "Sentadillas con salto / Pistol asistida",
  "Squat jumps": "Pistol completa / variaciones explosivas",
};

// Variaciones para ejercicios por tiempo (holds)
export const VARIATIONS_HOLD = {
  // Core y planchas
  "Hollow hold": "Hollow hold piernas extendidas",
  "Plancha": "Plancha RKC",
  // Puedes extender con más según tu plan del MD:
  // "Handstand asistido": "Handstand libre asistido",
  // "L-sit (tuck)": "L-sit (avanzado)",
};

// Helper
export function getNextVariation(label, isHold = false) {
  if (isHold) return VARIATIONS_HOLD[label] || null;
  return VARIATIONS_REP[label] || null;
}
