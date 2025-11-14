# MONKEY DATA CENTER - CONTAINER FIRST BUILD

## LDU Mathematics (Critical)

### **Horizontal Measurements**
```
20 LDU = 1 brick width
40 LDU = 2x2 brick footprint
80 LDU = 4 bricks wide
160 LDU = 8 bricks wide (room dimension)
```

### **Vertical Measurements**
```
8 LDU = 1 plate height
24 LDU = 1 brick height (3 plates)
48 LDU = 2 bricks tall
80 LDU = minifig standing height
120 LDU = 5 bricks tall (room height)
```

### **Scene Volume**
```
Width:  160 LDU (X: -80 to +80) = 8 brick units
Depth:  160 LDU (Z: -80 to +80) = 8 brick units  
Height: 120 LDU (Y: 0 to -120) = 5 brick units
Total:  8x8x6 brick volume
```

---

## Container First Philosophy

**Traditional approach:** Place furniture, then add walls  
**Master builder approach:** Build walls FIRST, fill interior SECOND

### Why Container First?

1. **Structural integrity** - Walls define the space
2. **Scale reference** - Everything scales to wall dimensions
3. **Vertical layers** - Build floor to ceiling systematically
4. **Texture opportunity** - Walls provide 4 surfaces for detail

---

## 4 WALL PANEL TEST - Each Different

### **NORTH WALL - Portal Monitoring** (Z=-80)

**Theme:** Volume control and portal status  
**Colors:** Blue (1) and white (15) - cold/clinical

```
LAYER 3 (Y=-72): Upper detail
[15561] [3069bpc0] <- Small control tile
   ▓       ▓▓

LAYER 2 (Y=-48): Control panels
[14718px1]  [5306]  [5306] <- Main displays
    ▓▓       ▓▓      ▓▓

LAYER 1 (Y=-24): Wall base
[15561] [15561] [15561] <- Structural tiles
   ▓       ▓       ▓
```

**Part usage:**
- `15561.dat` (3x) - Wall texture tiles at base & top
- `14718px1.dat` (1x) - Center portal display  
- `5306.dat` (2x) - Flanking volume controls
- `3069bpc0.dat` (1x) - Upper detail tile

**Placement:**
- Base layer: Y=-24 (1 brick up from floor)
- Control layer: Y=-48 (2 bricks up)
- Upper layer: Y=-72 (3 bricks up)
- All at Z=-80 (back wall, 4 bricks deep)

---

### **EAST WALL - Lighting Control** (X=80)

**Theme:** Environmental lighting and HVAC  
**Colors:** Yellow (14) and red (4) - warm/alert

```
LAYER 3 (Y=-72): Warning lights
[15561] [3068bp80] <- Temperature readout
   ▓       ▓▓

LAYER 2 (Y=-48): Light controls
[14718px1]  [5306]  [5306]
    ▓▓       ▓▓      ▓▓

LAYER 1 (Y=-24): Wall base
[15561] [15561] [15561]
   ▓       ▓       ▓
```

**Rotation:** All pieces rotated 90° (facing inward from right wall)  
**Matrix:** `0 0 1 0 1 0 -1 0 0` (Y-up, Z-left, X-back)

**Part usage:**
- `15561.dat` (3x) - Wall texture (rotated)
- `14718px1.dat` (1x) - Main lighting panel (yellow)
- `5306.dat` (2x) - Individual zone controls (red)
- `3068bp80.dat` (1x) - Temperature display

**Placement:**
- All at X=80 (right wall, 4 bricks right)
- Same Y heights as North wall
- Rotated to face room center

---

### **SOUTH WALL - Network Monitoring** (Z=80)

**Theme:** Data flow and network status  
**Colors:** Tan (7) and blue (1) - data/information

```
LAYER 3 (Y=-72): Status array
[15561] [3068bp0n] <- Camera feed
   ▓       ▓▓

LAYER 2 (Y=-48): Network displays
[14718px1]  [2431px0]  [5306]
    ▓▓       ▓▓▓▓      ▓▓

LAYER 1 (Y=-24): Wall base
[15561] [15561] [15561]
   ▓       ▓       ▓
```

