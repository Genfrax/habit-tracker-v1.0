"use client";

import { motion, useAnimationControls } from "framer-motion";
import { useState } from "react";
import { Trash, Clock } from "@phosphor-icons/react";
import { MarkCircle } from "./MarkCircle";
import { StreakFlame } from "./StreakFlame";
import { WeekPills } from "./WeekPills";
import { useHabitStore, selectWithStats } from "@/lib/store";
import { useToastStore } from "@/lib/toastStore";
import { formatTime, repeatSummary } from "@/lib/schedule";
import { colorHex } from "@/lib/colors";
import type { Habit } from "@/lib/types";

interface HabitCardProps {
  habit: Habit;
  index: number;
}

export function HabitCard({ habit, index }: HabitCardProps) {
  const toggle = useHabitStore((s) => s.toggleHabit);
  const removeHabit = useHabitStore((s) => s.removeHabit);
  const pushToast = useToastStore((s) => s.push);
  const shake = useAnimationControls();
  const [pulseKey, setPulseKey] = useState(0);
  const [removing, setRemoving] = useState(false);
  const stats = selectWithStats(habit);

  const timeLabel = formatTime(habit.time);
  const repeatLabel = repeatSummary(habit);

  const handleMark = () => {
    toggle(habit.id);
    setPulseKey((k) => k + 1);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.(8);
    }
  };

  const handleDelete = async () => {
    if (removing) return;
    setRemoving(true);
    await shake.start({
      x: [0, -4, 4, -3, 3, 0],
      transition: { duration: 0.2, ease: "easeInOut" },
    });
    removeHabit(habit.id);
    pushToast("Hábito eliminado", "danger");
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 90, height: 0, marginTop: -12, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 220, damping: 26, delay: index * 0.05 }}
    >
      <motion.div
        animate={shake}
        className={`group relative flex items-stretch gap-4 rounded-4xl border border-ink-100 bg-white p-5 shadow-diffusion transition-shadow duration-200 hover:shadow-[0_24px_48px_-18px_rgba(0,0,0,0.12)] ${
          !stats.dueToday ? "opacity-70" : ""
        }`}
      >
        <div className="flex items-center">
          <MarkCircle active={stats.completed} pulseKey={pulseKey} onClick={handleMark} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 pr-6">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: colorHex(habit.color) }}
                  aria-hidden
                />
                <motion.h3
                  animate={{ color: stats.completed ? "#5b5b66" : "#0f0f12" }}
                  transition={{ duration: 0.2 }}
                  className="truncate text-[15px] font-semibold tracking-tight"
                >
                  {habit.name}
                </motion.h3>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-400">
                {timeLabel && (
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} weight="bold" />
                    {timeLabel}
                  </span>
                )}
                {timeLabel && <span className="text-ink-200">·</span>}
                <span>{repeatLabel}</span>
                {stats.completed && !stats.dueToday ? (
                  <>
                    <span className="text-ink-200">·</span>
                    <span className="font-medium text-accent">Adelantado ✓</span>
                  </>
                ) : !stats.dueToday ? (
                  <>
                    <span className="text-ink-200">·</span>
                    <span className="font-medium text-amber-500">Hoy no toca</span>
                  </>
                ) : null}
              </div>
            </div>
            <StreakFlame count={stats.streak} active={stats.completed && stats.streak > 0} />
          </div>

          <WeekPills completion={stats.weekCompletion} scheduled={stats.scheduledWeek} />
        </div>

        {/* Delete — esquina inferior derecha, lejos del flame */}
        <button
          onClick={handleDelete}
          aria-label="Eliminar hábito"
          className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full text-ink-300 opacity-0 transition-all duration-150 hover:bg-flame/10 hover:text-flame focus-visible:opacity-100 group-hover:opacity-100 max-md:opacity-50"
        >
          <Trash size={16} weight="bold" />
        </button>
      </motion.div>
    </motion.article>
  );
}
