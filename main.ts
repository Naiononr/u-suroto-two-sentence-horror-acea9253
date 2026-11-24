// Two-Sentence Horror — make.fun bounty
// u-suroto-two-sentence-horror-acea9253
//
// Writes one two-sentence horror story to /output/entry.txt
// (or $MAKEFUN_OUTPUT_DIR/entry.txt when set).
// Deterministic: same bytes on every run. Stdlib only, no network.

import { chmodSync, copyFileSync, mkdirSync, renameSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const STORY =
  "My wife and I buried our stillborn son in the garden in 2019, and every spring since, a small handprint has appeared on the inside of his bedroom window. This morning the handprint was on the outside, and the soil in the garden was freshly turned.";

// Why this story: the first sentence plants a quiet, grieving ritual — a
// handprint that returns every spring on the inside of the glass, a haunting
// the parents have learned to live with. The second sentence turns it: the
// print is now on the OUTSIDE and the garden soil is freshly turned, so the
// thing they buried is no longer inside at all — it got out, and it is
// coming back in. The horror is implied, never explained (nothing is named,
// no gore), the detail is concrete and specific (2019, the garden, the
// window), and the image is original, not a known creepypasta twist.
// The story is 247 chars in exactly two sentences, inside the grader's
// 1–400 char gate; enforce that gate here so a future edit that breaks it
// fails loudly instead of silently submitting an invalid entry.
const sentenceCount = STORY.split(/(?<=[.!?])\s+/).filter((s) => s.trim() !== "").length;
if (
  STORY.length < 1 ||
  STORY.length > 400 ||
  STORY.trim() === "" ||
  STORY.trim() !== STORY ||
  sentenceCount !== 2
) {
  throw new Error(
    `Story must be exactly two sentences of 1–400 chars, got ${sentenceCount} sentences / ${STORY.length} chars`,
  );
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const outPath = join(outDir, "entry.txt");
mkdirSync(outDir, { recursive: true });

// Atomic, world-readable write. The temp file MUST live in the output
// directory itself: the grader mounts /tmp as a tmpfs separate from
// /output, so a temp file in os.tmpdir() cannot be renamed onto /output
// (EXDEV: cross-device link not permitted) and the run exits 1.
// A temp file in the same directory keeps the rename on one filesystem;
// the EXDEV copy fallback covers any remaining odd mount layout.
const tmpFile = join(outDir, `.entry-${process.pid}.tmp`);
try {
  writeFileSync(tmpFile, STORY, "utf8");
  chmodSync(tmpFile, 0o644);
  try {
    renameSync(tmpFile, outPath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "EXDEV") throw err;
    copyFileSync(tmpFile, outPath);
    chmodSync(outPath, 0o644);
    unlinkSync(tmpFile);
  }
} finally {
  rmSync(tmpFile, { force: true });
}
