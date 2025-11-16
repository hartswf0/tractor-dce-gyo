# THE SIMPSONS OPENING INVERSE STORYBOARD
## LEGO Container-First Build Specifications – CONTINUATION (Scenes 4–1)

---

# SCENE 4 – SPRINGFIELD NUCLEAR POWER PLANT (Homer's Workstation)

## LDU Mathematics (Critical)

### **Horizontal Measurements**
```
20 LDU = 1 stud width (control panel module)
40 LDU = 2x2 brick (workstation cell)
80 LDU = 4 studs wide (main console footprint)
160 LDU = 8 studs wide (control room width)
```

### **Vertical Measurements**
```
8 LDU = 1 plate (gauge height)
24 LDU = 1 brick (dashboard height)
48 LDU = 2 bricks (upper monitor shelf)
80 LDU = minifig standing (Homer at console)
120 LDU = 5 bricks (room ceiling)
240 LDU = 10 bricks (reactor vessel background)
```

### **Scene Volume**
```
Width:  160 LDU (X: -80 to +80) = 8 stud units
Depth:  160 LDU (Z: -80 to +80) = 8 stud units
Height: 240 LDU (Y: 0 to -240) = 10 brick units
Total:  8x8x10 brick volume (INDUSTRIAL REACTOR CONTROL ROOM)
```

---

## Container First Philosophy – ROOM THEN EQUIPMENT

**Traditional:** Place Homer, add machinery around him
**Master Builder:** Build control room CONTAINER first, then layer Homer + uranium accident

### Why Container First?
- Industrial room defines scale (factory vs. office)
- Reactor vessel background sets industrial aesthetic
- Control panel arrangement controls timing (accident sequence)
- Machinery placement controls sightlines (coworker visibility)

---

## Room Structure (4 Walls + Ceiling)

### **NORTH WALL – Reactor Monitoring** (Z=-80)

**Theme:** Reactor core oversight, radiation alerts  
**Colors:** Green (6) and yellow (3) – hazard/caution

```
LAYER 4 (Y=-96): Upper displays
[15561] [3068bpg1] <- Radiation meter
   ▓       ▓▓


LAYER 3 (Y=-72): Control panels
[14718px1]  [5306]  [5306] <- Main reactor display
    ▓▓       ▓▓      ▓▓


LAYER 2 (Y=-48): Lower panels
[2550c01]  [2550c02]  [5306] <- Backup systems
   ⌈⌉        ⌈⌉        ▓▓


LAYER 1 (Y=-24): Wall base
[15561] [15561] [15561] <- Structural wall
   ▓       ▓       ▓
```

**Part usage:**
- `15561.dat` (3x) – Wall texture (green industrial)
- `14718px1.dat` (1x) – Main reactor display (yellow)
- `5306.dat` (2x) – Control modules (caution colors)
- `3068bpg1.dat` (1x) – Radiation gauge
- `2550c01/02.dat` (2x) – Hinged backup system doors

**Placement:**
- All at Z=-80 (back wall, 4 studs deep)
- Staggered 24 LDU layers (Y=-24, -48, -72, -96)

---

### **EAST WALL – Coolant & Temperature** (X=80)

**Theme:** Cooling systems, temperature management  
**Colors:** Blue (1) and cyan (11) – cold/liquid

```
LAYER 4 (Y=-96): Upper vents
[15561] [3069bp0c] <- Temperature sensor
   ▓       ▓▓


LAYER 3 (Y=-72): Coolant flow display
[14718px1]  [2431px0]  [5306] <- Main coolant panel
    ▓▓       ▓▓▓▓      ▓▓


LAYER 2 (Y=-48): Pump controls
[2550c01]  [5306]  [5306] <- Backup pumps
   ⌈⌉        ▓▓      ▓▓


LAYER 1 (Y=-24): Wall base
[15561] [15561] [15561]
   ▓       ▓       ▓
```

**Rotation:** 90° inward (facing room center)  
**Matrix:** `0 0 1 0 1 0 -1 0 0`

**Part usage:**
- `15561.dat` (3x) – Wall texture (cyan, rotated)
- `14718px1.dat` (1x) – Coolant display (blue)
- `2431px0.dat` (1x) – Wide flow diagram
- `5306.dat` (2x) – Pump controls (cyan accents)
- `3069bp0c.dat` (1x) – Temperature sensor

**Placement:**
- All at X=80 (right wall, 4 studs right)
- Same Y heights as North wall
- Rotated to face room

---

### **SOUTH WALL – Safety Systems** (Z=80)

**Theme:** Emergency shutdown, safety protocols  
**Colors:** Red (4) and black (0) – alert/danger

```
LAYER 4 (Y=-96): Emergency beacon
[15561] [3069bp0d] <- Warning light
   ▓       ▓▓


LAYER 3 (Y=-72): E-Stop button area
[14718px1]  [2431px0]  [5306] <- Red main display
    ▓▓       ▓▓▓▓      ▓▓


LAYER 2 (Y=-48): Lockdown controls
[2550c01]  [2550c02]  [5306] <- Security doors
   ⌈⌉        ⌈⌉        ▓▓


LAYER 1 (Y=-24): Wall base
[15561] [15561] [15561]
   ▓       ▓       ▓
```

