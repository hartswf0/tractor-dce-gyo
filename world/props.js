/* world/props.js — LDraw sub-models living in the world: figures, vehicles, anything the studio or the -ators send.

   A prop is one MPD text placed at a point with a yaw. It is parsed with the page's
   own LDraw loader (one parse at a time; parts it needs come from ./ldraw/), wrapped
   so LDraw's y-down becomes the world's y-up, and it is solid: its box stops feet,
   ships and bolts. A blast turns the parts inside the radius into debris, and a prop
   that has lost most of itself comes apart. Rows [id, mpd, x, y, z, yaw] use the
   same anchor frame as the bricks, persist per place and merge per id. */
(function () {
'use strict';
const V1 = new THREE.Vector3(), V2 = new THREE.Vector3(), B1 = new THREE.Box3(), M1 = new THREE.Matrix4();
const CAP = 150, MAX_TEXT = 400000;
/* yaw in quarter turns; a driven vehicle parks at any angle, so fractions are kept (three decimals) */
const yawOf = v => { const n = Number(v); if (!Number.isFinite(n)) return 0; return Math.round(((n % 4) + 4) % 4 * 1000) / 1000; };

class Props {
  constructor({ scene, loader, M, debris }) {
    this.scene = scene; this.loader = loader; this.M = M; this.debris = debris;
    this.items = new Map(); this.queue = Promise.resolve(); this.frame = { ax: 0, az: 0, datum: 0 }; this.key = null; this.onEdit = null; this.dirty = false; this.saveT = 0;
    this.pid = (window.Build && Build.Build.pid()) || Math.random().toString(36).slice(2, 8); this.next = 0; try { this.next = +(localStorage.getItem('world.props.n') || 0); } catch (e) { }
    this.kinds = 0; this.parsed = 0;
  }
  setFrame(f) { this.frame = { ...f }; }
  toRow(p) { const f = this.frame, r = [p.id, p.mpd, Math.round(p.x - f.ax), Math.round(p.y + f.datum), Math.round(p.z - f.az), yawOf(p.yaw)]; if (p.src) r.push(p.src); return r; }   // src: the build op that made it, so a read build can say it again
  fromRow(r) { const f = this.frame; return { id: r[0], mpd: String(r[1] || ''), x: r[2] + f.ax, y: r[3] - f.datum, z: r[4] + f.az, yaw: yawOf(r[5]), src: r[6] && typeof r[6] === 'object' ? r[6] : null }; }
  /** Parse LDraw text through the shared loader, one at a time. Resolves to a Group in LDraw's frame. */
  parse(text, name) {
    const run = () => new Promise((res, rej) => { try { const t = setTimeout(() => rej(new Error('parse timed out')), 30000); this.loader.parse(text, name || 'prop.mpd', g => { clearTimeout(t); this.parsed++; res(g); }); } catch (e) { rej(e); } });
    const p = this.queue.then(run, run); this.queue = p.catch(() => { }); return p;
  }
  /** Add a prop (window frame: x, z its centre, y its ground, yaw quarter turns). Resolves to the item once it is in the scene. */
  async add(p, quiet) {
    if (this.items.has(p.id)) return this.items.get(p.id);
    if (this.items.size >= CAP || !p.mpd || p.mpd.length > 60000) return null;
    const it = { ...p, group: null, box: null, meshes: [], total: 0, ready: false }; this.items.set(p.id, it);
    let g; try { g = await this.parse(p.mpd, p.id + '.mpd'); } catch (e) { this.items.delete(p.id); console.warn('prop parse', e); return null; }
    if (!this.items.has(p.id)) return null;                                             // removed while parsing
    const wrap = new THREE.Group(); wrap.name = 'propwrap:' + p.id; wrap.rotation.x = Math.PI; const yawG = new THREE.Group(); yawG.name = 'prop:' + p.id; yawG.add(wrap); yawG.rotation.y = p.yaw * Math.PI / 2; yawG.position.set(p.x, p.y, p.z);
    g.traverse(o => { if (o.isMesh) { it.meshes.push(o); for (const m of Array.isArray(o.material) ? o.material : [o.material]) if (m) { m.fog = true; m.side = THREE.DoubleSide; } } });
    while (g.children.length) wrap.add(g.children[0]);
    this.scene.add(yawG); yawG.updateMatrixWorld(true); it.group = yawG; it.total = it.meshes.length; it.ready = true;
    it.box = new THREE.Box3().setFromObject(yawG); if (it.box.isEmpty()) it.box = new THREE.Box3(new THREE.Vector3(p.x - 20, p.y, p.z - 20), new THREE.Vector3(p.x + 20, p.y + 40, p.z + 20));
    if (!quiet) { this.dirty = true; if (this.onEdit) this.onEdit({ up: [this.toRow(it)] }); }
    return it;
  }
  /** Place a new prop of ours. */
  place(mpd, x, y, z, yaw, quiet, src) { const id = this.pid + '-p' + (++this.next); try { localStorage.setItem('world.props.n', String(this.next)); } catch (e) { } return this.add({ id, mpd, x, y, z, yaw, src: src || null }, quiet); }
  remove(id, quiet) { const it = this.items.get(id); if (!it) return false; if (it.group) this.scene.remove(it.group); this.items.delete(id); if (!quiet) { this.dirty = true; if (this.onEdit) this.onEdit({ rm: [id] }); } return true; }
  clear() { for (const id of [...this.items.keys()]) this.remove(id, true); this.dirty = true; }
  near(x, z, r) { const out = []; for (const it of this.items.values()) { if (!it.box) continue; const b = it.box; if (x + r < b.min.x || x - r > b.max.x || z + r < b.min.z || z - r > b.max.z) continue; out.push(it); } return out; }
  aabbs(x, z, r) { return this.near(x, z, r).map(it => it.box); }
  /** Push a body out of props too tall to step onto. */
  pushOut(pos, r, hgt, step = 30, skipId = null) {
    for (const it of this.near(pos.x, pos.z, r)) {
      if (skipId && it.id === skipId) continue; const b = it.box; if (b.max.y <= pos.y + step || b.min.y >= pos.y + hgt) continue;
      const cx = Math.max(b.min.x, Math.min(pos.x, b.max.x)), cz = Math.max(b.min.z, Math.min(pos.z, b.max.z)), dx = pos.x - cx, dz = pos.z - cz, d = Math.hypot(dx, dz);
      if (d >= r) continue;
      if (d < 1e-3) { const ex = Math.min(pos.x - b.min.x, b.max.x - pos.x), ez = Math.min(pos.z - b.min.z, b.max.z - pos.z); if (ex < ez) pos.x = pos.x - b.min.x < b.max.x - pos.x ? b.min.x - r : b.max.x + r; else pos.z = pos.z - b.min.z < b.max.z - pos.z ? b.min.z - r : b.max.z + r; }
      else { pos.x = cx + dx / d * r; pos.z = cz + dz / d * r; }
    }
  }
  floorAt(x, z, yMax) { let f = -Infinity; for (const it of this.near(x, z, 0)) { const b = it.box; if (x > b.min.x && x < b.max.x && z > b.min.z && z < b.max.z && b.max.y <= yMax && b.max.y > f) f = b.max.y; } return f; }
  /** A blast: every part of a prop within r becomes debris; a prop that lost most of itself lets the rest go. Returns how many parts flew. */
  blast(pt, r, vel) {
    let n = 0; const M = this.M;
    for (const it of this.near(pt.x, pt.z, r)) {
      if (!it.ready || it.box.distanceToPoint(pt) > r) continue;
      const gone = [];
      for (const m of it.meshes) { m.getWorldPosition(V1); if (V1.distanceTo(pt) < r) gone.push(m); }
      if (!gone.length) continue;
      if (it.meshes.length - gone.length < it.total * 0.4) gone.splice(0, gone.length, ...it.meshes);   // mostly gone: it all comes apart
      for (const m of gone) {
        const away = m.getWorldPosition(V2).clone().sub(pt); away.y += 10; if (away.lengthSq() < 1) away.set(Math.random() - .5, 1, Math.random() - .5);
        away.normalize().multiplyScalar((2 + Math.random() * 5) * M); if (vel) away.add(vel); away.y += 1.5 * M;
        this.fling(m, away); n++;
      }
      it.meshes = it.meshes.filter(m => !gone.includes(m));
      if (!it.meshes.length) this.remove(it.id);
      else { it.box = new THREE.Box3().setFromObject(it.group); if (it.box.isEmpty()) this.remove(it.id); else { this.dirty = true; } }
    }
    return n;
  }
  /** One mesh of a prop leaves as debris: its geometry becomes a debris kind on first use. */
  fling(m, vel) {
    const g = m.geometry, name = 'p:' + g.uuid.slice(0, 8);
    if (!this.debris.kinds.has(name)) { if (this.kinds >= 120) { m.parent && m.parent.remove(m); return; } const geom = g.clone(); geom.clearGroups(); this.debris.register(name, geom, 40); this.kinds++; }
    m.updateWorldMatrix(true, false); const mat = Array.isArray(m.material) ? m.material[0] : m.material;
    this.debris.spawn({ part: name, matrix: m.matrixWorld.clone(), colour: mat && mat.color ? mat.color : new THREE.Color(1, 1, 1), vel });
    m.parent && m.parent.remove(m);
  }
  /* ───── merge, save, load ───── */
  applyOps({ up, rm }) { let added = 0, removed = 0, moved = 0; if (rm) for (const id of rm) if (this.remove(id, true)) removed++; if (up) for (const r of up) { const p = this.fromRow(r); const it = this.items.get(p.id); if (it) { if (Math.abs(it.x - p.x) > 0.5 || Math.abs(it.z - p.z) > 0.5 || Math.abs(it.y - p.y) > 0.5 || Math.abs(it.yaw - p.yaw) > 1e-3) { this.moveTo(it, p.x, p.y, p.z, p.yaw, true); moved++; } continue; } this.add(p, true); added++; } if (added || removed || moved) this.dirty = true; return { added, removed, moved }; }
  /** Put a prop somewhere else (a driven vehicle, ours or a remote's). */
  moveTo(it, x, y, z, yaw, quiet) { it.x = x; it.y = y; it.z = z; it.yaw = yawOf(yaw); if (it.group) { it.group.position.set(x, y, z); it.group.rotation.set(0, it.yaw * Math.PI / 2, 0, 'YXZ'); it.group.updateMatrixWorld(true); it.box = new THREE.Box3().setFromObject(it.group); } if (!quiet) { this.dirty = true; if (this.onEdit) this.onEdit({ up: [this.toRow(it)] }); } }
  /** Our prop moved on its own (it was driven): save and tell the room. */
  moved(it) { this.dirty = true; if (this.onEdit) this.onEdit({ up: [this.toRow(it)] }); }
  rows() { return [...this.items.values()].filter(it => !(it.src && it.src.landmark)).map(it => this.toRow(it)); }   // a world's own vehicles are laid, not saved
  storageKey() { return this.key ? 'world.props.' + this.key : null; }
  load(key) { this.key = key; this.clear(); this.dirty = false; let n = 0; try { const s = localStorage.getItem(this.storageKey()); if (s) { const d = JSON.parse(s); if (d && d.props) for (const r of d.props) { this.add(this.fromRow(r), true); n++; } } } catch (e) { console.warn('props load', e); } return n; }
  save() { const k = this.storageKey(); if (!k) return false; this.dirty = false; try { const s = JSON.stringify({ v: 1, t: Date.now(), props: this.rows() }); if (s.length > MAX_TEXT) return false; localStorage.setItem(k, s); return true; } catch (e) { return false; } }
  forget() { const k = this.storageKey(); this.clear(); this.dirty = false; try { if (k) localStorage.removeItem(k); } catch (e) { } }
  tick(dt) { if (this.dirty) { this.saveT += dt; if (this.saveT > 0.5) { this.saveT = 0; this.save(); } } else this.saveT = 0; }
  stats() { let parts = 0, props = 0, landmarks = 0; for (const it of this.items.values()) { parts += it.meshes.length; if (it.src && it.src.landmark) landmarks++; else props++; } return { props, landmarks, parts, parsed: this.parsed, kinds: this.kinds }; }   // a world's own vehicles are counted apart
}
window.Props = { Props };
})();
