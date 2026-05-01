const CACHE_VERSION = "yoyo-study-2026-05-01-v1";
const CORE_CACHE = `${CACHE_VERSION}-core`;
const AUDIO_CACHE = `${CACHE_VERSION}-audio`;

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./game.js",
  "./audio/audio-config.js",
  "./audio-manifest.json",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith("yoyo-study-") && !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

async function cacheAudioForOffline() {
  const manifestResponse = await fetch("./audio-manifest.json", { cache: "no-store" });
  const manifest = await manifestResponse.json();
  const files = Array.isArray(manifest.files) ? manifest.files : [];
  const cache = await caches.open(AUDIO_CACHE);
  let done = 0;

  for (const file of files) {
    const url = new URL(file, self.registration.scope).href;
    const cached = await cache.match(url);
    if (!cached) {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
      }
    }
    done += 1;
    if (done === files.length || done % 50 === 0) {
      postOfflineMessage({ type: "OFFLINE_PROGRESS", done, total: files.length });
    }
  }

  postOfflineMessage({ type: "OFFLINE_READY", done, total: files.length });
}

async function postOfflineMessage(message) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: "window" });
  clients.forEach((client) => client.postMessage(message));
}

self.addEventListener("message", (event) => {
  if (event.data?.type !== "CACHE_AUDIO") return;
  event.waitUntil(
    cacheAudioForOffline().catch((error) => {
      console.warn("Offline audio cache failed", error);
      postOfflineMessage({ type: "OFFLINE_ERROR" });
    })
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CORE_CACHE).then((cache) => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        const copy = response.clone();
        const cacheName = url.pathname.endsWith(".mp3") ? AUDIO_CACHE : CORE_CACHE;
        caches.open(cacheName).then((cache) => cache.put(request, copy));
        return response;
      });
    })
  );
});
