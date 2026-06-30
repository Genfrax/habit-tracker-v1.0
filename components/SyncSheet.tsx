"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Gear, X, Copy, Check, BellRinging, CloudCheck, CloudSlash } from "@phosphor-icons/react";
import { isSyncConfigured } from "@/lib/supabase";
import { ensureCode, formatCode, normalizeCode, isValidCode, setStoredCode } from "@/lib/syncCode";
import {
  enablePush,
  notificationPermission,
  pushSupported,
  localTestNotification,
} from "@/lib/push";
import { useToastStore } from "@/lib/toastStore";

export function SyncSheet() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [perm, setPerm] = useState<string>("default");
  const [testBusy, setTestBusy] = useState(false);
  const [reminderBusy, setReminderBusy] = useState(false);
  const configured = isSyncConfigured();
  const pushToast = useToastStore((s) => s.push);

  useEffect(() => {
    const c = ensureCode();
    setCode(c);
    setCodeInput(formatCode(c));
    setPerm(notificationPermission());
  }, []);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(formatCode(code));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      pushToast("No se pudo copiar", "danger");
    }
  };

  const saveCode = () => {
    if (!isValidCode(codeInput)) {
      pushToast("El código debe tener al menos 4 caracteres", "danger");
      return;
    }
    const next = normalizeCode(codeInput);
    if (next === code) {
      pushToast("Ya estás usando este código", "default");
      return;
    }
    setStoredCode(next);
    pushToast("Aplicando código…", "success");
    setTimeout(() => window.location.reload(), 600);
  };

  const handleTestReminder = async () => {
    setReminderBusy(true);
    try {
      const res = await fetch("/api/reminders/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, force: true }),
      });
      const data = await res.json();
      const r = data.results?.[0];
      if (!r) {
        pushToast(data.error || "Sin resultado del servidor", "danger");
      } else if (r.sent > 0) {
        pushToast(`Recordatorio enviado (${r.sent})`, "success");
      } else if (r.subscripciones === 0) {
        pushToast("Este código no tiene notificaciones activas", "danger");
      } else {
        pushToast("No hay hábitos pendientes hoy para recordar", "default");
      }
    } catch {
      pushToast("Error al probar el recordatorio", "danger");
    }
    setReminderBusy(false);
  };

  const handleTest = async () => {
    setTestBusy(true);

    // 1) Asegurar permiso + suscripción
    if (notificationPermission() !== "granted") {
      const en = await enablePush();
      setPerm(notificationPermission());
      if (!en.ok) {
        const detail = "detail" in en ? en.detail : undefined;
        if (en.reason === "denied") pushToast("Permiso denegado", "danger");
        else if (en.reason === "unsupported")
          pushToast("Este navegador no soporta notificaciones", "danger");
        else if (en.reason === "no-config") pushToast("Falta configurar el servidor", "danger");
        else pushToast(detail ? `Error: ${detail}` : "No se pudo activar", "danger");
        setTestBusy(false);
        return;
      }
    }

    // 2) Prueba LOCAL (instantánea, sin servidor)
    const local = await localTestNotification();
    if (local.ok) {
      pushToast("Notificación local enviada", "success");
    } else {
      const detail = "detail" in local ? local.detail : local.reason;
      pushToast(`Local falló: ${detail}`, "danger");
    }

    // 3) Prueba desde el SERVIDOR (push real)
    try {
      const res = await fetch("/api/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.sent > 0) {
        pushToast("Servidor: notificación enviada", "success");
      } else {
        pushToast(`Servidor: ${data.error || "sin suscripciones"}`, "danger");
      }
    } catch {
      pushToast("Servidor: error de red", "danger");
    }

    setTestBusy(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Sincronización y notificaciones"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-100 bg-white text-ink-500 shadow-soft transition-all duration-150 hover:text-ink-800 active:scale-95"
      >
        <Gear size={20} weight="bold" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-[2px]"
            />
            <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4">
              <motion.div
                initial={{ y: 40, opacity: 0, scale: 0.98 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 30, opacity: 0, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                className="flex max-h-[90dvh] w-full max-w-[460px] flex-col overflow-hidden rounded-5xl border border-ink-100 bg-white shadow-[0_30px_70px_-20px_rgba(0,0,0,0.35)]"
              >
                <div className="flex items-center justify-between px-6 pt-6">
                  <h2 className="text-lg font-semibold tracking-tight text-ink-900">
                    Sincronización
                  </h2>
                  <button
                    onClick={() => setOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-ink-400 transition-colors duration-150 hover:bg-ink-50 hover:text-ink-700"
                    aria-label="Cerrar"
                  >
                    <X size={20} weight="bold" />
                  </button>
                </div>

                <div className="scroll-hide flex flex-col gap-6 overflow-y-auto px-6 py-6">
                  {/* Estado */}
                  <div
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                      configured
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-amber-200 bg-amber-50"
                    }`}
                  >
                    {configured ? (
                      <CloudCheck size={22} weight="fill" className="text-emerald-500" />
                    ) : (
                      <CloudSlash size={22} weight="fill" className="text-amber-500" />
                    )}
                    <p className="text-sm text-ink-700">
                      {configured
                        ? "Sincronización en la nube activa."
                        : "Aún sin servidor: la app funciona, pero solo en este dispositivo."}
                    </p>
                  </div>

                  {/* Código de sincronización (editable) */}
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-ink-700">
                      Código de sincronización
                    </span>
                    <div className="flex gap-2">
                      <input
                        value={codeInput}
                        onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                        placeholder="Ej. GENARO"
                        className="w-full rounded-2xl border border-ink-100 bg-ink-50/60 px-4 py-3 font-mono text-[17px] font-semibold tracking-wider text-ink-900 outline-none transition-all duration-150 placeholder:font-normal placeholder:text-ink-300 focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20"
                      />
                      <button
                        onClick={copyCode}
                        aria-label="Copiar"
                        className="flex shrink-0 items-center justify-center rounded-2xl border border-ink-100 bg-white px-3 text-ink-500 transition-colors duration-150 hover:text-accent active:scale-95"
                      >
                        {copied ? <Check size={18} weight="bold" /> : <Copy size={18} weight="bold" />}
                      </button>
                    </div>
                    <button
                      onClick={saveCode}
                      disabled={!configured}
                      className="flex h-11 items-center justify-center rounded-2xl bg-accent text-[14px] font-semibold text-white transition-all duration-150 hover:bg-[#0a5cef] active:scale-[0.98] disabled:opacity-40"
                    >
                      Usar este código
                    </button>
                    <p className="text-xs text-ink-400">
                      Usa el <strong>mismo código</strong> en tu iPhone y tu Mac para ver
                      los mismos hábitos. Ponle algo fácil de recordar (tu nombre). Si un
                      dispositivo lo olvida, solo vuelve a escribirlo aquí.
                    </p>
                  </div>

                  {/* Notificaciones */}
                  <div className="flex flex-col gap-2 border-t border-ink-100 pt-5">
                    <span className="text-sm font-medium text-ink-700">Notificaciones</span>

                    {perm === "granted" && (
                      <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
                        <Check size={16} weight="bold" />
                        Permiso concedido en este dispositivo.
                      </div>
                    )}

                    <button
                      onClick={handleTest}
                      disabled={testBusy || !pushSupported() || !configured}
                      className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-ink-900 text-[15px] font-semibold text-white transition-all duration-150 hover:bg-ink-800 active:scale-[0.98] disabled:opacity-40"
                    >
                      {testBusy ? (
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                          className="block h-5 w-5 rounded-full border-2 border-white/30 border-t-white"
                        />
                      ) : (
                        <>
                          <BellRinging size={18} weight="bold" />
                          {perm === "granted"
                            ? "Enviar notificación de prueba"
                            : "Activar y probar notificaciones"}
                        </>
                      )}
                    </button>

                    {perm === "granted" && (
                      <button
                        onClick={handleTestReminder}
                        disabled={reminderBusy || !configured}
                        className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-ink-100 bg-white text-[14px] font-medium text-ink-700 transition-all duration-150 hover:bg-ink-50 active:scale-[0.98] disabled:opacity-40"
                      >
                        {reminderBusy ? (
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                            className="block h-4 w-4 rounded-full border-2 border-ink-300 border-t-ink-700"
                          />
                        ) : (
                          <>
                            <BellRinging size={16} weight="bold" />
                            Probar recordatorio de hábito ahora
                          </>
                        )}
                      </button>
                    )}

                    <p className="text-xs text-ink-400">
                      En iPhone abre la app desde el ícono de la pantalla de inicio
                      (no desde Safari). Verás dos avisos: uno local y uno del servidor.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
