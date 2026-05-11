const vocabulary = [
  { id: "apple", word: "apple", base: "#ef476f", colorable: true, draw: drawApple },
  { id: "banana", word: "banana", base: "#ffd166", colorable: true, draw: drawBanana },
  { id: "cat", word: "cat", base: "#f7a76c", draw: drawCat },
  { id: "dog", word: "dog", base: "#c28f61", draw: drawDog },
  { id: "fish", word: "fish", base: "#4ecdc4", colorable: true, draw: drawFish },
  { id: "car", word: "car", base: "#118ab2", colorable: true, draw: drawCar },
  { id: "ball", word: "ball", base: "#9d8df1", colorable: true, draw: drawBall },
  { id: "sun", word: "sun", base: "#ffd166", draw: drawSun },
  { id: "star", word: "star", base: "#f77f00", colorable: true, draw: drawStar },
  { id: "tree", word: "tree", base: "#65bd53", colorable: true, draw: drawTree }
];

const colorWords = [
  { id: "red", word: "red", hex: "#ef476f" },
  { id: "yellow", word: "yellow", hex: "#ffd166" },
  { id: "green", word: "green", hex: "#06d6a0" },
  { id: "blue", word: "blue", hex: "#118ab2" },
  { id: "orange", word: "orange", hex: "#f77f00" },
  { id: "pink", word: "pink", hex: "#ff7aa7" }
];

const sizeWords = [
  { id: "big", word: "big" },
  { id: "small", word: "small" }
];

const shapeSet = [
  { id: "circle", word: "circle", dimension: "flat" },
  { id: "square", word: "square", dimension: "flat" },
  { id: "triangle", word: "triangle", dimension: "flat" },
  { id: "rectangle", word: "rectangle", dimension: "flat" },
  { id: "diamond", word: "diamond", dimension: "flat" },
  { id: "oval", word: "oval", dimension: "flat" },
  { id: "pentagon", word: "pentagon", dimension: "flat" },
  { id: "hexagon", word: "hexagon", dimension: "flat" },
  { id: "shape-star", word: "star", dimension: "flat" },
  { id: "heart", word: "heart", dimension: "flat" },
  { id: "semicircle", word: "semicircle", dimension: "flat" },
  { id: "cube", word: "cube", dimension: "solid" },
  { id: "sphere", word: "sphere", dimension: "solid" },
  { id: "cone", word: "cone", dimension: "solid" },
  { id: "cylinder", word: "cylinder", dimension: "solid" },
  { id: "pyramid", word: "pyramid", dimension: "solid" },
  { id: "rectangular-prism", word: "rectangular prism", dimension: "solid" },
  { id: "triangular-prism", word: "triangular prism", dimension: "solid" },
  { id: "hemisphere", word: "hemisphere", dimension: "solid" }
];

const flatShapeSet = shapeSet.filter((shape) => shape.dimension === "flat");
const solidShapeSet = shapeSet.filter((shape) => shape.dimension === "solid");
const logicShapeSet = flatShapeSet;

const PRINCESS_CHEERS = [
  "Lovely work, princess!",
  "You found it. Well done!",
  "Brilliant! The kingdom is proud.",
  "Wonderful! A gem for your crown.",
  "Beautifully done!"
];

const PRINCESS_CELEBRATIONS = [
  "Wonderful, princess! You finished your quest.",
  "The whole kingdom is cheering for you!",
  "Beautifully done. Your crown is sparkling.",
  "Brilliant work! The fairy godmother is proud."
];

const PRINCESS_HINTS = [
  "Almost! The answer is {answer}. Have another try.",
  "So close, princess. It is {answer}. Try again.",
  "Not quite. The right one is {answer}. Have a go.",
  "Gentle try. The answer is {answer}."
];

function pickFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function getCorrectLabel() {
  if (!state || !Array.isArray(state.options)) return "";
  const found = state.options.find((opt) => opt && opt.correct);
  return found ? String(found.label || "") : "";
}

function gentleHint(answer) {
  const text = pickFrom(PRINCESS_HINTS);
  return answer ? text.replace("{answer}", answer) : "Have another try, princess.";
}

function challengeAnswerLabel(challenge = state.challenge) {
  if (!challenge) return "";
  if (challenge.answer?.label) return String(challenge.answer.label);
  if (typeof challenge.answer === "string" || typeof challenge.answer === "number") return String(challenge.answer);
  const found = Array.isArray(challenge.options) ? challenge.options.find((option) => option?.correct) : null;
  return found ? String(found.label || found.value || "") : "";
}

function shapeFeatureText(shape) {
  const features = {
    circle: "It is round and has no corners.",
    square: "It has 4 equal sides and 4 corners.",
    triangle: "It has 3 sides and 3 corners.",
    rectangle: "It has 4 sides. Two are long and two are short.",
    diamond: "It has 4 corners and looks like a tilted square.",
    oval: "It is long and round with no corners.",
    pentagon: "It has 5 sides and 5 corners.",
    hexagon: "It has 6 sides and 6 corners.",
    "shape-star": "It has points like a star.",
    heart: "It has a point at the bottom and two round tops.",
    semicircle: "It is half of a circle.",
    cube: "It is a solid with flat square faces.",
    sphere: "It is round like a ball with no flat faces.",
    cone: "It has 1 point and 1 circle face.",
    cylinder: "It has 2 circle faces and 1 curved side.",
    pyramid: "It has a point at the top and flat faces.",
    "rectangular-prism": "It is a box shape with flat rectangle faces.",
    "triangular-prism": "It is a solid with triangle faces.",
    hemisphere: "It is half of a sphere."
  };
  return features[shape?.id] || "Look at its sides, corners, and faces.";
}

function firstHintFor(challenge) {
  if (challenge.hintFirst) return challenge.hintFirst;
  if (challenge.level === "plus") return "Count them all together.";
  if (challenge.level === "minus") return "Take some away. Count what is left.";
  if (["one-more", "count-on"].includes(challenge.level)) return "Say the numbers in order.";
  if (challenge.level === "one-less") return "Think about the number before.";
  if (challenge.level === "make-ten") return "Look at the empty spaces.";
  if (challenge.level === "number-bond" || challenge.level === "balance") return "Find the missing part.";
  if (challenge.level === "array") return "Count by rows.";
  if (challenge.level?.includes("pattern")) return "Look at what comes again and again.";
  if (challenge.level?.includes("shape") || challenge.game === "shapes") return "Look at the sides, corners, or faces.";
  if (challenge.level?.includes("more") || challenge.level?.includes("fewer")) return "Compare the groups.";
  if (challenge.game === "ketListen") return "Listen for the key word.";
  if (challenge.game === "englishSkills") return "Look at the picture clue.";
  return "Look carefully, princess.";
}

function secondHintFor(challenge) {
  if (challenge.hintSecond) return challenge.hintSecond;
  if (challenge.level === "plus") return "Start with the first group, then keep counting.";
  if (challenge.level === "minus") return "Cross out the ones taken away.";
  if (challenge.level === "one-more") return "One more means add 1.";
  if (challenge.level === "one-less") return "One less means take away 1.";
  if (challenge.level === "make-ten") return "Count the empty boxes.";
  if (challenge.level === "number-bond" || challenge.level === "balance") return "Ask: what number makes both sides match?";
  if (challenge.level === "array") return "Count each row, one row at a time.";
  if (challenge.level?.includes("pattern")) return "Say the pattern out loud, then choose what comes next.";
  if (challenge.game === "shapes") return shapeFeatureText(challenge.shape);
  if (challenge.level === "same-shape") return "The shape must match. The colour can change.";
  if (challenge.level === "same-color") return "The colour must match. The shape can change.";
  if (challenge.game === "ketListen") return "Listen again and watch the pictures.";
  if (challenge.game === "englishSkills") return "Match the clue to the picture.";
  return "Try one more time. Look for the clue.";
}

function finalHintFor(challenge) {
  if (challenge.explanation) return challenge.explanation;
  const label = challengeAnswerLabel(challenge);
  return label ? `It is ${label}.` : "That one is the answer.";
}

const a2ListeningBank = [
  {
    id: "a2-lunch",
    question: "What is for lunch?",
    script: "Emma has an apple for breakfast. She has a banana for lunch.",
    choices: ["banana", "apple", "fish", "cake"],
    answer: "banana"
  },
  {
    id: "a2-owner",
    question: "Which ball is Tom's?",
    script: "Emma has the red ball. Tom has the blue ball. Which ball is Tom's?",
    choices: ["blue ball", "red ball", "green ball", "yellow ball"],
    answer: "blue ball"
  },
  {
    id: "a2-place",
    question: "Where is the cat?",
    script: "The dog is in the garden. The cat is in the kitchen.",
    choices: ["kitchen", "garden", "bedroom", "park"],
    answer: "kitchen"
  },
  {
    id: "a2-weather",
    question: "What does Mia need?",
    script: "It is raining today. Mia needs her yellow raincoat.",
    choices: ["yellow raincoat", "blue hat", "red shoes", "green bag"],
    answer: "yellow raincoat"
  },
  {
    id: "a2-time",
    question: "When is the party?",
    script: "The party is not in the morning. It starts at three in the afternoon.",
    choices: ["three o'clock", "ten o'clock", "one o'clock", "six o'clock"],
    answer: "three o'clock"
  },
  {
    id: "a2-action",
    question: "What does Ben want to do?",
    script: "Ben is tired of drawing. He wants to ride his bike outside.",
    choices: ["ride a bike", "draw a picture", "read a book", "watch a film"],
    answer: "ride a bike"
  },
  {
    id: "a2-breakfast-fruit",
    question: "Which fruit does Anna choose?",
    script: "Anna can have an apple or a banana. She says, I want the apple today.",
    choices: ["apple", "banana", "cake", "fish"],
    answer: "apple"
  },
  {
    id: "a2-pet-table",
    question: "Which pet is under the table?",
    script: "The cat is on the sofa. The dog is under the table.",
    choices: ["dog", "cat", "fish", "ball"],
    answer: "dog"
  },
  {
    id: "a2-dad-place",
    question: "Where is Dad?",
    script: "Mum is in the kitchen. Dad is in the garden with the dog.",
    choices: ["garden", "kitchen", "bedroom", "park"],
    answer: "garden"
  },
  {
    id: "a2-shoes-bag",
    question: "What is in the bag?",
    script: "The blue hat is on the chair. The red shoes are in the bag.",
    choices: ["red shoes", "blue hat", "yellow coat", "green bag"],
    answer: "red shoes"
  },
  {
    id: "a2-music-time",
    question: "When is music class?",
    script: "Art class is at one o'clock. Music class is at six o'clock.",
    choices: ["six o'clock", "one o'clock", "three o'clock", "ten o'clock"],
    answer: "six o'clock"
  },
  {
    id: "a2-after-school",
    question: "What will Lucy do after school?",
    script: "Lucy does not want to watch a film. She wants to read a book after school.",
    choices: ["read a book", "watch a film", "draw a picture", "ride a bike"],
    answer: "read a book"
  },
  {
    id: "a2-sam-ball",
    question: "Which ball does Sam take?",
    script: "There are three balls. Sam does not take the red one. He takes the green ball.",
    choices: ["green ball", "red ball", "blue ball", "yellow ball"],
    answer: "green ball"
  },
  {
    id: "a2-shop-food",
    question: "What does Jack buy?",
    script: "Jack has a banana at home. At the shop, he buys a cake for Grandma.",
    choices: ["cake", "banana", "apple", "fish"],
    answer: "cake"
  },
  {
    id: "a2-meeting-place",
    question: "Where will they meet?",
    script: "It is too cold in the garden. The children will meet in the park.",
    choices: ["park", "garden", "kitchen", "bedroom"],
    answer: "park"
  },
  {
    id: "a2-leo-hat",
    question: "What does Leo need?",
    script: "Leo has his coat and shoes. He cannot find his blue hat.",
    choices: ["blue hat", "yellow coat", "red shoes", "green bag"],
    answer: "blue hat"
  },
  {
    id: "a2-zoe-drawing",
    question: "What is Zoe doing?",
    script: "Zoe is not reading now. She is drawing a picture of a tree.",
    choices: ["draw a picture", "read a book", "ride a bike", "watch a film"],
    answer: "draw a picture"
  },
  {
    id: "a2-bus-time",
    question: "When does the bus leave?",
    script: "The train leaves at three o'clock, but the bus leaves at ten o'clock.",
    choices: ["ten o'clock", "three o'clock", "one o'clock", "six o'clock"],
    answer: "ten o'clock"
  }
];

const baseKetListeningBank = [
  {
    id: "ket-party-clothes",
    question: "What will the girl wear?",
    script: "Girl: Which coat should I wear to the party? Mum: It may rain, so take the blue coat. Girl: And my red shoes? Mum: No, wear your yellow shoes.",
    choices: ["blue coat", "yellow shoes", "red shoes", "green bag"],
    answer: "blue coat"
  },
  {
    id: "ket-lost-bag",
    question: "Where is the school bag?",
    script: "Boy: I cannot find my school bag. Dad: It is not in the bedroom. You left it in the kitchen, next to the chair.",
    choices: ["kitchen", "bedroom", "garden", "park"],
    answer: "kitchen"
  },
  {
    id: "ket-after-club",
    question: "What will Amy do after the club?",
    script: "Amy wanted to ride her bike after art club, but it is too dark now. She will read a book at home.",
    choices: ["read a book", "ride a bike", "draw a picture", "watch a film"],
    answer: "read a book"
  },
  {
    id: "ket-cafe-order",
    question: "What does the boy choose?",
    script: "Boy: Can I have cake, please? Woman: There is no cake today. Boy: Then I will have a banana, please.",
    choices: ["banana", "cake", "apple", "fish"],
    answer: "banana"
  },
  {
    id: "ket-library-time",
    question: "When does the library close?",
    script: "The library usually closes at six o'clock, but today it closes early, at three o'clock.",
    choices: ["three o'clock", "six o'clock", "one o'clock", "ten o'clock"],
    answer: "three o'clock"
  },
  {
    id: "ket-weekend-plan",
    question: "When will they visit Grandma?",
    script: "Dad: Shall we visit Grandma on Saturday? Girl: I have swimming then. Dad: All right, we will go on Sunday.",
    choices: ["Sunday", "Saturday", "Friday", "Monday"],
    answer: "Sunday"
  },
  {
    id: "ket-park-meet",
    question: "Where will the children meet first?",
    script: "The children will not meet at the park gate. They will meet in the garden first, and then walk to the park.",
    choices: ["garden", "park", "kitchen", "bedroom"],
    answer: "garden"
  },
  {
    id: "ket-ice-cream-choice",
    question: "Which ice cream does Maya buy?",
    script: "Maya wanted strawberry ice cream, but it was too sweet. She bought lemon ice cream instead.",
    choices: ["lemon ice cream", "strawberry ice cream", "chocolate ice cream", "vanilla ice cream"],
    answer: "lemon ice cream"
  },
  {
    id: "ket-film-feeling",
    question: "What did Tom think of the film?",
    script: "Tom says, The film was long, but the ending was exciting. I liked it very much.",
    choices: ["liked it", "hated it", "fell asleep", "did not understand it"],
    answer: "liked it"
  },
  {
    id: "ket-changed-plan",
    question: "What changed?",
    script: "The picnic was going to be on Friday, but the weather will be better on Saturday. The day has changed.",
    choices: ["the day", "the place", "the food", "the people"],
    answer: "the day"
  },
  {
    id: "ket-present-car",
    question: "Which present will Ben take?",
    script: "Girl: Are you taking a ball to the party? Boy: No, Tom already has one. I am taking a small car. Girl: Good idea.",
    choices: ["car", "blue ball", "cake", "book"],
    answer: "car"
  },
  {
    id: "ket-homework-place",
    question: "Where will Lily do her homework?",
    script: "Mum: Do your homework in the kitchen, please. Girl: It is too noisy there. Mum: Then use your bedroom. Girl: All right.",
    choices: ["bedroom", "kitchen", "garden", "library"],
    answer: "bedroom"
  },
  {
    id: "ket-football-day",
    question: "When is football club this week?",
    script: "Boy: Is football club on Friday? Teacher: Usually, yes. This week it is on Monday because the hall is busy.",
    choices: ["Monday", "Friday", "Saturday", "Sunday"],
    answer: "Monday"
  },
  {
    id: "ket-rainy-plan",
    question: "What will the children do?",
    script: "Girl: Can we ride bikes after lunch? Dad: It is raining now. Boy: Shall we watch a film instead? Dad: Yes.",
    choices: ["watch a film", "ride a bike", "go to the park", "read a book"],
    answer: "watch a film"
  },
  {
    id: "ket-shop-fruit",
    question: "What fruit do they buy first?",
    script: "Woman: We need fruit for the picnic. Boy: Shall we get bananas? Woman: Later. Put the apples in the basket first.",
    choices: ["apple", "banana", "cake", "fish"],
    answer: "apple"
  },
  {
    id: "ket-lost-hat-place",
    question: "Where did Ella leave her hat?",
    script: "Girl: I had my blue hat at school. Mum: Did you leave it on the bus? Girl: No, it is still in my classroom.",
    choices: ["school", "bus stop", "kitchen", "park"],
    answer: "school"
  },
  {
    id: "ket-swimming-time",
    question: "When does swimming start?",
    script: "Boy: Does swimming start at three o'clock? Woman: Not today. It starts at six o'clock, after the big class.",
    choices: ["six o'clock", "three o'clock", "one o'clock", "ten o'clock"],
    answer: "six o'clock"
  },
  {
    id: "ket-new-pet",
    question: "Which pet does the boy like best?",
    script: "Girl: Do you like the cat? Boy: It is nice, but I like the dog best. It can run with me.",
    choices: ["dog", "cat", "fish", "ball"],
    answer: "dog"
  },
  {
    id: "ket-bag-colour",
    question: "Which bag is Lucy's?",
    script: "Mum: Is the pink bag yours? Girl: No, mine is green. The blue one is Tom's.",
    choices: ["green bag", "pink bag", "blue bag", "orange bag"],
    answer: "green bag"
  },
  {
    id: "ket-picnic-food",
    question: "What food does Dad put in the picnic box?",
    script: "Girl: Can we take cake? Dad: Not today. I put bananas in the picnic box. Girl: Great.",
    choices: ["banana", "cake", "apple", "fish"],
    answer: "banana"
  },
  {
    id: "ket-trip-change",
    question: "What changed about the school trip?",
    script: "Teacher: The trip is still on Friday, but we cannot go to the park. We will go to the library instead.",
    choices: ["the place", "the day", "the food", "the people"],
    answer: "the place"
  },
  {
    id: "ket-late-rain",
    question: "Why is Noah late?",
    script: "Woman: Was the bus late, Noah? Boy: No. I walked slowly because it was raining hard.",
    choices: ["It was raining.", "The bus was late.", "He lost his bag.", "He missed lunch."],
    answer: "It was raining."
  },
  {
    id: "ket-ice-cream-vanilla",
    question: "Which ice cream does Amy choose?",
    script: "Girl: I want lemon ice cream. Man: Sorry, there is no lemon ice cream. Girl: Then I will have vanilla ice cream, please.",
    choices: ["vanilla ice cream", "lemon ice cream", "strawberry ice cream", "chocolate ice cream"],
    answer: "vanilla ice cream"
  },
  {
    id: "ket-morning-shoes",
    question: "What must the boy find?",
    script: "Mum: You have your coat and bag. Boy: But I cannot find my red shoes. Mum: Look under the chair.",
    choices: ["red shoes", "yellow coat", "green bag", "blue hat"],
    answer: "red shoes"
  },
  {
    id: "ket-before-park",
    question: "What will Oliver do before the park?",
    script: "Boy: Can I go to the park now? Mum: Buy bread first, then you can play outside.",
    choices: ["buy bread", "go to the park", "watch a film", "ride a bike"],
    answer: "buy bread"
  },
  {
    id: "ket-story-feeling",
    question: "How did Sara feel about the story?",
    script: "Girl: The story was not easy, but the pictures helped me. I liked it and want to hear it again.",
    choices: ["liked it", "did not understand it", "hated it", "fell asleep"],
    answer: "liked it"
  },
  {
    id: "ket-meet-library",
    question: "Where will they meet?",
    script: "Boy: Shall we meet at the cafe? Girl: It is full today. Let's meet outside the library.",
    choices: ["library", "cafe", "school", "park"],
    answer: "library"
  },
  {
    id: "ket-swimming-day",
    question: "When is the swimming lesson?",
    script: "Teacher: Swimming is not on Sunday this week. It is on Saturday morning.",
    choices: ["Saturday", "Sunday", "Monday", "Friday"],
    answer: "Saturday"
  },
  {
    id: "ket-cold-morning",
    question: "What does Mia need this morning?",
    script: "Dad: It is cold, Mia. Girl: I have my bag. Dad: Good. Please take your yellow coat too.",
    choices: ["yellow coat", "green bag", "blue hat", "red shoes"],
    answer: "yellow coat"
  },
  {
    id: "ket-cafe-or-shop",
    question: "Where will Dad go first?",
    script: "Girl: Are you going to the cafe first? Dad: No, I need to buy apples at the shop. Then I will get coffee.",
    choices: ["shop", "cafe", "library", "school"],
    answer: "shop"
  },
  {
    id: "ket-playground-first",
    question: "What will the children do first?",
    script: "Teacher: We will read later. First, go to the playground and play football for ten minutes.",
    choices: ["play football", "read a book", "draw a picture", "watch a film"],
    answer: "play football"
  },
  {
    id: "ket-blue-hat-later",
    question: "What does the girl need now?",
    script: "Girl: I have my red shoes and my green bag. Mum: Good. Please take your blue hat now, because it is windy outside.",
    choices: ["blue hat", "red shoes", "green bag", "yellow coat"],
    answer: "blue hat"
  },
  {
    id: "ket-library-before-cafe",
    question: "Where will they go first?",
    script: "Boy: Can we go to the cafe now? Dad: After the library. We must return your book first.",
    choices: ["library", "cafe", "shop", "park"],
    answer: "library"
  },
  {
    id: "ket-yellow-coat-not-hat",
    question: "What will the boy wear?",
    script: "Mum: You do not need your blue hat today. It is cold, so wear your yellow coat.",
    choices: ["yellow coat", "blue hat", "red shoes", "green bag"],
    answer: "yellow coat"
  },
  {
    id: "ket-two-clubs-time",
    question: "What time is art club?",
    script: "Music club is at four o'clock. Art club is later, at six o'clock.",
    choices: ["six o'clock", "four o'clock", "three o'clock", "ten o'clock"],
    answer: "six o'clock"
  },
  {
    id: "ket-shop-after-school",
    question: "What will Emma do after school?",
    script: "Emma says, I wanted to ride my bike, but Mum asked me to buy bread after school.",
    choices: ["buy bread", "ride a bike", "read a book", "watch a film"],
    answer: "buy bread"
  },
  {
    id: "ket-dog-behind-box",
    question: "Where is the dog?",
    script: "The cat is next to the box. The dog is not next to it. The dog is behind the box.",
    choices: ["behind the box", "next to the box", "on the box", "under the box"],
    answer: "behind the box"
  },
  {
    id: "ket-monday-not-friday",
    question: "When is the school trip?",
    script: "The school trip was on Friday last year. This year it is on Monday.",
    choices: ["Monday", "Friday", "Saturday", "Sunday"],
    answer: "Monday"
  },
  {
    id: "ket-cake-for-grandma",
    question: "What does Dad buy?",
    script: "Dad buys apples for lunch, but he buys a cake for Grandma.",
    choices: ["cake", "apple", "banana", "fish"],
    answer: "cake"
  },
  {
    id: "ket-garden-then-park",
    question: "Where will the children play first?",
    script: "The children will go to the park later. First, they will play in the garden.",
    choices: ["garden", "park", "school", "library"],
    answer: "garden"
  },
  {
    id: "ket-read-not-film",
    question: "What will Lily do tonight?",
    script: "Lily says, I watched a film yesterday, so tonight I will read a book.",
    choices: ["read a book", "watch a film", "draw a picture", "ride a bike"],
    answer: "read a book"
  },
  {
    id: "ket-chocolate-for-dad",
    question: "Which ice cream is for Dad?",
    script: "Maya has lemon ice cream. Dad does not want vanilla. He chooses chocolate ice cream.",
    choices: ["chocolate ice cream", "lemon ice cream", "vanilla ice cream", "strawberry ice cream"],
    answer: "chocolate ice cream"
  },
  {
    id: "ket-green-bag-under-chair",
    question: "What is under the chair?",
    script: "The red shoes are by the door. The green bag is under the chair.",
    choices: ["green bag", "red shoes", "blue hat", "yellow coat"],
    answer: "green bag"
  }
];

const b1ListeningBank = [
  {
    id: "b1-swimming",
    question: "When will they go swimming?",
    script: "Mum says, We can go swimming on Saturday. Tom says, I have football then. Can we go on Sunday? Mum says, Good idea.",
    choices: ["Sunday", "Saturday", "Friday", "Monday"],
    answer: "Sunday"
  },
  {
    id: "b1-ice-cream",
    question: "Which ice cream did Lily choose?",
    script: "Lily wanted chocolate ice cream, but the shop had none left. There was lemon ice cream and strawberry ice cream, so she chose strawberry ice cream.",
    choices: ["strawberry ice cream", "chocolate ice cream", "lemon ice cream", "vanilla ice cream"],
    answer: "strawberry ice cream"
  },
  {
    id: "b1-reason",
    question: "Why is Alex late?",
    script: "Alex says, Sorry I am late. The bus was on time, but I could not find my school bag this morning.",
    choices: ["He lost his bag.", "The bus was late.", "He missed lunch.", "It was raining."],
    answer: "He lost his bag."
  },
  {
    id: "b1-plan",
    question: "What will they do first?",
    script: "The children want to play in the park, but Dad says they must buy bread first. After that, they can go to the park.",
    choices: ["buy bread", "go to the park", "play football", "visit Grandma"],
    answer: "buy bread"
  },
  {
    id: "b1-opinion",
    question: "How does Sara feel about the film?",
    script: "Sara says, The film was a little long, but the story was exciting and I would like to see it again.",
    choices: ["liked it", "hated it", "fell asleep", "did not understand it"],
    answer: "liked it"
  },
  {
    id: "b1-change",
    question: "What changed?",
    script: "The picnic was going to be in the park, but it started to rain. Now everyone will meet at Anna's house.",
    choices: ["the place", "the food", "the people", "the day"],
    answer: "the place"
  },
  {
    id: "b1-library-first",
    question: "What will Maya do first?",
    script: "Maya wanted to go to the park, but her library book is due today. She will read the last page first, then go out.",
    choices: ["read a book", "go to the park", "buy bread", "visit Grandma"],
    answer: "read a book"
  },
  {
    id: "b1-lemon-ice-cream",
    question: "Which ice cream did Noah choose?",
    script: "Noah usually chooses strawberry ice cream, but today he wanted something fresh. He chose lemon ice cream, not vanilla ice cream.",
    choices: ["lemon ice cream", "strawberry ice cream", "vanilla ice cream", "chocolate ice cream"],
    answer: "lemon ice cream"
  },
  {
    id: "b1-rainy-late",
    question: "Why is Ella late?",
    script: "Ella says, The bus came on time, but I walked slowly because it was raining hard.",
    choices: ["It was raining.", "The bus was late.", "He lost his bag.", "He missed lunch."],
    answer: "It was raining."
  },
  {
    id: "b1-saturday-plan",
    question: "When will Dad visit Grandma?",
    script: "Dad wanted to visit Grandma on Friday, but she is busy. He will visit her on Saturday instead.",
    choices: ["Saturday", "Friday", "Sunday", "Monday"],
    answer: "Saturday"
  },
  {
    id: "b1-film-sleep",
    question: "How did Max feel about the film?",
    script: "Max says, The film started well, but after half an hour I was so tired that I fell asleep.",
    choices: ["fell asleep", "liked it", "hated it", "did not understand it"],
    answer: "fell asleep"
  },
  {
    id: "b1-food-change",
    question: "What changed?",
    script: "They planned to take sandwiches, but the shop was closed. In the end, Mum made pasta instead.",
    choices: ["the food", "the place", "the people", "the day"],
    answer: "the food"
  },
  {
    id: "b1-football-first",
    question: "What will the children do first?",
    script: "The children want to watch a film, but it is sunny now. They will play football first and watch the film later.",
    choices: ["play football", "watch a film", "read a book", "buy bread"],
    answer: "play football"
  },
  {
    id: "b1-monday-swim",
    question: "When is the swimming lesson?",
    script: "The swimming lesson is usually on Sunday. This week the pool is closed, so the lesson is on Monday.",
    choices: ["Monday", "Sunday", "Saturday", "Friday"],
    answer: "Monday"
  },
  {
    id: "b1-understand-film",
    question: "How does Sara feel about the story?",
    script: "Sara says, The pictures were beautiful, but the story moved too fast. I did not understand it.",
    choices: ["did not understand it", "liked it", "hated it", "fell asleep"],
    answer: "did not understand it"
  },
  {
    id: "b1-people-change",
    question: "What changed?",
    script: "The class trip was for twenty children, but five children are ill today. Fewer people are going now.",
    choices: ["the people", "the place", "the food", "the day"],
    answer: "the people"
  },
  {
    id: "b1-bread-before-park",
    question: "What does Oliver need to do before the park?",
    script: "Oliver can go to the park, but his mum asks him to buy bread on the way there.",
    choices: ["buy bread", "go to the park", "visit Grandma", "ride a bike"],
    answer: "buy bread"
  },
  {
    id: "b1-vanilla-choice",
    question: "Which ice cream did Amy choose?",
    script: "Amy wanted chocolate ice cream, but it was too sweet. She tried lemon ice cream, then chose vanilla ice cream.",
    choices: ["vanilla ice cream", "chocolate ice cream", "lemon ice cream", "strawberry ice cream"],
    answer: "vanilla ice cream"
  }
];

const baseEnglishSkillBank = [
  {
    id: "rain-coat",
    prompt: "Read and choose.",
    text: "I need it when it rains.",
    spoken: "I need it when it rains. Which picture matches?",
    hint: "Think about the weather.",
    choices: ["yellow raincoat", "blue hat", "red shoes", "green bag"],
    answer: "yellow raincoat"
  },
  {
    id: "read-place",
    prompt: "Read and choose.",
    text: "You can read many books there.",
    spoken: "You can read many books there. Which place matches?",
    hint: "Look for the best place.",
    choices: ["library", "cafe", "park", "kitchen"],
    answer: "library"
  },
  {
    id: "six-square-faces",
    prompt: "Read and choose.",
    text: "It is a solid shape with six square faces.",
    spoken: "It is a solid shape with six square faces. Which shape is it?",
    hint: "Think about a box shape.",
    choices: ["cube", "sphere", "cone", "pyramid"],
    answer: "cube"
  },
  {
    id: "round-no-corners",
    prompt: "Read and choose.",
    text: "It is round and has no corners.",
    spoken: "It is round and has no corners. Which shape matches?",
    hint: "Look for the round shape.",
    choices: ["circle", "triangle", "square", "rectangle"],
    answer: "circle"
  },
  {
    id: "long-yellow-fruit",
    prompt: "Read and choose.",
    text: "This fruit is long and yellow.",
    spoken: "This fruit is long and yellow. Which fruit is it?",
    hint: "Use the clues.",
    choices: ["banana", "apple", "cake", "fish"],
    answer: "banana"
  },
  {
    id: "feet-clothing",
    prompt: "Read and choose.",
    text: "You wear them on your feet.",
    spoken: "You wear them on your feet. Which picture matches?",
    hint: "Think about clothes.",
    choices: ["red shoes", "blue hat", "yellow coat", "green bag"],
    answer: "red shoes"
  },
  {
    id: "school-place",
    prompt: "Read and choose.",
    text: "Children learn with a teacher here.",
    spoken: "Children learn with a teacher here. Which place matches?",
    hint: "Think about a school day.",
    choices: ["school", "shop", "cafe", "garden"],
    answer: "school"
  },
  {
    id: "cold-dessert",
    prompt: "Read and choose.",
    text: "It is cold, sweet, and lemon flavoured.",
    spoken: "It is cold, sweet, and lemon flavoured. Which one is it?",
    hint: "Listen for the flavour word.",
    choices: ["lemon ice cream", "vanilla ice cream", "strawberry ice cream", "chocolate ice cream"],
    answer: "lemon ice cream"
  },
  {
    id: "book-action",
    prompt: "Read and choose.",
    text: "Open it and look at the words.",
    spoken: "Open it and look at the words. What do you do?",
    hint: "Think about reading.",
    choices: ["read a book", "ride a bike", "watch a film", "play football"],
    answer: "read a book"
  },
  {
    id: "buying-place",
    prompt: "Read and choose.",
    text: "Dad buys apples here.",
    spoken: "Dad buys apples here. Which place matches?",
    hint: "Think about shopping.",
    choices: ["shop", "library", "school", "swimming pool"],
    answer: "shop"
  },
  {
    id: "solid-roll",
    prompt: "Read and choose.",
    text: "This solid can roll like a ball.",
    spoken: "This solid can roll like a ball. Which shape matches?",
    hint: "Look for the smooth solid.",
    choices: ["sphere", "cube", "pyramid", "rectangular prism"],
    answer: "sphere"
  },
  {
    id: "flat-four-sides",
    prompt: "Read and choose.",
    text: "It has four equal sides.",
    spoken: "It has four equal sides. Which shape is it?",
    hint: "All sides are the same length.",
    choices: ["square", "rectangle", "triangle", "oval"],
    answer: "square"
  },
  {
    id: "first-weekday",
    prompt: "Read and choose.",
    text: "It is the first school day of the week.",
    spoken: "It is the first school day of the week. Which day is it?",
    hint: "Look at the calendar.",
    choices: ["Monday", "Friday", "Saturday", "Sunday"],
    answer: "Monday"
  },
  {
    id: "watch-place",
    prompt: "Read and choose.",
    text: "You sit and watch a story on a screen.",
    spoken: "You sit and watch a story on a screen. Which picture matches?",
    hint: "Think about a screen.",
    choices: ["watch a film", "read a book", "draw a picture", "buy bread"],
    answer: "watch a film"
  },
  {
    id: "bag-purpose",
    prompt: "Read and choose.",
    text: "You put your books and snack inside it.",
    spoken: "You put your books and snack inside it. Which picture matches?",
    hint: "Think about school things.",
    choices: ["green bag", "blue hat", "red shoes", "yellow coat"],
    answer: "green bag"
  },
  {
    id: "windy-kite",
    prompt: "Read and choose.",
    text: "It is not an animal. You can fly it on a windy day.",
    spoken: "It is not an animal. You can fly it on a windy day. Which picture matches?",
    hint: "Use both clues.",
    choices: ["kite", "bird", "ball", "car"],
    answer: "kite"
  },
  {
    id: "grandma-clue",
    prompt: "Read and choose.",
    text: "She is your mum's mother.",
    spoken: "She is your mum's mother. Who is it?",
    hint: "Think about family.",
    choices: ["grandma", "mum", "sister", "baby"],
    answer: "grandma"
  },
  {
    id: "white-drink",
    prompt: "Read and choose.",
    text: "It is a white drink. Some children have it with breakfast.",
    spoken: "It is a white drink. Some children have it with breakfast. Which one is it?",
    hint: "Use the colour and drink clues.",
    choices: ["milk", "juice", "rice", "cake"],
    answer: "milk"
  },
  {
    id: "wool-animal",
    prompt: "Read and choose.",
    text: "This animal has wool and says baa.",
    spoken: "This animal has wool and says baa. Which animal is it?",
    hint: "Listen for the animal sound.",
    choices: ["sheep", "horse", "cow", "lion"],
    answer: "sheep"
  },
  {
    id: "cold-neck",
    prompt: "Read and choose.",
    text: "You wear it round your neck when it is cold.",
    spoken: "You wear it round your neck when it is cold. Which picture matches?",
    hint: "Think about winter clothes.",
    choices: ["scarf", "shirt", "socks", "hat"],
    answer: "scarf"
  },
  {
    id: "night-sky-round",
    prompt: "Read and choose.",
    text: "You can see it in the sky at night. It looks round.",
    spoken: "You can see it in the sky at night. It looks round. Which picture matches?",
    hint: "Think about the night sky.",
    choices: ["moon", "sun", "star", "tree"],
    answer: "moon"
  },
  {
    id: "between-days",
    prompt: "Read and choose.",
    text: "It comes after Monday and before Wednesday.",
    spoken: "It comes after Monday and before Wednesday. Which day is it?",
    hint: "Say the days in order.",
    choices: ["Tuesday", "Monday", "Wednesday", "Friday"],
    answer: "Tuesday"
  },
  {
    id: "behind-not-under",
    prompt: "Read and choose.",
    text: "The ball is not under the box. It is behind the box.",
    spoken: "The ball is not under the box. It is behind the box. Which picture matches?",
    hint: "Use the second sentence.",
    choices: ["behind the box", "under the box", "on the box", "next to the box"],
    answer: "behind the box"
  },
  {
    id: "six-side-shape",
    prompt: "Read and choose.",
    text: "It is a flat shape with six sides.",
    spoken: "It is a flat shape with six sides. Which shape is it?",
    hint: "Count the sides.",
    choices: ["hexagon", "pentagon", "triangle", "square"],
    answer: "hexagon"
  },
  {
    id: "three-corners-shape",
    prompt: "Read and choose.",
    text: "It has three corners and three sides.",
    spoken: "It has three corners and three sides. Which shape is it?",
    hint: "Count the corners.",
    choices: ["triangle", "square", "circle", "hexagon"],
    answer: "triangle"
  },
  {
    id: "same-end-rhyme",
    prompt: "Read and choose.",
    text: "It rhymes with cat and hat.",
    spoken: "It rhymes with cat and hat. Which word is it?",
    hint: "Listen to the ending sound.",
    choices: ["mat", "dog", "sun", "pen"],
    answer: "mat"
  },
  {
    id: "two-clue-action",
    prompt: "Read and choose.",
    text: "You use your legs and a ball. You do this outside.",
    spoken: "You use your legs and a ball. You do this outside. Which action is it?",
    hint: "Use both clues.",
    choices: ["play football", "read a book", "watch a film", "buy bread"],
    answer: "play football"
  }
];

