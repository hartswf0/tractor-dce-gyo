/* tools/perform/hardware.js — the same score, from animatic to animation to stop-motion to animatronic.

   posesheet(): a stop-motion pose sheet: every drawing on twos (12 a second: each drawing held for two frames at 24), each figure's
     every joint in degrees as the animator sets it on the toy (root in studs and plates, heading, the waist, the neck, both shoulders
     and their roll, both wrists, both hips), what each hand holds (the props' ownership at that drawing), the contacts in force, the
     figure's performance state (ACTION / REACTION / ALIVE HOLD / authored HOLD / DEAD) and why it moves (the score's causal chain).
   servo(): a motion-control timeline for a servo-driven puppet of the same figure: per channel, per drawing where it moves (and where
     it stops): time, angle, velocity, the joint's limits, and an estimated electrical power from a stated model:
       a figure 0.30 m tall; segment mass and lever: arm 0.05 kg at 0.06 m, head 0.08 kg at 0.03 m, torso 0.40 kg at 0.08 m, leg
       0.10 kg at 0.07 m; torque = m g r |sin(angle from hanging)| + (m r^2 / 3) x angular acceleration; mechanical power = torque x
       angular velocity; electrical power ~ mechanical / 0.5 efficiency + 2.0 W per (N m)^2 of holding torque (I^2 R).
   On a physical rig the engine's measures could be calibrated: encoder velocity gives each joint's angular velocity (the motion heat
   T_m's input), an IMU on the torso gives the root's acceleration, V x I at each driver gives the electrical power, and a thermistor on
   each motor gives its winding temperature: a first-order response to I^2 R, the same form as T_m (power integrated with a time
   constant). None of that is measured here; the power column is the model's estimate. */
'use strict';
const Body = require('./body.js'), Choreo = require('../../film-readymades/choreo.js'), Score = require('./score.js');
const DEG = 180 / Math.PI, r1 = v => Math.round(v * 10) / 10, r3 = v => Math.round(v * 1000) / 1000;
const SEG = { arm: { m: 0.05, r: 0.06 }, head: { m: 0.08, r: 0.03 }, torso: { m: 0.40, r: 0.08 }, leg: { m: 0.10, r: 0.07 } };
const JOINT = [['root.h', P => P.rot[1], null], ['root.pitch', P => P.rot[0], null], ['root.roll', P => P.rot[2], null],
  ['torso.lean', P => P.j.torsoP[0], 'torso'], ['torso.twist', P => -P.j.torsoP[1], 'torso'], ['torso.roll', P => -P.j.torsoP[2], 'torso'], ['head.yaw', P => -P.j.headP[1], 'head'], ['head.pitch', P => P.j.headP[0], 'head'],
  ['arm.R.pitch', P => P.j.armRP[0], 'arm'], ['arm.R.out', P => -P.j.armRP[2], 'arm'], ['arm.L.pitch', P => P.j.armLP[0], 'arm'], ['arm.L.out', P => P.j.armLP[2], 'arm'],
  ['hand.R.roll', P => P.hand.R, null], ['hand.L.roll', P => P.hand.L, null], ['leg.R.pitch', P => P.j.legRP[0], 'leg'], ['leg.L.pitch', P => P.j.legLP[0], 'leg']];
