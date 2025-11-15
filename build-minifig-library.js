#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const INTEGRATION_DIR = path.join(ROOT, 'wag-viewer-prime-integration-20251112-055341 copy');
const MANIFEST_PATH = path.join(INTEGRATION_DIR, 'ldraw-parts-manifest.json');
const OUTPUT_PATH = path.join(INTEGRATION_DIR, 'minifig-library.json');
const DESCRIPTORS_OUTPUT_PATH = path.join(INTEGRATION_DIR, 'minifig-descriptors.json');
const ALL_PARTS_DESCRIPTORS_PATH = path.join(INTEGRATION_DIR, 'all-parts-descriptors.json');

function loadManifest() {
  const raw = fs.readFileSync(MANIFEST_PATH, 'utf8');
  return JSON.parse(raw);
}

const COLOR_NAMES = [
  'black', 'white', 'red', 'blue', 'yellow', 'green', 'brown', 'tan', 'orange', 'purple', 'magenta', 'pink', 'lime',
  'dark red', 'dark blue', 'dark green', 'dark tan', 'dark bluish gray', 'dark bluish grey', 'light bluish gray',
  'light bluish grey', 'dark gray', 'dark grey', 'light gray', 'light grey', 'sand green', 'sand blue', 'sand red',
  'dark orange', 'medium nougat', 'dark tan', 'tan', 'teal', 'azure', 'lavender', 'pearl gold', 'pearl silver'
];

function detectColor(description = '') {
  const lower = description.toLowerCase();
  for (const name of COLOR_NAMES) {
    if (lower.includes(name)) {
      return name;
    }
  }
  return null;
}

function uniqueByFilename(parts) {
  const map = new Map();
  for (const part of parts) {
    if (!map.has(part.filename)) {
      map.set(part.filename, part);
    }
  }
  return Array.from(map.values());
}

