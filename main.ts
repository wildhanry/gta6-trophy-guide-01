// Entry point for the GTA 6 trophy guide hand-in.
//
// What this program does, in my own staging order:
//   1. works out where this repository lives and where the hand-in goes,
//   2. mirrors the static guide (app/) and its captures (screenshots/)
//      into that destination with a hand-rolled recursive copy,
//   3. reads every mirrored file back and compares it against its source,
//      so a truncated or corrupted copy fails here instead of at scoring,
//   4. asks the vendored dossier builder for the summary document, writes
//      it as dossier.json next to the mirrored folders, and
//   5. re-opens the finished dossier to confirm it is usable JSON that
//      carries the expected schema marker and at least one image.
//
// The vendored builder is treated as a black box on purpose: the limits
// handed to it below are the gate values for this bounty, and changing
// any of them would change the bytes it produces.

import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildDossier } from './vendor/makefun-frontend.ts';

const GATE_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

interface MirroredFile {
  relativePath: string;
  sourcePath: string;
  targetPath: string;
  bytes: number;
}

function digestOf(filePath: string): string {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function listSourceFiles(root: string, current: string, sink: string[]): void {
  const entries = readdirSync(current, { withFileTypes: true });
  entries.sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0));
  for (const entry of entries) {
    const fullPath = join(current, entry.name);
    if (entry.isDirectory()) {
      listSourceFiles(root, fullPath, sink);
    } else if (entry.isFile()) {
      sink.push(relative(root, fullPath));
    } else {
      throw new Error(`refusing to hand in a non-regular file: ${fullPath}`);
    }
  }
}

function mirrorFolder(sourceDir: string, targetDir: string): MirroredFile[] {
  mkdirSync(targetDir, { recursive: true });
  if (!existsSync(sourceDir)) return [];

  const planned: string[] = [];
  listSourceFiles(sourceDir, sourceDir, planned);

  const done: MirroredFile[] = [];
  for (const relativePath of planned) {
    const from = join(sourceDir, relativePath);
    const to = join(targetDir, relativePath);
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(from, to);
    done.push({ relativePath, sourcePath: from, targetPath: to, bytes: statSync(from).size });
  }
  return done;
}

function assertMirrorIntact(files: MirroredFile[], label: string): void {
  for (const file of files) {
    if (!existsSync(file.targetPath)) {
      throw new Error(`${label}: copied file is missing on read-back: ${file.relativePath}`);
    }
    const copiedSize = statSync(file.targetPath).size;
    if (copiedSize !== file.bytes) {
      throw new Error(
        `${label}: size drift for ${file.relativePath}: source ${file.bytes} bytes, copy ${copiedSize} bytes`,
      );
    }
    if (digestOf(file.targetPath) !== digestOf(file.sourcePath)) {
      throw new Error(`${label}: content drift for ${file.relativePath}: copy hashes differently from its source`);
    }
  }
}

function assertDossierUsable(dossierPath: string): void {
  const raw = readFileSync(dossierPath, 'utf8');
  if (raw.length === 0) throw new Error('dossier.json was written empty');

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (cause) {
    throw new Error(`dossier.json is not valid JSON: ${(cause as Error).message}`);
  }

  const record = parsed as { schema?: unknown; images?: unknown; text?: unknown };
  if (record.schema !== 'makefun/dossier/v1') {
    throw new Error(`dossier.json carries an unexpected schema marker: ${String(record.schema)}`);
  }
  if (!Array.isArray(record.images) || record.images.length === 0) {
    throw new Error('dossier.json lists no screenshot images');
  }
  if (typeof record.text !== 'string' || record.text.length === 0) {
    throw new Error('dossier.json carries no summary text');
  }
}

function run(): void {
  const repoRoot = dirname(fileURLToPath(import.meta.url));
  const destination = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
  mkdirSync(destination, { recursive: true });

  const stagedApp = mirrorFolder(join(repoRoot, 'app'), join(destination, 'app'));
  if (stagedApp.length === 0) throw new Error('app/ held no files to hand in');
  assertMirrorIntact(stagedApp, 'app');

  const stagedShots = mirrorFolder(
    join(repoRoot, 'screenshots'),
    join(destination, 'screenshots'),
  );
  assertMirrorIntact(stagedShots, 'screenshots');

  const dossierPath = join(destination, 'dossier.json');
  const dossierBytes = buildDossier(destination, GATE_LIMITS);
  writeFileSync(dossierPath, dossierBytes);
  assertDossierUsable(dossierPath);

  const shotNote = stagedShots.length === 1 ? '1 screenshot' : `${stagedShots.length} screenshots`;
  console.log(
    `handed in ${stagedApp.length} app files and ${shotNote}; dossier.json is ${statSync(dossierPath).size} bytes`,
  );
}

try {
  run();
} catch (failure) {
  console.error(`gta6-trophy-guide-01 hand-in failed: ${(failure as Error).message}`);
  process.exitCode = 1;
}
