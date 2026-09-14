// Public release pages-0807693ebfee669c
/* The public library, kept on the iPad.

   The parent's words were: the iPad should work offline, and a download that
   was interrupted should carry on rather than start again, because starting
   again every time wastes a lot of time. About 108 MB of pictures and
   original-voice recordings is a long wait on a phone tether; losing it and
   repeating it is the thing to fix.

   So this worker keeps a VERIFIED STORE rather than a pile of whatever
   happened to be fetched.

     the manifest      offline-manifest.json lists every public file with its
                       SHA256 and its exact byte length
     the content store one stable cache, keyed by the hash of the bytes, so a
                       file that has not changed between two releases is
                       already there and is never fetched again
     the state         one small record saying which release is completely
                       saved, and which files of the release being saved are
                       done

   Three consequences follow, and they are the whole point.

   RESUME IS FREE. A completed file is a hash key in the store. Closing the
   tab, killing the worker, updating the app or coming back tomorrow does not
   change that; the next run simply skips every hash it already holds. This is
   FILE-level resume: a small file that was cut off part way through is thrown
   away and fetched again from the start. It is not HTTP byte-range resume,
   and this file does not pretend otherwise.

   A NEW RELEASE COSTS ONLY WHAT CHANGED. Files are addressed by hash, so a
   release that edits one page re-fetches one page.

   AND FINISHING IS ATOMIC. Downloading writes new hashes beside the old ones
   and never over them, so the release that was last completely verified stays
   whole and readable the entire time its replacement is being fetched. Only
   when every single file of the new release is present and verified does one
   small write move `ready` across.

   What this worker will not do:

     - report Offline ready for anything less than every manifest entry,
       verified by hash AND byte length. Not an HTTP 200, not a count of
       attempts, not a stale number from last time
     - keep a file whose bytes hash differently from the manifest, arrive as a
       404 or an opaque response, or stop short of the declared length
     - delete the older yoyo-study caches, localStorage or IndexedDB. They are
       read, and byte-identical files in them are reused instead of downloaded
     - promise that a download keeps running after Safari suspends or the app
       is closed. It stops, and the completed files are still there when the
       parent comes back and presses Resume
     - put a partial 206 into a cache, or hand a page an audio response the
       browser did not give it */

const STORE = "yoyo-pages-content";
const STATE = "yoyo-pages-state";
const RUNTIME = "yoyo-pages-runtime";
const STATE_URL = "__yoyo-offline-state.json";
const MANIFEST_URL = "offline-manifest.json";
const SCHEMA = 1;

/* how long an ordinary page load waits for the network before falling back to
   what is saved: a slow tether must not leave a child looking at nothing */
const NETWORK_TIMEOUT = 2500;

const scope = () => self.registration.scope;
const absolute = (url) => new URL(url, scope()).href;

/* The manifest's own way of naming a file: same-origin, relative to the
   scope, no query and no fragment. A request for "picnic.html?v=3" and one
   for "./picnic.html" are the same file, and the site root is index.html.
   Anything outside the scope has no manifest name at all. */
function manifestKey(url) {
  let here;
  try { here = new URL(url, scope()); } catch (_) { return null; }
  const base = new URL(scope());
  if (here.origin !== base.origin) return null;
  if (!here.pathname.startsWith(base.pathname)) return null;
  let name = here.pathname.slice(base.pathname.length);
  if (name.startsWith("/")) name = name.slice(1);
  if (name === "" || name.endsWith("/")) name += "index.html";
  return name;
}

const contentKey = (sha) => absolute(`__yoyo-offline/${sha}`);

/* ------------------------------------------------------------------ */
/* the small record that survives everything                           */
/* ------------------------------------------------------------------ */

/* It lives in its own cache rather than in localStorage or IndexedDB, because
   the worker can reach it with no page open and because the parent's own
   records must not be touched. It is deliberately tiny: two maps of file name
   to hash, and the version each belongs to. */
const emptyState = () => ({
  schema: SCHEMA,
  /* the release that is completely present and verified, and what it is made
     of. This is what the site is served from when there is no network. */
  ready: null,
  readyFiles: {},
  /* the release being fetched now, and the files of it already verified */
  pending: null,
  pendingFiles: {},
  /* what the last run ended as, so the panel can say something true */
  phase: "idle",
  error: ""
});

let memory = null;
let stateRevision = 0;
let inspection = 0;

