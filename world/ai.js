/* world/ai.js — the master builder's brain: GPT-5.6 Sol reasons, then returns one compact build program.

   The key lives in this browser only (localStorage 'openai_api_key', shared with
   fork.html and the tetrad pages) and goes straight to api.openai.com. No key is
   committed to the repo. The model never writes LDraw: it answers with the build
   language in world/dsl.js, so the deterministic compiler remains the authority.
   One compiler-guided repair call at most. */
(function () {
'use strict';
const URL = 'https://api.openai.com/v1/responses';
const KEY = 'openai_api_key', MODEL_KEY = 'world.ai.model', EFFORT_KEY = 'world.ai.effort';
const DEFAULT_MODEL = 'gpt-5.6-sol', DEFAULT_EFFORT = 'max';
const LEGACY_MODEL = /^gpt-4o(?:$|-)/i;
const EFFORTS = new Set(['none', 'low', 'medium', 'high', 'xhigh', 'max']);
const lsGet = k => { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } };
const lsSet = (k, v) => { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (e) { } };
const outputText = j => {
  if (typeof j.output_text === 'string' && j.output_text) return j.output_text;
  const chunks = [];
  for (const item of (j.output || [])) {
    if (!item || item.type !== 'message') continue;
    for (const part of (item.content || [])) if (part && part.type === 'output_text' && typeof part.text === 'string') chunks.push(part.text);
  }
  return chunks.join('\n');
};
const Ai = {
  key: () => lsGet(KEY).trim(), setKey: v => lsSet(KEY, (v || '').trim()),
  model: () => {
    const saved = lsGet(MODEL_KEY).trim();
    /* Old 4o-era builder choices should not pin this world to a weaker model forever. */
    if (!saved || LEGACY_MODEL.test(saved)) {
      if (saved) lsSet(MODEL_KEY, DEFAULT_MODEL);
      return DEFAULT_MODEL;
    }
    return saved;
  },
  setModel: v => {
    const requested = (v || '').trim();
    lsSet(MODEL_KEY, (!requested || LEGACY_MODEL.test(requested)) ? DEFAULT_MODEL : requested);
  },
  effort: () => {
    const e = lsGet(EFFORT_KEY).trim().toLowerCase();
    return EFFORTS.has(e) ? e : DEFAULT_EFFORT;
  },
  setEffort: v => { const e = (v || '').trim().toLowerCase(); lsSet(EFFORT_KEY, EFFORTS.has(e) ? e : DEFAULT_EFFORT); },
  calls: 0, lastUsage: null, lastError: null, lastResponseId: null,

  /** Stable request prefix: language + build judgment + examples. */
  system() {
    const ex = window.Dsl.EXAMPLES.map(e => `Request: ${e.ask}\nAnswer: ${JSON.stringify(e.program)}`).join('\n');
    return `${window.Dsl.SPEC}\n\nMASTER BUILDER JUDGMENT:\n- Think through the object, scale, support, silhouette, openings, symmetry/asymmetry, and construction order before producing the answer. Keep that reasoning private.\n- Return exactly one JSON object {"name": string, "ops": array}. No markdown, prose, comments, or alternative versions.\n- Use only operations and fields defined by the build language above. Never invent an op.\n- Build from supported lower structure toward upper detail. Prefer stable, connected geometry; avoid floating pieces and unnecessary overlap.\n- Translate the user's visual intent into recognizable LEGO proportions rather than merely naming the requested object. Use repeated architectural rhythm, stepped forms, roofs, openings, props, and figures when they materially improve recognition.\n- Spend complexity where it changes the silhouette or meaning. A smaller coherent model is better than a huge generic box.\n- Treat the compiler as reality: the program must compile, not merely sound plausible.\n\nExamples:\n${ex}`;
  },

  /** context: { place, world, standing: string, ground: string } describing where the build goes. */
  userMessage(prompt, context = {}) {
    const bits = [];
    if (context.place) bits.push(`Place: ${context.place}`);
    if (context.world && context.world !== 'earth') bits.push(`Planet: ${context.world}`);
    if (context.ground) bits.push(`Ground: ${context.ground}`);
    if (context.standing) bits.push(`Nearby: ${context.standing}`);
    return `${bits.length ? bits.join('. ') + '.\n' : ''}Build: ${prompt}`;
  },

  /** Ask GPT-5.6 Sol through the Responses API. Resolves { program, usage, raw, messages }. */
  async ask(prompt, { key, model, effort, context, messages, signal } = {}) {
    key = key || this.key(); model = model || this.model(); effort = (effort || this.effort()).toLowerCase();
    if (!key) throw new Error('no key: paste an OpenAI API key first');
    if (!EFFORTS.has(effort)) effort = DEFAULT_EFFORT;

    const input = messages || [{ role: 'user', content: this.userMessage(prompt, context) }];
    const body = {
      model,
      instructions: this.system(),
      input,
      reasoning: { effort },
      text: { format: { type: 'json_object' }, verbosity: 'low' },
      max_output_tokens: 24000,
      store: false
    };

    this.calls++;
    let res;
    try {
      res = await fetch(URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body), signal
      });
    } catch (e) {
      this.lastError = 'network';
      throw new Error('could not reach OpenAI: ' + (e.message || e));
    }

    if (!res.ok) {
      let msg = res.status + '';
      try { const j = await res.json(); msg = (j.error && j.error.message) || msg; } catch (e) { }
      this.lastError = msg;
      throw new Error(res.status === 401 ? 'the key was rejected' : res.status === 429 ? 'rate limited or out of credit: ' + msg : 'OpenAI said ' + msg);
    }

    const j = await res.json();
    this.lastUsage = j.usage || null; this.lastResponseId = j.id || null;
    if (j.status === 'incomplete') {
      const why = (j.incomplete_details && j.incomplete_details.reason) || 'incomplete response';
      this.lastError = why;
      throw new Error(`OpenAI stopped early (${why}); try xhigh/high reasoning or a simpler build`);
    }
    if (j.status === 'failed') {
      const why = (j.error && j.error.message) || 'response failed';
      this.lastError = why; throw new Error('OpenAI response failed: ' + why);
    }

    const raw = outputText(j);
    let program = null;
    try { program = JSON.parse(raw); }
    catch (e) {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) { try { program = JSON.parse(m[0]); } catch (x) { } }
    }
    if (!program || !Array.isArray(program.ops)) throw new Error('the model did not answer with a build program');

    return {
      program,
      usage: j.usage || null,
      raw,
      responseId: j.id || null,
      messages: input.concat([{ role: 'assistant', content: raw }])
    };
  },

  /** One fresh compiler-guided revision; never more than this. */
  async repair(prev, report, opts = {}) {
    const notes = [];
    if (report.unknown && report.unknown.length) notes.push('unknown ops: ' + report.unknown.map(u => `#${u.i} "${u.op}"`).join(', '));
    if (report.errors && report.errors.length) notes.push('errors: ' + report.errors.map(u => `#${u.i} ${u.error}`).join(', '));
    if (report.floating) notes.push(`${report.floating} pieces had nothing under them and were dropped`);
    if (report.blocked) notes.push(`${report.blocked} parts overlapped other parts and were skipped`);
    const messages = (prev.messages || []).concat([{ role: 'user', content: `The deterministic LEGO compiler reports: ${notes.join('; ')}. Reconsider the geometry, then answer with the corrected FULL program as JSON only. Preserve the user's intended object and recognizable details, but fix structural/compiler failures rather than merely deleting most of the build.` }]);
    return this.ask('', { ...opts, messages });
  },

  stats() { return { calls: this.calls, usage: this.lastUsage, error: this.lastError, model: this.model(), effort: this.effort(), hasKey: !!this.key(), responseId: this.lastResponseId }; },
};
window.Ai = Ai;

/* Keep the builder UI truthful even if world.html still carries an old 4o-era placeholder. */
const syncBuilderModelUi = () => {
  const input = document.getElementById('mbModel');
  if (!input) return;
  input.placeholder = 'gpt-5.6-sol (default)';
  input.title = 'GPT-5.6 Sol · max reasoning by default';
  if (!input.value || LEGACY_MODEL.test(input.value.trim())) input.value = Ai.model();
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', syncBuilderModelUi, { once: true });
else syncBuilderModelUi();
})();
