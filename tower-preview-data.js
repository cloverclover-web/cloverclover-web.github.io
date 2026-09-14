/* The Tower That Fell: the exact model behind the preview's building beat.

   Everything countable lives here, and nothing here knows about the screen.
   The engine renders what this says; the tests drive this directly. Both see
   the same numbers, so a picture can never disagree with a total.

   The supply is bounded and conserved: fourteen wooden blocks exist, some
   already on the board and the rest on the tray, and a block only ever moves
   from one to the other. Nothing is created when a block is placed and nothing
   is destroyed when the plan is left unfinished.

   The plan is Bunny's own: two little towers of the same height. That is the
   only relationship the child is asked about, and it is introduced in the
   story before it is used. */

(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.YoyoTower = api;
})(typeof self !== "undefined" ? self : (typeof globalThis !== "undefined" ? globalThis : null), function () {
  "use strict";

  /* The whole finite space: three heights, three starting amounts, nine
     complete readings. Small enough that every one of them is tested rather
     than sampled. */
  const HEIGHTS = [3, 4, 5];
  const STARTED = [2, 3, 4];
  const SUPPLY = 14;
  const COLUMNS = 2;

  const VARIANTS = HEIGHTS.flatMap((height) => STARTED.map((started) => ({ height, started })));

  const WORDS = { 2: "two", 3: "three", 4: "four", 5: "five" };
  const wordFor = (n) => WORDS[n] || String(n);

  const sameVariant = (a, b) => Boolean(a && b && a.height === b.height && a.started === b.started);

  /* A new reading gets a different plan from the one just read. `pick` is
     passed in so a test can choose rather than hope; it never widens the
     allowed set. With no previous reading every variant is allowed. */
  function chooseVariant(previous, pick) {
    const fresh = VARIANTS.filter((v) => !sameVariant(v, previous));
    const choices = fresh.length > 0 ? fresh : VARIANTS.slice();
    const roll = typeof pick === "function" ? pick(choices.length) : Math.floor(Math.random() * choices.length);
    const index = Math.min(Math.max(Math.floor(roll) || 0, 0), choices.length - 1);
    return choices[index];
  }

  /* Bear sets the first blocks out alternately, left tower first, so the two
     towers start as evenly as the number allows and every placed block rests
     on the board or on the block below it. */
  function startingColumns(height, started) {
    const columns = [];
    for (let c = 0; c < COLUMNS; c += 1) columns.push(new Array(height).fill(null));
    for (let i = 0; i < started; i += 1) {
      const column = i % COLUMNS;
      const row = Math.floor(i / COLUMNS);
      columns[column][row] = `b${i + 1}`;
    }
    return columns;
  }

  function createPlan(variant) {
    const height = variant.height;
    const started = variant.started;
    if (!HEIGHTS.includes(height)) throw new Error(`unsupported height ${height}`);
    if (!STARTED.includes(started)) throw new Error(`unsupported starting amount ${started}`);

    const tray = [];
    for (let i = started; i < SUPPLY; i += 1) tray.push(`b${i + 1}`);

    return Object.freeze({
      height,
      started,
      supply: SUPPLY,
      columns: startingColumns(height, started).map((c) => Object.freeze(c.slice())),
      tray: Object.freeze(tray),
      /* the tray's places, as they were laid out at the start. A block that
         leaves empties its own place; the ones beside it do not move up, so
         the child's next tap lands where they were already looking. */
      origin: Object.freeze(tray.slice()),
      moved: Object.freeze([])
    });
  }

  const onBoard = (plan) => plan.columns.reduce(
    (total, column) => total + column.filter(Boolean).length, 0);
  const onTray = (plan) => plan.tray.length;
  const target = (plan) => COLUMNS * plan.height;
  const needed = (plan) => target(plan) - plan.started;
  const remaining = (plan) => target(plan) - onBoard(plan);
  const spare = (plan) => SUPPLY - target(plan);
  const isComplete = (plan) => onBoard(plan) === target(plan);

  /* Where the next block goes: the shorter tower first, left on a tie, and
     always the lowest empty space in that tower, so a block never floats. */
  function nextSlot(plan) {
    if (isComplete(plan)) return null;
    const filled = plan.columns.map((c) => c.filter(Boolean).length);
    let column = 0;
    for (let c = 1; c < COLUMNS; c += 1) if (filled[c] < filled[column]) column = c;
    if (filled[column] >= plan.height) return null;
    return { column, row: filled[column] };
  }

  /* Moving one block. Pure: it answers with a new plan rather than editing the
     old one, so a test can hold both and compare.

     A block that is not on the tray - already moved, never existed, tapped
     twice - changes nothing at all. That is what makes a duplicate tap
     harmless and a rapid sequence of different blocks add up correctly. */
  function takeBlock(plan, blockId) {
    const slot = nextSlot(plan);
    const index = plan.tray.indexOf(blockId);
    if (slot === null || index === -1) return { plan, moved: false, slot: null };

    const columns = plan.columns.map((column, c) => {
      if (c !== slot.column) return column;
      const copy = column.slice();
      copy[slot.row] = blockId;
      return Object.freeze(copy);
    });
    const tray = plan.tray.slice();
    tray.splice(index, 1);

    const next = Object.freeze({
      height: plan.height,
      started: plan.started,
      supply: plan.supply,
      columns: Object.freeze(columns),
      tray: Object.freeze(tray),
      origin: plan.origin,
      moved: Object.freeze(plan.moved.concat([blockId]))
    });
    return { plan: next, moved: true, slot };
  }

  /* The invariants that must hold after every action, including doing nothing.
     Returned rather than thrown so a caller can report all of them at once. */
  function check(plan) {
    const problems = [];
    const board = onBoard(plan);

    if (board + onTray(plan) !== SUPPLY) {
      problems.push(`${board} on the board and ${onTray(plan)} on the tray is not ${SUPPLY}`);
    }
    if (board > target(plan)) problems.push(`${board} blocks are on a plan that asks for ${target(plan)}`);
    if (new Set(plan.moved).size !== plan.moved.length) problems.push("a block was moved more than once");
    if (plan.moved.length !== board - plan.started) {
      problems.push(`${plan.moved.length} moves produced ${board - plan.started} new blocks`);
    }

    const placed = plan.columns.flat().filter(Boolean);
    if (new Set(placed).size !== placed.length) problems.push("the same block is in two places");
    plan.columns.forEach((column, c) => {
      const gap = column.findIndex((slot) => !slot);
      if (gap !== -1 && column.slice(gap).some(Boolean)) {
        problems.push(`tower ${c + 1} has a block resting on an empty space`);
      }
    });
    const overlap = placed.filter((id) => plan.tray.includes(id));
    if (overlap.length) problems.push(`${overlap.join(", ")} is on the board and the tray at once`);

    if (plan.origin.length !== SUPPLY - plan.started) {
      problems.push(`the tray began with ${plan.origin.length} places, not ${SUPPLY - plan.started}`);
    }
    const strayed = plan.tray.filter((id) => !plan.origin.includes(id));
    if (strayed.length) problems.push(`${strayed.join(", ")} is on the tray but never started there`);

    return { ok: problems.length === 0, problems };
  }

  /* Said only after the plan is filled, and only about this plan. Never a
     score, and never shown before the child has had the chance to build. */
  function explanation(plan) {
    if (!isComplete(plan)) return null;
    return `Our plan uses ${plan.height} blocks and ${plan.height} blocks. `
      + `We already had ${plan.started}. We brought ${needed(plan)} more.`;
  }

  return {
    HEIGHTS, STARTED, SUPPLY, COLUMNS, VARIANTS,
    wordFor, sameVariant, chooseVariant,
    createPlan, startingColumns,
    onBoard, onTray, target, needed, remaining, spare, isComplete,
    nextSlot, takeBlock, check, explanation
  };
});
