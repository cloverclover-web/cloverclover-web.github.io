import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");
const gamePath = resolve(projectRoot, "game.js");
const audioDir = resolve(projectRoot, "audio");
const provider = process.env.YOYO_TTS_PROVIDER || "doubao";
const force = process.env.YOYO_FORCE === "1";
const limit = Number(process.env.YOYO_LIMIT || "0");
const matchPattern = process.env.YOYO_MATCH ? new RegExp(process.env.YOYO_MATCH) : null;
const audioScope = process.env.YOYO_AUDIO_SCOPE || "all";
const maxRetries = Number(process.env.YOYO_MAX_RETRIES || (provider === "gemini" ? "4" : provider === "doubao" ? "3" : "2"));
const requestDelayMs = Number(process.env.YOYO_REQUEST_DELAY_MS || (provider === "gemini" ? "900" : provider === "doubao" ? "300" : "0"));
const maxFailures = Number(process.env.YOYO_MAX_FAILURES || "20");
const openAiModel = process.env.YOYO_OPENAI_MODEL || "gpt-4o-mini-tts";
const openAiVoice = process.env.YOYO_OPENAI_VOICE || "marin";
const geminiModel = process.env.YOYO_GEMINI_MODEL || "gemini-2.5-flash-preview-tts";
const geminiVoice = process.env.YOYO_GEMINI_VOICE || "Achird";
const doubaoApiKey = cleanSecret(process.env.DOUBAO_API_KEY || process.env.VOLCENGINE_API_KEY);
const doubaoAppId = cleanSecret(process.env.DOUBAO_APP_ID);
const doubaoAccessToken = cleanSecret(process.env.DOUBAO_ACCESS_TOKEN);
const doubaoCluster = process.env.DOUBAO_CLUSTER || "volcano_tts";
const doubaoVoice = process.env.DOUBAO_VOICE_TYPE || "BV040_streaming";
const doubaoV3Endpoint = process.env.DOUBAO_TTS_ENDPOINT || "https://openspeech.bytedance.com/api/v3/tts/unidirectional/sse";
const doubaoResourceId = process.env.DOUBAO_RESOURCE_ID || "seed-tts-2.0";
const doubaoVoiceMix = cleanSecret(process.env.DOUBAO_VOICE_MIX);
const doubaoSpeakers = (process.env.DOUBAO_SPEAKERS || process.env.DOUBAO_SPEAKER || "en_female_dacey_uranus_bigtts")
  .split(",")
  .map(cleanSecret)
  .filter(Boolean);
const doubaoSpeechRate = Number(process.env.DOUBAO_SPEECH_RATE || "-4");
const doubaoLoudnessRate = Number(process.env.DOUBAO_LOUDNESS_RATE || "0");
const doubaoVoiceProfiles = parseDoubaoVoiceProfiles();
const openAiInstructions = process.env.YOYO_OPENAI_INSTRUCTIONS || [
  "Speak in warm, natural British English for a young child.",
  "Do not read in a flat or robotic tone.",
  "Use varied intonation, gentle energy, and natural pauses.",
  "Lift the intonation on questions.",
  "Put light emphasis on the key answer words, colours, numbers, and shapes.",
  "For short dialogues, use subtle tone changes for each speaker, like a friendly teacher reading a story.",
  "Keep the delivery clear, calm, and not theatrical."
].join(" ");
const geminiInstructions = process.env.YOYO_GEMINI_INSTRUCTIONS || [
  "# AUDIO PROFILE: Friendly British English teacher",
  "The speaker is a warm, expressive primary-school teacher from southern England.",
  "The listener is a bright young child learning English through games.",
  "### DIRECTOR'S NOTES",
  "Accent: natural British English, clear but not exaggerated.",
  "Style: friendly, lively, and conversational. The voice should smile naturally.",
  "Pacing: varied, with small pauses before questions and important answer words.",
  "Delivery: avoid a flat reading voice. Use natural rises and falls, especially in questions.",
  "Keep the audio focused and not theatrical.",
  "### TRANSCRIPT"
].join("\n");

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

