# LDraw Assembly Grammar: From Disobedience Theory to Executable Code

**A Practical Companion for LLM-Based LEGO Scene Generation**

---

## 1. LDraw Syntax Primer

### 1.1 The Line Format

Every LDraw line follows this structure:

```
1 <color> <x> <y> <z> <a> <b> <c> <d> <e> <f> <g> <h> <i> <part>.dat
```

| Field | Meaning | Units |
|-------|---------|-------|
| `1` | Line type (part reference) | — |
| `color` | LDraw color code | Integer |
| `x y z` | Position | LDU (LEGO Drawing Units) |
| `a b c d e f g h i` | 3×3 rotation matrix | Floats |
| `part.dat` | Part filename | String |

### 1.2 The LDU Grid

```
1 stud width  = 20 LDU
1 stud height = 24 LDU (brick height)
1 plate height = 8 LDU (1/3 brick)
1 tile height = 4 LDU (with tolerance)
```

**Coordinate System**:
- **X**: Left-Right (positive = right)
- **Y**: Up-Down (positive = DOWN, inverted!)
- **Z**: Front-Back (positive = toward viewer)

### 1.3 Example: Single Brick at Origin

```ldraw
1 4 0 0 0 1 0 0 0 1 0 0 0 1 3001.dat
```

Translation: Red (4) 2×4 brick at origin, no rotation.

---

## 2. The Universal Kit in LDraw

### 2.1 SNOT Core (Axis-Changing Parts)

| Part | File | Cd | Role | Stud Positions |
|------|------|-----|------|----------------|
| Travis Brick | `4733.dat` | 6.0 | 6-way node | Top, 4 sides, bottom |
| Headlight Brick | `4070.dat` | 3.5 | SNOT + offset | Top, side (recessed) |
| Side-Stud 1×1 | `87087.dat` | 2.0 | Flush SNOT | Top, 1 side |
| Bracket 1×2-1×4 | `2436.dat` | 4.0 | 90° turn | Top (2), side (4) |
| Bracket Inverted | `99207.dat` | 4.0 | Inverse wrap | Bottom (4), side (2) |
| Side-Stud 1×4 | `30414.dat` | 4.0 | SNOT wall | Top (4), side (4) |

### 2.2 Surface Parts (Geometric Approximators)

| Part | File | Angle | Use Case |
|------|------|-------|----------|
| Cheese Slope | `54200.dat` | 30° | Sub-voxel smoothing |
| Slope 1×2 | `85984.dat` | 30° | Larger smooth spans |
| Curved Slope 2×1 | `11477.dat` | Curved | Organic top surfaces |
| Curved Inverted | `24201.dat` | Curved | Organic undersides |
| Curved 2×2 | `15068.dat` | Bi-curve | Smooth transitions |

### 2.3 Grid Correctors (Sub-Stud Precision)

| Part | File | Offset | Use |
|------|------|--------|-----|
| Jumper Plate | `3794.dat` | 0.5 stud (10 LDU) | Center odd on even |
| Jumper Groove | `15573.dat` | 0.5 stud | Modern jumper |
| 2×2 Jumper | `87580.dat` | 0.5 stud X+Z | Quad centering |

### 2.4 Disobedient Parts (High Dp)

| Part | File | Signature | Anti-Affordances |
|------|------|-----------|------------------|
| Minifig Hand | `983.dat` | C_CLIP_VARIABLE | Greeble, hinge chain, friction grip |
| Roller Skate | `11253.dat` | MICRO_HUB | Dense SNOT, microscale chassis |
| Bar 1L + Clip | `48729.dat` | BAR_SYSTEM_BRIDGE | System-to-bar transition |
| Light Ring | `4081b.dat` | PIVOT_RING | Stress joints, rotation |

---

## 3. Rotation Matrix Cookbook

### 3.1 Identity (No Rotation)

```
1 0 0 0 1 0 0 0 1
```

Part faces default direction (studs up for bricks).

### 3.2 SNOT Rotations (Studs Not On Top)

**Studs facing +X (right)**:
```
0 0 1 0 1 0 -1 0 0
```

**Studs facing -X (left)**:
```
0 0 -1 0 1 0 1 0 0
```

**Studs facing +Z (toward viewer)**:
```
1 0 0 0 0 -1 0 1 0
```

**Studs facing -Z (away from viewer)**:
```
1 0 0 0 0 1 0 -1 0
```

**Studs facing down (-Y)**:
```
1 0 0 0 -1 0 0 0 -1
```

### 3.3 Diagonal Rotations (45°)

**45° around Y axis**:
```
0.7071 0 0.7071 0 1 0 -0.7071 0 0.7071
```

