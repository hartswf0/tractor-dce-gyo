# MINIFIGURE CONFIGURATOR SYSTEM

## Overview

The Minifigure Configurator creates **character-driven LEGO minifigs** with full **Stanislavski Method backstories**. Each character has psychological depth, motivations, flaws, and emotional triggers.

---

## System Components

### 1. **minifig-configurator.mpd** - Character Library
Pre-assembled minifig templates with:
- Standard minifig anatomy (7 parts: head, torso, 2 arms, hips, 2 legs)
- Color-coded by role/personality
- Documented character archetype

### 2. **character-backstories.json** - Stanislavski Profiles
Full psychological profiles for each character:
- **Given Circumstances** (background, family, location, time period)
- **Character Kernel** (core traits, motivations, flaws)
- **Emotional Memory** (triggers, traumas, formative experiences)
- **Objectives** (immediate, long-term, super-objective)
- **Subtext** (hidden thoughts, underlying emotions)

### 3. **data-center-team.mpd** - Scene Implementation
Complete scene using all characters positioned in narrative context

---

## Character Roster

### 📚 **Dr. Elena Vasquez** (THE ARCHIVIST)
- **Color:** Dark Tan (28) - Earthy wisdom
- **Role:** Lead Data Archaeologist
- **Super-Objective:** Ensure no voice is silenced by time
- **Flaw:** Cannot let go of obsolete information
- **Trigger:** Sound of hard drives spinning down = death
- **Backstory:** Former librarian who lost rare collections to flood, now compulsively preserves all data

### 🐛 **Mx. River Chen** (THE DEBUGGER)
- **Color:** Orange (25) - Alert state
- **Role:** Critical Systems Analyst
- **Super-Objective:** Prevent the collapse they couldn't stop as a child
- **Flaw:** Perfectionist - blocks releases until bugs = 0
- **Trigger:** Stack overflow errors = childhood powerlessness
- **Backstory:** Child prodigy whose parents' startup failed; blames self for not finding "the bug"

### 🔧 **Jules Martinez** (THE SYSADMIN)
- **Color:** Dark Blue (272) - Night shift
- **Role:** Overnight Operations Lead
- **Super-Objective:** Keep systems running - downtime is death
- **Flaw:** Trust no one - built redundancy for everything
- **Trigger:** "It works on my machine" = combat flashback
- **Backstory:** Military IT vet, deployed to 12 conflict zones, PTSD manifests as hyper-vigilance

### 💀 **Alex "Zero" Kowalski** (THE HACKER)
- **Color:** Purple (22) - Between black/white hat
- **Role:** Penetration Tester (reformed blackhat)
- **Super-Objective:** Never be trapped or controlled again
- **Flaw:** Compulsive - must find the exploit
- **Trigger:** Locked doors = juvenile detention cell
- **Backstory:** Arrested at 16, spent 2 years in detention, now works for feds under deal

### 🎨 **Sam Okafor** (THE DESIGNER)
- **Color:** Magenta (26) - Creative/Empathic
- **Role:** Human-Centered Design Lead
- **Super-Objective:** Make technology accessible to everyone
- **Flaw:** Over-empathizes - burns out helping users
- **Trigger:** Inaccessible interfaces = exclusion trauma
- **Backstory:** Refugee who learned design to tell their story, fights for inclusive UX

### 📊 **Dr. Yuki Tanaka** (THE DATA SCIENTIST)
- **Color:** Lime (27) - Growth/Discovery
- **Role:** Machine Learning Researcher
- **Super-Objective:** Find patterns humans can't see
- **Flaw:** Sees correlation everywhere, causation nowhere
- **Trigger:** Medical data = unresolved grief
- **Backstory:** Lost parent to misdiagnosis, trained AI to prevent similar tragedies

### ⭐ **Taylor Kim** (THE INTERN)
- **Color:** Yellow (14) - Bright/Eager
- **Role:** Junior Developer Intern (they/them)
- **Super-Objective:** Honor parents' sacrifice by building career
- **Flaw:** Asks "why?" about everything (annoying but brilliant)
- **Trigger:** "That's how we've always done it" = door closing
- **Backstory:** First-gen college student, self-taught, carries family's hopes

### 👔 **Morgan Blackwell** (THE CTO)
- **Color:** Dark Gray (8) - Authority
- **Role:** Chief Technology Officer
- **Super-Objective:** Build something that outlasts them
- **Flaw:** Micromanages when stressed
- **Trigger:** Board meetings = 2nd startup bankruptcy PTSD
- **Backstory:** Survived 3 startups (2 crashed, 1 unicorn), haunted by failures

---

