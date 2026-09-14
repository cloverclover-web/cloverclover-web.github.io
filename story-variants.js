/* Variant engine for Bunny's Birthday Picnic.

   Pure and seeded. buildSession(seed) returns one frozen session: every task
   the child will meet on this read, already solved and checked. The engine is
   called once when a read begins. Turning a page, replaying a line, asking for
   a hint or answering wrongly never calls it again, so the book cannot change
   under the child's feet.

   Rules held here, not in the UI:
     - all quantities 0..20, subtraction never negative, two ten frames = 20
     - the answer is built first, then distractors, then an independent solver
       confirms exactly one option works
     - every spoken line for a task comes from that task's own variant, so a
       hint can never quote a number from a different read
     - the sentence bank is finite and enumerable, so narration can be recorded
       ahead of time and never needs live speech synthesis */

(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.YoyoVariants = api;
})(typeof self !== "undefined" ? self : (typeof globalThis !== "undefined" ? globalThis : null), function () {
  "use strict";

  /* ---------------------------------------------------------------- */
  /* seeded randomness                                                 */
  /* ---------------------------------------------------------------- */

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), 1 | t);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeRng(seed) {
    const next = mulberry32(seed);
    const int = (maxExclusive) => Math.floor(next() * maxExclusive);
    const pick = (list) => list[int(list.length)];
    const shuffle = (list) => {
      const copy = list.slice();
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = int(i + 1);
        const swap = copy[i];
        copy[i] = copy[j];
        copy[j] = swap;
      }
      return copy;
    };
    const pickMany = (list, count) => shuffle(list).slice(0, count);
    return { next, int, pick, shuffle, pickMany };
  }

  /* ---------------------------------------------------------------- */
  /* closed vocabularies                                               */
  /* ---------------------------------------------------------------- */

  const COLOURS = [
    { id: "red",    word: "red",    hex: "#d2553c" },
    { id: "blue",   word: "blue",   hex: "#5d8fbe" },
    { id: "yellow", word: "yellow", hex: "#e3b96b" },
    { id: "green",  word: "green",  hex: "#7f9a77" },
    { id: "pink",   word: "pink",   hex: "#e8a0b4" },
    { id: "purple", word: "purple", hex: "#a48ac4" }
  ];

  /* Only shapes with an unarguable answer to "has it got corners?" may carry
     that clue. A five-pointed star actually has ten vertices, and a heart or a
     flower is a decorative outline, not a polygon, so those three are marked
     decorative and never enter the corner classification. They are still fine
     for naming a colour and a shape in the find and pattern activities. */
  const SHAPES = [
    { id: "circle",   word: "circle",   family: "round",      corners: 0, clueEligible: true },
    { id: "oval",     word: "oval",     family: "round",      corners: 0, clueEligible: true },
    { id: "triangle", word: "triangle", family: "corner",     corners: 3, clueEligible: true },
    { id: "square",   word: "square",   family: "corner",     corners: 4, clueEligible: true },
    { id: "pentagon", word: "pentagon", family: "corner",     corners: 5, clueEligible: true },
    { id: "hexagon",  word: "hexagon",  family: "corner",     corners: 6, clueEligible: true },
    { id: "star",     word: "star",     family: "decorative", corners: null, clueEligible: false },
    { id: "heart",    word: "heart",    family: "decorative", corners: null, clueEligible: false },
    { id: "flower",   word: "flower",   family: "decorative", corners: null, clueEligible: false }
  ];

  /* the only shapes a corner clue is allowed to talk about */
  const CLUE_SHAPES = SHAPES.filter((s) => s.clueEligible);

  const PATTERN_RULES = [
    { id: "AB",  units: ["A", "B"] },
    { id: "AAB", units: ["A", "A", "B"] },
    { id: "ABB", units: ["A", "B", "B"] },
    { id: "ABC", units: ["A", "B", "C"] }
  ];

  const NUMBER_WORDS = [
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
    "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
    "sixteen", "seventeen", "eighteen", "nineteen", "twenty"
  ];

  const colourById = (id) => COLOURS.find((c) => c.id === id);
  const shapeById = (id) => SHAPES.find((s) => s.id === id);
  const word = (n) => NUMBER_WORDS[n] || String(n);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /* ---------------------------------------------------------------- */
  /* maths banks                                                       */
  /* ---------------------------------------------------------------- */

  /* Bear arrives with berries: start + brought = total, total <= 20. */
  const ADD_CONFIGS = [
    { start: 12, change: 5 }, { start: 11, change: 6 }, { start: 13, change: 4 },
    { start: 9,  change: 7 }, { start: 8,  change: 7 }, { start: 10, change: 8 },
    { start: 12, change: 6 }, { start: 14, change: 5 }, { start: 11, change: 8 },
    { start: 9,  change: 9 }, { start: 13, change: 7 }, { start: 12, change: 8 },
    { start: 10, change: 5 }, { start: 11, change: 5 }, { start: 13, change: 5 }
  ].map((c) => ({ ...c, answer: c.start + c.change }));

  /* Sharing with Duck: whatever is in the basket, take some out.
     Keyed by basket total so a read stays consistent end to end.

     A given amount may legitimately equal the amount left (18 take away 9).
     That is an ordinary question, not a leak: what must never happen is
     announcing the computed result, or showing a live total, before asking. */
  const SUBTRACT_BY_START = {
    15: [4, 6, 7],
    16: [3, 7, 9],
    17: [4, 5, 9],
    18: [5, 6, 9],
    19: [4, 6, 8],
    20: [6, 8, 9]
  };

  /* Equal groups: the same number on every plate. This is the step from
     "3 and 3 is 6" to "two plates of three is six", so it is built as
     repeated addition and never shown with a multiplication sign. */
  const GROUP_SIZES = [2, 3, 4, 5];
  const GROUP_COUNTS = [2, 3, 4];
  const GROUP_CONFIGS = [];
  GROUP_SIZES.forEach((perGroup) => GROUP_COUNTS.forEach((groups) => {
    const total = perGroup * groups;
    if (total <= 20) GROUP_CONFIGS.push({ perGroup, groups, total });
  }));

  /* ---------------------------------------------------------------- */
  /* sentence builders (single source of truth for text and audio)      */
  /* ---------------------------------------------------------------- */

  const Say = {
    /* maths */
    addCollect: () => "Tap the strawberries Bear brought to put them in the basket.",
    addCount: () => "Now count them all. How many strawberries are there?",
    addHint1: () => "Count the strawberries already in the basket first.",
    addHint2: (a, b) => `There are ${word(a)} in the basket and ${word(b)} more. Count on from ${word(a)}.`,
    addHint3: (a, b, c) => `${cap(word(a))} and ${word(b)} make ${word(c)}.`,
    addSuccess: (c) => `${cap(word(c))} strawberries. Well counted!`,

    subCollect: (b) => `Tap ${word(b)} strawberries to put on Duck's plate.`,
    subCount: () => "How many strawberries are left in the basket?",
    subHint1: () => "Count how many strawberries are still in the basket.",
    subHint2: (a, b) => `${cap(word(a))} take away ${word(b)}. Count back from ${word(a)}.`,
    subHint3: (a, b, c) => `${cap(word(a))} take away ${word(b)} leaves ${word(c)}.`,
    subSuccess: (c) => `${cap(word(c))} strawberries left in the basket. Well counted!`,


    /* shared item naming */
    itemName: (colour, shape) => `the ${colour} ${shape}`,
    findPrompt: (colour, shape) => `Find the ${colour} ${shape}.`,
    itemReveal: (colour, shape) => `It is the ${colour} ${shape}.`,
    itemSuccess: (colour, shape) => `Yes, the ${colour} ${shape}.`,

    findHint1: () => "Look at the colours first, then look at the shapes.",
    findPurpose: () => "Bunny is choosing one decoration for the picnic table.",
    findUse: (colour, shape) => `The ${colour} ${shape} goes on the table, ready for the party.`,
    findHint2: (colour) => `It is ${colour}.`,

    /* pattern */
    patternPrompt: () => "What comes next in the bunting?",
    patternHint1: () => "Say the pattern out loud from the start.",
    patternPurpose: () => "One flag is missing from the bunting, so it cannot be hung up yet.",
    patternUse: () => "Now the bunting is finished, and it can go up above the cake.",
    patternHint2: (ruleId) => ({
      AB:  "The pattern goes one, then another, then back again.",
      AAB: "The pattern goes two the same, then a different one.",
      ABB: "The pattern goes one, then two the same.",
      ABC: "The pattern goes three different ones, then it starts again."
    })[ruleId],


    /* reflection: warm, never marked */
    reflectionThanks: () => "Thank you for telling me. That is a real feeling.",


    /* equal groups: situation, then model, then the child tries, then the sum */
    groupSituation: (perGroup, groups) =>
      `From the strawberries still in the basket, Bunny fills ${word(groups)} little plates, with ${word(perGroup)} on each one.`,
    groupModel: (perGroup) => `Fill each plate with ${word(perGroup)} strawberries.`,
    groupAsk: () => "How many strawberries are there altogether?",
    groupHint1: () => "Count one plate first, then count the next plate.",
    groupHint2: (perGroup) => `Every plate has ${word(perGroup)}. Count them plate by plate.`,
    groupReveal: (perGroup, groups, total) =>
      `${Array(groups).fill(cap(word(perGroup))).join(" and ")} makes ${word(total)}.`,
    groupSuccess: (total) => `${cap(word(total))} altogether, and every plate is the same. That is fair.`,


    /* what the answer was for, said after the sum, never before */
    useCombine: () => "Now the basket is ready for the picnic.",
    useTakeaway: () => "Now Duck has a plateful and the basket is still full enough to share.",
    useGroups: () => "Every friend gets the same, and the rest stay in the basket.",
    useLength: () => "Now Bear knows how long the ladder has to be."
  };

  /* Small glosses, shown as text only so that not understanding a word is
     never mistaken for not understanding the maths. The child's screen is
     English throughout: a word is explained with easier English, not with a
     translation, so reading the hint is still reading English. */
  const WORD_HELP = {
    altogether: "altogether: all of them counted as one lot",
    left: "left: still there after some have gone",
    each: "each: every single one",
    plates: "plates: the dishes we put food on"
  };

  /* ---------------------------------------------------------------- */
  /* independent solvers (also used by the tests)                       */
  /* ---------------------------------------------------------------- */

  function solveAttributeFind(items, target) {
    return items.filter((i) => i.colour === target.colour && i.shape === target.shape);
  }

  /* Does prefix + candidate obey the rule for the whole strip? */
  function patternHolds(sequence, ruleId) {
    const rule = PATTERN_RULES.find((r) => r.id === ruleId);
    const period = rule.units.length;
    const slotOf = {};
    for (let i = 0; i < sequence.length; i += 1) {
      const slot = rule.units[i % period];
      const token = sequence[i];
      if (slotOf[slot] == null) slotOf[slot] = token;
      else if (slotOf[slot] !== token) return false;
    }
    /* distinct slots must hold distinct tokens, or ABC would accept AAA */
    const used = Object.values(slotOf);
    return new Set(used).size === used.length;
  }

  function solvePattern(prefix, ruleId, options) {
    return options.filter((token) => patternHolds(prefix.concat([token]), ruleId));
  }

  function solveLogic(items, clues) {
    return items.filter((item) => clues.every((clue) => {
      if (clue.kind === "colour") return item.colour === clue.value;
      if (clue.kind === "family") return shapeById(item.shape).family === clue.value;
      return false;
    }));
  }

  /* ---------------------------------------------------------------- */
  /* task builders                                                     */
  /* ---------------------------------------------------------------- */

  function tokenOf(item) { return `${item.colour}:${item.shape}`; }
  function itemFromToken(token) {
    const [colour, shape] = token.split(":");
    return { colour, shape };
  }

  function buildMathsAdd(rng) {
    const config = rng.pick(ADD_CONFIGS);
    const { start, change, answer } = config;
    return {
      type: "maths",
      kind: "add",
      taskId: `maths-add-${start}-${change}`,
      skill: "maths",
      startCount: start,
      changeCount: change,
      answer,
      relation: "combine",
      equation: `${start} + ${change} = ?`,
      collectPrompt: Say.addCollect(),
      countPrompt: Say.addCount(),
      storyUse: Say.useCombine(),
      glossary: ["altogether"],
      choicesFrom: Math.max(0, answer - 5),
      choicesTo: Math.min(20, answer + 5),
      hints: [Say.addHint1(), Say.addHint2(start, change), Say.addHint3(start, change, answer)],
      successLine: Say.addSuccess(answer)
    };
  }

  function buildMathsSubtract(rng, startCount) {
    const options = SUBTRACT_BY_START[startCount];
    const change = rng.pick(options);
    const answer = startCount - change;
    return {
      type: "maths",
      kind: "subtract",
      taskId: `maths-sub-${startCount}-${change}`,
      skill: "maths",
      startCount,
      changeCount: change,
      answer,
      relation: "takeaway",
      equation: `${startCount} - ${change} = ?`,
      collectPrompt: Say.subCollect(change),
      countPrompt: Say.subCount(),
      storyUse: Say.useTakeaway(),
      glossary: ["left"],
      choicesFrom: Math.max(0, answer - 5),
      choicesTo: Math.min(20, answer + 5),
      hints: [Say.subHint1(), Say.subHint2(startCount, change), Say.subHint3(startCount, change, answer)],
      successLine: Say.subSuccess(answer)
    };
  }

  /* Equal groups. The child fills every plate, then works out the whole.
     The sum is revealed only after the attempt, as repeated addition. */
  /* Sharing out what is actually left. The plates can never hold more than
     the basket has at this point in the story, and whatever is not used stays
     in the basket, so a later count is never contradicted. */
  function buildEqualGroups(rng, availableCount) {
    const usable = GROUP_CONFIGS.filter((c) => c.total <= availableCount);
    if (!usable.length) return null;
    const config = rng.pick(usable);
    const { perGroup, groups, total } = config;
    return {
      type: "maths",
      kind: "groups",
      relation: "groups",
      taskId: `maths-groups-${perGroup}x${groups}`,
      skill: "maths",
      perGroup,
      groups,
      availableCount,
      usedCount: total,
      remainingCount: availableCount - total,
      startCount: 0,
      changeCount: perGroup,
      answer: total,
      equation: `${Array(groups).fill(perGroup).join(" + ")} = ?`,
      situation: Say.groupSituation(perGroup, groups),
      collectPrompt: Say.groupModel(perGroup),
      countPrompt: Say.groupAsk(),
      choicesFrom: Math.max(0, total - 5),
      choicesTo: Math.min(20, total + 5),
      hints: [Say.groupHint1(), Say.groupHint2(perGroup), Say.groupReveal(perGroup, groups, total)],
      successLine: Say.groupSuccess(total),
      storyUse: Say.useGroups(),
      glossary: ["each", "altogether", "plates"]
    };
  }

  /* Find the <colour> <shape> among decorations that share one attribute
     each, so neither colour nor shape alone is enough. */
  function buildAttributeFind(rng) {
    const target = { colour: rng.pick(COLOURS).id, shape: rng.pick(SHAPES).id };
    const otherColours = rng.shuffle(COLOURS.filter((c) => c.id !== target.colour));
    const otherShapes = rng.shuffle(SHAPES.filter((s) => s.id !== target.shape));

    const items = [
      target,
      { colour: target.colour, shape: otherShapes[0].id },   // right colour, wrong shape
      { colour: otherColours[0].id, shape: target.shape },   // right shape, wrong colour
      { colour: otherColours[1].id, shape: otherShapes[1].id },
      { colour: otherColours[2].id, shape: target.shape },
      { colour: target.colour, shape: otherShapes[2].id }
    ];

    const placed = rng.shuffle(items);
    const matches = solveAttributeFind(placed, target);
    if (matches.length !== 1) return null;

    const colourWord = colourById(target.colour).word;
    const shapeWord = shapeById(target.shape).word;

    return {
      type: "find",
      taskId: `find-${target.colour}-${target.shape}`,
      skill: "english",
      items: placed,
      target,
      answerIndex: placed.findIndex((i) => i.colour === target.colour && i.shape === target.shape),
      purpose: Say.findPurpose(),
      prompt: Say.findPrompt(colourWord, shapeWord),
      hints: [Say.findHint1(), Say.findHint2(colourWord), Say.itemReveal(colourWord, shapeWord)],
      successLine: Say.itemSuccess(colourWord, shapeWord),
      storyUse: Say.findUse(colourWord, shapeWord)
    };
  }

  /* Bunting whose next flag continues an AB / AAB / ABB / ABC rule. */
  function buildPattern(rng) {
    const rule = rng.pick(PATTERN_RULES);
    const slots = [...new Set(rule.units)];
    const palette = rng.pickMany(COLOURS, slots.length);
    const shapes = rng.pickMany(SHAPES, slots.length);

    const tokenForSlot = {};
    slots.forEach((slot, i) => {
      tokenForSlot[slot] = tokenOf({ colour: palette[i].id, shape: shapes[i].id });
    });

    /* At least two whole repeats, so the unit is unmistakable, plus a random
       part-repeat. Without the part-repeat the missing flag would always be
       the first of the unit, and a child could answer every pattern by
       copying flag one instead of reading the rule. */
    const period = rule.units.length;
    const extra = rng.int(period);
    const visibleLength = period * 2 + extra;
    const strip = [];
    for (let i = 0; i < visibleLength; i += 1) strip.push(tokenForSlot[rule.units[i % period]]);
    const answerToken = tokenForSlot[rule.units[visibleLength % period]];

    /* distractors: tokens that break the rule at this position */
    const pool = [];
    COLOURS.forEach((c) => SHAPES.forEach((s) => {
      const token = tokenOf({ colour: c.id, shape: s.id });
      if (token !== answerToken) pool.push(token);
    }));
    const wrong = rng.shuffle(pool)
      .filter((token) => !patternHolds(strip.concat([token]), rule.id))
      .slice(0, 3);
    if (wrong.length < 3) return null;

    const options = rng.shuffle([answerToken, ...wrong]);
    if (solvePattern(strip, rule.id, options).length !== 1) return null;

    const answerItem = itemFromToken(answerToken);
    const colourWord = colourById(answerItem.colour).word;
    const shapeWord = shapeById(answerItem.shape).word;

    return {
      type: "pattern",
      taskId: `pattern-${rule.id}`,
      skill: "english",
      ruleId: rule.id,
      strip: strip.map(itemFromToken),
      options: options.map(itemFromToken),
      answerIndex: options.indexOf(answerToken),
      purpose: Say.patternPurpose(),
      prompt: Say.patternPrompt(),
      hints: [Say.patternHint1(), Say.patternHint2(rule.id), Say.itemReveal(colourWord, shapeWord)],
      storyUse: Say.patternUse(),
      successLine: Say.itemSuccess(colourWord, shapeWord)
    };
  }

  /* Retry a builder until its own checks pass. Bounded, and deterministic
     because every attempt draws from the same seeded stream. */
  function attempt(build, rng, tries = 40) {
    for (let i = 0; i < tries; i += 1) {
      const result = build(rng);
      if (result) return result;
    }
    return null;
  }

  /* ---------------------------------------------------------------- */
  /* session                                                           */
  /* ---------------------------------------------------------------- */

  function buildSession(seed) {
    const rng = makeRng(seed >>> 0);

    const add = buildMathsAdd(rng);
    const basketTotal = add.answer;                    // inventory carries forward
    const subtract = buildMathsSubtract(rng, basketTotal);
    const find = attempt(buildAttributeFind, rng);
    const pattern = attempt(buildPattern, rng);
    /* the plates can only use berries that survived the sharing on page 5 */
    const groups = buildEqualGroups(rng, subtract.answer);

    if (!find || !pattern || !groups) return buildSession((seed >>> 0) + 1);

    const session = {
      seed: seed >>> 0,
      basketStart: add.startCount,
      basketAfterBear: basketTotal,
      basketAfterSharing: subtract.answer,
      /* page-4 is deliberately absent: the rain scene is the emotional peak
         and is read straight through with no task attached. */
      tasks: {
        "page-2": find,
        "page-3": add,
        "page-5": subtract,
        "page-6": pattern
      },
      /* Offered only after the sharing on page 5, and only ever out of the
         berries that are actually left there. */
      groups
    };

    /* Freeze so a later render cannot mutate what the child already saw. */
    const deepFreeze = (value) => {
      if (value && typeof value === "object" && !Object.isFrozen(value)) {
        Object.freeze(value);
        Object.values(value).forEach(deepFreeze);
      }
      return value;
    };
    return deepFreeze(session);
  }

  /* ---------------------------------------------------------------- */
  /* the complete finite set of lines any variant can speak             */
  /* ---------------------------------------------------------------- */

  function enumerateAllTexts() {
    const lines = new Set();
    const add = (t) => { if (t) lines.add(String(t).trim()); };

    /* maths: addition */
    add(Say.addCollect()); add(Say.addCount()); add(Say.addHint1());
    ADD_CONFIGS.forEach((c) => {
      add(Say.addHint2(c.start, c.change));
      add(Say.addHint3(c.start, c.change, c.answer));
      add(Say.addSuccess(c.answer));
    });

    /* maths: subtraction, for every basket total the story can reach */
    add(Say.subCount()); add(Say.subHint1());
    Object.entries(SUBTRACT_BY_START).forEach(([startText, changes]) => {
      const start = Number(startText);
      changes.forEach((change) => {
        add(Say.subCollect(change));
        add(Say.subHint2(start, change));
        add(Say.subHint3(start, change, start - change));
        add(Say.subSuccess(start - change));
      });
    });

    /* equal groups */
    add(Say.groupAsk()); add(Say.groupHint1()); add(Say.useGroups());
    GROUP_CONFIGS.forEach((c) => {
      add(Say.groupSituation(c.perGroup, c.groups));
      add(Say.groupModel(c.perGroup));
      add(Say.groupHint2(c.perGroup));
      add(Say.groupReveal(c.perGroup, c.groups, c.total));
      add(Say.groupSuccess(c.total));
    });

    /* what each answer was for */
    add(Say.useCombine()); add(Say.useTakeaway());

    /* every colour and shape naming used by find, pattern and logic */
    add(Say.findHint1()); add(Say.findPurpose());
    add(Say.patternPrompt()); add(Say.patternHint1());
    add(Say.patternPurpose()); add(Say.patternUse());
    PATTERN_RULES.forEach((r) => add(Say.patternHint2(r.id)));
    add(Say.reflectionThanks());

    COLOURS.forEach((colour) => {
      add(Say.findHint2(colour.word));
      SHAPES.forEach((shape) => {
        add(Say.findPrompt(colour.word, shape.word));
        add(Say.itemReveal(colour.word, shape.word));
        add(Say.itemSuccess(colour.word, shape.word));
        add(Say.findUse(colour.word, shape.word));
      });
    });

    return [...lines].sort();
  }

  return {
    makeRng,
    buildSession,
    enumerateAllTexts,
    solveAttributeFind,
    solvePattern,
    solveLogic,
    patternHolds,
    COLOURS,
    SHAPES,
    PATTERN_RULES,
    ADD_CONFIGS,
    SUBTRACT_BY_START,
    GROUP_CONFIGS,
    CLUE_SHAPES,
    WORD_HELP,
    Say
  };
});
