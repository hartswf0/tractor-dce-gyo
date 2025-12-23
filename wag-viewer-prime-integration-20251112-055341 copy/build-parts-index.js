#!/usr/bin/env node
/**
 * ENRICHED LDRAW PARTS INDEX BUILDER
 * 
 * Parses all .dat files in the LDraw parts library and extracts:
 * - Name/description
 * - !CATEGORY
 * - !KEYWORDS
 * - Inferred connectors from description
 * - Size/footprint
 * - Base part vs variation classification
 * 
 * Outputs: ldraw-parts-index.json
 */

const fs = require('fs');
const path = require('path');

const PARTS_DIR = path.join(__dirname, 'ldraw', 'parts');
const OUTPUT_FILE = path.join(__dirname, 'ldraw-parts-index.json');
const CONNECTIVITY_LOOKUP = path.join(__dirname, 'ldraw-connectivity-lookup.json');

// Load connectivity data if available
let connectivityLookup = {};
try {
    if (fs.existsSync(CONNECTIVITY_LOOKUP)) {
        connectivityLookup = JSON.parse(fs.readFileSync(CONNECTIVITY_LOOKUP, 'utf-8'));
        console.log(`✅ Loaded connectivity data for ${Object.keys(connectivityLookup).length} parts`);
    }
} catch (e) {
    console.warn('⚠️ Could not load connectivity lookup, run build-connectivity-index.js first');
}

// ═══════════════════════════════════════════════════════════════════════════
// CONNECTOR DETECTION PATTERNS
// ═══════════════════════════════════════════════════════════════════════════
const CONNECTOR_PATTERNS = {
    'studs': /\bstud|\bknob|\bbump/i,
    'anti-studs': /\btube|\banti.?stud|\bunderside/i,
    'pin-hole': /\bpin.?hole|\bpeghole/i,
    'axle-hole': /\baxle.?hole|\bcross.?hole/i,
    'axle': /\baxle\b(?!.?hole)/i,
    'pin': /\bpin\b(?!.?hole)|\bpeg\b|\bconnector.?peg/i,
    'clip': /\bclip|\bclaw|\bholder/i,
    'bar': /\bbar\b|\bhandle|\brod\b/i,
    'hinge': /\bhinge/i,
    'ball-joint': /\bball\b|\btowball/i,
    'socket': /\bsocket/i,
    'magnet': /\bmagnet/i,
    'click': /\bclick/i,
    'groove': /\bgroove/i,
    'rail': /\brail|\btrack/i
};

