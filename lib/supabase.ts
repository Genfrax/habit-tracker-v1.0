"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** ¿Está configurada la sincronización en la nube? */
export const isSyncConfigured = (): boolean => Boolean(url && anonKey);

let client: SupabaseClient | null = null;

/** Devuelve el cliente de Supabase, o null si no está configurado. */
export const getSupabase = (): SupabaseClient | null => {
  if (!isSyncConfigured()) return null;
  if (!client) {
    client = createClient(url as string, anonKey as string, {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 2 } },
    });
  }
  return client;
};
