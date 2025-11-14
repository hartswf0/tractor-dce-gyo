# MONKEY DATA CENTER - BUILD INSTRUCTIONS

## Parts List (Bag 1 of 1)

```
QTY  PART           COLOR   DESCRIPTION
 1x  3069bpc0.dat   72      Tile 1x2 with control panel print
 1x  2431px0.dat    72      Tile 1x4 with network display
 1x  3068bp80.dat   72      Tile 2x2 with temperature readout
 1x  3069bp0d.dat   72      Tile 1x2 with LED indicators
 1x  3068bp0n.dat   1       Tile 2x2 with camera feed (blue)
 1x  2431pw1.dat    7       Tile 1x4 with security panel (tan)
 1x  3039pco.dat    4       Slope 2x2 (red)
 1x  3040p06.dat    15      Slope 1x2 with warning label (white)
 2x  2550c01.dat    72      Container with hinge (gray)
 2x  2550c02.dat    72      Container with hinge (gray)
 1x  11092.dat      0       Vent grille (black)
 1x  u595p01c03.dat 1       Security badge sticker (blue)
 3x  3626bph4.dat   6       Minifig head with monkey face (brown)
```

---

## STEP 1 - BASE FLOOR (Start Here)

**Take:** `3069bpc0.dat` (gray control panel tile)  
**Place:** Center position on your building surface  
**Position:** This is your reference point (0,0,0)

```
[3069bpc0]
    ▓▓
```

**Connection:** Rests flat on baseplate/table

---

## STEP 2 - FLOOR CONTINUES

**Take:** `2431px0.dat` (gray network display tile)  
**Place:** 2.5 studs to the RIGHT of first tile  
**Position:** X=20 (20 LDU = 2.5 studs)

```
    [2431px0]
[3069bpc0]  ▓▓▓▓
    ▓▓
```

**Connection:** Aligned on same Y=0 floor level

---

## STEP 3 - FLOOR LEFT SIDE

**Take:** `3068bp80.dat` (gray temperature tile)  
**Place:** 2.5 studs to the LEFT of first tile  
**Position:** X=-20

```
[3068bp80] [3069bpc0] [2431px0]
   ▓▓         ▓▓        ▓▓▓▓
   ▓▓
```

**Connection:** Floor line is now 7 studs wide

---

## STEP 4 - FLOOR FORWARD

**Take:** `3069bp0d.dat` (gray LED tile)  
**Place:** 2.5 studs FORWARD from center tile  
**Position:** Z=20 (depth axis)

```
         [2431px0]
            ▓▓▓▓
[3068bp80]
   ▓▓
   ▓▓     [3069bpc0]
            ▓▓
         [3069bp0d]
            ▓▓
```

**Connection:** Floor base complete - 4 tiles in + shape

---

## STEP 5 - CONSOLE BASE LAYER

**Take:** `3068bp0n.dat` (blue camera feed tile)  
**Place:** Directly ON TOP of center tile  
**Height:** 1 plate height above floor (Y=-8)

```
        [3068bp0n] <- STACKED ON TOP
           ▓▓
           ▓▓
         -------
        [3069bpc0] <- FLOOR
           ▓▓
```

**Connection:** Blue tile studs click into gray tile's top studs

---

## STEP 6 - SECURITY PANEL

**Take:** `2431pw1.dat` (tan security panel)  
**Place:** On top of the RIGHT floor tile  
**Height:** 1 plate up (Y=-8)

```
     [2431pw1]
       ▓▓▓▓
      -------
     [2431px0]
       ▓▓▓▓
```

**Connection:** Tan tile clicks onto gray tile beneath

---

## STEP 7 - CONSOLE SLOPE

**Take:** `3039pco.dat` (red slope 2x2)  
**Place:** On top of blue console tile, angled FORWARD  
**Height:** 2 plates up (Y=-16)  
**Position:** Z=10 (pushed forward 1.25 studs for angle)

```
       /▓▓/ <- SLOPE ANGLED
      -----
     [▓▓▓▓] <- CONSOLE
      -----
     [floor]
```

**Connection:** Slope studs click on blue tile, leans forward

---

## STEP 8 - WARNING SLOPE

**Take:** `3040p06.dat` (white warning slope)  
**Place:** Next to red slope, on security panel  
**Height:** 2 plates up (Y=-16)

```
  /▓▓/  /▓/ <- TWO SLOPES
  ----  ---
  [▓▓]  [▓▓]
```

**Connection:** Creates angled console display area

---

## STEP 9 - SERVER RACK BOTTOM

**Take:** `2550c01.dat` (gray hinge container)  
**Place:** 5 studs to the LEFT (X=-40)  
**Height:** 1 plate up (Y=-8)  
**Orientation:** Hinge opens toward center

```
[2550c01]              [CONSOLE]
   ⌈⌉ <- door             /▓▓/
   ⌊⌋                     ---
```

**Connection:** Mounts on left wall, acts as server door

---

## STEP 10 - SERVER RACK TOP

**Take:** `2550c02.dat` (second gray container)  
**Place:** Directly ABOVE first server door  
**Height:** 4 plates up (Y=-32)  
**Spacing:** 3 plates between doors (24 LDU)

```
[2550c02] <- TOP DOOR
   ⌈⌉
   ⌊⌋
   ║  <- SPACE (3 plates)
   ║
[2550c01] <- BOTTOM DOOR
   ⌈⌉
   ⌊⌋
```

**Connection:** Stacks vertically, creates server rack height

