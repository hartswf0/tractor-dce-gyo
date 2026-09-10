/* world/ai.js — the in-world GPT-5.6 Sol LEGO builder.

   One invariant matters here: every OpenAI request is GPT-5.6 Sol at max reasoning.
   The browser key stays in localStorage and is sent directly to api.openai.com.

   Conversation turns are intentionally stateless. Each Responses API call receives
   one explicit user input_text item. Review/edit/repair prompts include the current
   JSON program rather than replaying assistant-role messages. This avoids the
   Responses input-message shape failure that appeared on mobile while keeping the
   full design -> compile -> review loop.
*/
(function () {
'use strict';

const URL = 'https://api.openai.com/v1/responses';
const KEY = 'openai_api_key';
const MODEL_KEY = 'world.ai.model';
const EFFORT_KEY = 'world.ai.effort';
const MODEL = 'gpt-5.6-sol';
const EFFORT = 'max';

const lsGet = k => { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } };
const lsSet = (k, v) => { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (e) { } };

function outputText(j) {
  if (typeof j.output_text === 'string' && j.output_text) return j.output_text;
  const chunks = [];
  for (const item of (j.output || [])) {
    if (!item || item.type !== 'message') continue;
    for (const part of (item.content || [])) if (part && part.type === 'output_text' && typeof part.text === 'string') chunks.push(part.text);
  }
  return chunks.join('\n');
}

/** The Responses API as server-sent events: every output_text delta goes to onDelta, and the completed (or incomplete) response object comes back whole. */
async function readStream(res, onDelta) {
  const reader = res.body.getReader(), dec = new TextDecoder(); let buf = '', text = '', final = null, errorMsg = null;
  const handle = data => {
    let ev; try { ev = JSON.parse(data); } catch (e) { return; }
    const t = ev.type || '';
    if (t === 'response.output_text.delta' && typeof ev.delta === 'string') { text += ev.delta; if (onDelta) { try { onDelta(text); } catch (e) { } } }
    else if (t === 'response.completed' || t === 'response.incomplete' || t === 'response.failed') final = ev.response || null;
    else if (t === 'error') errorMsg = (ev.error && ev.error.message) || ev.message || 'stream error';
  };
  for (;;) {
    const { done, value } = await reader.read(); if (done) break;
    buf += dec.decode(value, { stream: true });
    let i; while ((i = buf.indexOf('\n\n')) >= 0) { const block = buf.slice(0, i); buf = buf.slice(i + 2); for (const line of block.split('\n')) if (line.startsWith('data:')) handle(line.slice(5).trim()); }
  }
  if (buf.trim()) for (const line of buf.split('\n')) if (line.startsWith('data:')) handle(line.slice(5).trim());
  if (errorMsg) throw new Error('OpenAI said ' + errorMsg);
  if (!final) { if (text) return { status: 'completed', output_text: text, usage: null, id: null }; throw new Error('the stream ended without an answer'); }
  if (!final.output_text && text) final.output_text = text;
  return final;
}
function parseProgram(raw) {
  let p = null;
  try { p = JSON.parse(raw); } catch (e) {
    const m = String(raw || '').match(/\{[\s\S]*\}/);
    if (m) try { p = JSON.parse(m[0]); } catch (x) { }
  }
  if (!p || !Array.isArray(p.ops)) throw new Error('Sol did not return a build program');
  return p;
}

/* The prompt's genes: what an experiment may vary. The kernel (the DSL spec, the compiler, the evaluators) stays in code; the genes come from world/manifest.json when it loads and from these defaults until then. */
const RULES = [
  'Return exactly one JSON object {"name": string, "ops": array}; no markdown or prose.',
  'Use only the DSL and treat the compiler as physical reality.',
  'For an ordinary single object, prefer about 6–20 studs across and 3–12 bricks tall unless the subject truly requires more.',
  'A box is only massing. Never make one large cuboid and call it the requested object. Articulate silhouette with roofs, towers, walls, cuts, arches, openings, slopes/parts, vehicles or figures when appropriate.',
  'Establish 3–7 primary/secondary masses before small details. Spend complexity on recognition.',
  'Buildings need a readable entrance, openings on wall lines, and roof logic. Vehicles need front/back, cabin and wheel logic. Towers need base, shaft and top.',
  'Build bottom-up; avoid floating decoration and accidental overlap.',
  'Use 2–4 main colours unless the brief requires more.',
  'Preserve characteristic asymmetry.',
  'Encode canonical landmark features explicitly.',
  'Prefer 8–35 meaningful ops over either 2 giant ops or 60 tiny decorative ops.',
  'Put each named part of the build (a tower, a wing, the porch) in its own group so it can be changed alone.'
];
const GENE_KEYS = ['rules', 'demos', 'plan', 'router', 'selector'];
function defaultGenes() {
  const ex = (window.Dsl && window.Dsl.EXAMPLES) || [];
  return { rules: RULES.slice(), demos: ex.map(e => ({ ask: e.ask, program: e.program })), plan: { words: 7, names: 2 },
    router: { review: { skipSlowMs: 150000, skipEased: true, keepSecondMargin: 1 }, repair: { unknown: true, errors: true, floating: 5, blocked: 0 } },
    selector: { pieces: 28, piecesPer: 18, variety: 3, semantic: 1.8, semanticMax: 20, floating: 2.8, blocked: 2.2, broken: 20, boxes: 4, footprint: 10, fewOps: 14, vanished: 12 } };
}
function fnv(str) { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); }
const MANIFEST = { genes: null, source: 'built-in', url: '' };
function genes() { if (!MANIFEST.genes) MANIFEST.genes = defaultGenes(); return MANIFEST.genes; }
/** Merge a manifest's genes over the defaults: only known genes, only the fields they carry. */
function setGenes(g, source) {
  const base = defaultGenes(), out = { ...base };
  for (const k of GENE_KEYS) { if (!g || g[k] == null) continue; if (Array.isArray(base[k])) out[k] = Array.isArray(g[k]) && g[k].length ? g[k] : base[k]; else out[k] = { ...base[k], ...(typeof g[k] === 'object' ? g[k] : {}) }; for (const sub of Object.keys(base[k])) if (!Array.isArray(base[k]) && typeof base[k][sub] === 'object' && base[k][sub] && g[k] && g[k][sub]) out[k][sub] = { ...base[k][sub], ...g[k][sub] }; }
  MANIFEST.genes = out; MANIFEST.source = source || 'manifest'; return out;
}
/** A brief that names several things, or says a lot, gets a plan first. */
function needsPlan(prompt) {
  const g = genes().plan || {}, words = String(prompt || '').trim().split(/\s+/).filter(Boolean), names = (String(prompt || '').match(/\b(with|and|plus|beside|next to|behind|in front of)\b/gi) || []).length;
  return words.length >= (g.words || 7) || names >= (g.names || 2);
}
function parsePlan(raw) {
  let p = null; try { p = JSON.parse(raw); } catch (e) { const m = String(raw || '').match(/\{[\s\S]*\}/); if (m) try { p = JSON.parse(m[0]); } catch (x) { } }
  if (!p || !Array.isArray(p.parts)) throw new Error('Sol did not return a plan');
  p.parts = p.parts.slice(0, 12).map(pt => ({ name: String(pt.name || 'part').slice(0, 40), role: String(pt.role || '').slice(0, 80), at: Array.isArray(pt.at) ? pt.at.slice(0, 2).map(n => Math.round(Number(n) || 0)) : [0, 0], size: Array.isArray(pt.size) ? pt.size.slice(0, 3).map(n => Math.max(1, Math.round(Number(n) || 1))) : [4, 4, 3], col: pt.col }));
  return p;
}

