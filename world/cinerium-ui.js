/* world/cinerium-ui.js — the performance panel on cinerium.html: the beats of the playing film with their reasons, the
   register of the selected actor as live sliders (a slider writes a key on the reel clock; a take records the sliders'
   changes as SET lines kept in the shot), the stepped clock's setting, a close-up of the actor kept with the word it
   should read as, and the sheet of every close-up the film asserted. Nothing here is needed to play a film. */
(function () {
'use strict';
const $ = s => document.querySelector(s); const W = window.__world; if (!W || !window.Perform) return;
const F = () => W.film; let sel = null, take = null, live = null;
const box = $('#perform'), btn = $('#fbPerform'); if (!box || !btn) return;
btn.onclick = () => { box.hidden = !box.hidden; btn.classList.toggle('on', !box.hidden); if (!box.hidden) { paint(); if (W.wbFit) W.wbFit(); } if (W.fitFrame) W.fitFrame(); };
const fmt = v => (Math.round(v * 100) / 100).toString();
function actors() { const f = F(); return f ? [...f.actors.values()].filter(a => a.perf) : []; }
function paintActors() {
  const list = actors(), seg = $('#pfActors'); if (!sel || !list.some(a => a.name === sel)) sel = list.length ? list[0].name : null;
  seg.innerHTML = list.map(a => `<button data-actor="${a.name}" class="${a.name === sel ? 'on' : ''}">${a.name}</button>`).join('') || '<em>no performers: a scene with figures first</em>';
  seg.querySelectorAll('[data-actor]').forEach(b => b.onclick = () => { sel = b.dataset.actor; paint(); });
}
function paintBeats() {
  const f = F(), el = $('#pfBeats'); if (!f) return; const cur = f.beat; const rows = [];
  f.shots.forEach((s, i) => { for (const ev of s.events || []) if (ev.what === 'BEAT') rows.push({ shot: i, ev }); });
  el.innerHTML = rows.map(r => `<div class="${cur && cur.id === r.ev.id ? 'on' : ''}"><b>${r.shot + 1}</b><i>${r.ev.who}</i><span>${r.ev.id}${r.ev.direct ? ' · ' + r.ev.direct : ''}${r.ev.why ? ' · ' + r.ev.why : ''}</span><i>${fmt(r.ev.at)}${r.ev.to != null ? '–' + fmt(r.ev.to) : ''} s</i></div>`).join('') || '<em>no beats in this film: a BEAT line names an interval, who it belongs to, why it exists and how it is played</em>';
}
function paintChannels() {
  const el = $('#pfChannels'), a = actors().find(x => x.name === sel); if (!a) { el.innerHTML = ''; return; }
  const P = a.perf, v = P.last || {}, C = Perform.CHANNELS;
  if (!el.dataset.built || el.dataset.for !== sel) {
    el.innerHTML = Perform.NAMES.map(ch => { const [lo, hi] = C[ch]; return `<label data-ch="${ch}"><span>${ch}</span><input type="range" min="${lo}" max="${hi}" step="${(hi - lo) / 200}" value="${v[ch] || 0}"><b>0</b></label>`; }).join('');
    el.querySelectorAll('input').forEach(inp => { inp.oninput = () => { const ch = inp.parentElement.dataset.ch, val = +inp.value, f = F(); Perform.key(P, ch, val, f.reelOffset(f.play.i) + f.play.t, 0.08); live = ch; if (take) take.keys.push({ ch, v: val, at: f.play.t, over: 0.08 }); }; });
    el.dataset.built = '1'; el.dataset.for = sel;
  }
  for (const lab of el.querySelectorAll('label')) { const ch = lab.dataset.ch, val = v[ch] || 0; lab.classList.toggle('on', P.active.has(ch)); if (live !== ch) lab.querySelector('input').value = val; lab.querySelector('b').textContent = fmt(val); }
  live = null;
  $('#pfStep').querySelectorAll('[data-step]').forEach(b => b.classList.toggle('on', +b.dataset.step === P.step));
  const st = Perform.stats(P); $('#pfStat').textContent = `${st.name} · ${st.step === 1 ? 'ones' : st.step === 3 ? 'threes' : 'twos'} · life ${fmt(st.life)} · ${st.phrases.length} phrases · ${Object.values(st.tracks).reduce((n, k) => n + k, 0)} keys${st.speech ? ' · speaking' : ''}${st.faceDraws ? ' · face ' + st.faceDraws : ''}`;
}
function paintSheet() {
  const f = F(), el = $('#pfSheetBox'); if (!f || el.hidden) return;
  el.innerHTML = f.asserts.map(r => `<figure>${r.picture ? `<img src="${r.picture}" alt="">` : '<div style="width:120px;height:120px;background:#ccc;border-radius:8px"></div>'}<figcaption>${r.who} · reads as <b>${r.reads}</b>${r.not ? ' not ' + r.not : ''}${r.beat ? ' · ' + r.beat : ''} · ${fmt(r.t)} s</figcaption></figure>`).join('') || '<em>no close-ups yet: an ASSERT line keeps one with the word it should read as</em>';
}
function paint() { if (box.hidden) return; paintActors(); paintBeats(); paintChannels(); paintSheet(); }
$('#pfStep').querySelectorAll('[data-step]').forEach(b => b.onclick = () => { const a = actors().find(x => x.name === sel); if (a) { a.perf.step = +b.dataset.step; a.perf.last = null; } paint(); });
$('#pfTake').onclick = () => { const f = F(); if (!f) return; if (take) { take = null; $('#pfTake').textContent = 'Take'; $('#pfKeep').disabled = $('#pfDrop').disabled = true; $('#pfTakeStat').textContent = ''; return; } take = { who: sel, shot: f.play.i >= 0 ? f.play.i : f.sel, from: f.play.t, keys: [] }; $('#pfTake').textContent = 'Stop'; $('#pfKeep').disabled = $('#pfDrop').disabled = false; $('#pfTakeStat').textContent = `taking ${sel} from ${fmt(take.from)} s`; };
$('#pfKeep').onclick = () => { const f = F(); if (!f || !take) return; const s = f.shots[take.shot]; if (s) { s.events = s.events || []; let n = 0; const lastBy = {}; for (const k of take.keys) { lastBy[k.ch + '@' + Math.round(k.at * 12)] = k; } for (const k of Object.values(lastBy)) { s.events.push({ what: 'SET', who: take.who, ch: k.ch, v: +k.v.toFixed(3), at: +k.at.toFixed(2), over: 0.1 }); n++; } $('#pfTakeStat').textContent = `kept: ${n} SET lines in shot ${take.shot + 1}`; if (f.onChange) f.onChange('take'); } take = null; $('#pfTake').textContent = 'Take'; $('#pfKeep').disabled = $('#pfDrop').disabled = true; };
$('#pfDrop').onclick = () => { take = null; $('#pfTake').textContent = 'Take'; $('#pfKeep').disabled = $('#pfDrop').disabled = true; $('#pfTakeStat').textContent = 'dropped'; };
$('#pfCloseup').onclick = () => { const f = F(), a = actors().find(x => x.name === sel); if (!f || !a) return; const rec = { who: a.name, reads: prompt('It should read as', a.perf.beats.length ? (a.perf.beats[a.perf.beats.length - 1].direct || '') : '') || 'unsaid', not: null, t: f.reelOffset(f.play.i) + f.play.t, beat: a.perf.beats.length ? a.perf.beats[a.perf.beats.length - 1].id : null, vec: a.perf.last ? { ...a.perf.last } : null, picture: W.filmCloseup ? W.filmCloseup(a.rig) : null }; f.asserts.push(rec); a.perf.asserts.push(rec); $('#pfSheetBox').hidden = false; paintSheet(); };
$('#pfSheet').onclick = () => { $('#pfSheetBox').hidden = !$('#pfSheetBox').hidden; paintSheet(); if (W.wbFit) W.wbFit(); };
let wrapped = null; const wrap = () => { const f = W.film; if (!f || wrapped === f.onChange) return; const prev = f.onChange; const mine = why => { if (prev) prev(why); if (why === 'scene' || why === 'beat' || why === 'assert' || why === 'cut' || why === 'program' || why === 'parse' || why === 'take') paint(); }; f.onChange = mine; wrapped = mine; };
setInterval(() => { wrap(); if (!box.hidden) paintChannels(); }, 250); setInterval(() => { if (!box.hidden) paint(); }, 1500);
W.performPanel = { paint, select: name => { sel = name; paint(); }, take: () => take };
})();
