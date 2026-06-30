// Habitos Service Worker - PWA + Push Notifications
// v2: estrategia segura para evitar servir HTML viejo en lugar de JS/CSS
const CACHE = "habitos-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;

  // 1) Navegaciones (HTML): SIEMPRE red primero (nunca shell viejo).
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("/", copy));
          return res;
        })
        .catch(() => caches.match("/"))
    );
    return;
  }

  // 2) Assets hasheados de Next (inmutables): cache-first.
  if (url.pathname.startsWith("/_next/static")) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          })
      )
    );
    return;
  }

  // 3) Resto: red primero, caché solo como respaldo. NUNCA HTML para assets.
  event.respondWith(fetch(req).catch(() => caches.match(req)));
});

// ── Push notifications (iOS 16.4+ instalada como PWA) ────────────
self.addEventListener("push", (event) => {
  let data = { title: "Hábitos", body: "Recordatorio de tu hábito" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (_) {}

  const options = {
    body: data.body,
    icon: "/apple-touch-icon.png",
    badge: "/apple-touch-icon.png",
    vibrate: [80, 40, 80],
    tag: data.tag || "habit-reminder",
    data: data.url || "/",
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});