async function loadState() {
  if (memory) return memory;
  try {
    const cache = await caches.open(STATE);
    const saved = await cache.match(absolute(STATE_URL));
    if (saved) {
      const value = await saved.json();
      if (value && value.schema === SCHEMA) {
        memory = Object.assign(emptyState(), value);
        /* A run that was going when the app was killed is not going now.
           Read back as "downloading" it would leave Resume switched off for
           ever, which is the opposite of what this whole file is for. */
        if (!job && (memory.phase === "downloading" || memory.phase === "checking")) {
          memory.phase = memory.ready ? "ready" : "paused";
        }
        return memory;
      }
    }
  } catch (_) { /* unreadable storage is not a reason to break the site */ }
  memory = emptyState();
  return memory;
}

/* The record is committed to memory only when it really reached storage. An
   iPad that refused the write has not saved anything, and a worker that
   remembered "ready" anyway would tell the parent the library is on the
   device when the next launch will find it is not. */
async function saveState(next) {
  try {
    const cache = await caches.open(STATE);
    await cache.put(absolute(STATE_URL),
      new Response(JSON.stringify(next), { headers: { "Content-Type": "application/json" } }));
    memory = next;
    stateRevision++;
    return true;
  } catch (_) {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* hashing, which is what makes "saved" mean something                 */
/* ------------------------------------------------------------------ */

const HEX = "0123456789abcdef";

async function sha256(buffer) {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  const bytes = new Uint8Array(digest);
  let out = "";
  for (let i = 0; i < bytes.length; i += 1) {
    out += HEX[bytes[i] >> 4] + HEX[bytes[i] & 15];
  }
  return out;
}

/* A file counts as this manifest entry only if it is exactly the declared
   length AND hashes to the declared digest. Either one alone is not enough:
   length catches a truncated body cheaply, and the hash catches everything
   else, including a proxy's helpful error page arriving with status 200. */
async function verifies(buffer, entry) {
  if (!buffer || buffer.byteLength !== entry.bytes) return false;
  return (await sha256(buffer)) === entry.sha256;
}

/* ------------------------------------------------------------------ */
/* saying what is happening                                            */
/* ------------------------------------------------------------------ */

let job = null;          /* the transfer in flight, if any */
let stopping = false;    /* Pause: finish the file in hand, then stop */

function progressOf(state, manifest) {
  const files = manifest ? manifest.files : [];
  const done = files.filter((file) => state.pendingFiles[file.url] === file.sha256);
  const bytesDone = done.reduce((n, file) => n + file.bytes, 0);
  const bytesTotal = files.reduce((n, file) => n + file.bytes, 0);
  return { done: done.length, total: files.length, bytesDone, bytesTotal };
}

/* A hash-shaped key is only a name. Check the bytes before presenting a
   saved count, including after an app restart or a storage eviction. */
async function heldNow(state, manifest) {
  const wanted = Object.values(state.readyFiles || {});
  const valid = new Set();
  const sizes = new Map();
  const expected = new Map((manifest ? manifest.files : []).map(file => [file.sha256, file.bytes]));
  const hashes = new Set([...wanted, ...Object.values(state.pendingFiles || {}), ...expected.keys()]);
  try {
    const store = await caches.open(STORE);
    for (const hash of hashes) {
      try {
        const response = await store.match(contentKey(hash));
        if (!response || response.status !== 200) continue;
        const bytes = await response.arrayBuffer();
        if (expected.has(hash) && bytes.byteLength !== expected.get(hash)) continue;
        if (await sha256(bytes) !== hash) continue;
        valid.add(hash);
        sizes.set(hash, bytes.byteLength);
      } catch (_) { /* An unreadable file needs repair, not a ready label. */ }
    }
  } catch (_) { /* Storage can be refused without breaking online reading. */ }
  const held = wanted.filter(hash => valid.has(hash)).length;
  return { held, wanted: wanted.length, whole: wanted.length > 0 && held === wanted.length, valid, sizes };
}

async function inspectAndReport(manifest, checked, token) {
  if (token !== inspection) return;
  const revision = stateRevision;
  const state = await loadState();
  const held = await heldNow(state, manifest);
  // A slow inspection must not overwrite newer transfer progress or completion.
  if (token !== inspection || revision !== stateRevision) return;
  const files = manifest ? manifest.files : Object.entries(state.readyFiles).map(([url, sha256]) => ({ url, sha256, bytes: held.sizes.get(sha256) || 0 }));
  const available = files.filter(file => held.valid.has(file.sha256));
  const missing = files.filter(file => !held.valid.has(file.sha256));
  const intact = Boolean(state.ready) && held.whole;
  const current = intact && (!manifest || state.ready === manifest.version) && missing.length === 0;
  let phase = state.phase;
  if (!job && state.ready && !current) phase = intact ? "update" : "paused";
  await report({
    phase, ready: current, release: manifest ? manifest.version : state.pending || state.ready,
    done: available.length, total: files.length,
    bytesDone: available.reduce((n, file) => n + file.bytes, 0),
    bytesTotal: files.reduce((n, file) => n + file.bytes, 0),
    evicted: state.ready ? held.wanted - held.held : 0,
    checked, upToDate: current,
    missing: missing.length, missingBytes: missing.reduce((n, file) => n + file.bytes, 0)
  });
}

async function report(extra) {
  const state = await loadState();
  const message = Object.assign({
    type: "OFFLINE_STATE",
    schema: SCHEMA,
    phase: state.phase,
    ready: Boolean(state.ready),
    savedRelease: state.ready,
    release: state.pending || state.ready,
    done: 0, total: 0, bytesDone: 0, bytesTotal: 0,
    running: Boolean(job),
    error: state.error || ""
  }, extra || {});
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: "window" });
  clients.forEach((client) => client.postMessage(message));
  return message;
}

