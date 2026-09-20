#!/usr/bin/env python3
"""Install the complete behavior-bearing assembly integration.

The assembly runtime is a separate bounded module. This installer connects it to the
actual Word to World surfaces that own commitment, pointing, persistence, and room
synchronization. Every edit is anchored and idempotent so drift fails loudly in CI.
"""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NATIVE = ROOT / "odyssey-production" / "native"
HTML = NATIVE / "word-to-world.html"
MAIN = NATIVE / "world" / "main.js"
PTT = NATIVE / "world" / "put-that-there.js"
ASSEMBLIES = NATIVE / "world" / "assemblies.js"


def replace_once(text: str, old: str, new: str, *, label: str) -> str:
    if new in text:
        return text
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected exactly one anchor, found {count}")
    return text.replace(old, new, 1)


def patch_html() -> bool:
    text = HTML.read_text(encoding="utf-8")
    before = text
    text = replace_once(
        text,
        '<script src="./world/main.js?v=playable-11"></script>',
        '<script src="./world/main.js?v=playable-12"></script>',
        label="main cache version",
    )
    text = replace_once(
        text,
        '<script src="./world/behavior.js?v=1"></script>\n<script src="./world/put-that-there.js?v=5"></script>',
        '<script src="./world/behavior.js?v=1"></script>\n<script src="./world/assemblies.js?v=2"></script>\n<script src="./world/put-that-there.js?v=6"></script>',
        label="assembly runtime load",
    )
    if text != before:
        HTML.write_text(text, encoding="utf-8")
        return True
    return False


def patch_main() -> bool:
    text = MAIN.read_text(encoding="utf-8")
    before = text

    text = replace_once(
        text,
        "function resetPlace() { W.build.forget(); if (W.props) W.props.forget(); mbDiscard(true); try { localStorage.removeItem(W.dmgKey); } catch (e) { } W.city.set(W.win.buildings); W.debris.clear(); W.dmgSaved = W.city.knocked; if (W.room && W.room.role) W.room.send({ t: 'reset' }); toast('this place is new again', 1200); }",
        "function resetPlace() { W.build.forget(); if (W.props) W.props.forget(); if (window.WorldAssemblies) WorldAssemblies.clearPlace(false); mbDiscard(true); try { localStorage.removeItem(W.dmgKey); } catch (e) { } W.city.set(W.win.buildings); W.debris.clear(); W.dmgSaved = W.city.knocked; if (W.room && W.room.role) W.room.send({ t: 'reset' }); toast('this place is new again', 1200); }",
        label="place reset",
    )

    text = replace_once(
        text,
        "function rideFor(words, program) {\n  const ops = (program && program.ops) || [];",
        "function rideFor(words, program) {\n  const declared = window.WorldAssemblies && WorldAssemblies.rideForProgram(program); if (declared) return declared;\n  const ops = (program && program.ops) || [];",
        label="behavior-declared ride",
    )

    text = replace_once(
        text,
        "  let added = [], placed = 0; const ride = W.master.ride, hasVeh = res.props.some(pr => pr.kind === 'vehicle');",
        "  let added = [], placed = 0, placedItems = []; const ride = W.master.ride, hasVeh = res.props.some(pr => pr.kind === 'vehicle');",
        label="commit member capture",
    )
    text = replace_once(
        text,
        "    const it = await W.props.place(text, a.x + dx, a.y, a.z + dz, yaw, false, src); if (it) placed++;",
        "    const it = await W.props.place(text, a.x + dx, a.y, a.z + dz, yaw, false, src); if (it) { placed++; placedItems.push({ item: it, op: -1 }); }",
        label="ride prop capture",
    )
    text = replace_once(
        text,
        "    for (let i = 0; i < props.length; i++) { const pl = props[i]; const it = await W.props.place(res.props[i].mpd, pl.x, pl.y, pl.z, pl.yaw, false, res.props[i].src || null); if (it) placed++; }",
        "    for (let i = 0; i < props.length; i++) { const pl = props[i]; const it = await W.props.place(res.props[i].mpd, pl.x, pl.y, pl.z, pl.yaw, false, res.props[i].src || null); if (it) { placed++; placedItems.push({ item: it, op: res.props[i].op }); } }",
        label="compiled prop capture",
    )
    text = replace_once(
        text,
        "  const prog = W.master.conv && W.master.conv.program; if (prog && Array.isArray(prog.ops) && prog.ops.length) { const sv = saveBuild(prog, (W.master.words && !/^what stands here/.test(W.master.words) ? W.master.words.split(' · ')[0] : prog.name) || prog.name); if (sv) mbLog('info', `kept in the library as \"${sv.name}\"`); }",
        "  const prog = W.master.conv && W.master.conv.program;\n  if (prog && window.WorldAssemblies) { const asm = WorldAssemblies.registerCommit({ program: prog, result: res, pieces: added, props: placedItems, anchor: { ...W.master.anchor }, rotation: W.master.rot, ride: ride && !hasVeh ? ride : '', words: W.master.words || '' }); if (asm) mbLog('info', `assembly graph: ${asm.records.length} identities · ${asm.members} members${asm.links ? ` · ${asm.links} links` : ''}`); }\n  if (prog && Array.isArray(prog.ops) && prog.ops.length) { const sv = saveBuild(prog, (W.master.words && !/^what stands here/.test(W.master.words) ? W.master.words.split(' · ')[0] : prog.name) || prog.name); if (sv) mbLog('info', `kept in the library as \"${sv.name}\"`); }",
        label="assembly registration",
    )

    text = replace_once(
        text,
        "  const program = Dsl.decompile(rows, pr, { name: 'what stands here' }), res = Dsl.compile(program), words = Dsl.caption(program);",
        "  const program = Dsl.decompile(rows, pr, { name: 'what stands here' }); if (window.WorldAssemblies) WorldAssemblies.decorateProgram(program, [...cluster.keys()], props.map(it => it.id)); const res = Dsl.compile(program), words = Dsl.caption(program);",
        label="decompile behavior preservation",
    )

    text = replace_once(
        text,
        "function snapFor(id) { W.room.send({ t: 'snap', build: W.build.rows(), props: W.props.rows(), damage: W.city.removedSets(), crowd: W.crowd.serialize(), world: W.world }, { to: id }); }",
        "function snapFor(id) { W.room.send({ t: 'snap', build: W.build.rows(), props: W.props.rows(), damage: W.city.removedSets(), crowd: W.crowd.serialize(), assemblies: window.WorldAssemblies ? WorldAssemblies.snapshot() : null, world: W.world }, { to: id }); }",
        label="room snapshot assemblies",
    )
    text = replace_once(
        text,
        "if (m.crowd) W.crowd.applyRemote(m.crowd); if (mine.length",
        "if (m.crowd) W.crowd.applyRemote(m.crowd); if (m.assemblies && window.WorldAssemblies) WorldAssemblies.applySnapshot(m.assemblies, true); if (mine.length",
        label="apply room assembly snapshot",
    )
    text = replace_once(
        text,
        "    case 'p': applyRemote(from, m); break;",
        "    case 'assembly': if (window.WorldAssemblies) WorldAssemblies.applyRemote(m.op); break;\n    case 'p': applyRemote(from, m); break;",
        label="assembly room operation",
    )
    text = replace_once(
        text,
        "    case 'reset': W.build.clear(); W.props.clear(); W.city.set(W.win.buildings); W.debris.clear(); toast('the place was reset', 1000); break;",
        "    case 'reset': W.build.clear(); W.props.clear(); if (window.WorldAssemblies) WorldAssemblies.clearPlace(true); W.city.set(W.win.buildings); W.debris.clear(); toast('the place was reset', 1000); break;",
        label="remote assembly reset",
    )

    if text != before:
        MAIN.write_text(text, encoding="utf-8")
        return True
    return False


