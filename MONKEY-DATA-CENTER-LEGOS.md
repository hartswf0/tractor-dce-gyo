# MONKEY DATA CENTER - Master Builder Construction

## Build Overview
**File:** `monkey-data-center.mpd`  
**Type:** 9-step brick-by-brick build  
**Parts Used:** 13 pieces total  
**Build Time:** ~5 minutes  
**Theme:** Monkeys running data center

---

## Master Builder Method

### **Stud Grid System**
- **8 LDU = 1 stud spacing** (horizontal)
- **8 LDU = 1 plate height** (vertical)
- **24 LDU = 1 brick height** (vertical)
- All pieces click on proper stud grid

### **Build Steps (Layer by Layer)**

**STEP 1 - BASE FLOOR** (Y=0)
- 4 tiles in dark gray (72) for server room floor
- Pieces: `3069bpc0`, `2431px0`, `3068bp80`, `3069bp0d`
- Layout: Center + 20 studs right + 20 studs left + 20 studs forward

**STEP 2 - CONSOLE BASE** (Y=-8, 1 plate up)
- Console tiles in blue (1) and tan (7)
- Pieces: `3068bp0n`, `2431pw1`
- Positioned directly above floor tiles

**STEP 3 - CONSOLE ANGLE** (Y=-16, 2 plates up)
- Slope pieces for tilted screens
- Pieces: `3039pco`, `3040p06`
- Forward offset (Z=10) for angle

**STEP 4 - LEFT WALL** (X=-40, 40 studs left)
- Server rack doors stacked vertically
- Pieces: `2550c01` (Y=-8), `2550c02` (Y=-32)
- Vertical spacing: 24 LDU = 3 plates

**STEP 5 - COOLING VENT** (Y=-48, 6 plates up)
- Top of server rack
- Piece: `11092`
- Mounted on same X=-40 line

**STEP 6 - SECURITY BADGE** (X=40, 20 studs right)
- Wall-mounted at eye level
- Piece: `u595p01c03`
- Height: Y=-16 (2 plates up)

**STEP 7-9 - MINIFIGS**
- Alpha: Y=-40 (5 plates = minifig standing height)
- Beta: Y=-40, X=40 (20 studs right)
- Gamma: Y=-56 (7 plates = climbing position)

---

## Build Diagram (Side View - Container First)

```
Y=-120 [CEILING VENT]────────────── room top
       │
Y=-72  [UPPER DETAIL]────────────── wall decoration layer
       │  WALLS    WALLS    WALLS
Y=-48  [CONTROL PANELS]──────────── main control layer
       │  15561    14718    5306
Y=-24  [WALL BASE]──────────────────── structure layer
       │  15561    15561    15561
Y=-80  [ALPHA] [BETA] [GAMMA]─────── monkeys standing
       │    @      @      @
Y=-48  [CONSOLE]────────────────────── center workstation
       │
Y=0    [===FLOOR===]────────────────── baseline
       
       X=-80    X=0    X=80
       (WEST)  (CTR)  (EAST)
       Z=-80 (NORTH) Z=80 (SOUTH)
```

## Room Volume (Container First)

```
         NORTH (Z=-80)
         [PORTAL CTRL]
              ▓▓▓
    WEST      │        EAST
    (X=-80)   │        (X=80)
   [SERVER]───┼───[LIGHTING]
    ▓▓▓       │       ▓▓▓
              │
         [NETWORK]
         SOUTH (Z=80)

Volume: 160x160x120 LDU (8x8x6 bricks)
```

## Connection Points

**Floor to Console:**
- Floor tiles at Y=0 provide base
- Console tiles at Y=-8 click directly on top (1 plate up)
- Slope pieces at Y=-16 click on console base (2 plates up)

**Server Rack Assembly:**
- Server door 1 at Y=-8 mounts on left wall (X=-40)
- Server door 2 at Y=-32 stacks 24 LDU above (3 plates)
- Cooling vent at Y=-48 tops the rack (6 plates total height)

