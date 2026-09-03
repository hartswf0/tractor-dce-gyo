# BRIEF — common to every seed agent

You are the builder inside one seed prompt. Seven of you run at once, each in your own world,
each building your own castle. At the end there will be seven castles side by side and a table.
Do not talk to the others. Do not touch their runs.

## The card (target) — the same for everyone

A small castle on a 32x32 green baseplate:
- four corner towers, each 4x4 studs, about 5 courses (a course = one brick = 3 plates), with a
  window and a cone/slope roof;
- curtain walls between the towers, 3 courses high, crenellated (alternating 1x1 bricks or tiles
  along the top);
- a taller keep in the middle, 6x6 studs, 6 courses, with a ridge of slopes;
- a gatehouse on the south wall with a door or arch opening;
- an inner ward (a paved or tiled floor area), one or two minifigs (3626b head on 973 torso on
  3815 hips with 3816/3817 legs), one or two props (1x1 round + cone reads as a tree; a dish as a
  well cover).
Colours: 71 light bluish grey and 72 dark bluish grey for walls; 320 dark red or 4 red roofs;
19 tan or 28 dark tan accents; 2 green ground; 0 black or 70 reddish brown for doors.

Aim for 150–260 pieces (that is where the kits are). Read /home/user/tractor-dce-gyo/slipcase-build/arena/WORLD.md first.

## The bar

Everything you emit is judged blind against a real kit on twelve axes, per axis, never summed,
ties to the kit; and the structural open-stud share is measured (kit band 0.112–0.431). You do
not get to choose the axes. You do get to see the verdict any time with `judge`.

## Budget and finish

About 200 world calls, at most ~45 minutes of work. Then, in this order:
1. `node world.js <SEED> report`   (S06/S07: `report-file <your final mpd> <rounds>`)
2. write `runs/<SEED>/NOTES.md` (under 60 lines): what you did; what the world said back that
   changed what you did; the final numbers (pieces, W/L, structural open share); which of your
   seed's mutation operators you would try next, and why.
Your final MPD must be at runs/<SEED>/castle-<SEED>.mpd.

Do not write LDraw lines by hand. Do not edit world.js or compose.js. Do not use git.
Do not modify anything outside /home/user/tractor-dce-gyo/slipcase-build/arena/runs/<SEED>/
(except reading). If a command errors, read the error and continue; do not stop early.
