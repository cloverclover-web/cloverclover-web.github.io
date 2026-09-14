(function () {
  "use strict";
  const M = window.JuiceModel, B = window.JuiceBook, A = window.JuiceArt;
  const $ = (id) => document.getElementById(id);
  let session = M.createSession(Math.floor(Math.random() * M.RECIPES.length));
  let page = "cover", kind = "jug", friend = 0, generation = 0, confirmation = 0;
  let history = [], visited = new Set(), coasterShape = "circle", coasterColour = "pink";
  let measureChange = null;
  let audioRequest = 0, audioPlaying = false, narrationStarted = false;
  let currentSegment = null, jugFlavourChosen = false;
  const chosenFriends = new Set();
  const heardPages = new Set();
  const sound = window.YoyoSound.createSound({ Audio: window.Audio });
  const recordedTexts = new Set([...B.catalogue(M), ...B.mix.catalogue(window.JuiceMixing)]);
  const mixes = window.JuiceMixReader.create({ embedded: true, onStop: stop, onSpeak: speak,
    onSegment: () => { currentSegment = null; paintAudio(); },
    onView: (read) => { currentSegment = null; paintAudio(); if (read && narrationStarted && B.mix.ready) speak(readingLines()); },
    onExit: () => go("choice") });
  const readingKey = () => `${page === "free" ? `free:${mixes.key()}` : `${page}:${kind}:${friend}`}:${(currentSegment || []).join("|")}`;
  function paintAudio() {
    const label = audioPlaying ? "Stop listening" : heardPages.has(readingKey()) ? "Listen again" : "Listen";
    $("listen").hidden = page === "cover" || (page === "free" && !B.mix.ready);
    $("audio-status").hidden = page === "cover";
    $("back").hidden = page === "cover";
    $("listen").textContent = label;
    $("listen").setAttribute("aria-label", label);
    $("listen").setAttribute("aria-pressed", String(audioPlaying));
  }
  function highlight(text) {
    document.querySelectorAll(".reader-speaking").forEach(p => p.classList.remove("reader-speaking"));
    if (!text) return;
    for (const p of document.querySelectorAll("[data-speech], #notice")) {
      if (p.closest("[hidden], details:not([open])")) continue;
      if ((p.dataset.speech || p.textContent.trim()) === text) p.classList.add("reader-speaking");
    }
  }
  function stop() {
    audioRequest++; sound.stop(); audioPlaying = false;
    highlight(null); paintAudio();
    $("audio-status").textContent = "";
  }
  async function speak(lines) {
    stop();
    currentSegment = [...new Set(lines)];
    paintAudio();
    if (!narrationStarted || !currentSegment.length) return;
    lines = currentSegment.slice();
    if (page === "free" && !B.mix.ready) { $("audio-status").textContent = "New narration is being prepared. Read this part together for now."; return; }
    sound.missing.clear();
    const token = generation, request = audioRequest, key = readingKey();
    audioPlaying = true;
    paintAudio();
    const status = await sound.playSequence(lines, 0, (i) => {
      if (token === generation && request === audioRequest) highlight(lines[i]);
    });
    if (token !== generation || request !== audioRequest || status === "cancelled") return;
    audioPlaying = false;
    if (status === "ended" && !sound.missing.size) heardPages.add(key);
    highlight(null); paintAudio();
    const retry = $("listen").textContent;
    $("audio-status").textContent = sound.missing.size ? `Sound is unavailable. Check the connection, then tap ${retry}.` : status === "blocked" ? `Tap ${retry} to hear this part.` : "";
  }
  function el(tag, text, cls) { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (cls) n.className = cls; return n; }
  function button(label, action, options = {}) {
    const b = el("button", label, options.className); b.type = "button";
    if (options.id) b.id = options.id;
    if (options.pressed !== undefined) b.setAttribute("aria-pressed", String(options.pressed));
    b.disabled = !!options.disabled;
    const epoch = generation;
    b.addEventListener("click", () => { if (epoch !== generation || !b.isConnected || b.disabled) return; action(); });
    return b;
  }
  function note(text, read = false) { $("notice").textContent = text; if (read) speak([text]); }
  function go(next, push = true) {
    if (page === "cover" && next === "welcome") narrationStarted = true;
    stop(); generation++; measureChange = null; currentSegment = null;
    if (page === "free" && next !== "free") mixes.leave();
    if (push) history.push({ page, kind, friend });
    page = next; render();
    // Page turns may move to the heading; activity choices never scroll.
    $("title").focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
    if (narrationStarted && page !== "cover") speak(readingLines());
  }
  function back() {
    if (page === "free") { mixes.back(); return; }
    if (!history.length) return;
    const previous = history.pop(); kind = previous.kind; friend = previous.friend;
    go(previous.page, false);
  }
  function currentClosing() { return M.complete(session, kind) ? B.ui.full : M.used(session, kind) ? B.ui.partial : B.ui.untouched; }
  function pageLines() {
    const lines = (page === "close" ? B.ending(M, session, kind) : B.pages[page]).lines.slice();
    if (page === "close" && !M.complete(session, kind)) lines.unshift(currentClosing());
    return lines;
  }
  function next(label, target, primary = true) { $("next-actions").append(button(label, () => go(target), { className: primary ? "primary" : "" })); }
  function route(value) {
    if (!["jug", "own", "free"].includes(value)) return;
    const alternative = visited.size > 0 && !visited.has(value);
    visited.add(value); kind = value;
    go(value === "free" ? "free" : value === "jug" ? "plan" : "own");
    if (alternative) note(B.ui.alternative);
  }
  function heading(text) { $("activity").append(el("h2", text)); }
  function paragraph(text, cls) { const n = el("p", text, cls); $("activity").append(n); return n; }
  function fruitButton(f, action, selected) {
    const b = button("", action, { className: "fruit-choice" + (selected ? " selected" : ""), pressed: selected });
    const im = el("img"); im.src = M.FRUIT[f].image; im.alt = ""; im.width = 74; im.height = 74;
    b.append(im, el("span", M.FRUIT[f].name)); return b;
  }
  function fruitObservations() {
    heading("Fruit for our snack");
    paragraph("Bunny looks closely at the apples, oranges and strawberries for their snack.");
    const row = el("div", undefined, "row"), message = el("p", "Choose a fruit to look at it together.", "fruit-note");
    for (const f of Object.keys(M.FRUIT)) row.append(fruitButton(f, () => { message.textContent = B.words[f]; message.dataset.speech = B.words[f]; speak([B.words[f]]); }, false));
    $("activity").append(row, message);
  }
  function juiceButton(f, action, selected) {
    const supply = M.JUICES[f];
    const b = button("", action, { className: "fruit-choice juice-choice" + (selected ? " selected" : ""), pressed: selected });
    b.dataset.material = `${f}-juice`;
    const im = el("img"); im.src = supply.image; im.alt = ""; im.width = 76; im.height = 114;
    b.append(im, el("span", supply.name)); return b;
  }
  function recipe(r, cups) {
    const row = el("div", undefined, "recipe");
    row.append(el("span", `${r.juice} ${r.juice === 1 ? "scoop" : "scoops"} juice`), el("span", "+"), el("span", `${r.water} ${r.water === 1 ? "scoop" : "scoops"} water`));
    $("activity").append(row);
    paragraph(cups ? `For each cup. We are making ${cups} cups.` : "For this cup.", "aside");
  }
  function prediction(which, i) {
    const v = session.variant, r = session[which];
    const order = which === "jug" ? v : v.own[i];
    const q = B.question(v, which, i);
    paragraph(q);
    if (!r.checked[i]) {
      const row = el("div", undefined, "options");
      const feedback = el("div", undefined, "reader-feedback answer-feedback");
      feedback.id = "answer-feedback"; feedback.setAttribute("role", "status");
      const updateFeedback = (read = false) => {
        const value = r.predictions[i], answer = which === "jug" ? v.total : order.juice + order.water;
        const lines = B.answerFeedback(v, which, i, value, r.help[i]);
        feedback.dataset.result = value == null ? "empty" : value === answer ? "correct" : "retry";
        feedback.dataset.assistance = r.help[i] ? "guided" : "unassisted";
        feedback.replaceChildren(...(lines.length ? lines : ["Choose an idea, ask for help, or go straight to measuring."]).map(text => el("p", text)));
        markSpeech(feedback);
        if (read && lines.length) speak(lines);
      };
      const values = which === "jug" ? v.choices : M.options(order.juice + order.water, v.id + i);
      values.forEach((value) => row.append(button(String(value), () => {
        M.predict(session, which, i, value);
        row.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.textContent === String(value))));
        updateFeedback(true);
      }, { pressed: r.predictions[i] === value, className: "number-choice" })));
      updateFeedback(); $("activity").append(row, feedback);
    }
    const controls = el("div", undefined, "row");
    controls.append(button("Help me work it out", () => {
      r.help[i] = Math.min(2, r.help[i] + 1); stop(); renderActivity();
      speak([r.help[i] === 1 ? (which === "jug" ? B.ui.helpJug1 : B.ui.helpOwn1) : B.guided(v, which, i)]);
    }));
    if (!r.checked[i]) controls.append(button("Let's measure", () => {
      r.checked[i] = true;
      if (which === "jug") go("mix"); else { stop(); renderActivity(); speak([B.request(v, i), ...stepLines()]); }
    }, { className: "primary", id: "measure" }));
    $("activity").append(controls);
    if (r.help[i]) {
      const hint = el("div", undefined, "hint");
      hint.append(el("p", which === "jug" ? B.ui.helpJug1 : B.ui.helpOwn1));
      const eq = which === "jug" ? `${v.each} + ${v.each} + ${v.each} = ?` : `${order.juice} + ${order.water} = ?`;
      hint.append(el("p", r.help[i] === 1 ? eq : eq.replace("?", which === "jug" ? v.total : order.juice + order.water), "equation"));
      if (r.help[i] > 1) hint.append(el("p", B.guided(v, which, i)));
      $("activity").append(hint);
    }
  }
  function scoopKey(parent) {
    const key = el("div", undefined, "scoop-key");
    key.append(el("strong", `1 full scoop = ${session.variant.scoopMl} mL`));
    key.append(button("What is a scoop?", () => speak([B.ui.units])));
    parent.append(key);
  }
  function volumeReadout(parent, mode) {
    const v = M.volumes(session, kind), own = kind === "own";
    const current = own ? v.cupsMl[friend] : v.jugMl;
    const target = own ? v.cupTargetsMl[friend] : v.jugTargetMl;
    const meter = el("div", undefined, "volume-readout");
    meter.id = "volume-readout"; meter.dataset.currentMl = current; meter.dataset.targetMl = target;
    meter.append(el("p", own ? `${M.FRIENDS[friend]}'s cup` : "Our jug", "volume-title"));
    const values = el("div", undefined, "volume-values");
    for (const [label, amount, cls] of [["Now", current, "volume-current"], [mode === "serve" ? "Each cup needs" : "Recipe goal", mode === "serve" ? v.cupTargetsMl[0] : target, "volume-goal"]]) {
      const p = el("p", undefined, cls); p.append(el("span", label), el("strong", `${amount} mL`)); values.append(p);
    }
    meter.append(values);
    const context = own ? `This cup holds up to ${v.cupCapacityMl} mL.` : mode === "serve" ? `Each cup holds up to ${v.cupCapacityMl} mL.` : `${v.cupTargetsMl[0]} mL for each cup. Jug holds up to ${v.jugCapacityMl} mL.`;
    meter.append(el("p", context, "volume-context"));
    const change = el("div", undefined, "volume-change"); change.id = "volume-change";
    if (measureChange) {
      change.dataset.deltaMl = measureChange.amountMl;
      change.append(el("strong", `+${measureChange.amountMl} mL${measureChange.served ? ` for ${measureChange.name}` : ""}`));
      change.append(el("span", `${measureChange.beforeMl} ${measureChange.served ? "-" : "+"} ${measureChange.amountMl} = ${measureChange.afterMl} mL${measureChange.served ? " in the jug" : ""}`));
    } else change.append(el("span", !own && session.jug.cups.some((c) => M.sum(c) > 0) ? "Some of our drink is already in the cups." : "Watch the amount change as we pour."));
    meter.append(change); parent.append(meter);
  }
  function workspace(mode) {
    const w = el("div", undefined, "workspace"); w.id = "measuring-workspace";
    if (mode === "serve") w.classList.add("serving-workspace");
    if (["mix", "serve", "own"].includes(mode)) {
      w.classList.add("measuring-active"); scoopKey(w); volumeReadout(w, mode);
    } else w.append(el("p", "A closer look at our measuring table", "workspace-label"));
    const diagram = el("div"); diagram.id = "measure-diagram";
    diagram.innerHTML = ["mix", "serve", "own"].includes(mode) ? A.focus(session, kind, friend, M.COLOURS, "detail", mode) : A.scene(session, kind, mode, M.COLOURS, "detail"); w.append(diagram);
    $("activity").append(w);
  }
  function refreshVisuals() {
    const visible = ["mix", "serve", "own", "table", "close"].includes(page) && !(page === "close" && M.complete(session, kind));
    $("stage").hidden = !visible;
    if (visible) $("stage").innerHTML = A.scene(session, kind, page, M.COLOURS, "scene");
    const d = $("measure-diagram");
    if (d) d.innerHTML = ["mix", "serve", "own"].includes(page) ? A.focus(session, kind, friend, M.COLOURS, "detail", page) : A.scene(session, kind, page, M.COLOURS, "detail");
  }
  function ingredientControls() {
    const r = session[kind], v = session.variant;
    const flavour = kind === "jug" ? r.flavour : v.own[friend].flavour;
    const group = el("div", undefined, "ingredients");
    for (const ing of [flavour, "water"]) {
      const dest = kind === "jug" ? r.jug : r.cups[friend];
      const added = dest[ing] + (kind === "jug" ? r.cups.reduce((n, c) => n + c[ing], 0) : 0);
      const need = M.need(v, r, ing, friend), remaining = need - added;
      const cell = el("div", undefined, "ingredient");
      cell.dataset.material = ing === "water" ? "water" : `${ing}-juice`;
      cell.append(el("h3", ing === "water" ? "Drinking water" : M.JUICES[ing].name));
      if (ing !== "water") {
        const im = el("img", undefined, "supply-picture"); im.src = M.JUICES[ing].image; im.alt = ""; im.width = 64; im.height = 96;
        cell.append(im);
      }
      cell.append(el("p", `${added} of ${need} scoops added`, "dose-readout"));
      cell.append(el("p", `${r.stock[ing]} scoops left in the supply`, "aside"));
      const row = el("div", undefined, "row");
      const add = (amount) => {
        stop(); const beforeMl = M.sum(dest) * v.scoopMl, previousStep = stepLines().join(" ");
        const n = M.add(session, kind, ing, friend, amount);
        measureChange = n ? { beforeMl, amountMl: n * v.scoopMl, afterMl: M.sum(dest) * v.scoopMl } : null;
        renderActivity(); renderNav();
        note(n ? `+${n * v.scoopMl} mL: ${n} ${n === 1 ? "scoop moved" : "scoops moved"} into ${kind === "jug" ? "the jug" : `${M.FRIENDS[friend]}'s cup`}. Now ${M.sum(dest) * v.scoopMl} mL.` : "This part of the recipe is already measured.");
        if (n && previousStep !== stepLines().join(" ")) speak(stepLines());
      };
      const single = button("Add 1 scoop", () => add(1), { disabled: remaining <= 0 || (kind === "jug" && r.stirred), id: `add-${ing}` });
      single.append(el("span", `+${v.scoopMl} mL`, "button-volume"));
      const rest = button(`Add remaining ${Math.max(0, remaining)}`, () => add("rest"), { disabled: remaining <= 0 || (kind === "jug" && r.stirred), id: `group-${ing}` });
      rest.append(el("span", `+${Math.max(0, Math.min(remaining, r.stock[ing])) * v.scoopMl} mL`, "button-volume"));
      row.append(single, rest);
      cell.append(row); group.append(cell);
    }
    $("activity").append(group);
  }
  function ownControls() {
    const v = session.variant, r = session.own;
    const tabs = el("div", undefined, "cup-controls");
    M.FRIENDS.forEach((name, i) => {
      const cup = el("div", undefined, "serving-cup");
      const amount = el("p", `${M.volumes(session, "own").cupsMl[i]} mL`, "serving-amount"); amount.id = `friend-volume-${i}`;
      const choose = button(name, () => selectFriend(i), { pressed: friend === i, id: `friend-${i}` });
      choose.setAttribute("aria-describedby", amount.id);
      cup.append(choose, amount, el("p", "In this cup", "serving-label")); tabs.append(cup);
    });
    $("activity").append(tabs);
    heading(`${M.FRIENDS[friend]}'s mix`);
    if (!r.checked[friend]) { scoopKey($("activity")); recipe(v.own[friend], 0); prediction("own", friend); return; }
    paragraph(B.request(v, friend));
    workspace("own");
    paragraph("Choose the juice in the request before measuring it.", "aside");
    const row = el("div", undefined, "row");
    ["apple", "orange"].forEach((f) => row.append(juiceButton(f, () => {
      if (f !== v.own[friend].flavour) { note(B.ui.wrongJuice); speak([B.ui.wrongJuice, B.request(v, friend)]); return; }
      r.selected ||= {}; r.selected[friend] = f; stop(); measureChange = null; renderActivity(); note(`The ${f} juice is beside ${M.FRIENDS[friend]}'s cup.`); speak(stepLines());
    }, r.selected?.[friend] === f)));
    $("activity").append(row);
    if (r.selected?.[friend] === v.own[friend].flavour) ingredientControls();
    else paragraph("The juice and water stay in their containers until you choose the requested juice.", "aside");
    const total = M.sum(r.cups[friend]);
    if (total === v.own[friend].juice + v.own[friend].water) paragraph(`${M.FRIENDS[friend]}'s cup has ${total} measured scoops. This mix is ready.`, "dose-readout");
  }
  function selectFriend(i) {
    stop(); friend = i; chosenFriends.add(i); measureChange = null; renderActivity(); note("");
    speak([session.own.checked[i] ? B.request(session.variant, i) : B.question(session.variant, "own", i), ...stepLines()]);
  }
  function stepLines() {
    const g = B.guidance, v = session.variant, r = session[kind];
    if (page === "mix") {
      if (r.stirred) return [g.cups];
      if (M.mixtureReady(session)) return [g.stir];
      const got = ing => r.jug[ing] + r.cups.reduce((n, c) => n + c[ing], 0);
      if (got(r.flavour) === v.juice * 3) return [g.addWater];
      if (got("water") === v.water * 3) return [g.addJuice];
      return [g.addBoth];
    }
    if (page === "serve") return [M.complete(session, kind) ? g.table : r.cups.some(c => M.sum(c) > 0) ? g.anotherCup : g.pour];
    if (page === "own") {
      if (!r.checked[friend]) return [];
      const target = v.own[friend], cup = r.cups[friend];
      if (M.complete(session, kind)) return [g.table];
      if (M.sum(cup) === target.juice + target.water) return [B.nextFriend(M.FRIENDS[friend])];
      if (r.selected?.[friend] !== target.flavour) return [g.chooseJuice];
      if (cup[target.flavour] === target.juice) return [g.addWater];
      if (cup.water === target.water) return [g.addJuice];
      return [g.addBoth];
    }
    if (page === "table") return [r.coasters.every(Boolean) ? g.ending : g.coaster];
    return [];
  }
  function renderGuidance() {
    const lines = stepLines();
    if (!lines.length) return;
    const box = el("div", undefined, "reader-feedback step-guidance"); box.id = "step-guidance";
    box.setAttribute("role", "status");
    box.append(...lines.map(text => el("p", text)));
    if (page === "own" && !M.complete(session, kind)) {
      const r = session.own, v = session.variant;
      if (M.sum(r.cups[friend]) === v.own[friend].juice + v.own[friend].water) {
        const i = M.FRIENDS.findIndex((_, n) => M.sum(r.cups[n]) < v.own[n].juice + v.own[n].water);
        box.append(button(`Make ${M.FRIENDS[i]}'s drink`, () => selectFriend(i), { className: "primary", id: "next-friend" }));
      }
    }
    $("activity").append(box);
  }
  function renderActivity() {
    $("activity").replaceChildren(); $("activity").hidden = false;
    if (page === "prepare") fruitObservations();
    else if (page === "choice") {
      const choices = el("div", undefined, "branch-choices");
      for (const [value, title, desc] of [["jug", "Make a jug to share", "Plan enough of the same drink for everyone."], ["own", "Make our own mixes", "Listen to each friend and make a different mix."], ["free", "Invent our own recipes", "Choose up to 2 prepared juices for each cup."]]) {
        const b = button(title, () => route(value), { id: `route-${value}` }); b.setAttribute("aria-label", title); b.append(el("small", desc)); choices.append(b);
      }
      $("activity").append(choices);
    } else if (page === "plan") {
      const r = session.jug;
      heading("Our recipe");
      scoopKey($("activity"));
      paragraph("Which juice would you like in the shared jug? Both choices work for this plan.");
      const row = el("div", undefined, "row");
      ["apple", "orange"].forEach((f) => { const b = juiceButton(f, () => {
        M.chooseFlavour(session, f); jugFlavourChosen = true; stop(); renderActivity();
        speak([B.question(session.variant, "jug", 0)]);
      }, (jugFlavourChosen || M.used(session, "jug") > 0) && r.flavour === f); b.disabled = M.used(session, "jug") > 0; row.append(b); });
      $("activity").append(row);
      if (M.used(session, "jug")) paragraph("The juice already measured stays in this jug. A new reading can use a different recipe.", "aside");
      recipe(session.variant, 3);
      if (!r.checked[0]) prediction("jug", 0);
      else $("activity").append(button("Return to our jug", () => go(r.stirred ? "serve" : "mix"), { className: "primary" }));
    } else if (page === "mix") {
      heading("Measure, then stir");
      paragraph(`For the whole jug: ${session.variant.juice * 3} scoops of ${session.jug.flavour} juice and ${session.variant.water * 3} scoops of water.`);
      workspace("mix"); ingredientControls();
      $("activity").append(button(session.jug.stirred ? "The drink is stirred" : "Stir our drink", () => {
        if (!M.stir(session)) { note(B.ui.stirWait, true); return; }
        stop(); renderActivity(); renderNav(); note(B.ui.stirDone); speak([B.ui.stirDone, ...stepLines()]);
      }, { disabled: session.jug.stirred, id: "stir", className: "primary" }));
      if (session.jug.stirred) paragraph(`${session.variant.total} measured scoops were added to our jug.`, "dose-readout");
    } else if (page === "serve") {
      heading(`${session.variant.each} scoops for each cup`); workspace("serve");
      const row = el("div", undefined, "cup-controls serving-cups");
      M.FRIENDS.forEach((name, i) => {
        const cup = el("div", undefined, "serving-cup"); cup.id = `serving-cup-${i}`;
        const amount = el("p", `${M.volumes(session, "jug").cupsMl[i]} mL`, "serving-amount");
        amount.id = `served-volume-${i}`;
        const pour = button(`Pour for ${name}`, () => {
        stop(); const beforeMl = M.sum(session.jug.jug) * session.variant.scoopMl;
        const moved = M.serve(session, i), afterMl = M.sum(session.jug.jug) * session.variant.scoopMl;
        measureChange = moved ? { served: true, name, beforeMl, afterMl, amountMl: beforeMl - afterMl } : null;
        renderActivity(); renderNav(); note(`${name}'s cup now has ${M.sum(session.jug.cups[i]) * session.variant.scoopMl} mL. ${afterMl} mL remain in the jug.`); if (moved) speak(stepLines());
        }, { disabled: M.sum(session.jug.cups[i]) > 0, id: `serve-${i}` });
        pour.setAttribute("aria-describedby", amount.id);
        cup.append(el("h3", name), amount, el("p", "In this cup", "serving-label"), pour);
        row.append(cup);
      });
      $("activity").append(row);
      paragraph(`${M.sum(session.jug.jug)} measured scoops remain in the jug.`, "dose-readout");
    } else if (page === "own") ownControls();
    else if (page === "table") {
      heading("Choose a coaster"); workspace("table");
      const shapes = el("div", undefined, "row");
      for (const shape of ["circle", "square"]) {
        const b = button(shape, () => { coasterShape = shape; renderActivity(); }, { pressed: coasterShape === shape });
        const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        icon.setAttribute("viewBox", "0 0 44 44"); icon.setAttribute("width", "36"); icon.setAttribute("height", "36"); icon.setAttribute("aria-hidden", "true");
        icon.innerHTML = shape === "circle" ? '<circle cx="22" cy="22" r="16" fill="#dba69a" stroke="#6d5647" stroke-width="2"/>' : '<rect x="6" y="6" width="32" height="32" fill="#a9bd9b" stroke="#6d5647" stroke-width="2"/>';
        b.prepend(icon); b.style.display = "inline-flex"; b.style.alignItems = "center"; b.style.gap = "8px"; shapes.append(b);
      }
      $("activity").append(shapes);
      const colours = el("div", undefined, "row"); colours.style.margin = "16px 0";
      for (const [name, value] of Object.entries(M.COLOURS)) {
        const b = button(name, () => { coasterColour = name; renderActivity(); }, { pressed: coasterColour === name, className: "colour-choice" });
        b.style.background = value; b.style.color = "#332c25"; colours.append(b);
      }
      $("activity").append(colours);
      const row = el("div", undefined, "cup-controls");
      M.FRIENDS.forEach((name, i) => {
        const cup = el("div", undefined, "serving-cup");
        const amount = el("p", `${M.volumes(session, kind).cupsMl[i]} mL`, "serving-amount"); amount.id = `table-volume-${i}`;
        cup.append(el("h3", name), amount, el("p", "In this cup", "serving-label"));
        cup.append(button(`Place for ${name}`, () => {
        stop(); M.coaster(session, kind, i, coasterShape, coasterColour); refreshVisuals();
        $("step-guidance")?.remove(); renderGuidance(); markSpeech($("activity"));
        note(`A ${coasterColour} ${coasterShape} coaster is under ${name}'s cup.`); if (session[kind].coasters.every(Boolean)) speak(stepLines());
        }, { id: `coaster-${i}` })); row.append(cup);
      });
      $("activity").append(row);
      paragraph("Any colour or shape can belong at our table. You can change your design.", "aside");
    } else if (page === "close") {
      if (M.complete(session, kind)) {
        const record = el("details", undefined, "preparation-record");
        record.append(el("summary", "Look back at our preparation"));
        const caption = el("p", "This is our preparation record, before the friends began drinking. It does not show how much is left after a sip.");
        const diagram = el("div"); diagram.innerHTML = A.scene(session, kind, "close", M.COLOURS, "record");
        record.append(caption, diagram); $("activity").append(record);
      } else {
        workspace("close"); paragraph(currentClosing());
        $("activity").append(button("Return to our drinks", () => go(kind === "own" ? "own" : session.jug.stirred ? "serve" : "plan")));
      }
      $("activity").append(button("Visit another way the story could go", () => { go("choice"); note(B.ui.alternative); }));
    } else $("activity").hidden = true;
    renderGuidance(); refreshVisuals();
    markSpeech($("activity"));
  }
  function renderNav() {
    $("next-actions").replaceChildren(); $("back").disabled = !history.length;
    if (page === "cover") next("Read with me", "welcome");
    else if (page === "welcome") next("Come into the kitchen", "prepare");
    else if (page === "prepare") next("What shall we make?", "choice");
    else if (page === "plan") next("Leave the measuring for later", "table", false);
    else if (page === "mix") { if (session.jug.stirred) next("Bring the cups", "serve"); next("Finish another time", "table", false); }
    else if (page === "serve" || page === "own") next("Set our table", "table");
    else if (page === "table") next("Read the ending", "close");
  }
  function speechParagraphs(parent) {
    return [...parent.querySelectorAll("p")].filter(p => recordedTexts.has(p.dataset.speech || p.textContent.trim()));
  }
  function markSpeech(parent) {
    for (const p of speechParagraphs(parent)) {
      const text = p.dataset.speech || p.textContent.trim(); p.dataset.speech = text;
    }
  }
  function readingLines() {
    if (currentSegment) return currentSegment.slice();
    if (page === "free") return mixes.readingLines();
    // A page can contain several decisions. Only narrate the current one;
    // later controls remain available for children who prefer to act first.
    if (page === "plan") return [...pageLines(), jugFlavourChosen || M.used(session, "jug")
      ? B.question(session.variant, "jug", 0)
      : "Which juice would you like in the shared jug? Both choices work for this plan."];
    if (page === "own") return [...pageLines(), ...(chosenFriends.has(friend)
      ? [session.own.checked[friend] ? B.request(session.variant, friend) : B.question(session.variant, "own", friend), ...stepLines()]
      : [])];
    const activity = speechParagraphs($("activity")).filter(p => !p.closest("details:not([open])")).map(p => p.dataset.speech);
    return [...new Set([...pageLines(), ...activity])];
  }
  function render() {
    if (page === "free") { mixes.enter(); return; }
    const p = page === "close" ? B.ending(M, session, kind) : B.pages[page];
    document.body.dataset.page = page; document.body.dataset.route = kind;
    $("title").textContent = p.title;
    $("chapter").textContent = page === "cover" ? "Little Kitchen" : "Juice for Our Friends";
    $("scene-art").src = `assets/juice/${p.image}.jpg`; $("scene-art").alt = p.alt;
    $("lines").replaceChildren(...pageLines().map((text) => el("p", text)));
    markSpeech($("lines"));
    $("notice").textContent = "";
    renderActivity(); renderNav();
    paintAudio();
  }
  $("listen").addEventListener("click", () => {
    if (audioPlaying) { narrationStarted = false; stop(); }
    else { narrationStarted = true; speak(readingLines()); }
  });
  $("back").addEventListener("click", back);
  $("parent-open").addEventListener("click", () => { stop(); $("parent-dialog").showModal(); });
  $("parent-close").addEventListener("click", () => $("parent-dialog").close());
  $("new-reading").addEventListener("click", () => {
    stop(); const token = ++confirmation;
    const oldYes = $("restart-yes"), oldNo = $("restart-no");
    const yes = oldYes.cloneNode(true), no = oldNo.cloneNode(true);
    oldYes.replaceWith(yes); oldNo.replaceWith(no);
    yes.addEventListener("click", () => {
      if (token !== confirmation || !yes.isConnected || !$("restart-dialog").open) return;
      confirmation++; $("restart-dialog").close();
      const next = (session.variant.id + 1 + Math.floor(Math.random() * (M.RECIPES.length - 1))) % M.RECIPES.length;
      session = M.createSession(next); history = []; visited = new Set(); kind = "jug"; friend = 0;
      mixes.reset(next);
      heardPages.clear(); chosenFriends.clear(); jugFlavourChosen = false; narrationStarted = false;
      go("cover", false);
    });
    no.addEventListener("click", () => { if (token !== confirmation) return; confirmation++; $("restart-dialog").close(); });
    $("restart-dialog").showModal();
  });
  $("restart-dialog").addEventListener("cancel", () => { confirmation++; });
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });
  window.addEventListener("pagehide", stop);
  render();
})();