function posesheet(M, C, S, o = {}) {
  const ctx = Body.context(M, C), E = Score.Events(S.events || []), n = Math.floor(M.total * 12 + 1e-6), who = o.actors || Object.entries(S.actors || {}).filter(([, a]) => a.principal).map(([k]) => k);
  const states = (o.states) || {}, stud = 20 * (M.scale || 1), plate = 8 * (M.scale || 1), rows = [];
  const head = ['drawing', 'frames', 't', 'actor', 'state', 'x_studs', 'y_plates', 'z_studs', 'heading', 'pitch', 'roll', 'hips_plates', ...JOINT.slice(3).map(j => j[0]), 'holds_R', 'holds_L', 'contacts', 'why'];
  for (let i = 0; i < n; i++) { const t = i / 12, own = Choreo.propsAt(C, t).own;
    for (const id of who) { const P = Body.poseAt(ctx, id, t); if (!P || !P.vis) continue;
      const hold = sd => { const tag = id + ':' + sd; for (const [from, to] of Object.entries(own)) if (to === tag) return from.split(':')[0] + ' ' + from.split(':')[1]; const obj = Object.entries(S.objects || {}).find(([, ob]) => ob.holder === tag && !own[tag]); return obj ? obj[0] : ''; };
      const con = E.list.filter(e => e.lane === 'CONTACT' && t >= e.t0 && t <= e.t1 && (e.actor === id || (e.actors || []).includes(id))).map(e => e.kind + ':' + (e.actors || [e.actor]).filter(x => x !== id).map(Score.short).join('+')).join(' ');
      const w = E.why(id, t);
      rows.push([i, (2 * i + 1) + '-' + (2 * i + 2), r3(t), id, (states[id] || '')[i] || '', r1(P.p[0] / stud), r1(P.p[1] / plate), r1(P.p[2] / stud), r1(P.rot[1] * DEG), r1(P.rot[0] * DEG), r1(P.rot[2] * DEG), r1(P.hipsDy / 8),
        ...JOINT.slice(3).map(([, f]) => r1(f(P) * DEG)), hold('R'), hold('L'), con, (w.chain[0] ? w.chain.slice(0, 3).map(c => c.kind).join(' / ') : '')]); } }
  return { head, rows };
}
function servo(M, C, S, o = {}) {
  const ctx = Body.context(M, C), n = Math.floor(M.total * 12 + 1e-6), who = o.actors || Object.entries(S.actors || {}).filter(([, a]) => a.principal).map(([k]) => k), dt = 1 / 12, g = 9.81, rows = [];
  const head = ['actor', 'channel', 't', 'angle_deg', 'velocity_deg_s', 'limit_lo_deg', 'limit_hi_deg', 'torque_Nm', 'power_W_est'];
  const tot = {};
  for (const id of who) { const series = JOINT.map(() => []);
    for (let i = 0; i < n; i++) { const P = Body.poseAt(ctx, id, i * dt); JOINT.forEach(([, f], k) => series[k].push(P ? f(P) : NaN)); }
    JOINT.forEach(([ch, , seg], k) => { const a = series[k], lim = Choreo.CLAMP[ch]; let last = null; tot[id + ' ' + ch] = 0;
      for (let i = 0; i < n; i++) { if (!isFinite(a[i])) continue; const v = i > 0 && isFinite(a[i - 1]) ? (a[i] - a[i - 1]) / dt : 0, acc = i > 1 && isFinite(a[i - 2]) ? (a[i] - 2 * a[i - 1] + a[i - 2]) / dt / dt : 0;
        let tau = 0, pw = 0; if (seg) { const S_ = SEG[seg]; tau = S_.m * g * S_.r * Math.abs(Math.sin(a[i])) + S_.m * S_.r * S_.r / 3 * Math.abs(acc); pw = Math.abs(tau * v) / 0.5 + 2.0 * tau * tau; }
        tot[id + ' ' + ch] += pw * dt;
        const moving = Math.abs(v) * DEG > 0.5, keep = moving || (last && last.moving) || i === 0 || i === n - 1;
        if (keep) rows.push([id, ch, r3(i * dt), r1(a[i] * DEG), r1(v * DEG), lim ? r1(lim[0] * DEG) : '', lim ? r1(lim[1] * DEG) : '', Math.round(tau * 10000) / 10000, Math.round(pw * 1000) / 1000]);
        last = { moving }; } }); }
  return { head, rows, energyJ: Object.fromEntries(Object.entries(tot).filter(([, v]) => v > 0).map(([k, v]) => [k, Math.round(v * 100) / 100])) };
}
const csv = (head, rows, notes) => (notes || []).map(l => '# ' + l).join('\n') + (notes && notes.length ? '\n' : '') + [head.join(','), ...rows.map(r => r.map(x => typeof x === 'string' && /[,"\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x).join(','))].join('\n') + '\n';
module.exports = { posesheet, servo, csv, SEG };
