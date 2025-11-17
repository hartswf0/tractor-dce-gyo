#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const MANIFEST_PATH = path.join(__dirname, 'wag-viewer-prime-integration-20251112-055341 copy', 'ldraw-parts-manifest.json');
const LDRAW_ROOT = path.join(__dirname, 'wag-viewer-prime-integration-20251112-055341 copy', 'ldraw');
const OUTPUT_PATH = path.join(__dirname, 'wag-viewer-prime-integration-20251112-055341 copy', 'ldraw-part-geometry.json');

function countFacesForFile(absPath) {
  let tri = 0;
  let quad = 0;
  try {
    const text = fs.readFileSync(absPath, 'utf8');
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const c = line.charAt(0);
      if (c === '3') tri++;
      else if (c === '4') quad++;
    }
  } catch (err) {
    return { tri: 0, quad: 0, error: err.message };
  }
  return { tri, quad, error: null };
}

function main() {
  console.log('🔎 Scanning LDraw parts for geometry metrics...');
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const out = [];
  let total = 0;
  let missing = 0;

  (manifest.categories || []).forEach(cat => {
    // Focus on real parts; skip primitives/subparts categories if present
    if (cat.type && cat.type !== 'parts') return;
    if (!Array.isArray(cat.files)) return;

    cat.files.forEach(part => {
      const rel = part.relativePath || part.path;
      if (!rel) return;
      // Skip obvious subparts in /s/ folders
      if (rel.toLowerCase().includes('/s/')) return;
      const abs = path.join(LDRAW_ROOT, rel.replace(/^\.\//, ''));
      const res = countFacesForFile(abs);
      if (!res.error) {
        out.push({
          filename: part.filename,
          path: rel,
          triCount: res.tri,
          quadCount: res.quad,
          faceCount: res.tri + res.quad,
          sizeBytes: part.size || null,
          description: part.description || null,
          category: cat.label || cat.type || 'Uncategorized'
        });
        total++;
      } else {
        missing++;
      }
    });
  });

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify({
    generated: new Date().toISOString(),
    manifest: path.relative(process.cwd(), MANIFEST_PATH),
    ldrawRoot: path.relative(process.cwd(), LDRAW_ROOT),
    totalParts: total,
    missingFiles: missing,
    parts: out
  }, null, 2), 'utf8');

  console.log('✅ Geometry metrics written to', OUTPUT_PATH);
  console.log('   Parts processed:', total);
  console.log('   Missing files:', missing);
}

main();