function cleanSecret(value) {
  return String(value || "")
    .trim()
    .replace(/^[\s"'‘’“”]+|[\s"'‘’“”]+$/g, "");
}

function shouldSkipTtsText(text) {
  const clean = String(text || "").trim();
  if (!clean) return true;
  if (/^[<>=+\-×÷?]+$/.test(clean)) return true;
  return false;
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

function shortErrorMessage(error) {
  return String(error?.message || error).replace(/\s+/g, " ").slice(0, 280);
}

function outputExtensionForProvider() {
  if (provider === "openai" || provider === "doubao") return "mp3";
  if (provider === "gemini") return "wav";
  throw new Error("YOYO_TTS_PROVIDER must be openai, gemini, or doubao.");
}

function formatConfigForProvider() {
  if (provider === "gemini") return ["wav"];
  return ["mp3"];
}

async function loadGameData() {
  const gameSource = await readFile(gamePath, "utf8");
  const dataSource = gameSource.slice(0, gameSource.indexOf("const defaultQuestionGoal"));
  const drawNames = [
    "drawApple",
    "drawBanana",
    "drawCat",
    "drawDog",
    "drawFish",
    "drawCar",
    "drawBall",
    "drawSun",
    "drawStar",
    "drawTree"
  ];
  const drawStubs = drawNames.map((name) => `function ${name}() { return ""; }`).join("\n");
  return vm.runInNewContext(`
    (() => {
      ${drawStubs}
      ${dataSource}
      return { vocabulary, colorWords, sizeWords, shapeSet, a2ListeningBank, ketListeningBank, b1ListeningBank, englishSkillBank, numberSenseBank, mathReasoningBank, logicSpatialBank, phonicsWords, sightWords, musicBank };
    })()
  `);
}

function dialogueSegmentsFromScript(script) {
  const speakerPattern = /\b(Girl|Boy|Mum|Dad|Woman|Man|Teacher|Child|Emma|Tom|Mia|Ben|Anna|Jack|Lucy|Sam|Leo|Zoe|Amy|Maya|Noah|Lily|Alex|Ella|Sara|Max|Oliver)\s*:\s*/g;
  const source = String(script);
  const matches = [...source.matchAll(speakerPattern)];

  if (matches.length < 2) {
    return [{ speaker: "Narrator", text: source }];
  }

  return matches.map((match, index) => {
    const next = matches[index + 1];
    return {
      speaker: match[1],
      text: source.slice(match.index + match[0].length, next?.index ?? source.length).trim()
    };
  }).filter((segment) => segment.text);
}

function speechSegmentText(segment) {
  return `${segment.speaker}: ${segment.text}`;
}

function listeningSpeechTexts(item) {
  return [
    ...dialogueSegmentsFromScript(item.script).map(speechSegmentText),
    speechSegmentText({ speaker: "Question", text: item.question })
  ];
}

function collectTexts(data) {
  const texts = new Set([
    "Great job!",
    "What comes next?",
    "Which one is different?",
    "Which has more?",
    "Which has fewer?",
    "Which one has the same shape?",
    "Which one has the same colour?",
    "Complete the rule.",
    "How many?"
  ]);
  const add = (text) => {
    const clean = String(text).trim();
    if (!shouldSkipTtsText(clean)) texts.add(clean);
  };
  const addPrompt = (label) => add(`Find the ${label}.`);

  data.vocabulary.forEach((item) => {
    add(item.word);
    addPrompt(item.word);
  });

  [
    "mum", "dad", "sister", "brother", "baby", "grandma", "grandpa",
    "head", "hand", "foot", "eye", "ear", "nose", "mouth",
    "bread", "rice", "milk", "juice", "ice cream",
    "cow", "pig", "horse", "sheep", "lion", "monkey",
    "hat", "coat", "raincoat", "shoes", "dress", "shirt", "socks", "scarf",
    "doll", "kite", "teddy bear", "drum",
    "kitchen", "bathroom", "bedroom", "living room", "garden", "school",
    "tree", "flower", "grass", "sky", "star", "moon", "sun"
  ].forEach(add);

  const colorableItems = data.vocabulary.filter((item) => item.colorable);
  colorableItems.forEach((item) => {
    data.colorWords.forEach((color) => {
      const colorLabel = `${color.word} ${item.word}`;
      add(colorLabel);
      addPrompt(colorLabel);
      data.sizeWords.forEach((size) => {
        const sizedLabel = `${size.word} ${colorLabel}`;
        add(sizedLabel);
        addPrompt(sizedLabel);
      });
    });
  });

  data.shapeSet.forEach((shape) => {
    add(shape.word);
    addPrompt(shape.word);
    data.colorWords.forEach((color) => {
      const label = `${color.word} ${shape.word}`;
      add(label);
      addPrompt(label);
    });
  });

  [...data.a2ListeningBank, ...data.ketListeningBank, ...data.b1ListeningBank].forEach((item) => {
    add(`${item.script} ${item.question}`);
    listeningSpeechTexts(item).forEach(add);
    add(item.question);
    item.choices.forEach(add);
  });

  data.englishSkillBank.forEach((item) => {
    add(item.spoken);
    add(item.text);
    add(item.prompt);
    item.choices.forEach(add);
  });

  data.numberSenseBank.forEach((item) => {
    if (item.type === "subitise") add("How many do you see?");
    if (item.type === "make-ten") add(`There are ${item.filled}. How many more make ten?`);
    if (item.type === "number-bond") add(`What number goes with ${item.part} to make ${item.whole}?`);
    if (item.type === "one-more") add(`What is one more than ${item.number}?`);
    if (item.type === "one-less") add(`What is one less than ${item.number}?`);
    if (item.type === "count-on") add(`Count forward from ${item.start}. What number is missing?`);
    if (item.type === "odd-even") add(`Is ${item.count} odd or even?`);
    if (item.type === "skip-count") add(`Count by ${item.step}s. What comes next?`);
    if (item.type === "place-value") {
      const tens = Math.floor(item.number / 10);
      const ones = item.number % 10;
      const tenText = tens === 1 ? "ten" : "tens";
      const oneText = ones === 1 ? "one" : "ones";
      add(`${item.number}. How many tens and ones?`);
      add(`${tens} ${tenText}, ${ones} ${oneText}`);
    }
    if (item.type === "compare-two-digit") add("Which number is bigger?");
    if (item.type === "bond-ways") add(`Which two numbers make ${item.whole}?`);
    if (item.type === "ordinal") add(`Which one is number ${item.target}?`);
  });

  data.mathReasoningBank.forEach((item) => {
    if (item.type === "add") add(`What is ${item.left} plus ${item.right}?`);
    if (item.type === "subtract") add(`What is ${item.left} minus ${item.right}?`);
    if (item.type === "missing-addend") add(`${item.left} plus what equals ${item.whole}?`);
    if (item.type === "three-addend") add(`What is ${item.first} plus ${item.second} plus ${item.third}?`);
    if (item.type === "doubles") add(`Double ${item.number}.`);
    if (item.type === "halves") add(`Half of ${item.whole} is what?`);
    if (item.type === "compare-symbol") {
      add(`Which sign goes between ${item.left} and ${item.right}?`);
      add("greater than");
      add("less than");
      add("equals");
    }
    if (item.type === "fraction") add("How much is pink?");
    if (item.type === "balance") add(`What number balances the scale? ${item.left} plus what equals ${item.total}?`);
    if (item.type === "two-step") add(`Mia has ${item.start} stars. She gets ${item.add} more, then gives away ${item.take}. How many stars are left?`);
    if (item.type === "array") add(`There are ${item.rows} rows with ${item.cols} in each row. How many are there?`);
  });

  data.logicSpatialBank.forEach((item) => {
    if (item.type === "pattern") add("What comes next?");
    if (item.type === "odd") add("Which one is different?");
    if (item.type === "same") {
      add("Which one has the same shape?");
      add("Which one has the same colour?");
    }
    if (item.type === "analogy") add("Complete the rule.");
    if (item.type === "compose") {
      [
        "Two equal triangles can make which shape?",
        "Two squares side by side can make which shape?",
        "Which flat shape is on the face of a cube?",
        "Which flat shape is on the side face of a pyramid?",
        "Which flat shape is on the top of a cylinder?",
        "Which solid rolls every way?"
      ].forEach(add);
    }
  });

  (data.musicBank || []).forEach((item) => {
    if (item.type === "part-picture") add("Which violin part is this?");
    if (item.type === "part-word") {
      ["violin", "bow", "string", "bridge", "tuning peg", "scroll", "fingerboard"].forEach((part) => add(`Tap the ${part}.`));
    }
    if (item.type === "string-count") add("How many strings does a violin have?");
    if (item.type === "string-sound") {
      add("Which violin string has the highest sound?");
      add("Which violin string has the lowest sound?");
    }
    if (item.type === "string-name") add("The violin strings are G, D, A, E. Which string name is missing?");
    if (item.type === "rhythm-count") add("How many rhythm sounds?");
    if (item.type === "bow-job") add("What do you use to play the violin strings?");
  });

  [
    "violin",
    "bow",
    "string",
    "bridge",
    "tuning peg",
    "scroll",
    "fingerboard",
    "G",
    "D",
    "A",
    "E"
  ].forEach(add);

  [
    "Listen and get ready. First, put on the blue hat. Then take the yellow coat. Last, pick up the green bag. Tap the pictures in order.",
    "After school, Ben must buy bread first. Then he can go to the park. After that, he will visit Grandma. Tap the pictures in order.",
    "For the party table, put the apple down first. Put the cake next. Put the banana down last. Tap the pictures in order.",
    "The play is on Friday. The picnic is on Saturday. The swimming lesson is on Sunday. Tap the pictures in order.",
    "First, return the book at the library. Then meet Dad at the cafe. After that, walk to the park. Tap the pictures in order.",
    "Mia goes to school first. After school she goes to the shop. Last, she helps in the kitchen. Tap the pictures in order.",
    "Put on the red shoes first. Then find the blue hat. Finally, carry the green bag. Tap the pictures in order.",
    "After lunch, play football first. Then read a book quietly. In the evening, watch a film. Tap the pictures in order.",
    "Narrator: Listen and get ready. First, put on the blue hat. Then take the yellow coat. Last, pick up the green bag.",
    "Question: Tap the pictures in order.",
    "Narrator: After school, Ben must buy bread first. Then he can go to the park. After that, he will visit Grandma.",
    "Narrator: For the party table, put the apple down first. Put the cake next. Put the banana down last.",
    "Narrator: The play is on Friday. The picnic is on Saturday. The swimming lesson is on Sunday.",
    "Narrator: First, return the book at the library. Then meet Dad at the cafe. After that, walk to the park.",
    "Narrator: Mia goes to school first. After school she goes to the shop. Last, she helps in the kitchen.",
    "Narrator: Put on the red shoes first. Then find the blue hat. Finally, carry the green bag.",
    "Narrator: After lunch, play football first. Then read a book quietly. In the evening, watch a film.",
    "How many do you see?",
    "How many more make ten?",
    "Balance the scale.",
    "What number balances the scale?",
    "How many stars are left?",
    "How many rhythm sounds?",
    "Two equal triangles can make which shape?",
    "Two squares side by side can make which shape?",
    "Which flat shape is on the face of a cube?",
    "Where is the ball?",
    "Which word fits?",
    "on the box",
    "under the box",
    "next to the box",
    "behind the box",
    "The ball is on the box.",
    "The ball is under the box.",
    "The ball is next to the box.",
    "The ball is behind the box.",
    "The ball is on the box. Where is the ball?",
    "The ball is under the box. Where is the ball?",
    "The ball is next to the box. Where is the ball?",
    "The ball is behind the box. Where is the ball?",
    "It has a point at the top and flat faces. Which word fits?",
    "It has two circles and one curved side. Which word fits?",
    "It has four sides. Two are long and two are short. Which word fits?",
    "It has one circle and one point. Which word fits?"
  ].forEach(add);

  for (let number = 0; number <= 10; number += 1) {
    add(String(number));
    add(`${number}.`);
  }

  for (let number = 11; number <= 60; number += 1) {
    const tens = Math.floor(number / 10);
    const ones = number % 10;
    const tenText = tens === 1 ? "ten" : "tens";
    const oneText = ones === 1 ? "one" : "ones";
    add(`${number}. How many tens and ones?`);
    add(`${tens} ${tenText}, ${ones} ${oneText}`);
  }

  for (let number = 1; number <= 7; number += 1) {
    add(`What is one more than ${number}?`);
  }

  for (let number = 1; number <= 5; number += 1) {
    add(`Which has two more than ${number}?`);
  }

  for (let number = 3; number <= 7; number += 1) {
    add(`Which has two fewer than ${number}?`);
  }

  for (let number = 2; number <= 8; number += 1) {
    add(`What is one less than ${number}?`);
  }

  for (let filled = 4; filled <= 8; filled += 1) {
    add(`There are ${filled}. How many more make ten?`);
  }

  for (let whole = 5; whole <= 10; whole += 1) {
    for (let part = 1; part < whole; part += 1) {
      add(`What number goes with ${part} to make ${whole}?`);
    }
  }

  for (let left = 1; left <= 4; left += 1) {
    for (let right = 1; right <= 4; right += 1) {
      if (left + right <= 8) add(`What is ${left} plus ${right}?`);
    }
  }

  for (let left = 4; left <= 8; left += 1) {
    for (let right = 1; right <= Math.min(4, left - 1); right += 1) {
      add(`What is ${left} minus ${right}?`);
    }
  }

  for (let total = 6; total <= 10; total += 1) {
    for (let left = 2; left <= total - 2; left += 1) {
      add(`What number balances the scale? ${left} plus what equals ${total}?`);
    }
  }

  for (let start = 2; start <= 6; start += 1) {
    for (let plus = 1; plus <= 3; plus += 1) {
      for (let take = 1; take <= Math.min(3, start + plus - 1); take += 1) {
        add(`Mia has ${start} stars. She gets ${plus} more, then gives away ${take}. How many stars are left?`);
      }
    }
  }

  return [...texts].sort((left, right) => left.localeCompare(right));
}

function collectKetListeningTexts(data) {
  const texts = new Set();
  const add = (text) => {
    const clean = String(text || "").trim();
    if (!shouldSkipTtsText(clean)) texts.add(clean);
  };

  data.ketListeningBank.forEach((item) => {
    add(`${item.script} ${item.question}`);
    listeningSpeechTexts(item).forEach(add);
    add(item.question);
    item.choices.forEach(add);
  });

  const sequenceTasks = [
    {
      sequence: ["blue hat", "yellow coat", "green bag"],
      distractor: "red shoes",
      script: "Listen and get ready. First, put on the blue hat. Then take the yellow coat. Last, pick up the green bag."
    },
    {
      sequence: ["buy bread", "go to the park", "visit Grandma"],
      distractor: "watch a film",
      script: "After school, Ben must buy bread first. Then he can go to the park. After that, he will visit Grandma."
    },
    {
      sequence: ["apple", "cake", "banana"],
      distractor: "fish",
      script: "For the party table, put the apple down first. Put the cake next. Put the banana down last."
    },
    {
      sequence: ["Friday", "Saturday", "Sunday"],
      distractor: "Monday",
      script: "The play is on Friday. The picnic is on Saturday. The swimming lesson is on Sunday."
    },
    {
      sequence: ["library", "cafe", "park"],
      distractor: "school",
      script: "First, return the book at the library. Then meet Dad at the cafe. After that, walk to the park."
    },
    {
      sequence: ["school", "shop", "kitchen"],
      distractor: "swimming pool",
      script: "Mia goes to school first. After school she goes to the shop. Last, she helps in the kitchen."
    },
    {
      sequence: ["red shoes", "blue hat", "green bag"],
      distractor: "yellow coat",
      script: "Put on the red shoes first. Then find the blue hat. Finally, carry the green bag."
    },
    {
      sequence: ["play football", "read a book", "watch a film"],
      distractor: "buy bread",
      script: "After lunch, play football first. Then read a book quietly. In the evening, watch a film."
    }
  ];

  sequenceTasks.forEach((task) => {
    add(`${task.script} Tap the pictures in order.`);
    add(speechSegmentText({ speaker: "Narrator", text: task.script }));
    add(speechSegmentText({ speaker: "Question", text: "Tap the pictures in order." }));
    [...task.sequence, task.distractor].forEach(add);
  });

  return [...texts].sort((left, right) => left.localeCompare(right));
}

function collectPhonicsTexts(data) {
  const texts = new Set();
  const add = (text) => {
    const clean = String(text || "").trim();
    if (!shouldSkipTtsText(clean)) texts.add(clean);
  };
  const phonicsWords = data.phonicsWords || [];
  const sightWords = data.sightWords || [];

  phonicsWords.forEach((item) => {
    add(item.word);
    add(`Which word starts like ${item.word}?`);
    add(`Which word ends like ${item.word}?`);
    add(`Which word has the same middle sound as ${item.word}?`);
    add(`Which word rhymes with ${item.word}?`);
    add(`Which letter starts ${item.word}?`);
    if (item.sounds <= 4) add(`How many sounds can you hear in ${item.word}?`);
  });

  phonicsWords
    .filter((item) => item.word.length === 3 && ["a", "e", "i", "o", "u"].includes(item.vowel))
    .forEach((item) => {
      add(`What word is ${item.word.toUpperCase().split("").join(" ")}?`);
    });

  "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach((letter) => {
    add(letter);
    add(letter.toLowerCase());
    add(`Find the small letter for ${letter}.`);
    add(`Find the capital letter for ${letter.toLowerCase()}.`);
  });

  "BCDEFGHIJKLMNOPQRSTUVWXY".split("").forEach((letter) => {
    add(`What letter comes after ${letter}?`);
  });

  sightWords.forEach(add);

  return [...texts].sort((left, right) => left.localeCompare(right));
}

function makeRuntimeClassList() {
  const values = new Set();
  return {
    add: (...items) => items.forEach((item) => values.add(item)),
    remove: (...items) => items.forEach((item) => values.delete(item)),
    contains: (item) => values.has(item),
    toggle: (item, force) => {
      const shouldAdd = force === undefined ? !values.has(item) : Boolean(force);
      if (shouldAdd) values.add(item);
      else values.delete(item);
      return shouldAdd;
    }
  };
}

function makeRuntimeElement() {
  return {
    classList: makeRuntimeClassList(),
    dataset: {},
    style: {},
    textContent: "",
    innerHTML: "",
    hidden: false,
    offsetWidth: 100,
    offsetHeight: 100,
    append() {},
    addEventListener() {},
    setAttribute() {},
    removeAttribute() {},
    focus() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 })
  };
}

