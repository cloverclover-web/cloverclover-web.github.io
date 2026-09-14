/* The Shadow Theatre: one rehearsal, playable.

   The opening - C0 to C4 - is told; then the child chooses. The giant route,
   A1 to A2 with the optional A3, then A4, is the one with the theatre in it.
   The watching route, Q1 and Q2, is a whole way through with nothing to work
   out. Both end at E1.

   The doorway route, B1 to B4 with the optional comparison at B2, is the third
   way on from C4 and is now built. It is the same theatre, the same puppet and
   the same six sets of props as the giant route, with the little door picture
   in the frame instead of the sunflower: a shadow gets through it by being
   both short enough and narrow enough, or the visitor is met outside it, and
   neither ending is the better one.

   Everything countable comes from shadow-model.js and everything drawn comes
   from shadow-art.js. This file shows the model and takes input. It never
   decides a height, never writes to the device, never speaks and never asks
   the network for anything.

   The new narration is not recorded. The sample says so and plays nothing,
   rather than putting a different voice in the original's place. Every line
   it can show is enumerable through the model, ready for a later freeze.

   Nothing is graded. There is no score, no correct answer to reach before
   reading on, no reward for making the giant, and no automatic scroll or
   entrance animation: a result is simply there once it has happened. */

(function () {
  "use strict";

  const M = window.YoyoShadow;
  /* the mark the theatre is set up at, before anyone has moved anything */
  const M_START = M.START_MARK;
  const Art = window.YoyoShadowArt;
  /* The pages that are only a story: the opening, the watching route and the
     words for the ending's picture. They are told, not measured, so they are
     kept apart from the model. */
  const Story = window.YoyoShadowStory;
  /* What the sample says out loud, and the bounded list of every line it can
     ever ask for. Nothing is recorded yet, so no Listen control is offered at
     all - a button that would do nothing is worse than saying so. */
  const NAR = window.YoyoShadowNarration;
  const $ = (sel) => document.querySelector(sel);

  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  };

  /* ------------------------------------------------------------------ */
  /* the pages of this book                                              */
  /* ------------------------------------------------------------------ */

  /* One page of the told part of the story, turned into a node. Nothing here
     touches the stage: `stage: "none"` means the measured theatre - the
     painting, the screen overlay, the side view, the track and the readings -
     is not on this page at all. */
  function toldPage(id) {
    const page = Story.PAGES[id];
    const art = Story.artFor(page);
    return {
      id,
      told: true,
      heading: () => page.heading,
      stage: "none",
      scene: art,
      words: page.words || null,
      note: page.note || "",
      lines: () => page.lines,
      choices: page.choices || null,
      next: page.next || null,
      watched: Boolean(page.watched)
    };
  }

  const NODES = {
    c0: toldPage("c0"),
    c1: toldPage("c1"),
    /* THE ARRANGEMENT, ONCE, WHERE THE STORY EXPLAINS IT.
       The painting is a close view of the visitor going into its holder; it
       deliberately does not show the lamp, the puppet and the screen together,
       which is exactly what this page's words are about. So the same side view
       the rehearsal uses is drawn here too, at the mark the theatre was set up
       at. It is a picture of the setting up, not a live reading: it never
       moves the puppet, and coming back to it after moving does not pretend
       the puppet went back. */
    c2: Object.assign(toldPage("c2"), {
      stage: "side",
      quietStage: true,
      at: M_START,
      caption: () => "How the little theatre is arranged: the lamp behind, "
        + "the paper visitor on its track, and the screen in front."
    }),
    /* THE TWO OBSERVATIONS THE STORY TURNS ON.
       The painting is Bear's feeling afterwards. What he is feeling about is
       the same shadow beside two different pictures, and that is shown here as
       two precise comparisons from the model - first the sunflower, then the
       doorway, both at the mark the puppet started from. They are marked as a
       look back and change nothing about where the puppet is now. */
    c3: Object.assign(toldPage("c3"), {
      then: [
        { scenery: "sunflower",
          label: "First, beside Bunny's sunflower picture." },
        { scenery: "doorway",
          label: "Then, beside Duck's doorway picture." }
      ]
    }),
    c4: toldPage("c4"),
    q1: toldPage("q1"),
    /* THE QUIET GARDEN STORY, ACTUALLY SEEN.
       Watching used to be the one way through the book in which no shadow ever
       appeared. It does now - the sunflower stage as it really stands, at
       whatever place the child left the puppet - and it is still only
       something to look at: no readings, no question, no holder to slide. */
    q2: Object.assign(toldPage("q2"), {
      stage: "front",
      quietStage: true,
      closeUp: true,
      scenery: "sunflower",
      caption: (state) => `The visitor's shadow in the garden story, from the `
        + `${M.cm(state.mark)} mark.`
    }),

    a1: {
      id: "a1",
      heading: () => Story.HEADINGS.a1,
      /* Coming back here after moving the puppet finds the stage as the child
         left it, so the caption, the words and the readings all describe that
         stage rather than the one the rehearsal began with. */
      caption: (state) => M.sceneCaption(state),
      stage: "both",
      lines: (state) => M.openingLines(state.config, state.mark),
      next: { label: "Let's try moving the puppet", to: "a2" }
    },
    a2: {
      id: "a2",
      heading: () => Story.HEADINGS.a2,
      caption: (state) => M.sceneCaption(state),
      stage: "both",
      rehearsing: true,
      /* what the friends say about what actually just happened - or, before
         anything has, that nothing has */
      lines: (state, last) => (last
        ? M.describeMove(state, last.from, last.to, last.mover)
        : [M.STAYED])
    },
    a3: {
      id: "a3",
      heading: () => Story.HEADINGS.a3,
      caption: () => "The same lamp, the same puppet, the same screen, drawn from the side.",
      stage: "side",
      guides: true,
      lines: () => M.WHY_LINES,
      next: { label: "Try it in our play", to: "a4" },
      skip: { label: "Back to the stage", to: "a2" }
    },
    a4: {
      id: "a4",
      /* the play is called what it really is: a little visitor's story is not
         The Garden Giant */
      heading: (state) => M.playTitleFor(state),
      caption: () => "The play, from the audience's cushions.",
      stage: "front",
      lines: (state) => M.playFor(state),
      next: { label: "Read on", to: "e1" }
    },
    /* ---- the little door, which is a whole rehearsal of its own ---- */

    b1: {
      id: "b1",
      heading: () => Story.HEADINGS.b1,
      /* Duck's invitation, painted; the doorway itself and the shadow beside
         it are the model stage under it, because the painting deliberately
         does not carry them. */
      scene: Story.ART.doorwayInvitation,
      /* Coming back here after moving the puppet describes the shadow that is
         really on the screen. It must not still say the door is too small. */
      caption: (state) => M.doorCaption(state),
      stage: "both",
      doorway: true,
      lines: (state) => M.doorLines(state),
      choices: [
        { label: "Compare the heights", to: "b2" },
        { label: "Try a different position", to: "b3" }
      ]
    },
    b2: {
      id: "b2",
      heading: () => Story.HEADINGS.b2,
      caption: (state) => M.doorCaption(state),
      /* A close-up of the two things being compared: the whole opening and the
         whole shadow, on one ground line. The backstage view is not what this
         page is about, and the puppet is not moved from here. */
      stage: "front",
      doorway: true,
      /* a close look at the two things being compared, on one ground line */
      closeUp: true,
      comparing: true,
      lines: () => M.DOOR_MEASURE
    },
    b3: {
      id: "b3",
      heading: () => Story.HEADINGS.b3,
      caption: (state) => M.doorCaption(state),
      stage: "both",
      doorway: true,
      /* the same rehearsal machinery as A2: the same holder, the same drag,
         the same keyboard, the same one-hand and one-commit rules */
      rehearsing: true,
      lines: (state, last) => (last
        ? M.doorMoveLines(state, last.from, last.to, last.mover)
        : M.doorStandLines(state))
    },
    b4: {
      id: "b4",
      heading: (state) => M.doorTitleFor(state),
      /* The picture says which play this is, not only the words: the visitor's
         shadow either stands in the garden behind the opening or beside it. */
      caption: (state) => (M.doorFit(state.config, state.mark).fits
        ? "The play, from the audience's cushions: the visitor inside the garden doorway."
        : "The play, from the audience's cushions: the visitor beside the garden doorway."),
      stage: "front",
      doorway: true,
      /* the one page where the shadow walks along the screen */
      performing: true,
      /* and a close enough look to see whether it went through */
      closeUp: true,
      lines: (state) => M.doorPlayFor(state),
      next: { label: "Read on", to: "e1" }
    },

    e1: {
      id: "e1",
      heading: () => Story.HEADINGS.e1,
      /* the lamp is off: there is no shadow to draw, and drawing one would
         contradict the words */
      stage: "none",
      /* the room lights are up and the theatre is being put away; this one
         does have its painting */
      scene: Story.ART.cleanup,
      ending: true,
      lines: (state) => M.endingFor(state)
    }
  };

  const START = "c0";
  /* The two pages where the puppet is really moved. They are the same
     machinery - the same holder, the same drag, the same keyboard - because it
     is the same rehearsal with a different picture behind it. */
  const REHEARSAL_NODES = ["a2", "b3"];
  const REHEARSAL_NODE = "a2";
  const isRehearsing = (id) => REHEARSAL_NODES.indexOf(id) !== -1;
  /* which play each route belongs to, so that changing plays can be noticed */
  const ROUTE_OF = { a1: "giant", a2: "giant", a3: "giant", a4: "giant",
    b1: "door", b2: "door", b3: "door", b4: "door", q1: "watch", q2: "watch" };

  const RESTART = "Another rehearsal starts this sample again from the beginning, with a "
    + "different set of props. This rehearsal's places are cleared. Nothing you have saved "
    + "anywhere else changes.";

  /* ------------------------------------------------------------------ */
  /* the whole sample's state, in memory only                            */
  /* ------------------------------------------------------------------ */

  const preview = {
    /* bumped by a new rehearsal, so a control captured before it is dead */
    reading: 0,
    /* Bumped by every full draw of the page. This, not the reading and the
       node, is what a control belongs to: the exact view that put it on
       screen. Moving the puppet redraws the stage and the buttons underneath
       it, but NOT the page, so the other controls the child can still see -
       and may already be reaching for - keep working. */
    view: 0,
    node: START,
    /* where this reading has really been, so Back retraces the child's own
       path rather than an index into an array they never saw */
    path: [START],
    state: null,
    previousConfig: null,
    /* the move that produced the words now on screen, so a page turn does not
       repeat a description of something that happened long ago */
    lastMove: null,
    /* the child chose to stop rather than perform */
    paused: false,
    confirmingRestart: false,
    /* Where the holder is WHILE a hand is still on it: a real distance
       anywhere between the nearest and the furthest mark, not a mark. It is
       deliberately not part of the rehearsal. Nothing that reads
       preview.state can see it, nothing is recorded from it, and letting go
       anywhere but on a mark leaves no trace of it at all. */
    dragD: null,
    /* ---- the little door's optional comparison ---- */
    /* The comparison being worked on: the two heights as they were when it was
       set up, the difference and which way round it is. It is built once and
       does not change while the child is looking at it - not on Back, not
       after help, not after checking. Moving the puppet does not rewrite it
       into a sum nobody did; it makes it something that happened earlier. */
    card: null,
    /* the number the child chose, kept apart from the stage: choosing never
       moves the puppet or changes a real height */
    said: null,
    /* how much of the worked example has actually been asked for */
    helped: 0,
    /* the explicit "let's check". Until it happens the difference is not
       shown, because an answer that arrives first is not one anyone found. */
    checked: false,
    /* Which play this reading is in the middle of, so that choosing a
       different one can say what it is about to do before it does it. */
    route: null,
    /* the play the child has asked to change to, while they are being asked
       whether they really want the stage put back */
    changingTo: null,
    /* ---- being read to ---- */
    /* Whether the child has asked to be read to. Set by the cover action and
       by Listen; cleared by Stop, which then keeps the book quiet through
       every later page turn until Listen is pressed again. */
    listening: false,
    /* which segment of the page the voice is in, so Listen again repeats
       THAT and not the whole page */
    segment: "opening",
    /* the pages of this reading that have really been heard */
    heard: new Set(),
  };

  /* What the drawings are showing: the rehearsal as it stands, or the position
     a hand is holding it at. */
  const viewState = () => {
    const node = NODES[preview.node];
    const live = preview.dragD === null
      ? preview.state
      : { ...preview.state, mark: preview.dragD };
    /* A page can be looking back at a moment rather than at the rehearsal as
       it stands. Reading it changes nothing: `at` only decides what the
       PICTURE shows, and the puppet stays exactly where the child left it. */
    const at = node && node.at != null ? { ...live, mark: node.at } : live;
    /* Which picture is behind the shadow follows the page, so a page can show
       the sunflower stage inside the doorway route's own reading and the
       other way round, without moving anything. */
    const scenery = node && node.scenery ? node.scenery : at.scenery;
    return {
      ...at,
      scenery,
      /* On the performance page the shadow is not standing where it rehearsed:
         it has walked to where the play puts it. Its size is untouched. */
      performing: Boolean(node && node.performing),
      /* and some pages look at the same cloth from closer */
      closeUp: Boolean(node && node.closeUp)
    };
  };
  const isMoving = () => preview.dragD !== null;

  function startReading() {
    const config = M.chooseConfig(preview.previousConfig, null);
    preview.previousConfig = config;
    preview.state = M.createRehearsal(config);
    preview.reading += 1;
    preview.node = START;
    preview.path = [START];
    preview.lastMove = null;
    preview.paused = false;
    preview.confirmingRestart = false;
    clearComparison();
    preview.route = null;
    preview.changingTo = null;
    /* a new reading has heard nothing and has not been asked to read */
    preview.listening = false;
    preview.segment = "opening";
    preview.heard = new Set();
    hushAudio();
    render();
  }

  /* Nothing to compare, and nothing said about one. */
  function clearComparison() {
    preview.card = null;
    preview.said = null;
    preview.helped = 0;
    preview.checked = false;
  }

  /* The comparison this page is showing. It is built once, from the shadow
     that is really on the screen at the moment it is asked for, and then left
     alone: the question and its three numbers stay exactly as they are until
     the child asks for a new comparison. */
  function openComparison(force) {
    const state = preview.state;
    if (!force && preview.card && preview.card.mark === state.mark) return;
    if (!force && preview.card) return;
    clearComparison();
    preview.card = M.compareCard(state.config, state.mark, state.spin);
  }

  /* Going on to another node. The props are never re-rolled here: one reading
     has one set, and moving, coming back or reading on cannot replace it or
     put the puppet back by itself. */
  function enter(id) {
    const node = NODES[id];
    if (!node) return;
    /* Which picture is in the frame follows the play being rehearsed. The
       puppet, its places and the set of props are untouched: this is the
       scenery changing, not the rehearsal restarting. */
    const wants = node.doorway ? "doorway" : (ROUTE_OF[id] === "giant" ? "sunflower" : null);
    if (wants && preview.state.scenery !== wants) {
      preview.state = M.setScenery(preview.state, wants);
    }
    if (ROUTE_OF[id]) preview.route = ROUTE_OF[id];
    if (id === "a4") preview.state = M.perform(preview.state, "giant");
    if (id === "b4") preview.state = M.perform(preview.state, "door");
    /* Arriving at the comparison sets one up for the shadow that is on the
       screen now, unless one is already open for exactly this position. */
    if (node.comparing) openComparison(false);
    /* Reaching the quiet garden story is the story happening. It moves no
       puppet and measures nothing; it only means the afternoon had a story in
       it, so the ending does not say they left the rehearsal for another day. */
    if (node.watched) preview.state = M.watch(preview.state);
    preview.node = id;
    preview.path.push(id);
    preview.confirmingRestart = false;
    render();
  }

  /* Taking a way on from a page that offers several. If it means leaving one
     play for another after the stage has been used, the child is told what
     that will do to the stage before it happens - and an ordinary Back is
     never that. */
  function choose(id) {
    const to = ROUTE_OF[id];
    const used = preview.state
      && (preview.state.mark !== M.START_MARK || preview.state.scenery !== "sunflower");
    // Watching uses the puppet where the child left it, not a reset rehearsal.
    if (to && to !== "watch" && preview.route && to !== preview.route && used) {
      preview.changingTo = id;
      render();
      return;
    }
    enter(id);
  }

  function back() {
    if (preview.path.length < 2) return;
    preview.path.pop();
    preview.node = preview.path[preview.path.length - 1];
    preview.confirmingRestart = false;
    render();
  }

  /* A control belongs to the drawing of the page that produced it, and stops
     working the moment that drawing is replaced. Same reading and same node
     is not enough: leaving A2 and coming back to it is the same node in the
     same reading, and a button abandoned on the first visit must not move the
     puppet in the rehearsal the child has come back to. A view number cannot
     come back. */
  function guarded(fn) {
    const view = preview.view;
    return () => {
      if (preview.view !== view) return;
      fn();
    };
  }

  /* ------------------------------------------------------------------ */
  /* moving the puppet                                                   */
  /* ------------------------------------------------------------------ */

  /* One move. Input that arrives from anywhere but the live rehearsal node is
     refused outright, so a control left behind by another page - or by a
     previous reading - cannot touch the stage.

     Deliberately not a full redraw: the picture, the readings, the words and
     the buttons underneath are refreshed, but the page is not drawn again, so
     the other places the child can still see keep working for the next tap. */
  function moveTo(mark, mover) {
    if (!isRehearsing(preview.node)) return;
    /* One hand at a time. A tap that arrives while the holder is still being
       slid is ignored rather than committing a second move underneath the
       first: letting go is what settles where the puppet is. */
    if (drag.on) return;
    const result = M.moveTo(preview.state, mark, mover);
    if (!result.moved) {
      /* a second tap on the place it is already at is harmless, and says so */
      preview.lastMove = null;
      refresh();
      speakIfListening("moved");
      return;
    }
    preview.state = result.state;
    preview.lastMove = { from: result.from, to: result.to, mover: mover || "child" };
    refresh();
    /* what really happened, in place of what was being said before it */
    speakIfListening("moved");
  }

  /* One place towards the lamp, or one place towards the screen, from where
     the puppet actually is at the moment of the tap. */
  function moveNearer(towards) {
    if (!isRehearsing(preview.node) || drag.on) return;
    const target = towards === "lamp"
      ? M.nearerLamp(preview.state.mark)
      : M.nearerScreen(preview.state.mark);
    if (target === null) { preview.lastMove = null; refresh(); return; }
    moveTo(target, "child");
  }

  function watchBunny() {
    if (!isRehearsing(preview.node) || drag.on) return;
    const result = M.watchBunny(preview.state);
    if (!result.moved) { preview.lastMove = null; refresh(); return; }
    preview.state = result.state;
    preview.lastMove = { from: result.from, to: result.to, mover: "bunny" };
    refresh();
    speakIfListening("moved");
  }

  /* ------------------------------------------------------------------ */
  /* sliding the holder                                                  */
  /* ------------------------------------------------------------------ */

  /* The holder is dragged directly, with one set of handlers for a mouse and
     a finger alike, because Pointer Events do not care which it is.

     Three rules hold this together:

       one hand    the first pointer to take the holder keeps it; a second
                   finger arriving on top of it changes nothing
       one commit  letting go settles on the nearest mark and records exactly
                   one move; every other ending - cancel, Escape, losing the
                   capture, leaving the page, the tab going away - puts the
                   rehearsal back as it was and records nothing at all
       one view    a drag belongs to the drawing of the page that started it,
                   so a pointer event that arrives after the page has been
                   redrawn is refused, exactly as an abandoned button is

     The element being dragged is in the page's own markup and is never
     rebuilt, so the node holding the pointer capture cannot be replaced
     underneath the hand holding it. */
  const drag = {
    on: false, pointerId: null, view: -1, reading: -1,
    /* Where the hand took hold: the pointer's x when it went down, and the
       distance the puppet was standing at then. The holder moves by how far
       the HAND has moved, not to wherever the pointer happens to be.

       Without this, taking hold near an edge of a 56 px holder snapped the
       puppet's centre under the finger: at 375 px, grabbing 22 px off centre
       at the 20 cm mark and moving one pixel jumped the puppet to 18.76 or
       21.35 cm instead of 20.06. A big target is no use if only its middle
       behaves. */
    grabX: 0, grabD: null
  };

  const gripNode = () => $("#slideGrip");

  /* Is this event still the drag we started? */
  function mine(event) {
    if (!drag.on) return false;
    if (drag.view !== preview.view || drag.reading !== preview.reading) return false;
    if (drag.pointerId != null && event && event.pointerId != null
      && event.pointerId !== drag.pointerId) return false;
    return true;
  }

  /* How many centimetres of track one pixel of the strip is worth. */
  function cmPerPixel() {
    const lane = $("#slideLane");
    const rect = lane && lane.getBoundingClientRect ? lane.getBoundingClientRect() : null;
    if (!rect || !rect.width) return 0;
    return (M.TRACK_FAR - M.TRACK_NEAR) / rect.width;
  }

  /* Where the hand has carried the holder, as a real distance from the lamp:
     where it was picked up, plus how far the hand has travelled since. Past
     either end of the track it is the end of the track. */
  function distanceAt(clientX) {
    const perPixel = cmPerPixel();
    const from = drag.grabD === null ? preview.state.mark : drag.grabD;
    if (!perPixel) return from;
    return M.clampToTrack(from + (clientX - drag.grabX) * perPixel);
  }

  /* Let go of everything without drawing: used when the page itself is about
     to be drawn again. */
  function abandonDrag() {
    if (!drag.on && preview.dragD === null) return;
    const grip = gripNode();
    if (grip && drag.pointerId != null && typeof grip.releasePointerCapture === "function") {
      try { grip.releasePointerCapture(drag.pointerId); } catch (ignored) { /* already gone */ }
    }
    drag.on = false;
    drag.pointerId = null;
    drag.grabD = null;
    drag.grabX = 0;
    preview.dragD = null;
    const track = $("#slideTrack");
    if (track) track.classList.remove("is-moving");
  }

  function dragStart(event) {
    const node = NODES[preview.node];
    if (!node || !node.rehearsing) return;
    /* a second finger does not take the holder off the first one */
    if (drag.on) return;
    if (event && event.isPrimary === false) return;
    if (event && typeof event.button === "number" && event.button > 0) return;

    drag.on = true;
    drag.pointerId = event && event.pointerId != null ? event.pointerId : null;
    drag.view = preview.view;
    drag.reading = preview.reading;
    /* Take hold wherever the hand landed on it. Nothing moves yet. */
    drag.grabX = event && typeof event.clientX === "number" ? event.clientX : 0;
    drag.grabD = preview.state.mark;
    const grip = gripNode();
    if (grip && drag.pointerId != null && typeof grip.setPointerCapture === "function") {
      try { grip.setPointerCapture(drag.pointerId); } catch (ignored) { /* no capture */ }
    }
    if (event && typeof event.preventDefault === "function") event.preventDefault();
    /* Preventing the default also prevents the browser focusing the holder,
       so the keyboard is put on it deliberately: a child who starts with a
       hand and carries on with the arrow keys is in the same place. */
    if (grip && typeof grip.focus === "function") {
      /* preventScroll: focusing an element normally scrolls it into view, and
         the page must not move under a hand that has just landed on it */
      try { grip.focus({ preventScroll: true }); } catch (ignored) { grip.focus(); }
    }
    /* A hand on the holder stops the voice. Nothing is read while the shadow
       is being slid: a running commentary of the distances a hand happens to
       pass through is not something anyone should have read to them, and the
       page has already put those numbers away. */
    hushAudio();
    /* the hand starts where the puppet already is */
    preview.dragD = preview.state.mark;
    const track = $("#slideTrack");
    if (track) track.classList.add("is-moving");
    refresh();
  }

  function dragMove(event) {
    if (!mine(event)) return;
    if (!event || typeof event.clientX !== "number") return;
    preview.dragD = distanceAt(event.clientX);
    refresh();
  }

  /* Letting go, one way or the other. `commit` is true only for a real
     release; everything else puts the rehearsal back exactly as it was. */
  function dragEnd(event, commit) {
    if (!drag.on) return;
    if (event && !mine(event)) return;
    const at = preview.dragD;
    const live = drag.view === preview.view && drag.reading === preview.reading;
    abandonDrag();
    if (!commit || at === null || !live || !isRehearsing(preview.node)) {
      refresh();
      return;
    }
    /* exactly one move, at the mark nearest to where the holder was let go */
    moveTo(M.snapToMark(at), "child");
  }

  /* The keyboard does the same job as the hand, and is not a lesser route:
     one mark at a time with the arrows, either end with Home and End. */
  function gripKey(event) {
    const key = event && event.key;
    if (key === "Escape") { if (drag.on) dragEnd(null, false); return; }
    if (!isRehearsing(preview.node) || drag.on) return;
    let target;
    if (key === "ArrowLeft" || key === "ArrowDown") target = M.nearerLamp(preview.state.mark);
    else if (key === "ArrowRight" || key === "ArrowUp") target = M.nearerScreen(preview.state.mark);
    else if (key === "Home") target = M.TRACK_NEAR;
    else if (key === "End") target = M.TRACK_FAR;
    else return;
    if (typeof event.preventDefault === "function") event.preventDefault();
    if (target === null || target === undefined) { preview.lastMove = null; refresh(); return; }
    moveTo(target, "child");
  }

  function bindGrip() {
    const grip = gripNode();
    if (!grip || !grip.addEventListener) return;
    grip.addEventListener("pointerdown", dragStart);
    grip.addEventListener("pointermove", dragMove);
    grip.addEventListener("pointerup", (event) => dragEnd(event, true));
    grip.addEventListener("pointercancel", (event) => dragEnd(event, false));
    /* the browser or the system can take the capture away without a release;
       that is not a move the child made */
    grip.addEventListener("lostpointercapture", (event) => dragEnd(event, false));
    grip.addEventListener("keydown", gripKey);
    /* a click on the holder is the end of a drag, never a move of its own */
    grip.addEventListener("click", (event) => {
      if (event && typeof event.preventDefault === "function") event.preventDefault();
    });
  }

  /* ------------------------------------------------------------------ */
  /* drawing                                                             */
  /* ------------------------------------------------------------------ */

  let placeScreen = () => {};
  /* the controls this drawing of the page put on screen, so a move can change
     what they do without replacing them */
  const live = [];

  /* The painting for a told page. Two of them exist - the invitation and the
     putting-away - and the pages that have none show none: the rehearsal
     painting is never borrowed to stand in for a scene it is not. */
  function renderScene(node) {
    const scene = $("#storyScene");
    const img = $("#storyArt");
    const caption = $("#storyCaption");
    if (!scene || !img || !caption) return;
    const art = node.scene || null;
    scene.hidden = !art;
    if (!art) { img.removeAttribute("src"); img.alt = ""; caption.textContent = ""; return; }
    if (img.getAttribute("src") !== art.src) img.setAttribute("src", art.src);
    img.alt = art.alt;
    caption.textContent = art.caption;
  }

  /* WHAT THEY SAW EARLIER.

     Two precise pictures of the same moment: the shadow the puppet made from
     the place it started at, first beside the sunflower and then beside the
     doorway. They are drawn from the model, at that mark, whatever the child
     has done since - which is the whole point of a look back. Nothing here
     reads the rehearsal's live position, and nothing here writes to it.

     They are labelled as earlier, in order, so they are never mistaken for
     what is on the screen now. */
  const THEN_TITLE = "Earlier, from the mark the visitor started at:";

  function renderThen(node) {
    const panel = $("#thenScenes");
    const row = $("#thenRow");
    const title = $("#thenTitle");
    if (!panel || !row || !title) return;
    const scenes = node.then || null;
    panel.hidden = !scenes;
    row.innerHTML = "";
    title.textContent = scenes ? THEN_TITLE : "";
    if (!scenes) return;

    scenes.forEach((scene, i) => {
      const figure = el("figure", "then-scene");
      figure.dataset.then = String(i);
      const frame = el("div", "then-frame");
      /* the same drawing the stage uses, from the same model, at the mark the
         rehearsal began at - never at wherever the puppet is now */
      frame.innerHTML = Art.screenSvg(M, {
        config: preview.state.config,
        mark: M_START,
        scenery: scene.scenery,
        compareScenery: true,
        closeUp: true
      }, { left: 0, top: 0, width: Art.CLOSE.aspect, height: 1 }).svg;
      figure.append(frame);
      figure.append(el("figcaption", "then-caption", scene.label));
      row.append(figure);
    });
  }

  function renderStage(node) {
    const stage = $("#stage");
    const front = $("#stageFront");
    const side = $("#stageSide");
    const shows = node.stage || "none";

    stage.classList.toggle("is-hidden", shows === "none");
    front.hidden = shows !== "both" && shows !== "front";
    side.hidden = shows !== "both" && shows !== "side";
    /* one view on its own takes the whole width rather than half a row */
    stage.classList.toggle("is-single", shows === "front" || shows === "side");
    /* A close-up frame takes the crop's own shape, so a centimetre across and
       a centimetre up stay the same length. */
    const frame = $("#sceneFrame");
    if (frame && frame.classList) {
      frame.classList.toggle("is-close", Boolean(node.closeUp));
      if (!node.closeUp && frame.style) frame.style.aspectRatio = "";
    }
    if (shows === "none") { placeScreen = () => {}; return; }

    $("#sceneCaption").textContent = isMoving()
      ? movingCaption(node)
      : (node.caption ? node.caption(preview.state) : "");

    /* the audience's side: the scenery and the shadow, on one ground line,
       laid over the painting's own measured screen */
    const img = $("#sceneArt");
    const layer = $("#screenLayer");
    layer.innerHTML = "";
    placeScreen = () => {
      /* The close-up is the same cloth, seen from nearer. The rehearsal
         painting is not behind it - at this distance the painting's own
         little screen is what we have zoomed past - so the frame supplies the
         book's cloth and wood, and the drawing fills it. Its shape is fixed
         and equals the crop's, so nothing is stretched. */
      if (node.closeUp) {
        layer.style.left = "0px";
        layer.style.top = "0px";
        layer.style.width = "100%";
        layer.style.height = "100%";
        layer.innerHTML = Art.screenSvg(M, viewState(),
          { left: 0, top: 0, width: Art.CLOSE.aspect, height: 1 }).svg;
        return true;
      }
      const rect = Art.containedRect(img);
      if (!rect) return false;
      const box = Art.screenBox(rect);
      layer.style.left = `${box.left.toFixed(2)}px`;
      layer.style.top = `${box.top.toFixed(2)}px`;
      layer.style.width = `${box.width.toFixed(2)}px`;
      layer.style.height = `${box.height.toFixed(2)}px`;
      /* Every frame of a slide is drawn from the distance the hand is really
         at, through the same H = h * D / d as every other picture in this
         sample. Nothing is interpolated between the marks. */
      layer.innerHTML = Art.screenSvg(M, viewState(), box).svg;
      return true;
    };
    if (!placeScreen()) img.addEventListener("load", () => placeScreen(), { once: true });

    /* the same theatre from behind */
    const guides = Boolean(node.guides);
    $("#sideArt").innerHTML = Art.backstageSvg(M, viewState(), { guides, moving: isMoving() }).svg;
    const label = $("#guideLabel");
    label.textContent = guides ? M.GUIDE_LABEL : "";
    label.hidden = !guides;
  }

  /* The unit, the fixed paper, where the puppet is and the two heights being
     compared - beside the stage, where the child is working, not in narration
     on another page. */
  function movingCaption(node) {
    return node.doorway
      ? "The doorway scenery, and the visitor's shadow while the puppet moves."
      : M.MOVING_CAPTION;
  }

  function readoutFor(node, state, moving) {
    const said = moving ? M.movingReadout(state.config) : M.readout(state.config, state.mark);
    if (node.doorway) said.flower = `Doorway picture: ${M.cm(state.config.doorway)} high`;
    return said;
  }

  function promptFor(node, state, moving) {
    if (moving) return M.MOVING_NOTE;
    if (!node.doorway) return M.stagePrompt(state.config, state.mark);
    return M.doorFit(state.config, state.mark).fits
      ? "The shadow fits through the pictured doorway."
      : "The shadow does not fit through the pictured doorway at this size.";
  }

  function renderReadout(node) {
    const list = $("#readout");
    list.innerHTML = "";
    const note = $("#stageNote");
    /* A page that is only being LOOKED at has no readings beside it. The
       watching route and the told opening show the apparatus so that the
       story can be seen; they do not turn it into something to measure, and
       nothing on them is a question. */
    if (!node.stage || node.stage === "none" || node.quietStage) {
      note.textContent = "";
      return;
    }

    /* While the holder is still moving, the two readings that are about to be
       out of date are put away and the two that genuinely have not changed
       stay. Both keep their places, so nothing below them moves. */
    const said = readoutFor(node, preview.state, isMoving());
    [["puppet", said.puppet], ["mark", said.mark], ["shadow", said.shadow], ["flower", said.flower]]
      .forEach(([key, text]) => {
        const item = el("li", `readout-${key}`);
        item.dataset.readout = key;
        item.textContent = text;
        list.append(item);
      });
    note.textContent = promptFor(node, preview.state, isMoving());
  }

  /* The controls are built once for a drawing of the page and then left
     alone. A move used to empty the row and build it again: the direction
     button the child was aiming at was replaced by a different element, one
     of the two vanished at the ends of the track, and the sentence above
     changed length - so the next tap at the same place on the screen landed
     on nothing. The row now keeps its nodes and its order, and a place the
     puppet cannot go to is switched off in its own slot rather than
     disappearing from between the others.

     On the rehearsal page the row also sits above the words, so a longer or
     shorter sentence can never move a button that is already under a finger.
     On a page that is only read, the words come first: see orderMain. */
  function renderActions(node) {
    const row = $("#beatActions");
    row.innerHTML = "";
    live.length = 0;

    const button = (cls, label, fn, key) => {
      const b = el("button", `btn ${cls}`, label);
      b.type = "button";
      if (key) b.dataset.control = key;
      b.addEventListener("click", guarded(fn));
      row.append(b);
      if (key) live.push({ key, node: b });
      return b;
    };

    /* Starting over is explained first and confirmed second. While the
       explanation is on screen it is the only thing offered, so it cannot be
       walked past by accident. */
    if (preview.confirmingRestart) {
      button("btn-primary", "Yes, start another rehearsal", () => startReading(), "yes");
      button("btn-quiet", "No, keep this one", () => {
        preview.confirmingRestart = false;
        render();
      }, "no");
      return;
    }

    /* Changing to a different play really does put the stage back, so it says
       so first and does it second. An ordinary Back never does either. */
    if (preview.changingTo) {
      const to = preview.changingTo;
      button("btn-primary", "Change our play", () => {
        preview.state = M.changePlay(preview.state);
        preview.lastMove = null;
        clearComparison();
        preview.changingTo = null;
        enter(to);
      }, "change-yes");
      button("btn-quiet", "Keep this play", () => {
        preview.changingTo = null;
        render();
      }, "change-no");
      return;
    }

    if (node.rehearsing) {
      const door = node.doorway;
      /* Both directions, always in the same two places. Which one is possible
         is worked out when the button is pressed, so a control the child was
         already reaching for still does exactly what it says from wherever
         the puppet is now. */
      button("btn-secondary", "Move nearer the lamp", () => moveNearer("lamp"), "lamp");
      button("btn-secondary", "Move nearer the screen", () => moveNearer("screen"), "screen");
      button("btn-quiet", "Watch Bunny try", () => watchBunny(), "watch");
      /* The doorway rehearsal offers its own optional comparison in the same
         slot the giant route uses for the diagram. Neither is needed in order
         to go on. */
      if (door) {
        button("btn-quiet", "Compare these heights", () => {
          openComparison(true);
          enter("b2");
        }, "compare");
      } else {
        button("btn-quiet", "Show me why", () => enter("a3"), "why");
      }
      /* Reading on is always possible, whatever the shadow is doing. */
      button("btn-primary", "Use this shadow in our play",
        () => enter(door ? "b4" : "a4"), "play");
      button("btn-quiet", "Leave it for another afternoon", () => {
        preview.paused = true;
        enter("e1");
      }, "pause");
    }

    /* The optional comparison's own controls. Help is only ever shown after it
       has been asked for, and checking is the child's to press: nothing here
       reveals the difference before then, and nothing blocks reading on. */
    if (node.comparing && preview.card) {
      if (!preview.checked && preview.helped < 2) {
        button("btn-quiet", "Help me compare", () => {
          preview.helped += 1;
          /* only the step that has just been asked for */
          renderSaying("help");
        }, "help");
      }
      if (!preview.checked) {
        button("btn-secondary", "Let's check", () => {
          preview.checked = true;
          /* what was compared, kept as it was when it was compared */
          preview.state = M.keepComparison(preview.state, {
            mark: preview.card.mark, shadow: preview.card.shadow,
            door: preview.card.door, difference: preview.card.difference,
            direction: preview.card.direction, said: preview.said
          });
          /* what the two heights turned out to be, and nothing else */
          renderSaying("found");
        }, "check");
      }
      button("btn-primary", "Now let's find a place", () => enter("b3"), "toB3");
    }

    /* Every way on from here looks the same and reads the same. None is the
       recommended one, because none is. */
    (node.choices || []).forEach((choice, i) => {
      button("btn-secondary", choice.label, () => choose(choice.to), `choice-${i}`);
    });

    if (node.skip) button("btn-quiet", node.skip.label, () => enter(node.skip.to), "skip");
    if (node.next) {
      const label = labelFor(node);
      const b = button("btn-primary", label, () => {
        /* Read with me is one action: it opens the story AND starts the
           reading. It is also the deliberate gesture a browser wants before
           it will let anything play. */
        if (node.id === START && canListen()) preview.listening = true;
        enter(node.next.to);
      }, "next");
      /* the cover's way in is the one big action on that page */
      if (node.id === START) b.classList.add("reader-start");
    }

    if (node.ending) {
      button("btn-quiet", "Try another version of the play", () => {
        preview.confirmingRestart = true;
        render();
      }, "restart");
      const out = el("a", "btn btn-primary", "Back to the library");
      out.setAttribute("href", "./index.html");
      row.append(out);
    }

    if (preview.path.length > 1) button("btn-quiet", "Back", () => back(), "back");
    updateActions(node);
  }

  /* ------------------------------------------------------------------ */
  /* the page, as words                                                  */
  /* ------------------------------------------------------------------ */

  /* Everything the page puts into words, worked out from a plain description
     of the state rather than from the DOM. Two things use it: the page itself,
     and the recording list. That is the point - a list built beside the engine
     is a list of the lines someone remembered, and this one cannot drift,
     because the words a child hears and the words Codex is asked to record
     come out of the same call.

     `actionsFor` is the same list of controls renderActions builds, in the
     same order. It is kept beside it rather than inside it because the row of
     buttons must never be rebuilt while a finger is on one; an author check
     presses through every state and compares the two, so they cannot drift
     apart quietly. */

  /* Controls that name a way through the interface rather than a part of the
     story. They are shown and never spoken: "Back" and "Read on" are not the
     book talking. */
  const CHROME = ["Back", "Back to the library", "Read on", "Open the story",
    "Read with me", "Let's try moving the puppet", "Back to the stage"];

  /* The cover's one way in, the same in every book: one clear action under the
     cover picture that goes in AND starts reading.

     While there is no recording it says what it really does instead. A button
     labelled "Read with me" on a book with no voice would be the one kind of
     dishonesty this sample has been careful to avoid everywhere else, and the
     label follows the recordings rather than the other way round. */
  const startLabel = () => ((NAR && NAR.READY) ? NAR.TEXT.start : "Open the story");
  const labelFor = (node) => (node.id === START && node.next
    ? startLabel()
    : (node.next ? node.next.label : ""));

  function actionsFor(view) {
    const node = NODES[view.nodeId];
    const state = view.state;
    if (!node) return [];
    const out = [];
    const add = (key, label) => out.push({ key, label });

    if (view.confirmingRestart) {
      add("yes", "Yes, start another rehearsal");
      add("no", "No, keep this one");
      return out;
    }
    if (view.changingTo) {
      add("change-yes", "Change our play");
      add("change-no", "Keep this play");
      return out;
    }
    if (node.rehearsing) {
      add("lamp", "Move nearer the lamp");
      add("screen", "Move nearer the screen");
      add("watch", "Watch Bunny try");
      if (node.doorway) add("compare", "Compare these heights");
      else add("why", "Show me why");
      add("play", "Use this shadow in our play");
      add("pause", "Leave it for another afternoon");
    }
    if (node.comparing && view.card) {
      if (!view.checked && (view.helped || 0) < 2) add("help", "Help me compare");
      if (!view.checked) add("check", "Let's check");
      add("toB3", "Now let's find a place");
    }
    (node.choices || []).forEach((choice, i) => add(`choice-${i}`, choice.label));
    if (node.skip) add("skip", node.skip.label);
    if (node.next) add("next", labelFor(node));
    if (node.ending) {
      add("restart", "Try another version of the play");
      add("out", "Back to the library");
    }
    if ((view.pathLength || 1) > 1) add("back", "Back");
    return out;
  }

  function describePage(view) {
    const node = NODES[view.nodeId];
    if (!node) return null;
    const state = view.state;
    const moving = Boolean(view.moving);
    const shows = node.stage && node.stage !== "none";
    const card = node.comparing ? view.card || null : null;
    const past = state.compared;
    const stale = Boolean(past && (!card || past.mark !== card.mark));

    const page = {
      id: node.id,
      heading: node.heading(state),
      caption: shows
        ? (moving ? movingCaption(node) : (node.caption ? node.caption(state) : ""))
        : (node.scene ? node.scene.caption : ""),
      lines: moving
        ? [M.MOVING_LINE]
        : (node.lines ? node.lines(state, view.lastMove || null).slice() : []),
      /* Two word meanings are a folded aside, not part of the telling. They
         are their own segment, so they are read when the child opens the fold
         and never as part of the page - which is the gate, rather than a
         second flag saying the same thing. */
      words: node.words ? node.words.slice() : [],
      readout: [],
      note: "",
      compare: null,
      earlier: node.doorway && stale ? M.comparedEarlier(past) : "",
      later: node.note || "",
      confirm: view.confirmingRestart
        ? RESTART
        : (view.changingTo ? M.CHANGE_PLAY : ""),
      actions: []
    };

    if (shows) {
      const said = readoutFor(node, state, moving);
      page.readout = [said.puppet, said.mark, said.shadow, said.flower];
      page.note = promptFor(node, state, moving);
    }
    if (node.guides) page.note = M.GUIDE_LABEL;

    if (card) {
      const help = [];
      if ((view.helped || 0) >= 1) M.compareHelp(card).forEach((one) => help.push(one));
      if ((view.helped || 0) >= 2 || view.checked) {
        M.compareShown(card).forEach((one) => help.push(one));
        help.push(M.compareEquation(card));
      }
      page.compare = {
        question: card.question,
        options: card.options.map((one) => M.cm(one)),
        said: M.compareSaid(card, view.said === undefined ? null : view.said),
        help,
        found: view.checked ? M.compareFound(card, view.said === undefined ? null : view.said) : ""
      };
    }

    /* the controls, with the ones that only name a way through the interface
       left out of what is said */
    page.actions = actionsFor(view)
      .filter((one) => CHROME.indexOf(one.label) === -1)
      .map((one) => one.label);
    return page;
  }

  /* The state the page is in, as the plain object describePage reads. */
  const currentView = () => ({
    nodeId: preview.node,
    state: viewState(),
    lastMove: preview.lastMove,
    moving: isMoving(),
    card: preview.card,
    said: preview.said,
    helped: preview.helped,
    checked: preview.checked,
    confirmingRestart: preview.confirmingRestart,
    changingTo: preview.changingTo,
    pathLength: preview.path.length
  });

  /* ------------------------------------------------------------------ */
  /* being read to                                                       */
  /* ------------------------------------------------------------------ */

  /* The module that orders the words has existed for a while; nothing called
     it. A catalogue nobody plays is a list of recordings nobody can hear, so
     this is the part that actually asks for them.

     Four rules hold it together.

       ONE SEGMENT AT A TIME. The voice reads as far as the next decision and
       stops there. When the child acts, what they did is read - and only that
       - in place of what came before. Listen again repeats the segment they
       are in, never a page that would read out the answer to a question they
       are still thinking about.

       ONE READING AT A TIME, BELONGING TO ONE DRAWING. Every request takes a
       newer turn, and a reading that outlives the page it started on reports
       nothing and changes nothing. Turning the page, going back, changing
       route, starting again, opening a confirmation, taking hold of the
       holder, hiding the tab and leaving the page all stop it.

       STOP MEANS STOP. Not "until the next page": pressing Stop puts the book
       back to quiet and keeps it quiet through every later page turn until
       Listen is deliberately pressed again.

       READY is enabled only after the complete original-voice bank is
       verified. Without it, the book stays readable and shows no dead control. */
  const Sound = window.YoyoSound && window.YoyoSound.createSound
    ? window.YoyoSound.createSound({ Audio: window.Audio })
    : null;

  const reader = NAR && NAR.createReader
    ? NAR.createReader({ sound: Sound, onChange: () => paintAudio() })
    : null;
  /* which drawing of the page the running reading belongs to */
  let readingView = -1;
  /* the lines of the segment being read, so the page can mark where it is */
  let readingLines = [];

  const canListen = () => Boolean(reader && Sound && NAR && NAR.READY);
  const alive = (view) => () => preview.view === view && readingView === view;

  /* Let go of the voice without changing anything the child has done. */
  function hushAudio() {
    if (!reader) return;
    readingView = -1;
    readingLines = [];
    reader.stop();
  }

  /* Read one segment of the page as it stands now. */
  function speak(segment) {
    if (!reader || !canListen()) return;
    const page = describePage(currentView());
    const lines = NAR.linesOfSegment(page, segment);
    preview.segment = segment;
    readingLines = lines;
    if (!lines.length) { hushAudio(); paintAudio(); return; }
    readingView = preview.view;
    reader.read(lines, 0, alive(preview.view));
  }

  /* What the child did, said back to them - but only while they are being
     read to. Acting on a quiet book does not start the voice. */
  function speakIfListening(segment) {
    if (!preview.listening || !canListen()) { preview.segment = segment; return; }
    speak(segment);
  }

  /* Some things the child does change enough of the page to need drawing
     again - asking for help, choosing a number, checking. Those must NOT
     start the page's opening over: the page is drawn again, and then the one
     new thing is read. This is how a redraw is told which segment it is. */
  let pendingSegment = null;
  function renderSaying(segment) {
    pendingSegment = segment;
    render();
  }

  /* What this sample is still short of, in one sentence, from the real state
     of the two things it can be short of. */
  function previewNotice(ready) {
    const waiting = [];
    if (Story.MISSING && Story.MISSING.length) waiting.push("some pages are not painted yet");
    if (!ready) waiting.push("new narration is not recorded yet");
    if (!waiting.length) return "Story preview. Read together.";
    const said = waiting.join(", and ");
    return `Story preview. ${said.charAt(0).toUpperCase()}${said.slice(1)}. Read together.`;
  }

  function paintAudio() {
    const audio = $("#beatAudio");
    const listen = $("#listenBtn");
    const status = $("#audioStatus");
    const tag = $("#previewTag");
    if (!audio || !listen || !status) return;

    const ready = canListen();
    const showControl = ready && preview.node !== START;
    audio.hidden = !showControl;
    listen.hidden = !showControl;
    /* The notice says what is really still missing, worked out from the
       delivery list rather than written out by hand, so it cannot go on
       claiming unpainted pages after they have been painted. */
    if (tag) tag.textContent = previewNotice(ready);
    if (!ready) { status.textContent = NAR.TEXT.idle; markSpeaking(); return; }

    if (reader.heard > 0 && readingView === preview.view) preview.heard.add(preview.node);
    const again = preview.heard.has(preview.node);
    listen.textContent = reader.playing
      ? NAR.TEXT.stop
      : (again ? NAR.TEXT.listen : NAR.TEXT.listenFirst);
    listen.setAttribute("aria-label", listen.textContent);
    listen.setAttribute("aria-pressed", reader.playing ? "true" : "false");
    status.textContent = readingView === preview.view ? reader.status : NAR.TEXT.idle;
    markSpeaking();
  }

  /* Where the voice is, as a soft tint on the words being said and nothing
     else: no size change, no scrolling, no fade. Exactly one part carries it,
     and when nothing is being said nothing carries it. */
  function markSpeaking() {
    if (typeof document === "undefined" || !document.querySelectorAll) return;
    const saying = reader && reader.playing && readingView === preview.view
      ? readingLines[reader.index]
      : null;
    let lit = null;
    if (saying) {
      const among = document.querySelectorAll(".beat-line, .word-note, .compare-step");
      lit = Array.from(among).find((node) => (node.textContent || "").trim() === saying) || null;
    }
    document.querySelectorAll(".reader-speaking").forEach((node) => {
      if (node !== lit) node.classList.remove("reader-speaking");
    });
    if (lit && lit.classList) lit.classList.add("reader-speaking");
  }

  function bindAudio() {
    const listen = $("#listenBtn");
    if (!listen || listen._bound || !listen.addEventListener) return;
    listen._bound = true;
    listen.addEventListener("click", () => {
      /* While there is nothing recorded the control is not on screen at all,
         and it does nothing if it is reached any other way: it must never put
         the book into a state where it believes it is reading. */
      if (!canListen()) return;
      if (reader && reader.playing) {
        /* Stop, and stay stopped: later pages do not start talking again. */
        preview.listening = false;
        hushAudio();
        paintAudio();
        return;
      }
      preview.listening = true;
      /* Listen again repeats the segment the child is in. */
      speak(preview.segment || "opening");
    });
  }

  /* What a move changes about the controls: which directions are possible.
     Nothing is added, removed or replaced, so every button the child can see
     stays exactly where it was and keeps working. */
  function updateActions(node) {
    if (!node.rehearsing) return;
    const at = (key) => (live.find((one) => one.key === key) || {}).node;
    const lamp = at("lamp");
    const screen = at("screen");
    const watch = at("watch");

    /* Switching off the control that currently has the keyboard would drop
       the focus onto the page body - the same "where was I?" as a button that
       disappears from under a finger. So when a control is being closed while
       it holds the keyboard, the keyboard is handed to the direction that is
       still possible, and the child carries on from there. */
    const shut = (button, closed, instead) => {
      if (!button) return;
      const held = typeof document !== "undefined" && document.activeElement === button;
      if (closed && held && instead && !instead.disabled && typeof instead.focus === "function") {
        instead.focus();
      }
      button.disabled = closed;
    };
    const noLamp = M.nearerLamp(preview.state.mark) === null;
    const noScreen = M.nearerScreen(preview.state.mark) === null;
    shut(lamp, noLamp, screen);
    shut(screen, noScreen, lamp);
    /* Bunny can only demonstrate a move towards the lamp */
    shut(watch, noLamp, screen);
  }

  /* Everything that changes when the puppet moves, and nothing that does not:
     the page keeps its view, so the controls already on screen stay alive. */
  function refresh() {
    const node = NODES[preview.node];
    renderStage(node);
    renderReadout(node);
    renderWords(node);
    renderCompare(node);
    updateSlide();
    updateActions(node);
    /* last, once the words for this move are really on the page: the page may
       get taller from here, but it may not get shorter than the child is
       already reading it at */
    holdHeight(node);
    /* the control and the tint follow what is on the page; starting a new
       segment is the job of whatever the child just did, not of redrawing */
    paintAudio();
  }

  function renderWords(node) {
    /* The one route that is written but not built. It is a sentence rather
       than a button: a third choice leading to one of the other two would be
       a promise this book cannot keep. */
    const later = $("#laterNote");
    if (later) {
      later.textContent = node.note || "";
      later.hidden = !later.textContent;
    }
    /* Two words, offered and never asked about, folded with the other
       secondary things so that nothing on the page is a test. */
    const words = $("#wordNotes");
    const list = $("#wordList");
    if (words && list) {
      list.innerHTML = "";
      words.hidden = !node.words;
      (node.words || []).forEach((one) => list.append(el("p", "word-note reader-prose", one)));
      /* An explanation is read when it has been asked for, and not before.
         Opening the fold is the asking. */
      if (!words._bound && words.addEventListener) {
        words._bound = true;
        words.addEventListener("toggle", () => {
          if (words.open) speakIfListening("words");
        });
      }
    }

    const text = $("#beatText");
    text.innerHTML = "";
    /* The sentence about the last move describes a move the hand is in the
       middle of undoing, so it is put away until the holder is let go. */
    const lines = isMoving()
      ? [M.MOVING_LINE]
      : (node.lines ? node.lines(preview.state, preview.lastMove) : []);
    lines.forEach((line) => text.append(el("p", "beat-line", line)));
  }

  /* ------------------------------------------------------------------ */
  /* the optional comparison                                             */
  /* ------------------------------------------------------------------ */

  /* Two heights that are both already known, and the difference between them.
     Nothing here moves the puppet, changes a real height or decides whether
     the child may read on: it is a thing they can do, in the middle of a
     rehearsal, because they wanted to know.

     Four rules hold it together:

       the numbers are known    both heights are on the page from the start,
                                and the difference is not
       nothing is a gate        a wrong number, or no number at all, still
                                checks and still reads on
       help is asked for        the sum, and then the whole way, appear only
                                when they have been asked for
       it says which way round  a shadow shorter than the doorway is SHORTER;
                                the question, the sum and the three numbers
                                all change with it */
  function renderCompare(node) {
    const panel = $("#compare");
    if (!panel) return;
    const on = Boolean(node.comparing && preview.card);
    panel.hidden = !on;

    /* A comparison that was checked before the puppet moved is something that
       happened earlier, and says so. It is never quietly turned into a new
       question about numbers nobody compared. */
    const earlier = $("#compareEarlier");
    const past = preview.state && preview.state.compared;
    const stale = Boolean(past && (!preview.card || past.mark !== preview.card.mark));
    if (earlier) {
      earlier.textContent = node.doorway && stale ? M.comparedEarlier(past) : "";
      earlier.hidden = !earlier.textContent;
    }
    if (!on) return;

    const card = preview.card;
    $("#compareQuestion").textContent = card.question;

    /* Three numbers, in the arrangement this reading gives them. None is
       marked, none is preselected, and choosing one changes nothing but what
       the page says the child thought. */
    const choices = $("#compareChoices");
    choices.innerHTML = "";
    card.options.forEach((value, i) => {
      const b = el("button", "btn btn-secondary compare-choice", M.cm(value));
      b.type = "button";
      b.dataset.value = String(value);
      b.setAttribute("aria-pressed", preview.said === value ? "true" : "false");
      b.classList.toggle("is-chosen", preview.said === value);
      /* changeable right up until it is checked, and never after: what was
         checked is what was checked */
      b.disabled = preview.checked;
      b.addEventListener("click", guarded(() => {
        if (preview.checked) return;
        preview.said = value;
        /* what the child chose, read back - not the whole question again */
        renderSaying("said");
      }));
      choices.append(b);
      if (i < card.options.length) live.push({ key: `compare-${i}`, node: b });
    });

    $("#compareSaid").textContent = M.compareSaid(card, preview.said);

    /* Asked for once: the sum. Asked for again, or checked: the whole way. */
    const help = $("#compareHelp");
    help.innerHTML = "";
    const steps = [];
    if (preview.helped >= 1) M.compareHelp(card).forEach((line) => steps.push(line));
    if (preview.helped >= 2 || preview.checked) {
      M.compareShown(card).forEach((line) => steps.push(line));
      steps.push(M.compareEquation(card));
    }
    steps.forEach((line) => help.append(el("p", "compare-step reader-prose", line)));
    help.hidden = steps.length === 0;

    const found = $("#compareFound");
    found.textContent = preview.checked ? M.compareFound(card, preview.said) : "";
    found.hidden = !found.textContent;
  }

  /* The strip, built once for a drawing of the page: the rail, the three
     marks and the holder. The holder itself is in the page's own markup and is
     never replaced - only moved - so a pointer capture on it survives every
     move, every refresh and every rebuild of the rail beside it. */
  function renderSlide(node) {
    const track = $("#slideTrack");
    const rail = $("#slideRail");
    const grip = $("#slideGrip");
    if (!track || !rail || !grip) return;
    track.hidden = !node.rehearsing;
    if (!node.rehearsing) return;

    $("#slideTitle").textContent = M.SLIDE_TITLE;
    $("#slideScale").textContent = M.SLIDE_SCALE;
    grip.setAttribute("aria-label", M.SLIDE_GRIP_LABEL);
    grip.setAttribute("aria-valuemin", M.numeralFor(M.TRACK_NEAR));
    grip.setAttribute("aria-valuemax", M.numeralFor(M.TRACK_FAR));
    grip.innerHTML = Art.gripSvg(M);

    rail.innerHTML = "";
    rail.append(el("div", "rail-bar"));
    Art.slideMarks(M).forEach((one) => {
      const at = el("div", "rail-mark");
      at.dataset.mark = M.numeralFor(one.mark);
      at.style.left = `${one.percent}%`;
      at.append(el("div", "rail-tick"));
      at.append(el("div", "rail-number", M.numeralFor(one.mark)));
      rail.append(at);
    });
    updateSlide();
  }

  /* Where the holder is, and nothing else. Called on every frame of a slide,
     so it moves one element and touches no other. */
  function updateSlide() {
    const node = NODES[preview.node];
    const grip = $("#slideGrip");
    if (!grip || !node || !node.rehearsing) return;
    const moving = isMoving();
    const at = moving ? preview.dragD : preview.state.mark;
    grip.style.left = `${(Art.slideFraction(M, at) * 100).toFixed(2)}%`;
    /* The position is announced when the holder is PUT DOWN, not on every
       pixel of the slide: a running commentary of fractions is not something
       anyone should have read out to them. */
    if (!moving) {
      grip.setAttribute("aria-valuenow", M.numeralFor(preview.state.mark));
      grip.setAttribute("aria-valuetext", M.slideValueText(preview.state.mark));
    }
    const rail = $("#slideRail");
    if (!rail || !rail.querySelectorAll) return;
    rail.querySelectorAll(".rail-mark").forEach((one) => {
      one.classList.toggle("is-here",
        !moving && Number(one.dataset.mark) === preview.state.mark);
    });
  }

  /* ------------------------------------------------------------------ */
  /* which comes first: the story, or what to do next                    */
  /* ------------------------------------------------------------------ */

  /* A2 is the one page whose words change under the child's hand: what the
     friends say about the move that just happened is longer or shorter than
     what they said about the last one. There, and only there, the controls
     stay ABOVE the words, so a sentence that changes length cannot move a
     button that is already being reached for.

     Every other page is told, not worked. Nothing on it changes while it is
     being read, so it takes the ordinary order: the story, and then the way
     on from it. A choice standing above the paragraph that gives it a meaning
     is a choice offered before the reason for it - which is what the phone
     screenshot of C4 showed, and what E1, C1 and the watching pages did too.

     The elements themselves are moved rather than their painted positions, so
     what the eye sees, what a screen reader reads out and where the Tab key
     goes next are one order rather than three. This runs only when the page is
     drawn, never on a move, so it can never disturb a control the child is in
     the middle of using. */
  function orderMain(node) {
    const actions = $("#beatActions");
    const text = $("#beatText");
    if (!actions || !text) return;
    const parent = text.parentElement;
    if (!parent || actions.parentElement !== parent || !parent.children) return;
    const kids = parent.children;
    const at = (one) => Array.prototype.indexOf.call(kids, one);
    const here = at(actions);
    const words = at(text);
    if (here < 0 || words < 0) return;
    if (node && node.rehearsing) {
      /* back to its place directly above the changing words */
      if (here > words && parent.insertBefore) parent.insertBefore(actions, text);
    } else if (here < words && parent.append) {
      /* after the story, and after the folded aside that belongs to it */
      parent.append(actions);
    }

    /* The restart warning is answered by the two buttons under it, so it
       travels with them rather than staying at the top of a page whose way on
       is now at the bottom. */
    const note = $("#restartNote");
    if (!note || note.parentElement !== parent || !parent.insertBefore) return;
    if (at(note) + 1 !== at(actions)) parent.insertBefore(note, actions);
  }

  /* ------------------------------------------------------------------ */
  /* keeping the page as tall as it has needed to be                     */
  /* ------------------------------------------------------------------ */

  /* A shorter sentence made the whole page shorter, and a shorter page pulled
     the scroll back with it.

     Independently observed at 820 and 1280 px while reading with the page
     scrolled near its end: moving from 15 to 20 cm produced a shorter
     description of what had happened, the document became shorter than the
     place it was being read from, and the browser clamped the scroll - 1249 to
     1193, and 768 to 731. Every control rode up the screen with it, so a
     second press at the same real place on the glass landed on nothing and the
     puppet stayed at 20 instead of going on to 30.

     Keeping the buttons above the words was not enough, because this does not
     move the buttons within the page: it moves the page underneath them. So
     while the rehearsal is on screen the page never becomes shorter than it
     has already been. The floor is this page's own tallest state during this
     one visit - not a guessed padding, not a height given to any other page,
     and not carried into the next drawing of it, where a different route and a
     different width need a different amount of room. Growing is left alone: a
     page that gets taller moves nothing that is already on screen. */
  const held = { view: -1, height: 0 };

  function holdHeight(node) {
    const main = $("#beat");
    if (!main || !main.style) return;
    if (!node || !node.rehearsing) {
      held.view = -1;
      held.height = 0;
      main.style.minHeight = "";
      return;
    }
    if (held.view !== preview.view) {
      held.view = preview.view;
      held.height = 0;
      main.style.minHeight = "";
    }
    /* A slide only ever shortens what is on the page - the position, the
       description of the last move and the two readings that are about to be
       out of date are all put away while a hand is on the holder - so the
       floor the settled page already set covers every frame of it, and no
       measurement is taken on a frame the hand is waiting for. */
    if (!isMoving()) {
      /* min-height permits growth. Keep the existing floor during measurement:
         clearing it forces layout and can clamp scroll before it is restored. */
      const rect = typeof main.getBoundingClientRect === "function"
        ? main.getBoundingClientRect()
        : null;
      const natural = rect && typeof rect.height === "number" ? rect.height : 0;
      if (natural > held.height) held.height = natural;
    }
    main.style.minHeight = held.height > 0 ? `${held.height.toFixed(2)}px` : "";
  }

  function render() {
    const node = NODES[preview.node];
    /* Turning the page with a hand still on the holder abandons that slide.
       An unfinished move is not a move: the rehearsal keeps the place it was
       actually left at. */
    abandonDrag();
    /* A full draw of the page. Everything below belongs to this view;
       everything from the previous one stops working here. */
    preview.view += 1;
    $("#beatHeading").textContent = node.heading(preview.state);
    $("#sideTitle").textContent = M.SIDE_VIEW_TITLE;
    /* how far this reading has actually come. There is no total: this sample
       is one route out of three, and promising a length would promise a book
       that is not made yet. */
    $("#beatProgress").textContent = `Part ${preview.path.length} of this sample`;

    const restart = $("#restartNote");
    restart.textContent = preview.confirmingRestart
      ? RESTART
      : (preview.changingTo ? M.CHANGE_PLAY : "");
    restart.hidden = !restart.textContent;

    /* the story first, or the controls first, according to which kind of page
       this is - before anything is put into either of them */
    orderMain(node);

    renderScene(node);
    renderThen(node);
    renderStage(node);
    renderReadout(node);
    renderWords(node);
    renderSlide(node);
    renderActions(node);
    /* after the controls, because the three numbers are controls too and join
       the same live list */
    renderCompare(node);
    /* a new drawing of the page starts the reservation again from what this
       page, at this width, actually needs */
    holdHeight(node);

    /* A new drawing of the page is a new page as far as the voice is
       concerned: whatever was being read belonged to the one before it. Once
       the child has asked to be read to, the new page reads its opening and
       stops at whatever it is waiting for. */
    hushAudio();
    bindAudio();
    const segment = pendingSegment || "opening";
    pendingSegment = null;
    preview.segment = segment;
    paintAudio();
    if (preview.listening) speak(segment);
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindGrip();
    startReading();
    if (window.addEventListener) window.addEventListener("resize", () => {
      placeScreen();
      /* Another width wraps the words differently, so the room the page needs
         is worked out again from this width rather than kept from one the page
         is no longer being read at. */
      held.view = -1;
      holdHeight(NODES[preview.node]);
    });
  });

  /* Escape lets go without moving anything, wherever the keyboard happens to
     be at the time. */
  document.addEventListener("keydown", (event) => {
    if (drag.on && event && event.key === "Escape") dragEnd(null, false);
  });

  /* The tab going away is not a decision about where the puppet stands. */
  document.addEventListener("visibilitychange", () => {
    if (drag.on && document.hidden) dragEnd(null, false);
    /* the tab going away is not a request to keep talking */
    if (document.hidden) { hushAudio(); paintAudio(); }
  });
  if (typeof window !== "undefined" && window.addEventListener) {
    window.addEventListener("pagehide", () => hushAudio());
  }

  /* The runtime the recording list is produced from: the real node table, the
     real model and the real description the page is drawn from, so the list
     Codex is asked to record is the list this sample can actually ask for. */
  const NARRATION_RUNTIME = { M, NODES, describe: describePage, Story };
  /* Where the recordings switch on: READY in shadow-narration.js. Nothing
     else gates it, and nothing here fakes it. */
  const activation = () => ({
    file: "shadow-narration.js", flag: "READY", ready: Boolean(NAR && NAR.READY),
    player: Boolean(reader), sound: Boolean(Sound), control: "#listenBtn",
    segments: NAR ? NAR.SEGMENTS.slice() : []
  });
  window.__shadowNarration = {
    runtime: NARRATION_RUNTIME,
    catalogue: () => (NAR ? NAR.catalogue(NARRATION_RUNTIME) : []),
    describePage, currentView, actionsFor, CHROME, activation,
    READY: () => Boolean(NAR && NAR.READY),
    segmentsOf: () => NAR.segmentsOf(describePage(currentView()))
  };

  /* Read by the tests, to drive the same engine the child uses. */
  window.__shadowPreview = {
    describePage, currentView, actionsFor, NARRATION_RUNTIME,
    reader, speak, hushAudio, canListen, paintAudio, Sound,
    preview, enter, back, moveTo, moveNearer, watchBunny, startReading,
    NODES, START, REHEARSAL_NODE, REHEARSAL_NODES, isRehearsing, ROUTE_OF, RESTART
  };
})();
