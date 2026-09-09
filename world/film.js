/* world/film.js — the world as a film space: shots in the MENTO grammar, a camera that follows their keys, the reel, the take.

   A shot is one or more keys (POS, TGT, LENS) and a length in seconds: one key holds, two or more move the camera
   along a centripetal Catmull-Rom path the way mento-373 does, with the target and the field of view blended per
   segment. The reel is the shots in order; playing it cuts from one to the next. A take draws every rendered frame
   into a canvas of the chosen aspect and size and hands it to a MediaRecorder while the world is stepped exactly
   1/fps per frame, so the film has the right length however slow the phone is. Words become shots through the
   model (FILM_SPEC) or, without a key, through a small parser of the same words; either way a semantic shot (a
   subject, a frame, a bearing, a move) is staged into keys from what stands in the world.

   The text form is the MENTO grammar in the LDraw frame (y down, z flipped: world (x, y, z) is LDraw (x, -y, -z)):
     0 !MENTO SHOT "name" POS x y z TGT x y z LENS f [SEC s]      a shot and its first key
     0 !MENTO KEY POS x y z TGT x y z LENS f                        a further key of the shot above (a move)
     0 !MENTO LIGHT "name" TYPE SUN|POINT|AREA POS … [TGT …] COLOR #hex INTENSITY n [DECAY n] [SHADOWS TRUE]
     0 !MENTO ACT "me" WALK x z | DRIVE x z | AHEAD m | RIDE word | TIE | FLY | FIRE | SABER | LEAVE   what the player does during the shot
     0 !MENTO SET WORLD tatooine AS luke TIME dusk WEATHER clear      applied when the next shot starts (a planet, a character, a sky)
     0 !MENTO TITLE "text" STYLE card|logo SEC 3                       a title card: black, the words centred
     0 !MENTO PLAN {json}                                              the shot's words (subject, frame, bearing, move): staged again when it starts, so it follows a new planet or character
     0 !MENTO TIME day|dawn|dusk|night                               the sky for the film
     0 !MENTO ASPECT 16:9 FPS 24                                     the frame
     0 !MENTO ACTOR "atat-1" KIT atat AT x z HEADING deg              something the film drives: a kit or a KIND vehicle, or CROWD rebel N 20 R m
     0 !MENTO BUILD "trench" AT x z {program}                          a DSL program laid at a point for the scene
     0 !MENTO ACT "atat-1" MARCH deg speed FIRE HEAVY EVERY s AIM "trench"   an actor's act for the shot (also TO x z, ORBIT "who" R m, PASS "who", HALT, LAND, ALT m)
     0 !MENTO EVENT TRIP "atat-1" AT sec OVER s                        what happens at a second of the shot: CABLE, TRIP, BLAST, TOPPLE, HANG, DROP, STRIKE, ROUT, CRASH, SHAKE, FLASH
   A SHOT line can end with FOLLOW: its keys are re-staged around the subject every step, so a flying TIE stays in the frame.
   Frames: wide, medium, close, low, aerial, shoulder, pov (from the subject's seat, looking ahead), under (beneath a walker, looking up at its head).
   LENS is the vertical field of view in degrees, as mento-373 reads it. */