// Heuristics for understanding how a minifig part behaves in an assembly.
// We want to distinguish between:
// - Primary, whole parts (good candidates for the library / builder)
// - Helper or subparts (often live under parts/s/ or start with "~")
// - Halves / pattern areas
// - Composite pieces where torsos bring their own arms, or legs bring their own hips, etc.
function analyzeMinifigPart(file, type) {
  const rawDesc = (file.description || file.name || '').trim();
  const desc = rawDesc.toLowerCase();
  const fname = (file.filename || '').toLowerCase();
  const filePath = (file.path || '').toLowerCase();

  const isSubpart = filePath.includes('parts/s/') || rawDesc.startsWith('~');
  const isHalf = desc.includes(' half') || desc.includes('- half') || desc.includes(' 1/2') || desc.includes(' 1/4');
  const isPatternArea = desc.includes('pattern area') || desc.includes('patternable area');

  let side = null;
  if (type === 'legs') {
    if (fname.startsWith('3816')) side = 'left';
    else if (fname.startsWith('3817')) side = 'right';
    else if (fname.startsWith('970')) side = 'pair'; // common legs+hips assemblies

    // Fall back on description-based heuristics for left/right/pair when
    // filenames aren't in the classic ranges.
    if (!side) {
      if (
        desc.includes(' leg left') ||
        desc.startsWith('minifig leg left') ||
        desc.includes('left leg')
      ) {
        side = 'left';
      } else if (
        desc.includes(' leg right') ||
        desc.startsWith('minifig leg right') ||
        desc.includes('right leg')
      ) {
        side = 'right';
      } else if (
        desc.includes(' legs ') ||
        desc.startsWith('minifig legs ')
      ) {
        side = 'pair';
      }
    }
  } else if (type === 'arms') {
    if (fname.startsWith('3818')) side = 'left';
    else if (fname.startsWith('3819')) side = 'right';
  }

  const includesHips =
    type === 'legs' &&
    (fname.startsWith('970') || desc.includes('hip and leg') || desc.includes('hips and legs') || desc.includes('hips & legs'));

  const includesLegs =
    (type === 'hips' && desc.includes('leg')) || includesHips;

  const includesArms =
    type === 'torso' &&
    (
      desc.includes(' with arms') ||
      desc.includes('with arm ') ||
      desc.includes('torso and arms') ||
      desc.includes('torso with arms') ||
      desc.includes(' dual mould arms') ||
      desc.includes(' dual-mould arms') ||
      desc.includes(' arms and hands') ||
      desc.includes(' arm and hand') ||
      desc.includes(' arms and hand')
    );

  const includesHands =
    type === 'torso' &&
    (desc.includes(' and hands') || desc.includes(' with hands'));

  const upperComplete =
    type === 'torso' &&
    includesArms &&
    includesHands &&
    !isSubpart &&
    !isHalf &&
    !isPatternArea;

  const lowerComplete =
    (type === 'legs' && includesHips && !isSubpart && !isHalf && !isPatternArea) ||
    (type === 'hips' && includesLegs && !isSubpart && !isHalf && !isPatternArea);

  // Canonical minifig heads (for the builder) should be actual head geometry,
  // not helmets, headdresses, shields, weapons, biscuits, etc.
  let canonicalHead = null;
  let headRole = null; // standard | baby | cuboid | animal | character | headdress | artifact | other
  let headgearType = null; // for headRole === 'headdress': helmet | hat | hair | crown | mask | audio | other
  let viableStandardHead = null;
  if (type === 'head') {
    const isHeaddressLike =
      desc.includes('headdress') ||
      desc.includes('helmet') ||
      desc.includes('hair') ||
      desc.includes('hat') ||
      desc.includes('cap ') ||
      desc.includes('headphones') ||
      desc.includes('ear protection');

    const isShieldOrTool =
      desc.includes('shield') ||
      desc.includes('axe head') ||
      desc.includes('biscuit');

    const isBrickLike = desc.startsWith('brick ') || desc.includes(' brick ');
    const isBookLike = desc.includes('book cover');
    const isWeaponLike = desc.includes('weapon') || desc.includes('sword hilt') || desc.includes('oar head');
    const isRFIDLike = desc.includes('rfid');
    const isPencilTop = desc.includes('pencil top');

    const isArtifactLike =
      isShieldOrTool ||
      isBrickLike ||
      isBookLike ||
      isWeaponLike ||
      isRFIDLike ||
      isPencilTop;

    const looksLikeMinifigHead =
      desc.includes('minifig head') ||
      fname.startsWith('3626');

    const isBaby = desc.includes('baby head');
    const isCuboid = desc.includes('head cuboid') || desc.includes('cuboid head');
    const isAnimal =
      desc.includes('yeti') ||
      desc.includes('raccoon') ||
      desc.includes('duck') ||
      desc.includes('mouse') ||
      desc.includes('pig') ||
      desc.includes('bear') ||
      desc.includes('bird') ||
      desc.includes('shark') ||
      desc.includes('panther') ||
      desc.includes('alien e. t.') ||
      desc.includes('martian') ||
      desc.includes('wookiee');

    const isSimpsons = desc.includes('simpsons');
    const isMinecraft = desc.includes('minecraft');
    const isOtherCharacter =
      isSimpsons ||
      isMinecraft ||
      desc.includes('sonic the hedgehog') ||
      desc.includes('powerpuff girls') ||
      desc.includes('gremlin') ||
      desc.includes('mogwai') ||
      desc.includes('alien e. t.');

    if (isArtifactLike) headRole = 'artifact';
    else if (isHeaddressLike) headRole = 'headdress';
    else if (isBaby) headRole = 'baby';
    else if (isCuboid) headRole = 'cuboid';
    else if (isAnimal) headRole = 'animal';
    else if (isOtherCharacter) headRole = 'character';
    else headRole = 'standard';

    // Subtype headgear so hats / helmets / hair can be analyzed as distinct families.
    if (headRole === 'headdress') {
      if (desc.includes('helmet') || desc.includes('visor') || desc.includes('space helmet') || desc.includes('cowl')) {
        headgearType = 'helmet';
      } else if (desc.includes('hair')) {
        headgearType = 'hair';
      } else if (
        desc.includes('hat') ||
        desc.includes('cap ') ||
        desc.includes('beanie') ||
        desc.includes('beret') ||
        desc.includes('fedora') ||
        desc.includes('cowboy hat')
      ) {
        headgearType = 'hat';
      } else if (
        desc.includes('crown') ||
        desc.includes('tiara') ||
        desc.includes('headdress') ||
        desc.includes('warbonnet') ||
        desc.includes('war bonnet')
      ) {
        headgearType = 'crown';
      } else if (desc.includes('mask') || desc.includes('balaclava') || desc.includes('hood')) {
        headgearType = 'mask';
      } else if (desc.includes('headphones') || desc.includes('ear protection')) {
        headgearType = 'audio';
      } else {
        headgearType = 'other';
      }
    }

    canonicalHead =
      (headRole === 'standard' || headRole === 'cuboid' || headRole === 'animal' || headRole === 'character' || headRole === 'baby') &&
      looksLikeMinifigHead &&
      !isSubpart &&
      !isArtifactLike &&
      !isHeaddressLike;

    // Viable heads for "normal" minifigs: standard human/fig heads + sculpted characters + animals.
    viableStandardHead = headRole === 'standard' || headRole === 'character' || headRole === 'animal';
  }

  // Primary = whole part that is not clearly a helper/subpart/pattern area
  const primary = !isSubpart && !isPatternArea && !rawDesc.startsWith('~');

  return {
    primary,
    isSubpart,
    isHalf,
    isPatternArea,
    includesHips,
    includesLegs,
    includesArms,
    includesHands,
    upperComplete,
    lowerComplete,
    canonicalHead,
    headRole,
    headgearType,
    viableStandardHead,
    side
  };
}

