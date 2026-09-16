#!/usr/bin/env node
/**
 * ODYSSEY LDRAW FORAGE — MPD/LDR INGEST
 *
 * Parse real LDraw geometry before it enters the donor corpus.
 * No dependencies. No downloading. No geometry is rehosted.
 *
 * Usage:
 *   node odyssey-forage/ingest-mpd.mjs path/to/model.mpd
 *   node odyssey-forage/ingest-mpd.mjs path/to/model.mpd --id 6285-1
 *   node odyssey-forage/ingest-mpd.mjs path/to/model.mpd --ldraw ~/ldraw
 *   node odyssey-forage/ingest-mpd.mjs path/to/model.mpd --out parsed.json
 *
 * --ldraw validates Type-1 references against a local LDraw installation.
 * Common lookup roots checked: parts/, p/, models/, and the input directory.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

function usage(code = 0) {
  console.log(`ODYSSEY LDRAW FORAGE — ingest-mpd\n\n` +
    `Usage:\n` +
    `  node odyssey-forage/ingest-mpd.mjs <file.mpd|file.ldr> [options]\n\n` +
    `Options:\n` +
    `  --id <donor-id>    Attach donor corpus id\n` +
    `  --ldraw <dir>       Validate referenced parts against local LDraw library\n` +
    `  --out <file.json>   Write JSON instead of stdout only\n` +
    `  --pretty            Pretty JSON (default)\n` +
    `  --compact           Compact JSON\n`);
  process.exit(code);
}

function expandHome(p) {
  if (!p) return p;
  return p === '~' ? os.homedir() : p.startsWith('~/') ? path.join(os.homedir(), p.slice(2)) : p;
}

function parseArgs(argv) {
  const out = { input: null, donorId: null, ldraw: null, output: null, pretty: true };
  const a = [...argv];
  while (a.length) {
    const x = a.shift();
    if (x === '-h' || x === '--help') usage(0);
    if (x === '--id') out.donorId = a.shift() ?? null;
    else if (x === '--ldraw') out.ldraw = expandHome(a.shift() ?? '');
    else if (x === '--out') out.output = a.shift() ?? null;
    else if (x === '--compact') out.pretty = false;
    else if (x === '--pretty') out.pretty = true;
    else if (!x.startsWith('-') && !out.input) out.input = expandHome(x);
    else if (x.startsWith('-')) throw new Error(`Unknown option: ${x}`);
  }
  if (!out.input) usage(1);
  return out;
}

const normRef = s => s.replace(/\\/g, '/').trim();
const lower = s => normRef(s).toLowerCase();
const ext = s => path.extname(lower(s));

function parseType1(line, lineNo, owner) {
  // LDraw type 1: 1 colour x y z a b c d e f g h i filename
  // filename may contain spaces, so split only the first 14 tokens.
  const tok = line.trim().split(/\s+/);
  if (tok[0] !== '1' || tok.length < 15) return null;
  const nums = tok.slice(2, 14).map(Number);
  const ref = normRef(tok.slice(14).join(' '));
  return {
    line: lineNo,
    owner,
    color: Number(tok[1]),
    position: nums.slice(0, 3),
    matrix: nums.slice(3, 12),
    ref,
    refLower: lower(ref),
    extension: ext(ref)
  };
}

function parseLDraw(text, inputPath) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  const sections = [];
  const sectionByName = new Map();
  const fallbackName = path.basename(inputPath);
  let current = null;
  let sawFileMeta = false;

  function section(name, lineNo) {
    const clean = normRef(name || fallbackName);
    const s = { name: clean, nameLower: lower(clean), startLine: lineNo, endLine: lineNo, refs: [], lineCount: 0 };
    sections.push(s);
    sectionByName.set(s.nameLower, s);
    current = s;
    return s;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const n = i + 1;
    const fileMatch = line.match(/^\s*0\s+FILE\s+(.+?)\s*$/i);
    const noFile = /^\s*0\s+NOFILE\s*$/i.test(line);
    if (fileMatch) {
      sawFileMeta = true;
      if (current) current.endLine = n - 1;
      section(fileMatch[1], n);
      continue;
    }
    if (noFile) {
      if (current) current.endLine = n;
      current = null;
      continue;
    }
    if (!current) section(fallbackName, n);
    current.lineCount++;
    current.endLine = n;
    const r = parseType1(line, n, current.name);
    if (r) current.refs.push(r);
  }

  // In plain LDR files there is no 0 FILE. Avoid calling the fallback section an embedded submodel.
  return { lines, sections, sectionByName, sawFileMeta };
}

function classify(parsed) {
  const embedded = new Set(parsed.sections.map(s => s.nameLower));
  const allRefs = parsed.sections.flatMap(s => s.refs);

  for (const r of allRefs) {
    if (embedded.has(r.refLower)) r.kind = 'embedded-submodel';
    else if (r.extension === '.dat') r.kind = 'part';
    else if (r.extension === '.ldr' || r.extension === '.mpd') r.kind = 'external-submodel';
    else r.kind = 'other-reference';
  }

  const counts = new Map();
  for (const r of allRefs) {
    const key = `${r.kind}|${r.refLower}`;
    const v = counts.get(key) || { ref: r.ref, kind: r.kind, count: 0, owners: new Set() };
    v.count++;
    v.owners.add(r.owner);
    counts.set(key, v);
  }

  return { allRefs, counts };
}

function graphFor(parsed) {
  const embedded = new Set(parsed.sections.map(s => s.nameLower));
  const nodes = parsed.sections.map(s => ({
    name: s.name,
    refs: s.refs
      .filter(r => r.kind === 'embedded-submodel')
      .map(r => r.ref)
  }));

  // Detect simple cycles. Cycles are legal to report but indicate unusable recursion for extraction.
  const by = new Map(nodes.map(n => [lower(n.name), n]));
  const cycles = [];
  const visiting = new Set();
  const visited = new Set();
  const stack = [];
  function dfs(k) {
    if (visiting.has(k)) {
      const at = stack.indexOf(k);
      cycles.push(stack.slice(at).concat(k).map(x => by.get(x)?.name || x));
      return;
    }
    if (visited.has(k)) return;
    visiting.add(k); stack.push(k);
    const n = by.get(k);
    for (const ref of n?.refs || []) {
      const q = lower(ref);
      if (embedded.has(q)) dfs(q);
    }
    stack.pop(); visiting.delete(k); visited.add(k);
  }
  for (const k of by.keys()) dfs(k);
  return { nodes, cycles };
}

function candidatePaths(ref, inputDir, ldrawRoot) {
  const clean = normRef(ref);
  const native = clean.split('/').join(path.sep);
  const arr = [path.join(inputDir, native)];
  if (ldrawRoot) {
    arr.push(
      path.join(ldrawRoot, native),
      path.join(ldrawRoot, 'parts', native),
      path.join(ldrawRoot, 'p', native),
      path.join(ldrawRoot, 'models', native),
      path.join(ldrawRoot, 'unofficial', 'parts', native),
      path.join(ldrawRoot, 'unofficial', 'p', native)
    );
  }
  return [...new Set(arr)];
}

function resolveRefs(parsed, ldrawRoot, inputPath) {
  const inputDir = path.dirname(path.resolve(inputPath));
  const embedded = new Set(parsed.sections.map(s => s.nameLower));
  const unique = new Map();
  for (const s of parsed.sections) {
    for (const r of s.refs) {
      if (embedded.has(r.refLower)) continue;
      if (!unique.has(r.refLower)) unique.set(r.refLower, r.ref);
    }
  }

  const resolved = [];
  const unresolved = [];
  for (const [key, ref] of unique) {
    const candidates = candidatePaths(ref, inputDir, ldrawRoot);
    const hit = candidates.find(p => fs.existsSync(p));
    (hit ? resolved : unresolved).push(hit
      ? { ref, path: path.resolve(hit) }
      : { ref, searched: ldrawRoot ? candidates.map(p => path.resolve(p)) : [path.resolve(candidates[0])] });
  }
  return { resolved, unresolved, checkedAgainstLDrawRoot: ldrawRoot ? path.resolve(ldrawRoot) : null };
}

function main() {
  let args;
  try { args = parseArgs(process.argv.slice(2)); }
  catch (e) { console.error(e.message); usage(1); }

  const input = path.resolve(args.input);
  if (!fs.existsSync(input)) throw new Error(`File not found: ${input}`);
  const text = fs.readFileSync(input, 'utf8');
  const parsed = parseLDraw(text, input);
  const { allRefs, counts } = classify(parsed);
  const graph = graphFor(parsed);
  const resolution = resolveRefs(parsed, args.ldraw, input);

  const unique = [...counts.values()]
    .map(v => ({ ref: v.ref, kind: v.kind, count: v.count, owners: [...v.owners] }))
    .sort((a, b) => a.kind.localeCompare(b.kind) || b.count - a.count || a.ref.localeCompare(b.ref));

  const partRefs = unique.filter(x => x.kind === 'part');
  const embeddedRefs = unique.filter(x => x.kind === 'embedded-submodel');
  const externalSubmodelRefs = unique.filter(x => x.kind === 'external-submodel');
  const otherRefs = unique.filter(x => x.kind === 'other-reference');

  const report = {
    schemaVersion: 1,
    donorId: args.donorId,
    file: path.basename(input),
    absolutePath: input,
    format: path.extname(input).slice(1).toLowerCase(),
    bytes: fs.statSync(input).size,
    hasMPDFileSections: parsed.sawFileMeta,
    lineCount: parsed.lines.length,
    stats: {
      submodelSections: parsed.sections.length,
      type1Instances: allRefs.length,
      uniquePartRefs: partRefs.length,
      uniqueEmbeddedSubmodelRefs: embeddedRefs.length,
      uniqueExternalSubmodelRefs: externalSubmodelRefs.length,
      uniqueOtherRefs: otherRefs.length,
      unresolvedExternalRefs: resolution.unresolved.length
    },
    submodels: parsed.sections.map(s => ({
      name: s.name,
      startLine: s.startLine,
      endLine: s.endLine,
      type1Instances: s.refs.length,
      childSubmodels: s.refs.filter(r => r.kind === 'embedded-submodel').map(r => r.ref),
      directParts: [...new Set(s.refs.filter(r => r.kind === 'part').map(r => r.ref))]
    })),
    graph,
    partRefs,
    embeddedSubmodelRefs: embeddedRefs,
    externalSubmodelRefs,
    otherRefs,
    resolution,
    verdict: {
      editableGeometry: true,
      structurallyParseable: graph.cycles.length === 0,
      allExternalRefsResolved: resolution.unresolved.length === 0,
      note: args.ldraw
        ? 'Resolution was checked against the supplied local LDraw library and the model directory.'
        : 'Supply --ldraw /path/to/ldraw before promoting a donor to fully validated GREEN.'
    }
  };

  const json = JSON.stringify(report, null, args.pretty ? 2 : 0) + '\n';
  if (args.output) {
    const dest = path.resolve(expandHome(args.output));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, json);
    console.error(`Wrote ${dest}`);
  }
  process.stdout.write(json);
}

try { main(); }
catch (e) {
  console.error(`ingest-mpd: ${e.message}`);
  process.exit(1);
}
