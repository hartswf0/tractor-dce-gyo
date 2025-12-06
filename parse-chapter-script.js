#!/usr/bin/env node
/**
 * parse-chapter-script.js
 * 
 * Extracts a FULL DRAMATIC SCRIPT from ONYX chapter markdown files.
 * Captures dialogue, stage directions, narration, and actions.
 * Designed for audio playback as a radio play.
 * 
 * Usage: node parse-chapter-script.js
 * Output: chapters/script-manifest.json + per-chapter script.json
 */

const fs = require('fs');
const path = require('path');

// Find all chapter files
const chapterFiles = fs.readdirSync('.')
  .filter(f => /^ch\d+[a-z]?\.md$/.test(f))
  .sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)[0]);
    const numB = parseInt(b.match(/\d+/)[0]);
    return numA - numB;
  });

console.log(`Found ${chapterFiles.length} chapter files\n`);

/**
 * Parse a chapter into a dramatic script
 * Returns array of script elements: { type, speaker?, text, action? }
 * Types: 'narration', 'dialogue', 'action', 'shout'
 */
function parseScript(markdown, chapterId, participants) {
  const script = [];
  
  // Get narrative portion only (before <poml> or # ASSESSMENT)
  const narrativeEnd = markdown.indexOf('<poml>');
  const assessmentEnd = markdown.indexOf('# ASSESSMENT');
  const endIdx = narrativeEnd > 0 ? narrativeEnd : (assessmentEnd > 0 ? assessmentEnd : markdown.length);
  let narrative = markdown.slice(0, endIdx);
  
  // Normalize quotes
  narrative = narrative
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2014/g, '—');
  
  // Skip header lines (# Chapter, ## When, ## Subtitle, **Author**)
  const lines = narrative.split('\n');
  let startIdx = 0;
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    if (lines[i].startsWith('#') || lines[i].startsWith('**') || lines[i].trim() === '') {
      startIdx = i + 1;
    } else {
      break;
    }
  }
  
  // Join remaining paragraphs
  const paragraphs = lines.slice(startIdx).join('\n').split(/\n\n+/).filter(p => p.trim());
  
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    
    // Parse each paragraph for dialogue and narration
    const elements = parseParagraph(trimmed);
    script.push(...elements);
  }
  
  // Post-process: clean up artifacts and infer unknown speakers
  return cleanupScript(script, participants);
}

/**
 * Clean up script artifacts: remove orphan punctuation, merge fragments
 * Also infer UNKNOWN speakers using turn-taking and context
 */
function cleanupScript(script, participants) {
  const cleaned = [];
  
  // Known participants for this chapter
  const p1 = participants?.p1 || null;
  const p2 = participants?.p2 || null;
  const speakers = [p1, p2].filter(Boolean);
  
  // First pass: basic cleanup
  for (let i = 0; i < script.length; i++) {
    const el = script[i];
    
    // Skip very short narration (orphan punctuation like "." or ",")
    if (el.type === 'narration' && el.text.length < 5) {
      continue;
    }
    
    // Skip narration that's just a speaker attribution (already captured in dialogue)
    if (el.type === 'narration' && /^,?\s*(says|retorts|laughs|replies)\s+THE\s+/i.test(el.text)) {
      continue;
    }
    
    // Skip incomplete dialogue fragments (starting with punctuation or very short)
    if ((el.type === 'dialogue' || el.type === 'shout') && el.text.length < 3) {
      continue;
    }
    
    // Clean up text that starts with quotes or punctuation
    if (el.text.startsWith("'") || el.text.startsWith('"')) {
      el.text = el.text.slice(1);
    }
    
    // Merge consecutive narration elements
    if (el.type === 'narration' && cleaned.length > 0) {
      const prev = cleaned[cleaned.length - 1];
      if (prev.type === 'narration' && prev.text.length < 100) {
        prev.text = prev.text + ' ' + el.text;
        continue;
      }
    }
    
    cleaned.push(el);
  }
  
  // Second pass: infer UNKNOWN speakers using context
  inferSpeakers(cleaned, speakers);
  
  return cleaned;
}

/**
 * Infer UNKNOWN speakers using:
 * 1. Turn-taking (alternating speakers in dialogue)
 * 2. Pronoun detection (he/she in nearby narration)
 * 3. Speaker mention in preceding narration (THE FOREMAN sweeps...)
 * 4. Addressing by name ("Bishop, you are wrong")
 */
