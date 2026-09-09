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

function compile(program) {
  if (!window.Dsl || typeof window.Dsl.compile !== 'function') return null;
  try { return window.Dsl.compile(program); } catch (e) { return null; }
}

function opProfile(program) {
  const out = {};
  for (const o of (program && Array.isArray(program.ops) ? program.ops : [])) {
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
  let s = 0;
  s += Math.min(28, (r.pieces || 0) / 18);
  s += varieties * 3;
  s += Math.min(20, semantic * 1.8);
  s -= (r.floating || 0) * 2.8;
  s -= (r.blocked || 0) * 2.2;
  s -= ((r.unknown || []).length + (r.errors || []).length) * 20;
  if ((c.box || 0) >= 3 && varieties < 4) s -= (c.box || 0) * 4;
  if (w * d > 500) s -= 10;
  if ((program.ops || []).length < 4) s -= 14;
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
    const ex = window.Dsl.EXAMPLES.map(e => `Request: ${e.ask}\nAnswer: ${JSON.stringify(e.program)}`).join('\n\n');
    return `${window.Dsl.SPEC}\n\nMASTER BUILDER STANDARD:\nYou are designing a small physical LEGO model, not naming a pile of boxes. It must be recognizable from silhouette and proportion before the user reads its name.\n\nReason privately through: identifying features, sensible LEGO scale, primary masses, support, landmark openings/details, colour placement, and bottom-up construction.\n\nRules:\n- Return exactly one JSON object {"name": string, "ops": array}; no markdown or prose.\n- Use only the DSL and treat the compiler as physical reality.\n- For an ordinary single object, prefer about 6–20 studs across and 3–12 bricks tall unless the subject truly requires more.\n- A box is only massing. Never make one large cuboid and call it the requested object. Articulate silhouette with roofs, towers, walls, cuts, arches, openings, slopes/parts, vehicles or figures when appropriate.\n- Establish 3–7 primary/secondary masses before small details. Spend complexity on recognition.\n- Buildings need a readable entrance, openings on wall lines, and roof logic. Vehicles need front/back, cabin and wheel logic. Towers need base, shaft and top.\n- Build bottom-up; avoid floating decoration and accidental overlap.\n- Use 2–4 main colours unless the brief requires more.\n- Preserve characteristic asymmetry.\n- Encode canonical landmark features explicitly.\n- Prefer 8–35 meaningful ops over either 2 giant ops or 60 tiny decorative ops.\n\nExamples:\n${ex}`;
  },

  userMessage(prompt, context = {}) {
    const bits = [];
    if (context.place) bits.push(`Place: ${context.place}`);
    if (context.world && context.world !== 'earth') bits.push(`Planet: ${context.world}`);
    if (context.ground) bits.push(`Ground: ${context.ground}`);
    if (context.standing) bits.push(`Nearby: ${context.standing}`);
    return `${bits.length ? bits.join('. ') + '.\n' : ''}BUILD BRIEF: ${prompt}\nChoose the scale yourself. Make it read correctly at first glance; do not fill the 40×40 workspace just because it exists.`;
  },

  /* The ladder when the model spends all its output room on private reasoning: the same text again with less reasoning, twice at most. */
  async requestSafely(text, opts = {}) {
    const ladder = ['max', 'high', 'medium']; let err = null;
    for (let i = 0; i < ladder.length; i++) {
      const effort = ladder[i], t = i ? `${text}\nYou ran out of output room last time: keep private reasoning short and answer with the JSON program.` : text;
      try { const out = await this.request(t, { ...opts, effort, detail: i ? `${opts.detail || ''} · again at ${effort} reasoning` : opts.detail }); out.effort = effort; return out; }
      catch (e) { err = e; if (e && e.reason === 'max_output_tokens' && i < ladder.length - 1) { this.emit('SOL RAN OUT OF ROOM', `after ${e.secs || '?'} s at ${effort} reasoning · trying again at ${ladder[i + 1]}`, 'working'); continue; } throw e; }
    }
    throw err;
  },

  async request(text, { key, signal, stage = 'SOL REASONING', detail = 'designing', effort = EFFORT, onDelta } = {}) {
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
          instructions: this.system(),
          input: [{ role: 'user', content: [{ type: 'input_text', text: String(text || '') }] }],
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
    const program = parseProgram(raw), u = j.usage || {}, reasoning = u.output_tokens_details && u.output_tokens_details.reasoning_tokens;
    this.lastEffort = effort;
    this.emit('SOL ANSWERED', `at ${effort} · ${Math.round((Date.now() - started) / 1000)} s · ${u.total_tokens || 0} tokens${reasoning ? ` (${reasoning} reasoning)` : ''} · ${(program.ops || []).length} ops`, 'done', started, { usage: j.usage || null, calls: this.calls, ms: Date.now() - started, ops: (program.ops || []).length, effort });
    return { j, raw, program, ms: Date.now() - started };
  },

  async ask(prompt, { key, context, signal, onFirst, onDelta } = {}) {
    key = key || this.key();
    const first = await this.requestSafely(this.userMessage(prompt, context), {
      key, signal, onDelta, stage: '1 / 3 · SOL DESIGNING', detail: 'choosing scale, silhouette and construction'
    });

    this.emit('2 / 3 · LOCAL CHECK', 'compiling the first design into actual LEGO geometry', 'working');
    const r1 = compile(first.program), q1 = quality(first.program, r1), a1 = audit(first.program, r1);
    if (typeof onFirst === 'function') { try { onFirst(first.program, r1, { usage: first.j.usage || null }); } catch (e) { } }   // the page can stand the first design while the review runs

    const slow = first.ms > 150000, eased = first.effort && first.effort !== 'max';
    if (slow || eased) {                                                       // one long call is enough: the review would double it
      this.emit('REVIEW SKIPPED', slow ? `the design took ${Math.round(first.ms / 60000)} min · change it with words if you like` : `the design needed ${first.effort} reasoning · change it with words if you like`, 'ready');
      return { program: first.program, usage: first.j.usage || null, raw: first.raw, responseId: first.j.id || null, messages: [], brief: prompt, effort: first.effort };
    }
    const review = `ORIGINAL BRIEF:\n${this.userMessage(prompt, context)}\n\nFIRST PROGRAM:\n${JSON.stringify(first.program)}\n\nLOCAL AUDIT:\n${a1}\n\nYou are the senior LEGO designer reviewing this first draft. Rebuild the FULL program, not a patch. Preserve what works, but improve first-glance recognition, scale, silhouette, proportion, landmark features and support. Fix compiler failures. Do not merely make it larger or add generic bricks. JSON only.`;
    let second; try { second = await this.requestSafely(review, { key, signal, stage: '3 / 3 · SOL REVIEWING', detail: 'critiquing the first build and rebuilding weak geometry' }); }
    catch (e) { if (e && e.name === 'AbortError') throw e; this.emit('REVIEW FAILED', `${e.message || e} · keeping the first design`, 'ready'); return { program: first.program, usage: first.j.usage || null, raw: first.raw, responseId: first.j.id || null, messages: [], brief: prompt, effort: first.effort }; }
    const r2 = compile(second.program), q2 = quality(second.program, r2);

    const useSecond = q2 >= q1 - 1;
    const chosen = useSecond ? second : first;
    const chosenResult = useSecond ? r2 : r1;
    const chosenScore = useSecond ? q2 : q1;
    const rr = chosenResult && chosenResult.report || {};
    this.emit('READY TO PREVIEW', `${rr.pieces || 0} pieces · ${(chosen.program.ops || []).length} ops · ${rr.floating || 0} floating · ${rr.blocked || 0} blocked · quality ${Math.round(chosenScore)}`, 'ready');
    return { program: chosen.program, usage: chosen.j.usage || null, raw: chosen.raw, responseId: chosen.j.id || null, messages: [], brief: prompt };
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

  async edit(prev, words, opts = {}) {
    const text = `CURRENT FULL PROGRAM:\n${JSON.stringify(prev && prev.program || {})}\n\nCHANGE REQUEST:\n${words}\n\nReturn the corrected FULL program as JSON only. Keep everything not asked to change at the same coordinates and apply the requested change to the rest.`;
    const out = await this.requestSafely(text, { key: opts.key || this.key(), signal: opts.signal, onDelta: opts.onDelta, stage: 'SOL CHANGING', detail: String(words || '').slice(0, 80) });
    const result = compile(out.program), rr = result && result.report || {};
    this.emit('CHANGE READY', `${rr.pieces || 0} pieces · ${rr.props || 0} props · ${rr.floating || 0} floating`, 'ready');
    return { program: out.program, usage: out.j.usage || null, raw: out.raw, responseId: out.j.id || null, messages: [], brief: prev && prev.brief };
  },

  stats() { return { calls: this.calls, usage: this.lastUsage, error: this.lastError, model: MODEL, effort: EFFORT, lastEffort: this.lastEffort || null, hasKey: !!this.key(), responseId: this.lastResponseId }; }
};

window.Ai = Ai;
lsSet(MODEL_KEY, MODEL);
lsSet(EFFORT_KEY, EFFORT);
})();