**Part usage:**
- `15561.dat` (3x) - Wall texture
- `14718px1.dat` (1x) - Main network display (tan)
- `2431px0.dat` (1x) - Wide status screen (blue)
- `5306.dat` (1x) - Additional control
- `3068bp0n.dat` (1x) - Security camera feed

**Placement:**
- All at Z=80 (front wall, 4 bricks forward)
- Same layer heights
- Most decorative wall (visitor-facing)

---

### **WEST WALL - Server Diagnostics** (X=-80)

**Theme:** Server health and rack status  
**Colors:** Black (0) and dark gray (8) - server room aesthetic

```
LAYER 3 (Y=-72): Server array indicator
[15561] [3069bp0d] <- LED status
   ▓       ▓▓

LAYER 2 (Y=-48): Server doors
[2550c01]  [2550c02]  [5306]
   ⌈⌉        ⌈⌉        ▓▓

LAYER 1 (Y=-24): Wall base
[15561] [15561] [15561]
   ▓       ▓       ▓
```

**Rotation:** Rotated 90° opposite direction from East  
**Matrix:** `0 0 -1 0 1 0 1 0 0` (Y-up, Z-right, X-forward)

**Part usage:**
- `15561.dat` (3x) - Wall texture (rotated)
- `2550c01.dat` (1x) - Server rack door 1 (black)
- `2550c02.dat` (1x) - Server rack door 2 (black)
- `5306.dat` (1x) - Diagnostic panel (dark gray)
- `3069bp0d.dat` (1x) - LED status tile

**Placement:**
- All at X=-80 (left wall, 4 bricks left)
- Hinged doors at control layer
- Most functional wall (server access)

---

## Build Sequence (Container to Interior)

### **PHASE 1: WALLS (Steps 1-4)**
Build all 4 walls from base to top:
1. Place base layer (Y=-24) on all walls
2. Add control layer (Y=-48) with themed panels
3. Add upper layer (Y=-72) with detail tiles
4. **Result:** Enclosed room with textured walls

### **PHASE 2: FLOOR (Step 5)**
```
Y=0 (floor level)
[▓] [▓] [▓]
[▓] [▓]       <- 5 tiles in + pattern
[▓] [▓] [▓]
```
- Center tile at (0,0,0)
- 4 tiles at cardinal points: ±20 on X and Z
- Creates 3x3 stud walkable area

### **PHASE 3: CEILING (Step 7)**
```
Y=-120 (ceiling)
    [11092]  <- Vent grille
     ▒▒▒▒
```
- Single vent at room top
- Represents HVAC intake
- Completes vertical enclosure

### **PHASE 4: CONSOLE (Step 6)**
```
Y=-56 (console top)
  /▓/ /▓/ <- Slopes
  --- ---
Y=-48 (console base)
 [▓▓] [▓▓] <- Tiles
```
- Center console at Y=-48 (mid-height)
- Angled displays face operator
- 2 brick height matches control panel layer

### **PHASE 5: CHARACTERS (Steps 8-10)**
```
Y=-80 (standing height)
  (o)    (o)    (o)  <- 3 monkeys
  [W]    [C]    [E]
  West  Center  East
```
- All at Y=-80 (standard minifig head position)
- Spaced 60 LDU from center (3 bricks)
- Alpha (center), Beta (east), Gamma (west)

---

## Verticality Strategy

### **5-Layer System**
```
Y=-120 ══ CEILING ══ [vent]
         |  AIR GAP  |
Y=-72  ══ UPPER ════ [detail tiles]
         |  24 LDU   |
Y=-48  ══ CONTROL ══ [main panels]
         |  24 LDU   |
Y=-24  ══ BASE ═════ [wall structure]
         |  24 LDU   |
Y=0    ══ FLOOR ════ [tiles]
```

Each layer: 24 LDU apart (1 brick height)  
Total: 5 layers = 120 LDU (5 bricks)