function uniqueChoiceSet(answer, pool, size = 4) {
  const used = new Set([answer]);
  const choices = [answer];
  for (const item of pool) {
    if (!used.has(item)) {
      used.add(item);
      choices.push(item);
    }
    if (choices.length >= size) break;
  }
  return choices;
}

function pushUniqueQuestion(items, item, target) {
  if (items.length >= target || items.some((existing) => existing.id === item.id)) return;
  items.push(item);
}

function isAbstractChangeQuestion(item) {
  const changeLabels = new Set(["the place", "the food", "the people", "the day"]);
  return Array.isArray(item?.choices) && item.choices.length > 0 && item.choices.every((choice) => changeLabels.has(choice));
}

function filterListeningBankForAge(items) {
  return items.filter((item) => !isAbstractChangeQuestion(item));
}

function expandKetListeningBank(baseItems, target = 100) {
  const items = filterListeningBankForAge(baseItems).slice();
  const places = ["library", "cafe", "school", "park", "shop", "kitchen", "garden", "bedroom", "swimming pool", "bus stop"];
  const clothes = ["blue coat", "yellow coat", "green bag", "pink bag", "red shoes", "blue hat", "green hat", "orange bag"];
  const actions = ["read a book", "watch a film", "ride a bike", "draw a picture", "buy bread", "go to the park", "play football", "visit Grandma"];
  const foods = ["apple", "banana", "cake", "fish", "lemon ice cream", "vanilla ice cream", "strawberry ice cream", "chocolate ice cream"];
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const times = ["one o'clock", "two o'clock", "three o'clock", "four o'clock", "five o'clock", "six o'clock", "seven o'clock", "ten o'clock"];
  const reasons = ["It was raining.", "The bus was late.", "He lost his bag.", "He missed lunch."];
  const feelings = ["liked it", "hated it", "fell asleep", "did not understand it"];
  const objects = ["apple", "banana", "cat", "dog", "fish", "car", "ball", "book", "cake", "green bag"];

  places.forEach((answer, index) => {
    const other = places[(index + 3) % places.length];
    pushUniqueQuestion(items, {
      id: `ket-place-${index + 1}`,
      question: "Where will they go?",
      script: `Girl: Shall we go to the ${other} first? Boy: Not today. Mum is waiting at the ${answer}. Girl: All right, let's go there.`,
      choices: uniqueChoiceSet(answer, places.slice(index + 1).concat(places)),
      answer
    }, target);
  });

  actions.forEach((answer, index) => {
    const oldPlan = actions[(index + 2) % actions.length];
    pushUniqueQuestion(items, {
      id: `ket-action-${index + 1}`,
      question: "What will the child do?",
      script: `Boy: Can I ${oldPlan} now? Dad: No, we need to ${answer} first. Boy: OK, I will do that now.`,
      choices: uniqueChoiceSet(answer, actions.slice(index + 1).concat(actions)),
      answer
    }, target);
  });

  clothes.forEach((answer, index) => {
    const notNeeded = clothes[(index + 4) % clothes.length];
    pushUniqueQuestion(items, {
      id: `ket-clothes-${index + 1}`,
      question: "What does the girl need?",
      script: `Mum: Do you need your ${notNeeded}? Girl: No, I have that already. I cannot find my ${answer}. Mum: Look by the door.`,
      choices: uniqueChoiceSet(answer, clothes.slice(index + 1).concat(clothes)),
      answer
    }, target);
  });

  foods.forEach((answer, index) => {
    const unavailable = foods[(index + 1) % foods.length];
    pushUniqueQuestion(items, {
      id: `ket-food-${index + 1}`,
      question: "What does the child choose?",
      script: `Woman: We have ${unavailable} today. Child: I had that yesterday. Can I have ${answer}, please? Woman: Yes, of course.`,
      choices: uniqueChoiceSet(answer, foods.slice(index + 1).concat(foods)),
      answer
    }, target);
  });

  days.forEach((answer, index) => {
    const usual = days[(index + 2) % days.length];
    pushUniqueQuestion(items, {
      id: `ket-day-${index + 1}`,
      question: "When is the lesson?",
      script: `Teacher: The lesson is not on ${usual} this week. It has moved to ${answer}. Boy: I will write that down.`,
      choices: uniqueChoiceSet(answer, days.slice(index + 1).concat(days)),
      answer
    }, target);
  });

  times.forEach((answer, index) => {
    const oldTime = times[(index + 3) % times.length];
    pushUniqueQuestion(items, {
      id: `ket-time-${index + 1}`,
      question: "What time does it start?",
      script: `Girl: Does the club start at ${oldTime}? Teacher: Usually, yes. Today it starts at ${answer}. Girl: Thanks.`,
      choices: uniqueChoiceSet(answer, times.slice(index + 1).concat(times)),
      answer
    }, target);
  });

  reasons.forEach((answer, index) => {
    const scripts = {
      "It was raining.": "Woman: Why did you walk slowly? Boy: The bus was fine, but it was raining hard.",
      "The bus was late.": "Girl: I left home early, but the bus did not come for twenty minutes.",
      "He lost his bag.": "Mum: Why is Tom upset? Girl: He cannot find his school bag.",
      "He missed lunch.": "Teacher: Why is Ben hungry? Girl: He played outside and missed lunch."
    };
    pushUniqueQuestion(items, {
      id: `ket-reason-${index + 1}`,
      question: "What was the problem?",
      script: scripts[answer],
      choices: uniqueChoiceSet(answer, reasons.slice(index + 1).concat(reasons)),
      answer
    }, target);
  });

  feelings.forEach((answer, index) => {
    const scripts = {
      "liked it": "Girl: The film was long, but the story was exciting. I want to see it again.",
      "hated it": "Boy: The game was too noisy and I did not enjoy it at all.",
      "fell asleep": "Girl: The story started well, but I was so tired that I slept before the end.",
      "did not understand it": "Boy: The pictures were nice, but the story moved too fast for me."
    };
    pushUniqueQuestion(items, {
      id: `ket-feeling-${index + 1}`,
      question: "What does the child say?",
      script: scripts[answer],
      choices: uniqueChoiceSet(answer, feelings.slice(index + 1).concat(feelings)),
      answer
    }, target);
  });

  objects.forEach((answer, index) => {
    const other = objects[(index + 5) % objects.length];
    pushUniqueQuestion(items, {
      id: `ket-object-${index + 1}`,
      question: "Which thing does the child take?",
      script: `Dad: Are you taking the ${other}? Child: No, I need the ${answer} today. Dad: Put it in your bag.`,
      choices: uniqueChoiceSet(answer, objects.slice(index + 1).concat(objects)),
      answer
    }, target);
  });

  let fillerIndex = 0;
  while (items.length < target) {
    const place = places[fillerIndex % places.length];
    const day = days[(fillerIndex + 2) % days.length];
    const action = actions[(fillerIndex + 4) % actions.length];
    const answer = fillerIndex % 2 === 0 ? place : action;
    const pool = fillerIndex % 2 === 0 ? places : actions;
    pushUniqueQuestion(items, {
      id: `ket-extra-${fillerIndex + 1}`,
      question: fillerIndex % 2 === 0 ? "Where will the children meet?" : "What will they do first?",
      script: fillerIndex % 2 === 0
        ? `Boy: Shall we meet on ${day} at the ${places[(fillerIndex + 1) % places.length]}? Girl: No, meet me at the ${place}.`
        : `Girl: Can we play later? Mum: Yes, but first you need to ${action}.`,
      choices: uniqueChoiceSet(answer, pool.slice(fillerIndex + 1).concat(pool)),
      answer
    }, target);
    fillerIndex += 1;
  }

  return items.slice(0, target);
}

function expandEnglishSkillBank(baseItems, target = 100) {
  const items = baseItems.slice();
  const clueItems = [
    ["You can borrow books here.", "library", ["library", "school", "cafe", "park"]],
    ["You buy fruit and bread here.", "shop", ["shop", "library", "school", "garden"]],
    ["You wear this on a rainy day.", "yellow raincoat", ["yellow raincoat", "blue hat", "red shoes", "green bag"]],
    ["This pet barks and runs.", "dog", ["dog", "cat", "fish", "ball"]],
    ["This pet says meow.", "cat", ["cat", "dog", "fish", "car"]],
    ["This is a cold sweet food.", "vanilla ice cream", ["vanilla ice cream", "banana", "fish", "apple"]],
    ["You use this to carry school things.", "green bag", ["green bag", "blue hat", "red shoes", "yellow coat"]],
    ["This shape has three sides.", "triangle", ["triangle", "square", "circle", "rectangle"]],
    ["This solid is like a ball.", "sphere", ["sphere", "cube", "cone", "pyramid"]],
    ["This solid has a point and a circle.", "cone", ["cone", "cylinder", "cube", "sphere"]],
    ["This is the day after Friday.", "Saturday", ["Saturday", "Friday", "Sunday", "Monday"]],
    ["This is the day before Tuesday.", "Monday", ["Monday", "Tuesday", "Friday", "Sunday"]],
    ["You do this with a pencil and paper.", "draw a picture", ["draw a picture", "ride a bike", "watch a film", "buy bread"]],
    ["You do this on two wheels.", "ride a bike", ["ride a bike", "read a book", "watch a film", "visit Grandma"]],
    ["You do this when you look at words in a book.", "read a book", ["read a book", "play football", "ride a bike", "buy bread"]],
    ["It has two long sides and two short sides.", "rectangle", ["rectangle", "square", "triangle", "oval"]],
    ["It is round but flat.", "circle", ["circle", "sphere", "square", "diamond"]],
    ["It is a solid with two circles.", "cylinder", ["cylinder", "cone", "pyramid", "sphere"]],
    ["You can swim here.", "swimming pool", ["swimming pool", "library", "shop", "bedroom"]],
    ["You wait here for a bus.", "bus stop", ["bus stop", "cafe", "garden", "kitchen"]],
    ["It is not an animal. You can fly it on a windy day.", "kite", ["kite", "bird", "ball", "car"]],
    ["She is your mum's mother.", "grandma", ["grandma", "mum", "sister", "baby"]],
    ["It is a white drink.", "milk", ["milk", "juice", "rice", "cake"]],
    ["This animal has wool and says baa.", "sheep", ["sheep", "horse", "cow", "lion"]],
    ["You wear it round your neck when it is cold.", "scarf", ["scarf", "shirt", "socks", "hat"]],
    ["It comes after Monday and before Wednesday.", "Tuesday", ["Tuesday", "Monday", "Wednesday", "Friday"]],
    ["It is in the sky at night and looks round.", "moon", ["moon", "sun", "star", "tree"]],
    ["It has six sides.", "hexagon", ["hexagon", "pentagon", "triangle", "square"]],
    ["It rhymes with cat and hat.", "mat", ["mat", "dog", "sun", "pen"]],
    ["You use your legs and a ball. You do this outside.", "play football", ["play football", "read a book", "watch a film", "buy bread"]],
    ["You kick this when you play football.", "ball", ["ball", "book", "cake", "hat"]],
    ["It shines in the sky in the day.", "sun", ["sun", "moon", "star", "tree"]],
    ["It is small and shines in the night sky.", "star", ["star", "sun", "car", "fish"]],
    ["It grows tall and has leaves.", "tree", ["tree", "flower", "car", "book"]],
    ["It has five sides.", "pentagon", ["pentagon", "hexagon", "triangle", "circle"]],
    ["It is half of a circle.", "semicircle", ["semicircle", "circle", "oval", "rectangle"]],
    ["This solid is like a box.", "rectangular prism", ["rectangular prism", "cube", "sphere", "cone"]],
    ["This solid is like a can.", "cylinder", ["cylinder", "cone", "pyramid", "sphere"]],
    ["This solid is like a tent.", "triangular prism", ["triangular prism", "cube", "sphere", "hemisphere"]],
    ["It is half of a ball shape.", "hemisphere", ["hemisphere", "sphere", "cone", "cube"]],
    ["You put this on your head.", "hat", ["hat", "shoes", "scarf", "bag"]],
    ["You wear these on your feet.", "shoes", ["shoes", "hat", "shirt", "bag"]],
    ["You put books and toys inside it.", "bag", ["bag", "hat", "cup", "tree"]],
    ["This room has a bed.", "bedroom", ["bedroom", "kitchen", "garden", "school"]],
    ["You cook food here.", "kitchen", ["kitchen", "bedroom", "library", "park"]],
    ["You can see flowers and trees here.", "garden", ["garden", "kitchen", "cafe", "bus stop"]],
    ["This is the day after Sunday.", "Monday", ["Monday", "Sunday", "Tuesday", "Friday"]],
    ["This is the day before Friday.", "Thursday", ["Thursday", "Friday", "Wednesday", "Monday"]],
    ["It is cold, white weather.", "snowy", ["snowy", "sunny", "windy", "rainy"]],
    ["It is weather that can move a kite.", "windy", ["windy", "rainy", "cloudy", "snowy"]]
  ];
  const noticeItems = [
    ["Please do not talk. People are reading.", "library", ["library", "park", "shop", "bedroom"]],
    ["Fresh apples today. Pay at the door.", "shop", ["shop", "school", "library", "cafe"]],
    ["Class starts at nine. Bring your book.", "school", ["school", "cafe", "garden", "bus stop"]],
    ["The water is cold. Walk, do not run.", "swimming pool", ["swimming pool", "library", "kitchen", "shop"]],
    ["Hot drinks and cake inside.", "cafe", ["cafe", "school", "park", "bus stop"]],
    ["Meet here before the bus comes.", "bus stop", ["bus stop", "garden", "bedroom", "library"]],
    ["No football near the flowers.", "garden", ["garden", "kitchen", "shop", "school"]],
    ["Sleep quietly. The light is off.", "bedroom", ["bedroom", "cafe", "park", "shop"]]
  ];
  const sentenceItems = [
    ["The ball is not under the box. It is on the box.", "on the box", ["on the box", "under the box", "next to the box", "behind the box"]],
    ["The ball is not on the box. It is under the box.", "under the box", ["under the box", "on the box", "next to the box", "behind the box"]],
    ["The ball is beside the box.", "next to the box", ["next to the box", "behind the box", "on the box", "under the box"]],
    ["You cannot see all the ball because it is behind the box.", "behind the box", ["behind the box", "on the box", "under the box", "next to the box"]]
  ];

  const addReadingItem = (prefix, index, text, answer, choices) => {
    pushUniqueQuestion(items, {
      id: `${prefix}-${index + 1}`,
      prompt: prefix === "notice" ? "Read the notice." : "Read and choose.",
      text,
      spoken: `${text} Which picture matches?`,
      hint: prefix === "notice" ? "Think about where you see this message." : "Use the English clues.",
      choices,
      answer
    }, target);
  };

  clueItems.forEach((item, index) => addReadingItem("clue", index, item[0], item[1], item[2]));
  noticeItems.forEach((item, index) => addReadingItem("notice", index, item[0], item[1], item[2]));
  sentenceItems.forEach((item, index) => addReadingItem("position", index, item[0], item[1], item[2]));

  let fillerIndex = 0;
  while (items.length < target) {
    const item = clueItems[fillerIndex % clueItems.length];
    const clueFrames = [
      "{clue}",
      "{clue} Find the matching picture.",
      "{clue} Which picture is right?",
      "{clue} Choose the best picture."
    ];
    const text = clueFrames[Math.floor(fillerIndex / clueItems.length) % clueFrames.length].replace("{clue}", item[0]);
    addReadingItem("extra-clue", fillerIndex, text, item[1], item[2]);
    fillerIndex += 1;
  }

  return items.slice(0, target);
}

function createNumberSenseBank(target = 100) {
  const buckets = [[], [], [], [], [], [], [], [], [], [], [], []];
  for (let filled = 3; filled <= 9; filled += 1) buckets[0].push({ id: `ns-ten-${filled}`, type: "make-ten", filled });
  for (let whole = 8; whole <= 20; whole += 1) {
    for (let part = 1; part < whole; part += 1) buckets[2].push({ id: `ns-bond-${part}-${whole}`, type: "number-bond", part, whole });
  }
  for (let start = 6; start <= 32; start += 1) buckets[5].push({ id: `ns-count-on-${start}`, type: "count-on", start, steps: 3 + (start % 3) });
  for (let count = 9; count <= 30; count += 1) buckets[6].push({ id: `ns-odd-even-${count}`, type: "odd-even", count });
  [2, 5, 10].forEach((step) => {
    const maxStart = step === 10 ? 60 : step === 5 ? 40 : 30;
    for (let start = step; start <= maxStart; start += step) {
      buckets[7].push({ id: `ns-skip-${step}-${start}`, type: "skip-count", start, step });
    }
  });
  for (let number = 21; number <= 60; number += 1) buckets[8].push({ id: `ns-place-${number}`, type: "place-value", number });
  for (let left = 21; left <= 70; left += 2) {
    const right = left + (left % 3 === 0 ? 5 : 3);
    buckets[9].push({ id: `ns-compare-big-${left}-${right}`, type: "compare-two-digit", left, right, ask: "bigger" });
    buckets[9].push({ id: `ns-compare-small-${left}-${right}`, type: "compare-two-digit", left, right, ask: "smaller" });
  }
  for (let whole = 10; whole <= 20; whole += 1) {
    for (let part = 1; part <= Math.floor(whole / 2); part += 1) {
      buckets[10].push({ id: `ns-ways-${part}-${whole - part}-${whole}`, type: "bond-ways", whole, left: part, right: whole - part });
    }
  }
  for (let target = 3; target <= 6; target += 1) buckets[11].push({ id: `ns-ordinal-${target}`, type: "ordinal", target });

  const items = [];
  let index = 0;
  while (items.length < target && buckets.some((bucket) => bucket.length)) {
    const bucket = buckets[index % buckets.length];
    if (bucket.length) items.push(bucket.shift());
    index += 1;
  }
  return items;
}

function createMathReasoningBank(target = 100) {
  const buckets = [[], [], [], [], [], [], [], [], [], [], []];
  for (let left = 2; left <= 12; left += 1) {
    for (let right = 2; right <= 12; right += 1) {
      const total = left + right;
      if (total >= 10 && total <= 20) buckets[0].push({ id: `mr-add-${left}-${right}`, type: "add", left, right });
    }
  }
  for (let left = 8; left <= 20; left += 1) {
    for (let right = 2; right < left && right <= 10; right += 1) {
      if (left - right >= 2) buckets[1].push({ id: `mr-sub-${left}-${right}`, type: "subtract", left, right });
    }
  }
  for (let total = 6; total <= 15; total += 1) {
    for (let left = 1; left < total; left += 1) buckets[2].push({ id: `mr-balance-${left}-${total}`, type: "balance", left, total });
  }
  for (let start = 2; start <= 8; start += 1) {
    for (let add = 1; add <= 4; add += 1) {
      for (let take = 1; take <= Math.min(4, start + add - 1); take += 1) {
        buckets[3].push({ id: `mr-two-${start}-${add}-${take}`, type: "two-step", start, add, take });
      }
    }
  }
  for (let rows = 2; rows <= 4; rows += 1) {
    for (let cols = 2; cols <= 5; cols += 1) buckets[4].push({ id: `mr-array-${rows}-${cols}`, type: "array", rows, cols });
  }
  for (let whole = 5; whole <= 20; whole += 1) {
    for (let left = 1; left < whole && left <= 10; left += 1) {
      buckets[5].push({ id: `mr-missing-${left}-${whole}`, type: "missing-addend", left, whole });
    }
  }
  for (let first = 1; first <= 6; first += 1) {
    for (let second = 1; second <= 6; second += 1) {
      const third = 1 + ((first + second) % 5);
      if (first + second + third <= 20) {
        buckets[6].push({ id: `mr-three-${first}-${second}-${third}`, type: "three-addend", first, second, third });
      }
    }
  }
  for (let number = 2; number <= 10; number += 1) buckets[7].push({ id: `mr-double-${number}`, type: "doubles", number });
  for (let whole = 4; whole <= 20; whole += 2) buckets[8].push({ id: `mr-half-${whole}`, type: "halves", whole });
  for (let left = 3; left <= 20; left += 2) {
    const right = left + (left % 3 === 0 ? 0 : 2);
    buckets[9].push({ id: `mr-symbol-${left}-${right}`, type: "compare-symbol", left, right });
    if (right !== left) buckets[9].push({ id: `mr-symbol-${right}-${left}`, type: "compare-symbol", left: right, right: left });
  }
  ["half", "quarter", "all", "none"].forEach((kind, index) => {
    for (let repeat = 0; repeat < 5; repeat += 1) buckets[10].push({ id: `mr-fraction-${kind}-${repeat}`, type: "fraction", kind, offset: index + repeat });
  });

  const items = [];
  let index = 0;
  while (items.length < target && buckets.some((bucket) => bucket.length)) {
    const bucket = buckets[index % buckets.length];
    if (bucket.length) items.push(bucket.shift());
    index += 1;
  }
  return items;
}

function createLogicSpatialBank(target = 100) {
  const patternKinds = ["abab", "aab", "abc", "abb", "abbc"];
  const compositionKinds = ["two-triangles-square", "two-squares-rectangle", "cube-face", "pyramid-face", "cylinder-face", "sphere-roll"];
  const geometryKinds = ["symmetry", "rotation", "attribute-2d", "attribute-3d", "real-world"];
  const types = ["pattern", "pattern", "analogy", "analogy", "compose", "compose", ...geometryKinds];
  const items = [];
  let index = 0;
  while (items.length < target) {
    const type = types[index % types.length];
    if (type === "pattern") {
      items.push({ id: `ls-pattern-${index}`, type, patternKind: patternKinds[index % patternKinds.length], offset: index });
    } else if (type === "compose") {
      items.push({ id: `ls-compose-${index}`, type, compositionKind: compositionKinds[index % compositionKinds.length], offset: index });
    } else if (geometryKinds.includes(type)) {
      items.push({ id: `ls-${type}-${index}`, type, offset: index });
    } else {
      items.push({ id: `ls-${type}-${index}`, type, offset: index });
    }
    index += 1;
  }
  return items;
}

const phonicsWords = [
  { word: "ball", initial: "b", final: "l", vowel: "a", sounds: 3, group: "all" },
  { word: "bag", initial: "b", final: "g", vowel: "a", sounds: 3, group: "ag" },
  { word: "bear", initial: "b", final: "r", vowel: "ea", sounds: 3, group: "air" },
  { word: "book", initial: "b", final: "k", vowel: "oo", sounds: 3, group: "ook" },
  { word: "bread", initial: "b", final: "d", vowel: "e", sounds: 4, group: "ed" },
  { word: "cat", initial: "c", final: "t", vowel: "a", sounds: 3, group: "at" },
  { word: "cake", initial: "c", final: "k", vowel: "a-e", sounds: 3, group: "ake" },
  { word: "car", initial: "c", final: "r", vowel: "ar", sounds: 3, group: "ar" },
  { word: "cup", initial: "c", final: "p", vowel: "u", sounds: 3, group: "up" },
  { word: "dog", initial: "d", final: "g", vowel: "o", sounds: 3, group: "og" },
  { word: "doll", initial: "d", final: "l", vowel: "o", sounds: 3, group: "oll" },
  { word: "drum", initial: "d", final: "m", vowel: "u", sounds: 4, group: "um" },
  { word: "fish", initial: "f", final: "sh", vowel: "i", sounds: 3, group: "ish" },
  { word: "flower", initial: "f", final: "r", vowel: "ow", sounds: 4, group: "ower" },
  { word: "fox", initial: "f", final: "x", vowel: "o", sounds: 3, group: "ox" },
  { word: "frog", initial: "f", final: "g", vowel: "o", sounds: 4, group: "og" },
  { word: "hat", initial: "h", final: "t", vowel: "a", sounds: 3, group: "at" },
  { word: "king", initial: "k", final: "ng", vowel: "i", sounds: 3, group: "ing" },
  { word: "kite", initial: "k", final: "t", vowel: "i-e", sounds: 3, group: "ite" },
  { word: "lion", initial: "l", final: "n", vowel: "i", sounds: 4, group: "ion" },
  { word: "log", initial: "l", final: "g", vowel: "o", sounds: 3, group: "og" },
  { word: "mat", initial: "m", final: "t", vowel: "a", sounds: 3, group: "at" },
  { word: "milk", initial: "m", final: "k", vowel: "i", sounds: 4, group: "ilk" },
  { word: "monkey", initial: "m", final: "y", vowel: "o", sounds: 5, group: "key" },
  { word: "moon", initial: "m", final: "n", vowel: "oo", sounds: 3, group: "oon" },
  { word: "nose", initial: "n", final: "z", vowel: "o-e", sounds: 3, group: "ose" },
  { word: "pen", initial: "p", final: "n", vowel: "e", sounds: 3, group: "en" },
  { word: "pig", initial: "p", final: "g", vowel: "i", sounds: 3, group: "ig" },
  { word: "plant", initial: "p", final: "t", vowel: "a", sounds: 5, group: "ant" },
  { word: "rose", initial: "r", final: "z", vowel: "o-e", sounds: 3, group: "ose" },
  { word: "run", initial: "r", final: "n", vowel: "u", sounds: 3, group: "un" },
  { word: "seed", initial: "s", final: "d", vowel: "ee", sounds: 3, group: "eed" },
  { word: "snake", initial: "s", final: "k", vowel: "a-e", sounds: 4, group: "ake" },
  { word: "socks", initial: "s", final: "s", vowel: "o", sounds: 4, group: "ocks" },
  { word: "star", initial: "s", final: "r", vowel: "ar", sounds: 4, group: "ar" },
  { word: "sun", initial: "s", final: "n", vowel: "u", sounds: 3, group: "un" },
  { word: "tree", initial: "t", final: "ee", vowel: "ee", sounds: 3, group: "ee" },
  { word: "wig", initial: "w", final: "g", vowel: "i", sounds: 3, group: "ig" }
];

const sightWords = [
  "a", "and", "away", "big", "blue", "can", "come", "down", "find", "for", "funny", "go",
  "help", "here", "I", "in", "is", "it", "like", "little", "look", "my", "not", "one",
  "play", "red", "said", "see", "the", "to", "two", "up", "we", "you"
];

function createPhonicsBank(target = 140) {
  const types = ["cvc-blend", "short-vowel", "rhyme", "segment", "initial", "final", "cvc-blend", "short-vowel", "rhyme", "sight-word", "letter-sound"];
  return Array.from({ length: target }, (_, index) => ({ id: `ph-${types[index % types.length]}-${index}`, type: types[index % types.length], offset: index }));
}

function createMeasureBank(target = 140) {
  const types = ["picture-graph", "tally", "weight", "capacity", "length", "height", "coin", "clock", "non-standard", "picture-graph", "tally", "day-order", "weather"];
  return Array.from({ length: target }, (_, index) => ({ id: `me-${types[index % types.length]}-${index}`, type: types[index % types.length], offset: index }));
}

function createMusicBank(target = 120) {
  const types = ["part-picture", "part-word", "string-sound", "string-name", "rhythm-count", "part-picture", "string-sound", "string-name", "rhythm-count", "string-count", "bow-job"];
  return Array.from({ length: target }, (_, index) => ({ id: `mu-${types[index % types.length]}-${index}`, type: types[index % types.length], offset: index }));
}

const ketListeningBank = expandKetListeningBank(baseKetListeningBank, 160);
const petListeningBank = filterListeningBankForAge(b1ListeningBank);
const englishSkillBank = expandEnglishSkillBank(baseEnglishSkillBank, 160);
const numberSenseBank = createNumberSenseBank(180);
const mathReasoningBank = createMathReasoningBank(180);
const logicSpatialBank = createLogicSpatialBank(100);
const phonicsBank = createPhonicsBank(220);
const measureBank = createMeasureBank(160);
const musicBank = createMusicBank(140);

const defaultQuestionGoal = 10;
const startingMathStage = 4;
const answerDelayMs = {
  listening: 1800,
  language: 1100,
  thinking: 650
};
const wrongReviewMs = {
  first: 950,
  second: 1500,
  final: 2300
};
const assistedExplanationMs = 2300;
const scoreByWrongAttempts = [10, 7, 4, 2];

const state = {
  activeGame: "ketListen",
  questionGoal: defaultQuestionGoal,
  correctCount: 0,
  score: 0,
  firstTryCount: 0,
  roundResults: [],
  round: 0,
  soundOn: true,
  locked: false,
  answerReady: false,
  choiceUnlockTimer: null,
  wrongAttempts: 0,
  hadIncorrectThisRound: false,
  streak: 0,
  mathStage: startingMathStage,
  challenge: null,
  options: [],
  listeningDecks: {
    ketListen: [],
    petListen: [],
    a2Listen: [],
    b1Listen: []
  },
  englishDeck: [],
  questionDecks: {
    numberSense: [],
    mathReasoning: [],
    logicSpatial: [],
    phonics: [],
    measure: [],
    music: []
  },
  recentQuestionTags: {}
};

const nodes = {
  roundLabel: document.querySelector("#roundLabel"),
  targetArea: document.querySelector("#targetArea"),
  promptText: document.querySelector("#promptText"),
  promptHint: document.querySelector("#promptHint"),
  targetToken: document.querySelector("#targetToken"),
  feedback: document.querySelector("#feedback"),
  options: document.querySelector("#options"),
  stars: document.querySelector("#stars"),
  progressText: document.querySelector("#progressText"),
  scoreText: document.querySelector("#scoreText"),
  celebration: document.querySelector("#celebration"),
  winTitle: document.querySelector("#winTitle"),
  winText: document.querySelector("#winText"),
  playAgainButton: document.querySelector("#playAgainButton"),
  chooseGameButton: document.querySelector("#chooseGameButton"),
  restartButton: document.querySelector("#restartButton"),
  soundToggle: document.querySelector("#soundToggle"),
  soundIcon: document.querySelector("#soundIcon"),
  speakButton: document.querySelector("#speakButton"),
  companion: document.querySelector("#companion"),
  pwaStatus: document.querySelector("#pwaStatus"),
  modeButtons: document.querySelectorAll(".mode-tab"),
  roundButtons: document.querySelectorAll(".round-button")
};

const modeTitles = {
  ketListen: "Listening",
  englishSkills: "English",
  phonics: "Phonics",
  numberSense: "Numbers",
  mathReasoning: "Maths",
  logicSpatial: "Shapes",
  measure: "Measure",
  music: "Music"
};

let audioContext = null;
let currentSpeechAudio = null;
let speechRunId = 0;
const recordedAudioPlaybackRate = 0.9;

function drawApple(color) {
  return `
    <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
      <g stroke="#253041" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M62 28 C63 16 70 10 80 10" fill="none"/>
        <path d="M67 26 C79 16 92 22 93 33 C80 38 72 34 67 26 Z" fill="#65bd53"/>
        <path d="M60 38 C72 24 98 31 98 58 C98 86 78 106 62 96 C47 106 22 88 22 58 C22 31 49 24 60 38 Z" fill="${color}"/>
        <path d="M42 45 C36 52 35 63 39 72" fill="none" stroke="#ffffff" stroke-width="5"/>
      </g>
    </svg>
  `;
}

function drawBanana(color) {
  return `
    <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
      <g stroke="#253041" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M30 28 C47 81 80 92 102 63 C95 101 47 110 17 40 Z" fill="${color}"/>
        <path d="M26 28 L34 24" fill="none"/>
        <path d="M100 62 L108 58" fill="none"/>
      </g>
    </svg>
  `;
}

function drawCat(color) {
  return `
    <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
      <g stroke="#253041" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M29 45 L36 18 L55 36 L65 36 L84 18 L91 45 C99 75 80 100 60 100 C40 100 21 75 29 45 Z" fill="${color}"/>
        <circle cx="46" cy="60" r="5" fill="#253041"/>
        <circle cx="74" cy="60" r="5" fill="#253041"/>
        <path d="M60 66 L54 74 H66 Z" fill="#ff7aa7"/>
        <path d="M50 80 Q60 88 70 80" fill="none"/>
        <path d="M33 70 H17" fill="none"/>
        <path d="M36 82 H20" fill="none"/>
        <path d="M87 70 H103" fill="none"/>
        <path d="M84 82 H100" fill="none"/>
      </g>
    </svg>
  `;
}

function drawDog(color) {
  return `
    <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
      <g stroke="#253041" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M32 38 C35 21 52 16 60 30 C68 16 85 21 88 38 C100 44 104 63 94 80 C84 98 36 98 26 80 C16 63 20 44 32 38 Z" fill="${color}"/>
        <path d="M32 39 C16 35 10 50 20 66 C30 62 35 51 32 39 Z" fill="${color}"/>
        <path d="M88 39 C104 35 110 50 100 66 C90 62 85 51 88 39 Z" fill="${color}"/>
        <circle cx="47" cy="58" r="5" fill="#253041"/>
        <circle cx="73" cy="58" r="5" fill="#253041"/>
        <path d="M60 64 L52 74 H68 Z" fill="#253041"/>
        <path d="M52 82 Q60 90 68 82" fill="none"/>
      </g>
    </svg>
  `;
}

function drawFish(color) {
  return `
    <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
      <g stroke="#253041" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M24 58 L8 36 C30 39 35 48 36 58 C35 68 30 77 8 80 Z" fill="${color}"/>
        <path d="M34 58 C46 31 88 28 108 58 C88 88 46 85 34 58 Z" fill="${color}"/>
        <path d="M62 32 C58 18 76 18 80 33" fill="${color}"/>
        <path d="M62 84 C58 100 76 100 80 83" fill="${color}"/>
        <circle cx="88" cy="53" r="5" fill="#253041"/>
        <path d="M96 66 Q88 72 80 66" fill="none"/>
      </g>
    </svg>
  `;
}

function drawCar(color) {
  return `
    <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
      <g stroke="#253041" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 64 L34 38 H75 L94 64 Z" fill="${color}"/>
        <path d="M16 64 H104 V88 H16 Z" fill="${color}"/>
        <path d="M43 43 H58 V62 H31 Z" fill="#8fd7ff"/>
        <path d="M63 43 H74 L88 62 H63 Z" fill="#8fd7ff"/>
        <circle cx="36" cy="89" r="11" fill="#fffaf0"/>
        <circle cx="84" cy="89" r="11" fill="#fffaf0"/>
      </g>
    </svg>
  `;
}

function drawBall(color) {
  return `
    <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
      <g stroke="#253041" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="60" cy="60" r="43" fill="${color}"/>
        <path d="M60 17 C47 34 47 86 60 103" fill="none"/>
        <path d="M22 47 C43 56 77 56 98 47" fill="none"/>
        <path d="M22 73 C43 64 77 64 98 73" fill="none"/>
      </g>
    </svg>
  `;
}

