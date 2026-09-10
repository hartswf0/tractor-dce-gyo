#!/usr/bin/env python3
"""tools/foundry/dspy_builder.py — the DSPy track: the instruction and the demonstrations optimised against the kernel, nothing else.

The program is one signature, brief and context to a JSON build program. The metric is the compiler: node tools/foundry/metric.js
judges each candidate (class, residual, quality); a receipt's after-actions weigh in when the training set is receipts. The router,
the selector and the DSL stay frozen (they are the other arms). The output is a manifest (genes.rules from the optimised instruction,
genes.demos from the chosen demonstrations) that the page can load and the foundry can compare; this script never edits code.

  pip install dspy
  export OPENAI_API_KEY=...
  python3 tools/foundry/dspy_builder.py receipts.json --out candidate-dspy.json [--model openai/gpt-5.6-sol] [--optimizer bootstrap|mipro] [--max-demos 7]
"""
import argparse, json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))

def judge(text, manifest=None):
    """The kernel's judgement of a program text."""
    payload = json.dumps({"text": text, "manifest": manifest})
    out = subprocess.run(["node", os.path.join(HERE, "metric.js")], input=payload, capture_output=True, text=True)
    try: return json.loads(out.stdout or "{}")
    except json.JSONDecodeError: return {"error": out.stderr[:200], "class": "broken", "quality": -1e9}

def spec():
    """The DSL spec as the page sends it: the kernel's text, never optimised."""
    out = subprocess.run(["node", "-e", "const L=require(process.argv[1]);process.stdout.write(L.Dsl.SPEC)", os.path.join(HERE, "lib.js")], capture_output=True, text=True)
    return out.stdout

def load_receipts(path):
    j = json.load(open(path)); recs = j if isinstance(j, list) else j.get("receipts", [])
    rows = []
    for r in recs:
        if not r.get("program") or not r.get("brief"): continue
        acts = [a.get("act") for a in r.get("after", [])]
        first = next((a for a in acts if a not in ("nudged", "read", "saved")), None)
        ctx = r.get("context") or {}
        rows.append({"brief": r["brief"], "context": f"Ground: {ctx.get('ground', '')}. Nearby: {ctx.get('standing', '')}. Free room: {ctx.get('room', '')}.", "program": json.dumps(r["program"]), "committed": first == "committed", "changed": acts.count("changed")})
    return rows

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("receipts"); ap.add_argument("--out", default="candidate-dspy.json"); ap.add_argument("--model", default="openai/gpt-5.6-sol")
    ap.add_argument("--optimizer", default="bootstrap", choices=["bootstrap", "mipro"]); ap.add_argument("--max-demos", type=int, default=7); ap.add_argument("--base", default=os.path.join(ROOT, "world", "manifest.json"))
    a = ap.parse_args()
    try: import dspy
    except ImportError: print("dspy is not installed: pip install dspy", file=sys.stderr); sys.exit(2)
    rows = load_receipts(a.receipts)
    if len(rows) < 4: print(f"{len(rows)} usable receipts: the optimiser needs a handful of committed builds first", file=sys.stderr); sys.exit(2)
    base = json.load(open(a.base)); rules = base.get("genes", {}).get("rules", [])
    SPEC = spec()

    class BuildProgram(dspy.Signature):
        """You are a LEGO master builder. Answer ONLY with a JSON build program {"name", "ops": [...]} in the DSL below; the compiler is physical reality."""
        spec: str = dspy.InputField(desc="the build language and its rules")
        context: str = dspy.InputField(desc="the ground, the nearest things and the free room where the build will stand")
        brief: str = dspy.InputField(desc="what to build")
        program: str = dspy.OutputField(desc="one JSON object {name, ops}")
    BuildProgram.__doc__ = BuildProgram.__doc__ + "\nRules:\n" + "\n".join("- " + r for r in rules)

    def metric(example, pred, trace=None):
        j = judge(getattr(pred, "program", "") or "")
        if j.get("class") in ("broken", "empty"): return 0.0
        res = j.get("residual", {}); loss = (res.get("floating", 0) + res.get("blocked", 0) + len(res.get("vanished", []))) / max(1, res.get("attempted", 1))
        score = max(0.0, 1.0 - loss) * (1.0 if j.get("class") == "ok" else 0.7)
        return score if trace is None else score > 0.6

    lm = dspy.LM(a.model, api_key=os.environ.get("OPENAI_API_KEY")); dspy.configure(lm=lm)
    program = dspy.Predict(BuildProgram)
    train = [dspy.Example(spec=SPEC, context=r["context"], brief=r["brief"], program=r["program"]).with_inputs("spec", "context", "brief") for r in rows if r["committed"]] or [dspy.Example(spec=SPEC, context=r["context"], brief=r["brief"], program=r["program"]).with_inputs("spec", "context", "brief") for r in rows]
    if a.optimizer == "mipro":
        opt = dspy.MIPROv2(metric=metric, auto="light"); compiled = opt.compile(program, trainset=train, max_bootstrapped_demos=a.max_demos, max_labeled_demos=a.max_demos)
    else:
        opt = dspy.BootstrapFewShot(metric=metric, max_bootstrapped_demos=a.max_demos, max_labeled_demos=a.max_demos); compiled = opt.compile(program, trainset=train)
    demos = []
    for d in getattr(compiled, "demos", []) or []:
        try: demos.append({"ask": d.brief, "program": json.loads(d.program)})
        except Exception: pass
    instr = (compiled.signature.instructions if hasattr(compiled, "signature") else "") or ""
    new_rules = [ln.strip("- ").strip() for ln in instr.split("\n") if ln.strip().startswith("-")] or rules
    out = {"name": f"candidate dspy {a.optimizer}", "version": 1, "about": f"the DSPy track: instruction and demos optimised against the kernel from {a.receipts}; router, selector and DSL frozen", "genes": {**base.get("genes", {}), "rules": new_rules, "demos": demos}}
    json.dump(out, open(a.out, "w"), indent=1, ensure_ascii=False); print(f"written {a.out}: {len(new_rules)} rules, {len(demos)} demos")

if __name__ == "__main__": main()
