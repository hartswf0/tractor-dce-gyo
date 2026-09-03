// Collect runs/S0x/report.json + NOTES.md into results.json and RESULTS.md (the seven castles side by side).
const fs = require('fs'), path = require('path');
const RUNS = path.join(__dirname, 'runs');
const NAMES = { S01: 'FIELD-ROUTING', S02: 'RESIDUAL-PACKET', S03: 'BUILDERS-GAME', S04: 'DECOMPILE-FIRST', S05: 'BODY-AND-JOINTS', S06: 'EVENT-TRIGGERED-CALL', S07: 'CARD-TO-MASSING' };
const rows = [];
for (const s of Object.keys(NAMES)) {
  const d = path.join(RUNS, s); const rp = path.join(d, 'report.json');
  if (!fs.existsSync(rp)) { rows.push({ seed: s, name: NAMES[s], status: 'NO REPORT' }); continue; }
  const r = JSON.parse(fs.readFileSync(rp, 'utf8'));
  const notes = fs.existsSync(path.join(d, 'NOTES.md')) ? fs.readFileSync(path.join(d, 'NOTES.md'), 'utf8') : '';
  const mpd = fs.existsSync(path.join(d, `castle-${s}.mpd`)); const png = fs.existsSync(path.join(d, `castle-${s}.png`));
  rows.push({ seed: s, name: NAMES[s], status: 'DONE', pieces: r.pieces, blocks: r.blocks, wins: r.judge.wins, losses: r.judge.losses, ties: r.judge.ties, share: r.field.share,
    openStructural: r.field.openStructural, structural: r.field.structural, seated: r.seated, refusals: r.refusals, undos: r.undos, calls: r.calls, named: r.named, instances: r.instances, joints: r.joints, rounds: r.rounds,
    axes: r.judge.axes, notes, mpd, png });
}
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'work', 'field', 'field-results.json'), 'utf8')).builds.find(b => b.id === 'card-castle');
const baseline = { seed: 'BASE', name: 'layered builder, no agent (builds/card-castle.mpd)', pieces: base.before.pieces, wins: base.judgeBefore.wins, losses: base.judgeBefore.losses, share: base.before.openStructuralShare, axes: base.judgeBefore.axes };
const out = { generated: new Date().toISOString(), bar: '5935-island-hopper', band: [0.112, 0.431], baseline, seeds: rows };
fs.writeFileSync(path.join(__dirname, 'results.json'), JSON.stringify(out, null, 1));
const pad = (s, n) => String(s == null ? '' : s).padEnd(n);
const lines = ['# ARENA RESULTS — seven seeds, seven castles', '', `bar: 5935 Island Hopper · twelve axes, blind, per axis, ties to the kit · shadow: structural open share (kit band 0.112–0.431) · generated ${out.generated}`, '',
  '| seed | name | pieces | blocks | W/L/T | open share | seated | refusals | undos | calls | named | inst | joints |', '|---|---|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|---|',
  `| BASE | ${baseline.name} | ${baseline.pieces} | 19 | ${baseline.wins}/${baseline.losses}/0 | ${baseline.share} | | | | | | | |`];
for (const r of rows) lines.push(r.status === 'DONE' ? `| ${r.seed} | ${r.name} | ${r.pieces} | ${r.blocks} | ${r.wins}/${r.losses}/${r.ties} | ${r.share} | ${r.seated ?? ''} | ${r.refusals ?? ''} | ${r.undos ?? ''} | ${r.calls ?? (r.rounds != null ? r.rounds + ' rounds' : '')} | ${r.named ? r.named.length : ''} | ${r.instances ?? ''} | ${r.joints ? r.joints.right + '/' + r.joints.wrong : ''} |` : `| ${r.seed} | ${r.name} | ${r.status} | | | | | | | | | | |`);
lines.push('', '## Per-axis verdicts (WIN/LOSS, ours vs bar)', '');
const axIds = (rows.find(r => r.axes) || baseline).axes.map(a => a.id);
lines.push('| axis | bar | BASE | ' + rows.map(r => r.seed).join(' | ') + ' |', '|---|---:|---|' + rows.map(() => '---').join('|') + '|');
for (const id of axIds) { const b = baseline.axes.find(a => a.id === id); lines.push(`| ${id} | ${b.bar} | ${b.verdict[0]} ${b.ours} | ` + rows.map(r => { const a = r.axes && r.axes.find(x => x.id === id); return a ? `${a.verdict[0]} ${a.ours}` : '—'; }).join(' | ') + ' |'); }
lines.push('', '## Notes from each agent', '');
for (const r of rows) if (r.notes) lines.push(`### ${r.seed} — ${r.name}`, '', r.notes.trim(), '');
fs.writeFileSync(path.join(__dirname, 'RESULTS.md'), lines.join('\n') + '\n');
console.log(lines.slice(0, 14).join('\n'));
