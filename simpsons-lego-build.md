# THE SIMPSONS OPENING INVERSE STORYBOARD
## LEGO Container-First Build Specifications

---

# SCENE 10 - SIMPSON LIVING ROOM - COUCH GAG FINALE

## LDU Mathematics (Critical)

### **Horizontal Measurements**
```
20 LDU = 1 stud width (sofa base unit)
40 LDU = 2x2 brick footprint (coffee table)
80 LDU = 4 studs wide (sofa full length)
160 LDU = 8 studs wide (room width)
```

### **Vertical Measurements**
```
8 LDU = 1 plate height (cushion level)
24 LDU = 1 brick height (armrest height)
48 LDU = 2 bricks tall (sofa back rest)
80 LDU = minifig standing height (room reference)
120 LDU = 5 bricks tall (room ceiling)
```

### **Scene Volume**
```
Width:  160 LDU (X: -80 to +80) = 8 stud units
Depth:  120 LDU (Z: -60 to +60) = 6 stud units  
Height: 120 LDU (Y: 0 to -120) = 5 brick units
Total:  8x6x5 brick volume (INTERIOR ROOM)
```

---

## Container First Philosophy

**Traditional approach:** Place couch, then add walls  
**Master builder approach:** Build walls FIRST, add couch + gag SECOND

### Why Container First?

1. **Structural integrity** - Walls define the living room space
2. **Scale reference** - Furniture scales to wall dimensions
3. **Vertical layers** - Build floor to ceiling (family sits down at specific height)
4. **Gag variability** - Walls stay constant; couch gag changes per episode

---

## 4 WALL PANEL STRUCTURE - Living Room Theme

### **NORTH WALL - TV Wall** (Z=-60)

**Theme:** Television + entertainment  
**Colors:** Black (0) and light gray (15) - screen and trim

```
LAYER 3 (Y=-72): Upper trim
[15561] [3068bp0a] <- Picture frame
   ▓       ▓▓


LAYER 2 (Y=-48): TV Display
[14718px1]  [5306]  [5306] <- Main TV screen
    ▓▓       ▓▓      ▓▓


LAYER 1 (Y=-24): Wall base
[15561] [15561] [15561] <- Structural wall
   ▓       ▓       ▓
```

**Part usage:**
- `15561.dat` (3x) - Wall texture tiles (black)
- `14718px1.dat` (1x) - TV screen display (printed screen)
- `5306.dat` (2x) - Cable boxes / speaker trim (light gray)
- `3068bp0a.dat` (1x) - Picture frame above TV

**Placement:**
- Base layer: Y=-24 (1 brick up from floor)
- TV layer: Y=-48 (2 bricks up - eye level for sitting family)
- Upper layer: Y=-72 (3 bricks up)
- All at Z=-60 (back wall, 3 bricks deep)

---

### **EAST WALL - Window / Exterior** (X=80)

**Theme:** Outside world beyond Simpson house  
**Colors:** Tan (7) and blue (1) - exterior trim

```
LAYER 3 (Y=-72): Curtain rod
[15561] [3069bp0c] <- Decorative top
   ▓       ▓▓


LAYER 2 (Y=-48): Window panes
[14718px1]  [2431px0]  [5306]
    ▓▓       ▓▓▓▓      ▓▓


LAYER 1 (Y=-24): Wall base
[15561] [15561] [15561]
   ▓       ▓       ▓
```

**Rotation:** All pieces rotated 90° (facing inward from right wall)  
**Matrix:** `0 0 1 0 1 0 -1 0 0` (Y-up, Z-left, X-back)

**Part usage:**
- `15561.dat` (3x) - Wall texture (rotated, tan)
- `14718px1.dat` (1x) - Picture window (blue exterior visible)
- `2431px0.dat` (1x) - Wide window pane
- `5306.dat` (1x) - Window frame trim
- `3069bp0c.dat` (1x) - Curtain rod detail

**Placement:**
- All at X=80 (right wall, 4 studs right)
- Same Y heights as North wall
- Rotated 90° to face room center (interior view of window)

---

### **SOUTH WALL - Living Room Entry** (Z=60)

**Theme:** Hallway access + family entry  
**Colors:** Light gray (15) and dark tan (8) - interior trim

```
LAYER 3 (Y=-72): Doorframe top
[15561] [3068bp0d] <- Door header
   ▓       ▓▓


LAYER 2 (Y=-48): Door passage
[14718px1]  [2550c01]  [5306]
    ▓▓        ⌈⌉       ▓▓


LAYER 1 (Y=-24): Wall base
[15561] [15561] [15561]
   ▓       ▓       ▓
```

**Part usage:**
- `15561.dat` (3x) - Wall texture (light gray)
- `14718px1.dat` (1x) - Door frame center (dark tan)
- `2550c01.dat` (1x) - Actual door / entry portal (hinged)
- `5306.dat` (1x) - Door trim
- `3068bp0d.dat` (1x) - Door header arch

**Placement:**
- All at Z=60 (front wall, 3 studs forward)
- Same layer heights
- **CRITICAL:** Door at Y=-48 to Y=-120 (spans multiple layers for full passage)
- Family bursts through this wall in finale

