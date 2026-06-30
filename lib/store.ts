"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Habit, HabitWithStats, NewHabitInput } from "./types";
import { todayKey, weekCompletion } from "./date";
import { isDueOn, nextDueKey, scheduledThisWeek, scheduledStreak } from "./schedule";

interface HabitState {
  habits: Habit[];
  hasHydrated: boolean;
  setHydrated: () => void;
  addHabit: (input: NewHabitInput) => Habit;
  removeHabit: (id: string) => void;
  /** Marca/desmarca la próxima fecha programada (permite completar por adelantado) */
  toggleHabit: (id: string) => boolean;
  /** Reemplaza toda la lista (lo usa la sincronización al recibir cambios remotos) */
  replaceHabits: (habits: Habit[]) => void;
}

const today = todayKey();

const seed: Habit[] = [
  {
    id: "h_meditar",
    name: "Meditar 10 min",
    color: "blue",
    createdAt: new Date().toISOString(),
    completions: [],
    time: "07:00",
    startDate: today,
    repeat: "daily",
    weekdays: [],
  },
  {
    id: "h_leer",
    name: "Leer 20 páginas",
    color: "emerald",
    createdAt: new Date().toISOString(),
    completions: [],
    time: "21:00",
    startDate: today,
    repeat: "daily",
    weekdays: [],
  },
  {
    id: "h_correr",
    name: "Correr 3 km",
    color: "rose",
    createdAt: new Date().toISOString(),
    completions: [],
    startDate: today,
    repeat: "weekly",
    weekdays: [1, 3, 5],
  },
];

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits: seed,
      hasHydrated: false,
      setHydrated: () => set({ hasHydrated: true }),
      addHabit: (input) => {
        const h: Habit = {
          id: `h_${Math.random().toString(36).slice(2, 9)}`,
          name: input.name.trim(),
          color: input.color,
          createdAt: new Date().toISOString(),
          completions: [],
          time: input.time || undefined,
          startDate: input.startDate || todayKey(),
          endDate: input.endDate || undefined,
          repeat: input.repeat,
          weekdays: input.weekdays ?? [],
        };
        set({ habits: [h, ...get().habits] });
        return h;
      },
      removeHabit: (id) => set({ habits: get().habits.filter((h) => h.id !== id) }),
      replaceHabits: (habits) => set({ habits }),
      toggleHabit: (id) => {
        let nowCompleted = false;
        set({
          habits: get().habits.map((h) => {
            if (h.id !== id) return h;
            // Marca la próxima fecha programada: si hoy toca, hoy;
            // si no, el siguiente día programado (completar por adelantado).
            const target = nextDueKey(h);
            const hasIt = h.completions.includes(target);
            nowCompleted = !hasIt;
            return {
              ...h,
              completions: hasIt
                ? h.completions.filter((d) => d !== target)
                : [...h.completions, target],
            };
          }),
        });
        return nowCompleted;
      },
    }),
    {
      name: "habitos-store-v1",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted: any, version) => {
        if (!persisted) return persisted;
        if (version < 2 && Array.isArray(persisted.habits)) {
          persisted.habits = persisted.habits.map((h: any) => ({
            repeat: "daily",
            weekdays: [],
            startDate: h.createdAt ? String(h.createdAt).slice(0, 10) : undefined,
            ...h,
          }));
        }
        return persisted;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);

export const selectWithStats = (h: Habit): HabitWithStats => {
  const targetKey = nextDueKey(h);
  return {
    ...h,
    streak: scheduledStreak(h),
    // "completado" = la próxima fecha programada está marcada (incluye adelantos)
    completed: h.completions.includes(targetKey),
    completedToday: h.completions.includes(todayKey()),
    dueToday: isDueOn(h),
    targetKey,
    weekCompletion: weekCompletion(h.completions),
    scheduledWeek: scheduledThisWeek(h),
  };
};
