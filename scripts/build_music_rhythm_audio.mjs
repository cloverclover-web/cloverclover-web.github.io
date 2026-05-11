import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ffmpeg = "/opt/homebrew/bin/ffmpeg";
const source = "audio/violin-open-strings.mp3";
const outputDir = "audio";

const patterns = [
  { id: "long-long", tokens: ["quarter", "quarter"] },
  { id: "quick-quick-long", tokens: ["eighth-pair", "quarter"] },
  { id: "long-quick-quick", tokens: ["quarter", "eighth-pair"] },
  { id: "long-rest-long", tokens: ["quarter", "rest", "quarter"] },
  { id: "quick-quick-rest-long", tokens: ["eighth-pair", "rest", "quarter"] }
];

const timing = {
  sampleStart: 8.95,
  long: 1.12,
  quick: 0.58,
  quickGap: 0.22,
  rest: 0.86,
  beatGap: 0.22,
  repeatGap: 0.52,
  leadingSilence: 0.16,
  trailingSilence: 0.24,
  repeats: 2
};

function silencePiece(seconds) {
  return { kind: "silence", seconds };
}

function notePiece(seconds) {
  return { kind: "note", seconds };
}

function piecesForPattern(tokens) {
  const pieces = [silencePiece(timing.leadingSilence)];

  for (let pass = 0; pass < timing.repeats; pass += 1) {
    tokens.forEach((token) => {
      if (token === "quarter") {
        pieces.push(notePiece(timing.long), silencePiece(timing.beatGap));
        return;
      }
      if (token === "eighth-pair") {
        pieces.push(
          notePiece(timing.quick),
          silencePiece(timing.quickGap),
          notePiece(timing.quick),
          silencePiece(timing.beatGap)
        );
        return;
      }
      pieces.push(silencePiece(timing.rest + timing.beatGap));
    });
    if (pass < timing.repeats - 1) pieces.push(silencePiece(timing.repeatGap));
  }

  pieces.push(silencePiece(timing.trailingSilence));
  return pieces;
}

function buildFilter(pieces) {
  const noteCount = pieces.filter((piece) => piece.kind === "note").length;
  const filters = [];
  const concatLabels = [];
  let noteIndex = 0;

  if (noteCount > 0) {
    const splitLabels = Array.from({ length: noteCount }, (_, index) => `[src${index}]`).join("");
    filters.push(`[0:a]asplit=${noteCount}${splitLabels}`);
  }

  pieces.forEach((piece, index) => {
    const label = `[p${index}]`;
    concatLabels.push(label);
    if (piece.kind === "note") {
      filters.push(
        `[src${noteIndex}]atrim=start=${timing.sampleStart}:duration=${piece.seconds},asetpts=PTS-STARTPTS,` +
        `afade=t=in:st=0:d=0.025,afade=t=out:st=${Math.max(0.04, piece.seconds - 0.055).toFixed(3)}:d=0.055,volume=1.08${label}`
      );
      noteIndex += 1;
    } else {
      filters.push(`anullsrc=r=44100:cl=stereo:d=${piece.seconds}${label}`);
    }
  });

  filters.push(`${concatLabels.join("")}concat=n=${pieces.length}:v=0:a=1[out]`);
  return filters.join(";");
}

if (!existsSync(ffmpeg)) throw new Error(`Missing ${ffmpeg}`);
if (!existsSync(source)) throw new Error(`Missing ${source}`);
mkdirSync(outputDir, { recursive: true });

for (const pattern of patterns) {
  const output = join(outputDir, `music-rhythm-${pattern.id}.mp3`);
  execFileSync(ffmpeg, [
    "-y",
    "-hide_banner",
    "-loglevel", "error",
    "-i", source,
    "-filter_complex", buildFilter(piecesForPattern(pattern.tokens)),
    "-map", "[out]",
    "-codec:a", "libmp3lame",
    "-b:a", "192k",
    output
  ], { stdio: "inherit" });
  console.log(`Wrote ${output}`);
}
