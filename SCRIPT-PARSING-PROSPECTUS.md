# Script Parsing Prospectus: Beyond Regex

## Status Update (Implemented)

The speaker inference system has been implemented and reduced UNKNOWN speakers from **295 to 0**. Key techniques:

1. **Turn-taking** - Alternating speakers in two-party dialogue
2. **Narration scanning** - "THE FOREMAN sweeps..." → next speaker is FOREMAN
3. **Address detection** - "Bishop, you are wrong" → speaker is NOT Bishop
4. **Pronoun tracking** - "he said" / "she replied" for gender inference

See `inferSpeakers()` in `parse-chapter-script.js`.

---

## The Problem with Regex

Our current parser uses pattern matching to extract dialogue from markdown:

```javascript
// Current approach: fragile regex chains
const dialogueRegex = /'(?:\*\*)?([A-Z].*?[.!?,])(?:\*\*)?'/g;
const speakerAfter = text.match(/^\s*,?\s*(says|retorts|laughs)\\s+THE\\s+([A-Z]+)/i);
```

### Why This Breaks

1. **Ambiguity** - `'` is both a quote delimiter AND an apostrophe
2. **Context-blindness** - Regex can't understand "this is dialogue" vs "this is a possessive"
3. **Pattern explosion** - Each new edge case requires another regex
4. **Maintenance burden** - 15+ patterns, each with subtle interactions
5. **Language rigidity** - Assumes English conventions (THE SPEAKER says)

### Current Failure Modes

```markdown
# These all break differently:
'The assistant's mind wandered,' says THE BISHOP.     # possessive inside quote
"Don't," she said, "do that."                         # contraction + split dialogue  
THE CHILD-MACHINE whirs: 'Processing...'              # colon attribution
'Hello,' THE FOREMAN waves, 'over here!'              # action interrupting dialogue
```

---

## Proposal: Semantic Parsing Architecture

### Core Insight

**Dialogue is not a pattern—it's a semantic structure.**

Instead of asking "what regex matches dialogue?", we should ask:
- Who is speaking?
- What are they saying?
- What action accompanies the speech?
- What narrative context surrounds it?

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3: SEMANTIC UNDERSTANDING                            │
│  "THE BISHOP is speaking to THE FOREMAN about language"     │
│  Uses: LLM / NLU model                                      │
└─────────────────────────────────────────────────────────────┘
                            ▲
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2: STRUCTURAL PARSING                                │
│  "This is a dialogue turn with speaker attribution"         │
│  Uses: Grammar-based parser / AST                           │
└─────────────────────────────────────────────────────────────┘
                            ▲
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: TOKENIZATION                                      │
│  "Quote opened at position 45, closed at position 89"       │
│  Uses: State machine / lexer                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Layer 1: Smart Tokenization

### Replace Regex with State Machine

Instead of pattern matching, track state as we scan:

```javascript
const TokenType = {
  QUOTE_OPEN: 'QUOTE_OPEN',
  QUOTE_CLOSE: 'QUOTE_CLOSE', 
  APOSTROPHE: 'APOSTROPHE',      // possessive/contraction
  SPEAKER_REF: 'SPEAKER_REF',    // THE BISHOP, THE FOREMAN
  SPEECH_VERB: 'SPEECH_VERB',    // says, retorts, shouts
  PUNCTUATION: 'PUNCTUATION',
  WORD: 'WORD',
  WHITESPACE: 'WHITESPACE'
};

class DialogueLexer {
  constructor(text) {
    this.text = text;
    this.pos = 0;
    this.state = 'NARRATIVE';  // NARRATIVE | IN_DIALOGUE | IN_SHOUT
    this.tokens = [];
  }
  
  tokenize() {
    while (this.pos < this.text.length) {
      const char = this.text[this.pos];
      
      if (char === "'") {
        // Context-aware quote detection
        if (this.isApostrophe()) {
          this.emit(TokenType.APOSTROPHE);
        } else if (this.state === 'NARRATIVE') {
          this.emit(TokenType.QUOTE_OPEN);
          this.state = 'IN_DIALOGUE';
        } else {
          this.emit(TokenType.QUOTE_CLOSE);
          this.state = 'NARRATIVE';
        }
      }
      // ... more token types
    }
    return this.tokens;
  }
  
  isApostrophe() {
    // Apostrophe if: letter before AND letter after
    const before = this.text[this.pos - 1];
    const after = this.text[this.pos + 1];
    return /[a-zA-Z]/.test(before) && /[a-zA-Z]/.test(after);
  }
}
```

