/* world/lease.js — one live instance of the page per browser: the newest tab takes the graphics.

   A page cannot close other tabs, but every open instance of this page can hear
   the others over a BroadcastChannel (a storage event where that is missing).
   Booting claims the lease; a live instance that hears another's claim yields:
   it drops its WebGL context and waits behind a Resume veil. A tab opened to
   share a room with the first one (?lease=share) neither claims nor yields. */
(function () {
'use strict';
function create({ id, share, onYield, onFree }) {
  const L = { id, share: !!share, held: false, bc: null, heard: 0 };
  const post = m => { try { if (L.bc) L.bc.postMessage(m); else localStorage.setItem('world.lease', JSON.stringify({ ...m, r: Math.random() })); } catch (e) { } };
  const on = m => { if (!m || m.id === id) return; L.heard++; if (m.t === 'claim' && L.held && !L.share) { L.held = false; if (onYield) onYield(m.id); } if (m.t === 'free' && onFree) onFree(m.id); };
  try { L.bc = new BroadcastChannel('world-lease'); L.bc.onmessage = e => on(e.data); } catch (e) { L.bc = null; }
  window.addEventListener('storage', e => { if (e.key === 'world.lease' && e.newValue && !L.bc) { try { on(JSON.parse(e.newValue)); } catch (x) { } } });
  L.claim = () => { L.held = true; if (!L.share) post({ t: 'claim', id, at: Date.now() }); };
  L.release = () => { if (!L.held) return; L.held = false; post({ t: 'free', id }); };
  L.stats = () => ({ id, held: L.held, share: L.share, channel: L.bc ? 'bc' : 'storage', heard: L.heard });
  return L;
}
window.Lease = { create };
})();
