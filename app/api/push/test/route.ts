import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
  const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
  const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:noreply@habitos.app";

  if (!SUPABASE_URL || !SERVICE || !VAPID_PUBLIC || !VAPID_PRIVATE) {
    return NextResponse.json({ error: "Faltan variables de entorno en el servidor" }, { status: 500 });
  }

  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: "Falta el código" }, { status: 400 });

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

  const supabase = createClient(SUPABASE_URL, SERVICE, {
    auth: { persistSession: false },
  });

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint,subscription")
    .eq("code", code);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!subs || subs.length === 0) {
    return NextResponse.json({ error: "No hay suscripciones para este código" }, { status: 404 });
  }

  const payload = JSON.stringify({
    title: "¡Hábitos funciona!",
    body: "Tus notificaciones están activas.",
    tag: "test-push",
    url: "/",
  });

  let sent = 0;
  const errors: string[] = [];

  for (const s of subs) {
    try {
      await webpush.sendNotification(s.subscription as webpush.PushSubscription, payload);
      sent++;
    } catch (e) {
      const code2 = (e as { statusCode?: number })?.statusCode;
      if (code2 === 404 || code2 === 410) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
        errors.push(`Suscripción expirada, eliminada: ${s.endpoint.slice(0, 40)}...`);
      } else {
        errors.push(e instanceof Error ? e.message : String(e));
      }
    }
  }

  return NextResponse.json({ sent, errors, total: subs.length });
}
