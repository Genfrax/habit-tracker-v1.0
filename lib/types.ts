export type HabitColor = "blue" | "emerald" | "rose" | "amber" | "slate";

export type RepeatType = "daily" | "weekly" | "monthly" | "yearly";

export interface Habit {
  id: string;
  name: string;
  color: HabitColor;
  createdAt: string;
  completions: string[];
  /** Hora opcional "HH:MM" */
  time?: string;
  /** Fecha de inicio "YYYY-MM-DD" */
  startDate?: string;
  /** Fecha de fin opcional "YYYY-MM-DD" */
  endDate?: string;
  /** Tipo de repetición */
  repeat: RepeatType;
  /** Días de la semana (0=Dom .. 6=Sáb). Solo aplica si repeat === "weekly" */
  weekdays: number[];
}

export interface NewHabitInput {
  name: string;
  color: HabitColor;
  time?: string;
  startDate?: string;
  endDate?: string;
  repeat: RepeatType;
  weekdays: number[];
}

export interface HabitWithStats extends Habit {
  streak: number;
  /** La próxima fecha programada está marcada (incluye completar por adelantado) */
  completed: boolean;
  completedToday: boolean;
  dueToday: boolean;
  /** Fecha objetivo que se marca al tocar el círculo (YYYY-MM-DD) */
  targetKey: string;
  weekCompletion: boolean[];
  /** Días de esta semana (lunes primero) en que toca el hábito */
  scheduledWeek: boolean[];
}