function createRuntimeContext() {
  const context = {
    console,
    Math,
    Set,
    Map,
    Array,
    String,
    Number,
    Boolean,
    Date,
    RegExp,
    JSON,
    Promise,
    URL,
    clearTimeout,
    setTimeout: () => 0,
    document: {
      createElement: () => makeRuntimeElement(),
      querySelector: () => makeRuntimeElement(),
      querySelectorAll: () => [makeRuntimeElement(), makeRuntimeElement(), makeRuntimeElement(), makeRuntimeElement()]
    },
    window: {
      innerWidth: 1200,
      innerHeight: 900,
      yoyoAudioFormats: ["mp3"],
      setTimeout: () => 0,
      clearTimeout,
      speechSynthesis: { cancel() {}, speak() {} },
      AudioContext: class {
        createOscillator() { return { frequency: { value: 0, setValueAtTime() {} }, type: "sine", connect() {}, start() {}, stop() {} }; }
        createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
        get currentTime() { return 0; }
        get destination() { return {}; }
      }
    },
    Audio: class {
      constructor() {
        this.playbackRate = 1;
        this.currentTime = 0;
      }
      addEventListener() {}
      pause() {}
      play() { return Promise.resolve(); }
    },
    SpeechSynthesisUtterance: class {
      constructor(text) {
        this.text = text;
      }
    }
  };
  context.globalThis = context;
  context.window.window = context.window;
  context.window.document = context.document;
  context.window.Audio = context.Audio;
  context.window.SpeechSynthesisUtterance = context.SpeechSynthesisUtterance;
  return context;
}