def patch_ptt() -> bool:
    text = PTT.read_text(encoding="utf-8")
    before = text

    text = replace_once(
        text,
        "const label = hit => !hit ? '—' : hit.kind === 'piece' ? (hit.name || 'brick') : hit.kind === 'prop' ? (hit.name || 'model') : hit.kind === 'building' ? (hit.name || 'building') : 'ground';",
        "const label = hit => !hit ? '—' : hit.kind === 'assembly' ? (hit.name || 'assembly') : hit.kind === 'piece' ? (hit.name || 'brick') : hit.kind === 'prop' ? (hit.name || 'model') : hit.kind === 'building' ? (hit.name || 'building') : 'ground';",
        label="assembly label",
    )

    text = replace_once(
        text,
        "    state.that = { ...hit, point: hit.point.clone() }; state.there = null; const verbs = window.WorldBehavior ? WorldBehavior.describeShort(state.that) : ''; sayLine('THAT is ' + label(hit) + (verbs ? ' · ' + verbs : '') + '. Say an operation or point where.', '');\n    showSelection(hit.box);",
        "    const raw = { ...hit, point: hit.point.clone() }, assembly = window.WorldAssemblies && WorldAssemblies.resolve(raw); state.that = assembly || raw; state.there = null; const verbs = window.WorldBehavior ? WorldBehavior.describeShort(state.that) : ''; sayLine('THAT is ' + label(state.that) + (verbs ? ' · ' + verbs : '') + '. Say an operation or point where.', '');\n    showSelection(window.WorldAssemblies ? (WorldAssemblies.box(state.that) || hit.box) : hit.box);",
        label="bind whole assembly",
    )

    parse_anchor = "  else if (/\\b(stop|halt|freeze)\\b/.test(text)) verb = 'stop';\n"
    parse_insert = parse_anchor + (
        "  else if (/\\bwhen\\b.*\\b(that|this|it)\\b.*\\b(activates?|opens?|closes?|breaks?|depletes?|is destroyed)\\b/.test(text)) verb = 'arm';\n"
        "  else if (/\\bopen\\b.*\\bwhen\\b.*\\b(triggered|activated|ready)\\b/.test(text)) verb = 'link-open';\n"
        "  else if (/\\bclose\\b.*\\bwhen\\b.*\\b(triggered|activated|ready)\\b/.test(text)) verb = 'link-close';\n"
        "  else if (/\\bactivate\\b.*\\bwhen\\b.*\\b(triggered|activated|ready)\\b/.test(text)) verb = 'link-activate';\n"
        "  else if (/\\b(remove|delete|destroy)\\b.*\\bwhen\\b.*\\b(triggered|activated|ready)\\b/.test(text)) verb = 'link-remove';\n"
    )
    text = replace_once(text, parse_anchor, parse_insert, label="link language")

    text = replace_once(
        text,
        "needsThat: /^(move|copy|remove|turn|taller|teach|inspect|open|close|activate|hit|mount)$/.test(verb)",
        "needsThat: /^(move|copy|remove|turn|taller|teach|inspect|open|close|activate|hit|mount|arm|link-open|link-close|link-activate|link-remove)$/.test(verb)",
        label="local assembly command requirements",
    )
    text = replace_once(
        text,
        "if(window.WorldBehavior&&/^(teach|inspect|open|close|activate|hit|mount)$/.test(local.verb)){execute(local);return;}",
        "if((window.WorldBehavior&&/^(teach|inspect|open|close|activate|hit|mount)$/.test(local.verb))||(window.WorldAssemblies&&/^(arm|link-open|link-close|link-activate|link-remove)$/.test(local.verb))){execute(local);return;}",
        label="local assembly inference",
    )
    text = replace_once(
        text,
        "needsThat:/^(move|copy|remove|turn|taller|teach|inspect|open|close|activate|hit|mount)$/.test(a.act)",
        "needsThat:/^(move|copy|remove|turn|taller|teach|inspect|open|close|activate|hit|mount|arm|link-open|link-close|link-activate|link-remove)$/.test(a.act)",
        label="model assembly command requirements",
    )

    text = replace_once(
        text,
        "    if(ref){state.that=ref;showSelection(ref.box);}",
        "    if(ref){const assembly=window.WorldAssemblies&&WorldAssemblies.resolve(ref);state.that=assembly||ref;showSelection(window.WorldAssemblies?(WorldAssemblies.box(state.that)||ref.box):ref.box);}",
        label="model-selected assembly",
    )

    dispatch_anchor = "  if (window.WorldBehavior && /^(teach|inspect|open|close|activate|hit|mount)$/.test(cmd.verb)) {\n"
    dispatch_insert = (
        "  if (window.WorldAssemblies && /^(arm|link-open|link-close|link-activate|link-remove)$/.test(cmd.verb)) {\n"
        "    const result = WorldAssemblies.perform(cmd.verb, state.that, { text: cmd.text, world: W, kind: 'voice' });\n"
        "    sayLine(result.message || (result.ok ? 'Complete.' : 'That link is not available.'), result.ok ? '' : 'speak'); if (result.ok) resetBindings(); return !!result.ok;\n"
        "  }\n"
        "  if (window.WorldAssemblies && WorldAssemblies.isAssembly(state.that) && /^(move|copy|remove|turn)$/.test(cmd.verb)) {\n"
        "    const result = WorldAssemblies.manipulate(cmd.verb, state.that, { destination: state.there && state.there.point, text: cmd.text, world: W });\n"
        "    const finish = r => { sayLine((r && r.message) || (r && r.ok ? cmd.verb.toUpperCase() + ' complete.' : 'That assembly operation failed.'), r && r.ok ? '' : 'speak'); if (r && r.ok) resetBindings(); };\n"
        "    if (result && typeof result.then === 'function') { result.then(finish).catch(e => sayLine(e.message || 'That assembly operation failed.', 'speak')); return true; } finish(result); return !!(result && result.ok);\n"
        "  }\n"
        + dispatch_anchor
    )
    text = replace_once(text, dispatch_anchor, dispatch_insert, label="assembly operation dispatch")

    if text != before:
        PTT.write_text(text, encoding="utf-8")
        return True
    return False


def verify() -> None:
    html = HTML.read_text(encoding="utf-8")
    main = MAIN.read_text(encoding="utf-8")
    ptt = PTT.read_text(encoding="utf-8")
    asm = ASSEMBLIES.read_text(encoding="utf-8")
    assert 'world/assemblies.js?v=2' in html
    assert 'WorldAssemblies.registerCommit' in main
    assert 'WorldAssemblies.decorateProgram' in main
    assert 'WorldAssemblies.snapshot()' in main
    assert "case 'assembly'" in main
    assert 'WorldAssemblies.resolve(raw)' in ptt
    assert 'WorldAssemblies.manipulate' in ptt
    assert 'link-open' in ptt
    assert 'BEHAVIOR-BEARING ASSEMBLIES' in asm


def main() -> None:
    changed = {
        "word-to-world.html": patch_html(),
        "main.js": patch_main(),
        "put-that-there.js": patch_ptt(),
    }
    verify()
    for name, did_change in changed.items():
        print(f"{'patched' if did_change else 'already patched'}: {name}")


if __name__ == "__main__":
    main()
