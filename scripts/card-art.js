// Turns the original card art in `cards/` into the WebP files the page ships, two widths per card.
//
// The originals stay out of git (the repo is public; see .gitignore). Each original is named
// "<number> <name>.png" with irregular spacing and case, so only the leading number is read. Every
// card is scaled to one fixed size, so all faces share an aspect ratio; the originals differ by
// under 2%, too little to see as stretching.
//
// Every shipped file carries the maker's mark, faint and corner to corner across the picture, so a
// card saved from the page still says whose it is. It is drawn once on the largest size and scaled
// down with the card, so it sits in the same place at every width.
//
// Run with `npm run card-art`. Needs ffmpeg on the PATH, built with libfreetype.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SOURCE = path.join(ROOT, 'cards');
const OUT = path.join(ROOT, 'packages', 'web', 'src', 'cards');
const DECK_SIZE = 54;
/** Width and height of each output, keyed by the width that names the file. The art is 8:11. */
const SIZES = { 320: 440, 720: 990 };
const [MARK_WIDTH, MARK_HEIGHT] = [720, 990];
const MARK_TEXT = '© Siembra Press';
/**
 * A bold system face for the mark, the first found. ffmpeg's fontconfig is not set up on every
 * machine (it is not on Windows builds), so the font is named by file.
 */
const FONT_FILES = [
  'C:/Windows/Fonts/arialbd.ttf',
  '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
];

const fontFile = FONT_FILES.find((file) => existsSync(file));
if (!fontFile) throw new Error(`No font for the watermark; looked for ${FONT_FILES.join(', ')}`);
// Inside an ffmpeg filter a colon separates options, so the one in a Windows drive letter is escaped.
const fontArg = fontFile.replaceAll(':', '\\:');

/**
 * The mark on its own transparent square, larger than the card's diagonal so no letter is cut when
 * it turns. White at low opacity with a fainter dark edge, so it shows on light and dark art alike.
 */
const MARK =
  `color=c=black@0:s=1240x1240,format=rgba,` +
  `drawtext=fontfile='${fontArg}':text='${MARK_TEXT}':fontsize=100:` +
  `fontcolor=white@0.22:borderw=3:bordercolor=black@0.14:x=(w-tw)/2:y=(h-th)/2,` +
  `rotate=-atan(${MARK_HEIGHT}/${MARK_WIDTH}):c=none`;

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
        '-filter_complex',
        `[0:v]scale=${MARK_WIDTH}:${MARK_HEIGHT}:flags=lanczos,format=rgba[art];${MARK}[mark];` +
          `[art][mark]overlay=(W-w)/2:(H-h)/2:format=auto,scale=${width}:${height}:flags=lanczos,format=yuva420p`,
        // The mark's color source never ends; the card is one frame.
        '-frames:v',
        '1',
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
