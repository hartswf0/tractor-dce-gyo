/* world/net.js — playing together: rooms over PeerJS, or a BroadcastChannel for two tabs.

   One host, any number of guests, a star: every guest talks to the host and the
   host relays to the others, stamping who said it. Two lanes to the host — an
   ordered one for edits and events, an unordered one for motion. Player ids are
   peer ids. The page decides what the messages mean; this file only moves them. */
(function () {
'use strict';
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const roomCode = () => Array.from({ length: 4 }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join('');
const peerIdFor = code => 'world-' + code.toLowerCase();
const TIMEOUT = 8;

function create({ onMessage, onJoin, onLeave, onStatus, transport }) {
  const N = { id: null, code: null, role: null, transport: transport || (window.Peer ? 'peer' : 'bc'), peer: null, links: new Map(), bc: null, players: new Map(), t: 0, sent: 0, received: 0, error: null };
  const status = s => { N.status = s; if (onStatus) onStatus(s); };
  const seen = (id, info) => { let p = N.players.get(id); if (!p) { p = { id, name: id.slice(0, 6), seen: N.t, ...(info || {}) }; N.players.set(id, p); if (onJoin) onJoin(id, p); } else { p.seen = N.t; if (info) Object.assign(p, info); } return p; };
  const drop = id => { if (!N.players.has(id)) return; N.players.delete(id); const l = N.links.get(id); if (l) { try { l.edit && l.edit.close(); l.fast && l.fast.close(); } catch (e) { } N.links.delete(id); } if (onLeave) onLeave(id); };

  /* ── delivery ── */
  function deliver(msg, viaLink) {
    if (!msg || typeof msg !== 'object' || !msg.t) return;
    if (msg.to && msg.to !== N.id) { if (N.role === 'host') relay(msg, viaLink, msg.to); return; }
    N.received++; if (msg.from && msg.from !== N.id) seen(msg.from); if (N.role === 'guest') seen('host');   // everything reaches a guest through the host
    if (N.role === 'host' && !msg.to && msg.from !== N.id) relay(msg, viaLink);
    onMessage(msg, msg.from);
  }
  function relay(msg, except, only) {
    for (const [id, l] of N.links) { if (l === except || (only && id !== only)) continue; raw(l, msg, msg.fast); }
  }
  function raw(link, msg, fast) {
    if (N.transport === 'bc') { try { N.bc.postMessage(msg); } catch (e) { } return; }
    const c = fast && link.fast && link.fast.open ? link.fast : link.edit; if (!c || !c.open) return;
    try { c.send(msg); } catch (e) { }
  }
  /** Send to everyone (or to one id). fast = motion lane. */
  function send(msg, { fast = false, to = null } = {}) {
    if (!N.role) return false; msg.from = N.id; if (to) msg.to = to; if (fast) msg.fast = true; N.sent++;
    if (N.transport === 'bc') { try { N.bc.postMessage(msg); } catch (e) { } return true; }
    if (N.role === 'host') { for (const [id, l] of N.links) if (!to || id === to) raw(l, msg, fast); }
    else { const l = N.links.get('host'); if (l) raw(l, msg, fast); }
    return true;
  }

  /* ── PeerJS ── */
  function attach(conn, id) {
    let l = N.links.get(id); if (!l) { l = { id, edit: null, fast: null }; N.links.set(id, l); }
    if (conn.label === 'fast') l.fast = conn; else l.edit = conn;
    conn.on('data', d => deliver(d, l));
    conn.on('close', () => { if (N.role === 'guest') { status('the host left'); leave(false); } else { drop(id); } });
    conn.on('error', e => { N.error = 'link: ' + (e.type || e.message || e); });
    return l;
  }
  function hostPeer(code) {
    return new Promise((res, rej) => {
      const peer = new Peer(peerIdFor(code), { debug: 0 }); N.peer = peer;
      peer.on('open', id => { N.id = id; N.role = 'host'; N.code = code; status('hosting ' + code); res(code); });
      peer.on('connection', c => { attach(c, c.peer); c.on('open', () => { if (c.label !== 'fast') seen(c.peer); }); });
      peer.on('error', e => { N.error = e.type; if (!N.role) rej(e); else status('room error: ' + e.type); });
      peer.on('disconnected', () => { try { peer.reconnect(); } catch (e) { } });
    });
  }
  function joinPeer(code) {
    return new Promise((res, rej) => {
      const peer = new Peer({ debug: 0 }); N.peer = peer;
      peer.on('open', id => {
        N.id = id; const target = peerIdFor(code);
        const edit = peer.connect(target, { reliable: true, label: 'edit', serialization: 'json' }), fast = peer.connect(target, { reliable: false, label: 'fast', serialization: 'json' });
        attach(edit, 'host'); attach(fast, 'host');
        const t = setTimeout(() => { if (!N.role) { N.error = 'timeout'; rej(new Error('nobody answered')); } }, 9000);
        edit.on('open', () => { clearTimeout(t); N.role = 'guest'; N.code = code; seen('host', { name: 'host' }); status('joined ' + code); res(code); });
      });
      peer.on('error', e => { N.error = e.type; if (!N.role) rej(e); else status('link error: ' + e.type); });
    });
  }

  /* ── BroadcastChannel (same browser, for tests and two tabs) ── */
  function openBC(code, role) {
    N.bc = new BroadcastChannel('world-' + code); N.id = N.id || 'bc-' + Math.random().toString(36).slice(2, 8); N.role = role; N.code = code;
    N.bc.onmessage = e => { const m = e.data; if (!m || m.from === N.id) return; if (m.__bc === 'who' && N.role === 'host') { N.bc.postMessage({ __bc: 'host', hostId: N.id, to: m.from }); return; } if (m.__bc) return; if (m.from && !N.links.has(m.from) && N.role === 'host') N.links.set(m.from, { id: m.from }); deliver(m, N.links.get(m.from)); };
    status((role === 'host' ? 'hosting ' : 'joined ') + code + ' (tabs)');
  }
  function joinBC(code) {
    return new Promise((res, rej) => {
      const probe = new BroadcastChannel('world-' + code), me = 'bc-' + Math.random().toString(36).slice(2, 8); N.id = me;
      const t = setTimeout(() => { probe.close(); rej(new Error('nobody answered')); }, 1500);
      probe.onmessage = e => { const m = e.data; if (m && m.__bc === 'host' && m.to === me) { clearTimeout(t); probe.close(); openBC(code, 'guest'); N.links.set('host', { id: m.hostId }); seen('host', { name: 'host' }); res(code); } };
      probe.postMessage({ __bc: 'who', from: me });
    });
  }

  async function host(code) { code = (code || roomCode()).toUpperCase(); if (N.transport === 'bc') { openBC(code, 'host'); return code; } return hostPeer(code); }
  async function join(code) { code = String(code || '').toUpperCase(); if (code.length !== 4) throw new Error('a room code has 4 letters'); if (N.transport === 'bc') return joinBC(code); return joinPeer(code); }
  /** Join, or host that room if nobody has it (a shared link works for whoever opens it first). */
  async function joinOrHost(code) { try { return await join(code); } catch (e) { if (N.peer) { try { N.peer.destroy(); } catch (x) { } N.peer = null; } N.links.clear(); N.players.clear(); return host(code); } }
  function leave(tell = true) {
    if (tell && N.role) send({ t: 'bye' });
    for (const id of [...N.players.keys()]) drop(id);
    if (N.peer) { try { N.peer.destroy(); } catch (e) { } N.peer = null; }
    if (N.bc) { try { N.bc.close(); } catch (e) { } N.bc = null; }
    N.role = null; N.code = null; status('');
  }
  /** Time passes: forget peers that went quiet. */
  function tick(dt) { N.t += dt; for (const [id, p] of N.players) if (N.t - p.seen > TIMEOUT) { if (N.role === 'guest' && id === 'host') { status('the host went quiet'); leave(false); return; } drop(id); } }
  function link() { const u = new URL(location.href); u.searchParams.set('room', N.code || ''); u.searchParams.delete('at'); u.searchParams.delete('name'); return u.toString(); }
  return Object.assign(N, { host, join, joinOrHost, leave, send, tick, link, seen, roomCode, stats: () => ({ id: N.id, code: N.code, role: N.role, transport: N.transport, players: [...N.players.keys()], sent: N.sent, received: N.received, error: N.error, status: N.status }) });
}
window.Net = { create, roomCode };
})();
