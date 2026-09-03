# -*- coding: utf-8 -*-
"""Interpretation layer: curated MOCs (maps of content) and arrangements (trails).
These are derived views written by the compiler's operator after reading all 87
cards; they never alter evidence. Orders refer to display order (paste order).
Platform MOCs are generated automatically by compile.py from PLATFORM fields.
"""
MOCS = [
 dict(id='M01', title='THE FIELD — attention as solicitation, not summary',
      note='The landscape/field distinction (van Dijk, Rietveld) and Cisek\'s affordance competition turn the attention question from "what enters context" into "which action possibilities stand out". The beaver, the precision-weighted residual, the event trigger and Cook Ding are all schedulers for the same field.',
      orders=[1,2,17,18,14,11,10,15,43,45,48]),
 dict(id='M02', title='THE RESIDUAL — feedback that points',
      note='"Wrong" is useless until it names a difference. These cards move feedback from scalar to packet: what was placed, what was wanted, what it cost, how much to trust the validator, and which repair the code already implies.',
      orders=[38,39,40,41,10,15,9,52,47]),
 dict(id='M03', title='THE BUILDER\'S GAME — language that assembles while it builds',
      note='From "Slab!" to "d — slab — there" to LDraw is an increase in addressability, not vocabulary. Deictic roles, coined nouns that become submodels, alien tokens, and the separation of language from policy.',
      orders=[53,54,55,3,59,63,64,65,69,70,62]),
 dict(id='M04', title='THE WORLD REMEMBERS — stigmergy and explicit state',
      note='The half-built castle is memory. Brooks, Grassé, Werfel and the CAD agents agree from different directions: query the world, keep an authoritative state apart from the transcript, isolate validated regions from later failures.',
      orders=[4,5,7,16,29,30,44,56,13]),
 dict(id='M05', title='THREE LOOPS, TWO CLOCKS — where compute goes',
      note='Deliberating about this brick and learning from the last hundred are different clocks; a third loop redesigns the game. Ashby\'s ultrastability gates when policy may change at all.',
      orders=[42,50,49,12,31,36,48,14,11]),
 dict(id='M06', title='ASSEMBLY SPACE — LDraw meets assembly theory',
      note='17,116 shapes is already an ontological choice. LDraw is a recursive grammar that knows position but not connectability; reuse is a pointer digitally and production physically; the compression dispute can be made empirical; the most important part may be the stud standard no model contains.',
      orders=[72,73,74,75,76,77,78,79,80,81,87,68]),
 dict(id='M07', title='THE ARENA — benchmarks and gauntlet precedents',
      note='What already exists: OmniCAD breaks at twelve parts, AssemblyBench makes trajectory part of correctness, ASAP plans by disassembly, CADCodeVerify is the gauntlet loop, RoCo lets geometry vote, FurnitureBench keeps it honest. The castle as a scaling ladder rather than a heroic run.',
      orders=[19,20,21,22,23,24,25,26,27,28,32,33,34,35,37,86,58,71]),
 dict(id='M08', title='POLICY WITHOUT WEIGHTS — in-context learning, rollback, evolution',
      note='LegoGPT\'s guess-test-rollback, in-context RL, iterative learning control across repeated motifs, the castle as its own few-shot set and curriculum, and evolution over sub-assemblies rather than coordinates.',
      orders=[83,84,85,46,51,57,26,47,6]),
]

ARRANGEMENTS = [
 dict(id='A01', title='Paper reading order — the trail the working paper follows',
      note='Read in this order the cards make the paper\'s argument: LDraw\'s connection gap → the graph that fills it → the field → competition → the tax → beaver, precision, event → the shaping trap (counterevidence) → the world as memory → deixis → the residual → the loop that already exists.',
      orders=[74,82,1,2,17,15,10,11,41,4,5,7,3,54,38,28,35]),
 dict(id='A02', title='Test-first — cards whose TEST can be run inside this repository now',
      note='Ordered by how little new machinery the TEST needs given nabugo-kits.js, nabugo-ports.json and the 17-kit corpus. Judgement of the compiler\'s operator, not a measurement.',
      orders=[1,17,74,73,77,79,78,72,38,57,59,65,21,46,85]),
 dict(id='A04', title='Seeds to zettels — which cards each seed prompt in _PROMPTS/ draws on',
      note='Generated from SEED_META in prompts.py.', orders=[]),
]
