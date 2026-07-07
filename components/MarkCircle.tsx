"use client";

import { motion, AnimatePresence } from "framer-motion";
import { memo } from "react";

interface MarkCircleProps {
  active: boolean;
  pulseKey: number;
  onClick: () => void;
  size?: number;
}

export const MarkCircle = memo(function MarkCircle({
  active,
  pulseKey,
  onClick,
  size = 56,
}: MarkCircleProps) {
  return (
    <motion.button
      aria-pressed={active}
      aria-label={active ? "Desmarcar hábito" : "Marcar hábito"}
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 380, damping: 22 }}
      style={{ width: size, height: size }}
      className="relative flex items-center justify-center rounded-full"
    >
      {/* Halo ripple */}
      <AnimatePresence>
        {active && (
          <motion.span
            key={`halo-${pulseKey}`}
            initial={{ scale: 0.6, opacity: 0.55 }}
            animate={{ scale: 2.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-0 rounded-full bg-accent"
            aria-hidden
          />
        )}
      </AnimatePresence>

      {/* Outer ring (idle). Colores por clase (no framer) para que sigan
          al tema claro/oscuro; la transición CSS replica la animación. */}
      <span
        aria-hidden
        className={`absolute inset-0 rounded-full border-[1.5px] transition-all duration-200 ease-out-soft ${
          active
            ? "border-accent bg-accent shadow-glow"
            : "border-ink-200 bg-surface shadow-soft"
        }`}
      />

      {/* Checkmark */}
      <AnimatePresence mode="wait">
        {active && (
          <motion.svg
            key="check"
            width={size * 0.46}
            height={size * 0.46}
            viewBox="0 0 24 24"
            initial={{ scale: 0, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 520,
              damping: 18,
              mass: 0.6,
            }}
            className="relative z-10"
            aria-hidden
          >
            <motion.path
              d="M5 12.5l4.5 4.5L19 7"
              fill="none"
              stroke="#ffffff"
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            />
          </motion.svg>
        )}
      </AnimatePresence>
    </motion.button>
  );
});
