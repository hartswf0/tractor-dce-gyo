/* play/odyssey-game/story.js — the whole poem: 24 books on the Regulars' Cut, played in order.

   A book is a list of items (story.json, made by tools/odyssey-game-story.py): scene (a voiced cinematic, cinema.js),
   level (a hand-verb level at the poem's turn; its scenes stay as the fallback when the player chooses to watch), bridge
   (the cut's bed-only bridge: a card over the book's music). The runner plays them one after another, saves where the
   player is after every item (localStorage, wrapped: a private window simply does not remember), and at the end of a book
   marks it sailed and goes on to the next. Kleos: the best of each level plus 30 for every touch answered. */
(function () {
'use strict';
const OG = window.OG = window.OG || {};
const ST = OG.ST = { story: null, run: 0, book: null, item: 0, playing: false, noStage: false, save: { at: null, done: {}, touches: {}, levels: {} } };
const KEY = 'odyssey-game-progress';
ST.load = async function () {
  ST.story = await (await fetch('odyssey-game/story.json')).json();
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && typeof s === 'object') ST.save = Object.assign(ST.save, s); } catch (e) { }
};
ST.persist = () => { try { localStorage.setItem(KEY, JSON.stringify(ST.save)); } catch (e) { } };
ST.kleos = () => Object.values(ST.save.levels).reduce((a, l) => a + (l.kleos || 0), 0) + 30 * Object.keys(ST.save.touches).length;
ST.touchDone = id => { ST.save.touches[id] = 1; ST.persist(); OG.H.total(ST.kleos()); };
ST.levelDone = r => { const b = ST.save.levels[r.level]; if (r.won && (!b || b.kleos < r.kleos)) ST.save.levels[r.level] = { kleos: r.kleos, stars: r.stars }; ST.persist(); OG.H.total(ST.kleos()); };
ST.books = () => ST.story.books;
ST.label = (b, i) => { const it = b.items[i]; if (!it) return 'the end of the book'; return it.type === 'level' ? 'the trial: ' + (OG.G.data[it.id] || {}).title : it.type === 'bridge' ? 'a bridge' : it.title; };
/** play from book n, item i, on through the poem */
ST.play = async function (n, i = 0) {
  const run = ++ST.run; OG.G.teardown(); OG.M.hide(); OG.G.phase = 'story'; ST.playing = true;
  for (let b = n; b <= 24; b++) {
    const book = ST.story.books[b - 1]; ST.book = book; OG.A.bed(book.bed);
    await ST.chapterCard(book, run); if (run !== ST.run) return;
    for (let k = (b === n ? i : 0); k < book.items.length; k++) {
      if (run !== ST.run) return; ST.item = k; ST.save.at = { book: b, item: k }; ST.persist();
      const it = book.items[k]; OG.G.log.push(['item', b, k, it.type, it.id || it.kind]);
      if (it.type === 'scene') await OG.C.play(it, book);
      else if (it.type === 'bridge') await ST.bridge(it, book, run);
      else if (it.type === 'level') { const r = await OG.G.runLevel(it.id); if (run !== ST.run) return; if (r && r.action === 'watch') for (const sc of it.covers) { if (run !== ST.run) return; await OG.C.play(sc, book); } OG.A.bed(book.bed); OG.G.phase = 'story'; }
    }
    if (run !== ST.run) return; ST.save.done[b] = 1; ST.save.at = { book: Math.min(24, b + 1), item: 0 }; ST.persist(); OG.G.log.push(['book-done', b]);
  }
  ST.playing = false; ST.finale();
};
ST.stop = () => { ST.run++; ST.playing = false; if (OG.C.playing) OG.C.end(true); };
ST.skip = () => { if (OG.C.playing) OG.C.skip = true; else if (ST.cardSkip) ST.cardSkip(); };
/** the title card of a book: its number, its title, where it happens, what the hand will do */
ST.chapterCard = function (book, run) {
  const H = OG.H, trials = book.items.filter(i => i.type === 'level').map(i => OG.G.data[i.id]).filter(Boolean), touches = book.items.filter(i => i.touch).map(i => i.touch.thing);
  OG.E.clearProps(); OG.E.removeActors(); OG.E.clearParts(); OG.E.setView({ bg: 0x0c1116, floor: null, fog: null });
  H.level(null); H.scene(book, null);
  H.banner(`<h2>BOOK ${book.roman} · ${book.place.toUpperCase()}</h2><h1>${book.title}</h1><p>${book.items.filter(i => i.type === 'scene').length + trials.reduce((a, d) => a + (d.scenes || []).length, 0)} scenes of the cut · ${book.minutes ? book.minutes.toFixed(1) + ' min' : ''}</p>${trials.length ? `<p><b>Your hand:</b> ${trials.map(d => d.title + ' (' + d.verbName.toLowerCase() + ')').join(' · ')}</p>` : ''}${touches.length ? `<p><b>Touch:</b> ${touches.join(' · ')}</p>` : ''}<div class="row"><button class="primary" id="og-bookgo">Begin (Space)</button></div>`, 'chapter');
  return new Promise(res => { let done = false; const go = () => { if (done) return; done = true; ST.cardSkip = null; H.banner(null); res(); };
    ST.cardSkip = go; H.$('#og-bookgo').onclick = go; setTimeout(go, (OG.E.timeScale > 1.5 ? 600 : 4200)); });
};
ST.bridge = function (it, book, run) {
  const H = OG.H, A = OG.A; OG.E.clearProps(); OG.E.clearParts(); OG.E.setView({ bg: 0x10202c, floor: null, fog: null }); A.bed(it.bed, { at: it.at });
  H.banner(`<h2>${it.kind.toUpperCase()}</h2><p style="font:italic 19px Georgia,serif;max-width:560px">${it.text}</p>`, 'bridge');
  return new Promise(res => { let done = false; const go = () => { if (done) return; done = true; ST.cardSkip = null; H.banner(null); res(); }; ST.cardSkip = go; setTimeout(go, it.seconds * 1000 / OG.E.timeScale); });
};
ST.finale = function () {
  const H = OG.H; OG.G.phase = 'chart';
  H.banner(`<h2>THE ODYSSEY · XXIV BOOKS</h2><h1>Home</h1><p>Twenty-four books, sung through. Your kleos: <b>${ST.kleos()}</b>.</p><div class="row"><button class="primary" id="og-fin">The chart</button></div>`, 'win');
  H.$('#og-fin').onclick = () => OG.G.chart();
};
})();
