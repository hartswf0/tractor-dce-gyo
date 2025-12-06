#!/usr/bin/env node
/**
 * parse-chapter-dialogue.js
 * 
 * Extracts dialogue and speakers from ONYX chapter markdown files.
 * Outputs structured JSON for audio/TTS generation.
 * 
 * Usage: node parse-chapter-dialogue.js
 * Output: chapters/dialogue-manifest.json
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
 * Extract dialogue from markdown text
 * Patterns use both straight quotes ('") and curly quotes (''""")
 */
function extractDialogue(markdown, chapterId) {
  const lines = [];
  const narrativeEnd = markdown.indexOf('<poml>');
  const narrativeText = narrativeEnd > 0 ? markdown.slice(0, narrativeEnd) : markdown.slice(0, markdown.indexOf('# ASSESSMENT'));
  
  // Normalize quotes for easier matching (Unicode curly quotes to straight)
  const normalizedText = narrativeText
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2014/g, '--');
  
  // Speech verbs
  const verbs = 'says|retorts|laughs|replies|asks|shouts|cries|whispers|murmurs|exclaims|responds|answers|continues|adds|interjects|observes|notes|muses|declares|announces|protests|insists|concedes|admits|argues|counters|objects|sighs|frowns|snaps|growls|mutters|chuckles|grins|smiles|nods|shrugs|gestures|turns|looks';
  
  // Pattern 1: 'dialogue', verb THE SPEAKER
  // Matches: 'text', says THE BISHOP
  const pattern1 = new RegExp(`'([^']+)',?\\s+(${verbs})\\s+THE\\s+([A-Z][A-Z\\s\\-]+)`, 'gi');
  
  // Pattern 2: THE SPEAKER verb[s], 'dialogue'
  // Matches: THE FOREMAN sighs, 'text'
  const pattern2 = new RegExp(`THE\\s+([A-Z][A-Z\\s\\-]+)\\s+(${verbs})[^']*'([^']+)'`, 'gi');
  
  // Pattern 3: "dialogue" (shouted commands)
  // Matches: shouts a single, sharp syllable: "Slab!"
  const pattern3 = /(?:shouts?|cries?|yells?)[^"]*"([^"]+)"/gi;
  
  // Pattern 4: 'dialogue' at start of paragraph after speaker intro with period
  // Matches: THE BISHOP looks unconvinced. 'But surely...'
  const pattern4 = new RegExp(`THE\\s+([A-Z][A-Z\\s\\-]+)[^']*\\.\\s*'([^']+)'`, 'gi');

  let match;
  const seen = new Set();
  
  // Extract with pattern 1: 'dialogue', says THE SPEAKER
  while ((match = pattern1.exec(normalizedText)) !== null) {
    const text = match[1].trim();
    const speaker = 'THE ' + match[3].trim().replace(/\s+/g, ' ');
    const key = `${speaker}:${text.slice(0, 50)}`;
    if (!seen.has(key)) {
      seen.add(key);
      lines.push({
        speaker: normalizeSpeaker(speaker),
        text: cleanDialogue(text),
        verb: match[2].toLowerCase(),
        index: match.index
      });
    }
  }
  
  // Extract with pattern 2: THE SPEAKER verbs, 'dialogue'
  while ((match = pattern2.exec(normalizedText)) !== null) {
    const speaker = 'THE ' + match[1].trim().replace(/\s+/g, ' ');
    const text = match[3].trim();
    const key = `${speaker}:${text.slice(0, 50)}`;
    if (!seen.has(key)) {
      seen.add(key);
      lines.push({
        speaker: normalizeSpeaker(speaker),
        text: cleanDialogue(text),
        verb: match[2].toLowerCase(),
        index: match.index
      });
    }
  }
  
  // Extract with pattern 4: THE SPEAKER does something. 'dialogue'
  while ((match = pattern4.exec(normalizedText)) !== null) {
    const speaker = 'THE ' + match[1].trim().replace(/\s+/g, ' ');
    const text = match[2].trim();
    const key = `${speaker}:${text.slice(0, 50)}`;
    if (!seen.has(key)) {
      seen.add(key);
      lines.push({
        speaker: normalizeSpeaker(speaker),
        text: cleanDialogue(text),
        verb: 'says',
        index: match.index
      });
    }
  }
  
  // Sort by position in text
  lines.sort((a, b) => a.index - b.index);
  
  // Filter out null speakers and deduplicate by text content
  const seenText = new Set();
  const filtered = [];
  for (const line of lines) {
    if (line.speaker && !seenText.has(line.text.slice(0, 100))) {
      seenText.add(line.text.slice(0, 100));
      filtered.push({ speaker: line.speaker, text: line.text, verb: line.verb });
    }
  }
  
  return filtered;
}

function normalizeSpeaker(speaker) {
  // Clean up speaker name - extract just the core title
  let name = speaker
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
  
  // Remove trailing action descriptions like "SIGHS", "LOOKS UNCONVINCED", etc.
  // Keep only "THE X" or "THE X-Y" pattern
  const match = name.match(/^(THE\s+[A-Z]+(?:-[A-Z]+)?)/);
  if (match) {
    name = match[1];
  }
  
  // Filter out false positives (narrative phrases, not actual speakers)
  const invalidSpeakers = [
    'THE OTHER',
    'THE ONE',
    'THE FIRST',
    'THE SECOND',
    'THE FIGURE'
  ];
  
  for (const invalid of invalidSpeakers) {
    if (name.startsWith(invalid)) {
      return null; // Mark for removal
    }
  }
  
  return name;
}

function cleanDialogue(text) {
  return text
    .replace(/\*([^*]+)\*/g, '$1')  // Remove markdown emphasis
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
const dialogueManifest = {
  generated: new Date().toISOString(),
  totalChapters: chapterFiles.length,
  chapters: []
};

let totalLines = 0;
const speakerStats = {};

for (const file of chapterFiles) {
  const markdown = fs.readFileSync(file, 'utf-8');
  const metadata = extractMetadata(markdown, file);
  const dialogue = extractDialogue(markdown, metadata.id);
  
  // Count speakers
  for (const line of dialogue) {
    speakerStats[line.speaker] = (speakerStats[line.speaker] || 0) + 1;
  }
  
  totalLines += dialogue.length;
  
  const chapterData = {
    ...metadata,
    folder: getFolderName(metadata),
    dialogueCount: dialogue.length,
    dialogue
  };
  
  dialogueManifest.chapters.push(chapterData);
  
  console.log(`${metadata.id}: ${dialogue.length} lines from ${metadata.participants.p1} vs ${metadata.participants.p2}`);
}

dialogueManifest.totalDialogueLines = totalLines;
dialogueManifest.speakers = Object.entries(speakerStats)
  .sort((a, b) => b[1] - a[1])
  .map(([name, count]) => ({ name, lineCount: count }));

// Write main manifest
const outputPath = path.join('chapters', 'dialogue-manifest.json');
fs.writeFileSync(outputPath, JSON.stringify(dialogueManifest, null, 2));
console.log(`\nWrote ${outputPath}`);
console.log(`Total: ${totalLines} dialogue lines across ${chapterFiles.length} chapters`);
console.log(`\nTop speakers:`);
dialogueManifest.speakers.slice(0, 10).forEach(s => {
  console.log(`  ${s.name}: ${s.lineCount} lines`);
});

// Also write per-chapter dialogue files for easy access
for (const chapter of dialogueManifest.chapters) {
  const chapterDir = path.join('chapters', chapter.folder);
  if (fs.existsSync(chapterDir)) {
    const dialoguePath = path.join(chapterDir, 'dialogue.json');
    fs.writeFileSync(dialoguePath, JSON.stringify({
      id: chapter.id,
      title: chapter.title,
      participants: chapter.participants,
      dialogue: chapter.dialogue
    }, null, 2));
  }
}
console.log(`\nWrote individual dialogue.json files to each chapter folder`);
