# Cascade project: the Odyssey in Cascade

Read `README.md` first: the five graphs, what each reads and makes, and the commands. Read `node_modules/cascade/AGENTS.md` for the
framework. What follows the project notes is the guide `cascade new` wrote, kept because it is right for this project too.

## This project

- Every node is **definition-v1** and **`runsOn: 'portable'`**, CPU and Canvas 2D only: each graph must cook under `cascade run`
  and in the static player (`cascade build`). Do not add file, Python, shell or GPU nodes to a graph that has a player; put such
  work in `tools/` and hand its result to the graph as an asset (as `tools/clashes.py` and `tools/extract.cjs` do), or read the
  graph's output asset afterwards (as `tools/gesture_kit.py` does).
- Shared code lives in `lib/` as pure functions. A node module may not hold a module-level value, not even a `const` arrow
  function (`architecture/module-state`): write helpers as `function` declarations or put them in `lib/`.
- Parameters a visitor changes are listed in `graphs.json`, and must hold plain values in the graph (an expression wins over
  `setProp`). Node **inputs** take values only; put anything animated on a **prop**.
- `cascade.geo.Merge` fills attributes a piece lacks with zeros, so geometry without `Cd` turns transparent after a merge: give
  it colour first (`project.Paint`, or a `Cd` of its own).
- Before committing: `npm run check`, `npm run check:graphs`, `npm run verify`; after a graph changes, `npm run build` (players)
  and `npm run media`, then `python3 ../../tools/forage/product/cascadepage.py`.
- Never change the data this project reads (`odyssey/choreo`, `odyssey/cards`, `odyssey/cineosis`, `tools/forage/product/*.py`), with one
  exception: `tools/rig_export.mjs` writes the rig desk's lanes into `odyssey/choreo/<scene>.json` `overrides` (listed in `overrides._desk`).
- The rig graphs (`rig-*.cascade`) are opened in Studio, not played on the page (`player: false` in graphs.json). A director's key goes on
  a MinifigRig prop; hand-edit channels as `{ value, channel: { keys: [{ frame, value, interpolation? }] } }`, frame = t * 12 + 1.

## The guide `cascade new` wrote

## Read this first

`node_modules/cascade/doc/NODE_REFERENCE.md` — every built-in node with its inputs, props and outputs, generated from the definitions themselves. Read it before creating a wrapper for an existing node. Time-based parameter changes usually need an expression or channel.

## Common commands

- Run `npm install` in this directory first. Scripts use the project's installed Cascade version; use `npx --no-install cascade` for direct local CLI commands.
- `npm run check` — type-check custom nodes.
- `npm run check:graphs` — statically check every graph and the node definitions.
- `npm run verify` — cook every graph headless, bounded, and check its outputs (writes `verify.json`).
- There is no `index.cascade`: name the graph (`kit.cascade`, `attention.cascade`, `clocks.cascade`, `forbidden.cascade`, `facing.cascade`).
- `cascade kit.cascade` — launch local Studio on loopback (never bind it to a public interface).
- `cascade . --host KURO --port 3030` — launch for `http://KURO:3030` on a trusted VPN/LAN.

Do not start another Cascade process on an occupied port. Remote access requires
both the explicit bind address and the exact trusted browser hostname.

## The `.cascade` document format

Hand-editing is supported. Preserve metadata, source fields, IDs, and valid connection endpoints, then run the static checks. This example uses the node below; save it at `nodes/Multiply/index.ts` before running the graph.

```json
{
  "version": "0.2",
  "metadata": { "name": "My Sketch" },
  "nodes": [
    {
      "id": "multiply",
      "module": "project.Multiply",
      "position": [240, 200],
      "source": "project",
      "props": { "factor": { "value": 2, "expression": "2 + sin($T)" } }
    }
  ],
  "connections": [],
  "annotations": []
}
```

Five things that are easy to get wrong:

- **Use `module` for the module identity and `"source": "project"` for project modules.** Unresolved modules need investigation even when validation only warns.
- **`position` is `[x, y]`**, an array, not `{x, y}`.
- **Definition-v1 stored parameter values belong under `props`.** A leftover `params` array is not read by the deterministic runtime; `runtime/stray-params` warns about stranded values.
- **A connection is a pair of triples**: `[[fromNode, portIndex, portName], [toNode, portIndex, portName]]`. Direction comes from *position in the pair* — first is the source. The middle number is the **port index**, not a direction.
- **A prop is a bare value or `{ value, expression?, channel? }`.** Channels take precedence over expressions, then stored values. Save the binding, not just its value at the playhead.

## Before writing a node, check whether you need one

**Parameters can hold expressions**, and this is usually the answer to anything time-based. The variables are Houdini's:

| | |
|---|---|
| `$F` | frame, integer |
| `$FF` | frame, fractional |
| `$T` | seconds — **zero on the first frame** |
| `$FPS` | rate |
| `ch("node/param")`, `ch("./param")` | read another parameter |

So "oscillate the angle" is `sin($T) * 40` in the `angle` prop. **There is no built-in oscillator node and you do not need one.** A node earns its place when it produces geometry or pixels, or when several parameters share a computation.

`fit`, `fit01`, `clamp`, `lerp`, `smooth`, `noise` and `random` are all available inside an expression.

The maths library is exposed bare, so write `sin(x)` rather than `Math.sin(x)`. Angles are in **radians**, unlike Houdini; `sind`, `cosd`, `tand`, `radians()` and `degrees()` are there for a formula carried across, and `PI`, `TAU` and `E` are in scope.

## Writing a node