function pickPartBuckets(manifest) {
  const heads = [];
  const torsos = [];
  const hips = [];
  const legs = [];
  const arms = [];
  const accessories = [];

  const pushPart = (bucket, file, type) => {
    const attrs = analyzeMinifigPart(file, type);
    bucket.push({
      filename: file.filename,
      name: file.name || file.filename,
      description: file.description || '',
      path: file.path,
      type,
      colorName: detectColor(file.description || file.name),
      // Enriched attributes for smarter procedural assembly
      primary: attrs.primary,
      isSubpart: attrs.isSubpart,
      isHalf: attrs.isHalf,
      isPatternArea: attrs.isPatternArea,
      includesHips: attrs.includesHips,
      includesLegs: attrs.includesLegs,
      includesArms: attrs.includesArms,
      includesHands: attrs.includesHands,
      upperComplete: attrs.upperComplete,
      lowerComplete: attrs.lowerComplete,
      canonicalHead: attrs.canonicalHead,
      headRole: attrs.headRole,
      headgearType: attrs.headgearType,
      viableStandardHead: attrs.viableStandardHead,
      side: attrs.side
    });
  };

  const keywordMatches = (desc, ...keywords) => {
    if (!desc) return false;
    const lower = desc.toLowerCase();
    return keywords.every((kw) => lower.includes(kw));
  };

  for (const category of manifest.categories || []) {
    for (const file of category.files || []) {
      const rawDesc = file.description || file.name || '';
      const desc = rawDesc.toLowerCase();
      const fname = file.filename.toLowerCase();
      const filePath = (file.path || '').toLowerCase();

      if (fname.endsWith('.mpd')) continue;
      if (fname.includes('sticker')) continue;
      if (desc.startsWith('sticker ')) continue;

      // Skip obvious helper / subfile pieces; these are useful for advanced
      // LDraw composition but usually not what we want in a minifig picker.
      if (rawDesc.trim().startsWith('~')) continue;
      if (filePath.includes('parts/s/')) continue;

      if (keywordMatches(desc, 'minifig', 'head') || fname.startsWith('3626')) {
        pushPart(heads, file, 'head');
      } else if (keywordMatches(desc, 'minifig', 'torso') || fname.startsWith('973')) {
        pushPart(torsos, file, 'torso');
      } else if (keywordMatches(desc, 'minifig', 'hip') || fname.startsWith('3815')) {
        pushPart(hips, file, 'hips');
      } else if (keywordMatches(desc, 'minifig', 'leg') || fname.startsWith('3816') || fname.startsWith('3817') || fname.startsWith('970')) {
        pushPart(legs, file, 'legs');
      } else if (keywordMatches(desc, 'minifig', 'arm') || fname.startsWith('3818') || fname.startsWith('3819')) {
        pushPart(arms, file, 'arms');
      } else if (keywordMatches(desc, 'minifig', 'accessory')) {
        pushPart(accessories, file, 'accessory');
      }
    }
  }

  const clamp = (arr, max = 300) =>
    uniqueByFilename(arr)
      // Prefer primary, whole parts for the procedural library and avoid obvious halves.
      .filter((part) => part.primary !== false && part.isHalf !== true)
      .sort((a, b) => a.filename.localeCompare(b.filename))
      .slice(0, max);

  return {
    heads: clamp(heads, 400),
    torsos: clamp(torsos, 400),
    hips: clamp(hips, 200),
    legs: clamp(legs, 400),
    arms: clamp(arms, 200),
    accessories: clamp(accessories, 200)
  };
}

