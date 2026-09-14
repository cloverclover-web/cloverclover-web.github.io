/* The picnic's arithmetic, as the parent accepted it in the p5 preview.

   Two halves, deliberately separable:

     1. A pure model. Every reading has one fixed set of identified
        strawberries. They move between Bear's handful, the basket, Duck's
        plate and the little plates; nothing is ever created or destroyed, and
        the model answers with a new state rather than editing the old one, so
        a test can hold both and compare. Questions, known amounts, the three
        offered numbers and the strategy steps are all computed from the
        story's own task object, so nothing here invents quantities.

     2. A renderer that the real story engine calls instead of its own
        count-all card. It is handed the engine's helpers - the strawberry
        sprite, the speaker, the record store, the lifetime guard - so this is
        an integration, not a second copy of the book.

   The interaction is the accepted one: known amounts stay visible, three
   direct numerals are offered before anything moves, choosing one is optional
   and changeable, an explicit "let's check" opens the actual strawberries,
   they can be moved one at a time in any order or as the remaining group, and
   the factual result appears when the fruit shows it. A wrong, blank or
   guided answer reaches exactly the same check. There is no correctness gate
   and no claim that a guess was independent work.

   Numerals, never number words, for every quantity the child sees (L22).
   Above the fruit nothing changes length while fruit is moving (L04). */

