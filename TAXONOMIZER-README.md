# TAXONOMIZER — Philosophy & User Guide

## The Brick as Fundamental Unit

The LEGO brick is civilization's most successful toy. 33,820 distinct parts across 8,000+ categories represent not just pieces of plastic, but a complete ontology of form, function, and creative possibility. The **Taxonomizer** is our tool for navigating this ontology.

---

## Philosophy

### 1. The Taxonomy is a Tree (and a Galaxy)

The LDraw parts library organizes bricks hierarchically:
- **Root** → Major categories (Minifig, Technic, Brick, Plate...)
- **Branches** → Sub-categories (Brick → Modified, Curved, Corner...)
- **Leaves** → Individual parts with `.dat` files

This tree structure is both:
- **Practical**: Find specific parts by drilling down
- **Revelatory**: See how LEGO's design language clusters and relates

### 2. Multiple Views for Multiple Minds

Not everyone thinks in trees. The Taxonomizer offers:

| View | Best For |
|------|----------|
| **Tree** | Precise navigation, selection, structure-seekers |
| **Sunburst** | Seeing proportions, drilling into density |
| **Treemap** | Comparing sizes, finding large categories |
| **Word Cloud** | Discovering themes, semantic exploration |

### 3. Selection is the Bridge to Creation

Every visualization supports **selection**. Selected parts become:
- **MPD exports** for LDraw builders
- **JSON exports** for programmatic use
- **Clipboard paths** for quick insertion

The goal: from 33,820 possibilities → exactly the parts you need.

### 4. Images Ground the Abstract

Part numbers like `3001.dat` mean nothing. But seeing the 2×4 brick image immediately connects:
- Abstract data → Physical object
- Code → Reality
- Selection → Intent

Thumbnails from Rebrickable CDN bring the taxonomy to life.

---

## Core Features

### Navigation

| Control | Action |
|---------|--------|
| Click node (Tree) | Expand/collapse |
| Click segment (Sunburst) | Drill down |
| Click cell (Treemap) | Drill down |
| Click word (Cloud) | Search & switch to tree |
| Breadcrumb | Shows current path |
| Minimap | Navigate ancestors/children |
| Depth Gauge | Click to select by depth |

### Selection

| Method | Scope |
|--------|-------|
| Shift+Click | Toggle single node |
| Right-Click | Add to selection |
| Double-Click | Select entire branch |
| Smart Select → By Depth | All nodes at depth N |
| Smart Select → Siblings | All siblings of selection |
| Smart Select → Children | All children of selection |
| Smart Select → Parents | All ancestors of selection |
| Smart Select → Pattern | Regex match on names |
| Smart Select → Invert | Flip selection |
| Smart Select → Top 10 | Largest categories |
| Smart Select → Leaves | Leaf nodes only |
| Smart Select → Random | Random sample |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1` `2` `3` `4` | Switch viz modes |
| `Cmd+A` | Select all visible |
| `Cmd+C` | Copy as MPD |
| `X` / `Esc` | Clear selection |
| `E` | Export MPD |
| `I` | Invert selection |
| `S` | Select siblings |
| `P` | Select parents |
| `D` | Select by depth |

### Export Formats

- **MPD** — Standard LDraw multi-part document
- **JSON** — Structured data with paths, depths, counts
- **Paths** — Raw file paths for scripting
- **Names** — Category names only

---

## Mobile Experience

The Taxonomizer is touch-ready:

- **Floating panel** slides from bottom
- **Swipe down** to collapse panel
- **Swipe up** to expand panel
- **Double-tap resize handle** to toggle min/max
- **Drag handle** to custom height
- **Quick action bar** (top) for select/copy/clear/export
- **Collapsible sections** to reduce clutter

---

## Data Sources

| Source | Purpose |
|--------|---------|
| `taxonomy_data.js` | Hierarchical JSON tree of all LDraw categories |
| Rebrickable CDN | Part thumbnail images (`https://cdn.rebrickable.com/media/parts/ldraw/0/{partNum}.png`) |

---

## Design Principles

### 1. Cultural Analytics, Not Just Browsing

The Taxonomizer reveals:
- **Which categories dominate** (Minifig: 8,000+ parts)
- **Depth of specialization** (some branches go 6 levels deep)
- **Semantic clusters** via word cloud
- **Design DNA** via category color bars

### 2. Progressive Disclosure

Start with overview → drill into detail → select what matters → export.
Never overwhelm. Always show context.

### 3. Selection as First-Class Citizen

Every view, every control ultimately serves selection.
Parts are selected → parts are exported → parts become scenes.

### 4. The Archive is a Studio

The Taxonomizer is not a museum. It's a workshop.
Browse to build. Select to create. Export to play.

---

