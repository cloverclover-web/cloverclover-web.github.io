/* The Shadow Theatre: the stage, and what it does.

   One lamp, one paper puppet and one screen. The lamp and the screen are
   fixed; the puppet slides between them along a track with three marked
   places. The paper keeps the height chosen for this reading (3, 4 or 5 cm)
   at every mark; the SHADOW on the screen grows and shrinks.

   The geometry, written once here so that every picture, every number and
   every sentence comes from the same place:

     H = h * D / d

   h is the puppet's own height, D the lamp-to-screen distance, d the
   lamp-to-puppet distance, H the shadow's height on the screen. It follows
   from similar triangles for a point lamp, a flat puppet held parallel to the
   screen, and - this part matters for the drawing as well as the sum - a lamp
   whose centre sits on the same line as the puppet's feet.

   That last condition is not decoration. For a lamp at height y above the
   floor, a point of the puppet at height y0 lands on the screen at

     y_screen = y + (y0 - y) * D / d

   Put the puppet's feet at y0 = 0 and the shadow's feet stay on the floor
   line for every d only when y = 0. If the lamp were drawn higher than the
   puppet's feet, the shadow's feet would move vertically as the puppet moved:
   nearer the lamp shifts them down, nearer the screen shifts them up. A fixed
   ground line would then be false. So the lamp's centre, the
   puppet's feet, the scenery's bottom edge and the shadow's feet are all one
   line, in the model and in the artwork.

   This is a bounded stage model, not a claim about any room: a point lamp, no
   penumbra, no scattering, and a puppet that only slides. A real lamp has a
   soft edge. Nothing here says that moving closer makes anything bigger in
   general; it says what this theatre does.

   Nothing in this file draws, stores, listens or fetches. It answers with a
   new rehearsal rather than editing the old one, so a test can hold both. */

