#!/usr/bin/env node

/**
 * GRACE PARTS TAXONOMY BUILDER
 * 
 * Analyzes the parts manifest and builds a hierarchical taxonomy
 * Like biological classification: Kingdom → Phylum → Class → Order → Family → Genus → Species
 * 
 * Generates meta-index.json for the parts catalog browser
 */

const fs = require('fs');
const path = require('path');

const MANIFEST_PATH = './wag-viewer-prime-integration-20251112-055341 copy/ldraw-parts-manifest.json';
const OUTPUT_PATH = './wag-viewer-prime-integration-20251112-055341 copy/parts-taxonomy.json';

console.log('🔬 GRACE PARTS TAXONOMY BUILDER\n');

// Load manifest
console.log('📖 Loading manifest...');
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
const allParts = [];

if (manifest.categories && Array.isArray(manifest.categories)) {
    manifest.categories.forEach(category => {
        if (category.files && Array.isArray(category.files)) {
            category.files.forEach(part => {
                allParts.push({
                    ...part,
                    category: category.label || category.type || 'Uncategorized'
                });
            });
        }
    });
}

console.log(`✅ Loaded ${allParts.length.toLocaleString()} parts\n`);

// ═══════════════════════════════════════════════════════════════
// TAXONOMY EXTRACTION FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function extractKingdom(desc, name) {
    const text = (desc || name || '').toLowerCase();
    
    // Kingdom level - main part families (expanded!)
    if (text.includes('minifig') || text.includes('minifigure')) return 'MINIFIG';
    if (text.includes('brick')) return 'BRICK';
    if (text.includes('plate')) return 'PLATE';
    if (text.includes('tile')) return 'TILE';
    if (text.includes('slope')) return 'SLOPE';
    if (text.includes('wedge')) return 'WEDGE';
    if (text.includes('panel')) return 'PANEL';
    if (text.includes('technic')) return 'TECHNIC';
    if (text.includes('wheel') || text.includes('tire')) return 'WHEEL';
    if (text.includes('window')) return 'WINDOW';
    if (text.includes('door')) return 'DOOR';
    if (text.includes('hinge')) return 'HINGE';
    if (text.includes('axle')) return 'AXLE';
    if (text.includes('beam')) return 'BEAM';
    if (text.includes('connector')) return 'CONNECTOR';
    if (text.includes('duplo')) return 'DUPLO';
    if (text.includes('sticker') || text.includes('decal')) return 'STICKER';
    if (text.includes('flag')) return 'FLAG';
    if (text.includes('plant') || text.includes('tree') || text.includes('flower')) return 'PLANT';
    if (text.includes('animal')) return 'ANIMAL';
    if (text.includes('vehicle')) return 'VEHICLE';
    if (text.includes('baseplate')) return 'BASEPLATE';
    
    // Expanded kingdoms!
    if (text.includes('arch')) return 'ARCH';
    if (text.includes('cylinder')) return 'CYLINDER';
    if (text.includes('cone')) return 'CONE';
    if (text.includes('dish') || text.includes('radar')) return 'DISH';
    if (text.includes('wing')) return 'WING';
    if (text.includes('cockpit')) return 'COCKPIT';
    if (text.includes('windscreen')) return 'WINDSCREEN';
    if (text.includes('tail')) return 'TAIL';
    if (text.includes('propeller')) return 'PROPELLER';
    if (text.includes('engine')) return 'ENGINE';
    if (text.includes('antenna')) return 'ANTENNA';
    if (text.includes('barrel')) return 'BARREL';
    if (text.includes('boat')) return 'BOAT';
    if (text.includes('car body') || text.includes('mudguard')) return 'CAR';
    if (text.includes('arm ') || text.includes('claw')) return 'ARM';
    if (text.includes('gear') || text.includes('sprocket')) return 'GEAR';
    if (text.includes('chain')) return 'CHAIN';
    if (text.includes('rotor')) return 'ROTOR';
    if (text.includes('turntable')) return 'TURNTABLE';
    if (text.includes('magnet')) return 'MAGNET';
    if (text.includes('electric') || text.includes('motor')) return 'ELECTRIC';
    if (text.includes('string') || text.includes('hose') || text.includes('cable')) return 'FLEXIBLE';
    if (text.includes('container') || text.includes('box') || text.includes('crate')) return 'CONTAINER';
    if (text.includes('fence') || text.includes('gate') || text.includes('railing')) return 'FENCE';
    if (text.includes('ladder') || text.includes('stairs')) return 'STAIRS';
    if (text.includes('seat') || text.includes('chair')) return 'FURNITURE';
    if (text.includes('weapon') || text.includes('gun') || text.includes('sword')) return 'WEAPON';
    if (text.includes('tool')) return 'TOOL';
    if (text.includes('sign') || text.includes('plaque')) return 'SIGN';
    if (text.includes('rock') || text.includes('stone')) return 'ROCK';
    if (text.includes('crystal') || text.includes('gem')) return 'CRYSTAL';
    
    return 'OTHER';
}

