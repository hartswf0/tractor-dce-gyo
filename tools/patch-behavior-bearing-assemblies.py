#!/usr/bin/env python3
"""Install the behavior-bearing assembly vertical slice.

The patch is intentionally narrow and idempotent:
- load world/behavior.js in Word to World;
- route a small behavior vocabulary through Put That There;
- let Odysseus' sword damage behavior-bearing world objects.
"""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NATIVE = ROOT / "odyssey-production" / "native"
HTML = NATIVE / "word-to-world.html"
PTT = NATIVE / "world" / "put-that-there.js"
ODYSSEY = NATIVE / "world" / "odyssey-play.js"


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
        '<script src="./world/horse-motion.js?v=1"></script><script src="./world/odyssey-play.js?v=playable-10"></script>',
        '<script src="./world/horse-motion.js?v=1"></script><script src="./world/odyssey-play.js?v=playable-11"></script>',
        label="HTML odyssey cache version",
    )
    text = replace_once(
        text,
        '<script src="./world/put-that-there.js?v=4"></script>',
        '<script src="./world/behavior.js?v=1"></script>\n<script src="./world/put-that-there.js?v=5"></script>',
        label="HTML behavior load",
    )
    if text != before:
        HTML.write_text(text, encoding="utf-8")
        return True
    return False


def patch_ptt() -> bool:
    text = PTT.read_text(encoding="utf-8")
    before = text

    text = replace_once(
        text,
        "    state.that = { ...hit, point: hit.point.clone() }; state.there = null; sayLine('THAT is ' + label(hit) + '. Now point where.', '');\n",
        "    state.that = { ...hit, point: hit.point.clone() }; state.there = null; const verbs = window.WorldBehavior ? WorldBehavior.describeShort(state.that) : ''; sayLine('THAT is ' + label(hit) + (verbs ? ' · ' + verbs : '') + '. Say an operation or point where.', '');\n",
        label="PTT bind description",
    )

    parse_anchor = "  else if (/\\b(stop|halt|freeze)\\b/.test(text)) verb = 'stop';\n"
    parse_insert = parse_anchor + (
        "  else if (/\\b(make|teach|mark|turn)\\b.*\\b(openable|door|gate|hatch|target|damageable|breakable|rideable|vehicle|mount|activatable|switch|trigger|moveable|movable|rotatable|turnable)\\b/.test(text)) verb = 'teach';\n"
        "  else if (/\\b(inspect|describe|read|what is|what can)\\b/.test(text)) verb = 'inspect';\n"
        "  else if (/\\b(open)\\b/.test(text)) verb = 'open';\n"
        "  else if (/\\b(close|shut)\\b/.test(text)) verb = 'close';\n"
        "  else if (/\\b(activate|use|trigger|switch)\\b/.test(text)) verb = 'activate';\n"
        "  else if (/\\b(hit|strike|cut|slash|attack|damage)\\b/.test(text)) verb = 'hit';\n"
        "  else if (/\\b(mount|ride|board)\\b/.test(text)) verb = 'mount';\n"
    )
    text = replace_once(text, parse_anchor, parse_insert, label="PTT behavior verbs")

    text = replace_once(
        text,
        "  return { verb, text, needsThat: /^(move|copy|remove|turn|taller)$/.test(verb), needsThere: /^(move|copy|walk)$/.test(verb), thisWord: /\\b(this|that|these|those|it)\\b/.test(text), thereWord: /\\b(here|there)\\b/.test(text) };\n",
        "  return { verb, text, needsThat: /^(move|copy|remove|turn|taller|teach|inspect|open|close|activate|hit|mount)$/.test(verb), needsThere: /^(move|copy|walk)$/.test(verb), thisWord: /\\b(this|that|these|those|it)\\b/.test(text), thereWord: /\\b(here|there)\\b/.test(text) };\n",
        label="PTT needsThat",
    )

    infer_anchor = "  if(window.OdysseyPerformance && /^(walk forward|ride forward|reverse|turn left|turn right|stop)$/i.test(words.trim())){OdysseyPerformance.command(words);return;}\n"
    infer_insert = infer_anchor + "  const local=parse(words);if(window.WorldBehavior&&/^(teach|inspect|open|close|activate|hit|mount)$/.test(local.verb)){execute(local);return;}\n"
    text = replace_once(text, infer_anchor, infer_insert, label="PTT local behavior inference")

    text = replace_once(
        text,
        "    const cmd={verb:a.act,text:a.words||words,needsThat:/^(move|copy|remove|turn|taller)$/.test(a.act),needsThere:/^(move|copy|walk)$/.test(a.act),thisWord:false,thereWord:false};\n",
        "    const cmd={verb:a.act,text:a.words||words,needsThat:/^(move|copy|remove|turn|taller|teach|inspect|open|close|activate|hit|mount)$/.test(a.act),needsThere:/^(move|copy|walk)$/.test(a.act),thisWord:false,thereWord:false};\n",
        label="PTT inferred needsThat",
    )

    execute_anchor = "  if (cmd.needsThere && !state.there) { state.pending = cmd; sayLine('Where? Point at the ground and pinch.', 'speak'); paintBindings(); return false; }\n  let ok = false;\n"
    execute_insert = (
        "  if (cmd.needsThere && !state.there) { state.pending = cmd; sayLine('Where? Point at the ground and pinch.', 'speak'); paintBindings(); return false; }\n"
        "  if (window.WorldBehavior && /^(teach|inspect|open|close|activate|hit|mount)$/.test(cmd.verb)) {\n"
        "    const result = WorldBehavior.perform(cmd.verb, state.that, { text: cmd.text, world: W, kind: 'voice' });\n"
        "    sayLine(result.message || (result.ok ? 'Complete.' : 'That operation is not available.'), result.ok ? '' : 'speak');\n"
        "    if (result.ok && cmd.verb !== 'inspect') resetBindings();\n"
        "    return !!result.ok;\n"
        "  }\n"
        "  let ok = false;\n"
    )
    text = replace_once(text, execute_anchor, execute_insert, label="PTT behavior dispatch")

    if text != before:
        PTT.write_text(text, encoding="utf-8")
        return True
    return False


