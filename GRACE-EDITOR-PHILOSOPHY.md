# 💚 WAG Grace Editor - Machine of Loving Grace

## The Philosophy

> "Why should ONE missing part kill the ENTIRE scene?"

The Grace Editor embodies **compassionate error handling** - it's a tool that **cares for you** and **tends to your work** even when things go wrong.

## Gold vs Grace

### 🟨 Gold Editor (Strict Mode)
- **Philosophy**: Perfectionist compiler
- **Behavior**: One error = stop everything
- **Result**: Empty scene or nothing
- **Use case**: Final production, verified builds

### 💚 Grace Editor (Forgiving Mode)  
- **Philosophy**: Machine of Loving Grace
- **Behavior**: Load what works, show placeholders for what doesn't
- **Result**: 85% beautiful scene with pink markers
- **Use case**: Experimentation, learning, rapid iteration

## How It Works

### Traditional (Harsh)
```
❌ Missing wall-panel-north.ldr → STOP EVERYTHING
Result: Empty viewer, frustrated user
```

### Grace (Forgiving)
```
⚠️ Missing wall-panel-north.ldr → Create pink placeholder, keep going
Result: Scene loads with 95% of parts rendered
        Pink cube where missing part should be
        Console report: "Hey, FYI: couldn't find wall-panel-north.ldr"
```

## Features

### 1. **Graceful Degradation**
- ✅ Loads all parts that exist
- 💚 Creates hot pink placeholder cubes for missing parts
- 📊 Tracks which parts are missing
- 🔍 Shows line numbers where problems occur

### 2. **Visual Feedback**
Instead of an empty scene, you see:
```
✅ Floor: Rendered (64 tiles)
✅ Minifigs: Rendered (8 characters)  
⚠️ [Pink Placeholder: wall-panel-north.ldr]
⚠️ [Pink Placeholder: shelf-unit.ldr]
✅ Monkeys: Rendered (3 monkeys)

Scene Completeness: 85%
Missing: 2 components
```

### 3. **Grace Report**
After each render, the console shows:
```
═══════════════════════════════════════════════════
💚 MACHINE OF LOVING GRACE - Missing Parts Report
═══════════════════════════════════════════════════
Scene rendered with 2 missing components:

  📦 wall-panel-north.ldr
     Occurrences: 4
     Lines: 42, 56, 89, 103
     💡 Tip: Check if this should be "parts/wall-panel-north.ldr"

  📦 minifig-01-archivist.ldr  
     Occurrences: 1
     Lines: 118
     💡 Tip: Use inline parts/ references instead

═══════════════════════════════════════════════════
✅ Scene loaded successfully with 2 placeholders
═══════════════════════════════════════════════════
```

## Placeholder System

### What Placeholders Look Like
- **Color**: Hot pink (`#ff69b4`) with transparency
- **Shape**: 20x20x20 LDU cube
- **Edges**: Deep pink wireframe (`#ff1493`)
- **Position**: Exact location where missing part should be

### Why Pink?
- **Visibility**: Impossible to miss
- **Non-judgmental**: Friendly, not angry red
- **Cultural**: "Hot pink" = attention without panic
- **Loving**: The color of care and support

## Technical Implementation

### Fetch Interceptor
```javascript
// Gracefully catches 404s without throwing
const originalFetch = window.fetch;
window.fetch = function(...args) {
    return originalFetch.apply(this, args).then(response => {
        if (!response.ok && response.status === 404) {
            const url = args[0];
            const partName = url.split('/').pop();
            console.warn(`💚 Grace: 404 for ${partName}, will use placeholder`);
        }
        return response;
    });
};
```

### Placeholder Creation
```javascript
function createPlaceholder(partName, position) {
    const geometry = new THREE.BoxGeometry(20, 20, 20);
    const material = new THREE.MeshBasicMaterial({
        color: 0xff69b4,  // Hot pink
        transparent: true,
        opacity: 0.6
    });
    const cube = new THREE.Mesh(geometry, material);
    
    // Add wireframe edges for better visibility
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(edges, 
        new THREE.LineBasicMaterial({ color: 0xff1493 })
    );
    cube.add(line);
    
    return cube;
}
```

