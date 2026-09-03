# S07 — CARD-TO-MASSING   (read slipcase/_PROMPTS/S07__CARD-TO-MASSING.txt first)
"The reference card compiles to a build order."

You write the CARD, never the LDraw. Look at the reference image
/home/user/tractor-dce-gyo/references/05-castle-fortress.png and the existing card build
/home/user/tractor-dce-gyo/builds/card-castle.png. Read the schema in
/home/user/tractor-dce-gyo/nabugo-brand.js (search for "const CARDS" — the castle and fallingwater
entries): massing entries of kind block {name, at:{x,z}, studs, courses, roof:'cone'|'ridge'|null,
window, door, opening, instances:[{x,z}], layerRole}, wall {name, from:{x,z}, to:{x,z}, courses,
crenellate, gate}, terrace {name, at, studs, level}, water {name, at}; plus ground (part id),
colours {structure:[…], skin, accent, ground}, figures [{x,z}], props [{x,z}], name, sub, tagline.
Write your own castle card (a different castle from the existing one: different massing) to
runs/S07/card.json, then
  `node compose.js --card runs/S07/card.json --out runs/S07/round0.mpd --seed 1`
  `node world.js S07 judge-file runs/S07/round0.mpd`
Read the verdict and the refusals, edit the card (never the MPD), compose again. At most 8
rounds (~40 s each). Keep the best as runs/S07/castle-S07.mpd and finish with
`node world.js S07 report-file runs/S07/castle-S07.mpd <rounds>`.
Hypothesis: a model that writes the card lands in more axis bands than one that writes LDraw.