def patch_odyssey() -> bool:
    text = ODYSSEY.read_text(encoding="utf-8")
    before = text
    anchor = " return n;\n}\nasync function prepare(W)"
    insertion = " if(window.WorldBehavior)n+=WorldBehavior.attackCone({world:W,origin:p,facing:f,range:110,vertical:100,damage:35,kind:'sword'});\n return n;\n}\nasync function prepare(W)"
    text = replace_once(text, anchor, insertion, label="Odyssey sword behavior bridge")
    if text != before:
        ODYSSEY.write_text(text, encoding="utf-8")
        return True
    return False


def verify() -> None:
    html = HTML.read_text(encoding="utf-8")
    ptt = PTT.read_text(encoding="utf-8")
    odyssey = ODYSSEY.read_text(encoding="utf-8")
    behavior = NATIVE / "world" / "behavior.js"
    assert behavior.exists(), "behavior.js missing"
    assert './world/behavior.js?v=1' in html, "behavior.js is not loaded"
    assert 'WorldBehavior.perform' in ptt, "Put That There behavior dispatch missing"
    assert 'make|teach|mark|turn' in ptt, "behavior teaching vocabulary missing"
    assert 'WorldBehavior.attackCone' in odyssey, "Odysseus sword bridge missing"


def main() -> None:
    changed = {
        "word-to-world.html": patch_html(),
        "put-that-there.js": patch_ptt(),
        "odyssey-play.js": patch_odyssey(),
    }
    verify()
    for name, did_change in changed.items():
        print(f"{'patched' if did_change else 'already patched'}: {name}")


if __name__ == "__main__":
    main()
