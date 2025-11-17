#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const TAXO_PRIMITIVE_THRESHOLD = 30;

const TAXONOMY_PATH = path.join(__dirname, 'wag-viewer-prime-integration-20251112-055341 copy', 'parts-taxonomy.json');
const OUTPUT_PATH = path.join(__dirname, 'wag-viewer-prime-integration-20251112-055341 copy', 'taxonomy-primitives.json');

function forEachTaxonomyPart(node, cb) {
  if (!node) return;
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      const item = node[i];
      if (item && typeof item === 'object') {
        if (item.filename && item.description) cb(item);
        forEachTaxonomyPart(item, cb);
      }
    }
  } else if (typeof node === 'object') {
    const values = Object.values(node);
    for (let i = 0; i < values.length; i++) {
      forEachTaxonomyPart(values[i], cb);
    }
  }
}

function extractTaxonomyHeadPhrase(description) {
  if (!description) return null;
  let desc = description.trim();
  if (!desc) return null;
  const firstChar = desc.charAt(0);
  if (firstChar === '~' || firstChar === '=') return null;
  desc = desc.toLowerCase();
  const m = desc.match(/^[^0-9,.;()]+/);
  if (!m) return null;
  let head = m[0].trim().replace(/\s+/g, ' ');
  if (!head) return null;
  return head;
}

function tagTaxonomyPrimitiveDomain(head) {
  if (!head) return 'misc';
  if (/wheel|tyre/.test(head)) return 'vehicle';
  if (/windscreen|windshield/.test(head)) return 'vehicle';
  if (/boat hull/.test(head)) return 'vehicle-ship';
  if (/train base|train /.test(head)) return 'vehicle-train';
  if (/fuselage|wing |propeller|jet engine|cockpit/.test(head)) return 'vehicle-air';
  if (/door |window |panel |wall |roof|arch /.test(head)) return 'architecture';
  if (/tree |plant |leaf |bush|palm /.test(head)) return 'environment';
  if (/technic|gear |axle |beam |liftarm|engine /.test(head)) return 'technic';
  return 'misc';
}

function main() {
  const raw = fs.readFileSync(TAXONOMY_PATH, 'utf8');
  const taxonomy = JSON.parse(raw);

  if (!taxonomy || !taxonomy.kingdoms) {
    console.error('No kingdoms field found in taxonomy JSON');
    process.exit(1);
  }

  const freq = {};
  let total = 0;

  forEachTaxonomyPart(taxonomy.kingdoms, (part) => {
    const head = extractTaxonomyHeadPhrase(part.description);
    if (!head) return;
    freq[head] = (freq[head] || 0) + 1;
    total++;
  });

  const entries = Object.entries(freq)
    .map(([head, count]) => ({ head, count, domain: tagTaxonomyPrimitiveDomain(head) }))
    .sort((a, b) => b.count - a.count);

  const primitives = entries.filter(e => e.count >= TAXO_PRIMITIVE_THRESHOLD);

  const bucketsByDomain = primitives.reduce((acc, p) => {
    if (!acc[p.domain]) acc[p.domain] = [];
    acc[p.domain].push(p);
    return acc;
  }, {});

  Object.keys(bucketsByDomain).forEach(domain => {
    bucketsByDomain[domain] = bucketsByDomain[domain].slice(0, 64);
  });

  const output = {
    generated: new Date().toISOString(),
    sourceTaxonomy: path.relative(process.cwd(), TAXONOMY_PATH),
    totalPartsVisited: total,
    primitiveThreshold: TAXO_PRIMITIVE_THRESHOLD,
    primitiveCount: primitives.length,
    primitives,
    bucketsByDomain
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf8');
  console.log('✅ Taxonomy primitives built');
  console.log('   Parts visited:', total);
  console.log('   Primitive threshold:', TAXO_PRIMITIVE_THRESHOLD);
  console.log('   Primitive count:', primitives.length);
  console.log('   Output:', OUTPUT_PATH);
}

main();
