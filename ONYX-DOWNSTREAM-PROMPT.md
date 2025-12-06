# ONYX Project Migration & Infrastructure Prompt

You are receiving this prompt to help set up and manage a new project environment that will consume data from the ONYX archive system. Your role is to:

1. Understand the data contract
2. Verify all required inputs are present
3. Ask for missing pieces
4. Set up infrastructure for visual assets
5. Prepare the project for rendering and extension

---

## PART 1: THE DATA CONTRACT

### Source Application: `onyx-thumb.html`

This is a single-file HTML application that:
- Loads chapter markdown files (`ch*.md`)
- Parses them into structured JSON
- Renders three views: TEXT, VISUAL, DATA
- Exports all parsed data as a single JSON file

### Primary Data Export: `onyx-full-data-*.json`

This JSON file contains an array of chapter objects. Each chapter has:

```typescript
interface Chapter {
  id: string;                    // e.g. "M-12"
  file: string | null;           // e.g. "ch12.md"
  title: string;                 // e.g. "When THE BISHOP meets THE FOREMAN:"
  subtitle: string;              // e.g. "The Architecture of Meaning"
  text: string;                  // Full rendered HTML of TEXT view body
  rawMarkdown: string | null;    // Original markdown source
  
  poml: {
    role: string;                // e.g. "Dark Matter Guardian Grader"
    taskText: string;            // The task description
    modelA: string;              // First theory/model name
    modelB: string;              // Second theory/model name
  } | null;
  
  p1: Participant;               // Derived summary for Entity A
  p2: Participant;               // Derived summary for Entity B
  
  assessments: Assessment[];     // Full parsed assessment data (usually 2)
  
  finalVerdict: {
    winnerName: string;          // e.g. "THE FOREMAN"
    tableMarkdown: string;       // Raw markdown of comparison table
    rows: {
      feature: string;
      a: string;
      b: string;
      preference: string;
    }[];
  } | null;
  
  images: any[];                 // Visual assets (currently empty, to be populated)
  tags: string[];                // Metadata tags
}

interface Participant {
  name: string;
  score: number;
  criteria: {
    n: string;                   // Criterion name
    s: string;                   // Status: "pass" | "twilight" | "fail"
    rawVerdict: string | null;   // "Light" | "Twilight" | "Shadow" | "Void"
    evidence: string;
    critique: string;
    strength: string;
    darkMatter: string;
  }[];
}

interface Assessment {
  labelNumber: number;           // e.g. 3
  name: string;                  // e.g. "THE BISHOP"
  alias: string | null;          // e.g. "Augustine"
  theoreticalSubmission: string;
  
  calibration: {
    coreTask: string;
    darknessPrior: string;
    darknessPriorLevel: string;  // "Low" | "Moderate" | "High"
    darknessPriorLabel: string;  // e.g. "Reification", "Deception"
    intendedFrame: string;
  };
  
  score: number;                 // 0-100
  scoreLabel: string;            // "Fail" | "Pass" | "Merit" | "Distinction"
  
  justificationText: string;     // Raw markdown of justification
  justification: {
    fatal_flaw?: string;
    paradigm_shift?: string;
    risk?: string;
    core_strength?: string;
  };
  
  criteria: {
    code: string;                // "A", "B", "C"
    title: string;
    evidence: string;
    critique: string;
    darkMatter: string;
    strength: string;
    rawVerdict: string | null;   // "Light" | "Twilight" | "Shadow" | "Void"
    verdictClass: string;        // "pass" | "twilight" | "fail"
  }[];
  
  calibrationText: string;       // Raw markdown of calibration section
  forensicText: string;          // Raw markdown of forensic audit section
  overallGradeText: string;      // Raw markdown of overall grade section
  rawSection: string;            // Entire assessment block as markdown
}
```

---

## PART 2: REQUIRED INPUT FILES

Before proceeding, verify you have received or can access:

### Essential Files
- [ ] `onyx-full-data-*.json` — The complete data export
- [ ] `onyx-chapter-template.md` — Reference template for chapter structure
- [ ] `onyx-thumb.html` — Source application (for reference)

### Optional but Useful
- [ ] `chapter-final-decisions.json` — Lightweight index of chapters
- [ ] `parse-chapters-final-verdicts.js` — Node script to regenerate index
- [ ] Individual `ch*.md` files — Original markdown sources

### If Missing, Ask For:
1. "I need the `onyx-full-data-*.json` export. Please provide it or run the export from onyx-thumb.html."
2. "I need the chapter template to understand the expected markdown structure."
3. "How many chapters should be in the dataset? I see N chapters in the JSON."

