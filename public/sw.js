// KANOY service worker — makes the site installable and usable offline.
// Pages: network-first (fresh when online; cached copy when offline or the network is slow),
// except in the installed phone/tablet app, which opens instantly on the saved copy while the
// fresh one is fetched for next time (see "Installed app" below).
// Build assets, fonts and icons: cache-first (their URLs are hashed or stable).
// Bump CACHE when this strategy changes; old caches are dropped on activate.
const CACHE = "kanoy-v1";
const NAV_TIMEOUT_MS = 2500;
const PRECACHE = [
  "/",
  "/calendario",
  "/manifest.webmanifest",
  "/favicon.png",
  "/icon-192.png",
  "/icon-512.png",
];

// ── Installed app ──
// The app tells this worker it runs as the installed phone/tablet app (the
// page knows its display mode; a worker doesn't). From then on, page loads
// are served from the saved copy at once — no white screen while the server
// answers — and refreshed in the background, so the next launch is current.
// On iOS the installed app has its own storage, so this never reaches Safari
// or a computer; on Android it only affects that phone. Saved pages hold no
// personal data (everything personal is fetched after the page opens).
const META = "kanoy-meta";
const APP_FLAG = "/__kanoy-app-mode";

self.addEventListener("message", (event) => {
  if (event.data?.type === "app-mode") {
    event.waitUntil(caches.open(META).then((c) => c.put(APP_FLAG, new Response("1"))));
  }
});

function isInstalledApp() {
  return caches
    .open(META)
    .then((c) => c.match(APP_FLAG))
    .then(Boolean);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE && k !== META).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

function isStatic(url) {
  return (
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/fonts/") ||
    /\.(png|webp|jpe?g|svg|ico|woff2)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  // Leave cross-origin requests and server functions (contact form etc.) alone.
  if (url.origin !== self.location.origin || url.pathname.startsWith("/_serverFn")) return;

  if (request.mode === "navigate") {
    // Fresh page when the network answers quickly; if it's slow (serverless
    // cold start, weak mobile signal) and we have a copy, show the copy after
    // NAV_TIMEOUT_MS instead of a blank screen — the network response still
    // lands in the cache for next time. Pages hold no personal data (the
    // calendar loads its data after the page opens), so caching them is safe.
    const network = fetch(request).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
      }
      return res;
    });
    event.waitUntil(network.catch(() => {}));
    event.respondWith(
      Promise.all([caches.match(request), isInstalledApp()]).then(([cached, app]) => {
        if (!cached) return network.catch(() => caches.match("/"));
        if (app) return cached; // installed app: open instantly, fresh copy lands for next time
        const slow = new Promise((resolve) => setTimeout(() => resolve(cached), NAV_TIMEOUT_MS));
        return Promise.race([network, slow]).catch(() => cached);
      }),
    );
    return;
  }

  if (isStatic(url)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return res;
          }),
      ),
    );
  }
});

// Calendar notifications (see src/server/push.ts): { title, body, url, tag }.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "KANOY", body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "KANOY", {
      body: data.body || "",
      tag: data.tag,
      renotify: Boolean(data.tag),
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: data.url || "/calendario" },
    }),
  );
});

// Tapping a notification focuses an open KANOY tab/app, or opens the calendar.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/calendario", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => w.url.startsWith(self.location.origin));
      if (open) {
        open.navigate(url);
        return open.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
