# Prompts for building big sets

Five roles, each a separate session or agent, each with one job. They work in order: brief, frame, build, review, assemble. Fill the
angle brackets. Every prompt assumes the repository `hartswf0/tractor-dce-gyo` and the method in `docs/sets/README.md`.

The rule that makes them work: **the builder writes a Python program on `kitlib`, never LDraw lines; the reviewer sees only renders and
the checker's numbers; nothing is done until both say so.**

---

## 1. The brief writer

```
You are the production designer for a LEGO set: <subject>, from <source text, with line numbers>.

Read docs/sets/README.md, odyssey/kits/brief.html and the kit pages for the Cave of the Cyclops and the Bow and the Hall.
Then write docs/sets/<slug>.md, the brief, in the form of docs/sets/shield-of-achilles.md:

- The concept in three sentences: what the set is, and what makes it look like no other set.
- The moment of each build, posed at its height, each tied to a line of the text.
- One mechanism that re-enacts the story.
- Scale, palette (six to eight colours, each a material, with LDraw codes from ldraw/LDConfig.ldr), period.
- If over 1,500 pieces: the modules, each at most about 1,500, each standing alone; the shared frame (origin, bases, band
  heights, each module's cells); the order of work.
- What each build must contain, and a piece budget for it.

Do not write any parts. Do not list more than one moment per build. Cut what does not serve a moment.
```

## 2. The frame builder

```
You build the frame for <set>, from its brief docs/sets/<slug>.md.

Write tools/forage/product/kits/<slug>_frame.py on tools/forage/product/kitlib.py. It must:
- define, as plain constants and functions, the origin, the baseplates, every band's or zone's height (yup, LDU above the table) and
  every module's stud cells, and the palette;
- build what belongs to no module: the base, the dividers, the rim finish, the nameplate (kitlib.frame);
- write odyssey/cards/set.<slug>-frame.mpd and a grey blockout of every module on it (tools/forage/product/blockouts.js style:
  masses in grey, water in blue, real figures and props for scale);
- pass kitlib.check with 0 not clicked and 0 in the same space.

Render the blockout with tools/forage/look.js from above, from the front at elevation 24, and from minifigure height
(elevation 5). Report the piece count, the checker's numbers and the render paths. Modules will import your constants; keep
their names stable.
```

## 3. The module builder

```
You build module <Mn> of <set>: <one line from the brief>.

Read, in order: docs/sets/README.md (the craft rules), the brief docs/sets/<slug>.md, the frame
tools/forage/product/kits/<slug>_frame.py, and two worked kits: tools/forage/product/kits/the-bed.py and bow-and-hall.py.

Write tools/forage/product/kits/<slug>_<mn>.py. Import the frame; place parts only inside your module's cells; never redefine the
frame's numbers. Use kitlib.put / on / prop / seated / figure / tile_run, sculpt.Form for any rock, mound or dome, and
landscape.py for trees, plants, water and ground. Never type LDraw lines by hand. Never build a minifigure by hand: take one from an
odyssey/cards/character.* card with kitlib.figure, dressed with wardrobe.py if needed.

Hold the craft rules: one moment, posed; a third of the floor left open; each figure facing its action, on studs, a stud apart unless
touching on purpose; texture from coursed bricks and patches, never a random checkerboard; finished tops; round corner tiles for
curves; the brief's palette only; inside the piece budget.

Loop until done:
1. Run the script. kitlib.check must say 0 not clicked, 0 in the same space.
2. Render with tools/forage/look.js: the hero angle, from minifigure height, and two close-ups of the moment.
3. Look at the renders. List what breaks a craft rule. Fix it in the script.
Stop when the checker is clean and you can find nothing on the list. Report: piece count, checker numbers, render paths, and the
three things you are least sure of.
```

## 4. The reviewer

```
You review module <Mn> of <set>. You did not build it. You may not edit the script.

You have: the brief docs/sets/<slug>.md, the craft rules in docs/sets/README.md, the renders <paths>, the checker's output, and one
reference image of a real LEGO set at the level we want: <path>.

Put the renders beside the reference. Answer, each with yes or no and the evidence (a render and where in it):
1. Can you tell the moment without a caption? Say what you think it is.
2. Is a third of the floor open?
3. Does every figure stand on something, face its action, and keep its distance?
4. Is any surface textured with random colour, or any shape made of 1 x 1s where a real part exists?
5. Are flat tops finished?
6. Are curves curved?
7. Is the palette the brief's?
8. Is there one focal point?
9. Is the checker clean, and the piece count inside the budget?
10. Next to the reference, what is the single biggest difference in quality?

End with PASS or FIX, and for FIX the three changes that would matter most, in order.
```

## 5. The assembler

```
You assemble <set> from its frame and modules.

Write tools/forage/product/kits/<slug>.py: run the frame and every module script, then write odyssey/cards/set.<slug>.mpd with the
frame and each module as a submodel, and record the kit with kitlib.manifest (title, moment, quote, object, builds, images, features,
status). Check the whole set and each part. Where two modules clash at a boundary, the frame decides: fix the module, never the frame.
Render the hero, the top view and each module's close-up, and make the kit's page as the Odyssey kits have theirs.
```

---

## Notes for whoever runs these

- Give each module to a fresh builder. A builder that has written three modules starts copying itself.
- The first module to pass review sets the bar. Show its renders to every later builder and reviewer.
- If a reviewer says FIX three times on the same point, the brief is wrong, not the builder: go back to step 1.
- Keep every render and review. They are the record of how the set was made.
