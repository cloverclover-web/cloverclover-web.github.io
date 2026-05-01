import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const defaultProjectRoot = resolve(scriptDir, "..");
const projectRoot = process.env.YOYO_PROJECT_ROOT || defaultProjectRoot;
const outputDir = resolve(projectRoot, "audio", "voice-samples");
const sampleText = process.env.YOYO_VOICE_SAMPLE_TEXT || [
  "Please listen carefully.",
  "After breakfast, the little princess walked past the castle garden and asked, would you like a glass of water?",
  "Which picture shows her story?"
].join(" ");

const apiKey = cleanSecret(process.env.DOUBAO_API_KEY || process.env.VOLCENGINE_API_KEY);
const endpoint = process.env.DOUBAO_TTS_ENDPOINT || "https://openspeech.bytedance.com/api/v3/tts/unidirectional/sse";
const voices = [
  {
    id: "dacey",
    label: "Dacey",
    note: "US English female, clear and natural",
    resourceId: "seed-tts-2.0",
    speaker: "en_female_dacey_uranus_bigtts",
    speechRate: -4
  },
  {
    id: "tim",
    label: "Tim",
    note: "US English male, steady and warm",
    resourceId: "seed-tts-2.0",
    speaker: "en_male_tim_uranus_bigtts",
    speechRate: -4
  },
  {
    id: "tina-british-neutral",
    label: "Tina Teacher - British",
    note: "Closest British classroom accent I found",
    resourceId: "seed-tts-2.0",
    speaker: "zh_female_yingyujiaoxue_uranus_bigtts",
    speechRate: -4
  },
  {
    id: "tina-british-slow",
    label: "Tina Teacher - British Slow",
    note: "Slower pace for KET/PET-style listening",
    resourceId: "seed-tts-2.0",
    speaker: "zh_female_yingyujiaoxue_uranus_bigtts",
    speechRate: -8
  },
  {
    id: "tina-british-bright",
    label: "Tina Teacher - British Bright",
    note: "Same accent, a little quicker and more lively",
    resourceId: "seed-tts-2.0",
    speaker: "zh_female_yingyujiaoxue_uranus_bigtts",
    speechRate: -1
  },
  {
    id: "stokie",
    label: "Stokie",
    note: "US English female, brighter tone for comparison",
    resourceId: "seed-tts-2.0",
    speaker: "en_female_stokie_uranus_bigtts",
    speechRate: -4
  }
];

function cleanSecret(value) {
  return String(value || "")
    .trim()
    .replace(/^[\s"'‘’“”]+|[\s"'‘’“”]+$/g, "");
}

function htmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
  if (errors.length > 0) throw new Error(errors.join("; "));
  throw new Error(`No audio data returned: ${String(text).slice(0, 500)}`);
}

async function generateVoiceSample(voice, index) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      "X-Api-Key": apiKey,
      "X-Api-Resource-Id": voice.resourceId,
      "X-Api-Request-Id": randomUUID(),
      "X-Control-Require-Usage-Tokens-Return": "text_words"
    },
    body: JSON.stringify({
      user: {
        uid: "yoyo-study-voice-samples"
      },
      req_params: {
        text: sampleText,
        speaker: voice.speaker,
        audio_params: {
          format: "mp3",
          sample_rate: 24000,
          speech_rate: voice.speechRate,
          loudness_rate: 0
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
    throw new Error(`HTTP ${response.status}: ${body.slice(0, 500)}`);
  }

  const outputName = `${String(index + 1).padStart(2, "0")}-${voice.id}.mp3`;
  const buffers = audioBuffersFromDoubaoV3Response(body);
  await writeFile(resolve(outputDir, outputName), Buffer.concat(buffers));
  return {
    ...voice,
    outputName,
    ok: true
  };
}

function samplePage(results) {
  const rows = results.map((result) => {
    const status = result.ok ? "Ready" : `Failed: ${result.error}`;
    const audio = result.ok
      ? `<audio controls preload="metadata" src="audio/voice-samples/${htmlEscape(result.outputName)}"></audio>`
      : "";
    return `
      <article class="sample">
        <div>
          <h2>${htmlEscape(result.label)}</h2>
          <p>${htmlEscape(result.note)}</p>
          <p class="meta">${htmlEscape(result.speaker)} / ${htmlEscape(result.resourceId)}</p>
          <p class="${result.ok ? "status ok" : "status fail"}">${htmlEscape(status)}</p>
        </div>
        ${audio}
      </article>`;
  }).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>YOYO Voice Samples</title>
  <style>
    :root {
      color-scheme: light;
      font-family: Avenir, "Trebuchet MS", Arial, sans-serif;
      background: #fff8fb;
      color: #30243a;
    }
    body {
      margin: 0;
      padding: 32px;
      background:
        linear-gradient(135deg, rgba(255, 225, 236, 0.78), rgba(236, 248, 255, 0.8)),
        #fff8fb;
    }
    main {
      max-width: 920px;
      margin: 0 auto;
    }
    h1 {
      margin: 0 0 8px;
      font-size: clamp(28px, 4vw, 44px);
    }
    .script {
      margin: 0 0 24px;
      color: #5d4a68;
      font-size: 18px;
      line-height: 1.5;
    }
    .sample {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(260px, 360px);
      gap: 18px;
      align-items: center;
      margin: 14px 0;
      padding: 18px;
      border: 1px solid rgba(135, 90, 150, 0.22);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.82);
      box-shadow: 0 10px 28px rgba(72, 47, 87, 0.09);
    }
    h2 {
      margin: 0 0 6px;
      font-size: 22px;
    }
    p {
      margin: 4px 0;
    }
    .meta {
      color: #705f77;
      font-size: 13px;
      overflow-wrap: anywhere;
    }
    .status {
      font-weight: 700;
      font-size: 13px;
    }
    .ok {
      color: #236f4a;
    }
    .fail {
      color: #a23b3b;
    }
    audio {
      width: 100%;
    }
    @media (max-width: 720px) {
      body {
        padding: 18px;
      }
      .sample {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <main>
    <h1>YOYO Voice Samples</h1>
    <p class="script">${htmlEscape(sampleText)}</p>
    ${rows}
  </main>
</body>
</html>
`;
}

if (!apiKey) {
  throw new Error("DOUBAO_API_KEY is required");
}

await mkdir(outputDir, { recursive: true });
const results = [];
for (let index = 0; index < voices.length; index += 1) {
  const voice = voices[index];
  try {
    console.log(`generating ${index + 1}/${voices.length}: ${voice.label}`);
    results.push(await generateVoiceSample(voice, index));
  } catch (error) {
    const message = String(error?.message || error).replace(/\s+/g, " ").slice(0, 260);
    console.warn(`failed ${voice.label}: ${message}`);
    results.push({
      ...voice,
      ok: false,
      error: message
    });
  }
}

await writeFile(resolve(projectRoot, "voice-samples.html"), samplePage(results));

const okCount = results.filter((result) => result.ok).length;
console.log(`voice samples: ${okCount}/${voices.length}`);
console.log(`page: ${resolve(projectRoot, "voice-samples.html")}`);
