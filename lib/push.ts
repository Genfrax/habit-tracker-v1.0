"use client";

import { getSupabase } from "./supabase";
import { ensureCode } from "./syncCode";

const urlBase64ToUint8Array = (base64: string): Uint8Array => {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
};

export type PushResult =
  | { ok: true }
  | { ok: false; reason: "unsupported" | "denied" | "no-config" | "error"; detail?: string };

export const pushSupported = (): boolean =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

export const notificationPermission = (): NotificationPermission | "unsupported" =>
  pushSupported() ? Notification.permission : "unsupported";

const withTimeout = <T>(promise: Promise<T>, ms: number, label: string): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout en ${label} (${ms}ms)`)), ms)
    ),
  ]);

/**
 * Muestra una notificación LOCAL (desde el dispositivo, sin servidor).
 * Es el mejor diagnóstico: si esto se ve, el dispositivo puede mostrar
 * notificaciones; si falla, el problema es permiso/instalación.
 */
export const localTestNotification = async (): Promise<PushResult> => {
  if (!pushSupported()) return { ok: false, reason: "unsupported" };
  if (Notification.permission !== "granted") return { ok: false, reason: "denied" };
  try {
    const reg = await withTimeout(navigator.serviceWorker.ready, 8000, "serviceWorker.ready");
    await reg.showNotification("Prueba ✓", {
      body: "Si ves esto, las notificaciones funcionan en este dispositivo.",
      icon: "/apple-touch-icon.png",
      badge: "/apple-touch-icon.png",
      tag: "local-test",
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: "error", detail: e instanceof Error ? e.message : String(e) };
  }
};

/** Pide permiso, se suscribe y guarda la suscripción en Supabase. */
export const enablePush = async (): Promise<PushResult> => {
  if (!pushSupported()) return { ok: false, reason: "unsupported" };

  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const supabase = getSupabase();
  if (!vapid || !supabase) return { ok: false, reason: "no-config" };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, reason: "denied" };

  try {
    // Timeout de 12s — en iOS el SW puede tardar en activarse
    const reg = await withTimeout(navigator.serviceWorker.ready, 12000, "serviceWorker.ready");

    const wantedKey = urlBase64ToUint8Array(vapid);

    let sub = await reg.pushManager.getSubscription();
    if (sub) {
      // Si la suscripción existente fue creada con OTRA clave VAPID (p. ej.
      // tras rotar las claves), el servidor no puede usarla: hay que renovarla.
      const currentKey = sub.options?.applicationServerKey
        ? new Uint8Array(sub.options.applicationServerKey)
        : null;
      const sameKey =
        currentKey !== null &&
        currentKey.length === wantedKey.length &&
        currentKey.every((b, i) => b === wantedKey[i]);
      if (!sameKey) {
        try {
          await sub.unsubscribe();
        } catch {}
        sub = null;
      }
    }
    if (!sub) {
      sub = await withTimeout(
        reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: wantedKey,
        }),
        12000,
        "pushManager.subscribe"
      );
    }

    const code = ensureCode();
    const json = sub.toJSON();
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        { code, endpoint: json.endpoint, subscription: json },
        { onConflict: "endpoint" }
      );
    if (error) return { ok: false, reason: "error", detail: error.message };

    return { ok: true };
  } catch (e) {
    return { ok: false, reason: "error", detail: e instanceof Error ? e.message : String(e) };
  }
};
