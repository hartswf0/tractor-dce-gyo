# The Shield of Achilles: prompt for the builder, and the plan

## The prompt

Give this to the builder agent at the start of a fresh session. Replace `<Mn>` with the section it is building.

```
You are building one section of a LEGO Shield of Achilles, as a real kit: a section a person could build from instructions, lift out of
the shield in one piece, and set back. You are building <Mn>. Other builders build the other sections; a reviewer who did not build it
will judge yours from renders and the checker alone.

READ FIRST, IN ORDER
1. docs/sets/README.md: why big sets fail and the craft rules. Every rule applies.
2. docs/sets/shield-of-achilles.md: the brief. Your section's moment, contents, palette and piece budget are there.
3. tools/forage/product/kits/shield_frame.py: the frame. It owns the origin, the baseplates, each band's height, each section's cells
   and seat, the dividers and the palette. Import it; never redefine its numbers.
4. Two finished kits, to see the level: tools/forage/product/kits/the-bed.py and bow-and-hall.py, with their pages
   odyssey/kits/the-bed/ and odyssey/kits/bow-and-hall/.

WHAT WENT WRONG BEFORE (the shield renders of October 2026). Do not repeat any of it.
- Tall maze walls of navy and white cut the shield into pens; the scenes sit at the bottom of wells. Dividers belong to the frame and
  are one plate and a tile high.
- The sky is an oval at the top edge. Homer puts the heavens at the centre, on the boss.
- Random checkerboards of 1 x 1s stand in for texture, and heaps of round 1 x 1 plates stand in for gold and crowds.
- Twenty figures stand in a block doing nothing; gods are the same size as men; figures overlap and float.
- The circle is a staircase of square studs.
- The whole shield was one file, written part by part, never checked and never looked at.

HOW YOU BUILD
- Write a Python program, tools/forage/product/kits/shield_<mn>.py, on tools/forage/product/kitlib.py. Never type LDraw lines.
  Use kitlib.put / on / tile_run / figure / write / check; sculpt.Form for ground, mounds and walls of rock; landscape.py builders for
  trees, reeds, water and fields where they fit.
- Figures come only from odyssey/cards/character.* cards through kitlib.figure, re-dressed with wardrobe.py if the brief needs it.
  Never assemble a minifigure from parts.
- Everything else is built by your program from real parts. Do not paste in a prop, a model or a set made for something else.

THE SECTION IS A KIT
- It is built on its own base: two layers of plates laid crosswise and bonded, covering exactly the section's cells from the frame.
  Everything in the section stands on that base. Nothing of yours touches another section's cells.
- It must lift out in one piece: every part connects, through studs, to the base. It clicks onto the frame's seat at the height the
  frame gives for its band.
- It stands alone on a table and reads as its own small set, with its own moment.
- Its piece count is inside the brief's budget.

THE CRAFT, CHECKED BY THE REVIEWER
1. One moment, from your line of Homer, posed at its height and readable from the front without a caption.
2. A third of the floor open. Five figures doing one thing beat twenty standing.
3. Every figure on studs, facing its action, a stud from the next unless they touch on purpose. Gods larger or raised, in gold.
4. Texture from structure: coursed walls with offsets and caps, patches four studs across, a field in furrows. No random colour.
5. Tiles on every top the sky sees; studs only where something stands.
6. Curves curved: round corner tiles 25269, 27925, 79393, 27507 and round corner plates 30357, 30565 on every ring edge.
7. Only the brief's palette: Pearl Gold 297, Pearl Silver 179, Metallic Silver 80, Metallic Copper 300, Dark Blue 272, Black 0, Dark
   Brown 308, and quiet cloth colours on figures.
8. One focal point, quieter ground around it.

YOUR LOOP
1. Run your script. kitlib.check must print 0 not clicked and 0 in the same space, for your section on its own and on the frame.
2. Render with tools/forage/look.js: the hero angle (--az 200 --el 24), from minifigure height (--el 5), from above, and two
   close-ups of the moment. Put them on one contact sheet.
3. Look at the sheet as a stranger would. Write down everything that breaks a rule above. Fix it in the program.
4. Repeat until the checker is clean and your list is empty.

WHEN YOU STOP, REPORT
- piece count, the checker's numbers alone and on the frame, the contact sheet's path;
- the line of Homer your moment shows, and how a viewer can tell;
- the three things you are least sure of.
Do not call it done; the reviewer does.
```

## The plan

**0. Tools.** Two checks the reviewer needs and the checker does not yet make. Then the method can be enforced, not just asked for.
- *One piece:* a section's parts form one connected whole through studs, from its base, so it lifts out. This adds a section mode to
  `tools/forage/product/clicks.py`.
- *Figures:* every minifigure stands on a stud surface and keeps its distance from the next. This adds a static-set mode, borrowing
  the body boxes of `tools/metis/clip.js`.

**1. The frame** (`tools/forage/product/kits/shield_frame.py`). It holds:
- four 48 x 48 baseplates, 96 studs across;
- the band radii and heights from the brief;
- every section's cells and seat;
- the dividers, one plate and a tile high, in Dark Blue with gold joins;
- the Ocean rim's bed;
- a grey blockout of all ten sections on it.

Reviewed from above and from minifigure height before anyone builds a section. One builder does this, and nothing else.

**2. The first section: M2, the city at war.** It has the most kinds of action: the wall, the gods leading out, the ambush at the
river, Strife and Fate. It is built with the prompt above and reviewed by a separate agent with the reviewer prompt in
`docs/sets/PROMPTS.md`, beside the Bed and the Hall. It goes round until the reviewer says PASS. Its contact sheet then becomes the
standard every later section is shown.

**3. The other nine.** M0 heavens, M1 city at peace, M3 ploughing, M4 harvest, M5 vineyard, M6 herd and lions, M7 sheep, M8 dance
floor, M9 Ocean. They are built in parallel, each by a fresh builder with the same prompt, each reviewed alone and then on the frame.
If a reviewer says FIX three times on the same point, the brief for that section is rewritten before anyone builds again.

**4. Assembly.** `tools/forage/product/kits/shield.py` brings the frame and the ten sections together as one card,
`odyssey/cards/set.shield-of-achilles.mpd`, checked whole and by section. It also makes the kit page with:
- the hero and top views;
- each section on its own;
- the two turntables (the heavens, the dancers);
- the piece count by section.

**Acceptance.** Each section must:
- have 0 parts not clicked and 0 in the same space;
- lift out in one piece;
- pass the figure check;
- stay inside its piece budget;
- get PASS from a reviewer who did not build it.

The shield is done when all ten sections pass, and a viewer shown the top view without captions can name the scenes in Homer's order.