/* ------------------------------------------------------------------ */
/* finding a file without asking the network                           */
/* ------------------------------------------------------------------ */

/* Every cache this origin has ever written, including the development
   worker's. They are READ, never deleted: a picture the child already has is
   a picture nobody should download twice. Nothing is trusted for being there
   - whatever is found is hashed against the manifest like anything else. */
async function borrowBytes(entry) {
  let names = [];
  try { names = await caches.keys(); } catch (_) { return null; }
  const url = absolute(entry.url);
  for (const name of names) {
    if (name === STATE) continue;
    let hit = null;
    try {
      const cache = await caches.open(name);
      hit = await cache.match(url) || await cache.match(entry.url);
    } catch (_) { continue; }
    if (!hit || hit.status !== 200) continue;
    let buffer = null;
    try { buffer = await hit.arrayBuffer(); } catch (_) { continue; }
    if (await verifies(buffer, entry)) return buffer;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* the transfer                                                        */
/* ------------------------------------------------------------------ */

async function readManifest() {
  const response = await fetch(absolute(MANIFEST_URL), { cache: "no-store" });
  if (!response || !response.ok) throw new Error("manifest-unavailable");
  const manifest = await response.json();
  if (!manifest || typeof manifest.version !== "string" || !Array.isArray(manifest.files)) {
    throw new Error("manifest-unreadable");
  }
  manifest.files.forEach((file) => {
    if (typeof file.url !== "string" || !/^[0-9a-f]{64}$/.test(file.sha256 || "")
      || !Number.isInteger(file.bytes) || file.bytes < 0) {
      throw new Error("manifest-unreadable");
    }
    /* THE NAME HAS TO BE A PLAIN RELATIVE FILE, and it is checked before one
       byte is fetched. An absolute URL, a leading slash, a "..", a backslash
       or a query all mean the list is not the list this worker was built to
       read - and a worker that starts downloading from a list it does not
       understand is a worker fetching somebody else's URLs. */
    if (file.url === "" || /^[a-z][a-z0-9+.-]*:/i.test(file.url) || file.url.startsWith("/")
      || file.url.startsWith("//") || /[?#\\]/.test(file.url)
      || file.url.split("/").some((part) => part === "." || part === "..")) {
      throw new Error("manifest-unsafe");
    }
  });
  const names = manifest.files.map((file) => file.url);
  if (new Set(names).size !== names.length) throw new Error("manifest-unsafe");
  return manifest;
}

/* One file: already held, borrowed from an older cache, or fetched. It is
   written under its own hash, so writing it can never damage the release the
   child is currently able to read. */
async function saveOne(store, entry) {
  const key = contentKey(entry.sha256);
  /* A key named after a hash is a NAME. Storage can be corrupted, evicted or
     written by an older build, so what is under the name is read back and
     hashed before it is called saved. This costs local work on a deliberate
     press and no network at all, which is the trade this whole file exists
     to make. */
  try {
    const held = await store.match(key);
    if (held) {
      const bytes = await held.arrayBuffer();
      if (await verifies(bytes, entry)) return "held";
      await store.delete(key);
    }
  } catch (_) { /* fall through and fetch */ }

  let buffer = await borrowBytes(entry);
  let reused = Boolean(buffer);

  if (!buffer) {
    let response;
    try {
      response = await fetch(absolute(entry.url), { cache: "no-store" });
    } catch (_) {
      return "network";
    }
    /* A 404, a redirect to a login page, an opaque cross-origin answer or a
       206 from a media cache are all "not this file". None of them is
       allowed to become a completed file. */
    if (!response || response.type === "opaque" || response.status !== 200) return "http";
    try { buffer = await response.arrayBuffer(); } catch (_) { return "network"; }
  }

  if (!(await verifies(buffer, entry))) return "corrupt";

  try {
    await store.put(key, new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType(entry.url),
        "Content-Length": String(entry.bytes),
        "X-Yoyo-Sha256": entry.sha256
      }
    }));
  } catch (_) {
    /* Out of room, or storage refused. This is not a saved file. */
    return "storage";
  }
  return reused ? "reused" : "fetched";
}

