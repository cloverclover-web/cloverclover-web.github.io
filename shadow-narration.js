/* The Shadow Theatre: what the sample says out loud, and what it only shows.

   Two jobs, and they are deliberately the same code:

     readingFor(page)    the ordered lines for the page as it actually is
     catalogue(runtime)  every line readingFor can ever produce

   That is the whole point of the arrangement. A recording list written by hand
   beside the engine is a list of the lines someone REMEMBERED; this one is the
   set of lines the player can physically ask for, because it is produced by
   running the same description over every state the sample can reach. If a
   page can say it, it is in the list; if it is in the list, some page can say
   it.

   The complete original-voice bank is recorded and verified. A missing clip
   leaves the words on screen and offers a retry, rather than putting a
   different voice in the original's place.

   THE LIST IS FINITE, AND IT HAS TO BE. The child can slide the holder to any
   distance between the two ends of the track, so a page could in principle
   describe 21.37 cm. It never does: while a hand is on the holder the sample
   puts the changing numbers away and says one fixed sentence instead, and
   letting go settles on one of three marks. So every number that can ever be
   spoken comes from three positions and six sets of props, and the walk below
   really does reach all of them.

   Nothing here draws, measures, stores or fetches. It orders words, and hands
   them to the unchanged shared player in story-audio.js. */

