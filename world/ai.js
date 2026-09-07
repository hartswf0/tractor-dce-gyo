/* world/ai.js — GPT-5.6 Sol master builder.

   This file deliberately hard-locks the in-world builder to GPT-5.6 Sol at max
   reasoning. world.html may still contain an old model input, and an old browser
   may still have gpt-4o-mini in localStorage; neither is allowed to choose the
   request model anymore.

   The builder now does two passes: Sol designs a program, the deterministic DSL
   compiles it locally, then Sol sees a compact compiler/quality audit and gets one
   chance to rebuild it. We keep the stronger of the two compilable programs.
   Progress is written directly into #mbStat so a long reasoning call never looks
   like a frozen button. */
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
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function installUi() {
  if (document.getElementById('mbAiStyle')) return;
  const style = document.createElement('style');
  style.id = 'mbAiStyle';
  style.textContent = `
    #mbBrainBadge{display:inline-flex;align-items:center;margin-left:8px;padding:3px 7px;border-radius:999px;background:#171c26;color:#fff;font:700 9px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;vertical-align:middle}
    #mbStat.ai-status{margin:7px 0 2px;padding:8px 10px;border-radius:10px;background:rgba(23,28,38,.07);font:11px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace;color:#3f4858;min-height:34px}
    #mbStat.ai-status .ai-top{display:flex;justify-content:space-between;gap:10px;font-weight:800;color:#202632}
    #mbStat.ai-status .ai-sub{margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #mbStat.ai-status .ai-dot{display:inline-block;width:7px;height:7px;margin-right:6px;border-radius:50%;background:#c8901c;animation:mbPulse 1.05s ease-in-out infinite alternate}
    #mbStat.ai-status.ready .ai-dot{background:#2d9b49;animation:none}
    #mbStat.ai-status.error .ai-dot{background:#d8382e;animation:none}
    #mbModel[data-sol-lock="1"]{font-weight:800!important;background:rgba(23,28,38,.06)!important;color:#202632!important}
    @keyframes mbPulse{from{opacity:.25;transform:scale(.8)}to{opacity:1;transform:scale(1.15)}}`;
  document.head.appendChild(style);
}

function lockModelUi() {
  installUi();
  lsSet(MODEL_KEY, MODEL);
  lsSet(EFFORT_KEY, EFFORT);
  const input = document.getElementById('mbModel');
  if (input) {
    input.value = MODEL;
    input.placeholder = MODEL;
    input.readOnly = true;
    input.dataset.solLock = '1';
    input.title = 'Locked: GPT-5.6 Sol · max reasoning';
    input.setAttribute('aria-label', 'Builder model: GPT-5.6 Sol, max reasoning');
  }
  const h = document.querySelector('#mb .h span');
  if (h && !document.getElementById('mbBrainBadge')) {
    const badge = document.createElement('b');
    badge.id = 'mbBrainBadge';
    badge.textContent = '5.6 SOL · MAX';
    h.after(badge);
  }
}

let stageTimer = 0;
function status(stage, detail, state = 'working', started = 0) {
  lockModelUi();
  const el = document.getElementById('mbStat');
  if (!el) return;
  el.className = 'ai-status ' + state;
  const secs = started ? Math.max(0, Math.floor((Date.now() - started) / 1000)) : 0;
  el.innerHTML = `<div class="ai-top"><span><i class="ai-dot"></i>${esc(stage)}</span><span>GPT-5.6 SOL · MAX${started ? ' · ' + secs + 's' : ''}</span></div><div class="ai-sub">${esc(detail || '')}</div>`;
}
function ticking(stage, detail) {
  clearInterval(stageTimer);
  const started = Date.now();
  status(stage, detail, 'working', started);
  stageTimer = setInterval(() => status(stage, detail, 'working', started), 1000);
  return started;
}
function stopTick() { clearInterval(stageTimer); stageTimer = 0; }

function outputText(j) {
  if (typeof j.output_text === 'string' && j.output_text) return j.output_text;
  const chunks = [];
  for (const item of (j.output || [])) {
    if (!item || item.type !== 'message') continue;
    for (const part of (item.content || [])) {
      if (part && part.type === 'output_text' && typeof part.text === 'string') chunks.push(part.text);
    }
  }
  return chunks.join('\n');
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
  const ops = Array.isArray(program && program.ops) ? program.ops : [];
  const counts = {};
  for (const o of ops) {
    const k = String(o && (o.op || o.type || o.kind) || '?').toLowerCase();
    counts[k] = (counts[k] || 0) + 1;
  }
  return counts;
}

