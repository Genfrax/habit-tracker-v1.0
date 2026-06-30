"use client";

import { AnimatePresence, motion } from "framer-motion";
import { memo } from "react";
import { Check, Trash, Info } from "@phosphor-icons/react";
import { useToastStore, type ToastTone } from "@/lib/toastStore";

const toneStyles: Record<ToastTone, { bg: string; icon: JSX.Element }> = {
  default: {
    bg: "bg-ink-900",
    icon: <Info size={18} weight="bold" className="text-white" />,
  },
  success: {
    bg: "bg-ink-900",
    icon: <Check size={18} weight="bold" className="text-accent-soft" />,
  },
  danger: {
    bg: "bg-ink-900",
    icon: <Trash size={18} weight="bold" className="text-flame-soft" />,
  },
};

export const Toaster = memo(function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed left-0 right-[12vw] bottom-0 z-50 flex flex-col items-center gap-2 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:inset-x-0">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            layout
            onClick={() => dismiss(t.id)}
            initial={{ y: 40, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            className={`pointer-events-auto flex w-full max-w-[420px] items-center gap-3 rounded-2xl ${toneStyles[t.tone].bg} px-4 py-3 text-left shadow-[0_12px_30px_-8px_rgba(0,0,0,0.4)]`}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10">
              {toneStyles[t.tone].icon}
            </span>
            <span className="flex-1 text-sm font-medium text-white">{t.message}</span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
});
