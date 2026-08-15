/**
 * One-off script: builds public/favicon.ico and public/favicon.png from the
 * Kanoy K brand mark. Auto-crops the whitespace padding around the letter so
 * it reads clearly at small sizes, then downsamples to standard favicon
 * resolutions. Not part of the build — run manually with `node scripts/make-favicon.cjs`.
 */
const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");
const pngToIco = require("png-to-ico").default;

const SRC = path.join(__dirname, "..", "src", "assets", "kanoy-k.png");
const OUT_DIR = path.join(__dirname, "..", "public");

function loadPng(filePath) {
  return PNG.sync.read(fs.readFileSync(filePath));
}

function findBoundingBox(png, whiteThreshold = 250) {
  let minX = png.width;
  let minY = png.height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const i = (png.width * y + x) << 2;
      const r = png.data[i];
      const g = png.data[i + 1];
      const b = png.data[i + 2];
      const isWhite = r >= whiteThreshold && g >= whiteThreshold && b >= whiteThreshold;
      if (!isWhite) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  return { minX, minY, maxX, maxY };
}

function cropSquare(png, box, marginRatio = 0.08) {
  const w = box.maxX - box.minX;
  const h = box.maxY - box.minY;
  const side = Math.max(w, h);
  const margin = Math.round(side * marginRatio);
  const size = side + margin * 2;

  const cx = (box.minX + box.maxX) / 2;
  const cy = (box.minY + box.maxY) / 2;
  const left = Math.round(cx - size / 2);
  const top = Math.round(cy - size / 2);

  const out = new PNG({ width: size, height: size });
  out.data.fill(255); // white background

  for (let y = 0; y < size; y++) {
    const sy = top + y;
    if (sy < 0 || sy >= png.height) continue;
    for (let x = 0; x < size; x++) {
      const sx = left + x;
      if (sx < 0 || sx >= png.width) continue;
      const si = (png.width * sy + sx) << 2;
      const di = (size * y + x) << 2;
      out.data[di] = png.data[si];
      out.data[di + 1] = png.data[si + 1];
      out.data[di + 2] = png.data[si + 2];
      out.data[di + 3] = 255;
    }
  }

  return out;
}

/**
 * Cuts the background to transparent by flood-filling whitish pixels inward
 * from the image border. Only removes background connected to the edge, so
 * it can't eat into the letter's own glossy white highlights — those are
 * fully enclosed by colored pixels and unreachable from the border.
 */
function makeTransparent(png, whiteThreshold = 235) {
  const { width, height, data } = png;
  const visited = new Uint8Array(width * height);
  const stack = [];

  const isWhiteish = (idx) => {
    const r = data[idx * 4];
    const g = data[idx * 4 + 1];
    const b = data[idx * 4 + 2];
    return r >= whiteThreshold && g >= whiteThreshold && b >= whiteThreshold;
  };

  const push = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = y * width + x;
    if (visited[idx] || !isWhiteish(idx)) return;
    visited[idx] = 1;
    stack.push(idx);
  };

  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }

  while (stack.length) {
    const idx = stack.pop();
    data[idx * 4 + 3] = 0;
    const x = idx % width;
    const y = (idx - x) / width;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  return png;
}

/** Box-downsample (average pooling) — clean results when shrinking. */
function resize(png, targetSize) {
  const out = new PNG({ width: targetSize, height: targetSize });
  const scale = png.width / targetSize;

  for (let y = 0; y < targetSize; y++) {
    const sy0 = Math.floor(y * scale);
    const sy1 = Math.max(sy0 + 1, Math.floor((y + 1) * scale));
    for (let x = 0; x < targetSize; x++) {
      const sx0 = Math.floor(x * scale);
      const sx1 = Math.max(sx0 + 1, Math.floor((x + 1) * scale));

      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let count = 0;
      for (let sy = sy0; sy < sy1 && sy < png.height; sy++) {
        for (let sx = sx0; sx < sx1 && sx < png.width; sx++) {
          const si = (png.width * sy + sx) << 2;
          r += png.data[si];
          g += png.data[si + 1];
          b += png.data[si + 2];
          a += png.data[si + 3];
          count++;
        }
      }

      const di = (targetSize * y + x) << 2;
      out.data[di] = Math.round(r / count);
      out.data[di + 1] = Math.round(g / count);
      out.data[di + 2] = Math.round(b / count);
      out.data[di + 3] = Math.round(a / count);
    }
  }

  return out;
}

async function main() {
  const source = loadPng(SRC);
  const box = findBoundingBox(source);
  const cropped = makeTransparent(cropSquare(source, box));

  const sizes = [64, 48, 32, 16];
  const buffers = sizes.map((size) => PNG.sync.write(resize(cropped, size), { deflateLevel: 9 }));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, "favicon.png"),
    PNG.sync.write(resize(cropped, 180), { deflateLevel: 9 }),
  );

  const ico = await pngToIco(buffers);
  fs.writeFileSync(path.join(OUT_DIR, "favicon.ico"), ico);

  console.log("Wrote public/favicon.ico and public/favicon.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