function drawSun(color) {
  return `
    <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
      <g stroke="#253041" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M60 8 V22 M60 98 V112 M8 60 H22 M98 60 H112 M23 23 L33 33 M87 87 L97 97 M97 23 L87 33 M33 87 L23 97" fill="none"/>
        <circle cx="60" cy="60" r="34" fill="${color}"/>
        <circle cx="48" cy="55" r="4" fill="#253041"/>
        <circle cx="72" cy="55" r="4" fill="#253041"/>
        <path d="M50 70 Q60 78 70 70" fill="none"/>
      </g>
    </svg>
  `;
}

function drawStar(color) {
  return `
    <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
      <path
        d="M60 10 L72 43 L108 44 L80 66 L90 101 L60 80 L30 101 L40 66 L12 44 L48 43 Z"
        fill="${color}"
        stroke="#253041"
        stroke-width="6"
        stroke-linejoin="round"
      />
      <circle cx="48" cy="52" r="4" fill="#253041"/>
      <circle cx="72" cy="52" r="4" fill="#253041"/>
      <path d="M50 66 Q60 74 70 66" fill="none" stroke="#253041" stroke-width="5" stroke-linecap="round"/>
    </svg>
  `;
}

function drawTree(color) {
  return `
    <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
      <g stroke="#253041" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M53 72 H67 V108 H53 Z" fill="#b57345"/>
        <circle cx="43" cy="52" r="25" fill="${color}"/>
        <circle cx="68" cy="39" r="28" fill="${color}"/>
        <circle cx="78" cy="63" r="24" fill="${color}"/>
      </g>
    </svg>
  `;
}

function drawShape(shape, color) {
  const shapeMarkup = {
    circle: `<circle cx="60" cy="60" r="38" fill="${color}"/>`,
    square: `<rect x="25" y="25" width="70" height="70" fill="${color}"/>`,
    triangle: `<path d="M60 18 L104 96 H16 Z" fill="${color}"/>`,
    rectangle: `<rect x="18" y="34" width="84" height="52" rx="6" fill="${color}"/>`,
    diamond: `<path d="M60 14 L106 60 L60 106 L14 60 Z" fill="${color}"/>`,
    oval: `<ellipse cx="60" cy="60" rx="44" ry="30" fill="${color}"/>`,
    pentagon: `<path d="M60 16 L103 49 L86 102 H34 L17 49 Z" fill="${color}"/>`,
    hexagon: `<path d="M30 28 H90 L110 60 L90 92 H30 L10 60 Z" fill="${color}"/>`,
    "shape-star": `<path d="M60 12 L72 46 H108 L79 68 L90 104 L60 82 L30 104 L41 68 L12 46 H48 Z" fill="${color}"/>`,
    heart: `<path d="M60 101 C25 73 18 48 34 34 C47 23 58 31 60 43 C62 31 73 23 86 34 C102 48 95 73 60 101 Z" fill="${color}"/>`,
    semicircle: `<path d="M22 76 A38 38 0 0 1 98 76 Z" fill="${color}"/>`,
    cube: `
      <ellipse cx="61" cy="101" rx="40" ry="6" fill="rgba(74,50,88,0.16)" stroke="none"/>
      <path d="M29 42 L60 23 L93 42 L60 62 Z" fill="${color}" opacity="0.32"/>
      <path d="M29 42 L60 62 V99 L29 78 Z" fill="${color}"/>
      <path d="M93 42 L60 62 V99 L93 78 Z" fill="${color}" opacity="0.72"/>
    `,
    sphere: `
      <ellipse cx="60" cy="100" rx="36" ry="6" fill="rgba(74,50,88,0.16)" stroke="none"/>
      <circle cx="60" cy="58" r="38" fill="${color}"/>
      <ellipse cx="48" cy="46" rx="11" ry="7" fill="#ffffff" opacity="0.45" stroke="none" transform="rotate(-30 48 46)"/>
      <circle cx="44" cy="42" r="3" fill="#ffffff" opacity="0.65" stroke="none"/>
    `,
    cone: `
      <ellipse cx="60" cy="100" rx="34" ry="5" fill="rgba(74,50,88,0.16)" stroke="none"/>
      <ellipse cx="60" cy="86" rx="30" ry="9" fill="${color}" opacity="0.55"/>
      <path d="M60 22 L30 86 A30 9 0 0 0 90 86 Z" fill="${color}"/>
    `,
    cylinder: `
      <ellipse cx="60" cy="101" rx="34" ry="6" fill="rgba(74,50,88,0.16)" stroke="none"/>
      <path d="M28 36 V84 C28 95 92 95 92 84 V36 Z" fill="${color}" opacity="0.9"/>
      <ellipse cx="60" cy="36" rx="32" ry="11" fill="${color}" opacity="0.58"/>
      <path d="M28 36 C28 50 92 50 92 36" fill="none" stroke="#253041" stroke-width="3.2" opacity="0.42"/>
      <path d="M28 36 V84 M92 36 V84" fill="none" stroke="#253041" stroke-width="3.4" opacity="0.52"/>
      <ellipse cx="60" cy="84" rx="32" ry="11" fill="${color}" opacity="0.7"/>
      <path d="M28 84 C28 98 92 98 92 84" fill="none" stroke="#253041" stroke-width="3.4" opacity="0.62"/>
      <path d="M42 42 V78" fill="none" stroke="#ffffff" stroke-width="5" opacity="0.28"/>
      <ellipse cx="60" cy="35" rx="19" ry="5" fill="#ffffff" opacity="0.18" stroke="none"/>
    `,
    pyramid: `
      <ellipse cx="60" cy="100" rx="34" ry="5" fill="rgba(74,50,88,0.16)" stroke="none"/>
      <path d="M30 86 H90 L60 96 Z" fill="${color}" opacity="0.4"/>
      <path d="M60 22 L30 86 L60 96 Z" fill="${color}"/>
      <path d="M60 22 L90 86 L60 96 Z" fill="${color}" opacity="0.65"/>
    `,
    "rectangular-prism": `
      <ellipse cx="60" cy="106" rx="46" ry="6" fill="rgba(74,50,88,0.16)" stroke="none"/>
      <path d="M22 50 L52 32 L98 32 L68 50 Z" fill="${color}" opacity="0.32"/>
      <path d="M22 50 L68 50 V98 L22 80 Z" fill="${color}"/>
      <path d="M68 50 L98 32 V80 L68 98 Z" fill="${color}" opacity="0.72"/>
    `,
    "triangular-prism": `
      <ellipse cx="60" cy="100" rx="42" ry="6" fill="rgba(74,50,88,0.16)" stroke="none"/>
      <path d="M18 88 L40 38 L62 88 Z" fill="${color}"/>
      <path d="M40 38 L98 38 L76 88 L62 88 Z" fill="${color}" opacity="0.45"/>
      <path d="M18 88 H76 L98 38 H40 Z" fill="${color}" opacity="0.78"/>
    `,
    hemisphere: `
      <ellipse cx="60" cy="100" rx="38" ry="6" fill="rgba(74,50,88,0.16)" stroke="none"/>
      <ellipse cx="60" cy="78" rx="38" ry="9" fill="${color}" opacity="0.48"/>
      <path d="M22 78 A38 38 0 0 1 98 78 Z" fill="${color}"/>
      <ellipse cx="46" cy="60" rx="9" ry="5" fill="#ffffff" opacity="0.45" stroke="none" transform="rotate(-30 46 60)"/>
    `
  };

  const shapeStroke = shape.dimension === "solid"
    ? 'stroke="rgba(74,50,88,0.42)" stroke-width="1.5"'
    : 'stroke="#253041" stroke-width="6"';

  return `
    <svg class="${shape.dimension === "solid" ? "solid-shape-svg" : "flat-shape-svg"}" viewBox="0 0 120 120" role="img" aria-hidden="true">
      <g ${shapeStroke} stroke-linecap="round" stroke-linejoin="round">
        ${shapeMarkup[shape.id] || shapeMarkup.circle}
      </g>
    </svg>
  `;
}

function colorHexByWord(word, fallback = "#4ecdc4") {
  return colorWords.find((color) => color.word === word)?.hex || fallback;
}

function drawCake() {
  return `
    <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
      <g stroke="#253041" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M28 54 H92 V94 H28 Z" fill="#ffd166"/>
        <path d="M28 54 C36 42 46 42 54 54 C62 66 72 66 92 54 V70 H28 Z" fill="#ff7aa7"/>
        <path d="M44 42 V24 M60 42 V24 M76 42 V24" fill="none"/>
        <path d="M40 23 C44 15 48 21 44 27 Z" fill="#f77f00"/>
        <path d="M56 23 C60 15 64 21 60 27 Z" fill="#f77f00"/>
        <path d="M72 23 C76 15 80 21 76 27 Z" fill="#f77f00"/>
      </g>
    </svg>
  `;
}

function drawPlaceIcon(place) {
  const scenes = {
    kitchen: `
      <rect x="24" y="28" width="72" height="64" rx="6" fill="#fffaf0"/>
      <path d="M24 52 H96 M52 28 V92" fill="none"/>
      <circle cx="38" cy="40" r="3" fill="#253041"/>
      <circle cx="70" cy="70" r="10" fill="#8fd7ff"/>
      <path d="M68 58 V44 M76 58 V44" fill="none"/>
    `,
    garden: `
      <path d="M18 92 C34 72 86 72 102 92 Z" fill="#65bd53"/>
      <path d="M57 54 H68 V92 H57 Z" fill="#b57345"/>
      <circle cx="49" cy="45" r="20" fill="#06d6a0"/>
      <circle cx="72" cy="38" r="24" fill="#06d6a0"/>
      <circle cx="82" cy="58" r="18" fill="#06d6a0"/>
      <circle cx="28" cy="34" r="12" fill="#ffd166"/>
    `,
    bedroom: `
      <rect x="20" y="48" width="80" height="34" rx="5" fill="#9d8df1"/>
      <rect x="24" y="36" width="32" height="20" rx="5" fill="#fffaf0"/>
      <path d="M20 82 V94 M100 82 V94 M20 64 H100" fill="none"/>
    `,
    bathroom: `
      <rect x="28" y="54" width="64" height="34" rx="12" fill="#fffaf0"/>
      <path d="M36 54 V40 H58 M58 40 V54 M32 88 V98 M88 88 V98" fill="none"/>
      <path d="M72 42 C72 30 88 30 88 42 V54" fill="none"/>
      <circle cx="86" cy="58" r="5" fill="#8fd7ff" stroke="none"/>
      <path d="M46 94 H82" fill="none"/>
    `,
    "living room": `
      <rect x="24" y="58" width="72" height="30" rx="8" fill="#c0a7e8"/>
      <rect x="34" y="44" width="52" height="22" rx="7" fill="#fffaf0"/>
      <path d="M28 88 V98 M92 88 V98 M34 74 H86" fill="none"/>
      <rect x="76" y="26" width="20" height="18" rx="4" fill="#ffd166"/>
      <path d="M86 44 V58" fill="none"/>
    `,
    park: `
      <path d="M18 92 H102" fill="none"/>
      <path d="M54 64 H66 V92 H54 Z" fill="#b57345"/>
      <circle cx="60" cy="40" r="26" fill="#65bd53"/>
      <path d="M22 70 C40 54 82 54 100 70" fill="none"/>
      <circle cx="90" cy="30" r="12" fill="#ffd166"/>
    `,
    library: `
      <rect x="22" y="30" width="76" height="64" rx="7" fill="#fffaf0"/>
      <path d="M34 42 H48 V88 H34 Z M52 42 H66 V88 H52 Z M70 42 H84 V88 H70 Z" fill="#9d8df1"/>
      <path d="M30 88 H90 M41 50 V80 M59 50 V80 M77 50 V80" fill="none"/>
    `,
    school: `
      <path d="M20 56 L60 26 L100 56 V96 H20 Z" fill="#fffaf0"/>
      <path d="M42 96 V70 H78 V96 M30 58 H90" fill="none"/>
      <rect x="48" y="42" width="24" height="18" rx="4" fill="#8fd7ff"/>
    `,
    cafe: `
      <rect x="26" y="42" width="68" height="48" rx="8" fill="#fffaf0"/>
      <path d="M38 42 V32 H82 V42 M94 54 H102 C110 54 110 74 94 74" fill="none"/>
      <path d="M44 62 H76 M48 82 H72" fill="none"/>
    `,
    "swimming pool": `
      <rect x="20" y="44" width="80" height="48" rx="8" fill="#8fd7ff"/>
      <path d="M28 64 C38 56 48 72 58 64 C68 56 78 72 92 62 M28 78 C38 70 48 86 58 78 C68 70 78 86 92 76" fill="none" stroke="#118ab2"/>
    `,
    "bus stop": `
      <path d="M28 28 V96 M28 34 H88" fill="none"/>
      <rect x="38" y="46" width="56" height="30" rx="6" fill="#ffd166"/>
      <circle cx="50" cy="80" r="7" fill="#fffaf0"/>
      <circle cx="82" cy="80" r="7" fill="#fffaf0"/>
      <text x="58" y="41" font-size="13" font-weight="900" fill="#253041" stroke="none">BUS</text>
    `,
    shop: `
      <path d="M24 46 H96 V96 H24 Z" fill="#fffaf0"/>
      <path d="M20 46 L30 28 H90 L100 46 Z" fill="#ff7aa7"/>
      <path d="M42 96 V70 H64 V96 M72 64 H88 V80 H72 Z" fill="#8fd7ff"/>
    `
  };

  return `
    <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
      <g stroke="#253041" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        ${scenes[place] || scenes.park}
      </g>
    </svg>
  `;
}

function drawClothingIcon(label) {
  const parts = String(label).toLowerCase().split(" ");
  const knownColours = new Set(colorWords.map((color) => color.word));
  const colorWord = knownColours.has(parts[0]) ? parts.shift() : "pink";
  const item = parts.join(" ");
  const color = colorHexByWord(colorWord, "#ffd166");
  const items = {
    coat: `<path d="M42 28 L58 40 H62 L78 28 L94 48 L84 58 V96 H36 V58 L26 48 Z" fill="${color}"/><path d="M60 42 V96 M48 54 H72" fill="none"/>`,
    raincoat: `<path d="M38 96 L44 48 C46 30 74 30 76 48 L82 96 Z" fill="${color}"/><path d="M44 48 C48 34 72 34 76 48 C70 42 50 42 44 48 Z" fill="${color}"/><path d="M60 48 V96 M46 60 H74 M36 62 L24 76 M84 62 L96 76" fill="none"/>`,
    hat: `<path d="M30 72 H90" fill="none"/><path d="M38 70 C40 42 80 42 82 70 Z" fill="${color}"/><path d="M24 78 C42 88 78 88 96 78" fill="${color}"/>`,
    shoes: `<path d="M24 70 C38 68 46 74 52 84 H24 Z" fill="${color}"/><path d="M66 70 C80 68 88 74 94 84 H66 Z" fill="${color}"/><path d="M26 84 H54 M68 84 H96" fill="none"/>`,
    bag: `<rect x="34" y="44" width="52" height="48" rx="8" fill="${color}"/><path d="M46 44 C46 28 74 28 74 44" fill="none"/>`,
    dress: `<path d="M44 96 L52 42 H68 L76 96 Z" fill="${color}"/><path d="M48 42 C50 28 70 28 72 42 M48 58 H72" fill="none"/>`,
    shirt: `<path d="M40 34 L52 44 H68 L80 34 L96 50 L84 64 V96 H36 V64 L24 50 Z" fill="${color}"/><path d="M52 44 H68 M60 44 V88" fill="none"/>`,
    socks: `<path d="M36 28 H56 V72 C56 84 44 88 32 82 L24 78 L32 64 V28 Z" fill="${color}"/><path d="M70 28 H90 V72 C90 84 78 88 66 82 L58 78 L66 64 V28 Z" fill="${color}"/><path d="M36 42 H56 M70 42 H90" fill="none"/>`,
    scarf: `<path d="M32 34 C48 48 72 48 88 34 L96 48 C76 66 44 66 24 48 Z" fill="${color}"/><path d="M54 58 V98 L42 88 M66 58 V98 L78 88" fill="${color}"/>`
  };

  return `
    <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
      <g stroke="#253041" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        ${items[item] || items.bag}
      </g>
    </svg>
  `;
}

function drawClockIcon(label) {
  const hourText = label.split(" ")[0];
  const hourValues = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
  const hour = hourValues[hourText] || 3;
  const center = { x: 60, y: 60 };
  const hourRadians = ((hour * 30 - 90) * Math.PI) / 180;
  const hourX = center.x + Math.cos(hourRadians) * 22;
  const hourY = center.y + Math.sin(hourRadians) * 22;

  return `
    <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
      <g stroke="#253041" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="60" cy="60" r="42" fill="#fffaf0"/>
        <path d="M60 18 V25 M60 95 V102 M18 60 H25 M95 60 H102" fill="none" stroke-width="4"/>
        <text x="60" y="40" text-anchor="middle" font-size="13" font-weight="900" fill="#253041" stroke="none">12</text>
        <text x="88" y="65" text-anchor="middle" font-size="13" font-weight="900" fill="#253041" stroke="none">3</text>
        <text x="60" y="89" text-anchor="middle" font-size="13" font-weight="900" fill="#253041" stroke="none">6</text>
        <text x="32" y="65" text-anchor="middle" font-size="13" font-weight="900" fill="#253041" stroke="none">9</text>
        <path d="M60 60 V31 M60 60 L${hourX.toFixed(1)} ${hourY.toFixed(1)}" fill="none"/>
        <circle cx="60" cy="60" r="4" fill="#253041"/>
      </g>
    </svg>
  `;
}

function drawActionIcon(label) {
  const key = String(label).toLowerCase();
  const actions = {
    "ride a bike": `
      <circle cx="34" cy="78" r="16" fill="#fffaf0"/>
      <circle cx="86" cy="78" r="16" fill="#fffaf0"/>
      <path d="M34 78 L54 48 L68 78 H34 L58 78 L86 78 L70 52" fill="none"/>
      <circle cx="58" cy="30" r="10" fill="#ffd166"/>
    `,
    "draw a picture": `
      <rect x="24" y="28" width="58" height="64" rx="6" fill="#fffaf0"/>
      <path d="M34 74 L50 58 L60 68 L72 50" fill="none"/>
      <path d="M76 74 L96 54 L104 62 L84 82 Z" fill="#ffd166"/>
    `,
    "read a book": `
      <path d="M18 36 C36 28 48 34 60 44 C72 34 84 28 102 36 V92 C84 84 72 88 60 98 C48 88 36 84 18 92 Z" fill="#fffaf0"/>
      <path d="M60 44 V98 M30 52 H50 M70 52 H90" fill="none"/>
    `,
    "watch a film": `
      <rect x="22" y="30" width="76" height="58" rx="8" fill="#8fd7ff"/>
      <path d="M54 46 L76 59 L54 72 Z" fill="#ffd166"/>
      <path d="M38 96 H82" fill="none"/>
    `,
    "buy bread": `
      <path d="M30 50 H90 V92 H30 Z" fill="#fffaf0"/>
      <path d="M42 50 C42 34 78 34 78 50" fill="none"/>
      <path d="M42 72 C52 50 76 50 84 72 C72 86 54 86 42 72 Z" fill="#ffd166"/>
    `,
    "go to the park": `
      <path d="M54 56 H66 V92 H54 Z" fill="#b57345"/>
      <circle cx="60" cy="38" r="25" fill="#65bd53"/>
      <path d="M20 92 C42 66 78 66 100 92" fill="none"/>
    `,
    "play football": `
      <circle cx="60" cy="60" r="40" fill="#fffaf0"/>
      <path d="M60 40 L76 52 L70 72 H50 L44 52 Z M44 52 L28 48 M76 52 L92 48 M50 72 L42 90 M70 72 L78 90" fill="none"/>
    `,
    "visit grandma": `
      <path d="M22 58 L60 24 L98 58 V98 H22 Z" fill="#fffaf0"/>
      <path d="M48 98 V74 H72 V98" fill="#ff7aa7"/>
      <circle cx="60" cy="55" r="10" fill="#ffd166"/>
    `
  };

  return `
    <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
      <g stroke="#253041" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        ${actions[key] || actions["read a book"]}
      </g>
    </svg>
  `;
}

function drawCalendarIcon(day) {
  const dayInfo = {
    monday: "MON",
    tuesday: "TUE",
    wednesday: "WED",
    thursday: "THU",
    friday: "FRI",
    saturday: "SAT",
    sunday: "SUN"
  }[day.toLowerCase()] || day.slice(0, 3).toUpperCase();

  return `
    <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
      <g stroke="#253041" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        <rect x="24" y="28" width="72" height="70" rx="8" fill="#fffaf0"/>
        <path d="M24 48 H96 M42 20 V36 M78 20 V36" fill="none"/>
        <rect x="24" y="28" width="72" height="20" rx="7" fill="#ffd166" stroke="none"/>
        <text x="60" y="81" text-anchor="middle" font-size="31" font-weight="900" fill="#253041" stroke="none">${dayInfo}</text>
      </g>
    </svg>
  `;
}

function drawIceCreamIcon(flavour) {
  const colors = {
    strawberry: "#ff7aa7",
    chocolate: "#8a5a44",
    lemon: "#ffd166",
    vanilla: "#fffaf0"
  };

  return `
    <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
      <g stroke="#253041" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M44 62 H76 L60 108 Z" fill="#d69f67"/>
        <circle cx="60" cy="45" r="26" fill="${colors[flavour] || "#ff7aa7"}"/>
        <path d="M48 84 H72" fill="none"/>
      </g>
    </svg>
  `;
}

function drawReasonIcon(label) {
  const reasons = {
    "He lost his bag.": `<circle cx="60" cy="34" r="13" fill="#ffd166"/><path d="M36 96 C40 70 80 70 84 96" fill="#fffaf0"/><path d="M38 62 L22 76 M82 62 L98 76" fill="none"/><rect x="48" y="82" width="24" height="12" rx="3" fill="#fffaf0" opacity="0.45"/>`,
    "The bus was late.": `<rect x="18" y="52" width="60" height="32" rx="6" fill="#ffd166"/><path d="M28 62 H68 M24 52 V42 H62 L78 52" fill="none"/><circle cx="32" cy="88" r="7" fill="#fffaf0"/><circle cx="64" cy="88" r="7" fill="#fffaf0"/><circle cx="91" cy="36" r="18" fill="#fffaf0"/><path d="M91 36 V25 M91 36 H103" fill="none"/>`,
    "He missed lunch.": `<circle cx="48" cy="66" r="25" fill="#fffaf0"/><ellipse cx="48" cy="66" rx="12" ry="7" fill="none"/><path d="M18 96 H78" fill="none"/><circle cx="90" cy="36" r="18" fill="#fffaf0"/><path d="M90 36 V25 M90 36 H100" fill="none"/>`,
    "It was raining.": `<path d="M32 54 C34 34 62 34 66 52 C82 48 94 60 88 74 H30 C18 74 18 56 32 54 Z" fill="#fffaf0"/><path d="M38 86 L34 98 M58 86 L54 98 M78 86 L74 98" fill="none" stroke="#118ab2"/>`
  };

  return `
    <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
      <g stroke="#253041" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        ${reasons[label] || reasons["He lost his bag."]}
      </g>
    </svg>
  `;
}

function drawFeelingIcon(label) {
  const normalized = label.toLowerCase();
  const isLike = normalized === "liked it";
  const isHate = normalized === "hated it";
  const isSleep = normalized === "fell asleep";
  const isConfused = normalized === "did not understand it";
  const eyeMarkup = isLike
    ? '<path d="M42 54 Q48 48 54 54 M66 54 Q72 48 78 54" fill="none"/>'
    : isConfused
      ? '<circle cx="47" cy="55" r="4" fill="#253041" stroke="none"/><circle cx="73" cy="55" r="4" fill="#253041" stroke="none"/><path d="M40 44 L52 50 M68 50 L80 44" fill="none"/>'
      : isHate
      ? '<path d="M42 50 L54 56 M78 50 L66 56" fill="none"/>'
      : '<path d="M42 55 H54 M66 55 H78" fill="none"/>';
  const mouthMarkup = isLike
    ? '<path d="M44 70 Q60 84 76 70" fill="none"/>'
    : isHate
      ? '<path d="M45 79 Q60 66 75 79" fill="none"/>'
      : isSleep
        ? '<ellipse cx="60" cy="76" rx="10" ry="7" fill="#fffaf0"/>'
        : '<path d="M45 75 Q60 67 75 75" fill="none"/>';

  return `
    <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
      <g stroke="#253041" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="60" cy="62" r="38" fill="${isLike ? "#ffd166" : isHate ? "#ff7aa7" : "#fffaf0"}"/>
        ${eyeMarkup}
        ${mouthMarkup}
      </g>
    </svg>
  `;
}

function drawPositionIcon(label) {
  const lower = label.toLowerCase();
  const box = '<rect x="42" y="52" width="36" height="34" rx="5" fill="#fffaf0"/>';
  const ball = (cx, cy, opacity = 1) => `<circle cx="${cx}" cy="${cy}" r="14" fill="#9d8df1" opacity="${opacity}"/>`;
  const mark = {
    "on the box": `${box}${ball(60, 36)}<path d="M44 88 H80" fill="none"/>`,
    "under the box": `${box}${ball(60, 101)}<path d="M44 88 H80" fill="none"/>`,
    "next to the box": `${box}${ball(96, 70)}<path d="M28 88 H106" fill="none"/>`,
    "behind the box": `${ball(60, 48, 0.5)}${box}<path d="M44 88 H80" fill="none"/>`
  }[lower] || `${box}${ball(60, 36)}`;

  return `
    <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
      <g stroke="#253041" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        ${mark}
      </g>
    </svg>
  `;
}

function drawGenericListenIcon() {
  return `
    <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
      <g stroke="#253041" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M26 62 H42 L64 44 V86 L42 68 H26 Z" fill="#fffaf0"/>
        <path d="M76 52 C84 58 84 72 76 78 M86 42 C100 54 100 76 86 90" fill="none"/>
      </g>
    </svg>
  `;
}

function drawAnimalIcon(label) {
  const lower = String(label).toLowerCase();
  const animals = {
    cow: `
      <path d="M24 62 C24 42 42 34 64 36 C88 38 100 50 96 72 C92 92 70 98 46 92 C30 88 22 78 24 62 Z" fill="#fffaf0"/>
      <path d="M40 44 C48 36 60 42 54 52 C48 58 38 54 40 44 Z M72 54 C82 46 94 54 88 66 C82 76 68 68 72 54 Z" fill="#253041" stroke="none"/>
      <path d="M32 38 L22 24 M88 40 L100 26" fill="none"/>
      <circle cx="48" cy="60" r="4" fill="#253041" stroke="none"/>
      <circle cx="68" cy="60" r="4" fill="#253041" stroke="none"/>
      <ellipse cx="58" cy="76" rx="15" ry="10" fill="#f29ec2"/>
      <path d="M52 76 H64" fill="none"/>
    `,
    pig: `
      <path d="M30 74 C24 52 40 36 62 36 C84 36 100 52 94 74 C88 96 36 96 30 74 Z" fill="#f29ec2"/>
      <path d="M36 44 L28 28 L50 38 M84 44 L96 28 L74 38" fill="#f29ec2"/>
      <circle cx="50" cy="58" r="4" fill="#253041" stroke="none"/>
      <circle cx="74" cy="58" r="4" fill="#253041" stroke="none"/>
      <ellipse cx="62" cy="72" rx="16" ry="11" fill="#ffc0d9"/>
      <circle cx="56" cy="72" r="2.8" fill="#253041" stroke="none"/>
      <circle cx="68" cy="72" r="2.8" fill="#253041" stroke="none"/>
      <path d="M94 66 C108 62 106 82 94 78" fill="none"/>
    `,
    horse: `
      <path d="M28 76 C30 50 54 42 78 48 C94 52 102 68 94 84 C84 104 42 100 30 88 Z" fill="#b57345"/>
      <path d="M70 46 C72 30 88 26 96 40 C104 54 94 70 82 68 Z" fill="#d69f67"/>
      <path d="M72 46 C62 44 56 52 54 66" fill="none"/>
      <path d="M78 34 C68 40 70 54 78 64" fill="#253041"/>
      <circle cx="88" cy="48" r="3.6" fill="#253041" stroke="none"/>
      <path d="M38 90 V104 M70 90 V104 M32 62 C16 56 18 42 30 48" fill="none"/>
    `,
    sheep: `
      <circle cx="38" cy="58" r="15" fill="#fffaf0"/>
      <circle cx="54" cy="48" r="18" fill="#fffaf0"/>
      <circle cx="72" cy="52" r="17" fill="#fffaf0"/>
      <circle cx="84" cy="66" r="15" fill="#fffaf0"/>
      <circle cx="58" cy="70" r="22" fill="#fffaf0"/>
      <ellipse cx="60" cy="64" rx="18" ry="22" fill="#d8c6b4"/>
      <circle cx="53" cy="60" r="3" fill="#253041" stroke="none"/>
      <circle cx="67" cy="60" r="3" fill="#253041" stroke="none"/>
      <path d="M54 72 Q60 77 66 72 M44 88 V104 M76 88 V104" fill="none"/>
    `,
    lion: `
      <circle cx="60" cy="62" r="42" fill="#f77f00"/>
      <circle cx="60" cy="62" r="28" fill="#ffd166"/>
      <path d="M32 52 L18 42 M88 52 L102 42 M36 84 L24 96 M84 84 L96 96" fill="none"/>
      <circle cx="50" cy="58" r="4" fill="#253041" stroke="none"/>
      <circle cx="70" cy="58" r="4" fill="#253041" stroke="none"/>
      <path d="M55 72 Q60 78 65 72 M60 66 V74" fill="none"/>
    `,
    monkey: `
      <path d="M34 72 C18 62 28 36 48 46 C54 28 82 28 88 46 C108 36 116 62 96 72 C94 94 76 104 60 104 C44 104 26 94 34 72 Z" fill="#8a5a44"/>
      <ellipse cx="60" cy="66" rx="27" ry="30" fill="#d69f67"/>
      <circle cx="50" cy="58" r="4" fill="#253041" stroke="none"/>
      <circle cx="70" cy="58" r="4" fill="#253041" stroke="none"/>
      <path d="M50 76 Q60 84 70 76 M92 84 C110 96 92 110 82 96" fill="none"/>
    `,
    bear: `
      <circle cx="38" cy="38" r="13" fill="#8a5a44"/>
      <circle cx="82" cy="38" r="13" fill="#8a5a44"/>
      <circle cx="60" cy="62" r="36" fill="#c28f61"/>
      <ellipse cx="60" cy="76" rx="18" ry="13" fill="#fff0d8"/>
      <circle cx="50" cy="58" r="4" fill="#253041" stroke="none"/>
      <circle cx="70" cy="58" r="4" fill="#253041" stroke="none"/>
      <path d="M54 76 Q60 82 66 76" fill="none"/>
    `,
    frog: `
      <ellipse cx="60" cy="70" rx="38" ry="28" fill="#65bd53"/>
      <circle cx="42" cy="42" r="14" fill="#65bd53"/>
      <circle cx="78" cy="42" r="14" fill="#65bd53"/>
      <circle cx="42" cy="42" r="5" fill="#253041" stroke="none"/>
      <circle cx="78" cy="42" r="5" fill="#253041" stroke="none"/>
      <path d="M44 76 Q60 90 76 76 M28 88 L18 100 M92 88 L102 100" fill="none"/>
    `,
    fox: `
      <path d="M28 42 L44 20 L54 42 M66 42 L82 20 L92 42" fill="#f77f00"/>
      <path d="M30 50 C40 30 80 30 90 50 C96 70 78 92 60 96 C42 92 24 70 30 50 Z" fill="#f77f00"/>
      <path d="M46 72 L60 96 L74 72 Z" fill="#fffaf0"/>
      <circle cx="50" cy="56" r="4" fill="#253041" stroke="none"/>
      <circle cx="70" cy="56" r="4" fill="#253041" stroke="none"/>
      <path d="M84 74 C102 66 110 84 94 92" fill="#f77f00"/>
    `,
    bird: `
      <path d="M32 70 C32 44 58 32 78 46 C98 60 86 92 58 92 C42 92 32 84 32 70 Z" fill="#8fd7ff"/>
      <path d="M76 54 L100 62 L76 70 Z" fill="#ffd166"/>
      <path d="M50 64 C60 52 76 58 78 76 C66 74 56 72 50 64 Z" fill="#4ecdc4"/>
      <circle cx="64" cy="54" r="4" fill="#253041" stroke="none"/>
      <path d="M52 92 V104 M68 92 V104" fill="none"/>
    `
  };
  const markup = animals[lower];
  if (!markup) return "";
  return `
    <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
      <g stroke="#253041" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round">
        ${markup}
      </g>
    </svg>
  `;
}

