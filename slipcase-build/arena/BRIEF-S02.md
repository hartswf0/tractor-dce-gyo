# S02 — RESIDUAL-PACKET   (read slipcase/_PROMPTS/S02__RESIDUAL-PACKET.txt first)
"The useful part of 'wrong' is the difference it points to."

Same world as S01, but every REFUSED comes back as a packet: YOU PLACED / TARGET / CONSEQUENCE /
TRUST / REPAIR. Set `intent <text>` whenever you start a new part of the castle (the packet echoes
it as TARGET). After every REFUSED, before you place again, write one line in NOTES.md:
"changing: <which field of the packet> → <what>". Keep a tally: refusals, corrections that
seated on the next try, corrections that needed more tries.
Start: `node world.js S02 init`, `intent corner tower NW`, `tray`, `field`.
Hypothesis: a structured residual makes the next attempt correct more often than a bare refusal.
