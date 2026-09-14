/* Equal-scoop story model. No storage, scoring, child profiling or live AI. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.JuiceModel = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const FRIENDS = ["Bunny", "Bear", "Duck"];
  const RECIPES = [[1, 1], [2, 1], [1, 2], [2, 2], [2, 1], [1, 2]];
  const FRUIT = {
    apple: { name: "apple", colour: "green", image: "assets/juice/apple-v1.png", juice: "apple juice" },
    orange: { name: "orange", colour: "orange", image: "assets/juice/orange-v1.png", juice: "orange juice" },
    strawberry: { name: "strawberry", colour: "red", image: "assets/story/strawberry.png", juice: null }
  };
  const JUICES = {
    apple: { name: "apple juice", image: "assets/juice/apple-juice-v1.png" },
    orange: { name: "orange juice", image: "assets/juice/orange-juice-v1.png" }
  };
  const COLOURS = { pink: "#d58b9f", blue: "#91b5ca", green: "#9faf89" };
  const copy = (v) => JSON.parse(JSON.stringify(v));
  const sum = (v) => Object.values(v).reduce((a, b) => a + b, 0);
  function options(answer, rotation) {
    const values = [Math.max(0, answer - 1), answer, answer + 2];
    const k = rotation % 3;
    return values.slice(k).concat(values.slice(0, k));
  }
  function variant(index) {
    const id = ((index % RECIPES.length) + RECIPES.length) % RECIPES.length;
    const [juice, water] = RECIPES[id];
    const own = FRIENDS.map((name, i) => {
      const pair = RECIPES[(id + i + 1) % RECIPES.length];
      return { name, flavour: (id + i) % 2 ? "apple" : "orange", juice: pair[0], water: pair[1] };
    });
    const stock = { apple: juice * 3 + 2, orange: juice * 3 + 2, water: Math.max(water * 3, own.reduce((n, r) => n + r.water, 0)) + 2 };
    for (const flavour of ["apple", "orange"]) stock[flavour] = Math.max(stock[flavour], own.filter((r) => r.flavour === flavour).reduce((n, r) => n + r.juice, 0) + 2);
    return { id, juice, water, each: juice + water, total: (juice + water) * 3, own, stock, choices: options((juice + water) * 3, id), scoopMl: 25, cupCapacity: 4, jugCapacity: 12 };
  }
  function makeRoute(v, kind) {
    return { kind, stock: copy(v.stock), flavour: v.id % 2 ? "apple" : "orange", jug: { apple: 0, orange: 0, water: 0 },
      cups: FRIENDS.map(() => ({ apple: 0, orange: 0, water: 0 })), stirred: false,
      coasters: FRIENDS.map(() => null), predictions: [null, null, null], help: [0, 0, 0], checked: [false, false, false] };
  }
  function createSession(index) {
    const v = variant(index);
    return { variant: v, jug: makeRoute(v, "jug"), own: makeRoute(v, "own") };
  }
  function need(v, r, ingredient, friend) {
    if (r.kind === "jug") return ingredient === "water" ? v.water * 3 : ingredient === r.flavour ? v.juice * 3 : 0;
    const order = v.own[friend];
    return ingredient === "water" ? order.water : ingredient === order.flavour ? order.juice : 0;
  }
  function add(s, kind, ingredient, friend, amount) {
    const r = s[kind], v = s.variant;
    if (!r || !Object.hasOwn(r.stock, ingredient) || (kind === "own" && !Number.isInteger(friend)) || (kind === "own" && !r.cups[friend])) return 0;
    if (kind === "jug" && r.stirred) return 0;
    const dest = kind === "jug" ? r.jug : r.cups[friend];
    const remaining = need(v, r, ingredient, friend) - dest[ingredient];
    const requested = amount === "rest" ? remaining : amount;
    if (!Number.isInteger(requested) || requested < 1) return 0;
    const moved = Math.min(requested, Math.max(0, remaining), r.stock[ingredient]);
    r.stock[ingredient] -= moved;
    dest[ingredient] += moved;
    return moved;
  }
  function mixtureReady(s) {
    const r = s.jug, v = s.variant;
    return r.jug[r.flavour] === v.juice * 3 && r.jug.water === v.water * 3;
  }
  function stir(s) { if (!mixtureReady(s)) return false; s.jug.stirred = true; return true; }
  function serve(s, friend) {
    const r = s.jug, v = s.variant;
    if (!r.stirred || !r.cups[friend] || sum(r.cups[friend]) !== 0) return false;
    if (r.jug[r.flavour] < v.juice || r.jug.water < v.water) return false;
    r.jug[r.flavour] -= v.juice; r.jug.water -= v.water;
    r.cups[friend][r.flavour] += v.juice; r.cups[friend].water += v.water;
    return true;
  }
  function complete(s, kind) {
    return s[kind].cups.every((cup, i) => {
      const order = kind === "jug" ? { flavour: s.jug.flavour, juice: s.variant.juice, water: s.variant.water } : s.variant.own[i];
      return cup[order.flavour] === order.juice && cup.water === order.water;
    });
  }
  function used(s, kind) { return sum(s[kind].jug) + s[kind].cups.reduce((n, c) => n + sum(c), 0); }
  function volumes(s, kind) {
    const r = s[kind], v = s.variant, ml = (scoops) => scoops * v.scoopMl;
    return {
      scoopMl: v.scoopMl, cupCapacityMl: ml(v.cupCapacity), jugCapacityMl: ml(v.jugCapacity),
      jugMl: ml(sum(r.jug)), jugTargetMl: ml(v.total),
      cupsMl: r.cups.map((cup) => ml(sum(cup))),
      cupTargetsMl: r.cups.map((_, i) => ml(kind === "jug" ? v.each : v.own[i].juice + v.own[i].water))
    };
  }
  function chooseFlavour(s, flavour) {
    if (!["apple", "orange"].includes(flavour) || used(s, "jug")) return false;
    s.jug.flavour = flavour; return true;
  }
  function coaster(s, kind, friend, shape, colour) {
    if (!["circle", "square"].includes(shape) || !Object.hasOwn(COLOURS, colour) || !s[kind]?.cups[friend]) return false;
    s[kind].coasters[friend] = { shape, colour }; return true;
  }
  function predict(s, kind, friend, value) {
    if (!s[kind] || !Number.isInteger(friend) || friend < 0 || friend > 2 || !Number.isInteger(value)) return false;
    const choices = kind === "jug" ? s.variant.choices : options(s.variant.own[friend].juice + s.variant.own[friend].water, s.variant.id + friend);
    if (!choices.includes(value) || s[kind].checked[friend]) return false;
    s[kind].predictions[friend] = value; return true;
  }
  return { FRIENDS, RECIPES, FRUIT, JUICES, COLOURS, sum, options, variant, createSession, add, need, stir, serve, complete, used, volumes, chooseFlavour, coaster, predict, mixtureReady };
});
