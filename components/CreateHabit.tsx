"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Plus, X, Check } from "@phosphor-icons/react";
import { useHabitStore } from "@/lib/store";
import { useToastStore } from "@/lib/toastStore";
import { HABIT_COLORS } from "@/lib/colors";
import { UI_DAYS, UI_TO_JS } from "@/lib/schedule";
import { todayKey } from "@/lib/date";
import type { HabitColor, RepeatType } from "@/lib/types";
import { Confetti } from "./Confetti";

type Phase = "form" | "submitting" | "success";

const REPEAT_OPTIONS: { id: RepeatType; label: string }[] = [
  { id: "daily", label: "Diario" },
  { id: "weekly", label: "Semanal" },
];

export function CreateHabit() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("form");
  const [name, setName] = useState("");
  const [color, setColor] = useState<HabitColor>("blue");
  const [repeat, setRepeat] = useState<RepeatType>("daily");
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);
  const [time, setTime] = useState("");
  const [startDate, setStartDate] = useState(todayKey());
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addHabit = useHabitStore((s) => s.addHabit);
  const pushToast = useToastStore((s) => s.push);

  useEffect(() => {
    if (open && phase === "form") {
      const t = setTimeout(() => inputRef.current?.focus(), 240);
      return () => clearTimeout(t);
    }
  }, [open, phase]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const reset = () => {
    setName("");
    setColor("blue");
    setRepeat("daily");
    setWeekdays([1, 2, 3, 4, 5, 6, 0]);
    setTime("");
    setStartDate(todayKey());
    setEndDate("");
    setPhase("form");
    setError(false);
  };

  const close = () => {
    setOpen(false);
    setTimeout(reset, 250);
  };

  const toggleDay = (jsDay: number) => {
    setWeekdays((prev) =>
      prev.includes(jsDay) ? prev.filter((d) => d !== jsDay) : [...prev, jsDay]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(true);
      inputRef.current?.focus();
      return;
    }
    setPhase("submitting");
    setTimeout(() => {
      addHabit({
        name: name.trim(),
        color,
        repeat,
        weekdays: repeat === "weekly" ? weekdays : [],
        time: time || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setPhase("success");
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.([10, 30, 10]);
      }
      setTimeout(() => {
        pushToast("Hábito creado", "success");
        close();
      }, 950);
    }, 320);
  };

  return (
    <>
      {/* FAB */}
      <motion.button
        layoutId="create-surface"
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 24 }}
        className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-[14vw] mr-3 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-glow md:right-8 md:bottom-8 md:mr-0"
        aria-label="Crear hábito"
      >
        <motion.span layoutId="create-icon" className="flex items-center justify-center">
          <Plus size={26} weight="bold" />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={phase === "form" ? close : undefined}
              className="fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-[2px]"
            />

            <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4">
              <motion.div
                layoutId="create-surface"
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                className="relative flex max-h-[90dvh] ml-5 mr-[14vw] sm:w-full max-w-[460px] flex-col overflow-hidden rounded-5xl border border-ink-100 bg-white shadow-[0_30px_70px_-20px_rgba(0,0,0,0.35)] sm:mx-auto"
              >
                <Confetti fire={phase === "success"} />

                <AnimatePresence mode="wait">
                  {phase === "success" ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col items-center gap-4 px-8 py-16 text-center"
                    >
                      <motion.div
                        initial={{ scale: 0, rotate: -12 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 320, damping: 18, delay: 0.05 }}
                        className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-white"
                      >
                        <Check size={32} weight="bold" />
                      </motion.div>
                      <div>
                        <h3 className="text-lg font-semibold tracking-tight text-ink-900">
                          ¡Listo!
                        </h3>
                        <p className="mt-1 text-sm text-ink-500">
                          {name.trim()} está en tu lista.
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      onSubmit={handleSubmit}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.25, delay: 0.08 }}
                      className="flex min-h-0 flex-col"
                    >
                      {/* Header (sticky) */}
                      <div className="flex items-center justify-between px-6 pt-6">
                        <motion.span
                          layoutId="create-icon"
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white"
                        >
                          <Plus size={20} weight="bold" />
                        </motion.span>
                        <button
                          type="button"
                          onClick={close}
                          className="flex h-9 w-9 items-center justify-center rounded-full text-ink-400 transition-colors duration-150 hover:bg-ink-50 hover:text-ink-700"
                          aria-label="Cerrar"
                        >
                          <X size={20} weight="bold" />
                        </button>
                      </div>

                      {/* Scrollable body */}
                      <div className="scroll-hide flex flex-col gap-6 overflow-y-auto px-6 py-6">
                        {/* Nombre */}
                        <div className="flex flex-col gap-2">
                          <label htmlFor="habit-name" className="text-sm font-medium text-ink-700">
                            Nombre del hábito
                          </label>
                          <input
                            id="habit-name"
                            ref={inputRef}
                            value={name}
                            onChange={(e) => {
                              setName(e.target.value);
                              if (error) setError(false);
                            }}
                            placeholder="Ej. Meditar 10 minutos"
                            maxLength={48}
                            className={`w-full rounded-2xl border bg-ink-50/60 px-4 py-3 text-[15px] text-ink-900 outline-none transition-all duration-150 placeholder:text-ink-300 focus:bg-white ${
                              error
                                ? "border-flame focus:ring-2 focus:ring-flame/30"
                                : "border-ink-100 focus:border-accent focus:ring-2 focus:ring-accent/20"
                            }`}
                          />
                          <AnimatePresence>
                            {error && (
                              <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="text-xs text-flame"
                              >
                                Escribe un nombre para tu hábito.
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Color */}
                        <div className="flex flex-col gap-2">
                          <span className="text-sm font-medium text-ink-700">Color</span>
                          <div className="flex items-center gap-3">
                            {HABIT_COLORS.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => setColor(c.id)}
                                aria-label={c.label}
                                aria-pressed={color === c.id}
                                className="relative flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-150 active:scale-90"
                              >
                                <span className="h-7 w-7 rounded-full" style={{ backgroundColor: c.hex }} />
                                {color === c.id && (
                                  <motion.span
                                    layoutId="color-ring"
                                    transition={{ type: "spring", stiffness: 480, damping: 30 }}
                                    className="absolute inset-0 rounded-full ring-2 ring-offset-2 ring-offset-white"
                                    style={{ ["--tw-ring-color" as string]: c.hex }}
                                  />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Repetir */}
                        <div className="flex flex-col gap-2">
                          <span className="text-sm font-medium text-ink-700">Repetir</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {REPEAT_OPTIONS.map((opt) => {
                              const active = repeat === opt.id;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => setRepeat(opt.id)}
                                  className="relative rounded-xl px-2 py-2.5 text-[13px] font-medium transition-colors duration-150"
                                >
                                  {active && (
                                    <motion.span
                                      layoutId="repeat-pill"
                                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                                      className="absolute inset-0 rounded-xl bg-accent"
                                    />
                                  )}
                                  <span
                                    className={`relative z-10 ${
                                      active ? "text-white" : "text-ink-500"
                                    }`}
                                  >
                                    {opt.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Días (solo semanal) */}
<AnimatePresence initial={false}>
  {repeat === "weekly" && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex flex-col gap-2"
    >
      <span className="text-sm font-medium text-ink-700">
        Días de la semana
      </span>
      <div className="flex items-center justify-between gap-1.5">
        {UI_DAYS.map((label, i) => {
          const jsDay = UI_TO_JS[i];
          const active = weekdays.includes(jsDay);
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggleDay(jsDay)}
              aria-pressed={active}
              className={`flex h-10 flex-1 items-center justify-center rounded-xl border text-sm font-semibold transition-all duration-150 active:scale-95 ${
                active
                  ? "border-accent bg-accent text-white shadow-[0_4px_12px_-4px_rgba(0,102,255,0.5)]"
                  : "border-ink-100 bg-white text-ink-400 hover:border-ink-200"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </motion.div>
  )}
</AnimatePresence>

                        {/* Hora */}
                        <div className="flex flex-col gap-2">
                          <label htmlFor="habit-time" className="text-sm font-medium text-ink-700">
                            Hora <span className="text-ink-300">(opcional)</span>
                          </label>
                          <input
                            id="habit-time"
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="w-full rounded-2xl border border-ink-100 bg-ink-50/60 px-4 py-3 text-[15px] text-ink-900 outline-none transition-all duration-150 focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20"
                          />
                        </div>

                        {/* Fechas */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-2">
                            <label htmlFor="habit-start" className="text-sm font-medium text-ink-700">
                              Inicio
                            </label>
                            <input
                              id="habit-start"
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              className="w-full rounded-2xl border border-ink-100 bg-ink-50/60 px-3 py-3 text-[14px] text-ink-900 outline-none transition-all duration-150 focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20"
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <label htmlFor="habit-end" className="text-sm font-medium text-ink-700">
                              Fin <span className="text-ink-300">(opc.)</span>
                            </label>
                            <input
                              id="habit-end"
                              type="date"
                              value={endDate}
                              min={startDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              className="w-full rounded-2xl border border-ink-100 bg-ink-50/60 px-3 py-3 text-[14px] text-ink-900 outline-none transition-all duration-150 focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Submit (sticky bottom) */}
                      <div className="border-t border-ink-100 px-6 py-4">
                        <button
                          type="submit"
                          disabled={phase === "submitting"}
                          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-accent text-[15px] font-semibold text-white transition-all duration-150 hover:bg-[#0a5cef] active:scale-[0.98] disabled:opacity-90"
                        >
                          {phase === "submitting" ? (
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                              className="block h-5 w-5 rounded-full border-2 border-white/30 border-t-white"
                            />
                          ) : (
                            "Crear hábito"
                          )}
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
