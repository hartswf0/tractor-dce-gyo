/* tools/creatures/minifig.js — a plain minifig for the creature test films (a man under a ram, a scout in a giant's fist, rowers on a
   bench): the parts of world/minifig.js's rig at its kit offsets, turned on its hips, shoulders and neck. Rows in the figure's LDraw
   frame (y down, facing -z, soles at y 72, the neck at 0), placed by a matrix M (12 numbers) into the world.
     fig(M, {arms: [R, L] pitch (- forward), legs: [R, L], head, colours: {torso, legs, hair}}) -> [{part, col, m}] */
'use strict';
const C = require('../../film-readymades/creatures.js'), { mul, T, RX, RY } = C.m;
const HAND_R = [-23.8634, 26.5956, -10.321, 0.985, -0.12019, 0.12019, 0.17, 0.696395, -0.696395, 0, 0.707, 0.707];
const HAND_L = [23.8634, 26.5956, -10.321, 0.985, 0.12019, -0.12019, -0.17, 0.696395, -0.696395, 0, 0.707, 0.707];
function fig(M, o = {}) {
  const c = Object.assign({ torso: 4, legs: 19, hips: 19, arms: 4, hands: 14, head: 14, hair: 6 }, o.colours || {});
  const [aR, aL] = o.arms || [0, 0], [lR, lL] = o.legs || [0, 0], out = [];
  const put = (m, part, col) => out.push({ part, col, m: mul(M, m) });
  const at = (px, py, pz, a) => mul(mul(T(px, py, pz), RX(a)), T(-px, -py, -pz));
  put(T(0, 32, 0), '3815', c.hips);
  put(mul(at(0, 44, 0, lR), T(0, 44, 0)), '3816', c.legs); put(mul(at(0, 44, 0, lL), T(0, 44, 0)), '3817', c.legs);
  put(T(0, 0, 0), '973', c.torso);
  const aRm = at(-15.552, 9, 0, aR), aLm = at(15.552, 9, 0, aL);
  put(mul(aRm, [-15.552, 9, 0, 0.985, -0.17, 0, 0.17, 0.985, 0, 0, 0, 1]), '3818', c.arms); put(mul(aLm, [15.552, 9, 0, 0.985, 0.17, 0, -0.17, 0.985, 0, 0, 0, 1]), '3819', c.arms);
  put(mul(aRm, HAND_R), '3820', c.hands); put(mul(aLm, HAND_L), '3820', c.hands);
  const hd = mul(T(0, 0, 0), RY(o.head || 0));
  put(mul(hd, T(0, -24, 0)), '3626b', c.head); if (c.hair != null) put(mul(hd, T(0, -24, 0)), '3901', c.hair);
  return out;
}
module.exports = { fig };