const curatedCharacters = [
  {
    id: 'red-hacker',
    title: '🔴 RED CHARACTER - The Hacker',
    archetype: 'Boundary Breaker',
    colorCode: 4,
    personality: 'Impulsive, boundary-breaker',
    metadata: `0 ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n0 ┃ 🔴 RED CHARACTER - The Hacker                                   ┃\n0 ┃ Position: Left (X=-80, Y=ground, Z=100)                         ┃\n0 ┃ Color: 4 (Red) | Personality: Impulsive, boundary-breaker      ┃\n0 ┃ Stance: Leaning forward eagerly toward message                  ┃\n0 ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
    parts: [
      { label: 'HEAD', filename: '3626bp01.dat', colorCode: 4, description: 'Head - Classic smile / black eyes' },
      { label: 'TORSO', filename: '973c01.dat', colorCode: 4, description: 'Plain torso with arms' },
      { label: 'LEFT ARM', filename: '3818.dat', colorCode: 4, description: 'Left arm' },
      { label: 'RIGHT ARM', filename: '3819.dat', colorCode: 4, description: 'Right arm' },
      { label: 'HIPS', filename: '3815.dat', colorCode: 4, description: 'Hip joint' },
      { label: 'LEFT LEG', filename: '3816.dat', colorCode: 4, description: 'Left leg' },
      { label: 'RIGHT LEG', filename: '3817.dat', colorCode: 4, description: 'Right leg' }
    ]
  },
  {
    id: 'green-designer',
    title: '🟢 GREEN CHARACTER - The Designer',
    archetype: 'Harmony Creator',
    colorCode: 2,
    personality: 'Balanced, harmony-creator',
    metadata: `0 ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n0 ┃ 🟢 GREEN CHARACTER - The Designer                               ┃\n0 ┃ Position: Center (X=0, Y=ground, Z=100)                         ┃\n0 ┃ Color: 2 (Green) | Personality: Balanced, harmony-creator      ┃\n0 ┃ Stance: Centered, arms slightly raised in welcome              ┃\n0 ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
    parts: [
      { label: 'HEAD', filename: '3626bp01.dat', colorCode: 2, description: 'Head - Classic smile / black eyes' },
      { label: 'TORSO', filename: '973c01.dat', colorCode: 2, description: 'Plain torso with arms' },
      { label: 'LEFT ARM', filename: '3818.dat', colorCode: 2, description: 'Left arm' },
      { label: 'RIGHT ARM', filename: '3819.dat', colorCode: 2, description: 'Right arm' },
      { label: 'HIPS', filename: '3815.dat', colorCode: 2, description: 'Hip joint' },
      { label: 'LEFT LEG', filename: '3816.dat', colorCode: 2, description: 'Left leg' },
      { label: 'RIGHT LEG', filename: '3817.dat', colorCode: 2, description: 'Right leg' }
    ]
  },
  {
    id: 'blue-sysadmin',
    title: '🔵 BLUE CHARACTER - The Sysadmin',
    archetype: 'Infrastructure Guardian',
    colorCode: 1,
    personality: 'Calm, systematic',
    metadata: `0 ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n0 ┃ 🔵 BLUE CHARACTER - The Sysadmin                                 ┃\n0 ┃ Position: Right (X=+80, Y=ground, Z=100)                        ┃\n0 ┃ Color: 1 (Blue) | Personality: Calm, systematic                ┃\n0 ┃ Stance: Standing vigilant, scanning horizon                    ┃\n0 ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
    parts: [
      { label: 'HEAD', filename: '3626bp01.dat', colorCode: 1, description: 'Head - Classic smile / black eyes' },
      { label: 'TORSO', filename: '973c01.dat', colorCode: 1, description: 'Plain torso with arms' },
      { label: 'LEFT ARM', filename: '3818.dat', colorCode: 1, description: 'Left arm' },
      { label: 'RIGHT ARM', filename: '3819.dat', colorCode: 1, description: 'Right arm' },
      { label: 'HIPS', filename: '3815.dat', colorCode: 1, description: 'Hip joint' },
      { label: 'LEFT LEG', filename: '3816.dat', colorCode: 1, description: 'Left leg' },
      { label: 'RIGHT LEG', filename: '3817.dat', colorCode: 1, description: 'Right leg' }
    ]
  },
  {
    id: 'purple-operative',
    title: '🟣 PURPLE CHARACTER - The Shadow Operative',
    archetype: 'Duality Specialist',
    colorCode: 22,
    personality: 'Between worlds, complex',
    metadata: `0 ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n0 ┃ 🟣 PURPLE CHARACTER - The Shadow Operative                        ┃\n0 ┃ Position: Rear Left (X=-120, Z=60)                               ┃\n0 ┃ Color: 22 (Purple) | Personality: Between worlds, complex       ┃\n0 ┃ Stance: One foot forward, ready to vanish                       ┃\n0 ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
    parts: [
      { label: 'HEAD', filename: '3626bp01.dat', colorCode: 22, description: 'Head - Classic smile / black eyes' },
      { label: 'TORSO', filename: '973c01.dat', colorCode: 22, description: 'Plain torso with arms' },
      { label: 'LEFT ARM', filename: '3818.dat', colorCode: 22, description: 'Left arm' },
      { label: 'RIGHT ARM', filename: '3819.dat', colorCode: 22, description: 'Right arm' },
      { label: 'HIPS', filename: '3815.dat', colorCode: 22, description: 'Hip joint' },
      { label: 'LEFT LEG', filename: '3816.dat', colorCode: 22, description: 'Left leg' },
      { label: 'RIGHT LEG', filename: '3817.dat', colorCode: 22, description: 'Right leg' }
    ]
  },
  {
    id: 'yellow-intern',
    title: '🟡 YELLOW CHARACTER - The Intern',
    archetype: 'Fresh Eyes',
    colorCode: 14,
    personality: 'Curious, eager learner',
    metadata: `0 ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n0 ┃ 🟡 YELLOW CHARACTER - The Intern                                 ┃\n0 ┃ Position: Rear Right (X=+120, Z=60)                              ┃\n0 ┃ Color: 14 (Yellow) | Personality: Curious, eager learner        ┃\n0 ┃ Stance: Arms forward, ready to help                             ┃\n0 ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
    parts: [
      { label: 'HEAD', filename: '3626bp01.dat', colorCode: 14, description: 'Head - Classic smile / black eyes' },
      { label: 'TORSO', filename: '973c01.dat', colorCode: 14, description: 'Plain torso with arms' },
      { label: 'LEFT ARM', filename: '3818.dat', colorCode: 14, description: 'Left arm' },
      { label: 'RIGHT ARM', filename: '3819.dat', colorCode: 14, description: 'Right arm' },
      { label: 'HIPS', filename: '3815.dat', colorCode: 14, description: 'Hip joint' },
      { label: 'LEFT LEG', filename: '3816.dat', colorCode: 14, description: 'Left leg' },
      { label: 'RIGHT LEG', filename: '3817.dat', colorCode: 14, description: 'Right leg' }
    ]
  },
  {
    id: 'orange-debugger',
    title: '🟠 ORANGE CHARACTER - The Debugger',
    archetype: 'Error Hunter',
    colorCode: 25,
    personality: 'Alert, relentless',
    metadata: `0 ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n0 ┃ 🟠 ORANGE CHARACTER - The Debugger                               ┃\n0 ┃ Position: Front Left (X=-40, Z=40)                              ┃\n0 ┃ Color: 25 (Orange) | Personality: Alert, relentless            ┃\n0 ┃ Stance: Bent over analytics console                            ┃\n0 ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
    parts: [
      { label: 'HEAD', filename: '3626bp01.dat', colorCode: 25, description: 'Head - Classic smile / black eyes' },
      { label: 'TORSO', filename: '973c01.dat', colorCode: 25, description: 'Plain torso with arms' },
      { label: 'LEFT ARM', filename: '3818.dat', colorCode: 25, description: 'Left arm' },
      { label: 'RIGHT ARM', filename: '3819.dat', colorCode: 25, description: 'Right arm' },
      { label: 'HIPS', filename: '3815.dat', colorCode: 25, description: 'Hip joint' },
      { label: 'LEFT LEG', filename: '3816.dat', colorCode: 25, description: 'Left leg' },
      { label: 'RIGHT LEG', filename: '3817.dat', colorCode: 25, description: 'Right leg' }
    ]
  },
  {
    id: 'magenta-designer',
    title: '🎨 MAGENTA CHARACTER - The Designer',
    archetype: 'UX Empath',
    colorCode: 26,
    personality: 'Creative, empathic',
    metadata: `0 ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n0 ┃ 🎨 MAGENTA CHARACTER - The Designer                               ┃\n0 ┃ Position: Front Right (X=+40, Z=40)                              ┃\n0 ┃ Color: 26 (Magenta) | Personality: Creative, empathic          ┃\n0 ┃ Stance: Gesturing to storyboard                                 ┃\n0 ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
    parts: [
      { label: 'HEAD', filename: '3626bp01.dat', colorCode: 26, description: 'Head - Classic smile / black eyes' },
      { label: 'TORSO', filename: '973c01.dat', colorCode: 26, description: 'Plain torso with arms' },
      { label: 'LEFT ARM', filename: '3818.dat', colorCode: 26, description: 'Left arm' },
      { label: 'RIGHT ARM', filename: '3819.dat', colorCode: 26, description: 'Right arm' },
      { label: 'HIPS', filename: '3815.dat', colorCode: 26, description: 'Hip joint' },
      { label: 'LEFT LEG', filename: '3816.dat', colorCode: 26, description: 'Left leg' },
      { label: 'RIGHT LEG', filename: '3817.dat', colorCode: 26, description: 'Right leg' }
    ]
  },
  {
    id: 'lime-scientist',
    title: '📊 LIME CHARACTER - The Data Scientist',
    archetype: 'Pattern Finder',
    colorCode: 27,
    personality: 'Insight-seeking',
    metadata: `0 ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n0 ┃ 📊 LIME CHARACTER - The Data Scientist                             ┃\n0 ┃ Position: Center Rear (X=0, Z=-20)                                ┃\n0 ┃ Color: 27 (Lime) | Personality: Insight-seeking                  ┃\n0 ┃ Stance: Holding datapad, contemplative                           ┃\n0 ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
    parts: [
      { label: 'HEAD', filename: '3626bp01.dat', colorCode: 27, description: 'Head - Classic smile / black eyes' },
      { label: 'TORSO', filename: '973c01.dat', colorCode: 27, description: 'Plain torso with arms' },
      { label: 'LEFT ARM', filename: '3818.dat', colorCode: 27, description: 'Left arm' },
      { label: 'RIGHT ARM', filename: '3819.dat', colorCode: 27, description: 'Right arm' },
      { label: 'HIPS', filename: '3815.dat', colorCode: 27, description: 'Hip joint' },
      { label: 'LEFT LEG', filename: '3816.dat', colorCode: 27, description: 'Left leg' },
      { label: 'RIGHT LEG', filename: '3817.dat', colorCode: 27, description: 'Right leg' }
    ]
  }
];