async function collectRuntimeTexts(sampleCount = Number(process.env.YOYO_RUNTIME_SAMPLES || "360")) {
  const source = await readFile(gamePath, "utf8");
  const exportSource = `
    globalThis.__yoyoAudioCollect = {
      state,
      buildRound,
      resetAllDecks,
      trimRecentTagsAcrossModes
    };
  `;
  const context = createRuntimeContext();
  vm.createContext(context);
  vm.runInContext(`${source}\n${exportSource}`, context, { filename: gamePath });

  const game = context.__yoyoAudioCollect;
  const modes = ["ketListen", "englishSkills", "phonics", "numberSense", "mathReasoning", "logicSpatial", "measure", "music"];
  const texts = new Set();
  const add = (text) => {
    const clean = String(text || "").trim();
    if (!shouldSkipTtsText(clean)) texts.add(clean);
  };

  for (const mode of modes) {
    game.state.activeGame = mode;
    game.state.correctCount = 0;
    game.state.questionGoal = 10;
    game.state.mathStage = 3;
    game.state.challenge = null;
    game.resetAllDecks();
    game.trimRecentTagsAcrossModes(0);

    for (let index = 0; index < sampleCount; index += 1) {
      game.buildRound();
      const challenge = game.state.challenge;
      add(challenge.spoken);
      (challenge.speechSegments || []).forEach(add);
      (challenge.options || []).forEach((option) => {
        if (option.correct && option.label) add(option.label);
      });
      if (challenge.kind === "sequence") {
        (challenge.sequence || []).forEach(add);
      }
    }
  }

  return [...texts].sort((left, right) => left.localeCompare(right));
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function run(command, args) {
  return new Promise((resolveRun, rejectRun) => {
    execFile(command, args, (error, stdout, stderr) => {
      if (error) {
        rejectRun(new Error(`${command} failed: ${stderr || error.message}`));
        return;
      }
      resolveRun(stdout);
    });
  });
}

async function generateClip(text, index, total) {
  const key = audioKeyForText(text);
  const extension = outputExtensionForProvider();
  const outputPath = resolve(audioDir, `${key}.${extension}`);
  if (!force && await exists(outputPath)) return "skip";
  const tempPath = resolve(audioDir, `${key}.tmp.${extension}`);

  try {
    if (provider === "openai") {
      await generateOpenAiClip(text, tempPath);
    } else if (provider === "gemini") {
      await generateGeminiClip(text, tempPath);
    } else if (provider === "doubao") {
      await generateDoubaoClip(text, tempPath);
    } else {
      throw new Error("YOYO_TTS_PROVIDER must be openai, gemini, or doubao.");
    }
  } catch (error) {
    await rm(tempPath, { force: true });
    throw error;
  }
  await rm(outputPath, { force: true });
  await run("/bin/mv", [tempPath, outputPath]);
  if (index % 25 === 0 || index === total) {
    console.log(`generated ${index}/${total}`);
  }
  return "generate";
}

async function generateOpenAiClip(text, outputPath) {
  const apiKey = cleanSecret(process.env.OPENAI_API_KEY);
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required when YOYO_TTS_PROVIDER=openai");
  }

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: openAiModel,
      voice: openAiVoice,
      input: speechTextForTts(text),
      instructions: openAiInstructions,
      response_format: "mp3"
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI TTS failed: ${response.status} ${body}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(outputPath, bytes);
}

