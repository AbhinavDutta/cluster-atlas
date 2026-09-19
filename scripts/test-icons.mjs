// Verify the generated favicon set decodes correctly and stays small.
import zlib from 'node:zlib';
import {readFileSync} from 'node:fs';

const dir = new URL('../dist/', import.meta.url);
const failures = [];

function readPngSize(buffer) {
  if (buffer.readUInt32BE(0) !== 0x89504e47) throw new Error('bad PNG signature');
  const width = buffer.readUInt32BE(16), height = buffer.readUInt32BE(20);
  const parts = [];
  for (let i = 8; i < buffer.length;) {
    const len = buffer.readUInt32BE(i), type = buffer.toString('ascii', i + 4, i + 8);
    if (type === 'IDAT') parts.push(buffer.subarray(i + 8, i + 8 + len));
    i += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(parts));   // throws if the stream is broken
  const expected = height * (width * 4 + 1);
  if (raw.length !== expected) throw new Error(`inflated ${raw.length}, expected ${expected}`);
  return {width, height, colorType: buffer[25]};
}

const SIZES = {'favicon-16.png': 16, 'favicon-32.png': 32, 'apple-touch-icon.png': 180, 'icon-192.png': 192, 'icon-512.png': 512};
for (const [name, expected] of Object.entries(SIZES)) {
  const buffer = readFileSync(new URL(name, dir));
  const info = readPngSize(buffer);
  if (info.width !== expected || info.height !== expected) failures.push(`${name}: ${info.width}x${info.height}, expected ${expected}`);
  if (info.colorType !== 6) failures.push(`${name}: colorType ${info.colorType}, expected 6 (RGBA)`);
  if (buffer.length > 30_000 && name !== 'icon-512.png') failures.push(`${name}: ${buffer.length} bytes, larger than expected`);
  console.log(`  ${name.padEnd(22)} ${info.width}x${info.height} RGBA  ${String(buffer.length).padStart(7)} bytes`);
}

// ICO directory entries must point at valid embedded PNGs.
const ico = readFileSync(new URL('favicon.ico', dir));
if (ico.readUInt16LE(0) !== 0 || ico.readUInt16LE(2) !== 1) failures.push('favicon.ico: not an ICO');
const count = ico.readUInt16LE(4);
console.log(`  favicon.ico            ${count} entries  ${String(ico.length).padStart(7)} bytes`);
for (let i = 0; i < count; i++) {
  const o = 6 + i * 16;
  const w = ico[o] || 256;
  const offset = ico.readUInt32LE(o + 12), length = ico.readUInt32LE(o + 8);
  if (offset + length > ico.length) { failures.push(`favicon.ico entry ${i}: payload out of range`); continue; }
  const payload = ico.subarray(offset, offset + length);
  try {
    const info = readPngSize(payload);
    if (info.width !== w) failures.push(`favicon.ico entry ${i}: directory says ${w}px, payload is ${info.width}px`);
    console.log(`    entry ${String(w).padStart(2)}px  ${String(length).padStart(6)} bytes  ok`);
  } catch (e) {
    failures.push(`favicon.ico entry ${i}: ${e.message}`);
  }
}

if (failures.length) {
  console.error('FAIL icon check:\n' + failures.map(f => '  · ' + f).join('\n'));
  process.exit(1);
}
console.log('PASS icon set: sizes, colour type, ICO directory and embedded payloads are valid.');