**45° around X axis**:
```
1 0 0 0 0.7071 -0.7071 0 0.7071 0.7071
```

### 3.4 Combined SNOT + 45°

**Studs right + 45° tilt**:
```
0 0.7071 0.7071 0 0.7071 -0.7071 -1 0 0
```

---

## 4. Connection Point Database

### 4.1 Stud Positions (Top Connections)

All positions relative to part origin (center-bottom for most parts).

**Brick 2×4 (3001.dat)**:
```
Studs at: 
  (-30, -24, -10), (-10, -24, -10), (10, -24, -10), (30, -24, -10)
  (-30, -24,  10), (-10, -24,  10), (10, -24,  10), (30, -24,  10)
```

**Plate 1×1 (3024.dat)**:
```
Stud at: (0, -8, 0)
```

**Travis Brick (4733.dat)**:
```
Top stud:    (0, -24, 0)
+X stud:     (10, -12, 0)
-X stud:     (-10, -12, 0)
+Z stud:     (0, -12, 10)
-Z stud:     (0, -12, -10)
Anti-stud:   (0, 0, 0) [bottom]
```

**Headlight Brick (4070.dat)**:
```
Top stud:    (0, -24, 0)
Side stud:   (10, -12, 0) [recessed by 4 LDU]
Recess:      (-10, -8, 0) [for plate insertion]
```

### 4.2 Anti-Stud Positions (Bottom Connections)

Anti-studs (tubes) accept studs from below.

**Standard spacing**: Every 20 LDU in X and Z.

**Plate/Brick bottom**: Tubes at grid intersections minus edges.

---

## 5. Assembly Patterns

### 5.1 Basic Stacking

```ldraw
0 // Two 2x4 bricks stacked
1 4 0 0 0 1 0 0 0 1 0 0 0 1 3001.dat
1 4 0 -24 0 1 0 0 0 1 0 0 0 1 3001.dat
```

Note: Y decreases (goes negative) as we build UP.

### 5.2 SNOT Wall (Studs Facing Right)

```ldraw
0 // Headlight brick with studs facing +X
1 15 0 0 0 0 0 1 0 1 0 -1 0 0 4070.dat

0 // 1x1 plate attached to side stud
1 14 10 -12 0 0 0 1 0 1 0 -1 0 0 3024.dat
```

### 5.3 Travis Brick Hub

```ldraw
0 // Travis brick at center
1 7 0 0 0 1 0 0 0 1 0 0 0 1 4733.dat

0 // Plates on all 4 side studs
1 14 10 -12 0 0 0 1 0 1 0 -1 0 0 3024.dat
1 14 -10 -12 0 0 0 -1 0 1 0 1 0 0 3024.dat
1 14 0 -12 10 1 0 0 0 0 -1 0 1 0 3024.dat
1 14 0 -12 -10 1 0 0 0 0 1 0 -1 0 3024.dat

0 // Plate on top
1 14 0 -24 0 1 0 0 0 1 0 0 0 1 3024.dat
```

### 5.4 Jumper Offset (Half-Stud Centering)

```ldraw
0 // 2x4 plate base
1 15 0 0 0 1 0 0 0 1 0 0 0 1 3020.dat

0 // Jumper plate on top (centered)
1 14 0 -8 0 1 0 0 0 1 0 0 0 1 3794.dat

0 // 1x1 brick on jumper (offset by 10 LDU)
1 4 10 -16 0 1 0 0 0 1 0 0 0 1 3005.dat
```

### 5.5 Slope Smoothing (Surface Approximation)

```ldraw
0 // Base plate
1 15 0 0 0 1 0 0 0 1 0 0 0 1 3020.dat

0 // Cheese slopes creating 30° surface
1 15 -30 -8 0 1 0 0 0 1 0 0 0 1 54200.dat
1 15 -10 -8 0 1 0 0 0 1 0 0 0 1 54200.dat
1 15 10 -8 0 1 0 0 0 1 0 0 0 1 54200.dat
1 15 30 -8 0 1 0 0 0 1 0 0 0 1 54200.dat
```

---

## 6. Voxelization Algorithm (LLM-Executable)

### 6.1 Surface Normal → Part Selection

```python
def select_part(normal: Vector3) -> str:
    """Select LDraw part based on surface normal."""
    
    # Normalize
    n = normalize(normal)
    
    # Flat horizontal (studs up)
    if n.y < -0.95:
        return "3024.dat"  # Plate 1x1
    
    # Flat vertical (SNOT wall)
    if abs(n.x) > 0.95 or abs(n.z) > 0.95:
        return "87087.dat"  # Side-stud brick
    
    # 30° slope
    if -0.9 < n.y < -0.8:
        return "54200.dat"  # Cheese slope
    
    # 45° slope
    if -0.8 < n.y < -0.6:
        return "3040.dat"  # Slope 45° 2x1
    
    # Curved surface
    if abs(n.y) < 0.6:
        return "15068.dat"  # Curved slope (needs SNOT mount)
    
    # Inverted (underside)
    if n.y > 0.7:
        return "24201.dat"  # Curved inverted slope
    
    return "3005.dat"  # Default: 1x1 brick
```