function inferSpeakers(script, participants) {
  let lastKnownSpeaker = null;
  let speakerGenders = {}; // speaker -> 'male' | 'female' | null
  
  // Infer genders from names (heuristic)
  for (const p of participants) {
    if (!p) continue;
    // Most characters are male in this corpus, but some hints:
    // Female indicators: -WOMAN, -GIRL, -MOTHER, -QUEEN, -WITCH
    const name = p.toUpperCase();
    if (/WOMAN|GIRL|MOTHER|QUEEN|WITCH|MAIDEN|BRIDE|SISTER|DAUGHTER/.test(name)) {
      speakerGenders[p] = 'female';
    } else {
      speakerGenders[p] = 'male'; // default assumption
    }
  }
  
  for (let i = 0; i < script.length; i++) {
    const el = script[i];
    
    if (el.type !== 'dialogue' && el.type !== 'shout') {
      // Check narration for speaker mentions and pronouns
      if (el.type === 'narration') {
        // Look for "THE SPEAKER" mentions
        const speakerMention = el.text.match(/THE\s+([A-Z][A-Z]+(?:-[A-Z]+)?)/i);
        if (speakerMention) {
          const mentioned = 'THE ' + speakerMention[1].toUpperCase();
          // This speaker is likely the next to speak
          lastKnownSpeaker = mentioned;
        }
        
        // Look for pronouns to infer gender of next speaker
        if (/\b(he|him|his)\b/i.test(el.text) && !/\b(she|her)\b/i.test(el.text)) {
          // Male pronoun - next speaker is likely male
          const maleSpeaker = participants.find(p => speakerGenders[p] === 'male');
          if (maleSpeaker) lastKnownSpeaker = maleSpeaker;
        } else if (/\b(she|her)\b/i.test(el.text) && !/\b(he|him|his)\b/i.test(el.text)) {
          // Female pronoun - next speaker is likely female
          const femaleSpeaker = participants.find(p => speakerGenders[p] === 'female');
          if (femaleSpeaker) lastKnownSpeaker = femaleSpeaker;
        }
      }
      continue;
    }
    
    // Handle UNKNOWN or CONTINUATION speakers
    if (el.speaker === 'UNKNOWN' || el.speaker === 'CONTINUATION') {
      // Strategy 1: Check if dialogue addresses someone by name
      // e.g., "Bishop, you are wrong" -> speaker is NOT the Bishop
      const addressMatch = el.text.match(/^([A-Z][a-z]+),\s/);
      if (addressMatch && participants.length === 2) {
        const addressed = addressMatch[1].toUpperCase();
        // Find the OTHER speaker
        const other = participants.find(p => !p.toUpperCase().includes(addressed));
        if (other) {
          el.speaker = other;
          lastKnownSpeaker = other;
          continue;
        }
      }
      
      // Strategy 2: Look at preceding narration for speaker mention
      if (i > 0 && script[i-1].type === 'narration') {
        const prevNarration = script[i-1].text;
        const speakerMention = prevNarration.match(/THE\s+([A-Z][A-Z]+(?:-[A-Z]+)?)/i);
        if (speakerMention) {
          el.speaker = 'THE ' + speakerMention[1].toUpperCase();
          lastKnownSpeaker = el.speaker;
          continue;
        }
      }
      
      // Strategy 3: Turn-taking - alternate from last known speaker
      if (lastKnownSpeaker && participants.length === 2) {
        // Find the other participant
        const other = participants.find(p => p !== lastKnownSpeaker);
        if (other) {
          el.speaker = other;
          lastKnownSpeaker = other;
          continue;
        }
      }
      
      // Strategy 4: Use last known speaker if no alternation possible
      if (lastKnownSpeaker) {
        el.speaker = lastKnownSpeaker;
      }
    } else {
      // Known speaker - update tracking
      lastKnownSpeaker = el.speaker;
    }
  }
}

/**
 * Parse a single paragraph into script elements
 * Handles possessives and contractions by using smarter quote matching
 */