function drawSimpleObjectIcon(label) {
  const lower = label.toLowerCase();
  if (["bear", "lion", "monkey", "pig", "frog", "fox", "cow", "horse", "sheep", "bird"].includes(lower)) return drawAnimalIcon(lower);

  const objects = {
    cup: '<path d="M36 36 H78 L72 92 H42 Z" fill="#fffaf0"/><path d="M78 48 H92 C104 48 104 72 78 72" fill="none"/><path d="M44 50 H72" fill="none"/>',
    bread: '<path d="M32 94 V46 C32 22 88 22 88 46 V94 Z" fill="#d69f67"/><path d="M44 52 C52 46 68 46 76 52" fill="none" opacity="0.45"/>',
    rice: '<path d="M28 64 H92 L82 94 H38 Z" fill="#8fd7ff"/><path d="M38 62 C46 42 74 42 82 62" fill="#fffaf0"/>',
    milk: '<path d="M36 34 L48 20 H76 L86 34 V94 H36 Z" fill="#fffaf0"/><path d="M36 34 H86 M48 20 V34" fill="none"/><path d="M46 60 H76" fill="none" stroke="#8fd7ff"/>',
    juice: '<path d="M38 28 H82 L76 94 H44 Z" fill="#fffaf0"/><rect x="43" y="58" width="34" height="30" fill="#ffd166" stroke="none"/><path d="M70 26 L86 12" fill="none"/>',
    hat: '<path d="M30 72 H90" fill="none"/><path d="M38 70 C40 42 80 42 82 70 Z" fill="#f29ec2"/><path d="M24 78 C42 88 78 88 96 78" fill="#f29ec2"/>',
    mat: '<rect x="24" y="42" width="72" height="42" rx="8" fill="#9ee0c8"/><path d="M34 56 H86 M34 70 H86" fill="none" opacity="0.45"/>',
    pen: '<path d="M28 86 L74 40 L88 54 L42 100 L24 104 Z" fill="#ffd166"/><path d="M74 40 L84 30 L98 44 L88 54" fill="#9d8df1"/>',
    rose: '<path d="M60 58 V98" fill="none" stroke="#65bd53"/><path d="M60 72 C44 62 38 84 58 82 M62 78 C82 68 86 90 64 88" fill="#65bd53"/><circle cx="60" cy="44" r="18" fill="#f29ec2"/><path d="M48 44 C54 32 68 32 72 44 C66 56 54 56 48 44 Z" fill="#ef476f"/>',
    nose: '<circle cx="60" cy="56" r="30" fill="#fff0d8"/><path d="M60 42 C52 56 54 68 64 68" fill="none"/><path d="M50 78 Q60 84 70 78" fill="none"/><circle cx="48" cy="52" r="3" fill="#253041" stroke="none"/><circle cx="74" cy="52" r="3" fill="#253041" stroke="none"/>',
    moon: '<path d="M76 20 C48 28 38 62 56 88 C66 102 84 104 96 94 C72 92 56 72 62 48 C66 34 72 26 76 20 Z" fill="#ffd166"/>',
    snake: '<path d="M24 78 C42 48 72 96 96 52" fill="none" stroke="#65bd53" stroke-width="14"/><circle cx="94" cy="50" r="9" fill="#65bd53"/><circle cx="98" cy="47" r="2" fill="#253041" stroke="none"/>',
    log: '<rect x="28" y="46" width="64" height="36" rx="18" fill="#b57345"/><circle cx="30" cy="64" r="18" fill="#d69f67"/><circle cx="30" cy="64" r="8" fill="none"/>',
    wig: '<path d="M30 88 C24 46 42 24 60 24 C78 24 96 46 90 88 C76 78 44 78 30 88 Z" fill="#6b3f70"/><path d="M42 44 C50 56 70 56 78 44" fill="none"/>',
    king: '<path d="M28 82 L36 42 L52 66 L60 30 L68 66 L84 42 L92 82 Z" fill="#f0c463"/><path d="M28 82 H92 V94 H28 Z" fill="#ffd166"/><circle cx="60" cy="30" r="4" fill="#f29ec2"/>',
    book: '<path d="M24 34 H56 C62 34 66 38 66 44 V94 C66 88 60 84 54 84 H24 Z" fill="#fffaf0"/><path d="M66 44 C66 38 70 34 76 34 H96 V84 H76 C70 84 66 88 66 94 Z" fill="#fffaf0"/><path d="M66 44 V94 M34 48 H52 M78 48 H90" fill="none"/>',
    kite: '<path d="M60 18 L92 52 L60 86 L28 52 Z" fill="#9d8df1"/><path d="M60 18 V86 M28 52 H92 M60 86 C50 98 42 92 34 104" fill="none"/>',
    drum: '<ellipse cx="60" cy="38" rx="32" ry="12" fill="#fffaf0"/><path d="M28 38 V82 C28 98 92 98 92 82 V38" fill="#f29ec2"/><ellipse cx="60" cy="82" rx="32" ry="12" fill="#ffd166"/><path d="M26 24 L48 38 M94 24 L72 38" fill="none"/>',
    doll: '<circle cx="60" cy="34" r="14" fill="#fff0d8"/><path d="M42 92 L50 54 H70 L78 92 Z" fill="#f29ec2"/><path d="M44 48 Q60 24 76 48" fill="#6b3f70"/>',
    "teddy bear": '<circle cx="40" cy="36" r="11" fill="#c28f61"/><circle cx="80" cy="36" r="11" fill="#c28f61"/><circle cx="60" cy="58" r="32" fill="#c28f61"/><circle cx="48" cy="54" r="4" fill="#253041" stroke="none"/><circle cx="72" cy="54" r="4" fill="#253041" stroke="none"/><path d="M52 70 Q60 76 68 70" fill="none"/>',
    "open book": '<path d="M24 34 H56 C62 34 66 38 66 44 V94 C66 88 60 84 54 84 H24 Z" fill="#fffaf0"/><path d="M66 44 C66 38 70 34 76 34 H96 V84 H76 C70 84 66 88 66 94 Z" fill="#fffaf0"/><path d="M66 44 V94 M34 48 H52 M78 48 H90" fill="none"/>',
    "close book": '<rect x="34" y="24" width="54" height="72" rx="7" fill="#9d8df1"/><path d="M46 36 H76 M46 48 H70" fill="none"/>',
    "read a book": '<path d="M36 90 C40 64 80 64 84 90" fill="#f29ec2"/><circle cx="60" cy="42" r="14" fill="#fff0d8"/><path d="M30 66 H58 V96 H30 Z M62 66 H90 V96 H62 Z" fill="#fffaf0"/>',
    "draw a picture": '<rect x="26" y="30" width="54" height="54" rx="5" fill="#fffaf0"/><path d="M36 70 L48 56 L58 68 L68 50 L78 76 H36 Z" fill="#9ee0c8"/><path d="M74 88 L96 66" fill="none"/>',
    "ride a bike": '<circle cx="36" cy="82" r="16" fill="none"/><circle cx="84" cy="82" r="16" fill="none"/><path d="M36 82 L54 58 H70 L84 82 M54 58 L64 82 H36" fill="none"/><circle cx="64" cy="36" r="9" fill="#fff0d8"/><path d="M60 46 L54 58 L72 62" fill="none"/>',
    run: '<circle cx="60" cy="34" r="13" fill="#fff0d8"/><path d="M56 48 L48 70 L66 72 L76 92 M54 58 L34 48 M62 70 L44 94 M66 54 L88 48" fill="none"/><path d="M42 106 H84" fill="none"/>',
    "play football": '<circle cx="60" cy="60" r="28" fill="#fffaf0"/><path d="M60 36 L76 50 L70 74 H50 L44 50 Z M36 60 H44 M76 50 L88 44 M70 74 L80 90 M50 74 L40 90 M44 50 L32 44" fill="none"/>',
    "watch a film": '<rect x="22" y="34" width="76" height="50" rx="7" fill="#253041"/><path d="M52 46 L76 59 L52 72 Z" fill="#fffaf0"/>',
    "buy bread": '<path d="M24 94 H96 L88 54 H32 Z" fill="#ffd166"/><path d="M40 54 C40 28 80 28 80 54" fill="none"/><path d="M44 76 H76" fill="none"/>',
    "go to school": '<path d="M20 56 L60 26 L100 56 V96 H20 Z" fill="#fffaf0"/><path d="M42 96 V70 H78 V96 M30 58 H90" fill="none"/>',
    "visit grandma": '<circle cx="60" cy="36" r="15" fill="#fff0d8"/><path d="M40 92 C44 64 76 64 80 92 Z" fill="#c0a7e8"/><path d="M44 32 C52 18 68 18 76 32" fill="none"/><path d="M42 52 H78" fill="none"/>',
    "wake up": '<circle cx="60" cy="46" r="16" fill="#fff0d8"/><path d="M28 84 H92 V100 H28 Z" fill="#9d8df1"/><path d="M34 74 H86" fill="none"/><path d="M82 28 H98 M90 20 H106" fill="none"/>',
    "eat breakfast": '<circle cx="54" cy="66" r="24" fill="#fffaf0"/><path d="M46 66 H62 M28 96 H82 M90 40 V88 M98 40 V88" fill="none"/>',
    "carry umbrella": '<path d="M24 58 C36 22 84 22 96 58 Z" fill="#f29ec2"/><path d="M60 58 V92 C60 104 78 104 78 90" fill="none"/>',
    seed: '<ellipse cx="60" cy="62" rx="18" ry="28" fill="#b57345" transform="rotate(-20 60 62)"/>',
    plant: '<path d="M60 92 V48" fill="none" stroke="#65bd53"/><path d="M60 62 C42 48 36 70 56 72 M62 54 C82 38 90 64 66 66" fill="#65bd53"/><rect x="40" y="88" width="40" height="14" fill="#b57345"/>',
    flower: '<path d="M60 94 V62" fill="none" stroke="#65bd53"/><circle cx="60" cy="48" r="10" fill="#ffd166"/><circle cx="46" cy="48" r="11" fill="#f29ec2"/><circle cx="74" cy="48" r="11" fill="#f29ec2"/><circle cx="60" cy="34" r="11" fill="#f29ec2"/><circle cx="60" cy="62" r="11" fill="#f29ec2"/>',
    grass: '<path d="M18 94 H102" fill="none" stroke="#65bd53"/><path d="M28 94 C30 74 38 70 42 94 M44 94 C48 66 58 70 58 94 M62 94 C66 70 76 66 78 94 M84 94 C88 76 96 74 98 94" fill="none" stroke="#65bd53"/>',
    sky: '<rect x="18" y="20" width="84" height="78" rx="12" fill="#d6ecff"/><circle cx="84" cy="36" r="10" fill="#ffd166"/><path d="M30 58 C36 44 52 44 58 58 C66 52 78 58 78 70 H28 C22 66 24 60 30 58 Z" fill="#fffaf0"/>',
    sleeping: '<circle cx="60" cy="46" r="15" fill="#fff0d8"/><path d="M28 84 H92 V100 H28 Z" fill="#9d8df1"/><path d="M82 28 H98 M90 20 H106" fill="none"/>'
  };

  const markup = objects[lower];
  if (!markup) return "";
  return `
    <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
      <g stroke="#253041" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        ${markup}
      </g>
    </svg>
  `;
}

function listeningArtForLabel(label) {
  const lower = label.toLowerCase();
  const withoutArticle = lower.replace(/^the\s+/, "");
  if (withoutArticle !== lower) return listeningArtForLabel(withoutArticle);
  if (["mum", "dad", "sister", "brother", "baby", "grandma", "grandpa"].includes(lower)) return drawFamilyIcon(lower);
  const vocabularyItem = vocabulary.find((item) => item.word === lower);
  if (vocabularyItem) return vocabularyItem.draw(vocabularyItem.base);
  const simpleObject = drawSimpleObjectIcon(lower);
  if (simpleObject) return simpleObject;
  if (lower === "cake") return drawCake();
  if (lower === "book") return drawActionIcon("read a book");
  const shapeItem = shapeSet.find((shape) => shape.word === lower);
  if (shapeItem) return drawShape(shapeItem, shapeItem.dimension === "solid" ? "#9d8df1" : "#4ecdc4");

  const ballColor = lower.match(/^(red|yellow|green|blue|orange|pink) ball$/);
  if (ballColor) return drawBall(colorHexByWord(ballColor[1]));

  if (["kitchen", "garden", "bedroom", "park", "library", "school", "cafe", "swimming pool", "bus stop", "shop"].includes(lower)) return drawPlaceIcon(lower);
  if (/^(red|yellow|green|blue|orange|pink) (coat|raincoat|hat|shoes|bag|dress|shirt|socks|scarf)$/.test(lower)) return drawClothingIcon(lower);
  if (["coat", "raincoat", "hat", "shoes", "bag", "dress", "shirt", "socks", "scarf"].includes(lower)) return drawClothingIcon(lower);
  if (lower.endsWith("o'clock")) return drawClockIcon(lower);
  if (["ride a bike", "draw a picture", "read a book", "watch a film", "buy bread", "go to the park", "play football", "visit grandma"].includes(lower)) {
    return drawActionIcon(label);
  }
  if (["sunday", "saturday", "friday", "monday", "tuesday", "wednesday", "thursday"].includes(lower)) return drawCalendarIcon(label);
  if (["sunny", "rainy", "cloudy", "windy", "snowy"].includes(lower)) return drawWeatherIcon(lower);
  if (lower.endsWith(" ice cream")) return drawIceCreamIcon(lower.replace(" ice cream", ""));
  if (["strawberry", "chocolate", "lemon", "vanilla"].includes(lower)) return drawIceCreamIcon(lower);
  if (["he lost his bag.", "the bus was late.", "bus was late.", "he missed lunch.", "it was raining."].includes(lower)) {
    return drawReasonIcon(lower === "bus was late." ? "The bus was late." : label);
  }
  if (["liked it", "hated it", "fell asleep", "did not understand it"].includes(lower)) return drawFeelingIcon(label);
  if (["on the box", "under the box", "next to the box", "behind the box"].includes(lower)) return drawPositionIcon(label);

  return drawGenericListenIcon();
}

