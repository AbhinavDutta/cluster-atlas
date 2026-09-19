// Generates the favicon set from dist/logo.png.
//
// The site previously pointed every icon at the 542 KB, 1254x1254 logo, and
// /favicon.ico did not exist at all. Browsers request /favicon.ico directly when
// a page has no icon link (or from bookmarks and readers that ignore the link),
// so a real ICO plus properly sized PNGs are needed.
//
// No image library is available in this project, so the decode, downscale, alpha
// composite and encode are implemented here. The important detail is that
// downscaling averages in premultiplied alpha: the logo has large fully
// transparent regions whose RGB is black, and averaging those directly would
// bleed dark fringes into the mark's edges.
//
// Run: node scripts/generate-icons.mjs
import zlib from 'node:zlib';
import {readFileSync, writeFileSync} from 'node:fs';

const SOURCE = new URL('../dist/logo.png', import.meta.url);
const OUT = new URL('../dist/', import.meta.url);
// Fraction of each side left as breathing room, so the mark is not flush to the
// edge of the tab. The source already carries roughly 6% padding.
const PAD = 0.06;
// iOS renders transparency as black, so the touch icon is composited on white.
const TOUCH_BACKGROUND = [255, 255, 255];

// ---------- PNG decode ----------
function decode(buffer) {
  if (buffer.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  const width = buffer.readUInt32BE(16), height = buffer.readUInt32BE(20);
  const depth = buffer[24], colorType = buffer[25];
  if (depth !== 8 || colorType !== 6) throw new Error(`expected 8-bit RGBA, got depth=${depth} type=${colorType}`);

  const parts = [];
  for (let i = 8; i < buffer.length;) {
    const len = buffer.readUInt32BE(i), type = buffer.toString('ascii', i + 4, i + 8);
    if (type === 'IDAT') parts.push(buffer.subarray(i + 8, i + 8 + len));
    i += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(parts));

  const bpp = 4, stride = width * bpp, px = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[y * stride + x - bpp] : 0;
      const b = y > 0 ? px[(y - 1) * stride + x] : 0;
      const c = x >= bpp && y > 0 ? px[(y - 1) * stride + x - bpp] : 0;
      let v = line[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
      }
      px[y * stride + x] = v & 0xff;
    }
  }
  return {width, height, data: px};
}

// ---------- PNG encode ----------
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
}
function encode({width, height, data}) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // RGBA
  const stride = width * 4;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    data.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, {level: 9})),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

// ---------- transform ----------
function opaqueBounds({width, height, data}) {
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * 4 + 3] <= 8) continue;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  if (maxX < 0) throw new Error('logo is fully transparent');
  return {minX, minY, maxX, maxY};
}

// Box-average resize over premultiplied alpha so transparent black pixels do not
// contaminate the colour of the mark. When `background` is given the result is
// flattened onto it (used for the iOS touch icon).
function resize(src, size, {trim, background = null, pad = PAD} = {}) {
  const bounds = trim ? opaqueBounds(src) : {minX: 0, minY: 0, maxX: src.width - 1, maxY: src.height - 1};
  const srcW = bounds.maxX - bounds.minX + 1, srcH = bounds.maxY - bounds.minY + 1;
  const inner = Math.max(1, Math.round(size * (1 - 2 * pad)));
  const scale = Math.min(inner / srcW, inner / srcH);
  const drawW = Math.max(1, Math.round(srcW * scale)), drawH = Math.max(1, Math.round(srcH * scale));
  const offX = Math.round((size - drawW) / 2), offY = Math.round((size - drawH) / 2);

  const out = Buffer.alloc(size * size * 4);
  for (let dy = 0; dy < drawH; dy++) for (let dx = 0; dx < drawW; dx++) {
    // Source rectangle this destination pixel covers.
    const sx0 = bounds.minX + Math.floor(dx * srcW / drawW), sx1 = bounds.minX + Math.max(Math.floor((dx + 1) * srcW / drawW), Math.floor(dx * srcW / drawW) + 1);
    const sy0 = bounds.minY + Math.floor(dy * srcH / drawH), sy1 = bounds.minY + Math.max(Math.floor((dy + 1) * srcH / drawH), Math.floor(dy * srcH / drawH) + 1);
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let sy = sy0; sy < sy1; sy++) for (let sx = sx0; sx < sx1; sx++) {
      const o = (sy * src.width + sx) * 4, alpha = src.data[o + 3] / 255;
      r += src.data[o] * alpha; g += src.data[o + 1] * alpha; b += src.data[o + 2] * alpha;
      a += alpha; n++;
    }
    if (!n) continue;
    const alpha = a / n;
    const o = ((offY + dy) * size + offX + dx) * 4;
    if (alpha > 0) {
      out[o] = Math.round(r / a); out[o + 1] = Math.round(g / a); out[o + 2] = Math.round(b / a);
    }
    out[o + 3] = Math.round(alpha * 255);
  }

  if (background) {
    const [br, bg, bb] = background;
    for (let i = 0; i < size * size; i++) {
      const o = i * 4, alpha = out[o + 3] / 255;
      out[o] = Math.round(out[o] * alpha + br * (1 - alpha));
      out[o + 1] = Math.round(out[o + 1] * alpha + bg * (1 - alpha));
      out[o + 2] = Math.round(out[o + 2] * alpha + bb * (1 - alpha));
      out[o + 3] = 255;
    }
  }
  return {width: size, height: size, data: out};
}

// ---------- ICO ----------
// Multi-size ICO with PNG payloads. Every current browser reads PNG-compressed
// entries, which keeps the file small and avoids writing a BMP encoder.
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);            // 1 = ICO
  header.writeUInt16LE(images.length, 4);
  const dir = Buffer.alloc(16 * images.length);
  let offset = 6 + dir.length;
  images.forEach(({size, png}, i) => {
    const o = i * 16;
    dir[o] = size >= 256 ? 0 : size;
    dir[o + 1] = size >= 256 ? 0 : size;
    dir[o + 2] = 0; dir[o + 3] = 0;
    dir.writeUInt16LE(1, o + 4);         // colour planes
    dir.writeUInt16LE(32, o + 6);        // bits per pixel
    dir.writeUInt32LE(png.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += png.length;
  });
  return Buffer.concat([header, dir, ...images.map(i => i.png)]);
}

// ---------- run ----------
const src = decode(readFileSync(SOURCE));
const bounds = opaqueBounds(src);
console.log(`source logo: ${src.width}x${src.height}, opaque bounds ${bounds.maxX - bounds.minX + 1}x${bounds.maxY - bounds.minY + 1}`);

const png = (size, options) => encode(resize(src, size, options));
const written = [];
const write = (name, buffer) => { writeFileSync(new URL(name, OUT), buffer); written.push([name, buffer.length]); };

const icoSizes = [16, 32, 48];
write('favicon.ico', buildIco(icoSizes.map(size => ({size, png: png(size, {trim: true})}))));
write('favicon-16.png', png(16, {trim: true}));
write('favicon-32.png', png(32, {trim: true}));
write('apple-touch-icon.png', png(180, {trim: true, background: TOUCH_BACKGROUND, pad: 0.12}));
write('icon-192.png', png(192, {trim: true}));
write('icon-512.png', png(512, {trim: true}));

for (const [name, bytes] of written) console.log(`  ${name.padEnd(24)} ${String(bytes).padStart(7)} bytes`);
console.log(`favicon.ico contains ${icoSizes.join(', ')} px entries`);