function compile(program) {
  if (!window.Dsl || typeof window.Dsl.compile !== 'function') return null;
  try { return window.Dsl.compile(program); } catch (e) { return null; }
}

function opProfile(program) {
  const out = {};
  const ops = program && Array.isArray(program.ops) ? (window.Dsl && window.Dsl.flatOps ? window.Dsl.flatOps(program.ops) : program.ops) : [];
  for (const o of ops) {
    const k = String(o && (o.op || o.type || o.kind) || '?').toLowerCase();
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}

function quality(program, result) {
  if (!program || !result) return -1e9;
  const r = result.report || {}, c = opProfile(program);
  const varieties = Object.keys(c).filter(k => k !== '?').length;
  const semantic = ['roof','tower','door','window','arch','stairs','cut','part','minifig','vehicle','walker'].reduce((n, k) => n + (c[k] || 0), 0);
  const extent = result.extent || { x0:0, z0:0, x1:0, z1:0 };
  const w = Math.max(0, extent.x1 - extent.x0), d = Math.max(0, extent.z1 - extent.z0);
  const S = genes().selector; let s = 0;
  s += Math.min(S.pieces, (r.pieces || 0) / S.piecesPer);
  s += varieties * S.variety;
  s += Math.min(S.semanticMax, semantic * S.semantic);
  s -= (r.floating || 0) * S.floating;
  s -= (r.blocked || 0) * S.blocked;
  s -= ((r.unknown || []).length + (r.errors || []).length) * S.broken;
  s -= ((r.vanished || []).length) * S.vanished;
  if ((c.box || 0) >= 3 && varieties < 4) s -= (c.box || 0) * S.boxes;
  if (w * d > 500) s -= S.footprint;
  if ((program.ops || []).length < 4) s -= S.fewOps;
  return s;
}

function audit(program, result) {
  const r = result && result.report || {}, c = opProfile(program);
  const extent = result && result.extent || { x0:0, z0:0, x1:0, z1:0 };
  const w = Math.max(0, extent.x1 - extent.x0), d = Math.max(0, extent.z1 - extent.z0);
  const notes = [];
  if ((c.box || 0) >= 2 && Object.keys(c).length < 4) notes.push('too dependent on generic boxes');
  if (w * d > 500) notes.push('oversized footprint for a single object');
  if (r.floating) notes.push(`${r.floating} pieces float and get dropped`);
  if (r.blocked) notes.push(`${r.blocked} explicit parts collide`);
  if ((r.unknown || []).length) notes.push('unknown operations are present');
  if ((r.errors || []).length) notes.push('compiler errors are present');
  if ((r.vanished || []).length) notes.push(`groups that built nothing: ${r.vanished.join(', ')}`);
  if (!notes.length) notes.push('physically valid; improve recognition and proportion rather than adding volume');
  return `Compiler: ${r.pieces || 0} pieces, ${r.props || 0} props, ${r.floating || 0} floating, ${r.blocked || 0} blocked. Footprint ${w}×${d} studs. Ops ${JSON.stringify(c)}. Audit: ${notes.join('; ')}.`;
}

const Ai = {
  onStatus: null,
  key: () => lsGet(KEY).trim(),
  setKey(v) { lsSet(KEY, (v || '').trim()); },
  model: () => MODEL,
  effort: () => EFFORT,
  setModel() { lsSet(MODEL_KEY, MODEL); },
  setEffort() { lsSet(EFFORT_KEY, EFFORT); },
  calls: 0,
  lastUsage: null,
  lastError: null,
  lastResponseId: null,

  emit(stage, detail, state = 'working', started = 0, extra = null) {
    if (typeof this.onStatus === 'function') {
      try { this.onStatus(stage, detail, state, started, extra); } catch (e) { }
    }
  },

  system() {
    const G = genes(), ex = G.demos.map(e => `Request: ${e.ask}\nAnswer: ${JSON.stringify(e.program)}`).join('\n\n');
    return `${window.Dsl.SPEC}\n\nMASTER BUILDER STANDARD:\nYou are designing a small physical LEGO model, not naming a pile of boxes. It must be recognizable from silhouette and proportion before the user reads its name.\n\nReason privately through: identifying features, sensible LEGO scale, primary masses, support, landmark openings/details, colour placement, and bottom-up construction.\n\nRules:\n${G.rules.map(r => '- ' + r).join('\n')}\n\nExamples:\n${ex}`;
  },
  genes, manifest: () => ({ source: MANIFEST.source, url: MANIFEST.url, hash: fnv(JSON.stringify(genes())), kernel: fnv((window.Dsl && window.Dsl.SPEC || '') + (window.Dsl && window.Dsl.compile ? window.Dsl.compile.toString() : '')) }),
  manifestHash: () => fnv(JSON.stringify(genes())),
  setGenes, needsPlan,
  /** world/manifest.json, when it is there: its genes over the defaults. Resolves with the manifest's report either way. */
  async loadManifest(url) {
    url = url || 'world/manifest.json'; MANIFEST.url = url;
    try { const r = await fetch(url, { cache: 'no-cache' }); if (!r.ok) throw new Error(String(r.status)); const j = await r.json(); setGenes(j.genes || j, `${url.replace(/^\.\//, '')} (${j.name || 'manifest'})`); } catch (e) { MANIFEST.source = 'built-in'; }
    return this.manifest();
  },
  /** The route after a compile: what the router genes say is worth another call. */
  route(report) {
    const R = genes().router.repair, r = report || {};
    if (R.unknown && (r.unknown || []).length) return 'repair'; if (R.errors && (r.errors || []).length) return 'repair';
    if (R.floating != null && R.floating >= 0 && (r.floating || 0) > R.floating) return 'repair'; if (R.blocked && (r.blocked || 0) >= R.blocked) return 'repair';
    if (R.vanished && (r.vanished || []).length) return 'repair';
    return null;
  },

  userMessage(prompt, context = {}) {
    const bits = [];
    if (context.place) bits.push(`Place: ${context.place}`);
    if (context.world && context.world !== 'earth') bits.push(`Planet: ${context.world}`);
    if (context.ground) bits.push(`Ground: ${context.ground}`);
    if (context.standing) bits.push(`Nearby: ${context.standing}`);
    if (context.room) bits.push(`Free room from the origin: ${context.room}`);
    if (context.image) bits.push('The picture is the view where the build will stand, from where the player looks');
    return `${bits.length ? bits.join('. ') + '.\n' : ''}BUILD BRIEF: ${prompt}\nChoose the scale yourself. Make it read correctly at first glance; do not fill the 40×40 workspace just because it exists.`;
  },

  /* The ladder when the model spends all its output room on private reasoning: the same text again with less reasoning, twice at most. */
  async requestSafely(text, opts = {}) {
    const ladder = ['max', 'high', 'medium']; let err = null;
    for (let i = 0; i < ladder.length; i++) {
      const effort = ladder[i], t = i ? `${text}\nYou ran out of output room last time: keep private reasoning short and answer with the JSON program.` : text;
      try { const out = await this.request(t, { ...opts, effort, detail: i ? `${opts.detail || ''} · again at ${effort} reasoning` : opts.detail }); out.effort = effort; out.images = (opts.images || []).filter(Boolean).length; return out; }
      catch (e) { err = e; if (e && e.reason === 'max_output_tokens' && i < ladder.length - 1) { this.emit('SOL RAN OUT OF ROOM', `after ${e.secs || '?'} s at ${effort} reasoning · trying again at ${ladder[i + 1]}`, 'working'); continue; } throw e; }
    }
    throw err;
  },

  async request(text, { key, signal, stage = 'SOL REASONING', detail = 'designing', effort = EFFORT, onDelta, system, parse, images } = {}) {   // system: other instructions than the builder's (the film's shot list); parse: another reader of the answer than the build program's
    key = (key || this.key()).trim();
    if (!key) throw new Error('no key: enter an OpenAI API key');
    lsSet(MODEL_KEY, MODEL); lsSet(EFFORT_KEY, EFFORT);
    /* JSON mode needs the word "json" inside the input itself, not only in the instructions, or OpenAI refuses the request. */
    text = String(text || ''); if (!/json/i.test(text)) text += '\nAnswer with the build program as one JSON object only.';
    const started = Date.now();
    this.emit(stage, detail, 'working', started);
    this.calls++;
    let res;
    try {
      res = await fetch(this.endpoint || (typeof window !== 'undefined' && window.__aiEndpoint) || URL, {   // the endpoint can be redirected by a test harness
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL,
          instructions: system || this.system(),
          input: [{ role: 'user', content: [{ type: 'input_text', text: String(text || '') }, ...(images || []).filter(Boolean).map(u => ({ type: 'input_image', image_url: u, detail: 'low' }))] }],
          reasoning: { effort },
          text: { format: { type: 'json_object' }, verbosity: 'low' },
          max_output_tokens: 64000,
          store: false,
          stream: true
        }),
        signal
      });
    } catch (e) {
      if (e && e.name === 'AbortError') { this.lastError = 'stopped'; this.emit('STOPPED', `after ${Math.round((Date.now() - started) / 1000)} s`, 'error'); const err = new Error('stopped'); err.name = 'AbortError'; throw err; }
      this.lastError = 'network';
      this.emit('CONNECTION FAILED', e.message || 'could not reach OpenAI', 'error');
      throw new Error('could not reach OpenAI: ' + (e.message || e));
    }
    if (!res.ok) {
      let msg = String(res.status);
      try { const j = await res.json(); msg = j.error && j.error.message || msg; } catch (e) { }
      this.lastError = msg;
      this.emit('OPENAI ERROR', msg, 'error');
      throw new Error(res.status === 401 ? 'the key was rejected' : res.status === 429 ? 'rate limited or out of credit: ' + msg : 'OpenAI said ' + msg);
    }
    const j = /text\/event-stream/.test(res.headers.get('content-type') || '') ? await readStream(res, onDelta) : await res.json();
    this.lastUsage = j.usage || null;
    this.lastResponseId = j.id || null;
    if (j.status === 'incomplete') {
      const why = j.incomplete_details && j.incomplete_details.reason || 'incomplete response';
      this.lastError = why; if (why !== 'max_output_tokens') this.emit('SOL STOPPED EARLY', why, 'error'); const err = new Error(why === 'max_output_tokens' ? `the model spent all its output room thinking (${effort} reasoning)` : `OpenAI stopped early (${why})`); err.reason = why; err.secs = Math.round((Date.now() - started) / 1000); throw err;
    }
    if (j.status === 'failed') {
      const why = j.error && j.error.message || 'response failed';
      this.lastError = why; this.emit('SOL FAILED', why, 'error'); throw new Error('OpenAI response failed: ' + why);
    }
    const raw = outputText(j);
    const program = parse ? parse(raw) : parseProgram(raw), u = j.usage || {}, reasoning = u.output_tokens_details && u.output_tokens_details.reasoning_tokens;
    this.lastEffort = effort;
    this.emit('SOL ANSWERED', `at ${effort} · ${Math.round((Date.now() - started) / 1000)} s · ${u.total_tokens || 0} tokens${reasoning ? ` (${reasoning} reasoning)` : ''} · ${(program.ops || program.shots || []).length} ${program.shots ? 'shots' : 'ops'}`, 'done', started, { usage: j.usage || null, calls: this.calls, ms: Date.now() - started, ops: (program.ops || []).length, effort });
    return { j, raw, program, ms: Date.now() - started };
  },

  /** A big brief gets a plan first: the parts, where they stand and the box each should fill; the design then builds one group per part. */
  async plan(prompt, { key, context, signal, onPlan } = {}) {
    const text = `${this.userMessage(prompt, context)}\n\nPLAN ONLY, no bricks yet: answer {"name": string, "scale": {"w","d","h"}, "parts": [{"name","role","at":[x,z],"size":[w,d,h],"col"}]} as one JSON object: the subassemblies this build needs (3 to 8, each with a name of its own), where each stands in studs from the origin, the box each should fill in studs and bricks, and its main colour. Read the picture for the ground, the room and the neighbours.`;
    const out = await this.requestSafely(text, { key, signal, images: [context && context.image], stage: '1 / 4 · SOL PLANNING', detail: 'naming the parts and where they stand', parse: parsePlan });
    const plan = out.program; this.emit('PLAN READY', `${plan.parts.length} parts: ${plan.parts.map(p => p.name).join(', ')}`, 'done', 0, { usage: out.j.usage || null, ms: out.ms });
    if (typeof onPlan === 'function') { try { onPlan(plan, { usage: out.j.usage || null }); } catch (e) { } }
    return { plan, usage: out.j.usage || null, raw: out.raw, ms: out.ms };
  },

  async ask(prompt, { key, context, signal, onFirst, onDelta, onPlan, picture } = {}) {
    key = key || this.key(); context = context || {};
    const planned = needsPlan(prompt) ? await this.plan(prompt, { key, context, signal, onPlan }) : null, n = planned ? 4 : 3;
    const brief = this.userMessage(prompt, context) + (planned ? `\n\nPLAN (yours, keep to it): ${JSON.stringify(planned.plan)}\nBuild one group per planned part, named as planned, standing at its planned position and filling about its planned size.` : '');
    const first = await this.requestSafely(brief, {
      key, signal, onDelta, images: [context.image], stage: `${planned ? 2 : 1} / ${n} · SOL DESIGNING`, detail: 'choosing scale, silhouette and construction'
    });

    this.emit(`${planned ? 3 : 2} / ${n} · LOCAL CHECK`, 'compiling the first design into actual LEGO geometry', 'working');
    const r1 = compile(first.program), q1 = quality(first.program, r1), planNotes = planned && r1 && window.Dsl.checkPlan ? window.Dsl.checkPlan(planned.plan, r1) : [], a1 = audit(first.program, r1) + (planNotes.length ? ` Plan: ${planNotes.join('; ')}.` : '');
    if (typeof onFirst === 'function') { try { onFirst(first.program, r1, { usage: first.j.usage || null, planNotes }); } catch (e) { } }   // the page can stand the first design while the review runs
    const extra = { plan: planned ? planned.plan : null, planNotes, planUsage: planned ? planned.usage : null, pictures: (first.images || 0) + (planned ? 1 : 0) };

    const R = genes().router.review, slow = first.ms > (R.skipSlowMs || 150000), eased = R.skipEased !== false && first.effort && first.effort !== 'max';
    if (slow || eased) {                                                       // one long call is enough: the review would double it
      this.emit('REVIEW SKIPPED', slow ? `the design took ${Math.round(first.ms / 60000)} min · change it with words if you like` : `the design needed ${first.effort} reasoning · change it with words if you like`, 'ready');
      return { program: first.program, usage: first.j.usage || null, raw: first.raw, responseId: first.j.id || null, messages: [], brief: prompt, effort: first.effort, ...extra };
    }
    let draftPic = null; if (typeof picture === 'function') { try { draftPic = await picture(first.program, r1); } catch (e) { draftPic = null; } }   // the reviewer sees the first design as built
    const review = `ORIGINAL BRIEF:\n${brief}\n\nFIRST PROGRAM:\n${JSON.stringify(first.program)}\n\nLOCAL AUDIT:\n${a1}\n${draftPic ? '\nThe second picture is the first design as it stands, built.\n' : ''}\nYou are the senior LEGO designer reviewing this first draft. Rebuild the FULL program, not a patch. Preserve what works, but improve first-glance recognition, scale, silhouette, proportion, landmark features and support. Keep the groups and their names. Fix compiler failures. Do not merely make it larger or add generic bricks. JSON only.`;
    let second; try { second = await this.requestSafely(review, { key, signal, images: [context.image, draftPic], stage: `${n} / ${n} · SOL REVIEWING`, detail: 'critiquing the first build and rebuilding weak geometry' }); }
    catch (e) { if (e && e.name === 'AbortError') throw e; this.emit('REVIEW FAILED', `${e.message || e} · keeping the first design`, 'ready'); return { program: first.program, usage: first.j.usage || null, raw: first.raw, responseId: first.j.id || null, messages: [], brief: prompt, effort: first.effort, ...extra }; }
    const r2 = compile(second.program), q2 = quality(second.program, r2); extra.pictures += second.images || 0;

    const useSecond = q2 >= q1 - (R.keepSecondMargin == null ? 1 : R.keepSecondMargin);
    const chosen = useSecond ? second : first;
    const chosenResult = useSecond ? r2 : r1;
    const chosenScore = useSecond ? q2 : q1;
    const rr = chosenResult && chosenResult.report || {};
    this.emit('READY TO PREVIEW', `${rr.pieces || 0} pieces · ${(chosen.program.ops || []).length} ops · ${rr.floating || 0} floating · ${rr.blocked || 0} blocked · quality ${Math.round(chosenScore)}${useSecond ? '' : ' · the first design kept'}`, 'ready');
    return { program: chosen.program, usage: chosen.j.usage || null, raw: chosen.raw, responseId: chosen.j.id || null, messages: [], brief: prompt, chose: useSecond ? 'review' : 'first', scores: [Math.round(q1), Math.round(q2)], ...extra };
  },

  async repair(prev, report, opts = {}) {
    const notes = [];
    if (report.unknown && report.unknown.length) notes.push('unknown ops: ' + report.unknown.map(u => `#${u.i} ${u.op}`).join(', '));
    if (report.errors && report.errors.length) notes.push('errors: ' + report.errors.map(u => `#${u.i} ${u.error}`).join(', '));
    if (report.floating) notes.push(`${report.floating} pieces floated and were dropped`);
    if (report.blocked) notes.push(`${report.blocked} parts collided and were skipped`);
    const text = `CURRENT PROGRAM:\n${JSON.stringify(prev && prev.program || {})}\n\nCOMPILER REPORT:\n${notes.join('; ') || 'host requested a final physical repair'}\n\nReturn the corrected FULL program as JSON only. Preserve recognizable silhouette and intended details; fix support/collisions without collapsing the build into a generic box.`;
    const out = await this.requestSafely(text, { key: opts.key || this.key(), signal: opts.signal, stage: 'COMPILER REPAIR', detail: 'repairing failed physical geometry' });
    const result = compile(out.program), rr = result && result.report || {};
    this.emit('REPAIR READY', `${rr.pieces || 0} pieces · ${rr.floating || 0} floating · ${rr.blocked || 0} blocked`, 'ready');
    return { program: out.program, usage: out.j.usage || null, raw: out.raw, responseId: out.j.id || null, messages: [], brief: prev && prev.brief };
  },

  /** The group the words name, if the program has groups: the longest group name found in the words. */
  groupIn(program, words) {
    const w = ' ' + String(words || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ') + ' '; let best = null;
    for (const o of (program && program.ops) || []) if (o && String(o.op).toLowerCase() === 'group' && o.name) { const nm = ' ' + String(o.name).toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').trim() + ' '; if (nm.trim() && w.includes(nm) && (!best || nm.length > best.length)) best = String(o.name); }
    return best;
  },
  async edit(prev, words, opts = {}) {
    const group = this.groupIn(prev && prev.program, words);
    const text = `CURRENT FULL PROGRAM:\n${JSON.stringify(prev && prev.program || {})}\n\nCHANGE REQUEST:\n${words}\n\n${group ? `The request names the group "${group}": change that group and return every other group exactly as it is, op for op. ` : ''}Return the corrected FULL program as JSON only. Keep everything not asked to change at the same coordinates and apply the requested change to the rest.`;
    const out = await this.requestSafely(text, { key: opts.key || this.key(), signal: opts.signal, onDelta: opts.onDelta, images: [opts.context && opts.context.image], stage: 'SOL CHANGING', detail: String(words || '').slice(0, 80) });
    const result = compile(out.program), rr = result && result.report || {};
    const before = new Map(((prev && prev.program && prev.program.ops) || []).filter(o => o && String(o.op).toLowerCase() === 'group').map(o => [String(o.name), JSON.stringify(o.ops)]));
    const after = ((out.program && out.program.ops) || []).filter(o => o && String(o.op).toLowerCase() === 'group'), kept = after.filter(o => before.get(String(o.name)) === JSON.stringify(o.ops)).map(o => String(o.name)), changed = after.filter(o => before.has(String(o.name)) && before.get(String(o.name)) !== JSON.stringify(o.ops)).map(o => String(o.name));
    this.emit('CHANGE READY', `${rr.pieces || 0} pieces · ${rr.props || 0} props · ${rr.floating || 0} floating${after.length ? ` · groups changed ${changed.join(', ') || 'none'} · kept ${kept.length}` : ''}`, 'ready');
    return { program: out.program, usage: out.j.usage || null, raw: out.raw, responseId: out.j.id || null, messages: [], brief: prev && prev.brief, group, groupsChanged: changed, groupsKept: kept, pictures: out.images || 0 };
  },

  quality: (program, result) => quality(program, result), audit: (program, result) => audit(program, result),
  stats() { return { calls: this.calls, usage: this.lastUsage, error: this.lastError, model: MODEL, effort: EFFORT, lastEffort: this.lastEffort || null, hasKey: !!this.key(), responseId: this.lastResponseId, manifest: this.manifest() }; }
};

window.Ai = Ai;
lsSet(MODEL_KEY, MODEL);
lsSet(EFFORT_KEY, EFFORT);
})();