function sample(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function shuffle(list) {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

const questionTagLimit = 18;

function recentTagsForMode(mode) {
  return state.recentQuestionTags[mode] || [];
}

function rememberQuestionTag(mode, tag) {
  if (!mode || !tag) return;
  const current = recentTagsForMode(mode).filter((item) => item !== tag);
  state.recentQuestionTags[mode] = [tag, ...current].slice(0, questionTagLimit);
}

function trimRecentTagsAcrossModes(keepLast = 5) {
  Object.keys(state.recentQuestionTags).forEach((mode) => {
    state.recentQuestionTags[mode] = (state.recentQuestionTags[mode] || []).slice(0, keepLast);
  });
}

function resetAllDecks() {
  state.listeningDecks = { ketListen: [], petListen: [], a2Listen: [], b1Listen: [] };
  state.englishDeck = [];
  state.questionDecks = {
    numberSense: [],
    mathReasoning: [],
    logicSpatial: [],
    phonics: [],
    measure: [],
    music: []
  };
}

function pullDeckItemWithCooldown(deck, mode, tagForItem) {
  const previousKey = state.challenge?.key;
  const recentTags = recentTagsForMode(mode);
  let selectedIndex = deck.findIndex((item) => item?.id !== previousKey && !recentTags.includes(tagForItem(item)));

  if (selectedIndex === -1) {
    selectedIndex = deck.findIndex((item) => item?.id !== previousKey);
  }

  if (selectedIndex === -1) selectedIndex = 0;
  return deck.splice(selectedIndex, 1)[0];
}

function choosePoolItemWithCooldown(pool, mode, tagForItem) {
  const options = shuffle(pool);
  const previousKey = state.challenge?.key;
  const recentTags = recentTagsForMode(mode);
  return options.find((item) => item.id !== previousKey && !recentTags.includes(tagForItem(item)))
    || options.find((item) => item.id !== previousKey)
    || options[0];
}

function chooseRoundBuilderWithCooldown(mode, builders) {
  const recentTags = recentTagsForMode(mode);
  const options = shuffle(builders);
  const selected = options.find((builder) => !recentTags.includes(builder.tag)) || options[0];
  return selected.build();
}

function listeningTagForItem(level, item) {
  const question = String(item?.question || "").toLowerCase();
  const answer = String(item?.answer || "").toLowerCase();

  if (question.includes("ice cream") || answer.includes("ice cream")) return `${level}:ice-cream`;
  if (question.startsWith("where")) return `${level}:place`;
  if (question.startsWith("when") || question.includes("time") || question.includes("day")) return `${level}:time`;
  if (question.startsWith("why")) return `${level}:reason`;
  if (question.startsWith("how") || question.includes("feel") || question.includes("think")) return `${level}:feeling`;
  if (question.includes("what food") || question.includes("fruit") || question.includes("choose")) return `${level}:food`;
  if (question.includes("need") || question.includes("find") || question.includes("take")) return `${level}:object`;
  return `${level}:${String(item?.id || "item").split("-").slice(0, 2).join("-")}`;
}

function listeningPartForItem(level, item) {
  if (level !== "ketListen") return level;
  const tag = listeningTagForItem(level, item);
  const question = String(item?.question || "").toLowerCase();
  if (tag.includes(":reason") || tag.includes(":feeling") || question.includes("think")) return "part4";
  if (tag.includes(":place") || tag.includes(":time")) return "part3";
  return "part1";
}

function listeningPartLabel(level, part) {
  if (level === "petListen" || level === "b1Listen") return "PET Listening";
  const labels = {
    part1: "KET Part 1",
    part2: "KET Part 2",
    part3: "KET Part 3",
    part4: "KET Part 4"
  };
  return labels[part] || "KET Listening";
}

function listeningPartHint(level, part) {
  if (level === "petListen" || level === "b1Listen") return "Listen for detail and meaning.";
  if (part === "part2") return "Listen for first, next, and last.";
  if (part === "part3") return "Listen for place, day, or time.";
  if (part === "part4") return "Listen for the reason or feeling.";
  return "Listen and choose the picture.";
}

function englishItemTag(item) {
  const id = String(item?.id || "");
  if (id.startsWith("notice-")) return "english:notice";
  if (id.startsWith("position-")) return "english:position";
  if (id.includes("place")) return "english:place";
  if (id.includes("solid") || id.includes("shape") || id.includes("square")) return "english:shape";
  if (id.includes("coat") || id.includes("raincoat") || id.includes("shoes") || id.includes("bag")) return "english:clothes";
  return `english:${id.split("-")[0] || "reading"}`;
}

function questionTagsForChallenge(challenge) {
  if (!challenge) return [];
  return [
    challenge.typeTag,
    challenge.level,
    challenge.kind,
    ...(challenge.extraTypeTags || [])
  ].filter(Boolean);
}

function colorBase() {
  return { id: "base", word: "", hex: "" };
}

function sizeBase() {
  return { id: "normal", word: "" };
}

function wordLevel() {
  if (state.correctCount < Math.ceil(state.questionGoal * 0.3)) return "object";
  if (state.correctCount < Math.ceil(state.questionGoal * 0.65)) return "color-object";
  return "size-color-object";
}

function wordOptionKey(option) {
  return `${option.item.id}-${option.color.id}-${option.size.id}`;
}

function makeWordOption(item, color, size, correct = false) {
  const parts = [size.word, color.word, item.word].filter(Boolean);
  const label = parts.join(" ");
  const colorHex = color.hex || item.base;
  return { type: "word", item, color, size, correct, label, value: label, colorHex };
}

function buildWordRound() {
  const level = wordLevel();
  const itemPool = level === "object" ? vocabulary : vocabulary.filter((item) => item.colorable);
  const previousKey = state.challenge?.key;
  let item = sample(itemPool);
  let color = level === "object" ? colorBase() : sample(colorWords);
  let size = level === "size-color-object" ? sample(sizeWords) : sizeBase();
  let attempts = 0;

  while (`${item.id}-${color.id}-${size.id}` === previousKey && attempts < 30) {
    item = sample(itemPool);
    color = level === "object" ? colorBase() : sample(colorWords);
    size = level === "size-color-object" ? sample(sizeWords) : sizeBase();
    attempts += 1;
  }

  const answer = makeWordOption(item, color, size, true);
  const used = new Set([wordOptionKey(answer)]);
  const options = [answer];

  while (options.length < 4) {
    const nextItem = sample(itemPool);
    const nextColor = level === "object" ? colorBase() : sample(colorWords);
    const nextSize = level === "size-color-object" ? sample(sizeWords) : sizeBase();
    const option = makeWordOption(nextItem, nextColor, nextSize, false);
    const key = wordOptionKey(option);

    if (!used.has(key)) {
      used.add(key);
      options.push(option);
    }
  }

  return {
    game: "words",
    level,
    answer,
    key: wordOptionKey(answer),
    prompt: `Find the ${answer.label}`,
    spoken: `Find the ${answer.label}.`,
    hint: level === "size-color-object" ? "Listen for size, color, and thing." : "Listen and pick the picture.",
    options: shuffle(options)
  };
}

function shapeLevel() {
  if (state.correctCount < Math.ceil(state.questionGoal * 0.35)) return "flat-shape";
  if (state.correctCount < Math.ceil(state.questionGoal * 0.65)) return "solid-shape";
  return "color-shape";
}

function shapePoolForLevel(level) {
  if (level === "flat-shape") return shapeSet.filter((shape) => shape.dimension === "flat");
  if (level === "solid-shape") return shapeSet.filter((shape) => shape.dimension === "solid");
  return shapeSet;
}

function shapeOptionKey(option) {
  return `${option.shape.id}-${option.color.id}`;
}

function makeShapeOption(shape, color, correct = false) {
  const label = [color.word, shape.word].filter(Boolean).join(" ");
  return {
    type: "shape",
    shape,
    color,
    correct,
    label,
    artHtml: drawShape(shape, color.hex)
  };
}

function buildShapeRound() {
  const level = shapeLevel();
  const shapePool = shapePoolForLevel(level);
  const previousKey = state.challenge?.key;
  let shape = sample(shapePool);
  let color = level === "color-shape" ? sample(colorWords) : { id: "plain", word: "", hex: shape.dimension === "solid" ? "#9d8df1" : "#4ecdc4" };
  let attempts = 0;

  while (`${shape.id}-${color.id}` === previousKey && attempts < 30) {
    shape = sample(shapePool);
    color = level === "color-shape" ? sample(colorWords) : { id: "plain", word: "", hex: shape.dimension === "solid" ? "#9d8df1" : "#4ecdc4" };
    attempts += 1;
  }

  const answer = makeShapeOption(shape, color, true);
  const used = new Set([shapeOptionKey(answer)]);
  const options = [answer];

  while (options.length < 4) {
    const nextShape = sample(shapePool);
    const nextColor = level === "color-shape" ? sample(colorWords) : { id: "plain", word: "", hex: nextShape.dimension === "solid" ? "#9d8df1" : "#4ecdc4" };
    const option = makeShapeOption(nextShape, nextColor, false);
    const key = shapeOptionKey(option);
    if (!used.has(key)) {
      used.add(key);
      options.push(option);
    }
  }

  return {
    game: "shapes",
    level,
    shape,
    answer,
    key: shapeOptionKey(answer),
    prompt: `Find the ${answer.label}`,
    spoken: `Find the ${answer.label}.`,
    hint: level === "flat-shape" ? "Look at the flat shape." : level === "solid-shape" ? "Look at the solid shape." : "Listen for colour and shape.",
    hintFirst: level === "solid-shape" ? "Look for flat faces or curved sides." : "Look at the sides and corners.",
    hintSecond: shapeFeatureText(shape),
    explanation: `${answer.label} is right. ${shapeFeatureText(shape)}`,
    options: shuffle(options)
  };
}

function patternOptionKey(option) {
  return `${option.shape.id}-${option.color.id}`;
}

function makePatternTile(shape, color, correct = false) {
  const label = `${color.word} ${shape.word}`;
  return {
    type: "pattern",
    shape,
    color,
    correct,
    label,
    artHtml: drawShape(shape, color.hex)
  };
}

function renderPatternToken(sequence) {
  const cells = sequence
    .map((tile) => `<span class="pattern-cell">${drawShape(tile.shape, tile.color.hex)}</span>`)
    .join("");
  return `<div class="math-token pattern-math-token"><div class="pattern-token pattern-token-large">${cells}<span class="pattern-missing">?</span></div></div>`;
}

function renderPatternExplanation(sequence, answerTile) {
  const cells = [...sequence, answerTile]
    .map((tile, index) => `<span class="pattern-cell${index === sequence.length ? " pattern-answer-cell" : ""}">${drawShape(tile.shape, tile.color.hex)}</span>`)
    .join("");
  return `<div class="math-token pattern-math-token teaching-token"><div class="pattern-token pattern-token-large">${cells}</div><strong>${answerTile.color.word} ${answerTile.shape.word}</strong></div>`;
}

function buildPatternRound() {
  const earlyPatterns = ["abab", "aab"];
  const hardPatterns = ["abc", "abb", "abbc"];
  const patternKind = state.correctCount < Math.ceil(state.questionGoal * 0.4) ? sample(earlyPatterns) : sample(hardPatterns);
  const shapes = shuffle(logicShapeSet).slice(0, 4);
  const colors = shuffle(colorWords).slice(0, 3);
  const a = { shape: shapes[0], color: colors[0] };
  const b = { shape: shapes[1], color: colors[1] };
  const c = { shape: shapes[2], color: colors[2] };
  let sequence;
  let answerTile;

  if (patternKind === "aab") {
    sequence = [a, a, b, a, a];
    answerTile = b;
  } else if (patternKind === "abc") {
    sequence = [a, b, c, a, b];
    answerTile = c;
  } else if (patternKind === "abb") {
    sequence = [a, b, b, a, b];
    answerTile = b;
  } else if (patternKind === "abbc") {
    sequence = [a, b, b, c, a, b, b];
    answerTile = c;
  } else {
    sequence = [a, b, a, b];
    answerTile = a;
  }

  const answer = makePatternTile(answerTile.shape, answerTile.color, true);
  const used = new Set([patternOptionKey(answer)]);
  const options = [answer];

  while (options.length < 4) {
    const option = makePatternTile(sample(logicShapeSet), sample(colorWords), false);
    const key = patternOptionKey(option);
    if (!used.has(key)) {
      used.add(key);
      options.push(option);
    }
  }

  return {
    game: "patterns",
    level: patternKind,
    answer,
    key: `pattern-${patternKind}-${patternOptionKey(answer)}`,
    prompt: "What comes next?",
    spoken: "What comes next?",
    hint: "Find the pattern.",
    hintFirst: "Look at what comes again and again.",
    hintSecond: "Say the pattern out loud, then choose what comes next.",
    explanation: `It is ${answer.label}. The pattern keeps going.`,
    explanationHtml: renderPatternExplanation(sequence, answerTile),
    targetHtml: renderPatternToken(sequence),
    options: shuffle(options)
  };
}

function makeListeningOption(label, correct = false, hideName = false) {
  return {
    type: "listen",
    label,
    correct,
    hideName,
    artHtml: listeningArtForLabel(label)
  };
}

function dialogueSegmentsFromScript(script) {
  const speakerPattern = /\b(Girl|Boy|Mum|Dad|Woman|Man|Teacher|Child|Emma|Tom|Mia|Ben|Anna|Jack|Lucy|Sam|Leo|Zoe|Amy|Maya|Noah|Lily|Alex|Ella|Sara|Max|Oliver)\s*:\s*/g;
  const matches = [...String(script).matchAll(speakerPattern)];

  if (matches.length < 2) {
    return [{ speaker: "Narrator", text: script }];
  }

  return matches.map((match, index) => {
    const next = matches[index + 1];
    return {
      speaker: match[1],
      text: String(script).slice(match.index + match[0].length, next?.index ?? String(script).length).trim()
    };
  }).filter((segment) => segment.text);
}

function speechSegmentText(segment) {
  return `${segment.speaker}: ${segment.text}`;
}

function listeningSpeechSegments(item) {
  return [
    ...dialogueSegmentsFromScript(item.script).map(speechSegmentText),
    speechSegmentText({ speaker: "Question", text: item.question })
  ];
}

function renderListeningTarget(levelLabel, isDialogue = false) {
  return `
    <div class="listening-token${isDialogue ? " dialogue-token" : ""}">
      <span class="listening-icon" aria-hidden="true"></span>
      ${isDialogue ? '<span class="speaker-pair" aria-hidden="true"><span></span><span></span></span>' : ""}
      <span class="listening-level">${levelLabel}</span>
    </div>
  `;
}

function nextListeningItem(level, part = null) {
  const banks = {
    ketListen: ketListeningBank,
    petListen: petListeningBank,
    a2Listen: filterListeningBankForAge(a2ListeningBank),
    b1Listen: petListeningBank
  };
  const fullBank = banks[level] || ketListeningBank;
  const filteredBank = part ? fullBank.filter((item) => listeningPartForItem(level, item) === part) : fullBank;
  const bank = filteredBank.length ? filteredBank : fullBank;
  const deckKey = part ? `${level}:${part}` : level;
  if (!state.listeningDecks[deckKey]) state.listeningDecks[deckKey] = [];
  if (!state.listeningDecks[deckKey].length) {
    state.listeningDecks[deckKey] = shuffle(bank);
  }

  return pullDeckItemWithCooldown(state.listeningDecks[deckKey], level, (item) => listeningTagForItem(level, item));
}

function buildListeningRound(level, part = null) {
  const item = nextListeningItem(level, part);
  const options = shuffle(item.choices.map((choice) => makeListeningOption(choice, choice === item.answer)));
  const partKey = part || listeningPartForItem(level, item);
  const levelLabel = listeningPartLabel(level, partKey);
  const speechSegments = listeningSpeechSegments(item);

  return {
    game: level,
    level,
    answer: item.answer,
    key: item.id,
    typeTag: listeningTagForItem(level, item),
    prompt: item.question,
    spoken: `${item.script} ${item.question}`,
    speechSegments,
    hint: listeningPartHint(level, partKey),
    targetHtml: renderListeningTarget(levelLabel, speechSegments.length > 2),
    options
  };
}

function buildListeningSequenceRound() {
  const tasks = [
    {
      id: "morning-bag",
      sequence: ["blue hat", "yellow coat", "green bag"],
      distractor: "red shoes",
      script: "Listen and get ready. First, put on the blue hat. Then take the yellow coat. Last, pick up the green bag."
    },
    {
      id: "after-school-order",
      sequence: ["buy bread", "go to the park", "visit Grandma"],
      distractor: "watch a film",
      script: "After school, Ben must buy bread first. Then he can go to the park. After that, he will visit Grandma."
    },
    {
      id: "party-food-order",
      sequence: ["apple", "cake", "banana"],
      distractor: "fish",
      script: "For the party table, put the apple down first. Put the cake next. Put the banana down last."
    },
    {
      id: "class-day-order",
      sequence: ["Friday", "Saturday", "Sunday"],
      distractor: "Monday",
      script: "The play is on Friday. The picnic is on Saturday. The swimming lesson is on Sunday."
    },
    {
      id: "library-cafe-park",
      sequence: ["library", "cafe", "park"],
      distractor: "school",
      script: "First, return the book at the library. Then meet Dad at the cafe. After that, walk to the park."
    },
    {
      id: "school-shop-home",
      sequence: ["school", "shop", "kitchen"],
      distractor: "swimming pool",
      script: "Mia goes to school first. After school she goes to the shop. Last, she helps in the kitchen."
    },
    {
      id: "shoes-hat-bag",
      sequence: ["red shoes", "blue hat", "green bag"],
      distractor: "yellow coat",
      script: "Put on the red shoes first. Then find the blue hat. Finally, carry the green bag."
    },
    {
      id: "sport-story-film",
      sequence: ["play football", "read a book", "watch a film"],
      distractor: "buy bread",
      script: "After lunch, play football first. Then read a book quietly. In the evening, watch a film."
    }
  ];
  const task = sample(tasks);
  const labels = shuffle([...task.sequence, task.distractor]);

  return {
    game: "ketListen",
    level: "ket-sequence",
    kind: "sequence",
    sequence: task.sequence,
    sequenceIndex: 0,
    answer: { label: task.sequence.join(", ") },
    key: `ket-sequence-${task.id}`,
    typeTag: "ketListen:sequence",
    prompt: "Tap the pictures in order.",
    spoken: `${task.script} Tap the pictures in order.`,
    hint: "Start with the first thing you hear.",
    speechSegments: [
      speechSegmentText({ speaker: "Narrator", text: task.script }),
      speechSegmentText({ speaker: "Question", text: "Tap the pictures in order." })
    ],
    targetHtml: renderSequenceTarget(task.sequence, 0),
    sequenceTarget: true,
    options: labels.map((label) => makeListeningOption(label, false)),
    wideTarget: true
  };
}

function buildKetListeningRound() {
  const partPlan = ["part1", "part3", "part2", "part4"];
  const part = partPlan[state.correctCount % partPlan.length];
  return part === "part2" ? buildListeningSequenceRound() : buildListeningRound("ketListen", part);
}

function nextEnglishItem() {
  if (!state.englishDeck.length) {
    state.englishDeck = shuffle(englishSkillBank);
  }

  return pullDeckItemWithCooldown(state.englishDeck, "englishSkills", englishItemTag);
}

function buildReadingPictureRound() {
  const item = nextEnglishItem();
  return {
    game: "englishSkills",
    level: "reading-picture",
    typeTag: "reading-picture",
    extraTypeTags: [englishItemTag(item)],
    answer: item.answer,
    key: `english-${item.id}`,
    prompt: item.prompt,
    spoken: item.spoken,
    hint: item.hint,
    targetHtml: `<div class="text-card reading-card">${item.text}</div>`,
    options: shuffle(item.choices.map((choice) => makeListeningOption(choice, choice === item.answer))),
    wideTarget: true
  };
}

function buildPrepositionRound() {
  const positions = ["on the box", "under the box", "next to the box", "behind the box"];
  const answer = sample(positions);
  return {
    game: "englishSkills",
    level: "preposition",
    answer,
    key: `position-${answer}`,
    prompt: "Where is the ball?",
    spoken: "Read the sentence and choose the picture.",
    hint: "Read the sentence and choose the picture.",
    targetHtml: `<div class="text-card reading-card">The ball is ${answer}.</div>`,
    options: shuffle(positions.map((position) => makeListeningOption(position, position === answer, true))),
    wideTarget: true
  };
}

function buildEnglishDefinitionRound() {
  const items = [
    {
      id: "solid-pyramid",
      text: "It has a point at the top and flat faces.",
      answer: "pyramid",
      choices: ["pyramid", "sphere", "cube", "cylinder"]
    },
    {
      id: "cylinder",
      text: "It has two circles and one curved side.",
      answer: "cylinder",
      choices: ["cylinder", "cone", "sphere", "cube"]
    },
    {
      id: "rectangle",
      text: "It has four sides. Two are long and two are short.",
      answer: "rectangle",
      choices: ["rectangle", "square", "triangle", "circle"]
    },
    {
      id: "cone",
      text: "It has one circle and one point.",
      answer: "cone",
      choices: ["cone", "cylinder", "sphere", "rectangular prism"]
    },
    {
      id: "hexagon",
      text: "It is flat and has six sides.",
      answer: "hexagon",
      choices: ["hexagon", "pentagon", "triangle", "circle"]
    },
    {
      id: "triangular-prism",
      text: "It is a solid shape with triangle faces.",
      answer: "triangular prism",
      choices: ["triangular prism", "cube", "sphere", "cylinder"]
    },
    {
      id: "hemisphere",
      text: "It is half of a sphere.",
      answer: "hemisphere",
      choices: ["hemisphere", "sphere", "cone", "cube"]
    },
    {
      id: "semicircle",
      text: "It is half of a circle.",
      answer: "semicircle",
      choices: ["semicircle", "circle", "oval", "rectangle"]
    }
  ];
  const item = sample(items);
  return {
    game: "englishSkills",
    level: "definition",
    answer: item.answer,
    key: `definition-${item.id}`,
    prompt: "Which word fits?",
    spoken: `${item.text} Which word fits?`,
    hint: "Use the English clues.",
    targetHtml: `<div class="text-card reading-card">${item.text}</div>`,
    options: shuffle(item.choices.map((choice) => makeListeningOption(choice, choice === item.answer))),
    wideTarget: true
  };
}

function drawSimplePerson(kind = "girl", action = "stand") {
  const dress = kind === "boy" ? "#9ee0c8" : kind === "baby" ? "#ffd166" : "#f29ec2";
  const cat = kind === "cat";
  if (cat) return drawCat("#f7a76c");
  const armPath = action === "jump" ? "M42 64 L26 48 M78 64 L94 48" : action === "sleep" ? "M42 66 H78" : "M42 66 L28 78 M78 66 L92 78";
  const legPath = action === "run" ? "M52 94 L38 108 M68 94 L82 106" : action === "jump" ? "M52 94 L44 104 M68 94 L76 104" : "M52 94 V110 M68 94 V110";
  return `
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <g stroke="#253041" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="60" cy="32" r="15" fill="#fff0d8"/>
        <path d="M42 94 L50 54 H70 L78 94 Z" fill="${dress}"/>
        <path d="${armPath} ${legPath}" fill="none"/>
        ${action === "sleep" ? '<path d="M84 28 H100 M92 20 H108" fill="none"/>' : ""}
      </g>
    </svg>
  `;
}

function drawFamilyIcon(label) {
  const lower = String(label).toLowerCase();
  const profiles = {
    mum: { hair: "#6b3f70", clothes: "#f29ec2", height: 82, face: 30, y: 37, extras: '<path d="M42 42 Q60 22 78 42" fill="none" stroke="#6b3f70" stroke-width="8"/>' },
    dad: { hair: "#8a5a44", clothes: "#4ecdc4", height: 86, face: 30, y: 36, extras: '<path d="M46 32 Q60 20 74 32" fill="#8a5a44" stroke="none"/>' },
    sister: { hair: "#6b3f70", clothes: "#c0a7e8", height: 72, face: 25, y: 43, extras: '<circle cx="82" cy="40" r="7" fill="#f29ec2" stroke="none"/>' },
    brother: { hair: "#8a5a44", clothes: "#ffd166", height: 72, face: 25, y: 43, extras: '<path d="M48 38 Q60 28 72 38" fill="#8a5a44" stroke="none"/>' },
    baby: { hair: "#f0c463", clothes: "#9ee0c8", height: 58, face: 22, y: 49, extras: '<circle cx="60" cy="30" r="4" fill="#f0c463" stroke="none"/>' },
    grandma: { hair: "#f7f0ff", clothes: "#9d8df1", height: 78, face: 28, y: 39, extras: '<path d="M38 42 Q60 18 82 42" fill="#f7f0ff" stroke="#253041" stroke-width="5"/><circle cx="49" cy="48" r="4" fill="#253041" stroke="none"/><circle cx="71" cy="48" r="4" fill="#253041" stroke="none"/>' },
    grandpa: { hair: "#f7f0ff", clothes: "#6ec6ff", height: 80, face: 28, y: 39, extras: '<path d="M44 34 H76" fill="none" stroke="#f7f0ff" stroke-width="9"/><path d="M50 58 Q60 64 70 58" fill="none" stroke="#8a5a44" stroke-width="4"/>' }
  };
  const profile = profiles[lower] || profiles.mum;
  const bodyTop = 48 + (86 - profile.height) * 0.18;
  const bodyBottom = 98;
  return `
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <g stroke="#253041" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="60" cy="${profile.y}" r="${profile.face}" fill="#fff0d8"/>
        ${profile.extras}
        <path d="M38 ${bodyBottom} L46 ${bodyTop} H74 L82 ${bodyBottom} Z" fill="${profile.clothes}"/>
        <circle cx="50" cy="${profile.y + 1}" r="3.5" fill="#253041" stroke="none"/>
        <circle cx="70" cy="${profile.y + 1}" r="3.5" fill="#253041" stroke="none"/>
        <path d="M52 ${profile.y + 16} Q60 ${profile.y + 21} 68 ${profile.y + 16}" fill="none"/>
      </g>
    </svg>
  `;
}

function drawBodyPartIcon(label) {
  const lower = String(label).toLowerCase();
  const icons = {
    head: '<circle cx="60" cy="54" r="32" fill="#fff0d8"/><path d="M40 34 C50 18 72 18 82 34" fill="none" stroke="#6b3f70"/><circle cx="50" cy="52" r="4" fill="#253041" stroke="none"/><circle cx="70" cy="52" r="4" fill="#253041" stroke="none"/><path d="M52 68 Q60 74 68 68" fill="none"/>',
    eye: '<path d="M22 60 C42 34 78 34 98 60 C78 86 42 86 22 60 Z" fill="#fffaf0"/><circle cx="60" cy="60" r="18" fill="#8fd7ff"/><circle cx="60" cy="60" r="8" fill="#253041" stroke="none"/><circle cx="66" cy="54" r="4" fill="#fff" stroke="none"/>',
    ear: '<path d="M62 22 C90 28 96 58 80 76 C70 88 72 98 58 98 C42 98 34 80 38 60 C42 40 48 24 62 22 Z" fill="#fff0d8"/><path d="M62 42 C78 48 78 62 66 70 C58 76 58 84 66 88" fill="none"/>',
    nose: '<circle cx="60" cy="54" r="32" fill="#fff0d8"/><path d="M60 36 C50 56 54 74 68 72" fill="none"/><circle cx="54" cy="78" r="3" fill="#253041" stroke="none"/><circle cx="68" cy="78" r="3" fill="#253041" stroke="none"/>',
    mouth: '<circle cx="60" cy="54" r="32" fill="#fff0d8"/><path d="M36 62 Q60 86 84 62" fill="none" stroke="#ef476f" stroke-width="7"/><path d="M42 72 H78" fill="none" stroke="#fff" stroke-width="3"/>',
    hand: '<path d="M42 92 V52 C42 42 54 42 54 52 V70 M54 70 V42 C54 32 66 32 66 42 V70 M66 70 V48 C66 38 78 38 78 48 V74 M42 66 L34 58 C28 52 20 60 26 68 L44 94 C50 104 78 102 86 88 L94 70 C98 60 86 56 82 66" fill="#fff0d8"/>',
    foot: '<path d="M36 42 C54 44 58 56 58 72 V82 H86 C100 82 104 96 92 102 H42 C28 102 24 92 30 82 C34 74 32 56 36 42 Z" fill="#fff0d8"/><path d="M60 82 H92" fill="none"/>'
  };
  const markup = icons[lower];
  if (!markup) return "";
  return `
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <g stroke="#253041" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        ${markup}
      </g>
    </svg>
  `;
}

function drawThemeIcon(label) {
  const lower = label.toLowerCase();
  const withoutArticle = lower.replace(/^the\s+/, "");
  if (withoutArticle !== lower) return drawThemeIcon(withoutArticle);
  const vocab = vocabulary.find((item) => item.word === lower);
  if (vocab) return vocab.draw(vocab.base);
  const simpleObject = drawSimpleObjectIcon(lower);
  if (simpleObject) return simpleObject;
  if (["mum", "dad", "sister", "brother", "baby", "grandma", "grandpa"].includes(lower)) return drawFamilyIcon(lower);
  if (["head", "eye", "ear", "nose", "mouth", "hand", "foot"].includes(lower)) return drawBodyPartIcon(lower);
  if (["bread", "rice", "milk", "juice", "cake", "ice cream"].includes(lower)) {
    if (lower === "cake") return drawCake();
    if (lower === "ice cream") return drawIceCreamIcon("vanilla");
    return `<svg viewBox="0 0 120 120" aria-hidden="true"><g stroke="#253041" stroke-width="6" stroke-linejoin="round"><rect x="32" y="34" width="56" height="58" rx="8" fill="#fffaf0"/><text x="60" y="68" text-anchor="middle" font-size="18" font-weight="900" fill="#253041" stroke="none">${lower}</text></g></svg>`;
  }
  if (["cow", "pig", "horse", "sheep", "lion", "monkey", "bear", "frog"].includes(lower)) return drawAnimalIcon(lower);
  if (["hat", "coat", "raincoat", "shoes", "dress", "shirt", "socks", "scarf", "bag"].includes(lower)) return drawClothingIcon(lower);
  if (["kitchen", "bathroom", "bedroom", "living room", "garden", "park", "library", "school", "cafe", "swimming pool", "bus stop", "shop"].includes(lower)) return drawPlaceIcon(lower);
  if (["on the box", "under the box", "next to the box", "behind the box"].includes(lower)) return drawPositionIcon(lower);
  if (["sunny", "rainy", "cloudy", "windy", "snowy"].includes(lower)) return drawWeatherIcon(lower);
  if (["sunday", "saturday", "friday", "monday", "tuesday", "wednesday", "thursday"].includes(lower)) return drawCalendarIcon(label);
  if (lower === "running") return drawSimplePerson("girl", "run");
  if (lower === "jumping") return drawSimplePerson("girl", "jump");
  if (lower === "sleeping") return drawSimplePerson("girl", "sleep");
  if (lower === "reading") return drawActionIcon("read a book");
  if (["tree", "flower", "grass", "sky", "star", "moon", "sun"].includes(lower)) return lower === "star" ? drawStar("#f0c463") : lower === "sun" ? drawSun("#ffd166") : drawTree("#65bd53");
  return drawGenericListenIcon();
}

function makeEnglishArtOption(label, correct = false) {
  return {
    type: "listen",
    label,
    correct,
    artHtml: drawThemeIcon(label)
  };
}

function renderSequenceTarget(sequence, completedCount = 0) {
  const stepWords = ["First", "Next", "Last"];
  const slots = sequence.map((label, index) => {
    const isDone = index < completedCount;
    const isCurrent = index === completedCount;
    const art = isDone ? drawThemeIcon(label) : '<span class="sequence-placeholder">?</span>';
    const name = isDone ? label : "";
    return `
      <div class="sequence-slot${isDone ? " filled" : ""}${isCurrent ? " current" : ""}">
        <span class="sequence-number">${index + 1}</span>
        <span class="sequence-step-word">${stepWords[index] || `Step ${index + 1}`}</span>
        <span class="sequence-slot-art">${art}</span>
        <span class="sequence-slot-name">${name}</span>
      </div>
    `;
  });

  return `
    <div class="math-token sequence-order-token">
      <div class="sequence-slot-row">
        ${slots.join('<span class="sequence-connector">then</span>')}
      </div>
    </div>
  `;
}

function buildVocabThemeRound() {
  const themes = [
    ["mum", "dad", "sister", "brother", "baby", "grandma"],
    ["head", "hand", "foot", "eye", "ear", "nose"],
    ["bread", "rice", "milk", "juice", "cake", "ice cream"],
    ["cow", "pig", "horse", "sheep", "lion", "monkey"],
    ["hat", "coat", "shoes", "dress", "shirt", "socks"],
    ["ball", "car", "doll", "kite", "teddy bear", "drum"],
    ["kitchen", "bathroom", "bedroom", "living room", "garden", "school"],
    ["tree", "flower", "grass", "sky", "star", "moon"]
  ];
  const pool = sample(themes);
  const answer = sample(pool);
  return {
    game: "englishSkills",
    level: "vocab-theme",
    typeTag: "english:vocab",
    answer,
    key: `vocab-${answer}`,
    prompt: "What is this?",
    spoken: "What is this?",
    hint: "Look at the picture and choose the word.",
    targetHtml: `<div class="math-token english-target">${drawThemeIcon(answer)}</div>`,
    options: shuffle([answer, ...shuffle(pool.filter((word) => word !== answer)).slice(0, 3)].map((word) => makeEnglishArtOption(word, word === answer)))
  };
}

function buildPluralRound() {
  const nouns = ["cat", "dog", "ball", "star", "cake"];
  const noun = sample(nouns);
  const plural = `${noun}s`;
  const count = sample([1, 2, 3]);
  const answer = count === 1 ? noun : plural;
  const art = Array.from({ length: count }, () => `<span class="mini-picture">${drawThemeIcon(noun)}</span>`).join("");
  return {
    game: "englishSkills",
    level: "plural",
    typeTag: "english:plural",
    answer,
    key: `plural-${noun}-${count}`,
    prompt: "How do you say it?",
    spoken: "How do you say it?",
    hint: "Use one word for one thing. Add s for more than one.",
    targetHtml: `<div class="math-token english-target"><div class="mini-picture-row">${art}</div></div>`,
    options: shuffle([noun, plural, `${noun}es`, `${noun}z`].map((word) => makeTextChoice(word, word === answer)))
  };
}

function buildPronounRound() {
  const cases = [
    { label: "girl", answer: "She", art: drawSimplePerson("girl") },
    { label: "boy", answer: "He", art: drawSimplePerson("boy") },
    { label: "cat", answer: "It", art: drawCat("#f7a76c") }
  ];
  const selected = sample(cases);
  return {
    game: "englishSkills",
    level: "pronoun",
    typeTag: "english:pronoun",
    answer: selected.answer,
    key: `pronoun-${selected.label}`,
    prompt: "Choose the missing word.",
    spoken: "Choose the missing word.",
    hint: "Choose he, she, or it.",
    targetHtml: `<div class="math-token english-target">${selected.art}<span class="sentence-strip">___ is happy.</span></div>`,
    options: shuffle(["He", "She", "It", "They"].map((word) => makeTextChoice(word, word === selected.answer)))
  };
}

function buildWhQuestionRound() {
  const cases = [
    { question: "Where is the ball?", answer: "under the box", art: drawPositionIcon("under the box"), options: ["on the box", "under the box", "next to the box", "behind the box"] },
    { question: "What is blue?", answer: "car", art: drawCar("#118ab2"), options: ["car", "cat", "fish", "tree"] },
    { question: "Who has the book?", answer: "Mum", art: `<div class="mini-picture-row"><span class="mini-picture">${drawFamilyIcon("mum")}</span><span class="mini-picture">${drawSimpleObjectIcon("book")}</span></div>`, options: ["Mum", "Dad", "the dog", "the cat"] },
    { question: "What white drink can you have with breakfast?", answer: "milk", art: drawThemeIcon("milk"), options: ["milk", "bread", "cake", "rice"] },
    { question: "What looks round in the night sky?", answer: "moon", art: drawThemeIcon("moon"), options: ["moon", "sun", "tree", "ball"] },
    { question: "Which animal says baa?", answer: "sheep", art: drawThemeIcon("sheep"), options: ["sheep", "cow", "horse", "lion"] },
    { question: "Where do you sleep?", answer: "bedroom", art: drawPlaceIcon("bedroom"), options: ["bedroom", "kitchen", "garden", "school"] }
  ];
  const selected = sample(cases);
  return {
    game: "englishSkills",
    level: "wh-question",
    typeTag: "english:wh",
    answer: selected.answer,
    key: `wh-${selected.answer}`,
    prompt: selected.question,
    spoken: selected.question,
    hint: "Listen to the question word.",
    targetHtml: `<div class="math-token english-target">${selected.art}</div>`,
    options: shuffle(selected.options.map((word) => makeEnglishArtOption(word, word === selected.answer)))
  };
}

function buildYesNoRound() {
  const colour = sample(colorWords);
  const actual = sample(colorWords);
  const answer = colour.id === actual.id ? "Yes" : "No";
  return {
    game: "englishSkills",
    level: "yes-no",
    typeTag: "english:yes-no",
    answer,
    key: `yes-no-${colour.id}-${actual.id}`,
    prompt: `Is it ${colour.word}?`,
    spoken: `Is it ${colour.word}?`,
    hint: "Look at the colour, then choose yes or no.",
    targetHtml: `<div class="math-token english-target">${drawBall(actual.hex)}</div>`,
    options: shuffle(["Yes", "No"].map((word) => makeTextChoice(word, word === answer)))
  };
}

function buildVerbIngRound() {
  const cases = [
    { answer: "running", art: drawSimplePerson("girl", "run") },
    { answer: "jumping", art: drawSimplePerson("girl", "jump") },
    { answer: "sleeping", art: drawSimplePerson("girl", "sleep") },
    { answer: "reading", art: drawActionIcon("read a book") }
  ];
  const selected = sample(cases);
  return {
    game: "englishSkills",
    level: "verb-ing",
    typeTag: "english:ing",
    answer: selected.answer,
    key: `ing-${selected.answer}`,
    prompt: "What is she doing?",
    spoken: "What is she doing?",
    hint: "Look at the action.",
    targetHtml: `<div class="math-token english-target">${selected.art}</div>`,
    options: shuffle(cases.map((item) => makeEnglishArtOption(item.answer, item.answer === selected.answer)))
  };
}

function buildOppositeRound() {
  const pairs = [
    ["big", "small"], ["hot", "cold"], ["fast", "slow"], ["happy", "sad"],
    ["up", "down"], ["day", "night"], ["wet", "dry"], ["open", "closed"]
  ];
  const pair = sample(pairs);
  const promptWord = sample(pair);
  const answer = pair.find((word) => word !== promptWord);
  const distractors = shuffle(pairs.flat().filter((word) => word !== promptWord && word !== answer)).slice(0, 3);
  return {
    game: "englishSkills",
    level: "opposites",
    typeTag: "english:opposite",
    answer,
    key: `opposite-${promptWord}`,
    prompt: "Find the opposite.",
    spoken: `Find the opposite of ${promptWord}.`,
    hint: "Opposite means the other way round.",
    targetHtml: `<div class="math-token english-target"><span class="text-option-token">${promptWord.toUpperCase()}</span></div>`,
    options: shuffle([answer, ...distractors].map((word) => makeTextChoice(word, word === answer)))
  };
}

function buildStorySequenceRound() {
  const stories = [
    { id: "morning", sequence: ["wake up", "eat breakfast", "go to school"], distractor: "sleeping" },
    { id: "rain", sequence: ["rainy", "carry umbrella", "go to school"], distractor: "sunny" },
    { id: "flower", sequence: ["seed", "plant", "flower"], distractor: "moon" },
    { id: "book", sequence: ["open book", "read a book", "close book"], distractor: "play football" }
  ];
  const story = sample(stories);
  const labels = shuffle([...story.sequence, story.distractor]);
  return {
    game: "englishSkills",
    level: "story-sequence",
    kind: "sequence",
    typeTag: "english:story",
    sequence: story.sequence,
    sequenceIndex: 0,
    answer: { label: story.sequence.join(", ") },
    key: `story-${story.id}`,
    prompt: "Put the story in order.",
    spoken: "Put the story in order.",
    hint: "Tap first, next, and last.",
    targetHtml: renderSequenceTarget(story.sequence, 0),
    sequenceTarget: true,
    options: labels.map((label) => makeEnglishArtOption(label, false)),
    wideTarget: true
  };
}

function buildSentencePictureMatchRound() {
  const cases = [
    { sentence: "The cat is on the box.", answer: "on the box", options: ["on the box", "under the box", "next to the box", "behind the box"] },
    { sentence: "The ball is under the box.", answer: "under the box", options: ["on the box", "under the box", "next to the box", "behind the box"] },
    { sentence: "The dog is next to the box.", answer: "next to the box", options: ["on the box", "under the box", "next to the box", "behind the box"] },
    { sentence: "The ball is behind the box.", answer: "behind the box", options: ["on the box", "under the box", "next to the box", "behind the box"] },
    { sentence: "Mum is reading a book.", answer: "read a book", options: ["read a book", "ride a bike", "watch a film", "draw a picture"] },
    { sentence: "Dad buys bread before going to the park.", answer: "buy bread", options: ["buy bread", "go to the park", "play football", "read a book"] },
    { sentence: "The animal has wool and says baa.", answer: "sheep", options: ["sheep", "lion", "cow", "horse"] },
    { sentence: "The moon is in the night sky.", answer: "moon", options: ["moon", "sun", "tree", "ball"] },
    { sentence: "The girl wears a scarf because it is cold.", answer: "scarf", options: ["scarf", "shirt", "socks", "hat"] }
  ];
  const selected = sample(cases);
  return {
    game: "englishSkills",
    level: "sentence-picture",
    typeTag: "english:sentence",
    answer: selected.answer,
    key: `sentence-${selected.answer}`,
    prompt: "Choose the matching picture.",
    spoken: "Choose the matching picture.",
    hint: "Read the sentence and look at the picture.",
    targetHtml: `<div class="text-card reading-card">${selected.sentence}</div>`,
    options: shuffle(selected.options.map((label) => makeListeningOption(label, label === selected.answer, true))),
    wideTarget: true
  };
}

function buildCountRound() {
  const answer = 2 + Math.floor(Math.random() * 5);
  return {
    game: "math",
    level: "count",
    answer,
    key: `count-${answer}`,
    prompt: "How many?",
    spoken: "How many?",
    hint: "Count the dots.",
    targetHtml: renderCountDots(answer)
  };
}

function buildAdditionRound() {
  let left = 1 + Math.floor(Math.random() * 4);
  let right = 1 + Math.floor(Math.random() * 4);

  while (left + right > 8) {
    left = 1 + Math.floor(Math.random() * 4);
    right = 1 + Math.floor(Math.random() * 4);
  }

  return {
    game: "math",
    level: "plus",
    left,
    right,
    answer: left + right,
    key: `plus-${left}-${right}`,
    prompt: `What is ${left} + ${right}?`,
    spoken: `What is ${left} plus ${right}?`,
    hint: "Listen and choose the number.",
    hintFirst: "Count them all together.",
    hintSecond: `${left} and ${right} more. Try counting again.`,
    explanation: `${left} plus ${right} makes ${left + right}.`,
    explanationHtml: renderAdditionExplanation(left, right),
    explanationMinimumMs: 950,
    targetHtml: `<div class="math-token"><span class="equation-token">${left} + ${right}</span></div>`
  };
}

function buildSubtractionRound() {
  const left = 4 + Math.floor(Math.random() * 5);
  const right = 1 + Math.floor(Math.random() * Math.min(4, left - 1));

  return {
    game: "math",
    level: "minus",
    left,
    right,
    answer: left - right,
    key: `minus-${left}-${right}`,
    prompt: `What is ${left} - ${right}?`,
    spoken: `What is ${left} minus ${right}?`,
    hint: "Listen and choose the number.",
    hintFirst: "Take some away. Count what is left.",
    hintSecond: `Cross out ${right}. How many stay?`,
    explanation: `${left} take away ${right} leaves ${left - right}.`,
    explanationHtml: renderSubtractionExplanation(left, right),
    explanationMinimumMs: 950,
    targetHtml: `<div class="math-token"><span class="equation-token">${left} - ${right}</span></div>`
  };
}

function buildOneMoreRound() {
  const number = 1 + Math.floor(Math.random() * 7);

  return {
    game: "math",
    level: "one-more",
    answer: number + 1,
    key: `more-${number}`,
    prompt: `One more than ${number}`,
    spoken: `What is one more than ${number}?`,
    hint: "Choose the next number.",
    targetHtml: `<div class="math-token"><span class="equation-token">${number} + 1</span></div>`
  };
}

function buildOneLessRound() {
  const number = 2 + Math.floor(Math.random() * 7);

  return {
    game: "math",
    level: "one-less",
    answer: number - 1,
    key: `less-${number}`,
    prompt: `One less than ${number}`,
    spoken: `What is one less than ${number}?`,
    hint: "Choose the number before.",
    targetHtml: `<div class="math-token"><span class="equation-token">${number} - 1</span></div>`
  };
}

function renderTenFrame(filled) {
  const cells = Array.from({ length: 10 }, (_, index) => `<span class="ten-cell${index < filled ? " filled" : ""}"></span>`).join("");
  return `<div class="math-token"><div class="ten-frame" aria-hidden="true">${cells}</div></div>`;
}

function buildSubitiseRound() {
  const answer = 2 + Math.floor(Math.random() * 5);
  return {
    game: "numberSense",
    level: "subitise",
    answer,
    key: `subitise-${answer}`,
    prompt: "How many?",
    spoken: "How many do you see?",
    hint: "Try to see the amount before counting.",
    targetHtml: renderCountDots(answer)
  };
}

function buildTenFrameRound() {
  const filled = 4 + Math.floor(Math.random() * 5);
  const answer = 10 - filled;
  return {
    game: "numberSense",
    level: "make-ten",
    answer,
    key: `make-ten-${filled}`,
    prompt: "How many more make 10?",
    spoken: `There are ${filled}. How many more make ten?`,
    hint: "Look at the empty spaces.",
    targetHtml: renderTenFrame(filled)
  };
}

function buildNumberBondRound() {
  const whole = 5 + Math.floor(Math.random() * 6);
  const part = 1 + Math.floor(Math.random() * (whole - 1));
  return {
    game: "numberSense",
    level: "number-bond",
    answer: whole - part,
    key: `bond-${part}-${whole}`,
    prompt: `Make ${whole}`,
    spoken: `What number goes with ${part} to make ${whole}?`,
    hint: "Think about the missing part.",
    targetHtml: `<div class="math-token"><span class="equation-token">${part} + ? = ${whole}</span></div>`
  };
}

function buildBalanceRound() {
  const total = 6 + Math.floor(Math.random() * 5);
  const left = 2 + Math.floor(Math.random() * (total - 3));
  return {
    game: "mathReasoning",
    level: "balance",
    answer: total - left,
    key: `balance-${left}-${total}`,
    prompt: "Balance the scale.",
    spoken: `What number balances the scale? ${left} plus what equals ${total}?`,
    hint: "Both sides must be equal.",
    targetHtml: `
      <div class="math-token">
        <div class="balance-token">
          <span>${left} + ?</span>
          <span>=</span>
          <span>${total}</span>
        </div>
      </div>
    `
  };
}

function renderStoryStars(count, crossed = 0) {
  return Array.from({ length: count }, (_, index) => `<span class="story-star${index >= count - crossed ? " crossed" : ""}">★</span>`).join("");
}

function renderTwoStepToken(start, add, take) {
  const afterAdd = start + add;
  const left = afterAdd - take;
  return `
    <div class="math-token two-step-token">
      <div class="story-step">
        <span class="step-label">Start</span>
        <span class="story-stars">${renderStoryStars(start)}</span>
        <strong>${start}</strong>
      </div>
      <span class="step-arrow">+ ${add}</span>
      <div class="story-step">
        <span class="step-label">Add</span>
        <span class="story-stars">${renderStoryStars(afterAdd)}</span>
        <strong>${afterAdd}</strong>
      </div>
      <span class="step-arrow">- ${take}</span>
      <div class="story-step">
        <span class="step-label">Left</span>
        <span class="story-stars">${renderStoryStars(afterAdd, take)}</span>
        <strong>?</strong>
      </div>
    </div>
  `;
}

function buildTwoStepRound() {
  const start = 2 + Math.floor(Math.random() * 5);
  const add = 1 + Math.floor(Math.random() * 3);
  const take = 1 + Math.floor(Math.random() * Math.min(3, start + add - 1));
  const answer = start + add - take;
  return {
    game: "mathReasoning",
    level: "two-step",
    answer,
    key: `two-step-${start}-${add}-${take}`,
    prompt: "How many stars are left?",
    spoken: `Mia has ${start} stars. She gets ${add} more, then gives away ${take}. How many stars are left?`,
    hint: "Start, add more, then cross out the stars she gives away.",
    targetHtml: renderTwoStepToken(start, add, take),
    wideTarget: true
  };
}

function nextQuestionDeckItem(mode, bank) {
  if (!state.questionDecks[mode]) state.questionDecks[mode] = [];
  if (!state.questionDecks[mode].length) {
    state.questionDecks[mode] = shuffle(bank);
  }

  return pullDeckItemWithCooldown(state.questionDecks[mode], mode, questionTagForItem);
}

function questionTagForItem(item) {
  if (!item) return "unknown";
  if (item.patternKind) return `${item.type}-${item.patternKind}`;
  if (item.compositionKind) return `${item.type}-${item.compositionKind}`;
  return item.type || item.id || "unknown";
}

function nextAdaptiveQuestionItem(mode, bank, allowItem) {
  const eligible = bank.filter((item) => allowItem(item, state.mathStage));
  const pool = eligible.length ? eligible : bank;
  return choosePoolItemWithCooldown(pool, mode, questionTagForItem);
}

function allowNumberSenseItem(item, stage) {
  if (stage <= 0) {
    if (item.type === "make-ten") return true;
    if (item.type === "number-bond") return item.whole <= 10;
    if (item.type === "count-on") return item.start <= 12;
    if (item.type === "odd-even") return item.count <= 14;
    if (item.type === "ordinal") return item.target <= 4;
    return false;
  }
  if (stage === 1) {
    if (item.type === "make-ten") return true;
    if (item.type === "number-bond") return item.whole <= 12;
    if (item.type === "count-on") return item.start <= 18;
    if (item.type === "odd-even") return item.count <= 18;
    if (item.type === "skip-count") return item.step <= 5;
    if (item.type === "ordinal") return item.target <= 5;
    return false;
  }
  if (stage === 2) {
    if (item.type === "make-ten" || item.type === "count-on" || item.type === "odd-even" || item.type === "ordinal") return true;
    if (item.type === "skip-count") return item.step <= 5;
    if (item.type === "place-value") return item.number <= 40;
    if (item.type === "compare-two-digit") return Math.max(item.left, item.right) <= 45;
    if (item.type === "bond-ways") return item.whole <= 14;
    if (item.type === "number-bond") return item.whole <= 14;
    return false;
  }
  if (stage === 3) {
    if (item.type === "number-bond") return item.whole <= 16;
    if (item.type === "place-value") return item.number <= 50;
    if (item.type === "compare-two-digit" || item.type === "skip-count" || item.type === "bond-ways") return true;
    return ["make-ten", "count-on", "odd-even", "ordinal"].includes(item.type);
  }
  if (item.type === "count-on") return item.start >= 12;
  if (item.type === "odd-even") return item.count >= 15;
  if (item.type === "place-value") return item.number >= 30;
  if (item.type === "number-bond") return item.whole >= 12;
  if (item.type === "bond-ways") return item.whole >= 12;
  if (item.type === "ordinal") return item.target >= 4;
  return ["make-ten", "skip-count", "compare-two-digit"].includes(item.type);
}

function allowMathReasoningItem(item, stage) {
  if (stage <= 0) {
    if (item.type === "add") return item.left + item.right <= 5;
    if (item.type === "subtract") return item.left <= 5;
    if (item.type === "missing-addend") return item.whole <= 6;
    return false;
  }
  if (stage === 1) {
    if (item.type === "add") return item.left + item.right <= 8;
    if (item.type === "subtract") return item.left <= 8;
    if (item.type === "missing-addend") return item.whole <= 10;
    if (item.type === "doubles") return item.number <= 5;
    return false;
  }
  if (stage === 2) {
    if (item.type === "balance") return item.total <= 10;
    if (item.type === "add") return item.left + item.right <= 10;
    if (item.type === "subtract") return item.left <= 10;
    if (item.type === "missing-addend") return item.whole <= 12;
    if (item.type === "three-addend") return item.first + item.second + item.third <= 12;
    if (item.type === "doubles") return item.number <= 8;
    if (item.type === "halves") return item.whole <= 16;
    if (item.type === "compare-symbol") return Math.max(item.left, item.right) <= 20;
    return false;
  }
  if (stage === 3) {
    if (item.type === "array") return item.rows <= 3 && item.cols <= 4;
    if (item.type === "two-step") return item.start + item.add <= 10;
    if (item.type === "balance") return item.total <= 12;
    if (["missing-addend", "three-addend", "doubles", "halves", "compare-symbol", "fraction"].includes(item.type)) return true;
    return ["add", "subtract"].includes(item.type);
  }
  if (item.type === "add") return item.left + item.right >= 10;
  if (item.type === "subtract") return item.left >= 10;
  if (item.type === "missing-addend") return item.whole >= 12;
  if (item.type === "three-addend") return item.first + item.second + item.third >= 11;
  if (item.type === "doubles") return item.number >= 7;
  if (item.type === "halves") return item.whole >= 12;
  if (item.type === "balance") return item.total >= 11;
  if (item.type === "array") return item.rows * item.cols >= 10;
  if (item.type === "two-step") return item.start + item.add >= 8;
  if (item.type === "compare-symbol") return Math.max(item.left, item.right) >= 9;
  return item.type === "fraction";
}

function renderCountOnToken(start, steps) {
  const sequence = Array.from({ length: steps + 2 }, (_, index) => start + index);
  const cells = sequence
    .map((number, index) => `<span>${index === steps ? "?" : number}</span>`)
    .join("");
  return `<div class="math-token"><div class="logic-number-rule count-on-rule">${cells}</div></div>`;
}

function makeTextChoice(label, correct = false) {
  return {
    type: "group",
    correct,
    label: String(label),
    artHtml: `<span class="text-option-token">${label}</span>`,
    hideName: true
  };
}

function withSpokenLabel(option, spokenLabel) {
  return {
    ...option,
    spokenLabel
  };
}

function spokenTextForOption(option) {
  return String(option?.spokenLabel || option?.label || "").trim();
}

function makeBigTextChoice(label, correct = false, className = "") {
  return {
    type: "group",
    correct,
    label: String(label),
    artHtml: `<span class="text-option-token ${className}">${label}</span>`,
    hideName: true
  };
}

function renderOddEvenToken(count) {
  const pairs = [];
  for (let index = 0; index < count; index += 2) {
    const second = index + 1 < count;
    pairs.push(`
      <span class="dot-pair${second ? "" : " single"}">
        <span class="count-dot"></span>
        ${second ? '<span class="count-dot"></span>' : ""}
      </span>
    `);
  }
  return `<div class="math-token"><div class="pair-dot-row">${pairs.join("")}</div></div>`;
}

function renderSkipCountToken(start, step) {
  const sequence = Array.from({ length: 5 }, (_, index) => start + step * index);
  const blankIndex = 3;
  const cells = sequence
    .map((number, index) => `<span>${index === blankIndex ? "?" : number}</span>`)
    .join("");
  return `<div class="math-token"><div class="logic-number-rule skip-count-rule">${cells}</div></div>`;
}

function renderPlaceValueToken(number) {
  const tens = Math.floor(number / 10);
  const ones = number % 10;
  const tenFrames = Array.from({ length: tens }, () => `
    <div class="ten-frame compact-frame" aria-hidden="true">
      ${Array.from({ length: 10 }, () => '<span class="ten-cell filled"></span>').join("")}
    </div>
  `).join("");
  const looseDots = Array.from({ length: ones }, () => '<span class="count-dot small-dot"></span>').join("");
  return `
    <div class="math-token place-value-token place-value-large">
      <div class="tens-stack">${tenFrames}</div>
      <span class="teaching-sign">+</span>
      <div class="loose-ones" aria-hidden="true">${looseDots || '<span class="empty-ones">0</span>'}</div>
    </div>
  `;
}

function placeValueLabel(tens, ones) {
  const tenText = tens === 1 ? "ten" : "tens";
  const oneText = ones === 1 ? "one" : "ones";
  return `${tens} ${tenText}, ${ones} ${oneText}`;
}

function makePlaceValueChoice(label, correct = false) {
  const match = String(label).match(/^(\d+)\s+(ten|tens),\s+(\d+)\s+(one|ones)$/);
  if (!match) return makeTextChoice(label, correct);
  return {
    type: "group",
    correct,
    label,
    artHtml: `
      <span class="place-value-choice-token">
        <span><strong>${match[1]}</strong> ${match[2]}</span>
        <span><strong>${match[3]}</strong> ${match[4]}</span>
      </span>
    `,
    hideName: true
  };
}

function makePlaceValueOptions(tens, ones) {
  const answer = placeValueLabel(tens, ones);
  const used = new Set([answer]);
  const labels = [answer];
  const candidates = [
    [tens, Math.max(0, ones - 1)],
    [tens, Math.min(9, ones + 1)],
    [tens === 1 ? tens + 1 : tens - 1, ones],
    [tens + 1, ones],
    [tens, ones === 0 ? 2 : 0],
    [Math.max(1, tens - 2), Math.min(9, ones + 2)]
  ];

  for (const [candidateTens, candidateOnes] of candidates) {
    if (candidateTens < 1 || candidateOnes < 0 || candidateOnes > 9) continue;
    const label = placeValueLabel(candidateTens, candidateOnes);
    if (!used.has(label)) {
      used.add(label);
      labels.push(label);
    }
    if (labels.length === 4) break;
  }

  let fallbackTens = 1;
  let fallbackOnes = 0;
  while (labels.length < 4) {
    const label = placeValueLabel(fallbackTens, fallbackOnes);
    if (!used.has(label)) {
      used.add(label);
      labels.push(label);
    }
    fallbackOnes = (fallbackOnes + 3) % 10;
    if (fallbackOnes === 0) fallbackTens += 1;
  }

  return shuffle(labels.map((label) => makePlaceValueChoice(label, label === answer)));
}

function makeCompareTwoDigitOptions(left, right, ask) {
  const answer = ask === "bigger" ? Math.max(left, right) : Math.min(left, right);
  return shuffle([left, right].map((value) => ({
    type: "math",
    value,
    label: String(value),
    correct: value === answer
  })));
}

function makeBondDistractor(whole, used) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const left = Math.floor(Math.random() * (whole + 1));
    const right = Math.floor(Math.random() * (whole + 1));
    const key = `${left}+${right}`;
    if (left + right === whole) continue;
    if (used.has(key)) continue;
    used.add(key);
    return { left, right, label: `${left} + ${right}`, value: left + right };
  }

  for (let left = 0; left <= whole + 2; left += 1) {
    for (let right = 0; right <= whole + 2; right += 1) {
      const key = `${left}+${right}`;
      if (left + right === whole || used.has(key)) continue;
      used.add(key);
      return { left, right, label: `${left} + ${right}`, value: left + right };
    }
  }

  return null;
}

function renderCompareNumberToken(left, right) {
  return `
    <div class="math-token">
      <div class="compare-number-token">
        <span>${left}</span>
        <strong>?</strong>
        <span>${right}</span>
      </div>
    </div>
  `;
}

function ordinalWord(number) {
  return ["first", "second", "third", "fourth", "fifth", "sixth"][number - 1] || `${number}th`;
}

function renderOrdinalToken(target) {
  const cards = Array.from({ length: 6 }, (_, index) => {
    const number = index + 1;
    return `<span class="ordinal-card${number === target ? " target" : ""}"><span class="ordinal-crown"></span><strong>${number}</strong></span>`;
  }).join("");
  return `<div class="math-token"><div class="ordinal-row">${cards}</div></div>`;
}

function renderThreeGroupToken(groups) {
  return `
    <div class="math-token">
      <div class="teaching-groups">
        ${groups.map((count) => `<span class="teaching-group">${renderTeachingDots(count)}</span>`).join('<span class="teaching-sign">+</span>')}
      </div>
    </div>
  `;
}

function renderDoubleToken(number) {
  return `
    <div class="math-token">
      <div class="teaching-groups mirror-groups">
        <span class="teaching-group">${renderTeachingDots(number)}</span>
        <span class="teaching-sign">+</span>
        <span class="teaching-group accent">${renderTeachingDots(number)}</span>
      </div>
    </div>
  `;
}

function renderHalfToken(whole) {
  const dots = renderTeachingDots(whole);
  return `
    <div class="math-token">
      <div class="half-token">
        <span class="half-row">${dots}</span>
        <span class="half-divider"></span>
      </div>
    </div>
  `;
}

function renderFractionToken(kind) {
  const grayShade = "#e6e0ec";
  const sectors = {
    half: `<circle cx="60" cy="60" r="40" fill="url(#fraction-check-${kind})"/><path d="M60 20 A40 40 0 0 1 60 100 Z" fill="#f29ec2"/>`,
    quarter: `<circle cx="60" cy="60" r="40" fill="url(#fraction-check-${kind})"/><path d="M60 60 L60 20 A40 40 0 0 1 100 60 Z" fill="#f29ec2"/>`,
    all: '<circle cx="60" cy="60" r="40" fill="#f29ec2"/>',
    none: `<circle cx="60" cy="60" r="40" fill="url(#fraction-check-${kind})"/>`
  };
  return `
    <div class="math-token">
      <svg class="fraction-pizza" viewBox="0 0 120 120" aria-hidden="true">
        <defs>
          <pattern id="fraction-check-${kind}" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M0 0 H10 V10 H0 Z" fill="${grayShade}"/>
            <path d="M0 0 H5 V5 H0 Z M5 5 H10 V10 H5 Z" fill="#f4f1f7"/>
          </pattern>
        </defs>
        <circle cx="60" cy="60" r="40" fill="url(#fraction-check-${kind})" stroke="#253041" stroke-width="4"/>
        ${sectors[kind] || sectors.half}
        <path d="M60 20 V100 M20 60 H100" stroke="#253041" stroke-width="3" opacity="0.34"/>
      </svg>
    </div>
  `;
}

