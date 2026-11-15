// Turns the original card art in `cards/` into the WebP files the page ships, two widths per card.
//
// The originals stay out of git (the repo is public; see .gitignore). Each original is named
// "<number> <name>.png" with irregular spacing and case, so only the leading number is read. Every
// card is scaled to one fixed size, so all faces share an aspect ratio; the originals differ by
// under 2%, too little to see as stretching.
//
// Run with `npm run card-art`. Needs ffmpeg on the PATH.

import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SOURCE = path.join(ROOT, 'cards');
const OUT = path.join(ROOT, 'packages', 'web', 'src', 'cards');
const DECK_SIZE = 54;
/** Width and height of each output, keyed by the width that names the file. The art is 8:11. */
const SIZES = { 320: 440, 720: 990 };

const byId = new Map();
for (const file of readdirSync(SOURCE)) {
  const match = /^(\d+)/.exec(file);
  if (!match || path.extname(file).toLowerCase() !== '.png') continue;
  const id = Number(match[1]);
  if (byId.has(id)) throw new Error(`Two originals for card ${id}: ${byId.get(id)} and ${file}`);
  byId.set(id, file);
}
const missing = Array.from({ length: DECK_SIZE }, (_, i) => i + 1).filter((id) => !byId.has(id));
if (missing.length || byId.size !== DECK_SIZE) {
  throw new Error(`Expected cards 1-${DECK_SIZE}; missing ${missing.join(', ') || 'none'}, found ${byId.size}`);
}

mkdirSync(OUT, { recursive: true });
for (const [id, file] of byId) {
  for (const [width, height] of Object.entries(SIZES)) {
    const target = path.join(OUT, `${String(id).padStart(2, '0')}-${width}.webp`);
    const run = spawnSync(
      'ffmpeg',
      [
        '-v',
        'error',
        '-y',
        '-i',
        path.join(SOURCE, file),
        '-vf',
        `scale=${width}:${height}:flags=lanczos`,
        '-c:v',
        'libwebp',
        '-quality',
        '80',
        target,
      ],
      { stdio: 'inherit' },
    );
    if (run.status !== 0) throw new Error(`ffmpeg failed on ${file} at ${width}w`);
  }
}
console.log(`Wrote ${byId.size * Object.keys(SIZES).length} files to ${path.relative(ROOT, OUT)}`);
