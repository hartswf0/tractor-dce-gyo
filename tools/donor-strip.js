#!/usr/bin/env node
/* tools/donor-strip.js — a donor model without the minifigures it carries: a set is a place, and the cast is the film's.
   Drops every type-1 line whose part is a minifigure part (torsos, legs, hips, arms, hands, heads, hair and hats, and the
   accessories a figure holds), then repacks with tools/donor-pack.js.
   Usage: node tools/donor-strip.js "<model file in ldraw/models>" ...   (rewrites the model in place; keeps <file>.figures.txt with the lines removed) */
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const root = path.join(__dirname, '..');
const FIG = /^(973[a-z0-9]*|970[a-z0-9]*|3626[a-z0-9]*|3815[a-z0-9]*|3816[a-z0-9]*|3817[a-z0-9]*|3818[a-z0-9]*|3819[a-z0-9]*|3820[a-z0-9]*|3901[a-z0-9]*|3833|3624|3629|3838|2446[a-z0-9]*|3878|3896|30381|30409|30408|48493|4497|58247|3899|4493c01|15526|15525[a-z0-9]*|15522[a-z0-9]*|15527[a-z0-9]*|16709[a-z0-9]*|76382[a-z0-9]*|16360[a-z0-9]*|10054|13750|30171|2447|3062b|4485|522|4524|3844|3846|3847|3849|4349|3959|6124|4589|100662[a-z0-9]*|15336[a-z0-9]*|47713|4229|47757)\.dat$/i;
for (const file of process.argv.slice(2)) {
  const src = path.join(root, 'ldraw', 'models', file), lines = fs.readFileSync(src, 'utf8').split(/\r?\n/), kept = [], gone = [];
  for (const l of lines) { const m = l.match(/^1\s+\S+(?:\s+-?[\d.eE+-]+){12}\s+(.+?)\s*$/); if (m && FIG.test(m[1].replace(/^parts\//i, '').replace(/\\/g, '/'))) gone.push(l); else kept.push(l); }
  fs.writeFileSync(src, kept.join('\n')); fs.writeFileSync(src.replace(/\.mpd$/i, '') + '.figures.txt', gone.join('\n') + '\n');
  execFileSync('node', [path.join(__dirname, 'donor-pack.js'), file], { stdio: 'inherit' });
  console.log(`${file}: ${gone.length} figure lines removed, ${kept.filter(l => /^1 /.test(l)).length} placements kept`);
}