function buildNumberSenseChallenge(item) {
  if (item.type === "subitise") {
    return {
      game: "numberSense",
      level: "subitise",
      typeTag: item.type,
      answer: item.count,
      key: item.id,
      prompt: "How many?",
      spoken: "How many do you see?",
      hint: "Try to see the amount before counting.",
      targetHtml: renderCountDots(item.count)
    };
  }

  if (item.type === "make-ten") {
    const answer = 10 - item.filled;
    return {
      game: "numberSense",
      level: "make-ten",
      typeTag: item.type,
      answer,
      key: item.id,
      prompt: "How many more make 10?",
      spoken: `There are ${item.filled}. How many more make ten?`,
      hint: "Look at the empty spaces.",
      targetHtml: renderTenFrame(item.filled)
    };
  }

  if (item.type === "number-bond") {
    return {
      game: "numberSense",
      level: "number-bond",
      typeTag: item.type,
      answer: item.whole - item.part,
      key: item.id,
      prompt: `Make ${item.whole}`,
      spoken: `What number goes with ${item.part} to make ${item.whole}?`,
      hint: "Think about the missing part.",
      targetHtml: `<div class="math-token"><span class="equation-token">${item.part} + ? = ${item.whole}</span></div>`
    };
  }

  if (item.type === "count-on") {
    return {
      game: "numberSense",
      level: "count-on",
      typeTag: item.type,
      answer: item.start + item.steps,
      key: item.id,
      prompt: "Count forward.",
      spoken: `Count forward from ${item.start}. What number is missing?`,
      hint: "Say the numbers in order.",
      targetHtml: renderCountOnToken(item.start, item.steps)
    };
  }

  if (item.type === "odd-even") {
    const answer = item.count % 2 === 0 ? "even" : "odd";
    return {
      game: "numberSense",
      level: "odd-even",
      typeTag: item.type,
      answer,
      key: item.id,
      prompt: "Odd or even?",
      spoken: `Is ${item.count} odd or even?`,
      hint: "Pair the dots. If every dot has a partner, it is even.",
      hintFirst: "Make pairs of two.",
      hintSecond: "Look for a dot without a partner.",
      targetHtml: renderOddEvenToken(item.count),
      options: shuffle(["odd", "even", "both", "neither"].map((label) => makeBigTextChoice(label, label === answer, label === "both" || label === "neither" ? "uncertain-option" : "")))
    };
  }

  if (item.type === "skip-count") {
    const answer = item.start + item.step * 3;
    return {
      game: "numberSense",
      level: "skip-count",
      typeTag: item.type,
      answer,
      key: item.id,
      prompt: `Count by ${item.step}s.`,
      spoken: `Count by ${item.step}s. What number is missing?`,
      hint: `Each step adds ${item.step}.`,
      hintFirst: "Look at the jump between the numbers.",
      hintSecond: `Add ${item.step} each time.`,
      targetHtml: renderSkipCountToken(item.start, item.step)
    };
  }

  if (item.type === "place-value") {
    const tens = Math.floor(item.number / 10);
    const ones = item.number % 10;
    const answer = placeValueLabel(tens, ones);
    return {
      game: "numberSense",
      level: "place-value",
      typeTag: item.type,
      answer,
      key: item.id,
      prompt: "How many tens and ones?",
      spoken: `${item.number}. How many tens and ones?`,
      hint: "Ten is one full ten-frame. Count the loose ones.",
      targetHtml: renderPlaceValueToken(item.number),
      options: makePlaceValueOptions(tens, ones),
      wideTarget: true
    };
  }

  if (item.type === "compare-two-digit") {
    const answer = item.ask === "bigger" ? Math.max(item.left, item.right) : Math.min(item.left, item.right);
    return {
      game: "numberSense",
      level: "compare-two-digit",
      typeTag: item.type,
      answer,
      key: item.id,
      prompt: item.ask === "bigger" ? "Pick the bigger number." : "Pick the smaller number.",
      spoken: item.ask === "bigger" ? "Pick the bigger number from the two shown." : "Pick the smaller number from the two shown.",
      hint: "Look at the tens first, then the ones.",
      targetHtml: renderCompareNumberToken(item.left, item.right),
      options: makeCompareTwoDigitOptions(item.left, item.right, item.ask)
    };
  }

  if (item.type === "bond-ways") {
    const answer = `${item.left} + ${item.right}`;
    const used = new Set([`${item.left}+${item.right}`]);
    const options = [answer];
    while (options.length < 4) {
      const distractor = makeBondDistractor(item.whole, used);
      if (!distractor) break;
      options.push(distractor.label);
    }
    return {
      game: "numberSense",
      level: "bond-ways",
      typeTag: item.type,
      answer,
      key: item.id,
      prompt: `Which two numbers make ${item.whole}?`,
      spoken: `Which two numbers make ${item.whole}?`,
      hint: "Put the two parts together.",
      targetHtml: `<div class="math-token"><span class="equation-token">${item.whole}</span></div>`,
      options: shuffle(options.map((label) => makeTextChoice(label, label === answer)))
    };
  }

  if (item.type === "ordinal") {
    const answer = ordinalWord(item.target);
    const labels = [1, 2, 3, 4, 5, 6].map(ordinalWord);
    return {
      game: "numberSense",
      level: "ordinal",
      typeTag: item.type,
      answer,
      key: item.id,
      prompt: `Who is ${answer}?`,
      spoken: `Who is ${answer}?`,
      hint: "Count from the front of the line.",
      targetHtml: renderOrdinalToken(item.target),
      options: shuffle(labels.filter((label) => label === answer || Math.abs(labels.indexOf(label) - labels.indexOf(answer)) <= 3).slice(0, 4).map((label) => makeTextChoice(label, label === answer)))
    };
  }

  if (item.type === "one-less") {
    return {
      game: "numberSense",
      level: "one-less",
      typeTag: item.type,
      answer: item.number - 1,
      key: item.id,
      prompt: `One less than ${item.number}`,
      spoken: `What is one less than ${item.number}?`,
      hint: "Choose the number before.",
      targetHtml: `<div class="math-token"><span class="equation-token">${item.number} - 1</span></div>`
    };
  }

  return {
    game: "numberSense",
    level: "one-more",
    typeTag: item.type,
    answer: item.number + 1,
    key: item.id,
    prompt: `One more than ${item.number}`,
    spoken: `What is one more than ${item.number}?`,
    hint: "Choose the next number.",
    targetHtml: `<div class="math-token"><span class="equation-token">${item.number} + 1</span></div>`
  };
}

function renderArrayToken(rows, cols) {
  const dots = Array.from({ length: rows * cols }, () => '<span class="count-dot"></span>').join("");
  return `<div class="math-token"><div class="array-grid" style="grid-template-columns: repeat(${cols}, 1fr)" aria-hidden="true">${dots}</div></div>`;
}

function buildMathReasoningChallenge(item) {
  if (item.type === "add") {
    return {
      game: "mathReasoning",
      level: "plus",
      typeTag: item.type,
      left: item.left,
      right: item.right,
      answer: item.left + item.right,
      key: item.id,
      prompt: `What is ${item.left} + ${item.right}?`,
      spoken: `What is ${item.left} plus ${item.right}?`,
      hint: "Put the groups together.",
      hintFirst: "Count them all together.",
      hintSecond: `${item.left} and ${item.right} more. Try counting again.`,
      explanation: `${item.left} plus ${item.right} makes ${item.left + item.right}.`,
      explanationHtml: renderAdditionExplanation(item.left, item.right),
      explanationMinimumMs: 950,
      targetHtml: `<div class="math-token"><span class="equation-token">${item.left} + ${item.right}</span></div>`
    };
  }

  if (item.type === "subtract") {
    return {
      game: "mathReasoning",
      level: "minus",
      typeTag: item.type,
      left: item.left,
      right: item.right,
      answer: item.left - item.right,
      key: item.id,
      prompt: `What is ${item.left} - ${item.right}?`,
      spoken: `What is ${item.left} minus ${item.right}?`,
      hint: "Take away and count what is left.",
      hintFirst: "Take some away. Count what is left.",
      hintSecond: `Cross out ${item.right}. How many stay?`,
      explanation: `${item.left} take away ${item.right} leaves ${item.left - item.right}.`,
      explanationHtml: renderSubtractionExplanation(item.left, item.right),
      explanationMinimumMs: 950,
      targetHtml: `<div class="math-token"><span class="equation-token">${item.left} - ${item.right}</span></div>`
    };
  }

  if (item.type === "missing-addend") {
    const answer = item.whole - item.left;
    return {
      game: "mathReasoning",
      level: "missing-addend",
      typeTag: item.type,
      answer,
      key: item.id,
      prompt: `${item.left} + ? = ${item.whole}`,
      spoken: `${item.left} plus what equals ${item.whole}?`,
      hint: "Find the missing part.",
      hintFirst: "Start with the first number.",
      hintSecond: `Count on from ${item.left} to ${item.whole}.`,
      explanation: `${item.left} plus ${answer} makes ${item.whole}.`,
      explanationHtml: renderAdditionExplanation(item.left, answer),
      explanationMinimumMs: 950,
      targetHtml: `<div class="math-token"><span class="equation-token">${item.left} + ? = ${item.whole}</span></div>`
    };
  }

  if (item.type === "three-addend") {
    const answer = item.first + item.second + item.third;
    return {
      game: "mathReasoning",
      level: "three-addend",
      typeTag: item.type,
      answer,
      key: item.id,
      prompt: `${item.first} + ${item.second} + ${item.third} = ?`,
      spoken: `What is ${item.first} plus ${item.second} plus ${item.third}?`,
      hint: "Add two groups first, then add the last group.",
      targetHtml: renderThreeGroupToken([item.first, item.second, item.third])
    };
  }

  if (item.type === "doubles") {
    const answer = item.number * 2;
    return {
      game: "mathReasoning",
      level: "doubles",
      typeTag: item.type,
      answer,
      key: item.id,
      prompt: `Double ${item.number}`,
      spoken: `Double ${item.number}.`,
      hint: "Double means the same number again.",
      targetHtml: renderDoubleToken(item.number)
    };
  }

  if (item.type === "halves") {
    const answer = item.whole / 2;
    return {
      game: "mathReasoning",
      level: "halves",
      typeTag: item.type,
      answer,
      key: item.id,
      prompt: `Half of ${item.whole}`,
      spoken: `Half of ${item.whole} is what?`,
      hint: "Split it into two equal groups.",
      targetHtml: renderHalfToken(item.whole)
    };
  }

  if (item.type === "compare-symbol") {
    const answer = item.left > item.right ? ">" : item.left < item.right ? "<" : "=";
    const spokenSymbols = {
      ">": "greater than",
      "<": "less than",
      "=": "equals"
    };
    return {
      game: "mathReasoning",
      level: "compare-symbol",
      typeTag: item.type,
      answer,
      key: item.id,
      prompt: `${item.left} ___ ${item.right}`,
      spoken: `Which sign goes between ${item.left} and ${item.right}?`,
      hint: "The open mouth faces the bigger number.",
      targetHtml: renderCompareNumberToken(item.left, item.right),
      options: shuffle([">", "<", "="].map((label) => withSpokenLabel(makeTextChoice(label, label === answer), spokenSymbols[label])))
    };
  }

  if (item.type === "fraction") {
    const labels = ["all of it", "a half", "a quarter", "none"];
    const answerMap = {
      all: "all of it",
      half: "a half",
      quarter: "a quarter",
      none: "none"
    };
    const answer = answerMap[item.kind] || "a half";
    return {
      game: "mathReasoning",
      level: "fraction",
      typeTag: item.type,
      answer,
      key: item.id,
      prompt: "How much is pink?",
      spoken: "How much is pink?",
      hint: "Look at how much of the circle is shaded.",
      targetHtml: renderFractionToken(item.kind),
      options: labels.map((label) => makeTextChoice(label, label === answer))
    };
  }

  if (item.type === "balance") {
    return {
      game: "mathReasoning",
      level: "balance",
      typeTag: item.type,
      answer: item.total - item.left,
      key: item.id,
      prompt: "Balance the scale.",
      spoken: `What number balances the scale? ${item.left} plus what equals ${item.total}?`,
      hint: "Both sides must be equal.",
      targetHtml: `
        <div class="math-token">
          <div class="balance-token">
            <span>${item.left} + ?</span>
            <span>=</span>
            <span>${item.total}</span>
          </div>
        </div>
      `
    };
  }

  if (item.type === "array") {
    return {
      game: "mathReasoning",
      level: "array",
      typeTag: item.type,
      answer: item.rows * item.cols,
      key: item.id,
      prompt: "How many in the array?",
      spoken: `There are ${item.rows} rows with ${item.cols} in each row. How many are there?`,
      hint: "Count by rows.",
      targetHtml: renderArrayToken(item.rows, item.cols)
    };
  }

  const answer = item.start + item.add - item.take;
  return {
    game: "mathReasoning",
    level: "two-step",
    typeTag: item.type,
    answer,
    key: item.id,
    prompt: "How many stars are left?",
    spoken: `Mia has ${item.start} stars. She gets ${item.add} more, then gives away ${item.take}. How many stars are left?`,
    hint: "Start, add more, then cross out the stars she gives away.",
    targetHtml: renderTwoStepToken(item.start, item.add, item.take),
    wideTarget: true
  };
}

function addNumberOptions(challenge) {
  if (!challenge.options) challenge.options = makeNumberOptions(challenge.answer);
  return challenge;
}

function buildNumberSenseRound() {
  return addNumberOptions(buildNumberSenseChallenge(nextAdaptiveQuestionItem("numberSense", numberSenseBank, allowNumberSenseItem)));
}

function buildMathReasoningRound() {
  return addNumberOptions(buildMathReasoningChallenge(nextAdaptiveQuestionItem("mathReasoning", mathReasoningBank, allowMathReasoningItem)));
}

function recordLearningResult(correct) {
  if (correct) {
    state.streak = Math.max(0, state.streak) + 1;
    if (state.streak >= 3) {
      state.mathStage = Math.min(4, state.mathStage + 1);
      state.streak = 0;
    }
    return;
  }

  state.streak = Math.min(0, state.streak) - 1;
  if (state.streak <= -2) {
    state.mathStage = Math.max(0, state.mathStage - 1);
    state.streak = 0;
  }
}

function makeNumberOptions(answer) {
  const used = new Set([answer]);
  const options = [{ type: "math", value: answer, label: String(answer), correct: true }];
  const maxValue = Math.max(answer + 5, 20);
  const offsets = shuffle([-3, -2, -1, 1, 2, 3, 4]);

  for (const offset of offsets) {
    const value = answer + offset;
    if (value >= 0 && value <= maxValue && !used.has(value)) {
      used.add(value);
      options.push({ type: "math", value, label: String(value), correct: false });
    }
    if (options.length === 4) break;
  }

  while (options.length < 4) {
    const value = Math.floor(Math.random() * (maxValue + 1));
    if (!used.has(value)) {
      used.add(value);
      options.push({ type: "math", value, label: String(value), correct: false });
    }
  }

  return shuffle(options);
}

function renderDotGroup(count) {
  const dots = Array.from({ length: count }, () => '<span class="count-dot"></span>').join("");
  return `<div class="dot-group" aria-hidden="true">${dots}</div>`;
}

function renderCountDots(count) {
  const dots = Array.from({ length: count }, () => '<span class="count-dot"></span>').join("");
  return `<div class="math-token"><div class="count-grid" aria-hidden="true">${dots}</div></div>`;
}

function renderTeachingDots(count, crossed = 0) {
  return Array.from({ length: count }, (_, index) => (
    `<span class="teaching-dot${index >= count - crossed ? " crossed" : ""}"></span>`
  )).join("");
}

function renderAdditionExplanation(left, right) {
  const total = left + right;
  return `
    <div class="math-token teaching-token">
      <div class="teaching-groups">
        <span class="teaching-group">${renderTeachingDots(left)}</span>
        <span class="teaching-sign">+</span>
        <span class="teaching-group accent">${renderTeachingDots(right)}</span>
        <span class="teaching-sign">=</span>
        <span class="teaching-group result">${renderTeachingDots(total)}</span>
      </div>
      <strong>${left} + ${right} = ${total}</strong>
    </div>
  `;
}

function renderSubtractionExplanation(left, right) {
  const answer = left - right;
  return `
    <div class="math-token teaching-token">
      <div class="teaching-groups">
        <span class="teaching-group result">${renderTeachingDots(left, right)}</span>
        <span class="teaching-sign">=</span>
        <span class="teaching-group">${renderTeachingDots(answer)}</span>
      </div>
      <strong>${left} - ${right} = ${answer}</strong>
    </div>
  `;
}

function makeOddOneOption(shape, color, correct = false) {
  return {
    type: "logic",
    shape,
    color,
    correct,
    label: `${color.word} ${shape.word}`,
    artHtml: drawShape(shape, color.hex)
  };
}

function makeLogicShapeOption(shape, color, correct = false) {
  return {
    type: "logic",
    shape,
    color,
    correct,
    label: `${color.word} ${shape.word}`,
    artHtml: drawShape(shape, color.hex)
  };
}

function renderLogicShapeTile(tile) {
  return `<span class="logic-shape-cell">${drawShape(tile.shape, tile.color.hex)}</span>`;
}

function renderLogicSingleTarget(tile, label = "?") {
  return `
    <div class="math-token logic-target-token">
      <div class="logic-target-row">
        ${renderLogicShapeTile(tile)}
        <span class="logic-arrow" aria-hidden="true">${label}</span>
      </div>
    </div>
  `;
}

function renderLogicAnalogyTarget(sourceA, resultA, sourceB) {
  return `
    <div class="math-token logic-target-token">
      <div class="logic-analogy-grid">
        ${renderLogicShapeTile(sourceA)}
        <span class="logic-arrow" aria-hidden="true">→</span>
        ${renderLogicShapeTile(resultA)}
        ${renderLogicShapeTile(sourceB)}
        <span class="logic-arrow" aria-hidden="true">→</span>
        <span class="logic-missing">?</span>
      </div>
    </div>
  `;
}

function buildOddOneRound() {
  const baseShape = sample(logicShapeSet);
  const baseColor = sample(colorWords);
  const differentByColor = Math.random() < 0.5;
  let oddShape = baseShape;
  let oddColor = baseColor;

  if (differentByColor) {
    while (oddColor.id === baseColor.id) oddColor = sample(colorWords);
  } else {
    while (oddShape.id === baseShape.id) oddShape = sample(logicShapeSet);
  }

  const options = [
    makeOddOneOption(baseShape, baseColor),
    makeOddOneOption(baseShape, baseColor),
    makeOddOneOption(baseShape, baseColor),
    makeOddOneOption(oddShape, oddColor, true)
  ];

  return {
    game: "logic",
    level: "odd-one-out",
    answer: options[3],
    key: `odd-${baseShape.id}-${baseColor.id}-${oddShape.id}-${oddColor.id}`,
    prompt: "Which one is different?",
    spoken: "Which one is different?",
    hint: "Look for the odd one out.",
    targetHtml: '<div class="math-token"><span class="logic-token">?</span></div>',
    options: shuffle(options)
  };
}

function makeGroupOption(count, correct = false) {
  return {
    type: "group",
    value: count,
    correct,
    label: `${count}`,
    artHtml: renderDotGroup(count)
  };
}

function buildMoreLessRound() {
  const askMore = Math.random() < 0.5;
  const counts = shuffle([1, 2, 3, 4, 5, 6]).slice(0, 4);
  const answer = askMore ? Math.max(...counts) : Math.min(...counts);

  return {
    game: "logic",
    level: askMore ? "more" : "fewer",
    answer,
    key: `${askMore ? "more" : "fewer"}-${counts.join("-")}`,
    prompt: askMore ? "Which has more?" : "Which has fewer?",
    spoken: askMore ? "Which has more?" : "Which has fewer?",
    hint: "Compare the groups.",
    targetHtml: '<div class="math-token"><span class="logic-token">?</span></div>',
    options: shuffle(counts.map((count) => makeGroupOption(count, count === answer)))
  };
}

function buildSameAttributeRound() {
  const matchShape = Math.random() < 0.5;
  const shapes = shuffle(logicShapeSet).slice(0, 4);
  const colors = shuffle(colorWords).slice(0, 4);
  const target = { shape: shapes[0], color: colors[0] };
  const answer = matchShape
    ? makeLogicShapeOption(target.shape, colors[1], true)
    : makeLogicShapeOption(shapes[1], target.color, true);
  const options = [
    answer,
    makeLogicShapeOption(matchShape ? shapes[1] : target.shape, matchShape ? target.color : colors[1]),
    makeLogicShapeOption(shapes[2], colors[2]),
    makeLogicShapeOption(shapes[3], colors[3])
  ];

  return {
    game: "logic",
    level: matchShape ? "same-shape" : "same-color",
    answer,
    key: `${matchShape ? "same-shape" : "same-color"}-${target.shape.id}-${target.color.id}-${answer.shape.id}-${answer.color.id}`,
    prompt: matchShape ? "Same shape?" : "Same colour?",
    spoken: matchShape ? "Which one has the same shape?" : "Which one has the same colour?",
    hint: matchShape ? "Ignore the colour." : "Ignore the shape.",
    targetHtml: renderLogicSingleTarget(target, "="),
    options: shuffle(options)
  };
}

function buildTwoMoreLessRound() {
  const askMore = Math.random() < 0.5;
  const base = askMore ? 1 + Math.floor(Math.random() * 5) : 3 + Math.floor(Math.random() * 5);
  const answer = askMore ? base + 2 : base - 2;
  const used = new Set([answer]);
  const counts = [answer];
  const candidates = shuffle([1, 2, 3, 4, 5, 6, 7, 8]);

  for (const count of candidates) {
    if (!used.has(count)) {
      used.add(count);
      counts.push(count);
    }
    if (counts.length === 4) break;
  }

  return {
    game: "logic",
    level: askMore ? "two-more" : "two-fewer",
    answer,
    key: `${askMore ? "two-more" : "two-fewer"}-${base}`,
    prompt: askMore ? "Two more?" : "Two fewer?",
    spoken: askMore ? `Which has two more than ${base}?` : `Which has two fewer than ${base}?`,
    hint: askMore ? `Start with ${base}, then add 2.` : `Start with ${base}, then take away 2.`,
    targetHtml: `<div class="math-token"><div class="logic-number-rule"><span>${base}</span><span>${askMore ? "+ 2" : "- 2"}</span></div></div>`,
    options: shuffle(counts.map((count) => makeGroupOption(count, count === answer)))
  };
}

function buildAnalogyRound() {
  const ruleType = sample(["color", "shape", "color", "shape"]);
  const shapes = shuffle(logicShapeSet).slice(0, 4);
  const colors = shuffle(colorWords).slice(0, 4);
  let sourceA;
  let resultA;
  let sourceB;
  let answerTile;
  let distractors;

  if (ruleType === "shape") {
    sourceA = { shape: shapes[0], color: colors[0] };
    resultA = { shape: shapes[1], color: colors[0] };
    sourceB = { shape: shapes[0], color: colors[1] };
    answerTile = { shape: shapes[1], color: colors[1] };
    distractors = [
      { shape: shapes[0], color: colors[1] },
      { shape: shapes[1], color: colors[0] },
      { shape: shapes[2], color: colors[1] }
    ];
  } else {
    sourceA = { shape: shapes[0], color: colors[0] };
    resultA = { shape: shapes[0], color: colors[1] };
    sourceB = { shape: shapes[1], color: colors[0] };
    answerTile = { shape: shapes[1], color: colors[1] };
    distractors = [
      { shape: shapes[1], color: colors[0] },
      { shape: shapes[0], color: colors[1] },
      { shape: shapes[2], color: colors[1] }
    ];
  }

  const answer = makeLogicShapeOption(answerTile.shape, answerTile.color, true);
  const used = new Set([`${answer.shape.id}-${answer.color.id}`]);
  const options = [answer];
  distractors.forEach((tile) => {
    const key = `${tile.shape.id}-${tile.color.id}`;
    if (!used.has(key)) {
      used.add(key);
      options.push(makeLogicShapeOption(tile.shape, tile.color));
    }
  });
  while (options.length < 4) {
    const tile = { shape: sample(logicShapeSet), color: sample(colorWords) };
    const key = `${tile.shape.id}-${tile.color.id}`;
    if (!used.has(key)) {
      used.add(key);
      options.push(makeLogicShapeOption(tile.shape, tile.color));
    }
  }

  return {
    game: "logic",
    level: `analogy-${ruleType}`,
    answer,
    key: `analogy-${ruleType}-${sourceA.shape.id}-${sourceA.color.id}-${sourceB.shape.id}-${sourceB.color.id}-${answer.shape.id}-${answer.color.id}`,
    prompt: ruleType === "shape" ? "Change the shape." : "Change the colour.",
    spoken: ruleType === "shape" ? "Change the shape." : "Change the colour.",
    hint: ruleType === "shape" ? "Keep the colour. Change the shape like the first row." : "Keep the shape. Change the colour like the first row.",
    targetHtml: renderLogicAnalogyTarget(sourceA, resultA, sourceB),
    options: shuffle(options),
    wideTarget: true
  };
}

function buildShapeCompositionRound() {
  const square = shapeSet.find((shape) => shape.id === "square");
  const rectangle = shapeSet.find((shape) => shape.id === "rectangle");
  const diamond = shapeSet.find((shape) => shape.id === "diamond");
  const cube = shapeSet.find((shape) => shape.id === "cube");
  const triangularPrism = shapeSet.find((shape) => shape.id === "triangular-prism");
  const cases = [
    {
      id: "two-triangles-square",
      prompt: "Two equal triangles can make...",
      spoken: "Two equal triangles can make which shape?",
      hint: "Put the long sides together to make a square.",
      pieces: ["triangle", "triangle"],
      answerShape: square
    },
    {
      id: "two-squares-rectangle",
      prompt: "Two squares can make...",
      spoken: "Two squares side by side can make which shape?",
      hint: "Look at the whole shape.",
      pieces: ["square", "square"],
      answerShape: rectangle
    },
    {
      id: "cube-face",
      prompt: "A cube has this face.",
      spoken: "Which flat shape is on the face of a cube?",
      hint: "Think about the side of the solid shape.",
      pieces: ["cube"],
      answerShape: square
    },
    {
      id: "prism-face",
      prompt: "A triangular prism has this side face.",
      spoken: "Which flat shape is on the side face of a triangular prism?",
      hint: "Look for the triangle face.",
      pieces: ["triangular-prism"],
      answerShape: shapeSet.find((shape) => shape.id === "triangle")
    }
  ].filter((item) => item.answerShape && item.pieces.every((pieceId) => shapeSet.some((shape) => shape.id === pieceId)));
  const item = sample(cases);
  const answer = makeShapeOption(item.answerShape, { id: "plain", word: "", hex: "#4ecdc4" }, true);
  const used = new Set([item.answerShape.id]);
  const options = [answer];

  while (options.length < 4) {
    const shape = sample(item.answerShape.dimension === "solid" ? solidShapeSet : flatShapeSet);
    if (!used.has(shape.id)) {
      used.add(shape.id);
      options.push(makeShapeOption(shape, { id: "plain", word: "", hex: shape.dimension === "solid" ? "#9d8df1" : "#4ecdc4" }));
    }
  }

  const piecesHtml = item.pieces
    .map((pieceId) => {
      const shape = shapeSet.find((candidate) => candidate.id === pieceId);
      return `<span class="composition-piece">${drawShape(shape, shape.dimension === "solid" ? "#9d8df1" : "#ffd166")}</span>`;
    })
    .join("");

  return {
    game: "logicSpatial",
    level: "shape-composition",
    answer,
    key: `compose-${item.id}`,
    prompt: item.prompt,
    spoken: item.spoken,
    hint: item.hint,
    targetHtml: `<div class="math-token"><div class="shape-composition">${piecesHtml}<span class="logic-arrow">→</span><span class="logic-missing">?</span></div></div>`,
    options: shuffle(options),
    wideTarget: true
  };
}

function recipeTile(offset, shapeShift = 0, colorShift = 0) {
  return {
    shape: logicShapeSet[(offset + shapeShift) % logicShapeSet.length],
    color: colorWords[(offset + colorShift) % colorWords.length]
  };
}

function buildPatternRecipeRound(item) {
  const a = recipeTile(item.offset, 0, 0);
  const b = recipeTile(item.offset, 1, 1);
  const c = recipeTile(item.offset, 2, 2);
  let sequence;
  let answerTile;

  if (item.patternKind === "aab") {
    sequence = [a, a, b, a, a];
    answerTile = b;
  } else if (item.patternKind === "abc") {
    sequence = [a, b, c, a, b];
    answerTile = c;
  } else if (item.patternKind === "abb") {
    sequence = [a, b, b, a, b];
    answerTile = b;
  } else if (item.patternKind === "abbc") {
    sequence = [a, b, b, c, a, b, b];
    answerTile = c;
  } else {
    sequence = [a, b, a, b];
    answerTile = a;
  }

  const answer = makePatternTile(answerTile.shape, answerTile.color, true);
  const options = [answer];
  const used = new Set([patternOptionKey(answer)]);
  [b, c, recipeTile(item.offset, 3, 3), recipeTile(item.offset, 4, 4)].forEach((tile) => {
    const option = makePatternTile(tile.shape, tile.color, false);
    const key = patternOptionKey(option);
    if (!used.has(key) && options.length < 4) {
      used.add(key);
      options.push(option);
    }
  });

  return {
    game: "logicSpatial",
    level: item.patternKind,
    answer,
    key: item.id,
    prompt: "What comes next?",
    spoken: "What comes next?",
    hint: "Find the pattern.",
    hintFirst: "Look at what comes again and again.",
    hintSecond: "Say the pattern out loud, then choose what comes next.",
    explanation: `It is ${answer.label}. The pattern keeps going.`,
    explanationHtml: renderPatternExplanation(sequence, answerTile),
    targetHtml: renderPatternToken(sequence),
    options: shuffle(options),
    wideTarget: true
  };
}

function buildOddRecipeRound(item) {
  const base = recipeTile(item.offset, 0, 0);
  const odd = item.offset % 2 === 0 ? recipeTile(item.offset, 1, 0) : recipeTile(item.offset, 0, 1);
  const options = [
    makeOddOneOption(base.shape, base.color),
    makeOddOneOption(base.shape, base.color),
    makeOddOneOption(base.shape, base.color),
    makeOddOneOption(odd.shape, odd.color, true)
  ];

  return {
    game: "logicSpatial",
    level: "odd-one-out",
    answer: options[3],
    key: item.id,
    prompt: "Which one is different?",
    spoken: "Which one is different?",
    hint: "Look for the odd one out.",
    targetHtml: '<div class="math-token"><span class="logic-token">?</span></div>',
    options: shuffle(options)
  };
}

function buildSameRecipeRound(item) {
  const matchShape = item.offset % 2 === 0;
  const target = recipeTile(item.offset, 0, 0);
  const answerTile = matchShape ? recipeTile(item.offset, 0, 1) : recipeTile(item.offset, 1, 0);
  const answer = makeLogicShapeOption(answerTile.shape, answerTile.color, true);
  const options = [
    answer,
    makeLogicShapeOption(recipeTile(item.offset, 1, 1).shape, recipeTile(item.offset, 1, 1).color),
    makeLogicShapeOption(recipeTile(item.offset, 2, 2).shape, recipeTile(item.offset, 2, 2).color),
    makeLogicShapeOption(recipeTile(item.offset, 3, 3).shape, recipeTile(item.offset, 3, 3).color)
  ];

  return {
    game: "logicSpatial",
    level: matchShape ? "same-shape" : "same-color",
    answer,
    key: item.id,
    prompt: matchShape ? "Same shape?" : "Same colour?",
    spoken: matchShape ? "Which one has the same shape?" : "Which one has the same colour?",
    hint: matchShape ? "Ignore the colour." : "Ignore the shape.",
    targetHtml: renderLogicSingleTarget(target, "="),
    options: shuffle(options)
  };
}

function buildAnalogyRecipeRound(item) {
  const ruleType = ["color", "shape"][item.offset % 2];
  const sourceA = recipeTile(item.offset, 0, 0);
  const resultA = ruleType === "shape"
    ? recipeTile(item.offset, 1, 0)
    : recipeTile(item.offset, 0, 1);
  const sourceB = ruleType === "shape"
    ? recipeTile(item.offset, 0, 2)
    : recipeTile(item.offset, 2, 0);
  const answerTile = ruleType === "shape"
    ? { shape: resultA.shape, color: sourceB.color }
    : { shape: sourceB.shape, color: resultA.color };
  const answer = makeLogicShapeOption(answerTile.shape, answerTile.color, true);
  const options = [
    answer,
    makeLogicShapeOption(sourceB.shape, sourceB.color),
    makeLogicShapeOption(resultA.shape, resultA.color),
    makeLogicShapeOption(recipeTile(item.offset, 4, 3).shape, recipeTile(item.offset, 4, 3).color)
  ];

  return {
    game: "logicSpatial",
    level: `analogy-${ruleType}`,
    answer,
    key: item.id,
    prompt: ruleType === "shape" ? "Change the shape." : "Change the colour.",
    spoken: ruleType === "shape" ? "Change the shape." : "Change the colour.",
    hint: ruleType === "shape" ? "Keep the colour. Change the shape like the first row." : "Keep the shape. Change the colour like the first row.",
    targetHtml: renderLogicAnalogyTarget(sourceA, resultA, sourceB),
    options: shuffle(options),
    wideTarget: true
  };
}

function buildCompositionRecipeRound(item) {
  const findShape = (id) => shapeSet.find((shape) => shape.id === id);
  const cases = {
    "two-triangles-square": {
      prompt: "Two equal triangles can make...",
      spoken: "Two equal triangles can make which shape?",
      hint: "Put the long sides together to make a square.",
      pieces: ["triangle", "triangle"],
      answerShape: findShape("square")
    },
    "two-squares-rectangle": {
      prompt: "Two squares can make...",
      spoken: "Two squares side by side can make which shape?",
      hint: "Look at the whole shape.",
      pieces: ["square", "square"],
      answerShape: findShape("rectangle")
    },
    "cube-face": {
      prompt: "A cube has this face.",
      spoken: "Which flat shape is on the face of a cube?",
      hint: "Think about the side of the solid shape.",
      pieces: ["cube"],
      answerShape: findShape("square")
    },
    "pyramid-face": {
      prompt: "A pyramid has this side face.",
      spoken: "Which flat shape is on the side face of a pyramid?",
      hint: "Look for the triangle face.",
      pieces: ["pyramid"],
      answerShape: findShape("triangle")
    },
    "cylinder-face": {
      prompt: "A cylinder has this face.",
      spoken: "Which flat shape is on the top of a cylinder?",
      hint: "Think about the top and bottom.",
      pieces: ["cylinder"],
      answerShape: findShape("circle")
    },
    "sphere-roll": {
      prompt: "Which solid rolls every way?",
      spoken: "Which solid rolls every way?",
      hint: "Look for the smooth solid with no flat face.",
      pieces: ["sphere"],
      answerShape: findShape("sphere")
    }
  };
  const selected = cases[item.compositionKind] || cases["cube-face"];
  const answer = makeShapeOption(selected.answerShape, { id: "plain", word: "", hex: selected.answerShape.dimension === "solid" ? "#9d8df1" : "#4ecdc4" }, true);
  const used = new Set([selected.answerShape.id]);
  const options = [answer];
  const optionPool = selected.answerShape.dimension === "solid" ? solidShapeSet : flatShapeSet;
  optionPool.forEach((shape) => {
    if (!used.has(shape.id) && options.length < 4) {
      used.add(shape.id);
      options.push(makeShapeOption(shape, { id: "plain", word: "", hex: shape.dimension === "solid" ? "#9d8df1" : "#4ecdc4" }));
    }
  });
  const piecesHtml = selected.pieces
    .map((pieceId) => {
      const shape = findShape(pieceId);
      return `<span class="composition-piece">${drawShape(shape, shape.dimension === "solid" ? "#9d8df1" : "#ffd166")}</span>`;
    })
    .join("");

  return {
    game: "logicSpatial",
    level: "shape-composition",
    answer,
    key: item.id,
    prompt: selected.prompt,
    spoken: selected.spoken,
    hint: selected.hint,
    targetHtml: `<div class="math-token"><div class="shape-composition">${piecesHtml}<span class="logic-arrow">→</span><span class="logic-missing">?</span></div></div>`,
    options: shuffle(options),
    wideTarget: true
  };
}

