"use client";

import { create } from "zustand";

export type ToastTone = "default" | "success" | "danger";

export interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
}

interface ToastState {
  toasts: Toast[];
  push: (message: string, tone?: ToastTone) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (message, tone = "default") => {
    const id = `t_${Math.random().toString(36).slice(2, 9)}`;
    set({ toasts: [...get().toasts, { id, message, tone }] });
    // auto-dismiss after 3.4s
    setTimeout(() => {
      set({ toasts: get().toasts.filter((t) => t.id !== id) });
    }, 3400);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));