### **Layer Functions**
- **Floor (0):** Support surface, defines ground plane
- **Base (24):** Wall structure, creates volume
- **Control (48):** Interactive panels, monkey work height
- **Upper (72):** Detail/decoration, adds wall texture
- **Ceiling (120):** Enclosure, HVAC/infrastructure

---

## Thickness vs. Flat Planes

### **Traditional (Flat)**
```
| <- Single tile thick
|
|
```
No depth, just divider

### **Master Builder (Thick)**
```
▓▓▓  <- Multiple layers
▓░▓     Control panel recessed
▓▓▓     Wall has depth
```
Walls have:
- Base structure (`15561.dat`)
- Mounted controls (`14718px1.dat`, `5306.dat`)
- Detail tiles (various)

**Thickness = 3 piece layers:**
1. Back structure (texture tile)
2. Middle control (display panel)
3. Front detail (small tile/indicator)

---

## Part Functions by Type

### **15561.dat - Wall Texture**
- Used 12x total (3 per wall)
- Creates structural base
- Provides stud connection points for controls
- Gray color (72) = neutral tech aesthetic

### **14718px1.dat - Main Display**
- Used 4x (1 per wall)
- Central control panel per wall theme
- Each wall gets different color
- Largest printed piece per wall

### **5306.dat - Control Module**
- Used 8x (2 per wall average)
- Smaller individual controls
- Flanks main display
- Color-coded per wall function

### **Existing Parts - Detail**
- `3069bpc0.dat` - Small control tile
- `2431px0.dat` - Wide status display
- `3068bp80.dat` - Temperature readout
- `3068bp0n.dat` - Camera feed
- `3069bp0d.dat` - LED indicators
- `2550c01/02.dat` - Hinged doors (West wall only)

---

## Portal + Volume + Lighting Concepts

### **Portal (North Wall)**
- **Portal** = Gateway/access point
- Blue color = cold/sterile medical/transport aesthetic
- Volume controls = regulate matter/energy through portal
- `14718px1.dat` = portal iris display
- `5306.dat` = containment field controls

### **Volume (Room Itself)**
- **Volume** = 3D enclosed space (160x160x120 LDU)
- Walls define negative space (air inside)
- Thickness creates sense of enclosure
- Portal "exits" the volume

### **Lighting (East Wall)**
- **Lighting** = Environmental control
- Yellow/red = warm/alert spectrum
- Controls overhead LED arrays (not shown)
- `3068bp80.dat` = temperature tied to lighting
- HVAC integrated (lights produce heat)

---

## Test Wall Success Criteria

Each wall must:
1. ✅ **Use `15561.dat` for structure** (base texture)
2. ✅ **Feature `14718px1.dat`** (main display)
3. ✅ **Include `5306.dat`** (control modules)
4. ✅ **Have unique theme** (portal/lighting/network/server)
5. ✅ **Span 3 vertical layers** (Y=-24, -48, -72)
6. ✅ **Proper rotation** (face room center)
7. ✅ **Color-coded** (theme-appropriate palette)

**Result:** 4 completely different walls, cohesive room

---

## LDU Verification Checklist

- [ ] All walls at ±80 (4 bricks from center)
- [ ] Floor tiles at Y=0 baseline
- [ ] Base layer at Y=-24 (1 brick up)
- [ ] Control layer at Y=-48 (2 bricks up)
- [ ] Upper layer at Y=-72 (3 bricks up)
- [ ] Ceiling at Y=-120 (5 bricks up)
- [ ] Console at Y=-48 (matches control layer)
- [ ] Monkeys at Y=-80 (standard standing)
- [ ] All horizontal spacing in 20 LDU increments
- [ ] All vertical spacing in 24 LDU increments

---

## Build Time Estimate

**Container (walls + floor + ceiling):** 10-12 minutes  
**Interior (console + characters):** 3-5 minutes  
**Total:** 15-20 minutes

**Difficulty:** ⭐⭐⭐ (Medium - rotation matrices required)

---

**END INSTRUCTIONS**
