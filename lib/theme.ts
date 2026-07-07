"use client";

export type ThemeMode = "light" | "dark" | "system";

const KEY = "habitos-theme";

export const getThemeMode = (): ThemeMode => {
  if (typeof window === "undefined") return "system";
  try {
    const v = localStorage.getItem(KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {}
  return "system";
};

const systemPrefersDark = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

export const applyTheme = (mode: ThemeMode = getThemeMode()): void => {
  if (typeof document === "undefined") return;
  const dark = mode === "dark" || (mode === "system" && systemPrefersDark());
  document.documentElement.classList.toggle("dark", dark);
};

export const setThemeMode = (mode: ThemeMode): void => {
  try {
    localStorage.setItem(KEY, mode);
  } catch {}
  applyTheme(mode);
};

/** Sigue los cambios del sistema en vivo mientras el modo sea "system". */
export const watchSystemTheme = (): (() => void) => {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    if (getThemeMode() === "system") applyTheme("system");
  };
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};