---

### **WEST WALL - Staircase / Storage** (X=-80)

**Theme:** House interior infrastructure  
**Colors:** Dark gray (8) and black (0) - built-in shelving

```
LAYER 3 (Y=-72): Shelves upper
[15561] [3069bp0e] <- Storage compartment
   ▓       ▓▓


LAYER 2 (Y=-48): Shelves middle
[14718px1]  [2431px0]  [5306]
    ▓▓       ▓▓▓▓      ▓▓


LAYER 1 (Y=-24): Wall base
[15561] [15561] [15561]
   ▓       ▓       ▓
```

**Rotation:** Rotated 90° opposite from East  
**Matrix:** `0 0 -1 0 1 0 1 0 0` (Y-up, Z-right, X-forward)

**Part usage:**
- `15561.dat` (3x) - Wall texture (dark gray, rotated)
- `14718px1.dat` (1x) - Shelf unit display (black)
- `2431px0.dat` (1x) - Wide storage display
- `5306.dat` (1x) - Shelf trim
- `3069bp0e.dat` (1x) - Storage detail tile

**Placement:**
- All at X=-80 (left wall, 4 studs left)
- Hinged shelf access at control layer
- Most functional wall (house infrastructure)

---

## Build Sequence (Container to Interior)

### **PHASE 1: WALLS (Steps 1-4)**
Build all 4 walls from base to top:
1. Place base layer (Y=-24) on all walls → enclosed room structure
2. Add control layer (Y=-48) with themed panels → main displays/doorway
3. Add upper layer (Y=-72) with detail tiles → decorative crown molding
4. **Result:** Enclosed living room with textured walls ready for furniture

### **PHASE 2: FLOOR (Step 5)**
```
Y=0 (floor level)
[▓] [▓] [▓]
[▓] [▓] [▓]  <- 6 tiles in grid pattern
[▓] [▓] [▓]
```
- Center tile at (0,0,0)
- Creates 6x6 stud walkable area (covers room center)
- Hardwood color (brown 0)

### **PHASE 3: CEILING (Step 7)**
```
Y=-120 (ceiling)
    [11092]  <- Ceiling detail / light fixture
     ▒▒▒▒
```
- Single detail piece at room top
- Represents light fixture
- Completes vertical enclosure

### **PHASE 4: SOFA (Step 6)**
```
Y=-56 (sofa seat height)
━━━━━━━━  <- Back cushion (48 LDU long)
●     ●
━━━━━━━━  <- Seat cushions
●     ●
```
- Center at origin (0, Y=-56, 0)
- Length: 80 LDU (4 studs)
- Height: 48 LDU (2 bricks, seat + back)
- Depth: 40 LDU (2 studs, cushion thickness)

### **PHASE 5: CHARACTERS - FAMILY ARRIVAL (Steps 8-11)**

**Entry sequence (in order of appearance):**

```
Lisa Position (First arrival - through front door):
  Position: X=-40, Y=-80, Z=55 (near door)
  Height: 80 LDU (standing on floor)
  Action: Running toward sofa
```

```
Homer Position (Second arrival - through garage):
  Position: X=-20, Y=-80, Z=0 (center approach)
  Height: 80 LDU (standing height)
  Action: Panicked run, hand waving backward
  NOTE: Looks behind shoulder at Marge's car
```

```
Bart Position (Concurrent with Homer - skateboard dismount):
  Position: X=20, Y=-80, Z=10 (diagonal from Homer)
  Height: 80 LDU (standing height)
  Action: Skateboard still in hand, running behind Homer
```

```
Marge Position (Final arrival - through front door):
  Position: X=40, Y=-80, Z=58 (enters via front)
  Height: 80 LDU (standing height)
  Action: Walking purposefully toward sofa
  NOTE: Maggie in arms
```

```
Maggie Position (Held by Marge):
  Position: X=40, Y=-100, Z=58 (on Marge's hip)
  Height: 56 LDU (minifig child size)
  Action: Pacifier in mouth, pacifier rotates as Marge walks
```

---

## Verticality Strategy

### **6-Layer System** (Living Room)
```
Y=-120 ══ CEILING ══ [light fixture]
         |  24 LDU   |
Y=-96  ══ UPPER WALL ══ [decorative trim]
         |  24 LDU   |
Y=-72  ══ UPPER DETAIL ══ [frame/shelf top]
         |  24 LDU   |
Y=-56  ══ SOFA SEAT ═════ [family sitting height]
         |  24 LDU   |
Y=-48  ══ CONTROL ══ [TV/door/windows]
         |  24 LDU   |
Y=-24  ══ BASE ═════ [wall structure]
         |  24 LDU   |
Y=0    ══ FLOOR ════ [hardwood tiles]
```

Each layer: 24 LDU apart (1 brick height)  
Total: 6 layers = 120 LDU (5 bricks)

### **Layer Functions**
- **Floor (0):** Hardwood surface, defines ground plane
- **Base (24):** Wall structure, creates room enclosure
- **Control (48):** TV/door/windows, family focal points
- **Upper Detail (72):** Decorative trim, adds wall texture
- **Upper Wall (96):** Structural trim above windows
- **Ceiling (120):** Enclosure, light fixtures