function makeArtChoice(label, artHtml, correct = false) {
  return {
    type: "group",
    correct,
    label,
    artHtml,
    hideName: true
  };
}

function drawSymmetryHalf(kind, side = "left", variant = "correct") {
  const mirrored = side === "right";
  const wrongShift = variant === "shifted" ? 8 : 0;
  const colour = variant === "wrong-colour" ? "#9ee0c8" : "#f29ec2";
  const transform = mirrored ? "translate(120 0) scale(-1 1)" : "";
  const shapes = {
    butterfly: `<path d="M60 60 C30 22 16 42 24 70 C30 96 52 88 60 64 Z" fill="${colour}"/><circle cx="58" cy="60" r="5" fill="#f0c463"/>`,
    heart: `<path d="M60 96 C34 74 25 52 38 40 C49 30 58 40 60 52 Z" fill="${colour}"/>`,
    flower: `<circle cx="60" cy="60" r="9" fill="#f0c463"/><ellipse cx="48" cy="45" rx="12" ry="20" fill="${colour}" transform="rotate(-30 48 45)"/><ellipse cx="45" cy="74" rx="12" ry="20" fill="${colour}" transform="rotate(28 45 74)"/>`,
    castle: `<path d="M60 92 H26 V54 H40 V32 H60 Z" fill="${colour}"/><path d="M30 54 L40 34 L50 54 Z" fill="#c0a7e8"/>`
  };
  return `
    <svg class="symmetry-half-svg" viewBox="0 0 120 120" aria-hidden="true">
      <g stroke="#253041" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" transform="${transform} translate(0 ${wrongShift})">
        ${shapes[kind] || shapes.butterfly}
      </g>
    </svg>
  `;
}

function renderSymmetryTarget(kind) {
  return `
    <div class="math-token geometry-token">
      <div class="symmetry-board">
        ${drawSymmetryHalf(kind, "left")}
        <span class="symmetry-axis"></span>
        <span class="symmetry-missing">?</span>
      </div>
    </div>
  `;
}

function buildSymmetryRound(item) {
  const kinds = ["butterfly", "heart", "flower", "castle"];
  const kind = kinds[item.offset % kinds.length];
  const answer = "matching half";
  const options = [
    makeArtChoice(answer, drawSymmetryHalf(kind, "right"), true),
    makeArtChoice("wrong colour", drawSymmetryHalf(kind, "right", "wrong-colour")),
    makeArtChoice("too low", drawSymmetryHalf(kind, "right", "shifted")),
    makeArtChoice("wrong half", drawSymmetryHalf(kinds[(item.offset + 1) % kinds.length], "right"))
  ];
  return {
    game: "logicSpatial",
    level: "symmetry",
    typeTag: "logic:symmetry",
    answer,
    key: item.id,
    prompt: "Pick the matching half.",
    spoken: "Pick the matching half.",
    hint: "The two sides should look like a mirror.",
    targetHtml: renderSymmetryTarget(kind),
    options: shuffle(options),
    wideTarget: true
  };
}

function drawRotationShape(rotation = 0, flipped = false) {
  const transform = `translate(60 60) rotate(${rotation}) scale(${flipped ? -1 : 1} 1) translate(-60 -60)`;
  return `
    <svg class="rotation-svg" viewBox="0 0 120 120" aria-hidden="true">
      <g transform="${transform}" stroke="#253041" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
        <path d="M34 24 H58 V54 H88 V78 H58 V102 H34 Z" fill="#9ee0c8"/>
        <circle cx="46" cy="38" r="4" fill="#253041" stroke="none"/>
      </g>
    </svg>
  `;
}

function buildRotationRound(item) {
  const targetRotation = [0, 90, 180, 270][item.offset % 4];
  const answerRotation = (targetRotation + 90) % 360;
  const answer = "turned shape";
  const rotations = [answerRotation, (answerRotation + 90) % 360, (answerRotation + 180) % 360, answerRotation];
  const options = rotations.map((rotation, index) => makeArtChoice(index === 0 ? answer : `turn ${index}`, drawRotationShape(rotation, index === 3), index === 0));
  return {
    game: "logicSpatial",
    level: "rotation",
    typeTag: "logic:rotation",
    answer,
    key: item.id,
    prompt: "Turn it right.",
    spoken: "Turn the shape a quarter turn to the right. Which one is right?",
    hint: "The dot moves with the shape.",
    targetHtml: `<div class="math-token geometry-token">${drawRotationShape(targetRotation)}</div>`,
    options: shuffle(options)
  };
}

const flatShapeAttributes = {
  square: { sides: 4, corners: 4 },
  triangle: { sides: 3, corners: 3 },
  rectangle: { sides: 4, corners: 4 },
  diamond: { sides: 4, corners: 4 },
  pentagon: { sides: 5, corners: 5 },
  hexagon: { sides: 6, corners: 6 }
};

const solidShapeAttributes = {
  cube: { faces: 6, edges: 12, corners: 8 },
  pyramid: { faces: 5, edges: 8, corners: 5 },
  "rectangular-prism": { faces: 6, edges: 12, corners: 8 },
  "triangular-prism": { faces: 5, edges: 9, corners: 6 }
};

function buildShapeAttributeRound(item) {
  const solid = item.type === "attribute-3d";
  const pool = solid
    ? solidShapeSet.filter((shape) => solidShapeAttributes[shape.id])
    : flatShapeSet.filter((shape) => flatShapeAttributes[shape.id]);
  const shape = pool[item.offset % pool.length];
  const attributes = solid ? solidShapeAttributes[shape.id] : flatShapeAttributes[shape.id];
  const property = solid ? sample(["faces", "edges", "corners"]) : sample(["sides", "corners"]);
  const label = property === "faces" ? "flat faces" : property;
  const answer = attributes[property];
  return {
    game: "logicSpatial",
    level: solid ? "solid-attributes" : "shape-attributes",
    typeTag: solid ? "logic:3d-attribute" : "logic:2d-attribute",
    answer,
    key: item.id,
    prompt: `How many ${label}?`,
    spoken: `How many ${label} does this shape have?`,
    hint: property === "corners" ? "Count the points." : property === "edges" ? "Count where faces meet." : "Count carefully.",
    targetHtml: `<div class="math-token geometry-token"><span class="composition-piece">${drawShape(shape, solid ? "#9d8df1" : "#4ecdc4")}</span></div>`,
    options: makeNumberOptions(answer)
  };
}

function drawRealWorldShapeObject(id) {
  const art = {
    dice: drawShape(shapeSet.find((shape) => shape.id === "cube"), "#f0c463"),
    ball: drawBall("#9d8df1"),
    can: drawShape(shapeSet.find((shape) => shape.id === "cylinder"), "#9ee0c8"),
    cone: drawIceCreamIcon("vanilla"),
    book: drawActionIcon("read a book"),
    tent: drawShape(shapeSet.find((shape) => shape.id === "triangular-prism"), "#f29ec2"),
    box: drawShape(shapeSet.find((shape) => shape.id === "rectangular-prism"), "#ffd166"),
    dome: drawShape(shapeSet.find((shape) => shape.id === "hemisphere"), "#c0a7e8")
  };
  return art[id] || art.ball;
}

function buildRealWorldShapeRound(item) {
  const cases = [
    { id: "dice", shape: "cube" },
    { id: "ball", shape: "sphere" },
    { id: "can", shape: "cylinder" },
    { id: "cone", shape: "cone" },
    { id: "book", shape: "rectangular prism" },
    { id: "tent", shape: "triangular prism" },
    { id: "box", shape: "rectangular prism" },
    { id: "dome", shape: "hemisphere" }
  ];
  const selected = cases[item.offset % cases.length];
  const distractors = shuffle(["cube", "sphere", "cylinder", "cone", "pyramid", "rectangular prism", "triangular prism", "hemisphere"].filter((shape) => shape !== selected.shape)).slice(0, 3);
  return {
    game: "logicSpatial",
    level: "real-world-shape",
    typeTag: "logic:real-world",
    answer: selected.shape,
    key: item.id,
    prompt: "What shape is this?",
    spoken: "What shape is this?",
    hint: "Match the real object to the solid shape.",
    targetHtml: `<div class="math-token geometry-token"><span class="composition-piece">${drawRealWorldShapeObject(selected.id)}</span></div>`,
    options: shuffle([selected.shape, ...distractors].map((label) => makeTextChoice(label, label === selected.shape)))
  };
}

function buildLogicSpatialRecipeRound(item) {
  let challenge;

  if (item.type === "symmetry") {
    challenge = buildSymmetryRound(item);
  } else if (item.type === "rotation") {
    challenge = buildRotationRound(item);
  } else if (item.type === "attribute-2d" || item.type === "attribute-3d") {
    challenge = buildShapeAttributeRound(item);
  } else if (item.type === "real-world") {
    challenge = buildRealWorldShapeRound(item);
  } else if (item.type === "pattern") {
    challenge = buildPatternRecipeRound(item);
  } else if (item.type === "odd") {
    challenge = buildOddRecipeRound(item);
  } else if (item.type === "same") {
    challenge = buildSameRecipeRound(item);
  } else if (item.type === "analogy") {
    challenge = buildAnalogyRecipeRound(item);
  } else {
    challenge = buildCompositionRecipeRound(item);
  }

  challenge.typeTag = questionTagForItem(item);
  return challenge;
}

function buildLogicRound() {
  const progress = state.correctCount / state.questionGoal;
  if (progress < 0.25) return sample([buildOddOneRound, buildMoreLessRound])();
  if (progress < 0.55) return sample([buildSameAttributeRound, buildTwoMoreLessRound])();
  return sample([buildAnalogyRound, buildSameAttributeRound, buildTwoMoreLessRound])();
}

function buildEnglishSkillsRound() {
  return chooseRoundBuilderWithCooldown("englishSkills", [
    { tag: "reading-picture", build: buildReadingPictureRound },
    { tag: "reading-picture", build: buildReadingPictureRound },
    { tag: "definition", build: buildEnglishDefinitionRound },
    { tag: "definition", build: buildEnglishDefinitionRound },
    { tag: "sentence-picture", build: buildSentencePictureMatchRound },
    { tag: "sentence-picture", build: buildSentencePictureMatchRound },
    { tag: "story-sequence", build: buildStorySequenceRound },
    { tag: "story-sequence", build: buildStorySequenceRound },
    { tag: "wh-question", build: buildWhQuestionRound },
    { tag: "opposites", build: buildOppositeRound },
    { tag: "verb-ing", build: buildVerbIngRound },
    { tag: "preposition", build: buildPrepositionRound },
    { tag: "vocab-theme", build: buildVocabThemeRound },
    { tag: "plural", build: buildPluralRound },
    { tag: "pronoun", build: buildPronounRound },
    { tag: "yes-no", build: buildYesNoRound }
  ]);
}

function buildLogicSpatialRound() {
  return buildLogicSpatialRecipeRound(nextQuestionDeckItem("logicSpatial", logicSpatialBank));
}

function makePhonicsOption(word, correct = false) {
  return {
    type: "listen",
    label: word,
    correct,
    artHtml: listeningArtForLabel(word)
  };
}

function phonicsTargetWord(word, label = "Listen to the word.") {
  return `
    <div class="math-token phonics-target">
      <span class="text-option-token">${word.toUpperCase()}</span>
      <small>${label}</small>
    </div>
  `;
}

function phonicsAudioTarget(label = "Listen carefully.") {
  return `
    <div class="math-token phonics-target">
      <span class="phonics-listen-icon" aria-hidden="true">${drawGenericListenIcon()}</span>
      <small>${label}</small>
    </div>
  `;
}

function choosePhonicsMatch(pool, offset, keyFn) {
  const candidates = pool.filter((word) => pool.some((other) => other.word !== word.word && keyFn(other) === keyFn(word)));
  const refPool = candidates.length ? candidates : pool;
  const ref = refPool[offset % refPool.length];
  const matches = pool.filter((word) => word.word !== ref.word && keyFn(word) === keyFn(ref));
  return {
    ref,
    correct: matches.length ? sample(matches) : ref
  };
}

function phonicsOptionsBy(matchFn, correctWord, count = 4, excludedWords = []) {
  const used = new Set([correctWord.word, ...excludedWords]);
  const options = [makePhonicsOption(correctWord.word, true)];
  const distractors = shuffle(phonicsWords.filter((item) => !matchFn(item) && !used.has(item.word)));
  for (const item of distractors) {
    used.add(item.word);
    options.push(makePhonicsOption(item.word, false));
    if (options.length === count) break;
  }
  return shuffle(options);
}

function buildInitialSoundRound(item) {
  const { ref, correct } = choosePhonicsMatch(phonicsWords, item.offset, (word) => word.initial);
  return {
    game: "phonics",
    level: "initial-sound",
    typeTag: "phonics:initial",
    answer: correct.word,
    key: item.id,
    prompt: "Which starts the same way?",
    spoken: `Which word starts like ${ref.word}?`,
    hint: `Listen to the first sound in ${ref.word}.`,
    targetHtml: phonicsTargetWord(ref.word, "Find the same first sound."),
    options: phonicsOptionsBy((word) => word.initial === ref.initial, correct, 4, [ref.word])
  };
}

function buildFinalSoundRound(item) {
  const { ref, correct } = choosePhonicsMatch(phonicsWords, item.offset * 2, (word) => word.final);
  return {
    game: "phonics",
    level: "final-sound",
    typeTag: "phonics:final",
    answer: correct.word,
    key: item.id,
    prompt: "Which ends the same way?",
    spoken: `Which word ends like ${ref.word}?`,
    hint: `Listen to the last sound in ${ref.word}.`,
    targetHtml: phonicsTargetWord(ref.word, "Find the same last sound."),
    options: phonicsOptionsBy((word) => word.final === ref.final, correct, 4, [ref.word])
  };
}

function buildShortVowelRound(item) {
  const cvcWords = phonicsWords.filter((word) => word.word.length === 3 && ["a", "e", "i", "o", "u"].includes(word.vowel));
  const { ref, correct } = choosePhonicsMatch(cvcWords, item.offset, (word) => word.vowel);
  return {
    game: "phonics",
    level: "short-vowel",
    typeTag: "phonics:vowel",
    answer: correct.word,
    key: item.id,
    prompt: "Same middle sound?",
    spoken: `Which word has the same middle sound as ${ref.word}?`,
    hint: "Listen to the sound in the middle.",
    targetHtml: phonicsTargetWord(ref.word, "Find the same middle sound."),
    options: phonicsOptionsBy((word) => word.vowel === ref.vowel, correct, 4, [ref.word])
  };
}

function buildRhymeRound(item) {
  const { ref, correct } = choosePhonicsMatch(phonicsWords, item.offset * 3, (word) => word.group);
  return {
    game: "phonics",
    level: "rhyme",
    typeTag: "phonics:rhyme",
    answer: correct.word,
    key: item.id,
    prompt: "Which one rhymes?",
    spoken: `Which word rhymes with ${ref.word}?`,
    hint: "Rhyming words sound the same at the end.",
    targetHtml: phonicsTargetWord(ref.word, "Find the rhyming word."),
    options: phonicsOptionsBy((word) => word.group === ref.group, correct, 4, [ref.word])
  };
}

function buildCvcBlendRound(item) {
  const cvcWords = phonicsWords.filter((word) => word.word.length === 3 && ["a", "e", "i", "o", "u"].includes(word.vowel));
  const answer = cvcWords[item.offset % cvcWords.length];
  const letters = answer.word.toUpperCase().split("").map((letter) => `<span>${letter}</span>`).join("");
  return {
    game: "phonics",
    level: "cvc-blend",
    typeTag: "phonics:cvc",
    answer: answer.word,
    key: item.id,
    prompt: "What word is this?",
    spoken: `What word is ${answer.word.toUpperCase().split("").join(" ")}?`,
    hint: "Look at each letter, then blend the word.",
    targetHtml: `<div class="math-token phonics-target"><div class="phonics-letter-row">${letters}</div></div>`,
    options: phonicsOptionsBy((word) => word.word === answer.word, answer)
  };
}

function buildSegmentRound(item) {
  const answer = phonicsWords.filter((word) => word.sounds <= 4)[item.offset % phonicsWords.filter((word) => word.sounds <= 4).length];
  return {
    game: "phonics",
    level: "segment",
    typeTag: "phonics:segment",
    answer: answer.sounds,
    key: item.id,
    prompt: `How many sounds can you hear in ${answer.word}?`,
    spoken: `How many sounds can you hear in ${answer.word}?`,
    hint: "Say the word slowly.",
    targetHtml: phonicsTargetWord(answer.word, "Say it slowly."),
    options: makeNumberOptions(answer.sounds)
  };
}

function buildCaseMatchRound(item) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
  const lower = alphabet[item.offset % alphabet.length];
  const upper = lower.toUpperCase();
  const askUpper = item.offset % 2 === 0;
  const answer = askUpper ? lower : upper;
  const distractors = shuffle(alphabet.filter((letter) => letter !== lower)).slice(0, 3).map((letter) => askUpper ? letter : letter.toUpperCase());
  return {
    game: "phonics",
    level: "case-match",
    typeTag: "phonics:case",
    answer,
    key: item.id,
    prompt: askUpper ? "Find the small letter." : "Find the capital letter.",
    spoken: askUpper ? `Find the small letter for ${upper}.` : `Find the capital letter for ${lower}.`,
    hint: "Match the letter shape.",
    targetHtml: `<div class="math-token phonics-target"><span class="single-letter-card">${askUpper ? upper : lower}</span></div>`,
    options: shuffle([answer, ...distractors].map((label) => makeBigTextChoice(label, label === answer, "letter-option")))
  };
}

function buildLetterSoundRound(item) {
  const ref = phonicsWords[item.offset % phonicsWords.length];
  const answer = ref.initial.toUpperCase()[0];
  const letters = shuffle("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").filter((letter) => letter !== answer)).slice(0, 3);
  return {
    game: "phonics",
    level: "letter-sound",
    typeTag: "phonics:letter-sound",
    answer,
    key: item.id,
    prompt: "Which letter starts the word?",
    spoken: `Which letter starts ${ref.word}?`,
    hint: "Listen to the first sound, then choose the letter.",
    targetHtml: phonicsAudioTarget("Find the first letter."),
    options: shuffle([answer, ...letters].map((label) => makeBigTextChoice(label, label === answer, "letter-option")))
  };
}

function buildAlphabetOrderRound(item) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const index = 1 + (item.offset % 24);
  const answer = alphabet[index + 1];
  const target = alphabet[index];
  const distractors = shuffle(alphabet.filter((letter) => letter !== answer && letter !== target)).slice(0, 3);
  return {
    game: "phonics",
    level: "alphabet-order",
    typeTag: "phonics:alphabet",
    answer,
    key: item.id,
    prompt: `What comes after ${target}?`,
    spoken: `What letter comes after ${target}?`,
    hint: "Say the alphabet in order.",
    targetHtml: `<div class="math-token phonics-target"><div class="phonics-letter-row"><span>${target}</span><span>?</span></div></div>`,
    options: shuffle([answer, ...distractors].map((label) => makeBigTextChoice(label, label === answer, "letter-option")))
  };
}

function buildSightWordRound(item) {
  const answer = sightWords[item.offset % sightWords.length];
  const distractors = shuffle(sightWords.filter((word) => word !== answer)).slice(0, 3);
  return {
    game: "phonics",
    level: "sight-word",
    typeTag: "phonics:sight",
    answer,
    key: item.id,
    prompt: "Tap the word you hear.",
    spoken: answer,
    hint: "Look at the whole word shape.",
    targetHtml: phonicsAudioTarget("Tap the word you hear."),
    options: shuffle([answer, ...distractors].map((label) => makeTextChoice(label, label === answer)))
  };
}

function buildPhonicsRound() {
  const item = nextQuestionDeckItem("phonics", phonicsBank);
  const builders = {
    initial: buildInitialSoundRound,
    final: buildFinalSoundRound,
    "short-vowel": buildShortVowelRound,
    rhyme: buildRhymeRound,
    "cvc-blend": buildCvcBlendRound,
    segment: buildSegmentRound,
    "case-match": buildCaseMatchRound,
    "letter-sound": buildLetterSoundRound,
    "alphabet-order": buildAlphabetOrderRound,
    "sight-word": buildSightWordRound
  };
  return (builders[item.type] || buildInitialSoundRound)(item);
}

function drawSimpleMeasureScene(kind, values, answerIndex) {
  const colours = ["#f29ec2", "#9ee0c8", "#c0a7e8"];
  if (kind === "height") {
    const people = values.map((height, index) => `<g transform="translate(${26 + index * 34} ${102 - height})"><circle cx="0" cy="0" r="8" fill="#fff7e8" stroke="#253041" stroke-width="3"/><path d="M-8 12 H8 L14 ${height} H-14 Z" fill="${colours[index]}" stroke="#253041" stroke-width="3"/></g>`).join("");
    return `<svg class="measure-svg" viewBox="0 0 120 120" aria-hidden="true">${people}<path d="M12 106 H108" stroke="#253041" stroke-width="4"/></svg>`;
  }
  if (kind === "weight") {
    const leftHeavy = values[0] > values[1];
    const leftBeamY = leftHeavy ? 52 : 40;
    const rightBeamY = leftHeavy ? 40 : 52;
    const leftPanY = leftHeavy ? 84 : 72;
    const rightPanY = leftHeavy ? 72 : 84;
    const gem = (cx, baseY, fill, heavy) => {
      const half = heavy ? 15 : 12;
      const top = baseY - (heavy ? 48 : 42);
      const middle = baseY - 24;
      return `
        <path d="M${cx} ${top} L${cx + half} ${middle} L${cx} ${baseY} L${cx - half} ${middle} Z" fill="${fill}"/>
        <path d="M${cx} ${top} L${cx + 6} ${middle} L${cx} ${baseY} L${cx - 6} ${middle} Z" fill="rgba(255,255,255,0.34)" stroke="none"/>
      `;
    };
    const pan = (cx, beamY, panY, fill, heavy) => `
      <path d="M${cx} ${beamY} V${panY}" fill="none"/>
      <path d="M${cx} ${beamY} L${cx - 18} ${panY} H${cx + 18} Z" fill="#fffaf0"/>
      <path d="M${cx - 18} ${panY} H${cx + 18}" fill="none"/>
      ${gem(cx, panY - 4, fill, heavy)}
    `;
    return `
      <svg class="measure-svg" viewBox="0 0 120 120" aria-hidden="true">
        <g stroke="#253041" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M60 26 V96 M46 96 H74" fill="none"/>
          <path d="M28 ${leftBeamY} L92 ${rightBeamY}" fill="none"/>
          <circle cx="60" cy="26" r="5" fill="#f0c463"/>
          ${pan(30, leftBeamY, leftPanY, "#f29ec2", leftHeavy)}
          ${pan(90, rightBeamY, rightPanY, "#c0a7e8", !leftHeavy)}
        </g>
      </svg>
    `;
  }
  if (kind === "capacity") {
    const cups = values.map((fill, index) => `<g transform="translate(${16 + index * 34} 18)"><path d="M0 0 H26 L22 82 H4 Z" fill="#fffaf0" stroke="#253041" stroke-width="4"/><rect x="4" y="${82 - fill}" width="18" height="${fill}" fill="${colours[index]}" opacity="0.8"/></g>`).join("");
    return `<svg class="measure-svg" viewBox="0 0 120 120" aria-hidden="true">${cups}</svg>`;
  }
  const bars = values.map((width, index) => `<rect x="18" y="${26 + index * 26}" width="${width}" height="14" rx="7" fill="${colours[index]}" stroke="#253041" stroke-width="4"/>`).join("");
  return `<svg class="measure-svg" viewBox="0 0 120 120" aria-hidden="true">${bars}</svg>`;
}

function drawMeasureChoiceIcon(label) {
  const lower = label.toLowerCase();
  const colourMap = {
    pink: "#f29ec2",
    green: "#9ee0c8",
    purple: "#c0a7e8"
  };
  const colourWord = lower.split(" ")[0];
  const colour = colourMap[colourWord] || "#f0c463";
  let markup = "";

  if (lower.includes("ribbon")) {
    markup = `<rect x="22" y="50" width="76" height="22" rx="11" fill="${colour}"/><path d="M32 61 H88" fill="none" opacity="0.35"/>`;
  } else if (lower.includes("jug")) {
    markup = `<path d="M36 24 H78 L72 96 H42 Z" fill="#fffaf0"/><rect x="42" y="52" width="30" height="38" fill="${colour}" opacity="0.85"/><path d="M78 42 H92 C106 42 106 70 78 70" fill="none"/>`;
  } else if (lower.includes("dress")) {
    markup = `<circle cx="60" cy="30" r="12" fill="#fff0d8"/><path d="M42 96 L50 48 H70 L78 96 Z" fill="${colour}"/><path d="M48 58 H72" fill="none" opacity="0.4"/>`;
  } else if (lower.includes("left gem") || lower.includes("right gem")) {
    const x = lower.includes("left") ? 44 : 76;
    markup = `<path d="M${x} 22 L${x + 26} 48 L${x} 96 L${x - 26} 48 Z" fill="${lower.includes("left") ? "#f29ec2" : "#c0a7e8"}"/><path d="M${x} 22 L${x + 10} 48 L${x} 96 L${x - 10} 48 Z" fill="rgba(255,255,255,0.34)" stroke="none"/>`;
  } else if (lower === "all the same" || lower === "both are the same") {
    markup = [34, 60, 86].map((x) => `<rect x="${x - 12}" y="50" width="24" height="24" rx="6" fill="#fffaf0"/>`).join("") + '<path d="M32 90 H88" fill="none"/>';
  } else {
    markup = '<path d="M34 48 Q60 24 86 48 M42 74 Q60 92 78 74" fill="none"/><circle cx="46" cy="60" r="4" fill="#253041" stroke="none"/><circle cx="74" cy="60" r="4" fill="#253041" stroke="none"/>';
  }

  return `
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <g stroke="#253041" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        ${markup}
      </g>
    </svg>
  `;
}

function makeVisualChoice(label, artHtml, correct = false) {
  return {
    type: "listen",
    label,
    correct,
    artHtml
  };
}

function buildCompareMeasureRound(item) {
  const kind = item.type;
  const labels = kind === "weight" ? ["left gem", "right gem"] : kind === "height" ? ["pink dress", "green dress", "purple dress"] : kind === "capacity" ? ["pink jug", "green jug", "purple jug"] : ["pink ribbon", "green ribbon", "purple ribbon"];
  const values = kind === "weight" ? shuffle([42, 82]) : shuffle([42, 62, 82]);
  const askSmall = item.offset % 4 === 0 && kind === "length";
  const answerValue = askSmall ? Math.min(...values) : Math.max(...values);
  const answerIndex = values.indexOf(answerValue);
  const optionLabels = kind === "weight"
    ? [...labels, "both are the same", "not enough clues"]
    : [...labels, "all the same"];
  return {
    game: "measure",
    level: kind,
    typeTag: `measure:${kind}`,
    answer: labels[answerIndex],
    key: item.id,
    prompt: kind === "length" ? (askSmall ? "Which is the shortest?" : "Which is the longest?") : kind === "height" ? "Who is the tallest?" : kind === "weight" ? "Which is heavier?" : "Which holds the most?",
    spoken: kind === "length" ? (askSmall ? "Which is the shortest?" : "Which is the longest?") : kind === "height" ? "Who is the tallest?" : kind === "weight" ? "Which is heavier?" : "Which holds the most?",
    hint: "Compare the sizes carefully.",
    targetHtml: `<div class="math-token measure-token">${drawSimpleMeasureScene(kind, values, answerIndex)}</div>`,
    options: shuffle(optionLabels.slice(0, 4).map((label) => makeVisualChoice(label, drawMeasureChoiceIcon(label), label === labels[answerIndex])))
  };
}

function renderPaperclipMeasure(count) {
  const clips = Array.from({ length: count }, () => '<span class="paperclip-unit" aria-hidden="true"></span>').join("");
  return `
    <div class="math-token measure-token">
      <div class="paperclip-measure" style="--clip-count:${count}; --measure-width:${count * 76}px">
        <div class="ribbon-measure" aria-hidden="true"></div>
        <div class="paperclip-row" aria-label="${count} paper clips">${clips}</div>
      </div>
    </div>
  `;
}

function renderTally(count) {
  let marks = "";
  for (let index = 1; index <= count; index += 1) {
    marks += `<span class="tally-mark${index % 5 === 0 ? " slash" : ""}"></span>`;
  }
  return `<div class="math-token measure-token"><div class="tally-row">${marks}</div></div>`;
}

function drawClockFace(hour, minutes = 0) {
  const minuteAngle = minutes === 30 ? 90 : -90;
  const hourAngle = ((hour % 12) * 30 - 90) + (minutes === 30 ? 15 : 0);
  const hand = (angle, length) => {
    const radians = (angle * Math.PI) / 180;
    return [60 + Math.cos(radians) * length, 60 + Math.sin(radians) * length];
  };
  const [mx, my] = hand(minuteAngle, 30);
  const [hx, hy] = hand(hourAngle, 22);
  return `<svg class="measure-svg" viewBox="0 0 120 120" aria-hidden="true"><g stroke="#253041" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><circle cx="60" cy="60" r="42" fill="#fffaf0"/><path d="M60 18 V25 M60 95 V102 M18 60 H25 M95 60 H102" fill="none" stroke-width="4"/><text x="60" y="40" text-anchor="middle" font-size="13" font-weight="900" fill="#253041" stroke="none">12</text><text x="88" y="65" text-anchor="middle" font-size="13" font-weight="900" fill="#253041" stroke="none">3</text><text x="60" y="89" text-anchor="middle" font-size="13" font-weight="900" fill="#253041" stroke="none">6</text><text x="32" y="65" text-anchor="middle" font-size="13" font-weight="900" fill="#253041" stroke="none">9</text><path d="M60 60 L${mx.toFixed(1)} ${my.toFixed(1)} M60 60 L${hx.toFixed(1)} ${hy.toFixed(1)}" fill="none"/><circle cx="60" cy="60" r="4" fill="#253041"/></g></svg>`;
}

function renderCoin(value) {
  const fill = value <= 2 ? "#d6a05f" : value <= 10 ? "#d8dce6" : "#f0c463";
  return `<span class="coin-token" style="background:${fill}">${value}p</span>`;
}

function drawWeatherIcon(kind) {
  const scenes = {
    sunny: drawSun("#ffd166"),
    rainy: `<svg viewBox="0 0 120 120" aria-hidden="true"><g stroke="#253041" stroke-width="6" stroke-linecap="round"><path d="M32 58 C34 34 66 30 76 48 C96 46 104 68 88 78 H34 C18 78 16 60 32 58 Z" fill="#d7e8ff"/><path d="M38 92 V102 M58 90 V104 M78 92 V102" fill="none" stroke="#118ab2"/></g></svg>`,
    cloudy: `<svg viewBox="0 0 120 120" aria-hidden="true"><g stroke="#253041" stroke-width="6" stroke-linecap="round"><path d="M32 68 C34 44 66 40 76 58 C96 56 104 78 88 88 H34 C18 88 16 70 32 68 Z" fill="#d7e8ff"/></g></svg>`,
    windy: `<svg viewBox="0 0 120 120" aria-hidden="true"><g stroke="#253041" stroke-width="6" stroke-linecap="round" fill="none"><path d="M22 42 H82 C96 42 96 26 82 26"/><path d="M14 62 H96"/><path d="M28 82 H78 C94 82 94 98 78 98"/></g></svg>`,
    snowy: `<svg viewBox="0 0 120 120" aria-hidden="true"><g stroke="#253041" stroke-width="5" stroke-linecap="round"><path d="M32 54 C34 34 66 30 76 48 C96 46 104 68 88 78 H34 C18 78 16 58 32 54 Z" fill="#d7e8ff"/><circle cx="38" cy="94" r="4" fill="#fff"/><circle cx="60" cy="98" r="4" fill="#fff"/><circle cx="82" cy="94" r="4" fill="#fff"/></g></svg>`
  };
  return scenes[kind] || scenes.sunny;
}

function drawGraphLabelIcon(label) {
  const lower = String(label).toLowerCase();
  if (lower === "crowns") {
    return `<svg viewBox="0 0 120 120" aria-hidden="true"><g stroke="#253041" stroke-width="6" stroke-linejoin="round"><path d="M28 86 L36 44 L52 66 L60 30 L68 66 L84 44 L92 86 Z" fill="#f0c463"/><path d="M28 86 H92 V96 H28 Z" fill="#ffd166"/><circle cx="60" cy="30" r="4" fill="#f29ec2"/></g></svg>`;
  }
  if (lower === "stars") return drawStar("#f0c463");
  if (lower === "flowers") return drawSimpleObjectIcon("flower");
  if (lower === "cakes") return drawCake();
  return drawGenericListenIcon();
}

function buildMeasureRound() {
  const item = nextQuestionDeckItem("measure", measureBank);
  if (["length", "height", "weight", "capacity"].includes(item.type)) return buildCompareMeasureRound(item);
  if (item.type === "non-standard") {
    const answer = 3 + (item.offset % 4);
    return { game: "measure", level: "non-standard", typeTag: "measure:non-standard", answer, key: item.id, prompt: "How many?", spoken: "How many?", hint: "Count the paper clips under the ribbon.", targetHtml: renderPaperclipMeasure(answer), options: makeNumberOptions(answer) };
  }
  if (item.type === "picture-graph") {
    const labels = ["crowns", "stars", "flowers", "cakes"];
    const answerIndex = item.offset % labels.length;
    const counts = labels.map((_, index) => index === answerIndex ? 5 : 1 + ((item.offset + index) % 3));
    const rows = labels.map((label, index) => `<div><strong>${label}</strong><span>${Array.from({ length: counts[index] }, () => '<i></i>').join("")}</span></div>`).join("");
    return { game: "measure", level: "picture-graph", typeTag: "measure:graph", answer: labels[answerIndex], key: item.id, prompt: "Which has the most?", spoken: "Which has the most?", hint: "Look for the longest row.", targetHtml: `<div class="math-token measure-token"><div class="picture-graph">${rows}</div></div>`, options: shuffle(labels.map((label, index) => makeVisualChoice(label, drawGraphLabelIcon(label), index === answerIndex))) };
  }
  if (item.type === "tally") {
    const answer = 3 + (item.offset % 8);
    return { game: "measure", level: "tally", typeTag: "measure:tally", answer, key: item.id, prompt: "How many?", spoken: "How many tally marks?", hint: "A crossed bundle means five.", targetHtml: renderTally(answer), options: makeNumberOptions(answer) };
  }
  if (item.type === "coin") {
    const coins = [1, 2, 5, 10, 20];
    const answer = coins[item.offset % coins.length];
    const values = [answer, ...shuffle(coins.filter((value) => value !== answer)).slice(0, 3)];
    return { game: "measure", level: "pence", typeTag: "measure:coin", answer, key: item.id, prompt: "How many pence?", spoken: "How many pence?", hint: "Read the number on the coin.", targetHtml: `<div class="math-token measure-token">${renderCoin(answer)}</div>`, options: shuffle(values.map((value) => ({ type: "math", value, label: String(value), correct: value === answer }))) };
  }
  if (item.type === "clock") {
    const hour = 1 + (item.offset % 11);
    const minutes = item.offset % 2 === 0 ? 0 : 30;
    const answer = minutes === 0 ? `${hour} o'clock` : `half past ${hour}`;
    const options = [answer, `${hour + 1} o'clock`, `half past ${hour + 1}`, `${Math.max(1, hour - 1)} o'clock`];
    return { game: "measure", level: "clock", typeTag: "measure:clock", answer, key: item.id, prompt: "What time is it?", spoken: "What time is it?", hint: "Look at the long minute hand first.", targetHtml: `<div class="math-token measure-token">${drawClockFace(hour, minutes)}</div>`, options: shuffle([...new Set(options)].slice(0, 4).map((label) => makeTextChoice(label, label === answer))) };
  }
  if (item.type === "day-order") {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const today = days[item.offset % days.length];
    const answer = days[(item.offset + 1) % days.length];
    return { game: "measure", level: "day-order", typeTag: "measure:day", answer, key: item.id, prompt: `Today is ${today}. What is tomorrow?`, spoken: `Today is ${today}. What is tomorrow?`, hint: "Say the days in order.", targetHtml: `<div class="math-token phonics-target"><span class="text-option-token">${today}</span></div>`, options: shuffle([answer, ...shuffle(days.filter((day) => day !== answer && day !== today)).slice(0, 3)].map((label) => makeTextChoice(label, label === answer))) };
  }
  const weather = ["sunny", "rainy", "cloudy", "windy", "snowy"];
  const answer = weather[item.offset % weather.length];
  return { game: "measure", level: "weather", typeTag: "measure:weather", answer, key: item.id, prompt: "What is the weather?", spoken: "What is the weather?", hint: "Look at the sky.", targetHtml: `<div class="math-token measure-token">${drawWeatherIcon(answer)}</div>`, options: shuffle([answer, ...shuffle(weather.filter((label) => label !== answer)).slice(0, 3)].map((label) => makeVisualChoice(label, drawWeatherIcon(label), label === answer))) };
}