function summarizeBuckets(buckets) {
  return Object.fromEntries(Object.entries(buckets).map(([key, arr]) => [key, arr.length]));
}

function buildDescriptorLibrary(buckets) {
  const projectBucket = (arr) =>
    arr.map((part) => ({
      filename: part.filename,
      name: part.name,
      description: part.description,
      type: part.type,
      colorName: part.colorName,
      primary: part.primary,
      isHalf: part.isHalf,
      includesArms: part.includesArms,
      includesHips: part.includesHips,
      includesLegs: part.includesLegs,
      includesHands: part.includesHands,
      upperComplete: part.upperComplete,
      lowerComplete: part.lowerComplete,
      headRole: part.headRole,
      headgearType: part.headgearType,
      viableStandardHead: part.viableStandardHead,
      side: part.side,
      canonicalHead: part.canonicalHead
    }));

  return {
    generated: new Date().toISOString(),
    buckets: {
      heads: projectBucket(buckets.heads || []),
      torsos: projectBucket(buckets.torsos || []),
      hips: projectBucket(buckets.hips || []),
      legs: projectBucket(buckets.legs || []),
      arms: projectBucket(buckets.arms || []),
      accessories: projectBucket(buckets.accessories || [])
    }
  };
}

function buildAllPartsDescriptors(manifest) {
  const parts = [];

  for (const category of manifest.categories || []) {
    const categoryName = category.name || category.id || '';
    for (const file of category.files || []) {
      const desc = file.description || file.name || '';
      parts.push({
        filename: file.filename,
        name: file.name || file.filename,
        description: file.description || '',
        path: file.path,
        size: file.size,
        categoryName,
        categoryId: category.id || null,
        colorName: detectColor(desc),
        isMinifig: /minifig/i.test(desc) || /minifigure/i.test(desc)
      });
    }
  }

  return {
    generated: new Date().toISOString(),
    total: parts.length,
    parts
  };
}

