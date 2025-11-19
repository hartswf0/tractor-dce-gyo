const fs = require('fs');
const path = require('path');

function usage() {
  console.error('Usage: node gold-to-mpd.js <gold.json> [output.mpd]');
  process.exit(1);
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    usage();
  }

  const inputPath = path.resolve(args[0]);
  let outputPath = args[1] ? path.resolve(args[1]) : null;

  if (!fs.existsSync(inputPath)) {
    console.error('Input file not found:', inputPath);
    process.exit(1);
  }

  let json;
  try {
    const raw = fs.readFileSync(inputPath, 'utf8');
    json = JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read or parse JSON:', err.message);
    process.exit(1);
  }

  const mpdContent = typeof json.mpd_content === 'string' ? json.mpd_content : null;
  if (!mpdContent || !mpdContent.trim()) {
    console.error('JSON does not contain a non-empty "mpd_content" string');
    process.exit(1);
  }

  if (!outputPath) {
    const baseName = path.basename(inputPath).replace(/\.json$/i, '');
    outputPath = path.join(path.dirname(inputPath), `${baseName}.mpd`);
  }

  try {
    fs.writeFileSync(outputPath, mpdContent, 'utf8');
  } catch (err) {
    console.error('Failed to write MPD file:', err.message);
    process.exit(1);
  }

  console.log('MPD written to', outputPath);
}

main();