function wavBufferFromPcm(pcmBuffer, sampleRate = 24000, channels = 1, bitsPerSample = 16) {
  const header = Buffer.alloc(44);
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcmBuffer.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcmBuffer.length, 40);

  return Buffer.concat([header, pcmBuffer]);
}

async function generateGeminiClip(text, outputPath) {
  const apiKey = cleanSecret(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required when YOYO_TTS_PROVIDER=gemini");
  }

  const transcript = speechTextForTts(text);
  const retryStatuses = new Set([408, 429, 500, 502, 503, 504]);
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`, {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${geminiInstructions}\n${transcript}`
          }]
        }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: geminiVoice
              }
            }
          }
        }
      })
    });

    if (!response.ok) {
      const body = await response.text();
      lastError = new Error(`Gemini TTS failed: ${response.status} ${body}`);
      lastError.retryable = retryStatuses.has(response.status);
      if (!lastError.retryable || attempt === maxRetries) {
        throw lastError;
      }

      const waitMs = Math.min(30000, 1200 * 2 ** attempt);
      console.warn(`Gemini retry ${attempt + 1}/${maxRetries + 1} after ${response.status}; waiting ${waitMs}ms`);
      await sleep(waitMs);
      continue;
    }

    const body = await response.json();
    const audioData = body.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) {
      lastError = new Error(`Gemini TTS returned no audio data: ${JSON.stringify(body).slice(0, 800)}`);
      lastError.retryable = true;
      if (attempt === maxRetries) {
        throw lastError;
      }

      const waitMs = Math.min(30000, 1200 * 2 ** attempt);
      console.warn(`Gemini retry ${attempt + 1}/${maxRetries + 1} after empty audio; waiting ${waitMs}ms`);
      await sleep(waitMs);
      continue;
    }

    const pcmBytes = Buffer.from(audioData, "base64");
    await writeFile(outputPath, wavBufferFromPcm(pcmBytes));
    return;
  }

  throw lastError || new Error("Gemini TTS failed without an error response");
}

