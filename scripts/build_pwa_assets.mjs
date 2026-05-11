import { readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import zlib from "node:zlib";

const audioFiles = readdirSync("audio")
  .filter((file) => file.endsWith(".mp3") || file.endsWith(".wav"))
  .sort()
  .map((file) => `audio/${file}`);

writeFileSync(
  "audio-manifest.json",
  `${JSON.stringify({ version: "2026-05-01", files: audioFiles }, null, 2)}\n`
);

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function makePng(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const setPixel = (x, y, rgba) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const index = (y * size + x) * 4;
    pixels[index] = rgba[0];
    pixels[index + 1] = rgba[1];
    pixels[index + 2] = rgba[2];
    pixels[index + 3] = rgba[3];
  };
  const fillCircle = (cx, cy, r, rgba) => {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y += 1) {
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x += 1) {
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r ** 2) setPixel(x, y, rgba);
      }
    }
  };
  const fillRect = (x0, y0, x1, y1, rgba) => {
    for (let y = Math.max(0, y0); y < Math.min(size, y1); y += 1) {
      for (let x = Math.max(0, x0); x < Math.min(size, x1); x += 1) setPixel(x, y, rgba);
    }
  };
  const pointInPolygon = (x, y, points) => {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
      const [xi, yi] = points[i];
      const [xj, yj] = points[j];
      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  };
  const fillPolygon = (points, rgba) => {
    const xs = points.map(([x]) => x);
    const ys = points.map(([, y]) => y);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y += 1) {
      for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x += 1) {
        if (pointInPolygon(x, y, points)) setPixel(x, y, rgba);
      }
    }
  };
  const scale = size / 512;
  const s = (value) => Math.round(value * scale);
  const background = [255, 240, 248, 255];
  const cream = [255, 250, 240, 255];
  const ink = [37, 48, 65, 255];
  const gold = [240, 196, 99, 255];
  const yellow = [255, 209, 102, 255];
  const pink = [242, 158, 194, 255];
  const purple = [192, 167, 232, 255];
  const mint = [158, 224, 200, 255];

  fillRect(0, 0, size, size, background);
  fillCircle(s(256), s(268), s(168), ink);
  fillCircle(s(256), s(268), s(150), cream);
  fillPolygon([[s(122), s(278)], [s(158), s(154)], [s(218), s(228)], [s(256), s(116)], [s(294), s(228)], [s(354), s(154)], [s(390), s(278)]], ink);
  fillPolygon([[s(144), s(262)], [s(166), s(188)], [s(224), s(248)], [s(256), s(154)], [s(288), s(248)], [s(346), s(188)], [s(368), s(262)]], gold);
  fillRect(s(122), s(278), s(390), s(326), ink);
  fillRect(s(144), s(292), s(368), s(310), yellow);
  fillCircle(s(158), s(154), s(22), ink);
  fillCircle(s(158), s(154), s(13), pink);
  fillCircle(s(256), s(116), s(26), ink);
  fillCircle(s(256), s(116), s(16), purple);
  fillCircle(s(354), s(154), s(22), ink);
  fillCircle(s(354), s(154), s(13), mint);

  const rawRows = [];
  for (let y = 0; y < size; y += 1) {
    rawRows.push(Buffer.from([0]), pixels.subarray(y * size * 4, (y + 1) * size * 4));
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(Buffer.concat(rawRows))),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

for (const [file, size] of [
  ["apple-touch-icon.png", 180],
  ["icon-192.png", 192],
  ["icon-512.png", 512]
]) {
  writeFileSync(join("icons", file), makePng(size));
}

console.log(`PWA assets ready: ${audioFiles.length} audio files`);