**Part usage:**
- `15561.dat` (3x) – Wall texture (red/black)
- `14718px1.dat` (1x) – Main safety display (red)
- `2431px0.dat` (1x) – Emergency status screen
- `5306.dat` (1x) – Safety control
- `3069bp0d.dat` (1x) – Warning beacon
- `2550c01/02.dat` (2x) – Lockdown doors

**Placement:**
- All at Z=80 (front wall, 4 studs forward)
- Visitor-facing (most dramatic wall)
- Entry/exit door centerline at X=0

---

### **WEST WALL – Power Distribution** (X=-80)

**Theme:** Electrical systems, power relay grid  
**Colors:** Orange (14) and brown (8) – electrical warmth

```
LAYER 4 (Y=-96): Breaker array
[15561] [3069bp0e] <- Breaker status
   ▓       ▓▓


LAYER 3 (Y=-72): Distribution panels
[14718px1]  [2431px0]  [5306] <- Main power display
    ▓▓       ▓▓▓▓      ▓▓


LAYER 2 (Y=-48): Transformer controls
[2550c01]  [5306]  [5306] <- Step-down transformers
   ⌈⌉        ▓▓      ▓▓


LAYER 1 (Y=-24): Wall base
[15561] [15561] [15561]
   ▓       ▓       ▓
```

**Rotation:** 90° opposite from East  
**Matrix:** `0 0 -1 0 1 0 1 0 0`

**Part usage:**
- `15561.dat` (3x) – Wall texture (orange/brown, rotated)
- `14718px1.dat` (1x) – Power distribution display (orange)
- `2431px0.dat` (1x) – Voltage/amp readout
- `5306.dat` (2x) – Transformer controls
- `3069bp0e.dat` (1x) – Breaker status

**Placement:**
- All at X=-80 (left wall, 4 studs left)
- Server/infrastructure wall (functional)

---

## CEILING – Reactor Vessel Above

```
Y=-240 (ceiling top, 10 bricks up)
   [11092]  <- Reactor core access
    ▒▒▒▒
   
Y=-160 (mid-space, ventilation)
   [Girders/support beams]
    ════════
    
Y=-120 (lower ceiling, 5 bricks from floor)
   Hanging lights, warning signs
    └──┴──┘
```

- Central reactor core vent at X=0, Z=0, Y=-240
- Support girders running N-S (connecting walls)
- Hazard stickers on all beam work
- 5 brick vertical clearance (Y=-120 to Y=0)

---

## Build Sequence (Room to Accident)

### **PHASE 1: INDUSTRIAL ROOM CONTAINER (Steps 1-6)**
1. Floor grid (Y=0) – industrial metal plating in 20 LDU sections
2. Base layer walls (Y=-24) – all 4 walls structural
3. Secondary layer (Y=-48) – all 4 walls control panels
4. Tertiary layer (Y=-72) – all 4 walls displays
5. Upper layer (Y=-96) – all 4 walls detail/monitoring
6. Ceiling structure (Y=-120 to -240) – girders + reactor core vent

**Result:** Enclosed industrial room, 8x8 brick footprint, ready for actors

---

### **PHASE 2: FLOOR DETAIL (Step 7)**
```
Y=0 (floor level)
[▓] [▓] [▓] [▓]
[▓] [▓] [▓] [▓]  <- 8x8 grid floor tiles
[▓] [▓] [▓] [▓]
[▓] [▓] [▓] [▓]
```
- Metallic gray or industrial tan
- Checkered pattern (alternating 1x1 studs for visual interest)
- Non-slip surface aesthetic

---

### **PHASE 3: HOMER'S WORKSTATION (Steps 8-10)**
8. Main console placement
   - Position: X=0, Y=-48 (waist height at control panel), Z=+40 (near room center, toward south wall)
   - Dimensions: 80 LDU long (4 studs), 40 LDU deep (2 studs), 24 LDU tall (1 brick)
   - Layout: Tongs in right hand, uranium rod in center
   - Glow effect: Trans-clear uranium rod piece (20 LDU long)

9. Homer minifig placement
   - Position: X=0, Y=-80 (standing height), Z=+40 (at console)
   - Hands: Right hand holding silver tongs (minifig tool)
   - Left hand reaching toward rod
   - Expression: Bored/distracted (before accident)

10. Uranium rod special element
    - Position: X=0, Y=-40 to -60 (held in tongs above console), Z=+40
    - Material: Trans-clear bright-green (glow effect)
    - Length: 20 LDU (visible hazard)
    - Glow radius: 40 LDU around rod (hazard aura)

---

### **PHASE 4: COWORKER POSITIONS (Steps 11-13)**

11. Mr. Burns + Smithers (background left)
    - Burns: X=-60, Y=-80, Z=-20 (standing, studying blueprints)
    - Smithers: X=-50, Y=-80, Z=-20 (standing beside Burns, attentive)
    - Blueprints: Prop plate on stand between them (Y=-48)
    - Positioning: Behind Homer, slightly elevated view

