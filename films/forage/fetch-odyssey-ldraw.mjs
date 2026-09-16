#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = process.argv[2] || path.join(here, "ODYSSEY-REAL-LDRAW-FORAGE-v0.1.json");
const outRoot = process.argv[3] || path.join(here, "odyssey-ldraw-corpus");

const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
await fs.mkdir(path.join(outRoot, "models"), { recursive: true });
await fs.mkdir(path.join(outRoot, "parts"), { recursive: true });
await fs.mkdir(path.join(outRoot, "metadata"), { recursive: true });

function gitBlobSha(buf) {
  const header = Buffer.from(`blob ${buf.length}\0`, "utf8");
  return crypto.createHash("sha1").update(Buffer.concat([header, buf])).digest("hex");
}

function safeName(s) {
  return s.replaceAll("/", "_");
}

let ok = 0, failed = 0, manual = 0;

for (const e of manifest.entries) {
  if (!e.download_url) {
    console.log(`MANUAL  ${e.id} ${e.name}  ${e.source_page || ""}`);
    manual++;
    continue;
  }
  const dir = e.kind === "dat" ? "parts" : "models";
  const dest = path.join(outRoot, dir, safeName(e.filename));
  try {
    const res = await fetch(e.download_url, {
      headers: { "User-Agent": "odyssey-halfworld-ldraw-forage/0.1" },
      redirect: "follow"
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (e.git_blob_sha) {
      const got = gitBlobSha(buf);
      if (got !== e.git_blob_sha) {
        throw new Error(`Git blob SHA mismatch: expected ${e.git_blob_sha}, got ${got}`);
      }
    }
    await fs.writeFile(dest, buf);
    console.log(`OK      ${e.id.padEnd(6)} ${String(buf.length).padStart(8)} B  ${dest}`);
    ok++;
  } catch (err) {
    console.error(`FAIL    ${e.id} ${e.name}: ${err.message}`);
    failed++;
  }
}

await fs.writeFile(
  path.join(outRoot, "metadata", "manifest.json"),
  JSON.stringify(manifest, null, 2)
);

console.log(`\nDone. ${ok} downloaded, ${manual} manual, ${failed} failed.`);
if (failed) process.exitCode = 1;
