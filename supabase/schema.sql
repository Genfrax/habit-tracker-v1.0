-- ════════════════════════════════════════════════════════════════
--  Esquema de la base de datos de Hábitos
--  Pégalo completo en: Supabase → SQL Editor → New query → Run
-- ════════════════════════════════════════════════════════════════

-- 1) Espacios: un "código de sincronización" = una fila con todos tus hábitos
create table if not exists public.spaces (
  code        text primary key,
  habits      jsonb not null default '[]'::jsonb,
  timezone    text  not null default 'America/Mexico_City',
  updated_at  timestamptz not null default now()
);

-- 2) Suscripciones de notificaciones push (una por dispositivo)
create table if not exists public.push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  code         text not null,
  endpoint     text not null unique,
  subscription jsonb not null,
  created_at   timestamptz not null default now()
);
create index if not exists idx_push_code on public.push_subscriptions(code);

-- 3) Registro de recordatorios enviados (evita duplicados el mismo día)
create table if not exists public.sent_reminders (
  code      text not null,
  habit_id  text not null,
  on_date   text not null,            -- "YYYY-MM-DD" en zona del usuario
  sent_at   timestamptz not null default now(),
  primary key (code, habit_id, on_date)
);

-- ── Seguridad (RLS) ──────────────────────────────────────────────
-- Modelo elegido: sin login. El código actúa como secreto.
-- La clave anon puede leer/escribir; la función de Netlify usa la
-- service_role (que omite RLS) para leer suscripciones y enviar push.

alter table public.spaces             enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.sent_reminders     enable row level security;

drop policy if exists "spaces anon all" on public.spaces;
create policy "spaces anon all" on public.spaces
  for all to anon using (true) with check (true);

drop policy if exists "subs anon all" on public.push_subscriptions;
create policy "subs anon all" on public.push_subscriptions
  for all to anon using (true) with check (true);

-- sent_reminders solo lo toca el servidor (service_role); sin políticas anon.

-- ── Tiempo real (para que iPhone y Mac se actualicen en vivo) ────
alter publication supabase_realtime add table public.spaces;