**Workstation Spacing:**
- Center console: X=0 (reference point)
- Security station: X=40 (20 studs right = 160 LDU)
- Server rack: X=-40 (40 studs left = -320 LDU)
- All aligned on 20-stud intervals for symmetry

**Minifig Heights:**
- Standard standing: Y=-40 (5 plates = typical minifig head height)
- Climbing position: Y=-56 (7 plates = elevated on structure)

---

## LEGOS Framework Applied

### **Location (L)**
**Underground Data Center Control Room**
- Humidity-controlled bunker 40 meters below surface
- Coordinate boundaries: X=(-80 to 80), Y=(-64 to 32), Z=(-20 to 60)
- Functional zones: Control console (center), Server racks (left), Security station (right)

### **Entity (E)**
**Three Capuchin Monkeys** - Former lab subjects
1. **Alpha Monkey** - Head Technician at main console (Y=-40)
2. **Beta Monkey** - Security Officer at monitoring station (X=60, Y=-40)
3. **Gamma Monkey** - Systems Engineer servicing servers (Y=-64, climbing position)

### **Goal (G)**
**Maintain 99.9% Uptime**
- Keep global financial networks operational
- Overcome species barrier through competence
- Quantified success metric embedded in narrative structure

### **Obstacle (O)**
**Human Supervisors Return Early**
- Annual inspection moved up by 3 weeks
- Evidence of monkey operation must be hidden
- Time pressure creates narrative tension
- Banana peels, modified workstations, fruit-scented HVAC

### **Shift (S)**
**Banana Code Discovery**
- Monkeys realize their "random" key-mashing optimized algorithms
- Performance metrics exceed all previous quarters
- Cognitive realization moment: competence through unconventional methods
- Paradigm shift from deception to revelation

### **Solution (U)**
**Symbiotic Truth**
- Humans see improvements, question traditional staffing
- Formal recognition: Monkeys become official operations team
- "Employee of the Month" photo: Alpha Monkey
- Structural resolution: New category of worker emerges

---

## Part Inventory & Scene Function

### **Wall Structure Parts (NEW)**
| Part File | Qty | Type | Function |
|-----------|-----|------|----------|
| `15561.dat` | 12x | Wall texture tile | Structural base for all 4 walls |
| `14718px1.dat` | 4x | Large printed panel | Main display per wall |
| `5306.dat` | 8x | Control module | Individual controls/buttons |

### **Interior Parts (ORIGINAL)**
| Part File | Type | Scene Function |
|-----------|------|----------------|
| `3069bpc0.dat` | Control panel tile | Console + North wall detail |
| `2431px0.dat` | Printed tile | South wall network display |
| `3068bp0n.dat` | Printed tile | South wall camera feed |
| `3068bp80.dat` | Printed tile | East wall temperature |
| `3039pco.dat` | Slope | Console angle |
| `2550c01.dat` | Hinge container | West wall server door 1 |
| `2550c02.dat` | Hinge container | West wall server door 2 |
| `3040p06.dat` | Printed slope | Console angle |
| `3069bp0d.dat` | Printed tile | West wall LED status |
| `11092.dat` | Utility part | Ceiling vent |
| `2431pw1.dat` | Printed tile | Console security panel |
| `u595p01c03.dat` | Sticker/decal | East wall security badge |
| `3626bph4.dat` | Minifig head | Monkey face (x3 characters) |

**Total pieces:** 37 (24 wall parts + 13 interior parts)

---

## 4 Wall Panel Themes

### **North Wall (Z=-80) - Portal Monitoring**
**Colors:** Blue (1) + White (15)  
**Function:** Volume control and portal status  
**Details:**
- 3x `15561.dat` base texture (gray)
- 1x `14718px1.dat` center portal display (blue)
- 2x `5306.dat` volume controls (white)
- 1x `3069bpc0.dat` upper detail tile