12. Lenny on ladder (background center-left)
    - Lenny: X=-40, Y=-96 (on 3-stud ladder), Z=+20
    - Ladder: Vertical structure at Y=-24 to -120, X=-40, Z=+20
    - Task: Changing "Days Without Accident" sign (Y=-96, wall-mounted)
    - Sign: Flip tile showing "002" → accident imminent
    - Moment: Lenny loses balance at PT27S

13. Carl at ladder base (background center)
    - Carl: X=-40, Y=-80 (holding ladder), Z=+30
    - Action: Stabilizing Lenny pre-accident
    - Post-accident (PT27S): Carl takes impact, wails audibly
    - Position: Directly below Lenny (collision zone)

---

## Verticality Strategy – Reactor Room

### **6-Layer Industrial System**
```
Y=-240 ══ REACTOR CORE ══ [vent/access]
        |  80 LDU space   |
Y=-160  ══ SUPPORT BEAMS ══ [girder work]
        |  40 LDU space   |
Y=-120  ══ CEILING ═════ [hung lights/signs]
        |  24 LDU space   |
Y=-96   ══ UPPER DETAIL ══ [gauge/beacon]
        |  24 LDU space   |
Y=-72   ══ MAIN CONTROL ══ [display panels]
        |  24 LDU space   |
Y=-48   ══ LOWER CONTROL ══ [Homer's console/backup]
        |  24 LDU space   |
Y=-24   ══ BASE WALL ════ [structural]
        |  24 LDU space   |
Y=0     ══ FLOOR ═══════ [metal plating]
```

Each layer: 24 LDU apart (1 brick height)  
Total: 6 layers = 240 LDU (10 bricks)

---

## Critical Accident Sequence (Timeline PT24S–PT31S)

| Time  | Event                              | Position/Detail                    |
|-------|------------------------------------|------------------------------------|
| PT26S | Lenny loses balance               | Ladder sway at X=-40, Y=-96        |
| PT27S | Lenny falls on Carl               | Collision at X=-40, Y=-40          |
| PT27S | End-of-shift whistle sounds       | Audio trigger                      |
| PT28S | Homer reacts, drops tongs         | Tongs fall from X=0, Z=+40         |
| PT28.5S | Uranium rod launches upward     | Rod trajectory Y=-40 → Y=+40       |
| PT29S | Rod peaks mid-air                 | Highest point: Y=+60, transparent  |
| PT29.5S | Rod falls down Homer's shirt    | Rod lands at Y=-60 (collar lodged) |
| PT30S | Homer realizes problem            | Homer expression changes to shock  |
| PT31S | Homer exits toward car            | Homer departs workstation          |

---

## LDU Verification Checklist – Scene 4

- [ ] All walls at ±80 (4 studs from center)
- [ ] Floor tiles at Y=0 baseline
- [ ] Base layer walls at Y=-24 (1 brick up)
- [ ] Control layers at Y=-48 and Y=-72 (2–3 bricks up)
- [ ] Upper detail at Y=-96 (4 bricks up)
- [ ] Ceiling at Y=-120 to Y=-240 (5–10 bricks up)
- [ ] Homer at Y=-80 (standing height)
- [ ] Console at Y=-48 (waist height interaction)
- [ ] Uranium rod glow: 40 LDU radius from center
- [ ] Lenny ladder: X=-40, Z=+20, height Y=-24 to -120
- [ ] Carl at ladder base: X=-40, Y=-80, Z=+30
- [ ] Mr. Burns + Smithers background: X=-60, Y=-80, Z=-20
- [ ] Accident arc: Rod Y=-40 → +40 → -60 (collision with Homer)

---

## Build Time Estimate – Scene 4

**Industrial room container:** 15–18 minutes  
**Console + equipment:** 4–5 minutes  
**Character positioning:** 3–4 minutes  
**Accident choreography:** 2–3 minutes  
**Total:** 24–30 minutes per scene

**Difficulty:** ⭐⭐⭐⭐⭐ (Master level – 4-wall variation, industrial detail, timing precision)

---

---

# SCENE 3 – SPRINGFIELD ELEMENTARY SCHOOL: BART'S CHALKBOARD Gag

## LDU Mathematics (Critical)

### **Horizontal Measurements**
```
20 LDU = 1 stud width (chalk mark unit)
40 LDU = 2x2 brick (chalkboard module)
80 LDU = 4 studs wide (classroom chalkboard front)
160 LDU = 8 studs wide (classroom width)
```

### **Vertical Measurements**
```
8 LDU = 1 plate (chalk line height)
24 LDU = 1 brick (chalkboard section)
48 LDU = 2 bricks (mid-classroom)
80 LDU = minifig standing (Bart writing height)
120 LDU = 5 bricks (classroom ceiling)
```

### **Scene Volume**
```
Width:  160 LDU (X: -80 to +80) = 8 stud units
Depth:  120 LDU (Z: -60 to +60) = 6 stud units
Height: 120 LDU (Y: 0 to -120) = 5 brick units
Total:  8x6x5 brick volume (CLASSROOM INTERIOR)
```

---

## Container First Philosophy – CLASSROOM AS DETENTION SPACE

**Traditional:** Place Bart, add chalkboard behind  
**Master Builder:** Build classroom CONTAINER first (walls, chalkboard), add Bart + detention

