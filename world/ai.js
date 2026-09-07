/* world/ai.js — the master builder's brain: one call to OpenAI, a JSON program back.

   The key lives in this browser only (localStorage 'openai_api_key', shared with
   fork.html and the tetrad pages) and goes straight to api.openai.com. The model
   never writes LDraw: it answers with the build language in world/dsl.js, so a
   castle costs a few hundred output tokens. One repair call at most. */
(function () {
'use strict';
const URL = 'https://api.openai.com/v1/chat/completions', KEY = 'openai_api_key', MODEL_KEY = 'world.ai.model', DEFAULT_MODEL = 'gpt-4o-mini';
const lsGet = k => { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }, lsSet = (k, v) => { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (e) { } };
const Ai = {
  key: () => lsGet(KEY).trim(), setKey: v => lsSet(KEY, (v || '').trim()),
  model: () => lsGet(MODEL_KEY).trim() || DEFAULT_MODEL, setModel: v => lsSet(MODEL_KEY, (v || '').trim()),
  calls: 0, lastUsage: null, lastError: null,
  /** The static part of every request: the language, then the examples. */
  system() { const ex = window.Dsl.EXAMPLES.map(e => `Request: ${e.ask}\nAnswer: ${JSON.stringify(e.program)}`).join('\n'); return `${window.Dsl.SPEC}\n\nExamples:\n${ex}`; },
  /** context: { place, world, standing: string, ground: string } describing where the build goes. */
  userMessage(prompt, context = {}) {
    const bits = []; if (context.place) bits.push(`Place: ${context.place}`); if (context.world && context.world !== 'earth') bits.push(`Planet: ${context.world}`); if (context.ground) bits.push(`Ground: ${context.ground}`); if (context.standing) bits.push(`Nearby: ${context.standing}`);
    return `${bits.length ? bits.join('. ') + '.\n' : ''}Build: ${prompt}`;
  },
  /** Ask for a program. Resolves { program, usage, raw }; rejects with a readable Error. */
  async ask(prompt, { key, model, context, messages, temperature = 0.4, signal } = {}) {
    key = key || this.key(); model = model || this.model();
    if (!key) throw new Error('no key: paste an OpenAI API key first');
    const body = { model, temperature, response_format: { type: 'json_object' }, messages: messages || [{ role: 'system', content: this.system() }, { role: 'user', content: this.userMessage(prompt, context) }] };
    this.calls++;
    let res; try { res = await fetch(URL, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal }); }
    catch (e) { this.lastError = 'network'; throw new Error('could not reach OpenAI: ' + (e.message || e)); }
    if (!res.ok) { let msg = res.status + ''; try { const j = await res.json(); msg = (j.error && j.error.message) || msg; } catch (e) { } this.lastError = msg; throw new Error(res.status === 401 ? 'the key was rejected' : res.status === 429 ? 'rate limited or out of credit: ' + msg : 'OpenAI said ' + msg); }
    const j = await res.json(); this.lastUsage = j.usage || null;
    const raw = (((j.choices || [])[0] || {}).message || {}).content || '';
    let program = null; try { program = JSON.parse(raw); } catch (e) { const m = raw.match(/\{[\s\S]*\}/); if (m) { try { program = JSON.parse(m[0]); } catch (x) { } } }
    if (!program || !Array.isArray(program.ops)) throw new Error('the model did not answer with a program');
    return { program, usage: j.usage || null, raw, messages: body.messages.concat([{ role: 'assistant', content: raw }]) };
  },
  /** One more turn with the compiler's complaints; never more than this. */
  async repair(prev, report, opts = {}) {
    const notes = [];
    if (report.unknown && report.unknown.length) notes.push('unknown ops: ' + report.unknown.map(u => `#${u.i} "${u.op}"`).join(', '));
    if (report.errors && report.errors.length) notes.push('errors: ' + report.errors.map(u => `#${u.i} ${u.error}`).join(', '));
    if (report.floating) notes.push(`${report.floating} pieces had nothing under them and were dropped`);
    if (report.blocked) notes.push(`${report.blocked} parts overlapped other parts and were skipped`);
    const messages = prev.messages.concat([{ role: 'user', content: `The compiler reports: ${notes.join('; ')}. Answer again with the corrected full program (JSON only), keeping everything else the same.` }]);
    return this.ask('', { ...opts, messages });
  },
  stats() { return { calls: this.calls, usage: this.lastUsage, error: this.lastError, model: this.model(), hasKey: !!this.key() }; },
};
window.Ai = Ai;
})();
