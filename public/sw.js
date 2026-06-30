// Habitos Service Worker - PWA + Push Notifications
const CACHE = "habitos-v1";
const CORE = ["/", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).catch(() => caches.match("/")))
  );
});

// Push notifications (iOS 16.4+ when installed as PWA)
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
