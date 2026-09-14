/* The Tower's materials and the arithmetic that goes with them.

   Bunny's new idea is not another tall tower. It is a picture laid FLAT on the
   building board: a pretend lookout for her wooden duck, made of real shaped
   pieces put down side by side. Nothing is stacked, nothing holds anything
   else up, and the preview makes no claim at all about what would stand in a
   real room. Explaining that shift is part of the story, not a footnote.

   Four kinds of piece, deliberately easy to tell apart:

     square         a true square
     long rectangle exactly twice as wide as it is tall
     triangle       three straight edges, an isosceles roof
     circle         genuinely round

   One reading has one materials list - so many of each kind - and a fixed
   stock of 20 uniquely named pieces on the tray. Only the pieces the plan
   asks for move to the board; the spares stay visible and are plainly not
   needed. The model answers with a new plan rather than editing the old one,
   so a test can hold both and compare, and a piece is never created,
   destroyed or counted twice.

   The question the child is asked is the meaningful total: how many pieces
   the whole plan needs. It is asked before the countable pieces and their
   waiting spaces are laid out, three direct numerals are offered, and the
   pieces themselves answer it. */

(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.YoyoTowerMaterials = api;
})(typeof self !== "undefined" ? self : (typeof globalThis !== "undefined" ? globalThis : null), function () {
  "use strict";

  const numeralFor = (n) => String(n);

  /* ------------------------------------------------------------------ */
  /* the four kinds of piece                                             */
  /* ------------------------------------------------------------------ */

  /* `cells` is how many of the layout's square cells a piece occupies across.
     A long rectangle is two cells wide and one cell tall, which is what makes
     it visibly a different piece from a square rather than a stretched one. */
  const SHAPES = [
    { id: "square", one: "square piece", many: "square pieces", cells: 1, stock: 6 },
    { id: "long", one: "long rectangle piece", many: "long rectangle pieces", cells: 2, stock: 6 },
    { id: "triangle", one: "triangle piece", many: "triangle pieces", cells: 1, stock: 4 },
    { id: "circle", one: "round piece", many: "round pieces", cells: 1, stock: 4 }
  ];
  const SHAPE_IDS = SHAPES.map((s) => s.id);
  const shapeById = (id) => SHAPES.find((s) => s.id === id);
  const nameFor = (id, count) => (count === 1 ? shapeById(id).one : shapeById(id).many);

  const STOCK = SHAPES.reduce((all, s) => { all[s.id] = s.stock; return all; }, {});
  const STOCK_TOTAL = SHAPES.reduce((n, s) => n + s.stock, 0);   /* 20 */

  const PREFIX = { square: "sq", long: "rc", triangle: "tr", circle: "ci" };

  /* Nine reviewed materials lists: square, long rectangle, triangle, circle.
     Totals are 7 to 12 - four addends rather than two big ones - and every
     list is inside the stock above. */
  const LISTS = [
    { square: 3, long: 2, triangle: 1, circle: 1 },
    { square: 4, long: 2, triangle: 1, circle: 1 },
    { square: 3, long: 3, triangle: 2, circle: 1 },
    { square: 4, long: 3, triangle: 2, circle: 1 },
    { square: 5, long: 3, triangle: 2, circle: 1 },
    { square: 4, long: 4, triangle: 2, circle: 2 },
    { square: 2, long: 4, triangle: 1, circle: 2 },
    { square: 3, long: 2, triangle: 2, circle: 2 },
    { square: 5, long: 2, triangle: 1, circle: 2 }
  ];

  const totalFor = (list) => SHAPE_IDS.reduce((n, id) => n + list[id], 0);

  const sameList = (a, b) => Boolean(a) && Boolean(b) && SHAPE_IDS.every((id) => a[id] === b[id]);

  /* A new reading gets a different list. Help, Back, changing route and
     replaying never come through here. */
  function chooseList(previous, pick) {
    const fresh = LISTS.filter((list) => !sameList(list, previous));
    const choices = fresh.length ? fresh : LISTS.slice();
    const roll = typeof pick === "function"
      ? pick(choices.length)
      : Math.floor(Math.random() * choices.length);
    const index = Math.min(Math.max(Math.floor(roll) || 0, 0), choices.length - 1);
    return choices[index];
  }

  /* ------------------------------------------------------------------ */
  /* one reading's twenty pieces                                         */
  /* ------------------------------------------------------------------ */

  const idsFor = (shapeId) =>
    Array.from({ length: STOCK[shapeId] }, (unused, i) => `${PREFIX[shapeId]}${i + 1}`);

  const freezePlan = (plan) => {
    Object.freeze(plan.list);
    Object.freeze(plan.tray);
    Object.freeze(plan.placed);
    SHAPE_IDS.forEach((id) => Object.freeze(plan.board[id]));
    Object.freeze(plan.board);
    return Object.freeze(plan);
  };

  function createPlan(list) {
    const tray = [];
    SHAPE_IDS.forEach((id) => idsFor(id).forEach((pieceId) => tray.push(pieceId)));
    return freezePlan({
      list,
      tray,
      /* what has actually been laid on the board, by kind, in the order it
         was put down */
      board: SHAPE_IDS.reduce((all, id) => { all[id] = []; return all; }, {}),
      /* every piece the child has moved, in order, so the story can say what
         really happened */
      placed: []
    });
  }

  const shapeOf = (pieceId) => {
    const found = SHAPE_IDS.find((id) => String(pieceId).indexOf(PREFIX[id]) === 0);
    return found || null;
  };

  const onBoard = (plan, shapeId) => (shapeId ? plan.board[shapeId].length
    : SHAPE_IDS.reduce((n, id) => n + plan.board[id].length, 0));
  const onTray = (plan, shapeId) => (shapeId
    ? plan.tray.filter((id) => shapeOf(id) === shapeId).length
    : plan.tray.length);
  const needed = (plan, shapeId) => (shapeId ? plan.list[shapeId] : totalFor(plan.list));
  const remaining = (plan, shapeId) => Math.max(0, needed(plan, shapeId) - onBoard(plan, shapeId));
  const quotaFull = (plan, shapeId) => remaining(plan, shapeId) === 0;
  const isComplete = (plan) => SHAPE_IDS.every((id) => quotaFull(plan, id));
  /* pieces that are still on the tray and that this plan will never ask for */
  const spare = (plan) => plan.tray.length - SHAPE_IDS.reduce((n, id) => n + remaining(plan, id), 0);

  /* One piece onto the board. A piece whose kind is already complete is
     refused, and so is a piece that is not on the tray - already moved, never
     real, tapped twice - so a duplicate tap and a rapid sequence of different
     taps both do exactly what they look like. */
  function place(plan, pieceId) {
    const at = plan.tray.indexOf(pieceId);
    if (at === -1) return { plan, moved: false, shape: null };
    const shapeId = shapeOf(pieceId);
    if (!shapeId || quotaFull(plan, shapeId)) return { plan, moved: false, shape: shapeId };
    const board = SHAPE_IDS.reduce((all, id) => {
      all[id] = id === shapeId ? plan.board[id].concat([pieceId]) : plan.board[id];
      return all;
    }, {});
    return {
      plan: freezePlan({
        list: plan.list,
        tray: plan.tray.slice(0, at).concat(plan.tray.slice(at + 1)),
        board,
        placed: plan.placed.concat([pieceId])
      }),
      moved: true,
      shape: shapeId
    };
  }

  /* The rest of one kind in a single action: only the pieces still needed,
     never the number the list asked for all over again. */
  function placeRest(plan, shapeId) {
    let now = plan;
    const moved = [];
    now.tray.filter((id) => shapeOf(id) === shapeId).forEach((id) => {
      if (quotaFull(now, shapeId)) return;
      const step = place(now, id);
      if (step.moved) { now = step.plan; moved.push(id); }
    });
    return { plan: now, moved };
  }

  /* ------------------------------------------------------------------ */
  /* the flat picture the pieces make                                    */
  /* ------------------------------------------------------------------ */

  /* Four bands, front to back, laid flat on the board:

       path   the long rectangles, end to end along the front
       wall   the squares
       roof   the triangles
       sign   the round pieces

     Everything is measured in square cells. A cell is square in the
     painting's own pixels, so a square piece really is square and a long
     rectangle really is 2:1 whatever the picture is scaled to. Bands are
     centred, never overlap, and the widest list still fits well inside the
     measured painted surface. */

  const BANDS = [
    { shape: "long", row: 0 },
    { shape: "square", row: 1 },
    { shape: "triangle", row: 2 },
    { shape: "circle", row: 3 }
  ];
  const ROWS = BANDS.length;

  const cellsAcross = (list) =>
    BANDS.reduce((most, band) => Math.max(most, list[band.shape] * shapeById(band.shape).cells), 1);

  /* Where each piece of the plan belongs, in cells. Row 0 is the front band.
     Returned in the order the bands are read, and always the whole plan, so a
     waiting space and the piece that will fill it are the same rectangle. */
  function slots(list) {
    const across = cellsAcross(list);
    const out = [];
    BANDS.forEach((band) => {
      const shape = shapeById(band.shape);
      const count = list[band.shape];
      const used = count * shape.cells;
      const start = (across - used) / 2;
      for (let i = 0; i < count; i += 1) {
        out.push({
          shape: band.shape,
          index: i,
          row: band.row,
          column: start + i * shape.cells,
          cells: shape.cells
        });
      }
    });
    return out;
  }

  /* Every slot, with the piece actually in it if there is one. */
  function layout(plan) {
    const filled = {};
    return slots(plan.list).map((slot) => {
      const taken = filled[slot.shape] || 0;
      const pieceId = plan.board[slot.shape][taken] || null;
      if (pieceId) filled[slot.shape] = taken + 1;
      return { ...slot, pieceId };
    });
  }

  /* No two pieces of a plan may ever be drawn in the same place, and the whole
     picture has to fit the space it is given. */
  function layoutIsSound(list) {
    const seen = new Set();
    const across = cellsAcross(list);
    let ok = true;
    slots(list).forEach((slot) => {
      if (slot.column < 0 || slot.column + slot.cells > across + 1e-9) ok = false;
      for (let c = 0; c < slot.cells; c += 1) {
        const key = `${slot.row}:${(slot.column + c).toFixed(2)}`;
        if (seen.has(key)) ok = false;
        seen.add(key);
      }
    });
    return ok;
  }

  /* ------------------------------------------------------------------ */
  /* the question, the three numbers, and one way to work it out          */
  /* ------------------------------------------------------------------ */

  const questionFor = (list) =>
    "Bunny's plan needs " + SHAPE_IDS.map((id) => `${numeralFor(list[id])} ${nameFor(id, list[id])}`)
      .join(", ").replace(/, ([^,]*)$/, " and $1")
    + ". How many pieces does the whole plan need?";

  const givensFor = (list) => SHAPE_IDS.map((id) => ({
    shape: id, label: nameFor(id, list[id]), value: list[id]
  }));

  /* Three neighbouring amounts, one of them true, unique and inside the
     range this plan can reach. Fixed for the reading: help, Back, a changed
     mind and every piece placed see the same three, and the true one is not
     always in the same place. */
  function answerChoices(list) {
    const answer = totalFor(list);
    const lowest = Math.max(0, Math.min(18, answer - 1));
    const values = [lowest, lowest + 1, lowest + 2];
    const offset = ((list.square + 2 * list.long + list.triangle + 2 * list.circle) % 3 + 3) % 3;
    return values.slice(offset).concat(values.slice(0, offset));
  }

  /* A step's diagram is a list of groups, and each group is the actual mixture
     of pieces it stands for. A partial sum is not drawn as that many squares:
     "3 and 2 more make 5" shows the 3 squares and the 2 long rectangles it is
     really talking about, so the numeral and the shapes always agree. */
  const mix = (list, ids) => ids.map((id) => ({ shape: id, count: list[id] }));
  const sizeOf = (group) => group.reduce((n, part) => n + part.count, 0);
  const step = (text, symbols, groups, roles) => ({
    text,
    symbols,
    groups: groups || null,
    /* the amount each group stands for, for anything that only needs numbers */
    parts: groups ? groups.map(sizeOf) : null,
    roles: roles || null
  });

  /* The first step explains what is being combined and leaves the sum
     unsolved. Later steps, deliberately asked for, add the kinds together in
     order and show the mixture reached so far. */
  function helpSteps(list) {
    const counts = SHAPE_IDS.map((id) => list[id]);
    const steps = [step(
      "There are 4 kinds of piece. We need all of them together, not just one kind.",
      `${counts.join(" + ")} = ?`,
      SHAPE_IDS.map((id) => mix(list, [id])),
      SHAPE_IDS.map((id) => nameFor(id, list[id]))
    )];
    let running = list[SHAPE_IDS[0]];
    for (let i = 1; i < SHAPE_IDS.length; i += 1) {
      const id = SHAPE_IDS[i];
      const before = running;
      running += list[id];
      steps.push(step(
        `${numeralFor(before)} and ${numeralFor(list[id])} more make ${numeralFor(running)}.`,
        `${before} + ${list[id]} = ${running}`,
        [mix(list, SHAPE_IDS.slice(0, i)), mix(list, [id])],
        [i === 1 ? nameFor(SHAPE_IDS[0], before) : "the pieces counted so far", nameFor(id, list[id])]
      ));
    }
    return steps;
  }

  const comparisonFor = (said, answer) =>
    `You thought ${numeralFor(said)}. We found ${numeralFor(answer)}.`;

  const equationFor = (list) =>
    `${SHAPE_IDS.map((id) => list[id]).join(" + ")} = ${numeralFor(totalFor(list))}`;

  /* ------------------------------------------------------------------ */
  /* what really happened                                                */
  /* ------------------------------------------------------------------ */

  /* Said only once the picture is finished, and only about this plan. It
     describes a flat picture, not a standing tower, and it never says the
     child drew anything. */
  function explanation(plan) {
    if (!isComplete(plan)) return null;
    const list = plan.list;
    return `The whole picture used ${numeralFor(totalFor(list))} pieces: `
      + SHAPE_IDS.map((id) => `${numeralFor(list[id])} ${nameFor(id, list[id])}`)
        .join(", ").replace(/, ([^,]*)$/, " and $1")
      + ". They are lying flat on the board, like a picture of a lookout.";
  }

  /* Nothing is invented and nothing disappears: the tray and the board always
     account for all twenty pieces, and no kind ever goes past its quota. */
  function check(plan) {
    const problems = [];
    const all = plan.tray.concat(SHAPE_IDS.reduce((ids, id) => ids.concat(plan.board[id]), []));
    if (all.length !== STOCK_TOTAL) problems.push(`${all.length} pieces exist, not ${STOCK_TOTAL}`);
    if (new Set(all).size !== all.length) problems.push("a piece is in two places at once");
    SHAPE_IDS.forEach((id) => {
      if (onBoard(plan, id) > plan.list[id]) problems.push(`too many ${nameFor(id, 2)} on the board`);
      if (plan.board[id].some((pieceId) => shapeOf(pieceId) !== id)) {
        problems.push(`a piece of the wrong kind is among the ${nameFor(id, 2)}`);
      }
    });
    if (plan.placed.length !== onBoard(plan)) problems.push("the record of what was moved disagrees with the board");
    if (!layoutIsSound(plan.list)) problems.push("two pieces would be drawn in the same place");
    return { ok: problems.length === 0, problems };
  }

  /* Every line this route can speak, for a later script freeze. */
  function enumerateTexts() {
    const lines = new Set();
    const add = (t) => { if (t) lines.add(String(t).trim()); };
    LISTS.forEach((list) => {
      add(questionFor(list));
      helpSteps(list).forEach((s) => add(s.text));
      answerChoices(list).forEach((n) => add(comparisonFor(n, totalFor(list))));
      add(explanation(completedPlan(list)));
    });
    return Array.from(lines).filter(Boolean).sort();
  }

  /* a plan with every requested piece really placed, used for enumeration and
     by tests that need the finished state without pressing twenty buttons */
  function completedPlan(list) {
    let plan = createPlan(list);
    SHAPE_IDS.forEach((id) => { plan = placeRest(plan, id).plan; });
    return plan;
  }

  return {
    SHAPES, SHAPE_IDS, STOCK, STOCK_TOTAL, LISTS, BANDS, ROWS,
    numeralFor, nameFor, shapeById, shapeOf, idsFor,
    totalFor, sameList, chooseList,
    createPlan, completedPlan, place, placeRest,
    onBoard, onTray, needed, remaining, quotaFull, isComplete, spare,
    cellsAcross, slots, layout, layoutIsSound,
    questionFor, givensFor, answerChoices, helpSteps, comparisonFor, equationFor,
    explanation, check, enumerateTexts
  };
});