const violinParts = ["violin", "bow", "string", "bridge", "tuning peg", "scroll", "fingerboard"];
const violinStrings = ["G", "D", "A", "E"];

function drawMusicIcon(label) {
  const lower = String(label).toLowerCase();
  let part = lower.replace(/^the\s+/, "");
  if (part === "tuning peg") part = "peg";
  const icons = {
    violin: `
      <path d="M55 20 C42 28 44 44 54 50 C40 58 36 82 54 92 C60 96 66 96 72 92 C90 82 86 58 72 50 C82 44 84 28 70 20 C64 16 60 26 62 40 C60 26 60 26 55 20 Z" fill="#d69f67"/>
      <path d="M62 16 V100 M54 20 C58 30 58 86 54 96 M70 20 C66 30 66 86 70 96" fill="none" stroke-width="3"/>
      <path d="M50 54 H74 M50 64 H74" fill="none" stroke-width="4"/>
      <circle cx="52" cy="72" r="5" fill="#253041" stroke="none"/>
      <circle cx="72" cy="72" r="5" fill="#253041" stroke="none"/>
    `,
    bow: `
      <path d="M24 96 L94 22" fill="none" stroke="#8a5a44" stroke-width="7"/>
      <path d="M32 98 C52 82 74 54 92 20" fill="none" stroke="#253041" stroke-width="2.5"/>
      <rect x="20" y="91" width="18" height="10" rx="3" fill="#253041"/>
    `,
    string: `
      <path d="M38 18 V102 M52 18 V102 M68 18 V102 M82 18 V102" fill="none" stroke-width="4"/>
      <path d="M28 28 H92 M28 92 H92" fill="none" stroke-width="5"/>
    `,
    bridge: `
      <path d="M34 94 C38 56 48 42 60 42 C72 42 82 56 86 94 Z" fill="#f0c463"/>
      <path d="M48 94 C48 70 72 70 72 94 M50 58 H70" fill="none" stroke-width="4"/>
    `,
    peg: `
      <path d="M60 24 V96" fill="none"/>
      <circle cx="44" cy="34" r="11" fill="#8a5a44"/>
      <circle cx="76" cy="46" r="11" fill="#8a5a44"/>
      <circle cx="44" cy="58" r="11" fill="#8a5a44"/>
      <circle cx="76" cy="70" r="11" fill="#8a5a44"/>
    `,
    scroll: `
      <path d="M68 30 C46 22 32 42 44 58 C56 74 84 66 78 48 C74 36 56 38 56 50 C56 58 66 60 70 54" fill="none" stroke-width="7"/>
      <path d="M60 66 V98" fill="none"/>
    `,
    fingerboard: `
      <path d="M54 18 H70 L78 100 H46 Z" fill="#253041"/>
      <path d="M58 20 V98 M66 20 V98" fill="none" stroke="#fffaf0" stroke-width="2.2" opacity="0.55"/>
    `
  };
  return `
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <g stroke="#253041" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        ${icons[part] || icons.violin}
      </g>
    </svg>
  `;
}

function renderViolinStringToken(highlight = null) {
  const rows = violinStrings.map((name, index) => {
    const guide = index === 0 ? "low" : index === violinStrings.length - 1 ? "high" : "";
    return `<span class="${name === highlight ? "active" : ""}" style="--string-width:${8 - index}px"><strong>${name}</strong><i></i><em>${guide}</em></span>`;
  }).join("");
  return `<div class="math-token music-token"><div class="string-guide">low sound to high sound</div><div class="violin-string-token">${rows}</div></div>`;
}

function renderRhythmToken(beats) {
  const notes = Array.from({ length: beats }, () => "<span aria-hidden=\"true\"></span>").join("");
  return `<div class="math-token music-token"><div class="rhythm-token">${notes}</div></div>`;
}

function makeMusicOption(label, correct = false) {
  return {
    type: "listen",
    label,
    correct,
    artHtml: violinParts.includes(String(label).toLowerCase()) ? drawMusicIcon(label) : drawGenericListenIcon()
  };
}

function buildMusicRound() {
  const item = nextQuestionDeckItem("music", musicBank);
  if (item.type === "part-picture") {
    const answer = violinParts[item.offset % violinParts.length];
    const options = [answer, ...shuffle(violinParts.filter((part) => part !== answer)).slice(0, 3)];
    return {
      game: "music",
      level: "violin-part",
      typeTag: "music:part-picture",
      answer,
      key: item.id,
      prompt: "Which violin part is this?",
      spoken: "Which violin part is this?",
      hint: "Look at the violin picture.",
      targetHtml: `<div class="math-token music-token">${drawMusicIcon(answer)}</div>`,
      options: shuffle(options.map((label) => makeTextChoice(label, label === answer)))
    };
  }
  if (item.type === "part-word") {
    const answer = violinParts[item.offset % violinParts.length];
    const options = [answer, ...shuffle(violinParts.filter((part) => part !== answer)).slice(0, 3)];
    return {
      game: "music",
      level: "violin-word",
      typeTag: "music:part-word",
      answer,
      key: item.id,
      prompt: "Tap the part you hear.",
      spoken: `Tap the ${answer}.`,
      hint: "Listen to the violin word.",
      targetHtml: phonicsAudioTarget("Listen for the violin part."),
      options: shuffle(options.map((label) => makeMusicOption(label, label === answer)))
    };
  }
  if (item.type === "string-count") {
    return {
      game: "music",
      level: "string-count",
      typeTag: "music:string-count",
      answer: 4,
      key: item.id,
      prompt: "How many strings does a violin have?",
      spoken: "How many strings does a violin have?",
      hint: "Count the long strings.",
      targetHtml: renderViolinStringToken(),
      options: makeNumberOptions(4)
    };
  }
  if (item.type === "string-sound") {
    const askHigh = item.offset % 2 === 0;
    const answer = askHigh ? "E" : "G";
    return {
      game: "music",
      level: "string-sound",
      typeTag: "music:string-sound",
      answer,
      key: item.id,
      prompt: askHigh ? "Which string is the highest?" : "Which string is the lowest?",
      spoken: askHigh ? "Which violin string has the highest sound?" : "Which violin string has the lowest sound?",
      hint: "Violin strings go from low G to high E.",
      targetHtml: renderViolinStringToken(),
      options: shuffle(violinStrings.map((name) => makeBigTextChoice(name, name === answer, "letter-option")))
    };
  }
  if (item.type === "string-name") {
    const answer = violinStrings[item.offset % violinStrings.length];
    return {
      game: "music",
      level: "string-name",
      typeTag: "music:string-name",
      answer,
      key: item.id,
      prompt: "Which string name is missing?",
      spoken: "The violin strings are G, D, A, E. Which string name is missing?",
      hint: "Say G, D, A, E in order.",
      targetHtml: `<div class="math-token music-token"><div class="phonics-letter-row">${violinStrings.map((name) => `<span>${name === answer ? "?" : name}</span>`).join("")}</div></div>`,
      options: shuffle(violinStrings.map((name) => makeBigTextChoice(name, name === answer, "letter-option")))
    };
  }
  if (item.type === "rhythm-count") {
    const answer = 2 + (item.offset % 4);
    return {
      game: "music",
      level: "rhythm-count",
      typeTag: "music:rhythm",
      answer,
      key: item.id,
      prompt: "How many sounds?",
      spoken: "How many rhythm sounds?",
      hint: "Tap each sound once.",
      targetHtml: renderRhythmToken(answer),
      options: makeNumberOptions(answer)
    };
  }
  const answer = "bow";
  return {
    game: "music",
    level: "bow-job",
    typeTag: "music:bow",
    answer,
    key: item.id,
    prompt: "What do you use to play the strings?",
    spoken: "What do you use to play the violin strings?",
    hint: "The bow moves on the strings.",
    targetHtml: `<div class="math-token music-token">${drawMusicIcon("violin")}</div>`,
    options: shuffle(["bow", "tuning peg", "scroll", "bridge"].map((label) => makeMusicOption(label, label === answer)))
  };
}

function buildRound() {
  const builders = {
    ketListen: buildKetListeningRound,
    englishSkills: buildEnglishSkillsRound,
    phonics: buildPhonicsRound,
    numberSense: buildNumberSenseRound,
    mathReasoning: buildMathReasoningRound,
    logicSpatial: buildLogicSpatialRound,
    measure: buildMeasureRound,
    music: buildMusicRound,
    words: buildWordRound,
    shapes: buildShapeRound,
    patterns: buildPatternRound,
    a2Listen: () => buildListeningRound("a2Listen"),
    b1Listen: () => buildListeningRound("b1Listen"),
    logic: buildLogicRound
  };
  state.challenge = (builders[state.activeGame] || buildKetListeningRound)();
  questionTagsForChallenge(state.challenge).forEach((tag) => rememberQuestionTag(state.activeGame, tag));
  state.options = state.challenge.options;
}

function renderStars() {
  nodes.stars.innerHTML = "";
  const gemPalette = ["#f29ec2", "#c0a7e8", "#f0c463", "#9ee0c8"];
  for (let index = 0; index < state.questionGoal; index += 1) {
    const slot = document.createElement("span");
    const result = state.roundResults[index];
    const filled = Boolean(result);
    const assisted = result === "assisted";
    slot.className = `star${filled ? " filled" : ""}${assisted ? " assisted" : ""}`;
    slot.title = filled ? (assisted ? "Practice gem" : "First-try gem") : "Empty gem";
    const fillColor = filled ? (assisted ? "#e5d8ef" : gemPalette[index % gemPalette.length]) : "transparent";
    const strokeColor = filled ? (assisted ? "rgba(74, 50, 88, 0.62)" : "rgba(74, 50, 88, 0.9)") : "rgba(74, 50, 88, 0.45)";
    slot.innerHTML = `
      <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">
        <path d="M16 3 L28 13 L16 29 L4 13 Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2" stroke-linejoin="round"/>
        ${filled && !assisted ? '<path d="M16 3 L21 13 L16 29 L11 13 Z" fill="rgba(255,255,255,0.42)"/><path d="M16 3 L28 13 L21 13 Z" fill="rgba(255,255,255,0.62)"/>' : ""}
      </svg>`;
    nodes.stars.append(slot);
  }
  nodes.progressText.textContent = `${state.correctCount} / ${state.questionGoal}`;
  nodes.scoreText.textContent = `Score ${state.score}`;
}

function choiceButtons() {
  if (typeof nodes.options?.querySelectorAll === "function") {
    return [...nodes.options.querySelectorAll(".choice")];
  }
  return [...(nodes.options?.children || [])].filter((child) => child.classList?.contains("choice"));
}

function clearChoiceUnlockTimer() {
  if (state.choiceUnlockTimer) {
    window.clearTimeout(state.choiceUnlockTimer);
    state.choiceUnlockTimer = null;
  }
}

function shouldKeepChoiceDisabled(button) {
  return button.classList.contains("wrong") || button.classList.contains("correct");
}

function setChoiceButtonsDisabled(disabled) {
  choiceButtons().forEach((button) => {
    button.disabled = disabled || shouldKeepChoiceDisabled(button);
  });
}

function answerDelayForChallenge() {
  if (state.activeGame === "ketListen") return answerDelayMs.listening;
  if (["englishSkills", "phonics", "music"].includes(state.activeGame)) return answerDelayMs.language;
  return answerDelayMs.thinking;
}

function scheduleAnswerReady(delay = answerDelayForChallenge()) {
  clearChoiceUnlockTimer();
  state.answerReady = false;
  setChoiceButtonsDisabled(true);
  state.choiceUnlockTimer = window.setTimeout(() => {
    state.choiceUnlockTimer = null;
    state.answerReady = true;
    if (!state.locked) setChoiceButtonsDisabled(false);
  }, delay);
}

function pauseForWrongReview() {
  clearChoiceUnlockTimer();
  state.locked = true;
  state.answerReady = false;
  setChoiceButtonsDisabled(true);
  const delay = state.wrongAttempts >= 3
    ? wrongReviewMs.final
    : state.wrongAttempts === 2
      ? wrongReviewMs.second
      : wrongReviewMs.first;

  state.choiceUnlockTimer = window.setTimeout(() => {
    state.choiceUnlockTimer = null;
    state.locked = false;
    state.answerReady = true;
    setChoiceButtonsDisabled(false);
  }, delay);
}

function setCompanionPaused(paused) {
  const companion = nodes.companion;
  if (!companion || companion.classList.contains("dragging")) return;
  if (!paused) companion.classList.add("walking");
  companion.classList.toggle("paused", paused);
}

function freezeCompanionForQuestion() {
  const companion = nodes.companion;
  if (!companion || companion.classList.contains("dragging")) return;
  companion.classList.remove("cheer-hop", "cheer-twirl", "cheer-hearts", "cheer-sparkle", "cheer-sad", "landing", "walking", "paused");
}

function resumeCompanionForFeedback() {
  setCompanionPaused(false);
}

function cheerCompanion() {
  const companion = nodes.companion;
  if (!companion) return;
  const variants = ["cheer-hop", "cheer-twirl", "cheer-hearts", "cheer-sparkle"];
  companion.classList.remove(...variants, "cheer-sad", "landing");
  void companion.offsetWidth;
  const variant = sample(variants);
  companion.classList.add(variant);
  window.setTimeout(() => companion.classList.remove(variant), 900);
}

function sadCompanion() {
  const companion = nodes.companion;
  if (!companion) return;
  companion.classList.remove("cheer-hop", "cheer-twirl", "cheer-hearts", "cheer-sparkle", "cheer-sad");
  void companion.offsetWidth;
  companion.classList.add("cheer-sad");
  window.setTimeout(() => companion.classList.remove("cheer-sad"), 360);
}

function settleCompanionAfterDrag() {
  const companion = nodes.companion;
  if (!companion) return;
  companion.classList.remove("landing");
  const isQuestionActive = !state.locked && nodes.celebration.hidden;
  companion.classList.toggle("walking", !isQuestionActive);
  companion.classList.toggle("paused", false);
}

function renderTarget() {
  const { answer, prompt, hint, targetHtml, game } = state.challenge;
  const wideTarget = state.challenge.wideTarget || game === "patterns";
  nodes.targetArea.classList.toggle("pattern-round", wideTarget);
  nodes.targetToken.classList.toggle("pattern-target", wideTarget);
  nodes.promptText.textContent = prompt;
  nodes.promptHint.textContent = hint;

  if (targetHtml) {
    nodes.targetToken.innerHTML = targetHtml;
  } else {
    nodes.targetToken.innerHTML = `
      <div class="word-token">
        <span class="word-sound" aria-hidden="true"></span>
        <span class="word-main">${answer.label}</span>
      </div>
    `;
  }

  nodes.targetToken.classList.remove("target-pop");
  void nodes.targetToken.offsetWidth;
  nodes.targetToken.classList.add("target-pop");
}

function showTeachingExplanation(challenge = state.challenge) {
  if (!challenge) return false;
  const text = challenge.explanation || finalHintFor(challenge);
  let shown = false;

  if (challenge.explanationHtml) {
    nodes.targetToken.innerHTML = challenge.explanationHtml;
    nodes.targetToken.classList.remove("target-pop");
    void nodes.targetToken.offsetWidth;
    nodes.targetToken.classList.add("target-pop");
    shown = true;
  }

  if (text) {
    nodes.promptHint.textContent = text;
    shown = true;
  }

  return shown;
}

function shouldShowCorrectExplanation() {
  const challenge = state.challenge;
  return Boolean(challenge && state.hadIncorrectThisRound && (challenge.explanation || challenge.explanationHtml));
}

function hintForWrongAttempt() {
  if (state.wrongAttempts <= 1) return firstHintFor(state.challenge);
  if (state.wrongAttempts === 2) return secondHintFor(state.challenge);
  return finalHintFor(state.challenge);
}

function renderRound() {
  clearChoiceUnlockTimer();
  buildRound();
  freezeCompanionForQuestion();
  state.locked = false;
  state.answerReady = false;
  state.wrongAttempts = 0;
  state.hadIncorrectThisRound = false;
  const modeTitle = modeTitles[state.activeGame] || "Learning";
  nodes.roundLabel.textContent = `${modeTitle} ${state.correctCount + 1} / ${state.questionGoal}`;
  const numberOnlyRound = ["numberSense", "mathReasoning"].includes(state.activeGame)
    && state.challenge.options?.every((option) => option.type === "math");
  nodes.feedback.textContent = state.challenge.kind === "sequence"
    ? "Tap the first picture."
    : numberOnlyRound
      ? "Pick the number."
      : "Pick the answer.";
  renderTarget();

  nodes.options.innerHTML = "";
  state.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.className = `choice${option.type === "math" ? " math-choice number-choice" : ""}${option.type === "group" ? " math-choice" : ""}${option.type === "listen" ? " listen-choice" : ""}${option.hideName ? " text-choice" : ""}`;
    button.type = "button";
    button.dataset.correct = String(option.correct);
    button.dataset.index = String(index);
    button.setAttribute("aria-label", option.spokenLabel || option.label);

    if (option.type === "math") {
      const number = document.createElement("span");
      number.className = "number-card";
      number.textContent = option.label;

      const name = document.createElement("span");
      name.className = "choice-name";
      name.textContent = option.label;

      button.append(number, name);
    } else if (option.type === "listen") {
      const art = document.createElement("span");
      art.className = "choice-art listen-art";
      art.innerHTML = option.artHtml;

      const name = document.createElement("span");
      name.className = "choice-name";
      name.textContent = option.label;

      if (option.hideName) {
        button.append(art);
      } else {
        button.append(art, name);
      }
    } else if (option.type === "group") {
      const art = document.createElement("span");
      art.innerHTML = option.artHtml;
      art.className = option.hideName ? "choice-art text-choice-art" : "";

      const name = document.createElement("span");
      name.className = "choice-name";
      name.textContent = option.label;

      if (option.hideName) {
        button.append(art);
      } else {
        button.append(art, name);
      }
    } else if (option.artHtml) {
      const art = document.createElement("span");
      art.className = "choice-art normal";
      art.innerHTML = option.artHtml;

      const name = document.createElement("span");
      name.className = "choice-name";
      name.textContent = option.label;

      button.append(art, name);
    } else {
      const art = document.createElement("span");
      art.className = `choice-art ${option.size.id}`;
      art.innerHTML = option.item.draw(option.colorHex);

      const name = document.createElement("span");
      name.className = "choice-name";
      name.textContent = option.label;

      button.append(art, name);
    }

    button.addEventListener("click", () => handleChoice(button, option));
    nodes.options.append(button);
  });

  renderStars();
  scheduleAnswerReady();
  speakPrompt(false);
}

function handleChoice(button, option) {
  if (state.locked || !state.answerReady || button.disabled) return;

  if (state.challenge.kind === "sequence") {
    handleSequenceChoice(button, option);
    return;
  }

  if (!option.correct) {
    if (!state.hadIncorrectThisRound) recordLearningResult(false);
    state.wrongAttempts += 1;
    state.hadIncorrectThisRound = true;
    button.classList.remove("wrong");
    void button.offsetWidth;
    button.classList.add("wrong");
    button.disabled = true;
    const hint = hintForWrongAttempt() || gentleHint(getCorrectLabel());
    nodes.feedback.textContent = hint;
    nodes.promptHint.textContent = hint;
    if (state.wrongAttempts >= 3) showTeachingExplanation();
    playTone([180, 140], 0.12, "sine");
    sadCompanion();
    pauseForWrongReview();
    speakPrompt(true);
    return;
  }

  if (!state.hadIncorrectThisRound) recordLearningResult(true);
  state.locked = true;
  state.answerReady = false;
  clearChoiceUnlockTimer();
  button.classList.add("correct");
  setChoiceButtonsDisabled(true);
  const helper = document.querySelector(".helper-character");
  if (helper) {
    helper.classList.remove("cheer");
    void helper.offsetWidth;
    helper.classList.add("cheer");
  }
  cheerCompanion();
  const cheer = pickFrom(PRINCESS_CHEERS);
  nodes.feedback.textContent = option.type === "math" ? `${option.label}! ${cheer}` : `${option.label}. ${cheer}`;
  playTone([523, 659, 784], 0.11, "triangle");
  const showedExplanation = shouldShowCorrectExplanation() ? showTeachingExplanation() : false;
  const explanationText = state.challenge.explanation || finalHintFor(state.challenge);
  const spokenFeedback = showedExplanation && explanationText
    ? `${spokenTextForOption(option)}. ${explanationText}`
    : spokenTextForOption(option);
  speakFeedbackThenAdvance(spokenFeedback, showedExplanation ? state.challenge.explanationMinimumMs || assistedExplanationMs : 850);
}

function refreshSequenceTarget() {
  const challenge = state.challenge;
  if (!challenge?.sequenceTarget || !Array.isArray(challenge.sequence)) return;
  nodes.targetToken.innerHTML = renderSequenceTarget(challenge.sequence, challenge.sequenceIndex);
  nodes.targetToken.classList.remove("target-pop");
  void nodes.targetToken.offsetWidth;
  nodes.targetToken.classList.add("target-pop");
}

function handleSequenceChoice(button, option) {
  if (state.locked || !state.answerReady || button.disabled) return;
  if (option.done) return;
  const expected = state.challenge.sequence[state.challenge.sequenceIndex];

  if (option.label !== expected) {
    if (!state.hadIncorrectThisRound) recordLearningResult(false);
    state.wrongAttempts += 1;
    state.hadIncorrectThisRound = true;
    button.classList.remove("wrong");
    void button.offsetWidth;
    button.classList.add("wrong");
    button.disabled = true;
    const sequenceHint = state.wrongAttempts >= 3
      ? `It is ${expected}. Tap ${expected} next.`
      : `Almost, princess. Tap ${expected} next.`;
    nodes.feedback.textContent = sequenceHint;
    nodes.promptHint.textContent = sequenceHint;
    playTone([180, 140], 0.12, "sine");
    sadCompanion();
    pauseForWrongReview();
    speakPrompt(true);
    return;
  }

  option.done = true;
  button.classList.add("correct");
  button.disabled = true;
  state.challenge.sequenceIndex += 1;
  refreshSequenceTarget();
  playTone([523, 659], 0.1, "triangle");

  if (state.challenge.sequenceIndex < state.challenge.sequence.length) {
    speakEnglish(spokenTextForOption(option));
    const nextStep = state.challenge.sequenceIndex + 1;
    nodes.feedback.textContent = `Good. Tap number ${nextStep}.`;
    nodes.promptHint.textContent = `Now tap picture ${nextStep}.`;
    return;
  }

  if (!state.hadIncorrectThisRound) recordLearningResult(true);
  state.locked = true;
  state.answerReady = false;
  clearChoiceUnlockTimer();
  setChoiceButtonsDisabled(true);
  cheerCompanion();
  nodes.feedback.textContent = `Beautifully done, princess!`;
  speakFeedbackThenAdvance(spokenTextForOption(option));
}

function speakFeedbackThenAdvance(text, minimumMs = 850) {
  const startedAt = Date.now();
  const words = String(text).trim().split(/\s+/).filter(Boolean).length;
  const fallbackMs = Math.max(1400, Math.min(6500, words * 650 + 1000));
  let finished = false;

  const advance = () => {
    if (finished) return;
    finished = true;
    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(0, minimumMs - elapsed);
    window.setTimeout(finishCorrectRound, remaining);
  };

  window.setTimeout(advance, fallbackMs);
  speakEnglish(text, advance);
}

function finishCorrectRound() {
  const firstTry = !state.hadIncorrectThisRound;
  const earnedPoints = scoreByWrongAttempts[Math.min(state.wrongAttempts, scoreByWrongAttempts.length - 1)];
  state.roundResults[state.correctCount] = firstTry ? "first" : "assisted";
  if (firstTry) state.firstTryCount += 1;
  state.score += earnedPoints;
  nodes.feedback.textContent = `${earnedPoints} points. Total score ${state.score}.`;
  state.correctCount += 1;
  renderStars();

  if (state.correctCount >= state.questionGoal) {
    showCelebration();
    state.locked = false;
    return;
  }

  state.round += 1;
  state.locked = false;
  renderRound();
}

function showCelebration() {
  clearChoiceUnlockTimer();
  nodes.celebration.hidden = false;
  state.locked = false;
  state.answerReady = false;
  resumeCompanionForFeedback();
  cheerCompanion();
  const cheer = pickFrom(PRINCESS_CELEBRATIONS);
  nodes.feedback.textContent = cheer;
  const winMessages = {
    ketListen: `You finished ${state.questionGoal} listening quests.`,
    englishSkills: `You completed ${state.questionGoal} English quests.`,
    phonics: `You completed ${state.questionGoal} phonics quests.`,
    numberSense: `You solved ${state.questionGoal} number quests.`,
    mathReasoning: `You solved ${state.questionGoal} maths quests.`,
    logicSpatial: `You solved ${state.questionGoal} shape quests.`,
    measure: `You solved ${state.questionGoal} measure quests.`,
    music: `You completed ${state.questionGoal} music quests.`
  };
  nodes.winTitle.textContent = state.firstTryCount === state.questionGoal
    ? "Perfect quest, princess!"
    : "Quest complete, princess!";
  nodes.winText.textContent = `${winMessages[state.activeGame] || `You finished ${state.questionGoal} quests.`} Score: ${state.score} / ${state.questionGoal * 10}. First-try gems: ${state.firstTryCount} / ${state.questionGoal}.`;
  playTone([523, 659, 784, 1046], 0.13, "triangle");
  speakEnglish(cheer);
  window.setTimeout(() => nodes.playAgainButton.focus(), 120);
}

function setMode(mode) {
  if (state.activeGame === mode && !nodes.celebration.hidden) {
    restartGame();
    return;
  }

  state.activeGame = mode;
  nodes.modeButtons.forEach((button) => {
    const active = button.dataset.mode === mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  restartGame();
  cheerCompanion();
  window.setTimeout(freezeCompanionForQuestion, 560);
}

function setQuestionGoal(goal) {
  state.questionGoal = goal;
  nodes.roundButtons.forEach((button) => {
    const active = Number(button.dataset.goal) === goal;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  restartGame();
}

function restartGame() {
  clearChoiceUnlockTimer();
  stopSpeechAudio();
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  resetAllDecks();
  trimRecentTagsAcrossModes(5);
  state.correctCount = 0;
  state.score = 0;
  state.firstTryCount = 0;
  state.roundResults = [];
  state.round = 0;
  state.locked = false;
  state.answerReady = false;
  state.streak = 0;
  state.mathStage = startingMathStage;
  state.challenge = null;
  nodes.celebration.hidden = true;
  renderRound();
}

function chooseGame() {
  clearChoiceUnlockTimer();
  stopSpeechAudio();
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  resetAllDecks();
  trimRecentTagsAcrossModes(5);
  state.correctCount = 0;
  state.score = 0;
  state.firstTryCount = 0;
  state.roundResults = [];
  state.round = 0;
  state.locked = false;
  state.answerReady = false;
  state.streak = 0;
  state.mathStage = startingMathStage;
  state.challenge = null;
  nodes.celebration.hidden = true;
  renderRound();
  const activeModeButton = [...nodes.modeButtons].find((button) => button.dataset.mode === state.activeGame);
  activeModeButton?.focus();
}

function ensureAudio() {
  if (!audioContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    audioContext = new AudioContext();
  }
  return audioContext;
}

function playTone(notes, length, type) {
  if (!state.soundOn) return;
  const context = ensureAudio();
  if (!context) return;

  notes.forEach((frequency, index) => {
    const start = context.currentTime + index * length;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.13, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + length);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + length + 0.02);
  });
}

function stopSpeechAudio() {
  speechRunId += 1;
  if (currentSpeechAudio) {
    currentSpeechAudio.pause();
    currentSpeechAudio.currentTime = 0;
    currentSpeechAudio = null;
  }
}

function soundIconMarkup(isOn) {
  if (!isOn) {
    return `
      <svg viewBox="0 0 32 32">
        <path d="M4 13 H10 L18 7 V25 L10 19 H4 Z" fill="currentColor" stroke="none"/>
        <path d="M23 12 L29 20 M29 12 L23 20" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      </svg>
    `;
  }

  return `
    <svg viewBox="0 0 32 32">
      <path d="M4 13 H10 L18 7 V25 L10 19 H4 Z" fill="currentColor" stroke="none"/>
      <path d="M22 12 C24 14 24 18 22 20 M25 8 C29 12 29 20 25 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/>
    </svg>
  `;
}

function audioKeyForText(text) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function speechTextForTts(text) {
  return String(text)
    .replace(/\s+/g, " ")
    .replace(/\b(Narrator|Question|Girl|Boy|Mum|Dad|Woman|Man|Teacher|Child|Emma|Tom|Mia|Ben|Anna|Jack|Lucy|Sam|Leo|Zoe|Amy|Maya|Noah|Lily|Alex|Ella|Sara|Max|Oliver)\s*:\s*/g, "")
    .replace(/\b([A-Z][a-z]+|Mum|Dad|Grandma)\s+says,\s+/g, "$1 says: ")
    .replace(/\b(She|He)\s+says,\s+/g, "$1 says: ")
    .replace(/\. (What|Which|When|Where|Why|How)\b/g, ". ... $1")
    .replace(/\? ([A-Z])/g, "? ... $1")
    .trim();
}

function playRecordedAudio(text, formats = window.yoyoAudioFormats || ["mp3"], onEnd, onUnavailable) {
  if (!formats.length) return false;
  const [format, ...remainingFormats] = formats;
  const recordedAudio = new Audio(`audio/${audioKeyForText(text)}.${format}`);
  recordedAudio.playbackRate = recordedAudioPlaybackRate;
  currentSpeechAudio = recordedAudio;

  const tryNextFormat = () => {
    if (currentSpeechAudio !== recordedAudio) return;
    recordedAudio.pause();
    recordedAudio.currentTime = 0;
    currentSpeechAudio = null;
    if (!playRecordedAudio(text, remainingFormats, onEnd, onUnavailable)) {
      onUnavailable?.();
    }
  };

  recordedAudio.addEventListener("ended", () => {
    if (currentSpeechAudio === recordedAudio) {
      currentSpeechAudio = null;
      onEnd?.();
    }
  }, { once: true });
  recordedAudio.addEventListener("error", tryNextFormat, { once: true });

  const playResult = recordedAudio.play();
  if (playResult?.catch) {
    playResult.catch(tryNextFormat);
  }

  return true;
}

function speakSingleText(text, runId, onEnd) {
  if (!state.soundOn || runId !== speechRunId) return;
  const finishWithoutAudio = () => {
    if (runId === speechRunId) onEnd?.();
  };
  if (!playRecordedAudio(text, window.yoyoAudioFormats || ["mp3"], () => {
    if (runId === speechRunId) onEnd?.();
  }, finishWithoutAudio)) {
    finishWithoutAudio();
  }
}

function speakEnglish(text, onEnd) {
  if (!state.soundOn) {
    onEnd?.();
    return;
  }
  stopSpeechAudio();
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  const runId = ++speechRunId;
  speakSingleText(text, runId, onEnd);
}

function speakSpeechItems(items) {
  if (!state.soundOn) return;
  stopSpeechAudio();
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  const runId = ++speechRunId;
  const queue = items.filter(Boolean);
  const playNext = () => {
    if (runId !== speechRunId || !queue.length) return;
    speakSingleText(queue.shift(), runId, playNext);
  };
  playNext();
}

function speakPrompt(force) {
  if (!force && !state.soundOn) return;
  speakSpeechItems(state.challenge.speechSegments || [state.challenge.spoken]);
}

function setupCompanion() {
  const companion = nodes.companion;
  if (!companion) return;

  let dragging = false;
  const offset = { x: 0, y: 0 };
  companion.classList.add("walking", "paused");

  companion.addEventListener("pointerdown", (event) => {
    dragging = true;
    if (companion.setPointerCapture) {
      companion.setPointerCapture(event.pointerId);
    }
    companion.classList.remove("walking", "paused", "cheer-hop", "cheer-twirl", "cheer-hearts", "cheer-sparkle", "cheer-sad", "landing");
    companion.classList.add("dragging");
    const rect = companion.getBoundingClientRect();
    offset.x = event.clientX - rect.left;
    offset.y = event.clientY - rect.top;
    event.preventDefault();
    event.stopPropagation();
  });

  companion.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const nextLeft = Math.max(8, Math.min(window.innerWidth - companion.offsetWidth - 8, event.clientX - offset.x));
    const nextTop = Math.max(8, Math.min(window.innerHeight - companion.offsetHeight - 8, event.clientY - offset.y));
    companion.style.left = `${nextLeft}px`;
    companion.style.top = `${nextTop}px`;
    companion.style.bottom = "auto";
  });

  const release = () => {
    if (!dragging) return;
    dragging = false;
    companion.classList.remove("dragging");
    companion.classList.add("landing");
    window.setTimeout(settleCompanionAfterDrag, 320);
  };

  companion.addEventListener("pointerup", release);
  companion.addEventListener("pointercancel", release);
}

function toggleSound() {
  state.soundOn = !state.soundOn;
  nodes.soundToggle.setAttribute("aria-pressed", String(state.soundOn));
  nodes.soundIcon.innerHTML = soundIconMarkup(state.soundOn);
  if (!state.soundOn && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  if (!state.soundOn) {
    stopSpeechAudio();
  }
  if (state.soundOn) {
    playTone([523, 659], 0.1, "triangle");
    speakPrompt(true);
  }
}

function showPwaStatus(message, autoHide = true) {
  if (!nodes.pwaStatus) return;
  nodes.pwaStatus.textContent = message;
  nodes.pwaStatus.hidden = false;
  if (autoHide) {
    window.clearTimeout(showPwaStatus.hideTimer);
    showPwaStatus.hideTimer = window.setTimeout(() => {
      nodes.pwaStatus.hidden = true;
    }, 5200);
  }
}

async function setupOfflineApp() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  if (window.location.protocol === "file:") return;

  try {
    const registration = await navigator.serviceWorker.register("service-worker.js");
    const worker = registration.active || registration.waiting || registration.installing;
    const sendCacheRequest = () => {
      const target = registration.active || navigator.serviceWorker.controller || worker;
      if (target) {
        showPwaStatus("Checking offline audio...", false);
        target.postMessage({ type: "CACHE_AUDIO" });
      }
    };

    navigator.serviceWorker.addEventListener("message", (event) => {
      const data = event.data || {};
      if (data.type === "OFFLINE_PROGRESS") {
        const action = data.downloaded > 0 ? "Saving offline audio" : "Checking offline audio";
        showPwaStatus(`${action}... ${data.done}/${data.total}`, false);
      } else if (data.type === "OFFLINE_READY") {
        showPwaStatus(data.downloaded > 0 ? "Offline ready for iPad." : "Offline audio already ready.", true);
      } else if (data.type === "OFFLINE_ERROR") {
        showPwaStatus("Offline cache paused. Open online again to finish.", true);
      }
    });

    if (registration.active || navigator.serviceWorker.controller) {
      sendCacheRequest();
    } else if (worker) {
      worker.addEventListener("statechange", () => {
        if (worker.state === "activated") sendCacheRequest();
      });
    }
  } catch (error) {
    showPwaStatus("Offline install is not available here.", true);
  }
}

nodes.playAgainButton.addEventListener("click", restartGame);
nodes.chooseGameButton.addEventListener("click", chooseGame);
nodes.restartButton.addEventListener("click", restartGame);
nodes.soundToggle.addEventListener("click", toggleSound);
nodes.speakButton.addEventListener("click", () => speakPrompt(true));
nodes.modeButtons.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});
nodes.roundButtons.forEach((button) => {
  button.addEventListener("click", () => setQuestionGoal(Number(button.dataset.goal)));
});

nodes.soundIcon.innerHTML = soundIconMarkup(state.soundOn);
setupCompanion();
renderRound();
setupOfflineApp();
