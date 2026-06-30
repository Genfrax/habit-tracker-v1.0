"use client";

import { motion } from "framer-motion";
import { memo, useMemo } from "react";

interface ConfettiProps {
  fire: boolean;
}

const COLORS = ["#0066FF", "#3D85FF", "#FF7A1A", "#FFC069", "#10B981"];

// 9 confetti pieces, natural fall ~600ms
export const Confetti = memo(function Confetti({ fire }: ConfettiProps) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 220,
        rotate: (Math.random() - 0.5) * 540,
        delay: Math.random() * 0.08,
        color: COLORS[i % COLORS.length],
        size: 7 + Math.random() * 6,
        round: Math.random() > 0.5,
      })),
    // regenerate per fire cycle
    [fire]
  );

  if (!fire) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-visible">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
          animate={{
            x: p.x,
            y: 180 + Math.random() * 60,
            opacity: 0,
            rotate: p.rotate,
            scale: 0.6,
          }}
          transition={{
            duration: 0.6,
            delay: p.delay,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{
            width: p.size,
            height: p.round ? p.size : p.size * 0.5,
            backgroundColor: p.color,
            borderRadius: p.round ? "9999px" : "2px",
            position: "absolute",
          }}
        />
      ))}
    </div>
  );
});
