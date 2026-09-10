import fs from 'node:fs';
import path from 'node:path';

const ROOT='ldraw/parts';
const OUT='audit-output';
fs.mkdirSync(OUT,{recursive:true});

function walk(dir,out=[]){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,ent.name);if(ent.isDirectory())walk(p,out);else if(/\.dat$/i.test(ent.name))out.push(p)}return out}
function parseFile(file){const text=fs.readFileSync(file,'utf8');const lines=text.split(/\r?\n/);const description=(lines[0]||'').replace(/^0\s*/,'').trim();const meta={file:path.basename(file),path:file.replaceAll('\\','/'),description,category:null,keywords:[],org:null,name:null,history:[],refs:[]};for(const line of lines.slice(0,180)){let m;if(m=line.match(/^0\s+Name:\s*(.+)$/i))meta.name=m[1].trim();else if(m=line.match(/^0\s+!CATEGORY\s+(.+)$/i))meta.category=m[1].trim();else if(m=line.match(/^0\s+!KEYWORDS\s+(.+)$/i))meta.keywords.push(...m[1].split(',').map(s=>s.trim()).filter(Boolean));else if(m=line.match(/^0\s+!LDRAW_ORG\s+(.+)$/i))meta.org=m[1].trim();else if(m=line.match(/^0\s+!HISTORY\s+(.+)$/i))meta.history.push(m[1].trim());else if(m=line.match(/^1\s+\S+\s+(?:\S+\s+){12}(.+\.dat)\s*$/i))meta.refs.push(m[1].trim())}meta.header=lines.slice(0,40).join('\n');return meta}

function family(r){const s=`${r.description} ${r.category||''} ${r.keywords.join(' ')}`.toLowerCase();if(/\bhair\b|\bwig\b|ponytail|pigtail|braid|mohawk|quiff/.test(s))return'hair';if(/helmet/.test(s))return'helmet';if(/\bhood\b|cowl|balaclava/.test(s))return'hood';if(/crown|tiara|diadem/.test(s))return'crown-tiara';if(/headband|bandana|bandanna/.test(s))return'headband-bandana';if(/\bcap\b/.test(s))return'cap';if(/\bhat\b|sombrero|fedora|bowler|beanie|beret|stetson|cowboy/.test(s))return'hat';if(/mask/.test(s))return'mask';return'other-headwear'}
function isHeadwear(r){const s=`${r.description} ${r.category||''} ${r.keywords.join(' ')}`;return /Minifig Headwear/i.test(r.category||'')||/\bMinifig\b.*\b(Hair|Hat|Cap|Helmet|Hood|Cowl|Wig|Crown|Tiara|Headband|Bandana|Mask|Headgear|Headwear)\b/i.test(s)||/\b(Hair|Hat|Cap|Helmet|Hood|Wig|Crown|Tiara)\b.*\bMinifig\b/i.test(s)}
function clean(r){const {header,...rest}=r;return rest}

const files=walk(ROOT);console.log(`Scanning ${files.length} .dat files…`);const records=files.map(parseFile);
const usable=records.filter(r=>!r.description.startsWith('~')&&!/obsolete/i.test(r.category||'')&&!/obsolete/i.test(r.description));
const headwear=usable.filter(isHeadwear).map(r=>({...clean(r),family:family(r)}));
const counts={total:headwear.length,byFamily:{}};for(const r of headwear)counts.byFamily[r.family]=(counts.byFamily[r.family]||0)+1;
const screenTerms=/powerpuff|blossom|bubbles|buttercup|mojo jojo/i;
const p0=records.filter(r=>screenTerms.test(`${r.description} ${r.category||''} ${r.keywords.join(' ')}`));
const setIds=new Set();for(const r of p0){for(const s of `${r.keywords.join(' ')} ${r.description}`.matchAll(/\b(?:set\s*)?(\d{5,7})\b/ig))setIds.add(s[1])}
const pset=records.filter(r=>[...setIds].some(id=>`${r.description} ${r.category||''} ${r.keywords.join(' ')}`.includes(id)));
const powerpuff={direct:p0.map(clean),setIds:[...setIds].sort(),setHits:pset.map(clean)};
fs.writeFileSync(`${OUT}/headwear-index.json`,JSON.stringify({generated:new Date().toISOString(),source:ROOT,counts,records:headwear},null,2));
fs.writeFileSync(`${OUT}/powerpuff-audit.json`,JSON.stringify(powerpuff,null,2));
fs.writeFileSync(`${OUT}/headwear-summary.txt`,[`HEADWEAR ${counts.total}`,...Object.entries(counts.byFamily).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k}: ${v}`),`POWERPUFF direct: ${p0.length}`,`POWERPUFF set ids: ${[...setIds].join(', ')}`,`POWERPUFF set hits: ${pset.length}`].join('\n'));
console.log(fs.readFileSync(`${OUT}/headwear-summary.txt`,'utf8'));
