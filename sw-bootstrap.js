/* Keeping the app up to date.

   This file is deliberately tiny, dependency free and loaded before anything
   else. If story.js or game.js is ever served from a stale cache, this script
   still runs and still asks for a new worker, so the app can always replace
   itself. It is registered with updateViaCache "none" so the browser fetches
   service-worker.js from the network rather than from its own HTTP cache,
   which is what let a very old story-data.js survive an ordinary reload.

   Nothing here ever reloads the page while the child is in the middle of
   something. The app publishes window.__yoyoBusy(); if it says the child is
   drawing, answering or listening, the refresh waits until they are not. */

(function () {
  "use strict";
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  if (window.__yoyoUpdater) return;

  var HOURLY = 60 * 60 * 1000;
  var registration = null;
  var updateReady = false;
  var refreshing = false;

  /* A page only gets refreshed under it when it can say it is idle. A page
     with no __yoyoBusy - the practice game, or a story.js from before this
     was added - never gets reloaded automatically, because there is no way to
     know the child is not in the middle of something. Those pages still pick
     up the new version on their next ordinary load, since the worker serves
     code and story data network-first. */
  function safeToRefresh() {
    if (typeof window.__yoyoBusy !== "function") return false;
    try {
      return !window.__yoyoBusy();
    } catch (error) {
      return false;
    }
  }

  /* The new worker calls skipWaiting and claims the page, which fires
     controllerchange. Reloading then is what swaps the old code for the new
     one - but only when the page has told us it is safe. */
  function refreshWhenFree() {
    if (refreshing) return;
    if (!safeToRefresh()) return;
    refreshing = true;
    window.location.reload();
  }

  function watch(worker) {
    if (!worker) return;
    worker.addEventListener("statechange", function () {
      if (worker.state === "installed" && navigator.serviceWorker.controller) {
        updateReady = true;
        window.__yoyoUpdateReady = true;
      }
    });
  }

  /* update() returns a promise, so being offline rejects rather than throws.
     Without the catch that surfaces as an unhandled rejection every hour. */
  function check() {
    if (!registration) return;
    try {
      const done = registration.update();
      if (done && typeof done.catch === "function") done.catch(function () {});
    } catch (error) { /* offline is fine */ }
  }

  navigator.serviceWorker.register("service-worker.js", { updateViaCache: "none" })
    .then(function (reg) {
      registration = reg;
      watch(reg.installing);
      watch(reg.waiting);
      reg.addEventListener("updatefound", function () { watch(reg.installing); });
      check();
      setInterval(check, HOURLY);
    })
    .catch(function () { /* the app still works without a worker */ });

  navigator.serviceWorker.addEventListener("controllerchange", refreshWhenFree);

  /* Coming back to the tab is the natural moment both to look for a new
     version and to apply one that arrived while the child was away. */
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) return;
    check();
    if (updateReady) refreshWhenFree();
  });

  window.__yoyoUpdater = {
    check: check,
    isUpdateReady: function () { return updateReady; },
    applyWhenFree: refreshWhenFree
  };
})();
