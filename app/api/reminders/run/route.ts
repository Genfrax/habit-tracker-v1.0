import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

export const runtime = "nodejs";

type Now = { dateKey: string; hhmm: string; weekday: number; minutes: number };
const WD: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
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

function timeMatches(habitTime: string | undefined, now: Now): boolean {
  if (!habitTime) return false;
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
      const matched = timeMatches(h.time, now);
      return {
        name: h.name,
        time: h.time ?? null,
        dueToday: due,
        completedToday: completed,
        timeMatched: matched,
        willSend: due && !completed && (force || matched),
      };
    });

    const toSend = habits.filter((h) => {
      const due = isDueOn(h, now);
      const completed = (h.completions || []).includes(now.dateKey);
      return due && !completed && (force || timeMatches(h.time, now));
    });

    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint,subscription")
      .eq("code", space.code);

    let sent = 0;
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
        body: "Es hora de tu hábito",
        tag: `habit-${habit.id}`,
        url: "/",
      });
      for (const s of subs || []) {
        try {
          await webpush.sendNotification(s.subscription as webpush.PushSubscription, payload);
          sent++;
        } catch (e) {
          const code2 = (e as { statusCode?: number })?.statusCode;
          if (code2 === 404 || code2 === 410) {
            await supabase.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
          }
        }
      }
    }

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