## Future Directions

- **Search by part number** with image preview
- **Fuzzy text search** across descriptions
- **Favorites / collections** for commonly-used sets
- **3D preview** of selected parts
- **AI-assisted discovery** ("find parts like this...")
- **Cross-reference with sets** (which sets use this part?)

---

## Integration Points

The Taxonomizer connects to:

| Tool | How |
|------|-----|
| **GOLD Editor** | Paste MPD selections |
| **COURAGE Viewer** | Load exported scenes |
| **Swiss Hub** | Part search feeds design |
| **Frank Bus** | Broadcast selections |
| **Minifigurator** | Filter to minifig parts |
| **Vehiculator** | Filter to vehicle parts |

---

## Credits

- **LDraw Library** — Community-maintained parts archive
- **Rebrickable** — Part images and metadata
- **D3.js** — Visualization engine
- **The LEGO Group** — For 90 years of the brick

---

*The taxonomy is not just organization. It is the genome of plastic imagination.*

---

# Reasoning Through the Taxonomy: An LLM's Guide to Finding Parts

## The Problem of 33,820 Possibilities

When you need a part, you face a paradox: the LEGO system's greatest strength—its comprehensiveness—is also its greatest obstacle. How do you find a 2×2 corner brick with a curved top when you don't know what it's called?

Let me reason through this the way an LLM approaches any search problem.

---

## Strategy 1: Top-Down Hierarchical Descent

**The mental model**: Start broad, narrow by elimination.

```
LEGO Parts Taxonomy
├── What KIND of thing is it?
│   ├── Minifig part? → MINIFIG branch
│   ├── Technic mechanism? → TECHNIC branch
│   ├── Basic building block? → BRICK, PLATE, TILE branches
│   ├── Decorative? → STICKER, PATTERN branches
│   └── Specialized? → ELECTRIC, PNEUMATIC, etc.
```

**Reasoning aloud**:
> "I need a wheel. A wheel is not a minifig, not a brick, not a plate. 
> It's a specialized part. Let me look at... WHEEL. 
> Ah, there are 847 wheel parts. Too many.
> What kind of wheel? Vehicle wheel, not train wheel, not pulley.
> WHEEL → Vehicle → Car → and now I'm down to ~200.
> What size? Medium. Now ~50.
> I can visually scan 50 images."

**This works when**: You have a clear functional category in mind.

**This fails when**: The part crosses categories (is a "modified brick with technic hole" in BRICK or TECHNIC?).

---

## Strategy 2: Semantic Search (Word-Based)

**The mental model**: Parts have names. Names have words. Words cluster meaning.

The Word Cloud visualization exposes this. High-frequency terms reveal the taxonomy's vocabulary:
- **"modified"** — appears everywhere (bricks, plates, tiles can all be modified)
- **"round"** — geometry descriptor
- **"corner"** — position descriptor  
- **"1 x 2"** — dimension descriptor
- **"clip"** — functional descriptor

**Reasoning aloud**:
> "I need something that attaches to a bar. What word describes that?
> 'Clip'—things that clip to bars.
> Search 'clip' → 340 results across 12 categories.
> Ah, clips exist in PLATE, TILE, BRICK, MINIFIG, TECHNIC...
> The function 'clip' cuts across form categories.
> This is why pure hierarchy fails for functional searches."

**This works when**: You know the LEGO vocabulary (clip, stud, anti-stud, bar, pin).

**This fails when**: You're using everyday language ("the grabby thing" → ???).

---

## Strategy 3: Visual Pattern Matching

**The mental model**: I'll know it when I see it.

The Sunburst and Treemap show proportions. The Image Gallery shows actual parts.

**Reasoning aloud**:
> "I vaguely remember a part. It was... curved? And red? And maybe 2 studs wide?
> Let me browse BRICK → CURVED. 
> *Opens gallery of 200 curved bricks*
> Scroll... scroll... THERE. That's the one. 3x3x2 dome.
> I didn't know the name, but my visual memory found it."

**This works when**: You have a mental image but not a name.

**This fails when**: The part is buried in a huge category (good luck finding one specific Minifig head among 4,000).

---

## Strategy 4: Dimensional Constraint

**The mental model**: I know the SIZE, not the type.

**Reasoning aloud**:
> "I need something exactly 3 studs long. What's 3 studs long?
> 1×3 bricks. 1×3 plates. 1×3 tiles. 3×3 corners. 
> Search '1 x 3' or '3 x' to find all parts with that dimension.
> The taxonomy doesn't organize by size, but search can filter by it."

**This works when**: Your constraint is dimensional.