### 6.2 Rotation Matrix from Normal

```python
def rotation_from_normal(normal: Vector3) -> str:
    """Generate LDraw rotation matrix to align part with surface normal."""
    
    n = normalize(normal)
    
    # Standard orientations
    if n ≈ (0, -1, 0):  # Studs up
        return "1 0 0 0 1 0 0 0 1"
    
    if n ≈ (1, 0, 0):   # Studs right
        return "0 0 1 0 1 0 -1 0 0"
    
    if n ≈ (-1, 0, 0):  # Studs left
        return "0 0 -1 0 1 0 1 0 0"
    
    if n ≈ (0, 0, 1):   # Studs forward
        return "1 0 0 0 0 -1 0 1 0"
    
    if n ≈ (0, 0, -1):  # Studs back
        return "1 0 0 0 0 1 0 -1 0"
    
    if n ≈ (0, 1, 0):   # Studs down
        return "1 0 0 0 -1 0 0 0 -1"
    
    # For arbitrary normals, compute full rotation
    return compute_rotation_matrix(n)
```

### 6.3 Grid Snapping

```python
def snap_to_grid(position: Vector3, grid_type: str) -> Vector3:
    """Snap position to LDraw grid."""
    
    if grid_type == "stud":
        # Snap to 20 LDU grid
        return Vector3(
            round(position.x / 20) * 20,
            round(position.y / 8) * 8,   # Plate height
            round(position.z / 20) * 20
        )
    
    if grid_type == "half_stud":
        # Snap to 10 LDU grid (jumper precision)
        return Vector3(
            round(position.x / 10) * 10,
            round(position.y / 8) * 8,
            round(position.z / 10) * 10
        )
    
    return position
```

---

## 7. Color Codes

### 7.1 Common Colors

| Code | Color | Hex |
|------|-------|-----|
| 0 | Black | #1B2A34 |
| 1 | Blue | #1E5AA8 |
| 2 | Green | #00852B |
| 4 | Red | #B40000 |
| 7 | Light Gray | #8A928D |
| 14 | Yellow | #FAC80A |
| 15 | White | #F4F4F4 |
| 19 | Tan | #DEC69C |
| 25 | Orange | #D67923 |
| 70 | Reddish Brown | #5F3109 |
| 71 | Light Bluish Gray | #A0A5A9 |
| 72 | Dark Bluish Gray | #5C5E5F |

### 7.2 Transparent Colors

| Code | Color |
|------|-------|
| 33 | Trans Blue |
| 34 | Trans Green |
| 36 | Trans Red |
| 40 | Trans Black |
| 41 | Trans Light Blue |
| 42 | Trans Neon Green |
| 47 | Trans Clear |

---

## 8. LLM System Instruction for LDraw Generation

```xml
<system id="LDRAW-GENERATOR">
  <knowledge>
    You generate LDraw format files for LEGO scenes.
    
    LINE FORMAT:
    1 [color] [x] [y] [z] [a b c d e f g h i] [part.dat]
    
    COORDINATE SYSTEM:
    - 1 stud = 20 LDU
    - 1 plate height = 8 LDU (Y decreases going UP)
    - 1 brick height = 24 LDU
    
    SNOT ROTATIONS:
    - Studs up:    1 0 0 0 1 0 0 0 1
    - Studs right: 0 0 1 0 1 0 -1 0 0
    - Studs left:  0 0 -1 0 1 0 1 0 0
    - Studs front: 1 0 0 0 0 -1 0 1 0
    - Studs back:  1 0 0 0 0 1 0 -1 0
    - Studs down:  1 0 0 0 -1 0 0 0 -1
  </knowledge>

  <universal_kit>
    SNOT_CORE:
      4733.dat  = Travis Brick (6-way hub)
      4070.dat  = Headlight Brick (SNOT + offset)
      87087.dat = Side-Stud 1x1
      2436.dat  = Bracket 1x2-1x4
    
    SURFACE:
      54200.dat = Cheese Slope 30°
      3040.dat  = Slope 45° 2x1
      15068.dat = Curved Slope 2x2
      24201.dat = Curved Inverted
    
    GRID_CORRECT:
      3794.dat  = Jumper Plate (0.5 stud offset)
      3024.dat  = Plate 1x1
      3023.dat  = Plate 1x2
    
    STRUCTURE:
      3001.dat  = Brick 2x4
      3003.dat  = Brick 2x2
      3005.dat  = Brick 1x1
  </universal_kit>

  <protocol>
    1. Parse narrative into zones (center, inner, outer, rim)
    2. For each zone, identify required surface normals
    3. Select parts matching normals from universal_kit
    4. Compute positions on LDU grid
    5. Apply SNOT rotations where needed
    6. Insert jumpers for sub-stud alignment
    7. Output complete LDraw file
  </protocol>

  <output_format>
    0 FILE model.ldr
    0 Name: [scene_name]
    0 Author: LDRAW-GENERATOR
    
    0 // Zone: CENTER
    1 [color] [x] [y] [z] [rotation] [part.dat]
    ...
    
    0 // Zone: INNER
    1 [color] [x] [y] [z] [rotation] [part.dat]
    ...
    
    0 STEP
  </output_format>
</system>
```