## Minifig Anatomy (Standard)

### Part Assembly Heights (Y-axis from floor)
```
Y=0     FEET (floor level)
Y=-16   LEGS (2 plates up) - parts/3816.dat (left), parts/3817.dat (right)
        Leg offset: ±6 LDU from center
Y=-28   HIPS (3.5 plates) - parts/3815.dat
Y=-51   ARMS (6.4 plates) - parts/3818.dat (left), parts/3819.dat (right)
        Arm offset: ±15.552 LDU from center
Y=-60   TORSO (7.5 plates) - parts/973c01.dat
Y=-84   HEAD (10.5 plates) - parts/3626bp01.dat (or 3626bph4.dat for monkey)

Total standing height: 84 LDU
```

### Color Coding System
- **Red (4)** - Passion, urgency, breaking rules
- **Blue (1)** - Logic, calm, systematic
- **Green (2)** - Balance, growth, harmony
- **Yellow (14)** - Energy, curiosity, learning
- **Orange (25)** - Alert, warning, intensity
- **Purple (22)** - Duality, complexity, between states
- **Magenta (26)** - Creativity, empathy, emotion
- **Lime (27)** - Discovery, insight, fresh perspective
- **Dark Gray (8)** - Authority, experience, weight
- **Dark Tan (28)** - Wisdom, earthiness, preservation
- **Dark Blue (272)** - Night, dedication, tirelessness
- **Black (0)** - Mystery, depth, the monkeys

---

## Using the Configurator

### Method 1: Use Pre-Built Characters
```ldraw
0 // Import character from library
1  16  [X]  [Y]  [Z]  1  0  0  0  1  0  0  0  1  minifig-01-archivist.ldr
```

**Position Guide:**
- Y=-68 for standing on floor (standard)
- Y=-92 for elevated platform
- Spacing: 80-120 LDU between characters

### Method 2: Build Custom Character
```ldraw
0 // Custom minifig assembly
0 // Choose color for each part based on character traits
1  [COLOR]    0  -84    0    1  0  0    0  1  0    0  0  1    3626bp01.dat
1  [COLOR]    0  -60    0    1  0  0    0  1  0    0  0  1    973c01.dat
1  [COLOR]  -15.552  -51  0    1  0  0    0  1  0    0  0  1    3818.dat
1  [COLOR]   15.552  -51  0    1  0  0    0  1  0    0  0  1    3819.dat
1  [COLOR]    0  -28    0    1  0  0    0  1  0    0  0  1    3815.dat
1  [COLOR]   -6  -16    0    1  0  0    0  1  0    0  0  1    3816.dat
1  [COLOR]    6  -16    0    1  0  0    0  1  0    0  0  1    3817.dat
```

### Method 3: Mix & Match Parts
```ldraw
0 // Hybrid character - different colors per part
1   4    0  -84    0    1  0  0    0  1  0    0  0  1    3626bp01.dat  ← Red head (passion)
1   1    0  -60    0    1  0  0    0  1  0    0  0  1    973c01.dat    ← Blue torso (logic)
1   2  -15.552  -51  0    1  0  0    0  1  0    0  0  1    3818.dat      ← Green arms (balance)
1   2   15.552  -51  0    1  0  0    0  1  0    0  0  1    3819.dat
1  14    0  -28    0    1  0  0    0  1  0    0  0  1    3815.dat      ← Yellow hips (energy)
1  14   -6  -16    0    1  0  0    0  1  0    0  0  1    3816.dat
1  14    6  -16    0    1  0  0    0  1  0    0  0  1    3817.dat
```

---

## Stanislavski Framework Explained

### Given Circumstances
**What the character brings to the scene:**
- Physical location (where they grew up, work now)
- Time period (historical context)
- Socioeconomic status (resources, constraints)
- Family history (formative relationships)
- Pre-play events (what happened before scene starts)

### Character Kernel
**The DNA of the character:**
- Core traits (consistent personality markers)
- Dominant motivations (what drives them)
- Defining actions (signature behaviors)
- Character flaws (vulnerabilities, weaknesses)

### Emotional Memory
**Stanislavski's key technique:**
- Significant memories (emotionally charged past events)
- Emotional triggers (what activates trauma/joy)
- Recurrent themes (patterns in their life)

### Objectives
**What they want:**
- **Immediate objectives** - This scene, right now
- **Long-term objectives** - This arc, this season
- **Super-objective** - Life goal, ultimate purpose
- **Obstacles** - What's in the way

