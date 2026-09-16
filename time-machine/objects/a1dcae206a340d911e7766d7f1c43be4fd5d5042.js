/* world/receipts.js — one record per build asked of the model, kept in this browser.

   A receipt is the episode: the manifest that built it, the brief, the context (its picture's size, not the picture),
   the plan, the raw answer, the program, the compile report, the residual (what was attempted against what stood),
   the cost, a small picture of the result, and what the person did next (committed, changed, nudged, discarded, saved,
   read) with the seconds after the draft stood. IndexedDB when it is there, memory when it is not; the newest 500 kept.
   Receipts.export() is the JSON the foundry reads (tools/foundry). */
(function () {
'use strict';
const DB = 'world.receipts', STORE = 'r', MAX = 500;
const R = { mem: [], ready: null, db: null, max: MAX };

function open() {
  if (R.ready) return R.ready;
  R.ready = new Promise(ok => {
    try {
      if (typeof indexedDB === 'undefined') return ok(null);
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' }); };
      req.onsuccess = () => { R.db = req.result; ok(R.db); }; req.onerror = () => ok(null); req.onblocked = () => ok(null);
    } catch (e) { ok(null); }
  }).then(async db => { if (db) { try { R.mem = await readAll(db); } catch (e) { R.mem = []; } } return db; });
  return R.ready;
}
function readAll(db) { return new Promise((ok, no) => { const tx = db.transaction(STORE, 'readonly'), q = tx.objectStore(STORE).getAll(); q.onsuccess = () => ok((q.result || []).sort((a, b) => b.t - a.t)); q.onerror = () => no(q.error); }); }
function write(db, rec) { return new Promise((ok, no) => { const tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).put(rec); tx.oncomplete = () => ok(true); tx.onerror = () => no(tx.error); }); }
function remove(db, id) { return new Promise(ok => { const tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).delete(id); tx.oncomplete = () => ok(true); tx.onerror = () => ok(false); }); }
const id = () => 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/** Keep a receipt (or a newer version of one: same id). Newest first in memory; the oldest beyond the cap go. */
R.put = async function (rec) {
  rec = { id: rec.id || id(), t: rec.t || Date.now(), ...rec }; const db = await open();
  const at = R.mem.findIndex(r => r.id === rec.id); if (at >= 0) R.mem[at] = rec; else R.mem.unshift(rec);
  while (R.mem.length > R.max) { const old = R.mem.pop(); if (db) await remove(db, old.id); }
  if (db) { try { await write(db, rec); } catch (e) { } }
  return rec;
};
/** Change one receipt in place: fn(rec) edits it. */
R.patch = async function (recId, fn) { await open(); const rec = R.mem.find(r => r.id === recId); if (!rec) return null; try { fn(rec); } catch (e) { } return R.put(rec); };
/** What the person did with a draft, with the seconds since it stood. */
R.after = function (recId, act, extra) { return R.patch(recId, rec => { rec.after = rec.after || []; rec.after.push({ t: Date.now(), dt: +((Date.now() - rec.t) / 1000).toFixed(1), act, ...(extra || {}) }); }); };
R.all = async function () { await open(); return R.mem.slice(); };
R.count = () => R.mem.length;
R.get = async function (recId) { await open(); return R.mem.find(r => r.id === recId) || null; };
R.clear = async function () { const db = await open(); R.mem = []; if (db) { for (const r of await readAll(db)) await remove(db, r.id); } return true; };
/** The JSON the foundry reads: every receipt, pictures included. */
R.export = async function () { const all = await R.all(); return JSON.stringify({ kind: 'world.receipts', n: all.length, exported: new Date().toISOString(), receipts: all }); };
/** The residual: what the program attempted against what stood. */
R.residual = function (program, report) {
  const r = report || {}, ops = program && Array.isArray(program.ops) ? program.ops : [], flat = window.Dsl && window.Dsl.flatOps ? window.Dsl.flatOps(ops) : ops;
  return { attempted: flat.length, ran: r.ops || 0, committed: (r.pieces || 0) + (r.props || 0), pieces: r.pieces || 0, props: r.props || 0, unknown: (r.unknown || []).length, errors: (r.errors || []).length, floating: r.floating || 0, blocked: r.blocked || 0, vanished: (r.vanished || []).slice(), groups: (r.groups || []).length };
};
window.Receipts = R;
})();
