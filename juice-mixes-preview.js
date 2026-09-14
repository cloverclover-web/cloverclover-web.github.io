(function () {
  "use strict";
  function create(options = {}) {
  const M = window.JuiceMixing, B = window.JuiceBook, T = B.mix.text;
  const $ = id => document.getElementById(options.embedded && id === "cups-scene" ? "stage" : id);
  const recorded = new Set([...B.mix.catalogue(M), ...B.pages.table.lines, B.guidance.coaster, B.guidance.ending]);
  let session = M.createSession(Math.floor(Math.random() * M.IDEAS.length));
  let page = "welcome", friend = 0, generation = 0, confirmation = 0, previous = [];
  let change = null;
  let currentSegment = null;
  let coasterShape = "circle", coasterColour = "pink";
  const dom = (tag, text, cls) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (cls) node.className = cls;
    return node;
  };
  const paragraphs = lines => lines.map(line => { const p = dom("p", line); if (recorded.has(line)) p.dataset.speech = line; return p; });
  function button(text, action, id, pressed) {
    const b = dom("button", text); b.type = "button";
    if (id) b.id = id;
    if (pressed !== undefined) b.setAttribute("aria-pressed", String(pressed));
    const token = generation;
    b.addEventListener("click", () => {
      if (token !== generation || !b.isConnected || b.disabled) return;
      action();
    });
    return b;
  }
  const setSegment = lines => { currentSegment = [...new Set(lines)]; options.onSegment?.(); };
  const read = lines => { setSegment(lines); options.onSpeak?.(currentSegment); };
  const say = (text, spoken = false) => { $("notice").textContent = text; if (spoken) read([text]); };
  function readingLines() {
    if (currentSegment) return currentSegment.slice();
    if (page === "make" && !active().measuring) return [...T.make, T.choose, T.size];
    if (page === "table") return [...B.pages.table.lines, session.cups.every(c => c.coaster) ? B.guidance.ending : B.guidance.coaster];
    return [...new Set([...$("lines").querySelectorAll("p"), ...$("activity").querySelectorAll("p")]
      .filter(p => !p.closest("[hidden], details:not([open])"))
      .map(p => p.textContent.trim()).filter(text => recorded.has(text)))];
  }
  function markSpeech() {
    for (const p of [...$("lines").querySelectorAll("p"), ...$("activity").querySelectorAll("p")]) {
      if (recorded.has(p.textContent.trim())) p.dataset.speech = p.textContent.trim();
      else delete p.dataset.speech;
    }
  }
  const active = () => session.cups[friend];
  const recipeText = recipe => M.INGREDIENTS.filter(key => recipe[key] > 0)
    .map(key => `${recipe[key]} ${recipe[key] === 1 ? "scoop" : "scoops"} of ${M.NAMES[key].toLowerCase()}`).join(" + ");
  const status = i => M.ready(session, i) ? "Stirred and ready" : M.filled(session, i) ? "Measured, ready to stir" : M.used({ cups: [session.cups[i]] }) ? "Partly made" : "Not poured yet";
  function waterPicture() {
    const wrap = dom("div", undefined, "water-measure");
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML = '<svg viewBox="0 0 66 96"><path d="M47 28C68 24 67 64 46 63" fill="none" stroke="#75624d" stroke-width="3"/><path d="M9 12H49L46 84Q27 92 12 84Z" fill="#f9fcfc" stroke="#75624d" stroke-width="2"/><path d="M12 40Q29 44 47 40L45 82Q28 88 15 82Z" fill="#d8e5e5"/><path d="M18 25L21 75" stroke="white" stroke-width="3"/></svg>';
    return wrap;
  }
  function ingredientPicture(key) {
    if (key === "water") return waterPicture();
    const img = dom("img", undefined, "ingredient-image");
    img.src = M.IMAGES[key]; img.alt = ""; img.width = 72; img.height = 108; return img;
  }
  function cupSvg(i, label = true) {
    const cup = session.cups[i], scoops = M.total(cup.poured), ml = scoops * M.SCOOP_ML;
    const colour = M.COLOURS[cup.coasterColour];
    const mat = cup.coaster === "circle" ? `<ellipse data-coaster="circle" data-colour="${cup.coasterColour}" cx="52" cy="101" rx="49" ry="10" fill="${colour}" stroke="#6e614e"/>` : cup.coaster === "square" ? `<path data-coaster="square" data-colour="${cup.coasterColour}" d="M5 93H91L101 108H15Z" fill="${colour}" stroke="#6e614e"/>` : "";
    return `<svg viewBox="0 0 112 ${label ? 153 : 120}" role="img" aria-label="${cup.name}: ${ml} mL measured into an opaque cup. ${status(i)}." data-cup="${i}" data-scoops="${scoops}" data-ml="${ml}" data-colour-model="not-simulated">
      ${mat}<path d="M80 36C113 31 109 81 78 80" fill="none" stroke="#79654f" stroke-width="7"/><path d="M17 22H84L79 92Q51 107 21 92Z" fill="#f9efe0" stroke="#79654f" stroke-width="2.2"/><path d="M23 28L27 85" stroke="#fffaf4" stroke-width="4"/><path d="M18 22H83" stroke="#79654f" stroke-width="4"/><path d="M26 57Q51 48 76 57M26 66Q51 57 76 66" fill="none" stroke="#bd9f80" stroke-width="2"/>
      ${label ? `<text x="52" y="127" text-anchor="middle" font-size="15" fill="#493b30">${cup.name}</text><text x="52" y="146" text-anchor="middle" font-size="15" fill="#493b30">${ml} mL measured</text>` : ""}</svg>`;
  }
  function updateScene() {
    $("cups-scene").hidden = page === "welcome" || (page === "ending" && M.complete(session));
    if (!$("cups-scene").hidden) {
      $("cups-scene").innerHTML = `<div style="display:flex;justify-content:space-evenly;height:100%">${M.FRIENDS.map((_, i) => cupSvg(i)).join("")}</div>`;
    }
    M.FRIENDS.forEach((_, i) => {
      const tag = $(`friend-state-${i}`); if (tag) tag.textContent = status(i);
      const amount = $(`friend-volume-${i}`); if (amount) amount.textContent = `${M.total(session.cups[i].poured) * M.SCOOP_ML} mL`;
    });
  }
  function go(next, push = true) {
    if (push) previous.push({ page, friend });
    page = next; change = null; render(true);
    $("title").focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: "instant" });
  }
  function chooseFriend(i) { friend = i; change = null; render(true); }
  function renderFriends() {
    const tabs = dom("div", undefined, "cup-controls");
    M.FRIENDS.forEach((name, i) => {
      const cup = dom("div", undefined, "serving-cup");
      const b = button(name, () => chooseFriend(i), `friend-${i}`, friend === i);
      const tag = dom("small", status(i)); tag.id = `friend-state-${i}`; b.append(tag);
      const amount = dom("p", `${M.total(session.cups[i].poured) * M.SCOOP_ML} mL`, "serving-amount"); amount.id = `friend-volume-${i}`;
      b.setAttribute("aria-describedby", amount.id);
      cup.append(b, amount, dom("p", "Measured in", "serving-label")); tabs.append(cup);
    });
    $("activity").append(tabs);
  }
  function units() {
    const key = dom("div", undefined, "scoop-key");
    key.append(dom("strong", "1 full scoop = 25 mL"));
    key.append(dom("span", "This cup holds up to 100 mL."));
    key.append(dom("p", B.ui.units, "aside"));
    $("activity").append(key);
  }
  function planning() {
    const cup = active();
    $("activity").append(dom("h2", `${cup.name}'s recipe`)); units();
    $("activity").append(dom("p", T.choose, "aside"));
    const tray = dom("div", undefined, "recipe-tray");
    for (const key of M.INGREDIENTS) {
      const cell = dom("div", undefined, "recipe-ingredient"); cell.dataset.ingredient = key;
      cell.append(dom("h3", M.NAMES[key]), ingredientPicture(key));
      const amount = dom("p", "", "amount-chosen"); amount.id = `planned-${key}`; cell.append(amount);
      const steps = dom("div", undefined, "stepper");
      for (const [symbol, delta, name] of [["-", -1, "Remove"], ["+", 1, "Add"]]) {
        const b = button(symbol, () => {
          const changed = M.setAmount(session, friend, key, active().recipe[key] + delta);
          if (changed) { options.onStop?.(); updatePlan(); setSegment([T.changed, T.choose, T.size]); say(T.changed); }
        }, `plan-${key}-${delta > 0 ? "plus" : "minus"}`);
        b.setAttribute("aria-label", `${name} 1 scoop of ${M.NAMES[key].toLowerCase()} in the plan`); steps.append(b);
      }
      cell.append(steps); tray.append(cell);
    }
    $("activity").append(tray, button("Try a recipe idea", () => { options.onStop?.(); M.suggest(session, friend); updatePlan(); setSegment([T.idea, T.choose, T.size]); say(T.idea); }, "recipe-idea"));
    $("activity").append(dom("p", "We are planning 2 to 4 scoops for this cup. The bottles stay on the table until we measure.", "aside"));
    const guess = dom("div", undefined, "guess-panel"); guess.id = "guess-panel"; $("activity").append(guess);
    updatePlan();
  }
  function updatePlan() {
    const cup = active();
    for (const key of M.INGREDIENTS) {
      $(`planned-${key}`).textContent = `${cup.recipe[key]} ${cup.recipe[key] === 1 ? "scoop" : "scoops"}`;
      for (const [part, delta] of [["plus", 1], ["minus", -1]]) {
        $(`plan-${key}-${part}`).disabled = !!M.recipeProblem({ ...cup.recipe, [key]: cup.recipe[key] + delta });
      }
    }
    const panel = $("guess-panel"); panel.replaceChildren();
    if (M.recipeProblem(cup.recipe, true)) {
      panel.append(dom("p", T.incomplete)); markSpeech(); return;
    }
    panel.append(dom("h3", "Before we pour"), dom("p", B.mix.recipe(cup.recipe)),
      button("Use this recipe", () => read([B.mix.recipe(cup.recipe), T.question]), "use-recipe"), dom("p", T.question));
    const feedback = dom("div", undefined, "reader-feedback answer-feedback"); feedback.id = "answer-feedback"; feedback.setAttribute("role", "status");
    const updateFeedback = (spoken = false) => {
      const lines = B.mix.feedback(cup.recipe, cup.prediction, cup.help);
      feedback.dataset.result = cup.prediction == null ? "empty" : cup.prediction === M.total(cup.recipe) ? "correct" : "retry";
      feedback.dataset.assistance = cup.help ? "guided" : "unassisted";
      feedback.replaceChildren(...paragraphs(lines.length ? lines : [T.optional]));
      if (spoken) read(lines);
    };
    const options = dom("div", undefined, "options"), revision = cup.revision;
    M.options(session, friend).forEach(value => options.append(button(String(value), () => {
      if (M.predict(session, friend, value, revision)) {
        options.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.textContent === String(value))));
        updateFeedback(true);
      }
    }, `guess-${value}`, cup.prediction === value)));
    updateFeedback(); panel.append(options, feedback);
    const row = dom("div", undefined, "row");
    row.append(button("Help me work it out", () => { M.help(session, friend); updatePlan(); read(cup.help > 1 ? [T.help, B.mix.calculation(cup.recipe), T.example] : [T.help]); }, "help"));
    const measure = button("Let's measure", () => { if (M.measure(session, friend)) render(true); }, "measure"); measure.className = "primary"; row.append(measure); panel.append(row);
    if (cup.help) {
      const amounts = M.INGREDIENTS.filter(key => cup.recipe[key] > 0).map(key => cup.recipe[key]);
      const text = dom("div", undefined, "hint"); text.id = "help-text";
      text.append(dom("p", "Keep the first amount in mind, then add the other amounts from the same recipe."));
      text.append(dom("p", cup.help > 1 ? B.mix.calculation(cup.recipe) : `${amounts.join(" + ")} = ?`, "equation"));
      if (cup.help > 1) text.append(dom("p", "This is a worked example. We still need to measure the ingredients."));
      panel.append(text);
    }
    markSpeech();
  }
  function measuring() {
    const cup = active();
    $("activity").append(dom("h2", `Into ${cup.name}'s cup`)); units();
    const layout = dom("div", undefined, "measure-layout"), supplies = dom("div", undefined, "transfer-supplies");
    for (const key of M.INGREDIENTS.filter(key => cup.recipe[key] > 0)) {
      const cell = dom("div", undefined, "transfer-ingredient");
      cell.append(ingredientPicture(key), dom("h3", M.NAMES[key]));
      const count = dom("p"); count.id = `supply-${key}`; cell.append(count);
      const progress = dom("p", "", "cup-progress"); progress.id = `progress-${key}`; cell.append(progress);
      const row = dom("div", undefined, "row");
      const transfer = amount => {
        const before = M.total(cup.poured) * 25, moved = M.add(session, friend, key, amount);
        if (!moved) return;
        options.onStop?.();
        change = { before, added: moved * 25, after: M.total(cup.poured) * 25 };
        updateMeasuring();
        say(`+${change.added} mL of ${M.NAMES[key].toLowerCase()}. ${change.after} mL measured into ${cup.name}'s cup.`);
        if (M.filled(session, friend)) read([B.mix.measured(M.total(cup.poured), cup.prediction), T.filled]);
        else setSegment([T.measuring]);
      };
      const single = button("", () => transfer(1), `add-${key}`), rest = button("", () => transfer("rest"), `rest-${key}`);
      row.append(single, rest); cell.append(row); supplies.append(cell);
    }
    const record = dom("div", undefined, "measure-record"); record.id = "measure-record";
    layout.append(supplies, record); $("activity").append(layout);
    const finished = dom("div", "", "mix-status"); finished.id = "mix-status";
    const stir = button("Stir this drink", () => {
      if (M.stir(session, friend)) { change = null; updateMeasuring(); say(M.complete(session) ? T.all : T.another, true); }
    }, "stir"); stir.className = "primary";
    $("activity").append(finished, stir);
    const details = dom("details", undefined, "recipe-review"); details.append(dom("summary", "Look at our recipe"), dom("p", recipeText(cup.recipe)));
    const edit = button("Change the plan before pouring", () => { if (M.editEmptyPlan(session, friend)) render(true); }, "edit-plan");
    details.append(edit, dom("p", "Once ingredients are poured, we keep that drink. We cannot turn it back into separate bottles.", "aside"));
    $("activity").append(details); updateMeasuring();
  }
  function updateMeasuring() {
    const cup = active(), v = M.amounts(session, friend);
    for (const key of M.INGREDIENTS.filter(key => cup.recipe[key] > 0)) {
      const left = cup.recipe[key] - cup.poured[key];
      $(`supply-${key}`).textContent = `${cup.poured[key]} of ${cup.recipe[key]} scoops added. Supply: ${session.stock[key]} scoops.`;
      $(`progress-${key}`).textContent = `${v.measuredMl} mL measured / ${v.targetMl} mL planned`;
      const single = $(`add-${key}`), rest = $(`rest-${key}`);
      single.replaceChildren(dom("span", "Add 1 scoop"), dom("span", "+25 mL", "button-volume"));
      rest.replaceChildren(dom("span", `Add remaining ${left}`), dom("span", `+${left * 25} mL`, "button-volume"));
      single.disabled = rest.disabled = left === 0 || cup.stirred;
    }
    const record = $("measure-record"); record.replaceChildren(); record.dataset.measuredMl = v.measuredMl; record.dataset.targetMl = v.targetMl;
    record.append(dom("h3", `${cup.name}'s measuring record`));
    const numbers = dom("div", undefined, "volume-values");
    for (const [name, value] of [["Measured in", v.measuredMl], ["Recipe goal", v.targetMl]]) {
      const p = dom("p"); p.append(dom("span", name), dom("strong", `${value} mL`)); numbers.append(p);
    }
    record.append(numbers);
    const details = dom("div", undefined, "record-details");
    M.INGREDIENTS.filter(key => cup.recipe[key] > 0).forEach(key => {
      const line = dom("p", undefined, "record-item"); line.append(dom("span", M.NAMES[key]), dom("strong", `${cup.poured[key] * 25} mL`)); details.append(line);
    });
    record.append(details);
    const delta = dom("div", undefined, "volume-change"); delta.id = "measure-change";
    if (change) { delta.dataset.addedMl = change.added; delta.append(dom("strong", `+${change.added} mL`), dom("span", `${change.before} + ${change.added} = ${change.after} mL`)); }
    else delta.append(dom("span", cup.stirred ? "The measured ingredients stay in this cup." : "The record changes with each full scoop."));
    record.append(delta, dom("p", "This records portions, not liquid layers or colours.", "aside"));
    const progressLines = cup.stirred ? [M.complete(session) ? T.all : T.another] : M.filled(session, friend) ? [B.mix.measured(M.total(cup.poured), cup.prediction), T.filled] : [T.measuring];
    $("mix-status").replaceChildren(...paragraphs(progressLines));
    $("stir").disabled = !M.filled(session, friend) || cup.stirred;
    $("stir").textContent = cup.stirred ? "This drink is stirred" : "Stir this drink";
    $("edit-plan").disabled = M.total(cup.poured) > 0;
    updateScene(); markSpeech();
  }
  function table() {
    $("activity").append(dom("h2", "Choose a coaster"), dom("p", B.guidance.coaster));
    const shapes = dom("div", undefined, "row"), colours = dom("div", undefined, "row");
    colours.style.margin = "16px 0";
    for (const shape of ["circle", "square"]) {
      const b = button(shape, () => {
        coasterShape = shape;
        shapes.querySelectorAll("button").forEach(n => n.setAttribute("aria-pressed", String(n === b)));
      }, `shape-${shape}`, coasterShape === shape);
      const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      icon.setAttribute("viewBox", "0 0 44 44"); icon.setAttribute("width", "36"); icon.setAttribute("height", "36"); icon.setAttribute("aria-hidden", "true");
      icon.innerHTML = shape === "circle" ? '<circle cx="22" cy="22" r="16" fill="#dba69a" stroke="#6d5647" stroke-width="2"/>' : '<rect x="6" y="6" width="32" height="32" fill="#a9bd9b" stroke="#6d5647" stroke-width="2"/>';
      b.prepend(icon); b.style.display = "inline-flex"; b.style.alignItems = "center"; b.style.gap = "8px"; shapes.append(b);
    }
    for (const [name, value] of Object.entries(M.COLOURS)) {
      const b = button(name, () => {
        coasterColour = name;
        colours.querySelectorAll("button").forEach(n => n.setAttribute("aria-pressed", String(n === b)));
      }, `colour-${name}`, coasterColour === name);
      b.className = "colour-choice"; b.style.background = value; b.style.color = "#332c25"; colours.append(b);
    }
    $("activity").append(shapes, colours);
    cupRecords(true);
    const guidance = dom("p", "", "reader-feedback"); guidance.id = "coaster-guidance"; guidance.setAttribute("role", "status");
    guidance.hidden = !session.cups.every(c => c.coaster);
    $("activity").append(guidance);
    if (session.cups.every(c => c.coaster)) guidance.textContent = B.guidance.ending;
    $("activity").append(dom("p", "Any colour or shape can belong at our table. You can change your design.", "aside"));
    comparison();
  }
  function cupRecords(editable = false, parent = $("activity")) {
    const cups = dom("div", undefined, "table-cups");
    session.cups.forEach((cup, i) => {
      const card = dom("div", undefined, "table-cup"), picture = dom("div", undefined, "table-picture"); picture.id = `table-picture-${i}`; picture.innerHTML = cupSvg(i, false);
      card.append(picture, dom("h3", cup.name), dom("p", `${M.total(cup.poured) * M.SCOOP_ML} mL`, "serving-amount"), dom("p", `Measured in. ${status(i)}.`, "serving-label"));
      if (editable) card.append(button(`Place for ${cup.name}`, () => {
        options.onStop?.();
        M.coaster(session, i, coasterShape, coasterColour); picture.innerHTML = cupSvg(i, false); updateScene();
        say(`A ${coasterColour} ${coasterShape} coaster is under ${cup.name}'s cup.`);
        if (session.cups.every(c => c.coaster)) { $("coaster-guidance").hidden = false; $("coaster-guidance").textContent = B.guidance.ending; read([B.guidance.ending]); }
        else setSegment([B.guidance.coaster]);
      }, `coaster-${i}`));
      cups.append(card);
    });
    parent.append(cups);
  }
  function comparison() {
    const ready = session.cups.map((_, i) => i).filter(i => M.ready(session, i));
    if (ready.length >= 2) {
      const section = dom("div", undefined, "comparison");
      section.append(dom("h3", "Would we like to make these again?"), dom("p", "Bear kept the recipes beside the drinks. We can compare what we actually measured."));
      const row = dom("div", undefined, "row"), result = dom("div"); result.id = "comparison-result";
      for (let a = 0; a < ready.length; a++) for (let b = a + 1; b < ready.length; b++) {
        const i = ready[a], j = ready[b];
        row.append(button(`${M.FRIENDS[i]} and ${M.FRIENDS[j]}`, () => {
          const comparison = M.compare(session, i, j);
          if (!comparison) return;
          const lines = B.mix.comparison(comparison);
          result.replaceChildren(...paragraphs([lines[0]]));
          const amounts = dom("div", undefined, "compare-amounts");
          for (const k of [i, j]) { const p = dom("p"); p.append(dom("strong", M.FRIENDS[k]), dom("span", recipeText(session.cups[k].poured))); amounts.append(p); }
          result.append(amounts, ...paragraphs([lines[1]])); read(lines);
        }, `compare-${i}-${j}`));
      }
      section.append(row, result); $("activity").append(section);
    }
  }
  function ending() {
    if (M.complete(session)) {
      const record = dom("details", undefined, "preparation-record");
      record.append(dom("summary", "Look back at our preparation"), dom("p", T.historical));
      cupRecords(false, record); $("activity").append(record);
    } else {
      $("activity").append(dom("h2", "Our cups and their recipes")); cupRecords();
    }
  }
  function render(narrate = false) {
    options.onStop?.();
    currentSegment = null;
    generation++;
    document.body.classList.add("mixes-book");
    document.body.dataset.page = page; document.body.dataset.friend = friend; document.body.dataset.variant = session.id;
    if (options.embedded) { document.body.dataset.route = "free"; $("chapter").textContent = "Juice for Our Friends"; $("activity").hidden = false; }
    const painting = $("painting").querySelector("img");
    const drinking = page === "ending" && M.complete(session);
    const scene = drinking ? "drinking-v2" : ["table", "ending"].includes(page) ? "table-v1" : "measuring-table-v2";
    painting.src = `assets/juice/${scene}.jpg`;
    painting.alt = drinking ? "Bunny and Bear sip from mugs while Duck sips through a straw, with his feathered wings at his sides." : "Bunny, Bear and Duck gather beside their clean kitchen counter.";
    $("activity").replaceChildren(); $("next-actions").replaceChildren(); say(""); $("back").disabled = !previous.length;
    if (page === "welcome") {
      $("title").textContent = "Our little recipes";
      $("lines").replaceChildren(...paragraphs(T.welcome));
      const choices = dom("div", undefined, "branch-choices");
      choices.append(button("Make our own recipes", () => go("make"), "make-recipes"));
      $("activity").append(choices);
    } else if (page === "make") {
      $("title").textContent = "A recipe of our own";
      $("lines").replaceChildren(...paragraphs(T.make));
      renderFriends(); if (active().measuring) measuring(); else planning();
      $("next-actions").append(button("Set our table", () => go("table"), "finish"));
    } else if (page === "table") {
      $("title").textContent = "A place at the table";
      $("lines").replaceChildren(...paragraphs(B.pages.table.lines)); table();
      $("next-actions").append(button("Read the ending", () => go("ending"), "read-ending"));
    } else {
      $("title").textContent = drinking ? "A sip of our own" : "Made our own way";
      const progress = M.complete(session) ? "Each friend had a stirred drink, with its recipe kept beside it." : M.used(session) ? "They kept the drinks they had started. Anything unfinished could wait." : "The ingredients were still in their bottles. There was no hurry to begin.";
      $("lines").replaceChildren(...paragraphs(drinking ? T.drinking : [progress, ...T.closing]));
      ending();
      $("next-actions").append(button("Return to our recipes", () => go("make"), "return-recipes"));
      if (options.embedded) $("next-actions").append(button("Visit another way the story could go", options.onExit, "other-telling"));
    }
    $("back").disabled = options.embedded ? false : !previous.length;
    updateScene(); markSpeech();
    options.onView?.(narrate);
  }
  function back() {
    const last = previous.pop(); if (!last) { options.onExit?.(); return; }
    friend = last.friend; go(last.page, false);
  }
  function reset(index) { generation++; session = M.createSession(index); page = "welcome"; friend = 0; previous = []; change = null; currentSegment = null; coasterShape = "circle"; coasterColour = "pink"; }
  if (!options.embedded) {
  $("back").addEventListener("click", back);
  $("parent-open").addEventListener("click", () => $("parent-dialog").showModal());
  $("parent-close").addEventListener("click", () => $("parent-dialog").close());
  $("new-reading").addEventListener("click", () => {
    const token = ++confirmation;
    for (const id of ["restart-yes", "restart-no"]) { const old = $(id); old.replaceWith(old.cloneNode(true)); }
    const yes = $("restart-yes"), no = $("restart-no");
    yes.addEventListener("click", () => {
      if (token !== confirmation || !yes.isConnected || !$("restart-dialog").open) return;
      confirmation++; $("restart-dialog").close();
      session = M.createSession((session.id + 1 + Math.floor(Math.random() * (M.IDEAS.length - 1))) % M.IDEAS.length);
      friend = 0; previous = []; go("welcome", false);
    });
    no.addEventListener("click", () => { if (token === confirmation) { confirmation++; $("restart-dialog").close(); } });
    $("restart-dialog").showModal();
  });
  $("restart-dialog").addEventListener("cancel", () => { confirmation++; });
  render();
  }
  return { enter: () => render(), leave: () => { generation++; document.body.classList.remove("mixes-book"); }, back, reset, readingLines, key: () => `${page}:${friend}:${active().revision}:${active().measuring}:${active().stirred}` };
  }
  window.JuiceMixReader = { create };
  if (!document.getElementById("book")) create();
})();
