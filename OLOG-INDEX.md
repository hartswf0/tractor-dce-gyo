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

- **ADVANCED SEARCH** (wag-courage.html)
  - Negative search: `-word` excludes parts containing that word
  - **Word boundary matching**: "car" finds "car", "cars" but NOT "cardboard"
  - Metadata extraction: size (1x2, 2x4), complexity (🟢🟡🔴)
  - Sort options: Relevance, Size ↑↓, Name A-Z, Simple first
  - Pagination: Load More button (100 per page), progress bar
  - Selection: Select Visible, Select All Filtered (even unloaded)
  - **Create Scene from Search**: `📁 New Scene: "query"` button
  - Filenames derived from search term (e.g., `brick_1x2_scene.mpd`)

- **COMPILE ERROR DEBUGGING** (wag-courage.html + LDrawLoader.js)
  - LDrawLoader: Added fallback for color code `-1` (inherit parent)
  - Error line highlighting: Red border + "⚠️ ERROR" badge
  - Console intercept: Captures LDrawLoader warnings with line numbers
  - Auto-scroll: Jumps to error line in editor for debugging

- **ENRICHED PARTS INDEX** (build-parts-index.js → ldraw-parts-index.json)
  - Parses all 23,511 .dat files to extract header metadata
  - Extracts: `!CATEGORY`, `!KEYWORDS`, author, description
  - 63 official LDraw categories (Brick, Plate, Tile, Slope, Technic, Minifig, etc.)
  - 15 connector types detected from descriptions (clip, bar, pin-hole, axle-hole, hinge, ball-joint, etc.)
  - Base part vs variation classification (print/color/mold variants)
  - Alias/obsolete part flagging (lower ranking in search)
  - 5MB JSON index with lookup map for fast access

- **FACETED SEARCH UI** (wag-courage.html)
  - 13 category filter chips (official LDraw !CATEGORY)
  - 7 connector facet chips (toggleable AND filter)
  - Search now uses enriched index for keywords + categories
  - Synonym expansion from builder slang to LDraw terms
  - Dimension normalization ("2 x 4" → "2x4")

- **SINTERED INDEX** (taxonomy + enriched merged at runtime)
  - Taxonomy provides hierarchical structure: Kingdom → Phylum → Class → Order → Family
  - Enriched index provides metadata: connectors, keywords, category, images
  - Runtime merge via `enrichedIndex.lookup.get(part.filename)`
  - All browse modes now show:
    - **Rebrickable thumbnails** with fallback to base part for variants
    - **Connectivity signature** (e.g., `S8-T3` = 8 studs, 3 tubes)
    - **Connector icons** (⬤ stud, ○ tube, 📎 clip, ✚ axle-hole, ◉ technic-hole)
    - **Official !CATEGORY** badge

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
