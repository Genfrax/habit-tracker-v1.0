import type { Habit, RepeatType } from "./types";
import { todayKey } from "./date";

// UI muestra L M X J V S D (lunes primero) → días JS (0=Dom..6=Sáb)
export const UI_DAYS = ["L", "M", "X", "J", "V", "S", "D"];
export const UI_TO_JS = [1, 2, 3, 4, 5, 6, 0];

const parseLocal = (key: string): Date => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** ¿El hábito está programado para esta fecha? */
export const isDueOn = (habit: Habit, date: Date = new Date()): boolean => {
  const key = todayKey(date);
  if (habit.startDate && key < habit.startDate) return false;
  if (habit.endDate && key > habit.endDate) return false;

  const repeat = habit.repeat ?? "daily";
  switch (repeat) {
    case "daily":
      return true;
    case "weekly": {
      const days = habit.weekdays ?? [];
      if (days.length === 0) return true;
      return days.includes(date.getDay());
    }
    case "monthly": {
      const anchor = parseLocal(habit.startDate ?? todayKey(parseLocal(habit.createdAt.slice(0, 10))));
      return date.getDate() === anchor.getDate();
    }
    case "yearly": {
      const anchor = parseLocal(habit.startDate ?? habit.createdAt.slice(0, 10));
      return date.getDate() === anchor.getDate() && date.getMonth() === anchor.getMonth();
    }
    default:
      return true;
  }
};

const WEEKDAY_FULL = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/** Texto resumen de la repetición para mostrar en la card */
export const repeatSummary = (habit: Habit): string => {
  const repeat: RepeatType = habit.repeat ?? "daily";
  if (repeat === "daily") return "Todos los días";
  if (repeat === "monthly") return "Cada mes";
  if (repeat === "yearly") return "Cada año";
  // weekly
  const days = habit.weekdays ?? [];
  if (days.length === 0 || days.length === 7) return "Todos los días";
  // Orden lunes-primero
  const ordered = UI_TO_JS.filter((d) => days.includes(d));
  if (ordered.length === 5 && !days.includes(0) && !days.includes(6)) {
    return "Entre semana";
  }
  if (ordered.length === 2 && days.includes(0) && days.includes(6)) {
    return "Fines de semana";
  }
  return ordered.map((d) => WEEKDAY_FULL[d]).join(" · ");
};

/** "9:00 AM" desde "09:00" */
export const formatTime = (time?: string): string | null => {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
};

/**
 * Próxima fecha en que el hábito está programado, desde `from` (incluido).
 * Si hoy toca → hoy. Si no, el siguiente día programado.
 * Permite "completar por adelantado": marcar hoy llena esta fecha.
 */
export const nextDueKey = (habit: Habit, from: Date = new Date()): string => {
  const d = new Date(from);
  for (let i = 0; i < 366; i++) {
    if (isDueOn(habit, d)) return todayKey(d);
    d.setDate(d.getDate() + 1);
  }
  return todayKey(from);
};

/** Días de la semana actual (lunes primero) en que el hábito está programado */
export const scheduledThisWeek = (habit: Habit): boolean[] => {
  const today = new Date();
  const todayMon = (today.getDay() + 6) % 7;
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + (i - todayMon));
    return isDueOn(habit, d);
  });
};

/**
 * Racha consciente del calendario: cuenta días PROGRAMADOS consecutivos
 * completados, retrocediendo desde hoy. Si hoy toca pero aún no se marca,
 * no rompe la racha (periodo de gracia).
 */
export const scheduledStreak = (habit: Habit): number => {
  const set = new Set(habit.completions);
  const d = new Date();
  let streak = 0;
  for (let i = 0; i < 366; i++) {
    if (isDueOn(habit, d)) {
      const key = todayKey(d);
      if (set.has(key)) {
        streak++;
      } else if (i === 0) {
        // hoy toca pero aún no se marca → gracia, no rompe
      } else {
        break;
      }
    }
    d.setDate(d.getDate() - 1);
  }
  return streak;
};
