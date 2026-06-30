# Hábitos

Tracker de hábitos con animaciones satisfactorias. PWA instalable en iPhone (Safari → Compartir → "Agregar a pantalla de inicio") y usable en Mac desde el navegador.

## Stack
- **Next.js 14** (App Router) + TypeScript
- **Framer Motion** para las animaciones
- **Tailwind CSS** + Geist
- **Zustand** con persistencia en `localStorage`
- **Service Worker** + Web Push (iOS 16.4+ cuando está instalada)

## Cómo correrla

```bash
# Desde el directorio del proyecto
npm install
npm run dev
```

Abre `http://localhost:3000`.

Para build de producción:

```bash
npm run build
npm start
```

## Instalarla en tu iPhone (para notificaciones)

1. Despliega la app a un dominio público con HTTPS (recomendado: Vercel — `vercel deploy`).
2. En iPhone, abre la URL en **Safari**.
3. Toca el botón "Compartir" → **Agregar a pantalla de inicio**.
4. Abre la app desde el ícono. Ahora es una PWA real con service worker.

Para notificaciones push reales necesitas:
- Llaves VAPID (`npx web-push generate-vapid-keys`)
- Un backend mínimo que envíe el push (Vercel functions, Cloudflare Workers, etc.)
- Pedir permiso con `Notification.requestPermission()` en el cliente y suscribirse con `pushManager.subscribe(...)`

El service worker (`public/sw.js`) ya tiene los handlers `push` y `notificationclick` listos.

## Control desde Mac
Misma URL desde cualquier navegador. El estado se persiste localmente por dispositivo. Si quieres sincronización Mac ↔ iPhone, agrega backend (Supabase / Vercel KV / etc.).

## Estructura
```
app/
  layout.tsx       fuentes, manifest, service worker
  page.tsx         home
  globals.css
components/
  Header.tsx       fecha + barra de progreso del día
  HabitList.tsx    lista con stagger
  HabitCard.tsx    tarjeta de hábito
  MarkCircle.tsx   círculo con halo + checkmark
  StreakFlame.tsx  flame con glow + número con flip
  WeekPills.tsx    L M M J V S D
  SWRegister.tsx   registro del service worker
lib/
  store.ts         Zustand + localStorage
  date.ts          streak math
  types.ts
public/
  manifest.json
  sw.js
  icons/icon.svg
```

## Animaciones que ya están vivas
- Círculo: fill azul + halo ripple en 300–400ms
- Checkmark: scale 0→1 con bounce
- Flame: scale + glow continuo cuando hay racha
- Racha: número entra rotando (flip 3D)
- Pastilla del día: fill + checkmark con bounce
- Barra de progreso: spring suave
- Lista: stagger reveal al cargar
- Tap: scale 0.92 con spring

## Próximos pasos (si quieres)
- Crear hábito (modal + confetti)
- Eliminar (shake + slide out + toast)
- Notificaciones push (backend + VAPID)
- Sincronización entre dispositivos
