#!/usr/bin/env python3
"""Harden the V2 assembly integration after the complete vertical slice is installed.

The changes here close four boundary failures that only appear when the new system is
used through the actual page rather than the isolated runtime test:
- read/decompile must keep behavior and links in the active builder program;
- stale replaced assembly records must be reconciled at commit time;
- model and hover referents must resolve stable assembly ids, not fall back to members;
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
