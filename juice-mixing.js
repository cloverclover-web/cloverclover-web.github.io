/* Measured portions, not a colour or real-mixture-volume simulator. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.JuiceMixing = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const FRIENDS = ["Bunny", "Bear", "Duck"];
  const JUICES = ["apple", "orange", "grape"];
  const INGREDIENTS = [...JUICES, "water"];
  const NAMES = { apple: "Apple juice", orange: "Orange juice", grape: "Grape juice", water: "Drinking water" };
  const IMAGES = { apple: "assets/juice/apple-juice-v1.png", orange: "assets/juice/orange-juice-v1.png", grape: "assets/juice/grape-juice-v2.png" };
  const SCOOP_ML = 25, CAPACITY = 4;
  const COLOURS = { pink: "#d58b9f", blue: "#91b5ca", green: "#9faf89" };
  const empty = () => ({ apple: 0, orange: 0, grape: 0, water: 0 });
  const total = (amounts) => INGREDIENTS.reduce((sum, key) => sum + amounts[key], 0);
  const IDEAS = [
    { apple: 1, orange: 1, grape: 0, water: 1 },
    { apple: 0, orange: 1, grape: 1, water: 2 },
    { apple: 2, orange: 0, grape: 1, water: 0 },
    { apple: 1, orange: 2, grape: 0, water: 1 },
    { apple: 0, orange: 1, grape: 1, water: 0 },
    { apple: 1, orange: 0, grape: 1, water: 2 }
  ];
  function recipeProblem(recipe, final = false) {
    if (!recipe || Object.keys(recipe).length !== INGREDIENTS.length ||
      INGREDIENTS.some(key => !Object.hasOwn(recipe, key) || !Number.isInteger(recipe[key]) || recipe[key] < 0 || recipe[key] > (key === "water" ? 2 : 3))) return "amount";
    if (JUICES.filter(key => recipe[key] > 0).length > 2) return "flavours";
    if (total(recipe) > CAPACITY) return "capacity";
    if (final && (!JUICES.some(key => recipe[key] > 0) || total(recipe) < 2)) return "unfinished";
    return null;
  }
  function createSession(index = 0) {
    const id = Number.isInteger(index) ? ((index % IDEAS.length) + IDEAS.length) % IDEAS.length : 0;
    const initialStock = { apple: 9, orange: 9, grape: 9, water: 6 };
    return { id, initialStock, stock: { ...initialStock }, cups: FRIENDS.map(name => ({
      name, recipe: empty(), poured: empty(), measuring: false, stirred: false,
      prediction: null, help: 0, revision: 0, coaster: null, coasterColour: null
    })) };
  }
  const cupAt = (s, i) => Number.isInteger(i) && i >= 0 && i < FRIENDS.length ? s.cups[i] : null;
  function setRecipe(s, i, recipe) {
    const cup = cupAt(s, i);
    if (!cup || cup.measuring || total(cup.poured)) return false;
    if (recipeProblem(recipe)) return false;
    if (INGREDIENTS.every(key => recipe[key] === cup.recipe[key])) return false;
    cup.recipe = { ...recipe }; cup.prediction = null; cup.help = 0; cup.revision++;
    return true;
  }
  function setAmount(s, i, ingredient, value) {
    const cup = cupAt(s, i);
    return !!cup && INGREDIENTS.includes(ingredient) && setRecipe(s, i, { ...cup.recipe, [ingredient]: value });
  }
  const idea = (s, i) => ({ ...IDEAS[(s.id + i) % IDEAS.length] });
  const suggest = (s, i) => !!cupAt(s, i) && setRecipe(s, i, idea(s, i));
  function options(s, i) {
    const cup = cupAt(s, i);
    if (!cup || recipeProblem(cup.recipe, true)) return [];
    const n = total(cup.recipe), values = [n - 1, n, n + 1], start = (s.id + i) % 3;
    return values.slice(start).concat(values.slice(0, start));
  }
  function predict(s, i, value, revision) {
    const cup = cupAt(s, i);
    if (!cup || cup.measuring || cup.revision !== revision || !options(s, i).includes(value)) return false;
    cup.prediction = value; return true;
  }
  function help(s, i) {
    const cup = cupAt(s, i);
    if (!cup || cup.measuring || recipeProblem(cup.recipe, true)) return false;
    cup.help = Math.min(2, cup.help + 1); return true;
  }
  function measure(s, i) {
    const cup = cupAt(s, i);
    if (!cup || cup.measuring || recipeProblem(cup.recipe, true)) return false;
    cup.measuring = true; return true;
  }
  function editEmptyPlan(s, i) {
    const cup = cupAt(s, i);
    if (!cup || !cup.measuring || total(cup.poured)) return false;
    cup.measuring = false; cup.prediction = null; cup.help = 0; cup.revision++; return true;
  }
  function add(s, i, ingredient, amount = 1) {
    const cup = cupAt(s, i);
    if (!cup || !cup.measuring || cup.stirred || !INGREDIENTS.includes(ingredient)) return 0;
    const remaining = cup.recipe[ingredient] - cup.poured[ingredient];
    const requested = amount === "rest" ? remaining : amount;
    if (!Number.isInteger(requested) || requested <= 0) return 0;
    const moved = Math.max(0, Math.min(requested, remaining, s.stock[ingredient], CAPACITY - total(cup.poured)));
    cup.poured[ingredient] += moved; s.stock[ingredient] -= moved;
    return moved;
  }
  const filled = (s, i) => {
    const cup = cupAt(s, i);
    return !!cup && cup.measuring && !recipeProblem(cup.recipe, true) && INGREDIENTS.every(key => cup.recipe[key] === cup.poured[key]);
  };
  function stir(s, i) {
    if (!filled(s, i) || s.cups[i].stirred) return false;
    s.cups[i].stirred = true; return true;
  }
  const ready = (s, i) => filled(s, i) && s.cups[i].stirred;
  const used = s => s.cups.reduce((n, cup) => n + total(cup.poured), 0);
  const complete = s => s.cups.every((_, i) => ready(s, i));
  const amounts = (s, i) => {
    const cup = cupAt(s, i);
    if (!cup) return null;
    return { measuredMl: total(cup.poured) * SCOOP_ML, targetMl: cup.measuring ? total(cup.recipe) * SCOOP_ML : null, capacityMl: CAPACITY * SCOOP_ML };
  };
  function compare(s, first, second) {
    if (first === second || !ready(s, first) || !ready(s, second)) return null;
    const a = s.cups[first].poured, b = s.cups[second].poured;
    return {
      first, second, sameRecipe: INGREDIENTS.every(key => a[key] === b[key]),
      sameIngredients: INGREDIENTS.every(key => (a[key] > 0) === (b[key] > 0)),
      firstMl: total(a) * SCOOP_ML, secondMl: total(b) * SCOOP_ML,
      differenceMl: Math.abs(total(a) - total(b)) * SCOOP_ML,
      ingredients: INGREDIENTS.map(key => ({ key, firstMl: a[key] * SCOOP_ML, secondMl: b[key] * SCOOP_ML }))
    };
  }
  function coaster(s, i, shape, colour = "pink") {
    const cup = cupAt(s, i);
    if (!cup || !["circle", "square"].includes(shape) || !Object.hasOwn(COLOURS, colour)) return false;
    cup.coaster = shape; cup.coasterColour = colour; return true;
  }
  return { FRIENDS, JUICES, INGREDIENTS, NAMES, IMAGES, SCOOP_ML, CAPACITY, COLOURS, IDEAS,
    empty, total, recipeProblem, createSession, setRecipe, setAmount, idea, suggest,
    options, predict, help, measure, editEmptyPlan, add, filled, stir, ready, used, complete, amounts, compare, coaster };
});
