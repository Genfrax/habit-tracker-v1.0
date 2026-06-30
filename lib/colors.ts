import type { HabitColor } from "./types";

export const HABIT_COLORS: { id: HabitColor; hex: string; label: string }[] = [
  { id: "blue", hex: "#0066FF", label: "Azul" },
  { id: "emerald", hex: "#10B981", label: "Esmeralda" },
  { id: "rose", hex: "#F43F5E", label: "Rosa" },
  { id: "amber", hex: "#F59E0B", label: "Ámbar" },
  { id: "slate", hex: "#475569", label: "Pizarra" },
];

export const colorHex = (c: HabitColor): string =>
  HABIT_COLORS.find((x) => x.id === c)?.hex ?? "#0066FF";