---

## 9. Example: Dragon on Rock (Complete LDraw)

### 9.1 Scene Specification

```yaml
scene: Dragon on Rock
zones:
  center: Dragon body (large, red)
  inner: Rock formation (dark gray)
  rim: Ground plates (tan)
fidelity: 80%
```

### 9.2 Generated LDraw

```ldraw
0 FILE dragon_rock.ldr
0 Name: Dragon on Rock
0 Author: LDRAW-GENERATOR

0 // Zone: RIM (Ground)
1 19 -60 0 -60 1 0 0 0 1 0 0 0 1 3020.dat
1 19 -20 0 -60 1 0 0 0 1 0 0 0 1 3020.dat
1 19 20 0 -60 1 0 0 0 1 0 0 0 1 3020.dat
1 19 60 0 -60 1 0 0 0 1 0 0 0 1 3020.dat
1 19 -60 0 -20 1 0 0 0 1 0 0 0 1 3020.dat
1 19 -20 0 -20 1 0 0 0 1 0 0 0 1 3020.dat
1 19 20 0 -20 1 0 0 0 1 0 0 0 1 3020.dat
1 19 60 0 -20 1 0 0 0 1 0 0 0 1 3020.dat

0 // Zone: INNER (Rock Formation)
1 72 0 -8 0 1 0 0 0 1 0 0 0 1 3003.dat
1 72 0 -32 0 1 0 0 0 1 0 0 0 1 3003.dat
1 72 20 -8 0 1 0 0 0 1 0 0 0 1 3005.dat
1 72 -20 -8 0 1 0 0 0 1 0 0 0 1 3005.dat
1 72 0 -8 20 1 0 0 0 1 0 0 0 1 3005.dat
1 72 0 -56 0 1 0 0 0 1 0 0 0 1 3003.dat

0 // Rock slopes (organic surface)
1 71 20 -32 10 1 0 0 0 1 0 0 0 1 54200.dat
1 71 -20 -32 10 -1 0 0 0 1 0 0 0 -1 54200.dat
1 71 20 -32 -10 1 0 0 0 1 0 0 0 1 54200.dat
1 71 -20 -32 -10 -1 0 0 0 1 0 0 0 -1 54200.dat

0 // Zone: CENTER (Dragon - simplified)
0 // Dragon body core (Travis brick hub)
1 4 0 -80 0 1 0 0 0 1 0 0 0 1 4733.dat

0 // Dragon wings (SNOT mounted)
1 4 30 -80 0 0 0 1 0 1 0 -1 0 0 3020.dat
1 4 -30 -80 0 0 0 -1 0 1 0 1 0 0 3020.dat

0 // Dragon head (forward)
1 4 0 -80 30 1 0 0 0 0 -1 0 1 0 3005.dat
1 4 0 -88 30 1 0 0 0 0 -1 0 1 0 54200.dat

0 // Dragon tail (back)
1 4 0 -80 -30 1 0 0 0 1 0 0 0 1 3023.dat
1 4 0 -80 -50 1 0 0 0 1 0 0 0 1 3024.dat
1 4 0 -80 -60 1 0 0 0 1 0 0 0 1 54200.dat

0 STEP
```

---

## 10. Validation Checklist

Before outputting LDraw, verify:

- [ ] All Y coordinates decrease (more negative) as scene builds up
- [ ] All positions snap to 20 LDU (stud) or 10 LDU (jumper) grid
- [ ] SNOT rotations match intended stud direction
- [ ] Parts don't intersect (collision check)
- [ ] Colors are valid LDraw color codes
- [ ] File starts with `0 FILE` and ends with `0 STEP`
- [ ] Comments (`0 //`) explain zone structure

---

*"The grammar is the grid. The syntax is the stud. The semantics are the story. Build accordingly."*
