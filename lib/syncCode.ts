"use client";

const KEY = "habitos-sync-code";
// Sin caracteres ambiguos (0/O, 1/I/L)
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Genera un código tipo "K7P2-9QXM" */
export const generateCode = (): string => {
  let raw = "";
  const arr = new Uint32Array(8);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
    for (let i = 0; i < 8; i++) raw += ALPHABET[arr[i] % ALPHABET.length];
  } else {
    for (let i = 0; i < 8; i++) raw += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
};

export const normalizeCode = (input: string): string =>
  input.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);

export const formatCode = (raw: string): string => {
  const n = normalizeCode(raw);
  return n.length > 4 ? `${n.slice(0, 4)}-${n.slice(4)}` : n;
};

export const getStoredCode = (): string | null => {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(KEY);
};

export const setStoredCode = (code: string): void => {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(KEY, normalizeCode(code));
};

/** Devuelve el código actual; si no hay, genera y guarda uno nuevo. */
export const ensureCode = (): string => {
  const existing = getStoredCode();
  if (existing) return existing;
  const fresh = normalizeCode(generateCode());
  setStoredCode(fresh);
  return fresh;
};
