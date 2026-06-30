"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, useMemo } from "react";
import { Trophy } from "@phosphor-icons/react";
import { useHabitStore, selectWithStats } from "@/lib/store";

const COLORS = ["#0066FF", "#3D85FF", "#FF7A1A", "#FFC069", "#10B981", "#F43F5E"];

interface Piece {
  id: number;
  angle: number;
  distance: number;
  rotate: number;
  color: string;
  size: number;
  round: boolean;
  delay: number;
}

export function Celebration() {
  const habits = useHabitStore((s) => s.habits);
  const hasHydrated = useHabitStore((s) => s.hasHydrated);
  const [show, setShow] = useState(false);
  const prevPct = useRef<number | null>(null);
  const ready = useRef(false);

  const stats = habits.map(selectWithStats);
  const dueToday = stats.filter((h) => h.dueToday);
  const total = dueToday.length;
  const done = dueToday.filter((h) => h.completedToday).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  // Detección: dispara en cada flanco de subida hacia el 100%
  // (al completar el último hábito del día). Sin candado de localStorage.
  useEffect(() => {
    if (!hasHydrated) return; // esperar datos reales

    const reachedAll = total > 0 && pct === 100;
    const risingEdge = prevPct.current !== null && prevPct.current < 100;

    // ready=false en la primera pasada tras hidratar → fija línea base sin disparar
    // (evita celebrar al recargar estando ya al 100%)
    if (ready.current && reachedAll && risingEdge) {
      setShow(true);
      if ("vibrate" in navigator) navigator.vibrate?.([14, 40, 14, 40, 30]);
    }

    prevPct.current = pct;
    ready.current = true;
  }, [pct, total, hasHydrated]);

  // Auto-cierre: temporizador independiente (robusto ante Strict Mode)
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setShow(false), 2800);
    return () => clearTimeout(t);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setShow(false)}
          className="fixed inset-0 z-[60] flex items-center justify-center"
        >
          <ConfettiBurst />
          <motion.div
            initial={{ scale: 0.6, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 20 }}
            className="relative flex flex-col items-center gap-3 rounded-5xl border border-white/60 bg-white/90 px-10 py-8 text-center shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)] backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0, rotate: -16 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.08 }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent to-[#003DCC] text-white shadow-glow"
            >
              <Trophy size={32} weight="fill" />
            </motion.div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-ink-900">
                ¡Día completado!
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                Marcaste todos tus hábitos de hoy.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ConfettiBurst() {
  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: 44 }, (_, i) => ({
        id: i,
        angle: Math.random() * Math.PI * 2,
        distance: 120 + Math.random() * 320,
        rotate: (Math.random() - 0.5) * 720,
        color: COLORS[i % COLORS.length],
        size: 8 + Math.random() * 8,
        round: Math.random() > 0.5,
        delay: Math.random() * 0.12,
      })),
    []
  );

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      {pieces.map((p) => {
        const tx = Math.cos(p.angle) * p.distance;
        const ty = Math.sin(p.angle) * p.distance + 260; // gravedad
        return (
          <motion.span
            key={p.id}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
            animate={{ x: tx, y: ty, opacity: 0, scale: 0.6, rotate: p.rotate }}
            transition={{ duration: 1.6, delay: p.delay, ease: [0.22, 0.8, 0.32, 1] }}
            style={{
              position: "absolute",
              width: p.size,
              height: p.round ? p.size : p.size * 0.45,
              backgroundColor: p.color,
              borderRadius: p.round ? "9999px" : "2px",
            }}
          />
        );
      })}
    </div>
  );
}
