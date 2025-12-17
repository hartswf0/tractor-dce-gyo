# OLOG Index - Research & Development Logs

**Project:** DCE-GYO (Digital Creative Environment)  
**Last Updated:** 2025-12-17 18:36 EST  
**Visual Index:** [WAG Courage Research Index](wag-viewer-prime-integration-20251112-055341%20copy/index.html)  

---

## Active OLOGs

### WAG Viewer & Editor
| OLOG | Description | Status |
|------|-------------|--------|
| [WAG-COOL-OLOG](WAG-COOL-OLOG.md) | WAG Cooling/optimization strategies | - |
| [WAG-UNIFIED-WEAVER-OLOG](WAG-UNIFIED-WEAVER-OLOG.md) | Unified weaver pattern implementation | - |
| [LDraw Material Pathology](wag-viewer-prime-integration-20251112-055341%20copy/OLOG-ldraw-material-pathology-20251217.md) | Debug session for LDrawLoader material issues | IN PROGRESS |
| [Courage Architecture](wag-viewer-prime-integration-20251112-055341%20copy/OLOG-courage-architecture-20251217.md) | Parts selection, coordinate transforms, UI mysteries | RESEARCH |
| [Cinematic MPD Experiments](wag-viewer-prime-integration-20251112-055341%20copy/OLOG-cinematic-mpd-experiments-20251217.md) | MENTO extensions for lighting/camera, Deleuzian image-types, **MULTILOAD IMPLEMENTED** | IN PROGRESS |

### Infrastructure & Architecture
| OLOG | Description | Status |
|------|-------------|--------|
| [BRICK-GRID-OLOG](BRICK-GRID-OLOG.md) | Brick grid system design | - |
| [SITEMAP-OLOG](SITEMAP-OLOG.md) | Site structure and navigation | - |
| [TAXONOMIZER-OLOG](TAXONOMIZER-OLOG.md) | Part taxonomy system | - |

### Creative Tools
| OLOG | Description | Status |
|------|-------------|--------|
| [HOMER-STUDIO-OLOG](HOMER-STUDIO-OLOG.md) | Homer Studio development | - |
| [MENTO-HOMER-OLOG](MENTO-HOMER-OLOG.md) | Mento/Homer integration | - |

### Conceptual & Research
| OLOG | Description | Status |
|------|-------------|--------|
| [PLATOS-CAVE-OLOG](PLATOS-CAVE-OLOG.md) | Philosophical framework | - |
| [SHIELD-OF-ACHILLES-OLOG](SHIELD-OF-ACHILLES-OLOG.md) | Narrative/visual metaphor research | - |

---

## Recent Activity

### 2025-12-17
- **IMPLEMENTED:** [Cinematic MPD Experiments](wag-viewer-prime-integration-20251112-055341%20copy/OLOG-cinematic-mpd-experiments-20251217.md)
  - MENTO directive syntax for lighting (`!MENTO LIGHT`) and camera (`!MENTO SHOT`)
  - Four Deleuzian experiments: Fragmented Hero, Symbolic Void, Memory Loop, Power Shift
  - **MULTILOAD: 📁 button + drag-drop for batch MPD import**
  - Focal length → FOV conversion mapping

- **NEW:** [Courage Architecture](wag-viewer-prime-integration-20251112-055341%20copy/OLOG-courage-architecture-20251217.md)
  - Documented 2D/3D coordinate mismatch (Z-axis inversion from rotation.x = Math.PI)
  - Solved: Library 279K variants = path lookup table for multi-format resolution
  - Solved: ↖ A1 = FRANK grid origin indicator (top-left corner)
  - Research: Search vs Category parts selection architecture

- **UPDATED:** [LDraw Material Pathology](wag-viewer-prime-integration-20251112-055341%20copy/OLOG-ldraw-material-pathology-20251217.md)
  - Diagnosed page freeze in WAG Courage catalog browser
  - Identified: Heavy stud computation, missing compile guards, malformed placeholders
  - Fixed: Removed hot-path computation, added guards, fixed MPD format
  - Fixed: Control dots now appear (deferred skeleton computation)
  - Remaining: LDrawLoader.parse() not creating materials (workaround applied)
  
- **FOLK MODE REDESIGN** (wag-courage.html)
  - Replaced hierarchical TRACTOR FOLKOLOGICUS with search-like UI
  - Theme chips: Star Wars, Castle, Space, Vehicle, Minifig, Nature, etc.
  - Direct ➕ buttons with visual feedback
  - Parts addition still debugging (compile race conditions)

- **VISUAL RESEARCH INDEX** (wag-viewer/index.html)
  - HTML dashboard for OLOG research reports
  - Brickfilm production roadmap (8 phases)
  - Simpsons scene library (7 MPDs: scenes 05-10 + credits)
  - MPD experiments with MENTO directives
  - Challenge status cards: Parts→Scene, Multiload, MENTO, Materials

---

## OLOG Conventions

### Status Values
- **IN PROGRESS** - Active investigation
- **RESOLVED** - Issue fixed, documented
- **DEFERRED** - Paused, lower priority
- **ARCHIVED** - Historical reference only

### File Naming
```
OLOG-{topic}-{date}.md
{TOPIC}-OLOG.md  (legacy format)
```

### Required Sections
1. Initial Symptoms
2. Root Causes Identified
3. Fixes Applied
4. Remaining Investigation
5. Files Modified