const TYPES = {
  html: "text/html; charset=utf-8", css: "text/css; charset=utf-8",
  js: "text/javascript; charset=utf-8", json: "application/json",
  mp3: "audio/mpeg", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  svg: "image/svg+xml", webmanifest: "application/manifest+json"
};
const contentType = (url) => TYPES[(url.split(".").pop() || "").toLowerCase()] || "application/octet-stream";

/* The whole run. It can be paused, it can fail, and either way what it has
   already verified stays verified. */
async function transfer() {
  let state = await loadState();
  state.phase = "checking";
  state.error = "";
  await saveState(state);
  await report({ phase: "checking" });

  let manifest;
  try {
    manifest = await readManifest();
  } catch (error) {
    state = await loadState();
    state.phase = "error";
    state.error = String(error.message || error);
    await saveState(state);
    await report({ phase: "error", error: state.error });
    return;
  }

  state = await loadState();
  /* A different release than the one we were part way through: keep the
     completed hashes, because most of them are still wanted, and start
     counting against the new list. */
  if (state.pending !== manifest.version) {
    state.pending = manifest.version;
    state.pendingFiles = {};
    /* anything the finished release already holds counts immediately */
    manifest.files.forEach((file) => {
      if (state.readyFiles[file.url] === file.sha256) state.pendingFiles[file.url] = file.sha256;
    });
  }
  await saveState(state);

  let store;
  try {
    store = await caches.open(STORE);
  } catch (_) {
    state.phase = "error";
    state.error = "storage";
    await saveState(state);
    await report({ phase: "error", error: "storage" });
    return;
  }

  state.phase = "downloading";
  await saveState(state);
  const at = () => progressOf(state, manifest);
  await report(Object.assign({ phase: "downloading" }, at()));

  let failures = 0;
  let lastError = "";
  const failedHere = (outcome) => { failures += 1; lastError = outcome; };
  for (const entry of manifest.files) {
    if (stopping) break;
    if (state.pendingFiles[entry.url] === entry.sha256) {
      /* Recorded as done in an earlier run - which is a note, not the file.
         saveOne reads the bytes back and hashes them, so an evicted or
         damaged file is repaired here rather than believed. */
      const still = await saveOne(store, entry);
      if (still === "held") continue;
      delete state.pendingFiles[entry.url];
      if (still === "reused" || still === "fetched") {
        state.pendingFiles[entry.url] = entry.sha256;
        await saveState(state);
        continue;
      }
      failedHere(still);
      continue;
    }

    const outcome = await saveOne(store, entry);
    if (outcome === "held" || outcome === "reused" || outcome === "fetched") {
      state.pendingFiles[entry.url] = entry.sha256;
      /* Written after every file, so an interruption at any moment loses at
         most the one file that was in flight. */
      await saveState(state);
      const now = at();
      if (now.done === now.total || now.done % 10 === 0) {
        await report(Object.assign({ phase: "downloading" }, now));
      }
    } else {
      failedHere(outcome);
      if (outcome === "storage") break;
    }
  }

  state = await loadState();
  const finished = at();
  const complete = manifest.files.every((file) => state.pendingFiles[file.url] === file.sha256);

  if (complete) {
    /* ONE WRITE, and the new release is the one the site is served from. Up
       to this line the previous release was whole and readable, and if the
       write is refused nothing here calls itself ready - not on screen and
       not in memory for the next status request either. */
    const done = Object.assign({}, state, {
      ready: manifest.version,
      readyFiles: Object.assign({}, state.pendingFiles),
      phase: "ready",
      error: ""
    });
    const wrote = await saveState(done);
    if (wrote) {
      await report(Object.assign({ phase: "ready", ready: true }, finished));
      prune(store, done).catch(() => {});
      return;
    }
    state.phase = "error";
    state.error = "storage";
    await report(Object.assign({ phase: "error", ready: Boolean(state.ready),
      error: "storage" }, finished));
    return;
  }

  state.phase = stopping ? "paused" : (failures ? "error" : "paused");
  state.error = failures ? lastError : "";
  await saveState(state);
  await report(Object.assign({ phase: state.phase, error: state.error }, finished));
}

