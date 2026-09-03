# HILUX — one chassis for every builder

Every builder in this repo runs on the same shell. A page supplies a config
and gets a screen; it never writes layout. That is the whole point: there is
one thing to fix when it is wrong on a phone, and eleven pages get fixed.

```
  head        identity, chips
  ticker      the newest line of the log, one line
  WINDOW      bed (3D) · transport · sheet
  composer    always visible
  RAIL        one rail, down the side, collapsible
```

## The window

The window has three parts and the order matters.

**The bed** is the 3D world. It is the top of the window and nothing is ever
drawn over it. It has a CSS floor of `26dvh`, and the sheet below it is
flex-shrinkable, so no drag and no panel can push the build off screen — the
layout refuses before the arithmetic does. Double-tap the bed to fit.

**The transport** sits directly under the bed: `⏮ · ▶ · scrubber · ⏭ · n/total`.
The scrubber is one dot per round; tapping a dot calls `onTrace(i, point, hx)`.
The play button only appears if the page supplies `onPlay`.

**The sheet** is where every panel goes — the log, the run controls, the
script, the voids. It rises from the bottom of the window and stops, sized by
its grip. Two rests (`58%` and full) plus closed; drag the grip, tap it to
toggle, or hit `✕` to put it away. Closing the sheet is the same thing as
selecting WORLD.

This is the shape the roots had — `operative-builder-trace` kept the scene at
the top of the screen with the discourse sized underneath it, because reading
what a critic said about a build while looking at something else is useless.
Three earlier passes got this wrong: two rails arguing over eighty pixels; one
rail at the base fighting the composer; and panels that covered the world bed
entirely, which is the version that broke the workflow.

## The rail

One rail, vertical, down the right side, with a collapse toggle at its head.
Collapsed it is a 34px strip of glyphs (40px on desktop) and every mode is
still one tap away. The choice is remembered in `localStorage` under `hx.rail`.

`WORLD` and `LOG` are built in. `ROUNDS` is built in but opt-in — a page sets
`rounds: true` and calls `hx.logRound()` once a cycle.

## Mounting

```js
const hx = Hilux.mount({
  title: 'Ground Finch',
  chips: ['round', 'parts'],
  placeholder: 'run · step · brief cave',
  wallEmpty: 'the creed, shown before anything has happened',
  traceEmpty: 'no rounds yet',
  rounds: true,
  panels: [
    { id:'run', label:'RUN', glyph:'▶', title:'the loop', build(el, hx){ … } }
  ],
  onCommand(text, hx){},      // the composer
  onWorld(canvasEl, hx){},    // build your viewer into this element
  onFit(hx){},                // double-tap the bed
  onTrace(i, point, hx){},    // a scrubber dot, or ⏮ / ⏭
  onPlay(playing, hx){},      // optional; shows the play button
  onResize(hx){}              // the bed changed size — resize your renderer
});
```

### What the shell hands back

| call | does |
|---|---|
| `hx.say(who, text, {kind, pre})` | a line on the log and in the ticker |
| `hx.logRound({who, score, delta, text, before, after, changed, decorate})` | a round card |
| `hx.trace(points, activeIdx)` | the scrubber and the `n/total` counter |
| `hx.chip(id, text, cls)` | a chip in the head |
| `hx.status(text)` / `hx.busy(bool)` | the bed's readout / the working flag |
| `hx.show(id)` / `hx.refresh(id)` | open or rebuild a panel |
| `hx.sheet('peek'\|'half'\|'tall'\|'down')` | size the sheet from a page |
| `hx.row / btn / cap / kv / select / viewRow / round / pinnable / toast` | furniture |

`kind` is one of `ok warn bad hot sys`. `decorate(cardEl, hx)` lets a doctrine
put its own thing on a round card — a blast bar, an accusation chain — without
Hilux having to know what either of those is.

## Pages on the chassis

| page | bootstrap |
|---|---|
| `nabugo.html` | `arena-page.js` — duel and aviary, one lane in the bed |
| `lego-operator-trace.html`, `lego-correspondence.html` | `duel-page.js` |
| `finch-ground/cactus/warbler.html` | `finch-page.js` |
| `hms-beagle/isabela/santiago.html` | `expedition-page.js` |
| `cathedral-forager.html`, `medusa-scriptorium.html` | `loop-page.js` |

Every page is under 2 KB. All of the behaviour is in the bootstrap, all of the
layout is in `hilux.css`, and there is no third place.

## Verified

At 390×844 (iPhone-class), 768, and 1440, on every page: one rail, one window,
no page scroll in either axis, taps ≥ 44px, the bed visible on every tab at
every sheet height, the WebGL context surviving every mode switch, and no
console errors.
