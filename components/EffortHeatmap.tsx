"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { buildHeatmap } from "@/lib/effort";
import { todayKey } from "@/lib/date";
import type { Habit } from "@/lib/types";

interface EffortHeatmapProps {
  habits: Habit[];
  weeks?: number;
}

const cellColor = (ratio: number, future: boolean): string => {
  if (future) return "rgba(0,0,0,0.025)";
  if (ratio === 0) return "#ececef";
  if (ratio <= 0.25) return "rgba(0,102,255,0.30)";
  if (ratio <= 0.5) return "rgba(0,102,255,0.50)";
  if (ratio <= 0.75) return "rgba(0,102,255,0.72)";
  return "#0066FF";
};

export function EffortHeatmap({ habits, weeks = 14 }: EffortHeatmapProps) {
  const columns = useMemo(() => buildHeatmap(habits, weeks), [habits, weeks]);
  const today = todayKey();

  return (
    <div className="flex flex-col gap-3">
      <div
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }}
      >
        {columns.map((col, ci) =>
          col.map((day, ri) => {
            const future = day.key > today;
            return (
              <motion.div
                key={day.key}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.3,
                  delay: (ci * 7 + ri) * 0.004,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                title={`${day.key} · ${day.done}/${day.total}`}
                className="aspect-square w-full rounded-[3px]"
                style={{ backgroundColor: cellColor(day.ratio, future) }}
              />
            );
          })
        )}
      </div>

      <div className="flex items-center justify-end gap-1.5 text-[10px] text-ink-400">
        <span>Menos</span>
        {[0, 0.3, 0.5, 0.72, 1].map((r) => (
          <span
            key={r}
            className="h-2.5 w-2.5 rounded-[2px]"
            style={{ backgroundColor: cellColor(r === 0 ? 0 : r, false) }}
          />
        ))}
        <span>Más</span>
      </div>
    </div>
  );
}