/* Hashes nothing currently wants. Only ever run after a successful swap, and
   only for keys that neither the finished release nor the one being fetched
   refers to, so it can never take a file out from under a reader. */
async function prune(store, state) {
  const wanted = new Set();
  Object.values(state.readyFiles).forEach((sha) => wanted.add(contentKey(sha)));
  Object.values(state.pendingFiles).forEach((sha) => wanted.add(contentKey(sha)));
  let keys = [];
  try { keys = await store.keys(); } catch (_) { return; }
  for (const key of keys) {
    const url = typeof key === "string" ? key : key.url;
    if (!wanted.has(url)) {
      try { await store.delete(key); } catch (_) { /* leaving it is harmless */ }
    }
  }
}

/* Clicks coalesce. Two taps, two tabs or a tap during a run all join the run
   that is already going rather than starting a second one against the same
   store. */
function startTransfer() {
  if (job) return job;
  stopping = false;
  job = transfer()
    .catch(async (error) => {
      const state = await loadState();
      state.phase = "error";
      state.error = String((error && error.message) || error);
      await saveState(state);
      await report({ phase: "error", error: state.error });
    })
    .finally(() => { job = null; });
  return job;
}

/* ------------------------------------------------------------------ */
/* answering the page                                                  */
/* ------------------------------------------------------------------ */

/* What is saved for this file, if anything: the finished release first,
   because that is the one that is complete. */
async function savedResponse(name) {
  const state = await loadState();
  const sha = state.readyFiles[name] || (state.ready ? null : state.pendingFiles[name]);
  if (!sha) return null;
  try {
    const store = await caches.open(STORE);
    return (await store.match(contentKey(sha))) || null;
  } catch (_) {
    return null;
  }
}

/* A Range request against a file we hold whole. The browser asks for one when
   it seeks in an MP3; answering it from the full bytes is the difference
   between audio that plays offline and audio that does not. An unsatisfiable
   range gets the answer the specification asks for rather than silence. */
