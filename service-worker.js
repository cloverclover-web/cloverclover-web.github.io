const CACHE_VERSION = "yoyo-study-2026-05-01-v2";
const CORE_CACHE = `${CACHE_VERSION}-core`;
const AUDIO_CACHE = "yoyo-study-audio-v1";

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
          .filter((key) => key.startsWith("yoyo-study-") && key !== CORE_CACHE && !isAudioCacheName(key))
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

function isAudioCacheName(key) {
  return key === AUDIO_CACHE || key.endsWith("-audio");
}

async function findCachedAudio(request, primaryCache) {
  const primaryMatch = await primaryCache.match(request);
  if (primaryMatch) return primaryMatch;

  const keys = await caches.keys();
  const legacyAudioNames = keys.filter((key) => isAudioCacheName(key) && key !== AUDIO_CACHE);
  for (const cacheName of legacyAudioNames) {
    const legacyCache = await caches.open(cacheName);
    const legacyMatch = await legacyCache.match(request);
    if (legacyMatch) return legacyMatch;
  }
  return null;
}

async function cacheAudioForOffline() {
  const manifestResponse = await fetch("./audio-manifest.json", { cache: "no-store" });
  const manifest = await manifestResponse.json();
  const files = Array.isArray(manifest.files) ? manifest.files : [];
  const cache = await caches.open(AUDIO_CACHE);
  let done = 0;
  let downloaded = 0;

  for (const file of files) {
    const url = new URL(file, self.registration.scope).href;
    const request = new Request(url);
    const cached = await findCachedAudio(request, cache);
    if (!cached) {
      const response = await fetch(request);
      if (response.ok) {
        await cache.put(request, response);
        downloaded += 1;
      }
    } else {
      await cache.put(request, cached.clone());
    }
    done += 1;
    if (done === files.length || done % 50 === 0) {
      postOfflineMessage({ type: "OFFLINE_PROGRESS", done, total: files.length, downloaded });
    }
  }

  postOfflineMessage({ type: "OFFLINE_READY", done, total: files.length, downloaded });
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