(function () {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ASPECTS = { '16:9': 16 / 9, '2.39': 2.39, '4:3': 4 / 3, '9:16': 9 / 16 };
  const SIZES = { '720p': 720, '1080p': 1080 };
  const BEAR = { n: 0, ne: 45, e: 90, se: 135, s: 180, sw: 225, w: 270, nw: 315 };            // where the camera stands, seen from the subject: north is -z, east is +x
  const FRAMES = { wide: 3, medium: 1.5, close: 0.8, aerial: 2.2, low: 1.6, shoulder: 0 };      // the camera's distance as a multiple of the subject's size
  const LENS = { wide: 60, medium: 45, close: 35, aerial: 50, low: 55, shoulder: 50 };
  const MOVES = ['hold', 'push', 'pull', 'orbit', 'crane', 'track'];
  const num = s => { const v = parseFloat(s); return Number.isFinite(v) ? v : 0; };
  const fmt = v => String(+v.toFixed(2));
  const wrap = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };

  const FILM_SPEC = `You are a film director working inside a LEGO world. You answer ONLY with a JSON object {"name": string, "shots": [...]}: a shot list that a camera compiler stages into real camera keys.
Each shot is {"name": string, "on": subject, "frame": "wide|medium|close|aerial|low|shoulder", "from": "n|ne|e|se|s|sw|w|nw", "lens": 20-90, "sec": 1-30, "move": "hold|push|pull|orbit|crane|track", "act": null | {"who": "me", "walk": [x, z]} | {"who": "me", "drive": [x, z]}}.
The subject "on" is "me" (the player's figure), a landmark id from the scene list, a building name from the scene list, a kit or vehicle word (atat, atst, xwing, shuttle, speeder, car, truck, bus) or [x, z] in metres (x east, z south, north is negative z).
"frame" is how big the subject is in the frame; "from" is where the camera stands seen from the subject; "lens" is the vertical field of view in degrees (wide 60, normal 45, long 30); "move" adds a second key: push halves the distance, pull doubles it, orbit turns a quarter around the subject, crane rises to an aerial view, track slides sideways.
An act makes the player's figure walk (or the ride drive) to a point during the shot. Keep the film to 2-8 shots, name each like a storyboard, vary frames and bearings, and answer with the JSON only.`;

  /** The trailer of the first film, as words the world stages where it stands: the droids in the desert, the twin suns, a landspeeder, the smuggler and the Wookiee, the princess, the troopers, the Dark Lord, a TIE, the run on the station. */
  const TRAILERS = {
    'a-new-hope': { name: 'A New Hope', shots: [
      { title: 'A long time ago in a galaxy far,\nfar away....', style: 'card', sec: 4, world: 'tatooine', as: 'c3po', time: 'day' },
      { title: 'STAR WARS', style: 'logo', sec: 3 },
      { name: 'The droid in the desert', on: 'me', frame: 'wide', from: 'e', move: 'push', sec: 5, act: { ahead: 24 } },
      { name: 'A farm boy', as: 'luke', time: 'dusk', on: 'me', frame: 'shoulder', from: 's', move: 'hold', sec: 4, act: { ahead: 6 } },
      { name: 'The twin suns', on: 'me', frame: 'low', from: 'w', move: 'crane', sec: 4 },
      { name: 'The landspeeder', time: 'day', on: 'me', frame: 'medium', from: 'e', move: 'track', sec: 5, follow: true, act: { ride: 'speeder', ahead: 80, fly: true } },
      { name: 'The smuggler', as: 'han', on: 'me', frame: 'close', from: 'sw', move: 'push', sec: 3, act: { leave: true, ahead: 3 } },
      { name: 'The Wookiee', as: 'chewbacca', on: 'me', frame: 'medium', from: 's', move: 'orbit', sec: 3 },
      { name: 'The princess', as: 'leia', on: 'me', frame: 'close', from: 'n', move: 'pull', sec: 3 },
      { name: 'Stormtroopers', as: 'stormtrooper', on: 'me', frame: 'wide', from: 'n', move: 'push', sec: 4, act: { ahead: 10, fire: true } },
      { title: 'The Empire', style: 'card', sec: 2, world: 'deathstar', as: 'vader', time: 'night' },
      { name: 'The Dark Lord', on: 'me', frame: 'medium', from: 's', move: 'push', sec: 4, act: { saber: true, ahead: 4 } },
      { name: 'The TIE', on: 'tie', frame: 'wide', from: 'sw', move: 'hold', sec: 6, follow: true, act: { tie: true, fly: true, fire: true } },
      { name: 'The run', as: 'luke', on: 'me', frame: 'wide', from: 's', move: 'hold', sec: 6, follow: true, act: { leave: true, ride: 'xwing', ahead: 120, fly: true, fire: true } },
      { title: 'STAR WARS', style: 'logo', sec: 2 },
      { title: 'A New Hope\nmade with word to momento', style: 'card', sec: 3 },
    ] },
  };

  /** The walker assault on Hoth from the storymap: eleven patches, four walkers marching on the trench, two snowspeeders, a cable, a trip, a hatch charge, a topple, the trench overrun. Metres from the player's spawn; z south. */
  const SCENES = {
    'hoth-atat': { name: 'Hoth: the walker assault', world: 'hoth', as: 'pilot', ground: 'flat', weather: 'snow', time: 'day',
      actors: [
        { name: 'atat-1', kit: 'atat', x: -45, z: -290, heading: 180 }, { name: 'atat-2', kit: 'atat', x: 10, z: -335, heading: 180 }, { name: 'atat-3', kit: 'atat', x: 70, z: -290, heading: 180 }, { name: 'atat-4', kit: 'atat', x: 130, z: -350, heading: 180 },
        { name: 'speeder-1', kind: 'speeder', len: 7, col: 71, x: -45, z: -170, heading: 0, alt: 6 }, { name: 'speeder-2', kind: 'speeder', len: 7, col: 71, x: 90, z: -240, heading: 270, alt: 8 },
        { name: 'rebels', crowd: true, kind: 'rebel', n: 20, x: 0, z: -62, r: 25 },
      ],
      builds: [{ name: 'trench', x: -12, z: -75, program: { name: 'trench', ops: [{ op: 'wall', from: [0, 0], to: [60, 0], y: 0, h: 3, col: 15, thick: 2 }, { op: 'wall', from: [0, 5], to: [60, 5], y: 0, h: 2, col: 15 }, { op: 'tower', x: 30, z: -7, r: 2, h: 5, col: 71, round: true, crenels: false }, { op: 'slab', x: 27, z: -10, w: 6, d: 6, y: 5, plates: 1, col: 72 }, { op: 'box', x: 8, z: -4, w: 1, d: 1, y: 0, h: 8, col: 72 }, { op: 'box', x: 52, z: -4, w: 1, d: 1, y: 0, h: 8, col: 72 }] } }],
      shots: [
        { name: 'P001 Target sensor to horizon phalanx', title: 'Target sensor to horizon phalanx', style: 'hud', on: 'atat-2', frame: 'wide', from: 's', lens: 40, sec: 4, acts: [{ who: 'atat-1', march: 180, speed: 0.6 }, { who: 'atat-2', march: 180, speed: 0.6 }, { who: 'atat-3', march: 180, speed: 0.6 }, { who: 'atat-4', march: 180, speed: 0.6 }] },
        { name: 'P001 The phalanx on the ridge', on: 'atat-2', frame: 'wide', from: 'sw', lens: 40, sec: 6 },
        { name: 'P002 Speeder windshield', on: 'me', frame: 'pov', sec: 4, act: { ride: 'speeder-1', ahead: 140, fly: true }, acts: [{ who: 'atat-1', march: 180, speed: 0.6, fire: true, heavy: true, every: 1.2, aim: 'trench' }] },
        { name: 'P002 Heavy volley', on: 'atat-1', frame: 'low', from: 'n', sec: 5 },
        { name: 'P003 Head traverse', on: 'atat-1', frame: 'under', sec: 4 },
        { name: 'P003 Aerial survey', on: 'atat-1', frame: 'aerial', from: 'n', sec: 5, acts: [{ who: 'speeder-2', pass: 'atat-1', alt: 12, speed: 1 }] },
        { name: 'P004 Speed harpoon', on: 'speeder-2', frame: 'wide', from: 'e', sec: 4, follow: true, acts: [{ who: 'speeder-2', orbit: 'atat-1', r: 22, alt: 6, speed: 0.9 }] },
        { name: 'P004 Leg binding', on: 'atat-1:leg-rl', frame: 'close', from: 'e', sec: 5, events: [{ what: 'CABLE', who: 'speeder-2', who2: 'atat-1', at: 0, turns: 3, over: 4 }] },
        { name: 'P005 Joint entanglement to catastrophic crash', on: 'atat-1', frame: 'wide', from: 'e', sec: 12, follow: true, events: [{ what: 'TRIP', who: 'atat-1', at: 2, over: 1.6 }, { what: 'CRASH', who: 'speeder-1', at: 0 }], acts: [{ who: 'speeder-2', pass: 'atat-1', alt: 10, speed: 1 }] },
        { name: 'P006 Advancing battery', on: 'atat-2', frame: 'wide', from: 'sw', sec: 4 },
        { name: 'P006 Chin cannon barrage', on: 'atat-2', frame: 'low', from: 'front', sec: 5, acts: [{ who: 'atat-2', march: 180, speed: 0.6, fire: true, heavy: true, every: 0.8, aim: 'trench' }] },
        { name: 'P007 Wreckage stomp', on: 'speeder-1', frame: 'low', from: 'w', sec: 4 },
        { name: 'P007 Pilot cable egress', on: 'atat-2', frame: 'under', sec: 5, events: [{ what: 'HANG', who: 'me', who2: 'atat-2', at: 0, over: 0.3 }, { what: 'DROP', who: 'me', at: 1.5 }] },
        { name: 'P008 Phalanx advance to infantry rout', on: 'atat-3', frame: 'wide', from: 's', lens: 24, sec: 5, events: [{ what: 'ROUT', who: 'rebels', who2: 'atat-3', at: 0 }] },
        { name: 'P008 Luke sprints', on: 'me', frame: 'low', from: 'e', sec: 4, follow: true, act: { ahead: 15 } },
        { name: 'P009 Ventral ascension', on: 'me', frame: 'wide', from: 'e', sec: 4, follow: true, events: [{ what: 'HANG', who: 'me', who2: 'atat-3', at: 0, over: 3 }] },
        { name: 'P009 Thermal detonation', on: 'atat-3', frame: 'under', sec: 5, events: [{ what: 'DROP', who: 'me', at: 2.5 }, { what: 'BLAST', who: 'atat-3', part: 'belly', at: 3, scale: 1.5 }] },
        { name: 'P010 Neck combustion to flank topple', on: 'atat-3', frame: 'wide', from: 'e', sec: 9, follow: true, events: [{ what: 'BLAST', who: 'atat-3', part: 'neck', at: 2 }, { what: 'TOPPLE', who: 'atat-3', at: 3, over: 2 }] },
        { name: 'P011 Trench bombardment', on: 'trench', frame: 'medium', from: 's', lens: 40, sec: 4, weather: 'blizzard', events: [{ what: 'STRIKE', who: 'trench', at: 0, every: 0.7 }] },
        { name: 'P011 Base overrun', on: 'atat-4', frame: 'low', from: 'front', move: 'push', sec: 4, acts: [{ who: 'atat-4', march: 180, speed: 0.6, fire: true, heavy: true, every: 1, aim: 'trench' }] },
      ] },
  };

  function create({ W, M }) {
    const F = {
      shots: [], sel: -1, mode: 'view', play: { on: false, i: 0, t: 0, all: false }, rec: null, aspect: '16:9', fps: 24, size: '720p', sec: 4,
      lights: [], extra: [], time: null, sun: null, blob: null, url: null, take: null, steps: 0, running: false, onChange: null, local: false, busy: false, status: '',
      free: { pos: new THREE.Vector3(), yaw: 0, pitch: 0, fov: 50 }, viewT: 0, log: [],
      actors: new Map(), builds: new Map(), scene: null, cable: null, hang: null, prone: false, rout: null, strikes: null, pending: [], meshes: [], fired: 0,
    };
    const DEG = Math.PI / 180, headingOf = deg => Math.PI - deg * DEG, degOf = h => ((180 - h / DEG) % 360 + 360) % 360, UP = new THREE.Vector3(0, 1, 0);
    const V1 = new THREE.Vector3(), V2 = new THREE.Vector3();
    const gameFov = () => innerHeight > innerWidth ? 55 : 50;
    const groundH = (x, z) => W.G ? W.G.h(x, z) + (window.Ground ? Ground.layerAt(W.G, x, z) : 0) : 0;
    const changed = what => { for (const s of F.shots) if (s.keys.length > 1 && (!s.curve || s.curveN !== s.keys.length)) s.curve = null; F.save(); if (F.onChange) { try { F.onChange(what); } catch (e) { } } };
    const say = (text, cls) => { F.status = text; F.statusCls = cls || ''; if (F.onStatus) { try { F.onStatus(text, cls); } catch (e) { } } };

    /* ── the grammar ── */
    const keyOf = m => ({ pos: new THREE.Vector3(+m[1], -m[2], -m[3]), tgt: new THREE.Vector3(+m[4], -m[5], -m[6]), fov: clamp(+m[7] || 50, 5, 150) });
    const KEY_RE = /POS\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+TGT\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+LENS\s+([\d.]+)/;
    F.parse = (text, keepOld) => {
      const shots = keepOld ? F.shots.slice() : [], lights = keepOld ? F.lights.slice() : [], actors = [], builds = []; let cur = null, n = 0, pendingSet = null;
      for (const raw of String(text || '').split(/\r?\n/)) {
        const line = raw.trim(); if (!/!MENTO/.test(line)) continue;
        const name = (line.match(/"([^"]*)"/) || [])[1];
        if (/!MENTO\s+SHOT/.test(line)) { const m = line.match(KEY_RE); if (!m) continue; const sec = line.match(/\bSEC\s+([\d.]+)/); cur = { name: name || `Shot ${shots.length + 1}`, keys: [keyOf(m)], sec: sec ? clamp(num(sec[1]), 0.5, 120) : F.sec, act: null, set: pendingSet, follow: /\bFOLLOW\b/.test(line) }; pendingSet = null; shots.push(cur); n++; }
        else if (/!MENTO\s+TITLE/.test(line)) { const sec = line.match(/\bSEC\s+([\d.]+)/), st = line.match(/\bSTYLE\s+(\w+)/), words = (name || '').replace(/\\n/g, '\n'); cur = { name: words.split('\n')[0] || 'Title', title: words, style: st ? st[1].toLowerCase() : 'card', keys: [], sec: sec ? clamp(num(sec[1]), 0.5, 120) : 3, act: null, set: pendingSet }; pendingSet = null; shots.push(cur); n++; }
        else if (/!MENTO\s+SET\b/.test(line)) { const w = line.match(/\bWORLD\s+(\w+)/), a = line.match(/\bAS\s+(\w+)/), t = line.match(/\bTIME\s+(\w+)/), we = line.match(/\bWEATHER\s+(\w+)/); pendingSet = { world: w ? w[1].toLowerCase() : null, as: a ? a[1].toLowerCase() : null, time: t ? t[1].toLowerCase() : null, weather: we ? we[1].toLowerCase() : null }; }
        else if (/!MENTO\s+PLAN\b/.test(line)) { const m = line.match(/PLAN\s+(\{[\s\S]*\})\s*$/); if (m && cur) { try { cur.plan = JSON.parse(m[1]); } catch (e) { } } }
        else if (/!MENTO\s+KEY/.test(line)) { const m = line.match(KEY_RE); if (m && cur) cur.keys.push(keyOf(m)); }
        else if (/!MENTO\s+LIGHT/.test(line)) { const L = parseLight(line); if (L) lights.push(L); }
        else if (/!MENTO\s+ACTOR\b/.test(line)) { const a = parseActor(line); if (a) actors.push(a); }
        else if (/!MENTO\s+BUILD\b/.test(line)) { const b = parseBuild(line); if (b) builds.push(b); }
        else if (/!MENTO\s+EVENT\b/.test(line)) { const ev = parseEvent(line); if (ev && cur) (cur.events = cur.events || []).push(ev); }
        else if (/!MENTO\s+ACT\b/.test(line)) { if (!cur) continue; const a = parseAct(line.replace(/^.*!MENTO\s+ACT\s*("[^"]*")?/, ''), name || 'me'); if (!a) continue; if (a.who === 'me') cur.act = a; else (cur.acts = cur.acts || []).push(a); }
        else if (/!MENTO\s+TIME/.test(line)) { const m = line.match(/TIME\s+(day|dawn|dusk|night|auto)/i); if (m) F.time = m[1].toLowerCase(); }
        else if (/!MENTO\s+ASPECT/.test(line)) { const a = line.match(/ASPECT\s+([\d.:]+)/), f = line.match(/FPS\s+(\d+)/); if (a && ASPECTS[a[1]]) F.aspect = a[1]; if (f) F.fps = clamp(+f[1], 6, 60); }
      }
      F.shots = shots; F.lights = lights; if (F.sel >= shots.length) F.sel = shots.length - 1; if (F.sel < 0 && shots.length) F.sel = 0;
      if (actors.length || builds.length) { if (!keepOld) F.teardown(); F.scene = { name: F.name || 'scene', actors, builds, abs: true }; F.setup(); } else if (!keepOld && F.scene) F.teardown();
      applyLights(); if (F.time && W.setSky) W.setSky(F.time); changed('parse'); return { shots: n, lights: lights.length, actors: actors.length, builds: builds.length };
    };
    const quoted = t => [...String(t).matchAll(/"([^"]*)"/g)].map(m => m[1]);
    function parseActor(line) {
      const q = quoted(line); if (!q.length) return null; const t = line.replace(/"[^"]*"/g, '""');
      const at = t.match(/\bAT\s+(-?[\d.]+)\s+(-?[\d.]+)/), hd = t.match(/\bHEADING\s+(-?[\d.]+)/), kit = t.match(/\bKIT\s+(\w+)/), kind = t.match(/\bKIND\s+(\w+)/), crowd = t.match(/\bCROWD\s+(\w+)/), n = t.match(/\bN\s+(\d+)/), r = t.match(/\bR\s+([\d.]+)/), len = t.match(/\bLEN\s+(\d+)/), col = t.match(/\bCOL\s+(\d+)/);
      const a = { name: q[0], x: at ? +at[1] : 0, z: at ? -at[2] : 0, heading: hd ? +hd[1] : 0 };
      if (crowd) { a.crowd = true; a.kind = crowd[1].toLowerCase(); a.n = n ? +n[1] : 12; a.r = r ? +r[1] * M : 20 * M; } else if (kit) a.kit = kit[1].toLowerCase(); else if (kind) { a.kind = kind[1].toLowerCase(); if (len) a.len = +len[1]; if (col) a.col = +col[1]; } else return null;
      return a;
    }
    function parseBuild(line) { const q = quoted(line); const at = line.match(/\bAT\s+(-?[\d.]+)\s+(-?[\d.]+)/), m = line.match(/(\{[\s\S]*\})\s*$/); if (!q.length || !m) return null; let prog = null; try { prog = JSON.parse(m[1]); } catch (e) { return null; } return { name: q[0], x: at ? +at[1] : 0, z: at ? -at[2] : 0, program: prog }; }
    function parseEvent(line) {
      const t = line.replace(/^.*!MENTO\s+EVENT\s*/, ''), what = (t.match(/^(\w+)/) || [])[1]; if (!what) return null; const q = quoted(t), tt = t.replace(/"[^"]*"/g, '""');
      const num = (re, d) => { const m = tt.match(re); return m ? +m[1] : d; };
      const ev = { what: what.toUpperCase(), who: q[0] || null, who2: q[1] || null, at: num(/\bAT\s+([\d.]+)/, 0), over: num(/\bOVER\s+([\d.]+)/, undefined), turns: num(/\bTURNS\s+([\d.]+)/, undefined), scale: num(/\bSCALE\s+([\d.]+)/, undefined), every: num(/\bEVERY\s+([\d.]+)/, undefined), r: num(/\bR\s+([\d.]+)/, undefined), k: num(/\bK\s+([\d.]+)/, undefined) };
      const part = tt.match(/\b(belly|neck|head)\b/i); if (part) ev.part = part[1].toLowerCase();
      const xz = tt.replace(/^\w+\s*/, '').replace(/\b(AT|OVER|TURNS|SCALE|EVERY|R|K)\s+[\d.]+/g, '').match(/(-?[\d.]+)\s+(-?[\d.]+)/); if (xz && ev.what === 'STRIKE') { ev.x = +xz[1]; ev.z = -xz[2]; }
      return ev;
    }
    const eventText = ev => { const t = [`${ev.what}`]; if (ev.who) t.push(`"${ev.who}"`); if (ev.who2) t.push(`"${ev.who2}"`); if (ev.what === 'STRIKE' && ev.x != null) t.push(`${fmt(ev.x)} ${fmt(-ev.z)}`); if (ev.part) t.push(ev.part); t.push(`AT ${fmt(ev.at || 0)}`); if (ev.turns != null) t.push(`TURNS ${fmt(ev.turns)}`); if (ev.over != null) t.push(`OVER ${fmt(ev.over)}`); if (ev.scale != null) t.push(`SCALE ${fmt(ev.scale)}`); if (ev.every != null) t.push(`EVERY ${fmt(ev.every)}`); if (ev.r != null) t.push(`R ${fmt(ev.r)}`); if (ev.k != null) t.push(`K ${fmt(ev.k)}`); return t.join(' '); };
    const actorText = a => a.crowd ? `0 !MENTO ACTOR "${a.name}" CROWD ${a.kind} N ${a.n} AT ${fmt(a.x)} ${fmt(-a.z)} R ${fmt(a.r / M)}` : `0 !MENTO ACTOR "${a.name}" ${a.kit ? 'KIT ' + a.kit : 'KIND ' + a.kind + (a.len ? ' LEN ' + a.len : '') + (a.col != null ? ' COL ' + a.col : '')} AT ${fmt(a.x)} ${fmt(-a.z)} HEADING ${fmt(a.heading || 0)}`;
    /** The act tokens: WALK x z, DRIVE x z, AHEAD m, RIDE word, TIE, FLY, FIRE, SABER, LEAVE, LOOK x z; for an actor also MARCH deg speed, TO x z, ORBIT "who" R m, PASS "who", HEAVY, EVERY s, AIM "who"|x z, HALT, LAND, ALT m. */
    function parseAct(text, who) {
      const a = { who: who || 'me' }, t = String(text || '').trim(); if (!t) return null;
      const march = t.match(/\bMARCH\s+(-?[\d.]+)(?:\s+([\d.]+))?/); if (march) { a.march = +march[1]; if (march[2]) a.speed = +march[2]; }
      const to = t.match(/\bTO\s+(-?[\d.]+)\s+(-?[\d.]+)/); if (to) a.to = { x: +to[1], z: -to[2] };
      const orbit = t.match(/\bORBIT\s+"([^"]*)"(?:\s+R\s+([\d.]+))?/); if (orbit) { a.orbit = orbit[1]; if (orbit[2]) a.r = +orbit[2]; }
      const pass = t.match(/\bPASS\s+"([^"]*)"/); if (pass) a.pass = pass[1];
      const aimQ = t.match(/\bAIM\s+"([^"]*)"/), aimXZ = t.match(/\bAIM\s+(-?[\d.]+)\s+(-?[\d.]+)/); if (aimQ) a.aim = aimQ[1]; else if (aimXZ) a.aim = { x: +aimXZ[1], z: -aimXZ[2] };
      const every = t.match(/\bEVERY\s+([\d.]+)/); if (every) a.every = +every[1]; const alt = t.match(/\bALT\s+([\d.]+)/); if (alt) a.alt = +alt[1]; const sp = t.match(/\bSPEED\s+([\d.]+)/); if (sp) a.speed = +sp[1];
      if (/\bHEAVY\b/.test(t)) a.heavy = true; if (/\bHALT\b/.test(t)) a.halt = true; if (/\bLAND\b/.test(t)) a.land = true;
      const xy = (re) => { const m = t.match(re); return m ? { x: +m[1], z: -m[2] } : null; };
      const walk = xy(/\bWALK\s+(-?[\d.]+)\s+(-?[\d.]+)/), drive = xy(/\bDRIVE\s+(-?[\d.]+)\s+(-?[\d.]+)/), look = xy(/\bLOOK\s+(-?[\d.]+)\s+(-?[\d.]+)/);
      if (walk) { a.kind = 'walk'; a.x = walk.x; a.z = walk.z; } else if (drive) { a.kind = 'drive'; a.x = drive.x; a.z = drive.z; }
      const ahead = t.match(/\bAHEAD\s+(-?[\d.]+)/); if (ahead) a.ahead = +ahead[1];
      const ride = t.match(/\bRIDE\s+([\w-]+)/); if (ride) a.ride = ride[1].toLowerCase();
      if (/\bTIE\b/.test(t)) a.tie = true; if (/\bFLY\b/.test(t)) a.fly = true; if (/\bFIRE\b/.test(t)) a.fire = true; if (/\bSABER\b/.test(t)) a.saber = true; if (/\bLEAVE\b/.test(t)) a.leave = true; if (look) a.look = look;
      return Object.keys(a).length > 1 ? a : null;
    }
    const actText = a => { const t = []; if (a.leave) t.push('LEAVE'); if (a.ride) t.push('RIDE ' + a.ride); if (a.tie) t.push('TIE'); if (a.kind === 'walk') t.push(`WALK ${fmt(a.x)} ${fmt(-a.z)}`); if (a.kind === 'drive' && a.x != null) t.push(`DRIVE ${fmt(a.x)} ${fmt(-a.z)}`); if (a.ahead) t.push('AHEAD ' + fmt(a.ahead)); if (a.look) t.push(`LOOK ${fmt(a.look.x)} ${fmt(-a.look.z)}`);
      if (a.march != null) t.push(`MARCH ${fmt(a.march)}${a.speed != null ? ' ' + fmt(a.speed) : ''}`); if (a.to) t.push(`TO ${fmt(a.to.x)} ${fmt(-a.to.z)}`); if (a.orbit) t.push(`ORBIT "${a.orbit}"${a.r ? ' R ' + fmt(a.r) : ''}`); if (a.pass) t.push(`PASS "${a.pass}"`); if (a.alt) t.push('ALT ' + fmt(a.alt)); if (a.halt) t.push('HALT'); if (a.land) t.push('LAND');
      if (a.fly) t.push('FLY'); if (a.fire) t.push('FIRE'); if (a.heavy) t.push('HEAVY'); if (a.every) t.push('EVERY ' + fmt(a.every)); if (a.aim) t.push(typeof a.aim === 'string' ? `AIM "${a.aim}"` : `AIM ${fmt(a.aim.x)} ${fmt(-a.aim.z)}`); if (a.saber) t.push('SABER'); return t.join(' '); };
    function parseLight(line) {
      const name = (line.match(/"([^"]*)"/) || [])[1] || 'light', type = (line.match(/TYPE\s+(\w+)/) || [])[1] || 'POINT', p = line.match(/POS\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)/); if (!p) return null;
      const t = line.match(/TGT\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)/), c = line.match(/COLOR\s+(#[0-9a-fA-F]{6})/), i = line.match(/INTENSITY\s+([\d.]+)/), d = line.match(/DECAY\s+([\d.]+)/);
      return { name, type: type.toUpperCase(), pos: new THREE.Vector3(+p[1], -p[2], -p[3]), tgt: t ? new THREE.Vector3(+t[1], -t[2], -t[3]) : null, color: c ? c[1] : '#ffffff', intensity: i ? num(i[1]) : 1, decay: d ? num(d[1]) : 0, shadows: /SHADOWS\s+TRUE/i.test(line), line };
    }
    const ld = v => `${fmt(v.x)} ${fmt(-v.y)} ${fmt(-v.z)}`;
    const keyLine = k => `POS ${ld(k.pos)} TGT ${ld(k.tgt)} LENS ${fmt(k.fov)}`;
    F.text = () => {
      const out = [`0 // MENTO film · ${W.place && W.place.name ? W.place.name : 'the world'} · word to momento`, `0 !MENTO ASPECT ${F.aspect} FPS ${F.fps}`];
      if (F.time) out.push(`0 !MENTO TIME ${F.time}`);
      for (const L of F.lights) out.push(L.line);
      for (const a of F.actors.values()) out.push(actorText(a));
      for (const b of F.builds.values()) out.push(`0 !MENTO BUILD "${b.name}" AT ${fmt(b.ax)} ${fmt(-b.az)} ${JSON.stringify(b.program)}`);
      F.shots.forEach((s, i) => {
        out.push(`0 // SHOT ${i + 1}: ${s.name.toUpperCase()}`);
        if (s.set && (s.set.world || s.set.as || s.set.time || s.set.weather)) out.push(`0 !MENTO SET${s.set.world ? ' WORLD ' + s.set.world : ''}${s.set.as ? ' AS ' + s.set.as : ''}${s.set.time ? ' TIME ' + s.set.time : ''}${s.set.weather ? ' WEATHER ' + s.set.weather : ''}`);
        if (s.title != null) { out.push(`0 !MENTO TITLE "${s.title.replace(/"/g, "'").replace(/\n/g, '\\n')}" STYLE ${s.style || 'card'} SEC ${fmt(s.sec)}`); return; }
        const k0 = s.keys[0] || { pos: new THREE.Vector3(), tgt: new THREE.Vector3(0, 0, -1), fov: 50 };
        out.push(`0 !MENTO SHOT "${s.name.replace(/"/g, "'")}" ${keyLine(k0)} SEC ${fmt(s.sec)}${s.follow ? ' FOLLOW' : ''}`);
        if (s.plan) out.push(`0 !MENTO PLAN ${JSON.stringify(s.plan)}`);
        for (const k of s.keys.slice(1)) out.push(`0 !MENTO KEY ${keyLine(k)}`);
        if (s.act) { const t = actText(s.act); if (t) out.push(`0 !MENTO ACT "${s.act.who || 'me'}" ${t}`); }
        for (const a of s.acts || []) { const t = actText(a); if (t) out.push(`0 !MENTO ACT "${a.who}" ${t}`); }
        for (const ev of s.events || []) out.push(`0 !MENTO EVENT ${eventText(ev)}`);
      });
      return out.join('\n') + '\n';
    };

    /* ── the lights ── */
    function applyLights() {
      for (const l of F.extra) W.scene.remove(l); F.extra = []; F.sun = null;
      for (const L of F.lights) {
        if (L.type === 'SUN') { F.sun = { color: new THREE.Color(L.color), intensity: L.intensity }; continue; }
        let light;
        if (L.type === 'AREA' || L.type === 'SPOT') { light = new THREE.SpotLight(L.color, L.intensity, L.decay || 0, 0.7, 0.4, 1); light.position.copy(L.pos); light.target.position.copy(L.tgt || new THREE.Vector3(L.pos.x, L.pos.y - 100, L.pos.z)); W.scene.add(light.target); F.extra.push(light.target); }
        else { light = new THREE.PointLight(L.color, L.intensity, L.decay || 0, 1); light.position.copy(L.pos); }
        W.scene.add(light); F.extra.push(light);
      }
    }
    const applySun = () => { const s = F.sun, d = window.Ground && Ground.daylight.lights; if (!s || !d) return; d.sun.color.copy(s.color); d.sun.intensity = s.intensity / Math.PI; };

    /* ── the camera ── */
    F.owns = () => F.play.on || !!F.rec || F.mode !== 'view';
    F.holds = () => F.mode === 'free' && !F.play.on;
    function poseAt(cam, s, t) {
      if (s.title != null && s.style !== 'hud') return;                               // a title card: the camera stays where it is, the card covers the frame
      if (s.title != null && !s.keys.length) return;                                  // a hud title over the live camera
      if (s.follow && s.plan) { const st = F.stage(s.plan); s.keys = st.keys; s.curve = null; s.readout = st.readout; }   // the subject moves: the keys move with it
      const n = s.keys.length; let pos, tgt, fov;
      if (n === 1) { pos = s.keys[0].pos; tgt = s.keys[0].tgt; fov = s.keys[0].fov; }
      else {
        const u = clamp(t / s.sec, 0, 1); if (!s.curve || s.curveN !== n) { s.curve = new THREE.CatmullRomCurve3(s.keys.map(k => k.pos), false, 'centripetal'); s.curveN = n; }
        pos = s.curve.getPointAt(u); const seg = n - 1, raw = u * seg, i = Math.min(Math.floor(raw), seg - 1), a = raw - i;
        tgt = V1.lerpVectors(s.keys[i].tgt, s.keys[i + 1].tgt, a); fov = s.keys[i].fov + (s.keys[i + 1].fov - s.keys[i].fov) * a;
      }
      cam.position.copy(pos); cam.up.set(0, 1, 0); cam.lookAt(tgt); if (Math.abs(cam.fov - fov) > 1e-3) { cam.fov = fov; cam.updateProjectionMatrix(); }
    }
    function poseFree(cam) {
      const f = F.free; cam.position.copy(f.pos); V1.set(-Math.sin(f.yaw) * Math.cos(f.pitch), Math.sin(f.pitch), -Math.cos(f.yaw) * Math.cos(f.pitch)).add(f.pos);
      cam.up.set(0, 1, 0); cam.lookAt(V1); if (Math.abs(cam.fov - f.fov) > 1e-3) { cam.fov = f.fov; cam.updateProjectionMatrix(); }
    }
    F.camera = (cam, dt) => {
      if (F.play.on) { const s = F.shots[F.play.i]; if (s) { poseAt(cam, s, F.play.t); return; } }
      if (F.mode === 'shot') { const s = F.shots[F.sel]; if (s) { poseAt(cam, s, F.viewT); return; } }
      poseFree(cam);
    };
    F.setMode = m => {
      if (!['view', 'shot', 'free'].includes(m)) return F.mode; if (m === 'shot' && !F.shots.length) m = 'free';
      if (m === 'free' && F.mode !== 'free') { const c = W.camera; F.free.pos.copy(c.position); c.getWorldDirection(V1); F.free.yaw = Math.atan2(-V1.x, -V1.z); F.free.pitch = Math.asin(clamp(V1.y, -1, 1)); F.free.fov = c.fov; }
      F.mode = m; F.viewT = 0;
      if (m === 'view') { W.camera.fov = gameFov(); W.camera.updateProjectionMatrix(); if (W.rig) W.rig.cam.set = false; }
      if (F.onChange) F.onChange('mode'); return m;
    };
    F.look = (dx, dy) => { F.free.yaw -= dx; F.free.pitch = clamp(F.free.pitch - dy, -1.45, 1.45); };
    F.zoom = k => { F.free.fov = clamp(F.free.fov * k, 12, 110); };
    F.setLens = fov => { fov = clamp(+fov || 50, 12, 110); if (F.mode === 'free' || !F.shots[F.sel]) F.free.fov = fov; else { for (const k of F.shots[F.sel].keys) k.fov = fov; changed('lens'); } };
    F.setSec = sec => { sec = clamp(+sec || 4, 0.5, 120); F.sec = sec; const s = F.shots[F.sel]; if (s) { s.sec = sec; changed('sec'); } };
    F.setAspect = a => { if (ASPECTS[a]) { F.aspect = a; changed('aspect'); } return F.aspect; };
    F.setFps = f => { F.fps = clamp(+f || 24, 6, 60); changed('fps'); };
    F.setSize = s => { if (SIZES[s]) { F.size = s; changed('size'); } };
    F.setTime = t => { F.time = t; if (W.setSky) W.setSky(t); changed('time'); };

    /* ── the reel ── */
    F.select = i => { F.sel = clamp(i | 0, -1, F.shots.length - 1); F.viewT = 0; if (F.onChange) F.onChange('select'); return F.sel; };
    F.view = i => { F.select(i); F.stop(); if (F.shots[F.sel]) F.setMode('shot'); return F.sel; };
    F.here = asKey => {
      const c = W.camera, k = { pos: c.position.clone(), tgt: c.getWorldDirection(V1).multiplyScalar(20 * M).add(c.position).clone(), fov: c.fov };
      const s = asKey && F.shots[F.sel];
      if (s) { s.keys.push(k); s.curve = null; changed('key'); return { shot: F.sel, keys: s.keys.length }; }
      F.shots.push({ name: `Shot ${F.shots.length + 1}`, keys: [k], sec: F.sec, act: null }); F.sel = F.shots.length - 1; changed('shot'); return { shot: F.sel, keys: 1 };
    };
    F.remove = i => { if (i == null) i = F.sel; if (!F.shots[i]) return; F.shots.splice(i, 1); F.sel = Math.min(F.sel, F.shots.length - 1); if (!F.shots.length && F.mode === 'shot') F.setMode('view'); changed('remove'); };
    F.moveShot = (i, dir) => { const j = i + dir; if (!F.shots[i] || !F.shots[j]) return; const t = F.shots[i]; F.shots[i] = F.shots[j]; F.shots[j] = t; if (F.sel === i) F.sel = j; changed('order'); };
    F.rename = (i, name) => { const s = F.shots[i]; if (!s) return; s.name = String(name || '').trim() || s.name; changed('name'); };
    const truce = on => { if (on) { if (F.truceWas == null) F.truceWas = !!W.truce; W.truce = true; } else if (F.truceWas != null) { W.truce = F.truceWas; F.truceWas = null; } };   // nobody shoots the actors while the film plays
    F.playShot = i => { if (!F.shots[i]) return false; F.play = { on: true, i, t: 0, all: false }; F.sel = i; truce(true); enter(i); if (F.onChange) F.onChange('play'); return true; };
    F.playAll = () => { if (!F.shots.length) return false; F.play = { on: true, i: 0, t: 0, all: true }; F.sel = 0; truce(true); enter(0); if (F.onChange) F.onChange('play'); return true; };
    F.stop = () => { const was = F.play.on; truce(false); F.play = { on: false, i: F.play.i, t: 0, all: false }; F.running = false; F.hold = null; F.actState = null; showTitle(null); if (was && F.onChange) F.onChange('stop'); if (F.mode === 'view' && W.rig) { W.camera.fov = gameFov(); W.camera.updateProjectionMatrix(); W.rig.cam.set = false; } return was; };
    F.total = () => F.shots.reduce((s, x) => s + x.sec, 0);
    /** A shot starts: its SET lines change the planet, the character or the sky; the clock holds until the world has laid what it lays; a planned shot is staged again; its act begins. */
    function enter(i) {
      const s = F.shots[i]; F.running = false; F.actState = null; F.hold = null; if (!s) return;
      let changed = false; const set = setFor(i);
      if (set) {
        if (set.as && W.setCharacter && W.character !== set.as) { F.ground(); W.setCharacter(set.as); changed = true; }
        if (set.world && W.setWorld && W.world !== set.world) { F.ground(); W.setWorld(set.world); changed = true; }
      }
      if (s.set) { if (s.set.time && W.setSky) W.setSky(s.set.time); if (s.set.weather && W.setWeather) W.setWeather(s.set.weather); }
      if (s.act && s.act.leave) F.ground();
      if (changed) F.hold = { until: performance.now() + 8000, least: performance.now() + 400, why: 'the world is laying' };
      if (!F.hold) settle(s);
      showTitle(s.title != null ? s : null);
    }
    /** The hold is over: a planned shot is staged where things now stand, the act's first moves happen. */
    function settle(s) {
      if (s.plan) { try { const st = F.stage(s.plan); s.keys = st.keys; s.curve = null; s.name = s.name || st.name; s.readout = st.readout; } catch (e) { F.log.push('stage: ' + (e.message || e)); } }
      for (const ac of s.acts || []) { const A = F.actors.get(ac.who); if (A) { A.act = { ...ac }; A.fireT = 0; delete A.act._end; } }
      F.pending = (s.events || []).map(ev => ({ ...ev, done: false })); F.rout = null; F.strikes = null;
      const a = s.act; if (!a) return; const st = F.actState = { fireT: 0, saberT: 0, started: true, boarded: false, aimed: false };
      if (a.kind === 'walk' || a.ahead || a.ride || a.tie) F.prone = false;
      if (a.look && W.rig) { W.rig.heading = Math.atan2(a.look.x - W.rig.pos.x, a.look.z - W.rig.pos.z); W.rig.figure.rotation.y = W.rig.heading; }
      if (!a.ride && !a.tie) { board(a, st); aimAhead(a, st); }
    }
    /** Into the named ride or the TIE; tried every step until it works, since a planet's vehicles come a moment after the planet. */
    function board(a, st) {
      if (st.boarded) return; if (a.ride && W.mode === 'walk') { const A = F.actors.get(a.ride), S = F.subject(a.ride), it = A && A.it ? A.it : W.props && W.props.items.get(S.what); if (it && it.ready && W.teleport && W.boardVehicle) { W.teleport(S.x + S.r + 1.2 * M, S.z); W.rig.heading = it.yaw * Math.PI / 2; W.boardVehicle(it.id); if (W.mode === 'ride') st.boarded = true; } return; }
      if (a.tie && W.mode === 'walk' && W.board && W.ship) { W.teleport(W.ship.position.x + 3 * M, W.ship.position.z); W.board(); if (W.mode === 'fly') st.boarded = true; return; }
      st.boarded = true;
    }
    /** AHEAD m: the point that far along the clearest of eight headings (the figure's own first), so a walk does not start into a wall. */
    function aimAhead(a, st) {
      if (st.aimed || !a.ahead) return; st.aimed = true;
      const ride = W.mode === 'ride' && W.veh, p = ride ? W.veh.pos : W.rig.pos, h0 = ride ? W.veh.heading : W.rig.heading, d = a.ahead * M;
      const shipR = 7 * M, ship = W.ship && W.mode !== 'fly' ? W.ship.position : null;
      const blocked = h => { let n = 0; for (let t = 0.12; t <= 1; t += 0.11) { const x = p.x + Math.sin(h) * d * t, z = p.z + Math.cos(h) * d * t; let hit = false;
        if (W.city && window.Bricks) for (const b of W.city.near(x, z, 2 * M)) if (Bricks.pointInRing(x / M, z / M, b.ring)) { hit = true; break; }
        if (!hit && W.props) for (const it of W.props.near(x, z, 2 * M)) { const b = it.box; if (b && x > b.min.x - M && x < b.max.x + M && z > b.min.z - M && z < b.max.z + M && !(ride && W.veh.prop === it)) { hit = true; break; } }
        if (!hit && ship && Math.hypot(ship.x - x, ship.z - z) < shipR) hit = true;
        if (hit) n++; } return n; };
      let best = h0, bn = blocked(h0); if (bn) for (let k = 1; k < 8 && bn; k++) { const h = h0 + k * Math.PI / 4 * (k % 2 ? 1 : -1); const n = blocked(h); if (n < bn) { bn = n; best = h; } }
      a.kind = ride ? 'drive' : 'walk'; a.x = p.x + Math.sin(best) * d; a.z = p.z + Math.cos(best) * d;
      if (!ride && W.rig) { W.rig.heading = best; W.rig.figure.rotation.y = best; }
    }
    const laidAll = () => { if (!W.vehicles) return true; const l = W.vehicles.list(); return l.every(v => v.ready); };
    /** The planet and the character a shot plays in: its own SET, or the last one before it, so a shot played on its own starts where the reel would have it. */
    function setFor(i) { const out = { world: null, as: null }; for (let k = i; k >= 0; k--) { const st = F.shots[k].set; if (!st) continue; if (!out.world && st.world) out.world = st.world; if (!out.as && st.as) out.as = st.as; if (out.world && out.as) break; } return out.world || out.as ? out : null; }
    F.ground = () => { if (W.filmGround) W.filmGround(); };
    /** The title card on the page while a title shot plays (the take draws its own). */
    function showTitle(s) {
      let el = document.getElementById('title'); if (!el) { el = document.createElement('div'); el.id = 'title'; el.innerHTML = '<span></span>'; document.body.appendChild(el); }
      el.hidden = !s; if (s) { el.dataset.style = s.style || 'card'; el.querySelector('span').textContent = s.title; if (s.style === 'hud') paintHud(s, 0); }
    }
    /** The hud overlay on the page, drawn over the band. */
    function paintHud(s, t) {
      const el = document.getElementById('title'); if (!el) return; let c = el.querySelector('canvas'); if (!c) { c = document.createElement('canvas'); el.appendChild(c); }
      const pr = Math.min(devicePixelRatio || 1, 2), b = F.band(); if (c.width !== Math.round(b.W * pr) || c.height !== Math.round(b.H * pr)) { c.width = Math.round(b.W * pr); c.height = Math.round(b.H * pr); }
      const ctx = c.getContext('2d'); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height); ctx.setTransform(pr, 0, 0, pr, 0, 0); ctx.translate(b.x, b.H - b.y - b.h); drawHud(ctx, b.w, b.h, s, t);
    }

    /* ── the step: the reel's clock, the free camera's dolly, the sun ── */
    F.step = dt => {
      if (F.hold) { const s = F.shots[F.play.i], now = performance.now(); if (now > F.hold.until || (now > F.hold.least && laidAll())) { F.hold = null; if (s) settle(s); } else return; }   // the clock waits for the planet's things
      if (F.rec) F.rec.t += dt;
      if (F.play.on && F.actState) stepAct(dt);
      if (F.play.on) {
        F.play.t += dt; const s = F.shots[F.play.i];
        if (s) { for (const ev of F.pending) if (!ev.done && F.play.t >= ev.at) { ev.done = true; fireEvent(ev, s); } if (s.title != null && s.style === 'hud' && (F.hudAcc = (F.hudAcc || 0) + dt) > 0.08) { F.hudAcc = 0; paintHud(s, F.play.t); } }
        if (!s || F.play.t >= s.sec - 1e-9) {
          if (F.play.all && F.play.i + 1 < F.shots.length) { F.play.i++; F.play.t = 0; F.sel = F.play.i; enter(F.play.i); if (F.onChange) F.onChange('cut'); }
          else { F.stop(); if (F.rec && F.rec.until == null) F.rec.done = true; }
        }
      } else if (F.mode === 'shot') { const s = F.shots[F.sel]; if (s && s.keys.length > 1) F.viewT = Math.min(F.viewT + dt, s.sec); }   // a move is previewed once, then holds its last key
      if (F.mode === 'free' && !F.play.on) {
        const I = W.input, f = F.free, run = I.run || I.boost || I.runHook, v = (run ? 18 : 6) * M * dt;
        if (I.look) { F.look(I.look.dx, I.look.dy); I.look.dx = I.look.dy = 0; }
        if (I.L && I.L.mag) { const fx = -Math.sin(f.yaw), fz = -Math.cos(f.yaw), rx = Math.cos(f.yaw), rz = -Math.sin(f.yaw); f.pos.x += (fx * I.L.y + rx * I.L.x) * v; f.pos.z += (fz * I.L.y + rz * I.L.x) * v; f.pos.y += Math.sin(f.pitch) * I.L.y * v; }
        const g = groundH(f.pos.x, f.pos.z) + 0.4 * M; if (f.pos.y < g) f.pos.y = g;
      }
      if (F.sun) applySun();
    };

    /* ── direction: the figure or the ride goes where the shot says ── */
    const act = () => F.play.on && F.shots[F.play.i] && F.shots[F.play.i].act;
    /** The act's running parts: the throttle of a flight, the trigger, the saber. */
    function stepAct(dt) {
      const a = act(), st = F.actState, I = W.input; if (!a || !st) return;
      if (!st.boarded) { board(a, st); if (!st.boarded) return; } aimAhead(a, st);
      if (a.fly && W.mode === 'fly') { I.fly.x = 0; I.fly.y = 0.35; I.fly.mag = 0.6; I.fly.held = true; }   // a ride's flight is steered from the ride branch (F.steer)
      if (a.fire) { st.fireT += dt; if (st.fireT > 0.45) { st.fireT = 0; if (W.mode === 'fly' || W.mode === 'ride') I.fireOnce = true; else I.saber = true; } }
      if (a.saber) { st.saberT += dt; if (st.saberT > 1.1) { st.saberT = 0; if (W.mode === 'walk') I.saber = true; } }
    }
    F.acting = () => { const a = act(); return !!a && !F.hold && ((a.kind === 'walk' && W.mode === 'walk') || (W.mode === 'ride' && (a.kind === 'drive' || a.fly))); };
    F.move = out => {
      const a = act(), p = W.rig.pos; if (!a) { out.x = out.z = out.mag = 0; return out; }
      const dx = a.x - p.x, dz = a.z - p.z, d = Math.hypot(dx, dz);
      if (d < 1 * M) { out.x = out.z = out.mag = 0; F.running = false; return out; }
      out.x = dx / d; out.z = dz / d; out.mag = 1; F.running = d > 8 * M; return out;
    };
    F.steer = V => {
      const a = act(); if (!a) return; V.input.boost = false;
      const alt = V.pos.y - groundH(V.pos.x, V.pos.z), hover = V.K.stall === 0;
      const lift = !a.fly ? 0 : hover ? (alt < 2.5 * M ? 0.5 : alt > 4 * M ? -0.3 : 0) : (!V.airborne || alt < 12 * M ? 1 : 0.1);   // a hover skims two and a half metres up; a plane climbs to twelve, then levels
      if (a.kind !== 'drive') { V.input.x = 0; V.input.y = lift; V.input.mag = a.fly ? 1 : 0; return; }   // a flight with no point: straight on
      const dx = a.x - V.pos.x, dz = a.z - V.pos.z, d = Math.hypot(dx, dz), err = wrap(Math.atan2(dx, dz) - V.heading);
      V.input.x = clamp(-err * 1.5, -1, 1); V.input.y = a.fly ? lift : d > 3 * M ? (Math.abs(err) > 1.2 ? 0.35 : 1) : 0; V.input.mag = a.fly ? 1 : Math.min(1, Math.hypot(V.input.x, V.input.y));
    };

    /* ── actors: props the film drives, crowds it routs, builds it lays ── */
    function legPoint(a, part) {
      if (!a.it || !a.it.group) return null; const g = a.it.group.getObjectByName(part); const P = new THREE.Vector3();
      if (g) { g.getWorldPosition(P); return { x: P.x, z: P.z, top: P.y, bottom: groundH(P.x, P.z) }; }
      const V = a.V, sx = Math.sin(V.heading), cx = Math.cos(V.heading), back = /r/.test(part.slice(4)) ? -1 : 1, left = /l$/.test(part) ? 1 : -1;   // leg-rl: rear left
      const x = V.pos.x + sx * V.hz * 0.6 * back + cx * V.hx * 0.6 * left, z = V.pos.z + cx * V.hz * 0.6 * back - sx * V.hx * 0.6 * left, b = a.it.box; return { x, z, top: b.min.y + (b.max.y - b.min.y) * 0.45, bottom: groundH(x, z) };
    }
    async function layActor(a) {
      if (a.crowd) { a.npcs = []; if (!W.crowd) return; for (let i = 0; i < a.n; i++) { const ang = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * a.r, n = W.crowd.spawn(a.kind === 'rebels' ? 'rebel' : a.kind, a.x + Math.cos(ang) * rr, a.z + Math.sin(ang) * rr, i); if (n) { n.film = a.name; a.npcs.push(n); } } return; }
      const mpd = a.kit ? `0 KIT ${a.kit}` : Dsl.vehicleMPD({ kind: a.kind, len: a.len || (a.kind === 'speeder' ? 7 : 8), col: a.col == null ? 71 : a.col }).mpd;
      const it = await W.props.place(mpd, a.x, groundH(a.x, a.z), a.z, 0, true, { op: a.kit ? 'kit' : 'vehicle', kit: a.kit || undefined, kind: a.kit || a.kind, len: a.len, col: a.col, film: a.name });
      if (!it || !F.actors.has(a.name)) { if (it) W.props.remove(it.id, true); return; }
      a.it = it; a.V = Drive.create({ prop: it, M, groundH, aabbs: (x, z, r) => (W.props ? W.props.aabbs(x, z, r).filter(b => b !== it.box) : []) }); a.V.heading = headingOf(a.heading || 0);
      if (a.V.fly && a.alt) { a.V.pos.y += a.alt * M; a.V.airborne = true; }
      Drive.step(a.V, 0, W.filmCtx(a.V)); if (W.props.moved) W.props.moved(it);
    }
    function layBuild(b) {
      if (!window.Dsl || !W.build) return; const res = Dsl.compile(b.program); const ay = groundH(b.x, b.z); const rows = Dsl.toRows(res, { ax: b.x, ay, az: b.z, prefix: 'film-' + b.name });
      const pieces = W.build.addRows(rows, true, true); let lo = [Infinity, Infinity], hi = [-Infinity, -Infinity], top = ay;
      for (const r of rows) { lo[0] = Math.min(lo[0], r[3]); hi[0] = Math.max(hi[0], r[3]); lo[1] = Math.min(lo[1], r[5]); hi[1] = Math.max(hi[1], r[5]); top = Math.max(top, r[4] + 24); }
      F.builds.set(b.name, { name: b.name, program: b.program, ax: b.x, az: b.z, ids: pieces.map(p => p.id), x: (lo[0] + hi[0]) / 2, z: (lo[1] + hi[1]) / 2, y0: ay, h: Math.max(top - ay, M), r: Math.max(hi[0] - lo[0], hi[1] - lo[1]) / 2 + M, w: hi[0] - lo[0], d: hi[1] - lo[1] });
    }
    /** The scene's actors and builds stand; the planet, the character and the ground it asked for are set first. */
    F.setup = async () => {
      const sc = F.scene; if (!sc || sc.up) return; sc.up = true;
      if (sc.world && W.setWorld && W.world !== sc.world) W.setWorld(sc.world); if (sc.as && W.setCharacter && W.character !== sc.as) { F.ground(); W.setCharacter(sc.as); }
      if (sc.ground && W.setGround && W.G && W.G.mode !== sc.ground) { sc.groundWas = W.G.mode; W.setGround(sc.ground); for (let i = 0; i < 60 && !(W.G && W.G.mode === sc.ground && W.ready); i++) await new Promise(r => setTimeout(r, 100)); }
      if (sc.weather && W.setWeather) W.setWeather(sc.weather); if (sc.time && W.setSky) W.setSky(sc.time);
      const sp = W.spawn || (W.rig && W.rig.pos) || new THREE.Vector3();
      if (!sc.abs) { for (const a of sc.actors) { a.x = sp.x + a.x * M; a.z = sp.z + a.z * M; if (a.r) a.r *= 1; } for (const b of sc.builds) { b.x = sp.x + b.x * M; b.z = sp.z + b.z * M; } for (const s of F.shots) { for (const a of s.acts || []) { if (a.to && a.rel) { a.to.x = sp.x + a.to.x * M; a.to.z = sp.z + a.to.z * M; delete a.rel; } if (a.aim && typeof a.aim === 'object' && a.rel !== false) { a.aim.x = sp.x + a.aim.x * M; a.aim.z = sp.z + a.aim.z * M; } } for (const ev of s.events || []) if (ev.x != null && ev.rel) { ev.x = sp.x + ev.x * M; ev.z = sp.z + ev.z * M; delete ev.rel; } } sc.abs = true; }
      if (sc.actors.some(a => a.crowd) && W.crowd) for (const n of W.crowd.npcs.slice()) W.crowd.remove(n);   // the place's own crowd makes room for the scene's
      for (const a of sc.actors) F.actors.set(a.name, a); for (const b of sc.builds) layBuild(b);
      await Promise.all(sc.actors.map(a => layActor(a).catch(e => F.log.push('actor ' + a.name + ': ' + (e.message || e)))));
      sc.ready = true; if (F.onChange) F.onChange('scene');
    };
    F.teardown = () => {
      const sc = F.scene; for (const a of F.actors.values()) { if (a.it) W.props.remove(a.it.id, true); if (a.npcs && W.crowd) for (const n of a.npcs) W.crowd.remove(n); }
      for (const b of F.builds.values()) for (const id of b.ids) W.build.take(id, true);
      if (W.props) for (const it of [...W.props.items.values()]) if (it.src && it.src.film) W.props.remove(it.id, true);   // whatever a film laid and lost track of
      if (W.crowd) for (const n of W.crowd.npcs.slice()) if (n.film) W.crowd.remove(n);
      for (const m of F.meshes) { W.scene.remove(m); if (m.geometry) m.geometry.dispose(); } F.meshes = []; F.actors.clear(); F.builds.clear(); F.cable = null; F.hang = null; F.prone = false; F.rout = null; F.strikes = null; F.pending = [];
      if (W.rig) W.rig.figure.rotation.x = 0; if (sc && sc.groundWas && W.setGround) W.setGround(sc.groundWas); F.scene = null; return true;
    };
    const aimPoint = aim => { if (!aim) return null; if (typeof aim === 'object') return new THREE.Vector3(aim.x, groundH(aim.x, aim.z) + 0.5 * M, aim.z); const S = F.subject(aim); return new THREE.Vector3(S.x, S.y0 + S.h * 0.4, S.z); };
    function driveActor(a, act, dt) {
      const V = a.V; let want = null, speed = act.speed != null ? act.speed : 0.6;
      if (act.march != null) want = headingOf(act.march);
      else if (act.to) { const dx = act.to.x - V.pos.x, dz = act.to.z - V.pos.z; if (Math.hypot(dx, dz) < 3 * M) speed = 0; else want = Math.atan2(dx, dz); }
      else if (act.orbit) { const T = F.subject(act.orbit), R = (act.r || 20) * M, ang = Math.atan2(V.pos.x - T.x, V.pos.z - T.z), nx = T.x + Math.sin(ang + 0.55) * R, nz = T.z + Math.cos(ang + 0.55) * R; want = Math.atan2(nx - V.pos.x, nz - V.pos.z); speed = act.speed != null ? act.speed : 1; }
      else if (act.pass) { if (!act._end) { const T = F.subject(act.pass), dx = T.x - V.pos.x, dz = T.z - V.pos.z, d = Math.hypot(dx, dz) || 1; act._end = { x: T.x + dx / d * 110 * M, z: T.z + dz / d * 110 * M }; } const dx = act._end.x - V.pos.x, dz = act._end.z - V.pos.z; if (Math.hypot(dx, dz) > 4 * M) want = Math.atan2(dx, dz); speed = act.speed != null ? act.speed : 1; }
      else if (act.halt) speed = 0;
      if (want != null) { const err = wrap(want - V.heading); V.input.x = clamp(-err * 1.5, -1, 1); }
      V.input.y = speed; V.input.mag = speed;
      if (V.fly) { const alt = V.pos.y - groundH(V.pos.x, V.pos.z), wantAlt = (act.alt || 8) * M; V.input.y = act.land ? -0.5 : alt < wantAlt - M ? 0.6 : alt > wantAlt + M ? -0.35 : 0; V.input.mag = Math.max(speed, 0.3); }
    }
    function stepActors(dt) {
      for (const a of F.actors.values()) {
        if (!a.V || a.crowd) continue;
        if (a.fall) { stepFall(a, dt); continue; } if (a.down) continue;
        const V = a.V, act = a.act; V.input.x = 0; V.input.y = 0; V.input.mag = 0; V.input.boost = false;
        if (act && F.play.on) { driveActor(a, act, dt); if (act.fire && (a.fireT = (a.fireT || 0) + dt) > (act.every || 1.5)) { a.fireT = 0; W.filmFx.fire(V, !!act.heavy, 'film', aimPoint(act.aim)); } }
        Drive.step(V, dt, W.filmCtx(V));
        if ((a.syncAcc = (a.syncAcc || 0) + dt) > 0.2) { a.syncAcc = 0; syncProp(a); }   // the prop's place and box follow the drive, so subjects and the clear line see where it is
      }
    }
    /** The prop record catches up with its group: position, yaw, box. */
    function syncProp(a) { const it = a.it, V = a.V; if (!it || !V || !it.group) return; it.x = V.pos.x; it.y = V.pos.y - (V.K.hover || 0) * M; it.z = V.pos.z; it.yaw = V.heading / (Math.PI / 2); it.group.updateMatrixWorld(true); it.box.setFromObject(it.group); }
    /** A walker comes down: nose first about its front feet (trip), or onto its flank after a stumble (topple). */
    function startFall(a, kind, over) { if (!a.V || a.fall || a.down) return; a.fall = { kind, t: 0, over: over || (kind === 'topple' ? 2 : 1.6), pitch: 0, roll: 0, base: a.V.pos.clone(), heading: a.V.heading, done: false }; a.V.speed = 0; a.V.input.mag = 0; a.V.input.y = 0; }
    function stepFall(a, dt) {
      const f = a.fall, V = a.V, g = a.it.group, hz = V.hz, hx = V.hx; f.t += dt; const u = clamp(f.t / f.over, 0, 1), e = u * u;
      const fwd = V1.set(Math.sin(f.heading), 0, Math.cos(f.heading)), side = V2.set(Math.cos(f.heading), 0, -Math.sin(f.heading));
      if (f.kind === 'trip') { f.pitch = -85 * DEG * e; g.position.copy(f.base).addScaledVector(fwd, hz * 0.5 * e); g.rotation.set(0, f.heading, 0, 'YXZ'); g.rotateX(-f.pitch); }
      else { const st = clamp(f.t / 0.5, 0, 1); f.pitch = -10 * DEG * st; f.roll = 85 * DEG * clamp((f.t - 0.5) / Math.max(0.3, f.over - 0.5), 0, 1) ** 2; g.position.copy(f.base).addScaledVector(side, hx * 0.5 * (f.roll / (85 * DEG))); g.rotation.set(0, f.heading, 0, 'YXZ'); g.rotateX(-f.pitch); g.rotateZ(f.roll); }
      if ((f.boxAcc = (f.boxAcc || 0) + dt) > 0.25) { f.boxAcc = 0; syncProp(a); }
      if (u >= 1 && !f.done) {
        f.done = true; a.down = true; const smoke = W.filmFx.smoke(), b = a.it.box, len = hz * 2, H = b.max.y - b.min.y;
        const head = f.kind === 'trip' ? f.base.clone().addScaledVector(fwd, hz + H * 0.6) : f.base.clone().addScaledVector(side, hx + H * 0.5); head.y = groundH(head.x, head.z) + 0.6 * M;
        for (let k = 0; k < 3; k++) { const p = f.base.clone().lerp(head, k / 2); p.y = groundH(p.x, p.z) + 0.4 * M; smoke.puff(p, 18, 3 * M, 0.92); }
        W.filmFx.crater(head, 2.5 * M, 0.6 * M); W.filmFx.shake(0.9); Fx.Sfx.crunch(); Fx.Sfx.thud(1); if (f.kind === 'topple') { W.filmFx.blast(head, 4 * M, new THREE.Vector3(0, 3 * M, 0), 'torp'); W.filmFx.flash(); smoke.column(head, 40, 10); }
        if (W.props.moved) W.props.moved(a.it);
      }
    }
    /** The tow cable: from the speeder to the walker's rear leg, wrapped round it turn by turn. */
    function stepCable(dt) {
      const c = F.cable; if (!c || c.frozen) return; c.t += dt; const u = clamp(c.t / c.over, 0, 1), to = F.actors.get(c.to), from = F.actors.get(c.from); if (!to || !to.V) return;
      const L = legPoint(to, c.leg || 'leg-rl'); if (!L) return; const r = Math.max(0.9 * M, to.V.hx * 0.35), turns = c.turns * u, n = Math.max(3, Math.ceil(turns * 14)), pts = [];
      for (let i = 0; i <= n; i++) { const t = i / n, ang = t * turns * Math.PI * 2, y = L.bottom + 0.4 * M + (L.top - L.bottom - 0.8 * M) * (1 - t); pts.push(new THREE.Vector3(L.x + Math.cos(ang) * r, y, L.z + Math.sin(ang) * r)); }
      if (from && from.V && u < 1) pts.push(from.V.pos.clone().addScaledVector(UP, 0.4 * M)); else if (u >= 1) { pts.push(pts[pts.length - 1].clone().addScaledVector(UP, -0.3 * M).add(new THREE.Vector3(r * 2, 0, 0))); c.frozen = true; }
      const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(8, pts.length * 3), 0.07 * M, 5, false);
      if (!c.mesh) { c.mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x1a1d24, roughness: 0.6, metalness: 0.5 })); c.mesh.name = 'cable'; W.scene.add(c.mesh); F.meshes.push(c.mesh); } else { c.mesh.geometry.dispose(); c.mesh.geometry = geo; }
    }
    /** The ascension line: the figure hangs under a walker's belly, drawn up over seconds, then dropped. */
    function stepHang(dt) {
      const h = F.hang; if (!h || !W.rig) return; const a = F.actors.get(h.actor); if (!a || !a.V) { F.hang = null; return; }
      h.t += dt; const u = clamp(h.t / h.over, 0, 1), b = a.it.box, belly = a.V.pos.clone(); belly.y = b.min.y + (b.max.y - b.min.y) * 0.42;
      const g = groundH(belly.x, belly.z), len0 = belly.y - g, len1 = 3.4 * M, len = len0 + (len1 - len0) * u, rig = W.rig;
      if (!rig.airVel) rig.airVel = new THREE.Vector3(); rig.pos.set(belly.x, belly.y - len, belly.z); rig.air = true; rig.vy = 0; rig.airVel.set(0, 0, 0); rig.figure.rotation.x = 0; rig.figure.visible = true;
      const pts = [belly, rig.pos.clone().addScaledVector(UP, 2.5 * M)], geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 2, 0.04 * M, 4, false);
      if (!h.mesh) { h.mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x2a2d34, roughness: 0.7 })); h.mesh.name = 'line'; W.scene.add(h.mesh); F.meshes.push(h.mesh); } else { h.mesh.geometry.dispose(); h.mesh.geometry = geo; }
    }
    function stepStrikes(dt) {
      const st = F.strikes; if (!st) return; st.acc += dt; if (st.acc < st.every) return; st.acc = 0;
      const p = st.point(); W.filmFx.blast(p, 2.2 * M, new THREE.Vector3((Math.random() - 0.5) * 3 * M, 4 * M, (Math.random() - 0.5) * 3 * M), 'bolt'); W.filmFx.crater(p, 1.3 * M, 0.4 * M); W.filmFx.smoke().puff(p, 16, 2.5 * M, 0.9); W.filmFx.shake(0.2); Fx.Sfx.crunch();
    }
    function stepRout() { const r = F.rout; if (!r) return; const a = F.actors.get(r.crowd), from = F.actors.get(r.from); if (!a || !a.npcs) return; const p = from && from.V ? from.V.pos : null; for (const n of a.npcs) if (n.alive) { n.flee = 2; n.fleeFrom = p; } }
    function fireEvent(ev, s) {
      F.fired++; const who = ev.who, A = F.actors.get(who);
      switch (ev.what) {
        case 'CABLE': F.cable = { from: who, to: ev.who2, turns: ev.turns || 3, over: ev.over || 4, t: 0, leg: 'leg-rl', frozen: false }; Fx.Sfx.skid && Fx.Sfx.skid(); break;
        case 'TRIP': if (A) { startFall(A, 'trip', ev.over); if (F.cable && F.cable.to === who) F.cable.frozen = true; } break;
        case 'TOPPLE': if (A) startFall(A, 'topple', ev.over); break;
        case 'BLAST': if (A && A.V) { const V = A.V, b = A.it.box, H = b.max.y - b.min.y, fwd = new THREE.Vector3(Math.sin(V.heading), 0, Math.cos(V.heading)), p = V.pos.clone(); if (ev.part === 'neck') { p.addScaledVector(fwd, V.hz * 0.45); p.y = b.min.y + H * 0.85; } else if (ev.part === 'head') { p.addScaledVector(fwd, V.hz * 0.8); p.y = b.min.y + H * 0.9; } else { p.y = b.min.y + H * 0.42; }
          W.filmFx.blast(p, 3 * M * (ev.scale || 1), new THREE.Vector3(0, 2 * M, 0), 'torp'); W.filmFx.flash(); W.filmFx.shake(0.5 * (ev.scale || 1)); W.filmFx.smoke().puff(p, 30, 3 * M * (ev.scale || 1), 0.15); W.filmFx.smoke().column(p, 30, 12); Fx.Sfx.torpedo(); Fx.Sfx.crunch(); } break;
        case 'HANG': if (F.actors.get(ev.who2)) { F.prone = false; if (W.rig) W.rig.figure.rotation.x = 0; F.hang = { actor: ev.who2, t: 0, over: ev.over || 3 }; } break;
        case 'DROP': if (F.hang) { if (F.hang.mesh) { W.scene.remove(F.hang.mesh); } F.hang = null; } if (W.rig) { if (!W.rig.airVel) W.rig.airVel = new THREE.Vector3(); W.rig.airVel.set(0, 0, 0); W.rig.air = true; W.rig.vy = -1 * M; F.prone = true; } break;
        case 'STRIKE': { const b = F.builds.get(who), every = ev.every; const point = b ? () => new THREE.Vector3(b.x + (Math.random() - 0.5) * b.w, groundH(b.x, b.z), b.z + (Math.random() - 0.5) * b.d) : () => new THREE.Vector3(ev.x + (Math.random() - 0.5) * (ev.r || 4) * M, groundH(ev.x, ev.z), ev.z + (Math.random() - 0.5) * (ev.r || 4) * M);
          if (every) F.strikes = { every, acc: every, point }; else { F.strikes = { every: 9e9, acc: 0, point }; stepStrikes(9e9); F.strikes = null; } break; }
        case 'ROUT': F.rout = { crowd: who, from: ev.who2 }; break;
        case 'CRASH': if (A && A.V) { A.down = true; A.fall = null; const g = A.it.group, p = A.V.pos; p.y = groundH(p.x, p.z) + 0.3 * M; g.position.copy(p); g.rotation.set(0, A.V.heading, 0, 'YXZ'); g.rotateZ(0.35); g.rotateX(0.12); W.filmFx.smoke().column(p.clone().addScaledVector(UP, M), 60, 8); W.filmFx.smoke().puff(p, 20, 3 * M, 0.9); if (W.props.moved) W.props.moved(A.it); if (W.mode === 'ride' && W.veh && W.veh.prop === A.it) { F.ground(); F.prone = true; } } break;
        case 'SHAKE': W.filmFx.shake(ev.k || 0.5); break;
        case 'FLASH': W.filmFx.flash(); break;
      }
    }
    /** After the world has moved: the actors, the cable, the line, a prone figure, the strikes, the rout. */
    F.late = dt => {
      if (!F.scene) return;
      stepActors(dt); stepCable(dt); stepHang(dt); if (F.play.on) { stepStrikes(dt); stepRout(); }
      if (F.prone && W.rig && W.mode === 'walk' && !W.rig.air) { W.rig.figure.rotation.x = -Math.PI / 2; W.rig.pos.y = groundH(W.rig.pos.x, W.rig.pos.z) + 0.15 * M; }
    };
    F.sceneState = () => ({ name: F.scene ? F.scene.name : null, up: !!(F.scene && F.scene.up), ready: !!(F.scene && F.scene.ready), actors: [...F.actors.keys()], builds: [...F.builds.values()].map(b => ({ name: b.name, pieces: b.ids.length, x: +(b.x / M).toFixed(1), z: +(b.z / M).toFixed(1), w: +(b.w / M).toFixed(1), h: +(b.h / M).toFixed(1) })), cable: F.cable ? { t: +F.cable.t.toFixed(2), turns: +(F.cable.turns * clamp(F.cable.t / F.cable.over, 0, 1)).toFixed(2), frozen: F.cable.frozen, points: F.cable.mesh ? F.cable.mesh.geometry.parameters.path.points.length : 0 } : null, hang: F.hang ? { t: +F.hang.t.toFixed(2), actor: F.hang.actor } : null, prone: F.prone, rout: F.rout, strikes: !!F.strikes, pending: F.pending.map(e => ({ what: e.what, at: e.at, done: e.done })), fired: F.fired, weather: W.weather, ground: W.G && W.G.mode, snow: !!(W.sky && W.sky.stats && W.sky.stats().snow) });

    /* ── the band: the film frame is the render frame while the film owns the camera ── */
    const SZ = new THREE.Vector2();
    F.band = () => { const r = W.renderer; r.getSize(SZ); const A = ASPECTS[F.aspect]; let w = SZ.x, h = SZ.x / A; if (h > SZ.y) { h = SZ.y; w = SZ.y * A; } return { x: (SZ.x - w) / 2, y: (SZ.y - h) / 2, w, h, W: SZ.x, H: SZ.y, A }; };
    F.bandOn = false;
    /** One frame through the band: black outside it, the camera's aspect the film's, the scene drawn inside the scissor. */
    F.renderBand = (scene, cam, real) => {
      const r = W.renderer, b = F.band();
      r.setScissorTest(false); r.setViewport(0, 0, b.W, b.H); r.setClearColor(0x000000, 1); r.clear();
      r.setViewport(b.x, b.y, b.w, b.h); r.setScissor(b.x, b.y, b.w, b.h); r.setScissorTest(true);
      if (Math.abs(cam.aspect - b.A) > 1e-4) { cam.aspect = b.A; cam.updateProjectionMatrix(); }
      real(scene, cam); F.bandOn = true; F.lastBand = b;
    };
    F.bandOff = () => { const r = W.renderer; r.getSize(SZ); r.setScissorTest(false); r.setViewport(0, 0, SZ.x, SZ.y); const cam = W.camera; if (cam && Math.abs(cam.aspect - SZ.x / SZ.y) > 1e-4) { cam.aspect = SZ.x / SZ.y; cam.updateProjectionMatrix(); } F.bandOn = false; };
    /** The band's pixels into a canvas (the whole canvas when the band is off, letterboxed). */
    function drawBand(src, ctx, dw, dh) {
      const b = F.bandOn && F.lastBand; if (!b) return drawWithAspect(src, ctx, dw, dh);
      const pr = W.renderer.getPixelRatio(), sx = b.x * pr, sy = (b.H - b.y - b.h) * pr, sw = b.w * pr, sh = b.h * pr, k = Math.min(dw / sw, dh / sh), w = sw * k, h = sh * k;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, dw, dh); try { ctx.drawImage(src, sx, sy, sw, sh, (dw - w) / 2, (dh - h) / 2, w, h); } catch (e) { }
    }

    /* ── the take ── */
    const MIMES = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
    F.canRecord = () => typeof MediaRecorder !== 'undefined' && !!document.createElement('canvas').captureStream;
    F.record = sec => {
      if (F.rec) return F.stopRec();
      if (!F.canRecord()) { say('this browser cannot record a canvas', 'warn'); return false; }
      const src = W.renderer.domElement, A = ASPECTS[F.aspect], H = SIZES[F.size], w = A >= 1 ? Math.round(H * A / 2) * 2 : Math.round(H * A / 2) * 2, h = H;
      const cap = document.createElement('canvas'); cap.width = w; cap.height = h; const ctx = cap.getContext('2d');
      const mime = MIMES.find(m => { try { return MediaRecorder.isTypeSupported(m); } catch (e) { return false; } });
      if (!mime) { say('no video format to record with', 'warn'); return false; }
      const stream = cap.captureStream(F.fps); let rec;
      try { rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: H >= 1080 ? 12e6 : 6e6 }); } catch (e) { say('could not start the recorder: ' + (e.message || e), 'warn'); return false; }
      const chunks = []; rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
      const R = { rec, cap, ctx, src, frames: 0, t: 0, until: sec ? +sec : null, done: false, mime, started: performance.now() };
      rec.onstop = () => { F.blob = new Blob(chunks, { type: mime.split(';')[0] }); if (F.url) { try { URL.revokeObjectURL(F.url); } catch (e) { } } F.url = URL.createObjectURL(F.blob); F.take = { size: F.blob.size, type: F.blob.type, frames: R.frames, sec: +R.t.toFixed(3), fps: F.fps, w, h, ms: Math.round(performance.now() - R.started) }; if (F.rec === R) F.rec = null; say(`take done · ${R.frames} frames · ${(F.blob.size / 1024).toFixed(0)} KB · save it`, 'ok'); if (F.onChange) F.onChange('take'); };
      F.rec = R; F.blob = null; F.steps = 0;
      if (R.until == null) { if (!F.shots.length) { R.until = F.sec; } else if (F.mode === 'shot' && F.shots[F.sel] && !F.playAllWanted) F.playShot(F.sel); else F.playAll(); }
      rec.start(); say(R.until != null ? `recording ${R.until} s of the live view` : `recording the reel · ${F.total().toFixed(1)} s`, 'busy'); if (F.onChange) F.onChange('rec'); return true;
    };
    F.stopRec = () => { const R = F.rec; if (!R) return false; if (F.play.on) F.stop(); try { R.rec.state !== 'inactive' && R.rec.stop(); } catch (e) { F.rec = null; } return true; };
    F.afterRender = () => {
      const R = F.rec; if (!R) return;
      if (F.hold) return;                                                          // the world is still laying a planet: no frame goes into the take
      drawBand(R.src, R.ctx, R.cap.width, R.cap.height); R.frames++;
      const s = F.play.on && F.shots[F.play.i]; if (s && s.title != null) drawTitle(R.ctx, R.cap.width, R.cap.height, s, F.play.t);
      if (R.done || (R.until != null && R.t >= R.until - 1e-6)) F.stopRec();
    };
    /** The targeting overlay: cobalt scanlines, a reticle, a range that counts down, the words at the foot. Drawn over the frame, never black. */
    function drawHud(ctx, w, h, s, t) {
      ctx.save(); ctx.fillStyle = 'rgba(40,110,255,0.10)'; for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
      ctx.strokeStyle = '#4bd5ee'; ctx.lineWidth = Math.max(1, h / 240); const bw = w * 0.34, bh = h * 0.5, x0 = (w - bw) / 2, y0 = (h - bh) / 2, c = Math.min(bw, bh) * 0.16;
      for (const [x, y, sx, sy] of [[x0, y0, 1, 1], [x0 + bw, y0, -1, 1], [x0, y0 + bh, 1, -1], [x0 + bw, y0 + bh, -1, -1]]) { ctx.beginPath(); ctx.moveTo(x, y + sy * c); ctx.lineTo(x, y); ctx.lineTo(x + sx * c, y); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(w / 2 - c, h / 2); ctx.lineTo(w / 2 + c, h / 2); ctx.moveTo(w / 2, h / 2 - c); ctx.lineTo(w / 2, h / 2 + c); ctx.stroke();
      const fs = Math.round(h * 0.045); ctx.font = `${fs}px ui-monospace, Menlo, Consolas, monospace`; ctx.fillStyle = '#4bd5ee'; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
      const rng = Math.max(120, Math.round(812 - t * 46)), brg = (182 + Math.round(Math.sin(t * 0.8) * 3)) % 360;
      ctx.fillText(`TGT LOCK  WALKER 0${1 + (Math.floor(t * 1.5) % 4)}`, w * 0.04, h * 0.05); ctx.fillText(`RNG ${rng} m   BRG ${String(brg).padStart(3, '0')}   ELV +0${(0.3 + t * 0.02).toFixed(1)}`, w * 0.04, h * 0.05 + fs * 1.4);
      ctx.textAlign = 'right'; ctx.fillText(`${(t * 24 | 0).toString().padStart(4, '0')}  SCAN`, w * 0.96, h * 0.05);
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.font = `${Math.round(h * 0.055)}px Helvetica, Arial, sans-serif`; ctx.fillStyle = '#dff6ff'; ctx.fillText(String(s.title).split('\n')[0], w / 2, h * 0.93, w * 0.9); ctx.restore();
    }
    function drawTitle(ctx, w, h, s, t) {
      if (s.style === 'hud') return drawHud(ctx, w, h, s, t || 0);
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h); const logo = s.style === 'logo';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = logo ? '#ffe81f' : '#4bd5ee';
      const lines = String(s.title).split('\n'), size = logo ? Math.round(h * 0.17) : Math.round(h * 0.06); ctx.font = `${logo ? '900' : '400'} ${size}px ${logo ? 'Impact, "Arial Black", Helvetica, sans-serif' : 'Helvetica, Arial, sans-serif'}`;
      lines.forEach((l, i) => ctx.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * size * 1.3, w * 0.9));
    }
    function drawWithAspect(src, ctx, dw, dh) {
      const sw = src.width || dw, sh = src.height || dh, k = Math.min(dw / sw, dh / sh), w = sw * k, h = sh * k;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, dw, dh); try { ctx.drawImage(src, (dw - w) / 2, (dh - h) / 2, w, h); } catch (e) { }
    }
    F.download = () => { if (!F.url) return false; const a = document.createElement('a'); a.href = F.url; a.download = `momento-${((W.place && W.place.name) || 'world').replace(/[^\w]+/g, '-').toLowerCase()}.${/mp4/.test(F.blob.type) ? 'mp4' : 'webm'}`; document.body.appendChild(a); a.click(); a.remove(); return true; };
    /** A still of a shot's first key for its card: one extra render, then a copy into the small canvas. */
    F.thumb = (i, canvas) => {
      const s = F.shots[i], cam = W.camera, real = W.renderReal; if (!s || !cam || !real) return false;
      if (s.title != null) { drawTitle(canvas.getContext('2d'), canvas.width, canvas.height, s); return true; }
      const pos = cam.position.clone(), q = cam.quaternion.clone(), fov = cam.fov, asp = cam.aspect, was = F.bandOn;
      poseAt(cam, s, 0); F.renderBand(W.scene, cam, real);
      const ctx = canvas.getContext('2d'); drawBand(W.renderer.domElement, ctx, canvas.width, canvas.height);
      if (!was) F.bandOff(); cam.position.copy(pos); cam.quaternion.copy(q); cam.fov = fov; cam.aspect = asp; cam.updateProjectionMatrix(); return true;
    };

    /* ── memory ── */
    const key = () => 'world.film.' + (W.placeKey ? W.placeKey() : 'here');
    F.save = () => { try { if (F.shots.length || F.lights.length) localStorage.setItem(key(), F.text()); else localStorage.removeItem(key()); } catch (e) { } };
    F.load = () => { let t = null; try { t = localStorage.getItem(key()); } catch (e) { } if (!t) return 0; const r = F.parse(t); return r.shots; };

    /* ── words → shots ── */
    /** What the world has to point a camera at: the player, the landmarks, the named buildings, the kits. */
    F.scene = () => {
      const p = W.rig ? W.rig.pos : new THREE.Vector3(), out = { me: { x: +(p.x / M).toFixed(1), z: +(p.z / M).toFixed(1), mode: W.mode, character: W.character }, landmarks: [], buildings: [], sun: W.sky ? W.sky.stats() : null };
      if (W.props) for (const it of W.props.items.values()) if (it.src && (it.src.landmark || it.kit)) out.landmarks.push({ id: it.id, kind: it.kit || it.src.kind || it.src.op, x: +(it.x / M).toFixed(1), z: +(it.z / M).toFixed(1) });
      if (W.city) for (const b of W.city.buildings) { if (!b.name) continue; const d = Math.hypot(b.cx * M - p.x, b.cz * M - p.z); if (d > 400 * M) continue; out.buildings.push({ name: b.name, kind: b.kind || 'building', x: +b.cx.toFixed(1), z: +b.cz.toFixed(1), h: +((b.yTop - b.y0) / M).toFixed(1), d: +(d / M).toFixed(0) }); }
      out.buildings.sort((a, b) => a.d - b.d); out.buildings = out.buildings.slice(0, 24); return out;
    };
    const KIT_WORDS = { atat: /\bat-?at\b|walker/i, atst: /\bat-?st\b|scout walker/i, xwing: /\bx-?wing\b/i, shuttle: /\bshuttle\b/i, speeder: /\bspeeder\b/i, car: /\bcar\b/i, truck: /\btruck\b/i, bus: /\bbus\b/i, tie: /\btie\b/i };
    /** A subject from a word, an id, a name, or a point: its centre, its footprint, its height. */
    F.subject = on => {
      const p = W.rig ? W.rig.pos : new THREE.Vector3();
      const me = () => { const c = W.mode === 'ride' && W.veh ? W.veh.pos : W.mode === 'fly' ? W.tie.pos : p; return { x: c.x, z: c.z, y0: groundH(c.x, c.z), h: (W.mode === 'walk' ? 2.5 : 4) * M, r: (W.mode === 'walk' ? 0.5 : 2) * M, what: 'me' }; };
      const prop = it => { const b = it.box; if (!b) return null; return { x: (b.min.x + b.max.x) / 2, z: (b.min.z + b.max.z) / 2, y0: b.min.y, h: b.max.y - b.min.y, r: Math.max(b.max.x - b.min.x, b.max.z - b.min.z) / 2, what: it.id, id: it.id, kind: 'prop' }; };
      const bld = b => ({ x: b.cx * M, z: b.cz * M, y0: b.y0, h: b.yTop - b.y0, r: (b.r || 5) * M, what: b.name || b.kind || b.id, id: b.id, kind: 'building' });
      if (Array.isArray(on) && on.length >= 2) { const x = +on[0] * M, z = +on[1] * M; return { x, z, y0: groundH(x, z), h: 2 * M, r: 1 * M, what: `${on[0]}, ${on[1]}` }; }
      const s = String(on == null ? 'me' : on).trim(); if (!s || /^(me|myself|i|the (player|hero|figure)|vader|us)$/i.test(s)) { const m = me(); m.heading = W.mode === 'ride' && W.veh ? W.veh.heading : W.mode === 'fly' && W.tie ? W.tie.yaw : W.rig ? W.rig.heading : 0; return m; }
      { const [an, part] = s.split(':'); const a = F.actors.get(an); if (a) { if (a.crowd) return { x: a.x, z: a.z, y0: groundH(a.x, a.z), h: 2.5 * M, r: a.r, what: a.name, id: null, kind: 'crowd' }; const P = a.it && prop(a.it); if (P) { P.what = a.name; P.heading = a.V ? a.V.heading : 0; if (part && /^leg/.test(part)) { const L = legPoint(a, part); if (L) return { x: L.x, z: L.z, y0: L.bottom, h: L.top - L.bottom, r: Math.max(1.2 * M, a.V.hx * 0.5), what: `${a.name} ${part}`, id: a.it.id, kind: 'prop', heading: P.heading }; } return P; } } }
      { const b = F.builds.get(s); if (b) return { x: b.x, z: b.z, y0: b.y0, h: b.h, r: b.r, what: b.name, id: null, kind: 'build', heading: Math.PI }; }
      if (W.props) { const it = W.props.items.get(s); if (it) { const P = prop(it) || me(); if (W.mode === 'ride' && W.veh && W.veh.prop === it) P.heading = W.veh.heading; else P.heading = it.yaw * Math.PI / 2; return P; } }
      if (W.tie && /^(tie|the tie|ship)$/i.test(s)) { const c = W.tie.flying ? W.tie.pos : W.ship.position; return { x: c.x, z: c.z, y0: c.y, h: 4 * M, r: 4 * M, what: 'the TIE' }; }
      for (const [k, re] of Object.entries(KIT_WORDS)) if (re.test(s) && W.props) { let best = null, bd = Infinity; for (const it of W.props.items.values()) { if (!(it.kit === k || (it.src && (it.src.kind === k || it.src.kit === k)))) continue; const d = Math.hypot(it.x - p.x, it.z - p.z); if (d < bd) { bd = d; best = it; } } if (best) return prop(best) || me(); if (k === 'tie' && W.ship) { const c = W.ship.position; return { x: c.x, z: c.z, y0: c.y, h: 4 * M, r: 4 * M, what: 'the TIE' }; } }
      if (W.city) {
        const words = s.toLowerCase().replace(/^the\s+/, ''); let best = null, bd = Infinity;
        for (const b of W.city.buildings) { const name = (b.name || '').toLowerCase(), kind = (b.kind || '').toLowerCase(); const hit = (name && (name === words || name.includes(words) || words.includes(name))) || (kind && (kind === words || (/tower|church|stadium|cathedral|school|station|hall|hotel|museum|library|bridge|temple|mosque|castle|shop|house/.test(words) && kind.includes(words.split(/\s+/).pop())))); if (!hit) continue; const d = Math.hypot(b.cx * M - p.x, b.cz * M - p.z); if (d < bd) { bd = d; best = b; } }
        if (!best && /tower|tallest|highest|skyscraper/.test(words)) { let hh = 0; for (const b of W.city.buildings) { const d = Math.hypot(b.cx * M - p.x, b.cz * M - p.z), h = b.yTop - b.y0; if (d < 300 * M && h > hh) { hh = h; best = b; } } }
        if (!best && /house|building|the nearest|nearby/.test(words)) { for (const b of W.city.buildings) { const d = Math.hypot(b.cx * M - p.x, b.cz * M - p.z); if (d < bd) { bd = d; best = b; } } }
        if (best) return bld(best);
      }
      return me();
    };
    /** A semantic shot staged into keys: the subject's size sets the distance, the bearing the side, the move the second key. */
    /** Is a point inside something the camera should not be in: the ground, a building (not the subject's), a prop (not the subject's), the parked TIE. */
    F.inside = (p, skipId) => {
      if (p.y < groundH(p.x, p.z) + 0.5 * M) return 'ground';
      if (W.city && window.Bricks) for (const b of W.city.near(p.x, p.z, 1.5 * M)) if (b.id !== skipId && p.y < b.yTop + 0.5 * M && Bricks.pointInRing(p.x / M, p.z / M, b.ring)) return 'building';
      if (W.props) for (const it of W.props.near(p.x, p.z, 1.5 * M)) { const b = it.box; if (it.id !== skipId && b && p.x > b.min.x - 0.5 * M && p.x < b.max.x + 0.5 * M && p.z > b.min.z - 0.5 * M && p.z < b.max.z + 0.5 * M && p.y > b.min.y - 0.5 * M && p.y < b.max.y + 0.5 * M) return 'prop'; }
      if (W.ship && W.mode !== 'fly') { const sp = W.ship.position; if (Math.hypot(sp.x - p.x, sp.z - p.z) < 6.5 * M && p.y < sp.y + 5 * M) return 'ship'; }
      return null;
    };
    /** Can the camera see the subject: twelve samples along the line, none inside anything but the subject itself. */
    F.los = (cam, tgt, S) => {
      const P = new THREE.Vector3();
      for (let i = 1; i <= 12; i++) { const t = 0.04 + 0.86 * (i / 12); P.lerpVectors(cam, tgt, t); if (S && Math.hypot(P.x - S.x, P.z - S.z) < S.r * 1.15 + 0.5 * M) break; const hit = F.inside(P, S && S.id); if (hit) return hit; }
      return null;
    };
    const FILL = { wide: 0.38, medium: 0.6, close: 1, low: 0.7, aerial: 0.36, shoulder: 0 };
    F.stage = sh => {
      const S = F.subject(sh.on), frame = FRAMES[sh.frame] != null || sh.frame === 'pov' || sh.frame === 'under' ? sh.frame : 'medium';
      if (frame === 'pov' || frame === 'under') {                                        // from the seat, or from beneath: no bearing, no clear check but the ground
        const h = S.heading != null ? S.heading : Math.PI, fx = Math.sin(h), fz = Math.cos(h), fov = clamp(+sh.lens || (frame === 'pov' ? 70 : 80), 12, 110), sec = clamp(+sh.sec || F.sec, 0.5, 120);
        const k = frame === 'pov' ? { pos: new THREE.Vector3(S.x + fx * S.r * 0.3, S.y0 + S.h * 0.45, S.z + fz * S.r * 0.3), tgt: new THREE.Vector3(S.x + fx * 60 * M, S.y0 + S.h * 0.45 - 6 * M, S.z + fz * 60 * M), fov }
          : { pos: new THREE.Vector3(S.x - fx * S.r * 0.2, Math.max(S.y0, groundH(S.x, S.z)) + 0.5 * M, S.z - fz * S.r * 0.2), tgt: new THREE.Vector3(S.x + fx * S.r * 0.5, S.y0 + S.h * 0.92, S.z + fz * S.r * 0.5), fov };
        k.frame = { bearing: h, asked: h, tried: 1, clear: true }; const keys = [k];
        return { name: String(sh.name || `${frame} on ${S.what}`).slice(0, 48), keys, sec, act: null, on: S.what, frame, from: sh.from || 's', move: 'hold', readout: `on ${S.what} · ${frame} · ${frame === 'pov' ? 'from its seat' : 'from beneath'}`, d: 0, clear: true };
      }
      const fov = clamp(+sh.lens || LENS[frame], 12, 110), sec = clamp(+sh.sec || F.sec, 0.5, 120), A = ASPECTS[F.aspect];
      const fovV = fov * Math.PI / 180, fovH = 2 * Math.atan(Math.tan(fovV / 2) * A), fill = FILL[frame] || 0.6;
      const hh = frame === 'close' ? Math.max(S.h * 0.15, 0.25 * M) : Math.max(S.h / 2, 0.4 * M), hw = frame === 'close' ? Math.min(S.r, 0.4 * M) : Math.max(S.r, 0.4 * M);   // half height and half width to fit; a close-up frames the head
      let d = Math.max(2 * M, hh / (fill * Math.tan(fovV / 2)), hw / (fill * Math.tan(fovH / 2)));   // far enough that the taller of the two spans fills its share of the frame
      let bear = (BEAR[String(sh.from || '').toLowerCase()] != null ? BEAR[String(sh.from).toLowerCase()] : 180) * Math.PI / 180;
      if (String(sh.from || '').toLowerCase() === 'front' && S.heading != null) bear = -S.heading + Math.PI; else if (String(sh.from || '').toLowerCase() === 'behind' && S.heading != null) bear = -S.heading;
      if (frame === 'shoulder' && W.rig) { bear = -W.rig.heading; if (String(sh.on || 'me') === 'me') d = 2.6 * M; }   // a heading h looks along (sin h, cos h); the bearing b stands the camera at (sin b, -cos b): behind the figure is b = -h
      const tgtY = S.y0 + S.h * (frame === 'wide' ? 0.45 : frame === 'close' ? 0.85 : frame === 'shoulder' ? 0.9 : 0.5);
      const pose = (dist, b, kind, raise) => {
        const k = kind || frame; let cx = S.x + Math.sin(b) * dist, cz = S.z - Math.cos(b) * dist, cy;
        if (k === 'aerial') { const el = 50 * Math.PI / 180; cx = S.x + Math.sin(b) * dist * Math.cos(el); cz = S.z - Math.cos(b) * dist * Math.cos(el); cy = S.y0 + S.h / 2 + dist * Math.sin(el); }
        else if (k === 'low') cy = groundH(cx, cz) + 0.4 * M;
        else if (k === 'shoulder') cy = S.y0 + S.h * 0.95;
        else if (k === 'close') cy = tgtY + 0.05 * S.h;
        else cy = Math.max(S.y0 + S.h * (k === 'wide' ? 0.55 : 0.5), groundH(cx, cz) + 0.6 * M);
        if (k !== 'aerial' && k !== 'low') { const g = groundH(cx, cz) + 0.5 * M; if (cy < g) cy = g; }
        if (raise) cy += raise;
        const tgt = new THREE.Vector3(S.x, tgtY, S.z); if (k === 'shoulder') { tgt.x = S.x - Math.sin(b) * 6 * M; tgt.z = S.z + Math.cos(b) * 6 * M; tgt.y = S.y0 + S.h * 0.7; }
        return { pos: new THREE.Vector3(cx, cy, cz), tgt, fov };
      };
      /** The bearing asked, then its neighbours, then the far side; if all are blocked the camera rises until it sees. */
      const clear = (dist, b, kind) => {
        const order = [0, 45, -45, 90, -90, 135, -135, 180]; let fallback = null;
        for (let i = 0; i < order.length; i++) {
          const bb = b + order[i] * Math.PI / 180, k = pose(dist, bb, kind); const inb = F.inside(k.pos, S.id), blocked = inb || F.los(k.pos, k.tgt, S);
          if (!blocked) { k.frame = { bearing: bb, asked: b, tried: i + 1, clear: true }; return k; }
          if (!fallback) fallback = { k, why: blocked };
        }
        for (let r = 1; r <= 8; r++) { const k = pose(dist, b, kind, r * Math.max(2 * M, S.h * 0.25)); if (!F.inside(k.pos, S.id) && !F.los(k.pos, k.tgt, S)) { k.frame = { bearing: b, asked: b, tried: 8 + r, clear: true, raised: r }; return k; } }
        const k = fallback.k; k.frame = { bearing: b, asked: b, tried: 16, clear: false, why: fallback.why }; return k;
      };
      const k0 = clear(d, bear), bearUsed = k0.frame.bearing, keys = [k0], move = MOVES.includes(sh.move) ? sh.move : 'hold';
      if (move === 'push') keys.push(clear(d / 2, bearUsed)); else if (move === 'pull') keys.push(clear(d * 2, bearUsed));
      else if (move === 'orbit') { keys.push(clear(d, bearUsed + Math.PI / 4)); keys.push(clear(d, bearUsed + Math.PI / 2)); }
      else if (move === 'crane') keys.push(clear(d, bearUsed, 'aerial')); else if (move === 'track') { const k2 = pose(d, bearUsed); k2.pos.x += Math.cos(bearUsed) * d * 0.6; k2.pos.z += Math.sin(bearUsed) * d * 0.6; k2.frame = { bearing: bearUsed, asked: bear, tried: 1, clear: !F.inside(k2.pos, S.id) && !F.los(k2.pos, k2.tgt, S) }; keys.push(k2); }
      let act = null; if (sh.act && sh.act.who) { const w = sh.act.walk || sh.act.drive; if (Array.isArray(w) && w.length >= 2) act = { who: 'me', kind: sh.act.drive ? 'drive' : 'walk', x: +w[0] * M, z: +w[1] * M }; else if (typeof w === 'string') { const T = F.subject(w); act = { who: 'me', kind: sh.act.drive ? 'drive' : 'walk', x: T.x, z: T.z }; } }
      const fr = k0.frame, deg = Math.round(((fr.bearing * 180 / Math.PI) % 360 + 360) % 360), asked = Math.round(((fr.asked * 180 / Math.PI) % 360 + 360) % 360);
      const readout = `on ${S.what} · ${frame} · ${(d / M).toFixed(0)} m · from ${deg}°${deg !== asked ? ` (asked ${asked}°)` : ''}${fr.raised ? ` · raised ${fr.raised}` : ''} · ${fr.clear ? 'clear' : 'blocked by ' + fr.why}`;
      return { name: String(sh.name || `${frame} on ${S.what}`).slice(0, 48), keys, sec, act, on: S.what, frame, from: sh.from || 's', move, readout, d, clear: fr.clear };
    };
    /** The same words without the model: subjects, frames, bearings, seconds and moves, one shot per clause. */
    F.parseWords = text => {
      const shots = []; let prev = null;
      for (let clause of String(text || '').split(/\bthen\b|;|\n|\.\s+(?=[A-Za-z])/i)) {
        clause = clause.trim().replace(/^(and|next|after that|finally|first|now)\s+/i, ''); if (!clause) continue;
        const low = clause.toLowerCase(), sh = { name: clause.replace(/[.,]+$/, '').slice(0, 48) };
        const bareMove = /^\s*(push|dolly|move|pull|zoom|orbit|circle|crane|rise|track|slide|pan|hold)\b/.test(low.replace(/^(the camera|camera|we|it)\s+/, '')) && !/\b(of|on|at|from)\b/.test(low);
        if (bareMove && prev) {   // "then push in, 3 seconds" is the previous shot's move, not a new shot
          prev.move = /\b(push|dolly in|move in|closer|zoom in)\b/.test(low) ? 'push' : /\b(pull|dolly out|move out|pull back|zoom out|reveal)\b/.test(low) ? 'pull' : /\b(orbit|circle|around)\b/.test(low) ? 'orbit' : /\b(crane|rise|rising|lift)\b/.test(low) ? 'crane' : /\b(track|tracking|slide|pan|sideways)\b/.test(low) ? 'track' : 'hold';
          const sec = low.match(/(\d+(?:\.\d+)?)\s*(?:s|sec|secs|seconds?)\b/); if (sec) prev.sec = +sec[1]; continue;
        }
        sh.frame = /\b(wide|establishing|long shot|far)\b/.test(low) ? 'wide' : /\b(close|close-up|closeup|tight|detail)\b/.test(low) ? 'close' : /\b(aerial|overhead|top-?down|bird|from above|drone)\b/.test(low) ? 'aerial' : /\b(low angle|low shot|from below|worm|from the ground)\b/.test(low) ? 'low' : /\b(over the shoulder|over-the-shoulder|shoulder|behind me|from behind)\b/.test(low) ? 'shoulder' : 'medium';
        const fm = low.match(/from the (north-?east|north-?west|south-?east|south-?west|north|south|east|west)\b/); sh.from = fm ? fm[1].replace('-', '').replace(/north(east|west)/, 'n$1').replace(/south(east|west)/, 's$1').replace(/^n(east)$/, 'ne').replace(/^n(west)$/, 'nw').replace(/^s(east)$/, 'se').replace(/^s(west)$/, 'sw').replace(/^north$/, 'n').replace(/^south$/, 's').replace(/^east$/, 'e').replace(/^west$/, 'w') : (/\bfrom behind\b/.test(low) ? 'behind' : 's');
        const sec = low.match(/(\d+(?:\.\d+)?)\s*(?:s|sec|secs|seconds?)\b/); sh.sec = sec ? +sec[1] : F.sec;
        const lens = low.match(/(?:lens|fov)\s*(\d+)|(\d+)\s*mm/); sh.lens = lens ? (lens[1] ? +lens[1] : Math.round(2 * Math.atan(12 / +lens[2]) * 180 / Math.PI)) : 0;
        sh.move = /\b(push|dolly in|move in|closer|zoom in)\b/.test(low) ? 'push' : /\b(pull|dolly out|move out|pull back|zoom out|reveal)\b/.test(low) ? 'pull' : /\b(orbit|circle|around)\b/.test(low) ? 'orbit' : /\b(crane|rise|rising|lift|up and away)\b/.test(low) ? 'crane' : /\b(track|tracking|slide|pan|sideways)\b/.test(low) ? 'track' : 'hold';
        const walk = low.match(/\b(?:i|me|we)?\s*(?:walk|walks|walking|run|runs|go|goes)\s+(?:to|toward|towards|up to)\s+(the\s+[\w' -]+?|[\w'-]+)(?=[,.;]|\s+(?:for|while|as|and|then)\b|$)/); if (walk) sh.act = { who: 'me', walk: walk[1].trim() };
        const drive = low.match(/\b(?:drive|drives|driving|fly|flies)\s+(?:to|toward|towards)\s+(the\s+[\w' -]+?|[\w'-]+)(?=[,.;]|\s+(?:for|while|as|and|then)\b|$)/); if (drive) sh.act = { who: 'me', drive: drive[1].trim() };
        let on = null; const of = low.match(/\b(?:of|on|at)\s+(the\s+[\w' -]+?|[\w'-]+)(?=[,.;]|\s+(?:from|for|while|as|and|then|with|in|at|over|walking|walks|walk|push|pull|orbit|crane|track|\d)|$)/);
        if (/\b(me|myself|on me|of me|the hero|vader|the player)\b/.test(low) && !(of && !/^(me|myself|the hero|the player|vader)$/.test(of[1]))) on = 'me';
        else if (of) on = of[1]; else { for (const [k, re] of Object.entries(KIT_WORDS)) if (re.test(low)) { on = k; break; } if (!on) { const tw = low.match(/\b(tower|church|stadium|cathedral|bridge|station|castle|house|building)\b/); on = tw ? 'the ' + tw[1] : 'me'; } }
        if (sh.from === 'behind') { sh.frame = sh.frame === 'medium' ? 'shoulder' : sh.frame; sh.from = 's'; }
        if (on === 'me' && prev && !/\b(me|myself|the hero|vader|the player)\b/.test(low) && !of) on = prev.on;   // a clause without a subject stays on the last one
        sh.on = on; shots.push(sh); prev = sh;
      }
      return { name: String(text || '').slice(0, 40), shots };
    };
    /** Words to a shot list: the model with the film spec and the scene, or the local parser; every shot is staged and joins the reel. */
    F.words = async (text, opts = {}) => {
      text = String(text || '').trim(); if (!text || F.busy) return null;
      F.busy = true; let plan = null, how = 'local';
      try {
        const Ai = window.Ai;
        if (!opts.local && !F.local && Ai && Ai.key()) {
          say('asking the model for a shot list', 'busy');
          try {
            const scene = F.scene(); const brief = `SCENE (metres, x east, z south): player ${JSON.stringify(scene.me)}; landmarks ${JSON.stringify(scene.landmarks)}; named buildings ${JSON.stringify(scene.buildings)}; sky ${scene.sun ? scene.sun.mode + ', night ' + scene.sun.night : 'day'}.\nFILM BRIEF: ${text}\nAnswer with the shot list as one JSON object.`;
            const r = await Ai.request(brief, { system: FILM_SPEC, stage: 'FRAMING', detail: 'a shot list', parse: raw => { let p = null; try { p = JSON.parse(raw); } catch (e) { const m = String(raw || '').match(/\{[\s\S]*\}/); if (m) try { p = JSON.parse(m[0]); } catch (x) { } } if (!p || !Array.isArray(p.shots)) throw new Error('the model did not return a shot list'); return p; }, signal: opts.signal });
            plan = r.program; how = 'model';
          } catch (e) { if (e && e.name === 'AbortError') throw e; F.log.push('model: ' + (e.message || e)); plan = null; }
        }
        if (!plan) plan = F.parseWords(text);
        const staged = plan.shots.map(sh => { try { return F.stage(sh); } catch (e) { F.log.push('stage: ' + (e.message || e)); return null; } }).filter(Boolean);
        if (!staged.length) { say('no shot in those words', 'warn'); return null; }
        const at = F.shots.length; F.shots.push(...staged); F.sel = at; changed('words');
        say(`${staged.length} shot${staged.length === 1 ? '' : 's'} from your words (${how}) · ${staged.map(s => s.name).join(' · ')}`, 'ok');
        F.setMode('shot');
        return { how, shots: staged.map(s => ({ name: s.name, on: s.on, frame: s.frame, from: s.from, move: s.move, keys: s.keys.length, sec: s.sec, act: s.act })) };
      } finally { F.busy = false; }
    };

    /* ── a film from a program: shots as words (staged when they play), titles, planets and characters ── */
    F.loadProgram = (prog, append) => {
      const shots = []; const actsOf = list => (list || []).map(a => { const o = { ...a }; if (o.to && Array.isArray(o.to)) o.to = { x: o.to[0], z: o.to[1], rel: true }, o.rel = true; if (o.to && o.to.rel) o.rel = true; if (o.aim && Array.isArray(o.aim)) o.aim = { x: o.aim[0], z: o.aim[1] }; return o; });
      const eventsOf = list => (list || []).map(e => { const o = { ...e, what: String(e.what).toUpperCase() }; if (Array.isArray(o.at)) o.at = o.at[0]; if (o.xz) { o.x = o.xz[0]; o.z = o.xz[1]; o.rel = true; delete o.xz; } return o; });
      for (const sh of (prog && prog.shots) || []) {
        const set = (sh.world || sh.as || sh.time || sh.weather) ? { world: sh.world || null, as: sh.as || null, time: sh.time || null, weather: sh.weather || null } : null;
        if (sh.title != null && !sh.on) { shots.push({ name: sh.name || sh.title.slice(0, 32), title: sh.title, style: sh.style || 'card', keys: [], sec: clamp(+sh.sec || 3, 0.5, 120), act: null, set, acts: actsOf(sh.acts), events: eventsOf(sh.events) }); continue; }
        const plan = { on: sh.on || 'me', frame: sh.frame || 'medium', from: sh.from || 's', lens: sh.lens || 0, sec: sh.sec || F.sec, move: sh.move || 'hold', name: sh.name };
        let act = null; if (sh.act) { act = { who: 'me', ...sh.act }; if (Array.isArray(act.walk)) { act.kind = 'walk'; act.x = act.walk[0] * M; act.z = act.walk[1] * M; } if (Array.isArray(act.drive)) { act.kind = 'drive'; act.x = act.drive[0] * M; act.z = act.drive[1] * M; } delete act.walk; delete act.drive; }
        const shot = { name: sh.name || `${plan.frame} on ${plan.on}`, keys: [{ pos: new THREE.Vector3(0, 4 * M, 0), tgt: new THREE.Vector3(0, 2 * M, -10 * M), fov: 50 }], sec: clamp(+sh.sec || F.sec, 0.5, 120), act, set, plan, follow: !!sh.follow, acts: actsOf(sh.acts), events: eventsOf(sh.events) };
        if (sh.title != null) { shot.title = sh.title; shot.style = sh.style || 'hud'; }
        shots.push(shot);
      }
      if (!append) { F.teardown(); F.shots = []; } F.shots.push(...shots); F.sel = F.shots.length ? (append ? F.shots.length - shots.length : 0) : -1; F.name = prog && prog.name || F.name;
      if (prog && (prog.actors || prog.builds)) { F.scene = { name: prog.name, actors: (prog.actors || []).map(a => ({ ...a, r: a.r ? a.r * M : undefined })), builds: (prog.builds || []).map(b => ({ ...b })), world: prog.world || null, as: prog.as || null, ground: prog.ground || null, weather: prog.weather || null, time: prog.time || null, abs: false }; F.setup(); }
      changed('program'); return shots.length;
    };
    F.trailer = name => { const t = TRAILERS[name || 'a-new-hope'] || SCENES[name]; if (!t) return 0; const n = F.loadProgram(t); say(`${t.name}: ${n} shots${F.scene ? ' · ' + F.scene.actors.length + ' actors' : ''} · Play previews it, Rec takes it`, 'ok'); return n; };

    /* ── what the page and the tests read ── */
    F.line = () => {
      if (F.hold && F.play.on) return `shot ${F.play.i + 1}/${F.shots.length} · ${F.hold.why}`;
      if (F.rec) { const R = F.rec; return `REC ${R.t.toFixed(1)} s · ${R.frames} frames${F.play.on && F.shots[F.play.i] ? ` · ${F.play.i + 1}/${F.shots.length} ${F.shots[F.play.i].name}` : ''}`; }
      if (F.play.on && F.shots[F.play.i]) return `shot ${F.play.i + 1}/${F.shots.length} · ${F.shots[F.play.i].name} · ${F.play.t.toFixed(1)} / ${F.shots[F.play.i].sec} s`;
      if (F.mode === 'free') return `free camera · lens ${Math.round(F.free.fov)} · left thumb dollies, right looks, pinch zooms`;
      if (F.mode === 'shot' && F.shots[F.sel]) { const s = F.shots[F.sel]; return `shot ${F.sel + 1}/${F.shots.length} · ${s.name} · ${s.keys.length > 1 ? 'a move over ' : 'held '}${s.sec} s`; }
      return '';
    };
    F.state = () => ({ mode: F.mode, sel: F.sel, n: F.shots.length, play: { ...F.play }, hold: !!F.hold, name: F.name || null, world: W.world, character: W.character, playerMode: W.mode, scene: F.scene ? F.scene.name : null, actors: F.actors.size, rec: F.rec ? { t: +F.rec.t.toFixed(3), frames: F.rec.frames, until: F.rec.until } : null, aspect: F.aspect, fps: F.fps, size: F.size, time: F.time, lights: F.lights.length, sun: F.sun ? { color: '#' + F.sun.color.getHexString(), intensity: F.sun.intensity } : null, steps: F.steps, take: F.take, busy: F.busy, status: F.status, free: { pos: F.free.pos.toArray().map(v => +v.toFixed(1)), yaw: +F.free.yaw.toFixed(3), pitch: +F.free.pitch.toFixed(3), fov: +F.free.fov.toFixed(1) },
      band: F.bandOn ? F.lastBand : null,
      shots: F.shots.map(s => ({ name: s.name, sec: s.sec, title: s.title != null ? s.title : undefined, style: s.style, set: s.set || null, plan: s.plan || null, follow: !!s.follow, readout: s.readout || null, frame: s.keys[0] && s.keys[0].frame || null, acts: s.acts || [], events: (s.events || []).map(e => ({ what: e.what, who: e.who, at: e.at })), act: s.act ? { ...s.act } : null, keys: s.keys.map(k => ({ pos: k.pos.toArray().map(v => +v.toFixed(1)), tgt: k.tgt.toArray().map(v => +v.toFixed(1)), fov: +k.fov.toFixed(1) })) })) });
    F.ASPECTS = ASPECTS; F.SIZES = SIZES; F.FRAMES = FRAMES; F.SPEC = FILM_SPEC;
    return F;
  }

  window.Film = { create, ASPECTS, SIZES, FRAMES, BEAR, MOVES, TRAILERS, SCENES, SPEC: FILM_SPEC };
})();