(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.YoyoShadow = api;
})(typeof self !== "undefined" ? self : (typeof globalThis !== "undefined" ? globalThis : null), function () {
  "use strict";

  const numeralFor = (n) => String(n);
  const cm = (n) => `${numeralFor(n)} cm`;

  /* ------------------------------------------------------------------ */
  /* the theatre                                                         */
  /* ------------------------------------------------------------------ */

  /* Lamp to screen, in centimetres. Fixed for the whole story: changing the
     scenery never moves the lamp or the screen. */
  const LAMP_TO_SCREEN = 60;

  /* The three marked places on the puppet's track, measured from the lamp.
     Nearest the lamp first, so "nearer the lamp" means a smaller number. */
  const MARKS = [15, 20, 30];
  const START_MARK = 20;

  /* Six reviewed sets of prop sizes. One reading uses one set: the puppet,
     the sunflower picture and the doorway picture all belong to the same
     afternoon. Every shadow height these produce is a whole number of
     centimetres and never more than 20, so nothing the child reads is a
     fraction or beyond the numbers this book uses. */
  const CONFIGS = [
    { id: 0, puppet: 3, sunflower: 10, doorway: 7, doorWidth: 6 },
    { id: 1, puppet: 3, sunflower: 11, doorway: 8, doorWidth: 6 },
    { id: 2, puppet: 4, sunflower: 13, doorway: 9, doorWidth: 8 },
    { id: 3, puppet: 4, sunflower: 14, doorway: 10, doorWidth: 8 },
    { id: 4, puppet: 5, sunflower: 16, doorway: 11, doorWidth: 10 },
    { id: 5, puppet: 5, sunflower: 17, doorway: 12, doorWidth: 10 }
  ].map(Object.freeze);
  /* the set the reviewed script is written around */
  const DEFAULT_CONFIG = 3;

  /* The puppet's outline is no wider than half its height. The shadow's width
     grows in exactly the same proportion as its height, which is what makes
     "it is short enough" and "it is narrow enough" two different questions. */
  const puppetWidth = (config) => config.puppet / 2;

  const shadowHeight = (config, mark) => (config.puppet * LAMP_TO_SCREEN) / mark;
  const shadowWidth = (config, mark) => (puppetWidth(config) * LAMP_TO_SCREEN) / mark;

  const tallerThanFlower = (config, mark) => shadowHeight(config, mark) > config.sunflower;
  /* Kept for the doorway rehearsal, which is written but NOT playable in this
     sample: a shadow gets through only if it is both short enough and narrow
     enough. Nothing on the sample page calls it. */
  const fitsDoorway = (config, mark) =>
    shadowHeight(config, mark) <= config.doorway && shadowWidth(config, mark) <= config.doorWidth;

  /* ------------------------------------------------------------------ */
  /* the track, as a continuous thing                                    */
  /* ------------------------------------------------------------------ */

  /* The marks are where the puppet can be left standing. The track itself is
     continuous: a hand sliding the holder passes through every distance
     between the nearest and the furthest mark, and the shadow follows it the
     whole way, from the same H = h * D / d. There is no interpolation between
     the marks anywhere in this file - a straight line drawn between the height
     at 15 and the height at 30 would be wrong everywhere in between, because
     H is proportional to 1/d, not to d. */
  const TRACK_NEAR = MARKS[0];
  const TRACK_FAR = MARKS[MARKS.length - 1];

  function clampToTrack(d) {
    const at = Number(d);
    if (!Number.isFinite(at)) return START_MARK;
    if (at < TRACK_NEAR) return TRACK_NEAR;
    if (at > TRACK_FAR) return TRACK_FAR;
    return at;
  }

  /* Where the holder settles when it is let go: the nearest mark.

     Exactly halfway between two marks the puppet settles on the mark nearer
     the SCREEN. The rule is fixed, is the same for all six sets of props, and
     has nothing to do with which mark happens to make the shadow taller than
     the sunflower - settling is where the holder stopped, not a verdict on the
     rehearsal. */
  function snapToMark(d) {
    const at = clampToTrack(d);
    let best = MARKS[0];
    MARKS.forEach((mark) => {
      const gap = Math.abs(mark - at);
      const bestGap = Math.abs(best - at);
      /* ">" not ">=": on an exact tie the later mark - the one nearer the
         screen - wins, because MARKS runs from the lamp outwards */
      if (gap < bestGap || (gap === bestGap && mark > best)) best = mark;
    });
    return best;
  }

  const nearerLamp = (mark) => {
    const at = MARKS.indexOf(mark);
    return at > 0 ? MARKS[at - 1] : null;
  };
  const nearerScreen = (mark) => {
    const at = MARKS.indexOf(mark);
    return at !== -1 && at < MARKS.length - 1 ? MARKS[at + 1] : null;
  };

  const sameConfig = (a, b) => Boolean(a) && Boolean(b) && a.id === b.id;

  /* A new rehearsal uses a different set of props from the one just read. */
  function chooseConfig(previous, pick) {
    const fresh = CONFIGS.filter((config) => !sameConfig(config, previous));
    const choices = fresh.length ? fresh : CONFIGS.slice();
    const roll = typeof pick === "function"
      ? pick(choices.length)
      : Math.floor(Math.random() * choices.length);
    const index = Math.min(Math.max(Math.floor(roll) || 0, 0), choices.length - 1);
    return choices[index];
  }

  /* ------------------------------------------------------------------ */
  /* one rehearsal                                                       */
  /* ------------------------------------------------------------------ */

  const freeze = (state) => {
    Object.freeze(state.seen);
    Object.freeze(state.movedByChild);
    return Object.freeze(state);
  };

  function createRehearsal(config, spin) {
    return freeze({
      config,
      mark: START_MARK,
      /* which scenery is in the frame. It is a fact about the stage, not about
         the child: reading on to the doorway changes it, and coming back does
         not put the sunflower back by itself. */
      scenery: "sunflower",
      /* Which of the three plays was really put on. `performed` says that one
         was; this says which, so the ending can name it truthfully instead of
         guessing from where the puppet happens to be standing. */
      play: null,
      /* A comparison the child has actually checked, kept exactly as it was
         when they checked it: the two heights, the difference and which way
         round it was. Moving the puppet afterwards does not rewrite it into a
         sum nobody did - it becomes something that happened earlier in the
         rehearsal. */
      compared: null,
      /* Which way the three numbers are arranged. It turns with the reading,
         so a child who reads twice does not meet the same arrangement, and it
         does not move within one reading - not on Back, not after help, not
         after checking. */
      spin: ((Math.floor(Number(spin)) || 0) % 3 + 3) % 3,
      /* every place this rehearsal has really had the puppet, in order: a
         diagram may only draw a position that was actually tried */
      seen: [START_MARK],
      /* the moves the child made themselves, so a demonstration is never
         reported as their own work */
      movedByChild: [],
      lastMover: null,
      /* whether the friends have performed with the current shadow */
      performed: false,
      /* whether they watched the quiet garden story instead. It is kept apart
         from `performed` because they are different afternoons: one moved the
         puppet and put on the shadow it made, the other left it where it was
         and simply listened. The ending has to be able to tell them apart. */
      watched: false
    });
  }

  /* Move the puppet to one of the marked places. An unmarked place, or the
     place it is already at, changes nothing at all - which is what makes a
     second tap on the same mark harmless. */
  function moveTo(state, mark, mover) {
    if (MARKS.indexOf(mark) === -1) return { state, moved: false, from: state.mark, to: state.mark };
    if (mark === state.mark) return { state, moved: false, from: state.mark, to: state.mark };
    const byChild = mover !== "bunny";
    return {
      state: freeze({
        config: state.config,
        mark,
        scenery: state.scenery,
        play: state.play,
        /* A checked comparison is a thing that happened. Moving the puppet
           does not turn it into a different sum; it turns it into an earlier
           one. */
        compared: state.compared,
        spin: state.spin,
        seen: state.seen.indexOf(mark) === -1 ? state.seen.concat([mark]) : state.seen,
        movedByChild: byChild ? state.movedByChild.concat([mark]) : state.movedByChild,
        lastMover: byChild ? "child" : "bunny",
        performed: state.performed,
        watched: state.watched
      }),
      moved: true,
      from: state.mark,
      to: mark
    };
  }

  /* Bunny's try. She moves one place nearer the lamp, and it is recorded as
     hers: watching a demonstration is not the same as doing it. */
  function watchBunny(state) {
    const target = nearerLamp(state.mark);
    if (target === null) return { state, moved: false, from: state.mark, to: state.mark };
    return moveTo(state, target, "bunny");
  }

  const carry = (state, changes) => freeze(Object.assign({
    config: state.config, mark: state.mark, scenery: state.scenery,
    play: state.play, compared: state.compared, spin: state.spin,
    seen: state.seen, movedByChild: state.movedByChild, lastMover: state.lastMover,
    performed: state.performed, watched: state.watched
  }, changes || {}));

  /* `which` is the play that was really put on - the garden giant, or the
     visitor at the door. It is recorded rather than worked out later from
     where the puppet is standing, because two different plays can end with the
     puppet in the same place. */
  const perform = (state, which) => carry(state, {
    performed: true,
    play: which === "door" ? "door" : "giant"
  });

  /* Changing the scenery. The puppet, the lamp, the screen, the set of props
     and everywhere the puppet has been all stay exactly as they are: this is
     the picture behind the shadow changing, not the rehearsal restarting. */
  const setScenery = (state, scenery) => carry(state, {
    scenery: scenery === "doorway" ? "doorway" : "sunflower"
  });

  /* Writing down a comparison the child really checked. */
  const keepComparison = (state, card) => carry(state, {
    compared: card ? Object.freeze({
      mark: card.mark, shadow: card.shadow, door: card.door,
      difference: card.difference, direction: card.direction,
      said: card.said === undefined ? null : card.said
    }) : null
  });

  /* Watching the quiet garden story. The puppet is not moved and nothing is
     measured, so nothing about the stage changes: only that this afternoon
     really had a story in it. */
  const watch = (state) => carry(state, { watched: true });

  /* Nothing is ever created or lost: the paper is the same paper, and the
     stage is the same stage, whatever the shadow is doing. */
  function check(state) {
    const problems = [];
    const config = state.config;
    if (MARKS.indexOf(state.mark) === -1) problems.push(`${state.mark} is not a marked place`);
    if (config.puppet !== CONFIGS[config.id].puppet) problems.push("the paper puppet changed size");
    if (!state.seen.every((mark) => MARKS.indexOf(mark) !== -1)) problems.push("an unmarked place was recorded");
    if (state.seen.indexOf(state.mark) === -1) problems.push("the current place was not recorded");
    if (!state.movedByChild.every((mark) => state.seen.indexOf(mark) !== -1)) {
      problems.push("a move was credited to the child that never happened");
    }
    const height = shadowHeight(config, state.mark);
    if (!Number.isInteger(height)) problems.push(`the shadow is ${height} cm, not a whole number`);
    if (height > 20) problems.push(`the shadow is ${height} cm, past the numbers this book uses`);
    return { ok: problems.length === 0, problems };
  }

  /* ------------------------------------------------------------------ */
  /* what the friends say                                                */
  /* ------------------------------------------------------------------ */

  /* The reviewed script gives the exact words for two moves: from the
     starting mark towards the lamp, and from the starting mark towards the
     screen. Every other move a child can really make - back again, twice in a
     row, to the same place, or Bunny's own try - needs its own truthful
     sentences, and they are written here rather than borrowed from a move
     that did not happen. */

  const GIANT_MOVE = (config) => [
    "The puppet moved nearer the lamp.",
    "Its shadow grew taller on the screen, until its head rose above the sunflower.",
    `"He's ${cm(shadowHeight(config, MARKS[0]))} tall now!" said Duck.`,
    "Bear checked the paper puppet in its holder. Nothing had been added to it.",
    "“I didn't make the paper bigger,” he said. “I changed where it stood.”",
    "“That gives us a giant for our play,” said Bunny."
  ];

  const SMALL_MOVE = (config) => [
    "The puppet moved nearer the screen, and the shadow became smaller.",
    `"Now he's ${cm(shadowHeight(config, MARKS[2]))} tall," said Duck. "That could be a little garden visitor."`,
    "“It isn't our giant effect yet,” said Bear. “Shall we try another place, or tell a different kind of garden story?”"
  ];

  const STAYED = "The puppet is still at the same mark. Its shadow has not changed.";

  /* A1, in the reviewed words, with this reading's own two heights. The
     numbers are read off the stage as it stands, not announced for a place
     the puppet has not been to. */
  /* A1, in the reviewed words, with this reading's own two heights - and with
     the height the shadow REALLY has when the page is read.

     Coming back to A1 after moving the puppet used to repeat the starting
     height while the picture and the readings beside it showed the new one.
     The stage is not put back, so the words are not either: they say what is
     on the screen now, and name the mark the puppet is standing on when it is
     no longer the one it started at. */
  const openingLines = (config, mark) => {
    const at = MARKS.indexOf(mark) === -1 ? START_MARK : mark;
    const lines = [
      "Dad put the sunflower scenery back in place.",
      "“In this play, our giant needs to be taller than the sunflower,” said Bear.",
      `The picture was ${cm(config.sunflower)} high. The visitor's shadow was `
        + `${cm(shadowHeight(config, at))} high.`
    ];
    if (at !== START_MARK) {
      lines.push(`The puppet was standing at the ${cm(at)} mark.`);
    }
    return lines.concat([
      "Bunny checked that the lamp and the screen were staying in their places.",
      "“Let's move only the puppet,” she said. “Then we can see what that changes.”",
      "“The paper stays the same,” Bear agreed."
    ]);
  };

  /* What the page is called when the friends perform. The title follows the
     version the shadow can honestly support: a play about a little visitor is
     not called The Garden Giant. */
  const GIANT_TITLE = "The Garden Giant";
  const VISITOR_TITLE = "A Little Garden Visitor";
  const playTitleFor = (state) =>
    (tallerThanFlower(state.config, state.mark) ? GIANT_TITLE : VISITOR_TITLE);

  /* What the picture beside the words is showing, said in words for the same
     reason: it changes with the stage, so it is written from the stage. */
  const sceneCaption = (state) =>
    `The sunflower scenery, and the visitor's shadow at the ${cm(state.mark)} mark.`;

  /* A3, the optional look at why. The diagram it goes with draws the two
     straight lines from the lamp past the puppet's edges; the label says what
     they are, because a line in the air is not a thing anyone can see. */
  const WHY_LINES = [
    "“Why did moving it change the shadow?” Bear asked.",
    "Bunny opened Dad's little diagram.",
    "Light spread out from the lamp. The puppet blocked some of the paths to the screen.",
    "Nearer the lamp, the same puppet blocked the paths to a larger patch of screen.",
    "“So the shadow can change even when the paper doesn't,” said Bear.",
    "“Shall we try it in our play?” asked Duck."
  ];

  const GUIDE_LABEL = "These lines help us picture the paths of light.";

  function describeMove(state, from, to, mover) {
    const config = state.config;
    if (from === to) return [STAYED];

    const grew = to < from;
    const before = shadowHeight(config, from);
    const after = shadowHeight(config, to);
    const above = after > config.sunflower;
    /* "still below" is only true if it was below a moment ago. Coming back
       down from above the flower needs its own word, or the sentence
       describes a rehearsal that did not happen. */
    const wasAbove = before > config.sunflower;

    /* the two moves the reviewed script speaks for, exactly as written */
    if (mover !== "bunny" && from === START_MARK && to === MARKS[0]) return GIANT_MOVE(config);
    if (mover !== "bunny" && from === START_MARK && to === MARKS[2]) return SMALL_MOVE(config);

    const who = mover === "bunny" ? "Bunny moved the puppet" : "The puppet moved";
    const lines = [`${who} nearer the ${grew ? "lamp" : "screen"}.`];
    lines.push(grew
      ? `Its shadow grew from ${cm(before)} to ${cm(after)} on the screen.`
      : `Its shadow shrank from ${cm(before)} to ${cm(after)} on the screen.`);
    lines.push(above
      ? `“Its head is above the sunflower now,” said Duck.`
      : (wasAbove
        ? `“Its head is below the top of the sunflower again,” said Duck.`
        : `“Its head is still below the top of the sunflower,” said Duck.`));
    if (mover === "bunny") {
      lines.push("“That was my try,” said Bunny. “You can move it wherever you like.”");
    } else {
      lines.push(`Bear looked at the paper in its holder. It was still ${cm(config.puppet)} tall.`);
    }
    return lines;
  }

  /* The performance itself, in the version the shadow on the screen can
     honestly support. Neither version is the better ending. */
  const GIANT_PLAY = [
    "The play began.",
    "A giant visitor stopped beside the garden path. He could look over the tallest sunflower.",
    "“May I come closer?” Bear asked in the visitor's voice.",
    "“Yes, but mind the little seedlings,” Bunny replied.",
    "“Then I shall stay on the path,” said the giant.",
    "Duck made a gentle breeze sound from beside the theatre.",
    "“Thank you for showing me the way,” said the giant.",
    "Dad clapped softly. Behind the screen, Bear smiled at his friends."
  ];

  const VISITOR_PLAY = [
    "“Let's keep him as a little visitor,” said Bear.",
    "In their play, the visitor stopped beside the sunflower instead of looking over it.",
    "“From down here, the petals look like a little roof,” Bear said in the visitor's voice.",
    "“Would you like to hear the garden?” asked Bunny.",
    "Duck made a gentle breeze sound.",
    "The visitor stayed beside the flowers and listened."
  ];

  const playFor = (state) => (tallerThanFlower(state.config, state.mark) ? GIANT_PLAY : VISITOR_PLAY);

  const ENDING = [
    "When they were ready to finish, Dad brought up the room lights and switched off the theatre lamp.",
    "The visitor's shadow disappeared from the screen. The paper puppet was still in its holder.",
    "Bear slipped it back inside the book.",
    "“We can keep him for another afternoon,” he said.",
    "Bunny put away the scenery. Duck helped gather the cushions.",
    "Their little visitor was ready to rest, and so were they."
  ];

  const LEFT_IT = "They decided to leave the rehearsal for another afternoon.";

  /* ------------------------------------------------------------------ */
  /* the little door                                                     */
  /* ------------------------------------------------------------------ */

  /* The third play. The doorway is a PICTURE on the flat screen, exactly
     `doorway` centimetres high and `doorWidth` across, standing on the same
     ground line as the shadow and the sunflower. Nothing about it moves, and
     nothing here ever makes it bigger: a shadow gets through by being both
     short enough and narrow enough, or it does not get through.

     Height and width are two different questions, and they have to stay two.
     The paper is never wider than half its own height, so the shadow is never
     wider than half its own height either - which means that at these six sets
     of props the height is what actually decides it. That is a fact about
     these props, not a rule, so the width is still asked, still measured, and
     still able to refuse. */

  const doorFit = (config, mark) => {
    const height = shadowHeight(config, mark);
    const width = shadowWidth(config, mark);
    return {
      height, width,
      door: config.doorway,
      doorWidth: config.doorWidth,
      shortEnough: height <= config.doorway,
      narrowEnough: width <= config.doorWidth,
      fits: height <= config.doorway && width <= config.doorWidth
    };
  };

  /* Which way round the comparison goes, said honestly. A shadow that is
     shorter than the doorway is not "less taller": it is shorter, and the
     question, the sum and the numbers all have to change with it. */
  function compareWay(config, mark) {
    const height = shadowHeight(config, mark);
    const door = config.doorway;
    if (height > door) return "taller";
    if (height < door) return "shorter";
    return "same";
  }

  /* The three numbers. The true difference is always one of them; the other
     two are the near misses a child really makes - one less, and the one you
     get by counting on past it. They are always different from each other,
     always whole and always at least 1 cm.

     `spin` turns the arrangement so that a new reading does not meet the same
     order. It belongs to the rehearsal, so within one reading it does not move
     - not on Back, not after help, not after checking. */
  function compareOptions(config, mark, spin) {
    const gap = Math.abs(shadowHeight(config, mark) - config.doorway);
    const near = gap > 1 ? gap - 1 : gap + 1;
    const far = gap + 2;
    const base = [gap, near, far];
    const turn = ((Math.floor(Number(spin)) || 0) % 3 + 3) % 3;
    return base.slice(turn).concat(base.slice(0, turn));
  }

  /* Everything the comparison is, worked out once and used by the question,
     the help, the check and the recording list alike. */
  function compareCard(config, mark, spin) {
    const shadow = shadowHeight(config, mark);
    const door = config.doorway;
    const direction = compareWay(config, mark);
    const difference = Math.abs(shadow - door);
    const known = `The shadow is ${cm(shadow)} tall. The doorway is ${cm(door)} high.`;
    const question = direction === "same"
      ? `${known} They are the same height.`
      : `${known} How much ${direction} is the shadow than the doorway?`;
    return {
      mark, shadow, door, direction, difference, question,
      options: direction === "same" ? [] : compareOptions(config, mark, spin),
      /* the bigger of the two is what the sum starts from, whichever it is */
      from: Math.max(shadow, door),
      take: Math.min(shadow, door)
    };
  }

  /* Asked for once: the sum written down, and what it is a sum OF. It does not
     work it out - that is the child's to do, or to ask for. */
  const compareHelp = (card) => [
    `${numeralFor(card.from)} - ${numeralFor(card.take)} = ?`,
    "We are comparing the 2 heights, not adding them together."
  ];

  /* Shown after the child asks for the whole way, or after they check. Not
     before: a worked answer that arrives first is not an answer anyone
     found. */
  function compareShown(card) {
    if (card.direction === "same") {
      return [
        `“${cm(card.door)} reaches the top of the doorway,” said Bunny. `
          + `“And the shadow reaches exactly the same line.”`,
        "“So they are the same height,” said Bear. “Now let's find a place where it fits.”"
      ];
    }
    const other = card.direction === "taller" ? "shadow" : "doorway";
    return [
      `“${cm(card.take)} reaches the top of the ${card.direction === "taller" ? "doorway" : "shadow"},” `
        + `said Bunny. “There are ${cm(card.difference)} more to the top of the ${other}.”`,
      `“So the shadow is ${cm(card.difference)} ${card.direction},” said Bear. `
        + "“Now let's find a place where it fits.”"
    ];
  }

  const compareEquation = (card) => (card.direction === "same"
    ? `${numeralFor(card.from)} - ${numeralFor(card.take)} = 0 cm`
    : `${numeralFor(card.from)} - ${numeralFor(card.take)} = ${cm(card.difference)}`);

  /* What the child chose, said back without a mark against it. */
  const compareSaid = (card, said) => (said === null || said === undefined
    ? ""
    : `Your idea: ${cm(said)}.`);

  /* And what the heights turned out to be, once they were compared. It says
     what is true; it does not score it. */
  function compareFound(card, said) {
    if (said === null || said === undefined) return `We compared them: ${compareEquation(card)}.`;
    return said === card.difference
      ? `You thought ${cm(said)}, and that is what we found: ${compareEquation(card)}.`
      : `You thought ${cm(said)}. We found ${cm(card.difference)}: ${compareEquation(card)}.`;
  }

  /* A comparison that was checked before the puppet moved. It is kept exactly
     as it was, and said as something that already happened. */
  const comparedEarlier = (card) =>
    `Earlier in our rehearsal: the shadow was ${cm(card.shadow)} and the doorway `
    + `${cm(card.door)}, ${card.direction === "same"
      ? "the same height" : `${cm(card.difference)} ${card.direction}`}.`;

  const DOOR_SCENERY = "Dad put the doorway scenery in place.";
  const DOOR_INVITE = "“This visitor has been invited into the garden,” said Duck. "
    + "“I'd like him to come through the little door.”";
  const DOOR_GUIDE = "Bear guided the shadow along the bottom of the screen, "
    + "stopping beside the doorway picture.";

  /* B1, said about the shadow that is really on the screen. Coming back here
     after moving the puppet must not still say the door is too small. */
  function doorLines(state) {
    const way = compareWay(state.config, state.mark);
    const opening = way === "taller"
      ? "Its head reached above the top of the opening."
      : (way === "shorter"
        ? "Its head was below the top of the doorway now."
        : "Its head reached exactly the top of the doorway.");
    const offer = way === "taller"
      ? "“We could check how much taller it is,” said Bunny. "
        + "“Or we could try moving the puppet and watch what happens.”"
      : (way === "shorter"
        ? "“We could check how much shorter it is,” said Bunny. "
          + "“Or we could try another place and watch what happens.”"
        : "“We could check the two heights,” said Bunny. "
          + "“Or we could try another place and watch what happens.”");
    return [DOOR_SCENERY, DOOR_INVITE, DOOR_GUIDE, opening, offer];
  }

  const doorCaption = (state) =>
    `The doorway scenery, and the visitor's shadow at the ${cm(state.mark)} mark.`;

  const DOOR_MEASURE = [
    "Bunny lined up the height marks with the bottom of the doorway.",
    "Bear looked from the top of the door to the top of the shadow.",
    "“Let's use the heights we already know,” he said."
  ];

  /* B3: what really happened, and what is really true now. The reviewed script
     gives the words for a move nearer the screen that ends up fitting; a move
     that does not fit gets its own honest sentences instead of borrowing
     them. */
  function doorMoveLines(state, from, to, mover) {
    const config = state.config;
    if (from === to) return [STAYED];
    const fit = doorFit(config, to);
    const who = mover === "bunny" ? "Bunny moved the puppet" : "Bear moved the puppet";
    if (to > from) {
      const said = [`${who} nearer the screen.`];
      if (fit.fits) {
        said.push("The shadow became smaller. Now its head was below the top of the doorway.");
        said.push(`“The shadow is ${cm(fit.height)} tall here,” said Bunny.`);
        said.push("Duck checked the space at the sides as well.");
        said.push("“There is room for him now.”");
        said.push("Bear looked behind the screen at the paper puppet.");
        said.push("“Same visitor,” he said. “A different place.”");
        return said;
      }
      said.push(`The shadow became smaller. It was ${cm(fit.height)} tall now.`);
      said.push(fit.shortEnough
        ? "“It is low enough, but it is still too wide for the opening,” said Duck."
        : "“Its head still reaches above the top of the doorway,” said Duck.");
      said.push("“We can try another place,” said Bunny, "
        + "“or let the visitor meet us outside.”");
      return said;
    }
    const said = ["The shadow grew taller as the puppet moved nearer the lamp."];
    if (fit.fits) {
      said.push(`“The shadow is ${cm(fit.height)} tall here, and it still fits,” said Bunny.`);
      said.push("“Same visitor,” said Bear. “A different place.”");
      return said;
    }
    said.push("“It won't fit through our pictured doorway at this size,” said Duck.");
    said.push("“We can try another place,” said Bunny, "
      + "“or let the visitor meet us outside.”");
    return said;
  }

  /* What the doorway rehearsal says before anything has been moved. */
  const doorStandLines = (state) => {
    const fit = doorFit(state.config, state.mark);
    return [fit.fits
      ? `The shadow is ${cm(fit.height)} tall, and the doorway is ${cm(fit.door)} high. `
        + "There is room for him."
      : `The shadow is ${cm(fit.height)} tall, and the doorway is ${cm(fit.door)} high.`];
  };

  const DOOR_TITLE = "A Visitor at the Door";
  const OUTSIDE_TITLE = "A Visitor Outside the Door";
  const doorTitleFor = (state) =>
    (doorFit(state.config, state.mark).fits ? DOOR_TITLE : OUTSIDE_TITLE);

  const THROUGH_PLAY = [
    "In their play, the visitor came along the garden path.",
    "“May I come in?” Bear asked in a small, polite voice.",
    "“Come through the little door,” Bunny replied.",
    "The visitor's shadow moved through the doorway picture and stopped inside the garden.",
    "“Thank you for inviting me,” said the visitor.",
    "“There's a place for you beside the flowers,” said Duck.",
    "The visitor moved along the path and stopped in his place.",
    "“Then I'll stay for a little while,” he said.",
    "Dad clapped softly as the friends brought their play to an end."
  ];

  /* Not a lesser ending, and not a failure: the visitor is invited, and the
     visit happens. Nothing here says that moving sideways could squeeze a
     shadow through an opening it does not fit. */
  const OUTSIDE_PLAY = [
    "“We'll tell this version outside,” said Bear.",
    "The visitor stopped beside the doorway. He did not pass through it.",
    "“May I visit from here?” Bear asked in the visitor's voice.",
    "“Of course,” said Bunny.",
    "“Thank you for inviting me,” said the visitor. “I can see your lovely garden from this side.”",
    "“I'm glad you came,” said Duck.",
    "Dad clapped softly as the friends brought their play to an end."
  ];

  const doorPlayFor = (state) =>
    (doorFit(state.config, state.mark).fits ? THROUGH_PLAY : OUTSIDE_PLAY);

  /* Changing to another play really does change the scenery and put the puppet
     back. It is said before it happens, and it happens only after the child
     says yes: an ordinary Back never does it. */
  const CHANGE_PLAY = "We'll change the scenery and put the puppet back at its "
    + "starting mark. The props stay the same.";

  function changePlay(state) {
    return freeze({
      config: state.config,
      mark: START_MARK,
      scenery: "sunflower",
      play: state.play,
      /* a comparison belonged to a stage that has been put away */
      compared: null,
      spin: state.spin,
      seen: [START_MARK],
      movedByChild: [],
      lastMover: null,
      performed: state.performed,
      watched: state.watched
    });
  }

  /* The extra first line belongs only to an afternoon that stopped without a
     story. Watching the garden story IS a story, so it does not get it - and
     nothing here ever says a performance happened that did not. */
  const endingFor = (state) =>
    (state.performed || state.watched ? ENDING : [LEFT_IT].concat(ENDING));

  /* Every line this sample can speak, so that the original voice can record
     them later. Nothing here is recorded yet, and this sample plays no audio
     at all rather than putting another voice in its place. */
  function enumerateTexts() {
    const lines = new Set();
    const add = (text) => { if (text) lines.add(String(text).trim()); };

    CONFIGS.forEach((config) => {
      const start = createRehearsal(config);
      add(STAYED);
      MARKS.forEach((mark) => openingLines(config, mark).forEach(add));
      MARKS.forEach((mark) => add(sceneCaption({ config, mark })));
      GIANT_MOVE(config).forEach(add);
      SMALL_MOVE(config).forEach(add);
      MARKS.forEach((from) => MARKS.forEach((to) => {
        ["child", "bunny"].forEach((mover) => {
          describeMove({ ...start, mark: from }, from, to, mover).forEach(add);
        });
      }));
      MARKS.forEach((mark) => {
        add(stagePrompt(config, mark));
        add(readout(config, mark).shadow);
        add(readout(config, mark).flower);
        add(readout(config, mark).puppet);
      });
    });
    /* everything the strip and the moving holder can put on screen */
    CONFIGS.forEach((config) => {
      const moving = movingReadout(config);
      add(moving.shadow);
      add(moving.flower);
      add(moving.puppet);
      add(moving.mark);
    });
    MARKS.forEach((mark) => add(slideValueText(mark)));
    add(MOVING_NOTE);
    add(MOVING_CAPTION);
    add(MOVING_LINE);
    add(SLIDE_TITLE);
    add(SLIDE_SCALE);
    add(SLIDE_GRIP_LABEL);
    add(SIDE_VIEW_TITLE);

    GIANT_PLAY.forEach(add);
    VISITOR_PLAY.forEach(add);
    add(GIANT_TITLE);
    add(VISITOR_TITLE);
    WHY_LINES.forEach(add);
    add(GUIDE_LABEL);
    ENDING.forEach(add);
    add(LEFT_IT);
    return Array.from(lines).sort();
  }

  /* ------------------------------------------------------------------ */
  /* what the child can see while they work                              */
  /* ------------------------------------------------------------------ */

  /* The unit, the target and the current amount, in the words that sit beside
     the stage rather than in narration on another page. */
  function readout(config, mark) {
    return {
      shadow: `Shadow on the screen: ${cm(shadowHeight(config, mark))}`,
      flower: `Sunflower picture: ${cm(config.sunflower)}`,
      puppet: `Paper puppet: ${cm(config.puppet)}, the same as always`,
      mark: `The puppet is ${cm(mark)} from the lamp`
    };
  }

  const stagePrompt = (config, mark) => (tallerThanFlower(config, mark)
    ? "The shadow is taller than the sunflower."
    : "The shadow is not taller than the sunflower yet.");

  /* ------------------------------------------------------------------ */
  /* while the holder is still moving                                    */
  /* ------------------------------------------------------------------ */

  /* A hand on the holder is between marks, so the position and the shadow are
     not whole centimetres and the sentence about the last move is about a move
     that is being undone. Those are put away until the holder is let go, and
     the two sizes that genuinely have not changed - the paper and the picture
     - stay where they are. Nothing here is announced letter by letter as the
     hand moves: these are the same few words for the whole slide. */
  const MOVING_NOTE = "Moving the puppet…";
  const MOVING_CAPTION = "The sunflower scenery, and the visitor's shadow while the puppet moves.";
  const MOVING_LINE = "The puppet is sliding along its track. Let go to leave it at a mark.";

  function movingReadout(config) {
    return {
      shadow: "Shadow on the screen: moving too",
      flower: `Sunflower picture: ${cm(config.sunflower)}`,
      puppet: `Paper puppet: ${cm(config.puppet)}, the same as always`,
      mark: "The puppet is moving along the track"
    };
  }

  /* The strip the child actually slides. It carries only the part of the track
     the puppet can stand on, drawn larger so that a finger has something to
     hold; the side view keeps the real distances. Saying so is part of the
     picture, not a footnote somewhere else. */
  const SLIDE_TITLE = "Slide the puppet's holder along the track.";
  const SLIDE_SCALE = `This strip is the ${cm(TRACK_NEAR)} to ${cm(TRACK_FAR)} part of the track, `
    + "drawn larger. The side view keeps the real sizes.";
  const SLIDE_GRIP_LABEL = "The puppet's holder";
  const slideValueText = (mark) => `${cm(mark)} from the lamp`;

  /* The side view is a diagram of the theatre from beside it. The paper puppet
     really faces the screen; it is drawn turned towards us so that its shape
     can be recognised as the shape that makes the shadow. Saying which way we
     are looking is the difference between a diagram and a wrong picture. */
  const SIDE_VIEW_TITLE = "Behind the screen, from the side. The paper puppet is turned to face us, so you can see its shape.";

  return {
    LAMP_TO_SCREEN, MARKS, START_MARK, CONFIGS, DEFAULT_CONFIG,
    TRACK_NEAR, TRACK_FAR, clampToTrack, snapToMark,
    numeralFor, cm,
    puppetWidth, shadowHeight, shadowWidth, tallerThanFlower, fitsDoorway,
    nearerLamp, nearerScreen, sameConfig, chooseConfig,
    createRehearsal, moveTo, watchBunny, perform, watch, check,
    describeMove, playFor, endingFor, readout, stagePrompt,
    movingReadout, MOVING_NOTE, MOVING_CAPTION, MOVING_LINE,
    SLIDE_TITLE, SLIDE_SCALE, SLIDE_GRIP_LABEL, slideValueText, SIDE_VIEW_TITLE,
    openingLines, WHY_LINES, GUIDE_LABEL, playTitleFor, sceneCaption,
    GIANT_TITLE, VISITOR_TITLE,
    GIANT_PLAY, VISITOR_PLAY, ENDING, LEFT_IT, STAYED,
    /* the little door */
    setScenery, keepComparison, changePlay, CHANGE_PLAY,
    doorFit, compareWay, compareOptions, compareCard, compareHelp, compareShown,
    compareEquation, compareSaid, compareFound, comparedEarlier,
    doorLines, doorCaption, doorStandLines, doorMoveLines, doorPlayFor, doorTitleFor,
    DOOR_MEASURE, DOOR_TITLE, OUTSIDE_TITLE, THROUGH_PLAY, OUTSIDE_PLAY,
    enumerateTexts
  };
});
