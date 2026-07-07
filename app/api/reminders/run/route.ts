import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

export const runtime = "nodejs";

type Now = { dateKey: string; hhmm: string; weekday: number; minutes: number };
const WD: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
// El cron corre cada 5 min; la ventana de 4 min cubre todos los minutos
// intermedios sin duplicar (la tabla sent_reminders deduplica por día).
const WINDOW_MIN = 4;

// ── Textos variados para las notificaciones ──
// Se elige por hash(hábito + fecha): cambia cada día y entre hábitos.
const BODIES = [
  "Es hora de tus hábitos ⏰",
  "¿Sos un vago? Todavía no hiciste esto 👀",
  "Acordate que tenés esto pendiente",
  "¿Ya saliste? 🏃",
  "¿Ya lo hiciste?",
  "No rompas la racha 🔥",
  "Dale, son 5 minutos",
  "Tu yo de mañana te lo va a agradecer",
  "Hoy también cuenta ✨",
  "Un tick más y la racha sigue viva",
];

// Hash determinístico simple (djb2) para elegir frase y horario.
const hashStr = (s: string): number => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
};

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

// Hábitos SIN hora fija: se les asigna una hora pseudo-aleatoria del día
// entre 08:00 y 20:59, distinta por hábito y por fecha (así los avisos no
// llegan todos juntos ni siempre a la misma hora).
function autoTimeFor(habitId: string, dateKey: string): string {
  const mins = 8 * 60 + (hashStr(dateKey + "|" + habitId) % (13 * 60));
  const hh = String(Math.floor(mins / 60)).padStart(2, "0");
  const mm = String(mins % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function timeMatches(habit: Habit, now: Now): boolean {
  const habitTime = habit.time || autoTimeFor(habit.id, now.dateKey);
  const [hh, mm] = habitTime.split(":").map((n) => parseInt(n, 10));
  if (Number.isNaN(hh) || Number.isNaN(mm)) return false;
  const diff = now.minutes - (hh * 60 + mm);
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

// Cuenta cuántos días programados seguidos (hacia atrás, sin contar hoy)
// lleva el hábito SIN cumplirse. 0 = al día.
function missedScheduledDays(h: Habit, now: Now): number {
  const done = new Set(h.completions || []);
  const base = new Date(`${now.dateKey}T00:00:00Z`);
  let missed = 0;
  for (let i = 1; i <= 30; i++) {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (h.startDate && key < h.startDate) break;
    if (h.createdAt && key < h.createdAt.slice(0, 10)) break;
    const past: Now = {
      dateKey: key,
      hhmm: "00:00",
      weekday: (((now.weekday - i) % 7) + 7) % 7,
      minutes: 0,
    };
    if (isDueOn(h, past)) {
      if (done.has(key)) break;
      missed++;
    }
  }
  return missed;
}

// Cuerpo de la notificación: si lleva 3+ días sin cumplirse, te lo canta;
// si no, una frase que rota por día y por hábito.
function bodyFor(h: Habit, now: Now): string {
  const missed = missedScheduledDays(h, now);
  if (missed >= 3) {
    return `Hace ${missed} días que no cumplís este hábito 😬 ¿Hoy sí?`;
  }
  return BODIES[hashStr(h.id + "#" + now.dateKey) % BODIES.length];
}

export async function POST(req: NextRequest) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
  const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
  const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:noreply@habitos.app";

  if (!SUPABASE_URL || !SERVICE || !VAPID_PUBLIC || !VAPID_PRIVATE) {
    return NextResponse.json({ error: "Faltan variables de entorno" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const cronKey = req.headers.get("x-cron-key");
  const isCron = Boolean(cronKey && cronKey === SERVICE);
  const force = Boolean(body.force);

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  const supabase = createClient(SUPABASE_URL, SERVICE, { auth: { persistSession: false } });

  // Modo cron → todos los espacios. Modo manual → solo el código dado.
  let spacesQuery = supabase.from("spaces").select("code,habits,timezone");
  if (!isCron) {
    if (!body.code) return NextResponse.json({ error: "Falta el código" }, { status: 400 });
    spacesQuery = spacesQuery.eq("code", body.code);
  }
  const { data: spaces, error } = await spacesQuery;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: unknown[] = [];

  for (const space of spaces || []) {
    const tz = space.timezone || "America/Mexico_City";
    const now = nowInTz(tz);
    const habits: Habit[] = Array.isArray(space.habits) ? space.habits : [];

    const candidates = habits.map((h) => {
      const due = isDueOn(h, now);
      const completed = (h.completions || []).includes(now.dateKey);
      const matched = timeMatches(h, now);
      return {
        name: h.name,
        time: h.time ?? null,
        autoTime: h.time ? null : autoTimeFor(h.id, now.dateKey),
        dueToday: due,
        completedToday: completed,
        timeMatched: matched,
        willSend: due && !completed && (force || matched),
      };
    });

    const toSend = habits.filter((h) => {
      const due = isDueOn(h, now);
      const completed = (h.completions || []).includes(now.dateKey);
      return due && !completed && (force || timeMatches(h, now));
    });

    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint,subscription")
      .eq("code", space.code);

    // Todos los envíos en paralelo y con timeout: una suscripción muerta
    // que no responde ya no puede colgar la función entera.
    const sendTasks: Promise<boolean>[] = [];
    for (const habit of toSend) {
      // En modo cron deduplicamos; en prueba manual (force) no, para poder repetir
      if (!force) {
        const { error: dupErr } = await supabase
          .from("sent_reminders")
          .insert({ code: space.code, habit_id: habit.id, on_date: now.dateKey });
        if (dupErr) continue;
      }
      const payload = JSON.stringify({
        title: habit.name,
        body: bodyFor(habit, now),
        tag: `habit-${habit.id}`,
        url: "/",
      });
      for (const s of subs || []) {
        sendTasks.push(
          webpush
            .sendNotification(s.subscription as webpush.PushSubscription, payload, {
              timeout: 8000,
            })
            .then(() => true)
            .catch(async (e) => {
              const code2 = (e as { statusCode?: number })?.statusCode;
              if (code2 === 404 || code2 === 410) {
                await supabase.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
              }
              return false;
            })
        );
      }
    }
    const sent = (await Promise.all(sendTasks)).filter(Boolean).length;

    results.push({
      code: space.code,
      timezone: tz,
      now: { dateKey: now.dateKey, hora: now.hhmm },
      subscripciones: (subs || []).length,
      candidates,
      sent,
    });
  }

  return NextResponse.json({ mode: isCron ? "cron" : "manual", force, results });
}