function extractPhylum(desc, name, kingdom) {
    const text = (desc || name || '').toLowerCase();
    
    // Phylum level - subdivision by body part, size, or function
    
    if (kingdom === 'MINIFIG') {
        if (text.includes('head')) return 'Head';
        if (text.includes('torso') || text.includes('body')) return 'Torso';
        if (text.includes('hips') || text.includes('legs')) return 'Hips and Legs';
        if (text.includes('leg left')) return 'Leg Left';
        if (text.includes('leg right')) return 'Leg Right';
        if (text.includes('arm')) return 'Arms';
        if (text.includes('hand')) return 'Hands';
        if (text.includes('hat') || text.includes('helmet') || text.includes('hair')) return 'Headgear';
        if (text.includes('accessory')) return 'Accessories';
        return 'Other Minifig';
    }
    
    // Size extraction for building elements
    const sizeMatch = text.match(/(\d+)\s*x\s*(\d+)/);
    if (sizeMatch) {
        return `${sizeMatch[1]} x ${sizeMatch[2]}`;
    }
    
    // Single dimension
    const singleMatch = text.match(/(\d+)\s*(stud|mm|ldu)/);
    if (singleMatch) {
        return `${singleMatch[1]}${singleMatch[2]}`;
    }
    
    return 'Unsized';
}

function extractClass(desc, name) {
    const text = (desc || name || '').toLowerCase();
    
    // Class level - shape variants
    if (text.includes('round') || text.includes('circular')) return 'Round';
    if (text.includes('corner')) return 'Corner';
    if (text.includes('curved')) return 'Curved';
    if (text.includes('inverted')) return 'Inverted';
    if (text.includes('angle')) return 'Angled';
    if (text.includes('triple') || text.includes('double')) return 'Multiple';
    if (text.includes('with ')) return 'Modified';
    
    return 'Standard';
}

function extractOrder(desc, name) {
    const text = (desc || name || '').toLowerCase();
    
    // Order level - decoration/pattern
    if (text.includes('print') || text.includes('pattern')) return 'Printed';
    if (text.includes('sticker')) return 'Stickered';
    if (text.includes('embossed')) return 'Embossed';
    
    return 'Plain';
}

function extractFamily(filename) {
    // Family level - part number base
    if (!filename) return 'Unknown';
    const match = filename.match(/^([a-z]?\d+)/i);
    return match ? match[1] : 'Unknown';
}

function extractGenus(desc, name) {
    // Genus level - specific variant description
    const text = (desc || name || '').toLowerCase();
    
    // Color/material hints
    if (text.includes('trans') || text.includes('transparent')) return 'Transparent';
    if (text.includes('chrome')) return 'Chrome';
    if (text.includes('metallic')) return 'Metallic';
    if (text.includes('rubber')) return 'Rubber';
    
    return 'Standard Material';
}

