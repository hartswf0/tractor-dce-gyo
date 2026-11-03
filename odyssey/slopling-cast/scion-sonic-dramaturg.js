/**
 * SCION-SONIC-DRAMATURG (window.ScionSonicDramaturg)
 * ============================================================================
 * Zero-dependency WebAudio procedural sound, cutout foley, chapter soundscape,
 * Sound-to-Action viseme/gesture envelope, and dramaturgical shot-timing engine
 * for "The Slopling's Odyssey".
 *
 * Synthesizes SCION Lineages:
 *   - #4  Frank Mouris — Autobiographical Image Torrent (rhythmic cardstock collage cadence)
 *   - #6  John Whitney — Harmonic Motion Orchestra (just-intonation differential ratios)
 *   - #47 Sound-to-Action — Viseme and Gesture Swarm (30fps envelope -> cutout & 15-part rig motion)
 *   - Operating Doctrine #7 (Audio & Staging): "Make attention, sound events, holds,
 *     contrast and edit timing integral to the shot, not a polish stage."
 */
(function (root, factory) {
  'use strict';
  const api = factory(root);
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.ScionSonicDramaturg = api;
  }
  if (typeof window !== 'undefined') {
    window.ScionSonicDramaturg = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this), function (root) {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. VOCAL REGISTERS & SPEAKER PROFILES
  // ---------------------------------------------------------------------------
  const SPEAKER_REGISTERS = {
    watson: {
      id: 'watson',
      label: 'Slopling Watson',
      baseHz: 135,
      formantHz: 540,
      secondFormantHz: 1180,
      wave: 'triangle',
      subWave: 'sine',
      gain: 0.055,
      attackSec: 0.009,
      decaySec: 0.088,
      vibratoHz: 4.6,
      vibratoDepth: 1.8
    },
    dana: {
      id: 'dana',
      label: 'Dana (Engineering Director)',
      baseHz: 240,
      formantHz: 860,
      secondFormantHz: 1720,
      wave: 'triangle',
      subWave: 'sine',
      gain: 0.05,
      attackSec: 0.006,
      decaySec: 0.068,
      vibratoHz: 5.4,
      vibratoDepth: 2.2
    },
    circe: {
      id: 'circe',
      label: 'Circe (Transformation Architect)',
      baseHz: 290,
      formantHz: 980,
      secondFormantHz: 1960,
      wave: 'sine',
      subWave: 'triangle',
      harmonicRatio: 1.25, // 5:4 just major third shimmer
      gain: 0.052,
      attackSec: 0.012,
      decaySec: 0.105,
      vibratoHz: 5.8,
      vibratoDepth: 3.1
    },
    polyphemus: {
      id: 'polyphemus',
      label: 'Polyphemus (Dashboard Cyclops)',
      baseHz: 75,
      formantHz: 280,
      secondFormantHz: 620,
      wave: 'sawtooth',
      subWave: 'triangle',
      gain: 0.064,
      attackSec: 0.014,
      decaySec: 0.125,
      vibratoHz: 3.2,
      vibratoDepth: 2.5
    },
    laertes: {
      id: 'laertes',
      label: 'Laertes (Father in the Orchard)',
      baseHz: 115,
      formantHz: 460,
      secondFormantHz: 990,
      wave: 'triangle',
      subWave: 'sine',
      gain: 0.052,
      attackSec: 0.014,
      decaySec: 0.112,
      vibratoHz: 4.1,
      vibratoDepth: 1.9
    },
    compagnon: {
      id: 'compagnon',
      label: 'Master Craftsperson (Compagnons)',
      baseHz: 160,
      formantHz: 620,
      secondFormantHz: 1320,
      wave: 'triangle',
      subWave: 'sine',
      gain: 0.054,
      attackSec: 0.008,
      decaySec: 0.085,
      vibratoHz: 4.8,
      vibratoDepth: 1.6
    },
    mau: {
      id: 'mau',
      label: 'Mau Piailug (Master Navigator)',
      baseHz: 125,
      formantHz: 490,
      secondFormantHz: 1040,
      wave: 'sine',
      subWave: 'triangle',
      gain: 0.056,
      attackSec: 0.012,
      decaySec: 0.108,
      vibratoHz: 4.2,
      vibratoDepth: 1.7
    },
    ajax: {
      id: 'ajax',
      label: 'Ajax (The Silent Builder)',
      baseHz: 98,
      formantHz: 380,
      secondFormantHz: 820,
      wave: 'triangle',
      subWave: 'sine',
      gain: 0.044,
      attackSec: 0.016,
      decaySec: 0.12,
      vibratoHz: 3.6,
      vibratoDepth: 1.2
    },
    telemachus: {
      id: 'telemachus',
      label: 'Telemachus',
      baseHz: 182,
      formantHz: 710,
      secondFormantHz: 1480,
      wave: 'triangle',
      subWave: 'sine',
      gain: 0.05,
      attackSec: 0.008,
      decaySec: 0.082,
      vibratoHz: 5.0,
      vibratoDepth: 1.8
    },
    odysseus: {
      id: 'odysseus',
      label: 'Odysseus Returned',
      baseHz: 128,
      formantHz: 510,
      secondFormantHz: 1120,
      wave: 'triangle',
      subWave: 'sine',
      gain: 0.055,
      attackSec: 0.01,
      decaySec: 0.095,
      vibratoHz: 4.4,
      vibratoDepth: 1.9
    }
  };

  // Map entity IDs and substrings to canonical speaker profile keys
  function resolveSpeakerProfile(speakerRole) {
    const raw = String(speakerRole || 'watson').toLowerCase().trim();
    if (SPEAKER_REGISTERS[raw]) return SPEAKER_REGISTERS[raw];
    if (raw.includes('dana') || raw.includes('hr_pair') || raw.includes('vp') || raw.includes('ines') || raw.includes('lave')) {
      return SPEAKER_REGISTERS.dana;
    }
    if (raw.includes('circe') || raw.includes('siren') || raw.includes('shanning') || raw.includes('sutskov')) {
      return SPEAKER_REGISTERS.circe;
    }
    if (raw.includes('cyclops') || raw.includes('polyphemus') || raw.includes('scylla') || raw.includes('charybdis')) {
      return SPEAKER_REGISTERS.polyphemus;
    }
    if (raw.includes('father') || raw.includes('laertes') || raw.includes('knuthe') || raw.includes('tomson') || raw.includes('brookes')) {
      return SPEAKER_REGISTERS.laertes;
    }
    if (raw.includes('mau') || raw.includes('navigator') || raw.includes('hawaiian')) {
      return SPEAKER_REGISTERS.mau;
    }
    if (raw.includes('ajax') || raw.includes('shade')) {
      return SPEAKER_REGISTERS.ajax;
    }
    if (raw.includes('son') || raw.includes('telemachus') || raw.includes('junior')) {
      return SPEAKER_REGISTERS.telemachus;
    }
    if (raw.includes('odysseus')) {
      return SPEAKER_REGISTERS.odysseus;
    }
    if (
      raw.includes('worker') ||
      raw.includes('compagnon') ||
      raw.includes('carpenter') ||
      raw.includes('stonemason') ||
      raw.includes('potter') ||
      raw.includes('ise') ||
      raw.includes('wenger') ||
      raw.includes('ijazah') ||
      raw.includes('carmick') ||
      raw.includes('dougie') ||
      raw.includes('chad') ||
      raw.includes('karpathi')
    ) {
      return SPEAKER_REGISTERS.compagnon;
    }
    return SPEAKER_REGISTERS.watson;
  }

  // ---------------------------------------------------------------------------
  // 2. EMOTION CADENCE & SHOT TIMING PROFILES (E00 - E17)
  // ---------------------------------------------------------------------------
  const EMOTION_PROFILES = {
    E00: { id: 'E00', name: 'Neutral listening', tempoMult: 1.0, pitchSpan: 0.08, contour: 'level', pauseMult: 1.0, holdBonusMs: 0, gainMult: 0.95 },
    E01: { id: 'E01', name: 'Absorbed focus', tempoMult: 0.96, pitchSpan: 0.06, contour: 'focused', pauseMult: 1.05, holdBonusMs: 250, gainMult: 0.92 },
    E02: { id: 'E02', name: 'Curiosity', tempoMult: 1.08, pitchSpan: 0.16, contour: 'rising', pauseMult: 0.92, holdBonusMs: 150, gainMult: 1.02 },
    E03: { id: 'E03', name: 'Skepticism', tempoMult: 0.94, pitchSpan: 0.12, contour: 'arch', pauseMult: 1.15, holdBonusMs: 350, gainMult: 0.96 },
    E04: { id: 'E04', name: 'Self doubt', tempoMult: 0.86, pitchSpan: 0.09, contour: 'falling', pauseMult: 1.32, holdBonusMs: 600, gainMult: 0.84 },
    E05: { id: 'E05', name: 'Polite strain', tempoMult: 1.12, pitchSpan: 0.05, contour: 'clipped', pauseMult: 0.88, holdBonusMs: 400, gainMult: 0.90 },
    E06: { id: 'E06', name: 'Delight', tempoMult: 1.14, pitchSpan: 0.22, contour: 'harmonic_up', pauseMult: 0.90, holdBonusMs: 450, gainMult: 1.08 },
    E07: { id: 'E07', name: 'Craft pride', tempoMult: 0.98, pitchSpan: 0.14, contour: 'warm_fifth', pauseMult: 1.08, holdBonusMs: 550, gainMult: 1.02 },
    E08: { id: 'E08', name: 'Fear startle', tempoMult: 1.24, pitchSpan: 0.26, contour: 'jagged', pauseMult: 0.82, holdBonusMs: 750, gainMult: 1.12 },
    E09: { id: 'E09', name: 'Frustration', tempoMult: 1.10, pitchSpan: 0.15, contour: 'tense', pauseMult: 0.94, holdBonusMs: 650, gainMult: 1.08 },
    E10: { id: 'E10', name: 'Shame', tempoMult: 0.80, pitchSpan: 0.07, contour: 'falling', pauseMult: 1.45, holdBonusMs: 900, gainMult: 0.76 },
    E11: { id: 'E11', name: 'Sadness', tempoMult: 0.82, pitchSpan: 0.08, contour: 'sigh', pauseMult: 1.40, holdBonusMs: 950, gainMult: 0.80 },
    E12: { id: 'E12', name: 'Exhaustion', tempoMult: 0.76, pitchSpan: 0.05, contour: 'droop', pauseMult: 1.50, holdBonusMs: 850, gainMult: 0.75 },
    E13: { id: 'E13', name: 'Compassion', tempoMult: 0.90, pitchSpan: 0.14, contour: 'warm_arch', pauseMult: 1.22, holdBonusMs: 1050, gainMult: 0.96 },
    E14: { id: 'E14', name: 'Recognition warmth', tempoMult: 0.95, pitchSpan: 0.18, contour: 'harmonic_up', pauseMult: 1.18, holdBonusMs: 1100, gainMult: 1.04 },
    E15: { id: 'E15', name: 'Relief contentment', tempoMult: 0.90, pitchSpan: 0.12, contour: 'settle', pauseMult: 1.25, holdBonusMs: 900, gainMult: 0.92 },
    E16: { id: 'E16', name: 'Resolve boundary', tempoMult: 0.92, pitchSpan: 0.09, contour: 'planted', pauseMult: 1.28, holdBonusMs: 1250, gainMult: 1.05 },
    E17: { id: 'E17', name: 'Withdrawal silence', tempoMult: 0.68, pitchSpan: 0.03, contour: 'hushed', pauseMult: 1.85, holdBonusMs: 1800, gainMult: 0.48 }
  };

  function resolveEmotionProfile(emotionCode) {
    const code = String(emotionCode || 'E00').toUpperCase().trim().slice(0, 3);
    return EMOTION_PROFILES[code] || EMOTION_PROFILES.E00;
  }

  // ---------------------------------------------------------------------------
  // 3. CHAPTER AMBIENCE PROFILES (Chapters I - X)
  // ---------------------------------------------------------------------------
  const CHAPTER_AMBIENCES = [
    {
      index: 0,
      roman: 'I',
      id: 'server_hum',
      label: 'I. The Call — Server & Fluorescent Hum',
      fundamentalHz: 60,
      overtoneHz: 120,
      thirdHz: 180,
      noiseType: 'pink',
      filterType: 'bandpass',
      filterHz: 210,
      filterQ: 3.2,
      lfoHz: 0.18,
      lfoDepthHz: 28,
      droneGain: 0.015,
      noiseGain: 0.006
    },
    {
      index: 1,
      roman: 'II',
      id: 'harbour_wind',
      label: 'II. Departure & Circe — Harbour Wind & Loom',
      fundamentalHz: 96,
      overtoneHz: 144, // 3:2 fifth
      thirdHz: 240,
      noiseType: 'pink',
      filterType: 'bandpass',
      filterHz: 340,
      filterQ: 1.4,
      lfoHz: 0.13,
      lfoDepthHz: 160,
      droneGain: 0.012,
      noiseGain: 0.014
    },
    {
      index: 2,
      roman: 'III',
      id: 'islands_sirens',
      label: 'III. Islands & Sirens — Open Water & Distant Harmonic',
      fundamentalHz: 130.81, // C3
      overtoneHz: 228.9,     // 7:4 harmonic seventh
      thirdHz: 327.0,        // 5:2
      noiseType: 'pink',
      filterType: 'bandpass',
      filterHz: 420,
      filterQ: 1.8,
      lfoHz: 0.16,
      lfoDepthHz: 210,
      droneGain: 0.013,
      noiseGain: 0.013
    },
    {
      index: 3,
      roman: 'IV',
      id: 'workshop_wood',
      label: 'IV. Craft Masters — Cedar Workshop & Shaving Rasp',
      fundamentalHz: 110,
      overtoneHz: 165,
      thirdHz: 220,
      noiseType: 'pink',
      filterType: 'bandpass',
      filterHz: 520,
      filterQ: 2.4,
      lfoHz: 0.42, // gentle hand-plane rhythm
      lfoDepthHz: 190,
      droneGain: 0.012,
      noiseGain: 0.011
    },
    {
      index: 4,
      roman: 'V',
      id: 'road_warmth',
      label: 'V. The Road — Timber, Stone & Kiln Warmth',
      fundamentalHz: 108,
      overtoneHz: 162,
      thirdHz: 270, // 5:2 warm tenth
      noiseType: 'pink',
      filterType: 'lowpass',
      filterHz: 380,
      filterQ: 1.1,
      lfoHz: 0.22,
      lfoDepthHz: 95,
      droneGain: 0.014,
      noiseGain: 0.009
    },
    {
      index: 5,
      roman: 'VI',
      id: 'ocean_swell',
      label: 'VI. Wayfinding (Mau) — Deep Pacific Hull Swell',
      fundamentalHz: 55,
      overtoneHz: 82.5,
      thirdHz: 137.5,
      noiseType: 'pink',
      filterType: 'lowpass',
      filterHz: 220,
      filterQ: 1.5,
      lfoHz: 0.09, // deep 11-second ocean swell period
      lfoDepthHz: 115,
      droneGain: 0.018,
      noiseGain: 0.016
    },
    {
      index: 6,
      roman: 'VII',
      id: 'cavern_resonance',
      label: 'VII. The Cyclops — Subterranean Cavern & Telemetry Pulse',
      fundamentalHz: 48,
      overtoneHz: 72,
      thirdHz: 114, // tense diminished inflection
      noiseType: 'pink',
      filterType: 'bandpass',
      filterHz: 165,
      filterQ: 4.5,
      lfoHz: 0.28,
      lfoDepthHz: 45,
      droneGain: 0.019,
      noiseGain: 0.010
    },
    {
      index: 7,
      roman: 'VIII',
      id: 'pale_harmonic',
      label: 'VIII. Underworld (Ajax) — Pale Asphodel Harmonic Drone',
      fundamentalHz: 110,
      overtoneHz: 165,
      thirdHz: 247.5, // stacked 3:2 fifths
      noiseType: 'white',
      filterType: 'bandpass',
      filterHz: 640,
      filterQ: 6.0,
      lfoHz: 0.07,
      lfoDepthHz: 80,
      droneGain: 0.014,
      noiseGain: 0.004
    },
    {
      index: 8,
      roman: 'IX',
      id: 'hall_murmur',
      label: 'IX. The Suitors — Banquet Hall & Status Murmur',
      fundamentalHz: 87.31,
      overtoneHz: 130.81,
      thirdHz: 185.0,
      noiseType: 'pink',
      filterType: 'bandpass',
      filterHz: 460,
      filterQ: 2.1,
      lfoHz: 0.65, // restless chatter modulation
      lfoDepthHz: 180,
      droneGain: 0.013,
      noiseGain: 0.012
    },
    {
      index: 9,
      roman: 'X',
      id: 'orchard_breeze',
      label: 'X. Father’s Orchard — Sunlit Leaves & Just-Intonation Breeze',
      fundamentalHz: 144, // warm D3 just root
      overtoneHz: 180,    // 5:4 major third
      thirdHz: 216,       // 3:2 perfect fifth
      noiseType: 'pink',
      filterType: 'bandpass',
      filterHz: 720,
      filterQ: 1.2,
      lfoHz: 0.14,
      lfoDepthHz: 260,
      droneGain: 0.013,
      noiseGain: 0.011
    }
  ];

  const ROMAN_TO_INDEX = {
    I: 0, II: 1, III: 2, IV: 3, V: 4,
    VI: 5, VII: 6, VIII: 7, IX: 8, X: 9
  };

  function resolveChapterIndex(chapterInput) {
    if (typeof chapterInput === 'number' && Number.isFinite(chapterInput)) {
      if (chapterInput >= 0 && chapterInput <= 9) return Math.floor(chapterInput);
      if (chapterInput === 10) return 9;
      return Math.max(0, Math.min(9, Math.floor(chapterInput)));
    }
    if (typeof chapterInput === 'string') {
      const trimmed = chapterInput.trim();
      const romanMatch = trimmed.match(/^(X|IX|VIII|VII|VI|V|IV|III|II|I)\b/i);
      if (romanMatch) {
        const key = romanMatch[1].toUpperCase();
        if (ROMAN_TO_INDEX[key] !== undefined) return ROMAN_TO_INDEX[key];
      }
      const beatMatch = trimmed.match(/beat_(\d+)/i);
      if (beatMatch) {
        const bNum = parseInt(beatMatch[1], 10);
        if (bNum <= 18) return 0;
        if (bNum <= 33) return 1;
        if (bNum <= 41) return 2;
        if (bNum <= 46) return 3;
        if (bNum === 47) return 4;
        if (bNum <= 50) return 5;
        if (bNum <= 70) return 6;
        if (bNum <= 76) return 7;
        if (bNum <= 92) return 8;
        return 9;
      }
      const num = parseInt(trimmed, 10);
      if (!Number.isNaN(num)) {
        return Math.max(0, Math.min(9, num));
      }
    }
    if (chapterInput && typeof chapterInput === 'object') {
      if (chapterInput.chapter) return resolveChapterIndex(chapterInput.chapter);
      if (chapterInput.id) return resolveChapterIndex(chapterInput.id);
      if (typeof chapterInput.index === 'number') return resolveChapterIndex(chapterInput.index);
    }
    return 0;
  }

  // ---------------------------------------------------------------------------
  // 4. WEBAUDIO CONTEXT & NOISE BUFFER LIFECYCLE
  // ---------------------------------------------------------------------------
  let audioCtx = null;
  let masterGain = null;
  let foleyBus = null;
  let speechBus = null;
  let ambienceBus = null;
  let pinkNoiseBuffer = null;
  let whiteNoiseBuffer = null;

  let muted = false;
  let ambienceEnabled = true;
  let masterVolume = 0.85;
  let currentChapterIndex = -1;
  let activeAmbienceNodes = null;
  let activeSpeechSession = null;
  let listenersAttached = false;

  function getAudioContextConstructor() {
    if (typeof window !== 'undefined') {
      return window.AudioContext || window.webkitAudioContext || null;
    }
    if (root) {
      return root.AudioContext || root.webkitAudioContext || null;
    }
    return null;
  }

  function buildNoiseBuffers(ctx) {
    if (!ctx || (pinkNoiseBuffer && whiteNoiseBuffer)) return;
    const sampleRate = ctx.sampleRate || 44100;
    const length = sampleRate * 3; // 3-second seamless noise loop

    whiteNoiseBuffer = ctx.createBuffer(1, length, sampleRate);
    pinkNoiseBuffer = ctx.createBuffer(1, length, sampleRate);

    const whiteData = whiteNoiseBuffer.getChannelData(0);
    const pinkData = pinkNoiseBuffer.getChannelData(0);

    // Paul Kellet's refined pink noise filter
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const w = Math.random() * 2 - 1;
      whiteData[i] = w;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.96900 * b2 + w * 0.1538520;
      b3 = 0.86650 * b3 + w * 0.3104856;
      b4 = 0.55000 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.0168980;
      const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362;
      pinkData[i] = pink * 0.11;
      b6 = w * 0.115926;
    }
  }

  function ensureContext() {
    if (audioCtx) {
      if (audioCtx.state === 'suspended' && typeof audioCtx.resume === 'function') {
        audioCtx.resume().catch(() => {});
      }
      return audioCtx;
    }
    const Ctor = getAudioContextConstructor();
    if (!Ctor) return null;
    try {
      audioCtx = new Ctor();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = muted ? 0.0001 : masterVolume;
      masterGain.connect(audioCtx.destination);

      foleyBus = audioCtx.createGain();
      foleyBus.gain.value = 1.0;
      foleyBus.connect(masterGain);

      speechBus = audioCtx.createGain();
      speechBus.gain.value = 1.0;
      speechBus.connect(masterGain);

      ambienceBus = audioCtx.createGain();
      ambienceBus.gain.value = ambienceEnabled ? 1.0 : 0.0001;
      ambienceBus.connect(masterGain);

      buildNoiseBuffers(audioCtx);
      if (audioCtx.state === 'suspended' && typeof audioCtx.resume === 'function') {
        audioCtx.resume().catch(() => {});
      }
      if (currentChapterIndex >= 0 && ambienceEnabled && !muted && !activeAmbienceNodes) {
        startChapterAmbienceGraph(currentChapterIndex);
      }
    } catch (_err) {
      audioCtx = null;
    }
    return audioCtx;
  }

  function attachFirstGestureListeners() {
    if (listenersAttached || typeof window === 'undefined' || !window.addEventListener) return;
    listenersAttached = true;
    const unlock = () => {
      const ctx = ensureContext();
      if (ctx && ctx.state === 'running') {
        window.removeEventListener('pointerdown', unlock, true);
        window.removeEventListener('keydown', unlock, true);
        window.removeEventListener('touchstart', unlock, true);
      }
    };
    window.addEventListener('pointerdown', unlock, true);
    window.addEventListener('keydown', unlock, true);
    window.addEventListener('touchstart', unlock, true);
  }

  attachFirstGestureListeners();

  // ---------------------------------------------------------------------------
  // 5. MUTE & VOLUME CONTROLS
  // ---------------------------------------------------------------------------
  function isMuted() {
    return Boolean(muted);
  }

  function setMuted(bool) {
    muted = Boolean(bool);
    if (audioCtx && masterGain) {
      const now = audioCtx.currentTime;
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(masterGain.gain.value, now);
      masterGain.gain.linearRampToValueAtTime(muted ? 0.0001 : masterVolume, now + 0.04);
    }
    if (muted && activeSpeechSession) {
      // Keep visual viseme envelope running or allow clean completion, but silence oscillators
      if (speechBus && audioCtx) {
        speechBus.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      }
    } else if (!muted && speechBus && audioCtx) {
      speechBus.gain.setValueAtTime(1.0, audioCtx.currentTime);
    }
    return muted;
  }

  function toggleMute() {
    return setMuted(!muted);
  }

  function setMasterVolume(val) {
    masterVolume = Math.max(0, Math.min(1, Number(val) || 0));
    if (audioCtx && masterGain && !muted) {
      masterGain.gain.setTargetAtTime(masterVolume, audioCtx.currentTime, 0.03);
    }
    return masterVolume;
  }

  // ---------------------------------------------------------------------------
  // 6. PROCEDURAL CUTOUT & STAGE FOLEY SYNTHESIZERS
  // ---------------------------------------------------------------------------
  function normalizeFoleyKind(kind) {
    const k = String(kind || 'paper_snap').toLowerCase().trim();
    if (k === 'paper' || k === 'snap' || k === 'cutout' || k === 'cardstock') return 'paper_snap';
    if (k === 'brad' || k === 'joint' || k === 'pivot' || k === 'rig_click') return 'brad_click';
    if (k === 'thud' || k === 'stage' || k === 'drop' || k === 'entrance') return 'stage_thud';
    if (k === 'caliper' || k === 'tick' || k === 'orchard_click') return 'caliper_click';
    if (k === 'reveal' || k === 'chord' || k === 'epiphany' || k === 'whitney') return 'reveal_chord';
    if (k === 'alarm' || k === 'sting' || k === 'monster' || k === 'danger') return 'alarm_sting';
    if (k === 'choice' || k === 'commit' || k === 'seal' || k === 'stamp') return 'choice_commit';
    return k;
  }

  /**
   * Synthesize procedural stage & cutout foley.
   * @param {string} kind - 'paper_snap' | 'brad_click' | 'stage_thud' | 'caliper_click' | 'reveal_chord' | 'alarm_sting' | 'choice_commit'
   * @param {object} [params] - Optional { gain, pitchMult, emotionCode }
   */
  function playFoley(kind, params) {
    const canonical = normalizeFoleyKind(kind);
    const opts = params || {};
    const gainScale = Math.max(0.1, Math.min(2.5, Number(opts.gain) || 1.0));
    const pitchMult = Math.max(0.5, Math.min(2.0, Number(opts.pitchMult || opts.pitch) || 1.0));

    const ctx = ensureContext();
    const now = ctx ? ctx.currentTime : 0;

    if (!ctx || muted) {
      return {
        kind: canonical,
        played: false,
        muted: Boolean(muted),
        durationMs: getFoleyDurationMs(canonical),
        timestamp: Date.now()
      };
    }

    try {
      switch (canonical) {
        case 'paper_snap': {
          // 45ms filtered pink/white noise burst + crisp highpass cardstock snap
          const dur = 0.048;
          const noiseSrc = ctx.createBufferSource();
          noiseSrc.buffer = pinkNoiseBuffer || whiteNoiseBuffer;
          noiseSrc.loop = true;

          const hp = ctx.createBiquadFilter();
          hp.type = 'highpass';
          hp.frequency.setValueAtTime(1450 * pitchMult, now);

          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.setValueAtTime(2400 * pitchMult, now);
          bp.frequency.exponentialRampToValueAtTime(980 * pitchMult, now + dur);
          bp.Q.setValueAtTime(1.8, now);

          const env = ctx.createGain();
          const peak = 0.14 * gainScale;
          env.gain.setValueAtTime(0.0001, now);
          env.gain.linearRampToValueAtTime(peak, now + 0.004);
          env.gain.exponentialRampToValueAtTime(0.0001, now + dur);

          // Subtle low cardboard flex transient (190Hz -> 95Hz, 28ms)
          const flexOsc = ctx.createOscillator();
          flexOsc.type = 'triangle';
          flexOsc.frequency.setValueAtTime(190 * pitchMult, now);
          flexOsc.frequency.exponentialRampToValueAtTime(95 * pitchMult, now + 0.028);

          const flexEnv = ctx.createGain();
          flexEnv.gain.setValueAtTime(0.045 * gainScale, now);
          flexEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

          noiseSrc.connect(hp);
          hp.connect(bp);
          bp.connect(env);
          env.connect(foleyBus);

          flexOsc.connect(flexEnv);
          flexEnv.connect(foleyBus);

          noiseSrc.start(now, Math.random() * 1.5, dur + 0.01);
          noiseSrc.stop(now + dur + 0.01);
          flexOsc.start(now);
          flexOsc.stop(now + 0.032);
          break;
        }

        case 'brad_click': {
          // Metallic brass paper-fastener double-click (1800Hz + 3200Hz short sine/triangle ping)
          const offsets = [0, 0.019];
          offsets.forEach((offset, idx) => {
            const t0 = now + offset;
            const f1 = (idx === 0 ? 1800 : 2050) * pitchMult;
            const f2 = (idx === 0 ? 3200 : 3580) * pitchMult;
            const hitGain = (idx === 0 ? 0.055 : 0.042) * gainScale;

            const osc1 = ctx.createOscillator();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(f1, t0);
            osc1.frequency.exponentialRampToValueAtTime(f1 * 0.86, t0 + 0.022);

            const osc2 = ctx.createOscillator();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(f2, t0);
            osc2.frequency.exponentialRampToValueAtTime(f2 * 0.92, t0 + 0.018);

            const env = ctx.createGain();
            env.gain.setValueAtTime(0.0001, t0);
            env.gain.linearRampToValueAtTime(hitGain, t0 + 0.0015);
            env.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.024);

            osc1.connect(env);
            osc2.connect(env);
            env.connect(foleyBus);

            osc1.start(t0);
            osc2.start(t0);
            osc1.stop(t0 + 0.026);
            osc2.stop(t0 + 0.026);
          });
          break;
        }

        case 'stage_thud': {
          // Warm wooden proscenium floor thump (110Hz -> 42Hz pitch-drop sine + wood resonance)
          const dur = 0.165;
          const subOsc = ctx.createOscillator();
          subOsc.type = 'sine';
          subOsc.frequency.setValueAtTime(110 * pitchMult, now);
          subOsc.frequency.exponentialRampToValueAtTime(42 * pitchMult, now + dur);

          const woodOsc = ctx.createOscillator();
          woodOsc.type = 'triangle';
          woodOsc.frequency.setValueAtTime(168 * pitchMult, now);
          woodOsc.frequency.exponentialRampToValueAtTime(76 * pitchMult, now + 0.095);

          const thudEnv = ctx.createGain();
          thudEnv.gain.setValueAtTime(0.0001, now);
          thudEnv.gain.linearRampToValueAtTime(0.16 * gainScale, now + 0.006);
          thudEnv.gain.exponentialRampToValueAtTime(0.0001, now + dur);

          const woodEnv = ctx.createGain();
          woodEnv.gain.setValueAtTime(0.0001, now);
          woodEnv.gain.linearRampToValueAtTime(0.065 * gainScale, now + 0.004);
          woodEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.10);

          // Stage board knock transient
          const knockNoise = ctx.createBufferSource();
          knockNoise.buffer = pinkNoiseBuffer || whiteNoiseBuffer;
          const knockFilter = ctx.createBiquadFilter();
          knockFilter.type = 'bandpass';
          knockFilter.frequency.setValueAtTime(240 * pitchMult, now);
          knockFilter.Q.setValueAtTime(3.0, now);
          const knockEnv = ctx.createGain();
          knockEnv.gain.setValueAtTime(0.08 * gainScale, now);
          knockEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

          subOsc.connect(thudEnv);
          thudEnv.connect(foleyBus);
          woodOsc.connect(woodEnv);
          woodEnv.connect(foleyBus);
          knockNoise.connect(knockFilter);
          knockFilter.connect(knockEnv);
          knockEnv.connect(foleyBus);

          subOsc.start(now);
          subOsc.stop(now + dur + 0.01);
          woodOsc.start(now);
          woodOsc.stop(now + 0.11);
          knockNoise.start(now, Math.random(), 0.05);
          knockNoise.stop(now + 0.05);
          break;
        }

        case 'caliper_click': {
          // Precision machinist/orchard brass caliper Vernier tick
          const ticks = [0, 0.012];
          ticks.forEach((dt, i) => {
            const t0 = now + dt;
            const oscHi = ctx.createOscillator();
            oscHi.type = 'sine';
            oscHi.frequency.setValueAtTime((i === 0 ? 4200 : 5600) * pitchMult, t0);

            const oscBody = ctx.createOscillator();
            oscBody.type = 'triangle';
            oscBody.frequency.setValueAtTime((i === 0 ? 1120 : 1480) * pitchMult, t0);

            const env = ctx.createGain();
            const g = (i === 0 ? 0.048 : 0.032) * gainScale;
            env.gain.setValueAtTime(0.0001, t0);
            env.gain.linearRampToValueAtTime(g, t0 + 0.001);
            env.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.015);

            oscHi.connect(env);
            oscBody.connect(env);
            env.connect(foleyBus);

            oscHi.start(t0);
            oscBody.start(t0);
            oscHi.stop(t0 + 0.017);
            oscBody.stop(t0 + 0.017);
          });
          break;
        }

        case 'reveal_chord': {
          // John Whitney harmonic interval (just-intonation chord swell: 1:1, 5:4, 3:2, 15:8, 9:4)
          // For epiphany / orchard / wayfinding beats (E13, E14, E17)
          const rootHz = 216 * pitchMult; // Just A3/D3 harmonic center
          const ratios = [1, 5 / 4, 3 / 2, 15 / 8, 9 / 4];
          const dur = 1.15;

          const lp = ctx.createBiquadFilter();
          lp.type = 'lowpass';
          lp.frequency.setValueAtTime(620, now);
          lp.frequency.exponentialRampToValueAtTime(2100, now + 0.45);
          lp.frequency.exponentialRampToValueAtTime(880, now + dur);
          lp.connect(foleyBus);

          ratios.forEach((ratio, idx) => {
            const osc = ctx.createOscillator();
            osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
            const freq = rootHz * ratio;
            const stagger = idx * 0.035; // Whitney differential harmonic entry
            osc.frequency.setValueAtTime(freq * 0.996, now + stagger);
            osc.frequency.linearRampToValueAtTime(freq, now + stagger + 0.25);

            const voiceEnv = ctx.createGain();
            const voicePeak = (0.028 / Math.sqrt(idx + 1)) * gainScale;
            voiceEnv.gain.setValueAtTime(0.0001, now);
            voiceEnv.gain.setValueAtTime(0.0001, now + stagger);
            voiceEnv.gain.linearRampToValueAtTime(voicePeak, now + stagger + 0.28);
            voiceEnv.gain.exponentialRampToValueAtTime(0.0001, now + dur);

            osc.connect(voiceEnv);
            voiceEnv.connect(lp);

            osc.start(now + stagger);
            osc.stop(now + dur + 0.03);
          });
          break;
        }

        case 'alarm_sting': {
          // Gilliam/Ernst dissonant brass/timpani sting for interruptions, monsters, or poison-pill turns
          const dur = 0.58;
          // Dissonant tritone + minor ninth cluster (110Hz, 155.56Hz, 233.08Hz)
          const clusterHz = [110 * pitchMult, 155.56 * pitchMult, 233.08 * pitchMult];

          const brassFilter = ctx.createBiquadFilter();
          brassFilter.type = 'lowpass';
          brassFilter.frequency.setValueAtTime(1850, now);
          brassFilter.frequency.exponentialRampToValueAtTime(420, now + dur);
          brassFilter.Q.setValueAtTime(3.2, now);
          brassFilter.connect(foleyBus);

          clusterHz.forEach((hz, idx) => {
            const osc = ctx.createOscillator();
            osc.type = idx === 0 ? 'sawtooth' : 'triangle';
            osc.frequency.setValueAtTime(hz * 1.02, now);
            osc.frequency.exponentialRampToValueAtTime(hz * 0.97, now + dur);

            const env = ctx.createGain();
            const peak = (idx === 0 ? 0.045 : 0.034) * gainScale;
            env.gain.setValueAtTime(0.0001, now);
            env.gain.linearRampToValueAtTime(peak, now + 0.012);
            env.gain.exponentialRampToValueAtTime(0.0001, now + dur);

            osc.connect(env);
            env.connect(brassFilter);
            osc.start(now);
            osc.stop(now + dur + 0.02);
          });

          // Timpani pitch-drop thump (96Hz -> 46Hz)
          const timp = ctx.createOscillator();
          timp.type = 'sine';
          timp.frequency.setValueAtTime(96 * pitchMult, now);
          timp.frequency.exponentialRampToValueAtTime(46 * pitchMult, now + 0.34);

          const timpEnv = ctx.createGain();
          timpEnv.gain.setValueAtTime(0.0001, now);
          timpEnv.gain.linearRampToValueAtTime(0.11 * gainScale, now + 0.008);
          timpEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

          timp.connect(timpEnv);
          timpEnv.connect(foleyBus);
          timp.start(now);
          timp.stop(now + 0.40);
          break;
        }

        case 'choice_commit': {
          // Tactile wax-seal / stamp sound when committing to an ASAPS choice
          // 1. Low wax-press thump (88Hz -> 39Hz)
          const stampOsc = ctx.createOscillator();
          stampOsc.type = 'sine';
          stampOsc.frequency.setValueAtTime(88 * pitchMult, now);
          stampOsc.frequency.exponentialRampToValueAtTime(39 * pitchMult, now + 0.095);

          const stampEnv = ctx.createGain();
          stampEnv.gain.setValueAtTime(0.0001, now);
          stampEnv.gain.linearRampToValueAtTime(0.12 * gainScale, now + 0.005);
          stampEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

          stampOsc.connect(stampEnv);
          stampEnv.connect(foleyBus);
          stampOsc.start(now);
          stampOsc.stop(now + 0.12);

          // 2. Crisp parchment crinkle burst at +14ms
          const crinkle = ctx.createBufferSource();
          crinkle.buffer = pinkNoiseBuffer || whiteNoiseBuffer;
          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.setValueAtTime(1950 * pitchMult, now + 0.014);
          bp.Q.setValueAtTime(2.2, now + 0.014);

          const crinkleEnv = ctx.createGain();
          crinkleEnv.gain.setValueAtTime(0.0001, now);
          crinkleEnv.gain.setValueAtTime(0.075 * gainScale, now + 0.014);
          crinkleEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.068);

          crinkle.connect(bp);
          bp.connect(crinkleEnv);
          crinkleEnv.connect(foleyBus);
          crinkle.start(now + 0.014, Math.random(), 0.06);
          crinkle.stop(now + 0.075);

          // 3. Brass signet lift harmonic ping at +38ms
          const signet = ctx.createOscillator();
          signet.type = 'triangle';
          signet.frequency.setValueAtTime(528 * pitchMult, now + 0.038);
          signet.frequency.exponentialRampToValueAtTime(660 * pitchMult, now + 0.13);

          const signetEnv = ctx.createGain();
          signetEnv.gain.setValueAtTime(0.0001, now + 0.038);
          signetEnv.gain.linearRampToValueAtTime(0.038 * gainScale, now + 0.044);
          signetEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

          signet.connect(signetEnv);
          signetEnv.connect(foleyBus);
          signet.start(now + 0.038);
          signet.stop(now + 0.16);
          break;
        }

        default: {
          // Fallback to paper_snap
          return playFoley('paper_snap', opts);
        }
      }
    } catch (_err) {
      // Ignore synthesis scheduling errors in restricted environments
    }

    return {
      kind: canonical,
      played: true,
      muted: false,
      durationMs: getFoleyDurationMs(canonical),
      timestamp: Date.now()
    };
  }

  function getFoleyDurationMs(kind) {
    switch (kind) {
      case 'paper_snap': return 48;
      case 'brad_click': return 45;
      case 'stage_thud': return 165;
      case 'caliper_click': return 30;
      case 'reveal_chord': return 1150;
      case 'alarm_sting': return 580;
      case 'choice_commit': return 160;
      default: return 60;
    }
  }

  // ---------------------------------------------------------------------------
  // 7. AMBIENT CHAPTER DRONE / SOUNDSCAPE (setChapterAmbience)
  // ---------------------------------------------------------------------------
  function teardownAmbienceNodes(nodesToStop, fadeSec) {
    if (!nodesToStop) return;
    const ctx = audioCtx;
    const fade = typeof fadeSec === 'number' ? fadeSec : 0.45;
    if (ctx && nodesToStop.master) {
      try {
        const now = ctx.currentTime;
        nodesToStop.master.gain.cancelScheduledValues(now);
        nodesToStop.master.gain.setValueAtTime(nodesToStop.master.gain.value, now);
        nodesToStop.master.gain.linearRampToValueAtTime(0.0001, now + fade);
      } catch (_e) {}
    }
    setTimeout(() => {
      (nodesToStop.sources || []).forEach(src => {
        try { src.stop(); } catch (_e) {}
        try { src.disconnect(); } catch (_e) {}
      });
      if (nodesToStop.master) {
        try { nodesToStop.master.disconnect(); } catch (_e) {}
      }
    }, Math.ceil(fade * 1000) + 60);
  }

  function startChapterAmbienceGraph(chapIdx) {
    const profile = CHAPTER_AMBIENCES[chapIdx] || CHAPTER_AMBIENCES[0];
    if (!audioCtx || !ambienceBus) return profile;

    if (activeAmbienceNodes) {
      teardownAmbienceNodes(activeAmbienceNodes, 0.55);
      activeAmbienceNodes = null;
    }

    if (!ambienceEnabled || muted) return profile;

    try {
      const now = audioCtx.currentTime;
      const chapMaster = audioCtx.createGain();
      chapMaster.gain.setValueAtTime(0.0001, now);
      chapMaster.gain.linearRampToValueAtTime(1.0, now + 0.65);
      chapMaster.connect(ambienceBus);

      // Fundamental + harmonic overtone drone
      const osc1 = audioCtx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(profile.fundamentalHz, now);

      const osc2 = audioCtx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(profile.overtoneHz, now);

      const osc3 = audioCtx.createOscillator();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(profile.thirdHz, now);

      const droneLp = audioCtx.createBiquadFilter();
      droneLp.type = 'lowpass';
      droneLp.frequency.setValueAtTime(profile.thirdHz * 1.6, now);

      const droneGainNode = audioCtx.createGain();
      droneGainNode.gain.setValueAtTime(profile.droneGain, now);

      osc1.connect(droneLp);
      osc2.connect(droneLp);
      osc3.connect(droneLp);
      droneLp.connect(droneGainNode);
      droneGainNode.connect(chapMaster);

      // Filtered room-tone / wind / wave / breeze noise layer
      const noiseSrc = audioCtx.createBufferSource();
      noiseSrc.buffer = profile.noiseType === 'white'
        ? (whiteNoiseBuffer || pinkNoiseBuffer)
        : (pinkNoiseBuffer || whiteNoiseBuffer);
      noiseSrc.loop = true;

      const noiseFilter = audioCtx.createBiquadFilter();
      noiseFilter.type = profile.filterType || 'bandpass';
      noiseFilter.frequency.setValueAtTime(profile.filterHz, now);
      noiseFilter.Q.setValueAtTime(profile.filterQ || 1.5, now);

      // Slow LFO modulating filter frequency (wave swells, workshop plane, orchard breeze)
      const lfo = audioCtx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(profile.lfoHz || 0.15, now);

      const lfoGain = audioCtx.createGain();
      lfoGain.gain.setValueAtTime(profile.lfoDepthHz || 90, now);

      lfo.connect(lfoGain);
      lfoGain.connect(noiseFilter.frequency);

      const noiseGainNode = audioCtx.createGain();
      noiseGainNode.gain.setValueAtTime(profile.noiseGain, now);

      noiseSrc.connect(noiseFilter);
      noiseFilter.connect(noiseGainNode);
      noiseGainNode.connect(chapMaster);

      osc1.start(now);
      osc2.start(now);
      osc3.start(now);
      noiseSrc.start(now);
      lfo.start(now);

      activeAmbienceNodes = {
        chapterIndex: chapIdx,
        profile,
        master: chapMaster,
        sources: [osc1, osc2, osc3, noiseSrc, lfo]
      };
    } catch (_err) {
      activeAmbienceNodes = null;
    }

    return profile;
  }

  /**
   * Set or crossfade the subtle procedural room-tone / soundscape for Chapters I–X.
   * @param {number|string|object} chapterIdx - 0..9, Roman numeral 'I'..'X', chapter label, or beat ID
   * @param {object} [options] - Optional { forceRestart: boolean, enabled: boolean }
   */
  function setChapterAmbience(chapterIdx, options) {
    const opts = options || {};
    if (typeof opts.enabled === 'boolean') {
      ambienceEnabled = opts.enabled;
    }
    const resolvedIdx = resolveChapterIndex(chapterIdx);
    const profile = CHAPTER_AMBIENCES[resolvedIdx] || CHAPTER_AMBIENCES[0];

    if (resolvedIdx === currentChapterIndex && activeAmbienceNodes && !opts.forceRestart) {
      return profile;
    }
    currentChapterIndex = resolvedIdx;

    if (audioCtx && ambienceEnabled && !muted) {
      startChapterAmbienceGraph(resolvedIdx);
    } else if (!ambienceEnabled && activeAmbienceNodes) {
      teardownAmbienceNodes(activeAmbienceNodes, 0.35);
      activeAmbienceNodes = null;
    }
    return profile;
  }

  function isAmbienceEnabled() {
    return Boolean(ambienceEnabled);
  }

  function setAmbienceEnabled(bool) {
    ambienceEnabled = Boolean(bool);
    if (!ambienceEnabled && activeAmbienceNodes) {
      teardownAmbienceNodes(activeAmbienceNodes, 0.3);
      activeAmbienceNodes = null;
    } else if (ambienceEnabled && currentChapterIndex >= 0 && audioCtx && !muted) {
      startChapterAmbienceGraph(currentChapterIndex);
    }
    return ambienceEnabled;
  }

  function toggleAmbience() {
    return setAmbienceEnabled(!ambienceEnabled);
  }

  // ---------------------------------------------------------------------------
  // 8. SOUND-TO-ACTION SPEECH CADENCE & 30FPS VISEME ENVELOPE
  // ---------------------------------------------------------------------------
  const VISEME_SHAPES = ['SIL', 'AA', 'OH', 'EE', 'OO', 'MM', 'FV'];

  function extractTextFromNode(nodeData) {
    if (!nodeData) return '';
    if (typeof nodeData === 'string') return nodeData.trim();
    if (typeof nodeData.text === 'string' && nodeData.text.trim()) return nodeData.text.trim();
    if (typeof nodeData.source_text === 'string' && nodeData.source_text.trim()) return nodeData.source_text.trim();
    if (Array.isArray(nodeData.paragraphs) && nodeData.paragraphs.length) {
      return nodeData.paragraphs.join(' ').trim();
    }
    if (Array.isArray(nodeData.text) && nodeData.text.length) {
      return nodeData.text.map(t => (typeof t === 'string' ? t : (t && t.text) || '')).join(' ').trim();
    }
    if (typeof nodeData.summary === 'string' && nodeData.summary.trim()) return nodeData.summary.trim();
    if (typeof nodeData.interpretation_note === 'string' && nodeData.interpretation_note.trim()) return nodeData.interpretation_note.trim();
    if (typeof nodeData.acting_cue === 'string' && nodeData.acting_cue.trim()) return nodeData.acting_cue.trim();
    if (typeof nodeData.name === 'string') return nodeData.name.trim();
    return '';
  }

  function classifySyllableViseme(wordChunk) {
    const clean = String(wordChunk || '').toLowerCase().replace(/[^a-z]/g, '');
    if (!clean) return 'SIL';
    if (/^[bmp]/.test(clean) || /[mp]$/.test(clean)) return 'MM';
    if (/^[fv]/.test(clean)) return 'FV';
    if (/oo|ou|u|w/.test(clean)) return 'OO';
    if (/ee|ea|i|y/.test(clean)) return 'EE';
    if (/o|au|aw/.test(clean)) return 'OH';
    return 'AA';
  }

  /**
   * Build an intentional syllable cadence schedule from dialogue text, speaker register, and emotion code.
   */
  function buildSyllableSchedule(text, speakerProfile, emotionProfile) {
    const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
    if (!cleaned || emotionProfile.id === 'E17') {
      // E17 Withdrawal silence: deliberate contemplative breath hold with minimal pulse
      return [{
        index: 0,
        token: '...',
        viseme: 'SIL',
        startMs: 0,
        durationMs: 420,
        pauseAfterMs: 380,
        freqHz: speakerProfile.baseHz * 0.94,
        gain: 0.0,
        isSilentHold: true
      }];
    }

    // Tokenize into words & punctuation clauses, capped to keep cadence musical & concise (max 22 syllables)
    const rawWords = cleaned.split(/\s+/).slice(0, 26);
    const syllables = [];
    const baseSylMs = Math.round(108 / emotionProfile.tempoMult);

    let cursorMs = 0;
    const maxSyllables = 20;

    for (let wIdx = 0; wIdx < rawWords.length && syllables.length < maxSyllables; wIdx++) {
      const word = rawWords[wIdx];
      const hasPeriod = /[.!?—…]$/.test(word);
      const hasComma = /[,;:]$/.test(word);
      const stripped = word.replace(/[^a-zA-Z]/g, '');
      if (!stripped) continue;

      // Split longer words into 2 syllable chunks
      const chunks = stripped.length > 6
        ? [stripped.slice(0, Math.ceil(stripped.length / 2)), stripped.slice(Math.ceil(stripped.length / 2))]
        : [stripped];

      for (let cIdx = 0; cIdx < chunks.length && syllables.length < maxSyllables; cIdx++) {
        const chunk = chunks[cIdx];
        const sIdx = syllables.length;
        const progress = sIdx / Math.max(1, maxSyllables - 1);

        // Compute pitch contour from emotion profile + John Whitney harmonic ratios
        let contourRatio = 1.0;
        const span = emotionProfile.pitchSpan;
        switch (emotionProfile.contour) {
          case 'rising':
            contourRatio = 1.0 + span * (progress * 0.85 + Math.sin(sIdx * 1.3) * 0.25);
            break;
          case 'falling':
          case 'sigh':
          case 'droop':
            contourRatio = 1.0 + span * (0.35 - progress * 0.95);
            break;
          case 'harmonic_up': {
            const whitneySteps = [1.0, 9 / 8, 5 / 4, 4 / 3, 3 / 2];
            contourRatio = whitneySteps[sIdx % whitneySteps.length];
            break;
          }
          case 'warm_fifth': {
            const fifthSteps = [1.0, 9 / 8, 5 / 4, 3 / 2, 5 / 4];
            contourRatio = fifthSteps[sIdx % fifthSteps.length];
            break;
          }
          case 'jagged':
            contourRatio = 1.0 + (sIdx % 2 === 0 ? span : -span * 0.7);
            break;
          case 'planted':
            contourRatio = sIdx % 4 === 0 ? 1.0 + span * 0.5 : 1.0;
            break;
          default:
            contourRatio = 1.0 + Math.sin(sIdx * 1.15) * span * 0.65;
            break;
        }

        const isStressed = cIdx === 0 && stripped.length > 3;
        const durMs = Math.round(baseSylMs * (isStressed ? 1.15 : 0.92));
        const isWordEnd = cIdx === chunks.length - 1;
        let pauseAfterMs = isWordEnd ? Math.round(28 * emotionProfile.pauseMult) : 10;
        if (isWordEnd && hasComma) pauseAfterMs += Math.round(95 * emotionProfile.pauseMult);
        if (isWordEnd && hasPeriod) pauseAfterMs += Math.round(175 * emotionProfile.pauseMult);

        const rawGain = speakerProfile.gain * emotionProfile.gainMult * (isStressed ? 1.08 : 0.92);
        const clampedGain = Math.max(0.032, Math.min(0.072, rawGain));

        syllables.push({
          index: sIdx,
          token: chunk,
          viseme: classifySyllableViseme(chunk),
          startMs: cursorMs,
          durationMs: durMs,
          pauseAfterMs,
          freqHz: speakerProfile.baseHz * contourRatio,
          gain: clampedGain,
          isSilentHold: false
        });

        cursorMs += durMs + pauseAfterMs;
      }
    }

    return syllables;
  }

  function scheduleSyllableAudio(syllables, speakerProfile, emotionProfile) {
    const ctx = ensureContext();
    if (!ctx || muted || !speechBus) return [];

    const scheduledNodes = [];
    const now = ctx.currentTime + 0.012;

    syllables.forEach(syl => {
      if (syl.isSilentHold || syl.gain <= 0.001) return;
      const t0 = now + syl.startMs / 1000;
      const durSec = Math.max(0.045, syl.durationMs / 1000);
      const attack = Math.min(speakerProfile.attackSec || 0.009, durSec * 0.35);

      try {
        // Primary formant-shaped woodwind/marimba oscillator
        const oscMain = ctx.createOscillator();
        oscMain.type = speakerProfile.wave || 'triangle';
        oscMain.frequency.setValueAtTime(syl.freqHz, t0);
        oscMain.frequency.exponentialRampToValueAtTime(
          Math.max(45, syl.freqHz * (emotionProfile.contour === 'rising' ? 1.03 : 0.97)),
          t0 + durSec
        );

        // Warm sub/harmonic companion oscillator
        const oscSub = ctx.createOscillator();
        oscSub.type = speakerProfile.subWave || 'sine';
        const subRatio = speakerProfile.harmonicRatio || 0.5;
        oscSub.frequency.setValueAtTime(syl.freqHz * subRatio, t0);

        // Formant filter (marimba / warm woodwind body, never harsh)
        const formantFilter = ctx.createBiquadFilter();
        formantFilter.type = 'lowpass';
        const visemeBoost = syl.viseme === 'EE' ? 1.25 : (syl.viseme === 'OO' ? 0.78 : 1.0);
        formantFilter.frequency.setValueAtTime(speakerProfile.formantHz * visemeBoost * 1.35, t0);
        formantFilter.frequency.exponentialRampToValueAtTime(speakerProfile.formantHz * 0.85, t0 + durSec);
        formantFilter.Q.setValueAtTime(1.6, t0);

        const env = ctx.createGain();
        env.gain.setValueAtTime(0.0001, t0);
        env.gain.linearRampToValueAtTime(syl.gain, t0 + attack);
        env.gain.exponentialRampToValueAtTime(0.0001, t0 + durSec + 0.018);

        oscMain.connect(formantFilter);
        oscSub.connect(formantFilter);
        formantFilter.connect(env);
        env.connect(speechBus);

        oscMain.start(t0);
        oscSub.start(t0);
        oscMain.stop(t0 + durSec + 0.025);
        oscSub.stop(t0 + durSec + 0.025);

        scheduledNodes.push(oscMain, oscSub);
      } catch (_err) {}
    });

    return scheduledNodes;
  }

  /**
   * Stop any currently active speech cadence & 30fps viseme envelope loop.
   */
  function stopSpeech() {
    if (!activeSpeechSession) return;
    const session = activeSpeechSession;
    activeSpeechSession = null;

    if (session.timerId) {
      clearInterval(session.timerId);
    }
    if (Array.isArray(session.audioNodes)) {
      session.audioNodes.forEach(node => {
        try { node.stop(); } catch (_e) {}
        try { node.disconnect(); } catch (_e) {}
      });
    }
    if (typeof session.onEnvelopeTick === 'function') {
      try {
        session.onEnvelopeTick(0.0, 'SIL', {
          amplitude: 0.0,
          visemeShape: 'SIL',
          headTiltDeg: 0,
          jawOpen: 0,
          gestureAmount: 0,
          progress: 1.0,
          rigOffsets: computeRigSpeechOffsets(0.0, 'SIL', session.emotionCode, 1.0)
        });
      } catch (_e) {}
    }
  }

  /**
   * Compute 15-part WatsonRig rotational offsets driven by live speech amplitude & viseme.
   */
  function computeRigSpeechOffsets(amplitude, visemeShape, emotionCode, progress) {
    const amp = Math.max(0, Math.min(1, Number(amplitude) || 0));
    const phase = (Number(progress) || 0) * Math.PI * 4;
    const isBoundary = ['E09', 'E16', 'E17'].includes(emotionCode);
    const isWarm = ['E06', 'E07', 'E13', 'E14'].includes(emotionCode);

    const headNod = amp * (visemeShape === 'EE' || visemeShape === 'AA' ? -4.2 : 2.8) + Math.sin(phase) * amp * 1.8;
    const torsoSway = Math.sin(phase * 0.5) * amp * (isBoundary ? 0.8 : 1.6);
    const leftForearmDelta = -amp * (isWarm ? 14 : 9) * (0.6 + 0.4 * Math.sin(phase));
    const rightForearmDelta = amp * (isWarm ? 12 : 7) * (0.6 + 0.4 * Math.cos(phase));
    const leftHandDelta = amp * (visemeShape === 'OH' || visemeShape === 'AA' ? 8 : 3);
    const rightHandDelta = -amp * (visemeShape === 'EE' ? 7 : 3);

    return {
      head: Number(headNod.toFixed(2)),
      torso: Number(torsoSway.toFixed(2)),
      upper_arm_left: Number((-amp * 3.2).toFixed(2)),
      forearm_left: Number(leftForearmDelta.toFixed(2)),
      hand_left: Number(leftHandDelta.toFixed(2)),
      upper_arm_right: Number((amp * 2.8).toFixed(2)),
      forearm_right: Number(rightForearmDelta.toFixed(2)),
      hand_right: Number(rightHandDelta.toFixed(2))
    };
  }

  /**
   * Speak a dialogue node or beat with musical paper-theater cadence pulses and a 30fps
   * Sound-to-Action viseme & gesture envelope.
   *
   * @param {object|string} nodeData - Dialogue node or beat object or text string
   * @param {string} [speakerRole] - Speaker role or entity_id (e.g. 'watson', 'dana', 'circe', 'polyphemus', 'laertes', 'compagnon')
   * @param {string} [emotionCode] - Emotion state 'E00'..'E17'
   * @param {function} [onEnvelopeTick] - Called at 30fps: (amplitude, visemeShape, tickMeta)
   * @param {function} [onComplete] - Called when speech cadence completes: (summary)
   */
  function speakNode(nodeData, speakerRole, emotionCode, onEnvelopeTick, onComplete) {
    stopSpeech();

    const text = extractTextFromNode(nodeData);
    const inferredEmotion = emotionCode ||
      (nodeData && nodeData.state) ||
      (nodeData && nodeData.performances && nodeData.performances[0] && nodeData.performances[0].states && nodeData.performances[0].states[0] && nodeData.performances[0].states[0].state) ||
      'E00';
    const inferredSpeaker = speakerRole ||
      (nodeData && nodeData.speakerEntity) ||
      (nodeData && nodeData.performances && nodeData.performances[0] && nodeData.performances[0].entity_id) ||
      'watson';

    const speakerProfile = resolveSpeakerProfile(inferredSpeaker);
    const emotionProfile = resolveEmotionProfile(inferredEmotion);
    const syllables = buildSyllableSchedule(text, speakerProfile, emotionProfile);

    const lastSyl = syllables[syllables.length - 1];
    const totalDurationMs = lastSyl
      ? Math.max(240, lastSyl.startMs + lastSyl.durationMs + Math.min(180, lastSyl.pauseAfterMs))
      : 300;

    const audioNodes = scheduleSyllableAudio(syllables, speakerProfile, emotionProfile);
    const startWallMs = Date.now();
    const frameIntervalMs = 33; // 30fps Sound-to-Action envelope

    const session = {
      speaker: speakerProfile.id,
      emotionCode: emotionProfile.id,
      syllables,
      totalDurationMs,
      audioNodes,
      onEnvelopeTick,
      onComplete,
      timerId: null
    };
    activeSpeechSession = session;

    const tick = () => {
      if (activeSpeechSession !== session) return;
      const elapsedMs = Date.now() - startWallMs;
      if (elapsedMs >= totalDurationMs) {
        clearInterval(session.timerId);
        activeSpeechSession = null;
        const finalOffsets = computeRigSpeechOffsets(0.0, 'SIL', emotionProfile.id, 1.0);
        if (typeof onEnvelopeTick === 'function') {
          try {
            onEnvelopeTick(0.0, 'SIL', {
              amplitude: 0.0,
              visemeShape: 'SIL',
              headTiltDeg: 0,
              jawOpen: 0,
              gestureAmount: 0,
              syllableIndex: syllables.length - 1,
              totalSyllables: syllables.length,
              progress: 1.0,
              rigOffsets: finalOffsets
            });
          } catch (_e) {}
        }
        if (typeof onComplete === 'function') {
          try {
            onComplete({
              speaker: speakerProfile.id,
              emotionCode: emotionProfile.id,
              syllableCount: syllables.length,
              durationMs: totalDurationMs
            });
          } catch (_e) {}
        }
        return;
      }

      // Locate active syllable or inter-syllable pause at elapsedMs
      let activeSyl = null;
      for (let i = 0; i < syllables.length; i++) {
        const s = syllables[i];
        if (elapsedMs >= s.startMs && elapsedMs <= s.startMs + s.durationMs) {
          activeSyl = s;
          break;
        }
      }

      let amplitude = 0.0;
      let visemeShape = 'SIL';
      let sylIndex = 0;

      if (activeSyl && !activeSyl.isSilentHold) {
        const localPhase = (elapsedMs - activeSyl.startMs) / Math.max(1, activeSyl.durationMs);
        // Smooth bell envelope peaking at 30% into the syllable
        const bell = Math.sin(Math.pow(localPhase, 0.75) * Math.PI);
        amplitude = Math.max(0.05, Math.min(1.0, bell * (emotionProfile.gainMult || 1.0)));
        visemeShape = activeSyl.viseme;
        sylIndex = activeSyl.index;
      } else {
        amplitude = 0.0;
        visemeShape = 'SIL';
      }

      const progress = Math.min(1.0, elapsedMs / Math.max(1, totalDurationMs));
      const rigOffsets = computeRigSpeechOffsets(amplitude, visemeShape, emotionProfile.id, progress);

      if (typeof onEnvelopeTick === 'function') {
        try {
          onEnvelopeTick(Number(amplitude.toFixed(3)), visemeShape, {
            amplitude: Number(amplitude.toFixed(3)),
            visemeShape,
            headTiltDeg: rigOffsets.head,
            jawOpen: Number((amplitude * (visemeShape === 'AA' || visemeShape === 'OH' ? 1.0 : 0.65)).toFixed(3)),
            gestureAmount: Number((amplitude * 0.85).toFixed(3)),
            syllableIndex: sylIndex,
            totalSyllables: syllables.length,
            progress: Number(progress.toFixed(3)),
            rigOffsets
          });
        } catch (_e) {}
      }
    };

    // Emit initial frame immediately and run at 30fps
    tick();
    if (typeof setInterval === 'function') {
      session.timerId = setInterval(tick, frameIntervalMs);
    }

    return {
      speaker: speakerProfile.id,
      baseHz: speakerProfile.baseHz,
      emotionCode: emotionProfile.id,
      syllableCount: syllables.length,
      durationMs: totalDurationMs,
      cancel: stopSpeech
    };
  }

  // ---------------------------------------------------------------------------
  // 9. INTENTIONAL EDIT TIMING & HOLDS (getRecommendedHoldMs)
  // ---------------------------------------------------------------------------
  /**
   * Compute dramaturgically weighted shot/node hold timing in milliseconds,
   * honoring SCION Operating Doctrine #7 ("Make attention, sound events, holds,
   * contrast and edit timing integral to the shot, not a polish stage").
   *
   * @param {object|string} nodeData - Beat, binding, dialogue node, or text
   * @param {string} [emotionCode] - Active E00–E17 code
   * @returns {number} Recommended hold time in milliseconds
   */
  function getRecommendedHoldMs(nodeData, emotionCode) {
    return getShotTimingBreakdown(nodeData, emotionCode).holdMs;
  }

  function getShotTimingBreakdown(nodeData, emotionCode) {
    const text = extractTextFromNode(nodeData);
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;

    const inferredEmotion = emotionCode ||
      (nodeData && nodeData.speakerState) ||
      (nodeData && nodeData.state) ||
      (nodeData && nodeData.performances && nodeData.performances[0] && nodeData.performances[0].states && nodeData.performances[0].states[0] && nodeData.performances[0].states[0].state) ||
      'E00';
    const emo = resolveEmotionProfile(inferredEmotion);

    // Base establishing shot + reading cadence (155ms per word, bounded)
    const baseShotMs = 2400;
    const readingMs = Math.min(3400, words * 155);
    let emotionHoldMs = emo.holdBonusMs || 0;
    let dramaturgyBonusMs = 0;
    const reasons = [];

    if (emotionHoldMs > 0) {
      reasons.push(`${emo.id} ${emo.name} (+${emotionHoldMs}ms)`);
    }

    // Check for silence / orchard / wayfinding / underworld / reversal markers
    const metaStr = JSON.stringify({
      id: (nodeData && (nodeData.id || nodeData.beat_id || nodeData.qualified_id)) || '',
      name: (nodeData && nodeData.name) || '',
      setting: (nodeData && nodeData.setting) || '',
      cue: (nodeData && (nodeData.acting_cue || nodeData.speakerCue || nodeData.interpretation_note)) || '',
      tableau: (nodeData && nodeData.tableau && nodeData.tableau.id) || ''
    }).toLowerCase();

    if (
      metaStr.includes('orchard_silence') ||
      metaStr.includes('silence') ||
      metaStr.includes('ajax') ||
      emo.id === 'E17'
    ) {
      dramaturgyBonusMs += 1350;
      reasons.push('Dramatic Silence Hold (+1350ms)');
    }

    if (
      metaStr.includes('orchard') ||
      metaStr.includes('beat_94') ||
      metaStr.includes('beat_100') ||
      metaStr.includes('beat_101') ||
      metaStr.includes('beat_102') ||
      metaStr.includes('beat_103')
    ) {
      dramaturgyBonusMs += 850;
      reasons.push('Orchard Tableau Hold (+850ms)');
    }

    if (metaStr.includes('wayfinding') || metaStr.includes('road_')) {
      dramaturgyBonusMs += 600;
      reasons.push('Craft/Wayfinding Tableau (+600ms)');
    }

    // Check for Director Audit Override or critical reversal
    const hasOverride = Boolean(
      (nodeData && (nodeData.overrideReason || nodeData.auditFinding || nodeData.priority === 'critical')) ||
      metaStr.includes('boundary') ||
      metaStr.includes('refusal')
    );
    if (hasOverride) {
      dramaturgyBonusMs += 900;
      reasons.push('Director Reversal / Boundary Hold (+900ms)');
    }

    const totalMs = Math.max(2600, Math.min(8200, Math.round(baseShotMs + readingMs + emotionHoldMs + dramaturgyBonusMs)));

    return {
      holdMs: totalMs,
      baseShotMs,
      readingMs,
      emotionHoldMs,
      dramaturgyBonusMs,
      wordCount: words,
      emotionCode: emo.id,
      reasons
    };
  }

  // ---------------------------------------------------------------------------
  // 10. PUBLIC API EXPORT
  // ---------------------------------------------------------------------------
  return {
    version: '1.0.0-scion-sonic-dramaturg',
    lineages: [
      '#4 Frank Mouris — Autobiographical Image Torrent',
      '#6 John Whitney — Harmonic Motion Orchestra',
      '#47 Sound-to-Action — Viseme and Gesture Swarm',
      'Doctrine #7 — Audio and Staging Integral to the Shot'
    ],

    // Lifecycle & Mute Controls
    ensureContext,
    getContext: () => audioCtx,
    isMuted,
    setMuted,
    toggleMute,
    setMasterVolume,

    // Cutout & Stage Foley Synthesizers
    playFoley,

    // Chapter I–X Ambient Soundscape
    setChapterAmbience,
    isAmbienceEnabled,
    setAmbienceEnabled,
    toggleAmbience,
    resolveChapterIndex,

    // Sound-to-Action Speech Cadence & 30fps Viseme/Rig Envelope
    speakNode,
    stopSpeech,
    computeRigSpeechOffsets,

    // Intentional Edit Timing & Holds
    getRecommendedHoldMs,
    getShotTimingBreakdown,

    // Reference Catalogs for UI inspection
    SPEAKER_REGISTERS,
    EMOTION_PROFILES,
    CHAPTER_AMBIENCES,
    VISEME_SHAPES
  };
});