### Why Container First?
- Chalkboard placement defines Bart's working height (Y=-80 to -48)
- Classroom walls establish visual frame (detention isolation)
- Desk arrangement controls "empty" aesthetic (after-hours feel)
- Door exit defines burst-through moment

---

## Room Structure – Classroom Container

### **NORTH WALL – Main Chalkboard** (Z=-60)

**Theme:** Detention punishment, writing lines  
**Colors:** Dark green (6) and white (15) – classroom standard

```
LAYER 3 (Y=-72): Chalkboard top trim
[15561] [3068bp0a] <- Chalk ledge
   ▓       ▓▓


LAYER 2 (Y=-48): Main chalkboard surface
[14718px1-green] [14718px1-white] <- Full writing surface
    ▓▓▓▓▓▓▓▓  (wide printed tile)


LAYER 1 (Y=-24): Wall base
[15561] [15561] [15561]
   ▓       ▓       ▓
```

**Special Element:** Chalkboard texture overlay (22 horizontal lines, visible grid for writing)

**Part usage:**
- `15561.dat` (3x) – Wall texture (dark green)
- `14718px1-green.dat` (1x) – Chalkboard backing (green base)
- `14718px1-white.dat` (1x) – Chalkboard surface print (white chalk lines)
- `3068bp0a.dat` (1x) – Chalk ledge/trim
- Chalk stick prop (minifig-scale, white, 8 LDU long)

**Placement:**
- Chalkboard surface: Y=-48 to Y=-120 (spans 3 brick heights)
- Ledge: Y=-72, holds chalk stick
- Writing area: X=-60 to X=+60 (120 LDU width for detention lines)

---

### **EAST WALL – Classroom Supply Shelf** (X=80)

**Theme:** Educational materials, supplies  
**Colors:** Tan (7) and light gray (15) – institutional

```
LAYER 3 (Y=-72): Upper shelf
[15561] [3069bp0c]
   ▓       ▓▓


LAYER 2 (Y=-48): Middle shelf
[14718px1]  [5306]  [5306]
    ▓▓       ▓▓      ▓▓


LAYER 1 (Y=-24): Wall base
[15561] [15561] [15561]
   ▓       ▓       ▓
```

**Rotation:** 90° inward  
**Matrix:** `0 0 1 0 1 0 -1 0 0`

**Part usage:**
- `15561.dat` (3x) – Wall (tan, rotated)
- `14718px1.dat` (1x) – Shelf display
- `5306.dat` (2x) – Compartment dividers
- `3069bp0c.dat` (1x) – Shelf bracket/detail

**Placement:**
- All at X=80 (right wall, 4 studs)
- Same Y layers as North wall

---

### **SOUTH WALL – Classroom Door + Entry** (Z=60)

**Theme:** Detention exit, room access  
**Colors:** Light gray (15) and brown (8) – door frame

```
LAYER 3 (Y=-72): Door header
[15561] [3068bp0d]
   ▓       ▓▓


LAYER 2 (Y=-48): Door frame center
[14718px1]  [2550c01]  [5306]
    ▓▓        ⌈⌉       ▓▓
   (frame)   (door)   (trim)

LAYER 1 (Y=-24): Wall base
[15561] [15561] [15561]
   ▓       ▓       ▓
```

**Part usage:**
- `15561.dat` (3x) – Wall texture (light gray)
- `14718px1.dat` (1x) – Door frame center
- `2550c01.dat` (1x) – Hinged door (brown, swings outward)
- `5306.dat` (1x) – Door trim
- `3068bp0d.dat` (1x) – Door header arch

**Placement:**
- All at Z=60 (front wall, 3 studs forward)
- Door: 40 LDU wide, 80 LDU tall (minifig passage)
- **CRITICAL:** Door swings open at PT24S (Bart bursts through)
- Door hinge: Left side (X=-20)

---

### **WEST WALL – Clock + Portrait** (X=-80)

**Theme:** Authority, time-bound detention  
**Colors:** Dark tan (8) and gray (15) – formal

```
LAYER 3 (Y=-72): Portrait area
[15561] [3069bp0e] <- Principal portrait
   ▓       ▓▓


LAYER 2 (Y=-48): Clock display
[14718px1]  [5306]  [5306]
    ▓▓       ▓▓      ▓▓


LAYER 1 (Y=-24): Wall base
[15561] [15561] [15561]
   ▓       ▓       ▓
```

**Rotation:** 90° opposite from East  
**Matrix:** `0 0 -1 0 1 0 1 0 0`