async function generateDoubaoClip(text, outputPath) {
  if (doubaoApiKey) {
    await generateDoubaoV3Clip(text, outputPath);
    return;
  }

  if (!doubaoAppId || !doubaoAccessToken) {
    throw new Error("DOUBAO_API_KEY is required for the new Doubao console. The old console can still use DOUBAO_APP_ID and DOUBAO_ACCESS_TOKEN.");
  }

  const retryHttpStatuses = new Set([408, 429, 500, 502, 503, 504]);
  const retryCodes = new Set([3003, 3005, 3030, 3031, 3032]);
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const response = await fetch("https://openspeech.bytedance.com/api/v1/tts", {
      method: "POST",
      headers: {
        Authorization: `Bearer;${doubaoAccessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        app: {
          appid: doubaoAppId,
          token: doubaoAccessToken,
          cluster: doubaoCluster
        },
        user: {
          uid: "yoyo-study"
        },
        audio: {
          voice_type: doubaoVoice,
          encoding: "mp3",
          compression_rate: 1,
          rate: 24000,
          speed_ratio: 0.96,
          volume_ratio: 1.0,
          pitch_ratio: 1.0,
          language: "en"
        },
        request: {
          reqid: randomUUID(),
          text: speechTextForTts(text),
          text_type: "plain",
          operation: "query",
          pure_english_opt: "1"
        }
      })
    });

    if (!response.ok) {
      const body = await response.text();
      lastError = new Error(`Doubao TTS failed: ${response.status} ${body}`);
      lastError.retryable = retryHttpStatuses.has(response.status);
      if (!lastError.retryable || attempt === maxRetries) throw lastError;

      const waitMs = Math.min(20000, 1000 * 2 ** attempt);
      console.warn(`Doubao retry ${attempt + 1}/${maxRetries + 1} after ${response.status}; waiting ${waitMs}ms`);
      await sleep(waitMs);
      continue;
    }

    const body = await response.json();
    if (body.code !== 3000 || !body.data) {
      lastError = new Error(`Doubao TTS failed: ${JSON.stringify(body).slice(0, 800)}`);
      lastError.retryable = retryCodes.has(body.code);
      if (!lastError.retryable || attempt === maxRetries) throw lastError;

      const waitMs = Math.min(20000, 1000 * 2 ** attempt);
      console.warn(`Doubao retry ${attempt + 1}/${maxRetries + 1} after code ${body.code}; waiting ${waitMs}ms`);
      await sleep(waitMs);
      continue;
    }

    await writeFile(outputPath, Buffer.from(body.data, "base64"));
    return;
  }

  throw lastError || new Error("Doubao TTS failed without an error response");
}

function jsonObjectsFromStreamText(text) {
  const rawItems = [];
  const lines = String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const payload = line.startsWith("data:") ? line.slice(5).trim() : line;
    if (payload && payload !== "[DONE]") rawItems.push(payload);
  }

  if (rawItems.length === 0) rawItems.push(String(text).trim());

  const objects = [];
  for (const rawItem of rawItems) {
    try {
      objects.push(JSON.parse(rawItem));
      continue;
    } catch {
      // Some chunked responses can arrive as adjacent JSON objects.
    }

    let start = -1;
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let index = 0; index < rawItem.length; index += 1) {
      const char = rawItem[index];
      if (inString) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === "\"") inString = false;
        continue;
      }

      if (char === "\"") {
        inString = true;
      } else if (char === "{") {
        if (depth === 0) start = index;
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
        if (depth === 0 && start >= 0) {
          objects.push(JSON.parse(rawItem.slice(start, index + 1)));
          start = -1;
        }
      }
    }
  }

  return objects;
}

function audioBuffersFromDoubaoV3Response(text) {
  const objects = jsonObjectsFromStreamText(text);
  const audioBuffers = [];
  const errors = [];
  const successCodes = new Set([0, 20000000, 3000]);

  for (const item of objects) {
    if (!item || typeof item !== "object") continue;
    const code = Number(item.code);
    if (Number.isFinite(code) && !successCodes.has(code)) {
      errors.push(item.message || item.msg || JSON.stringify(item).slice(0, 240));
      continue;
    }

    const audioData = typeof item.data === "string"
      ? item.data
      : typeof item.audio === "string"
        ? item.audio
        : typeof item.result?.data === "string"
          ? item.result.data
          : typeof item.data?.audio === "string"
            ? item.data.audio
            : "";

    if (audioData) audioBuffers.push(Buffer.from(audioData, "base64"));
  }

  if (audioBuffers.length > 0) return audioBuffers;
  if (errors.length > 0) {
    const error = new Error(`Doubao V3 TTS failed: ${errors.join("; ")}`);
    error.retryable = true;
    throw error;
  }

  throw new Error(`Doubao V3 TTS returned no audio data: ${String(text).slice(0, 800)}`);
}

function parseProfileNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function parseDoubaoVoiceProfile(rawProfile) {
  const [speaker, speechRate, loudnessRate, resourceId] = String(rawProfile)
    .split(":")
    .map(cleanSecret);
  if (!speaker) return null;
  return {
    speaker,
    speechRate: parseProfileNumber(speechRate, doubaoSpeechRate),
    loudnessRate: parseProfileNumber(loudnessRate, doubaoLoudnessRate),
    resourceId: resourceId || doubaoResourceId
  };
}

function parseDoubaoVoiceProfiles() {
  const explicitProfiles = doubaoVoiceMix
    .split(",")
    .map(parseDoubaoVoiceProfile)
    .filter(Boolean);
  if (explicitProfiles.length > 0) return explicitProfiles;

  return doubaoSpeakers.map((speaker) => ({
    speaker,
    speechRate: doubaoSpeechRate,
    loudnessRate: doubaoLoudnessRate,
    resourceId: doubaoResourceId
  }));
}

function doubaoVoiceProfileForText(text) {
  if (doubaoVoiceProfiles.length <= 1) {
    return doubaoVoiceProfiles[0] || {
      speaker: "en_female_dacey_uranus_bigtts",
      speechRate: doubaoSpeechRate,
      loudnessRate: doubaoLoudnessRate,
      resourceId: doubaoResourceId
    };
  }
  const speakerName = String(text).match(/^([A-Za-z]+):/)?.[1]?.toLowerCase() || "";
  const wantsMale = ["boy", "dad", "man", "tom", "ben", "jack", "sam", "leo", "noah", "alex", "max", "oliver"].includes(speakerName);
  const wantsFemale = ["girl", "mum", "woman", "teacher", "emma", "mia", "anna", "lucy", "zoe", "amy", "maya", "lily", "ella", "sara"].includes(speakerName);
  const matchingProfiles = doubaoVoiceProfiles.filter((profile) => {
    const name = profile.speaker.toLowerCase();
    if (wantsMale) return name.includes("_male_") || name.includes("male_");
    if (wantsFemale) return name.includes("_female_") || name.includes("female_");
    return false;
  });
  if (matchingProfiles.length > 0) {
    const hash = Number.parseInt(audioKeyForText(text), 16);
    return matchingProfiles[hash % matchingProfiles.length];
  }
  const hash = Number.parseInt(audioKeyForText(text), 16);
  return doubaoVoiceProfiles[hash % doubaoVoiceProfiles.length];
}

function doubaoVoiceLabel() {
  if (!doubaoApiKey) return doubaoVoice;
  return doubaoVoiceProfiles
    .map((profile) => `${profile.speaker}@${profile.speechRate}`)
    .join(",");
}

async function generateDoubaoV3Clip(text, outputPath) {
  const retryHttpStatuses = new Set([408, 429, 500, 502, 503, 504]);
  const retryCodes = new Set([45000000, 50000000, 55000000, 55000001, 55000002]);
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const voiceProfile = doubaoVoiceProfileForText(text);
    const response = await fetch(doubaoV3Endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        "X-Api-Key": doubaoApiKey,
        "X-Api-Resource-Id": voiceProfile.resourceId,
        "X-Api-Request-Id": randomUUID(),
        "X-Control-Require-Usage-Tokens-Return": "text_words"
      },
      body: JSON.stringify({
        user: {
          uid: "yoyo-study"
        },
        req_params: {
          text: speechTextForTts(text),
          speaker: voiceProfile.speaker,
          audio_params: {
            format: "mp3",
            sample_rate: 24000,
            speech_rate: voiceProfile.speechRate,
            loudness_rate: voiceProfile.loudnessRate
          },
          additions: JSON.stringify({
            explicit_language: "en",
            disable_markdown_filter: true,
            enable_language_detector: false
          })
        }
      })
    });

    const body = await response.text();
    if (!response.ok) {
      lastError = new Error(`Doubao V3 TTS failed: ${response.status} ${body}`);
      lastError.retryable = retryHttpStatuses.has(response.status);
      if (!lastError.retryable || attempt === maxRetries) throw lastError;

      const waitMs = Math.min(20000, 1000 * 2 ** attempt);
      console.warn(`Doubao V3 retry ${attempt + 1}/${maxRetries + 1} after ${response.status}; waiting ${waitMs}ms`);
      await sleep(waitMs);
      continue;
    }

    try {
      const audioBuffers = audioBuffersFromDoubaoV3Response(body);
      await writeFile(outputPath, Buffer.concat(audioBuffers));
      return;
    } catch (error) {
      lastError = error;
      const codeMatch = String(error.message).match(/\b(4[0-9]{7}|5[0-9]{7})\b/);
      const code = codeMatch ? Number(codeMatch[1]) : null;
      lastError.retryable = code ? retryCodes.has(code) : true;
      if (!lastError.retryable || attempt === maxRetries) throw lastError;

      const waitMs = Math.min(20000, 1000 * 2 ** attempt);
      console.warn(`Doubao V3 retry ${attempt + 1}/${maxRetries + 1} after stream parse failure; waiting ${waitMs}ms`);
      await sleep(waitMs);
    }
  }

  throw lastError || new Error("Doubao V3 TTS failed without an error response");
}

const data = await loadGameData();
const allTexts = audioScope === "ket-listening"
  ? collectKetListeningTexts(data)
  : audioScope === "phonics"
    ? collectPhonicsTexts(data)
    : [...new Set([...collectTexts(data), ...await collectRuntimeTexts()])].sort((left, right) => left.localeCompare(right));
const matchedTexts = matchPattern ? allTexts.filter((text) => matchPattern.test(text)) : allTexts;
const texts = limit > 0 ? matchedTexts.slice(0, limit) : matchedTexts;
await mkdir(audioDir, { recursive: true });

let generated = 0;
let skipped = 0;
let failed = 0;
let consecutiveFailures = 0;
for (let index = 0; index < texts.length; index += 1) {
  try {
    const result = await generateClip(texts[index], index + 1, texts.length);
    if (result === "skip") skipped += 1;
    else generated += 1;
    consecutiveFailures = 0;
  } catch (error) {
    if (!["gemini", "doubao"].includes(provider) || !error.retryable) {
      throw error;
    }
    failed += 1;
    consecutiveFailures += 1;
    console.warn(`failed ${index + 1}/${texts.length}: ${shortErrorMessage(error)}`);
    if (consecutiveFailures >= maxFailures) {
      throw new Error(`Stopped after ${consecutiveFailures} consecutive ${provider} failures. Try again later, or lower YOYO_REQUEST_DELAY_MS/YOYO_LIMIT only after the provider starts responding normally.`);
    }
  }

  if (requestDelayMs > 0 && index < texts.length - 1) {
    await sleep(requestDelayMs);
  }
}

await writeFile(
  resolve(audioDir, "audio-config.js"),
  `window.yoyoAudioFormats = ${JSON.stringify(formatConfigForProvider())};\n`
);

console.log(`provider: ${provider}`);
console.log(`voice: ${provider === "openai" ? openAiVoice : provider === "gemini" ? geminiVoice : doubaoVoiceLabel()}`);
console.log(`scope: ${audioScope}`);
console.log(`clips: ${texts.length}`);
if (matchPattern) console.log(`matched from: ${allTexts.length}`);
if (limit > 0) console.log(`limited from: ${matchedTexts.length}`);
console.log(`generated: ${generated}`);
console.log(`skipped: ${skipped}`);
console.log(`failed: ${failed}`);