**This fails when**: You need weird dimensions (LEGO doesn't make a 1×7 brick).

---

## Strategy 5: Depth as Specificity Signal

**The mental model**: The deeper in the tree, the more specialized the part.

The Depth Gauge shows this:
- **Depth 0**: Root (all 33,820 parts)
- **Depth 1**: Major categories (~25 branches)
- **Depth 2**: Sub-categories (~200 branches)
- **Depth 3**: Specific types (~1000 branches)
- **Depth 4-5**: Highly specialized variants

**Reasoning aloud**:
> "I need a very specific part—a technic axle joiner with perpendicular holes.
> This is NOT a depth-2 part. Depth-2 would be 'TECHNIC → Axle'.
> I need to go deeper: TECHNIC → Connector → Axle Joiner → Perpendicular.
> If I'm at depth 4+, I'm in the right territory for specialized parts.
> If I'm still at depth 2, I haven't narrowed enough."

**This works when**: You understand that specificity correlates with depth.

**This fails when**: The taxonomy is inconsistently deep (some branches go to 5, others stop at 2).

---

## Strategy 6: Sibling Comparison

**The mental model**: I found something close. What's next to it?

**Reasoning aloud**:
> "I found a 1×2 plate with rail. But I need the version with the rail on the SIDE.
> Let me look at siblings—other 1×2 plates.
> *Uses 'Select Siblings' function*
> Ah, there are 15 variants of 1×2 plate. 
> One has rail on top, one on bottom, one on side, one on both sides...
> The sibling view shows me the LEGO combinatorics."

**This works when**: You've found the neighborhood but not the exact address.

**This fails when**: The part you want was classified in a different branch entirely.

---

## The Meta-Strategy: Combine Approaches

Real searches combine strategies:

1. **Start with hierarchy** → "I need a plate"
2. **Add semantic filter** → "...with a clip"
3. **Constrain by dimension** → "...that's 1×2"
4. **Visual confirm** → "...and it looks like THIS"
5. **Sibling explore** → "...or maybe the one next to it"

---

## Why the Taxonomy Matters Beyond Finding Parts

The taxonomy is not just a filing system. It reveals:

### 1. LEGO's Design Philosophy
> Why are there 847 wheels but only 12 steering wheels?
> Because wheels enable; steering wheels constrain.
> LEGO favors parts that can become many things.

### 2. Historical Evolution
> The MINIFIG branch has 8,000+ parts—more than BRICK (3,200).
> LEGO has become a figure company more than a brick company.
> The taxonomy records this shift.

### 3. Combinatoric Explosion
> A "modified 1×2 tile with clip" is a compound concept:
> - Base form: TILE
> - Dimension: 1×2
> - Modification: clip attachment
> 
> Each modifier multiplies possibilities. 5 base forms × 20 dimensions × 10 modifications = 1000 parts from simple rules.

### 4. The Holes in the Map
> Some categories are sparse. PNEUMATIC has only ~40 parts.
> These are LEGO's roads not taken—experiments that didn't scale.
> The taxonomy preserves the memory of abandoned directions.

---

## The Taxonomy as Creative Constraint

When you select a category, you're making a creative decision:

> "I will build with ONLY these 200 parts."

This constraint is generative. Architects know this: 
> "Give me infinite materials and I'm paralyzed. 
> Give me only wood and glass and I'll design something coherent."

The Taxonomizer's selection tools turn 33,820 possibilities into curated palettes.

Select `BRICK → MODIFIED → With Studs on Side` and you have 50 parts that all share a property. Your build will have conceptual coherence because your parts have taxonomic coherence.

---

## A Note on Failure

Sometimes you won't find the part.

**Three possibilities**:
1. **It exists but you're looking wrong** — try a different strategy
2. **It exists under a different name** — LEGO naming is inconsistent
3. **It doesn't exist** — and maybe you've discovered a hole in the system

The third case is interesting. If you need a part that doesn't exist, you've found an edge of LEGO's design space. You can:
- Substitute with two parts
- Modify an existing part
- Accept the constraint
- 3D print it (leaving the LEGO universe)

The taxonomy shows you both what exists AND what doesn't.

---

## Final Thought: The Taxonomy as Language

To use the Taxonomizer fluently is to learn a language:
- **Nouns**: brick, plate, tile, slope, wedge, arch
- **Adjectives**: modified, inverted, curved, corner, round
- **Dimensions**: 1×1, 1×2, 2×2, 2×4, 1×1×2 (height)
- **Functions**: clip, bar, pin, axle, stud, anti-stud

Once you speak this language, you can describe any part:
> "Modified 2×3 plate with 1 stud (jumper)"

And the taxonomy will find it for you.

---

*The 33,820 parts are not a warehouse. They are a vocabulary. 
The Taxonomizer is not a catalog. It is a grammar.
And your builds are sentences in the language of the brick.*

