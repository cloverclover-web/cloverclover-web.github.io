import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");
const sampleCount = Number(process.env.YOYO_AUDIT_SAMPLES || "120");
const gamePath = resolve(projectRoot, "game.js");
const audioDir = resolve(projectRoot, "audio");
const genericListenSignature = "M26 62 H42 L64 44 V86";

function makeClassList() {
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

function makeElement() {
  return {
    classList: makeClassList(),
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

function createContext() {
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
      createElement: () => makeElement(),
      querySelector: () => makeElement(),
      querySelectorAll: () => [makeElement(), makeElement(), makeElement(), makeElement()]
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

function loadGame() {
  const source = readFileSync(gamePath, "utf8");
  const exportSource = `
    globalThis.__yoyoAudit = {
      state,
      buildRound,
      resetAllDecks,
      trimRecentTagsAcrossModes,
      audioKeyForText
    };
  `;
  const context = createContext();
  vm.createContext(context);
  vm.runInContext(`${source}\n${exportSource}`, context, { filename: gamePath });
  return context.__yoyoAudit;
}

function audioExistsFor(text, audioKeyForText) {
  const clean = String(text || "").trim();
  if (!clean) return true;
  const key = audioKeyForText(clean);
  return existsSync(resolve(audioDir, `${key}.mp3`));
}

function isYesNoRound(challenge) {
  return challenge?.level === "yes-no";
}

function expectedOptionCounts(challenge) {
  if (challenge?.kind === "sequence") return [4];
  if (isYesNoRound(challenge)) return [2];
  if (challenge?.level === "compare-two-digit") return [2];
  if (challenge?.level === "compare-symbol") return [3];
  if (challenge?.level === "pitch-direction") return [3];
  return [4];
}

function textOf(value) {
  return String(value ?? "").trim();
}

function auditChallenge(mode, challenge, audioKeyForText, index) {
  const issues = [];
  const options = Array.isArray(challenge.options) ? challenge.options : [];
  const optionCount = options.length;
  const expectedCounts = expectedOptionCounts(challenge);

  if (!expectedCounts.includes(optionCount)) {
    issues.push(`option-count expected ${expectedCounts.join("/")} got ${optionCount}`);
  }

  if (challenge.kind === "sequence") {
    const labels = new Set(options.map((option) => option.label));
    const missing = (challenge.sequence || []).filter((label) => !labels.has(label));
    if (missing.length) issues.push(`sequence missing options: ${missing.join(", ")}`);
  } else {
    const correctCount = options.filter((option) => option.correct === true).length;
    if (correctCount !== 1) issues.push(`correct-count expected 1 got ${correctCount}`);
  }

  const artSignatures = new Map();
  options.forEach((option) => {
    const label = textOf(option.label);
    const art = String(option.artHtml || "");
    if (option.type === "listen" && art.includes(genericListenSignature)) {
      issues.push(`generic-art option: ${label}`);
    }
    if (option.type === "group" && !art && label.length > 8) {
      issues.push(`long text option without art: ${label}`);
    }
    if (art && !art.includes("text-option-token") && !art.includes("single-letter-card")) {
      const signature = art.replace(/\s+/g, " ").trim();
      const previous = artSignatures.get(signature);
      if (previous && previous !== label) {
        issues.push(`duplicate-art options: ${previous} / ${label}`);
      } else {
        artSignatures.set(signature, label);
      }
    }
  });

  const audioTexts = new Set();
  if (challenge.spoken) audioTexts.add(challenge.spoken);
  (challenge.speechSegments || []).forEach((text) => audioTexts.add(text));
  options.forEach((option) => {
    if (option.correct) audioTexts.add(option.spokenLabel || option.label);
  });

  const missingAudio = [...audioTexts].filter((text) => !audioExistsFor(text, audioKeyForText));

  return {
    mode,
    index,
    key: challenge.key,
    level: challenge.level,
    prompt: challenge.prompt,
    optionCount,
    issues,
    missingAudio
  };
}

const modes = ["ketListen", "englishSkills", "phonics", "numberSense", "mathReasoning", "logicSpatial", "measure", "music"];
const game = loadGame();
const failures = [];
const missingAudio = new Map();
const summary = {};

for (const mode of modes) {
  game.state.activeGame = mode;
  game.state.correctCount = 0;
  game.state.questionGoal = 10;
  game.state.mathStage = 3;
  game.state.challenge = null;
  game.resetAllDecks();
  game.trimRecentTagsAcrossModes(0);
  summary[mode] = { sampled: 0, failures: 0, missingAudio: 0 };

  for (let index = 0; index < sampleCount; index += 1) {
    game.buildRound();
    const result = auditChallenge(mode, game.state.challenge, game.audioKeyForText, index + 1);
    summary[mode].sampled += 1;
    if (result.issues.length) {
      summary[mode].failures += 1;
      failures.push(result);
    }
    result.missingAudio.forEach((text) => missingAudio.set(text, result.mode));
  }
}

for (const [text, mode] of missingAudio.entries()) {
  summary[mode].missingAudio += 1;
}

const report = {
  sampleCount,
  summary,
  failureCount: failures.length,
  failures: failures.slice(0, 40),
  missingAudioCount: missingAudio.size,
  missingAudio: [...missingAudio.keys()].slice(0, 80)
};

console.log(JSON.stringify(report, null, 2));

if (failures.length || missingAudio.size) process.exitCode = 1;
