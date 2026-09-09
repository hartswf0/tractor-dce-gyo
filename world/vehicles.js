/* world/vehicles.js — each planet's vehicles, standing near the spawn: walkers on Hoth and Endor, speeders on Tatooine, craft on the Death Star.

   They are props with fixed ids (lm-<world>-<n>), laid the same way on every phone
   in a room, never saved with a place and never sent as an edit until someone drives
   one (then the prop rows carry it like any other ride). */
(function () {
'use strict';
function create({ W, M }) {
  const V = { W, M, laid: null, n: 0 };
  /** Lay this world's vehicles around the spawn (LDU); the previous world's go. */
  V.lay = async () => {
    const props = W.props, preset = Worlds.PRESETS[W.world]; if (!props || !W.G || !W.rig) return 0;
    for (const it of [...props.items.values()]) if (it.src && it.src.landmark) props.remove(it.id, true);
    const list = W.setUp ? [] : ((preset && preset.vehicles) || []).slice(); V.laid = W.world; V.n = 0;   // under a film's set the planet's parked kits stay away
    const mine = W.character && Minifig.DEFS[W.character] && Minifig.DEFS[W.character].ride; if (mine && !W.setUp) list.unshift({ ...mine, dx: 7, dz: 5, me: true });   // the character's own ride, first
    const base = W.spawn || W.rig.pos; let k = 0;
    for (const v of list) {
      let op, mpd;
      if (v.kit && window.Kits && Kits.KITS[v.kit]) { op = { op: 'kit', kit: v.kit, kind: Kits.KITS[v.kit].kind }; mpd = '0 KIT ' + v.kit; }   // a real set
      else { op = v.kind === 'atat' || v.kind === 'atst' ? { op: 'walker', kind: v.kind, x: 0, z: 0, facing: 's' } : { op: 'vehicle', kind: v.kind, len: v.len || 6, col: v.col == null ? 71 : v.col, x: 0, z: 0, facing: 's' };
        let res; try { res = Dsl.compile({ name: v.kind, ops: [op] }); } catch (e) { console.warn('vehicle', v.kind, e && e.message); continue; }
        const pr = res.props && res.props[0]; if (!pr) continue; mpd = pr.mpd; }
      let x = base.x + v.dx * M, z = base.z + v.dz * M;
      for (let i = 0; i < 8; i++) { const b = W.city && W.city.near(x, z, 6 * M).find(b => Bricks.pointInRing(x / M, z / M, b.ring)); if (!b) break; x += 6 * M; z += 4 * M; }   // not inside a building
      const y = Math.max(W.G.h(x, z), Ground.deckAt ? Ground.deckAt(W.G, x, z) : -Infinity);
      let it = null; try { it = await props.add({ id: v.me ? 'lm-me-' + props.pid : `lm-${W.world}-${++k}`, mpd, x, y, z, yaw: v.yaw || 0, src: { ...op, landmark: true, me: !!v.me } }, true); } catch (e) { console.warn('vehicle', v.kit || v.kind, e && e.message); }
      if (it && W.setUp) { props.remove(it.id, true); it = null; }   // a set went up while this kit loaded
      if (it) V.n++;
    }
    return V.n;
  };
  V.list = () => [...W.props.items.values()].filter(it => it.src && it.src.landmark).map(it => ({ id: it.id, kind: it.src.kind, kit: it.kit || null, x: it.x / M, z: it.z / M, ready: it.ready, parts: it.total }));
  return V;
}
window.Vehicles = { create };
})();