### Subtext
**What's under the surface:**
- Unspoken thoughts (internal monologue)
- Hidden motivations (secret agendas)
- Underlying emotions (feelings they won't admit)

### The Magic If
**Stanislavski's imagination tool:**
"If I were in this situation, what would I do?"
Helps actor find authenticity through personal connection

---

## Scene Construction

### 1. **Select Characters**
Choose 3-8 characters with **conflicting objectives**

### 2. **Position Strategically**
- Center: Main action focus
- Corners: Observers, commentators
- Elevated: Authority figures
- Near doors: Newcomers, escapers

### 3. **Create Tension**
Characters' objectives should **clash**:
- Debugger wants perfection → CTO wants speed
- Archivist wants preservation → SysAdmin wants deletion
- Hacker sees attack → Designer sees accident

### 4. **Add Triggers**
Include elements that **activate backstories**:
- Locked doors (trigger Hacker's trauma)
- Deletion warnings (trigger Archivist's fear)
- Error messages (trigger Debugger's guilt)

### 5. **Resolution Path**
Often the **most unlikely character** solves it:
- Intern's "dumb question" reveals simple solution
- Monkey's instinct trumps human overthinking

---

## Color Psychology in Characters

### Warm Colors (Active, Outward)
- **Red (4)** - Impulsive, aggressive, boundary-breaking
- **Orange (25)** - Alert, energetic, problem-solving
- **Yellow (14)** - Optimistic, curious, learning

### Cool Colors (Reflective, Inward)
- **Blue (1)** - Analytical, calm, systematic
- **Green (2)** - Balanced, empathetic, growing
- **Purple (22)** - Complex, mysterious, liminal

### Neutral Colors (Authority, Experience)
- **Dark Gray (8)** - Leadership, authority, burden
- **Dark Tan (28)** - Wisdom, preservation, earthiness
- **Black (0)** - Mystery, depth, primal intelligence

### Bright Colors (Innovation, Emotion)
- **Magenta (26)** - Creative, empathetic, feeling
- **Lime (27)** - Fresh perspective, discovery, insight

---

## Narrative Techniques

### Ensemble Drama Rules

1. **Everyone wants something different**
   - No two characters have same objective
   
2. **Everyone has a flaw**
   - Perfect characters are boring
   
3. **Backstory informs action**
   - River debugs because of childhood trauma
   - Alex hacks because of detention claustrophobia
   
4. **Crisis reveals truth**
   - Pressure shows who people really are
   
5. **Resolution through character growth**
   - Not just fixing the technical problem
   - Characters learn about themselves

### Comedy Through Character

- **Intern's naivety** vs **CTO's experience**
- **Hacker's paranoia** vs **Designer's trust**
- **Debugger's perfectionism** vs **SysAdmin's pragmatism**
- **Monkeys solving problem** while humans overthink

---

## Expandability

### Add New Characters
```json
{
  "id": "minifig-09-yourcharacter",
  "CharacterBuilder": {
    "GivenCircumstances": { ... },
    "CharacterKernel": { ... },
    "StanislavskiTechniques": { ... }
  }
}
```

### Create New Scenes
```ldraw
0 FILE your-scene.mpd
0 // Import characters
1  16  [X]  [Y]  [Z]  1  0  0  0  1  0  0  0  1  minifig-XX-character.ldr
```

### Remix Existing Characters
- Change colors to show character arc
- Reposition to show relationship shifts
- Add props/accessories for story beats

---

## Files Reference

- **minifig-configurator.mpd** - 8 character templates
- **character-backstories.json** - Full Stanislavski profiles
- **data-center-team.mpd** - Complete ensemble scene
- **MINIFIG-CONFIGURATOR-GUIDE.md** - This documentation

---

## Master Builder Philosophy

**"Container-first, character-driven, psychologically grounded"**

1. Build the **space** (data center floor)
2. Populate with **characters** (minifigs with depth)
3. Create **tension** (conflicting objectives)
4. Allow **emergence** (unexpected solutions)
5. Honor **backstory** (Stanislavski method)

**Result:** LEGO scenes with theatrical depth, narrative richness, and psychological realism.

---

## Performance Indicators

**Good character design:**
- ✓ Color choice reflects personality
- ✓ Position reflects status/role
- ✓ Backstory informs current action
- ✓ Flaws create interesting conflict
- ✓ Objectives clash with others
- ✓ Super-objective guides all choices

**Great ensemble scene:**
- ✓ Every character has clear want
- ✓ Objectives create natural tension
- ✓ Crisis forces character revelation
- ✓ Resolution requires growth
- ✓ Humor emerges from contrast
- ✓ Monkeys provide commentary/solution

---

🎭 **"All the world's a LEGO stage, and all the minifigs merely players..."**