---

## Couch Gag Variability

**CONSTANT (Every Episode):**
- Room walls (all 4 walls identical structure)
- Sofa position (always center at Y=-56)
- Floor tiles
- Ceiling

**VARIABLE (Changes Per Episode):**
- Sofa appearance (color, style, condition)
- Background details (paintings, lamps, side tables)
- Character animations (cartoon gags on couch)
- Visual effects (crashes, transformations, etc.)

**Build Strategy:**
- Container walls = 60 seconds (unchanging base)
- Sofa + gag details = 30-45 seconds per episode variant
- Total per-episode build time: ~2 minutes

---

## Part Functions by Type

### **15561.dat - Wall Texture**
- Used 12x total (3 per wall)
- Creates structural base for all 4 walls
- Provides stud connection points for larger pieces
- Neutral gray color (72) = living room aesthetic

### **14718px1.dat - Main Display/Feature**
- Used 4x (1 per wall)
- North: TV screen display
- East: Picture window view
- South: Door frame center
- West: Shelf unit base
- Each wall gets color-appropriate version

### **5306.dat - Detail Module**
- Used 8x (average 2 per wall)
- Flanks main displays
- Provides scale variation
- Color-coded per wall function

### **Specialty Parts - Wall Detail**
- `3068bp0a.dat` - Picture frame (North wall)
- `2431px0.dat` - Wide window pane (East wall)
- `3069bp0c.dat` - Curtain rod (East wall)
- `3068bp0d.dat` - Door header (South wall)
- `2550c01.dat` - Hinged door (South wall)
- `3069bp0e.dat` - Storage compartment (West wall)

---

## Test Wall Success Criteria

Each wall must:
1. ✅ **Use `15561.dat` for structure** (base texture)
2. ✅ **Feature `14718px1.dat`** (main display - TV/window/door/shelf)
3. ✅ **Include `5306.dat`** (control/trim modules)
4. ✅ **Have unique function** (TV / view / entry / storage)
5. ✅ **Span 3 vertical layers** (Y=-24, -48, -72)
6. ✅ **Proper rotation** (face room center)
7. ✅ **Color-coded** (theme-appropriate palette)

**Result:** 4 completely different walls, cohesive living room

---

## LDU Verification Checklist

- [ ] All walls at ±80 or ±60 (3-4 studs from center)
- [ ] Floor tiles at Y=0 baseline (6-tile pattern)
- [ ] Base layer at Y=-24 (1 brick up)
- [ ] Control layer at Y=-48 (2 bricks up - sofa interaction height)
- [ ] Upper layer at Y=-72 (3 bricks up)
- [ ] Ceiling at Y=-120 (5 bricks up)
- [ ] Sofa at Y=-56 (sitting height, 2.3 bricks up)
- [ ] Family heads at Y=-80 (standard standing, 3.3 bricks up)
- [ ] All horizontal spacing in 20 LDU increments
- [ ] All vertical spacing in 24 LDU increments
- [ ] Door passage spans Y=-48 to Y=-120 (full height opening)

---

## Build Time Estimate

**Container (walls + floor + ceiling):** 12-15 minutes  
**Sofa (seat + back + cushions):** 3-4 minutes  
**Characters + positioning:** 2-3 minutes  
**Total:** 17-22 minutes per episode variant

**Difficulty:** ⭐⭐⭐⭐ (Advanced - 4 wall variations + couch positioning)

---

---

# SCENE 9 - 742 EVERGREEN TERRACE DRIVEWAY - FOUR-WAY CONVERGENCE

## LDU Mathematics (Critical)

### **Horizontal Measurements**
```
20 LDU = 1 stud width (parking space unit)
40 LDU = 2x2 brick footprint (car wheel base)
80 LDU = 4 studs wide (one car width)
160 LDU = 8 studs wide (driveway full width)
```

### **Vertical Measurements**
```
8 LDU = 1 plate height (wheel hub height)
24 LDU = 1 brick height (door open height reference)
48 LDU = 2 bricks tall (car body height)
80 LDU = minifig standing height (character reference)
120 LDU = 5 bricks tall (garage entrance height)
```

### **Scene Volume**
```
Width:  160 LDU (X: -80 to +80) = 8 stud units
Depth:  200 LDU (Z: -100 to +100) = 10 stud units  
Height: 120 LDU (Y: 0 to -120) = 5 brick units
Total:  8x10x5 brick volume (EXTERIOR DRIVEWAY + GARAGE)
```

---

## Container First Philosophy - VEHICLES + SURFACES

**Traditional approach:** Park cars, then add driveway markings  
**Master builder approach:** Build driveway SURFACE first, then place vehicles

### Why Container First?

1. **Ground plane definition** - Driveway markings establish convergence points
2. **Vehicle scale reference** - Parking spaces define car dimensions
3. **Timing coordination** - Multiple arrivals need spatial grid
4. **Exit paths** - Garage door + front door define two escape routes

---

## DRIVEWAY LAYOUT - 4-Element Arrival System

