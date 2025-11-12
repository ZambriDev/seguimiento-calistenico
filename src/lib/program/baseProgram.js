// Programa base y variaciones por REPETICIONES
export const VARIATIONS = {
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
  {
    name: "Piernas & Core (base)",
    type: "Inferior · abdomen",
    exercises: [
      { label: "Sentadillas", reps: "4x12-20" },
      { label: "Zancadas alternas", reps: "3x10-12 / pierna" },
      { label: "Hip thrust / Puente glúteos", reps: "3x12-15" },
      { label: "Elev. pantorrilla", reps: "3x15-25" },
      { label: "Plancha", reps: "3x25-35 s" },
      { label: "Elev. piernas", reps: "3x8-12" },
    ],
    skill: "Pistol asistida / Búlgara 3x6-8 / pierna",
  },
  {
    name: "Empuje (plus)",
    type: "Pecho · hombros · tríceps (progresión)",
    exercises: [
      { label: "Lagartijas declinadas", reps: "3x8-12" },
      { label: "Pike ROM profunda", reps: "3x6-8" },
      { label: "Fondos en sillas", reps: "3x6-10" },
      { label: "Extensión tríceps DB", reps: "2x10-12" },
      { label: "Flexiones pliométricas", reps: "2x6" },
    ],
    skill: "Handstand libre asistido / kick-ups",
  },
  {
    name: "Tirón (plus)",
    type: "Espalda · bíceps (progresión)",
    exercises: [
      { label: "Dominadas supinas", reps: "3x4-6" },
      { label: "Remo invertido pies elevados", reps: "3x8-10" },
      { label: "Australianas supinas", reps: "2x12-15" },
      { label: "Curl martillo DB", reps: "3x8-10" },
      { label: "Face pulls / Y-T-W", reps: "2x15" },
    ],
    skill: "Negativas / transición de muscle-up",
  },
  {
    name: "Piernas & HIIT",
    type: "Explosividad · core",
    exercises: [
      { label: "Squat jumps", reps: "3x8-12" },
      { label: "Pistol / Búlgara", reps: "3x6-8 / pierna" },
      { label: "Buenos días / RDL", reps: "3x10-12" },
      { label: "Tabata ABS", reps: "4 min" },
    ],
    skill: "Sprints suaves / cambios de dirección",
  },
  {
    name: "Descanso activo",
    type: "Recuperación",
    exercises: [
      { label: "Movilidad", reps: "10-15 min" },
      { label: "Caminata/trote", reps: "20-40 min" },
      { label: "HS suave + L-sit", reps: "libre" },
      { label: "Revisión semanal", reps: "libre" },
    ],
    skill: "Planificación próxima semana",
  },
];