function quality(program, result) {
  if (!program || !result) return -1e9;
  const r = result.report || {}, c = opProfile(program);
  const varieties = Object.keys(c).filter(k => k !== '?').length;
  const semantic = ['roof','tower','door','window','arch','stairs','cut','part','minifig','vehicle'].reduce((n,k) => n + (c[k] || 0), 0);
  const boxes = c.box || 0;
  const extent = result.extent || {x0:0,z0:0,x1:0,z1:0};
  const w = Math.max(0, extent.x1 - extent.x0), d = Math.max(0, extent.z1 - extent.z0);
  let s = 0;
  s += Math.min(30, (r.pieces || 0) / 18);
  s += varieties * 3;
  s += Math.min(18, semantic * 1.7);
  s -= (r.floating || 0) * 2.5;
  s -= (r.blocked || 0) * 2;
  s -= ((r.unknown || []).length + (r.errors || []).length) * 18;
  if (boxes >= 3 && varieties < 4) s -= boxes * 3;
  if (w * d > 500) s -= 8;
  if ((program.ops || []).length < 3) s -= 12;
  return s;
}

function audit(program, result) {
  const r = (result && result.report) || {};
  const c = opProfile(program);
  const extent = (result && result.extent) || {x0:0,z0:0,x1:0,z1:0};
  const w = Math.max(0, extent.x1 - extent.x0), d = Math.max(0, extent.z1 - extent.z0);
  const notes = [];
  if ((c.box || 0) >= 2 && Object.keys(c).length < 4) notes.push('too dependent on featureless boxes');
  if (w * d > 500) notes.push('footprint is oversized for an ordinary single object');
  if ((r.floating || 0) > 0) notes.push(`${r.floating} pieces would float and be dropped`);
  if ((r.blocked || 0) > 0) notes.push(`${r.blocked} explicit parts collide`);
  if ((r.unknown || []).length) notes.push('uses unknown operations');
  if ((r.errors || []).length) notes.push('contains compiler errors');
  if (!notes.length) notes.push('compiler accepts it; now improve recognition, proportion and LEGO character rather than merely adding volume');
  return `Compiler: ${r.pieces || 0} placed pieces, ${r.props || 0} props, ${r.floating || 0} floating, ${r.blocked || 0} blocked. Footprint: ${w}×${d} studs. Operation mix: ${JSON.stringify(c)}. Audit: ${notes.join('; ')}.`;
}

