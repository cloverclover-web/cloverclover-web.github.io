/* The Tower That Fell: what the preview says out loud.

   The preview was silent. This module gives it a voice without giving it a
   different one: it decides WHICH words are read and IN WHAT ORDER, and hands
   them to the unchanged shared player in story-audio.js, which finds each
   clip by the hash of its own text. No text is invented here. Every line comes
   from the page that is really on screen.

   Two jobs, and they are deliberately the same code:

     readingFor(page)   the ordered lines for the page as it actually is
     catalogue(runtime) every line readingFor can ever produce

   That is the whole point of the arrangement. A recording list built by hand
   beside the engine is a list of the lines someone REMEMBERED; this one is the
   set of lines the player can physically ask for, because it is produced by
   running the same function over every reachable state. If a page can say it,
   it is in the catalogue; if it is in the catalogue, some page can say it.

   Nothing here speaks, stores, fetches or synthesises. There is no browser
   speech fallback anywhere: when a clip is missing the words stay on screen
   and the page says so. */

(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.YoyoTowerNarration = api;
})(typeof self !== "undefined" ? self : (typeof globalThis !== "undefined" ? globalThis : null), function () {
  "use strict";

  /* The audio bar's own words. They are chrome, not narration: they are shown,
     never spoken, so they are not in the recording catalogue. */
  // Availability changes only after verifying the frozen bank and every clip.
  // Network playback failure is separate from an unrecorded catalogue.
  const READY = true;

  const TEXT = {
    /* Before this page has really been heard, the offer is to read it - not to
       read it AGAIN, which would be an offer to repeat something that has not
       happened yet. */
    listenFirst: "Listen",
    listen: "Listen again",
    stop: "Stop listening",
    unrecorded: "The voice for this story is not recorded yet. "
      + "The words are all here to read together.",
    reading: "Reading this page.",
    stopped: "Stopped.",
    finished: "That is the whole page.",
    blocked: "Tap Listen again to start the sound.",
    someMissing: "Some sound is unavailable right now. Read together, or tap Listen again to retry.",
    allMissing: "The sound is unavailable right now. Read together, or tap Listen again to retry.",
    idle: ""
  };

  /* ------------------------------------------------------------------ */
  /* what gets read, and in what order                                   */
  /* ------------------------------------------------------------------ */

  /* A described page is a plain object; tower-preview.js builds one from the
     state it is really drawing, and the enumerator below builds them from
     every state that state can be in. Neither knows about the DOM. */
  function readingFor(page) {
    if (!page) return [];
    const said = [];
    const add = (key, text) => {
      const line = String(text == null ? "" : text).trim();
      if (line) said.push({ key, text: line });
    };

    /* While the new-reading question is on screen it is the question being
       asked, so it is what Listen answers. Reading the story underneath it
       would talk past the thing the child is deciding. */
    if (page.restart) {
      add("restart", page.restart);
      return said;
    }

    /* First, whether this is another telling; then where we are; then what
       the picture shows, because a child who is listening cannot see the
       caption any other way. */
    add("route", page.routeNote);
    add("heading", page.heading);
    add("caption", page.caption);
    (page.lines || []).forEach((line, i) => add(`line-${i}`, line));

    /* the plan: what it needs and what it is asking */
    if (page.ask) {
      add("question", page.ask.question);
      (page.ask.givens || []).forEach((given, i) => add(`given-${i}`, given));
      add("hint", page.ask.hint);
    }
    /* Only the steps that have actually been asked for. An unopened worked
       example is not read out, and neither is a step nobody has requested. */
    (page.help || []).forEach((step, i) => add(`help-${i}`, step));
    add("said", page.said);
    add("compare", page.compare);

    if (page.build) {
      add("build-plan", page.build.plan);
      add("build-note", page.build.note);
      add("build-explain", page.build.explain);
    }

    /* what can be done from here, in the order the buttons appear */
    (page.actions || []).forEach((label, i) => add(`action-${i}`, label));
    (page.choices || []).forEach((label, i) => add(`choice-${i}`, label));
    return said;
  }

  /* ------------------------------------------------------------------ */
  /* what the book reads by itself, and what it only shows                */
  /* ------------------------------------------------------------------ */

  /* The parent listened to a page and heard the little grey line under the
     picture read out along with the story. It was not a wrong recording - it
     was the right recording of something that did not need saying.

     So a described page still describes all of itself, and the page still
     SHOWS all of itself; but two kinds are shown only. The picture's caption
     repeats what the picture already shows and is repeated on every visit; the
     heading is the page's label rather than part of the telling. Both stay on
     screen, both stay in the picture's own description for a screen reader,
     and neither is deleted from the story - only from what the voice starts
     saying on its own.

     Everything else is read, because everything else is either the story, or
     something the child needs in order to take part: what the plan asks, the
     quantities it gives, what the child chose, what was found when it was
     checked, an explanation that was asked for, and the ways on from here.
     Nothing is judged by how small it is printed. */
  const SHOWN_NOT_SAID = new Set(["heading", "caption"]);
  const kindOf = (key) => String(key).replace(/-\d+$/, "");
  const isSpoken = (key) => !SHOWN_NOT_SAID.has(kindOf(key));

  /* the ordered lines the voice really says, with their kinds, so the page can
     mark the part it is on */
  const spokenFor = (page) => readingFor(page).filter((one) => isSpoken(one.key));

  const linesFor = (page) => spokenFor(page).map((one) => one.text);
  const keysFor = (page) => spokenFor(page).map((one) => one.key);

  /* Where each replayable part starts in that reading. Pressing a part's own
     control reads from there to the end of the page, the same as the picnic:
     "again from here", not one sentence in isolation. */
  function segmentsFor(page) {
    const said = spokenFor(page);
    const at = {};
    said.forEach((one, i) => { if (!(one.key in at)) at[one.key] = i; });
    return at;
  }

  /* ------------------------------------------------------------------ */
  /* every line the player can ever ask for                              */
  /* ------------------------------------------------------------------ */

  /* The walk below is written state by state rather than as one big product
     of every field, because the catalogue has to be REACHABLE as well as
     complete: a line nobody can hear would be a recording nobody needs, and
     Codex would be asked to make it. Each block says which states it covers.

     runtime is supplied by tower-preview.js so that this file never holds a
     second copy of the story:

       MAT          the materials model
       NODES        the real node table
       describe     the same pure description the page is drawn from
       ROUTE_ENTRY  where each route begins
       DESTINATION  which ending settles on which imagined place
       CHOICE_NODE / PLAY_NODE / BUILD_NODE / PLAN_NODE / CLOSE_NODE */
  function catalogue(runtime) {
    const { MAT, NODES, describe, ROUTE_ENTRY, DESTINATION } = runtime;
    const CHOICE = runtime.CHOICE_NODE;
    const PLAY = runtime.PLAY_NODE;
    const BUILD = runtime.BUILD_NODE;
    const PLAN = runtime.PLAN_NODE;
    const CLOSE = runtime.CLOSE_NODE;

    const out = new Set();
    const take = (view) => linesFor(describe(view)).forEach((line) => out.add(line));

    /* the three route framings a page can carry: none, another telling, and
       another telling with work already on the board */
    const FRAMINGS = [
      { routesTaken: [], destinations: [] },
      { routesTaken: ["rest"], destinations: [] },
      { routesTaken: ["plan"], destinations: ["forest"] }
    ];

    MAT.LISTS.forEach((list) => {
      const empty = MAT.createPlan(list);
      const full = MAT.completedPlan(list);
      /* a real part-way plan: one piece of the first kind that needs one */
      let part = empty;
      const firstId = MAT.idsFor(MAT.SHAPE_IDS[0])[0];
      const moved = MAT.place(empty, firstId);
      if (moved.moved) part = moved.plan;

      const plans = [empty, part, full];
      const steps = MAT.helpSteps(list);
      const predictions = [null].concat(MAT.answerChoices(list));

      /* ---- the shared opening, and both question pages ---- */
      Object.keys(NODES).forEach((id) => {
        const node = NODES[id];
        /* the pages with no plan panel in them at all: their words can still
           change with the framing and, at an ending, with the new-reading
           question */
        if (node.route === "plan") return;
        FRAMINGS.forEach((framing) => {
          [false, true].forEach((confirmingRestart) => {
            if (confirmingRestart && !node.ending) return;
            plans.forEach((plan) => {
              take({
                nodeId: id, plan, said: null, checked: false, helpStep: 0,
                helpOn: false, explained: false, confirmingRestart,
                routesTaken: framing.routesTaken, destinations: framing.destinations
              });
            });
          });
        });
      });

      /* ---- the planning page ---- */
      /* Its words change with whether pieces are already on the board, and it
         carries the question, the materials, every number that can be chosen
         and every step of the worked example that can be asked for. */
      [empty, part, full].forEach((plan) => {
        predictions.forEach((choice) => {
          [false, true].forEach((checked) => {
            for (let helpStep = 0; helpStep <= steps.length; helpStep += 1) {
              FRAMINGS.forEach((framing) => {
                take({
                  nodeId: PLAN, plan, said: choice, checked, helpStep,
                  helpOn: false, explained: false, confirmingRestart: false,
                  routesTaken: framing.routesTaken, destinations: framing.destinations
                });
              });
            }
          });
        });
      });

      /* ---- the building page ---- */
      /* Reached only after the explicit check, so `checked` is true. The
         waiting-spaces control has both of its labels, the group actions
         appear for whatever each kind still needs, and the explanation
         appears only once the picture is finished and asked about.

         Every board a child can arrive at is walked, one piece at a time from
         empty to finished, because "Lay 1 long rectangle piece" is only ever
         offered once two of the three are already down. Enumerating three
         boards would have left those labels out of the catalogue and out of
         the recordings. */
      const boards = [empty];
      let walking = empty;
      MAT.SHAPE_IDS.forEach((shapeId) => {
        MAT.idsFor(shapeId).forEach((pieceId) => {
          const step = MAT.place(walking, pieceId);
          if (!step.moved) return;
          walking = step.plan;
          boards.push(walking);
        });
      });
      boards.forEach((plan) => {
        predictions.forEach((choice) => {
          [false, true].forEach((helpOn) => {
            [false, true].forEach((explained) => {
              for (let helpStep = 0; helpStep <= steps.length; helpStep += 1) {
                take({
                  nodeId: BUILD, plan, said: choice, checked: true, helpStep,
                  helpOn, explained, confirmingRestart: false,
                  routesTaken: [], destinations: []
                });
              }
            });
          });
        });
      });

      /* ---- the end of the plan route ---- */
      /* Unstarted, part-way and finished all end here, and each says
         something different about what really happened. */
      [empty, part, full].forEach((plan) => {
        predictions.forEach((choice) => {
          [false, true].forEach((confirmingRestart) => {
            FRAMINGS.forEach((framing) => {
              take({
                nodeId: CLOSE, plan, said: choice, checked: true, helpStep: 0,
                helpOn: false, explained: true, confirmingRestart,
                routesTaken: framing.routesTaken, destinations: framing.destinations
              });
            });
          });
        });
      });
    });

    /* the two questions, framed as an alternative telling after every first
       route and every first imagined place */
    ["rest", "plan", "play"].forEach((route) => {
      MAT.LISTS.slice(0, 1).forEach((list) => {
        const plan = MAT.createPlan(list);
        take({
          nodeId: CHOICE, plan, said: null, checked: false, helpStep: 0,
          helpOn: false, explained: false, confirmingRestart: false,
          routesTaken: [route], destinations: []
        });
        Object.keys(ROUTE_ENTRY).forEach((other) => {
          take({
            nodeId: ROUTE_ENTRY[other], plan, said: null, checked: false, helpStep: 0,
            helpOn: false, explained: false, confirmingRestart: false,
            routesTaken: [route], destinations: []
          });
        });
      });
    });
    Object.values(DESTINATION).forEach((place) => {
      const plan = MAT.createPlan(MAT.LISTS[0]);
      take({
        nodeId: PLAY, plan, said: null, checked: false, helpStep: 0,
        helpOn: false, explained: false, confirmingRestart: false,
        routesTaken: [], destinations: [place]
      });
      Object.keys(DESTINATION).forEach((id) => {
        take({
          nodeId: id, plan, said: null, checked: false, helpStep: 0,
          helpOn: false, explained: false, confirmingRestart: false,
          routesTaken: [], destinations: [place]
        });
      });
    });

    return Array.from(out).sort();
  }

  /* ------------------------------------------------------------------ */
  /* reading a page aloud                                                */
  /* ------------------------------------------------------------------ */

  /* A thin arrangement over the shared player, which is not changed at all.
     It exists so that the rules can be stated once and tested without a
     browser: one reading at a time, a newer request replaces an older one,
     and a reading that outlives the page it belongs to reports nothing and
     changes nothing. */
  function createReader(options) {
    const settings = options || {};
    const sound = settings.sound;
    const onChange = settings.onChange || (() => {});
    const gapMs = settings.missingGapMs == null ? 1200 : settings.missingGapMs;
    const wait = settings.wait || ((ms) => new Promise((r) => setTimeout(r, ms)));

    const reader = {
      playing: false,
      /* which line is sounding, so the page can show where it is */
      index: -1,
      /* how many lines of the reading just finished had no recording. It is
         counted from what happened THIS time: a line that was missing in an
         earlier reading and plays now is not still missing, and a warning
         from before must not survive a playback that worked. */
      missing: 0,
      /* how many lines of this reading were really heard. A page whose clips
         were all missing has not been heard, so its control must still offer
         to read it rather than to read it again. */
      heard: 0,
      status: TEXT.idle,
      /* Which request is the current one. Every read takes the next turn, and
         only the newest turn may write anything the page can see. Without it
         an older reading, settling as cancelled a moment after a newer one
         started, would report itself finished and switch Stop off underneath
         the reading that is actually sounding. */
      turn: 0,

      set(status) {
        this.status = status;
        onChange(this);
      },

      stop(status) {
        this.turn += 1;
        if (sound) sound.stop();
        this.playing = false;
        this.index = -1;
        this.set(status == null ? TEXT.idle : status);
      },

      /* `alive` is the page's own guard. It is asked before every visible
         change, so a reading left behind by a page turn cannot write a status
         line onto the page that replaced it. */
      async read(lines, startAt, alive) {
        const still = alive || (() => true);
        const turn = this.turn + 1;
        this.turn = turn;
        /* mine: this request is both the newest one and still on its page */
        const mine = () => this.turn === turn && still();

        if (!sound || !lines || !lines.length) {
          if (mine()) this.stop(TEXT.idle);
          return "empty";
        }

        this.playing = true;
        this.missing = 0;
        this.heard = 0;
        this.index = Math.max(0, Math.min(lines.length - 1, startAt || 0));
        this.set(TEXT.reading);

        /* One clip at a time, so that each line's own result is known. The
           shared player is used exactly as it is; only the sequencing and the
           honest report of what was heard live here. */
        let attempted = 0;
        for (let i = this.index; i < lines.length; i += 1) {
          if (!mine()) return "cancelled";
          this.index = i;
          onChange(this);

          attempted += 1;
          const status = await sound.play(lines[i]);
          if (!mine()) return "cancelled";
          if (status === "cancelled") return "cancelled";
          if (status === "blocked") {
            this.playing = false;
            this.index = -1;
            this.set(TEXT.blocked);
            return "blocked";
          }
          if (status === "missing") {
            this.missing += 1;
            /* a moment to read the words instead, unless the page moves on */
            if (gapMs > 0) await wait(gapMs);
            if (!mine()) return "cancelled";
          } else {
            this.heard += 1;
            /* said the moment it is true, so the page can stop offering to
               read something the child has now heard */
            onChange(this);
          }
        }

        if (!mine()) return "cancelled";
        this.playing = false;
        this.index = -1;
        if (attempted && this.heard === 0) this.set(TEXT.allMissing);
        else if (this.missing > 0) this.set(TEXT.someMissing);
        else this.set(TEXT.finished);
        return "ended";
      }
    };
    return reader;
  }

  return { READY, TEXT, SHOWN_NOT_SAID, kindOf, isSpoken,
    readingFor, spokenFor, linesFor, keysFor, segmentsFor, catalogue, createReader };
});
