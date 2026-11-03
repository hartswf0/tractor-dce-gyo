/*!
 * SCION-YURI-NORSTEIN & SCION-MULTIPLANE-PARALLAX
 * Lineages #5 (Yuri Norstein — Atmospheric Multiplane Cinema),
 *          #26 (PixiJS Archive Stage Rendering Engine),
 *          #44 (Multiplane Parallax — Spatial Collage Swarm),
 *          #45 (Occlusion Compositing — Who Is In Front?)
 *
 * Creative Theorem:
 * "Make depth, obscurity, and reveal carry emotional information.
 *  The world should resist immediate visibility: focus, parallax,
 *  and occlusion become dramatic events."
 *
 * Self-contained browser module exporting `window.ScionMultiplaneStage`.
 */
(function (root) {
  'use strict';

  const PLANE_PARALLAX = Object.freeze({
    Z0: 0.15, // Deep sky / horizon / architectural backplate
    Z1: 0.35, // Mid-ground scenic cutout plates & Z1 mist band
    Z2: 0.65, // Stage actors (.cutout-actor, .stage-tableau-card, .tableau-stage-card) & contact shadows
    Z3: 0.90, // Proscenium apron props (.stage-props-apron)
    Z4: 1.25  // Foreground wings, occlusion silhouettes, Z4 rolling Norstein fog & particles
  });

  const ATMOSPHERE_STATES = Object.freeze({
    reveal: {
      id: 'reveal',
      label: 'Reveal · Clear Focal Plane',
      fogTarget: 0.18,
      z0Blur: 0.5,
      z1Blur: 0.0,
      z4Blur: 0.9,
      vignette: 0.20,
      lightShaftAlpha: 0.85,
      exposure: 1.03,
      wingClosure: 0.0
    },
    obscure: {
      id: 'obscure',
      label: 'Obscure · Norstein Fog Veil',
      fogTarget: 0.74,
      z0Blur: 2.2,
      z1Blur: 1.1,
      z4Blur: 2.8,
      vignette: 0.48,
      lightShaftAlpha: 0.35,
      exposure: 0.90,
      wingClosure: 0.18
    },
    lure: {
      id: 'lure',
      label: 'Lure · Aperture & Distant Glimmer',
      fogTarget: 0.44,
      z0Blur: 0.2,
      z1Blur: 0.4,
      z4Blur: 3.1,
      vignette: 0.54,
      lightShaftAlpha: 1.0,
      exposure: 0.96,
      wingClosure: 0.12
    },
    suspend: {
      id: 'suspend',
      label: 'Suspend · Liminal Stillness',
      fogTarget: 0.52,
      z0Blur: 1.4,
      z1Blur: 0.5,
      z4Blur: 1.9,
      vignette: 0.32,
      lightShaftAlpha: 0.62,
      exposure: 0.98,
      wingClosure: 0.06
    }
  });

  /**
   * 10 Distinct Archival Cutout Scenic Worlds (Chapters I–X)
   */
  const CHAPTER_WORLDS = Object.freeze([
    {
      chapterIdx: 0,
      roman: 'I',
      id: 'corporate_tower',
      title: 'Corporate Glass Tower & Server Racks',
      beatRange: [0, 18],
      defaultAtmosphere: 'lure',
      palette: {
        skyTop: '#f3ece0',
        skyMid: '#e6dcc8',
        skyBot: '#d3c4aa',
        ink: '#252c2a',
        midPlate: '#333d3a',
        wing: '#1d2220',
        accentA: '#e08b2c', // Amber LED
        accentB: '#1ca3b0', // Cyan LED
        fogColor: [236, 229, 214],
        lightColor: [255, 243, 214],
        floorTint: 'rgba(42, 52, 48, 0.08)'
      },
      particleType: 'dust',
      keywords: ['dana', 'office', 'workstation', 'server', 'corporate', 'billing', 'promotion', 'calendar', 'slack', 'open-plan', 'tower', 'desk']
    },
    {
      chapterIdx: 1,
      roman: 'II',
      id: 'departure_circe',
      title: "Departure Pier & Circe's Banquet Loom",
      beatRange: [19, 33],
      defaultAtmosphere: 'lure',
      palette: {
        skyTop: '#f4e7d3',
        skyMid: '#e4cba8',
        skyBot: '#c9a47c',
        ink: '#332228',
        midPlate: '#4a2e38',
        wing: '#26171d',
        accentA: '#d99b32', // Gold dust / loom thread
        accentB: '#8c3b4a', // Banquet wine tapestry
        fogColor: [242, 224, 198],
        lightColor: [255, 228, 170],
        floorTint: 'rgba(74, 46, 56, 0.10)'
      },
      particleType: 'gold_dust',
      keywords: ['circe', 'banquet', 'loom', 'pier', 'harbour', 'harbor', 'departure', 'swine', 'moly', 'potion', 'colonnade', 'tapestry']
    },
    {
      chapterIdx: 2,
      roman: 'III',
      id: 'siren_reef',
      title: 'Siren Reef, Scylla Crags & Fog Bank',
      beatRange: [34, 41],
      defaultAtmosphere: 'obscure',
      palette: {
        skyTop: '#dfe3de',
        skyMid: '#bfc9c8',
        skyBot: '#94a6a8',
        ink: '#1e2c30',
        midPlate: '#2c3e44',
        wing: '#162024',
        accentA: '#d8e4e0', // Seafoam crest
        accentB: '#4a6b70', // Deep swell
        fogColor: [222, 230, 228],
        lightColor: [235, 245, 244],
        floorTint: 'rgba(30, 48, 54, 0.14)'
      },
      particleType: 'mist_spray',
      keywords: ['siren', 'scylla', 'charybdis', 'reef', 'crag', 'vortex', 'wax', 'strait', 'rock', 'fog bank', 'island']
    },
    {
      chapterIdx: 3,
      roman: 'IV',
      id: 'craft_workshop',
      title: "Craft Masters' Timber Workshop",
      beatRange: [42, 46],
      defaultAtmosphere: 'reveal',
      palette: {
        skyTop: '#f6ecdc',
        skyMid: '#e7d4b5',
        skyBot: '#cfb38c',
        ink: '#382618',
        midPlate: '#523822',
        wing: '#291b10',
        accentA: '#d98c2b', // Warm sunbeam / brass plumb
        accentB: '#8c5830', // Cedar timber
        fogColor: [244, 231, 208],
        lightColor: [255, 236, 188],
        floorTint: 'rgba(82, 56, 34, 0.08)'
      },
      particleType: 'sawdust',
      keywords: ['workshop', 'timber', 'mortise', 'tenon', 'truss', 'plumb', 'workbench', 'wenger', 'lave', 'craft master', 'bench', 'carpenter', 'plane']
    },
    {
      chapterIdx: 4,
      roman: 'V',
      id: 'road_older_ladders',
      title: 'The Road of Older Ladders (Guild Crossroads & Kiln)',
      beatRange: [47, 47],
      defaultAtmosphere: 'reveal',
      palette: {
        skyTop: '#f5e8d5',
        skyMid: '#e2c9a6',
        skyBot: '#c7a278',
        ink: '#3b2d22',
        midPlate: '#594230',
        wing: '#2b2017',
        accentA: '#d45b28', // Kiln fire glow
        accentB: '#8c6d4e', // Dressed limestone
        fogColor: [240, 222, 198],
        lightColor: [255, 220, 175],
        floorTint: 'rgba(89, 66, 48, 0.10)'
      },
      particleType: 'heat_motes',
      keywords: ['older ladders', 'road', 'kiln', 'crossroads', 'guild', 'stonemason', 'potter', 'ise jingu', 'ijazah', 'compagnons']
    },
    {
      chapterIdx: 5,
      roman: 'VI',
      id: 'wayfinding_swells',
      title: 'Polynesian Wayfinding Swells & Star Dome',
      beatRange: [48, 50],
      defaultAtmosphere: 'suspend',
      palette: {
        skyTop: '#1d2b3a',
        skyMid: '#2d4459',
        skyBot: '#c4ae89',
        ink: '#15202b',
        midPlate: '#223548',
        wing: '#101922',
        accentA: '#f5dc98', // Navigational stars & stick-chart
        accentB: '#4a7a8c', // Swell interference arc
        fogColor: [185, 200, 210],
        lightColor: [245, 232, 190],
        floorTint: 'rgba(22, 38, 54, 0.18)'
      },
      particleType: 'starlight_spray',
      keywords: ['wayfinding', 'mau', 'swell', 'canoe', 'star', 'outrigger', 'paddle', 'navigator', 'polynesian', 'stick-chart']
    },
    {
      chapterIdx: 6,
      roman: 'VII',
      id: 'cyclops_cavern',
      title: 'Cyclops Cavern & Monolith Forge',
      beatRange: [51, 70],
      defaultAtmosphere: 'obscure',
      palette: {
        skyTop: '#2c2320',
        skyMid: '#47332b',
        skyBot: '#8c5e42',
        ink: '#1c1513',
        midPlate: '#33241f',
        wing: '#140f0d',
        accentA: '#e85626', // Forge hearth & Cyclops eye
        accentB: '#f2a438', // Rising ember
        fogColor: [180, 145, 125],
        lightColor: [255, 160, 100],
        floorTint: 'rgba(40, 24, 18, 0.22)'
      },
      particleType: 'embers',
      keywords: ['cyclops', 'polyphemus', 'cavern', 'forge', 'stalactite', 'kpi', 'sheep', 'dashboard', 'monolith', 'blinded', 'cave']
    },
    {
      chapterIdx: 7,
      roman: 'VIII',
      id: 'underworld_asphodel',
      title: 'Underworld of Asphodel & Pale Mist',
      beatRange: [71, 76],
      defaultAtmosphere: 'suspend',
      palette: {
        skyTop: '#d5dad6',
        skyMid: '#b5bfba',
        skyBot: '#8c9993',
        ink: '#242b28',
        midPlate: '#343e3a',
        wing: '#1a201e',
        accentA: '#f7faf6', // Pale moon aperture
        accentB: '#7a8f88', // Asphodel & willow
        fogColor: [228, 234, 230],
        lightColor: [242, 248, 244],
        floorTint: 'rgba(42, 52, 48, 0.16)'
      },
      particleType: 'ash_mist',
      keywords: ['underworld', 'asphodel', 'ajax', 'shade', 'mist', 'willow', 'cypress', 'ghost', 'hades', 'silent builder']
    },
    {
      chapterIdx: 8,
      roman: 'IX',
      id: 'suitors_hall',
      title: 'Great Hall of the Suitors & Twelve Axe-Heads',
      beatRange: [77, 93],
      defaultAtmosphere: 'reveal',
      palette: {
        skyTop: '#efe0c6',
        skyMid: '#d8be96',
        skyBot: '#b59062',
        ink: '#332316',
        midPlate: '#4f3520',
        wing: '#24170d',
        accentA: '#b87d32', // Twelve bronze axe-heads
        accentB: '#ea7324', // Torchlight flicker
        fogColor: [238, 218, 188],
        lightColor: [255, 215, 155],
        floorTint: 'rgba(79, 53, 32, 0.12)'
      },
      particleType: 'torch_sparks',
      keywords: ['suitor', 'great hall', 'axe', 'twelve', 'bow', 'doric', 'column', 'telemachus', 'megaron', 'hall']
    },
    {
      chapterIdx: 9,
      roman: 'X',
      id: 'fathers_orchard',
      title: "Father's Terraced Orchard (Ithaca)",
      beatRange: [94, 120],
      defaultAtmosphere: 'reveal',
      palette: {
        skyTop: '#f8f2e2',
        skyMid: '#e8dcc0',
        skyBot: '#cbb994',
        ink: '#2d3326',
        midPlate: '#465239',
        wing: '#242b1d',
        accentA: '#f5dfe0', // Orchard blossom
        accentB: '#6c7d56', // Olive & fig foliage
        fogColor: [246, 240, 224],
        lightColor: [255, 248, 212],
        floorTint: 'rgba(70, 82, 57, 0.08)'
      },
      particleType: 'blossoms',
      keywords: ['orchard', 'father', 'laertes', 'olive', 'fig', 'graft', 'caliper', 'terrace', 'ithaca', 'tree', 'scion']
    }
  ]);

  const ROMAN_TO_INDEX = {
    I: 0, II: 1, III: 2, IV: 3, V: 4,
    VI: 5, VII: 6, VIII: 7, IX: 8, X: 9
  };

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /**
   * Resolve which of the 10 Scenic Worlds applies based on beat, chapterIdx, and keyword overrides.
   */
  function resolveScenicWorld(beat, chapterIdx, options) {
    const opts = options || {};

    // 1. Explicit worldId override
    if (opts.worldId) {
      const byId = CHAPTER_WORLDS.find(w => w.id === opts.worldId);
      if (byId) return byId;
    }

    // Extract beat object or string
    let beatIdStr = '';
    let textBlob = '';
    let chapterStr = '';

    if (typeof beat === 'string') {
      beatIdStr = beat;
    } else if (beat && typeof beat === 'object') {
      beatIdStr = String(beat.id || beat.beat_id || '');
      chapterStr = String(beat.chapter || beat.cluster || '');
      textBlob = [
        beat.location,
        beat.setting,
        beat.title,
        beat.name,
        beat.summary,
        beat.interpretation_note,
        beat.notes,
        opts.location,
        opts.setting,
        opts.title,
        opts.summary
      ].filter(Boolean).join(' ').toLowerCase();
    } else {
      textBlob = [opts.location, opts.setting, opts.title, opts.summary].filter(Boolean).join(' ').toLowerCase();
    }

    // 2. Check beat number first if we have an exact beat_N ID
    const beatMatch = beatIdStr.match(/beat_(\d+)/i);
    const beatNum = beatMatch ? parseInt(beatMatch[1], 10) : NaN;

    // 3. Check strong keyword overrides from location / title / summary / setting
    if (textBlob) {
      if (/\b(orchard|laertes|grafting|olive tree|fig tree)\b/i.test(textBlob)) return CHAPTER_WORLDS[9];
      if (/\b(suitor|twelve axe|axe-head|great hall|megaron)\b/i.test(textBlob)) return CHAPTER_WORLDS[8];
      if (/\b(asphodel|underworld|hades|ajax)\b/i.test(textBlob) && (isNaN(beatNum) || beatNum >= 70)) return CHAPTER_WORLDS[7];
      if (/\b(cyclops|polyphemus|stalactite|monolith forge|metric sheep)\b/i.test(textBlob)) return CHAPTER_WORLDS[6];
      if (/\b(wayfinding|mau piailug|stick-chart|star compass|outrigger|polynesian)\b/i.test(textBlob)) return CHAPTER_WORLDS[5];
      if (/\b(older ladders|potter's kiln|guild crossroads|ise jingu|ijazah)\b/i.test(textBlob)) return CHAPTER_WORLDS[4];
      if (/\b(timber workshop|mortise|tenon|plumb line|etienne wenger|jean lave)\b/i.test(textBlob)) return CHAPTER_WORLDS[3];
      if (/\b(siren|scylla|charybdis|reef|fog bank)\b/i.test(textBlob) && (isNaN(beatNum) || beatNum >= 24)) return CHAPTER_WORLDS[2];
      if (/\b(circe|banquet loom|departure pier|moly|swine)\b/i.test(textBlob)) return CHAPTER_WORLDS[1];
      if (/\b(server rack|dana's office|billing-code|corporate glass)\b/i.test(textBlob)) return CHAPTER_WORLDS[0];
    }

    // 4. Explicit chapterIdx parameter (supports 0..9, 1..10, or Roman numeral 'I'..'X')
    if (chapterIdx !== undefined && chapterIdx !== null && chapterIdx !== '') {
      if (typeof chapterIdx === 'string') {
        const cleanRoman = chapterIdx.split('.')[0].trim().toUpperCase();
        if (ROMAN_TO_INDEX[cleanRoman] !== undefined) {
          return CHAPTER_WORLDS[ROMAN_TO_INDEX[cleanRoman]];
        }
        const parsed = parseInt(chapterIdx, 10);
        if (!isNaN(parsed)) {
          const idx = clamp(parsed >= 1 && parsed <= 10 && opts.oneIndexed ? parsed - 1 : parsed, 0, 9);
          return CHAPTER_WORLDS[idx];
        }
      } else if (typeof chapterIdx === 'number' && !isNaN(chapterIdx)) {
        const idx = clamp(chapterIdx, 0, 9);
        return CHAPTER_WORLDS[idx];
      }
    }

    // 5. Chapter Roman numeral from beat.chapter / beat.cluster
    if (chapterStr) {
      const roman = chapterStr.split('.')[0].trim().toUpperCase();
      if (ROMAN_TO_INDEX[roman] !== undefined) {
        return CHAPTER_WORLDS[ROMAN_TO_INDEX[roman]];
      }
    }

    // 6. Beat number range mapping (Ch I..X)
    if (!isNaN(beatNum)) {
      if (beatNum <= 18) return CHAPTER_WORLDS[0];
      if (beatNum <= 33) return CHAPTER_WORLDS[1];
      if (beatNum <= 41) return CHAPTER_WORLDS[2];
      if (beatNum <= 46) return CHAPTER_WORLDS[3];
      if (beatNum === 47) return CHAPTER_WORLDS[4];
      if (beatNum <= 50) return CHAPTER_WORLDS[5];
      if (beatNum <= 70) return CHAPTER_WORLDS[6];
      if (beatNum <= 76) return CHAPTER_WORLDS[7];
      if (beatNum <= 93) return CHAPTER_WORLDS[8];
      return CHAPTER_WORLDS[9];
    }

    return CHAPTER_WORLDS[0];
  }

  /**
   * Inject scoped multiplane CSS rules once into document.head
   */
  function ensureStylesInjected() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('scion-multiplane-stage-styles')) return;

    const style = document.createElement('style');
    style.id = 'scion-multiplane-stage-styles';
    style.textContent = `
      .proscenium-box {
        --scion-z0-x: 0px;
        --scion-z0-y: 0px;
        --scion-z1-x: 0px;
        --scion-z1-y: 0px;
        --scion-z2-x: 0px;
        --scion-z2-y: 0px;
        --scion-z3-x: 0px;
        --scion-z3-y: 0px;
        --scion-z4-x: 0px;
        --scion-z4-y: 0px;
      }

      /* Multiplane Backdrop Container (behind .stage-floor-area which is z-index: 4) */
      .scion-multiplane-backdrop {
        position: absolute;
        inset: 0;
        pointer-events: none !important;
        z-index: 2;
        overflow: hidden;
        user-select: none;
      }

      .scion-plane-canvas {
        position: absolute;
        inset: -24px;
        width: calc(100% + 48px);
        height: calc(100% + 48px);
        pointer-events: none !important;
        will-change: transform, filter;
      }

      /* Foreground Z4 Occlusion Wings & Norstein Fog Layer (in front of .stage-floor-area z-index:4, behind valance z-index:6 & apron z-index:7) */
      .scion-multiplane-foreground {
        position: absolute;
        inset: 0;
        pointer-events: none !important;
        z-index: 5;
        overflow: hidden;
        user-select: none;
      }

      /* Grounded Contact Shadow Layer inside .stage-floor-area (above plank ::after z-index:1, below .cutout-actor z-index:3) */
      .scion-floor-shadows-layer {
        position: absolute;
        inset: 0;
        pointer-events: none !important;
        z-index: 2;
        overflow: hidden;
      }

      .scion-contact-shadow {
        position: absolute;
        pointer-events: none !important;
        border-radius: 50%;
        transform: translate(-50%, 50%);
        background: radial-gradient(
          ellipse at center,
          rgba(22, 15, 8, 0.56) 0%,
          rgba(28, 20, 12, 0.34) 44%,
          rgba(38, 26, 15, 0.12) 72%,
          rgba(38, 26, 15, 0) 100%
        );
        transition: width 0.18s ease, opacity 0.18s ease;
        will-change: left, bottom, width, height, transform;
      }

      .scion-contact-shadow.is-speaking-shadow {
        background: radial-gradient(
          ellipse at center,
          rgba(20, 13, 6, 0.64) 0%,
          rgba(152, 95, 34, 0.34) 48%,
          rgba(224, 155, 62, 0.14) 76%,
          rgba(224, 155, 62, 0) 100%
        );
      }

      .scion-contact-shadow.is-tableau-shadow {
        border-radius: 40%;
        background: radial-gradient(
          ellipse at center,
          rgba(24, 16, 9, 0.48) 0%,
          rgba(34, 24, 14, 0.24) 55%,
          rgba(34, 24, 14, 0) 100%
        );
      }

      /* Local Contact Shadow under each actor & tableau card so characters never float */
      .cutout-actor::before,
      .stage-tableau-card::before,
      .tableau-stage-card::before {
        content: "";
        position: absolute;
        left: 50%;
        bottom: -4px;
        width: 82%;
        height: 15px;
        transform: translateX(-50%);
        border-radius: 50%;
        background: radial-gradient(
          ellipse at center,
          rgba(20, 14, 7, 0.52) 0%,
          rgba(28, 19, 10, 0.26) 52%,
          rgba(28, 19, 10, 0) 100%
        );
        pointer-events: none;
        z-index: 0;
      }

      /* Z2 Parallax on actors and tableau cards while preserving hover lift */
      .proscenium-box .cutout-actor,
      .proscenium-box .stage-tableau-card,
      .proscenium-box .tableau-stage-card {
        transform: translate3d(var(--scion-actor-px, var(--scion-z2-x, 0px)), var(--scion-actor-py, var(--scion-z2-y, 0px)), 0);
      }

      .proscenium-box .cutout-actor:hover {
        transform: translate3d(var(--scion-actor-px, var(--scion-z2-x, 0px)), calc(var(--scion-actor-py, var(--scion-z2-y, 0px)) - 4px), 0) scale(1.02);
      }

      /* Z3 Parallax on apron props */
      .proscenium-box .stage-props-apron {
        transform: translate3d(var(--scion-z3-x, 0px), var(--scion-z3-y, 0px), 0);
      }

      /* Subtle Scenic World Watermark Pill (pointer-events: none) */
      .scion-world-watermark {
        position: absolute;
        right: 12px;
        top: 64px;
        bottom: auto;
        z-index: 3;
        pointer-events: none !important;
        font-family: var(--font-mono, monospace);
        font-size: 0.5rem;
        font-weight: 700;
        letter-spacing: 0.03em;
        color: rgba(45, 36, 26, 0.72);
        background: rgba(251, 248, 241, 0.72);
        border: 1px solid rgba(140, 118, 88, 0.36);
        border-radius: 4px;
        padding: 1px 6px;
        white-space: nowrap;
        backdrop-filter: blur(2px);
      }
      @media (max-width: 960px) {
        .scion-world-watermark {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Generate deterministic pseudo-random numbers for scenic cutouts
   */
  function seededRandom(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  /**
   * Draw paper-cut edge stroke helper
   */
  function strokePaperEdge(ctx, color, width) {
    ctx.strokeStyle = color || 'rgba(251, 246, 236, 0.45)';
    ctx.lineWidth = width || 1.2;
    ctx.stroke();
  }

  // ============================================================================
  // SCENIC WORLD PROCEDURAL ARCHIVAL CUTOUT RENDERERS (Z0, Z1, Z4)
  // ============================================================================

  const WorldRenderers = {
    /**
     * 1. Ch I: Corporate Glass Tower & Server Racks
     */
    corporate_tower(ctxZ0, ctxZ1, ctxZ4, w, h, t, state) {
      const pal = state.world.palette;

      // Z0: Warm parchment corporate grid & venetian blind shadow slats
      const grad = ctxZ0.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, pal.skyTop);
      grad.addColorStop(0.65, pal.skyMid);
      grad.addColorStop(1, pal.skyBot);
      ctxZ0.fillStyle = grad;
      ctxZ0.fillRect(0, 0, w, h);

      // Perspective drafting grid on Z0
      ctxZ0.strokeStyle = 'rgba(45, 58, 54, 0.09)';
      ctxZ0.lineWidth = 1;
      const gridStepX = Math.max(28, Math.floor(w / 16));
      const gridStepY = Math.max(22, Math.floor(h / 10));
      for (let x = 0; x <= w; x += gridStepX) {
        ctxZ0.beginPath();
        ctxZ0.moveTo(x, 0);
        ctxZ0.lineTo(x, h);
        ctxZ0.stroke();
      }
      for (let y = 0; y <= h; y += gridStepY) {
        ctxZ0.beginPath();
        ctxZ0.moveTo(0, y);
        ctxZ0.lineTo(w, y);
        ctxZ0.stroke();
      }

      // Venetian blind diagonal shadow slats across backplate
      ctxZ0.save();
      ctxZ0.fillStyle = 'rgba(32, 38, 36, 0.065)';
      const slatCount = 11;
      for (let i = 0; i < slatCount; i++) {
        const sy = (i / slatCount) * h * 0.85 + Math.sin(t * 0.4 + i * 0.2) * 2;
        ctxZ0.beginPath();
        ctxZ0.moveTo(w * 0.12, sy);
        ctxZ0.lineTo(w * 0.88, sy + 14);
        ctxZ0.lineTo(w * 0.88, sy + 22);
        ctxZ0.lineTo(w * 0.12, sy + 8);
        ctxZ0.closePath();
        ctxZ0.fill();
      }
      ctxZ0.restore();

      // Z1: Hanging fluorescent baffles + Server rack monoliths with blinking amber/cyan LEDs
      const baffleY = h * 0.16;
      const baffleCount = 5;
      for (let i = 0; i < baffleCount; i++) {
        const bx = w * (0.14 + i * 0.18);
        const bw = w * 0.12;
        // Suspension wires
        ctxZ1.strokeStyle = 'rgba(35, 42, 40, 0.45)';
        ctxZ1.lineWidth = 1;
        ctxZ1.beginPath();
        ctxZ1.moveTo(bx + bw * 0.2, 0);
        ctxZ1.lineTo(bx + bw * 0.2, baffleY);
        ctxZ1.moveTo(bx + bw * 0.8, 0);
        ctxZ1.lineTo(bx + bw * 0.8, baffleY);
        ctxZ1.stroke();

        // Baffle trapezoid
        ctxZ1.fillStyle = '#3b4441';
        ctxZ1.beginPath();
        ctxZ1.moveTo(bx, baffleY);
        ctxZ1.lineTo(bx + bw, baffleY);
        ctxZ1.lineTo(bx + bw + 6, baffleY + 11);
        ctxZ1.lineTo(bx - 6, baffleY + 11);
        ctxZ1.closePath();
        ctxZ1.fill();
        strokePaperEdge(ctxZ1, 'rgba(255, 250, 238, 0.5)', 1);

        // Warm fluorescent tube glow strip
        const flicker = 0.75 + 0.2 * Math.sin(t * 3.1 + i * 1.7);
        ctxZ1.fillStyle = `rgba(255, 246, 218, ${0.85 * flicker})`;
        ctxZ1.fillRect(bx + 3, baffleY + 9, bw - 6, 3);
      }

      // Server Rack Monoliths (left and right mid-plane)
      const rackConfigs = [
        { x: w * 0.05, y: h * 0.24, rw: w * 0.11, rh: h * 0.68, seed: 101 },
        { x: w * 0.17, y: h * 0.28, rw: w * 0.09, rh: h * 0.64, seed: 202 },
        { x: w * 0.74, y: h * 0.28, rw: w * 0.09, rh: h * 0.64, seed: 303 },
        { x: w * 0.84, y: h * 0.24, rw: w * 0.11, rh: h * 0.68, seed: 404 }
      ];

      rackConfigs.forEach((rk, rIdx) => {
        ctxZ1.fillStyle = rIdx % 2 === 0 ? '#272f2d' : '#323c39';
        ctxZ1.fillRect(rk.x, rk.y, rk.rw, rk.rh);
        strokePaperEdge(ctxZ1, 'rgba(235, 224, 204, 0.4)', 1.2);

        // Server blade slots & blinking amber/cyan LEDs
        const rows = 12;
        const slotH = (rk.rh - 16) / rows;
        for (let row = 0; row < rows; row++) {
          const sy = rk.y + 8 + row * slotH;
          ctxZ1.fillStyle = 'rgba(18, 22, 21, 0.65)';
          ctxZ1.fillRect(rk.x + 5, sy, rk.rw - 10, slotH * 0.68);

          // Blinking LEDs
          const phase = t * (2.2 + (row % 4) * 0.7) + rIdx * 1.9 + row * 0.8;
          const isAmber = (row + rIdx) % 3 !== 0;
          const ledOn = Math.sin(phase) > -0.2;
          if (ledOn) {
            ctxZ1.fillStyle = isAmber ? pal.accentA : pal.accentB;
            ctxZ1.beginPath();
            ctxZ1.arc(rk.x + 11, sy + slotH * 0.34, 2.1, 0, Math.PI * 2);
            ctxZ1.fill();

            if (row % 2 === 0) {
              ctxZ1.fillStyle = !isAmber ? pal.accentA : pal.accentB;
              ctxZ1.beginPath();
              ctxZ1.arc(rk.x + 18, sy + slotH * 0.34, 1.8, 0, Math.PI * 2);
              ctxZ1.fill();
            }
          }
        }
      });

      // Z4: Foreground glass-tower mullion wings & venetian blind bar silhouette at top
      const wingW = w * (0.045 + state.wingClosure * 0.08);
      ctxZ4.fillStyle = pal.wing;
      ctxZ4.fillRect(0, 0, wingW, h);
      ctxZ4.fillRect(w - wingW, 0, wingW, h);
      strokePaperEdge(ctxZ4, 'rgba(218, 202, 176, 0.35)', 1.5);
    },

    /**
     * 2. Ch II: Departure Pier & Circe's Banquet Loom
     */
    departure_circe(ctxZ0, ctxZ1, ctxZ4, w, h, t, state) {
      const pal = state.world.palette;

      // Z0: Harbour horizon & twilight parchment sky
      const grad = ctxZ0.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, pal.skyTop);
      grad.addColorStop(0.58, pal.skyMid);
      grad.addColorStop(1, pal.skyBot);
      ctxZ0.fillStyle = grad;
      ctxZ0.fillRect(0, 0, w, h);

      // Distant classical island & ship masts on horizon
      const horizY = h * 0.68;
      ctxZ0.fillStyle = 'rgba(74, 46, 56, 0.18)';
      ctxZ0.beginPath();
      ctxZ0.moveTo(0, horizY);
      ctxZ0.quadraticCurveTo(w * 0.25, horizY - 28, w * 0.48, horizY);
      ctxZ0.lineTo(w, horizY);
      ctxZ0.lineTo(w, h);
      ctxZ0.lineTo(0, h);
      ctxZ0.closePath();
      ctxZ0.fill();

      // Z1 Left: Harbour timber pilings & mooring bollard
      const pilings = [
        { x: w * 0.06, top: h * 0.34, pw: 18 },
        { x: w * 0.12, top: h * 0.40, pw: 15 },
        { x: w * 0.18, top: h * 0.46, pw: 14 }
      ];
      pilings.forEach((p, idx) => {
        ctxZ1.fillStyle = idx % 2 === 0 ? '#3e2923' : '#4d342c';
        ctxZ1.fillRect(p.x, p.top, p.pw, h - p.top);
        strokePaperEdge(ctxZ1, 'rgba(244, 224, 192, 0.45)', 1);
      });

      // Z1 Right: Circe's Colonnade & Vertical Banquet Loom with golden threads
      const loomLeft = w * 0.68;
      const loomRight = w * 0.91;
      const loomTop = h * 0.15;
      // Colonnade pillars
      [loomLeft, loomRight].forEach(cx => {
        ctxZ1.fillStyle = '#4a2e38';
        ctxZ1.fillRect(cx - 10, loomTop, 20, h - loomTop);
        ctxZ1.fillRect(cx - 14, loomTop - 6, 28, 8);
        strokePaperEdge(ctxZ1, 'rgba(245, 220, 180, 0.45)', 1.1);
      });
      // Loom crossbar
      ctxZ1.fillStyle = '#5c3945';
      ctxZ1.fillRect(loomLeft - 14, loomTop + 8, loomRight - loomLeft + 28, 10);

      // Hanging tapestry warp threads & woven pattern
      const threadCount = 16;
      for (let i = 0; i < threadCount; i++) {
        const tx = lerp(loomLeft + 12, loomRight - 12, i / (threadCount - 1));
        const sway = Math.sin(t * 1.6 + i * 0.45) * 3.5;
        ctxZ1.strokeStyle = i % 3 === 0 ? 'rgba(217, 155, 50, 0.78)' : 'rgba(140, 59, 74, 0.62)';
        ctxZ1.lineWidth = i % 3 === 0 ? 1.6 : 1.1;
        ctxZ1.beginPath();
        ctxZ1.moveTo(tx, loomTop + 18);
        ctxZ1.quadraticCurveTo(tx + sway, h * 0.52, tx - sway * 0.5, h * 0.86);
        ctxZ1.stroke();
      }

      // Z4: Foreground paper-cut ship rigging ropes & pulley blocks
      ctxZ4.strokeStyle = pal.wing;
      ctxZ4.lineWidth = 3.2;
      const ropeSway = Math.sin(t * 0.9) * 4;
      [
        [w * 0.02, 0, w * 0.16, h * 0.92],
        [w * 0.09, 0, w * 0.01, h * 0.75],
        [w * 0.96, 0, w * 0.85, h * 0.88]
      ].forEach(([x1, y1, x2, y2]) => {
        ctxZ4.beginPath();
        ctxZ4.moveTo(x1, y1);
        ctxZ4.quadraticCurveTo((x1 + x2) * 0.5 + ropeSway, (y1 + y2) * 0.5, x2, y2);
        ctxZ4.stroke();
      });
    },

    /**
     * 3. Ch III: Siren Reef, Scylla Crags & Fog Bank
     */
    siren_reef(ctxZ0, ctxZ1, ctxZ4, w, h, t, state) {
      const pal = state.world.palette;

      // Z0: Engraved storm sky & distant Siren Reef spires
      const grad = ctxZ0.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, pal.skyTop);
      grad.addColorStop(0.55, pal.skyMid);
      grad.addColorStop(1, pal.skyBot);
      ctxZ0.fillStyle = grad;
      ctxZ0.fillRect(0, 0, w, h);

      // Charybdis distant vortex arcs in sky/sea
      ctxZ0.strokeStyle = 'rgba(30, 44, 48, 0.12)';
      ctxZ0.lineWidth = 1.2;
      for (let r = 1; r <= 5; r++) {
        ctxZ0.beginPath();
        ctxZ0.arc(w * 0.5, h * 0.55, r * 38 + Math.sin(t + r) * 4, Math.PI * 1.08, Math.PI * 1.92);
        ctxZ0.stroke();
      }

      // Z1: Jagged Scylla & Siren sea crags
      ctxZ1.fillStyle = '#26373c';
      ctxZ1.beginPath();
      ctxZ1.moveTo(w * 0.02, h);
      ctxZ1.lineTo(w * 0.05, h * 0.28);
      ctxZ1.lineTo(w * 0.11, h * 0.44);
      ctxZ1.lineTo(w * 0.16, h * 0.22);
      ctxZ1.lineTo(w * 0.24, h * 0.65);
      ctxZ1.lineTo(w * 0.29, h);
      ctxZ1.closePath();
      ctxZ1.fill();
      strokePaperEdge(ctxZ1, 'rgba(230, 240, 238, 0.5)', 1.3);

      // Right Scylla crag overhang
      ctxZ1.fillStyle = '#1f2e33';
      ctxZ1.beginPath();
      ctxZ1.moveTo(w * 0.72, h);
      ctxZ1.lineTo(w * 0.76, h * 0.36);
      ctxZ1.lineTo(w * 0.83, h * 0.18);
      ctxZ1.lineTo(w * 0.89, h * 0.38);
      ctxZ1.lineTo(w * 0.95, h * 0.20);
      ctxZ1.lineTo(w * 0.99, h);
      ctxZ1.closePath();
      ctxZ1.fill();
      strokePaperEdge(ctxZ1, 'rgba(230, 240, 238, 0.5)', 1.3);

      // Rolling paper-cut wave crests at 3 depths in Z1
      for (let layer = 0; layer < 3; layer++) {
        const baseY = h * (0.64 + layer * 0.09);
        const speed = (layer + 1) * 0.9;
        const amp = 7 + layer * 3;
        ctxZ1.fillStyle = layer === 0 ? '#435b61' : layer === 1 ? '#32484e' : '#23353a';
        ctxZ1.beginPath();
        ctxZ1.moveTo(-20, h);
        for (let x = -20; x <= w + 20; x += 28) {
          const wy = baseY + Math.sin(x * 0.025 + t * speed + layer * 1.4) * amp;
          ctxZ1.lineTo(x, wy);
        }
        ctxZ1.lineTo(w + 20, h);
        ctxZ1.closePath();
        ctxZ1.fill();
        strokePaperEdge(ctxZ1, 'rgba(238, 246, 244, 0.65)', 1.4);
      }

      // Z4: Foreground jagged sea-tooth wings
      ctxZ4.fillStyle = pal.wing;
      ctxZ4.beginPath();
      ctxZ4.moveTo(0, 0);
      ctxZ4.lineTo(w * 0.08, 0);
      ctxZ4.lineTo(w * 0.04, h * 0.35);
      ctxZ4.lineTo(w * 0.09, h * 0.62);
      ctxZ4.lineTo(w * 0.05, h);
      ctxZ4.lineTo(0, h);
      ctxZ4.closePath();
      ctxZ4.fill();

      ctxZ4.beginPath();
      ctxZ4.moveTo(w, 0);
      ctxZ4.lineTo(w * 0.92, 0);
      ctxZ4.lineTo(w * 0.96, h * 0.38);
      ctxZ4.lineTo(w * 0.91, h * 0.68);
      ctxZ4.lineTo(w * 0.95, h);
      ctxZ4.lineTo(w, h);
      ctxZ4.closePath();
      ctxZ4.fill();
    },

    /**
     * 4. Ch IV: Craft Masters' Timber Workshop
     */
    craft_workshop(ctxZ0, ctxZ1, ctxZ4, w, h, t, state) {
      const pal = state.world.palette;

      // Z0: Warm timber-toned parchment & clerestory window panes
      const grad = ctxZ0.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, pal.skyTop);
      grad.addColorStop(0.6, pal.skyMid);
      grad.addColorStop(1, pal.skyBot);
      ctxZ0.fillStyle = grad;
      ctxZ0.fillRect(0, 0, w, h);

      // Tool pegboard silhouettes on back wall
      ctxZ0.fillStyle = 'rgba(56, 38, 24, 0.12)';
      // Framing square
      ctxZ0.fillRect(w * 0.26, h * 0.28, 36, 6);
      ctxZ0.fillRect(w * 0.26, h * 0.28, 6, 48);
      // Hand saw blade
      ctxZ0.beginPath();
      ctxZ0.moveTo(w * 0.70, h * 0.26);
      ctxZ0.lineTo(w * 0.74, h * 0.26);
      ctxZ0.lineTo(w * 0.73, h * 0.50);
      ctxZ0.lineTo(w * 0.70, h * 0.50);
      ctxZ0.closePath();
      ctxZ0.fill();

      // Z1: Mortise-and-tenon timber roof trusses
      ctxZ1.fillStyle = '#4e341f';
      // Tie beam across top
      const beamY = h * 0.14;
      ctxZ1.fillRect(w * 0.04, beamY, w * 0.92, 14);
      strokePaperEdge(ctxZ1, 'rgba(250, 232, 200, 0.5)', 1.2);

      // King post & diagonal struts with oak peg dowels
      ctxZ1.fillRect(w * 0.5 - 8, 0, 16, beamY + 14);
      ctxZ1.beginPath();
      ctxZ1.moveTo(w * 0.06, beamY + 14);
      ctxZ1.lineTo(w * 0.28, 0);
      ctxZ1.lineTo(w * 0.32, 0);
      ctxZ1.lineTo(w * 0.11, beamY + 14);
      ctxZ1.closePath();
      ctxZ1.fill();

      ctxZ1.beginPath();
      ctxZ1.moveTo(w * 0.94, beamY + 14);
      ctxZ1.lineTo(w * 0.72, 0);
      ctxZ1.lineTo(w * 0.68, 0);
      ctxZ1.lineTo(w * 0.89, beamY + 14);
      ctxZ1.closePath();
      ctxZ1.fill();

      // Hanging Plumb Lines with brass plumb bobs
      [w * 0.18, w * 0.82].forEach((px, idx) => {
        const swing = Math.sin(t * 1.4 + idx * 2.1) * 5;
        const bobX = px + swing;
        const bobY = h * (idx === 0 ? 0.48 : 0.44);
        ctxZ1.strokeStyle = 'rgba(56, 38, 24, 0.7)';
        ctxZ1.lineWidth = 1.2;
        ctxZ1.beginPath();
        ctxZ1.moveTo(px, beamY + 14);
        ctxZ1.lineTo(bobX, bobY);
        ctxZ1.stroke();

        // Brass plumb bob cone
        ctxZ1.fillStyle = pal.accentA;
        ctxZ1.beginPath();
        ctxZ1.moveTo(bobX - 6, bobY);
        ctxZ1.lineTo(bobX + 6, bobY);
        ctxZ1.lineTo(bobX, bobY + 15);
        ctxZ1.closePath();
        ctxZ1.fill();
        strokePaperEdge(ctxZ1, 'rgba(255, 245, 215, 0.65)', 1);
      });

      // Joiner's Workbench silhouettes in mid-ground
      ctxZ1.fillStyle = '#3f2a19';
      ctxZ1.fillRect(w * 0.06, h * 0.64, w * 0.18, 10);
      ctxZ1.fillRect(w * 0.08, h * 0.64, 10, h * 0.28);
      ctxZ1.fillRect(w * 0.20, h * 0.64, 10, h * 0.28);

      ctxZ1.fillRect(w * 0.76, h * 0.64, w * 0.18, 10);
      ctxZ1.fillRect(w * 0.78, h * 0.64, 10, h * 0.28);
      ctxZ1.fillRect(w * 0.90, h * 0.64, 10, h * 0.28);

      // Z4: Foreground notched timber posts
      const postW = w * 0.05;
      ctxZ4.fillStyle = pal.wing;
      ctxZ4.fillRect(0, 0, postW, h);
      ctxZ4.fillRect(w - postW, 0, postW, h);
      strokePaperEdge(ctxZ4, 'rgba(235, 206, 165, 0.4)', 1.4);
    },

    /**
     * 5. Ch V: The Road of Older Ladders (Guild Crossroads & Kiln)
     */
    road_older_ladders(ctxZ0, ctxZ1, ctxZ4, w, h, t, state) {
      const pal = state.world.palette;

      // Z0: Terraced hills & distant stone viaduct
      const grad = ctxZ0.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, pal.skyTop);
      grad.addColorStop(0.58, pal.skyMid);
      grad.addColorStop(1, pal.skyBot);
      ctxZ0.fillStyle = grad;
      ctxZ0.fillRect(0, 0, w, h);

      ctxZ0.fillStyle = 'rgba(89, 66, 48, 0.16)';
      ctxZ0.beginPath();
      ctxZ0.moveTo(0, h * 0.62);
      ctxZ0.quadraticCurveTo(w * 0.35, h * 0.44, w * 0.68, h * 0.58);
      ctxZ0.quadraticCurveTo(w * 0.85, h * 0.48, w, h * 0.56);
      ctxZ0.lineTo(w, h);
      ctxZ0.lineTo(0, h);
      ctxZ0.closePath();
      ctxZ0.fill();

      // Z1 Left: Stone Archway & Guild Crossroads Signpost
      ctxZ1.fillStyle = '#594230';
      ctxZ1.beginPath();
      ctxZ1.moveTo(0, 0);
      ctxZ1.lineTo(w * 0.26, 0);
      ctxZ1.lineTo(w * 0.26, h * 0.22);
      ctxZ1.arc(w * 0.13, h * 0.38, w * 0.11, -Math.PI * 0.15, Math.PI, true);
      ctxZ1.lineTo(w * 0.04, h);
      ctxZ1.lineTo(0, h);
      ctxZ1.closePath();
      ctxZ1.fill();
      strokePaperEdge(ctxZ1, 'rgba(246, 230, 204, 0.5)', 1.3);

      // Guild Signpost at crossroads
      const postX = w * 0.23;
      ctxZ1.fillStyle = '#3b2b1e';
      ctxZ1.fillRect(postX - 3, h * 0.32, 6, h * 0.58);
      // Directional wooden signs
      ctxZ1.fillStyle = '#6e5239';
      ctxZ1.beginPath();
      ctxZ1.moveTo(postX - 34, h * 0.36);
      ctxZ1.lineTo(postX + 28, h * 0.36);
      ctxZ1.lineTo(postX + 36, h * 0.40);
      ctxZ1.lineTo(postX + 28, h * 0.44);
      ctxZ1.lineTo(postX - 34, h * 0.44);
      ctxZ1.closePath();
      ctxZ1.fill();
      strokePaperEdge(ctxZ1, 'rgba(248, 232, 206, 0.55)', 1);

      // Z1 Right: Beehive Potter's Kiln silhouette with glowing firebox
      const kilnX = w * 0.84;
      const kilnBaseY = h * 0.88;
      ctxZ1.fillStyle = '#4c3627';
      ctxZ1.beginPath();
      ctxZ1.moveTo(kilnX - 48, kilnBaseY);
      ctxZ1.quadraticCurveTo(kilnX - 46, h * 0.36, kilnX, h * 0.34);
      ctxZ1.quadraticCurveTo(kilnX + 46, h * 0.36, kilnX + 48, kilnBaseY);
      ctxZ1.closePath();
      ctxZ1.fill();
      // Kiln chimney
      ctxZ1.fillRect(kilnX - 9, h * 0.20, 18, h * 0.16);
      strokePaperEdge(ctxZ1, 'rgba(245, 224, 195, 0.48)', 1.2);

      // Glowing kiln firebox aperture
      const pulse = 0.8 + 0.2 * Math.sin(t * 3.4);
      const fireGrad = ctxZ1.createRadialGradient(kilnX - 6, kilnBaseY - 14, 3, kilnX - 6, kilnBaseY - 14, 28);
      fireGrad.addColorStop(0, `rgba(255, 220, 130, ${0.95 * pulse})`);
      fireGrad.addColorStop(0.5, `rgba(212, 91, 40, ${0.85 * pulse})`);
      fireGrad.addColorStop(1, 'rgba(212, 91, 40, 0)');
      ctxZ1.fillStyle = fireGrad;
      ctxZ1.beginPath();
      ctxZ1.arc(kilnX - 6, kilnBaseY - 10, 26, Math.PI, 0);
      ctxZ1.fill();

      // Z4: Foreground dressed stone pillar wings
      ctxZ4.fillStyle = pal.wing;
      ctxZ4.fillRect(0, 0, w * 0.04, h);
      ctxZ4.fillRect(w * 0.96, 0, w * 0.04, h);
    },

    /**
     * 6. Ch VI: Polynesian Wayfinding Swells & Star Dome
     */
    wayfinding_swells(ctxZ0, ctxZ1, ctxZ4, w, h, t, state) {
      const pal = state.world.palette;

      // Z0: Deep indigo-parchment twilight horizon & Star Dome
      const grad = ctxZ0.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, pal.skyTop);
      grad.addColorStop(0.56, pal.skyMid);
      grad.addColorStop(0.84, '#6e6a64');
      grad.addColorStop(1, pal.skyBot);
      ctxZ0.fillStyle = grad;
      ctxZ0.fillRect(0, 0, w, h);

      // Zenith Navigational Stars
      const rand = seededRandom(606);
      for (let i = 0; i < 36; i++) {
        const sx = rand() * w;
        const sy = rand() * h * 0.56;
        const sr = (i % 5 === 0 ? 2.2 : 1.2);
        const tw = 0.55 + 0.45 * Math.sin(t * 2.0 + i * 1.3);
        ctxZ0.fillStyle = `rgba(245, 220, 152, ${tw})`;
        ctxZ0.beginPath();
        ctxZ0.arc(sx, sy, sr, 0, Math.PI * 2);
        ctxZ0.fill();
      }

      // Marshallese / Polynesian Stick-Chart Wave Interference Arcs in Z0/Z1
      ctxZ0.strokeStyle = 'rgba(240, 228, 200, 0.34)';
      ctxZ0.lineWidth = 1.3;
      ctxZ0.setLineDash([5, 4]);
      // Curved swell refraction ribs
      [
        [w * 0.15, h * 0.14, w * 0.46, h * 0.32, w * 0.18, h * 0.52],
        [w * 0.85, h * 0.14, w * 0.54, h * 0.32, w * 0.82, h * 0.52],
        [w * 0.22, h * 0.18, w * 0.50, h * 0.42, w * 0.78, h * 0.18]
      ].forEach(([x1, y1, cx, cy, x2, y2]) => {
        ctxZ0.beginPath();
        ctxZ0.moveTo(x1, y1);
        ctxZ0.quadraticCurveTo(cx, cy, x2, y2);
        ctxZ0.stroke();
      });
      ctxZ0.setLineDash([]);

      // Cowrie-shell node markers at intersections
      [
        [w * 0.5, h * 0.29],
        [w * 0.32, h * 0.33],
        [w * 0.68, h * 0.33]
      ].forEach(([nx, ny]) => {
        ctxZ0.fillStyle = pal.accentA;
        ctxZ0.beginPath();
        ctxZ0.arc(nx, ny, 3.6, 0, Math.PI * 2);
        ctxZ0.fill();
      });

      // Z1: Multi-layer Ocean Swell Parallax
      for (let s = 0; s < 4; s++) {
        const sy = h * (0.60 + s * 0.08);
        const amp = 5 + s * 2.5;
        ctxZ1.fillStyle = s % 2 === 0 ? '#1d3142' : '#152533';
        ctxZ1.beginPath();
        ctxZ1.moveTo(-20, h);
        for (let x = -20; x <= w + 20; x += 24) {
          const y = sy + Math.sin(x * 0.018 + t * (0.8 + s * 0.25) + s) * amp
                       + Math.cos(x * 0.032 - t * 0.6) * (amp * 0.4);
          ctxZ1.lineTo(x, y);
        }
        ctxZ1.lineTo(w + 20, h);
        ctxZ1.closePath();
        ctxZ1.fill();
        strokePaperEdge(ctxZ1, 'rgba(240, 228, 200, 0.42)', 1.1);
      }

      // Z4: Foreground Outrigger Canoe Crab-Claw Sail Corner & Lashed Boom
      ctxZ4.fillStyle = pal.wing;
      ctxZ4.beginPath();
      ctxZ4.moveTo(0, 0);
      ctxZ4.lineTo(w * 0.11, 0);
      ctxZ4.quadraticCurveTo(w * 0.03, h * 0.38, 0, h * 0.68);
      ctxZ4.closePath();
      ctxZ4.fill();
      strokePaperEdge(ctxZ4, 'rgba(245, 220, 152, 0.38)', 1.3);
    },

    /**
     * 7. Ch VII: Cyclops Cavern & Monolith Forge
     */
    cyclops_cavern(ctxZ0, ctxZ1, ctxZ4, w, h, t, state) {
      const pal = state.world.palette;

      // Z0: Deep basalt cavern vault & Cyclops dashboard oculus
      const grad = ctxZ0.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, pal.skyTop);
      grad.addColorStop(0.65, pal.skyMid);
      grad.addColorStop(1, pal.skyBot);
      ctxZ0.fillStyle = grad;
      ctxZ0.fillRect(0, 0, w, h);

      // Glowing Monolith / Cyclops Oculus in deep cavern
      const eyePulse = 0.78 + 0.22 * Math.sin(t * 2.4);
      const eyeX = w * 0.5;
      const eyeY = h * 0.36;
      const eyeGrad = ctxZ0.createRadialGradient(eyeX, eyeY, 6, eyeX, eyeY, Math.min(w, h) * 0.28);
      eyeGrad.addColorStop(0, `rgba(255, 190, 95, ${0.88 * eyePulse})`);
      eyeGrad.addColorStop(0.45, `rgba(232, 86, 38, ${0.45 * eyePulse})`);
      eyeGrad.addColorStop(1, 'rgba(232, 86, 38, 0)');
      ctxZ0.fillStyle = eyeGrad;
      ctxZ0.beginPath();
      ctxZ0.arc(eyeX, eyeY, Math.min(w, h) * 0.28, 0, Math.PI * 2);
      ctxZ0.fill();

      // Z1: Glowing Forge Hearth & Cyclopean Boulder Walls
      const hearthX = w * 0.16;
      const hearthY = h * 0.78;
      ctxZ1.fillStyle = '#261a16';
      ctxZ1.beginPath();
      ctxZ1.moveTo(0, h);
      ctxZ1.lineTo(0, h * 0.28);
      ctxZ1.lineTo(w * 0.22, h * 0.38);
      ctxZ1.lineTo(w * 0.27, h);
      ctxZ1.closePath();
      ctxZ1.fill();
      strokePaperEdge(ctxZ1, 'rgba(242, 164, 56, 0.42)', 1.2);

      // Forge Hearth Fire Aperture
      const fGrad = ctxZ1.createRadialGradient(hearthX, hearthY, 4, hearthX, hearthY, 38);
      fGrad.addColorStop(0, `rgba(255, 225, 120, ${0.95 * eyePulse})`);
      fGrad.addColorStop(0.55, `rgba(232, 86, 38, ${0.8 * eyePulse})`);
      fGrad.addColorStop(1, 'rgba(232, 86, 38, 0)');
      ctxZ1.fillStyle = fGrad;
      ctxZ1.beginPath();
      ctxZ1.arc(hearthX, hearthY, 36, Math.PI, 0);
      ctxZ1.fill();

      // Right Cyclopean Monolith Slab
      ctxZ1.fillStyle = '#291c18';
      ctxZ1.fillRect(w * 0.78, h * 0.26, w * 0.18, h * 0.74);
      strokePaperEdge(ctxZ1, 'rgba(242, 164, 56, 0.38)', 1.2);

      // Z4: Heavy Basalt Paper-Cut Stalactites in Foreground Wings
      ctxZ4.fillStyle = pal.wing;
      const stalactites = [
        [0, 0, w * 0.11, 0, w * 0.05, h * 0.46],
        [w * 0.08, 0, w * 0.16, 0, w * 0.12, h * 0.28],
        [w * 0.84, 0, w * 0.92, 0, w * 0.88, h * 0.30],
        [w * 0.89, 0, w, 0, w * 0.95, h * 0.48]
      ];
      stalactites.forEach(([x1, y1, x2, y2, px, py]) => {
        ctxZ4.beginPath();
        ctxZ4.moveTo(x1, y1);
        ctxZ4.lineTo(x2, y2);
        ctxZ4.lineTo(px, py);
        ctxZ4.closePath();
        ctxZ4.fill();
        strokePaperEdge(ctxZ4, 'rgba(232, 130, 70, 0.32)', 1.1);
      });
    },

    /**
     * 8. Ch VIII: Underworld of Asphodel & Pale Mist
     */
    underworld_asphodel(ctxZ0, ctxZ1, ctxZ4, w, h, t, state) {
      const pal = state.world.palette;

      // Z0: Ash-parchment sky & Pale Moon Aperture
      const grad = ctxZ0.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, pal.skyTop);
      grad.addColorStop(0.6, pal.skyMid);
      grad.addColorStop(1, pal.skyBot);
      ctxZ0.fillStyle = grad;
      ctxZ0.fillRect(0, 0, w, h);

      // Pale Moon Aperture in Z0
      const moonX = w * 0.5;
      const moonY = h * 0.30;
      const moonR = Math.min(w, h) * 0.13;
      const mGrad = ctxZ0.createRadialGradient(moonX, moonY, moonR * 0.2, moonX, moonY, moonR * 2.2);
      mGrad.addColorStop(0, 'rgba(251, 253, 249, 0.95)');
      mGrad.addColorStop(0.45, 'rgba(235, 242, 238, 0.48)');
      mGrad.addColorStop(1, 'rgba(215, 224, 220, 0)');
      ctxZ0.fillStyle = mGrad;
      ctxZ0.beginPath();
      ctxZ0.arc(moonX, moonY, moonR * 2.2, 0, Math.PI * 2);
      ctxZ0.fill();

      // Z1: Layered Cypress Silhouettes & Weeping Willow Fronds
      const cypressList = [
        { x: w * 0.08, top: h * 0.18, r: 16 },
        { x: w * 0.15, top: h * 0.26, r: 13 },
        { x: w * 0.85, top: h * 0.24, r: 14 },
        { x: w * 0.92, top: h * 0.16, r: 17 }
      ];
      cypressList.forEach(c => {
        ctxZ1.fillStyle = '#2a3330';
        ctxZ1.beginPath();
        ctxZ1.moveTo(c.x - c.r, h);
        ctxZ1.quadraticCurveTo(c.x - c.r * 0.8, c.top + 30, c.x, c.top);
        ctxZ1.quadraticCurveTo(c.x + c.r * 0.8, c.top + 30, c.x + c.r, h);
        ctxZ1.closePath();
        ctxZ1.fill();
        strokePaperEdge(ctxZ1, 'rgba(235, 242, 238, 0.42)', 1);
      });

      // Delicate white-ink Asphodel stalks along Z1 lower plane
      ctxZ1.strokeStyle = 'rgba(244, 248, 245, 0.62)';
      ctxZ1.lineWidth = 1.1;
      for (let i = 0; i < 14; i++) {
        const ax = w * (0.06 + (i / 13) * 0.88);
        const sway = Math.sin(t * 1.1 + i * 0.7) * 3;
        const ay = h * (0.72 + (i % 3) * 0.04);
        ctxZ1.beginPath();
        ctxZ1.moveTo(ax, h * 0.9);
        ctxZ1.quadraticCurveTo(ax + sway, (ay + h * 0.9) * 0.5, ax + sway * 1.4, ay);
        ctxZ1.stroke();
      }

      // Z4: Hanging foreground Weeping Willow tresses
      ctxZ4.strokeStyle = pal.wing;
      ctxZ4.lineWidth = 2.0;
      for (let i = 0; i < 10; i++) {
        const isLeft = i < 5;
        const wx = isLeft ? w * (0.015 + i * 0.022) : w * (0.985 - (i - 5) * 0.022);
        const len = h * (0.36 + (i % 3) * 0.12);
        const sway = Math.sin(t * 1.2 + i) * 5;
        ctxZ4.beginPath();
        ctxZ4.moveTo(wx, 0);
        ctxZ4.quadraticCurveTo(wx + sway, len * 0.55, wx + sway * 1.3, len);
        ctxZ4.stroke();
      }
    },

    /**
     * 9. Ch IX: Great Hall of the Suitors & Twelve Axe-Heads
     */
    suitors_hall(ctxZ0, ctxZ1, ctxZ4, w, h, t, state) {
      const pal = state.world.palette;

      // Z0: Torchlit Megaron Hall & Coffered Ceiling
      const grad = ctxZ0.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, pal.skyTop);
      grad.addColorStop(0.55, pal.skyMid);
      grad.addColorStop(1, pal.skyBot);
      ctxZ0.fillStyle = grad;
      ctxZ0.fillRect(0, 0, w, h);

      // Torchlight warm pools on back wall
      [w * 0.25, w * 0.5, w * 0.75].forEach((tx, idx) => {
        const flick = 0.82 + 0.18 * Math.sin(t * 4.2 + idx * 1.7);
        const tGrad = ctxZ0.createRadialGradient(tx, h * 0.36, 4, tx, h * 0.36, h * 0.28);
        tGrad.addColorStop(0, `rgba(255, 210, 130, ${0.55 * flick})`);
        tGrad.addColorStop(1, 'rgba(234, 115, 36, 0)');
        ctxZ0.fillStyle = tGrad;
        ctxZ0.beginPath();
        ctxZ0.arc(tx, h * 0.36, h * 0.28, 0, Math.PI * 2);
        ctxZ0.fill();
      });

      // Z1: Fluted Doric Paper Columns on sides
      [w * 0.09, w * 0.20, w * 0.80, w * 0.91].forEach(cx => {
        const colW = 20;
        ctxZ1.fillStyle = '#5c3f28';
        ctxZ1.fillRect(cx - colW / 2, h * 0.14, colW, h * 0.78);
        // Doric echinus & abacus capital
        ctxZ1.fillRect(cx - colW * 0.8, h * 0.11, colW * 1.6, 8);
        strokePaperEdge(ctxZ1, 'rgba(248, 228, 194, 0.52)', 1.1);
      });

      // Z1: Aligned Perspective Row of Twelve Bronze Axe-Head Rings!
      const axeStartX = w * 0.25;
      const axeEndX = w * 0.75;
      const axeRingY = h * 0.58;
      // Golden bowstring sight-line threading cleanly through all 12 axe rings
      ctxZ1.strokeStyle = 'rgba(245, 200, 96, 0.65)';
      ctxZ1.lineWidth = 1.4;
      ctxZ1.setLineDash([6, 4]);
      ctxZ1.beginPath();
      ctxZ1.moveTo(axeStartX - 18, axeRingY);
      ctxZ1.lineTo(axeEndX + 18, axeRingY);
      ctxZ1.stroke();
      ctxZ1.setLineDash([]);

      for (let i = 0; i < 12; i++) {
        const frac = i / 11;
        const ax = lerp(axeStartX, axeEndX, frac);
        const perspScale = 0.78 + 0.22 * Math.sin(frac * Math.PI);
        const ringR = 6.5 * perspScale;

        // Oak stock post
        ctxZ1.fillStyle = '#472f1c';
        ctxZ1.fillRect(ax - 2, axeRingY + ringR, 4, h * 0.30);

        // Bronze double-axe blade crescent
        ctxZ1.fillStyle = pal.accentA;
        ctxZ1.beginPath();
        ctxZ1.arc(ax, axeRingY, ringR * 1.45, 0, Math.PI * 2);
        ctxZ1.fill();

        // Open ring aperture inside axe-head
        ctxZ1.fillStyle = pal.skyMid;
        ctxZ1.beginPath();
        ctxZ1.arc(ax, axeRingY, ringR * 0.68, 0, Math.PI * 2);
        ctxZ1.fill();
        strokePaperEdge(ctxZ1, 'rgba(255, 232, 185, 0.7)', 1);
      }

      // Z4: Foreground Fluted Doric Column Wings
      const wingW = w * 0.048;
      ctxZ4.fillStyle = pal.wing;
      ctxZ4.fillRect(0, 0, wingW, h);
      ctxZ4.fillRect(w - wingW, 0, wingW, h);
      strokePaperEdge(ctxZ4, 'rgba(235, 198, 145, 0.42)', 1.4);
    },

    /**
     * 10. Ch X: Father's Terraced Orchard (Ithaca)
     */
    fathers_orchard(ctxZ0, ctxZ1, ctxZ4, w, h, t, state) {
      const pal = state.world.palette;

      // Z0: Sun-dappled Ithaca terraced hillside
      const grad = ctxZ0.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, pal.skyTop);
      grad.addColorStop(0.6, pal.skyMid);
      grad.addColorStop(1, pal.skyBot);
      ctxZ0.fillStyle = grad;
      ctxZ0.fillRect(0, 0, w, h);

      // Distant olive terrace contours in Z0
      ctxZ0.fillStyle = 'rgba(83, 104, 71, 0.16)';
      ctxZ0.beginPath();
      ctxZ0.moveTo(0, h * 0.58);
      ctxZ0.quadraticCurveTo(w * 0.32, h * 0.46, w * 0.62, h * 0.56);
      ctxZ0.quadraticCurveTo(w * 0.84, h * 0.48, w, h * 0.54);
      ctxZ0.lineTo(w, h);
      ctxZ0.lineTo(0, h);
      ctxZ0.closePath();
      ctxZ0.fill();

      // Z1: Dry-Stone Terrace Wall across mid-ground
      const wallY = h * 0.68;
      const wallH = 26;
      ctxZ1.fillStyle = '#8c7a5b';
      ctxZ1.fillRect(w * 0.04, wallY, w * 0.92, wallH);
      strokePaperEdge(ctxZ1, 'rgba(250, 242, 224, 0.6)', 1.2);
      // Individual dry-stone courses
      ctxZ1.strokeStyle = 'rgba(52, 44, 32, 0.38)';
      ctxZ1.lineWidth = 1;
      for (let x = w * 0.05; x < w * 0.95; x += 26) {
        ctxZ1.strokeRect(x, wallY + 2, 24, 11);
        ctxZ1.strokeRect(x + 10, wallY + 13, 24, 11);
      }

      // Z1: Gnarled Olive & Fig Tree Silhouettes on Left and Right
      const drawOrchardTree = (ctx, baseX, dir, scale) => {
        ctx.save();
        ctx.fillStyle = '#3f3526';
        ctx.beginPath();
        ctx.moveTo(baseX - 18 * scale, h * 0.88);
        ctx.quadraticCurveTo(baseX - 8 * scale, h * 0.56, baseX + dir * 14 * scale, h * 0.34);
        ctx.lineTo(baseX + dir * 28 * scale, h * 0.34);
        ctx.quadraticCurveTo(baseX + 10 * scale, h * 0.58, baseX + 16 * scale, h * 0.88);
        ctx.closePath();
        ctx.fill();
        strokePaperEdge(ctx, 'rgba(248, 240, 218, 0.5)', 1.1);

        // Foliage canopy clusters
        const clusters = [
          [baseX + dir * 10 * scale, h * 0.28, 42 * scale, 24 * scale],
          [baseX + dir * 44 * scale, h * 0.34, 36 * scale, 20 * scale],
          [baseX - dir * 16 * scale, h * 0.34, 32 * scale, 19 * scale]
        ];
        clusters.forEach(([cx, cy, rx, ry], cIdx) => {
          ctx.fillStyle = cIdx % 2 === 0 ? '#536645' : '#687d58';
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          ctx.fill();
          strokePaperEdge(ctx, 'rgba(250, 244, 226, 0.52)', 1.1);
        });
        ctx.restore();
      };

      drawOrchardTree(ctxZ1, w * 0.11, 1, 1.0);
      drawOrchardTree(ctxZ1, w * 0.89, -1, 0.95);

      // Z4: Overhanging Foreground Olive Boughs at top corners
      ctxZ4.fillStyle = pal.wing;
      ctxZ4.beginPath();
      ctxZ4.ellipse(w * 0.06, h * 0.06, w * 0.12, h * 0.11, 0.2, 0, Math.PI * 2);
      ctxZ4.ellipse(w * 0.94, h * 0.06, w * 0.12, h * 0.11, -0.2, 0, Math.PI * 2);
      ctxZ4.fill();
    }
  };

  /**
   * Draw Norstein Multi-Band Diffusion & Fog Fields + Light Shafts + Particles
   */
  function drawAtmosphereAndFog(ctxZ1, ctxZ4, w, h, t, inst) {
    const pal = inst.world.palette;
    const [fr, fg, fb] = pal.fogColor;
    const [lr, lg, lb] = pal.lightColor;
    const fog = inst.currentFogDensity;

    // 1. Diagonal Dappled Light Shafts in Z1
    if (inst.currentLightShafts > 0.05) {
      ctxZ1.save();
      const shaftAlpha = 0.13 * inst.currentLightShafts;
      for (let i = 0; i < 3; i++) {
        const sx = w * (0.22 + i * 0.24) + Math.sin(t * 0.3 + i) * 12;
        const lgGrad = ctxZ1.createLinearGradient(sx, 0, sx + w * 0.16, h);
        lgGrad.addColorStop(0, `rgba(${lr}, ${lg}, ${lb}, ${shaftAlpha * 1.4})`);
        lgGrad.addColorStop(0.65, `rgba(${lr}, ${lg}, ${lb}, ${shaftAlpha * 0.7})`);
        lgGrad.addColorStop(1, `rgba(${lr}, ${lg}, ${lb}, 0)`);
        ctxZ1.fillStyle = lgGrad;
        ctxZ1.beginPath();
        ctxZ1.moveTo(sx, 0);
        ctxZ1.lineTo(sx + w * 0.11, 0);
        ctxZ1.lineTo(sx + w * 0.25, h);
        ctxZ1.lineTo(sx + w * 0.09, h);
        ctxZ1.closePath();
        ctxZ1.fill();
      }
      ctxZ1.restore();
    }

    // 2. Z1 Mid-Plane Rolling Norstein Fog Band
    if (fog > 0.02) {
      const z1FogAlpha = clamp(fog * 0.48, 0, 0.55);
      const fogGrad1 = ctxZ1.createLinearGradient(0, h * 0.35, 0, h * 0.92);
      fogGrad1.addColorStop(0, `rgba(${fr}, ${fg}, ${fb}, 0)`);
      fogGrad1.addColorStop(0.5, `rgba(${fr}, ${fg}, ${fb}, ${z1FogAlpha})`);
      fogGrad1.addColorStop(1, `rgba(${fr}, ${fg}, ${fb}, 0)`);
      ctxZ1.fillStyle = fogGrad1;
      ctxZ1.fillRect(0, h * 0.35, w, h * 0.57);

      // Soft drifting Norstein mist puffs in Z4 foreground
      const z4FogAlpha = clamp(fog * 0.42, 0, 0.52);
      for (let b = 0; b < 4; b++) {
        const puffX = ((w * (b * 0.28) + t * (14 + b * 4)) % (w + 260)) - 130;
        const puffY = h * (0.62 + (b % 2) * 0.16) + Math.sin(t * 0.7 + b) * 6;
        const puffR = w * 0.26;
        const pGrad = ctxZ4.createRadialGradient(puffX, puffY, 10, puffX, puffY, puffR);
        pGrad.addColorStop(0, `rgba(${fr}, ${fg}, ${fb}, ${z4FogAlpha})`);
        pGrad.addColorStop(0.6, `rgba(${fr}, ${fg}, ${fb}, ${z4FogAlpha * 0.45})`);
        pGrad.addColorStop(1, `rgba(${fr}, ${fg}, ${fb}, 0)`);
        ctxZ4.fillStyle = pGrad;
        ctxZ4.fillRect(puffX - puffR, puffY - puffR * 0.5, puffR * 2, puffR);
      }
    }

    // 3. Atmospheric Particles (Sawdust, Gold Dust, Embers, Blossoms, Mist Motes) in Z4
    const pType = inst.world.particleType;
    inst.particles.forEach((pt, idx) => {
      const isRising = pType === 'embers' || pType === 'heat_motes' || pType === 'torch_sparks';
      const py = isRising
        ? (h - ((pt.y * h + t * pt.speed * 26) % h))
        : ((pt.y * h + t * pt.speed * 14) % h);
      const px = (pt.x * w + Math.sin(t * pt.drift + idx) * 18 + w) % w;

      ctxZ4.save();
      if (pType === 'embers' || pType === 'torch_sparks') {
        ctxZ4.fillStyle = idx % 2 === 0 ? 'rgba(245, 145, 50, 0.82)' : 'rgba(235, 85, 35, 0.75)';
        ctxZ4.beginPath();
        ctxZ4.arc(px, py, pt.size * 1.15, 0, Math.PI * 2);
        ctxZ4.fill();
      } else if (pType === 'blossoms') {
        ctxZ4.fillStyle = 'rgba(248, 224, 224, 0.82)';
        ctxZ4.translate(px, py);
        ctxZ4.rotate(t * 0.8 + idx);
        ctxZ4.beginPath();
        ctxZ4.ellipse(0, 0, pt.size * 1.6, pt.size * 0.9, 0, 0, Math.PI * 2);
        ctxZ4.fill();
      } else if (pType === 'gold_dust') {
        const gl = 0.45 + 0.45 * Math.sin(t * 3 + idx);
        ctxZ4.fillStyle = `rgba(235, 185, 75, ${gl})`;
        ctxZ4.beginPath();
        ctxZ4.arc(px, py, pt.size, 0, Math.PI * 2);
        ctxZ4.fill();
      } else {
        ctxZ4.fillStyle = `rgba(${lr}, ${lg}, ${lb}, 0.48)`;
        ctxZ4.beginPath();
        ctxZ4.arc(px, py, pt.size, 0, Math.PI * 2);
        ctxZ4.fill();
      }
      ctxZ4.restore();
    });

    // 4. Norstein Chiaroscuro Aperture Vignette in Z4
    if (inst.currentVignette > 0.02) {
      const vGrad = ctxZ4.createRadialGradient(
        w * 0.5, h * 0.48, Math.min(w, h) * 0.26,
        w * 0.5, h * 0.48, Math.max(w, h) * 0.72
      );
      vGrad.addColorStop(0, 'rgba(22, 16, 11, 0)');
      vGrad.addColorStop(1, `rgba(22, 16, 11, ${clamp(inst.currentVignette, 0, 0.68)})`);
      ctxZ4.fillStyle = vGrad;
      ctxZ4.fillRect(0, 0, w, h);
    }
  }

  // ============================================================================
  // MULTIPLANE STAGE CONTROLLER
  // ============================================================================

  const stateInstance = {
    mounted: false,
    prosceniumEl: null,
    floorEl: null,
    apronEl: null,
    backdropEl: null,
    foregroundEl: null,
    shadowLayerEl: null,
    watermarkEl: null,
    canvasZ0: null,
    canvasZ1: null,
    canvasZ4: null,

    world: CHAPTER_WORLDS[0],
    chapterIdx: 0,
    beatId: 'beat_2',

    cameraMode: 'interactive', // 'auto' | 'interactive' | 'locked'
    atmosphereState: 'reveal', // 'reveal' | 'obscure' | 'lure' | 'suspend'
    fogDensityOverride: null,

    // Smoothly lerped atmospheric parameters
    currentFogDensity: 0.18,
    targetFogDensity: 0.18,
    currentZ0Blur: 0.5,
    currentZ1Blur: 0.0,
    currentZ4Blur: 0.9,
    currentVignette: 0.20,
    currentLightShafts: 0.85,
    wingClosure: 0.0,

    // Pointer & Parallax Coordinates (-1..+1 normalized)
    pointerNormX: 0,
    pointerNormY: 0,
    pointerActive: false,
    lastPointerMoveMs: 0,

    camX: 0,
    camY: 0,
    maxAmplitudeX: 18,
    maxAmplitudeY: 10,

    actorCount: 0,
    particles: [],
    rafId: null,
    mutationObserver: null,
    headerObserver: null,
    boundPointerMove: null,
    boundPointerLeave: null,
    boundResize: null
  };

  function initParticles() {
    const rand = seededRandom(4405);
    stateInstance.particles = Array.from({ length: 28 }, () => ({
      x: rand(),
      y: rand(),
      size: 1.3 + rand() * 1.9,
      speed: 0.35 + rand() * 0.85,
      drift: 0.6 + rand() * 1.4
    }));
  }

  /**
   * Synchronize grounded elliptical contact shadows on the wooden stage floor
   * directly beneath each `.cutout-actor`, `.stage-tableau-card`, and `.tableau-stage-card`.
   */
  function syncContactShadows() {
    const inst = stateInstance;
    if (!inst.prosceniumEl) return 0;

    const floorEl = inst.prosceniumEl.querySelector('.stage-floor-area');
    if (!floorEl) return 0;
    inst.floorEl = floorEl;

    // Ensure shadow container exists inside .stage-floor-area at z-index: 2
    if (!inst.shadowLayerEl || !floorEl.contains(inst.shadowLayerEl)) {
      const layer = document.createElement('div');
      layer.className = 'scion-floor-shadows-layer';
      layer.setAttribute('aria-hidden', 'true');
      floorEl.insertBefore(layer, floorEl.firstChild);
      inst.shadowLayerEl = layer;
    }

    const actors = Array.from(
      floorEl.querySelectorAll('.cutout-actor, .stage-tableau-card, .tableau-stage-card')
    );
    inst.actorCount = actors.length;

    const floorRect = floorEl.getBoundingClientRect();
    const existingShadows = Array.from(inst.shadowLayerEl.querySelectorAll('.scion-contact-shadow'));

    // Match shadow pool count to actor count
    while (existingShadows.length < actors.length) {
      const sh = document.createElement('div');
      sh.className = 'scion-contact-shadow';
      inst.shadowLayerEl.appendChild(sh);
      existingShadows.push(sh);
    }
    while (existingShadows.length > actors.length) {
      const rem = existingShadows.pop();
      if (rem && rem.parentNode) rem.parentNode.removeChild(rem);
    }

    const z2ShiftX = inst.camX * PLANE_PARALLAX.Z2;
    const z2ShiftY = inst.camY * PLANE_PARALLAX.Z2;

    actors.forEach((el, idx) => {
      const isSpeaking = el.classList.contains('is-speaking');
      const isTableau = el.classList.contains('stage-tableau-card') || el.classList.contains('tableau-stage-card');

      // Subtle depth stratification inside Z2 (0.65x base, speaking actor slightly forward at 0.70x)
      const depthFactor = isTableau ? 0.56 : (isSpeaking ? 0.70 : 0.64);
      const ax = (inst.camX * depthFactor).toFixed(2) + 'px';
      const ay = (inst.camY * depthFactor * 0.55).toFixed(2) + 'px';
      el.style.setProperty('--scion-actor-px', ax);
      el.style.setProperty('--scion-actor-py', ay);

      const rect = el.getBoundingClientRect();
      const shadowEl = existingShadows[idx];
      if (!shadowEl) return;

      shadowEl.classList.toggle('is-speaking-shadow', isSpeaking);
      shadowEl.classList.toggle('is-tableau-shadow', isTableau);

      if (floorRect.width > 0 && rect.width > 0) {
        const centerX = (rect.left - floorRect.left) + rect.width * 0.5;
        const shadowW = clamp(rect.width * (isTableau ? 0.92 : 0.86), 54, 195);
        const shadowH = isTableau ? 16 : (isSpeaking ? 19 : 15);
        const bottomPx = Math.max(8, floorRect.height - (rect.bottom - floorRect.top) + 3);

        shadowEl.style.left = `${centerX.toFixed(1)}px`;
        shadowEl.style.bottom = `${bottomPx.toFixed(1)}px`;
        shadowEl.style.width = `${shadowW.toFixed(1)}px`;
        shadowEl.style.height = `${shadowH}px`;
      } else {
        // Fallback percentage placement if layout has zero rect in headless test
        const pct = ((idx + 1) / (actors.length + 1)) * 100;
        shadowEl.style.left = `${pct.toFixed(1)}%`;
        shadowEl.style.bottom = '24px';
        shadowEl.style.width = '96px';
        shadowEl.style.height = '16px';
        shadowEl.style.transform = `translate(calc(-50% + ${z2ShiftX.toFixed(1)}px), calc(50% + ${(z2ShiftY * 0.4).toFixed(1)}px))`;
      }
    });

    return actors.length;
  }

  function resizeCanvases() {
    const inst = stateInstance;
    if (!inst.prosceniumEl || !inst.canvasZ0) return;

    const rect = inst.prosceniumEl.getBoundingClientRect();
    const dpr = Math.min(typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1, 2);
    const w = Math.max(320, Math.round((rect.width || 640) + 48));
    const h = Math.max(200, Math.round((rect.height || 320) + 48));

    [inst.canvasZ0, inst.canvasZ1, inst.canvasZ4].forEach(cnv => {
      if (!cnv) return;
      if (cnv.width !== Math.round(w * dpr) || cnv.height !== Math.round(h * dpr)) {
        cnv.width = Math.round(w * dpr);
        cnv.height = Math.round(h * dpr);
        cnv.dataset.logicalW = String(w);
        cnv.dataset.logicalH = String(h);
        cnv.dataset.dpr = String(dpr);
      }
    });
  }

  function stepAnimationFrame(nowMs) {
    const inst = stateInstance;
    if (!inst.mounted || !inst.prosceniumEl) return;

    const t = (nowMs || performance.now()) * 0.001;

    // 1. Compute target camera coordinates based on cameraMode ('auto' | 'interactive' | 'locked')
    let targetX = 0;
    let targetY = 0;
    const autoDriftX = (Math.sin(t * 0.55) * 0.65 + Math.cos(t * 0.23) * 0.35) * inst.maxAmplitudeX;
    const autoDriftY = (Math.cos(t * 0.42) * 0.65 + Math.sin(t * 0.31) * 0.35) * inst.maxAmplitudeY;

    if (inst.cameraMode === 'locked') {
      targetX = 0;
      targetY = 0;
    } else if (inst.cameraMode === 'auto') {
      targetX = autoDriftX;
      targetY = autoDriftY;
    } else {
      // 'interactive': blend pointer position when active, or gently drift when idle
      const idleSec = (nowMs - inst.lastPointerMoveMs) * 0.001;
      if (inst.pointerActive && idleSec < 3.0) {
        targetX = inst.pointerNormX * inst.maxAmplitudeX + autoDriftX * 0.15;
        targetY = inst.pointerNormY * inst.maxAmplitudeY + autoDriftY * 0.15;
      } else {
        targetX = autoDriftX * 0.85;
        targetY = autoDriftY * 0.85;
      }
    }

    // Smooth camera lerp
    inst.camX = lerp(inst.camX, targetX, 0.08);
    inst.camY = lerp(inst.camY, targetY, 0.08);

    // 2. Smoothly lerp Norstein atmospheric state parameters & focus rack
    const atm = ATMOSPHERE_STATES[inst.atmosphereState] || ATMOSPHERE_STATES.reveal;
    const desiredFog = inst.fogDensityOverride !== null ? inst.fogDensityOverride : atm.fogTarget;
    inst.targetFogDensity = desiredFog;
    inst.currentFogDensity = lerp(inst.currentFogDensity, desiredFog, 0.06);
    inst.currentZ0Blur = lerp(inst.currentZ0Blur, atm.z0Blur, 0.06);
    inst.currentZ1Blur = lerp(inst.currentZ1Blur, atm.z1Blur, 0.06);
    inst.currentZ4Blur = lerp(inst.currentZ4Blur, atm.z4Blur, 0.06);
    inst.currentVignette = lerp(inst.currentVignette, atm.vignette, 0.06);
    inst.currentLightShafts = lerp(inst.currentLightShafts, atm.lightShaftAlpha, 0.06);
    inst.wingClosure = lerp(inst.wingClosure, atm.wingClosure, 0.06);

    // 3. Apply multiplane parallax transforms (Z0: 0.15x, Z1: 0.35x, Z2: 0.65x, Z3: 0.9x, Z4: 1.25x)
    const z0x = (inst.camX * PLANE_PARALLAX.Z0).toFixed(2);
    const z0y = (inst.camY * PLANE_PARALLAX.Z0).toFixed(2);
    const z1x = (inst.camX * PLANE_PARALLAX.Z1).toFixed(2);
    const z1y = (inst.camY * PLANE_PARALLAX.Z1).toFixed(2);
    const z2x = (inst.camX * PLANE_PARALLAX.Z2).toFixed(2);
    const z2y = (inst.camY * PLANE_PARALLAX.Z2 * 0.55).toFixed(2);
    const z3x = (inst.camX * PLANE_PARALLAX.Z3).toFixed(2);
    const z3y = (inst.camY * PLANE_PARALLAX.Z3 * 0.45).toFixed(2);
    const z4x = (inst.camX * PLANE_PARALLAX.Z4).toFixed(2);
    const z4y = (inst.camY * PLANE_PARALLAX.Z4 * 0.65).toFixed(2);

    const pEl = inst.prosceniumEl;
    pEl.style.setProperty('--scion-z0-x', `${z0x}px`);
    pEl.style.setProperty('--scion-z0-y', `${z0y}px`);
    pEl.style.setProperty('--scion-z1-x', `${z1x}px`);
    pEl.style.setProperty('--scion-z1-y', `${z1y}px`);
    pEl.style.setProperty('--scion-z2-x', `${z2x}px`);
    pEl.style.setProperty('--scion-z2-y', `${z2y}px`);
    pEl.style.setProperty('--scion-z3-x', `${z3x}px`);
    pEl.style.setProperty('--scion-z3-y', `${z3y}px`);
    pEl.style.setProperty('--scion-z4-x', `${z4x}px`);
    pEl.style.setProperty('--scion-z4-y', `${z4y}px`);

    if (inst.canvasZ0) {
      inst.canvasZ0.style.transform = `translate3d(${z0x}px, ${z0y}px, 0)`;
      inst.canvasZ0.style.filter = inst.currentZ0Blur > 0.15 ? `blur(${inst.currentZ0Blur.toFixed(2)}px)` : 'none';
    }
    if (inst.canvasZ1) {
      inst.canvasZ1.style.transform = `translate3d(${z1x}px, ${z1y}px, 0)`;
      inst.canvasZ1.style.filter = inst.currentZ1Blur > 0.15 ? `blur(${inst.currentZ1Blur.toFixed(2)}px)` : 'none';
    }
    if (inst.canvasZ4) {
      inst.canvasZ4.style.transform = `translate3d(${z4x}px, ${z4y}px, 0)`;
      inst.canvasZ4.style.filter = inst.currentZ4Blur > 0.25 ? `blur(${inst.currentZ4Blur.toFixed(2)}px)` : 'none';
    }

    // 4. Sync actor Z2 parallax & contact shadows
    syncContactShadows();

    // 5. Render Scenic World Plates onto Z0, Z1, Z4 Canvases
    if (inst.canvasZ0 && inst.canvasZ1 && inst.canvasZ4) {
      const w = Number(inst.canvasZ0.dataset.logicalW) || 640;
      const h = Number(inst.canvasZ0.dataset.logicalH) || 320;
      const dpr = Number(inst.canvasZ0.dataset.dpr) || 1;

      const ctxZ0 = inst.canvasZ0.getContext('2d');
      const ctxZ1 = inst.canvasZ1.getContext('2d');
      const ctxZ4 = inst.canvasZ4.getContext('2d');

      if (ctxZ0 && ctxZ1 && ctxZ4) {
        ctxZ0.save();
        ctxZ1.save();
        ctxZ4.save();

        ctxZ0.scale(dpr, dpr);
        ctxZ1.scale(dpr, dpr);
        ctxZ4.scale(dpr, dpr);

        ctxZ0.clearRect(0, 0, w, h);
        ctxZ1.clearRect(0, 0, w, h);
        ctxZ4.clearRect(0, 0, w, h);

        const renderer = WorldRenderers[inst.world.id] || WorldRenderers.corporate_tower;
        renderer(ctxZ0, ctxZ1, ctxZ4, w, h, t, inst);
        drawAtmosphereAndFog(ctxZ1, ctxZ4, w, h, t, inst);

        ctxZ0.restore();
        ctxZ1.restore();
        ctxZ4.restore();
      }
    }

    if (typeof window !== 'undefined' && window.requestAnimationFrame) {
      inst.rafId = window.requestAnimationFrame(stepAnimationFrame);
    }
  }

  /**
   * Auto-detect beat & chapter from DOM if `renderStage()` in onyx-slopling-odyssey.html updates the stage
   */
  function syncBeatFromDomIfNeeded() {
    const inst = stateInstance;
    if (!inst.prosceniumEl) return;

    const beatSelect = document.getElementById('beatSelect');
    const chapEl = document.getElementById('stageChapterTag');
    const settingEl = document.getElementById('stageSettingText');
    const cueEl = document.getElementById('stageActingCue');

    const beatId = (beatSelect && beatSelect.value) || inst.beatId || 'beat_2';
    const chapterText = (chapEl && chapEl.textContent) || '';
    const settingText = (settingEl && settingEl.textContent) || '';
    const cueText = (cueEl && cueEl.textContent) || '';

    updateBeat(
      {
        id: beatId,
        chapter: chapterText,
        setting: settingText,
        summary: cueText
      },
      chapterText.split('.')[0].trim(),
      { fromDomObserver: true }
    );
  }

  /**
   * Mount ScionMultiplaneStage onto `.proscenium-box`
   */
  function mount(prosceniumEl, options) {
    if (typeof document === 'undefined') return ScionMultiplaneStage;

    ensureStylesInjected();
    const targetEl = prosceniumEl ||
      document.querySelector('.proscenium-box') ||
      document.getElementById('stageProscenium');

    if (!targetEl) return ScionMultiplaneStage;

    const inst = stateInstance;
    if (inst.mounted && inst.prosceniumEl === targetEl && inst.backdropEl && targetEl.contains(inst.backdropEl)) {
      resizeCanvases();
      syncContactShadows();
      return ScionMultiplaneStage;
    }

    unmount();

    inst.prosceniumEl = targetEl;
    inst.floorEl = targetEl.querySelector('.stage-floor-area');
    inst.apronEl = targetEl.querySelector('.stage-props-apron');
    initParticles();

    // Create Multiplane Backdrop (Z0 + Z1 behind .stage-floor-area)
    const backdrop = document.createElement('div');
    backdrop.className = 'scion-multiplane-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');

    const canvasZ0 = document.createElement('canvas');
    canvasZ0.className = 'scion-plane-canvas scion-plane-z0';
    canvasZ0.dataset.plane = 'Z0';
    canvasZ0.dataset.parallax = String(PLANE_PARALLAX.Z0);

    const canvasZ1 = document.createElement('canvas');
    canvasZ1.className = 'scion-plane-canvas scion-plane-z1';
    canvasZ1.dataset.plane = 'Z1';
    canvasZ1.dataset.parallax = String(PLANE_PARALLAX.Z1);

    backdrop.appendChild(canvasZ0);
    backdrop.appendChild(canvasZ1);

    // Create Foreground Occlusion & Atmosphere Layer (Z4 in front of .stage-floor-area, pointer-events: none)
    const foreground = document.createElement('div');
    foreground.className = 'scion-multiplane-foreground';
    foreground.setAttribute('aria-hidden', 'true');

    const canvasZ4 = document.createElement('canvas');
    canvasZ4.className = 'scion-plane-canvas scion-plane-z4';
    canvasZ4.dataset.plane = 'Z4';
    canvasZ4.dataset.parallax = String(PLANE_PARALLAX.Z4);
    foreground.appendChild(canvasZ4);

    // Scenic World Watermark Pill
    const watermark = document.createElement('div');
    watermark.className = 'scion-world-watermark';
    watermark.setAttribute('aria-hidden', 'true');
    foreground.appendChild(watermark);

    targetEl.insertBefore(backdrop, targetEl.firstChild);
    targetEl.appendChild(foreground);

    inst.backdropEl = backdrop;
    inst.foregroundEl = foreground;
    inst.canvasZ0 = canvasZ0;
    inst.canvasZ1 = canvasZ1;
    inst.canvasZ4 = canvasZ4;
    inst.watermarkEl = watermark;
    inst.mounted = true;

    // Pointer tracking on .proscenium-box
    inst.boundPointerMove = function (e) {
      const r = targetEl.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        inst.pointerNormX = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
        inst.pointerNormY = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
        inst.pointerActive = true;
        inst.lastPointerMoveMs = performance.now();
      }
    };
    inst.boundPointerLeave = function () {
      inst.pointerActive = false;
    };
    inst.boundResize = function () {
      resizeCanvases();
      syncContactShadows();
    };

    targetEl.addEventListener('pointermove', inst.boundPointerMove, { passive: true });
    targetEl.addEventListener('pointerleave', inst.boundPointerLeave, { passive: true });
    window.addEventListener('resize', inst.boundResize, { passive: true });

    // Observe DOM mutations on .stage-floor-area and stage header so actor changes immediately sync contact shadows & scenic world
    if (typeof MutationObserver !== 'undefined') {
      if (inst.floorEl) {
        inst.mutationObserver = new MutationObserver(() => {
          syncContactShadows();
        });
        inst.mutationObserver.observe(inst.floorEl, { childList: true });
      }
      const settingEl = document.getElementById('stageSettingText');
      if (settingEl) {
        inst.headerObserver = new MutationObserver(() => {
          syncBeatFromDomIfNeeded();
        });
        inst.headerObserver.observe(settingEl, { childList: true, characterData: true, subtree: true });
      }
    }

    resizeCanvases();
    syncBeatFromDomIfNeeded();
    if (options && options.beat) {
      updateBeat(options.beat, options.chapterIdx, options);
    }
    syncContactShadows();

    if (typeof window !== 'undefined' && window.requestAnimationFrame) {
      inst.rafId = window.requestAnimationFrame(stepAnimationFrame);
    }

    return ScionMultiplaneStage;
  }

  function unmount() {
    const inst = stateInstance;
    if (inst.rafId && typeof window !== 'undefined' && window.cancelAnimationFrame) {
      window.cancelAnimationFrame(inst.rafId);
      inst.rafId = null;
    }
    if (inst.mutationObserver) {
      inst.mutationObserver.disconnect();
      inst.mutationObserver = null;
    }
    if (inst.headerObserver) {
      inst.headerObserver.disconnect();
      inst.headerObserver = null;
    }
    if (inst.prosceniumEl) {
      if (inst.boundPointerMove) inst.prosceniumEl.removeEventListener('pointermove', inst.boundPointerMove);
      if (inst.boundPointerLeave) inst.prosceniumEl.removeEventListener('pointerleave', inst.boundPointerLeave);
    }
    if (typeof window !== 'undefined' && inst.boundResize) {
      window.removeEventListener('resize', inst.boundResize);
    }
    if (inst.backdropEl && inst.backdropEl.parentNode) inst.backdropEl.parentNode.removeChild(inst.backdropEl);
    if (inst.foregroundEl && inst.foregroundEl.parentNode) inst.foregroundEl.parentNode.removeChild(inst.foregroundEl);
    if (inst.shadowLayerEl && inst.shadowLayerEl.parentNode) inst.shadowLayerEl.parentNode.removeChild(inst.shadowLayerEl);

    inst.mounted = false;
    inst.backdropEl = null;
    inst.foregroundEl = null;
    inst.shadowLayerEl = null;
    inst.canvasZ0 = null;
    inst.canvasZ1 = null;
    inst.canvasZ4 = null;
  }

  /**
   * Update active beat & scenic world
   */
  function updateBeat(beat, chapterIdx, options) {
    const inst = stateInstance;
    const opts = options || {};

    if (!inst.mounted && typeof document !== 'undefined') {
      const box = document.querySelector('.proscenium-box') || document.getElementById('stageProscenium');
      if (box) mount(box);
    }

    const resolvedWorld = resolveScenicWorld(beat, chapterIdx, opts);
    inst.world = resolvedWorld;
    inst.chapterIdx = resolvedWorld.chapterIdx;

    if (typeof beat === 'string') {
      inst.beatId = beat;
    } else if (beat && (beat.id || beat.beat_id)) {
      inst.beatId = beat.id || beat.beat_id;
    }

    // Update atmosphere state from options or world default (unless locked by explicit user override)
    if (opts.atmosphereState && ATMOSPHERE_STATES[opts.atmosphereState]) {
      inst.atmosphereState = opts.atmosphereState;
    } else if (!opts.preserveAtmosphere) {
      inst.atmosphereState = resolvedWorld.defaultAtmosphere || 'reveal';
    }

    if (typeof opts.fogDensity === 'number') {
      inst.fogDensityOverride = clamp(opts.fogDensity, 0, 1);
    } else if (!opts.preserveFogOverride) {
      inst.fogDensityOverride = null;
    }

    if (inst.prosceniumEl) {
      inst.prosceniumEl.dataset.scenicWorld = resolvedWorld.id;
      inst.prosceniumEl.dataset.chapterRoman = resolvedWorld.roman;
      inst.prosceniumEl.dataset.chapterIdx = String(resolvedWorld.chapterIdx);
      inst.prosceniumEl.dataset.atmosphereState = inst.atmosphereState;
      inst.prosceniumEl.dataset.cameraMode = inst.cameraMode;
    }

    if (inst.watermarkEl) {
      inst.watermarkEl.textContent = `Ch ${resolvedWorld.roman} · ${resolvedWorld.title} · [${inst.atmosphereState.toUpperCase()}]`;
    }

    syncContactShadows();
    return resolvedWorld;
  }

  /**
   * Set camera mode ('auto' | 'interactive' | 'locked')
   */
  function setCameraMode(mode) {
    const valid = ['auto', 'interactive', 'locked'];
    const next = valid.includes(mode) ? mode : 'interactive';
    stateInstance.cameraMode = next;
    if (stateInstance.prosceniumEl) {
      stateInstance.prosceniumEl.dataset.cameraMode = next;
    }
    return next;
  }

  function getCameraMode() {
    return stateInstance.cameraMode;
  }

  /**
   * Set Norstein atmospheric dramaturgy state ('reveal' | 'obscure' | 'lure' | 'suspend')
   */
  function setAtmosphereState(state) {
    const key = String(state || 'reveal').toLowerCase();
    const resolved = ATMOSPHERE_STATES[key] ? key : 'reveal';
    stateInstance.atmosphereState = resolved;
    stateInstance.fogDensityOverride = null;
    stateInstance.targetFogDensity = ATMOSPHERE_STATES[resolved].fogTarget;
    if (stateInstance.prosceniumEl) {
      stateInstance.prosceniumEl.dataset.atmosphereState = resolved;
    }
    if (stateInstance.watermarkEl && stateInstance.world) {
      stateInstance.watermarkEl.textContent = `Ch ${stateInstance.world.roman} · ${stateInstance.world.title} · [${resolved.toUpperCase()}]`;
    }
    return ATMOSPHERE_STATES[resolved];
  }

  function getAtmosphereState() {
    return stateInstance.atmosphereState;
  }

  /**
   * Explicitly set Norstein fog density (0..1)
   */
  function setFogDensity(density) {
    if (density === null || density === undefined) {
      stateInstance.fogDensityOverride = null;
      return stateInstance.currentFogDensity;
    }
    const clamped = clamp(Number(density) || 0, 0, 1);
    stateInstance.fogDensityOverride = clamped;
    stateInstance.targetFogDensity = clamped;
    if (stateInstance.prosceniumEl) {
      stateInstance.prosceniumEl.dataset.fogDensity = clamped.toFixed(2);
    }
    return clamped;
  }

  function getFogDensity() {
    return stateInstance.fogDensityOverride !== null
      ? stateInstance.fogDensityOverride
      : stateInstance.currentFogDensity;
  }

  function getState() {
    const inst = stateInstance;
    return {
      mounted: inst.mounted,
      beatId: inst.beatId,
      chapterIdx: inst.chapterIdx,
      chapterRoman: inst.world ? inst.world.roman : 'I',
      worldId: inst.world ? inst.world.id : 'corporate_tower',
      worldTitle: inst.world ? inst.world.title : '',
      cameraMode: inst.cameraMode,
      atmosphereState: inst.atmosphereState,
      fogDensity: Number(getFogDensity().toFixed(3)),
      actorCount: inst.actorCount,
      planes: Object.assign({}, PLANE_PARALLAX),
      parallaxOffset: {
        x: Number(inst.camX.toFixed(2)),
        y: Number(inst.camY.toFixed(2))
      }
    };
  }

  const ScionMultiplaneStage = {
    PLANE_PARALLAX,
    ATMOSPHERE_STATES,
    CHAPTER_WORLDS,
    WORLDS: CHAPTER_WORLDS,
    mount,
    init: mount,
    unmount,
    destroy: unmount,
    updateBeat,
    setBeat: updateBeat,
    resolveScenicWorld,
    setCameraMode,
    getCameraMode,
    setAtmosphereState,
    getAtmosphereState,
    setFogDensity,
    getFogDensity,
    syncContactShadows,
    renderNow: () => stepAnimationFrame(typeof performance !== 'undefined' ? performance.now() : Date.now()),
    getState
  };

  root.ScionMultiplaneStage = ScionMultiplaneStage;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScionMultiplaneStage;
  }

  // Auto-mount if .proscenium-box is already present or on DOMContentLoaded
  if (typeof document !== 'undefined') {
    const autoMount = () => {
      const box = document.querySelector('.proscenium-box') || document.getElementById('stageProscenium');
      if (box && !stateInstance.mounted) {
        mount(box);
      }
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', autoMount, { once: true });
    } else {
      setTimeout(autoMount, 0);
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