### Missing Parts Tracking
```javascript
const MISSING_PARTS = new Map();

function trackMissingPart(partName, lineNumber) {
    if (!MISSING_PARTS.has(partName)) {
        MISSING_PARTS.set(partName, {
            lineNumbers: [],
            count: 0
        });
    }
    
    const entry = MISSING_PARTS.get(partName);
    entry.lineNumbers.push(lineNumber);
    entry.count++;
}
```

## Use Cases

### 1. **Learning & Experimentation**
- Try referencing parts without fear of breaking everything
- See what works, learn what doesn't
- Iterate quickly without constant failures

### 2. **Component Development**
- Build incrementally
- See partial assemblies as you work
- Catch typos visually (pink cubes = typo!)

### 3. **Debugging Complex Scenes**
- Load broken MPD files
- See which parts are actually missing
- Fix one at a time while keeping context

### 4. **Collaborative Work**
- Share work-in-progress files
- Others can view your intent even if some parts are missing
- Pink placeholders communicate "TODO" zones

## Comparison to Other Tools

### Blender
- **Missing textures**: Purple checkerboard
- **Missing meshes**: Gray default cube
- Scene still renders

### Unity
- **Missing assets**: Pink/magenta material
- **Missing scripts**: Warning but game runs
- Workflow continues

### Grace Editor
- **Missing LDraw parts**: Hot pink cube
- **Missing subfiles**: Placeholder + line numbers
- Scene loads with grace report

## The Name

**"Machine of Loving Grace"** comes from Richard Brautigan's poem:

> "I like to think of a cybernetic meadow  
> where mammals and computers  
> live together in mutually  
> programming harmony"

This editor is that harmony - it **works with you**, not against you. It **tends to your work** like a loving gardener, keeping what's healthy and marking what needs attention.

## When to Use Each Editor

### Use Gold 🟨 When:
- Final production builds
- All parts are verified
- You need strict validation
- Performance is critical
- Publishing to showcase

### Use Grace 💚 When:
- Learning LDraw
- Experimenting with new parts
- Building modular systems
- Debugging complex files
- Rapid prototyping
- Teaching others

## Keyboard Shortcuts

Same as Gold Editor:
- **Cmd/Ctrl + S**: Render (compile)
- **Cmd/Ctrl + Enter**: Render (compile)
- **Cmd/Ctrl + C**: Copy selected lines
- **Cmd/Ctrl + Click**: Multi-select lines

## Philosophy in Practice

### Traditional Compiler Mentality
```
Error on line 42: Part not found
COMPILATION FAILED
[No output]
```

### Grace Editor Mentality  
```
Warning on line 42: Part not found, using placeholder
Rendering 127 of 128 parts...
✅ Scene loaded successfully
💚 1 placeholder created - check console for details
```

## The Difference It Makes

**Before Grace:**
- User: "Why won't this load?!"
- System: [Silent failure / Empty screen]
- User: "I give up."

**With Grace:**
- User: "Let me try this..."
- System: "I loaded 95% of your scene! Here's what's missing:"
- User: "Oh, I see the issue. Let me fix line 42."
- System: "Great! Now 100% loaded!"

## Future Enhancements

Potential additions:
- **Hover labels on placeholders** showing part names
- **Click placeholder → jump to line** in editor
- **Auto-suggest fixes** based on common patterns
- **Placeholder colors** by error type (missing vs. malformed)
- **Export grace report** as JSON for CI/CD
- **Smart suggestions** ("Did you mean parts/3024.dat?")

## Credits

Built on:
- **WAG Gold Editor**: Strict mode foundation
- **Beta Prime Engine**: 3D rendering
- **Three.js**: WebGL graphics
- **LDrawLoader**: Part loading (modified for grace)

Inspired by:
- Your insight: "Why not a machine of loving grace?"
- Compassionate software design
- The belief that tools should help, not hinder

---

## Summary

The Grace Editor is a **teaching tool**, a **prototyping tool**, and a **compassionate partner** in your creative process. It doesn't judge your mistakes - it shows you what works and gently guides you to fix what doesn't.

**Remember**: Every pink cube is not a failure - it's an **opportunity to learn** in a safe, forgiving environment.

💚 Build with grace. 💚
