import type { Config } from "@netlify/functions";

// Función programada: cada minuto le pide al sitio que evalúe y envíe
// los recordatorios. La lógica vive en /api/reminders/run (más fácil de
// probar y mantener). Se autentica con la service_role como clave de cron.
export default async () => {
  const SITE = process.env.URL || process.env.DEPLOY_PRIME_URL;
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SITE || !SERVICE) {
    return new Response("Faltan URL o SUPABASE_SERVICE_ROLE_KEY", { status: 500 });
  }

  try {
    const res = await fetch(`${SITE}/api/reminders/run`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-cron-key": SERVICE,
      },
      body: "{}",
    });
    const text = await res.text();
    return new Response(`run -> ${res.status}: ${text.slice(0, 300)}`);
  } catch (e) {
    return new Response(`Error: ${e instanceof Error ? e.message : String(e)}`, { status: 500 });
  }
};

// Cada minuto (UTC). La hora local se calcula por zona horaria del usuario.
export const config: Config = {
  schedule: "* * * * *",
};