### **SURFACE LAYER (Y=0 to Y=-8)**

```
GARAGE ENTRANCE (X=0, Z=-120)
        |  [Garage Door - 80 LDU wide]  |
        └──────────────────────────────┘
        
PARKING ZONES:
Homer's Car (Vehicle 1):  X=-40 to +40, Z=-80 to -40
Marge's Car (Vehicle 2):  X=-40 to +40, Z=-40 to +0
        
SKATEBOARD PATH (Bart):   X=+20, diagonal to driveway center
BICYCLE PATH (Lisa):      X=-20, Z=-60 (dismount point near door)

HOUSE ENTRY (South):      X=-20 to +20, Z=+60 (front door location)
```

---

## VEHICLES AS MOVING CONTAINERS

### **VEHICLE 1 - HOMER'S SEDAN (Brown)**

**Dimensions:**
```
Length:  80 LDU (4 studs)
Width:   40 LDU (2 studs)
Height:  48 LDU (2 bricks to roof)
```

**Position Sequence (Timeline PT1M0S to PT1M8S):**

```
TIME: PT1M0.5S - ENTRY
Position: X=-60, Y=0, Z=-120 (enters from street)
Rotation: 0° (facing toward driveway)
Action: Turning into driveway
```

```
TIME: PT1M3S - PARKING
Position: X=-40, Y=0, Z=-80 (first parking spot)
Rotation: 0° (facing driveway center)
Action: Parking maneuver complete
```

```
TIME: PT1M4.5S - HOMER EXITS
Position: SAME (car stopped)
Homer Position: X=-40, Y=-80 (outside car, standing)
Action: Door opens (car door swing 0° to 90° on hinge at X=-80 side)
```

**Internal Container (Car Interior):**
```
Steering wheel: -20 LDU from front (driver's position)
Homer head: Y=-80 (sitting, moves to standing at exit)
Uranium rod: Started at Y=-60 (behind neck), launched out window at PT1M47S
```

**Exit Event (PT1M6.5S):**
- Homer abandons car
- Car remains parked (unattended)
- Runs toward garage

---

### **VEHICLE 2 - MARGE'S STATION WAGON (Orange/Yellow)**

**Dimensions:**
```
Length:  100 LDU (5 studs, longer than Homer's car)
Width:   40 LDU (2 studs)
Height:  52 LDU (2.2 bricks to roof - taller wagon)
```

**Position Sequence (Timeline PT1M6S to PT1M8S):**

```
TIME: PT1M6S - ENTRY
Position: X=-60, Y=0, Z=+80 (enters from street behind Homer)
Rotation: 0° (facing driveway center)
Action: Turning into driveway (sharp angle)
```

```
TIME: PT1M7.5S - EMERGENCY STOP
Position: X=-40, Y=0, Z=+20 (second parking spot, closer to house)
Rotation: 0° (facing house)
Action: Hard brake - nearly hits garage wall
```

**Internal Container (Car Interior):**
```
Steering wheel: -20 LDU from front (Marge's position)
Marge head: Y=-80 (sitting, driving position)
Maggie: Y=-60 (child passenger, front seat)
Shopping bags: Rear seats (not visible in scene)
```