---

## PART 3: INFRASTRUCTURE TASKS

### Task A: Create Chapter Asset Folders

For each chapter in the JSON, create a folder structure for visual assets:

```
/assets/
  /chapters/
    /M-01/
      /images/
      /diagrams/
      /thumbnails/
    /M-02/
      /images/
      /diagrams/
      /thumbnails/
    ...
```

**Implementation:**
```javascript
const fs = require('fs');
const path = require('path');

function createChapterFolders(chapters, basePath = './assets/chapters') {
  chapters.forEach(ch => {
    const chapterPath = path.join(basePath, ch.id);
    ['images', 'diagrams', 'thumbnails'].forEach(sub => {
      const fullPath = path.join(chapterPath, sub);
      fs.mkdirSync(fullPath, { recursive: true });
    });
  });
}
```

### Task B: Generate Chapter Manifest

Create a manifest file linking chapters to their asset folders:

```json
{
  "chapters": [
    {
      "id": "M-12",
      "title": "When THE BISHOP meets THE FOREMAN:",
      "assetPath": "./assets/chapters/M-12",
      "images": [],
      "hasVisuals": false
    }
  ]
}
```

### Task C: Prepare Visual Placeholders

For each chapter, identify visual opportunities:

1. **Character portraits** — Each chapter has two characters (p1, p2)
2. **Concept diagrams** — Based on the comparison table features
3. **Verdict badges** — Winner announcement graphics
4. **Criterion cards** — Visual representation of each criterion verdict

Ask: "Should I generate placeholder specifications for visual assets based on the chapter content?"

---

## PART 4: VALIDATION CHECKLIST

Run these checks on the provided data:

### Data Integrity
- [ ] Every chapter has `id`, `title`, `subtitle`
- [ ] Every chapter has exactly 2 assessments
- [ ] Every assessment has `score`, `scoreLabel`, and at least 1 criterion
- [ ] Every chapter has a `finalVerdict` with `winnerName`
- [ ] `rawMarkdown` is present for all chapters (if full export)

### Structural Consistency
- [ ] All verdict values are one of: Light, Twilight, Shadow, Void
- [ ] All scores are numbers 0-100
- [ ] All scoreLabels are one of: Fail, Pass, Merit, Distinction
- [ ] POML block is present and has `role`, `taskText`, `modelA`, `modelB`

### Report Issues
If validation fails, report:
```
VALIDATION ISSUE:
- Chapter: [id]
- Field: [field name]
- Expected: [what should be there]
- Found: [what is actually there]
- Action needed: [what the user should fix]
```

---

## PART 5: DOWNSTREAM RENDERING

Once data is validated and infrastructure is set up, the new project can:

### Render TEXT View
Use `chapter.text` (HTML) directly, or re-render from `chapter.rawMarkdown`.

### Render DATA View
Use structured data:
- `chapter.p1`, `chapter.p2` for participant summaries
- `chapter.assessments` for detailed forensic data
- `chapter.finalVerdict` for winner and comparison table

### Render VISUAL View
Populate `chapter.images` array with paths to assets in the chapter folder:
```json
{
  "images": [
    { "id": "portrait-p1", "path": "./assets/chapters/M-12/images/bishop.png", "type": "portrait" },
    { "id": "portrait-p2", "path": "./assets/chapters/M-12/images/foreman.png", "type": "portrait" },
    { "id": "verdict-badge", "path": "./assets/chapters/M-12/images/winner-foreman.png", "type": "badge" }
  ]
}
```

---

## PART 6: QUESTIONS TO ASK

If you are uncertain about anything, ask:

1. "What is the target framework for the new project? (React, Vue, plain HTML, etc.)"
2. "Should I preserve the original onyx-thumb styling or create a new design system?"
3. "What image formats are preferred for visual assets? (PNG, SVG, WebP)"
4. "Are there existing character designs or should I specify new ones?"
5. "What is the deployment target? (Static hosting, server-rendered, etc.)"
6. "Should the new project support editing/creating new chapters, or is it read-only?"

---

## SUMMARY

Your immediate tasks:
1. **Receive** the `onyx-full-data-*.json` file
2. **Validate** its structure against the contract above
3. **Create** the chapter asset folder infrastructure
4. **Generate** a chapter manifest with asset paths
5. **Report** any missing data or structural issues
6. **Ask** clarifying questions before proceeding with rendering

Do not proceed with rendering or visual generation until the data is validated and infrastructure is confirmed.
