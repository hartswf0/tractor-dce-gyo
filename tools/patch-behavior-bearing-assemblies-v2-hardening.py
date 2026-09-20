#!/usr/bin/env python3
"""Harden the V2 assembly integration after the complete vertical slice is installed.

The changes here close failures that only appear when the new system is used through
actual page boundaries rather than the isolated runtime:
- read/decompile must keep behavior and links in the active builder program;
- stale replaced assembly records must be reconciled at commit time;
- model and hover referents must resolve stable assembly ids, not fall back to members;
- "whole build" must resolve the root identity even when a named subassembly was bound;
- multi-piece transforms must be atomic and roll back when one placement is blocked;
- cyclic event graphs must share one visited set through nested transitions.
"""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NATIVE = ROOT / "odyssey-production" / "native"
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


def patch_main() -> bool:
    text = MAIN.read_text(encoding="utf-8")
    before = text
    text = replace_once(
        text,
        "if (prog && window.WorldAssemblies) { const asm = WorldAssemblies.registerCommit({ program: prog, result: res, pieces: added, props: placedItems, anchor: { ...W.master.anchor }, rotation: W.master.rot, ride: ride && !hasVeh ? ride : '', words: W.master.words || '' }); if (asm) mbLog('info', `assembly graph: ${asm.records.length} identities · ${asm.members} members${asm.links ? ` · ${asm.links} links` : ''}`); }",
        "if (prog && window.WorldAssemblies) { const asm = WorldAssemblies.registerCommit({ program: prog, result: res, pieces: added, props: placedItems, anchor: { ...W.master.anchor }, rotation: W.master.rot, ride: ride && !hasVeh ? ride : '', words: W.master.words || '' }); if (asm) { const graph = WorldAssemblies.reconcile(); mbLog('info', `assembly graph: ${asm.records.length} identities · ${asm.members} members${asm.links ? ` · ${asm.links} links` : ''}${graph.ok ? '' : ' · repaired'}`); } }",
        label="commit reconciliation",
    )
    text = replace_once(
        text,
        "W.master.rot = 0; W.master.conv = { program: { name: program.name, ops: program.ops }, messages: null };",
        "W.master.rot = 0; W.master.conv = { program: { ...program, name: program.name, ops: program.ops }, messages: null };",
        label="read keeps assembly theory",
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
        "function findReferent(id) {\n  if(!id)return state.that;\n  if(W.build&&W.build.pieces.has(id))",
        "function findReferent(id) {\n  if(!id)return state.that;\n  if(window.WorldAssemblies){const a=WorldAssemblies.resolve({kind:'assembly',id});if(a)return a;}\n  if(W.build&&W.build.pieces.has(id))",
        label="model can name assembly ids",
    )
    text = replace_once(
        text,
        "  if (cmd.thisWord && !state.that && state.hover && state.hover.kind !== 'ground') state.that = { ...state.hover, point: state.hover.point.clone() };",
        "  if (cmd.thisWord && !state.that && state.hover && state.hover.kind !== 'ground') { const raw = { ...state.hover, point: state.hover.point.clone() }; state.that = window.WorldAssemblies ? (WorldAssemblies.resolve(raw) || raw) : raw; }",
        label="hover resolves whole assembly",
    )
    if text != before:
        PTT.write_text(text, encoding="utf-8")
        return True
    return False


