(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.JuiceBook = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const pages = {
    cover: { title: "Juice for Our Friends", image: "invitation-v1", alt: "Bear welcomes Bunny and Duck into his sunny kitchen.", lines: ["A Little Kitchen story", "An invitation, a measuring scoop, and more than one way to make something together."] },
    welcome: { title: "Something to share", image: "invitation-v1", alt: "Bear welcomes his friends at the kitchen door.", lines: ["Sunlight spilled across Bear's kitchen table. Bunny came in with a flutter of blue, and Duck waddled after her.", "\"I thought we could make drinks for our afternoon together,\" Bear said. Then he looked at the cups. \"Will you help me work out what we need?\"", "\"We can make a plan together,\" said Bunny."] },
    prepare: { title: "Before we begin", image: "preparation-v1", alt: "Bunny and Bear prepare at the clean kitchen counter while Duck watches, with his feathered wings at his sides.", lines: ["Bear's dad had checked the ingredients and set out pasteurised apple juice, orange juice and drinking water. He would take care of any cutting or kitchen machines.", "Bunny and Bear washed their paws while Duck watched beside them. The fruit for their snack had been washed under running water too.", "On the table were apples, oranges and strawberries. The fruit was for their snack; the prepared juice was for their drinks."] },
    choice: { title: "A jug, or our own mixes?", image: "choice-v1", alt: "The friends consider an empty jug and individual cups, before choosing how to make their drinks.", lines: ["\"We could make a jug to share,\" said Bear.", "\"Or we could each choose a mix,\" said Bunny. Duck tilted his head. \"They don't all have to be the same.\"", "Bear's shoulders relaxed. There was more than one way to make a lovely afternoon."] },
    plan: { title: "Enough for everyone", image: "planning-v1", alt: "Bunny and Bear look thoughtfully at their recipe while Duck leans closer.", lines: ["They decided to make the same drink for everyone. First they would work out the amount, then measure it into the jug.", "\"Let's use the same scoop each time,\" Bunny said. \"That way, a scoop always means the same amount.\""] },
    mix: { title: "Into the jug", image: "measuring-table-v2", alt: "Bunny, Bear and Duck watch the measuring table. Duck has feathered wings, not hands.", lines: ["\"Juice first, or water first?\" asked Bear. \"Either works for this mixing plan,\" said Bunny. \"We'll stir when both are in.\"", "They kept the recipe beside the jug, so they could check as they went."] },
    serve: { title: "A cup for each friend", image: "serving-v1", alt: "The friends wait beside the serving table; the actual jug and cups below show what has been poured.", lines: ["The drink was ready to share. Bear steadied the jug while Bunny brought the cups closer.", "\"Each cup gets the amount we planned,\" said Bunny. \"We can start with anyone.\""] },
    own: { title: "Tell me your mix", image: "own-mixes-v1", alt: "Each friend talks about the drink they would like, with space on the table for their individual cups.", lines: ["\"I'd like to choose my own mix,\" said Duck. Bunny nodded. \"Tell us what you'd like before we pour.\"", "Bear listened to each friend. The requests were different, so he kept them beside the cups.", "They could begin with anyone. There was no hurry."] },
    table: { title: "A place at the table", image: "table-v1", alt: "The friends sit around the table, ready to choose coasters for their actual cups.", lines: ["\"Let's put something under the cups to protect the table,\" said Bear.", "Bunny brought over a little box of coloured coasters. Round ones, square ones, blue ones, pink ones. They could choose the designs they liked."] },
    close: { title: "Made together", image: "ending-v1", alt: "Bunny, Bear and Duck enjoy a quiet moment together at the kitchen table.", lines: ["Bunny settled beside Bear, and Duck tucked his feathered wings against his sides.", "\"I liked making a plan with you,\" Bear said. \"I liked that we could do it our own way,\" said Bunny.", "Outside the window, the apple leaves moved in the breeze. Inside, there was time to talk."] },
    quiet: { title: "Just being here", image: "quiet-v1", alt: "The friends sit by the kitchen window, enjoying each other's company without a task.", lines: ["\"Could we sit together for a little while first?\" asked Duck.", "Bear put the measuring scoop down. \"Of course. The kitchen can wait.\"", "Bunny made room beside her. They watched a leaf turn in the breeze and wondered where it might land.", "There was nothing they had to finish to enjoy being together."] }
  };
  // Selected corrections put Duck behind the counter, not on the food surface.
  const selectedArt = { choice: "choice-v2", plan: "planning-juice-v3", serve: "serving-v2", own: "own-mixes-v2" };
  for (const [page, image] of Object.entries(selectedArt)) pages[page].image = image;
  pages.plan.alt = "Bunny points to a labelled bottle of prepared apple juice beside a bottle of orange juice, while Bear and Duck look on.";
  const words = {
    apple: "This apple has green skin and a little stalk. Apples can have other colours too.",
    orange: "This orange has a dimpled peel. Its name is also a colour word.",
    strawberry: "This strawberry is red, with a leafy top and tiny specks on the outside."
  };
  const ui = {
    measuring: "We can measure to check an idea. Choosing an answer is optional.",
    units: "In this story, 1 scoop is 25 millilitres. We use the same measuring scoop every time.",
    checked: "Let's use the recipe and see what happens.",
    wrongJuice: "That is a different juice. Let's listen to the request again before we pour.",
    stirWait: "The recipe still needs an ingredient. We can check what is missing.",
    stirDone: "Both ingredients are in. Bear stirs the drink, ready to share.",
    full: "Each friend has the drink they asked for. They can try it if they want to.",
    partial: "There is still some measuring to do. They can finish later; nobody has to rush.",
    untouched: "They have a plan, and the ingredients are still waiting. They can make their drinks another time.",
    alternative: "You are visiting another telling of the story. Your earlier making is kept if you go back to that route.",
    helpJug1: "Each cup needs the same amount. Add the amount for each cup, instead of starting at 1 every time.",
    helpOwn1: "Keep the amount of juice in mind, then add the water. The ingredients belong to the same cup."
  };
  // Kept separate from the frozen j1 catalogue and never used for unfinished work.
  const drinking = {
    title: "A sip of our own",
    image: "drinking-v2",
    alt: "Bunny and Bear sip from their mugs. Duck sips through a straw from a mug resting on the table, with his feathered wings at his sides.",
    lines: [
      "With the drinks ready, Bear helped pour them into their favourite mugs.",
      "Bunny and Bear lifted their mugs. Duck leaned forward and sipped through his straw.",
      "They tasted the drinks they had made, and talked about what they might try next time."
    ]
  };
  function ending(model, session, kind) { return model.complete(session, kind) ? drinking : pages.close; }
  const activitySpeech = [
    "Bunny looks closely at the apples, oranges and strawberries for their snack.",
    "Choose a fruit to look at it together.", "For each cup. We are making 3 cups.", "For this cup.",
    "Choose an idea, ask for help, or go straight to measuring.",
    "Which juice would you like in the shared jug? Both choices work for this plan.",
    "The juice already measured stays in this jug. A new reading can use a different recipe.",
    "Choose the juice in the request before measuring it.",
    "The juice and water stay in their containers until you choose the requested juice.",
    "Any colour or shape can belong at our table. You can change your design.",
    "This cup holds up to 100 mL.", "Each cup holds up to 100 mL.",
    "Some of our drink is already in the cups.", "Watch the amount change as we pour.",
    "This is our preparation record, before the friends began drinking. It does not show how much is left after a sip."
  ];
  function extraCatalogue(model) {
    const lines = new Set([...drinking.lines, ...activitySpeech]);
    for (let id = 0; id < model.RECIPES.length; id++) {
      const v = model.variant(id);
      lines.add(`${v.each * 25} mL for each cup. Jug holds up to 300 mL.`);
      for (const flavour of ["apple", "orange"]) lines.add(`For the whole jug: ${v.juice * 3} scoops of ${flavour} juice and ${v.water * 3} scoops of water.`);
      lines.add(`${v.total} measured scoops were added to our jug.`);
      for (let n = 0; n <= v.total; n++) lines.add(`${n} measured scoops remain in the jug.`);
      for (const r of v.own) lines.add(`${r.name}'s cup has ${r.juice + r.water} measured scoops. This mix is ready.`);
    }
    return [...lines];
  }
  function request(v, friend) {
    const r = v.own[friend];
    return `The recipe for ${r.name} is ${r.juice} ${r.juice === 1 ? "scoop" : "scoops"} of ${r.flavour} juice and ${r.water} ${r.water === 1 ? "scoop" : "scoops"} of water.`;
  }
  function question(v, kind, friend) {
    if (kind === "jug") return `Each cup needs ${v.each} scoops. We are making 3 cups. How many scoops will we add altogether?`;
    const r = v.own[friend];
    return `${r.name} would like ${r.juice} ${r.juice === 1 ? "scoop" : "scoops"} of ${r.flavour} juice and ${r.water} ${r.water === 1 ? "scoop" : "scoops"} of water. How many scoops will go into the cup?`;
  }
  function guided(v, kind, friend) {
    if (kind === "jug") return `${v.each} and ${v.each} make ${v.each * 2}. Add ${v.each} more, and that makes ${v.total} scoops for 3 cups.`;
    const r = v.own[friend];
    return `${r.juice} and ${r.water} make ${r.juice + r.water}. Those measured scoops go into the same cup.`;
  }
  function legacyCatalogue(model) {
    const lines = new Set([...Object.values(pages).flatMap((p) => p.lines), ...Object.values(words), ...Object.values(ui)]);
    for (let n = 0; n < model.RECIPES.length; n++) {
      const v = model.variant(n);
      lines.add(question(v, "jug", 0)); lines.add(guided(v, "jug", 0));
      for (let i = 0; i < 3; i++) { lines.add(question(v, "own", i)); lines.add(guided(v, "own", i)); lines.add(request(v, i)); }
    }
    return [...lines];
  }
  const guidance = {
    correct: "Yes, that's right.",
    guided: "That matches the recipe. We worked it out with help.",
    retry: "Not quite. Try again, ask for help, or measure to check your idea.",
    measure: "Now let's measure the ingredients.",
    chooseJuice: "Now choose the juice in the request.",
    addBoth: "Add the juice and water in either order. Keep the recipe beside you.",
    addWater: "The juice is measured. Now add the water to match the recipe.",
    addJuice: "The water is measured. Now add the juice to match the recipe.",
    stir: "The amounts match our recipe. Now stir the drink.",
    cups: "Now bring the cups so we can share the drink.",
    pour: "Choose a friend and pour their drink into a cup.",
    anotherCup: "That cup is ready. Now pour a cup for another friend.",
    table: "All 3 drinks are ready. Now let's set the table.",
    coaster: "Choose a shape and colour, then place a coaster under a cup.",
    ending: "The coasters are in place. We can read the ending when you are ready."
  };
  function answerFeedback(v, kind, i, value, help) {
    if (value == null) return [];
    const r = kind === "jug" ? v : v.own[i];
    const answer = kind === "jug" ? v.total : r.juice + r.water;
    return value === answer
      ? [help ? guidance.guided : guidance.correct, guided(v, kind, i), guidance.measure]
      : [guidance.retry];
  }
  function nextFriend(name) { return `${name}'s mix is ready. Choose another friend to make their drink.`; }
  function guidanceCatalogue(model) { return [...Object.values(guidance), ...model.FRIENDS.map(nextFriend)]; }
  function catalogue(model) { return [...new Set([...legacyCatalogue(model), ...extraCatalogue(model), ...guidanceCatalogue(model)])]; }
  const mixText = {
    welcome: ['"Could we put 2 different juices in the same drink?" asked Bunny.', "Bear's dad had brought prepared, pasteurised grape juice to join the apple juice, orange juice and drinking water. The friends could invent recipes before pouring.", '"These cups are not see-through," Bear said. "Let\'s keep a record of what goes into each one."'],
    make: ['"Tell us your idea before we pour," said Bear. "Then we can keep the recipe beside your cup."', "They could start with any friend, and leave the rest for another time."],
    drinking: ["They brought their finished drinks to the table in their favourite mugs.", ...drinking.lines.slice(1)],
    partial: "They kept the drinks they had started. Anything unfinished could wait.",
    untouched: "The ingredients were still in their bottles. There was no hurry to begin.",
    closing: ['"We don\'t have to choose the same thing to make something together," said Bunny.', "Duck tucked his wings against his sides. Outside, the apple leaves moved in the breeze."],
    choose: "Choose up to 2 juices. You can add water too.",
    size: "We are planning 2 to 4 scoops for this cup. The bottles stay on the table until we measure.",
    incomplete: "Choose some juice and enough ingredients for at least 2 scoops. Water is optional.",
    question: "How many scoops will go into this cup altogether?",
    optional: "You can choose an idea, ask for help, or go straight to measuring.",
    help: "Keep the first amount in mind, then add the other amounts from the same recipe.",
    example: "This is a worked example. We still need to measure the ingredients.",
    changed: "Your recipe has changed. Nothing has been poured yet.",
    idea: "Here is a recipe idea. You can change it before pouring.",
    measuring: "We can add the ingredients in either order. Stir when the recipe is measured.",
    filled: "All the planned ingredients are in. Now stir this drink.",
    another: "This drink is stirred and ready. Choose another friend to make their drink, or finish here.",
    all: "All 3 drinks are stirred and ready. Now let's set the table.",
    historical: "These are the amounts we measured before drinking, not the amounts left after a sip.",
    coasters: "Bunny brought coasters to protect the table. Each cup can have a circle or a square.",
    compare: "Bear kept the recipes beside the drinks. We can compare what we actually measured.",
    same: "The ingredients and their amounts match. These use the same recipe.",
    amounts: "These use the same ingredients, but the amounts are different.",
    ingredients: "These recipes use different ingredients."
  };
  const mixNames = { apple: "apple juice", orange: "orange juice", grape: "grape juice", water: "drinking water" };
  function mixRecipe(recipe) {
    const parts = Object.keys(mixNames).filter(k => recipe[k] > 0).map(k => `${recipe[k]} ${recipe[k] === 1 ? "scoop" : "scoops"} of ${mixNames[k]}`);
    return `Our recipe uses ${parts.join(" and ")}.`;
  }
  function mixCalculation(recipe) {
    const values = Object.keys(mixNames).map(k => recipe[k]).filter(Boolean);
    return `${values.join(" + ")} = ${values.reduce((a, b) => a + b, 0)} scoops.`;
  }
  function mixFeedback(recipe, prediction, help) {
    if (prediction == null) return [];
    const answer = Object.keys(mixNames).reduce((n, k) => n + recipe[k], 0);
    return prediction === answer ? [help ? guidance.guided : guidance.correct, mixCalculation(recipe), guidance.measure] : [guidance.retry];
  }
  function mixComparison(comparison) {
    return [comparison.sameRecipe ? mixText.same : comparison.sameIngredients ? mixText.amounts : mixText.ingredients,
      comparison.differenceMl === 0 ? `Both recipes used ${comparison.firstMl} mL of measured ingredients.` : `The measured amounts differ by ${comparison.differenceMl} mL.`];
  }
  function mixMeasured(total, prediction) { return `${prediction == null ? "" : `You thought ${prediction} scoops. `}We measured ${total} scoops.`; }
  function mixCatalogue(model) {
    const lines = new Set([...Object.values(mixText).flat(), ui.units, activitySpeech[10], guidance.correct, guidance.guided, guidance.retry, guidance.measure]);
    for (let apple = 0; apple <= 3; apple++) for (let orange = 0; orange <= 3; orange++) for (let grape = 0; grape <= 3; grape++) for (let water = 0; water <= 2; water++) {
      const recipe = { apple, orange, grape, water };
      if (!model.recipeProblem(recipe, true)) { lines.add(mixRecipe(recipe)); lines.add(mixCalculation(recipe)); }
    }
    for (const amount of [50, 75, 100]) lines.add(`Both recipes used ${amount} mL of measured ingredients.`);
    for (const difference of [25, 50]) lines.add(`The measured amounts differ by ${difference} mL.`);
    for (const total of [2, 3, 4]) for (const prediction of [null, 1, 2, 3, 4, 5]) lines.add(mixMeasured(total, prediction));
    return [...lines];
  }
  const mix = { ready: true, text: mixText, recipe: mixRecipe, calculation: mixCalculation, feedback: mixFeedback, comparison: mixComparison, measured: mixMeasured, catalogue: mixCatalogue };
  return { pages, words, ui, request, question, guided, drinking, ending, legacyCatalogue, extraCatalogue, guidance, answerFeedback, nextFriend, guidanceCatalogue, catalogue, mix };
});
