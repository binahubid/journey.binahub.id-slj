const CACHE_NAME = "slj-shell-v1";
const APP_SHELL = ["/", "/login", "/offline", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || !event.request.url.startsWith(self.location.origin)) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match(event.request);
        return cached || caches.match("/offline");
      })
    );
  }
});

self.addEventListener("push", (event) => {
  const fallback = {
    title: "Spiritual Leadership Journey",
    body: "Anda memiliki pengingat baru.",
    url: "/notifications",
    badgeCount: 1,
  };

  let payload = fallback;
  try {
    payload = { ...fallback, ...(event.data ? event.data.json() : {}) };
  } catch {
    payload.body = event.data?.text() || fallback.body;
  }

  const notificationPromise = self.registration.showNotification(payload.title, {
    body: payload.body,
    icon: "/icons/app-icon.webp",
    badge: "/icons/app-icon.webp",
    data: { url: payload.url || "/notifications" },
    tag: payload.tag || "slj-reminder",
  });

  // Set badge count (Chrome Android + iOS PWA 16.4+)
  // badgeCount dikirim Edge Function = jumlah unread sebenarnya.
  if (self.registration.setAppBadge) {
    const count = typeof payload.badgeCount === "number" && payload.badgeCount > 0 ? payload.badgeCount : 1;
    notificationPromise.then(() => self.registration.setAppBadge(count)).catch(() => {});
  }

  event.waitUntil(notificationPromise);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Jangan clear badge buta — biarkan halaman yang menghitung unread sebenarnya
  // (badge mungkin masih berisi notif lain yang belum dibaca).
  const targetUrl = new URL(event.notification.data?.url || "/notifications", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => client.url === targetUrl);
      if (existing) {
        existing.focus();
        existing.postMessage({ type: "SYNC_BADGE" });
        return;
      }
      return self.clients.openWindow(targetUrl).then((client) => {
        if (client) client.postMessage({ type: "SYNC_BADGE" });
      });
    })
  );
});

// Handle badge update messages from the main app
self.addEventListener("message", (event) => {
  if (event.data?.type === "UPDATE_BADGE") {
    const count = event.data.count || 0;
    if (self.registration.setAppBadge) {
      if (count > 0) {
        self.registration.setAppBadge(count).catch(() => {});
      } else {
        self.registration.clearAppBadge().catch(() => {});
      }
    }
  }
});
