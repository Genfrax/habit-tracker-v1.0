"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Flame, Lightning } from "@phosphor-icons/react";
import { useHabitStore, selectWithStats } from "@/lib/store";
import { dailyPhrase } from "@/lib/phrases";
import { totalCompletions } from "@/lib/effort";
import { EffortHeatmap } from "./EffortHeatmap";
import { SyncSheet } from "./SyncSheet";

export function Header() {
  const habits = useHabitStore((s) => s.habits);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const stats = habits.map(selectWithStats);
  const dueToday = stats.filter((h) => h.dueToday);
  const todayDone = dueToday.filter((h) => h.completedToday).length;
  const total = dueToday.length;
  const longestStreak = stats.reduce((max, h) => Math.max(max, h.streak), 0);
  const effort = totalCompletions(habits);
  const pct = total === 0 ? 0 : Math.round((todayDone / total) * 100);

  const dateLabel = mounted
    ? new Intl.DateTimeFormat("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(new Date())
    : "";
  const phrase = mounted ? dailyPhrase() : "";

  return (
    <header className="flex flex-col gap-5 pt-2">
      <div>
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.18em] text-ink-400">
            Hoy{dateLabel && ` · ${dateLabel}`}
          </p>
          <SyncSheet />
        </div>
        <motion.h1
          key={phrase}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mt-2 max-w-[18ch] text-[2rem] font-semibold leading-[1.05] tracking-tight text-ink-900 md:text-[2.6rem]"
        >
          {phrase || " "}
        </motion.h1>
      </div>

      {/* Progreso de hoy */}
      <div className="rounded-4xl border border-ink-100 bg-white p-5 shadow-diffusion">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-[0.18em] text-ink-400">
              Progreso de hoy
            </span>
            <div className="flex items-baseline gap-2">
              <motion.span
                key={todayDone}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
                className="font-mono text-3xl font-semibold tabular-nums text-ink-900"
              >
                {todayDone}
              </motion.span>
              <span className="font-mono text-lg text-ink-400">/ {total}</span>
            </div>
          </div>
          <span className="font-mono text-2xl font-semibold tabular-nums text-accent">
            {pct}%
          </span>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink-100">
          <motion.div
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 22 }}
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent-soft"
            style={{ boxShadow: "0 0 12px rgba(0,102,255,0.5)" }}
          />
        </div>
      </div>

      {/* Esfuerzo (heatmap) */}
      <div className="rounded-4xl border border-ink-100 bg-white p-5 shadow-diffusion">
        <div className="mb-4 flex items-center justify-between gap-4">
          <span className="text-xs uppercase tracking-[0.18em] text-ink-400">
            Tu esfuerzo
          </span>
          <div className="flex items-center gap-4">
            <Stat
              icon={<Flame size={15} weight="fill" className="text-flame" />}
              value={longestStreak}
              label="racha máx"
            />
            <Stat
              icon={<Lightning size={15} weight="fill" className="text-accent" />}
              value={effort}
              label="marcas"
            />
          </div>
        </div>
        {mounted ? (
          <EffortHeatmap habits={habits} />
        ) : (
          <div className="h-[120px] animate-pulse rounded-xl bg-ink-50" />
        )}
      </div>
    </header>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="font-mono text-sm font-semibold tabular-nums text-ink-800">{value}</span>
      <span className="text-[11px] text-ink-400">{label}</span>
    </div>
  );
}