### Benefits
- **Explicit state** - No ambiguity about "are we in dialogue?"
- **Lookahead/lookbehind** - Can examine context without regex
- **Recoverable** - Can handle malformed input gracefully
- **Debuggable** - Token stream is inspectable

---

## Layer 2: Grammar-Based Parsing

### Define a Dialogue Grammar

```
Script        → Element*
Element       → Narration | DialogueTurn | Shout
DialogueTurn  → Attribution? Quote Attribution?
Attribution   → SpeakerRef SpeechVerb Action?
              | SpeechVerb SpeakerRef Action?
SpeakerRef    → "THE" SPEAKER_NAME
SpeechVerb    → "says" | "retorts" | "shouts" | ...
Quote         → QUOTE_OPEN Content QUOTE_CLOSE
Shout         → DOUBLE_QUOTE Content DOUBLE_QUOTE
Narration     → (WORD | PUNCTUATION)+
Action        → "," ActionPhrase
ActionPhrase  → WORD+ ("." | ",")
```

### Parser Implementation

```javascript
class DialogueParser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }
  
  parse() {
    const elements = [];
    while (!this.isAtEnd()) {
      elements.push(this.parseElement());
    }
    return elements;
  }
  
  parseElement() {
    // Try dialogue turn first (more specific)
    if (this.check(TokenType.QUOTE_OPEN) || this.checkSpeakerRef()) {
      return this.parseDialogueTurn();
    }
    // Fall back to narration
    return this.parseNarration();
  }
  
  parseDialogueTurn() {
    let speaker = null;
    let verb = null;
    let action = null;
    let text = null;
    
    // Attribution before: THE BISHOP says, '...'
    if (this.checkSpeakerRef()) {
      speaker = this.parseSpeakerRef();
      verb = this.parseSpeechVerb();
      action = this.parseAction();
    }
    
    // The quote itself
    text = this.parseQuote();
    
    // Attribution after: '...', says THE BISHOP
    if (!speaker && this.checkSpeechVerb()) {
      verb = this.parseSpeechVerb();
      speaker = this.parseSpeakerRef();
      action = this.parseAction();
    }
    
    return {
      type: 'dialogue',
      speaker: speaker || this.lastSpeaker || 'UNKNOWN',
      text,
      action: action ? `${verb}, ${action}` : verb
    };
  }
}
```

### Benefits
- **Composable** - Grammar rules can be combined
- **Extensible** - Add new patterns without breaking existing ones
- **Self-documenting** - Grammar IS the specification
- **Error recovery** - Can skip malformed sections

---

## Layer 3: LLM-Assisted Understanding

### When Grammar Isn't Enough

Some cases require true understanding:

```markdown
The Bishop smiled at this. 'Ah, but you see,' he began, 
then paused, considering. 'The word is not the thing.'
```

A grammar parser sees two separate quotes. An LLM understands this is one interrupted thought from THE BISHOP.

### Hybrid Approach

```javascript
async function parseWithLLM(paragraph, context) {
  // First pass: structural parsing
  const tokens = new DialogueLexer(paragraph).tokenize();
  const parsed = new DialogueParser(tokens).parse();
  
  // Check confidence
  const hasUnknownSpeakers = parsed.some(e => e.speaker === 'UNKNOWN');
  const hasAmbiguity = detectAmbiguity(parsed);
  
  if (hasUnknownSpeakers || hasAmbiguity) {
    // Second pass: LLM clarification
    const clarified = await llmClarify(paragraph, parsed, context);
    return clarified;
  }
  
  return parsed;
}

async function llmClarify(text, parsed, context) {
  const prompt = `
    Given this narrative text and partial parse, identify:
    1. Who is speaking each quoted section
    2. What action accompanies each speech
    3. Any narrative context between speeches
    
    Text: "${text}"
    
    Previous speakers: ${context.recentSpeakers.join(', ')}
    Partial parse: ${JSON.stringify(parsed)}
    
    Return JSON array of script elements.
  `;
  
  return await callLLM(prompt);
}
```

### Benefits
- **Handles ambiguity** - LLM can reason about context
- **Graceful degradation** - Falls back to grammar when LLM unavailable
- **Learning potential** - LLM corrections can improve grammar rules
- **Language agnostic** - Works across writing styles

