#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const MANIFEST_PATH = path.join(__dirname, 'wag-viewer-prime-integration-20251112-055341 copy', 'ldraw-parts-manifest.json');
const GEOMETRY_PATH = path.join(__dirname, 'wag-viewer-prime-integration-20251112-055341 copy', 'ldraw-part-geometry.json');
const OUTPUT_PATH = path.join(__dirname, 'wag-viewer-prime-integration-20251112-055341 copy', 'large-ready-mades.json');

const INTERESTING_HEADS = new Set([
  'baseplate',
  'boat hull floating',
  'train track',
  'container',
  'container box',
  'sail',
  'arch',
  'panel',
  'door',
  'window',
  'glass for window',
  'wing',
  'car base',
  'boat hull',
  'train base'
]);

function extractHead(desc) {
  if (!desc) return null;
  let text = desc.trim();
  if (!text) return null;
  const first = text.charAt(0);
  if (first === '~' || first === '=') return null;
  text = text.toLowerCase();
  const m = text.match(/^[^0-9,.;()]+/);
  if (!m) return null;
  const head = m[0].trim().replace(/\s+/g, ' ');
  return head || null;
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  let geometryIndex = null;
  try {
    const geo = JSON.parse(fs.readFileSync(GEOMETRY_PATH, 'utf8'));
    geometryIndex = new Map();
    (geo.parts || []).forEach(p => {
      // Key by path; fall back to filename
      const key = (p.path || '').toLowerCase();
      if (key) geometryIndex.set(key, p);
      if (p.filename) geometryIndex.set(p.filename.toLowerCase(), p);
    });
  } catch (e) {
    console.warn('⚠️  Geometry file not available, falling back to size-only ranking');
  }
  const groups = {};
  let totalConsidered = 0;

  (manifest.categories || []).forEach(cat => {
    if (!Array.isArray(cat.files)) return;
    cat.files.forEach(part => {
      const head = extractHead(part.description || part.name || '');
      if (!head) return;
      if (!INTERESTING_HEADS.has(head)) return;
      const rel = (part.relativePath || part.path || '').toLowerCase();
      let geo = null;
      if (geometryIndex) {
        geo = geometryIndex.get(rel) || geometryIndex.get((part.filename || '').toLowerCase()) || null;
      }
      totalConsidered++;
      if (!groups[head]) groups[head] = [];
      groups[head].push({
        filename: part.filename,
        path: part.relativePath || part.path,
        sizeBytes: part.size || 0,
        faceCount: geo ? geo.faceCount : null,
        triCount: geo ? geo.triCount : null,
        quadCount: geo ? geo.quadCount : null,
        category: cat.label || cat.type || 'Uncategorized',
        description: part.description,
        author: part.author || null
      });
    });
  });

  Object.keys(groups).forEach(head => {
    groups[head].sort((a, b) => {
      const fa = a.faceCount || 0;
      const fb = b.faceCount || 0;
      if (fb !== fa) return fb - fa;
      const sa = a.sizeBytes || 0;
      const sb = b.sizeBytes || 0;
      return sb - sa;
    });
    groups[head] = groups[head].slice(0, 100);
  });

  const output = {
    generated: new Date().toISOString(),
    manifest: path.relative(process.cwd(), MANIFEST_PATH),
    geometry: path.relative(process.cwd(), GEOMETRY_PATH),
    totalConsidered,
    heads: Array.from(INTERESTING_HEADS),
    groups
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf8');
  console.log('✅ Large ready-made candidates written to', OUTPUT_PATH);
}

main();
