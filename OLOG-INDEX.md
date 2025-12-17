# OLOG Index - Research & Development Logs

**Project:** DCE-GYO (Digital Creative Environment)  
**Last Updated:** 2025-12-17  

---

## Active OLOGs

### WAG Viewer & Editor
| OLOG | Description | Status |
|------|-------------|--------|
| [WAG-COOL-OLOG](WAG-COOL-OLOG.md) | WAG Cooling/optimization strategies | - |
| [WAG-UNIFIED-WEAVER-OLOG](WAG-UNIFIED-WEAVER-OLOG.md) | Unified weaver pattern implementation | - |
| [LDraw Material Pathology](wag-viewer-prime-integration-20251112-055341%20copy/OLOG-ldraw-material-pathology-20251217.md) | **NEW** Debug session for LDrawLoader material issues | IN PROGRESS |

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
- **NEW:** [LDraw Material Pathology](wag-viewer-prime-integration-20251112-055341%20copy/OLOG-ldraw-material-pathology-20251217.md)
  - Diagnosed page freeze in WAG Courage catalog browser
  - Identified: Heavy stud computation, missing compile guards, malformed placeholders
  - Fixed: Removed hot-path computation, added guards, fixed MPD format
  - Remaining: LDrawLoader.parse() not creating materials (workaround applied)

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