**Narrative:** Cold/clinical aesthetic for interdimensional gateway monitoring

### **East Wall (X=80) - Lighting Control**
**Colors:** Yellow (14) + Red (4)  
**Function:** Environmental lighting and HVAC  
**Details:**
- 3x `15561.dat` base texture (gray)
- 1x `14718px1.dat` main lighting panel (yellow)
- 2x `5306.dat` zone controls (red)
- 1x `3068bp80.dat` temperature readout

**Narrative:** Warm/alert spectrum for climate and visibility management

### **South Wall (Z=80) - Network Monitoring**
**Colors:** Tan (7) + Blue (1)  
**Function:** Data flow and network status  
**Details:**
- 3x `15561.dat` base texture (gray)
- 1x `14718px1.dat` network display (tan)
- 1x `2431px0.dat` wide status screen (blue)
- 1x `5306.dat` additional control (blue)
- 1x `3068bp0n.dat` security camera feed

**Narrative:** Information aesthetic for data visualization (most decorative wall)

### **West Wall (X=-80) - Server Diagnostics**
**Colors:** Black (0) + Dark Gray (8)  
**Function:** Server health and rack access  
**Details:**
- 3x `15561.dat` base texture (gray)
- 1x `2550c01.dat` server rack door 1 (black)
- 1x `2550c02.dat` server rack door 2 (black)
- 1x `5306.dat` diagnostic panel (dark gray)
- 1x `3069bp0d.dat` LED status tile

**Narrative:** Server room aesthetic with functional access doors (most utilitarian wall)

---

## Scene Construction Methodology

### **Spatial Organization**
```
Control Console (Center): Y=0 to Y=-8
Server Racks (Left):     X=-60 to X=-40, Y=0 to Y=-24
Security Station (Right): X=60 to X=80, Y=0 to Y=-8
Monkey Positions:         Y=-40 to Y=-64 (standing/climbing)
```

### **Color Coding**
- **Color 72 (Blue)** - Technical infrastructure (servers, cooling)
- **Color 1 (Blue)** - Active displays and screens
- **Color 14 (Yellow)** - Caution labels and warnings
- **Color 6 (Brown)** - Monkey minifig heads

### **Narrative Staging**
1. **Scene 1-3**: Establish three functional zones
2. **Scene 4-6**: Position monkey operators at workstations
3. **Scene 7-8**: Detail hidden elements (banana cache, modified HVAC)
4. **Scene 9**: Overview coordinate system
5. **Scene 10**: Climax freeze-frame (inspection moment)

---

## Words Assemble Philosophy

### **Text as Spatial Structure**
Each line of MPD code is both:
- **Declarative statement** - "Place this part here"
- **Narrative beat** - Reveals story through spatial relationships

### **Coordinates as Narrative**
- **Y=-40** (monkey standing height) vs **Y=0** (human workstation height)
- **X=-70, Y=-16** (hidden banana cache) vs **X=0, Y=0** (visible console)
- **Distance** between monkeys = **social distance** in narrative

### **Parts as Characters**
- `3626bph4.dat` (monkey head) appears 3x at different coordinates = 3 distinct characters
- `2550c01.dat` + `2550c02.dat` (paired hinges) = relationship between containers
- Printed tiles (`bp0n`, `bpc0`) = interfaces between species

---

## LEGOS as Scene Generator

### **Framework Benefits**
1. **Constraint-based creativity** - Limited parts force inventive solutions
2. **Narrative scaffolding** - LEGOS provides structure for improvisation
3. **Emergent meaning** - Spatial arrangements generate story implications
4. **Iterative design** - Framework allows rapid scene prototyping

### **Scene Expansion Potential**
- Add more monkey roles (Maintenance, HR, Catering)
- Introduce human characters (Supervisor minifig heads)
- Temporal layers (Before/During/After inspection)
- Parallel scenes (Other data centers, external world)

---

## Technical Notes

