#!/usr/bin/env node

/**
 * GRACE PARTS CATALOG GENERATOR
 * 
 * Generates organized MPD catalog files from ldraw-parts-manifest.json
 * - Smart grouping by part families
 * - Proper 3D spacing (no overlaps!)
 * - Human & machine readable
 * - Auto-adds to Grace Editor dropdown
 */

const fs = require('fs');
const path = require('path');

// Configuration
const MANIFEST_PATH = './wag-viewer-prime-integration-20251112-055341 copy/ldraw-parts-manifest.json';
const OUTPUT_DIR = './catalogs';
const GRACE_HTML = './wag-viewer-prime-integration-20251112-055341 copy/wag-grace-editor.html';

// Layout settings
const GRID_SPACING = 200;  // LDU between parts (was 100, too tight!)
const COLUMNS = 6;         // 6 columns instead of 10 (wider spacing)
const Y_OFFSET = -50;      // Above grid (negative Y = up in LDraw)
const PARTS_PER_CATALOG = 30; // Smaller batches for clarity

console.log('📦 GRACE PARTS CATALOG GENERATOR\n');

// Load manifest
console.log('📖 Loading manifest...');
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
const allParts = [];

// Flatten manifest structure
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

// Smart grouping strategies
function extractPartFamily(filename) {
    // Extract base part number (e.g., "3001" from "3001.dat" or "3001p01.dat")
    if (!filename) return null;
    const match = filename.match(/^(\d+)/);
    return match ? match[1] : null;
}

function extractPartType(name, filename) {
    const lower = (name || filename || '').toLowerCase();
    
    if (lower.includes('brick')) return 'Brick';
    if (lower.includes('plate')) return 'Plate';
    if (lower.includes('tile')) return 'Tile';
    if (lower.includes('slope')) return 'Slope';
    if (lower.includes('wedge')) return 'Wedge';
    if (lower.includes('technic')) return 'Technic';
    if (lower.includes('wheel') || lower.includes('tire')) return 'Wheel';
    if (lower.includes('minifig')) return 'Minifig';
    if (lower.includes('window')) return 'Window';
    if (lower.includes('door')) return 'Door';
    if (lower.includes('panel')) return 'Panel';
    if (lower.includes('hinge')) return 'Hinge';
    if (lower.includes('axle')) return 'Axle';
    if (lower.includes('connector')) return 'Connector';
    
    return 'Other';
}

// Group parts intelligently
console.log('🔍 Analyzing part families...');
const families = {};
const types = {};

allParts.forEach(part => {
    const family = extractPartFamily(part.filename);
    const type = extractPartType(part.name, part.filename);
    
    // Group by part family (e.g., all 3001 variants together)
    if (family) {
        if (!families[family]) families[family] = [];
        families[family].push(part);
    }
    
    // Group by type
    if (!types[type]) types[type] = [];
    types[type].push(part);
});

console.log(`📊 Found ${Object.keys(families).length} part families`);
console.log(`📊 Found ${Object.keys(types).length} part types\n`);

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Generate catalogs by TYPE (Bricks, Plates, etc.)
const catalogs = [];
let totalGenerated = 0;

console.log('🏗️  Generating catalogs by type...\n');

