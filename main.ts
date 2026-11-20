// Vice Cover Studio — the entry program for gta6-cover-art-01.
//
// Node 22, standard library only. It hands the app in: it copies this
// repository's app/ and screenshots/ into the output directory and writes
// dossier.json there with the kit's vendored library. The app itself is
// plain static files under app/ — no build step, no network request — and
// the screenshots are the ones this entry's maker took of it.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// To try the app locally: `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Copy a whole directory tree, creating the destination first.
function copyTree(from: string, to: string): void {
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

mkdirSync(outDir, { recursive: true });
copyTree(join(repoRoot, 'app'), join(outDir, 'app'));
if (existsSync(join(repoRoot, 'screenshots'))) {
  copyTree(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'));
} else {
  mkdirSync(join(outDir, 'screenshots'), { recursive: true });
}

// The gate's caps, as the scorer states them: the dossier text cap shapes
// the bytes; the rest refuse an entry the scorer would refuse anyway.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
