/* Escape beneath the Rams (OD-B09-S10, Odyssey 9): a blind search that must miss, the four-needle coupled homeostat.

   The take's keys: K1 dawn at the door (the giant sits in the mouth; the flock goes out three abreast, a man slung under each middle
   ram), K2 the binding the night before (Odysseus binds the triads with withies; crewman-1 already under his ram), K3 the lead ram last
   with Odysseus under its belly, stopped at the door, the giant's hand on its back and his words to it (heard in Odysseus's voice),
   K4 outside (the men drop from the rams and drive the flock to the ship), K5 the great ram sacrificed on the shore.

   The timings are the needles' (tools/perform/machinery.js rams, run by homeostat.couple): the flock's pace at the door (FLOCK) decides
   when each triad passes under the hands; each pass drives the searching hands' suspicion (POLYPHEMUS) and the fear of the man
   under that ram (CREW); a man whose fear stays over its limit shifts (a STIR the giant hears); the giant's hands feel lower as his
   needle rises (the grope's height is written from it), and over its limit with a man under the hand for half a second they find
   him: DETECTED. Under the lead ram Odysseus's hold (ODYSSEUS) tires; below its limit for a second his foot drops (a SLIP). The ram is
   let go when the giant's words are over and his needle is calm. Variants: X.variant 'grip-slips' (the wool gives under his hands at
   38 s), X.frozen (the uniselectors held: the search is not regulated and the escape fails where the needles say). */
