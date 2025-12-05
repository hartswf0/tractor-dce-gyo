const fs = require('fs');
const path = require('path');

function normalize(md) {
  return (md || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function getFirstMatch(re, s) {
  const m = s.match(re);
  return m ? m[1].trim() : null;
}

function parseChapterMeta(md) {
  const chapterIdStr = getFirstMatch(/^#\s*Chapter\s+(\d+)/mi, md);
  const chapterId = chapterIdStr ? Number(chapterIdStr) : null;

  const h2Matches = [];
  let m;
  const h2Re = /^##\s+(.+)$/gm;
  while ((m = h2Re.exec(md))) {
    h2Matches.push(m[1].trim());
  }

  const pairTitle = h2Matches[0] || null;
  const chapterTitle = h2Matches[1] || null;
  const author = getFirstMatch(/^\*\*(.+?)\*\*\s*$/m, md);

  return {
    chapterId,
    chapterLabel: chapterId != null ? `Chapter ${chapterId}` : null,
    pairTitle,
    chapterTitle,
    author
  };
}

function parseFinalComparativeVerdict(md) {
  const sectionMatch = md.match(/###\s*FINAL COMPARATIVE VERDICT([\s\S]*)$/i);
  if (!sectionMatch) return null;

  const block = sectionMatch[1].trim();

  const winnerMatch = block.match(/\*\*Winner:\*\*\s*\*\*([^*]+)\*\*/i);
  const winner = winnerMatch ? winnerMatch[1].trim() : null;

  let summary = null;
  if (winnerMatch) {
    const idx = block.indexOf(winnerMatch[0]) + winnerMatch[0].length;
    summary = block.slice(idx).trim() || null;
  }

  const tableMatch = block.match(/(\|[^\n]*\|\s*\n\|[ :\-\|]+\|\s*\n([\s\S]*?))(?:\n{2,}|$)/);
  let table = null;
  if (tableMatch) {
    const fullTable = tableMatch[1].trim();
    const lines = normalize(fullTable).split('\n').filter(Boolean);
    if (lines.length >= 2) {
      const headerLine = lines[0];
      const header = headerLine
        .replace(/^\||\|$/g, '')
        .split('|')
        .map((s) => s.trim());

      const bodyLines = lines.slice(2); // skip separator row
      const rows = bodyLines
        .map((ln) => ln.trim())
        .filter((ln) => ln.startsWith('|'))
        .map((ln) => {
          const cells = ln
            .replace(/^\||\|$/g, '')
            .split('|')
            .map((s) => s.trim());
          const obj = {};
          header.forEach((h, i) => {
            obj[h] = cells[i] != null ? cells[i] : '';
          });
          return obj;
        });

      table = {
        header,
        rows,
        rawMarkdown: fullTable
      };
    }
  }

  const decisionLabel = table && table.header.length ? table.header[table.header.length - 1] : null;

  return {
    winner,
    decisionLabel,
    summary,
    table
  };
}

function parseChapter(md, filename) {
  const text = normalize(md);
  const meta = parseChapterMeta(text);
  const fcv = parseFinalComparativeVerdict(text);

  return {
    file: filename || null,
    ...meta,
    finalDecision: fcv
      ? {
          winner: fcv.winner,
          decisionLabel: fcv.decisionLabel,
          summary: fcv.summary
        }
      : null,
    comparisonTable: fcv ? fcv.table : null
  };
}

function main() {
  const dir = __dirname;
  const files = fs
    .readdirSync(dir)
    .filter((f) => /^ch\d+\.md$/i.test(f))
    .sort((a, b) => {
      const na = Number(a.match(/\d+/)[0]);
      const nb = Number(b.match(/\d+/)[0]);
      return na - nb;
    });

  const chapters = files.map((f) => {
    const fullPath = path.join(dir, f);
    const md = fs.readFileSync(fullPath, 'utf8');
    return parseChapter(md, f);
  });

  process.stdout.write(JSON.stringify(chapters, null, 2));
}

if (require.main === module) {
  main();
}

module.exports = { parseChapter, parseFinalComparativeVerdict };
