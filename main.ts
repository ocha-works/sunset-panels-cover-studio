// Sunset Panels — Vice Cover Studio: the program that hands the entry in.
//
// The app itself is the static site under app/ (open app/index.html in a
// desktop browser; it runs offline and reads photos only from the visitor's
// own machine). This program's one job is to hand that site to the grader:
// it copies app/ and screenshots/ from beside this file into the output
// directory and writes dossier.json there with the vendored make.fun
// library, byte for byte the way the scorer rebuilds it.
//
// Run it the way the grader does, with MAKEFUN_OUTPUT_DIR standing in for
// /output outside the grader's container:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Node 22.18 or later, standard library only; nothing is installed.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's own caps, passed to the dossier builder so an entry the
// scorer would refuse fails here first, in the open: at most 4 screenshots
// of 256 KiB each, at most 993 files and 48 MiB under app/, no app/ path
// over 1000 bytes, and the dossier's source text capped at 160 KiB.
const DOSSIER_CAPS = {
  text_max_bytes: 163_840,
  screenshots: { max: 4, max_bytes: 262_144 },
  app_max_files: 993,
  app_max_bytes: 50_331_648,
  app_path_max_bytes: 1_000,
};

/** Counts the files under a directory, recursively. */
function countFiles(dir: string): number {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    total += entry.isDirectory() ? countFiles(join(dir, entry.name)) : 1;
  }
  return total;
}

/** Copies one of the entry's trees into the output directory. */
function handOver(name: string): number {
  const from = join(repoRoot, name);
  if (!existsSync(from)) return 0;
  // Clear whatever a previous run left at the destination first, so the
  // output holds exactly this entry's files and two runs of the program
  // write the same bytes even into a directory that is not fresh.
  rmSync(join(outputDir, name), { recursive: true, force: true });
  cpSync(from, join(outputDir, name), { recursive: true });
  return countFiles(from);
}

mkdirSync(outputDir, { recursive: true });
const appFiles = handOver('app');
const shotFiles = handOver('screenshots');

const dossier = buildDossier(outputDir, DOSSIER_CAPS);
writeFileSync(join(outputDir, 'dossier.json'), dossier);

console.log(
  `sunset-panels: handed in ${appFiles} app files and ${shotFiles} screenshots; ` +
  `dossier.json is ${Buffer.byteLength(dossier)} bytes`,
);