**Part usage:**
- `15561.dat` (3x) – Wall (tan/gray, rotated)
- `14718px1.dat` (1x) – Clock display (black/white)
- `5306.dat` (2x) – Clock trim
- `3069bp0e.dat` (1x) – Portrait frame (Principal's photo)

**Placement:**
- All at X=-80 (left wall, 4 studs left)
- Clock centered at Y=-48 (eye level for Bart writing)
- **CRITICAL:** Clock shows 3:00 PM (end-of-day)

---

## Build Sequence (Room to Detention)

### **PHASE 1: CLASSROOM CONTAINER (Steps 1-4)**
1. Floor grid (Y=0) – light tan/yellow institutional flooring
2. Base walls (Y=-24) – all 4 walls
3. Control layer (Y=-48) – chalkboard/door/shelves/clock
4. Upper detail (Y=-72) – trim/portraits/decorative

**Result:** Enclosed classroom, detention-ready

---

### **PHASE 2: CHALKBOARD SYSTEM (Step 5)**
```
Y=-120 (top of board)
━━━━━━━━━━━━━━━━━ <- Last line (partially filled)
━━━━━━━━━━━━━━━━━
━━━━━━━━━━━━━━━━━ <- (50+ lines per episode)
...
━━━━━━━━━━━━━━━━━ <- First line (bottom)
Y=-48 (bottom of board)
```

- 22-24 visible lines (printed texture on tile)
- Each line: 120 LDU wide, 4 LDU tall
- Gag phrase varies by episode (printed on tile)
- Chalk ledge: Y=-72, white chalk stick resting left side

---

### **PHASE 3: FURNITURE (Step 6)**
- Desk grid: 4-6 student desks (40 LDU apart)
  - Desk 1: X=-40, Y=-48, Z=+20
  - Desk 2: X=0, Y=-48, Z=+20
  - Desk 3: X=+40, Y=-48, Z=+20
  - Row 2 (behind): 40 LDU further back on Z
- Teacher desk: X=0, Y=-48, Z=-40 (back corner, elevated)
- Wastebasket: X=+60, Y=-8, Z=-50 (corner, empty)

---

### **PHASE 4: CHARACTERS (Steps 7-8)**

7. Bart minifig
   - Position: X=0, Y=-80 (standing height), Z=-55 (at chalkboard)
   - Pose: Right arm raised (holding chalk), left arm at side
   - Expression: Determined concentration (writing lines)
   - Clothing: Shirt (red), shorts (blue), shoes (black)
   - Prop: Chalk stick in right hand (white, 8 LDU)

8. Teacher minifig (optional, background)
   - Position: X=0, Y=-80, Z=-40 (watching detention)
   - Pose: Standing, arms crossed (supervising)
   - Expression: Stern (enforcement)

---

## Chalkboard Gag Content

**Example phrases (vary by episode):**
- "I will not skateboard in the halls" (50x)
- "Bart to the Principal's office" (40x)
- "I will not instigate revolution" (30x)
- "I will not cut class" (50x)
- "I will not eat paste" (40x)
- "I will not yell 'fire' in a crowded classroom" (50x)

**Aesthetic:** Handwritten style font, chalk white on green board, visible chalk dust effect

---

## LDU Verification Checklist – Scene 3

- [ ] Classroom 8×6×5 brick volume
- [ ] All walls at ±80 or ±60 (corner positions)
- [ ] Floor at Y=0 baseline
- [ ] Walls: Y=-24, -48, -72 layers
- [ ] Ceiling: Y=-120
- [ ] Chalkboard spans Y=-48 to Y=-120 (full 3-brick height)
- [ ] Clock at Y=-48 (showing 3:00 PM)
- [ ] Door at Z=60, spans Y=-48 to Y=-120 (full height)
- [ ] Bart at Y=-80 (standing height)
- [ ] Chalk stick at Y=-72 (ledge)
- [ ] 22-24 chalkboard lines visible
- [ ] Door swings open PT24S (exit direction clear)

---

## Build Time Estimate – Scene 3

**Classroom container:** 10–12 minutes  
**Chalkboard assembly:** 3–4 minutes  
**Furniture placement:** 2–3 minutes  
**Character positioning:** 1–2 minutes  
**Total:** 16–21 minutes per scene

**Difficulty:** ⭐⭐⭐ (Medium-Advanced – 4 walls, chalkboard detail)

---

---

# SCENE 2 – SPRINGFIELD ESTABLISHING SHOT (Aerial Pan + Zoom to School)

## LDU Mathematics (Critical)

### **Horizontal Measurements**
```
20 LDU = 1 stud width (landmark unit)
40 LDU = 2x2 brick (building footprint)
80 LDU = 4 studs wide (landmark width)
160 LDU = 8 studs (city block)
320 LDU = 16 studs (camera pan arc)
640 LDU = 32 studs (aerial view sweep)
```

### **Vertical Measurements**
```
8 LDU = 1 plate (ground variation)
24 LDU = 1 brick (single-story building)
48 LDU = 2 bricks (two-story)
120 LDU = 5 bricks (multi-story landmark)
240 LDU = 10 bricks (tallest building/tower)
```

### **Scene Volume**
```
Width:  640 LDU (X: -320 to +320) = 32 stud units
Depth:  640 LDU (Z: -320 to +320) = 32 stud units
Height: 240 LDU (Y: 0 to -240) = 10 brick units
Total:  32x32x10 brick volume (CITYWIDE AERIAL VIEW)
```

---

## Container First Philosophy – TOPOGRAPHY GRID

**Traditional:** Build individual landmarks, scale randomly  
**Master Builder:** Create TERRAIN GRID first (LDU-accurate city blocks), place landmarks on grid

### Why Container First?
- Terrain grid defines camera pan speed (blocks = frames)
- Building placement on grid ensures visual cohesion
- Scale consistency (all buildings relative to street grid)
- Camera zoom path predetermined (pan to school = destination)

---

## Cityscape Grid Layout

### **TOWN GRID SYSTEM**

```
    NORTH (Landmark Entry)
         ↓
    [Nuclear Plant]
         |
    [Prison]
         |
    [Tire Yard]
         |
    [Downtown District - Multiple Blocks]
         |
    [Town Square - Jebediah Statue]
    [Android's Dungeon] [Lard Lad]
         |
    [Billboard - Variable]
         |
    [Springfield Elementary School] ← ZOOM DESTINATION
         ↓
    SOUTH (Zoom Target)
```

---

## Landmarks (11 Total)

| Landmark | Position | Height | Colors | Detail |
|----------|----------|--------|--------|--------|
| Nuclear Plant | X=+200, Z=+300 | 240 | Purple, gray | 2 cooling towers |
| Prison | X=+200, Z=+280 | 120 | Gray, black | Behind plant |
| Tire Yard | X=+150, Z=+240 | 80 | Black, brown | Stacked tires |
| Downtown Stores | X=0, Z=+150 | 120 | Various | Multiple storefronts |
| Painless Dentistry | X=-80, Z=+120 | 120 | Green, white | Sign prominent |
| Town Square | X=0, Z=+60 | 80 | Gray stone | Jebediah statue (120 tall) |
| Kearney/Jimbo Scene | X=+40, Z=+60 | 80 | Tan, green | Statue head falling |
| Android's Dungeon | X=-100, Z=+40 | 120 | Black, red | Comic shop storefront |
| Lard Lad Donuts | X=+100, Z=+40 | 120 | Yellow, pink | Donut statue (80 tall) |
| Billboard | X=0, Z=+20 | 160 | Variable | Changes per episode |
| Elementary School | X=0, Z=-60 | 120 | Orange, purple | Destination/zoom target |

---

## Build Sequence (Grid to Landmarks)

### **PHASE 1: TERRAIN GRID (Step 1)**
- Lay base tiles (Y=0) in 80 LDU blocks (city blocks)
- Create 32×32 stud grid (640×640 LDU)
- Color: Gray concrete for streets, tan for squares
- **Result:** Visible city block structure

### **PHASE 2: BUILDING PLACEMENT (Steps 2-12)**
2. Nuclear Power Plant (North landmark)
3. Prison (behind plant)
4. Tire Yard
5. Downtown district storefront array
6. Town Square + Jebediah statue
7. Kearney/Jimbo scene (statue head vandalism)
8. Android's Dungeon (East side)
9. Lard Lad Donuts (statue with crow)
10. Billboard (center, variable content)
11. Elementary School (South/destination)
12. Secondary landmarks (streetlamps, signs, trees – detail layer)

### **PHASE 3: CAMERA LANDMARK SEQUENCE (Timeline PT11S–PT18S)**

| Time | Landmark | Camera Action | Duration |
|------|----------|---------------|----------|
| PT11S | Sky entry | Flying through clouds | 1s |
| PT12S | Nuclear Plant | Reveal, pass over | 1s |
| PT13S | Prison/Yard | Quick pan past | 1s |
| PT14S | Downtown storefronts | Sweep across | 1s |
| PT15S | Town Square | Linger on statue | 0.5s |
| PT15.5S | Kearney/Jimbo | Head falling (action beat) | 0.5s |
| PT16S | Android/Lard Lad | Parallel storefronts | 1s |
| PT17S | Billboard | Transitional detail | 0.5s |
| PT17.5S | School exterior | Approach, zoom in | 0.5s |
| PT18S | School window | Penetrate glass, reveal Bart | 1s |

---

## Camera Movement – Aerial Pan + Zoom

### **PHASE 1: PAN (PT11S–PT17.5S)**
- **Position:** Elevated (Y=-180, above buildings)
- **Arc:** North to South (Z=+300 to Z=-80)
- **Rotation:** Panning 180° around cityscape
- **Speed:** Fast (covering 16 city blocks in 6.5 seconds = ~2.5 blocks/sec)
- **Effect:** Parallax, motion blur

### **PHASE 2: ZOOM (PT17.5S–PT18S)**
- **Position:** Lowering (Y=-180 → Y=-100)
- **Destination:** School building, window
- **Direction:** Straight toward window (Z=-60)
- **Speed:** Medium (penetrating building)
- **Effect:** Acceleration + transparency as camera passes glass

---

## LDU Verification Checklist – Scene 2

- [ ] Terrain grid: 32×32 stud blocks
- [ ] Landmarks spaced 80 LDU apart (1 block each)
- [ ] Nuclear Plant: X=+200, Z=+300, Height=240 LDU
- [ ] Prison: Behind plant (Z=+280, visible)
- [ ] Town Square: X=0, Z=+60, Jebediah statue 120 tall
- [ ] Elementary School: X=0, Z=-60, 120 LDU tall
- [ ] Billboard: X=0, Z=+20, 160 LDU tall
- [ ] Camera start elevation: Y=-180 (above all buildings)
- [ ] Camera end elevation: Y=-100 (school roofline level)
- [ ] Zoom target: School window at X=0, Z=-60, Y=-80 to -120
- [ ] Pan speed: 640 LDU in 6.5 seconds (~98 LDU/sec)

---

## Build Time Estimate – Scene 2

**Terrain grid base:** 8–10 minutes  
**11 landmarks:** 30–40 minutes (avg 3 min each, complex builds)  
**Detail layer (signs, trees, secondary buildings):** 10–15 minutes  
**Camera animation/timing:** 5–8 minutes  
**Total:** 53–73 minutes per cityscape build

**Difficulty:** ⭐⭐⭐⭐⭐ (Extreme – Large-scale city, 11 landmarks, aerial choreography)

---

---

# SCENE 1 – OPENING CLOUDS & TITLE CARD (Abstract + Title Reveal)

## LDU Mathematics (Critical)

### **Horizontal Measurements**
```
20 LDU = 1 stud width (cloud particle unit)
40 LDU = 2x2 brick (cloud cluster)
80 LDU = 4 studs wide (cloud formation)
160 LDU = 8 studs (title card width)
320 LDU = 16 studs (camera view width)
```

### **Vertical Measurements**
```
8 LDU = 1 plate (cloud layer depth)
24 LDU = 1 brick (cloud stack)
80 LDU = minifig reference (title scale)
120 LDU = 5 bricks (title card height)
240 LDU = 10 bricks (deep sky background)
```

### **Scene Volume**
```
Width:  320 LDU (X: -160 to +160) = 16 stud units
Depth:  320 LDU (Z: -160 to +160) = 16 stud units
Height: 240 LDU (Y: 0 to -240) = 10 brick units
Total:  16x16x10 brick volume (ABSTRACT SKY ENVIRONMENT)
```

---

## Container First Philosophy – SKY AS EMPTY SPACE

**Traditional:** Place clouds, add title  
**Master Builder:** Create EMPTY SKY CONTAINER first (no objects), add clouds + title as layer

### Why Container First?
- Sky volume defines title card scale
- Empty space emphasizes motion (camera flying through nothing)
- Cloud placement controlled by camera trajectory
- Title appears as final element (climactic reveal)

---

## Sky Environment

### **BACKGROUND – Deep Blue/Black**
```
Y=-240 to Y=-120: Deep sky (far background)
  Color: Dark blue gradient (1, 5, 7 mixed)
  Texture: Starfield or nebula effect (optional)
  
Y=-120 to Y=0: Sky transition (mid-ground)
  Color: Light blue (1) grading to horizon
  Texture: Smooth gradient, no detail
```

### **CLOUD FORMATIONS**

**Cloud Particle System (White fluffy cumulus):**

```
Particle 1 (Front): X=-100, Y=-80, Z=0
  Size: 40 LDU (2x2 stud cluster)
  Color: White (15)
  Density: Semi-transparent (75% opaque)

Particle 2 (Front): X=+80, Y=-120, Z=+40
  Size: 60 LDU (3x3 cluster)
  Color: White (15)
  Density: Semi-transparent (75% opaque)

Particle 3 (Back): X=0, Y=-150, Z=-100
  Size: 80 LDU (4x4 cluster)
  Color: Light gray (15, tinted)
  Density: Less opaque (50% - depth effect)

Particle 4 (Back): X=+140, Y=-170, Z=-120
  Size: 100 LDU (5x5 cluster)
  Color: Off-white (15, subtle color shift)
  Density: Least opaque (25% - far background)
```

---

## Title Card System

### **"THE SIMPSONS" Text**

**Position Timeline:**
```
PT0S–PT6S: Title flies toward camera
  Start position: Z=+300 (far away, small)
  End position: Z=0 (through camera)
  Start scale: 1x (tiny)
  End scale: 16x (massive, fills screen)
  
PT6S–PT8S: Camera penetrates through 'P' letter
  Position: Center of screen
  Action: Camera pass-through effect
  
PT8S–PT9S: Location subtitle appears
  Text: Episode-variable location
  Color: White (15) on dark background
  Position: Below title, Y=-160
  
PT9S–PT11S: Fade to next scene
  Transition: Dissolve to establishing shot
  New scene: Springfield cityscape (Scene 2)
```

### **Text Rendering**

**"THE SIMPSONS" (Main Title)**
- Font: Bold sans-serif, yellow (3) with black outline
- Height: 80 LDU (title card area)
- Width: 240 LDU (spans X=-120 to +120)
- Rendered as: High-resolution print on 8x4 stud tile

**Location Subtitle (Episode Variable)**
- Font: Smaller sans-serif, white (15)
- Height: 40 LDU (subtitle area)
- Width: 200 LDU
- Examples: "On a Patio in the Backyard", "$pringfield", "Underwater Springfield"

---

## Build Sequence (Sky to Title)

### **PHASE 1: SKY CONTAINER (Steps 1-2)**
1. Background gradient plane (Y=-240 to Y=0)
   - Deep blue base (Y=-240 to -160)
   - Lighter blue transition (Y=-160 to -80)
   - Sky blue (Y=-80 to 0)
   - Rendered as: Layered backdrop tiles or print

2. Atmosphere effect
   - Subtle gradient stickers
   - Optional starfield (far background)
   - Optional nebula texture (deep background)

### **PHASE 2: CLOUD PLACEMENT (Steps 3-4)**
3. Background clouds (far, transparent)
   - 2-3 large cloud clusters (100-80 LDU)
   - Positioned at Y=-150 to -200
   - Low opacity (20-50%)

4. Foreground clouds (near camera)
   - 2-3 medium clusters (40-60 LDU)
   - Positioned at Y=-80 to -120
   - Higher opacity (75-100%)
   - On camera trajectory (will be passed through)

### **PHASE 3: TITLE CARD PLACEMENT (Steps 5-6)**
5. Main title position
   - Placement: X=-120 to +120, Y=-100, Z=+200 (far start position)
   - Rendered on tile: 8×4 studs minimum
   - Color: Yellow/black printed graphic
   - Scale: Grows as camera approaches

6. Location subtitle
   - Placement: X=-100 to +100, Y=-160, Z=+200 (far start position)
   - Rendered on tile: 5×2 studs minimum
   - Color: White printed text
   - Appears post-penetration (PT8S+)

---

## Camera Movement – Flight Through Clouds

### **FLIGHT TRAJECTORY**

```
PT0S–PT1S: Entry
  Camera Position: X=0, Y=-100, Z=+400 (far back)
  Direction: Forward (toward Z=0)
  Speed: Slow approach
  
PT1S–PT4S: Cloud passage
  Camera Path: Zigzag through cloud layer (Y=-80 to -120)
  Direction: Forward + slight vertical dip
  Speed: Medium (building momentum)
  
PT4S–PT6S: Title approach
  Camera Position: Centering on title (Z=+200 to +50)
  Direction: Forward + upward tilt
  Speed: Fast (accelerating)
  
PT6S–PT8S: Title penetration
  Camera Action: Passing through letter 'P'
  Position: Moving through X=+60, Y=-100 (center of 'P')
  Direction: Straight forward
  Speed: Very fast (dramatic moment)
  
PT8S–PT11S: Transition
  Camera: Slowing, positioning for Scene 2 entry
  Position: Settling into cityscape view
  Direction: Downward pan (looking at Springfield)
```

---

## LDU Verification Checklist – Scene 1

- [ ] Sky container: 16×16×10 stud volume
- [ ] Background color: Dark blue (Y=-240 to -160)
- [ ] Sky gradient: Light blue (Y=-160 to 0)
- [ ] 4 cloud clusters positioned: Y=-80 to -200
- [ ] Title card: 8×4 stud minimum, Y=-100, Z=+200 start
- [ ] Subtitle: 5×2 stud minimum, Y=-160, Z=+200 start
- [ ] Camera start: Z=+400 (far back)
- [ ] Camera end: Z=0 (through center, Scene 2 entry)
- [ ] Flight path: Smooth trajectory through clouds
- [ ] Title scale: 1x→16x (zoom effect over 6 seconds)
- [ ] Penetration point: Center of 'P' at PT6S
- [ ] Transition fade: PT9S–PT11S complete dissolve

---

## Build Time Estimate – Scene 1

**Sky background gradient:** 5–7 minutes  
**Cloud clusters (4 total):** 6–8 minutes (1.5–2 min each)  
**Title card assembly:** 3–4 minutes  
**Subtitle text layer:** 1–2 minutes  
**Camera animation/flight path:** 5–7 minutes  
**Total:** 20–28 minutes per opening sequence

**Difficulty:** ⭐⭐⭐ (Medium-Advanced – Abstract environment, camera motion)

---

---

## COMPLETE INVERSE STORYBOARD SUMMARY

| Scene | Location | Duration | LDU Volume | Difficulty | Build Time |
|-------|----------|----------|-----------|------------|------------|
| 10 | Living Room | 4s | 8×6×5 | ⭐⭐⭐⭐ | 17–22 min |
| 9 | Driveway | 8s | 8×10×5 | ⭐⭐⭐⭐ | 12–17 min |
| 8 | Downtown Montage | 6s | 16×20×5 | ⭐⭐⭐⭐⭐ | 21–28 min |
| 7 | Street Sequence | 11s | 16×20×10 | ⭐⭐⭐⭐ | 18–24 min |
| 6 | Band Class | 6s | 8×6×5 | ⭐⭐⭐ | 12–16 min |
| 5 | Grocery Store | 6s | 8×4×5 | ⭐⭐⭐ | 10–14 min |
| 4 | Nuclear Plant | 7s | 8×8×10 | ⭐⭐⭐⭐⭐ | 24–30 min |
| 3 | Chalkboard Class | 6s | 8×6×5 | ⭐⭐⭐ | 16–21 min |
| 2 | Cityscape | 7s | 32×32×10 | ⭐⭐⭐⭐⭐ | 53–73 min |
| 1 | Sky/Title | 11s | 16×16×10 | ⭐⭐⭐ | 20–28 min |

**TOTAL OPENING SEQUENCE: ~72 seconds (68s scenes + 4s couch gag)**  
**TOTAL BUILD TIME: ~183–273 minutes (~3–4.5 hours per complete opening)**  
**Overall Difficulty: Advanced Master Builder Level**

---

**END OF COMPLETE INVERSE STORYBOARD BUILD SPECIFICATIONS**
