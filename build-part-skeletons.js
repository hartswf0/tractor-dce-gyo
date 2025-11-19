#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Keep paths parallel with other build scripts like build-part-geometry.js
const INTEGRATION_DIR = path.join(__dirname, 'wag-viewer-prime-integration-20251112-055341 copy');
const MANIFEST_PATH = path.join(INTEGRATION_DIR, 'ldraw-parts-manifest.json');
const LDRAW_ROOT = path.join(INTEGRATION_DIR, 'ldraw');
const OUTPUT_PATH = path.join(INTEGRATION_DIR, 'ldraw-part-skeletons.json');

function main() {
  console.log('🦴 Building LDraw part skeleton registry (stub)...');

  const manifestRaw = fs.readFileSync(MANIFEST_PATH, 'utf8');
  const manifest = JSON.parse(manifestRaw);

  const partsOut = [];

  (manifest.categories || []).forEach(cat => {
    // Focus on real parts, mirror build-part-geometry.js behavior
    if (cat.type && cat.type !== 'parts') return;
    if (!Array.isArray(cat.files)) return;

    cat.files.forEach(file => {
      if (!file) return;
      const filename = file.filename || '';
      const relPath = file.relativePath || file.path || '';
      if (!filename || !relPath) return;

      const lowerPath = relPath.toLowerCase();
      // Skip obvious subparts and primitives for now; we want top-level parts
      if (lowerPath.includes('/s/')) return;
      if (lowerPath.includes('/p/')) return;

      partsOut.push({
        filename,
        path: relPath,
        description: file.description || null,
        category: cat.label || cat.type || 'Parts',
        // Placeholder skeleton; to be filled by a later pass that actually
        // analyzes geometry and detects studs/ports in local coordinates.
        skeleton: {
          studs: [],
          ports: []
        }
      });
    });
  });

  const payload = {
    generated: new Date().toISOString(),
    manifest: path.relative(process.cwd(), MANIFEST_PATH),
    ldrawRoot: path.relative(process.cwd(), LDRAW_ROOT),
    totalParts: partsOut.length,
    parts: partsOut
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2), 'utf8');

  console.log('✅ Part skeleton registry written to', OUTPUT_PATH);
  console.log('   Parts with skeleton entries:', partsOut.length);
}

main();
