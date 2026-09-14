/* Bunny's Birthday Picnic — story engine.

   Narration is only ever the recorded Doubao mp3 set (see story-audio.js).
   A missing clip STOPS the reading where it is, says so and offers to try
   again: it is never mistaken for a line that has been read. Nothing else
   ever speaks - there is no browser voice anywhere in this book.

   One session is built when a read begins and is frozen. Page turns, replays,
   hints and wrong answers never rebuild it, so the book cannot change under
   the child. Only starting again from home draws a new seed.

   Maths flow, in this order, always:
     situation  -> lay out the model -> the child tries -> the sum is revealed
                -> what the answer was for
   The equation and any running total are hidden until after the attempt. */

(() => {
  "use strict";

  const S = window.YoyoStory;
  const V = window.YoyoVariants;
  const PAGES = S.pages;
  const LAST = PAGES.length - 1;
  const FRAME_CAPACITY = 20;

  const Sound = window.YoyoSound.createSound({ Audio: window.Audio });
  const Art = window.YoyoArt;

  /* Painted props are preferred; a missing file falls back to the drawn
     version from the same art set, never to a blank or a flat icon. */
  const prop = { berry: true, plate: true, pennant: true, party: true };

  /* ------------------------------------------------------------------ */
  /* records                                                             */
  /* ------------------------------------------------------------------ */

  const STORE_KEY = "yoyoStory.records.v1";
  const ART_KEY = "yoyoStory.artwork.v1";
  const SEED_KEY = "yoyoStory.lastSeed.v1";

  const Store = {
    read() {
      try { return JSON.parse(localStorage.getItem(STORE_KEY)) || { rounds: [] }; }
      catch (_) { return { rounds: [] }; }
    },
    write(data) {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); return true; }
      catch (_) { return false; }
    },
    startRound(seed) {
      const data = this.read();
      data.rounds.push({ startedAt: Date.now(), seed, tasks: {}, replays: 0 });
      if (data.rounds.length > 24) data.rounds = data.rounds.slice(-24);
      this.write(data);
    },
    noteTask(taskId, skill, name, { solo, attempts, hintsUsed, skipped }) {
      const data = this.read();
      if (!data.rounds.length) data.rounds.push({ startedAt: Date.now(), tasks: {}, replays: 0 });
      const round = data.rounds[data.rounds.length - 1];
      const prev = round.tasks[taskId] || { attempts: 0, hintsUsed: 0, tries: 0, solo: true };
      round.tasks[taskId] = {
        skill, name, skipped: Boolean(skipped),
        solo: prev.tries === 0 ? solo : (prev.solo && solo),
        attempts: prev.attempts + attempts,
        hintsUsed: prev.hintsUsed + hintsUsed,
        tries: prev.tries + 1,
        at: Date.now()
      };
      this.write(data);
    },
    noteReplay() {
      const data = this.read();
      if (!data.rounds.length) return;
      data.rounds[data.rounds.length - 1].replays += 1;
      this.write(data);
    },
    saveArt(dataUrl) {
      try { localStorage.setItem(ART_KEY, dataUrl); return true; } catch (_) { return false; }
    },
    readArt() { try { return localStorage.getItem(ART_KEY) || ""; } catch (_) { return ""; } },
    lastSeed() { try { return Number(localStorage.getItem(SEED_KEY)); } catch (_) { return NaN; } },
    rememberSeed(seed) { try { localStorage.setItem(SEED_KEY, String(seed)); } catch (_) {} }
  };

  /* ------------------------------------------------------------------ */
  /* dom helpers                                                         */
  /* ------------------------------------------------------------------ */

  const $ = (sel) => document.querySelector(sel);
  const el = (tag, cls, html) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html != null) node.innerHTML = html;
    return node;
  };

  function showScreen(name) {
    document.querySelectorAll(".screen").forEach((s) => {
      s.classList.toggle("is-active", s.dataset.screen === name);
    });
  }

  let toastTimer = 0;
  function toast(message) {
    const node = $("#toast");
    node.textContent = message;
    node.classList.add("is-up");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove("is-up"), 2600);
  }

  /* ------------------------------------------------------------------ */
  /* drawn pieces: strawberries and decorations                          */
  /* ------------------------------------------------------------------ */

  function fillBerry(host) {
    host.innerHTML = "";
    if (!prop.berry) { host.append(el("span", "berry-svg", Art.BERRY_SVG)); return; }
    const img = new Image();
    img.alt = "";
    img.draggable = false;
    img.addEventListener("error", () => {
      prop.berry = false;
      host.innerHTML = "";
      host.append(el("span", "berry-svg", Art.BERRY_SVG));
    });
    img.src = "assets/story/strawberry.png";
    host.append(img);
  }


  const hexOf = (colourId) => (V.COLOURS.find((c) => c.id === colourId) || V.COLOURS[0]).hex;
  const nameOf = (item) => {
    const c = V.COLOURS.find((x) => x.id === item.colour);
    const s = V.SHAPES.find((x) => x.id === item.shape);
    return `${c ? c.word : item.colour} ${s ? s.word : item.shape}`;
  };
  const decorArt = (item) => Art.decorationSvg(item.shape, hexOf(item.colour));

  /* A flag as it looks in the strip: the same component the rope hangs. */
  function pennantSvg(item) {
    const w = Art.PENNANT_W, h = Art.PENNANT_H;
    return `<svg class="art-flag" viewBox="${-w / 2 - 3} -4 ${w + 6} ${h + 8}" aria-hidden="true">`
      + Art.pennant(item, hexOf(item.colour), { usePng: prop.pennant })
      + `</svg>`;
  }

  /* The same paper, with nothing decided on it yet. */
  function blankPennantSvg() {
    const w = Art.PENNANT_W, h = Art.PENNANT_H;
    return `<svg class="art-flag" viewBox="${-w / 2 - 3} -4 ${w + 6} ${h + 8}" aria-hidden="true">`
      + Art.blankPennant({ usePng: prop.pennant })
      + `</svg>`;
  }

  /* ------------------------------------------------------------------ */
  /* book state                                                          */
  /* ------------------------------------------------------------------ */

  const book = {
    page: 0,
    mode: "listen",
    captions: true,
    playing: false,
    lineIndex: 0,
    epoch: 0,
    taskOpen: false,
    session: null,
    groupsDone: false,
    partyFlags: null,
    /* Only used when the strategy module is loaded: this reading's actual
       named strawberries, and the per-page prediction/help state that must
       survive turning a page and coming back. Both are in memory only. */
    stock: null,
    mathsState: {},
    mathsHistory: null,
    mathsNote: null,
    /* Whether the child has asked to be read to. Read with me and Listen set
       it; Stop listening clears it. While it is false a page turn shows the
       page and says nothing: stopping the voice means stopping the voice, not
       stopping it until the next page. */
    listening: false,
    /* the pages this reading has really heard, so a control never offers to
       repeat something that has not happened */
    heard: new Set(),
  };

  const fresh = () => book.epoch;
  const stillValid = (mark) => mark === book.epoch;
  function later(ms, mark, fn) {
    setTimeout(() => { if (stillValid(mark)) fn(); }, ms);
  }

  /* Speech and page turns are dropped if the tab went away while they were
     waiting. Everything else deferred still runs, so a half-finished action
     such as taking a strawberry off the frame always commits. */
  function laterIfVisible(ms, mark, fn) {
    later(ms, mark, () => { if (!document.hidden) fn(); });
  }

  /* Two lines in a row, the second starting only once the first has actually
     finished. A fixed delay cannot know how long a recording is, and the
     longer ones were being cut off partway through. Cancelling still works:
     a page turn, a replay or hiding the tab all stop the player, which ends
     the queue. */
  function speakInOrder(mark, ...lines) {
    const queue = lines.filter(Boolean);
    if (!queue.length || document.hidden || !stillValid(mark)) return Promise.resolve("cancelled");
    return Sound.playSequence(queue, 0, null);
  }

  function newSeed() {
    const previous = Store.lastSeed();
    let seed = 0;
    for (let i = 0; i < 8; i += 1) {
      seed = (Math.floor(Math.random() * 0x7fffffff)) >>> 0;
      if (!Number.isFinite(previous) || seed !== previous) break;
    }
    Store.rememberSeed(seed);
    return seed;
  }

  /* ------------------------------------------------------------------ */
  /* page rendering                                                      */
  /* ------------------------------------------------------------------ */

  /* Where the decoration the child chose actually goes.

     Measured on the delivered assets/story/page-2.png (1536x1024): the empty
     plate on the tablecloth is centred on (800, 780), which is 52.1% across
     and 76.2% down. The mark is about 11% of the painting's width.

     These are fractions of the painting, not of the box it sits in. The plate
     is a 3:2 box and the paintings are 3:2 as well, but object-fit: contain
     still letterboxes whenever the two disagree even slightly, so the drawn
     rectangle is measured from naturalWidth/naturalHeight every time rather
     than assumed to fill the element. */
  const DECOR_SPOTS = {
    "page-2": { x: 0.521, y: 0.762, size: 0.11 }
  };

  /* The rectangle the painting is actually drawn in, inside its element. */
  function containedRect(img) {
    const boxW = img.clientWidth || img.offsetWidth || 0;
    const boxH = img.clientHeight || img.offsetHeight || 0;
    const natW = img.naturalWidth || 0;
    const natH = img.naturalHeight || 0;
    if (!boxW || !boxH || !natW || !natH) return null;
    const scale = Math.min(boxW / natW, boxH / natH);
    const w = natW * scale;
    const h = natH * scale;
    return { left: (boxW - w) / 2, top: (boxH - h) / 2, width: w, height: h };
  }

  function positionDecoration(mark, img, spot) {
    const rect = containedRect(img);
    if (!rect) return false;
    const size = rect.width * spot.size;
    mark.style.width = `${size.toFixed(2)}px`;
    mark.style.height = `${size.toFixed(2)}px`;
    mark.style.left = `${(rect.left + rect.width * spot.x - size / 2).toFixed(2)}px`;
    mark.style.top = `${(rect.top + rect.height * spot.y - size / 2).toFixed(2)}px`;
    return true;
  }

  /* Put this read's chosen decoration back onto the painting it belongs to.
     Called on every render of that page, so turning away and coming back finds
     it still there, and any other page never shows it. */
  function paintChosenDecoration(plate, img, pageId) {
    const chosen = book.chosenDecoration;
    if (!chosen || chosen.pageId !== pageId) return null;
    const spot = DECOR_SPOTS[pageId];
    if (!spot) return null;

    const mark = el("span", "plate-decor", decorArt(chosen.item));
    mark.setAttribute("aria-label", `${nameOf(chosen.item)} on the plate`);
    plate.append(mark);

    const place = () => { if (mark.parentElement) positionDecoration(mark, img, spot); };
    if (!positionDecoration(mark, img, spot)) img.addEventListener("load", place, { once: true });
    /* the painting is fluid, so the mark is re-measured whenever it resizes */
    if (typeof ResizeObserver === "function") {
      const observer = new ResizeObserver(place);
      observer.observe(img);
      mark._observer = observer;
    } else if (window.addEventListener) {
      window.addEventListener("resize", place);
      mark._offResize = () => window.removeEventListener("resize", place);
    }
    return mark;
  }

  function renderPlate(page) {
    const plate = $("#plate");
    const old = plate.querySelectorAll ? plate.querySelectorAll(".plate-decor") : [];
    Array.prototype.forEach.call(old, (node) => {
      if (node._observer) node._observer.disconnect();
      if (node._offResize) node._offResize();
    });
    plate.innerHTML = "";
    const img = new Image();
    img.alt = "";
    img.decoding = "async";
    img.addEventListener("error", () => {
      plate.innerHTML = `<div class="plate-fallback"><svg viewBox="0 0 900 600" role="img" aria-label="${page.title}">${page.fallback}</svg></div>`;
    });
    img.src = page.image;
    plate.append(img);
    book.plateImage = img;
    paintChosenDecoration(plate, img, page.id);
  }

  /* The unfinished bunting, visible from the first page.

     The flags are shown as plain paper with nothing on them, which is exactly
     what the story says they are - begun, not finished. Because they carry no
     colour and no shape, seeing them cannot give away this read's pattern.
     They are put away on the rainy page, come back out to dry, and are gone
     from the last page because the task itself is holding them by then. */
  const PROP_STAGE = {
    "page-1": "making",
    "page-2": "making",
    "page-3": "making",
    "page-4": "packed",
    "page-5": "drying",
    "page-6": null
  };

  const PROP_WORDS = {
    making: "The paper flags Duck has made so far",
    packed: "The paper flags, safe inside the basket",
    drying: "The paper flags, drying out"
  };

  function renderPageProps(page) {
    const row = $("#pageProps");
    if (!row) return;
    row.innerHTML = "";
    row.className = "page-props";

    const stage = PROP_STAGE[page.id];
    const task = book.session && book.session.tasks["page-6"];
    if (!stage || !task) return;

    row.classList.add(`is-${stage}`);
    row.setAttribute("role", "img");
    row.setAttribute("aria-label", PROP_WORDS[stage]);

    if (stage === "packed") {
      row.append(el("span", "props-basket", Art.BASKET_SVG));
      return;
    }
    for (let i = 0; i < task.strip.length; i += 1) {
      const flag = el("span", "props-flag");
      flag.style.setProperty("--n", String(i));
      flag.innerHTML = blankPennantSvg();
      row.append(flag);
    }
  }

  function renderDots() {
    const wrap = $("#dots");
    wrap.innerHTML = "";
    PAGES.forEach((_, i) => {
      const dot = el("span", "page-dot");
      if (i === book.page) dot.classList.add("is-current");
      else if (i < book.page) dot.classList.add("is-done");
      wrap.append(dot);
    });
  }

  /* The captions toggle says what it does now, not what it is. */
  function updateCaptionButton() {
    const btn = $("#captionBtn");
    if (!btn) return;
    btn.classList.toggle("is-on", book.captions);
    btn.setAttribute("aria-pressed", String(book.captions));
    btn.textContent = book.captions ? "Hide the words" : "Show the words";
    btn.setAttribute("aria-label", book.captions ? "Hide the words" : "Show the words");
  }

  function setCaption(text) {
    const node = $("#caption");
    node.textContent = text || "";
    node.classList.toggle("is-hidden", !book.captions);
  }

  function clearTask() {
    $("#taskArea").innerHTML = "";
    book.taskOpen = false;
  }

  /* ONE control for the whole page, said in words.

     There used to be a play/pause icon, a line replay, a page replay, a
     captions toggle and a mode toggle in two clusters under the picture. The
     parent asked for a calm, consistent reader across the books, so the page
     control is now a single labelled button - Listen again while it is quiet,
     Stop listening while it is reading - and the other four are folded away
     under More controls with exactly the behaviour they always had. */
  /* Three words for three states, and never the wrong one.

     "Listen again" on a page nobody has heard yet is an offer to repeat
     something that never happened. The button says Listen until this page has
     really been heard, Listen again once it has, and Stop listening while it
     is reading. `heard` is a set of page ids, filled in only when a clip has
     actually played to its end - a page whose recording was missing has not
     been heard, and still says Listen. */
  const LISTEN = "Listen";
  const LISTEN_AGAIN = "Listen again";
  const STOP_LISTENING = "Stop listening";

  const heardLabel = () => (book.heard && book.heard.has(PAGES[book.page].id)
    ? LISTEN_AGAIN
    : LISTEN);

  function setPlaying(value) {
    /* Turning it off ends the reading that was running, so a loop still
       waiting on a clip cannot come back and write over the page. */
    if (!value) readingTurn += 1;
    book.playing = value;
    const btn = $("#playBtn");
    const label = value ? STOP_LISTENING : heardLabel();
    btn.textContent = label;
    btn.setAttribute("aria-label", label);
    btn.setAttribute("aria-pressed", value ? "true" : "false");
    /* the tint belongs to a voice that is speaking */
    if (!value) markSpeaking(false);
  }

  /* Where the voice is, shown as a soft tint on the words being said and
     nothing else: no size change, no scroll, no fade. The caption IS the line
     being read in this book, so there is exactly one place for it. */
  function markSpeaking(on) {
    const node = $("#caption");
    if (node) node.classList.toggle("reader-speaking", Boolean(on) && book.captions);
  }

  /* What the sound is doing, in words, in its own reserved space. A missing
     recording is said here and stays said; it is never mistaken for a page
     that has been read. */
  const SOUND = {
    idle: "",
    reading: "Reading this page.",
    finished: "That is the whole page.",
    blocked: "Tap Listen again to start the sound.",
    /* Only the current line is on screen, so the old wording - "the words are
       all on the page" - was not true. This says what is really there. */
    missing: "This part has no sound right now. You can read it together and try again.",
    retry: "Try the sound again"
  };

  function setSoundNote(message, { problem = false, retry = false } = {}) {
    const note = $("#audioStatus");
    if (!note) return;
    note.textContent = message || "";
    note.classList.toggle("is-problem", Boolean(problem));
    const button = $("#retryAudioBtn");
    if (button) button.hidden = !retry;
  }

  /* One source for every word of a page: what the child hears, what the
     caption shows, what a single-line replay says and what the catalogue has
     to contain. They cannot disagree, because there is only one of them.

     Without the module this is exactly the delivered PAGES[i].lines. With it,
     the candidate's replacement for the old count-all instruction applies, and
     a line describing something a character actually did on this page is read
     as part of the page - so a listening-only reading hears and sees it too,
     under the ordinary queue, replay and cancellation rules. */
  function linesOf(page) {
    if (!MathsModule || !page) return page ? page.lines : [];
    const said = page.lines.map((line) => MathsModule.lineFor(line));
    if (book.mathsNote && book.mathsNotePage === page.id) {
      return [book.mathsNote].concat(said);
    }
    return said;
  }

  function goToPage(index, { autoplay = true } = {}) {
    book.epoch += 1;
    Sound.stop();
    setPlaying(false);
    /* a note about the page being left is not about the page being opened */
    setSoundNote(SOUND.idle);

    book.page = Math.max(0, Math.min(LAST, index));
    book.lineIndex = 0;
    const page = PAGES[book.page];

    /* The sharing needs the whole supply before it can start. If the child
       reads on with strawberries still in Bear's handful, Bear finishes that
       himself and the page says so; it is never recorded as her work, and
       going back afterwards shows what really happened rather than rewinding
       the basket. */
    if (MathsModule && book.stock) MathsModule.settle(book, page.id, book.session);

    clearTask();
    renderPlate(page);
    renderPageProps(page);
    renderDots();
    $("#stageTitle").textContent = page.title;
    setCaption(linesOf(page)[0]);
    $("#prevBtn").disabled = book.page === 0;

    showScreen("story");
    /* Turning the page reads it, but only while the child is being read to.
       After Stop listening the book keeps its words and its pictures and stays
       quiet, page after page, until Listen is pressed again. */
    if (autoplay && book.listening) readPage(0);
    else setPlaying(false);
  }

  /* Reading a page, one line at a time, so that each line's own result is
     known.

     This used to hand the whole page to playSequence, which waits a moment on
     a clip it cannot load and then carries on to the next one. With the local
     server down every clip was missing, so the book read itself silently, in
     silence, all the way to the end of the page and then turned it. The child
     heard nothing and the page moved anyway.

     A line that will not play now stops the reading where it is, says so, and
     offers to try again. The words stay on screen, the page does not turn by
     itself, and nothing about the task, the basket or the drawing is touched.
     A missing recording is a missing recording; it is never a finished
     reading. */
  /* Which reading of a page is the current one. playSequence used to hold this
     for the whole page; reading line by line means holding it here, so that
     asking for the page again while it is still going replaces the reading
     instead of running two of them at once. */
  let readingTurn = 0;

  async function readPage(fromLine) {
    const mark = fresh();
    const turn = readingTurn + 1;
    readingTurn = turn;
    const mine = () => stillValid(mark) && readingTurn === turn;
    const page = PAGES[book.page];
    const said = linesOf(page);
    const start = Math.max(0, Math.min(said.length - 1, fromLine == null ? book.lineIndex : fromLine));

    setPlaying(true);
    setSoundNote(SOUND.reading);

    for (let i = start; i < said.length; i += 1) {
      if (!mine()) return;
      book.lineIndex = i;
      setCaption(said[i]);

      /* The tint goes on with the line and stays on for as long as that line
         is the one being read. Clearing it between clips and putting it back
         would be a flicker, which is exactly the kind of motion this is meant
         to avoid; setPlaying(false) takes it off when the voice stops. */
      markSpeaking(true);
      const status = await Sound.play(said[i]);
      if (!mine()) return;
      if (status === "cancelled") return;
      /* heard, really: a clip that played to its end. A missing one leaves the
         page unheard, so its control still says Listen rather than offering to
         repeat silence. */
      if (status !== "blocked" && status !== "missing") book.heard.add(page.id);

      if (status === "blocked") {
        setPlaying(false);
        setSoundNote(SOUND.blocked, { retry: true });
        return;
      }
      if (status === "missing") {
        /* stop here: the rest of the page has not been read */
        setPlaying(false);
        setSoundNote(SOUND.missing, { problem: true, retry: true });
        return;
      }
    }

    if (!mine()) return;
    setPlaying(false);
    setSoundNote(SOUND.finished);

    book.lineIndex = said.length - 1;

    const task = book.session && book.session.tasks[page.id];
    if (book.mode === "play" && task) { openTask(task); return; }
    if (book.page < LAST) { laterIfVisible(700, mark, () => goToPage(book.page + 1)); return; }
    finishBook();
  }

  function finishBook() {
    const mark = fresh();
    const art = Store.readArt();
    const wrap = $("#taskArea");
    wrap.innerHTML = "";

    const card = el("div", "task");
    card.append(el("p", "task-prompt", "The end. Thank you for listening!"));

    if (art) {
      const gallery = el("div", "gallery");
      const figure = document.createElement("figure");
      const image = new Image();
      image.src = art;
      image.alt = "Your picture";
      figure.append(image);
      gallery.append(figure);
      card.append(gallery);
    }

    const actions = el("div", "task-actions");
    const again = el("button", "btn btn-secondary", "Read it again");
    again.addEventListener("click", () => startBook(book.mode));
    const draw = el("button", "btn btn-primary", "Draw a picture");
    draw.addEventListener("click", openStudio);
    const home = el("button", "btn btn-quiet", "Home");
    home.addEventListener("click", exitToHome);
    actions.append(again, draw, home);

    card.append(actions);
    wrap.append(card);
    book.taskOpen = true;
    if (stillValid(mark)) Sound.play(S.uiLines.storyEnd);
  }

  function exitToHome() {
    resetRuntime();
    showScreen("home");
  }

  /* ------------------------------------------------------------------ */
  /* task shell                                                          */
  /* ------------------------------------------------------------------ */

  function taskCard(promptText) {
    const card = el("div", "task");
    const prompt = el("p", "task-prompt", promptText);
    const hint = el("p", "task-hint", "");
    card.append(prompt, hint);
    card._prompt = prompt;
    card._hint = hint;
    return card;
  }

  function glossaryRow(card, keys) {
    if (!keys || !keys.length) return;
    const row = el("div", "glossary");
    keys.forEach((key) => {
      const text = V.WORD_HELP[key];
      if (text) row.append(el("span", "gloss", text));
    });
    if (row.childNodes.length) card.append(row);
  }

  /* Buttons always speak the step the child is on, never the first one. */
  function hintRow(card, state, getHints, getReplayText, meta) {
    const actions = el("div", "task-actions");
    const mark = fresh();

    const listen = el("button", "btn btn-secondary", "Hear it again");
    listen.addEventListener("click", () => {
      if (!stillValid(mark)) return;
      Store.noteReplay();
      state.replays += 1;
      Sound.play(getReplayText());
    });

    const help = el("button", "btn btn-secondary", "Help me");
    help.addEventListener("click", () => {
      if (!stillValid(mark)) return;
      const hints = getHints();
      const level = Math.min(state.hintLevel, hints.length - 1);
      const text = hints[level];
      card._hint.textContent = text;
      card._hint.classList.remove("is-warm");
      state.hintsUsed += 1;
      if (state.hintLevel < hints.length - 1) state.hintLevel += 1;
      Sound.play(text);
    });

    const skip = el("button", "btn btn-quiet", "Skip this bit");
    skip.addEventListener("click", () => {
      if (!stillValid(mark)) return;
      if (meta) {
        Store.noteTask(meta.taskId, meta.skill, meta.name, {
          solo: false, attempts: state.wrong, hintsUsed: state.hintsUsed, skipped: true
        });
      }
      Sound.stop();
      advanceAfterTask();
    });

    actions.append(listen, help, skip);
    card.append(actions);
    return actions;
  }

  function finishTask(card, state, meta, successLine, followUpLine) {
    Store.noteTask(meta.taskId, meta.skill, meta.name, {
      solo: state.wrong === 0 && state.hintsUsed === 0,
      attempts: state.wrong + 1,
      hintsUsed: state.hintsUsed,
      skipped: false
    });
    card._hint.classList.remove("is-warm");
    if (successLine) card._hint.textContent = successLine;
    speakInOrder(fresh(), successLine, followUpLine);
  }

  function nextStepRow(card, label, handler) {
    const row = el("div", "task-actions");
    const btn = el("button", "btn btn-primary", label);
    btn.addEventListener("click", handler);
    row.append(btn);
    card.append(row);
    return row;
  }

  /* Shown only once the child has answered: the sum, then why it mattered. */
  function revealSum(card, task) {
    const box = el("div", "reveal");
    box.append(el("p", "reveal-sum", `${task.equation.replace(" = ?", "")} = ${task.answer}`));
    if (task.storyUse) box.append(el("p", "reveal-use", task.storyUse));
    card.append(box);
    return box;
  }

  function openTask(task) {
    /* Each card owns its own controls. Replaying a page, or opening the
       optional plates over the sharing, draws a new card, and everything the
       replaced one left behind is dead from here on. Only the candidate does
       this; the delivered book keeps exactly the lifetime it shipped with. */
    if (MathsModule) book.epoch += 1;
    const wrap = $("#taskArea");
    wrap.innerHTML = "";
    book.taskOpen = true;
    let card = null;
    if (task.type === "maths") card = buildMaths(task);
    else if (task.type === "find") card = buildChoice(task, "find");
    else if (task.type === "logic") card = buildChoice(task, "logic");
    else if (task.type === "pattern") card = buildPattern(task);
    if (card) wrap.append(card);
    wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function advanceAfterTask() {
    if (book.page === LAST) { finishBook(); return; }
    goToPage(book.page + 1);
  }

  /* The only optional activity in this episode is sharing out the berries
     that are left, and it is only offered on the page where the sharing
     actually happens. Nothing unrelated is ever attached to a page. */
  const SHARING_PAGE = "page-5";

  function offerExtras(card, task) {
    const row = nextStepRow(card, "Turn the page", advanceAfterTask);
    extrasButton(row, task);
    return row;
  }

  /* The one optional extra in this episode, offered on the page where the
     sharing actually happened and nowhere else. */
  function extrasButton(row, task) {
    const session = book.session;
    const onSharingPage = PAGES[book.page].id === SHARING_PAGE;
    if (!session || !session.groups || book.groupsDone) return row;
    if (!onSharingPage || task.relation === "groups") return row;

    const btn = el("button", "btn btn-secondary", "Share out the rest");
    btn.addEventListener("click", () => {
      book.groupsDone = true;
      openStandalone(session.groups);
    });
    row.append(btn);
    return row;
  }

  function openStandalone(task) {
    if (MathsModule) book.epoch += 1;
    const wrap = $("#taskArea");
    wrap.innerHTML = "";
    const card = buildMaths(task, true);
    wrap.append(card);
    wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  /* ------------------------------------------------------------------ */
  /* number strip                                                        */
  /* ------------------------------------------------------------------ */

  function numberStrip(task, state, card, mark, onRight) {
    const strip = el("div", "strip");
    for (let n = task.choicesFrom; n <= task.choicesTo; n += 1) {
      const btn = el("button", "strip-btn", String(n));
      btn.type = "button";
      btn.addEventListener("click", () => {
        if (!stillValid(mark) || state.phase !== "count") return;

        if (n !== task.answer) {
          state.wrong += 1;
          btn.classList.remove("is-wrong"); void btn.offsetWidth; btn.classList.add("is-wrong");
          const help = task.hints[Math.min(state.wrong - 1, task.hints.length - 1)];
          card._hint.classList.add("is-warm");
          card._hint.textContent = help;
          if (state.wrong >= 2) state.hintsUsed += 1;
          Sound.play(help);
          return;
        }

        state.phase = "done";
        btn.classList.add("is-right");
        strip.querySelectorAll(".strip-btn").forEach((b) => { b.disabled = true; });
        onRight();
      });
      strip.append(btn);
    }
    return strip;
  }

  /* ------------------------------------------------------------------ */
  /* maths: combine, take away, need, equal groups                       */
  /* ------------------------------------------------------------------ */

  function buildFrames() {
    const wrap = el("div", "frames");
    for (let f = 0; f < 2; f += 1) {
      const frame = el("div", "frame");
      for (let i = 0; i < 10; i += 1) {
        const cell = el("div", "cell");
        cell.dataset.index = String(f * 10 + i);
        frame.append(cell);
      }
      wrap.append(frame);
    }
    return wrap;
  }

  /* Taking berries out of the basket.

     Each berry is its own button, so any berry the child can see can be the
     one they take. It leaves the square it was actually in; nothing shuffles
     up to fill the gap and no other berry is removed in its place. The count
     is committed the moment the button is pressed, before any animation, and
     the button disables itself in the same tick - so pressing two different
     berries quickly counts two, and pressing the same berry twice counts one.
     Nothing is ever globally locked while a berry flies away. */
  function fillBasket(framesEl, count, onTake) {
    framesEl.querySelectorAll(".cell").forEach((cell, i) => {
      cell.innerHTML = "";
      cell.classList.remove("is-going");
      cell.classList.toggle("is-filled", i < count);
      if (i >= count) return;

      const btn = el("button", "berry-pick");
      btn.type = "button";
      btn.dataset.index = String(i);
      btn.setAttribute("aria-label", "take this strawberry");
      fillBerry(btn);
      btn.addEventListener("click", () => onTake(i, btn, cell));
      cell.append(btn);
    });
  }

  /* Empty one square without touching any other. */
  function emptyCell(cell, btn, mark, instant) {
    btn.disabled = true;
    if (instant) {
      cell.classList.remove("is-filled");
      cell.innerHTML = "";
      return;
    }
    cell.classList.add("is-going");
    later(220, mark, () => {
      cell.classList.remove("is-going", "is-filled");
      cell.innerHTML = "";
    });
  }

  function paintFrames(framesEl, count) {
    framesEl.querySelectorAll(".cell").forEach((cell, i) => {
      const filled = i < count;
      if (filled === cell.classList.contains("is-filled")) return;
      cell.classList.toggle("is-filled", filled);
      if (filled) {
        fillBerry(cell);
        cell.classList.remove("is-new"); void cell.offsetWidth; cell.classList.add("is-new");
      } else cell.innerHTML = "";
    });
  }

  let platePngOk = true;

  function buildPlates(groups, perGroup) {
    const wrap = el("div", "plates");
    for (let g = 0; g < groups; g += 1) {
      const plate = el("div", "plate-group");
      plate.append(el("span", "plate-label", `Plate ${g + 1}`));

      /* The dish gets a square container of its own, so the whole painted
         plate is laid out rather than an absolutely placed image hanging off a
         one-row strip. The berries then sit in the well at the centre. */
      const dishWrap = el("div", "plate-dish-wrap");
      if (!platePngOk) dishWrap.classList.add("is-drawn");

      /* the painted plate is only a dish to put things on; the strawberries
         on it are always placed one by one from the task data */
      if (platePngOk) {
        const dish = new Image();
        dish.className = "plate-dish";
        dish.alt = "";
        dish.draggable = false;
        dish.addEventListener("error", () => {
          platePngOk = false;
          dish.remove();
          document.querySelectorAll(".plate-dish-wrap").forEach((w) => w.classList.add("is-drawn"));
        });
        dish.src = "assets/story/empty-plate.png";
        dishWrap.append(dish);
      }

      const slots = el("div", "plate-slots");
      /* 2 and 3 sit in one row, 4 reads best as 2 and 2, 5 as 3 and 2. The
         well is sized from this so the rows cannot spill off the china. */
      slots.style.setProperty("--per-row", String(perGroup === 4 ? 2 : Math.min(perGroup, 3)));
      for (let i = 0; i < perGroup; i += 1) {
        const slot = el("div", "cell is-on-plate");
        slot.dataset.group = String(g);
        slot.dataset.slot = String(i);
        slots.append(slot);
      }
      dishWrap.append(slots);
      plate.append(dishWrap);
      wrap.append(plate);
    }
    return wrap;
  }

  /* ------------------------------------------------------------------ */
  /* the strategy module, when this entry loads it                        */
  /* ------------------------------------------------------------------ */

  /* story-maths.js is the picnic's accepted prediction/verification
     arithmetic. The staged integration candidate loads it; the delivered book
     does not include the script at all, so it keeps exactly the behaviour it
     was released with until the candidate is reviewed and activated. Nothing
     below runs unless the module is actually present. */
  const MathsModule = window.YoyoStoryMaths || null;
  let mathsView = null;

  function maths() {
    if (!MathsModule) return null;
    if (!mathsView) {
      mathsView = MathsModule.attach({
        el, fillBerry, book, Image: window.Image,
        plateArt: prop.plate,
        fresh, stillValid,
        speak: (line) => Sound.play(line),
        speakInOrder: (...lines) => speakInOrder(fresh(), ...lines),
        noteReplay: () => Store.noteReplay(),
        noteTask: (meta, outcome) => Store.noteTask(meta.taskId, meta.skill, meta.name, outcome),
        advance: advanceAfterTask,
        offerExtras: extrasButton
      });
    }
    return mathsView;
  }

  /* What page 5 may honestly call back to: the amounts page 3 actually
     joined, and whether that transfer really finished. */
  function mathsHistory() {
    if (!MathsModule || !book.session || !book.stock) return null;
    const add = book.session.tasks["page-3"];
    if (!add) return null;
    return {
      additionComplete: MathsModule.inExtra(book.stock) === 0,
      addedStart: add.startCount,
      addedChange: add.changeCount
    };
  }

  function buildMaths(task, standalone = false) {
    const view = maths();
    if (view && MathsModule.supports(task) && book.stock) {
      book.mathsHistory = mathsHistory();
      return view.buildCard(task, { standalone, pageId: PAGES[book.page].id });
    }

    const mark = fresh();
    const isGroups = task.relation === "groups";
    const isAdd = task.relation === "combine";
    const isNeed = task.relation === "need";

    const state = { wrong: 0, hintsUsed: 0, hintLevel: 0, replays: 0, phase: "collect", moved: 0, busy: false, current: task.startCount || 0 };
    const meta = { taskId: task.taskId, skill: "maths", name: task.equation };

    /* the situation is told first; the sum is not on screen yet */
    const card = taskCard(task.situation || task.collectPrompt);
    if (task.situation) card._hint.textContent = task.collectPrompt;
    glossaryRow(card, task.glossary);

    const modelWrap = isGroups ? buildPlates(task.groups, task.perGroup) : buildFrames();
    const loose = el("div", "loose");
    card.append(modelWrap, loose);
    /* the take-away task fills its own basket with pickable berries below */
    if (isAdd || isNeed) paintFrames(modelWrap, task.startCount);

    const spare = isGroups ? task.perGroup * task.groups
      : isNeed ? (task.total - task.startCount)
      : (task.changeCount || 0);

    function setCount(next) {
      state.current = Math.max(0, Math.min(FRAME_CAPACITY, next));
      if (!isGroups) paintFrames(modelWrap, state.current);
    }

    if (isGroups) {
      /* fill plate by plate, so the equal-size structure is visible */
      let filled = 0;
      const slots = [...modelWrap.querySelectorAll(".cell")];
      for (let i = 0; i < spare; i += 1) {
        const btn = el("button", "berry-btn");
        btn.type = "button";
        btn.setAttribute("aria-label", "strawberry");
        fillBerry(btn);
        btn.addEventListener("click", () => {
          if (!stillValid(mark) || state.phase !== "collect" || btn.disabled) return;
          btn.disabled = true;
          btn.classList.add("is-taken");
          const slot = slots[filled];
          filled += 1;
          state.moved += 1;
          if (slot) {
            slot.classList.add("is-filled");
            fillBerry(slot);
            slot.classList.remove("is-new"); void slot.offsetWidth; slot.classList.add("is-new");
          }
          if (state.moved >= spare) toCountPhase();
        });
        loose.append(btn);
      }
    } else if (isAdd || isNeed) {
      for (let i = 0; i < spare; i += 1) {
        const btn = el("button", "berry-btn");
        btn.type = "button";
        btn.setAttribute("aria-label", "strawberry");
        fillBerry(btn);
        btn.addEventListener("click", () => {
          if (!stillValid(mark) || state.phase !== "collect" || btn.disabled) return;
          btn.disabled = true;
          btn.classList.add("is-taken");
          state.moved += 1;
          setCount(state.current + 1);
          if (state.moved >= spare) toCountPhase();
        });
        loose.append(btn);
      }
    } else {
      /* Any berry still in the basket can be the next one taken. It leaves the
         square it was in; the rest stay exactly where they are. */
      state.taken = new Set();
      const instant = prefersReducedMotion();

      const take = (index, btn, cell) => {
        if (!stillValid(mark)) return;
        if (state.phase !== "collect") return;
        if (state.taken.has(index)) return;          // the same berry twice
        if (state.moved >= task.changeCount) return; // the basket is settled

        /* commit first, in this same tick, so two quick taps on two different
           berries are two, and two taps on one berry are one */
        state.taken.add(index);
        state.moved += 1;
        state.current = Math.max(0, state.current - 1);

        emptyCell(cell, btn, mark, instant);
        serveBerry(instant);

        if (state.moved >= task.changeCount) {
          modelWrap.querySelectorAll(".berry-pick").forEach((b) => { b.disabled = true; });
          toCountPhase();
        }
      };

      fillBasket(modelWrap, task.startCount, take);

      /* what leaves the basket has to go somewhere the child can see */
      const dish = el("div", "give-plate");
      if (prop.plate) {
        const img = new Image();
        img.alt = ""; img.draggable = false; img.className = "give-dish";
        img.addEventListener("error", () => { prop.plate = false; img.replaceWith(makeDrawnPlate("give-dish")); });
        img.src = "assets/story/empty-plate.png";
        dish.append(img);
      } else {
        dish.append(makeDrawnPlate("give-dish"));
      }
      const served = el("div", "give-berries");
      dish.append(served);
      loose.append(dish);
      state.served = served;

      /* Every berry that leaves the basket lands on Duck's plate, one for one,
         so the two together always hold what the basket started with. */
      function serveBerry(now) {
        if (!state.served) return;
        const moved = el("span", "given-berry");
        fillBerry(moved);
        state.served.append(moved);
        if (now) { moved.classList.add("is-served"); return; }
        requestAnimationFrame(() => moved.classList.add("is-served"));
      }
    }

    const actions = hintRow(card, state, () => task.hints,
      () => (state.phase === "collect" ? task.collectPrompt : task.countPrompt), meta);

    function toCountPhase() {
      if (!stillValid(mark) || state.phase !== "collect") return;
      state.phase = "count";
      state.hintLevel = 0;
      card._prompt.textContent = task.countPrompt;
      card._hint.textContent = "";
      Sound.play(task.countPrompt);
      /* the berries already given away stay visible; only the pickable
         spares are cleared */
      loose.querySelectorAll(".berry-btn").forEach((b) => b.remove());
      const strayHint = loose.querySelector(".task-hint");
      if (strayHint) strayHint.remove();

      const strip = numberStrip(task, state, card, mark, () => {
        card._prompt.textContent = task.successLine;
        revealSum(card, task);
        finishTask(card, state, meta, task.successLine);
        actions.remove();
        if (standalone) nextStepRow(card, "Back to the story", advanceAfterTask);
        else offerExtras(card, task);
      });
      card.insertBefore(strip, actions);
    }

    Sound.play(task.situation || task.collectPrompt);
    return card;
  }

  /* ------------------------------------------------------------------ */
  /* find and logic: pick one decoration                                 */
  /* ------------------------------------------------------------------ */

  function buildChoice(task, flavour) {
    const mark = fresh();
    const state = { wrong: 0, hintsUsed: 0, hintLevel: 0, replays: 0, done: false };
    const meta = {
      taskId: task.taskId, skill: "english",
      name: flavour === "logic" ? "Two clues, one answer" : "Find the decoration"
    };

    const card = taskCard(task.purpose || task.prompt);
    if (task.purpose) card._hint.textContent = task.prompt;

    if (task.clues) {
      const clueList = el("ul", "clues");
      task.clues.forEach((clue) => clueList.append(el("li", null, clue.text)));
      card.append(clueList);
    }

    /* The decoration question is answered with still pictures: a chosen border
       and the words, no press-shift and no wobble. Only this card is static.
       The bunting choice, the strawberries and hanging the flags keep their
       movement, because there the movement is the thing being shown. */
    const isStatic = flavour === "find";

    const grid = el("div", `decor-grid${isStatic ? " is-static" : ""}`);
    task.items.forEach((item, index) => {
      const btn = el("button", `decor${isStatic ? " is-static" : ""}`);
      btn.type = "button";
      btn.setAttribute("aria-label", nameOf(item));
      btn.innerHTML = decorArt(item);
      btn.addEventListener("click", () => {
        if (!stillValid(mark) || state.done) return;
        if (index !== task.answerIndex) {
          state.wrong += 1;
          /* the reflow forces the shake to restart on a repeat wrong answer;
             with no shake to restart there is nothing to force */
          if (!isStatic) { btn.classList.remove("is-wrong"); void btn.offsetWidth; }
          btn.classList.add("is-wrong");
          const help = task.hints[Math.min(state.wrong - 1, task.hints.length - 1)];
          card._hint.classList.add("is-warm");
          card._hint.textContent = help;
          if (state.wrong >= 2) state.hintsUsed += 1;
          Sound.play(help);
          return;
        }
        state.done = true;
        btn.classList.add("is-right");
        grid.querySelectorAll(".decor").forEach((b) => { b.disabled = true; });
        card._prompt.textContent = task.successLine;
        actions.remove();
        showChosenDecoration(card, task.items[task.answerIndex], task.storyUse, PAGES[book.page].id);
        finishTask(card, state, meta, task.successLine, task.storyUse);
        nextStepRow(card, "Turn the page", advanceAfterTask);
      });
      grid.append(btn);
    });
    card.append(grid);

    const actions = hintRow(card, state, () => task.hints, () => task.prompt, meta);
    speakInOrder(mark, task.purpose, task.prompt);
    return card;
  }

  /* The decoration the child picked goes onto the plate in the painting they
     have been looking at all along - not onto a separate little card under the
     question. It stays there for the rest of this read, so turning back to
     this page shows the picnic they decorated. */
  function showChosenDecoration(card, item, useLine, pageId) {
    book.chosenDecoration = { pageId, item };

    const plate = $("#plate");
    const img = book.plateImage;
    const mark = img ? paintChosenDecoration(plate, img, pageId) : null;

    if (useLine) card.append(el("p", "chosen-use", useLine));

    /* No animation and no scrolling. The mark is drawn straight onto the
       plate, and the child stays exactly where they were reading rather than
       being moved up the page. paintChosenDecoration has already done all the
       work, so there is nothing left to start. */
    return mark;
  }

  function makeDrawnPlate(cls) {
    const span = el("span", cls, Art.PLATE_SVG);
    return span;
  }

  /* ------------------------------------------------------------------ */
  /* pattern: finish the bunting                                         */
  /* ------------------------------------------------------------------ */

  function buildPattern(task) {
    const mark = fresh();
    const state = { wrong: 0, hintsUsed: 0, hintLevel: 0, replays: 0, done: false };
    const meta = { taskId: task.taskId, skill: "english", name: "Finish the pattern" };

    const card = taskCard(task.purpose || task.prompt);
    if (task.purpose) card._hint.textContent = task.prompt;

    const strip = el("div", "bunting");
    task.strip.forEach((item) => {
      const flag = el("span", "flag");
      flag.innerHTML = pennantSvg(item);
      strip.append(flag);
    });
    const blank = el("span", "flag is-blank", "?");
    strip.append(blank);
    card.append(strip);

    const grid = el("div", "decor-grid is-flags");
    task.options.forEach((item, index) => {
      /* The choice is a real paper flag, not a loose shape: the same component
         the strip shows and the rope hangs, so the child picks the very thing
         that goes up. */
      const btn = el("button", "decor is-flag");
      btn.type = "button";
      btn.setAttribute("aria-label", nameOf(item));
      btn.innerHTML = pennantSvg(item);
      btn.addEventListener("click", () => {
        if (!stillValid(mark) || state.done) return;
        if (index !== task.answerIndex) {
          state.wrong += 1;
          btn.classList.remove("is-wrong"); void btn.offsetWidth; btn.classList.add("is-wrong");
          const help = task.hints[Math.min(state.wrong - 1, task.hints.length - 1)];
          card._hint.classList.add("is-warm");
          card._hint.textContent = help;
          if (state.wrong >= 2) state.hintsUsed += 1;
          Sound.play(help);
          return;
        }
        state.done = true;
        btn.classList.add("is-right");
        grid.querySelectorAll(".decor").forEach((b) => { b.disabled = true; });
        blank.classList.remove("is-blank");
        blank.innerHTML = pennantSvg(item);
        strip.classList.add("is-finished");
        card._prompt.textContent = task.successLine;
        actions.remove();
        if (task.storyUse) card.append(el("p", "chosen-use", task.storyUse));
        finishTask(card, state, meta, task.successLine, task.storyUse);

        /* the flags that go up are exactly the ones on screen: the strip the
           session generated, plus the flag the child just chose */
        const finishedBunting = task.strip.concat([item]);
        nextStepRow(card, "Hang the bunting", () => openParty(finishedBunting));
      });
      grid.append(btn);
    });
    card.append(grid);

    const actions = hintRow(card, state, () => task.hints, () => task.prompt, meta);
    speakInOrder(mark, task.purpose, task.prompt);
    return card;
  }

  /* ------------------------------------------------------------------ */
  /* hanging the bunting                                                  */
  /* ------------------------------------------------------------------ */

  /* The backdrop is painted with two bare posts and no rope, so the rope and
     every flag are drawn here from the child's own finished strip. Nothing is
     hard coded: order, colour and shape come straight from the task. */
  const PARTY_VIEW = { w: 1000, h: 667 };
  /* The first brief estimated the posts at x 10% / 90%. The delivered painting
     was then measured: the shafts centre on x 12.2% and 87.3%, and the rope is
     tied at y 18%. Those measured numbers are what the rope uses. */
  const POST_LEFT = { x: PARTY_VIEW.w * 0.122, y: PARTY_VIEW.h * 0.18 };
  const POST_RIGHT = { x: PARTY_VIEW.w * 0.873, y: PARTY_VIEW.h * 0.18 };
  /* Sag keeps the deepest flag tip near y 40%, inside the 18%-43% clear sky. */
  const ROPE_SAG = 74;

  function prefersReducedMotion() {
    return Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function renderBunting(flags) {
    const svg = $("#partyBunting");
    svg.innerHTML = "";
    const curve = Art.ropeCurve(POST_LEFT, POST_RIGHT, ROPE_SAG);
    const points = Art.hangPoints(curve, flags.length);
    const scale = Math.min(1, 8 / Math.max(flags.length, 1));

    const rope = `<path class="party-rope" d="${curve.path}" fill="none"
        stroke="#8a6f57" stroke-width="5" stroke-linecap="round" opacity="0.9"/>`;

    const hung = flags.map((item, i) => {
      const p = points[i];
      return `<g class="party-flag" style="--i:${i}"
                 transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.angle.toFixed(2)}) scale(${scale.toFixed(3)})">
                ${Art.pennant(item, hexOf(item.colour), { usePng: prop.pennant, index: i })}
              </g>`;
    }).join("");

    svg.innerHTML = `<g class="party-line-group">${rope}${hung}</g>`;
    return svg;
  }

  function openParty(flags) {
    const mark = fresh();
    Sound.stop();
    setPlaying(false);
    book.partyFlags = flags.slice();

    const backdrop = $("#partyBackdrop");
    const scene = $("#partyScene");
    scene.classList.remove("is-plain");
    backdrop.removeAttribute("src");
    backdrop.addEventListener("error", function once() {
      backdrop.removeEventListener("error", once);
      prop.party = false;
      scene.classList.add("is-plain");           // painted sky stand-in
    });
    backdrop.src = "assets/story/celebration.png";

    const svg = renderBunting(flags);
    $("#partyLine").textContent = "";
    $("#partyActions").innerHTML = "";
    showScreen("party");

    const finish = () => {
      if (!stillValid(mark)) return;
      svg.classList.add("is-up");
      $("#partyLine").textContent = S.uiLines.storyEnd;
      const row = el("div", "party-actions-row");
      const draw = el("button", "btn btn-primary", "Draw a picture");
      draw.addEventListener("click", openStudio);
      const again = el("button", "btn btn-secondary", "Read it again");
      again.addEventListener("click", () => startBook(book.mode));
      const home = el("button", "btn btn-quiet", "Home");
      home.addEventListener("click", exitToHome);
      row.append(draw, again, home);
      $("#partyActions").innerHTML = "";
      $("#partyActions").append(row);
    };

    if (prefersReducedMotion()) {
      svg.classList.add("is-instant");
      finish();
      return;
    }

    /* raise, then settle into a slow sway, then the ending line */
    requestAnimationFrame(() => {
      if (!stillValid(mark)) return;
      svg.classList.add("is-raising");
    });
    later(1500, mark, () => {
      svg.classList.add("is-swaying");
      finish();
    });
  }

  function leaveParty() {
    book.epoch += 1;
    Sound.stop();
    setPlaying(false);
    const svg = $("#partyBunting");
    svg.classList.remove("is-raising", "is-swaying", "is-up", "is-instant");
    svg.innerHTML = "";
  }

  /* ------------------------------------------------------------------ */
  /* drawing studio                                                      */
  /* ------------------------------------------------------------------ */

  const studio = {
    ctx: null, canvas: null, drawing: false, ready: false,
    colour: S.colours[0], width: 10, sticker: null, history: [], last: null
  };

  function sizeCanvas() {
    const canvas = studio.canvas;
    if (!canvas) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = window.devicePixelRatio || 1;
    const snapshot = studio.history.length ? studio.history[studio.history.length - 1] : null;

    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    studio.ctx = ctx;
    ctx.fillStyle = "#fffdf9";
    ctx.fillRect(0, 0, rect.width, rect.height);
    if (snapshot) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = snapshot;
    }
  }

  function pointFrom(event) {
    const rect = studio.canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function pushHistory() {
    try { studio.history.push(studio.canvas.toDataURL("image/png")); } catch (_) {}
    if (studio.history.length > 12) studio.history.shift();
  }

  function stampSticker(point) {
    const sticker = S.stickers.find((s) => s.id === studio.sticker);
    if (!sticker) return;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-40 -40 80 80" width="88" height="88">${sticker.art}</svg>`;
    const img = new Image();
    img.onload = () => { studio.ctx.drawImage(img, point.x - 44, point.y - 44, 88, 88); pushHistory(); };
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  function bindCanvas() {
    const canvas = studio.canvas;
    canvas.addEventListener("pointerdown", (event) => {
      canvas.setPointerCapture(event.pointerId);
      const point = pointFrom(event);
      if (studio.sticker) { stampSticker(point); return; }
      studio.drawing = true;
      studio.last = point;
      const ctx = studio.ctx;
      ctx.strokeStyle = studio.colour;
      ctx.lineWidth = studio.width;
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineTo(point.x + 0.01, point.y + 0.01);
      ctx.stroke();
      event.preventDefault();
    });
    canvas.addEventListener("pointermove", (event) => {
      if (!studio.drawing) return;
      const point = pointFrom(event);
      const ctx = studio.ctx;
      ctx.strokeStyle = studio.colour;
      ctx.lineWidth = studio.width;
      ctx.beginPath();
      ctx.moveTo(studio.last.x, studio.last.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      studio.last = point;
    });
    const end = () => { if (studio.drawing) { studio.drawing = false; pushHistory(); } };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
    canvas.addEventListener("pointerleave", end);
  }

  function buildPalette() {
    const palette = $("#palette");
    const stickerRow = $("#stickerRow");
    palette.innerHTML = "";
    const clearSticker = () => {
      studio.sticker = null;
      stickerRow.querySelectorAll(".sticker").forEach((n) => n.classList.remove("is-on"));
    };

    S.colours.forEach((colour, i) => {
      const btn = el("button", "swatch" + (i === 0 ? " is-on" : ""));
      btn.type = "button";
      btn.style.background = colour;
      btn.setAttribute("aria-label", `Colour ${i + 1}`);
      btn.addEventListener("click", () => {
        studio.colour = colour;
        clearSticker();
        palette.querySelectorAll(".swatch").forEach((n) => n.classList.remove("is-on"));
        btn.classList.add("is-on");
      });
      palette.append(btn);
    });

    [5, 10, 18].forEach((width, i) => {
      const btn = el("button", "nib" + (i === 1 ? " is-on" : ""));
      btn.type = "button";
      btn.setAttribute("aria-label", `Brush size ${i + 1}`);
      btn.innerHTML = `<span style="width:${width}px;height:${width}px"></span>`;
      btn.addEventListener("click", () => {
        studio.width = width;
        clearSticker();
        palette.querySelectorAll(".nib").forEach((n) => n.classList.remove("is-on"));
        btn.classList.add("is-on");
      });
      palette.append(btn);
    });

    stickerRow.innerHTML = "";
    S.stickers.forEach((sticker) => {
      const btn = el("button", "sticker");
      btn.type = "button";
      btn.setAttribute("aria-label", sticker.label);
      btn.innerHTML = `<svg viewBox="-30 -30 60 60" aria-hidden="true">${sticker.art}</svg>`;
      btn.addEventListener("click", () => {
        const on = studio.sticker === sticker.id;
        stickerRow.querySelectorAll(".sticker").forEach((n) => n.classList.remove("is-on"));
        studio.sticker = on ? null : sticker.id;
        if (!on) btn.classList.add("is-on");
      });
      stickerRow.append(btn);
    });
  }

  function openStudio() {
    book.epoch += 1;
    Sound.stop();
    setPlaying(false);
    showScreen("studio");
    studio.canvas = $("#drawCanvas");
    if (!studio.ready) { buildPalette(); bindCanvas(); studio.ready = true; }
    requestAnimationFrame(() => {
      sizeCanvas();
      if (!studio.history.length) pushHistory();
    });
    Sound.play(S.uiLines.drawIntro);
  }

  /* ------------------------------------------------------------------ */
  /* parent area                                                         */
  /* ------------------------------------------------------------------ */

  const SKILL_TITLES = { english: "English", maths: "Maths" };

  function renderParent() {
    const wrap = $("#records");
    wrap.innerHTML = "";
    const rounds = Store.read().rounds.filter((r) => Object.keys(r.tasks).length);
    if (!rounds.length) {
      wrap.append(el("p", "note", "No practice yet. Notes will appear here after your child plays a page."));
      return;
    }

    const latest = rounds[rounds.length - 1];
    const grouped = { english: [], maths: [] };
    Object.entries(latest.tasks).forEach(([id, task]) => {
      if (grouped[task.skill]) grouped[task.skill].push(Object.assign({ id }, task));
    });

    ["english", "maths"].forEach((skill) => {
      if (!grouped[skill].length) return;
      const group = el("div", "record-group");
      group.append(el("h3", null, SKILL_TITLES[skill]));
      grouped[skill].forEach((task) => {
        const row = el("div", "record");
        row.append(el("span", "record-name", task.name));
        const label = task.skipped ? "Skipped" : task.solo ? "On their own" : "After a hint";
        const cls = task.skipped ? "" : task.solo ? " is-solo" : " is-helped";
        row.append(el("span", "pill" + cls, label));
        const bits = [`${task.tries} ${task.tries === 1 ? "go" : "goes"}`];
        if (task.hintsUsed) bits.push(`${task.hintsUsed} ${task.hintsUsed === 1 ? "hint" : "hints"}`);
        row.append(el("span", "record-meta", bits.join(" · ")));
        group.append(row);
      });
      wrap.append(group);
    });

    const totals = el("div", "record-group");
    totals.append(el("h3", null, "This session"));
    const replayRow = el("div", "record");
    replayRow.append(el("span", "record-name", "Times a page was replayed"));
    replayRow.append(el("span", "pill", String(latest.replays)));
    totals.append(replayRow);
    if (rounds.length > 1) {
      const past = el("div", "record");
      past.append(el("span", "record-name", "Earlier times through the book"));
      past.append(el("span", "pill", String(rounds.length - 1)));
      totals.append(past);
    }
    wrap.append(totals);
  }

  /* ------------------------------------------------------------------ */
  /* wiring                                                              */
  /* ------------------------------------------------------------------ */

  function updateModeButton() {
    const btn = $("#modeBtn");
    const play = book.mode === "play";
    btn.classList.toggle("is-on", play);
    btn.setAttribute("aria-pressed", String(play));
    /* the button now carries its own words as well as its label, because it
       lives in a folded list rather than in a row of icons */
    btn.textContent = play ? "Listen and play" : "Just listen";
    btn.setAttribute("aria-label", play ? "Listen and play" : "Just listen");
  }

  /* Everything that can survive a previous read is cleared here, so opening
     the book twice never shows a leftover task, caption or play state. */
  function resetRuntime() {
    book.epoch += 1;
    Sound.stop();
    setPlaying(false);
    book.partyFlags = null;
    /* a new read is a new picnic: the previous decoration does not carry over */
    book.chosenDecoration = null;
    const bunting = $("#partyBunting");
    if (bunting) {
      bunting.classList.remove("is-raising", "is-swaying", "is-up", "is-instant");
      bunting.innerHTML = "";
    }
    book.page = 0;
    book.lineIndex = 0;
    book.groupsDone = false;
    /* a new read is a new set of strawberries, and nothing said about the old
       ones follows it */
    book.stock = null;
    book.mathsState = {};
    book.mathsHistory = null;
    book.mathsNote = null;
    clearTask();
    setCaption("");
    const sheet = $("#clearSheet");
    if (sheet) sheet.classList.remove("is-open");
  }

  function startBook(mode) {
    resetRuntime();
    book.mode = mode;
    /* Opening the book is the child asking to be read to - that is what the
       cover action says it will do - and it is also the deliberate gesture a
       browser wants before it will let anything play. A new reading has heard
       nothing yet. */
    book.listening = true;
    book.heard = new Set();
    const seed = newSeed();
    book.session = V.buildSession(seed);
    if (MathsModule) book.stock = MathsModule.createStock(book.session);
    updateModeButton();
    Store.startRound(seed);
    Sound.init();
    goToPage(0);
  }

  function bind() {
    $("#startListen").addEventListener("click", () => startBook("listen"));
    $("#startPlay").addEventListener("click", () => startBook("play"));
    $("#homeDraw").addEventListener("click", openStudio);
    $("#homeParent").addEventListener("click", () => {
      book.epoch += 1; Sound.stop(); setPlaying(false); setSoundNote(SOUND.idle);
      renderParent(); showScreen("parent");
    });

    /* One page control. Quiet: read this page from the top. Reading: stop.
       Resuming from the middle of a page is still there, in More controls, as
       Say this line again. */
    $("#playBtn").addEventListener("click", () => {
      if (book.playing) {
        /* Stop means stop, on this page and on the pages after it. */
        book.listening = false;
        book.epoch += 1;
        Sound.stop();
        setPlaying(false);
        setSoundNote(SOUND.idle);
        return;
      }
      book.listening = true;
      Store.noteReplay();
      readPage(0);
    });

    /* The retry beside a missing or blocked recording. It asks for the same
       line again rather than starting the page over, so a child who has heard
       most of a page does not have to hear it all again. */
    $("#retryAudioBtn").addEventListener("click", () => {
      book.listening = true;
      readPage(book.lineIndex);
    });

    $("#replayLineBtn").addEventListener("click", () => {
      const page = PAGES[book.page];
      Store.noteReplay();
      Sound.stop();
      setPlaying(false);
      const said = linesOf(page);
      Sound.play(said[book.lineIndex] || said[0]);
    });

    $("#replayPageBtn").addEventListener("click", () => {
      book.listening = true;
      Store.noteReplay();
      readPage(0);
    });
    $("#prevBtn").addEventListener("click", () => goToPage(book.page - 1));
    $("#nextBtn").addEventListener("click", () => {
      if (book.page === LAST) { book.epoch += 1; Sound.stop(); setPlaying(false); finishBook(); return; }
      goToPage(book.page + 1);
    });

    $("#captionBtn").addEventListener("click", () => {
      book.captions = !book.captions;
      updateCaptionButton();
      setCaption(linesOf(PAGES[book.page])[book.lineIndex]);
    });

    $("#modeBtn").addEventListener("click", () => {
      book.epoch += 1;
      Sound.stop();
      setPlaying(false);
      book.mode = book.mode === "listen" ? "play" : "listen";
      updateModeButton();
      clearTask();
      toast(book.mode === "play" ? "Listen and play" : "Just listen");
    });

    $("#exitBtn").addEventListener("click", exitToHome);
    $("#studioBack").addEventListener("click", () => {
      Sound.stop();
      showScreen(book.taskOpen ? "story" : "home");
    });

    $("#undoBtn").addEventListener("click", () => {
      if (studio.history.length <= 1) return;
      studio.history.pop();
      const previous = studio.history[studio.history.length - 1];
      const rect = studio.canvas.getBoundingClientRect();
      const img = new Image();
      img.onload = () => {
        studio.ctx.fillStyle = "#fffdf9";
        studio.ctx.fillRect(0, 0, rect.width, rect.height);
        studio.ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = previous;
    });

    $("#clearBtn").addEventListener("click", () => $("#clearSheet").classList.add("is-open"));
    $("#clearCancel").addEventListener("click", () => $("#clearSheet").classList.remove("is-open"));
    $("#clearConfirm").addEventListener("click", () => {
      const rect = studio.canvas.getBoundingClientRect();
      studio.ctx.fillStyle = "#fffdf9";
      studio.ctx.fillRect(0, 0, rect.width, rect.height);
      studio.history = [];
      pushHistory();
      $("#clearSheet").classList.remove("is-open");
    });

    $("#saveBtn").addEventListener("click", () => {
      let dataUrl = "";
      try { dataUrl = studio.canvas.toDataURL("image/png"); }
      catch (_) { toast("Could not save the picture."); return; }
      if (!Store.saveArt(dataUrl)) { toast("Could not save the picture."); return; }
      toast("Your picture is saved.");
      Sound.play(S.uiLines.drawSaved);
    });

    $("#parentBack").addEventListener("click", () => showScreen("home"));
    $("#partyBack").addEventListener("click", () => { leaveParty(); showScreen("story"); });

    window.addEventListener("resize", () => {
      if ($("[data-screen='studio']").classList.contains("is-active")) sizeCanvas();
    });
    /* Leaving the tab is not the same as leaving the page. Bumping the epoch
       here would kill every handler the open task captured, so the child would
       come back to strawberries and buttons that no longer respond. We only
       silence the audio; the task, its progress and its handlers stay live. */
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        Sound.stop();
        setPlaying(false);
      }
    });
  }

  function renderHomeCover() {
    const cover = $("#homeCover");
    const img = new Image();
    img.alt = "";
    img.addEventListener("error", () => {
      cover.innerHTML = `<svg viewBox="0 0 900 600" role="img" aria-label="${PAGES[0].title}">${PAGES[0].fallback}</svg>`;
    });
    img.src = PAGES[0].image;
    cover.append(img);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const defs = $("#yoyoArtDefs");
    if (defs) defs.innerHTML = Art.DEFS;
    renderHomeCover();
    updateModeButton();
    updateCaptionButton();
    setPlaying(false);
    setSoundNote(SOUND.idle);
    bind();
    /* sw-bootstrap.js owns registration, because it keeps working even when
       this file is the stale one. Registering again here without
       updateViaCache would quietly reset that option, so it is only a fallback
       for a page that somehow loaded without the bootstrap. */
    // The staged maths entry must not install the delivered book's bundle.
    if (!window.__yoyoReviewCopy && !window.__yoyoUpdater && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("service-worker.js", { updateViaCache: "none" }).catch(() => {});
    }
  });

  /* The updater asks before it refreshes the page. Anything the child would
     lose or resent losing counts as busy: a question on screen, a drawing in
     progress, the story talking, or simply not being on the home screen. */
  window.__yoyoBusy = function () {
    if (book.taskOpen || book.playing) return true;
    if (studio.history && studio.history.length) return true;
    const active = Array.prototype.filter.call(
      document.querySelectorAll(".screen"), (s) => s.classList.contains("is-active")
    )[0];
    return Boolean(active && active.dataset.screen !== "home");
  };

  window.__storyDebug = { Sound, Store, book, V };
})();