async function rangeFrom(response, header) {
  const buffer = await response.arrayBuffer();
  const size = buffer.byteLength;
  const match = /^bytes=(\d*)-(\d*)$/.exec(String(header).trim());
  if (!match) return new Response(buffer, { status: 200, headers: response.headers });
  let start = match[1] === "" ? null : Number(match[1]);
  let end = match[2] === "" ? null : Number(match[2]);
  if (start === null && end === null) return new Response(buffer, { status: 200 });
  if (start === null) { start = Math.max(0, size - end); end = size - 1; }
  if (end === null || end >= size) end = size - 1;
  if (!Number.isFinite(start) || start > end || start >= size) {
    return new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${size}` }
    });
  }
  const slice = buffer.slice(start, end + 1);
  return new Response(slice, {
    status: 206,
    statusText: "Partial Content",
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "audio/mpeg",
      "Content-Length": String(slice.byteLength),
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Accept-Ranges": "bytes"
    }
  });
}

const NOT_SAVED = (name) => new Response(
  `<!doctype html><html lang="en-GB"><head><meta charset="utf-8">`
  + `<meta name="viewport" content="width=device-width, initial-scale=1">`
  + `<title>Not saved for offline reading</title></head><body>`
  + `<h1>This page is not saved yet</h1>`
  + `<p>${name} has not been saved on this iPad. Connect to the internet, open the`
  + ` library and use <strong>Save the books for offline reading</strong>.</p>`
  + `<p><a href="./index.html">Back to the library</a></p></body></html>`,
  { status: 503, statusText: "Offline and not saved", headers: { "Content-Type": "text/html; charset=utf-8" } }
);

/* Fresh first for the things that decide which version of the app is running,
   so an ordinary reload really does replace the old public site rather than
   leaving its shell in place. Pictures and recordings come from what is saved
   first, because they are large and they never change without a new hash. */
const CODE = /\.(?:html|js|css|json|webmanifest)$/;

async function handle(request) {
  const name = manifestKey(request.url);
  if (!name) return fetch(request);

  const range = request.headers && request.headers.get ? request.headers.get("range") : null;
  const wantsFresh = request.mode === "navigate" || CODE.test(name);

  if (wantsFresh) {
    const network = fetch(request).catch(() => null);
    let timer = 0;
    const patience = new Promise((resolve) => { timer = setTimeout(() => resolve(null), NETWORK_TIMEOUT); });
    let live = null;
    try { live = await Promise.race([network, patience]); } finally { clearTimeout(timer); }
    if (live && live.ok) {
      /* Ordinary browsing keeps its own small cache. It is never the verified
         store: nothing browsed can make the library claim to be saved. */
      if (live.status === 200) keepRuntime(request, live.clone());
      return live;
    }
    const saved = await savedResponse(name);
    if (saved) return saved.clone();
    const spare = await fromRuntime(request);
    if (spare) return spare;
    /* A page nobody saved, and no page from the network either. A navigation
       gets a page that NAMES the route it could not open - never another
       route's HTML, and never a bare error body that leaves a child looking
       at somebody else's 404. */
    if (request.mode === "navigate" || name.endsWith(".html")) return NOT_SAVED(name);
    const late = await network;
    if (late) return late;
    return new Response("", { status: 503, statusText: "Offline and not saved" });
  }

  const saved = await savedResponse(name);
  if (saved) return range ? rangeFrom(saved.clone(), range) : saved.clone();
  const spare = await fromRuntime(request);
  if (spare && !range) return spare;

  let response;
  try {
    response = await fetch(request);
  } catch (_) {
    return new Response("", { status: 503, statusText: "Offline and not saved" });
  }
  /* THE 206 RULE. Chrome's media cache can answer a plain request with a
     partial response. Cache.put rejects those, and the incident that taught
     us this is one where the rejection threw away audio the child could have
     heard. It is returned exactly as it came, and nothing tries to save it. */
  if (response.status === 200) keepRuntime(request, response.clone());
  return response;
}

function keepRuntime(request, response) {
  /* Optional, and never allowed to break reading if it fails. */
  caches.open(RUNTIME)
    .then((cache) => cache.put(request, response))
    .catch(() => {});
}

async function fromRuntime(request) {
  try {
    const cache = await caches.open(RUNTIME);
    return (await cache.match(request)) || null;
  } catch (_) {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* the worker's own life                                               */
/* ------------------------------------------------------------------ */

/* Installing does not download the library. A 108 MB transfer is something a
   parent chooses, on a connection they chose, not something that starts
   because a page was opened. */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

/* Activating deletes nothing. The older yoyo-study caches hold files this
   library can reuse, and they are not this worker's to throw away. */
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  if (new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(handle(request));
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "SKIP_WAITING") { self.skipWaiting(); return; }

  if (data.type === "OFFLINE_START") {
    event.waitUntil(startTransfer());
    return;
  }
  if (data.type === "OFFLINE_PAUSE") {
    stopping = true;
    event.waitUntil((async () => {
      const state = await loadState();
      if (!job) { state.phase = state.ready ? "ready" : "paused"; await saveState(state); }
      await report({ phase: state.phase });
    })());
    return;
  }
  if (data.type === "OFFLINE_CHECK") {
    /* What a new release would cost, without starting it. */
    const token = ++inspection;
    event.waitUntil((async () => {
      let manifest;
      try {
        manifest = await readManifest();
      } catch (error) {
        if (token === inspection) await report({ phase: "error", error: String(error.message || error) });
        return;
      }
      await inspectAndReport(manifest, true, token);
    })());
    return;
  }
  if (data.type === "OFFLINE_STATUS") {
    const token = ++inspection;
    event.waitUntil((async () => {
      let manifest = null;
      try { manifest = await readManifest(); } catch (_) { manifest = null; }
      await inspectAndReport(manifest, false, token);
    })());
  }
});

/* Read by the author tests, which drive this file rather than a copy of it. */
self.__yoyoPagesOffline = {
  STORE, STATE, RUNTIME, SCHEMA, MANIFEST_URL, STATE_URL,
  manifestKey, contentKey, sha256, verifies, loadState, saveState,
  startTransfer, readManifest, savedResponse, rangeFrom,
  reset() { memory = null; job = null; stopping = false; },
  get running() { return Boolean(job); }
};
