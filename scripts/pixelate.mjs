// Convierte una imagen generada por IA en sprites de pixel art real:
// quita el fondo, separa los personajes y reduce cada celda a un píxel. La IA no respeta una
// cuadrícula regular, así que el tamaño de celda se elige a mano.
// Uso: node scripts/pixelate.mjs entrada.png carpeta-salida nombre1,nombre2,... [--cell=6] [--opaque]
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const COLOR_TOLERANCE = 34;
const MAX_COLORS = 48;

function colorDistance(a, ai, b, bi) {
  return Math.abs(a[ai] - b[bi]) + Math.abs(a[ai + 1] - b[bi + 1]) + Math.abs(a[ai + 2] - b[bi + 2]);
}

/** Vuelve transparente el fondo conectado con los bordes de la imagen. */
function removeBackground(data, width, height) {
  const background = [data[0], data[1], data[2]];
  const seen = new Uint8Array(width * height);
  const stack = [];
  for (let x = 0; x < width; x++) stack.push(x, (height - 1) * width + x);
  for (let y = 0; y < height; y++) stack.push(y * width, y * width + width - 1);
  while (stack.length > 0) {
    const cell = stack.pop();
    if (seen[cell]) continue;
    const i = cell * 4;
    if (colorDistance(data, i, background, 0) > COLOR_TOLERANCE) continue;
    seen[cell] = 1;
    data[i + 3] = 0;
    const x = cell % width;
    if (x > 0) stack.push(cell - 1);
    if (x < width - 1) stack.push(cell + 1);
    if (cell >= width) stack.push(cell - width);
    if (cell < width * (height - 1)) stack.push(cell + width);
  }
}

/** Separa personajes por columnas vacías. */
function splitColumns(data, width, height, count) {
  const filled = [];
  for (let x = 0; x < width; x++) {
    let any = false;
    for (let y = 0; y < height && !any; y++) any = data[(y * width + x) * 4 + 3] > 0;
    filled.push(any);
  }
  const ranges = [];
  let start = -1;
  filled.forEach((value, x) => {
    if (value && start < 0) start = x;
    if (!value && start >= 0) {
      ranges.push([start, x - 1]);
      start = -1;
    }
  });
  if (start >= 0) ranges.push([start, width - 1]);
  return ranges.sort((a, b) => b[1] - b[0] - (a[1] - a[0])).slice(0, count).sort((a, b) => a[0] - b[0]);
}

/** Reduce cada celda a su color más frecuente, para no mezclar tonos. */
function downsample(data, width, height, grid) {
  const columns = Math.ceil((width + grid.size) / grid.size);
  const rows = Math.ceil((height + grid.size) / grid.size);
  const output = Buffer.alloc(columns * rows * 4);
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const counts = new Map();
      let solid = 0;
      let total = 0;
      for (let y = 0; y < grid.size; y++) {
        for (let x = 0; x < grid.size; x++) {
          const px = (column - 1) * grid.size + x;
          const py = (row - 1) * grid.size + y;
          if (px < 0 || py < 0 || px >= width || py >= height) continue;
          total++;
          const i = (py * width + px) * 4;
          if (data[i + 3] === 0) continue;
          solid++;
          const key = ((data[i] >> 3) << 10) | ((data[i + 1] >> 3) << 5) | (data[i + 2] >> 3);
          const entry = counts.get(key) ?? { n: 0, i };
          entry.n++;
          counts.set(key, entry);
        }
      }
      if (total === 0 || solid / total < 0.5) continue;
      const winner = [...counts.values()].sort((a, b) => b.n - a.n)[0];
      const o = (row * columns + column) * 4;
      data.copy(output, o, winner.i, winner.i + 3);
      output[o + 3] = 255;
    }
  }
  return { output, columns, rows };
}

async function save(raw, columns, rows, path) {
  const trimmed = await sharp(raw, { raw: { width: columns, height: rows, channels: 4 } }).png().toBuffer();
  const info = await sharp(trimmed)
    .trim()
    .png({ palette: true, colours: MAX_COLORS, dither: 0 })
    .toFile(path)
    .catch(() => sharp(trimmed).png({ palette: true, colours: MAX_COLORS, dither: 0 }).toFile(path));
  return `${info.width}x${info.height}`;
}

const [input, outputDir, namesArg] = process.argv.slice(2);
const opaque = process.argv.includes("--opaque");
const cellArg = process.argv.find((arg) => arg.startsWith("--cell="));
const grid = { size: cellArg ? Number(cellArg.slice(7)) : 6, offsetX: 0, offsetY: 0 };
const names = namesArg.split(",");
mkdirSync(outputDir, { recursive: true });

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;

if (opaque) {
  const { output, columns, rows } = downsample(data, width, height, grid);
  console.log(names[0], await save(output, columns, rows, join(outputDir, `${names[0]}.png`)));
} else {
  removeBackground(data, width, height);
  const ranges = splitColumns(data, width, height, names.length);
  const { output, columns, rows } = downsample(data, width, height, grid);
  for (const [index, name] of names.entries()) {
    const [from, to] = ranges[index];
    const left = Math.max(0, Math.floor(from / grid.size));
    const right = Math.min(columns - 1, Math.ceil(to / grid.size) + 1);
    const cropWidth = right - left + 1;
    const crop = Buffer.alloc(cropWidth * rows * 4);
    for (let row = 0; row < rows; row++) {
      output.copy(crop, row * cropWidth * 4, (row * columns + left) * 4, (row * columns + right + 1) * 4);
    }
    console.log(name, await save(crop, cropWidth, rows, join(outputDir, `${name}.png`)));
  }
}
