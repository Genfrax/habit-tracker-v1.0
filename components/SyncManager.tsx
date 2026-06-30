"use client";

import { useEffect, useRef } from "react";
import { getSupabase, isSyncConfigured } from "@/lib/supabase";
import { ensureCode } from "@/lib/syncCode";
import { useHabitStore } from "@/lib/store";
import type { Habit } from "@/lib/types";

const DEBOUNCE = 700;

export function SyncManager() {
  const hasHydrated = useHabitStore((s) => s.hasHydrated);
  const startedRef = useRef(false);
  const lastSyncedRef = useRef<string | null>(null);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hasHydrated || startedRef.current) return;
    if (!isSyncConfigured()) return; // sin claves → modo solo-local
    const supabase = getSupabase();
    if (!supabase) return;

    startedRef.current = true;
    const code = ensureCode();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Mexico_City";
    let active = true;

    const apply = (habits: Habit[]) => {
      lastSyncedRef.current = JSON.stringify(habits);
      useHabitStore.getState().replaceHabits(habits);
    };

    const pushNow = async (habits: Habit[]) => {
      const json = JSON.stringify(habits);
      if (json === lastSyncedRef.current) return; // sin cambios reales / eco
      lastSyncedRef.current = json;
      await supabase
        .from("spaces")
        .upsert({ code, habits, timezone: tz, updated_at: new Date().toISOString() });
    };

    const schedulePush = (habits: Habit[]) => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
      pushTimer.current = setTimeout(() => pushNow(habits), DEBOUNCE);
    };

    const pull = async () => {
      const { data } = await supabase
        .from("spaces")
        .select("habits")
        .eq("code", code)
        .maybeSingle();

      if (!active) return;

      if (data && Array.isArray(data.habits)) {
        // El espacio ya existe en la nube → adoptamos esos datos
        const remote = JSON.stringify(data.habits);
        if (remote !== JSON.stringify(useHabitStore.getState().habits)) {
          apply(data.habits as Habit[]);
        } else {
          lastSyncedRef.current = remote;
        }
      } else {
        // Primer dispositivo: creamos el espacio con lo que hay local
        const local = useHabitStore.getState().habits;
        lastSyncedRef.current = JSON.stringify(local);
        await supabase.from("spaces").upsert({
          code,
          habits: local,
          timezone: tz,
          updated_at: new Date().toISOString(),
        });
      }
    };

    // 1) Carga inicial
    pull();

    // 2) Sube cambios locales (debounced)
    const unsub = useHabitStore.subscribe((state, prev) => {
      if (state.habits !== prev.habits) schedulePush(state.habits);
    });

    // 3) Tiempo real: cambios desde otro dispositivo
    const channel = supabase
      .channel(`space-${code}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "spaces", filter: `code=eq.${code}` },
        (payload) => {
          const next = (payload.new as { habits?: Habit[] })?.habits;
          if (!Array.isArray(next)) return;
          const json = JSON.stringify(next);
          if (json === lastSyncedRef.current) return; // eco de nuestra propia escritura
          apply(next);
        }
      )
      .subscribe();

    // 4) Re-sincroniza al volver a la app (móvil)
    const onVisible = () => {
      if (document.visibilityState === "visible") pull();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      active = false;
      unsub();
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", onVisible);
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [hasHydrated]);

  return null;
}
