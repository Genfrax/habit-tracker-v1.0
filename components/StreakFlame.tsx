"use client";

import { motion, AnimatePresence } from "framer-motion";
import { memo } from "react";

interface StreakFlameProps {
  count: number;
  active: boolean;
}

export const StreakFlame = memo(function StreakFlame({ count, active }: StreakFlameProps) {
  return (
    <div className="flex items-center gap-1.5">
      <motion.div
        animate={{
          scale: active ? 1.18 : 1,
          filter: active
            ? "drop-shadow(0 0 10px rgba(255,122,26,0.55))"
            : "drop-shadow(0 0 0 rgba(255,122,26,0))",
        }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="relative"
        aria-hidden
      >
        <FlameIcon active={active} />
        {active && (
          <motion.div
            initial={{ opacity: 0.7, scale: 1 }}
            animate={{ opacity: 0, scale: 1.8 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0 rounded-full bg-flame/30 blur-md"
          />
        )}
      </motion.div>

      <div className="relative h-6 min-w-[1.5ch] overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={count}
            initial={{ y: -22, rotateX: -90, opacity: 0 }}
            animate={{ y: 0, rotateX: 0, opacity: 1 }}
            exit={{ y: 22, rotateX: 90, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className="block font-mono text-[15px] font-semibold tabular-nums text-ink-800"
          >
            {count}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
});

function FlameIcon({ active }: { active: boolean }) {
  return (
    <svg width={22} height={26} viewBox="0 0 24 28" fill="none">
      <defs>
        <linearGradient id="flameGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#FF7A1A" />
          <stop offset="1" stopColor="#FFC069" />
        </linearGradient>
      </defs>
      <path
        d="M12 1.5c1.4 4 6 6 6 12.5 0 5-3.4 9-8.2 9C5.4 23 2 19.4 2 14.8c0-3.4 2-5.2 3.2-7.6 1.4 2 3 2.7 4.4 2.4-1-2.4.4-5.4 2.4-8.1z"
        fill={active ? "url(#flameGrad)" : "#d9d9de"}
      />
    </svg>
  );
}
