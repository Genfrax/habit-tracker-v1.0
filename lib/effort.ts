import type { Habit } from "./types";
import { todayKey } from "./date";

export interface EffortDay {
  key: string;
  date: Date;
  ratio: number; // 0..1 fracción de hábitos completados ese día
  done: number;
  total: number;
}

/**
 * Devuelve los últimos `weeks` semanas (columnas), alineadas a lunes,
 * como una matriz [semana][díaDeSemana 0..6 = Lun..Dom].
 */
export const buildHeatmap = (habits: Habit[], weeks = 14): EffortDay[][] => {
  const total = habits.length;
  const today = new Date();
  // Índice lunes-primero del día actual
  const todayMon = (today.getDay() + 6) % 7;

  // Último día = hoy; retrocedemos hasta llenar `weeks` columnas completas
  const totalDays = weeks * 7;
  const startOffset = -(totalDays - 1 - (6 - todayMon));

  const completionByDay = new Map<string, number>();
  for (const h of habits) {
    for (const c of h.completions) {
      completionByDay.set(c, (completionByDay.get(c) ?? 0) + 1);
    }
  }

  const columns: EffortDay[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: EffortDay[] = [];
    for (let d = 0; d < 7; d++) {
      const offset = startOffset + w * 7 + d;
      const date = new Date(today);
      date.setDate(today.getDate() + offset);
      const key = todayKey(date);
      const done = completionByDay.get(key) ?? 0;
      const ratio = total === 0 ? 0 : Math.min(1, done / total);
      col.push({ key, date, ratio, done, total });
    }
    columns.push(col);
  }
  return columns;
};

/** Total de marcas históricas (esfuerzo acumulado) */
export const totalCompletions = (habits: Habit[]): number =>
  habits.reduce((sum, h) => sum + h.completions.length, 0);
