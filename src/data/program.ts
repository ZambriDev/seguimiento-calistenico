export const VARIATIONS = {
  Lagartijas: "Lagartijas declinadas",
  "Lagartijas inclinadas": "Lagartijas declinadas lastradas",
  "Pike push-ups": "Pike ROM profunda",
  "Fondos en sillas": "Fondos en sillas (lastre/ROM)",
  "Fondos en sillas (asistidos)": "Fondos en sillas",
  "Dominadas pronas": "Dominadas pronas (lastradas/negativas de MU)",
  "Dominadas supinas": "Dominadas supinas (lastradas)",
  "Remo invertido": "Remo invertido pies elevados",
  "Remo invertido pies elevados": "Remo invertido lastrado",
  "Australianas supinas": "Australianas supinas pies elevados",
  Sentadillas: "Sentadillas con salto / Pistol asistida",
  "Squat jumps": "Pistol completa / variaciones explosivas",
};

export const WEEK = [
  {
    name: "Empuje (base)",
    type: "Pecho · hombros · tríceps",
    exercises: [
      { label: "Lagartijas", reps: "3x8-12" },
      { label: "Lagartijas inclinadas", reps: "3x10-15" },
      { label: "Pike push-ups", reps: "3x6-8" },
      { label: "Fondos en sillas (asistidos)", reps: "2x5-8" },
      { label: "Flexiones pliométricas", reps: "2x4-6" },
    ],
    skill: "Handstand asistido (3x15 s)",
  },
  {
    name: "Tirón (base)",
    type: "Espalda · bíceps",
    exercises: [
      { label: "Dominadas pronas", reps: "3x4-6" },
      { label: "Remo invertido", reps: "3x8-10" },
      { label: "Australianas supinas", reps: "2x10-12" },
      { label: "Curl bíceps DB", reps: "3x10-12" },
      { label: "Face pulls / Y-T-W", reps: "2x12-15" },
    ],
    skill: "Hollow hold 3x25 s",
  },
  // [...continúa con el resto de días como los tienes ahora...]
];
