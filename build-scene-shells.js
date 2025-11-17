#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const LARGE_READY_MADES_PATH = path.join(__dirname, 'wag-viewer-prime-integration-20251112-055341 copy', 'large-ready-mades.json');
const OUTPUT_PATH = path.join(__dirname, 'wag-viewer-prime-integration-20251112-055341 copy', 'scene-shells.json');

// Heads that we treat as potential scene shells. Baseplates and boat hulls
// are primary shells (full landscapes). Tracks/containers can be secondary
// shells or scene features.
const SCENE_HEAD_META = {
  'baseplate': { kind: 'baseplate', primary: true },
  'boat hull floating': { kind: 'boat-hull-floating', primary: true },
  'boat hull': { kind: 'boat-hull', primary: true },
  'train track': { kind: 'train-track', primary: false },
  'container': { kind: 'container', primary: false },
  'container box': { kind: 'container', primary: false }
};

function inferSceneType(head, description) {
  const desc = (description || '').toLowerCase();

  if (head === 'baseplate') {
    if (desc.includes('crater')) return 'space_crater';
    if (desc.includes('canyon')) return 'canyon_terrain';
    if (desc.includes('river') || desc.includes('lagoon') || desc.includes('stream')) return 'water_terrain';
    if (desc.includes('road')) return 'road_network';
    if (desc.includes('landing pad')) return 'landing_pad';
    if (desc.includes('raised')) return 'raised_terrain';
    if (desc.includes('island')) return 'island_terrain';
    return 'generic_baseplate';
  }

  if (head === 'boat hull floating' || head === 'boat hull') {
    if (desc.includes('bottom')) return 'ship_hull_bottom';
    if (desc.includes('deck') || desc.includes('top')) return 'ship_hull_top';
    return 'ship_hull';
  }

  if (head === 'train track') return 'rail_network';
  if (head === 'container' || head === 'container box') return 'freight_unit';

  return 'unknown';
}

function inferTags(head, description) {
  const desc = (description || '').toLowerCase();
  const tags = new Set();

  tags.add(head.replace(/\s+/g, '_'));

  if (desc.includes('crater')) tags.add('crater');
  if (desc.includes('road')) tags.add('road');
  if (desc.includes('river')) tags.add('river');
  if (desc.includes('lagoon')) tags.add('lagoon');
  if (desc.includes('stream')) tags.add('stream');
  if (desc.includes('canyon')) tags.add('canyon');
  if (desc.includes('landing pad')) tags.add('landing_pad');
  if (desc.includes('space')) tags.add('space');
  if (desc.includes('raised')) tags.add('raised');
  if (desc.includes('island')) tags.add('island');
  if (desc.includes('boat') || desc.includes('hull')) tags.add('boat');
  if (desc.includes('train')) tags.add('train');
  if (desc.includes('container')) tags.add('container');

  return Array.from(tags);
}

function main() {
  const large = JSON.parse(fs.readFileSync(LARGE_READY_MADES_PATH, 'utf8'));
  const shells = [];

  Object.entries(large.groups || {}).forEach(([head, items]) => {
    const meta = SCENE_HEAD_META[head];
    if (!meta) return;

    // Take the top N most complex shells per head
    const limit = meta.primary ? 32 : 16;
    (items || []).slice(0, limit).forEach(entry => {
      shells.push({
        head,
        kind: meta.kind,
        primary: meta.primary,
        filename: entry.filename,
        path: entry.path,
        description: entry.description,
        category: entry.category,
        author: entry.author || null,
        faceCount: entry.faceCount || null,
        triCount: entry.triCount || null,
        quadCount: entry.quadCount || null,
        sizeBytes: entry.sizeBytes || entry.size || null,
        sceneType: inferSceneType(head, entry.description),
        tags: inferTags(head, entry.description)
      });
    });
  });

  const output = {
    generated: new Date().toISOString(),
    source: path.relative(process.cwd(), LARGE_READY_MADES_PATH),
    totalShells: shells.length,
    shells
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf8');
  console.log('✅ Scene shells written to', OUTPUT_PATH);
  console.log('   Total shells:', shells.length);
}

main();
