export interface Exercise {
  label: string;
  repsRaw: string;
  parsed: {
    raw: string;
    sets: number;
    min: number;
    max: number;
    step: number;
    suffix: string;
  } | null;
}

export interface DayState {
  notes: string;
  completionCount: number;
  lastCompletedISO: string | null;
  energy: "low" | "normal" | "high";
  energyISO: string | null;
  exercises: Exercise[];
}

export interface MonthlyMetrics {
  weight: string;
  waist: string;
  chest: string;
  shoulders: string;
  comment: string;
}

export interface State {
  days: DayState[];
  metricsByMonth: {
    [month: string]: MonthlyMetrics;
  };
}

export interface ParsedReps {
  raw: string;
  sets: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
}