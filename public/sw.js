const CACHE_NAME = "slj-shell-v2";
const APP_SHELL = ["/", "/offline", "/manifest.webmanifest"];

function updateUnreadBadge(value) {
  const count = typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  const badges = self.navigator;
  const operation = count > 0 ? badges.setAppBadge?.(count) : badges.clearAppBadge?.();
  return Promise.resolve(operation).catch(() => {});
}

function notificationUrl(value) {
  const fallback = new URL("/notifications", self.location.origin);
  try {
    const target = new URL(value || "/notifications", self.location.origin);
    return target.origin === fallback.origin && ["https:", "http:"].includes(target.protocol) && !target.username && !target.password ? target.href : fallback.href;
  } catch { return fallback.href; }
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("slj-shell-") && key !== CACHE_NAME).map((key) => caches.delete(key))))
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
    data: { url: notificationUrl(payload.url) },
    tag: payload.tag || "slj-reminder",
  });

  // The Badging API belongs to WorkerNavigator; zero clears an existing badge.
  event.waitUntil(notificationPromise.then(() => updateUnreadBadge(payload.badgeCount)));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Jangan clear badge buta — biarkan halaman yang menghitung unread sebenarnya
  // (badge mungkin masih berisi notif lain yang belum dibaca).
  const targetUrl = notificationUrl(event.notification.data?.url);

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
    event.waitUntil(updateUnreadBadge(event.data.count));
  }
});
