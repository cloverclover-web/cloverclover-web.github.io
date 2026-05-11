const CACHE_VERSION = "yoyo-study-2026-05-01-v18";
const CORE_CACHE = `${CACHE_VERSION}-core`;
const AUDIO_CACHE = "yoyo-study-audio-v1";
const AUDIO_READY_URL = new URL("__offline-audio-ready.json", self.registration.scope).href;

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

function audioManifestSignature(manifest, files) {
  const source = `${manifest.version || ""}\n${files.join("\n")}`;
  let hash = 0x811c9dc5;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `${manifest.version || "none"}:${files.length}:${(hash >>> 0).toString(16)}`;
}

async function readAudioReadyMeta(cache) {
  const response = await cache.match(new Request(AUDIO_READY_URL));
  if (!response) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function writeAudioReadyMeta(cache, signature, total) {
  const body = JSON.stringify({
    signature,
    total,
    completedAt: new Date().toISOString()
  });
  await cache.put(new Request(AUDIO_READY_URL), new Response(body, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  }));
}

async function cacheAudioForOffline() {
  const manifestResponse = await fetch("./audio-manifest.json", { cache: "no-store" });
  const manifest = await manifestResponse.json();
  const files = Array.isArray(manifest.files) ? manifest.files : [];
  const cache = await caches.open(AUDIO_CACHE);
  const signature = audioManifestSignature(manifest, files);
  const readyMeta = await readAudioReadyMeta(cache);

  if (readyMeta?.signature === signature && readyMeta?.total === files.length) {
    postOfflineMessage({ type: "OFFLINE_READY", done: files.length, total: files.length, downloaded: 0, alreadyReady: true });
    return;
  }

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

  await writeAudioReadyMeta(cache, signature, files.length);
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
        const cacheName = url.pathname.endsWith(".mp3") || url.pathname.endsWith(".wav") ? AUDIO_CACHE : CORE_CACHE;
        caches.open(cacheName).then((cache) => cache.put(request, copy));
        return response;
      });
    })
  );
});