function main() {
  const manifest = loadManifest();
  const buckets = pickPartBuckets(manifest);

  const output = {
    generated: new Date().toISOString(),
    source: path.relative(ROOT, MANIFEST_PATH),
    stats: {
      totalFiles: manifest.categories.reduce((sum, category) => sum + (category.files ? category.files.length : 0), 0),
      partBuckets: summarizeBuckets(buckets),
      curatedCount: curatedCharacters.length
    },
    parts: buckets,
    curated: curatedCharacters
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`✅ Minifig library generated → ${path.relative(ROOT, OUTPUT_PATH)}`);
  console.log(`   Heads: ${output.parts.heads.length}`);
  console.log(`   Torsos: ${output.parts.torsos.length}`);
  console.log(`   Hips: ${output.parts.hips.length}`);
  console.log(`   Legs: ${output.parts.legs.length}`);
  console.log(`   Arms: ${output.parts.arms.length}`);
  console.log(`   Accessories: ${output.parts.accessories.length}`);

  const descriptors = buildDescriptorLibrary(buckets);
  fs.writeFileSync(DESCRIPTORS_OUTPUT_PATH, JSON.stringify(descriptors, null, 2));
  console.log(`   Descriptor library → ${path.relative(ROOT, DESCRIPTORS_OUTPUT_PATH)}`);

   // Write per-bucket descriptor files for focused analysis
   const bucketNames = ['heads', 'torsos', 'hips', 'legs', 'arms', 'accessories'];
   bucketNames.forEach((bucketKey) => {
     const bucketParts = (descriptors.buckets && descriptors.buckets[bucketKey]) || [];
     const bucketPath = path.join(INTEGRATION_DIR, `minifig-descriptors-${bucketKey}.json`);
     fs.writeFileSync(
       bucketPath,
       JSON.stringify(
         {
           generated: descriptors.generated,
           bucket: bucketKey,
           count: bucketParts.length,
           parts: bucketParts
         },
         null,
         2
       )
     );
     console.log(`   Bucket ${bucketKey} → ${path.relative(ROOT, bucketPath)}`);
   });

  // All-parts descriptor library (no minifig filtering)
  const allParts = buildAllPartsDescriptors(manifest);
  fs.writeFileSync(ALL_PARTS_DESCRIPTORS_PATH, JSON.stringify(allParts, null, 2));
  console.log(`   All parts descriptors → ${path.relative(ROOT, ALL_PARTS_DESCRIPTORS_PATH)}`);
}

if (require.main === module) {
  main();
}
