/**
 * Generates the browser-tab favicon, the iPhone "Add to Home Screen" icon and
 * the PWA manifest icons from public/setvion-bridge.png.
 *
 * Run `npm run icons` after changing the logo, then commit the files in public/.
 * Pure JS (pngjs) so it behaves the same on Windows, macOS and Linux.
 */
import fs from "node:fs";
import path from "node:path";
import pngjs from "pngjs";

const { PNG } = pngjs;
const publicDir = path.join(process.cwd(), "public");
const bridge = PNG.sync.read(fs.readFileSync(path.join(publicDir, "setvion-bridge.png")));

const BG_STOPS = [
  { at: 0, c: [0x1d, 0x25, 0x42] },
  { at: 0.55, c: [0x0f, 0x14, 0x24] },
  { at: 1, c: [0x08, 0x0a, 0x14] },
];
const GOLD = [212, 175, 55];

function background(t) {
  for (let i = 1; i < BG_STOPS.length; i++) {
    const a = BG_STOPS[i - 1];
    const b = BG_STOPS[i];
    if (t <= b.at) {
      const k = (t - a.at) / (b.at - a.at);
      return a.c.map((v, j) => v + (b.c[j] - v) * k);
    }
  }
  return BG_STOPS[BG_STOPS.length - 1].c;
}

/** Area-average downscale on premultiplied alpha, so edges stay clean at favicon sizes. */
function downscale(src, dw, dh) {
  const out = new Float32Array(dw * dh * 4);
  const sx = src.width / dw;
  const sy = src.height / dh;
  for (let dy = 0; dy < dh; dy++) {
    for (let dx = 0; dx < dw; dx++) {
      const x0 = dx * sx;
      const x1 = x0 + sx;
      const y0 = dy * sy;
      const y1 = y0 + sy;
      let r = 0, g = 0, b = 0, a = 0, wsum = 0;
      for (let y = Math.floor(y0); y < Math.ceil(y1); y++) {
        const wy = Math.min(y1, y + 1) - Math.max(y0, y);
        for (let x = Math.floor(x0); x < Math.ceil(x1); x++) {
          const w = wy * (Math.min(x1, x + 1) - Math.max(x0, x));
          const i = (y * src.width + x) * 4;
          const alpha = src.data[i + 3] / 255;
          r += src.data[i] * alpha * w;
          g += src.data[i + 1] * alpha * w;
          b += src.data[i + 2] * alpha * w;
          a += alpha * w;
          wsum += w;
        }
      }
      const o = (dy * dw + dx) * 4;
      out[o] = r / wsum;
      out[o + 1] = g / wsum;
      out[o + 2] = b / wsum;
      out[o + 3] = a / wsum;
    }
  }
  return out;
}

/**
 * `fill` is the bridge width as a share of the icon. Home-screen and maskable
 * icons use 0.72 so nothing is clipped by round/squircle masks; the tiny
 * favicon uses more of the canvas so the bridge stays readable.
 */
function render(size, fill) {
  const bw = Math.round(size * fill);
  const bh = Math.round((bw * bridge.height) / bridge.width);
  const scaled = downscale(bridge, bw, bh);
  const bx = Math.round((size - bw) / 2);
  const by = Math.round((size - bh) / 2);
  const glowRadius = 0.53 * size;
  const png = new PNG({ width: size, height: size });

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const bg = background((x + y) / (2 * (size - 1)));
      const d = Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2);
      const glow = 0.38 * Math.max(0, 1 - d / glowRadius);
      let rgb = bg.map((v, j) => v * (1 - glow) + GOLD[j] * glow);

      const lx = x - bx;
      const ly = y - by;
      if (lx >= 0 && ly >= 0 && lx < bw && ly < bh) {
        const s = (ly * bw + lx) * 4;
        const a = scaled[s + 3];
        rgb = [0, 1, 2].map((j) => scaled[s + j] + rgb[j] * (1 - a));
      }

      const o = (y * size + x) * 4;
      png.data[o] = Math.round(rgb[0]);
      png.data[o + 1] = Math.round(rgb[1]);
      png.data[o + 2] = Math.round(rgb[2]);
      png.data[o + 3] = 255;
    }
  }
  return PNG.sync.write(png);
}

/** Wraps PNG images in an .ico container (PNG-in-ICO is supported by all modern browsers). */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

const outputs = {
  "apple-touch-icon.png": render(180, 0.72),
  "icon-192.png": render(192, 0.72),
  "icon-512.png": render(512, 0.72),
  "icon-32.png": render(32, 0.86),
};

for (const [name, data] of Object.entries(outputs)) {
  fs.writeFileSync(path.join(publicDir, name), data);
  console.log(`wrote public/${name} (${data.length} bytes)`);
}

const favicon = ico([
  { size: 32, data: outputs["icon-32.png"] },
  { size: 48, data: render(48, 0.86) },
]);
fs.writeFileSync(path.join(publicDir, "favicon.ico"), favicon);
console.log(`wrote public/favicon.ico (${favicon.length} bytes)`);