---

## STEP 11 - COOLING VENT

**Take:** `11092.dat` (black vent grille)  
**Place:** On TOP of server rack  
**Height:** 6 plates up (Y=-48)

```
[11092] <- VENT
 ▒▒▒▒
-------
[2550c02]
   ⌈⌉
```

**Connection:** Caps the server rack, represents airflow

---

## STEP 12 - SECURITY BADGE

**Take:** `u595p01c03.dat` (blue sticker badge)  
**Place:** 5 studs to the RIGHT (X=40)  
**Height:** 2 plates up (Y=-16)  
**Position:** Z=-10 (slightly back, on wall)

```
              [u595] <- BADGE ON WALL
               ▓
              / \
```

**Connection:** Sticker applied to wall surface at eye level

---

## STEP 13 - ALPHA MONKEY

**Take:** `3626bph4.dat` (brown monkey head)  
**Place:** At CENTER console  
**Height:** 5 plates up (Y=-40)  
**Note:** This represents standing minifig height

```
       [ALPHA]
        ( @ )  <- MONKEY HEAD
         | |
        -----
      [CONSOLE]
```

**Connection:** Head positioned at typical minifig standing height

---

## STEP 14 - BETA MONKEY

**Take:** `3626bph4.dat` (second monkey head)  
**Place:** At RIGHT security station  
**Height:** 5 plates up (Y=-40)  
**Position:** X=40, Z=-10 (at badge location)

```
                  [BETA]
                   ( @ )
                    | |
                  ------
                 [SECURITY]
```

**Connection:** Standing at right station monitoring badge access

---

## STEP 15 - GAMMA MONKEY (FINAL)

**Take:** `3626bph4.dat` (third monkey head)  
**Place:** At LEFT server rack  
**Height:** 7 plates up (Y=-56)  
**Position:** X=-40 (on server structure)

```
         [GAMMA]
          ( @ )  <- CLIMBING
           /|
          / |
       [SERVER]
```

**Connection:** Higher position suggests climbing/maintenance work

---

## BUILD COMPLETE!

### Final Assembly View (Top Down)

```
    SERVER          MAIN         SECURITY
    RACK           CONSOLE       STATION
      ⌈⌉             /▓/            [▓]
      ⌊⌋            /▓▓/            ▓▓
    [VENT]          ----           ----
      
   [GAMMA]        [ALPHA]        [BETA]
    ( @ )          ( @ )          ( @ )
```

### Height Reference

```
Y=-56  [GAMMA] ········ 7 plates (climbing)
Y=-48  [VENT] ·········· 6 plates (rack top)
Y=-40  [ALPHA][BETA] ··· 5 plates (standing)
Y=-32  [DOOR 2] ········ 4 plates
Y=-16  [SLOPES][BADGE] · 2 plates
Y=-8   [CONSOLES][DOOR] · 1 plate
Y=0    [FLOOR] ·········· baseline
```

---

## Build Notes

### Connection Strength
- Floor tiles provide stable base (no connections needed)
- Console pieces stack securely (stud-to-stud)
- Server doors use hinge connections (flexible but stable)
- Minifig heads represent positions (not physically connected)

### Brick Count by Layer
```
Y=0   (floor):    4 pieces - base stability
Y=-8  (1 plate):  3 pieces - console + server start
Y=-16 (2 plates): 3 pieces - screens + badge
Y=-32 (4 plates): 1 piece  - server middle
Y=-40 (5 plates): 2 pieces - standing monkeys
Y=-48 (6 plates): 1 piece  - vent top
Y=-56 (7 plates): 1 piece  - climbing monkey
```

### Stability Points
- **Base:** 4 floor tiles = 8 studs worth of contact
- **Console:** 2-tile stack = 4 stud connections
- **Server:** Hinges provide pivot stability
- **Total footprint:** ~10x6 studs

### Alternative Builds
- Replace monkey heads with actual minifig assemblies (body + legs)
- Add baseplate beneath for official mounting
- Connect server doors with technic pins for locked position
- Add transparent tiles for computer screens

---

## Troubleshooting

**Problem:** Slopes won't stay angled  
**Solution:** Ensure bottom tiles have exposed studs for slope to grip

**Problem:** Minifig heads fall over  
**Solution:** These are just position markers - add full minifig bodies for stability

**Problem:** Server doors swing open  
**Solution:** That's normal! Hinges are designed to open (feature, not bug)

**Problem:** Pieces don't align on grid  
**Solution:** Check measurements - all positions use 8 LDU increments (1 stud = 8 LDU)

---

## LEGOS Narrative (Built-In)

As you build each layer, the story reveals itself:

- **Floor:** Establish workspace infrastructure
- **Console:** Define workstation roles (main vs security)
- **Slopes:** Add personality (angled screens = active work)
- **Server:** Show scale (3-door height = serious equipment)
- **Monkeys:** Create characters (different heights = different tasks)

The BUILD ORDER mirrors the STORY ORDER:
1. Foundation (location)
2. Equipment (obstacles/tools)
3. Characters (entities)
4. Relationships (spacing between monkeys = organizational hierarchy)

---

**END BUILD INSTRUCTIONS**

Total build time: ~5-7 minutes  
Difficulty: ⭐⭐ (Easy - straight stacking, no complex techniques)  
Playability: ⭐⭐⭐⭐ (Hinged doors open, monkeys repositionable)  
Display value: ⭐⭐⭐⭐ (Clear scene, good proportions)
