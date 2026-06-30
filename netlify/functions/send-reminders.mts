import type { Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

// ── Helpers de tiempo conscientes de zona horaria ────────────────
type Now = { dateKey: string; hhmm: string; weekday: number; minutes: number };

const WD: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

// Ventana de tolerancia: si el cron se atrasa unos segundos, igual envía.
const WINDOW_MIN = 2;

function nowInTz(tz: string): Now {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
  }).formatToParts(new Date());

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  let hour = get("hour");
  if (hour === "24") hour = "00";
  const h = parseInt(hour, 10);
  const m = parseInt(get("minute"), 10);
  return {
    dateKey: `${get("year")}-${get("month")}-${get("day")}`,
    hhmm: `${hour}:${get("minute")}`,
    weekday: WD[get("weekday")] ?? new Date().getDay(),
    minutes: h * 60 + m,
  };
}

/** ¿La hora del hábito cae dentro de la ventana [now-2min, now]? */
function timeMatches(habitTime: string | undefined, now: Now): boolean {
  if (!habitTime) return false;
  const [hh, mm] = habitTime.split(":").map((n) => parseInt(n, 10));
  if (Number.isNaN(hh) || Number.isNaN(mm)) return false;
  const habitMinutes = hh * 60 + mm;
  const diff = now.minutes - habitMinutes;
  return diff >= 0 && diff <= WINDOW_MIN;
}

type Habit = {
  id: string;
  name: string;
  time?: string;
  startDate?: string;
  endDate?: string;
  repeat?: string;
  weekdays?: number[];
  completions?: string[];
  createdAt?: string;
};

function isDueOn(h: Habit, now: Now): boolean {
  if (h.startDate && now.dateKey < h.startDate) return false;
  if (h.endDate && now.dateKey > h.endDate) return false;
  const repeat = h.repeat || "daily";
  if (repeat === "daily") return true;
  if (repeat === "weekly") {
    const days = h.weekdays || [];
    return days.length === 0 ? true : days.includes(now.weekday);
  }
  const anchor = h.startDate || (h.createdAt ? h.createdAt.slice(0, 10) : now.dateKey);
  if (repeat === "monthly") return now.dateKey.slice(8, 10) === anchor.slice(8, 10);
  if (repeat === "yearly") return now.dateKey.slice(5) === anchor.slice(5);
  return true;
}

// ── Función programada ───────────────────────────────────────────
export default async () => {
  const SUPABASE_URL =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
  const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
  const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:noreply@habitos.app";

  if (!SUPABASE_URL || !SERVICE || !VAPID_PUBLIC || !VAPID_PRIVATE) {
    return new Response("Faltan variables de entorno", { status: 500 });
  }

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  const supabase = createClient(SUPABASE_URL, SERVICE, {
    auth: { persistSession: false },
  });

  const { data: spaces } = await supabase
    .from("spaces")
    .select("code,habits,timezone");
  if (!spaces || spaces.length === 0) return new Response("Sin espacios");

  let sent = 0;

  for (const space of spaces) {
    const tz = space.timezone || "America/Mexico_City";
    const now = nowInTz(tz);
    const habits: Habit[] = Array.isArray(space.habits) ? space.habits : [];

    const dueNow = habits.filter(
      (h) =>
        timeMatches(h.time, now) &&
        isDueOn(h, now) &&
        !(h.completions || []).includes(now.dateKey)
    );
    if (dueNow.length === 0) continue;

    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint,subscription")
      .eq("code", space.code);
    if (!subs || subs.length === 0) continue;

    for (const habit of dueNow) {
      // Anti-duplicado: si ya se registró hoy, el insert falla y saltamos
      const { error: dupErr } = await supabase
        .from("sent_reminders")
        .insert({ code: space.code, habit_id: habit.id, on_date: now.dateKey });
      if (dupErr) continue;

      const payload = JSON.stringify({
        title: habit.name,
        body: "Es hora de tu hábito",
        tag: `habit-${habit.id}`,
        url: "/",
      });

      for (const s of subs) {
        try {
          await webpush.sendNotification(s.subscription as webpush.PushSubscription, payload);
          sent++;
        } catch (e) {
          const code = (e as { statusCode?: number })?.statusCode;
          if (code === 404 || code === 410) {
            // Suscripción expirada → la borramos
            await supabase.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
          }
        }
      }
    }
  }

  return new Response(`Enviados: ${sent}`);
};

// Cada minuto (UTC). La hora local se calcula por zona horaria del usuario.
export const config: Config = {
  schedule: "* * * * *",
};
