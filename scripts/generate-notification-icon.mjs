/**
 * Android bildirim small-icon üretir: assets/notification-icon.png
 *
 * Android bildirim ikonu tek renk + alfa silüet ister; renkli favicon
 * kullanmak buzdolabı gibi görünür. Bu script mesafe alanı (distance-field)
 * ile anti-aliased "elbis askısı" silüeti çizer — yazı/ince detay yok,
 * küçük boyutta okunur.
 *
 * Çalıştırma: `node scripts/generate-notification-icon.mjs`
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SIZE = 256;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'notification-icon.png');

// --- geometri: askı silüeti (piksel koordinatları, merkez x=128) ---
const HOOK = { cx: 128, cy: 56, r: 24, half: 4.5 };          // halka (askı)
const NECK = { ax: 128, ay: 74, bx: 128, by: 98, r: 5 };      // boyun
const ARM_L = { ax: 128, ay: 96, bx: 56, by: 210, r: 5 };     // sol kol
const ARM_R = { ax: 128, ay: 96, bx: 200, by: 210, r: 5 };    // sağ kol
const BAR = { ax: 56, ay: 210, bx: 200, by: 210, r: 5 };      // alt bar

const distToSeg = (px, py, s) => {
  const dx = s.bx - s.ax;
  const dy = s.by - s.ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - s.ax) * dx + (py - s.ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = s.ax + t * dx;
  const cy = s.ay + t * dy;
  return Math.hypot(px - cx, py - cy);
};

/** İşaretli mesafe: negatif = şeklin içi. */
const signedDist = (px, py) => {
  const dHook = Math.abs(Math.hypot(px - HOOK.cx, py - HOOK.cy) - HOOK.r) - HOOK.half;
  const dNeck = distToSeg(px, py, NECK) - NECK.r;
  const dArmL = distToSeg(px, py, ARM_L) - ARM_L.r;
  const dArmR = distToSeg(px, py, ARM_R) - ARM_R.r;
  const dBar = distToSeg(px, py, BAR) - BAR.r;
  return Math.min(dHook, dNeck, dArmL, dArmR, dBar);
};

// --- raster: RGBA tamponu ---
const px = new Uint8Array(SIZE * SIZE * 4);
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const d = signedDist(x + 0.5, y + 0.5);
    const cov = Math.max(0, Math.min(1, 0.5 - d)); // ~1px anti-alias
    const i = (y * SIZE + x) * 4;
    px[i] = 255;
    px[i + 1] = 255;
    px[i + 2] = 255;
    px[i + 3] = Math.round(cov * 255);
  }
}

// --- minimal PNG encoder (RGBA, filter 0) ---
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type RGBA

const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 4 + 1)] = 0; // filter: none
  Buffer.from(px.buffer, y * SIZE * 4, SIZE * 4).copy(raw, y * (SIZE * 4 + 1) + 1);
}

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

writeFileSync(OUT, png);
console.log(`notification-icon.png yazildi: ${OUT} (${SIZE}x${SIZE})`);
