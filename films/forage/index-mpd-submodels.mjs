#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const root = process.argv[2] || "./odyssey-ldraw-corpus/models";
const out = process.argv[3] || "./odyssey-ldraw-corpus/submodels-index.json";

const files = (await fs.readdir(root)).filter(f => /\.(mpd|ldr)$/i.test(f));
const rows = [];

for (const file of files) {
  const text = await fs.readFile(path.join(root, file), "utf8");
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  let current = { name: "__ROOT__", start: 1, refs: [], partRefs: [] };
  const chunks = [];
  function close(end) {
    current.end = end;
    chunks.push(current);
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fm = line.match(/^0\s+FILE\s+(.+)$/i);
    if (fm) {
      if (i > 0 || current.name !== "__ROOT__") close(i);
      current = { name: fm[1].trim(), start: i + 1, refs: [], partRefs: [] };
      continue;
    }
    const ref = line.match(/^1\s+\S+\s+(?:-?\d+(?:\.\d+)?\s+){12}(.+)$/);
    if (ref) {
      const target = ref[1].trim();
      current.refs.push(target);
      if (/\.dat$/i.test(target)) current.partRefs.push(target);
    }
  }
  close(lines.length);
  rows.push({
    sourceFile: file,
    submodels: chunks.map(c => ({
      ...c,
      uniquePartRefs: [...new Set(c.partRefs)]
    }))
  });
}
await fs.mkdir(path.dirname(out), { recursive: true });
await fs.writeFile(out, JSON.stringify(rows, null, 2));
console.log(`Indexed ${rows.length} model files -> ${out}`);