Object.entries(types).sort().forEach(([typeName, parts]) => {
    if (parts.length === 0) return;
    
    const chunks = Math.ceil(parts.length / PARTS_PER_CATALOG);
    
    for (let chunkIdx = 0; chunkIdx < chunks; chunkIdx++) {
        const start = chunkIdx * PARTS_PER_CATALOG;
        const chunk = parts.slice(start, start + PARTS_PER_CATALOG);
        
        const filename = `${typeName.replace(/\s+/g, '_')}_${String(chunkIdx + 1).padStart(2, '0')}.mpd`;
        const filepath = path.join(OUTPUT_DIR, filename);
        
        // Generate MPD content
        let mpd = `0 FILE ${filename}\n`;
        mpd += `0 Name: ${typeName} Catalog Part ${chunkIdx + 1}/${chunks}\n`;
        mpd += `0 Author: Grace Parts Catalog Generator\n`;
        mpd += `0 !LDRAW_ORG Model\n`;
        mpd += `0 !LICENCE Redistributable under CCAL version 2.0\n`;
        mpd += `0 BFC CERTIFY CCW\n`;
        mpd += `0 //\n`;
        mpd += `0 // ╔════════════════════════════════════════════════════════════╗\n`;
        mpd += `0 // ║  PARTS CATALOG: ${typeName.toUpperCase().padEnd(42)} ║\n`;
        mpd += `0 // ║  Showing ${String(chunk.length).padStart(2)} parts in ${COLUMNS}-column grid${' '.repeat(25)}║\n`;
        mpd += `0 // ║  Spacing: ${GRID_SPACING} LDU | Above grid: ${Math.abs(Y_OFFSET)} LDU${' '.repeat(21)}║\n`;
        mpd += `0 // ╚════════════════════════════════════════════════════════════╝\n`;
        mpd += `0 //\n\n`;
        mpd += `0 STEP\n\n`;
        
        // Layout parts in grid with proper spacing
        chunk.forEach((part, idx) => {
            const col = idx % COLUMNS;
            const row = Math.floor(idx / COLUMNS);
            const x = col * GRID_SPACING - ((COLUMNS - 1) * GRID_SPACING / 2);
            const y = Y_OFFSET;  // Above grid
            const z = row * GRID_SPACING;
            
            const color = ((idx % 15) + 1); // Cycle through colors 1-15
            const partPath = part.relativePath || part.filename;
            
            // Add human-readable comment
            mpd += `0 // ═══════════════════════════════════════════════════════════\n`;
            mpd += `0 // PART ${String(idx + 1).padStart(2)}: ${part.name || part.filename}\n`;
            mpd += `0 // File: ${partPath}\n`;
            mpd += `0 // Position: (${x}, ${y}, ${z})\n`;
            if (part.description) {
                mpd += `0 // Desc: ${part.description}\n`;
            }
            mpd += `0 // ═══════════════════════════════════════════════════════════\n`;
            mpd += `1 ${color} ${x} ${y} ${z} 1 0 0 0 1 0 0 0 1 ${partPath}\n\n`;
        });
        
        mpd += `0 STEP\n`;
        mpd += `0 NOFILE\n`;
        
        // Write file
        fs.writeFileSync(filepath, mpd, 'utf8');
        
        catalogs.push({
            filename,
            filepath,
            type: typeName,
            count: chunk.length,
            chunk: chunkIdx + 1,
            total: chunks
        });
        
        totalGenerated++;
    }
    
    console.log(`  ✓ ${typeName}: ${parts.length} parts → ${chunks} catalog(s)`);
});

console.log(`\n✅ Generated ${totalGenerated} catalog files in /${OUTPUT_DIR}/\n`);

// Update Grace Editor dropdown
console.log('🔄 Updating Grace Editor dropdown...');

let graceHTML = fs.readFileSync(GRACE_HTML, 'utf8');

// Find the optgroup for Available MPD Files
const optgroupStart = graceHTML.indexOf('<optgroup label="📦 Available MPD Files">');
const optgroupEnd = graceHTML.indexOf('</optgroup>', optgroupStart);

if (optgroupStart === -1 || optgroupEnd === -1) {
    console.error('❌ Could not find optgroup in Grace HTML');
    process.exit(1);
}

// Generate new options
let catalogOptions = '';
catalogs.forEach(cat => {
    const displayName = `${cat.type} ${cat.chunk}/${cat.total} (${cat.count} parts)`;
    catalogOptions += `                    <option value="../catalogs/${cat.filename}">${displayName}</option>\n`;
});

// Keep existing options
const existingOptions = graceHTML.substring(
    graceHTML.indexOf('>', optgroupStart) + 1,
    optgroupEnd
).trim();

// Combine: catalogs first, then existing files
const newOptions = `\n` + catalogOptions + existingOptions + '\n                ';

// Replace optgroup content
const before = graceHTML.substring(0, graceHTML.indexOf('>', optgroupStart) + 1);
const after = graceHTML.substring(optgroupEnd);
const updated = before + newOptions + after;

fs.writeFileSync(GRACE_HTML, updated, 'utf8');

console.log('✅ Grace Editor dropdown updated!\n');

// Summary report
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 CATALOG GENERATION SUMMARY');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Total Parts:      ${allParts.length.toLocaleString()}`);
console.log(`Catalogs Created: ${totalGenerated}`);
console.log(`Parts Per File:   ${PARTS_PER_CATALOG}`);
console.log(`Grid Columns:     ${COLUMNS}`);
console.log(`Part Spacing:     ${GRID_SPACING} LDU`);
console.log(`Height Offset:    ${Math.abs(Y_OFFSET)} LDU above grid`);
console.log(`Output Directory: ${OUTPUT_DIR}/`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// List generated catalogs by type
console.log('📦 CATALOGS BY TYPE:\n');
const typeGroups = {};
catalogs.forEach(cat => {
    if (!typeGroups[cat.type]) typeGroups[cat.type] = [];
    typeGroups[cat.type].push(cat);
});

Object.entries(typeGroups).sort().forEach(([type, cats]) => {
    const totalParts = cats.reduce((sum, cat) => sum + cat.count, 0);
    console.log(`  ${type}: ${totalParts} parts in ${cats.length} file(s)`);
});

console.log('\n💚 Done! Load catalogs in Grace Editor dropdown.\n');
