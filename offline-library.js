/* Saving the books on the iPad: the grown-up's side of it.

   One folded panel at the foot of the library, and nothing else. It is folded
   because it is not for the child, and it is one panel because a 108 MB
   transfer needs exactly three answers - start it, stop it, and has anything
   changed - not a row of controls.

   Everything it says comes from the worker, which is the only thing that
   knows what is really saved. This file never decides that the library is
   ready, never counts files itself and never starts a transfer on its own: a
   download that large begins because a parent pressed a button on a
   connection they chose.

   It mounts inside section#offline-library and touches nothing else on the
   page. If there is no service worker, no section, or the worker never
   answers, the library still reads exactly as it did before. */

(function () {
  "use strict";

  var HOST = "offline-library";
  var host = document.getElementById(HOST);
  if (!host) return;

  /* ---------------- words ---------------- */

  var TEXT = {
    summary: "Save the books for offline reading",
    intro: "Save every page, picture and recording on this iPad so the books can be "
      + "read with no internet.",
    install: "On an iPad, add this page to the Home Screen first, open the books from "
      + "that icon, and then save them there. Safari and the Home Screen app keep "
      + "their own separate copies.",
    resume: "You can stop and come back. Files that finished stay finished, so "
      + "carrying on later only fetches what is still missing.",
    honest: "Saving stops if the iPad locks or the app is closed. Open it again and "
      + "press Resume to carry on from where it stopped.",
    start: "Save the books",
    resumeAction: "Resume saving",
    pause: "Pause",
    check: "Check for updates",
    keep: "Ask to keep these files",
    keepDone: "This iPad has been asked to keep the files.",
    keepRefused: "This iPad did not promise to keep the files. They are still saved, "
      + "but it may remove them if it runs short of room.",
    idle: "Not saved on this iPad yet.",
    checking: "Looking at what is needed…",
    ready: "Offline ready. Every page, picture and recording is saved and checked.",
    paused: "Paused. The finished files are kept.",
    working: "Saving…",
    upToDate: "Already up to date. Nothing new to fetch.",
    update: "An update is ready to fetch.",
    evicted: "This iPad has removed some of the saved files. Press Resume to fetch them again.",
    noWorker: "This browser cannot save the books for offline reading.",
    silent: "Waiting for the library to answer…"
  };

  var TROUBLE = {
    "manifest-unavailable": "Could not reach the library list. Check the connection and try again.",
    "manifest-unreadable": "The library list could not be read. Try again later.",
    network: "The connection dropped. The finished files are kept - press Resume to carry on.",
    http: "A file could not be fetched. The finished files are kept - press Resume to try again.",
    corrupt: "A file arrived damaged and was not kept. Press Resume to fetch it again.",
    storage: "This iPad would not store any more. Free some space, then press Resume."
  };

  /* ---------------- the panel ---------------- */

  function make(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  var panel = make("details", "offline-panel");
  var summary = make("summary", "offline-summary", TEXT.summary);
  var body = make("div", "offline-body");
  panel.appendChild(summary);
  panel.appendChild(body);

  body.appendChild(make("p", "offline-intro", TEXT.intro));
  body.appendChild(make("p", "offline-note", TEXT.install));
  body.appendChild(make("p", "offline-note", TEXT.resume));

  var status = make("p", "offline-status", TEXT.silent);
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  body.appendChild(status);

  /* The bar is decoration for the numbers beside it: the numbers are the
     truth, and they are files and megabytes rather than a percentage, because
     "62%" of a download does not tell a parent whether to wait. */
  var meter = make("div", "offline-meter");
  var fill = make("div", "offline-fill");
  meter.appendChild(fill);
  meter.setAttribute("role", "progressbar");
  meter.setAttribute("aria-valuemin", "0");
  meter.setAttribute("aria-valuemax", "100");
  meter.setAttribute("aria-valuenow", "0");
  body.appendChild(meter);

  var counts = make("p", "offline-counts", "");
  body.appendChild(counts);

  var row = make("div", "offline-actions");
  var startBtn = make("button", "btn btn-primary offline-btn", TEXT.start);
  var pauseBtn = make("button", "btn btn-secondary offline-btn", TEXT.pause);
  var checkBtn = make("button", "btn btn-quiet offline-btn", TEXT.check);
  [startBtn, pauseBtn, checkBtn].forEach(function (button) {
    button.type = "button";
    row.appendChild(button);
  });
  body.appendChild(row);

  var keepRow = make("div", "offline-actions");
  var keepBtn = make("button", "btn btn-quiet offline-btn", TEXT.keep);
  keepBtn.type = "button";
  keepRow.appendChild(keepBtn);
  body.appendChild(keepRow);

  var keepNote = make("p", "offline-note offline-keep", "");
  body.appendChild(keepNote);
  body.appendChild(make("p", "offline-note", TEXT.honest));

  host.appendChild(panel);

  /* ---------------- what it says ---------------- */

  var MB = 1024 * 1024;
  function mb(bytes) {
    if (!bytes) return "0 MB";
    var value = bytes / MB;
    return (value >= 10 ? Math.round(value) : Math.round(value * 10) / 10) + " MB";
  }

  var last = null;

  function draw(state) {
    last = state;
    var phase = state.phase || "idle";
    var total = state.total || 0;
    var done = state.done || 0;

    if (state.error && TROUBLE[state.error]) {
      status.textContent = TROUBLE[state.error];
      status.classList.add("is-problem");
    } else {
      status.classList.remove("is-problem");
      if (phase === "ready" && state.ready) status.textContent = TEXT.ready;
      else if (phase === "downloading") status.textContent = TEXT.working;
      else if (phase === "checking") status.textContent = TEXT.checking;
      /* A newer release exists. The old one is still completely saved, and
         saying "up to date" here would hide the update. */
      else if (phase === "update") {
        status.textContent = TEXT.update
          + (state.missing ? " " + state.missing + " files, " + mb(state.missingBytes) + "." : "");
      }
      /* The iPad threw some of the saved files away. That is not "saved". */
      else if (state.evicted > 0) status.textContent = TEXT.evicted;
      else if (phase === "paused") status.textContent = TEXT.paused;
      else if (state.upToDate) status.textContent = TEXT.upToDate;
      else status.textContent = TEXT.idle;
    }

    /* Files and megabytes, always both, because one file left can still be a
       long wait and 200 small ones can be a short one. */
    counts.textContent = total
      ? done + " of " + total + " files saved  ·  " + mb(state.bytesDone) + " of " + mb(state.bytesTotal)
      : "";
    var share = total ? Math.round((done / total) * 100) : 0;
    fill.style.width = share + "%";
    meter.setAttribute("aria-valuenow", String(share));

    /* Before the first listen there is no "again": the same rule the readers
       use. Nothing here says Offline ready until the worker does. */
    var running = phase === "downloading" || phase === "checking";
    startBtn.textContent = (done > 0 || phase === "update" || state.evicted > 0) && !state.ready
      ? TEXT.resumeAction
      : TEXT.start;
    startBtn.disabled = running || (Boolean(state.ready) && state.upToDate === true);
    pauseBtn.disabled = !running;
    checkBtn.disabled = running;
    panel.classList.toggle("is-ready", Boolean(state.ready) && phase === "ready");
  }

  /* Read by the author tests, which drive this panel rather than a copy. It
     is published before the early return below, so a browser with no worker
     is still a state the tests can look at. */
  window.__yoyoOfflineLibrary = {
    host: host, panel: panel, status: status, counts: counts,
    start: startBtn, pause: pauseBtn, check: checkBtn, keep: keepBtn, keepNote: keepNote,
    draw: draw, TEXT: TEXT, TROUBLE: TROUBLE,
    get last() { return last; }
  };

  /* ---------------- talking to the worker ---------------- */

  if (!("serviceWorker" in navigator)) {
    status.textContent = TEXT.noWorker;
    [startBtn, pauseBtn, checkBtn, keepBtn].forEach(function (b) { b.disabled = true; });
    return;
  }

  function send(message) {
    return navigator.serviceWorker.ready.then(function (registration) {
      var worker = registration.active || navigator.serviceWorker.controller;
      if (worker) worker.postMessage(message);
    }).catch(function () { /* no worker yet; the panel simply waits */ });
  }

  navigator.serviceWorker.addEventListener("message", function (event) {
    var data = event.data;
    if (!data || data.type !== "OFFLINE_STATE") return;
    draw(data);
  });

  startBtn.addEventListener("click", function () {
    /* Two taps, or a tap in a second tab, join the run that is already going:
       the worker coalesces them, so this only ever asks. */
    status.textContent = TEXT.checking;
    send({ type: "OFFLINE_START" });
  });
  pauseBtn.addEventListener("click", function () { send({ type: "OFFLINE_PAUSE" }); });
  checkBtn.addEventListener("click", function () { send({ type: "OFFLINE_CHECK" }); });

  /* Asked for on a deliberate press, and never described as granted. Safari
     decides; all this can do is ask and then say what the answer was. */
  keepBtn.addEventListener("click", function () {
    if (!navigator.storage || !navigator.storage.persist) {
      keepNote.textContent = TEXT.keepRefused;
      return;
    }
    keepBtn.disabled = true;
    navigator.storage.persist().then(function (granted) {
      keepNote.textContent = granted ? TEXT.keepDone : TEXT.keepRefused;
    }).catch(function () {
      keepNote.textContent = TEXT.keepRefused;
    }).then(function () { keepBtn.disabled = false; });
  });

  /* Ask once on load, and again when the panel is opened, so a parent who
     comes back tomorrow sees what is really saved rather than a stale line. */
  send({ type: "OFFLINE_STATUS" });
  panel.addEventListener("toggle", function () {
    if (panel.open) send({ type: "OFFLINE_STATUS" });
  });
})();
