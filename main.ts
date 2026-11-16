import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function listScreenshots(dir: string) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => !name.startsWith('.'))
    .filter((name) => /\.(jpe?g|png)$/i.test(name))
    .sort();
}

function verifyBundle() {
  const gameIndex = join(out, 'game', 'index.html');
  if (!existsSync(gameIndex)) {
    throw new Error('Output is missing game/index.html.');
  }
  const screenshots = listScreenshots(join(out, 'screenshots'));
  if (screenshots.length < 3) {
    throw new Error(`Output is missing screenshots: expected at least 3 JPG/PNG files, found ${screenshots.length}.`);
  }
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}
verifyBundle();

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
