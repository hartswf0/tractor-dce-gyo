#!/usr/bin/env node
/**
 * LDCAD SHADOW LIBRARY CONNECTIVITY PARSER
 * 
 * Parses the LDCad Shadow Library to extract connectivity information:
 * - SNAP_CYL: Cylindrical connections (studs, tubes, axles, pin holes)
 * - SNAP_CLP: Clip connections  
 * - SNAP_INCL: Includes (references to other parts)
 * - SNAP_FGR: Finger/grip connections
 * - SNAP_GEN: Generic connections
 * 
 * Outputs: ldraw-connectivity-index.json
 */

const fs = require('fs');
const path = require('path');

const SHADOW_DIR = path.join(__dirname, 'LCADSHADOW_LIBRARY', 'parts');
const OUTPUT_FILE = path.join(__dirname, 'ldraw-connectivity-index.json');

// Connection type mapping based on CONTRIBUTING.md IDs
const CONNECTION_TYPES = {
    // Studs
    'studC': 'stud',
    'studO': 'stud-open',
    'stud2': 'stud',
    'stud3': 'stud',
    'studDuplo': 'duplo-stud',
    'dupStud': 'duplo-stud',
    
    // Anti-studs / Tubes
    'aStud': 'anti-stud',
    
    // Axles
    'axle': 'axle',
    'axleDuplo': 'duplo-axle',
    
    // Axle holes
    'axleHole': 'axle-hole',
    'axleHole2': 'axle-hole',
    'axleHole3': 'axle-hole',
    'axleHoleDuplo': 'duplo-axle-hole',
    
    // Technic pins
    'pin8': 'technic-pin',
    'fpin10': 'technic-friction-pin',
    'fpin11': 'technic-friction-pin',
    'conn4': 'technic-pin',
    
    // Technic holes
    'connhole': 'technic-hole',
    'connhol3': 'technic-hole',
    
    // Electric
    'elecHole': 'electric-hole',
    'elecPin': 'electric-pin',
    'elecSck': 'electric-socket',
    
    // Flex
    'flexEnd': 'flex-end',
    'flexSeg': 'flex-segment',
    
    // Wheel
    'wpAxHole': 'wheel-axle-hole'
};

// Parse SNAP_CYL line
function parseSnapCyl(line) {
    const snap = {
        type: 'cylinder',
        gender: null,
        caps: null,
        position: null,
        orientation: null,
        slide: false,
        id: null,
        group: null
    };
    
    // Extract bracketed attributes
    const genderMatch = line.match(/\[gender=([MF])\]/);
    if (genderMatch) snap.gender = genderMatch[1] === 'M' ? 'male' : 'female';
    
    const capsMatch = line.match(/\[caps=(\w+)\]/);
    if (capsMatch) snap.caps = capsMatch[1];
    
    const posMatch = line.match(/\[pos=(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\]/);
    if (posMatch) snap.position = { x: parseFloat(posMatch[1]), y: parseFloat(posMatch[2]), z: parseFloat(posMatch[3]) };
    
    const oriMatch = line.match(/\[ori=([^\]]+)\]/);
    if (oriMatch) snap.orientation = oriMatch[1].split(/\s+/).map(parseFloat);
    
    if (line.includes('[slide=true]')) snap.slide = true;
    
    const idMatch = line.match(/\[id=(\w+)\]/);
    if (idMatch) snap.id = idMatch[1];
    
    const groupMatch = line.match(/\[group=(\w+)\]/);
    if (groupMatch) snap.group = groupMatch[1];
    
    // Infer connection type from id
    if (snap.id && CONNECTION_TYPES[snap.id]) {
        snap.connectorType = CONNECTION_TYPES[snap.id];
    } else if (snap.gender === 'male') {
        snap.connectorType = 'stud'; // Male cylinders are usually studs
    } else if (snap.gender === 'female') {
        snap.connectorType = 'tube'; // Female cylinders are usually tubes/holes
    }
    
    return snap;
}