const Ai = {
  key: () => lsGet(KEY).trim(),
  setKey: v => lsSet(KEY, (v || '').trim()),

  /* Hard lock. Old UI/localStorage values cannot downgrade a request. */
  model: () => MODEL,
  setModel: () => { lsSet(MODEL_KEY, MODEL); lockModelUi(); },
  effort: () => EFFORT,
  setEffort: () => { lsSet(EFFORT_KEY, EFFORT); },

  calls: 0,
  lastUsage: null,
  lastError: null,
  lastResponseId: null,

  system() {
    const ex = window.Dsl.EXAMPLES.map(e => `Request: ${e.ask}\nAnswer: ${JSON.stringify(e.program)}`).join('\n\n');
    return `${window.Dsl.SPEC}\n\nMASTER BUILDER STANDARD:\nYou are not a text-to-box converter. You are designing a small physical LEGO model that must be recognizable from its silhouette before the user reads its name.\n\nBefore answering, reason privately through: (1) what makes this object identifiable, (2) a sensible LEGO scale, (3) the 3–7 primary masses, (4) structural support, (5) openings/landmarks, (6) colour placement, and (7) construction order.\n\nRules of judgment:\n- Return exactly one JSON object {"name": string, "ops": array}. No markdown or prose.\n- Use only the DSL. Treat the deterministic compiler as physical reality.\n- For an ordinary single object, prefer roughly 6–20 studs across and 3–12 bricks tall. Go larger only when the request actually calls for a monument or building.\n- Do NOT make a giant rectangular box and call it the requested thing. A box is massing, not identity. If you use box, articulate it with semantic operations: roof, tower, wall rhythm, cuts, arches, doors, windows, stairs, slopes/parts, vehicles or figures as appropriate.\n- Establish a primary silhouette, then secondary forms, then a small number of high-information details. Spend bricks on recognition rather than sheer volume.\n- Buildings need believable wall thickness, openings on the wall line, roof logic, and a readable entrance. Vehicles need a front/back, cabin and wheel logic. Towers need a base, shaft and top.\n- Avoid floating decoration. Build bottom-up. Keep connected geometry and intentional overlap only.\n- Use 2–4 main colours unless the brief demands more. Colour bands and accents should describe structure, not noise.\n- Preserve asymmetry when it is characteristic. Do not turn every request into a symmetric castle.\n- If the requested thing has a canonical landmark feature, encode that feature explicitly even if it costs several operations.\n- Prefer 8–35 meaningful ops over either 2 giant ops or 60 tiny decorative ones.\n\nExamples:\n${ex}`;
  },

  userMessage(prompt, context = {}) {
    const bits = [];
    if (context.place) bits.push(`Place: ${context.place}`);
    if (context.world && context.world !== 'earth') bits.push(`Planet: ${context.world}`);
    if (context.ground) bits.push(`Ground: ${context.ground}`);
    if (context.standing) bits.push(`Nearby: ${context.standing}`);
    return `${bits.length ? bits.join('. ') + '.\n' : ''}BUILD BRIEF: ${prompt}\nMake the model read correctly at first glance. Choose the scale yourself; do not fill the available 40×40 area unless the subject truly requires it.`;
  },

  async request(input, { key, signal, stage = 'SOL REASONING', detail = 'designing the build' } = {}) {
    key = key || this.key();
    if (!key) throw new Error('no key: paste an OpenAI API key first');
    lockModelUi();
    ticking(stage, detail);
    this.calls++;
    let res;
    try {
      res = await fetch(URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL,
          instructions: this.system(),
          input,
          reasoning: { effort: EFFORT },
          text: { format: { type: 'json_object' }, verbosity: 'low' },
          max_output_tokens: 24000,
          store: false
        }),
        signal
      });
    } catch (e) {
      stopTick();
      this.lastError = 'network';
      status('CONNECTION FAILED', e.message || 'could not reach OpenAI', 'error');
      throw new Error('could not reach OpenAI: ' + (e.message || e));
    }
    stopTick();
    if (!res.ok) {
      let msg = res.status + '';
      try { const j = await res.json(); msg = (j.error && j.error.message) || msg; } catch (e) { }
      this.lastError = msg;
      status('OPENAI ERROR', msg, 'error');
      throw new Error(res.status === 401 ? 'the key was rejected' : res.status === 429 ? 'rate limited or out of credit: ' + msg : 'OpenAI said ' + msg);
    }
    const j = await res.json();
    this.lastUsage = j.usage || null;
    this.lastResponseId = j.id || null;
    if (j.status === 'incomplete') {
      const why = (j.incomplete_details && j.incomplete_details.reason) || 'incomplete response';
      this.lastError = why;
      status('SOL STOPPED EARLY', why, 'error');
      throw new Error(`OpenAI stopped early (${why})`);
    }
    if (j.status === 'failed') {
      const why = (j.error && j.error.message) || 'response failed';
      this.lastError = why;
      status('SOL FAILED', why, 'error');
      throw new Error('OpenAI response failed: ' + why);
    }
    const raw = outputText(j);
    return { j, raw, program: parseProgram(raw) };
  },

  /* First build + local compile + one visual/structural review pass. */
  async ask(prompt, { key, context, messages, signal } = {}) {
    /* Ignore any model/effort passed by old world.html. */
    key = key || this.key();
    lockModelUi();
    const base = messages || [{ role: 'user', content: this.userMessage(prompt, context) }];

    const first = await this.request(base, {
      key, signal,
      stage: '1 / 3 · SOL DESIGNING',
      detail: 'reading the brief, choosing scale, silhouette and construction'
    });

    status('2 / 3 · LOCAL CHECK', 'compiling Sol’s first design into actual LEGO geometry', 'working');
    const r1 = compile(first.program);
    const q1 = quality(first.program, r1);
    const firstAudit = audit(first.program, r1);

    const reviewPrompt = `You are the senior LEGO designer reviewing your own first draft. Original brief: ${prompt || '(continuation)'}.\n${firstAudit}\nRebuild the FULL program, not a patch. Preserve anything good, but make the object more recognizable at first glance. Fix scale, silhouette, proportion, landmark features, structural support and compiler failures. Do not respond by simply making it larger or adding generic bricks. Return JSON only.`;
    const reviewInput = base.concat([
      { role: 'assistant', content: first.raw },
      { role: 'user', content: reviewPrompt }
    ]);

    const second = await this.request(reviewInput, {
      key, signal,
      stage: '3 / 3 · SOL REVIEWING',
      detail: 'criticizing the first build and rebuilding weak geometry'
    });
    const r2 = compile(second.program);
    const q2 = quality(second.program, r2);

    const useSecond = q2 >= q1 - 1;
    const chosen = useSecond ? second : first;
    const chosenResult = useSecond ? r2 : r1;
    const chosenScore = useSecond ? q2 : q1;
    const rr = chosenResult && chosenResult.report || {};
    status('READY TO PREVIEW', `${chosenResult ? (rr.pieces || 0) + ' pieces · ' + (chosen.program.ops || []).length + ' ops · ' + (rr.floating || 0) + ' floating · ' + (rr.blocked || 0) + ' blocked' : 'build program ready'} · quality ${Math.round(chosenScore)}`, 'ready');

    return {
      program: chosen.program,
      usage: chosen.j.usage || null,
      raw: chosen.raw,
      responseId: chosen.j.id || null,
      messages: useSecond ? reviewInput.concat([{ role: 'assistant', content: second.raw }]) : base.concat([{ role: 'assistant', content: first.raw }])
    };
  },

  /* Compiler-guided repair stays a single pass; ask() already performed design review. */
  async repair(prev, report, opts = {}) {
    const notes = [];
    if (report.unknown && report.unknown.length) notes.push('unknown ops: ' + report.unknown.map(u => `#${u.i} "${u.op}"`).join(', '));
    if (report.errors && report.errors.length) notes.push('errors: ' + report.errors.map(u => `#${u.i} ${u.error}`).join(', '));
    if (report.floating) notes.push(`${report.floating} pieces floated and were dropped`);
    if (report.blocked) notes.push(`${report.blocked} parts overlapped and were skipped`);
    const messages = (prev.messages || []).concat([{ role: 'user', content: `FINAL COMPILER REPAIR. The deterministic LEGO compiler reports: ${notes.join('; ') || 'no hard errors, but the host requested a repair'}. Return the corrected FULL program as JSON only. Keep the recognizable silhouette and intended details; repair support/collisions without collapsing the build into a generic box.` }]);
    const out = await this.request(messages, {
      key: opts.key || this.key(), signal: opts.signal,
      stage: 'COMPILER REPAIR',
      detail: 'Sol is repairing only the geometry that failed the physical compiler'
    });
    const result = compile(out.program), rr = result && result.report || {};
    status('REPAIR READY', `${rr.pieces || 0} pieces · ${rr.floating || 0} floating · ${rr.blocked || 0} blocked`, 'ready');
    return { program: out.program, usage: out.j.usage || null, raw: out.raw, responseId: out.j.id || null, messages: messages.concat([{ role: 'assistant', content: out.raw }]) };
  },

  stats() {
    return { calls: this.calls, usage: this.lastUsage, error: this.lastError, model: MODEL, effort: EFFORT, hasKey: !!this.key(), responseId: this.lastResponseId };
  }
};

window.Ai = Ai;

/* world.html is allowed to be old. Keep forcing its visible control back to truth. */
function bootLock() {
  lockModelUi();
  const input = document.getElementById('mbModel');
  if (input && !input.dataset.solGuard) {
    input.dataset.solGuard = '1';
    const force = () => { if (input.value !== MODEL) input.value = MODEL; lsSet(MODEL_KEY, MODEL); };
    input.addEventListener('input', force);
    input.addEventListener('change', force);
    input.addEventListener('blur', force);
  }
  /* Old host code can assign the input after DOMContentLoaded; correct it again. */
  setTimeout(lockModelUi, 0);
  setTimeout(lockModelUi, 250);
  setTimeout(lockModelUi, 1000);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootLock, { once: true });
else bootLock();
})();