def patch_assemblies() -> bool:
    text = ASSEMBLIES.read_text(encoding="utf-8")
    before = text

    text = replace_once(
        text,
        "  if (target.kind === 'assembly') { const rec = store.assemblies[target.id] || target.item; return rec ? assemblyTarget(rec, target.memberTarget) : null; }",
        "  if (target.kind === 'assembly') { let rec = store.assemblies[target.id] || target.item; if (opts?.whole && rec?.rootId) rec = store.assemblies[rec.rootId] || rec; return rec ? assemblyTarget(rec, target.memberTarget) : null; }",
        label="whole commands resolve root assembly",
    )

    old_apply = """function applyTransforms(rec, snapshot) {
  const w = W(); if (!w) return false; const rows = [];
  for (const [id, t] of Object.entries(snapshot?.pieces || {})) {
    const p = w.build?.pieces?.get?.(id); if (!p) continue; w.build.take(id, true); p.x = +t.x; p.y = +t.y; p.z = +t.z; p.rot = +t.rot & 3; p.box = null; const q = w.build.add(p, true); if (q) rows.push(w.build.toRow(q));
  }
  if (rows.length) { w.build.dirty = true; if (w.build.onEdit) w.build.onEdit({ up: rows }); }
  for (const [id, t] of Object.entries(snapshot?.props || {})) { const p = w.props?.items?.get?.(id); if (p) w.props.moveTo(p, +t.x, +t.y, +t.z, +t.yaw, false); }
  recordBounds(rec); return !!(rows.length || Object.keys(snapshot?.props || {}).length);
}"""
    new_apply = """function applyTransforms(rec, snapshot) {
  const w = W(); if (!w) return false;
  const original = snapshotTransforms(rec), objects = new Map(), inserted = [], rows = [];
  for (const id of Object.keys(snapshot?.pieces || {})) { const p = w.build?.pieces?.get?.(id); if (p) { objects.set(id, p); w.build.take(id, true); } }
  const restore = () => {
    for (const id of inserted) w.build.take(id, true);
    for (const [id, t] of Object.entries(original.pieces || {})) { const p = objects.get(id); if (!p) continue; p.x = +t.x; p.y = +t.y; p.z = +t.z; p.rot = +t.rot & 3; p.box = null; w.build.add(p, true); }
  };
  for (const [id, t] of Object.entries(snapshot?.pieces || {})) {
    const p = objects.get(id); if (!p) continue; p.x = +t.x; p.y = +t.y; p.z = +t.z; p.rot = +t.rot & 3; p.box = null; const q = w.build.add(p, true);
    if (!q) { restore(); return false; }
    inserted.push(q.id); rows.push(w.build.toRow(q));
  }
  if (rows.length) { w.build.dirty = true; if (w.build.onEdit) w.build.onEdit({ up: rows }); }
  for (const [id, t] of Object.entries(snapshot?.props || {})) { const p = w.props?.items?.get?.(id); if (p) w.props.moveTo(p, +t.x, +t.y, +t.z, +t.yaw, false); }
  recordBounds(rec); return !!(rows.length || Object.keys(snapshot?.props || {}).length);
}"""
    text = replace_once(text, old_apply, new_apply, label="atomic multi-piece transform")

    text = replace_once(
        text,
        "fire(rec.id, desired ? 'opened' : 'closed', new Set());",
        "fire(rec.id, desired ? 'opened' : 'closed', context?.visited || new Set());",
        label="open transition keeps visited set",
    )
    text = replace_once(
        text,
        "if (hp <= 0) { fire(rec.id, 'depleted', new Set());",
        "if (hp <= 0) { fire(rec.id, 'depleted', context?.visited || new Set());",
        label="depletion keeps visited set",
    )
    text = replace_once(
        text,
        "function activate(target) {",
        "function activate(target, context) {",
        label="activate accepts transition context",
    )
    text = replace_once(
        text,
        "fire(rec.id, type, new Set()); return { ok: true, message: `${rec.label} ${type}.`, active: rec.state.active };",
        "fire(rec.id, type, context?.visited || new Set()); return { ok: true, message: `${rec.label} ${type}.`, active: rec.state.active };",
        label="activation keeps visited set",
    )
    text = replace_once(
        text,
        "const result = link.action === 'open' ? setOpen(target, true, { fromLink: true }) : link.action === 'close' ? setOpen(target, false, { fromLink: true }) : link.action === 'activate' ? activate(target) : removeAssembly(target, { fromLink: true });",
        "const result = link.action === 'open' ? setOpen(target, true, { fromLink: true, visited }) : link.action === 'close' ? setOpen(target, false, { fromLink: true, visited }) : link.action === 'activate' ? activate(target, { fromLink: true, visited }) : removeAssembly(target, { fromLink: true, visited });",
        label="linked transition propagates visited set",
    )
    text = replace_once(
        text,
        "if (verb === 'open') return setOpen(a, true, context || {}); if (verb === 'close') return setOpen(a, false, context || {}); if (verb === 'activate') return activate(a);",
        "if (verb === 'open') return setOpen(a, true, context || {}); if (verb === 'close') return setOpen(a, false, context || {}); if (verb === 'activate') return activate(a, context || {});",
        label="direct activate passes context",
    )
    text = replace_once(
        text,
        "function manipulate(verb, target, context) {\n  verb = String(verb || '').toLowerCase(); if (verb === 'move') return moveAssembly(target, context?.destination); if (verb === 'copy') return copyAssembly(target, context?.destination); if (verb === 'remove') return removeAssembly(target, context || {}); if (verb === 'turn') return turnAssembly(target); return { ok: false, message: `No assembly operation for ${verb}.` };\n}",
        "function manipulate(verb, target, context) {\n  verb = String(verb || '').toLowerCase(); if (/\\b(whole|entire|all|build)\\b/i.test(context?.text || '')) target = resolve(target, { whole: true }) || target; if (verb === 'move') return moveAssembly(target, context?.destination); if (verb === 'copy') return copyAssembly(target, context?.destination); if (verb === 'remove') return removeAssembly(target, context || {}); if (verb === 'turn') return turnAssembly(target); return { ok: false, message: `No assembly operation for ${verb}.` };\n}",
        label="whole manipulation uses root assembly",
    )
    text = replace_once(
        text,
        "function installMenu() {\n  const menu = document.getElementById?.('menu'); if (!menu || menu.querySelector('.assemblies-row')) { paintMenu(); return false; }",
        "function installMenu() {\n  const menu = document.getElementById?.('menu'); if (menu) { const legacy = menu.querySelector('.behavior-row'); if (legacy) legacy.hidden = true; } if (!menu || menu.querySelector('.assemblies-row')) { paintMenu(); return false; }",
        label="hide legacy single-object menu",
    )
    if text != before:
        ASSEMBLIES.write_text(text, encoding="utf-8")
        return True
    return False


def verify() -> None:
    main = MAIN.read_text(encoding="utf-8")
    ptt = PTT.read_text(encoding="utf-8")
    asm = ASSEMBLIES.read_text(encoding="utf-8")
    assert "program: { ...program" in main
    assert "WorldAssemblies.reconcile()" in main
    assert "resolve({kind:'assembly',id})" in ptt
    assert "WorldAssemblies.resolve(raw) || raw" in ptt
    assert "opts?.whole && rec?.rootId" in asm
    assert "const original = snapshotTransforms(rec)" in asm
    assert "restore(); return false" in asm
    assert "context?.visited || new Set()" in asm
    assert "activate(target, { fromLink: true, visited })" in asm
    assert "legacy.hidden = true" in asm


def main() -> None:
    changed = {
        "main.js": patch_main(),
        "put-that-there.js": patch_ptt(),
        "assemblies.js": patch_assemblies(),
    }
    verify()
    for name, did_change in changed.items():
        print(f"{'hardened' if did_change else 'already hardened'}: {name}")


if __name__ == "__main__":
    main()