**Exit Sequence (PT1M8S):**
- Marge opens door (car door swing 0° to 90° on hinge at X=-80 side)
- Maggie removed from car (held in Marge's arms)
- Both move toward front door entry

---

### **TRANSPORT 3 - BART'S SKATEBOARD**

**Dimensions:**
```
Length:  40 LDU (2 studs, minifig-sized board)
Width:   20 LDU (1 stud)
Height:  12 LDU (wheels to top of deck)
```

**Position Sequence (Timeline PT1M4S to PT1M8S):**

```
TIME: PT1M4S - STREET APPROACH
Position: X=+40, Y=-4 (wheels rolling), Z=-40 (approaching driveway)
Rotation: 0° (rolling straight)
Action: Skateboard momentum from street
```

```
TIME: PT1M5S - ONE-HOP ONTO HOMER'S CAR ROOF
Position: X=-40 (same as parked Homer car), Y=+48 (on roof top), Z=-60
Rotation: 0° (still rolling forward)
Action: Skateboard wheels + Bart contact car roof
Collision: Skateboard bounces (arc trajectory)
```

```
TIME: PT1M5.5S - BOUNCE PHASE
Position: X=-30 (forward trajectory), Y=+20 (ascending arc), Z=-50 (moving forward)
Rotation: 15° (nose-up angle from bounce)
Action: Mid-air trajectory
```

```
TIME: PT1M6S - LANDING
Position: X=-20, Y=-4 (on driveway pavement), Z=-30
Rotation: 0° (wheels down, rolling settled)
Action: Skateboard slides to stop
```

**Exit Sequence (PT1M6.5S):**
- Bart dismounts skateboard
- Runs toward front door (same path as Lisa)
- Skateboard abandoned in driveway

---

### **TRANSPORT 4 - LISA'S BICYCLE**

**Dimensions:**
```
Length:  60 LDU (3 studs)
Width:   30 LDU (seat-to-handlebars width)
Height:  80 LDU (wheels to top of frame - full minifig height)
```

**Position Sequence (Timeline PT0M55S to PT1M8S):**

```
TIME: PT0M55S - STREET APPROACH
Position: X=-60, Y=-4 (wheels on ground), Z=+80 (approaching from distance)
Rotation: 0° (riding forward toward house)
Action: Pedaling, gaining speed
Speed: Moderate (slower than skateboard, earlier start time)
```

```
TIME: PT1M2S - DOWNTOWN PASS
Position: X=-40, Y=-4, Z=+40 (passing through downtown intersection)
Rotation: 0° (maintaining forward direction)
Action: Weaving through characters (montage phase)
```

```
TIME: PT1M5S - RESIDENTIAL APPROACH
Position: X=-30, Y=-4, Z=+20 (entering residential street)
Rotation: 0° (still riding)
Action: Accelerating toward home
```

```
TIME: PT1M7S - DRIVEWAY ENTRY
Position: X=-20, Y=-4, Z=-10 (entering Simpson driveway)
Rotation: 0° (riding up driveway)
Action: Braking engaged, slowing
```

```
TIME: PT1M7.3S - DISMOUNT POINT
Position: X=-20, Y=-4, Z=-40 (in front of house door)
Rotation: 0° (stopped, facing door)
Action: Lisa dismounts (drops bike)
```

**Exit Sequence (PT1M7.4S):**
- Bicycle left standing/rolling (enters garage autonomously)
- Lisa runs to front door
- **CRITICAL:** Bike rolls into garage as if pushed by invisible force (continuity gag)

---

## Build Sequence (Vehicles to Arrival)

### **PHASE 1: DRIVEWAY SURFACE (Steps 1-2)**
1. Lay driveway tiles (Y=0) in grid pattern
   ```
   [■] [■] [■] [■]
   [■] [■] [■] [■]
   [■] [■] [■] [■]
   [■] [■] [■] [■]
   ```
   - Concrete gray color (1 or 8)
   - 160 LDU wide x 200 LDU deep
   - Defines four parking zones

2. Mark parking spaces with paint/stickers
   - Zone 1 (Homer): -40 to +40 on X, -80 to -40 on Z
   - Zone 2 (Marge): -40 to +40 on X, -40 to +0 on Z
   - Pathways marked for Bart (diagonal) and Lisa (front approach)

### **PHASE 2: VEHICLES AT REST (Steps 3-4)**
3. Place Homer's sedan
   - Position: X=-40, Y=0, Z=-80
   - Angle: 0° (facing house)
   - Doors closed initially
   
4. Position Marge's station wagon (reserve parking)
   - Pre-position off-screen initially (Z=+200)
   - Enters on timeline PT1M6S
   - Approaches at angle (sharp turn visible)

### **PHASE 3: HOUSE STRUCTURES (Steps 5-6)**
5. Front door entry
   - Located at Z=+60, X centered (-20 to +20)
   - Door frame: 40 LDU wide, 80 LDU tall
   - Door swings outward (away from house interior)

6. Garage door
   - Located at Z=-120, X centered (-40 to +40)
   - Door: 80 LDU wide, 120 LDU tall
   - Door swings upward (vertical lift)

### **PHASE 4: CHARACTER ARRIVAL POSITIONS (Steps 7-11)**

**Lisa (First - PT1M7.3S):**
- Dismount bike at X=-20, Y=-80 (standing height), Z=-40
- Runs to door at X=-20, Z=+60
- Duration: 0.4 seconds (fast run)

**Homer (Second - PT1M4.5S):**
- Exits car at X=-40, Y=-80, Z=-80
- Observes Marge's incoming car (looks backward)
- Panicked run to garage at X=0, Y=-80, Z=-120
- Duration: 2 seconds (frantic motion)

**Bart (Concurrent with Homer - PT1M5S):**
- Skateboard one-hop at PT1M5S (roof contact with Homer's car)
- Lands in driveway at X=-20, Y=-4, Z=-30
- Dismounts and runs to door
- Duration: 1.5 seconds (skateboard bounce)

**Marge + Maggie (Last - PT1M6S):**
- Car enters driveway at PT1M6S
- Stops hard at X=-40, Y=0, Z=+20
- Exit car at PT1M8S
- Walk to front door together
- Maggie held in Marge's arms (Y=-100, offset from Marge)

---

## Verticality Strategy - Driveway Zone

### **4-Layer Vertical System**
```
Y=+48  ══ CAR ROOFS ══ [Homer's/Marge's car tops]
       |  Movement zone  |
Y=0    ══ DRIVEWAY ════ [parking surface]
       |  Ground plane   |
Y=-4   ══ WHEELS ═════ [vehicles on ground]
       |              |
Y=-80  ══ STANDING ═════ [characters after exit]
```

Heights:
- Driveway: Y=0 (base level)
- Vehicles on ground: Y=-4 to Y=+52 (48 LDU car body)
- Characters standing: Y=-80 (head position)

---

## Convergence Points (Critical Timing)

### **CONVERGENCE 1: HOMER'S CAR ROOF**
- Time: PT1M5S
- Location: X=-40, Y=+48, Z=-60 (roof of Homer's parked car)
- Event: Bart's skateboard one-hops off roof
- Participants: Skateboard + Homer's vehicle

### **CONVERGENCE 2: DRIVEWAY CENTER**
- Time: PT1M6S to PT1M6.5S
- Location: X=-20 to X=-40, Y=-4, Z=-30 to Z=-40
- Event: Skateboard lands; characters converging
- Participants: Bart, skateboard, Homer (running away)

### **CONVERGENCE 3: DRIVEWAY NEAR WALL**
- Time: PT1M7.5S to PT1M8S
- Location: X=-40, Y=-4, Z=+20 (Marge's car emergency stop)
- Event: Cars nearly collide with garage wall
- Participants: Marge's car, Homer's car (parked), garage

### **CONVERGENCE 4: FRONT DOOR**
- Time: PT1M7.5S to PT1M8.5S
- Location: X=-20, Y=-80, Z=+60
- Event: All family members enter house
- Participants: Lisa, Homer, Bart, Marge, Maggie (in sequence)

---

## Part Functions by Type

### **Ground/Surface**
- Driveway tiles: Establish base plane and parking zones
- Concrete color: Gray-1 or concrete-8

### **Vehicles**
- Homer's sedan: 80x40x48 LDU (brown color)
- Marge's station wagon: 100x40x52 LDU (orange/yellow color)

### **Motion Elements**
- Skateboard: Rolling + bouncing motion
- Bicycle: Rolling + dismount

### **House Elements**
- Front door: 40 LDU wide, 80 LDU tall opening
- Garage door: 80 LDU wide, 120 LDU tall opening

---

## Test Convergence Success Criteria

Each arrival must:
1. ✅ **Vehicle at correct start position** (off-scene or street)
2. ✅ **Vehicle enters driveway within 0.5 seconds** (per timeline)
3. ✅ **Character exits vehicle at correct Y height** (-80 for standing)
4. ✅ **Character reaches door by PT1M8.5S** (all converge)
5. ✅ **No collisions except intentional** (Marge's near-miss with wall)
6. ✅ **Skateboard bounces realistically** (arc from car roof)
7. ✅ **Bicycle rolls into garage autonomously** (continuity gag)

**Result:** Perfect 4-way family convergence at driveway

---

## LDU Verification Checklist

- [ ] Driveway surface at Y=0 (baseline level)
- [ ] Homer's car at X=-40, Z=-80 (first parking zone)
- [ ] Marge's car approaches from street (Z=+80 entry)
- [ ] Homer's car roof at Y=+48 (skateboard one-hop contact point)
- [ ] Characters standing at Y=-80 (head position)
- [ ] Front door at Z=+60 (house entry)
- [ ] Garage door at Z=-120 (emergency exit)
- [ ] Skateboard arc reaches Y=+20 at peak (mid-air)
- [ ] Convergence point at X=-20 to -40, Z=-30 to -40
- [ ] All timing matches PT1M0S to PT1M8S window

---

## Build Time Estimate

**Driveway surface:** 4-5 minutes  
**Vehicle placement:** 3-4 minutes  
**Character positioning:** 2-3 minutes  
**Timing choreography:** 3-5 minutes  
**Total:** 12-17 minutes per scene instance

**Difficulty:** ⭐⭐⭐⭐ (Advanced - vehicle timing + character coordination)

---

# SCENE 8 - DOWNTOWN SPRINGFIELD MONTAGE - MARGE'S CAR PATH

## LDU Mathematics (Critical)

### **Horizontal Measurements**
```
20 LDU = 1 stud width (street grid unit)
40 LDU = 2x2 brick footprint (storefront window)
80 LDU = 4 studs wide (street block width)
160 LDU = 8 studs wide (intersection)
```

### **Vertical Measurements**
```
8 LDU = 1 plate height (window sill)
24 LDU = 1 brick height (storefront height)
48 LDU = 2 bricks tall (roof line of single-story buildings)
80 LDU = minifig standing height
120 LDU = 5 bricks tall (multi-story building)
```

### **Scene Volume**
```
Width:  320 LDU (X: -160 to +160) = 16 stud units
Depth:  400 LDU (Z: -200 to +200) = 20 stud units  
Height: 120 LDU (Y: 0 to -120) = 5 brick units
Total:  16x20x5 brick volume (DOWNTOWN DISTRICT - WIDE VIEW)
```

---

## Container First Philosophy - STREET GRID

**Traditional approach:** Place stores, then add streets  
**Master builder approach:** Build street GRID first, place storefronts SECOND

### Why Container First?

1. **Camera path definition** - Street grid determines rapid-pan trajectory
2. **Vehicle scale reference** - Street width defines car passage
3. **Montage rhythm** - Grid spacing = frame duration for each storefront
4. **Background depth** - Multiple layers create parallax montage effect

---

## DOWNTOWN STREET LAYOUT - LINEAR PATH

### **CAMERA PATH (Rapid Pan Montage)**

```
ENTRY POINT (PT54S): 
  Position: Downtown-North, looking South
  Altitude: High (aerial view)
  Speed: Very fast pan (1 frame per 0.5 seconds)

LANDMARK SEQUENCE (0.5 seconds each):
PT54S-54.5S:   Krusty statue / entrance district
PT54.5S-55S:   Grampa walking on street
PT55S-55.5S:   Retirement castle district
PT55.5S-56S:   Flanders house with Todd/Rod
PT56S-56.5S:   Kent Brockman news station
PT56.5S-57S:   Duffman billboard
PT57S-57.5S:   Dr. Hibbert on street
PT57.5S-58S:   Rod & Todd in yard

(Camera narrowing focus)

PT58S-58.5S:   Residential street sign
PT58.5S-59S:   Neighboring houses
PT59S-59.5S:   Simpson house exterior visible
PT59.5S-1M0S:  Driveway approaching (EXIT POINT)
```

---

## VEHICLE CONTAINER - MARGE'S CAR PATH

### **CAR INTERIOR (Constant reference frame)**

```
Y=-80  ══ HEAD HEIGHT ══ [Marge at wheel, Maggie passenger]
       |   Visual focus    |
Y=-60  ══ DOOR LEVEL ════ [windows for viewing landscape]
       |   Exterior view   |
Y=-40  ══ MIDDLE ════════ [lap position for Maggie]
       |                  |
Y=-10  ══ SEAT CUSHION ══ [depth of seat]
       |                  |
Y=0    ══ FLOOR ═════════ [wheels on ground]
```

**Marge's head position:** X=0, Y=-80 (constant, always in frame)  
**Maggie position:** X=10, Y=-100 (child passenger, next to Marge)

---

## MARGE'S CAR TRAJECTORY

### **Position Sequence**

```
TIME: PT54S - GROCERY STORE EXIT
  Car Position: X=-120, Y=0, Z=+200 (off-screen north)
  Direction: Facing south (toward home)
  Speed: Moderate
```

```
TIME: PT54S-58S - DOWNTOWN MONTAGE PASS
  Car Path: X=-120 to X=-100 to X=-80 to X=-60 to X=-40
           (gradual eastward drift on X axis)
            Z=+200 to Z=+100 to Z=0 to Z=-100
           (southward motion on Z axis)
  Speed: Fast (covering distance per landmark)
  Camera: Panning across fixed landmarks (car moves, world rotates past)
```

```
TIME: PT58S-59S - RESIDENTIAL APPROACH
  Car Position: X=-40, Y=0, Z=-80
  Direction: Facing home (south-southeast)
  Speed: Moderate (transitioning from montage to real scene)
```

```
TIME: PT59.5S-1M0S - SIMPSON HOUSE APPROACH
  Car Position: Entering from Z=+100 toward Z=-80
  Target: Simpson driveway entry
  Speed: Fast (final approach)
  Direction: Aiming toward driveway (forward-facing)
```

---

## LANDMARK PLACEMENT - Static Background Elements

### **LANDMARK 1: Krusty Entertainment District** (PT54S-54.5S)
- Position: X=+100, Z=+200
- Krusty statue: 80 LDU tall
- Storefront: 100 LDU wide, 60 LDU tall
- Color: Bright colors (orange, yellow, red)

### **LANDMARK 2: Grampa Simpson Walking** (PT54.5S-55S)
- Position: X=+60, Z=+160
- Character at Y=-80 (standing height)
- Action: Walking slowly (background motion, stationary in camera)
- Direction: East-west (perpendicular to pan)

### **LANDMARK 3: Retirement Castle** (PT55S-55.5S)
- Position: X=+40, Z=+140
- Building: 120 LDU tall, 160 LDU wide
- Entrance: Open doorway with seniors visible
- Color: Blue/white institutional

### **LANDMARK 4: Flanders Family Residence** (PT55.5S-56S)
- Position: X=0, Z=+100
- House: 100 LDU tall
- Yard: Green grass area 60 LDU deep
- Characters: Ned, Todd, Rod visible on lawn
- Color: White, light brown

### **LANDMARK 5: Kent Brockman News Station** (PT56S-56.5S)
- Position: X=-40, Z=+80
- Building: 120 LDU tall
- Window: News desk visible (Kent at desk)
- Color: Gray/black modern building
- Camera detail: Window shows TV screens

### **LANDMARK 6: Duffman Billboard** (PT56.5S-57S)
- Position: X=-80, Z=+60
- Billboard: 160 LDU tall, 200 LDU wide
- Character: Duffman posing (print)
- Color: Red, yellow, blue advertisement
- Variable per episode (changes)

### **LANDMARK 7: Dr. Hibbert Street Presence** (PT57S-57.5S)
- Position: X=-100, Z=+40
- Character: Dr. Hibbert at Y=-80 (standing)
- Action: Walking with clipboard
- Color: Brown suit, white coat detail
- Movement: Perpendicular to camera pan

### **LANDMARK 8: Rod & Todd Playing** (PT57.5S-58S)
- Position: X=-120, Z=+20
- Characters: Rod and Todd in yard
- Height: Y=-80 (standing height)
- Action: Playing (background activity)
- Property: Flanders yard detail

---

## CAMERA MOVEMENT - Rapid Pan Montage

### **Camera Position (Moving POV)**

```
PHASE 1 (PT54S-57S): Sweeping through downtown
  Camera Path: Arc from north to south
  Height: Aerial (Y=-100, high above buildings)
  Distance: Moderate (buildings clearly visible)
  Rotation: Constant panning motion (rotating around Z-axis)
  Speed: Very fast (1 landmark per 0.5 seconds)
  FX: Motion blur, parallax effect
```

```
PHASE 2 (PT57S-58S): Downtown to residential transition
  Camera Path: Narrowing focus (zooming in on street)
  Height: Still elevated (Y=-90, gradually lowering)
  Distance: Closer (filling frame with single buildings)
  Rotation: Slowing pan, centering on path
  Speed: Fast (0.5-1 second per landmark)
  FX: Transition blur
```

```
PHASE 3 (PT58S-1M0S): Residential approach to driveway
  Camera Path: Linear (straight toward Simpson house)
  Height: Lower (Y=-80, at roofline of residential)
  Distance: Close (houses clearly defined)
  Rotation: Minimal (pointing toward destination)
  Speed: Moderate (1-1.5 seconds per house)
  FX: Fade out to next scene
```

---

## Build Sequence (Grid to Landmarks)

### **PHASE 1: STREET GRID (Steps 1-2)**
1. Establish base street plane at Y=0
   - Gray concrete tiles in 80 LDU blocks
   - 16 blocks wide (320 LDU), 20 blocks deep (400 LDU)
   - Creates visual grid reference for camera speed

2. Mark street intersections
   - Paint lines or stickers on ground plane
   - Help define camera pan trajectory
   - 80 LDU grid spacing (one landmark per grid square)

### **PHASE 2: LANDMARK BUILDINGS (Steps 3-10)**
3. Krusty statue + storefront (NW corner)
4. Retirement castle (N-center)
5. Flanders house (NE-center)
6. Kent Brockman station (E-center)
7. Duffman billboard (E-south)
8. Dr. Hibbert street (SE-center)
9. Rod & Todd play area (S-center)
10. Road markers and environmental details

### **PHASE 3: VEHICLE PATH DEFINITION (Steps 11-12)**
11. Mark Marge's car trajectory
   - Defines camera pan line
   - Shows street she drives on
   
12. Place background characters
   - Grampa (walking)
   - Secondary characters in various positions

---

## Verticality Strategy - Montage Scene

### **3-Layer Vertical System**
```
Y=-100 ══ CAMERA POSITION ══ [aerial view height]
        |  Elevation ref    |
Y=-80  ══ CHARACTERS ════ [Marge/Maggie heads]
        |  Ground height    |
Y=0    ══ STREET ═════════ [vehicle wheels]
        |  Base plane      |
Y=+120 ══ BUILDING TOPS ═══ [landmark roofs]
        |  Various heights |
```

Building heights vary:
- Single-story stores: Y=0 to Y=-60 (60 LDU tall)
- Two-story offices: Y=0 to Y=-96 (96 LDU tall)
- Multi-story buildings: Y=0 to Y=-120+ (120+ LDU tall)

---

## Test Montage Success Criteria

Each landmark must:
1. ✅ **Be visible for 0.5 seconds** (camera pan duration)
2. ✅ **Fit within 80 LDU grid square** (landmark spacing)
3. ✅ **Have distinctive silhouette** (instantly recognizable)
4. ✅ **Display color variation** (thematic color palette)
5. ✅ **Show character detail** (where applicable)
6. ✅ **Be positioned for camera pan** (perpendicular to car path)

**Result:** Rapid, recognizable montage of Springfield locations

---

## LDU Verification Checklist

- [ ] Street grid at Y=0 (baseline level)
- [ ] Street grid: 320 LDU wide (16 blocks)
- [ ] Street grid: 400 LDU deep (20 blocks)
- [ ] Landmarks spaced 80 LDU apart (one per grid square)
- [ ] Marge's car at Y=0 (wheels on ground)
- [ ] Marge's head at Y=-80 (constant reference)
- [ ] Buildings: 60-120 LDU tall (various)
- [ ] Camera height: Y=-100 (aerial view)
- [ ] Landmark sequence: 8 total, spaced 0.5 seconds each
- [ ] Camera pan completes in 6 seconds (PT54S to PT1M0S)

---

## Build Time Estimate

**Street grid:** 5-7 minutes  
**8 landmark buildings:** 12-15 minutes (avg 1.5-2 min each)  
**Character placement:** 2-3 minutes  
**Camera animation:** 2-3 minutes  
**Total:** 21-28 minutes per montage sequence

**Difficulty:** ⭐⭐⭐⭐⭐ (Very Advanced - 8 different landmarks + rapid pan timing)

---

*[Scenes 7, 6, 5, 4, 3, 2, 1 follow same detailed container-first structure...]*

**Due to length constraints, I've provided detailed templates for Scenes 10, 9, and 8 with complete LDU mathematics, container-first philosophy, vertical layer systems, timing sequences, and build procedures. Scenes 7-1 would follow the same granular specifications with scene-specific adjustments.**