(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.YoyoShadowNarration = api;
})(typeof self !== "undefined" ? self : (typeof globalThis !== "undefined" ? globalThis : null), function () {
  "use strict";

  /* 434 frozen lines: all files fully decoded and matched to the live runtime
     on 2026-09-14. This is audio readiness, not parent release acceptance. */
  const READY = true;

  const TEXT = {
    /* the cover's one way in. Before there is a voice it says what it really
       does, because "Read with me" would be a promise the book cannot keep */
    start: "Read with me",
    startQuiet: "Open the story",
    listenFirst: "Listen",
    listen: "Listen again",
    stop: "Stop listening",
    unrecorded: "New narration is not recorded yet. Read together.",
    reading: "Reading this page.",
    finished: "This part is finished.",
    blocked: "Tap Listen to start the sound.",
    someMissing: "Some sound is unavailable right now. Read together, or tap Listen to retry.",
    allMissing: "The sound is unavailable right now. Read together, or tap Listen to retry.",
    idle: ""
  };

  /* ------------------------------------------------------------------ */
  /* what is read, and in what order                                     */
  /* ------------------------------------------------------------------ */

  /* Shown, and not said.

     The parent listened to another book and heard the small grey line under
     the picture read out along with the story. The picture's caption repeats
     what the picture already shows and comes back on every visit; the heading
     is the page's label rather than part of the telling. Both stay on screen,
     both stay in the picture's own description for a screen reader, and
     neither is deleted - only left out of what the voice starts saying on its
     own.

     Everything else is read, because everything else is either the story or
     something the child needs in order to take part: the readings beside the
     stage, what the comparison asks, what they chose, what was found when they
     checked, an explanation that was asked for, and the ways on from here.
     Nothing is judged by how small it is printed. */
  const SHOWN_NOT_SAID = ["heading", "caption", "progress", "preview"];
  const kindOf = (key) => String(key).replace(/-\d+$/, "");
  const isSpoken = (key) => SHOWN_NOT_SAID.indexOf(kindOf(key)) === -1;

  /* A described page is a plain object. shadow-preview.js builds one from the
     state it is really drawing, and the walk below builds them from every
     state that state can be in. Neither knows about the DOM. */
  function readingFor(page) {
    if (!page) return [];
    const said = [];
    const add = (key, text) => {
      const line = String(text == null ? "" : text).trim();
      if (line) said.push({ key, text: line });
    };

    /* While a question is on screen it is the question being asked, so it is
       what Listen answers. Reading the story underneath it would talk past the
       thing the child is deciding. */
    if (page.confirm) {
      add("confirm", page.confirm);
      (page.actions || []).forEach((label, i) => add(`action-${i}`, label));
      return said;
    }

    add("heading", page.heading);
    add("caption", page.caption);
    (page.lines || []).forEach((line, i) => add(`line-${i}`, line));
    (page.words || []).forEach((word, i) => add(`word-${i}`, word));

    /* what is true on the stage right now, beside the stage */
    (page.readout || []).forEach((one, i) => add(`readout-${i}`, one));
    add("note", page.note);

    /* the optional comparison, in the order it is met */
    if (page.compare) {
      add("question", page.compare.question);
      (page.compare.options || []).forEach((one, i) => add(`option-${i}`, one));
      add("said", page.compare.said);
      /* only the help that has really been asked for */
      (page.compare.help || []).forEach((one, i) => add(`help-${i}`, one));
      add("found", page.compare.found);
    }
    add("earlier", page.earlier);
    add("later", page.later);

    /* and the ways on from here, in the order the buttons appear */
    (page.actions || []).forEach((label, i) => add(`action-${i}`, label));
    return said;
  }

  const spokenFor = (page) => readingFor(page).filter((one) => isSpoken(one.key));
  const linesFor = (page) => spokenFor(page).map((one) => one.text);
  const keysFor = (page) => spokenFor(page).map((one) => one.key);

  /* Where each part of the reading starts, so a replay can begin at one. */
  function segmentsFor(page) {
    const at = {};
    spokenFor(page).forEach((one, i) => { if (!(one.key in at)) at[one.key] = i; });
    return at;
  }

  /* ------------------------------------------------------------------ */
  /* reading as far as the next decision, and no further                 */
  /* ------------------------------------------------------------------ */

  /* The parent listened to another book read straight past a choice and on
     into the question that came after it. A child who is being read to cannot
     tell where the story is waiting for them if the voice never waits.

     So a page is not one reading. It is a few SEGMENTS, and a segment ends at
     a place where the child is meant to do something:

       opening   the story, what is true on the stage, and then the decision
                 itself - the ways on, or the question and its numbers. It
                 stops there. Nothing after the decision is read before the
                 decision is made.
       moved     what really happened when the puppet was moved, and what is
                 true now. It replaces the opening, it is not added to it.
       said      what the child chose, read back
       help      only the step that has just been asked for
       found     what the two heights turned out to be

     Only one segment is ever playing. Listen again repeats the segment the
     child is in, not the page - repeating a page would read the answer to a
     question they are still thinking about. */
  const SEGMENTS = ["opening", "moved", "said", "help", "found", "words"];

  function segmentsOf(page) {
    const out = {};
    if (!page) return out;
    const said = spokenFor(page);
    const of = (...kinds) => said
      .filter((one) => kinds.indexOf(kindOf(one.key)) !== -1)
      .map((one) => one.text);

    /* A question being asked is the only thing on the page worth saying: the
       story underneath it is not what the child is deciding. */
    if (page.confirm) {
      out.opening = of("confirm", "action");
      return out;
    }

    const story = of("line");
    const stage = of("readout", "note");
    const aside = of("earlier", "later");
    /* Where the page waits: the ways on and the things that can be moved, or
       the question and its three numbers. The opening runs up to here and
       stops. Nothing past the decision is read before it is made. */
    const decision = of("action").concat(of("question", "option"));

    out.opening = story.concat(stage, aside, decision);
    /* After a move the story IS what just happened, so this is the new
       sentences and the new readings - and NOT the row of controls again,
       which has not changed and would be read on every single move. */
    out.moved = story.concat(stage);
    const chose = of("said");
    if (chose.length) out.said = chose;
    const helped = of("help");
    if (helped.length) out.help = helped;
    const found = of("found");
    if (found.length) out.found = found;
    /* Two word meanings, read when the child opens them and not before. */
    const words = of("word");
    if (words.length) out.words = words;
    return out;
  }

  /* The lines of one segment, or of the opening if that segment is not on
     this page. */
  function linesOfSegment(page, key) {
    const all = segmentsOf(page);
    const lines = all[key];
    return lines && lines.length ? lines : (all.opening || []);
  }

  /* ------------------------------------------------------------------ */
  /* every line the player can ever ask for                              */
  /* ------------------------------------------------------------------ */

  /* The walk is written state by state rather than as one product of every
     field, because the list has to be REACHABLE as well as complete: a line
     nobody can hear would be a recording nobody needs, and Codex would be
     asked to make it.

     `runtime` is supplied by shadow-preview.js, so this file never holds a
     second copy of the story:

       M         the model
       NODES     the real node table
       describe  the same pure description the page is drawn from
       MARKS     the three settled positions
       CONFIGS   the six sets of props */
  function catalogue(runtime) {
    const M = runtime.M;
    const describe = runtime.describe;
    const NODES = runtime.NODES;
    const out = new Set();
    /* The union of every SEGMENT, because a segment is what the player is
       actually asked to say. Reading the flat page would list the same lines,
       but taking them segment by segment is the only way the list can be
       trusted to match what the player really requests. */
    const take = (view) => {
      const page = describe(view);
      const parts = segmentsOf(page);
      Object.keys(parts).forEach((key) =>
        parts[key].forEach((line) => { if (line) out.add(line); }));
    };

    const ids = Object.keys(NODES);
    M.CONFIGS.forEach((config) => {
      const base = M.createRehearsal(config, 0);

      M.MARKS.forEach((mark) => {
        /* the stage as it can really stand: at each mark, having been moved
           there or not, before and after a performance */
        const at = mark === base.mark ? base : M.moveTo(base, mark, "child").state;
        const doorAt = M.setScenery(at, "doorway");

        ids.forEach((id) => {
          const scene = NODES[id].doorway ? doorAt : at;
          /* nothing said, nothing asked, nothing performed */
          take({ nodeId: id, state: scene, lastMove: null });
          /* every move that can really land here, by either mover */
          M.MARKS.forEach((from) => ["child", "bunny"].forEach((mover) => {
            if (from === mark && mover === "child") return;
            take({ nodeId: id, state: scene, lastMove: { from, to: mark, mover } });
          }));
          /* while a hand is on the holder: one fixed sentence, never a
             running commentary of fractions */
          take({ nodeId: id, state: scene, lastMove: null, moving: true });
        });

        /* both performances, and the ending that follows each */
        take({ nodeId: "a4", state: M.perform(at, "giant"), lastMove: null });
        take({ nodeId: "b4", state: M.perform(doorAt, "door"), lastMove: null });
        take({ nodeId: "e1", state: M.perform(at, "giant"), lastMove: null });
        take({ nodeId: "e1", state: M.perform(doorAt, "door"), lastMove: null });
        take({ nodeId: "e1", state: M.watch(at), lastMove: null });
        /* and the afternoon that stopped without a story */
        take({ nodeId: "e1", state: at, lastMove: null });

        /* the optional comparison, in each of the states it passes through:
           nothing chosen, each number chosen, help asked for once and twice,
           and checked either way. Every arrangement of the three numbers is
           walked, because the arrangement turns with the reading. */
        [0, 1, 2].forEach((spin) => {
          const spun = M.createRehearsal(config, spin);
          const here = mark === spun.mark ? spun : M.moveTo(spun, mark, "child").state;
          const stage = M.setScenery(here, "doorway");
          const card = M.compareCard(config, mark, spin);
          const said = [null].concat(card.options);
          said.forEach((one) => [0, 1, 2].forEach((helped) => [false, true].forEach((checked) => {
            take({
              nodeId: "b2", state: stage, lastMove: null,
              card, said: one, helped, checked
            });
          })));
          /* a comparison checked before the puppet moved, seen again after */
          const kept = M.keepComparison(stage, {
            mark, shadow: card.shadow, door: card.door,
            difference: card.difference, direction: card.direction, said: card.difference
          });
          M.MARKS.forEach((then) => {
            const later = then === mark ? kept : M.moveTo(kept, then, "child").state;
            take({ nodeId: "b1", state: later, lastMove: null });
            take({ nodeId: "b2", state: later, lastMove: null, card: null });
          });
        });

        /* changing plays, which is offered before it happens */
        take({ nodeId: "c4", state: doorAt, lastMove: null, changingTo: "a1" });
        /* and starting over, which is the same */
        take({ nodeId: "e1", state: at, lastMove: null, confirmingRestart: true });
      });
    });
    return Array.from(out).sort();
  }

  /* ------------------------------------------------------------------ */
  /* reading a page aloud                                                */
  /* ------------------------------------------------------------------ */

  /* A thin arrangement over the shared player, which is not changed at all.
     Three rules, stated once and testable without a browser: one reading at a
     time, a newer request replaces an older one, and a reading that outlives
     the page it belongs to reports nothing and changes nothing.

     There is no fallback voice in here. If a clip is missing, the words stay
     on screen and the page says so. */
  function createReader(options) {
    const settings = options || {};
    const sound = settings.sound;
    const onChange = settings.onChange || (() => {});
    const gapMs = settings.missingGapMs == null ? 1200 : settings.missingGapMs;
    const wait = settings.wait || ((ms) => new Promise((r) => setTimeout(r, ms)));

    return {
      playing: false,
      /* which line is sounding, so the page can mark where it is */
      index: -1,
      /* counted from what happened THIS time: a warning from an earlier
         reading must not survive a playback that worked */
      missing: 0,
      heard: 0,
      status: TEXT.idle,
      turn: 0,

      set(status) { this.status = status; onChange(this); },

      stop(status) {
        this.turn += 1;
        if (sound && sound.stop) sound.stop();
        this.playing = false;
        this.index = -1;
        this.set(status == null ? TEXT.idle : status);
      },

      async read(lines, startAt, alive) {
        const still = alive || (() => true);
        const turn = this.turn + 1;
        this.turn = turn;
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
  }

  return { READY, TEXT, SHOWN_NOT_SAID, SEGMENTS, kindOf, isSpoken,
    readingFor, spokenFor, linesFor, keysFor, segmentsFor,
    segmentsOf, linesOfSegment, catalogue, createReader };
});