---

## Implementation Roadmap

### Phase 1: Lexer Rewrite (1-2 days)
- [ ] Implement state machine tokenizer
- [ ] Handle quote/apostrophe disambiguation
- [ ] Add speaker reference detection
- [ ] Add speech verb detection
- [ ] Unit tests for edge cases

### Phase 2: Grammar Parser (2-3 days)
- [ ] Define formal grammar
- [ ] Implement recursive descent parser
- [ ] Handle attribution before/after
- [ ] Handle interrupted dialogue
- [ ] Handle nested quotes

### Phase 3: LLM Integration (1-2 days)
- [ ] Define clarification prompt
- [ ] Implement confidence scoring
- [ ] Add fallback logic
- [ ] Cache LLM responses
- [ ] Rate limiting

### Phase 4: Validation & Refinement (ongoing)
- [ ] Test against all 42 chapters
- [ ] Measure accuracy vs current regex
- [ ] Identify remaining failure modes
- [ ] Refine grammar rules
- [ ] Tune LLM prompts

---

## Alternative Approaches Considered

### 1. Pure LLM Parsing
**Idea:** Send entire chapter to LLM, get back structured script.

**Pros:** Handles any format, no grammar maintenance
**Cons:** Expensive, slow, non-deterministic, context window limits

**Verdict:** Too expensive for 42 chapters × iterative development

### 2. Training a Custom Model
**Idea:** Fine-tune a model on dialogue extraction.

**Pros:** Fast inference, consistent results
**Cons:** Requires labeled training data, model maintenance

**Verdict:** Overkill for this corpus size; consider if scaling to 1000+ chapters

### 3. Markdown AST + Heuristics
**Idea:** Parse markdown structure, then apply heuristics to text nodes.

**Pros:** Leverages existing markdown parsers
**Cons:** Dialogue structure is within text nodes, not markdown structure

**Verdict:** Doesn't solve the core problem

### 4. Annotation-Based Approach
**Idea:** Add explicit markup to source files.

```markdown
<dialogue speaker="THE BISHOP" action="says, pointing">
Observe. Here is the essence of language.
</dialogue>
```

**Pros:** Unambiguous, perfect parsing
**Cons:** Requires modifying all source files, less natural to write

**Verdict:** Good for new content; impractical for existing corpus

---

## Metrics for Success

### Accuracy Targets
- **Speaker attribution:** 95%+ correct (currently ~85%)
- **Dialogue boundaries:** 98%+ correct (currently ~90%)
- **Action extraction:** 90%+ correct (currently ~70%)
- **No false positives:** Narration incorrectly marked as dialogue

### Performance Targets
- **Parse time:** <100ms per chapter (currently ~50ms)
- **LLM calls:** <5% of paragraphs need clarification
- **Memory:** <50MB for full corpus

### Maintainability Targets
- **New pattern:** <1 hour to add support
- **Bug fix:** <30 minutes to diagnose and fix
- **Test coverage:** >90% of parser code

---

## Conclusion

The regex approach has reached its limits. Every new edge case requires another pattern, and patterns interact in unpredictable ways.

The proposed three-layer architecture provides:
1. **Robustness** - State machine handles quote ambiguity
2. **Clarity** - Grammar defines what we're looking for
3. **Flexibility** - LLM handles true ambiguity
4. **Scalability** - Each layer can be improved independently

The investment is ~1 week of development for a system that will handle any reasonable narrative format, not just our current conventions.

---

## Appendix: Current Regex Patterns

For reference, here are the patterns we're trying to replace:

```javascript
// Quote detection (breaks on apostrophes)
/'(?:\*\*)?([A-Z].*?[.!?,])(?:\*\*)?'/g

// Speaker after quote
/^\s*,?\s*(says|retorts|...)\\s+THE\\s+([A-Z]+)/i

// Speaker before quote  
/THE\\s+([A-Z]+)\\s+(says|retorts|...)([^']*?)'/i

// Shout detection
/(?:shouts?|cries?|yells?).*?"([^"]+)"/i

// Possessive filtering
/[a-zA-Z]'[stdlrv]/  // assistant's, don't, etc.
```

Each pattern was added to fix a specific bug. Together, they form a fragile web that breaks whenever the source text deviates from expected conventions.

The future is structured parsing, not pattern matching.