(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.YoyoStoryMaths = api;
})(typeof self !== "undefined" ? self : (typeof globalThis !== "undefined" ? globalThis : null), function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* notation                                                            */
  /* ------------------------------------------------------------------ */

  const numeralFor = (n) => String(n);
  const plural = (n, one, many) => (n === 1 ? one : many);

  /* ------------------------------------------------------------------ */
  /* one reading's strawberries                                          */
  /* ------------------------------------------------------------------ */

  const idList = (prefix, count) =>
    Array.from({ length: count }, (unused, i) => `${prefix}${i + 1}`);

  function freeze(stock) {
    Object.freeze(stock.basket);
    Object.freeze(stock.extra);
    Object.freeze(stock.plate);
    stock.groups.forEach(Object.freeze);
    Object.freeze(stock.groups);
    Object.freeze(stock.addedByChild); Object.freeze(stock.addedByBear);
    Object.freeze(stock.servedByChild); Object.freeze(stock.servedByBear);
    Object.freeze(stock.placedByChild); Object.freeze(stock.placedByBunny);
    return Object.freeze(stock);
  }

  /* The basket the picnic starts with, and the handful Bear is carrying.
     Both are named once for the whole reading: b1 is the same strawberry on
     page 3 and page 5. */
  function createStock(session) {
    return freeze({
      seed: session ? session.seed : 0,
      basket: idList("b", session ? session.basketStart : 0),
      extra: idList("e", session ? session.tasks["page-3"].changeCount : 0),
      plate: [],
      groups: [],
      addedByChild: [], addedByBear: [],
      servedByChild: [], servedByBear: [],
      placedByChild: [], placedByBunny: []
    });
  }

  const flat = (lists) => lists.reduce((all, one) => all.concat(one), []);
  const inBasket = (s) => s.basket.length;
  const inExtra = (s) => s.extra.length;
  const onPlate = (s) => s.plate.length;
  const onGroups = (s) => flat(s.groups).length;
  const totalBerries = (s) => inBasket(s) + inExtra(s) + onPlate(s) + onGroups(s);

  const without = (list, id) => {
    const at = list.indexOf(id);
    return at === -1 ? null : list.slice(0, at).concat(list.slice(at + 1));
  };

  const next = (s, changes) => freeze({
    seed: s.seed,
    basket: s.basket, extra: s.extra, plate: s.plate, groups: s.groups,
    addedByChild: s.addedByChild, addedByBear: s.addedByBear,
    servedByChild: s.servedByChild, servedByBear: s.servedByBear,
    placedByChild: s.placedByChild, placedByBunny: s.placedByBunny,
    ...changes
  });

  /* One strawberry out of Bear's handful and into the basket. An id that is
     not in the handful - already moved, never real, tapped twice - changes
     nothing at all, which is what makes duplicate and rapid taps safe. */
  function addOne(stock, id, mover) {
    const extra = without(stock.extra, id);
    if (!extra) return { stock, moved: false };
    const byBear = mover === "bear";
    return {
      stock: next(stock, {
        extra,
        basket: stock.basket.concat([id]),
        addedByChild: byBear ? stock.addedByChild : stock.addedByChild.concat([id]),
        addedByBear: byBear ? stock.addedByBear.concat([id]) : stock.addedByBear
      }),
      moved: true
    };
  }

  /* The rest of the handful in one action: only what is still there, never
     the stated amount over again. */
  function addRest(stock, mover) {
    let now = stock;
    const moved = [];
    stock.extra.forEach((id) => {
      const step = addOne(now, id, mover);
      if (step.moved) { now = step.stock; moved.push(id); }
    });
    return { stock: now, moved };
  }

  /* One strawberry from the basket onto Duck's plate, up to the share the
     story asked for and no further. */
  function serveOne(stock, id, serving, mover) {
    if (onPlate(stock) >= serving) return { stock, moved: false };
    const basket = without(stock.basket, id);
    if (!basket) return { stock, moved: false };
    const byBear = mover === "bear";
    return {
      stock: next(stock, {
        basket,
        plate: stock.plate.concat([id]),
        servedByChild: byBear ? stock.servedByChild : stock.servedByChild.concat([id]),
        servedByBear: byBear ? stock.servedByBear.concat([id]) : stock.servedByBear
      }),
      moved: true
    };
  }

  function serveRest(stock, serving, mover) {
    let now = stock;
    const moved = [];
    while (onPlate(now) < serving && inBasket(now) > 0) {
      const step = serveOne(now, now.basket[0], serving, mover);
      if (!step.moved) break;
      now = step.stock;
      moved.push(now.plate[now.plate.length - 1]);
    }
    return { stock: now, moved };
  }

  /* The optional little plates. Each holds exactly perGroup, and they fill in
     order, so the equal-size structure is what the child sees. Whatever is not
     needed stays in the basket. */
  function startGroups(stock, groups) {
    if (stock.groups.length === groups) return stock;
    return next(stock, { groups: Array.from({ length: groups }, () => []) });
  }

  function placeOne(stock, id, perGroup, mover) {
    const target = stock.groups.findIndex((g) => g.length < perGroup);
    if (target === -1) return { stock, moved: false, group: -1 };
    const basket = without(stock.basket, id);
    if (!basket) return { stock, moved: false, group: -1 };
    const byBunny = mover === "bunny";
    const groups = stock.groups.map((g, i) => (i === target ? g.concat([id]) : g));
    return {
      stock: next(stock, {
        basket,
        groups,
        placedByChild: byBunny ? stock.placedByChild : stock.placedByChild.concat([id]),
        placedByBunny: byBunny ? stock.placedByBunny.concat([id]) : stock.placedByBunny
      }),
      moved: true,
      group: target
    };
  }

  function placeRest(stock, perGroup, mover) {
    let now = stock;
    const moved = [];
    for (;;) {
      if (!now.groups.some((g) => g.length < perGroup)) break;
      if (!inBasket(now)) break;
      const step = placeOne(now, now.basket[0], perGroup, mover);
      if (!step.moved) break;
      now = step.stock;
      moved.push(now.groups[step.group][now.groups[step.group].length - 1]);
    }
    return { stock: now, moved };
  }

  /* ------------------------------------------------------------------ */
  /* what each relation is asking, in starting-time language              */
  /* ------------------------------------------------------------------ */

  /* Every sentence above the strawberries is true from the moment the page
     opens until the child leaves it. The amounts that actually change - what
     is in the basket now, what is on the plate now - live in the labels below
     the fruit, where growing by a character cannot move a target. */

  const RELATIONS = ["combine", "takeaway", "groups"];
  const supports = (task) => Boolean(task) && RELATIONS.indexOf(task.relation) !== -1;

  const Ask = {
    /* Starting-time from the first word. "We have 12 in the basket" stops
       being true the moment the child moves one across, and correcting it
       afterwards would change the height of the text above the fruit they are
       still reaching for. What we STARTED with is true before, during and
       after the transfer, so this sentence never has to move. */
    combine: (a, b) => `We started with ${numeralFor(a)} strawberries in the basket, `
      + `and Bear brought ${numeralFor(b)} more. How many will we have altogether?`,
    /* Coming back after Duck has been served, the same starting amounts are a
       question about what happened rather than about what is still to come. */
    combined: (a, b) => `We started with ${numeralFor(a)} strawberries in the basket, `
      + `and Bear brought ${numeralFor(b)} more. How many did we have altogether?`,
    takeaway: (t, s) => `Before sharing, we had ${numeralFor(t)} strawberries in the `
      + `basket. If we give Duck ${numeralFor(s)}, how many will stay in the basket?`,
    groups: (p, g) => `Bunny fills ${numeralFor(g)} little plates from the basket, with `
      + `${numeralFor(p)} strawberries on each one. How many will be on the plates altogether?`
  };

  const sinceServed = (stock) => Boolean(stock) && onPlate(stock) > 0;

  function questionFor(task, stock) {
    if (task.relation === "combine") {
      return sinceServed(stock)
        ? Ask.combined(task.startCount, task.changeCount)
        : Ask.combine(task.startCount, task.changeCount);
    }
    if (task.relation === "takeaway") return Ask.takeaway(task.startCount, task.changeCount);
    return Ask.groups(task.perGroup, task.groups);
  }

  function givensFor(task, stock) {
    if (task.relation === "combine") {
      /* On a later visit the basket has had strawberries taken out of it, so
         what went to Duck is accounted for rather than quietly dropped. This
         is decided once, when the page is drawn, never during a transfer. */
      if (sinceServed(stock)) {
        return [
          { label: "in the basket at the start", value: task.startCount },
          { label: "Bear brought", value: task.changeCount },
          { label: "have since gone to Duck", value: onPlate(stock) }
        ];
      }
      return [
        { label: "in the basket at the start", value: task.startCount },
        { label: "Bear brought", value: task.changeCount }
      ];
    }
    if (task.relation === "takeaway") {
      return [
        { label: "in the basket before sharing", value: task.startCount },
        { label: "for Duck's share", value: task.changeCount }
      ];
    }
    return [
      { label: "little plates to fill", value: task.groups },
      { label: "on each plate", value: task.perGroup }
    ];
  }

  /* the two collections the child actually works with */
  function stageFor(task) {
    if (task.relation === "combine") {
      return {
        source: { key: "extra", label: "Bear is still holding" },
        destination: { key: "basket", label: "In the basket" },
        wanted: task.changeCount
      };
    }
    if (task.relation === "takeaway") {
      return {
        source: { key: "basket", label: "Left in the basket" },
        destination: { key: "plate", label: "On Duck's plate" },
        wanted: task.changeCount
      };
    }
    return {
      source: { key: "basket", label: "Left in the basket" },
      destination: { key: "groups", label: "On the little plates" },
      wanted: task.perGroup * task.groups
    };
  }

  /* What else is really somewhere else right now, other than the two groups
     this page is moving between. */
  function keptCollections(task, stock) {
    if (!stock) return [];
    const out = [];
    if (task.relation !== "takeaway" && onPlate(stock) > 0) {
      out.push({ key: "plate", label_: "On Duck's plate", ids: stock.plate });
    }
    if (task.relation !== "groups" && onGroups(stock) > 0) {
      out.push({ key: "groups", label_: "On the little plates", ids: flat(stock.groups) });
    }
    return out;
  }

  const movedSoFar = (task, stock) => {
    if (task.relation === "combine") return stock.addedByChild.length + stock.addedByBear.length;
    if (task.relation === "takeaway") return onPlate(stock);
    return onGroups(stock);
  };

  const complete = (task, stock) => movedSoFar(task, stock) >= stageFor(task).wanted;

  function groupActionLabel(task, stock) {
    const left = stageFor(task).wanted - movedSoFar(task, stock);
    if (task.relation === "combine") return `Bring all ${numeralFor(left)} across`;
    if (task.relation === "takeaway") return `Give Duck ${numeralFor(left)}`;
    return `Put ${numeralFor(left)} on the plates`;
  }

  /* The completed sentence, and only once the strawberries have shown it. */
  function equationFor(task) {
    if (task.relation === "combine") {
      return `${numeralFor(task.startCount)} + ${numeralFor(task.changeCount)} = ${numeralFor(task.answer)}`;
    }
    if (task.relation === "takeaway") {
      return `${numeralFor(task.startCount)} - ${numeralFor(task.changeCount)} = ${numeralFor(task.answer)}`;
    }
    return `${Array(task.groups).fill(numeralFor(task.perGroup)).join(" + ")} = ${numeralFor(task.answer)}`;
  }

  const earlierBasketFor = (total) =>
    `Before sharing, we had ${numeralFor(total)} strawberries in the basket.`;

  function resultFor(task, stock) {
    if (task.relation === "combine") {
      if (sinceServed(stock)) return earlierBasketFor(task.answer);
      return `${numeralFor(task.answer)} strawberries in the basket altogether.`;
    }
    if (task.relation === "takeaway") {
      return `${numeralFor(task.answer)} strawberries stayed in the basket, and Duck has `
        + `${numeralFor(task.changeCount)}.`;
    }
    return `${numeralFor(task.answer)} strawberries on the plates, and every plate has the same.`;
  }

  const comparisonFor = (said, answer) =>
    `You thought ${numeralFor(said)}. We found ${numeralFor(answer)}.`;

  const bearNoteFor = (count) =>
    `Bear lifted the last ${numeralFor(count)} into the basket himself.`;

  const bunnyNoteFor = (count) =>
    `Bunny set out the last ${numeralFor(count)} on the plates herself.`;

  /* ------------------------------------------------------------------ */
  /* three direct numbers                                                */
  /* ------------------------------------------------------------------ */

  /* Three neighbouring amounts, one of them true. Unique, inside 0-20, and
     fixed for this task: help, Back, a changed mind and every transfer see
     the same three. The true one is not always in the same place, and it is
     never marked. */
  function answerChoices(task) {
    const answer = task.answer;
    const lowest = Math.max(0, Math.min(18, answer - 1));
    const values = [lowest, lowest + 1, lowest + 2];
    const offset = positionOffset(task);
    return values.slice(offset).concat(values.slice(0, offset));
  }

  function positionOffset(task) {
    const relation = RELATIONS.indexOf(task.relation);
    const a = task.relation === "groups" ? task.perGroup : task.startCount;
    const b = task.relation === "groups" ? task.groups : task.changeCount;
    return ((a + 2 * b + 2 * relation) % 3 + 3) % 3;
  }

  /* ------------------------------------------------------------------ */
  /* one way to work it out                                              */
  /* ------------------------------------------------------------------ */

  /* Steps are requested one at a time. The first names the relationship and
     leaves the sum unsolved; the later ones, deliberately asked for, may show
     the calculation. Each step can carry the actual groups it is talking
     about, so "10 and 2" is drawn as ten strawberries beside two. Those
     pictures are diagrams: helping never moves a real strawberry. */

  const step = (text, symbols, parts, roles) => ({ text, symbols, parts: parts || null, roles: roles || null });

  function additionHelp(a, b) {
    const sum = a + b;
    const steps = [step(
      `We are putting both groups together: ${numeralFor(a)} in the basket and `
        + `${numeralFor(b)} more. Altogether means both groups counted as one.`,
      `${a} + ${b} = ?`
    )];

    if (a === 10) {
      steps.push(step(
        `10 and ${numeralFor(b)} make ${numeralFor(sum)}.`,
        `10 + ${b} = ${sum}`,
        [10, b], ["the 10 we had", "the ones Bear brought"]
      ));
    } else if (a > 10) {
      const ones = a - 10;
      steps.push(step(
        `${numeralFor(a)} is 10 and ${numeralFor(ones)}.`,
        `${a} = 10 + ${ones}`,
        [10, ones], ["a 10", "the ones left over"]
      ));
      steps.push(step(
        `${numeralFor(ones)} and ${numeralFor(b)} make ${numeralFor(ones + b)}.`,
        `${ones} + ${b} = ${ones + b}`,
        [ones, b], ["the ones left over", "the ones Bear brought"]
      ));
      steps.push(step(
        `10 and ${numeralFor(ones + b)} make ${numeralFor(sum)}.`,
        `10 + ${ones + b} = ${sum}`,
        [10, ones + b], ["the 10", "all the ones together"]
      ));
    } else {
      const need = 10 - a;
      const left = b - need;
      steps.push(step(
        `${numeralFor(a)} needs ${numeralFor(need)} more to make 10.`,
        `${a} + ${need} = 10`,
        [a, need], ["in the basket", "moved across to make 10"]
      ));
      steps.push(step(
        `Take ${numeralFor(need)} of the ${numeralFor(b)}. `
          + `${numeralFor(left)} ${plural(left, "is", "are")} left.`,
        `${b} - ${need} = ${left}`,
        [need, left], ["moved across", "still in Bear's handful"]
      ));
      steps.push(step(
        `10 and ${numeralFor(left)} make ${numeralFor(sum)}.`,
        `10 + ${left} = ${sum}`,
        [10, left], ["the 10 we made", "the ones left over"]
      ));
    }
    return steps;
  }

  /* Taking the same amount away again is only honest when this reading really
     did add exactly that amount, and it really finished. Otherwise the scene
     gets a known-ten method rather than an invented earlier event. */
  function inverseAvailable(task, history) {
    return Boolean(history)
      && task.relation === "takeaway"
      && history.additionComplete === true
      && history.addedStart === task.startCount - history.addedChange
      && history.addedChange === task.changeCount;
  }

  function subtractionHelp(sum, take, history, task) {
    const left = sum - take;

    if (task && inverseAvailable(task, history)) {
      return [
        step(
          `We added ${numeralFor(history.addedChange)} to ${numeralFor(history.addedStart)}. `
            + `What happens if we take ${numeralFor(take)} away again?`,
          `${history.addedStart} + ${history.addedChange} = ${sum}, so ${sum} - ${take} = ?`
        ),
        step(
          `Taking away the same ${numeralFor(take)} undoes what we added. `
            + `We are back at ${numeralFor(left)}.`,
          `${sum} - ${take} = ${left}`,
          [left, take], ["what we started with", "the ones we added, given away again"]
        )
      ];
    }

    const ones = sum - 10;
    const steps = [step(
      `We are taking away part of what we have: ${numeralFor(take)} from ${numeralFor(sum)}.`,
      `${sum} - ${take} = ?`
    )];
    steps.push(step(
      `${numeralFor(sum)} is 10 and ${numeralFor(ones)}.`,
      `${sum} = 10 + ${ones}`,
      [10, ones], ["a 10", "the ones left over"]
    ));
    if (take === ones) {
      steps.push(step(
        `Taking ${numeralFor(take)} uses up all the ones. Just the 10 is left.`,
        `${sum} - ${take} = 10`
      ));
    } else if (take < ones) {
      steps.push(step(
        `${numeralFor(ones)} take away ${numeralFor(take)} is ${numeralFor(ones - take)}.`,
        `${ones} - ${take} = ${ones - take}`,
        [take, ones - take], ["given to Duck", "ones still in the basket"]
      ));
      steps.push(step(
        `10 and ${numeralFor(ones - take)} make ${numeralFor(left)}.`,
        `10 + ${ones - take} = ${left}`,
        [10, ones - take], ["the 10", "the ones left"]
      ));
    } else {
      const rest = take - ones;
      steps.push(step(
        `Take the ${numeralFor(ones)} first. That leaves 10, and `
          + `${numeralFor(rest)} still to take.`,
        `${sum} - ${ones} = 10`
      ));
      steps.push(step(
        `10 take away ${numeralFor(rest)} is ${numeralFor(left)}.`,
        `10 - ${rest} = ${left}`
      ));
    }
    return steps;
  }

  /* Equal plates are added up plate by plate, never with a multiplication
     sign: this is the step from "3 and 3 is 6" to "two plates of 3 is 6". */
  function groupsHelp(perGroup, groups) {
    const steps = [step(
      `Every plate has the same ${numeralFor(perGroup)}, and there are `
        + `${numeralFor(groups)} plates.`,
      `${Array(groups).fill(perGroup).join(" + ")} = ?`,
      Array(groups).fill(perGroup),
      Array.from({ length: groups }, (unused, i) => `plate ${i + 1}`)
    )];
    let running = perGroup;
    for (let g = 2; g <= groups; g += 1) {
      const before = running;
      running += perGroup;
      steps.push(step(
        `${numeralFor(before)} and ${numeralFor(perGroup)} more make ${numeralFor(running)}.`,
        `${before} + ${perGroup} = ${running}`,
        [before, perGroup],
        [`the first ${numeralFor(g - 1)} ${plural(g - 1, "plate", "plates")}`, `plate ${g}`]
      ));
    }
    return steps;
  }

  function helpFor(task, history) {
    if (task.relation === "combine") return additionHelp(task.startCount, task.changeCount);
    if (task.relation === "takeaway") return subtractionHelp(task.startCount, task.changeCount, history, task);
    return groupsHelp(task.perGroup, task.groups);
  }

  /* ------------------------------------------------------------------ */
  /* the bounded catalogue of everything new that is spoken               */
  /* ------------------------------------------------------------------ */

  /* Only lines this module can actually speak. Buttons and labels are read,
     not narrated, so they are not in here. */
  function enumerateTexts(banks) {
    const lines = new Set();
    const add = (t) => { if (t) lines.add(String(t).trim()); };
    const forTask = (task, history) => {
      add(questionFor(task));
      helpFor(task, history).forEach((s) => add(s.text));
      add(resultFor(task));
      answerChoices(task).forEach((n) => add(comparisonFor(n, task.answer)));
    };

    banks.add.forEach((c) => {
      const task = {
        relation: "combine", startCount: c.start, changeCount: c.change, answer: c.start + c.change
      };
      forTask(task, null);
      /* the same question as it is asked on a later visit, once some of the
         basket has gone to Duck */
      add(Ask.combined(c.start, c.change));
      add(earlierBasketFor(task.answer));
      add(bearNoteFor(c.change));
    });
    for (let n = 1; n <= 9; n += 1) add(bearNoteFor(n));

    Object.keys(banks.subtract).forEach((startText) => {
      const start = Number(startText);
      banks.subtract[startText].forEach((change) => {
        const task = {
          relation: "takeaway", startCount: start, changeCount: change, answer: start - change
        };
        /* both the plain method and the honest inverse callback */
        forTask(task, null);
        banks.add.forEach((c) => {
          if (c.start + c.change !== start || c.change !== change) return;
          const history = { additionComplete: true, addedStart: c.start, addedChange: c.change };
          subtractionHelp(start, change, history, task).forEach((s) => add(s.text));
        });
      });
    });

    Object.keys(REPLACED_LINES).forEach((old) => add(REPLACED_LINES[old]));

    banks.groups.forEach((c) => {
      const task = {
        relation: "groups", perGroup: c.perGroup, groups: c.groups, answer: c.total
      };
      forTask(task, null);
      for (let n = 1; n <= c.total; n += 1) add(bunnyNoteFor(n));
    });

    return Array.from(lines).sort();
  }

  /* ------------------------------------------------------------------ */
  /* renderer                                                            */
  /* ------------------------------------------------------------------ */

  /* host supplies the engine's own helpers, so this draws inside the real
     book rather than beside it:
       el, fillBerry, speak, noteTask, advance, offerExtras, fresh, stillValid,
       book, plateArt */
  function attach(host) {
    const el = host.el;
    const all = (node, sel) => Array.from(node.querySelectorAll(sel));

    /* ---------------------------------------------------------------- */

    function buildCard(task, options) {
      const opts = options || {};
      const mark = host.fresh();
      const book = host.book;
      const stage = stageFor(task);
      const choices = answerChoices(task);

      /* per-page working state; the fruit itself lives in book.stock */
      const seen = book.mathsState || (book.mathsState = {});
      const key = task.taskId;
      const local = seen[key] || (seen[key] = {
        said: null, checked: false, helpStep: 0, guided: false, replays: 0, noted: false
      });

      if (task.relation === "groups") {
        book.stock = startGroups(book.stock, task.groups);
      }

      const card = el("div", "task smaths");
      /* one question, named both ways: it is the card's prompt and it is the
         question this page is asking */
      const prompt = el("p", "task-prompt smaths-question");
      prompt.textContent = questionFor(task, book.stock);
      card.append(prompt);

      /* the known amounts: drawn once, never during a move */
      const givens = el("ul", "smaths-givens");
      givensFor(task, book.stock).forEach((given) => {
        const item = el("li", "smaths-given");
        item.dataset.group = given.label;
        item.dataset.count = String(given.value);
        const value = el("b");
        value.textContent = numeralFor(given.value);
        const words = el("span");
        words.textContent = ` ${given.label}`;
        item.append(value, words);
        givens.append(item);
      });
      card.append(givens);

      /* ---- three direct numbers, optional and changeable -------------- */

      const predict = el("div", "smaths-predict");
      const predictHint = el("p", "smaths-predict-hint");
      predictHint.textContent = "What do you think the answer will be? "
        + "You can choose a number, or go straight to the strawberries.";
      predict.append(predictHint);
      const grid = el("div", "smaths-choices");
      grid.setAttribute("role", "group");
      grid.setAttribute("aria-label", "Three numbers to choose from");
      const said = el("p", "smaths-said");
      said.setAttribute("aria-live", "polite");

      function renderChoices() {
        grid.innerHTML = "";
        choices.forEach((n) => {
          const btn = el("button", "smaths-choice", numeralFor(n));
          btn.type = "button";
          btn.dataset.value = String(n);
          btn.setAttribute("aria-pressed", local.said === n ? "true" : "false");
          btn.disabled = local.checked;
          btn.addEventListener("click", () => {
            if (!host.stillValid(mark) || local.checked) return;
            if (choices.indexOf(n) === -1) return;
            local.said = n;
            renderChoices();
            const chosen = all(grid, ".smaths-choice").find((b) => b.dataset.value === String(n));
            if (chosen && chosen.focus) chosen.focus();
          });
          grid.append(btn);
        });
        said.textContent = local.said === null ? ""
          : (local.checked
            ? `Your idea: ${numeralFor(local.said)}.`
            : `Your idea: ${numeralFor(local.said)}. You can change it.`);
      }
      renderChoices();
      predict.append(grid, said);
      card.append(predict);

      /* ---- one way to work it out ------------------------------------ */

      const helpSteps = helpFor(task, book.mathsHistory || null);
      const help = el("details", "smaths-help");
      const helpSummary = el("summary", "smaths-help-toggle", "Show me a way");
      helpSummary.id = `smathsHelp-${key}`;
      const helpBody = el("div", "smaths-help-body");
      const helpLabel = el("p", "smaths-help-label");
      helpLabel.textContent = "One way to work it out";
      helpBody.append(helpLabel);
      const helpList = el("ol", "smaths-help-steps");
      const helpControls = el("div", "smaths-help-controls");
      helpBody.append(helpList, helpControls);
      help.append(helpSummary, helpBody);

      function renderHelp() {
        helpList.innerHTML = "";
        helpSteps.slice(0, local.helpStep).forEach((s) => {
          const item = el("li", "smaths-help-step");
          const text = el("span", "smaths-help-text");
          text.textContent = s.text;
          const symbols = el("span", "smaths-help-symbols");
          symbols.textContent = s.symbols;
          item.append(text, symbols);
          if (s.parts) {
            const groupsRow = el("span", "smaths-help-parts");
            s.parts.forEach((amount, i) => {
              const part = el("span", "smaths-help-part");
              part.dataset.helpPart = String(amount);
              if (s.roles && s.roles[i]) part.dataset.helpRole = s.roles[i];
              const fruit = el("span", "smaths-help-fruit");
              for (let n = 0; n < amount; n += 1) {
                const sprite = el("span", "smaths-help-berry");
                host.fillBerry(sprite);
                fruit.append(sprite);
              }
              const shown = el("span", "smaths-help-count");
              shown.textContent = numeralFor(amount);
              part.append(fruit, shown);
              groupsRow.append(part);
            });
            item.append(groupsRow);
          }
          helpList.append(item);
        });

        helpControls.innerHTML = "";
        if (local.helpStep > 0 && local.helpStep < helpSteps.length) {
          const more = el("button", "btn btn-secondary", "Show the next step");
          more.type = "button";
          more.dataset.help = "next";
          more.addEventListener("click", () => {
            if (!host.stillValid(mark)) return;
            /* a control kept from an earlier step cannot walk off the end of
               a finite worked example */
            if (local.helpStep >= helpSteps.length) return;
            local.helpStep += 1;
            local.guided = true;
            renderHelp();
            const again = helpControls.querySelector("[data-help]");
            if (again && again.focus) again.focus();
            else if (helpSummary.focus) helpSummary.focus();
            host.speak(helpSteps[local.helpStep - 1].text);
          });
          helpControls.append(more);
        }
      }

      /* opening the panel supplies the first step at once: an open panel with
         nothing in it is not help */
      help.addEventListener("toggle", () => {
        if (!host.stillValid(mark)) return;
        if (!help.open) return;
        if (local.helpStep === 0) {
          local.helpStep = 1;
          renderHelp();
          host.speak(helpSteps[0].text);
        }
      });
      help.open = local.helpStep > 0;
      renderHelp();
      card.append(help);

      /* ---- the strawberries themselves -------------------------------- */

      /* Source before destination in the document. On a narrow screen these
         stack, and a destination that gains a row above the source pushes the
         source out from under a finger already reaching for it. */
      const work = el("div", "smaths-work");
      const sourceGroup = el("div", "smaths-group smaths-source");
      const sourceLabel = el("p", "smaths-group-label");
      const sourceBerries = el("div", "smaths-berries");
      sourceBerries.setAttribute("role", "group");
      sourceGroup.append(sourceLabel, sourceBerries);

      const destGroup = el("div", "smaths-group smaths-destination");
      const destLabel = el("p", "smaths-group-label");
      /* Three destinations, three shapes of thing: a growing row of fruit,
         one painted dish, or a row of little painted dishes. A plate is not a
         berry cell, so the plates do not inherit the berry grid. */
      const destClass = task.relation === "takeaway" ? "smaths-dish"
        : task.relation === "groups" ? "smaths-plates" : "smaths-berries";
      const destHost = el("div", destClass);
      if (task.relation === "takeaway") destHost.classList.add("smaths-plate-area");
      destGroup.append(destLabel, destHost);

      /* Every collection this page is NOT working with, but which really
         exists right now. Going back must never make a strawberry that is
         somewhere disappear from view, whether it went to Duck or onto the
         little plates. These are pictures of what is there, not controls, and
         they are drawn once when the page opens. */
      const keptGroups = keptCollections(task, book.stock).map((collection) => {
        const box = el("div", "smaths-group smaths-kept");
        box.dataset.kept = collection.key;
        const label = el("p", "smaths-group-label");
        const fruit = el("div", "smaths-berries smaths-kept-berries");
        fruit.setAttribute("role", "group");
        box.append(label, fruit);
        return { ...collection, box, label, fruit };
      });

      work.append(sourceGroup, destGroup);
      keptGroups.forEach((collection) => work.append(collection.box));
      const actions = el("div", "task-actions");
      const result = el("p", "smaths-result");
      result.setAttribute("aria-live", "polite");
      const compare = el("p", "smaths-compare");
      const note = el("p", "smaths-note");
      note.setAttribute("aria-live", "polite");
      card.append(work, note, result, compare, actions);

      /* Duck's plate is a painted dish with the given fruit inside its blank
         middle; the little plates are the same dish repeated. */
      let plateFruit = null;
      if (task.relation === "takeaway") {
        const dish = el("div", "smaths-plate");
        if (host.plateArt) {
          const img = new host.Image();
          img.className = "smaths-plate-art";
          img.alt = "";
          img.draggable = false;
          img.src = "assets/story/empty-plate.png";
          dish.append(img);
        }
        plateFruit = el("div", "smaths-berries smaths-plate-berries");
        plateFruit.setAttribute("role", "group");
        dish.append(plateFruit);
        destHost.append(dish);
      }

      /* one button per strawberry in the source, laid out once and then
         emptied in place: a place that has been emptied keeps its own square */
      const slotOf = new Map();
      const buttonOf = new Map();

      function layOutSource() {
        sourceBerries.innerHTML = "";
        slotOf.clear();
        buttonOf.clear();
        sourceIdsAtStart().forEach((id) => {
          const slot = el("div", "smaths-slot");
          slot.dataset.slot = id;
          const btn = el("button", "smaths-berry");
          btn.type = "button";
          btn.dataset.berry = id;
          btn.setAttribute("aria-label", "take this strawberry");
          host.fillBerry(btn);
          btn.addEventListener("click", () => takeOne(id));
          slot.append(btn);
          sourceBerries.append(slot);
          slotOf.set(id, slot);
          buttonOf.set(id, btn);
        });
      }

      /* Which strawberries this page's source began with. Coming back to a
         page shows the same places, including the ones already emptied. */
      function sourceIdsAtStart() {
        if (local.sourceIds) return local.sourceIds;
        const stock = book.stock;
        if (task.relation === "combine") {
          local.sourceIds = stock.extra.concat(stock.addedByChild, stock.addedByBear);
        } else if (task.relation === "takeaway") {
          local.sourceIds = stock.basket.concat(stock.plate);
        } else {
          local.sourceIds = stock.basket.concat(flat(stock.groups));
        }
        return local.sourceIds;
      }

      function currentSource() {
        const stock = book.stock;
        return stage.source.key === "extra" ? stock.extra : stock.basket;
      }

      /* What the destination is actually holding. Joining two lots together
         shows the WHOLE basket, not only the handful being carried across:
         the question is about how many there will be altogether, so the
         strawberries already in the basket have to be there to be counted
         with the new ones. */
      function destinationIds() {
        const stock = book.stock;
        if (task.relation === "combine") return stock.basket;
        if (task.relation === "takeaway") return stock.plate;
        return flat(stock.groups);
      }

      /* ---- drawing what is there now ---------------------------------- */

      function refreshSource() {
        const live = currentSource();
        sourceIdsAtStart().forEach((id) => {
          const slot = slotOf.get(id);
          const btn = buttonOf.get(id);
          if (!slot || !btn) return;
          const present = live.indexOf(id) !== -1;
          slot.classList.toggle("is-empty", !present);
          btn.hidden = !present;
          btn.disabled = !present || done();
        });
      }

      function fillDestination() {
        const ids = destinationIds();
        if (task.relation === "takeaway") {
          const drawn = all(plateFruit, ".smaths-berry").length;
          for (let i = drawn; i < ids.length; i += 1) {
            const sprite = el("div", "smaths-berry is-still");
            sprite.dataset.berry = ids[i];
            host.fillBerry(sprite);
            plateFruit.append(sprite);
          }
          plateFruit.style.setProperty("--plate-columns", String(plateColumns(ids.length)));
          return;
        }
        if (task.relation === "combine") {
          const drawn = all(destHost, ".smaths-berry").length;
          for (let i = drawn; i < ids.length; i += 1) {
            const sprite = el("div", "smaths-berry is-still");
            sprite.dataset.berry = ids[i];
            host.fillBerry(sprite);
            destHost.append(sprite);
          }
          return;
        }
        /* the little plates, in order, each with its own dish */
        if (!all(destHost, ".smaths-little-plate").length) {
          for (let g = 0; g < task.groups; g += 1) {
            const plate = el("div", "smaths-little-plate");
            plate.dataset.plate = String(g + 1);
            const plateLabel = el("span", "smaths-plate-label");
            plateLabel.textContent = `Plate ${numeralFor(g + 1)}`;
            plate.append(plateLabel);
            const dish = el("div", "smaths-plate");
            if (host.plateArt) {
              const img = new host.Image();
              img.className = "smaths-plate-art";
              img.alt = "";
              img.draggable = false;
              img.src = "assets/story/empty-plate.png";
              dish.append(img);
            }
            const fruit = el("div", "smaths-berries smaths-plate-berries");
            fruit.setAttribute("role", "group");
            dish.append(fruit);
            plate.append(dish);
            destHost.append(plate);
          }
        }
        book.stock.groups.forEach((ids2, g) => {
          const plate = all(destHost, ".smaths-little-plate")[g];
          if (!plate) return;
          const fruit = plate.querySelector(".smaths-plate-berries");
          const drawn = all(fruit, ".smaths-berry").length;
          for (let i = drawn; i < ids2.length; i += 1) {
            const sprite = el("div", "smaths-berry is-still");
            sprite.dataset.berry = ids2[i];
            host.fillBerry(sprite);
            fruit.append(sprite);
          }
          fruit.style.setProperty("--plate-columns", String(plateColumns(ids2.length)));
        });
      }

      function countOf(key) {
        const stock = book.stock;
        if (key === "extra") return inExtra(stock);
        if (key === "basket") return inBasket(stock);
        if (key === "plate") return onPlate(stock);
        return onGroups(stock);
      }

      function refreshLabels() {
        sourceLabel.textContent = `${stage.source.label}: ${numeralFor(countOf(stage.source.key))}`;
        destLabel.textContent = `${stage.destination.label}: ${numeralFor(countOf(stage.destination.key))}`;
        keptGroups.forEach((collection) => {
          collection.label.textContent = `${collection.label_}: ${numeralFor(collection.ids.length)}`;
        });
      }

      /* drawn once when the page opens: these collections are not being
         changed here, so nothing about them moves while the child is working */
      function fillKept() {
        keptGroups.forEach((collection) => {
          const drawn = all(collection.fruit, ".smaths-berry").length;
          collection.ids.forEach((id, i) => {
            if (i < drawn) return;
            const sprite = el("div", "smaths-berry is-still");
            sprite.dataset.berry = id;
            host.fillBerry(sprite);
            collection.fruit.append(sprite);
          });
        });
      }

      const done = () => complete(task, book.stock);

      function refreshWork() {
        refreshSource();
        fillDestination();
        fillKept();
        refreshLabels();
        renderActions();
        if (done()) showResult();
      }

      /* ---- moving ------------------------------------------------------ */

      function apply(step2) {
        if (!step2.moved && !(step2.moved === undefined && step2.movedList)) return false;
        book.stock = step2.stock;
        return true;
      }

      function takeOne(id) {
        if (!host.stillValid(mark) || !local.checked || done()) return;
        let outcome;
        if (task.relation === "combine") outcome = addOne(book.stock, id, "child");
        else if (task.relation === "takeaway") outcome = serveOne(book.stock, id, task.changeCount, "child");
        else outcome = placeOne(book.stock, id, task.perGroup, "child");
        if (!outcome.moved) return;
        book.stock = outcome.stock;
        refreshWork();
      }

      function takeRest() {
        if (!host.stillValid(mark) || !local.checked || done()) return;
        let outcome;
        if (task.relation === "combine") outcome = addRest(book.stock, "child");
        else if (task.relation === "takeaway") outcome = serveRest(book.stock, task.changeCount, "child");
        else outcome = placeRest(book.stock, task.perGroup, "child");
        if (!outcome.moved.length) return;
        book.stock = outcome.stock;
        refreshWork();
      }

      /* ---- the factual result ------------------------------------------ */

      let shown = false;
      function showResult() {
        if (shown) return;
        shown = true;
        const spokenResult = resultFor(task, book.stock);
        const useNow = task.relation === "combine" && sinceServed(book.stock) ? null : task.storyUse;
        result.textContent = spokenResult;
        const sum = el("span", "smaths-equation");
        sum.textContent = equationFor(task);
        const gap = el("span");
        gap.textContent = " ";
        result.append(gap, sum);
        if (useNow) {
          const use = el("span", "smaths-use");
          use.textContent = ` ${useNow}`;
          result.append(use);
        }
        compare.textContent = local.said === null ? "" : comparisonFor(local.said, task.answer);

        /* attempted and finished, never recorded as an independent success:
           three offered numbers can be guessed, and a requested worked example
           is guided work */
        if (!local.noted && host.noteTask) {
          local.noted = true;
          host.noteTask({ taskId: task.taskId, skill: "maths", name: equationFor(task) }, {
            solo: false,
            attempts: 1,
            hintsUsed: local.helpStep,
            skipped: false
          });
        }
        host.speakInOrder(spokenResult, useNow);
        renderActions();
      }

      /* ---- the controls ------------------------------------------------ */

      function renderActions() {
        actions.innerHTML = "";

        if (!local.checked) {
          const check = el("button", "btn btn-primary", "Let's check with the strawberries");
          check.type = "button";
          check.addEventListener("click", () => {
            if (!host.stillValid(mark) || local.checked) return;
            local.checked = true;
            renderChoices();
            work.classList.add("is-open");
            layOutSource();
            refreshWork();
          });
          actions.append(check);
        } else if (!done()) {
          const group = el("button", "btn btn-secondary", groupActionLabel(task, book.stock));
          group.type = "button";
          group.dataset.groupMove = "1";
          group.addEventListener("click", takeRest);
          actions.append(group);
        }

        const listen = el("button", "btn btn-secondary", "Hear it again");
        listen.type = "button";
        listen.addEventListener("click", () => {
          if (!host.stillValid(mark)) return;
          local.replays += 1;
          if (host.noteReplay) host.noteReplay();
          host.speak(questionFor(task, book.stock));
        });
        actions.append(listen);

        if (done()) {
          const on = el("button", "btn btn-primary", opts.standalone ? "Back to the story" : "Turn the page");
          on.type = "button";
          on.addEventListener("click", () => {
            if (!host.stillValid(mark)) return;
            host.advance();
          });
          actions.append(on);
          if (!opts.standalone && host.offerExtras) host.offerExtras(actions, task);
        } else {
          const skip = el("button", "btn btn-quiet", opts.standalone ? "Back to the story" : "Read on");
          skip.type = "button";
          skip.addEventListener("click", () => {
            if (!host.stillValid(mark)) return;
            host.advance();
          });
          actions.append(skip);
        }
      }

      /* ---- opening this page ------------------------------------------- */

      if (local.checked) {
        work.classList.add("is-open");
        layOutSource();
        refreshWork();
      } else {
        fillKept();
        refreshLabels();
        renderActions();
      }

      /* If a character finished a transfer on the way to this page, the page
         itself reads that line aloud and captions it, so it is not lost in a
         listening-only reading. The card shows the same words in writing and
         does not say them a second time, and it does not consume them - going
         back to this page still says what really happened. */
      if (book.mathsNote && (!opts.pageId || book.mathsNotePage === opts.pageId)) {
        note.textContent = book.mathsNote;
      }

      host.speak(questionFor(task, book.stock));
      return card;
    }

    return { buildCard };
  }

  /* As square a block as the amount allows, so a plateful fits inside a round
     dish rather than running across its rim. */
  function plateColumns(count) {
    return Math.max(1, Math.ceil(Math.sqrt(Math.max(count, 1))));
  }

  /* ------------------------------------------------------------------ */
  /* one narration line the new interaction contradicts                   */
  /* ------------------------------------------------------------------ */

  /* The delivered page 3 ends by telling the child to put them all in and
     count them together, which is exactly the instruction the parent's report
     was about. The candidate says the same thing in a way that leads into the
     question instead of answering it with counting. The delivered book is not
     edited: this only applies where the module is loaded. */
  const REPLACED_LINES = {
    "Let us put them all in and count them together.":
      "Let us work out how many that will be, said Bear."
  };

  const lineFor = (line) => REPLACED_LINES[String(line).trim()] || line;

  /* ------------------------------------------------------------------ */
  /* leaving a page with work unfinished                                  */
  /* ------------------------------------------------------------------ */

  /* The sharing scene needs the whole supply before it can begin. If the
     child reads on with strawberries still in Bear's handful, Bear finishes
     that transfer himself and it is said out loud - it is his action, and it
     is never counted as the child's. */
  function settle(book, pageId, session) {
    if (!book.stock || !session) return null;
    const order = ["page-1", "page-2", "page-3", "page-4", "page-5", "page-6"];
    /* Not on the rain page: that page has no arithmetic on it and is not the
       place to say what happened to the basket. The sharing is the first page
       that actually needs the whole supply. */
    if (order.indexOf(pageId) < order.indexOf("page-5")) return null;
    if (!inExtra(book.stock)) return null;
    const count = inExtra(book.stock);
    const finished = addRest(book.stock, "bear");
    book.stock = finished.stock;
    const line = bearNoteFor(count);
    book.mathsNote = line;
    /* the page it belongs to, so it is read aloud and captioned on that page
       even in a reading with no cards in it at all */
    book.mathsNotePage = pageId;
    return line;
  }

  return {
    numeralFor, RELATIONS, supports, REPLACED_LINES, lineFor,
    createStock, addOne, addRest, serveOne, serveRest,
    startGroups, placeOne, placeRest,
    inBasket, inExtra, onPlate, onGroups, totalBerries,
    stageFor, keptCollections, movedSoFar, complete, groupActionLabel,
    questionFor, givensFor, equationFor, resultFor, comparisonFor,
    bearNoteFor, bunnyNoteFor,
    answerChoices, positionOffset,
    additionHelp, subtractionHelp, groupsHelp, helpFor, inverseAvailable,
    plateColumns, enumerateTexts, settle, attach
  };
});