// ═══════════════════════════════════════════════════════════════
// BUILD TAXONOMY TREE
// ═══════════════════════════════════════════════════════════════

console.log('🌳 Building taxonomy tree...\n');

const taxonomy = {
    generated: new Date().toISOString(),
    totalParts: allParts.length,
    kingdoms: {}
};

const titleGroups = {};

allParts.forEach(part => {
    const desc = part.description || part.name || '';
    const name = part.name || part.filename || '';
    const filename = part.filename || '';
    
    // Extract taxonomic levels
    const kingdom = extractKingdom(desc, name);
    const phylum = extractPhylum(desc, name, kingdom);
    const klass = extractClass(desc, name);
    const order = extractOrder(desc, name);
    const family = extractFamily(filename);
    const genus = extractGenus(desc, name);
    
    // Build tree structure
    if (!taxonomy.kingdoms[kingdom]) {
        taxonomy.kingdoms[kingdom] = {
            name: kingdom,
            count: 0,
            phyla: {}
        };
    }
    taxonomy.kingdoms[kingdom].count++;
    
    if (!taxonomy.kingdoms[kingdom].phyla[phylum]) {
        taxonomy.kingdoms[kingdom].phyla[phylum] = {
            name: phylum,
            count: 0,
            classes: {}
        };
    }
    taxonomy.kingdoms[kingdom].phyla[phylum].count++;
    
    if (!taxonomy.kingdoms[kingdom].phyla[phylum].classes[klass]) {
        taxonomy.kingdoms[kingdom].phyla[phylum].classes[klass] = {
            name: klass,
            count: 0,
            orders: {}
        };
    }
    taxonomy.kingdoms[kingdom].phyla[phylum].classes[klass].count++;
    
    if (!taxonomy.kingdoms[kingdom].phyla[phylum].classes[klass].orders[order]) {
        taxonomy.kingdoms[kingdom].phyla[phylum].classes[klass].orders[order] = {
            name: order,
            count: 0,
            families: {}
        };
    }
    taxonomy.kingdoms[kingdom].phyla[phylum].classes[klass].orders[order].count++;
    
    if (!taxonomy.kingdoms[kingdom].phyla[phylum].classes[klass].orders[order].families[family]) {
        taxonomy.kingdoms[kingdom].phyla[phylum].classes[klass].orders[order].families[family] = {
            name: family,
            count: 0,
            parts: []
        };
    }
    taxonomy.kingdoms[kingdom].phyla[phylum].classes[klass].orders[order].families[family].count++;
    taxonomy.kingdoms[kingdom].phyla[phylum].classes[klass].orders[order].families[family].parts.push({
        filename: part.filename,
        name: part.name,
        description: part.description,
        path: part.relativePath || part.path
    });
    
    // Also build title groups for quick lookup
    const titlePrefix = desc.split(' ').slice(0, 3).join(' ');
    if (!titleGroups[titlePrefix]) titleGroups[titlePrefix] = 0;
    titleGroups[titlePrefix]++;
});

// Sort title groups by count
const sortedTitleGroups = Object.entries(titleGroups)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50); // Top 50

taxonomy.titleGroups = sortedTitleGroups.map(([title, count]) => ({ title, count }));

// Write taxonomy
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(taxonomy, null, 2), 'utf8');

console.log('✅ Taxonomy built!\n');

// Display summary
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 TAXONOMY SUMMARY');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

Object.entries(taxonomy.kingdoms).sort((a, b) => b[1].count - a[1].count).forEach(([kingdom, data]) => {
    const phylaCount = Object.keys(data.phyla).length;
    console.log(`${kingdom.padEnd(20)} ${String(data.count).padStart(6)} parts in ${String(phylaCount).padStart(3)} subdivisions`);
});

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🏆 TOP TITLE GROUPS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

sortedTitleGroups.slice(0, 15).forEach(([title, count]) => {
    console.log(`${String(count).padStart(4)} × ${title}`);
});

console.log(`\n💚 Taxonomy saved to: ${OUTPUT_PATH}\n`);
