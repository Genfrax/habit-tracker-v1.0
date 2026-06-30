"use client";

import { motion, AnimatePresence } from "framer-motion";
import { memo } from "react";
import clsx from "clsx";

interface WeekPillsProps {
  /** Completados de esta semana (índice 0 = domingo, formato de weekCompletion) */
  completion: boolean[];
  /** Días programados de esta semana (lunes primero) */
  scheduled: boolean[];
}

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

export const WeekPills = memo(function WeekPills({ completion, scheduled }: WeekPillsProps) {
  const todayIdx = (new Date().getDay() + 6) % 7;

  return (
    <div className="flex items-center gap-1.5">
      {DAY_LABELS.map((label, i) => {
        const isToday = i === todayIdx;
        const isDone = completion[(i + 1) % 7];
        const isScheduled = scheduled[i];

        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <span
              className={clsx(
                "text-[10px] font-medium tracking-wide",
                isToday ? "text-accent" : isScheduled ? "text-ink-500" : "text-ink-300"
              )}
            >
              {label}
            </span>
            <motion.div
              animate={{
                backgroundColor: isDone ? "#0066FF" : "#ffffff",
                borderColor: isDone
                  ? "#0066FF"
                  : isScheduled
                  ? "#0066FF"
                  : "#ececef",
                borderWidth: !isDone && isScheduled ? 2 : 1,
              }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className={clsx(
                "relative flex h-7 w-7 items-center justify-center rounded-full border",
                isToday && isScheduled && !isDone && "ring-2 ring-accent/25"
              )}
            >
              <AnimatePresence>
                {isDone && (
                  <motion.svg
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 480, damping: 20 }}
                    width={14}
                    height={14}
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M5 12.5l4.5 4.5L19 7"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth={2.6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.svg>
                )}
              </AnimatePresence>

              {/* Punto indicador en días programados sin completar */}
              {!isDone && isScheduled && (
                <span className="h-1.5 w-1.5 rounded-full bg-accent/50" aria-hidden />
              )}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
});
