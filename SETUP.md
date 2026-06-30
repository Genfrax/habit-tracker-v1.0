# Configurar sincronización + notificaciones

Sigue esto **una sola vez**. Al final, tu iPhone y tu Mac compartirán los
mismos hábitos y recibirás notificaciones a la hora de cada hábito.

> **Importante sobre el despliegue:** arrastrar la carpeta a Netlify (drag &
> drop) **ya no sirve** para esta versión. Las notificaciones usan una función
> programada y la sincronización necesita variables de entorno; ambas requieren
> que Netlify **compile** el proyecto. Para eso hay que conectar el proyecto a
> **GitHub** (recomendado) o desplegar con la CLI de Netlify. Ver Paso 3.

---

## Paso 1 — Base de datos (Supabase)

1. Entra a https://supabase.com → **Start your project** → crea cuenta (gratis).
2. **New project**: ponle nombre (ej. `habitos`), una contraseña de base de
   datos (guárdala), región **East US** o **West US**. Crear.
3. Espera ~2 minutos a que termine de crearse.
4. Menú izquierdo → **SQL Editor** → **New query**.
5. Abre el archivo `supabase/schema.sql` de este proyecto, copia **todo** su
   contenido, pégalo y presiona **Run**. Debe decir "Success".
6. Menú izquierdo → **Settings** (engranaje) → **API**. Copia y guarda:
   - **Project URL** (ej. `https://abcd.supabase.co`)
   - **anon public** (clave larga)
   - **service_role** (clave larga, **secreta** — no la compartas)

---

## Paso 2 — Subir el código a GitHub

(Si ya tienes GitHub conectado, salta al Paso 3.)

1. Crea cuenta en https://github.com si no tienes.
2. Crea un repositorio nuevo (vacío) en https://github.com/new — ej. `habitos`.
3. En tu Mac, en la Terminal, dentro de la carpeta del proyecto:

```bash
cd "/Users/gena/Documents/APP HABITOS"
git init
git add .
git commit -m "Hábitos con sync y notificaciones"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/habitos.git
git push -u origin main
```

(Cambia `TU_USUARIO` por tu usuario de GitHub.)

---

## Paso 3 — Conectar Netlify a GitHub

1. En https://app.netlify.com → **Add new site** → **Import an existing project**.
2. Elige **GitHub** → autoriza → selecciona tu repo `habitos`.
3. Build command: `npm run build` · Publish directory: lo detecta solo. **Deploy**.

> Si ya tenías el sitio en Netlify por drag & drop, mejor crea uno nuevo desde
> GitHub y luego, si quieres, mueve el dominio.

---

## Paso 4 — Variables de entorno en Netlify

En tu sitio de Netlify → **Site configuration** → **Environment variables** →
**Add a variable** (una por una). Pega exactamente estas:

| Nombre | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | tu Project URL de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | tu clave **anon public** |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `BLz46-_KFCMVVU3lsI3lSzLML5yaWe7Vtmxyj29SRFvfcFrfXTHUGTM7NC-E4rAHH-YthAxkpJDUCe3T1vSuJUo` |
| `SUPABASE_SERVICE_ROLE_KEY` | tu clave **service_role** (secreta) |
| `VAPID_PUBLIC_KEY` | `BLz46-_KFCMVVU3lsI3lSzLML5yaWe7Vtmxyj29SRFvfcFrfXTHUGTM7NC-E4rAHH-YthAxkpJDUCe3T1vSuJUo` |
| `VAPID_PRIVATE_KEY` | (está en tu archivo `.env.local`, línea `VAPID_PRIVATE_KEY`) |
| `VAPID_SUBJECT` | `mailto:genaro.escobar.martinez@gmail.com` |

> La llave privada no se sube a GitHub por seguridad. Ábrela en tu Mac:
> el archivo `.env.local` en la carpeta del proyecto.

Luego **Deploys** → **Trigger deploy** → **Deploy site** para que tome las variables.

---

## Paso 5 — Vincular tus dispositivos

1. Abre la app en tu **Mac** → toca el **engranaje** (arriba a la derecha).
2. Verás **Tu código** (ej. `K7P2-9QXM`). Cópialo.
3. Abre la app en tu **iPhone** (desde el ícono en la pantalla de inicio).
4. Toca el engranaje → en **Vincular este dispositivo a otro**, escribe el
   código de la Mac → **Vincular**. La app se recarga y ya ven lo mismo.

> A partir de aquí, lo que marques en uno aparece en el otro en segundos.

---

## Paso 6 — Activar notificaciones (iPhone)

1. En el iPhone, abre la app **desde el ícono de la pantalla de inicio**
   (NO desde Safari — iOS solo permite notificaciones a la app instalada).
2. Toca el engranaje → **Activar notificaciones** → acepta el permiso.
3. Listo. A la hora que pusiste en cada hábito recibirás el recordatorio
   (solo si ese día toca y aún no lo marcaste).

Repite el Paso 6 en la Mac si también quieres avisos ahí.

---

## Cómo saber que funciona

- **Sync:** marca un hábito en la Mac → en segundos cambia en el iPhone.
- **Notificación de prueba:** crea un hábito con hora 1–2 minutos en el futuro,
  no lo marques, y espera. Debe llegar el aviso.

## Notas
- La función de recordatorios corre cada minuto en Netlify (dentro del plan
  gratuito).
- El código de sincronización es tu "llave". Quien lo tenga ve tus hábitos;
  guárdalo en privado.