Project nodes live at `nodes/<name>/index.ts`, one folder per module, referenced as `project.<name>`. Write them in the **definition-v1** style, which is what `cascade node <Name>` scaffolds:

```ts
import type { NodeDefinition, NodeExecutionContext } from 'cascade/contracts';

export const definition = {
  apiVersion: 1,
  label: 'Multiply',
  icon: 'Circle',                    // a Lucide icon name
  runsOn: 'portable',                // 'portable' | 'browser' | 'server'
  inputs: {
    value: { kind: 'data', type: 'float', default: 3 },
  },
  outputs: {
    result: { kind: 'data', type: 'float' },
  },
  props: {
    factor: { type: 'float', default: 2, min: 0, max: 10, step: 0.1 },
  },
} as const satisfies NodeDefinition;

export function execute(context: NodeExecutionContext<typeof definition>) {
  context.outputs.result.set(context.inputs.value * context.props.factor);
}
```

The declaration is the point: ports, types, props and the execution locus are read from the literal without running anything, which is what `cascade check` inspects and what the Definition panel shows. `execute` then does computation only — it never declares a port.

### Use the vector types

Anything with an x and a y is **one** `vec2`, not two floats. Same for `vec3` and `vec4`, with `vec2i`, `vec3i` and `vec4i` for integer counts and pixel sizes. Positions, offsets, scales, and resolutions use vector ports; colours use the core `color` type.

```ts
// Wrong
props: { offset_x: { type: 'float', default: 0 }, offset_y: { type: 'float', default: 0 } }

// Right
props: { offset: { type: 'vec2', default: [0, 0] } }
```

Not a style preference. Two floats that are really one vector cannot be connected to a `vec2` output, get two rows in the Inspector instead of one control, need two keyframes to animate one movement, and let a graph carry an x without its y. The type system knows what a `vec2` is; it cannot know that `offset_x` and `offset_y` belong together.

Split only when the components differ in kind. Vector props support `min`, `max`, and `step`, with one range across their components.

Studio and a compatible CLI host cook this style. **Studio** builds ports from the compiled definition and calls `execute` with a real `NodeExecutionContext`; **`cascade run`** uses the deterministic runtime when the node's execution locus and capabilities are supported. A browser-only declaration still prevents a Node-host run.

The **dynamic** style — `execute(node, graph)` declaring ports with `node.in`, `node.param`, and `node.out` — remains supported by Studio and the CLI compatibility engine. It cannot provide the same static checks. Studio may mix both styles; the CLI rejects mixed graphs. Convert deliberately with saved-value and output comparisons.

Definition-v1 props support default `expression` values. An explicitly saved value overrides that default, even when equal to the numeric default. Both fully definition-v1 and supported dynamic graphs can render sequences with `cascade run index.cascade --frames 1-100`, subject to host capabilities.

For a standalone browser page or embed, use `cascade build index.cascade --out web-player` with a new output directory. Add `--asset assets/file.svg` for each asset addressed from code; typed literal asset/image references in the document are included automatically. Serve the result over HTTP(S). This player supports definition-v1 browser/portable nodes with assets or GPU capabilities, not server operations or dynamic modules. See `node_modules/cascade/doc/WEB_PLAYER.md` for iframe and programmatic controls.

Either way the module is a real ES module and the loader needs the `execute` export. Top-level side effects do not belong in it.

## Rendering

Prefer Canvas 2D, WebGL, and WebGPU for interactive rendering. Use Python or another server stage for libraries and tools that require it. Transport, serialization, and cold starts can affect parameter-drag latency; persistent workers can avoid repeated process/model startup.

Definition-v1 image nodes can use `saveImage(canvas, cachePath(context.nodeId, '.png'))` from `cascade/io`. The instance ID provides a cache namespace, not graph access. Final artefacts may instead use an explicit filename. Optional Skia supplies Canvas2D APIs; optional Dawn separately supplies WebGPU. Neither overrides a browser-only declaration or supplies the DOM.

Use `browser` only for code that genuinely needs the page, such as the DOM or WebGL. Prefer `new OffscreenCanvas(width, height)` to `document.createElement('canvas')` when both hosts can run the same node.

WebGPU nodes declare `capabilities: ['gpu']` and use `context.capabilities.gpu` for the shared device and per-node cache. Portable GPU nodes run in Studio or the optional Dawn CLI host. Import usage constants and explicit RGBA8 `readTexture` from `cascade/gpu`, then encode through the image/IO host. Graph texture exchange remains future work. For agent image feedback use `cascade run index.cascade --frames 1 --json --timeout 60000`; see `node_modules/cascade/doc/HEADLESS_GPU.md` for limitations.

## Finding out what exists

- `node_modules/cascade/doc/PROJECT_AUTHORING.md` — project layout and the node contract.
- `node_modules/cascade/ARCHITECTURE.md` — what each package owns.
- `GET /api/nodes` on the running server — the project's own modules, with their `runsOn` and icons.
- `node_modules/cascade/dist/runtime/builtins/` — the built-in node definitions, as the shipped type declarations. (`packages/` is not in the published `files` list, so an installed copy has no source tree.)
- The **Definition panel** in Studio shows, for any selected node, where it is defined and what it declares.

## Verification and shared development

Cascade's build refreshes `dist/`, which running Studio servers may serve. Coordinate a core rebuild with anyone using that checkout; routine sketch edits do not require rebuilding Cascade.

Use `npm run check:graphs` for static checks and `npm run verify` for headless cooks. A browser-only node may pass static checks with an environment warning and still be refused by the CLI; verify it in Studio instead. Compare actual outputs after edits and distinguish recorded measurements from tests run in the current session.