'use strict';
const Ho = require('../homeostat.js'), Ma = require('../machinery.js'), Ic = require('../intents-creature.js'), Ground = require('../ground.js');
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), T = M.total, q = t => Math.round(t * 12) / 12, sc = M.scale || 1;
  const K1 = K('K1'), K2 = K('K2'), K3 = K('K3'), K4 = K('K4'), K5 = K('K5');
  const sw = k => (k === K1 ? 0 : k.win ? q((k.win[0] + k.win[1]) / 2) : q(k.t)), s1 = sw(K1), s2 = sw(K2), s3 = sw(K3), s4 = sw(K4), s5 = sw(K5);
  const variant = X.variant || null, frozen = !!X.frozen;
  const clip = M.clips.find(c => c.gi === 4) || M.clips.find(c => c.kind === 'DIALOGUE'), V = clip ? X.voiceOf(clip) : { words: [], phrases: [] };
  const sweet = V.words.find(w => w.w === 'sweet'), lastW = V.words.filter(w => w.w === 'last').pop();
  const quoteAt = [q(sweet ? sweet.t - 0.2 : s3 + 6), q(clip ? clip.at + clip.dur : s3 + 20)];
  const O = 'odysseus', men = ['crewman-1', 'crewman-2', 'crewman-3', 'crewman-4', 'crewman-5', 'crewman-6'], G = 'polyphemus';
  /* the flock at the door: six triads three abreast, a man under each middle ram (the K1 blocking's order); the lane runs out toward +z */
  const teams = [1, 2, 3, 4, 5, 6], abreast = ['a', 'b', 'c'], rs = 1.6 * sc, lead = 'lead', gs = 1.5 * sc;
  const doorZ = 40, laneX = 30, gAt = [-75, 40];
  const spacing = Math.round(82 * rs), gap = Math.round(34 * rs / 1.12);   /* a ram's length between rows; three abreast as the take stages them */
  const herdPath0 = [[laneX, -10], [laneX, 60], [laneX + 10, doorZ + 6 * spacing + 160]];
  const lW1t0 = q(K3.win ? K3.win[0] : s3 - 2), stopAt = q(Math.max(lW1t0 + 6, s3 + 2));   /* the heavy ram's walk from the pen to the door (about 250 units) */
  const spec = Ma.rams({ total: T, K1: [s1 + 0.6, s2], K3: [s3, s4], door: (doorZ - (-10)) , back0: 0, spacing, rows: 6, riders: [1, 1, 1, 1, 1, 1], v0: 44, quoteAt, lastAt: lastW ? q(lastW.t) : null, stopAt, disturb: variant });
  const run = Ho.couple(spec, { frozen }), c = run.events;
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id), S_ = o => (stimuli.push(o), o.id), gi = o => (intents.push({ actor: G, ...o }), o.id);
  const needle = (id, t, unit, label, because) => S_({ id, t0: q(t), t1: q(t) + 0.3, kind: 'NEEDLE', label: unit + ': ' + label, because: because || [], params: { unit } });

  /* ── the needles' events as stimuli ── */
  if (clip) S_({ id: 'sWords', t0: clip.at, t1: clip.at + clip.dur, kind: 'VOICE', label: 'Odysseus tells it: "I hung beneath his belly... Sweet ram, why last from the cave today?"', because: [{ id: 'v' + clip.gi, rel: 'realises' }] });
  if (sweet) S_({ id: 'sSweet', t0: q(sweet.t), t1: q(sweet.t) + 0.3, kind: 'WORD', label: '"Sweet ram": the giant\'s words to his ram', because: [{ id: 'sWords' }] });
  if (lastW) S_({ id: 'sLast', t0: q(lastW.t), t1: q(lastW.t) + 0.3, kind: 'WORD', label: '"why last?" (his suspicion, a blow to his needle)', because: [{ id: 'sWords' }] });
  S_({ id: 'sDawn', t0: s1, t1: s1 + 0.5, kind: 'SCENE', label: 'dawn: the flock must go out to pasture past his hands', because: [] });
  c.passes.forEach((p, k) => S_({ id: 'sPass' + k, t0: q(p.t), t1: q(p.t) + 0.6, kind: 'CONTACT', label: 'triad ' + (p.row + 1) + ' under the hands at the door (FLOCK: its pace)' + (p.rider ? ': ' + men[p.row] + ' beneath the middle ram' : ''), because: [{ id: k ? 'sPass' + (k - 1) : 'sDawn' }] }));
  c.stirs.forEach((s, k) => needle('sStir' + k, s.t, 'CREW', 'over 0.6 for half a second: ' + men[s.row] + ' shifts under his ram', [{ id: 'sPass' + Math.max(0, c.passes.findIndex(p => p.row === s.row)) }]));
  for (const st of run.steps) S_({ id: 'sStep' + st.unit + Math.round(st.t * 12), t0: q(st.t), t1: q(st.t) + 0.2, kind: 'UNISELECTOR', label: st.unit + ' out of its limits ' + JSON.stringify(st.limits) + ' past its dwell: the uniselector steps to position ' + st.position + ' (new wiring ' + JSON.stringify(st.row.map(v => Math.round(v * 100) / 100)) + ')', because: [] });
  if (variant === 'grip-slips') S_({ id: 'sWool', t0: 38, t1: 38.4, kind: 'TOUCH', label: 'the wool gives under his hands (the disturbance)', because: [] });
  if (c.slip) needle('sSlip', c.slip, 'ODYSSEUS', 'under -0.5 for a second: a foot drops from the fleece', variant === 'grip-slips' ? [{ id: 'sWool' }] : []);
  if (c.detected) needle('sFound', c.detected, 'POLYPHEMUS', 'over 0.55 for half a second with a man under the hand: the fingers go down the flank and find him', c.stirs.length ? [{ id: 'sStir' + (c.stirs.length - 1) }] : c.slip ? [{ id: 'sSlip' }] : []);
  if (c.release) needle('sRelease', c.release, 'POLYPHEMUS', c.release >= quoteAt[1] - 0.05 && c.release < s4 - 2.6 ? 'calm, the words over: he lets the ram go' : 'the ram let go before the cut outside', [{ id: sweet ? 'sSweet' : 'sWords' }]);

  /* ── the giant: seated in the mouth (the take's sprawl prop in the door is the rig's sit), the stone, the search ── */
  const gFloor = Ground.at(M, gAt[0], gAt[1]).y, gPlace = Ic.placeAt('polyphemus', gs, 'sit', { center: gAt, y: gFloor, h: Math.PI / 2 }), gp = gPlace.at;
  gi({ id: 'gStone', kind: 'MOVE_STONE', t0: s1 + 0.2, t1: s1 + 2.2, target: [gAt[0] + 40, 70 * sc, gAt[1] + 30], label: 'rolls the stone from the door', params: { to: [gAt[0] + 40, gAt[1] + 110], object: 'door-stone' }, because: [{ id: 'sDawn' }] });
  /* the grope, in segments: each half second the hands' height over the backs is the needle's (a suspicious hand feels lower) */
  const backY = rs * 50 + 2, flank = rs * 20, xP = t => run.x[1][Math.min(run.x[1].length - 1, Math.round(t * run.hz))];
  const gropeSeg = (t0, t1, cause, id, center) => { let k = 0; for (let t = t0; t < t1 - 0.05; t += 0.5, k++) { const P = xP(t), dip = Math.max(0, P) * flank;
    gi({ id: id + k, kind: 'GROPE', t0: q(t), t1: q(Math.min(t1, t + 0.5)), label: k ? 'the hands along the backs' + (dip > 1 ? ' (lower: ' + (dip / flank * 100).toFixed(0) + '% down the flank)' : '') : 'the hands out over the lane', params: { center: [center[0], backY - dip, center[1]], width: 110 * sc, depth: 26 * sc, period: 2.8, seed: 3, hover: 8 }, because: [{ id: k ? id + (k - 1) : cause }] }); } };
  gropeSeg(s1 + 2.2, s2 - 0.1, 'gStone', 'gGrope', [laneX, doorZ]);
  /* the flock: eighteen rams in six triads (a herd: one path, formation three abreast), present in K1; team 1 and 2 again in K2 */
  const ramIds = []; const pace = c.sLog, pathK1 = []; for (const [t, sArc] of pace) { let d = sArc, p = [herdPath0[0][0], herdPath0[0][1]]; for (let i = 1; i < herdPath0.length; i++) { const a = herdPath0[i - 1], b = herdPath0[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (d <= L) { p = [a[0] + (b[0] - a[0]) * d / L, a[1] + (b[1] - a[1]) * d / L]; d = -1; break; } d -= L; p = b; } pathK1.push([t, Math.round(p[0] * 100) / 100, Math.round(p[1] * 100) / 100, 'linear']); }
  const pathH = pathK1.length > 1 ? [[0, herdPath0[0][0], herdPath0[0][1]], ...pathK1.filter(x => x[0] > 0.05)] : [[0, laneX, -10], [s2, laneX, 400]];
  const creatures = { [G]: { kind: 'polyphemus', scale: gs, at: gp, floor: gPlace.floor, present: [[0, s2], [s3, s4]], procs: [{ type: 'preset', name: 'sit', from: 0, to: T, fade: 0 }] } };
  const K2pos = { 'team1-a': [-14, -120], 'team1-b': [20, -120], 'team1-c': [54, -120], 'team2-a': [76, -120], 'team2-b': [110, -120], 'team2-c': [144, -120] };
  teams.forEach((n, r) => abreast.forEach((ab, col) => { const id = 'team' + n + '-' + ab, idx = r * 3 + col, fl = Ground.at(M, laneX, 0).y;
    const pres = [[0, s2]]; if (K2pos[id]) pres.push([s2, s3]);
    creatures[id] = { kind: 'ram', scale: rs, colour: (idx % 5 === 2) ? 'black' : 'white', at: [laneX, fl, -10, 0], floor: fl, present: pres, procs: [] };
    ramIds.push(id);
    intents.push({ id: 'rH' + idx, actor: id, kind: 'HERD', t0: s1, t1: s2, label: 'out past the hands, three abreast', params: { path: pathH, n: 18, index: idx, abreast: 3, gap, spacing, spread: 0.12, gait: [[0, 'walk'], [s1 + 2, 'trot']], seed: 5, separation: Math.round(gap * 0.85), speed: 90 }, because: [{ id: 'sDawn' }] });
    if (K2pos[id]) { const [x, z] = K2pos[id], y = Ground.at(M, x, z).y; creatures[id].channels = { 'root.x@span': [[s2, x, 'step'], [s3, x, 'step']], 'root.z@span': [[s2, z, 'step'], [s3, z, 'step']], 'root.y@span': [[s2, y, 'step'], [s3, y, 'step']], 'root.h@span': [[s2, 0, 'step'], [s3, 0, 'step']] };
      intents.push({ id: 'rG' + idx, actor: id, kind: 'GRAZE', t0: s2 + 0.5 + 0.3 * col, t1: s3 - 0.3, label: 'stands to be bound, the head down', because: [{ id: 'sBind' }] }); } }));
  /* the men under the middle rams: riders (belly, face up) from the start to the end of K1; crewman-1 again in K2 */
  teams.forEach((n, r) => { const ram = 'team' + n + '-b', man = men[r]; const win = [[s1, s2 - 0.05]]; if (n === 1) win.push([s2, s3 - 0.05]);
    win.forEach(([a, b], j) => intents.push({ id: 'rC' + r + '_' + j, actor: ram, kind: 'CARRY', t0: a, t1: b, label: man + ' slung beneath, hands in the wool', params: { riders: [{ actor: man, at: 'belly', lie: 'under', offset: [0, 2, 0] }] }, because: [{ id: j ? 'sBind' : 'sDawn' }] }));
    I({ id: 'iCl' + r, actor: man, kind: 'CLING', t0: s1 + 0.3, t1: s2 - 0.1, label: 'hands in the fleece', because: [{ id: 'rC' + r + '_0' }] });
    holds.push({ id: 'hB' + r, actor: man, t0: s1 + 0.4, t1: s2 - 0.1, reason: 'the breath held under the ram: the giant\'s hands overhead', params: { weight: false, still: true }, because: [{ id: 'rC' + r + '_0' }] }); });
  c.stirs.forEach((s, k) => { const man = men[s.row]; I({ id: 'iStir' + k, actor: man, kind: 'REACT', t0: q(s.t), t1: q(s.t) + 0.9, label: 'shifts his grip: the fear over its limit', params: { how: 'flinch', lookAt: G }, because: [{ id: 'sStir' + k }] });
    gi({ id: 'gHear' + k, kind: 'ATTEND', t0: q(s.t) + 0.25, t1: q(s.t) + 2.2, target: [laneX, backY, doorZ], label: 'a sound under the flock: the head turned to it', because: [{ id: 'sStir' + k }] }); });
  /* Odysseus at K1 watches the file from inside, the hush when the fear rises */
  holds.push({ id: 'hO1', actor: O, t0: s1 + 0.3, t1: s2 - 0.1, reason: 'watches each triad go out under the hands, last in the cave with the lead ram', params: { look: [[G, 2.2], [[laneX, 40, doorZ], 1.4]], weight: true }, because: [{ id: 'sDawn' }] });
  c.stirs.forEach((s, k) => I({ id: 'iHush' + k, actor: O, kind: 'SIGNAL', t0: q(s.t) + 0.3, t1: q(s.t) + 1.8, label: 'hush: still', params: { how: 'hush', to: [men[s.row]], lookAt: men[s.row], side: 'L' }, because: [{ id: 'sStir' + k }] }));
  if (c.detected && c.detected < s2) { const pr = c.passes.filter(p => p.rider && p.t <= c.detected + 0.2).pop(), man = men[pr ? pr.row : 0];
    gi({ id: 'gFind', kind: 'REACH', t0: q(c.detected), t1: q(c.detected) + 1.4, target: man, label: 'the fingers down the flank: a man', params: { hand: 'R' }, because: [{ id: 'sFound' }] });
    gi({ id: 'gRoarF', kind: 'ROAR', t0: q(c.detected) + 1.0, t1: q(c.detected) + 3.4, label: 'found: the roar', params: {}, because: [{ id: 'gFind' }] });
    I({ id: 'iFound', actor: man, kind: 'STRUGGLE', t0: q(c.detected) + 0.4, t1: q(c.detected) + 3, label: 'found under the ram', because: [{ id: 'sFound' }] }); }

  /* ── K2, the night before: the binding ── */
  S_({ id: 'sBind', t0: s2, t1: s2 + 0.3, kind: 'SCENE', label: 'night: the plan: three rams abreast, a man under the middle one, bound with the giant\'s own withies', because: [] });
  I({ id: 'iBind', actor: O, kind: 'ROPE', t0: s2 + 0.8, t1: Math.min(s3 - 1, s2 + 9), label: 'binds the triad with withies', params: { how: 'bind', at: 'crewman-1' }, because: [{ id: 'sBind' }] });
  I({ id: 'iHelp', actor: 'crewman-2', kind: 'ROPE', t0: s2 + 1.2, t1: Math.min(s3 - 1, s2 + 8), label: 'holds the rams, passes the withies', params: { how: 'haul' }, because: [{ id: 'iBind' }] });
  holds.push({ id: 'hC1', actor: 'crewman-1', t0: s2 + 0.3, t1: s3 - 0.2, reason: 'slung under the middle ram, waiting to be bound fast', params: { weight: false, still: true }, because: [{ id: 'sBind' }] });

  /* ── K3: the lead ram last, Odysseus beneath; stopped; the hand on its back; the words; let go ── */
  const leadFrom = [-40, -200], leadAt = [20, 40], leadOut = [110, 130], release = c.release || s4 - 2.5;
  const lfl = Ground.at(M, leadAt[0], leadAt[1]).y, ls = 2.6 * sc;
  creatures[lead] = { kind: 'ram', scale: ls, colour: 'white', at: [leadAt[0], lfl, leadAt[1], 0], floor: lfl, present: [[s2, T + 1]], procs: [] };
  S_({ id: 'sLead', t0: lW1t0, t1: lW1t0 + 0.4, kind: 'SCENE', label: 'last of all the great ram, slow under its weight: Odysseus beneath it', because: [{ id: 'sPass' + Math.max(0, c.passes.length - 1) }] });
  intents.push({ id: 'lW1', actor: lead, kind: 'WALK', t0: lW1t0, t1: stopAt, label: 'last to the door, heavy with the man beneath', params: { path: [[lW1t0, leadFrom[0], leadFrom[1]], [stopAt, leadAt[0], leadAt[1]]], gait: 'walk' }, because: [{ id: 'sLead' }] });
  intents.push({ id: 'lC', actor: lead, kind: 'CARRY', t0: s3, t1: s4 - 0.1, label: 'Odysseus under the belly, hands in the fleece', params: { riders: [{ actor: O, at: 'belly', lie: 'under', offset: [0, 2, 0] }] }, because: [{ id: 'sLead' }] });
  gi({ id: 'gStop', kind: 'REACH', t0: stopAt - 0.3, t1: stopAt + 1.4, target: [leadAt[0], ls * 62, leadAt[1] - 10], label: 'stops the ram: a hand on its head', params: { hand: 'R' }, because: [{ id: 'lW1' }] });
  gi({ id: 'gCaress', kind: 'CARESS', t0: stopAt + 1.2, t1: release - 0.2, target: lead, label: 'the hand along his ram\'s back, a hand-width over Odysseus', params: { hand: 'R', anchor: 'back', strokes: Math.max(3, Math.round((release - stopAt) / 2.4)) }, because: [{ id: 'gStop' }] });
  if (clip && sweet) { const phr = V.phrases.filter(p => p.t1 > sweet.t - 0.1), jaw = [[q(sweet.t) - 0.3, 0]]; for (const p of phr) jaw.push([q(Math.max(p.t0, sweet.t - 0.1)), 0.05], [q(Math.max(p.t0, sweet.t) + 0.12), 0.3], [q((p.t0 + p.t1) / 2), 0.12], [q(p.t1 - 0.1), 0.26], [q(p.t1), 0.02]);
    creatures[G].channels = Object.assign(creatures[G].channels || {}, { 'jaw@words': jaw.sort((a, b) => a[0] - b[0]).filter((x, i, a) => !i || x[0] > a[i - 1][0]) });
    gi({ id: 'gWords', kind: 'ATTEND', t0: q(sweet.t) + 0.1, t1: quoteAt[1], target: lead, label: 'his face to the ram as he speaks to it (the jaw on the quoted words)', because: [{ id: 'sSweet' }] }); }
  if (lastW) gi({ id: 'gWhy', kind: 'ATTEND', t0: q(lastW.t) + 0.1, t1: q(lastW.t) + 2.4, target: [leadAt[0], ls * 30, leadAt[1]], label: 'why last? the face down toward the belly', because: [{ id: 'sLast' }] });
  holds.push({ id: 'hO3', actor: O, t0: s3 + 0.4, t1: release, reason: 'under the ram, the breath held: the giant\'s hand passes over the fleece above him', params: { weight: false, still: true }, because: [{ id: 'lC' }] });
  I({ id: 'iCling', actor: O, kind: 'CLING', t0: s3 + 0.3, t1: s4 - 0.2, label: 'the fleece held, the body pressed up to the belly', because: [{ id: 'lC' }] });
  if (variant === 'grip-slips') I({ id: 'iRegrip', actor: O, kind: 'STRAIN', t0: 38.2, t1: c.slip ? c.slip + 1.2 : 40.8, label: 'the wool gives: he takes it again', because: [{ id: 'sWool' }] });
  if (c.slip) { I({ id: 'iFoot', actor: O, kind: 'REACT', t0: q(c.slip), t1: q(c.slip) + 1.0, label: 'a foot drops from the fleece and is drawn up again', params: { how: 'startle', lookAt: G }, because: [{ id: 'sSlip' }] });
    gi({ id: 'gPause', kind: 'ATTEND', t0: q(c.slip) + 0.2, t1: q(c.slip) + 2.2, target: [leadAt[0], ls * 20, leadAt[1]], label: 'the hand stops; the head turns down', because: [{ id: 'sSlip' }] }); }
  for (const st of run.steps.filter(s => s.unit === 'ODYSSEUS')) I({ id: 'iSteadyO' + Math.round(st.t * 12), actor: O, kind: 'STRAIN', t0: q(st.t) + 0.1, t1: q(st.t) + 1.2, label: 'finds a new hold (his uniselector steps)', because: [{ id: 'sStep' + st.unit + Math.round(st.t * 12) }] });
  if (c.detected && c.detected >= s3) { gi({ id: 'gFind3', kind: 'SEIZE', t0: q(c.detected), t1: s4 - 0.2, target: O, label: 'the hand down the flank: Nobody', params: { hand: 'R', lift: 80 }, because: [{ id: 'sFound' }] });
    I({ id: 'iFound3', actor: O, kind: 'STRUGGLE', t0: q(c.detected) + 0.5, t1: s4 - 0.3, label: 'torn from under the ram', because: [{ id: 'sFound' }] }); }
  else intents.push({ id: 'lW2', actor: lead, kind: 'WALK', t0: q(release), t1: s4 - 0.1, label: 'let go: out into the light, the man still beneath', params: { path: [[q(release), leadAt[0], leadAt[1]], [s4 - 0.1, leadOut[0], leadOut[1]]], gait: 'walk' }, because: [{ id: 'sRelease' }] });
  gropeSeg(release + 0.3, s4 - 0.1, c.release ? 'sRelease' : 'gCaress', 'gGrope3', [laneX, doorZ]);

  /* ── K4 outside: the men drop from the rams and drive the flock down to the ship ── */
  S_({ id: 'sOut', t0: s4, t1: s4 + 0.4, kind: 'SCENE', label: 'outside: clear of the cave, the men drop from the rams', because: [{ id: c.release ? 'sRelease' : 'sLead' }] });
  const shipDir = [-200, 230], flock = ['f0', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7'], K4pos = { f0: [-10, 150], f1: [30, 165], f2: [70, 150], f3: [0, 200], f4: [40, 215], f5: [80, 200], f6: [20, 250], f7: [60, 260] }, K5pos = { f0: [220, 140], f1: [250, 190], f2: [-10, 125], f3: [25, 112] };
  flock.forEach((f, j) => { const [x, z] = K4pos[f], y = Ground.at(M, x, z).y, dx = shipDir[0] - x, dz = shipDir[1] - z, L = Math.hypot(dx, dz), go = 60 + 6 * j;
    creatures[f] = { kind: 'ram', scale: rs, colour: j % 3 === 0 ? 'black' : 'white', at: [x, y, z, Math.atan2(dx, dz)], floor: y, present: K5pos[f] ? [[s4, T + 1]] : [[s4, s5]], procs: [] };
    intents.push({ id: 'fW' + j, actor: f, kind: 'WALK', t0: s4 + 1.2 + 0.25 * j, t1: s5 - 0.2, label: 'driven down to the ship', params: { path: [[s4 + 1.2 + 0.25 * j, x, z], [s5 - 0.2, x + dx / L * go, z + dz / L * go]], gait: 'walk' }, because: [{ id: 'iDrive' }] });
    if (K5pos[f]) { const [x5, z5] = K5pos[f], y5 = Ground.at(M, x5, z5).y; creatures[f].channels = { 'root.x@span': [[s5, x5, 'step'], [T + 1, x5, 'step']], 'root.z@span': [[s5, z5, 'step'], [T + 1, z5, 'step']], 'root.y@span': [[s5, y5, 'step'], [T + 1, y5, 'step']], 'root.h@span': [[s5, 1.2, 'step'], [T + 1, 1.2, 'step']] };
      intents.push({ id: 'fG' + j, actor: f, kind: 'GRAZE', t0: s5 + 0.4, t1: T, label: 'divided among the ships', because: [{ id: 'sDivide' }] }); } });
  I({ id: 'iDrive', actor: O, kind: 'HERD', t0: s4 + 0.6, t1: s5 - 0.3, label: 'drives them on to the ship, looking back at the cave', params: {}, because: [{ id: 'sOut' }] });
  men.forEach((m, k) => { I({ id: 'iDrop' + k, actor: m, kind: 'POSTURE', t0: s4 + 0.1 + 0.15 * k, t1: s4 + 1.2 + 0.15 * k, label: 'drops from under the ram, onto his feet', params: { to: 'crouch', leave: 0.5 }, because: [{ id: 'sOut' }] });
    I({ id: 'iHerd' + k, actor: m, kind: 'HERD', t0: s4 + 1.4 + 0.2 * k, t1: s5 - 0.3, label: 'on, on: to the ship', params: {}, because: [{ id: 'iDrive' }] }); });
  /* the great ram lies on its side on the shore (K5): the sacrifice to Zeus */
  S_({ id: 'sDivide', t0: s5, t1: s5 + 0.4, kind: 'SCENE', label: 'the flock divided; the great ram to Zeus', because: [{ id: 'sOut' }] });
  const l5 = [110, 200], ly5 = Ground.at(M, l5[0], l5[1]).y;
  /* the lead ram's places the take gives it: K2 inside by the pen, K4 outside, K5 on its side at the altar (span lanes: held only there) */
  const span = (c0, a, b, v) => [[a, v, 'step'], [b, v, 'step']], ly2 = Ground.at(M, leadFrom[0], leadFrom[1]).y, ly4 = Ground.at(M, leadOut[0], leadOut[1]).y;
  creatures[lead].channels = { 'root.x@k2': span(0, s2, lW1t0, leadFrom[0]), 'root.z@k2': span(0, s2, lW1t0, leadFrom[1]), 'root.y@k2': span(0, s2, lW1t0, ly2),
    'root.x@k4': span(0, s4, s5, leadOut[0]), 'root.z@k4': span(0, s4, s5, leadOut[1]), 'root.y@k4': span(0, s4, s5, ly4), 'root.h@k4': span(0, s4, s5, 0.4),
    'root.x@k5': span(0, s5, T + 1, l5[0]), 'root.z@k5': span(0, s5, T + 1, l5[1]), 'root.y@k5': span(0, s5, T + 1, ly5), 'root.roll@k5': [[s5, 0, 'step'], [s5 + 0.5, 1.45], [T + 1, 1.45]] };
  intents.push({ id: 'lK5', actor: lead, kind: 'POSE', t0: s5, t1: T, label: 'on its side at the altar', params: { preset: 'lie', fade: 0.3 }, because: [{ id: 'sDivide' }] });
  I({ id: 'iSac', actor: O, kind: 'SACRIFICE', t0: s5 + 0.8, t1: Math.min(T - 0.5, s5 + 6), label: 'the great ram to Zeus', params: { victim: 'the lead ram' }, because: [{ id: 'sDivide' }] });
  men.forEach((m, k) => holds.push({ id: 'hS' + k, actor: m, t0: s5 + 0.4, t1: T, reason: 'watching the offering', params: { look: [[O, 2.4], [lead, 1.6]], offset: 0.3 * k }, because: [{ id: 'sDivide' }] }));

  /* the coupled model's needles on the giant as his heat (his suspicion), the causal model */
  const sourceSeries = []; for (let i = 0; i < Math.floor(T * 12); i++) { const v = xP(i / 12); sourceSeries.push(Math.round(Math.max(0, v + 0.3) * 2.2 * 1000) / 1000); }
  const dead = c.detected != null;
  return {
    type: 'escape', title: 'Escape beneath the Rams' + (variant || frozen ? ' (' + (variant || 'baseline') + (frozen ? ', uniselectors held' : ', regulated') + ')' : ''),
    actors: { [O]: { role: 'the leader, under the lead ram', body: 'minifig', principal: true }, ...Object.fromEntries(men.map(m => [m, { role: 'a man under a ram', body: 'minifig', group: 'crew' }])), [G]: { role: 'the blind giant at the door (a rig: his body is the POLYPHEMUS needle)', body: 'prop' } },
    objects: { [G]: { kind: 'giant', material: 'flesh', at: [gAt[0], 120 * sc, gAt[1]], sourceSeries, affords: ['search', 'stop', 'seize'] }, [lead]: { kind: 'animal', material: 'flesh', at: [leadAt[0], 40, leadAt[1]], affords: ['hide under', 'sacrifice'] },
      'door-stone': { kind: 'door', material: 'stone', at: [gAt[0] + 40, 60, gAt[1] + 30], exit: true, affords: ['block the way out'] } },
    authored: { intents, holds, stimuli, creatures, goals: { [O]: 'out under the ram without a sound', [G]: 'let no man out with the flock' },
      couplings: [{ from: G, to: lead, via: 'flesh', t0: stopAt, t1: release }, { from: lead, to: O, via: 'flesh', t0: s3, t1: s4 }],
      coupled: { variant, frozen, units: run.units, hz: run.hz, x: run.x, drives: run.drives, W0: run.W0, W: run.W, steps: run.steps, events: { passes: c.passes, stirs: c.stirs, slip: c.slip, detected: c.detected, release: c.release }, model: 'tools/perform/machinery.js rams', failed: dead },
      causal: { tau: 0.7, actions: {
        [O]: [{ a: 'hold still', base: 1.0, f: { 'threat:polyphemus': 0.8, 'after:sLead': 0.6 } }, { a: 'hush the men', base: -1.8, f: { 'threat:polyphemus': 1.2, ...(c.stirs.length ? { 'after:sStir0': 1.5 } : {}) } },
          { a: 'bind the rams', base: -1.5, f: { 'after:sBind': 2.5, 'after:sLead': -3 } }, { a: 'let go and run', base: -3.2, f: { 'threat:polyphemus': 1.4 } }, { a: 'drive the flock', base: -3, f: { 'after:sOut': 4.0 } }, { a: 'sacrifice', base: -3, f: { 'after:sDivide': 4.5 } }],
        ...Object.fromEntries(men.map((m, r) => { const k = c.passes.findIndex(p => p.row === r), nxt = c.passes.findIndex(p => p.row === r + 1);
          return [m, [{ a: 'hold the breath', base: 0.8, f: { 'threat:polyphemus': 0.9 } }, { a: 'shift the grip', base: -2.0, f: { 'threat:polyphemus': 1.3 } }, { a: 'let go', base: -3.2, f: { 'threat:polyphemus': 1.0 } },
            ...(k >= 0 ? [{ a: 'go still as the hands pass over', base: -2.4, f: { ['after:sPass' + k]: 3.2, ...(nxt >= 0 ? { ['after:sPass' + nxt]: -3.2 } : {}) } }, { a: 'look back at the door', base: -2.6, f: { ['after:sPass' + k]: 1.6, 'after:sBind': 0 } }] : []),
            { a: 'look to Odysseus', base: -1.6, f: { ['sees:' + O]: -0.8, 'speaking:odysseus': 1.2 } }, { a: 'drive the flock', base: -3, f: { 'after:sOut': 4.0 } }]]; })) } } },
  };
};