// ═══════════════════════════════════════════════════════════════════════════
// SIZE/FOOTPRINT EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════
function extractSize(description) {
    // Match patterns like "2 x 4", "1x2x3", etc.
    const match = description.match(/(\d+)\s*x\s*(\d+)(?:\s*x\s*(\d+))?/i);
    if (match) {
        return {
            w: parseInt(match[1]) || 1,
            l: parseInt(match[2]) || 1,
            h: match[3] ? parseInt(match[3]) : null,
            str: match[0].replace(/\s+/g, 'x').toLowerCase()
        };
    }
    return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// BASE PART VS VARIATION DETECTION
// ═══════════════════════════════════════════════════════════════════════════
function classifyPart(filename, description) {
    const base = filename.replace(/\.dat$/i, '');
    
    // Pattern variants
    const isPrinted = /p[br]\d+|pat\d+/i.test(base);
    const isColored = /c\d+$/i.test(base);
    const isMoldVariant = /[a-z]$/i.test(base) && !/p[br]\d+/i.test(base);
    const isSubpart = base.startsWith('s\\') || base.startsWith('s/');
    const isAlias = description.toLowerCase().startsWith('~moved to');
    const isObsolete = description.toLowerCase().startsWith('~');
    
    // Extract base part ID
    let basePartId = base
        .replace(/^s[\\\/]/, '')           // Remove subpart prefix
        .replace(/p[br]\d+.*$/i, '')        // Remove print suffix
        .replace(/c\d+$/, '')               // Remove color suffix
        .replace(/[a-z]$/, '');             // Remove mold variant letter
    
    return {
        isPrinted,
        isColored,
        isMoldVariant,
        isSubpart,
        isAlias,
        isObsolete,
        basePartId: basePartId || base,
        variationType: isPrinted ? 'print' : isColored ? 'color' : isMoldVariant ? 'mold' : 'base'
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// PARSE A SINGLE .DAT FILE
// ═══════════════════════════════════════════════════════════════════════════
function parsePartFile(filepath) {
    try {
        const content = fs.readFileSync(filepath, 'utf-8');
        const lines = content.split(/\r?\n/);
        
        const part = {
            filename: path.basename(filepath),
            description: '',
            category: null,
            keywords: [],
            author: null,
            connectors: [],
            size: null,
            classification: null
        };
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            // First line starting with "0 " (not meta) is the description
            if (!part.description && trimmed.startsWith('0 ') && !trimmed.startsWith('0 !') && !trimmed.startsWith('0 //')) {
                part.description = trimmed.substring(2).trim();
            }
            
            // 0 !CATEGORY
            if (trimmed.startsWith('0 !CATEGORY ')) {
                part.category = trimmed.substring(12).trim();
            }
            
            // 0 !KEYWORDS
            if (trimmed.startsWith('0 !KEYWORDS ')) {
                const kw = trimmed.substring(12).trim();
                part.keywords.push(...kw.split(/,\s*/).map(k => k.trim().toLowerCase()).filter(Boolean));
            }
            
            // 0 Author:
            if (trimmed.startsWith('0 Author: ')) {
                part.author = trimmed.substring(10).trim();
            }
            
            // Stop parsing after we've seen enough header (optimization)
            if (trimmed.startsWith('1 ') || trimmed.startsWith('2 ') || 
                trimmed.startsWith('3 ') || trimmed.startsWith('4 ') || 
                trimmed.startsWith('5 ')) {
                break;
            }
        }
        
        // Dedupe keywords
        part.keywords = [...new Set(part.keywords)];
        
        // Extract size from description
        part.size = extractSize(part.description);
        
        // Detect connectors from description
        const descLower = part.description.toLowerCase();
        for (const [connector, pattern] of Object.entries(CONNECTOR_PATTERNS)) {
            if (pattern.test(descLower)) {
                part.connectors.push(connector);
            }
        }
        
        // Classify as base/variation
        part.classification = classifyPart(part.filename, part.description);
        
        return part;
    } catch (err) {
        console.error(`Error parsing ${filepath}: ${err.message}`);
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN: BUILD THE INDEX
// ═══════════════════════════════════════════════════════════════════════════
async function buildIndex() {
    console.log('🔍 Scanning parts directory...');
    
    const files = fs.readdirSync(PARTS_DIR).filter(f => f.endsWith('.dat'));
    console.log(`📦 Found ${files.length} .dat files`);
    
    const parts = [];
    const categories = new Set();
    const allKeywords = new Set();
    const allConnectors = new Set();
    const basePartsMap = new Map(); // basePartId -> [variations]
    
    let processed = 0;
    const startTime = Date.now();
    
    for (const file of files) {
        const filepath = path.join(PARTS_DIR, file);
        const part = parsePartFile(filepath);
        
        if (part && part.description) {
            parts.push(part);
            
            if (part.category) categories.add(part.category);
            part.keywords.forEach(k => allKeywords.add(k));
            part.connectors.forEach(c => allConnectors.add(c));
            
            // Track base parts
            const baseId = part.classification.basePartId;
            if (!basePartsMap.has(baseId)) {
                basePartsMap.set(baseId, []);
            }
            basePartsMap.get(baseId).push(part.filename);
        }
        
        processed++;
        if (processed % 5000 === 0) {
            console.log(`  Processed ${processed}/${files.length}...`);
        }
    }
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Parsed ${parts.length} parts in ${elapsed}s`);
    
    // Build summary stats
    const stats = {
        totalParts: parts.length,
        uniqueBaseParts: basePartsMap.size,
        categories: [...categories].sort(),
        topKeywords: [...allKeywords].slice(0, 100),
        connectorTypes: [...allConnectors].sort(),
        partsWithCategory: parts.filter(p => p.category).length,
        partsWithKeywords: parts.filter(p => p.keywords.length > 0).length,
        partsWithConnectors: parts.filter(p => p.connectors.length > 0).length,
        printedParts: parts.filter(p => p.classification.isPrinted).length,
        aliasParts: parts.filter(p => p.classification.isAlias).length,
        buildDate: new Date().toISOString()
    };
    
    console.log('\n📊 Index Statistics:');
    console.log(`   Total parts: ${stats.totalParts}`);
    console.log(`   Unique base parts: ${stats.uniqueBaseParts}`);
    console.log(`   Categories found: ${stats.categories.length}`);
    console.log(`   Parts with !CATEGORY: ${stats.partsWithCategory}`);
    console.log(`   Parts with !KEYWORDS: ${stats.partsWithKeywords}`);
    console.log(`   Parts with detected connectors: ${stats.partsWithConnectors}`);
    console.log(`   Printed variations: ${stats.printedParts}`);
    console.log(`   Alias/moved parts: ${stats.aliasParts}`);
    
    // Create the index object - merge with Shadow Library connectivity data
    let partsWithShadowData = 0;
    const index = {
        meta: stats,
        parts: parts.map(p => {
            // Get connectivity from Shadow Library if available
            const shadowData = connectivityLookup[p.filename];
            if (shadowData) partsWithShadowData++;
            
            // Merge inferred connectors with Shadow Library connectors
            const allConnectors = new Set(p.connectors);
            if (shadowData?.types) {
                shadowData.types.forEach(t => allConnectors.add(t));
            }
            
            return {
                f: p.filename,                              // filename (short key)
                d: p.description,                           // description
                c: p.category,                              // category
                k: p.keywords.length ? p.keywords : null,   // keywords (null if empty)
                n: allConnectors.size ? [...allConnectors] : null, // connectors (merged)
                s: p.size,                                  // size
                t: p.classification.variationType,          // type: base/print/color/mold
                b: p.classification.basePartId,             // base part ID
                a: p.classification.isAlias ? 1 : null,     // alias flag (null if false)
                o: p.classification.isObsolete ? 1 : null,  // obsolete flag
                // NEW: Shadow Library connectivity signature
                sig: shadowData?.sig || null,               // connectivity signature (e.g., "S8-T3")
                sc: shadowData?.count || null               // snap count
            };
        })
    };
    
    console.log(`   Parts with Shadow Library data: ${partsWithShadowData}`);
    
    // Write the index
    const json = JSON.stringify(index);
    fs.writeFileSync(OUTPUT_FILE, json);
    
    const sizeMB = (Buffer.byteLength(json, 'utf8') / 1024 / 1024).toFixed(2);
    console.log(`\n💾 Written to ${OUTPUT_FILE} (${sizeMB} MB)`);
    
    // Also write a minified categories list for quick reference
    const categoriesFile = path.join(__dirname, 'ldraw-categories.json');
    fs.writeFileSync(categoriesFile, JSON.stringify({
        categories: stats.categories,
        connectors: stats.connectorTypes,
        buildDate: stats.buildDate
    }, null, 2));
    console.log(`📁 Categories written to ${categoriesFile}`);
}

// Run it
buildIndex().catch(console.error);