function parseParagraph(text) {
  const elements = [];
  
  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  // Check if this is pure narration (no dialogue quotes)
  // Dialogue quotes: ' followed by capital letter or "
  if (!/'[A-Z]/.test(text) && !/"/.test(text) && !/[.!?]'/.test(text)) {
    elements.push({ type: 'narration', text: cleanText(text) });
    return elements;
  }
  
  // Speech verbs for pattern matching
  const verbList = 'says|retorts|laughs|replies|asks|shouts|sighs|frowns|snaps|growls|mutters|chuckles|whispers|murmurs|exclaims|responds|answers|continues|adds|interjects|observes|notes|muses|declares|announces|protests|insists|concedes|admits|argues|counters|objects|gestures|turns|looks';
  
  // Use a two-pass approach:
  // 1. Find all quote positions
  // 2. Pair them based on context (dialogue vs possessive)
  
  const quotePositions = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "'") {
      // Determine if this is a dialogue quote or possessive/contraction
      const before = text.slice(Math.max(0, i - 2), i);
      const after = text.slice(i + 1, i + 3);
      
      // Possessive/contraction: letter + ' + s/t/d/ll/re/ve or ' + letter (mid-word)
      const isPossessive = /[a-zA-Z]$/.test(before) && /^[stdlrv]/i.test(after);
      const isContraction = /[a-zA-Z]$/.test(before) && /^[a-zA-Z]/.test(after);
      
      if (!isPossessive && !isContraction) {
        quotePositions.push(i);
      }
    }
  }
  
  // Pair quotes (opening, closing)
  let lastIndex = 0;
  let lastSpeaker = null;
  
  for (let q = 0; q < quotePositions.length - 1; q += 2) {
    const openPos = quotePositions[q];
    const closePos = quotePositions[q + 1];
    if (closePos === undefined) break;
    
    const dialogueText = text.slice(openPos + 1, closePos);
    
    // Text before this dialogue
    const before = text.slice(lastIndex, openPos).trim();
    
    // Check if before contains speaker intro: THE SPEAKER verb
    const speakerBefore = before.match(new RegExp(`THE\\s+([A-Z][A-Z]+(?:-[A-Z]+)?(?:\\s+[A-Z]+)?)\\s+(${verbList})(.*)$`, 'i'));
    
    // Check if after contains speaker attribution: verb THE SPEAKER
    const afterStart = closePos + 1;
    const afterText = text.slice(afterStart, afterStart + 100);
    const speakerAfter = afterText.match(new RegExp(`^\\s*,?\\s*(${verbList})\\s+THE\\s+([A-Z][A-Z]+(?:-[A-Z]+)?(?:\\s+[A-Z]+)?)([,.]?.*)`, 'i'));
    
    // Add narration before (excluding speaker intro)
    if (before) {
      if (speakerBefore) {
        const narrativePart = before.slice(0, before.indexOf(speakerBefore[0])).trim();
        if (narrativePart) {
          elements.push({ type: 'narration', text: cleanText(narrativePart) });
        }
      } else {
        elements.push({ type: 'narration', text: cleanText(before) });
      }
    }
    
    // Determine speaker and action
    let speaker = lastSpeaker || 'UNKNOWN';
    let action = null;
    
    if (speakerBefore) {
      speaker = 'THE ' + speakerBefore[1].trim();
      const verb = speakerBefore[2].toLowerCase();
      const extra = speakerBefore[3].replace(/^[,.]\s*/, '').replace(/[.']*$/, '').trim();
      action = extra ? `${verb}, ${extra}` : verb;
    } else if (speakerAfter) {
      speaker = 'THE ' + speakerAfter[2].trim();
      action = speakerAfter[1].toLowerCase();
    }
    
    lastSpeaker = speaker;
    
    elements.push({
      type: 'dialogue',
      speaker: speaker,
      text: cleanText(dialogueText.replace(/[.,!?]$/, '')),
      action: action
    });
    
    // Update lastIndex to after the closing quote (and attribution if present)
    lastIndex = speakerAfter ? afterStart + speakerAfter[0].length : closePos + 1;
  }
  
  // Remaining text after last dialogue
  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex).trim();
    if (remaining && remaining.length > 3) {
      // Check for shouts in remaining text
      const shoutMatch = remaining.match(/(?:shouts?|cries?|yells?|exclaims?)[^"]*"([^"]+)"/i);
      if (shoutMatch) {
        const beforeShout = remaining.slice(0, remaining.indexOf(shoutMatch[0])).trim();
        if (beforeShout) {
          elements.push({ type: 'narration', text: cleanText(beforeShout) });
        }
        elements.push({ type: 'narration', text: cleanText(remaining.slice(0, remaining.indexOf('"')).trim()) });
        elements.push({
          type: 'shout',
          speaker: lastSpeaker || 'NARRATOR',
          text: cleanText(shoutMatch[1]),
          action: 'shouts'
        });
        const afterShout = remaining.slice(remaining.lastIndexOf('"') + 1).trim();
        if (afterShout && afterShout.length > 3) {
          elements.push({ type: 'narration', text: cleanText(afterShout) });
        }
      } else {
        elements.push({ type: 'narration', text: cleanText(remaining) });
      }
    }
  }
  
  // If no dialogue found, treat as narration
  if (elements.length === 0) {
    elements.push({ type: 'narration', text: cleanText(text) });
  }
  
  return elements;
}

/**
 * Find the speaker for dialogue at given position
 */
function findSpeaker(text, dlgStart, dlgEnd) {
  // Look before the dialogue for "THE SPEAKER verb" pattern
  const before = text.slice(0, dlgStart);
  const after = text.slice(dlgEnd);
  
  // Pattern: THE SPEAKER verbs, '...'
  const beforeMatch = before.match(/THE\s+([A-Z][A-Z\s\-]+?)\s+(says|retorts|laughs|replies|asks|shouts|sighs|frowns|snaps|growls|mutters|chuckles|whispers|murmurs|exclaims|responds|answers|continues|adds|interjects|observes|notes|muses|declares|announces|protests|insists|concedes|admits|argues|counters|objects|gestures|turns|looks)[^']*$/i);
  if (beforeMatch) {
    return 'THE ' + beforeMatch[1].trim().split(/\s+/).slice(0, 2).join(' ');
  }
  
  // Pattern: '...', says THE SPEAKER
  const afterMatch = after.match(/^[,']?\s*(says|retorts|laughs|replies|asks|shouts|sighs|frowns|snaps|growls|mutters|chuckles|whispers|murmurs|exclaims|responds|answers|continues|adds|interjects|observes|notes|muses|declares|announces|protests|insists|concedes|admits|argues|counters|objects)\s+THE\s+([A-Z][A-Z\s\-]+)/i);
  if (afterMatch) {
    return 'THE ' + afterMatch[2].trim().split(/\s+/).slice(0, 2).join(' ');
  }
  
  // Look for THE SPEAKER at start of sentence before dialogue
  const sentenceMatch = before.match(/THE\s+([A-Z][A-Z\s\-]+?)\s+[a-z]/i);
  if (sentenceMatch) {
    return 'THE ' + sentenceMatch[1].trim().split(/\s+/).slice(0, 2).join(' ');
  }
  
  return null;
}

/**
 * Find the action/stage direction for dialogue
 */
function findAction(text, dlgStart, dlgEnd) {
  const before = text.slice(0, dlgStart);
  const after = text.slice(dlgEnd);
  
  // Look for action verbs and descriptions
  // Pattern: THE SPEAKER verbs, doing something. '...'
  const actionMatch = before.match(/THE\s+[A-Z][A-Z\s\-]+\s+(says|retorts|laughs|replies|asks|shouts|sighs|frowns|snaps|growls|mutters|chuckles|whispers|murmurs|exclaims|responds|answers|continues|adds|interjects|observes|notes|muses|declares|announces|protests|insists|concedes|admits|argues|counters|objects|gestures|turns|looks)([^']*?)\.?\s*$/i);
  if (actionMatch) {
    const verb = actionMatch[1].toLowerCase();
    const extra = actionMatch[2].trim().replace(/^,\s*/, '');
    return extra ? `${verb}, ${extra}` : verb;
  }
  
  // Pattern: '...', says THE SPEAKER, doing something.
  const afterActionMatch = after.match(/^[,']?\s*(says|retorts|laughs|replies|asks|shouts|sighs|frowns|snaps|growls|mutters|chuckles|whispers|murmurs|exclaims|responds|answers|continues|adds|interjects|observes|notes|muses|declares|announces|protests|insists|concedes|admits|argues|counters|objects)\s+THE\s+[A-Z][A-Z\s\-]+[,.]?\s*([^.]*)/i);
  if (afterActionMatch) {
    const verb = afterActionMatch[1].toLowerCase();
    const extra = afterActionMatch[2].trim();
    return extra ? `${verb}, ${extra}` : verb;
  }
  
  return null;
}

/**
 * Extract speaker info from context before dialogue
 */
function extractSpeakerFromContext(before, fullText, dlg) {
  // Check if this is a speaker introduction
  const introMatch = before.match(/^(.*?)THE\s+([A-Z][A-Z\s\-]+)\s+(says|retorts|laughs|replies|asks|shouts|sighs|frowns|snaps|growls|mutters|chuckles|whispers|murmurs|exclaims|responds|answers|continues|adds|interjects|observes|notes|muses|declares|announces|protests|insists|concedes|admits|argues|counters|objects|gestures|turns|looks)([^']*)$/i);
  
  if (introMatch) {
    return {
      isIntro: true,
      narration: introMatch[1].trim() || null,
      speaker: 'THE ' + introMatch[2].trim(),
      verb: introMatch[3].toLowerCase(),
      extra: introMatch[4].trim()
    };
  }
  
  return { isIntro: false };
}

/**
 * Clean text for output
 */
function cleanText(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // Remove bold
    .replace(/\*([^*]+)\*/g, '$1')       // Remove italic
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract chapter metadata
 */
function extractMetadata(markdown, filename) {
  const lines = markdown.split('\n');
  let chapterNum = filename.match(/ch(\d+[a-z]?)/i)?.[1] || '0';
  let title = '';
  let subtitle = '';
  let author = '';
  let p1 = '';
  let p2 = '';
  
  for (const line of lines) {
    if (line.startsWith('## When ')) {
      title = line.replace('## ', '').trim();
      const match = title.match(/When\s+(.+?)\s+meets\s+(.+?):/i);
      if (match) {
        p1 = match[1].trim();
        p2 = match[2].trim();
      }
    } else if (line.startsWith('## ') && !line.includes('When')) {
      subtitle = line.replace('## ', '').trim();
    } else if (line.startsWith('**') && !line.includes(':') && lines.indexOf(line) < 10) {
      author = line.replace(/\*\*/g, '').trim();
    }
  }
  
  return {
    id: `M-${chapterNum}`,
    file: filename,
    title,
    subtitle,
    author,
    participants: { p1, p2 }
  };
}

/**
 * Get folder name for chapter
 */
function getFolderName(metadata) {
  const { p1, p2 } = metadata.participants;
  const clean = (s) => s.replace(/[^A-Z\-]/gi, '-').replace(/-+/g, '-');
  return `${metadata.id}_${clean(p1)}-vs-${clean(p2)}`;
}

// Process all chapters
const scriptManifest = {
  generated: new Date().toISOString(),
  totalChapters: chapterFiles.length,
  chapters: []
};

let totalElements = 0;
const typeStats = { narration: 0, dialogue: 0, shout: 0, action: 0 };

for (const file of chapterFiles) {
  const markdown = fs.readFileSync(file, 'utf-8');
  const metadata = extractMetadata(markdown, file);
  const script = parseScript(markdown, metadata.id, metadata.participants);
  
  // Count types
  for (const el of script) {
    typeStats[el.type] = (typeStats[el.type] || 0) + 1;
  }
  
  totalElements += script.length;
  
  const chapterData = {
    ...metadata,
    folder: getFolderName(metadata),
    elementCount: script.length,
    script
  };
  
  scriptManifest.chapters.push(chapterData);
  
  const dialogueCount = script.filter(e => e.type === 'dialogue').length;
  const narrationCount = script.filter(e => e.type === 'narration').length;
  console.log(`${metadata.id}: ${script.length} elements (${dialogueCount} dialogue, ${narrationCount} narration)`);
}

scriptManifest.totalElements = totalElements;
scriptManifest.typeStats = typeStats;

// Write main manifest
const outputPath = path.join('chapters', 'script-manifest.json');
fs.writeFileSync(outputPath, JSON.stringify(scriptManifest, null, 2));
console.log(`\nWrote ${outputPath}`);
console.log(`Total: ${totalElements} script elements across ${chapterFiles.length} chapters`);
console.log(`\nType breakdown:`);
Object.entries(typeStats).forEach(([type, count]) => {
  console.log(`  ${type}: ${count}`);
});

// Write per-chapter script files
for (const chapter of scriptManifest.chapters) {
  const chapterDir = path.join('chapters', chapter.folder);
  if (fs.existsSync(chapterDir)) {
    const scriptPath = path.join(chapterDir, 'script.json');
    fs.writeFileSync(scriptPath, JSON.stringify({
      id: chapter.id,
      title: chapter.title,
      subtitle: chapter.subtitle,
      participants: chapter.participants,
      script: chapter.script
    }, null, 2));
  }
}
console.log(`\nWrote individual script.json files to each chapter folder`);