### **LDraw Coordinate System**
- **Y-down** convention (negative Y = elevation above ground)
- **Right-handed** coordinate system
- **Units** in LDraw units (1 LDU ≈ 0.4mm)

### **Part Resolution**
- Subparts (s/) used for complex geometries
- Stickers (u-prefix) for surface details
- Primitive shapes for basic structure

### **Scene Assembly**
```
0 FILE scene-name.mpd
0 !LEGOS [framework metadata]
1 [color] [x] [y] [z] [matrix] [part.dat]
```

---

## Narrative Analysis

### **Genre Fusion**
- **Speculative Fiction** - What-if premise (monkeys running tech)
- **Workplace Comedy** - Office dynamics, hidden snacks, inspections
- **Absurdism** - Sincere treatment of absurd premise

### **Thematic Layers**
1. **Post-human labor** - Non-human intelligence in human roles
2. **Competence vs. credentialism** - Performance over pedigree
3. **Infrastructure invisibility** - Who maintains the systems we depend on?
4. **Interspecies collaboration** - Redefining workplace diversity

### **Emotional Beats**
- **Tension** - Inspection countdown, evidence hiding
- **Recognition** - Moment of algorithmic discovery
- **Resolution** - Acceptance and formalization
- **Humor** - Banana peels, fruit-scented HVAC, "Employee of Month"

---

## Usage Instructions

### **Loading in Gold Editor**
1. Copy `monkey-data-center.mpd` contents
2. Open WAG Gold Editor
3. Paste (Ctrl+V) into editor
4. Hit **Reset** button to compile
5. View 10 scenes via scene selector

### **Narrative Navigation**
- **Scenes 1-3** - Spatial introduction (zones)
- **Scenes 4-6** - Character introduction (monkeys)
- **Scenes 7-8** - World-building details (modifications)
- **Scene 9** - Meta-overview (coordinate map)
- **Scene 10** - Climax (inspection moment)

### **Framework Study**
Read metadata in MPD header:
```
0 !LEGOS NARRATIVE STRUCTURE
0 Location (L): [description]
0 Entity (E): [characters]
0 Goal (G): [objectives]
0 Obstacle (O): [conflicts]
0 Shift (S): [turning point]
0 Solution (U): [resolution]
```

---

## Generator Metadata

**Generator:** LEGOS Framework v1.0  
**Category:** Speculative Fiction / Workplace Comedy  
**Theme:** Post-human Labor / Interspecies Collaboration  
**Keywords:** automation, consciousness, infrastructure, absurdism

**Construction Method:** Part-constrained narrative generation  
**Framework:** LEGOS (Location, Entity, Goal, Obstacle, Shift, Solution)  
**Philosophy:** Words Assemble (text as spatial structure)

---

## Related Files

- `monkey-data-center.mpd` - The MPD scene file
- `index.html` - Manifest entry under FEATURED MODELS → NARRATIVE
- `wag-gold-editor.html` - Viewer for multi-scene MPD files
- `hello-world.mpd` - Simpler example for comparison

---

## Future Expansions

### **Scene Ideas**
- **Break Room** - Monkey social dynamics, fruit dispensers
- **Server Maintenance** - Physical comedy of cable management
- **Video Call** - Monkeys pretending to be humans via deepfake
- **Night Shift** - Solo monitoring, philosophical introspection

### **Framework Variations**
- **Shift alternative:** Humans never return, monkeys run facility forever
- **Solution alternative:** Monkeys unionize, demand benefits
- **Obstacle alternative:** Server fire requires monkey firefighting

### **Cross-Scene Connections**
- Same monkeys in different locations (Thousand Tetrad scenarios)
- Human perspective scenes (The Fork ethical dilemmas)
- Multi-entity dynamics (Holo Project conversation trees)

---

**END DOCUMENT**

*Generated as part of LEGOS Framework demonstration.*  
*File demonstrates narrative construction from limited parts inventory.*
