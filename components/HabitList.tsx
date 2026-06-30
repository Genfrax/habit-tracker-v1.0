"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { HabitCard } from "./HabitCard";
import { useHabitStore } from "@/lib/store";

export function HabitList() {
  const habits = useHabitStore((s) => s.habits);
  const hasHydrated = useHabitStore((s) => s.hasHydrated);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || !hasHydrated) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-[112px] animate-pulse rounded-4xl border border-ink-100 bg-white/60"
          />
        ))}
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-3 rounded-4xl border border-dashed border-ink-200 bg-white/60 px-6 py-14 text-center"
      >
        <div className="font-mono text-xs uppercase tracking-[0.18em] text-ink-400">
          Sin hábitos todavía
        </div>
        <p className="max-w-[28ch] text-sm text-ink-500">
          Empieza con uno. Pequeño, específico, todos los días.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence initial={false}>
        {habits.map((h, i) => (
          <HabitCard key={h.id} habit={h} index={i} />
        ))}
      </AnimatePresence>
    </div>
  );
}
