#!/usr/bin/env node

// build-ip-index.js
// Scan the project for references to movie/TV IP (Simpsons, Gremlins, etc.)
// and write a summary to ip-index.json that tools like Movieator/Worldinator
// can consume.

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

// Seed IP lexicon. This is intentionally small and easy to extend.
const IP_CONFIG = {
  simpsons: {
    label: 'The Simpsons',
    keywords: ['simpsons', 'springfield', 'bart', 'lisa', 'marge', 'homer', 'maggie']
  },
  gremlins: {
    label: 'Gremlins',
    keywords: ['gremlin', 'gremlins']
  },
  star_wars: {
    label: 'Star Wars',
    keywords: ['star wars', 'tatooine', 'x-wing', 'death star', 'millennium falcon']
  },
  powerpuff: {
    label: 'The Powerpuff Girls',
    keywords: ['powerpuff', 'townsville', 'mojo jojo']
  },
  mouse: {
    label: 'Mouse / Mickey-like',
    keywords: ['mickey', 'mouse', 'disney']
  }
};

// File extensions we consider textual and worth scanning.
const TEXT_EXTS = new Set([
  '.mpd', '.ldr',
  '.md', '.markdown',
  '.json', '.html', '.htm',
  '.txt', '.js'
]);

// Directories to skip entirely.
const IGNORE_DIRS = new Set([
  '.git',
  'ldraw',
  'node_modules'
]);

function isTextFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return TEXT_EXTS.has(ext);
}

function walkDir(dir, files) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(ROOT, fullPath);

    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      walkDir(fullPath, files);
    } else if (entry.isFile()) {
      if (isTextFile(entry.name)) {
        files.push({ fullPath, relPath });
      }
    }
  }
}

function scanFileForIP(file, index) {
  const lowerPath = file.relPath.toLowerCase();
  let content = '';

  try {
    content = fs.readFileSync(file.fullPath, 'utf8');
  } catch (err) {
    return; // skip unreadable files
  }

  const lowerContent = content.toLowerCase();

  for (const [ipId, cfg] of Object.entries(IP_CONFIG)) {
    const keywords = cfg.keywords || [];
    for (const kw of keywords) {
      const needle = kw.toLowerCase();

      // Path match
      if (lowerPath.includes(needle)) {
        recordHit(index, ipId, file.relPath, 'path', null);
      }

      // Content match (record first snippet per keyword)
      let pos = lowerContent.indexOf(needle);
      if (pos !== -1) {
        const start = Math.max(0, pos - 60);
        const end = Math.min(content.length, pos + needle.length + 60);
        const snippet = content.slice(start, end).replace(/\s+/g, ' ').trim();
        recordHit(index, ipId, file.relPath, 'content', snippet);
      }
    }
  }
}

function recordHit(index, ipId, relPath, matchType, snippet) {
  let ipEntry = index.ips.find((ip) => ip.id === ipId);
  if (!ipEntry) {
    const cfg = IP_CONFIG[ipId] || {};
    ipEntry = {
      id: ipId,
      label: cfg.label || ipId,
      keywords: cfg.keywords || [],
      hits: []
    };
    index.ips.push(ipEntry);
  }

  // Avoid duplicating exact same hit type for a file.
  const already = ipEntry.hits.find(
    (h) => h.file === relPath && h.matchType === matchType && (!snippet || h.snippet === snippet)
  );
  if (already) return;

  const hit = { file: relPath, matchType };
  if (snippet) hit.snippet = snippet;
  ipEntry.hits.push(hit);
}

function buildIndex() {
  const files = [];
  walkDir(ROOT, files);

  const index = {
    generatedAt: new Date().toISOString(),
    root: ROOT,
    ips: []
  };

  files.forEach((file) => {
    scanFileForIP(file, index);
  });

  // Sort for readability
  index.ips.forEach((ip) => {
    ip.hits.sort((a, b) => a.file.localeCompare(b.file));
  });
  index.ips.sort((a, b) => a.id.localeCompare(b.id));

  const outPath = path.join(ROOT, 'ip-index.json');
  fs.writeFileSync(outPath, JSON.stringify(index, null, 2), 'utf8');
  console.log(`IP index written to ${outPath}`);
}

buildIndex();