// Parse SNAP_CLP line
function parseSnapClp(line) {
    const snap = {
        type: 'clip',
        radius: null,
        length: null,
        position: null,
        orientation: null
    };
    
    const radiusMatch = line.match(/\[radius=(-?[\d.]+)\]/);
    if (radiusMatch) snap.radius = parseFloat(radiusMatch[1]);
    
    const lengthMatch = line.match(/\[length=(-?[\d.]+)\]/);
    if (lengthMatch) snap.length = parseFloat(lengthMatch[1]);
    
    const posMatch = line.match(/\[pos=(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\]/);
    if (posMatch) snap.position = { x: parseFloat(posMatch[1]), y: parseFloat(posMatch[2]), z: parseFloat(posMatch[3]) };
    
    snap.connectorType = 'clip';
    return snap;
}

// Parse SNAP_INCL line
function parseSnapIncl(line) {
    const snap = {
        type: 'include',
        ref: null,
        position: null
    };
    
    const refMatch = line.match(/\[ref=([^\]]+)\]/);
    if (refMatch) snap.ref = refMatch[1];
    
    const posMatch = line.match(/\[pos=(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\]/);
    if (posMatch) snap.position = { x: parseFloat(posMatch[1]), y: parseFloat(posMatch[2]), z: parseFloat(posMatch[3]) };
    
    // Infer type from ref filename
    if (snap.ref) {
        if (snap.ref.includes('connhole')) snap.connectorType = 'technic-hole';
        else if (snap.ref.includes('axle')) snap.connectorType = 'axle-hole';
        else if (snap.ref.includes('stud')) snap.connectorType = 'stud';
    }
    
    return snap;
}

// Parse a single shadow file
function parseShadowFile(filepath) {
    try {
        const content = fs.readFileSync(filepath, 'utf-8');
        const lines = content.split(/\r?\n/);
        
        const part = {
            filename: path.basename(filepath),
            snaps: [],
            connectorTypes: new Set()
        };
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            if (trimmed.includes('!LDCAD SNAP_CYL')) {
                const snap = parseSnapCyl(trimmed);
                part.snaps.push(snap);
                if (snap.connectorType) part.connectorTypes.add(snap.connectorType);
            }
            else if (trimmed.includes('!LDCAD SNAP_CLP')) {
                const snap = parseSnapClp(trimmed);
                part.snaps.push(snap);
                part.connectorTypes.add('clip');
            }
            else if (trimmed.includes('!LDCAD SNAP_INCL')) {
                const snap = parseSnapIncl(trimmed);
                part.snaps.push(snap);
                if (snap.connectorType) part.connectorTypes.add(snap.connectorType);
            }
            else if (trimmed.includes('!LDCAD SNAP_FGR')) {
                part.connectorTypes.add('finger-grip');
            }
            else if (trimmed.includes('!LDCAD SNAP_GEN')) {
                part.connectorTypes.add('generic');
            }
        }
        
        part.connectorTypes = [...part.connectorTypes];
        return part;
    } catch (err) {
        console.error(`Error parsing ${filepath}: ${err.message}`);
        return null;
    }
}

// Build connectivity signature
function buildSignature(snaps) {
    const counts = {};
    snaps.forEach(snap => {
        if (snap.connectorType) {
            counts[snap.connectorType] = (counts[snap.connectorType] || 0) + 1;
        }
    });
    
    // Format: "S4-T2-AH1" (4 studs, 2 tubes, 1 axle hole)
    const abbrev = {
        'stud': 'S',
        'tube': 'T',
        'anti-stud': 'AS',
        'axle': 'AX',
        'axle-hole': 'AH',
        'technic-pin': 'TP',
        'technic-hole': 'TH',
        'technic-friction-pin': 'FP',
        'clip': 'CL',
        'bar': 'BR'
    };
    
    return Object.entries(counts)
        .map(([type, count]) => `${abbrev[type] || type.substring(0,2).toUpperCase()}${count}`)
        .sort()
        .join('-') || null;
}

// Main build function
async function buildConnectivityIndex() {
    console.log('🔍 Scanning Shadow Library...');
    
    const files = fs.readdirSync(SHADOW_DIR).filter(f => f.endsWith('.dat'));
    console.log(`📦 Found ${files.length} shadow files`);
    
    const parts = [];
    const allConnectorTypes = new Set();
    let withSnaps = 0;
    
    for (const file of files) {
        const filepath = path.join(SHADOW_DIR, file);
        const part = parseShadowFile(filepath);
        
        if (part && part.snaps.length > 0) {
            withSnaps++;
            part.connectorTypes.forEach(t => allConnectorTypes.add(t));
            
            parts.push({
                f: part.filename,
                n: part.connectorTypes,  // connector types array
                c: part.snaps.length,     // snap count
                sig: buildSignature(part.snaps),  // connectivity signature
                snaps: part.snaps.map(s => ({
                    t: s.type.charAt(0),  // c=cylinder, l=clip, i=include
                    g: s.gender?.charAt(0),  // m/f
                    ct: s.connectorType,
                    p: s.position
                }))
            });
        }
    }
    
    console.log(`✅ Parsed ${files.length} files, ${withSnaps} have connectivity data`);
    console.log(`📊 Connector types found:`, [...allConnectorTypes].sort());
    
    // Build stats
    const stats = {
        totalFiles: files.length,
        filesWithConnectivity: withSnaps,
        connectorTypes: [...allConnectorTypes].sort(),
        buildDate: new Date().toISOString()
    };
    
    // Count by connector type
    const typeCounts = {};
    parts.forEach(p => {
        p.n.forEach(t => {
            typeCounts[t] = (typeCounts[t] || 0) + 1;
        });
    });
    stats.connectorTypeCounts = typeCounts;
    
    const index = {
        meta: stats,
        parts: parts
    };
    
    // Write index
    const json = JSON.stringify(index, null, 2);
    fs.writeFileSync(OUTPUT_FILE, json);
    
    const sizeMB = (Buffer.byteLength(json, 'utf8') / 1024 / 1024).toFixed(2);
    console.log(`\n💾 Written to ${OUTPUT_FILE} (${sizeMB} MB)`);
    
    // Also build a simple lookup map
    const lookupFile = path.join(__dirname, 'ldraw-connectivity-lookup.json');
    const lookup = {};
    parts.forEach(p => {
        lookup[p.f] = {
            types: p.n,
            sig: p.sig,
            count: p.c
        };
    });
    fs.writeFileSync(lookupFile, JSON.stringify(lookup));
    console.log(`📁 Lookup map written to ${lookupFile}`);
}

buildConnectivityIndex().catch(console.error);
