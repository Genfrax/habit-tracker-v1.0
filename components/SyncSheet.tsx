"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Gear, X, Copy, Check, BellRinging, DeviceMobile, CloudCheck, CloudSlash } from "@phosphor-icons/react";
import { isSyncConfigured } from "@/lib/supabase";
import { ensureCode, formatCode, normalizeCode, setStoredCode } from "@/lib/syncCode";
import { enablePush, notificationPermission, pushSupported } from "@/lib/push";
import { useToastStore } from "@/lib/toastStore";

export function SyncSheet() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [linkInput, setLinkInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [perm, setPerm] = useState<string>("default");
  const [busy, setBusy] = useState(false);
  const [testBusy, setTestBusy] = useState(false);
  const configured = isSyncConfigured();
  const pushToast = useToastStore((s) => s.push);

  useEffect(() => {
    setCode(ensureCode());
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

  const linkDevice = () => {
    const n = normalizeCode(linkInput);
    if (n.length !== 8) {
      pushToast("El código debe tener 8 caracteres", "danger");
      return;
    }
    setStoredCode(n);
    pushToast("Vinculando…", "success");
    setTimeout(() => window.location.reload(), 600);
  };

  const handleTestPush = async () => {
    setTestBusy(true);
    try {
      const res = await fetch("/api/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.sent > 0) {
        pushToast("Notificación de prueba enviada", "success");
      } else if (data.error) {
        pushToast(`Error: ${data.error}`, "danger");
      } else {
        pushToast("No se encontraron suscripciones activas", "danger");
      }
    } catch {
      pushToast("Error al enviar prueba", "danger");
    }
    setTestBusy(false);
  };

  const handleEnablePush = async () => {
    setBusy(true);
    const res = await enablePush();
    setBusy(false);
    setPerm(notificationPermission());
    if (res.ok) {
      pushToast("Notificaciones activadas", "success");
    } else if (res.reason === "denied") {
      pushToast("Permiso de notificaciones denegado", "danger");
    } else if (res.reason === "unsupported") {
      pushToast("Tu navegador no soporta notificaciones", "danger");
    } else if (res.reason === "no-config") {
      pushToast("Falta configurar el servidor", "danger");
    } else {
      const detail = "detail" in res ? res.detail : undefined;
      pushToast(detail ? `Error: ${detail}` : "No se pudo activar", "danger");
    }
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

                  {/* Tu código */}
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-ink-700">Tu código</span>
                    <button
                      onClick={copyCode}
                      className="group flex items-center justify-between rounded-2xl border border-ink-100 bg-ink-50/60 px-4 py-4 transition-colors duration-150 hover:bg-ink-50"
                    >
                      <span className="font-mono text-2xl font-semibold tracking-[0.15em] text-ink-900">
                        {formatCode(code)}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-medium text-ink-400 group-hover:text-accent">
                        {copied ? (
                          <>
                            <Check size={16} weight="bold" /> Copiado
                          </>
                        ) : (
                          <>
                            <Copy size={16} weight="bold" /> Copiar
                          </>
                        )}
                      </span>
                    </button>
                    <p className="text-xs text-ink-400">
                      Escribe este código en tu otro dispositivo para ver los mismos hábitos.
                    </p>
                  </div>

                  {/* Vincular */}
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-ink-700">
                      Vincular este dispositivo a otro
                    </span>
                    <div className="flex gap-2">
                      <input
                        value={linkInput}
                        onChange={(e) => setLinkInput(e.target.value.toUpperCase())}
                        placeholder="Ej. K7P2-9QXM"
                        className="w-full rounded-2xl border border-ink-100 bg-ink-50/60 px-4 py-3 font-mono text-[15px] tracking-wider text-ink-900 outline-none transition-all duration-150 placeholder:text-ink-300 placeholder:tracking-normal focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20"
                      />
                      <button
                        onClick={linkDevice}
                        disabled={!configured}
                        className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-accent px-4 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#0a5cef] active:scale-95 disabled:opacity-40"
                      >
                        <DeviceMobile size={18} weight="bold" />
                        Vincular
                      </button>
                    </div>
                    <p className="text-xs text-amber-600">
                      Reemplazará los hábitos de este dispositivo por los del código.
                    </p>
                  </div>

                  {/* Notificaciones */}
                  <div className="flex flex-col gap-2 border-t border-ink-100 pt-5">
                    <span className="text-sm font-medium text-ink-700">Notificaciones</span>
                    {perm === "granted" ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                          <Check size={18} weight="bold" />
                          Activadas en este dispositivo.
                        </div>
                        <button
                          onClick={handleTestPush}
                          disabled={testBusy || !configured}
                          className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-ink-100 bg-white text-[14px] font-medium text-ink-700 transition-all duration-150 hover:bg-ink-50 active:scale-[0.98] disabled:opacity-40"
                        >
                          {testBusy ? (
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                              className="block h-4 w-4 rounded-full border-2 border-ink-300 border-t-ink-700"
                            />
                          ) : (
                            <>
                              <BellRinging size={16} weight="bold" />
                              Enviar notificación de prueba
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleEnablePush}
                        disabled={busy || !pushSupported() || !configured}
                        className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-ink-900 text-[15px] font-semibold text-white transition-all duration-150 hover:bg-ink-800 active:scale-[0.98] disabled:opacity-40"
                      >
                        {busy ? (
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                            className="block h-5 w-5 rounded-full border-2 border-white/30 border-t-white"
                          />
                        ) : (
                          <>
                            <BellRinging size={18} weight="bold" />
                            Activar notificaciones
                          </>
                        )}
                      </button>
                    )}
                    <p className="text-xs text-ink-400">
                      Abre la app desde el ícono en pantalla de inicio (no desde Safari).
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
