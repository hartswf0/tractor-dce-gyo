# -*- coding: utf-8 -*-
"""HTML / SVG / TeX renderers for the slipcase. Pure functions over the compiled data."""
import json, html, math, random, re

ESC = html.escape

CSS = """
:root{--ink:#1a1a1a;--paper:#fbfaf7;--rule:#d8d4cc;--dim:#6b6660;--link:#1f4e79;--ghost:#8a3b12;--plat:#3d6b35}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.45 Georgia,'Times New Roman',serif}
a{color:var(--link);text-decoration:none}a:hover{text-decoration:underline}
header{padding:12px 18px;border-bottom:1px solid var(--rule);display:flex;gap:14px;align-items:baseline;flex-wrap:wrap}
header h1{font-size:17px;margin:0;font-weight:normal;letter-spacing:.02em}
header .cp{color:var(--dim);font-size:12px}
nav.modes{display:flex;gap:2px;flex-wrap:wrap;padding:6px 14px;border-bottom:1px solid var(--rule)}
nav.modes button{font:13px Georgia,serif;background:none;border:1px solid transparent;padding:4px 9px;cursor:pointer;color:var(--ink)}
nav.modes button.on{border-color:var(--rule);background:#fff}
#search{font:14px Georgia,serif;padding:5px 8px;border:1px solid var(--rule);width:min(420px,90vw);background:#fff}
main{display:grid;grid-template-columns:minmax(0,1fr);gap:0}
@media(min-width:900px){main.two{grid-template-columns:320px minmax(0,1fr)}}
.pane{padding:14px 18px;min-width:0}
.list .row{padding:5px 0;border-bottom:1px dotted var(--rule);cursor:pointer;display:grid;grid-template-columns:38px 1fr;gap:8px}
.list .row:hover{background:#fff}
.list .row .n{color:var(--dim);font-size:12px}
.list .row .t{font-size:14px}
.list .row .id{font:11px ui-monospace,Menlo,monospace;color:var(--dim)}
pre.payload{white-space:pre-wrap;font:13px/1.4 ui-monospace,Menlo,Consolas,monospace;background:#fff;border:1px solid var(--rule);padding:14px;margin:8px 0;overflow-x:auto}
.meta{font-size:13px;color:var(--dim);margin:4px 0}
.chip{display:inline-block;font:12px ui-monospace,monospace;border:1px solid var(--rule);padding:1px 6px;margin:2px 3px 2px 0;background:#fff;cursor:pointer}
.chip.ghost{border-color:var(--ghost);color:var(--ghost)}
.chip.plat{border-color:var(--plat);color:var(--plat)}
.chip.z{color:var(--link)}
h2{font-size:15px;font-weight:normal;margin:16px 0 6px;letter-spacing:.03em;text-transform:uppercase;color:var(--dim)}
h3{font-size:16px;font-weight:normal;margin:14px 0 4px}
.actions button{font:12px Georgia,serif;background:#fff;border:1px solid var(--rule);padding:3px 8px;cursor:pointer;margin-right:4px}
table{border-collapse:collapse;font-size:13px;margin:8px 0;max-width:100%}
td,th{border-bottom:1px solid var(--rule);padding:3px 8px 3px 0;text-align:left;vertical-align:top}
th{font-weight:normal;color:var(--dim)}
.wrap{overflow-x:auto}
.bib{font:12px ui-monospace,monospace;white-space:pre-wrap;background:#fff;border:1px solid var(--rule);padding:8px;margin:4px 0}
.cmp{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:900px){.cmp{grid-template-columns:1fr}}
.mark{position:fixed;right:10px;bottom:8px;opacity:.35;width:26px;height:26px}
.section{border-top:1px solid var(--rule);padding:16px 18px}
.section p{max-width:70ch}
.small{font-size:12px;color:var(--dim)}
svg.net{width:100%;height:auto;background:#fff;border:1px solid var(--rule)}
svg.net text{font:9px Georgia,serif;pointer-events:none}
svg.net circle{cursor:pointer}
.dim{color:var(--dim)}
"""

MARK_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="#333" stroke-width="2.2" stroke-linecap="round">
  <circle cx="31" cy="34" r="2.6" fill="#333" stroke="none"/>
  <path d="M22 44 a13 13 0 0 1 0 -20"/>
  <path d="M15 51 a22 22 0 0 1 -1 -33"/>
  <path d="M41 24 a13 13 0 0 1 1 19"/>
  <path d="M27 40 q4 3 8 0" stroke-width="1.4" opacity=".55"/>
</svg>
"""

def reader_js():
    # one reader used by index.html and READER.html; data injected as window.SLIP
    return r"""
(function(){
const D=window.SLIP; const Z=D.zettels; const byId={}; Z.forEach(z=>byId[z.id]=z);
const byOrder={}; Z.forEach(z=>byOrder[z.order]=z);
const ghosts={}; D.nodes.filter(n=>n.type==='GHOST').forEach(g=>ghosts[g.name]=g);
const plats={}; D.nodes.filter(n=>n.type==='PLATFORM').forEach(p=>plats[p.name]=p);
const inbound={}; D.relations.forEach(r=>{ if(r.target_type==='ZETTEL'&&r.resolved){ (inbound[r.target]=inbound[r.target]||[]).push(r);} });
const state={mode:'DECK',cur:null,pins:[],trail:[],q:''};
try{ const s=JSON.parse(localStorage.getItem('slip.state')||'{}'); Object.assign(state,{pins:s.pins||[],trail:s.trail||[]}); }catch(e){}
function save(){ try{localStorage.setItem('slip.state',JSON.stringify({pins:state.pins,trail:state.trail}));}catch(e){} }
const $=s=>document.querySelector(s); const el=(t,a,h)=>{const e=document.createElement(t); if(a)Object.entries(a).forEach(([k,v])=>e.setAttribute(k,v)); if(h!=null)e.innerHTML=h; return e;};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function chip(addr){ if(byId[addr]) return `<span class="chip z" data-go="${esc(addr)}">${esc(addr)}</span>`; if(plats[addr]) return `<span class="chip plat" data-plat="${esc(addr)}">${esc(addr)}</span>`; return `<span class="chip ghost" data-ghost="${esc(addr)}">${esc(addr)}</span>`; }
function cardRow(z){ return `<div class="row" data-go="${esc(z.id)}"><div class="n">${String(z.order).padStart(3,'0')}</div><div><div class="t">${esc(z.title||'')}</div><div class="id">${esc(z.id)} · ${esc(z.platforms.join(', '))}</div></div></div>`; }
function match(z,q){ if(!q) return true; q=q.toLowerCase(); return (z.payload+' '+z.filename).toLowerCase().includes(q); }
function render(){
  document.querySelectorAll('nav.modes button').forEach(b=>b.classList.toggle('on',b.dataset.mode===state.mode));
  const main=$('main'); main.className=''; main.innerHTML='';
  const left=el('div',{class:'pane list'}), right=el('div',{class:'pane'});
  const phone=window.innerWidth<900;
  if(state.mode==='DECK'){ main.className='two'; left.innerHTML=`<div class="meta">${Z.filter(z=>match(z,state.q)).length} of ${Z.length} cards</div>`+Z.filter(z=>match(z,state.q)).map(cardRow).join(''); main.appendChild(left); if(!phone||state.cur){ right.innerHTML=state.cur?cardView(byId[state.cur]):'<p class="dim">Pick a card. Search matches the exact payload text.</p>'; main.appendChild(right);} }
  else if(state.mode==='READ'){ main.className='two'; const z=byId[state.cur]||Z[0]; state.cur=z.id; left.innerHTML='<h2>Neighbourhood</h2>'+neighbourhood(z); main.appendChild(left); right.innerHTML=cardView(z); main.appendChild(right); }
  else if(state.mode==='GRAPH'){ right.innerHTML='<div class="meta">Every node in the field. Zettels blue, platforms green, ghosts rust. Click a zettel to read it.</div>'+D.network_svg; main.appendChild(right); }
  else if(state.mode==='SOURCES'){ right.innerHTML='<h2>Resources</h2>'+D.resources.map(r=>`<div class="row" style="display:block;padding:6px 0;border-bottom:1px dotted var(--rule)"><b>${esc(r.name)}</b> <span class="small">${esc(r.type)} · ${esc(r.state)}${r.local?' · <a href="'+esc(r.local)+'">'+esc(r.local)+'</a>':''}${r.url?' · <a href="'+esc(r.url)+'">'+esc(r.url)+'</a>':''}</span><div class="small">${esc(r.note||'')}${r.used_by&&r.used_by.length?' · used by '+esc(r.used_by.join(', ')):''}</div>${r.body?'<details><summary class="small">body ('+r.body.length+' chars)</summary><pre class="payload">'+esc(r.body)+'</pre></details>':''}</div>`).join(''); main.appendChild(right); }
  else if(state.mode==='BIBLIOGRAPHY'){ right.innerHTML='<h2>Bibliography</h2>'+D.bibliography.map(w=>`<div style="padding:6px 0;border-bottom:1px dotted var(--rule)"><b>${esc(w.citation)}</b> <span class="small">[${esc(w.key)}] · ${esc(w.klass)} · cards ${w.cards.map(o=>String(o).padStart(3,'0')).join(', ')}${w.doi?' · <a href="https://doi.org/'+esc(w.doi)+'">doi:'+esc(w.doi)+'</a>':''}${w.url?' · <a href="'+esc(w.url)+'">'+esc(w.url)+'</a>':''}</span> <button class="chip" data-copy="${esc(w.key)}">copy BibTeX</button><details><summary class="small">raw</summary><div class="bib">${esc(w.raw)}</div></details></div>`).join(''); main.appendChild(right); }
  else if(state.mode==='GHOSTS'){ right.innerHTML='<h2>Ghosts — unfinished addresses</h2><div class="meta">Named, linked to, not present. Each holds a place.</div>'+D.nodes.filter(n=>n.type==='GHOST').map(g=>`<div style="padding:6px 0;border-bottom:1px dotted var(--rule)"><span class="chip ghost">${esc(g.name)}</span> <span class="small">×${g.count} · first in card ${String(g.first_order).padStart(3,'0')} · fields ${esc(g.fields.join(', '))}</span><div>${g.sources.map(o=>`<span class="chip z" data-go="${esc(byOrder[o].id)}">${String(o).padStart(3,'0')}</span>`).join('')}</div></div>`).join(''); main.appendChild(right); }
  else if(state.mode==='MOCS'){ right.innerHTML='<h2>Maps of content (interpretation)</h2>'+D.mocs.map(m=>`<h3>${esc(m.id)} — ${esc(m.title)}</h3><p class="small">${esc(m.note||'')}</p><div>${m.orders.map(o=>byOrder[o]?`<div class="row" data-go="${esc(byOrder[o].id)}"><div class="n">${String(o).padStart(3,'0')}</div><div class="t">${esc(byOrder[o].title)}</div></div>`:'').join('')}</div>`).join('')+'<h2>Arrangements (trails)</h2>'+D.arrangements.map(m=>`<h3>${esc(m.id)} — ${esc(m.title)}</h3><p class="small">${esc(m.note||'')}</p><div>${m.orders.map(o=>byOrder[o]?`<div class="row" data-go="${esc(byOrder[o].id)}"><div class="n">${String(o).padStart(3,'0')}</div><div class="t">${esc(byOrder[o].title)}</div></div>`:'').join('')}</div>`).join(''); main.appendChild(right); }
  else if(state.mode==='TRAIL'){ const t=state.trail.map(id=>byId[id]).filter(Boolean); const p=state.pins.map(id=>byId[id]).filter(Boolean); right.innerHTML='<h2>Pinned</h2>'+(p.length?p.map(cardRow).join(''):'<p class="dim">Pin cards from READ. Two pins compare side by side below.</p>')+(p.length>=2?'<h2>Compare</h2><div class="cmp"><pre class="payload">'+esc(p[0].payload)+'</pre><pre class="payload">'+esc(p[1].payload)+'</pre></div>':'')+'<h2>Trail (your provisional composition)</h2>'+(t.length?t.map(cardRow).join('')+'<div class="actions"><button data-act="cleartrail">clear trail</button></div>':'<p class="dim">Every card you open is added here, in order.</p>'); main.appendChild(right); }
  main.querySelectorAll('[data-go]').forEach(e=>e.addEventListener('click',ev=>{ev.stopPropagation(); go(e.dataset.go);}));
  main.querySelectorAll('[data-plat]').forEach(e=>e.addEventListener('click',()=>{state.q=e.dataset.plat; $('#search').value=state.q; state.mode='DECK'; render();}));
  main.querySelectorAll('[data-ghost]').forEach(e=>e.addEventListener('click',()=>{state.mode='GHOSTS'; render();}));
  main.querySelectorAll('[data-copy]').forEach(e=>e.addEventListener('click',()=>{const w=D.bibliography.find(x=>x.key===e.dataset.copy); try{navigator.clipboard.writeText(w.raw); e.textContent='copied';}catch(x){ prompt('BibTeX', w.raw);} }));
  main.querySelectorAll('[data-act]').forEach(e=>e.addEventListener('click',()=>{ const a=e.dataset.act; if(a==='pin'){ const id=state.cur; if(state.pins.includes(id)) state.pins=state.pins.filter(x=>x!==id); else state.pins=[id].concat(state.pins).slice(0,4); save(); render(); } if(a==='cleartrail'){state.trail=[]; save(); render();} if(a==='surprise'){ go(Z[Math.floor(Math.random()*Z.length)].id);} }));
  main.querySelectorAll('svg.net circle[data-id]').forEach(c=>c.addEventListener('click',()=>go(c.dataset.id)));
}
function neighbourhood(z){ const out=(z.addresses||[]).map(a=>a.literal); const inn=(inbound[z.id]||[]).map(r=>r.source); const uniq=a=>Array.from(new Set(a)); return '<div class="meta">outward</div>'+uniq(out).map(chip).join('')+'<div class="meta">backlinks</div>'+(uniq(inn).map(id=>`<span class="chip z" data-go="${esc(id)}">${esc(id)}</span>`).join('')||'<span class="dim">none in this field</span>'); }
function cardView(z){ const pinned=state.pins.includes(z.id); return `<div class="meta">card ${String(z.order).padStart(3,'0')} · <span style="font-family:ui-monospace,monospace">${esc(z.filename)}</span></div><div class="meta">sha256 ${esc(z.sha256)} · ${z.bytes} bytes · ${esc(z.form)} · batch ${z.batch}</div><div class="actions"><button data-act="pin">${pinned?'unpin':'pin'}</button><button data-act="surprise">surprise</button></div><pre class="payload">${esc(z.payload)}</pre><h2>Platform</h2>${z.platforms.map(chip).join('')||'<span class="dim">none</span>'}<h2>Links</h2>${z.links.map(chip).join('')||'<span class="dim">none</span>'}<h2>Every address in this card</h2>${(z.addresses||[]).map(a=>chip(a.literal)+`<span class="small"> ${esc(a.field)}#${a.ordinal}</span> `).join('')}<h2>Backlinks</h2>${(inbound[z.id]||[]).map(r=>`<span class="chip z" data-go="${esc(r.source)}">${esc(r.source)}</span><span class="small"> ${esc(r.field)}</span> `).join('')||'<span class="dim">none in this field</span>'}<h2>Sources in this card</h2>${z.citekeys.map(k=>`<span class="chip" data-copy="${esc(k)}">${esc(k)} ⧉</span>`).join('')||'<span class="dim">none</span>'}`; }
function go(id){ if(!byId[id]) return; state.cur=id; if(state.trail[state.trail.length-1]!==id) state.trail.push(id); save(); if(state.mode!=='DECK'||window.innerWidth<900) state.mode='READ'; render(); location.hash=encodeURIComponent(id); }
document.querySelectorAll('nav.modes button').forEach(b=>b.addEventListener('click',()=>{state.mode=b.dataset.mode; render();}));
$('#search').addEventListener('input',e=>{state.q=e.target.value; state.mode='DECK'; render();});
const h=decodeURIComponent(location.hash.slice(1)); if(h&&byId[h]){ state.cur=h; state.mode='READ'; }
else if(window.innerWidth<900){ state.mode='READ'; state.cur=Z[0].id; }
render();
})();
"""

def reader_shell(data_json, checkpoint, title, extra_sections_html='', with_nav_extra=''):
    modes = ['DECK','READ','GRAPH','SOURCES','BIBLIOGRAPHY','GHOSTS','MOCS','TRAIL']
    nav = ''.join(f'<button data-mode="{m}">{m}</button>' for m in modes)
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{ESC(title)}</title><style>{CSS}</style></head>
<body><header><h1>{ESC(title)}</h1><span class="cp">{ESC(checkpoint)}</span><input id="search" placeholder="search exact payload text…"></header>
<nav class="modes">{nav}{with_nav_extra}</nav>
<main></main>
{extra_sections_html}
<div class="mark" title="Working Paper · AI-augmented research process · Evidence, prompts, and making history preserved">{MARK_SVG}</div>
<script>window.SLIP={data_json};</script>
<script>{reader_js()}</script>
</body></html>"""

# ───────────────────────────────────────────── network layout (pure python)
def layout(nodes, edges, seed=7, iters=320, w=1400, h=1000):
    rnd = random.Random(seed)
    idx = {n['key']: i for i, n in enumerate(nodes)}
    n = len(nodes)
    pos = [[rnd.uniform(60, w-60), rnd.uniform(60, h-60)] for _ in range(n)]
    adj = [[] for _ in range(n)]
    for a, b in edges:
        if a in idx and b in idx and a != b:
            adj[idx[a]].append(idx[b]); adj[idx[b]].append(idx[a])
    k = math.sqrt((w*h)/max(n,1)) * 0.75
    t = w/8
    for it in range(iters):
        disp = [[0.0,0.0] for _ in range(n)]
        for i in range(n):
            xi, yi = pos[i]
            for j in range(i+1, n):
                dx = xi-pos[j][0]; dy = yi-pos[j][1]; d2 = dx*dx+dy*dy+0.01; d = math.sqrt(d2)
                f = k*k/d
                disp[i][0] += dx/d*f; disp[i][1] += dy/d*f; disp[j][0] -= dx/d*f; disp[j][1] -= dy/d*f
        for i in range(n):
            for j in adj[i]:
                dx = pos[i][0]-pos[j][0]; dy = pos[i][1]-pos[j][1]; d = math.sqrt(dx*dx+dy*dy)+0.01
                f = d*d/k
                disp[i][0] -= dx/d*f; disp[i][1] -= dy/d*f
        for i in range(n):
            dx, dy = disp[i]; d = math.sqrt(dx*dx+dy*dy)+0.01
            m = min(d, t)
            pos[i][0] = min(w-30, max(30, pos[i][0] + dx/d*m)); pos[i][1] = min(h-30, max(30, pos[i][1] + dy/d*m))
        t = max(1.5, t*0.97)
    out = {nodes[i]['key']: pos[i] for i in range(n)}
    # post-pass: single-member platforms sit beside their member; ghosts sit near the centroid of their sources
    zpos = {nd['name']: out[nd['key']] for nd in nodes if nd['type'] == 'ZETTEL'}
    byorder = {nd['order']: nd['name'] for nd in nodes if nd['type'] == 'ZETTEL'}
    for i, nd in enumerate(nodes):
        if nd['type'] == 'PLATFORM' and len(nd.get('members', [])) == 1 and byorder.get(nd['members'][0]) in zpos:
            x, y = zpos[byorder[nd['members'][0]]]; a = rnd.uniform(0, 6.283)
            out[nd['key']] = [min(w-30, max(30, x + 34*math.cos(a))), min(h-30, max(30, y + 34*math.sin(a)))]
        elif nd['type'] == 'GHOST' and nd.get('sources'):
            pts = [zpos[byorder[o]] for o in nd['sources'] if byorder.get(o) in zpos]
            if pts:
                cx = sum(p[0] for p in pts)/len(pts); cy = sum(p[1] for p in pts)/len(pts); a = rnd.uniform(0, 6.283)
                out[nd['key']] = [min(w-30, max(30, cx + 22*math.cos(a))), min(h-30, max(30, cy + 22*math.sin(a)))]
    return out

def network_svg(nodes, edges, pos, checkpoint, w=1400, h=1000, interactive=False):
    col = {'ZETTEL':'#1f4e79','PLATFORM':'#3d6b35','GHOST':'#8a3b12'}
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" class="net" width="{w}" height="{h}" font-family="Georgia, serif" font-size="9">',
           f'<rect width="{w}" height="{h}" fill="#fff"/>',
           f'<text x="14" y="18" font-size="12" fill="#666">{ESC(checkpoint)} — {len([n for n in nodes if n["type"]=="ZETTEL"])} zettels · {len([n for n in nodes if n["type"]=="PLATFORM"])} platforms · {len([n for n in nodes if n["type"]=="GHOST"])} ghosts · {len(edges)} edges</text>']
    for a, b, kind in edges:
        if a in pos and b in pos:
            (x1,y1),(x2,y2) = pos[a], pos[b]
            out.append(f'<line x1="{x1:.0f}" y1="{y1:.0f}" x2="{x2:.0f}" y2="{y2:.0f}" stroke="{"#c9c3b8" if kind!="MEMBER_OF" else "#d9e5d6"}" stroke-width="{0.8 if kind!="MEMBER_OF" else 1.2}"/>')
    for nd in nodes:
        x, y = pos[nd['key']]; c = col.get(nd['type'], '#999'); r = 3 + min(9, nd.get('degree', 0)) * 0.6
        label = nd['label'] if len(nd['label']) <= 28 else nd['label'][:27] + '…'
        attr = f' data-id="{ESC(nd["name"])}"' if (interactive and nd['type']=='ZETTEL') else ''
        shape = f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.1f}" fill="{c}" fill-opacity="{0.9 if nd["type"]=="ZETTEL" else 0.6}"{attr}><title>{ESC(nd["name"])}</title></circle>' if nd['type']!='GHOST' else f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.1f}" fill="none" stroke="{c}" stroke-dasharray="2 2"{attr}><title>{ESC(nd["name"])}</title></circle>'
        out.append(shape)
        out.append(f'<text x="{x+r+2:.0f}" y="{y+3:.0f}" fill="{c}">{ESC(label)}</text>')
    out.append(f'<text x="14" y="{h-10}" font-size="10" fill="#888">solid = zettel · pale = platform · dashed = ghost · node size = degree · edges: LINKS_TO / WIKILINKS_TO grey, MEMBER_OF green</text>')
    out.append('</svg>')
    return '\n'.join(out)

def cards_html(zettels, checkpoint):
    cards = ''.join(f'<section class="card"><div class="hd"><span>{str(z["order"]).zfill(3)}</span><span>{ESC(z["id"])}</span></div><div class="ttl">{ESC(z["title"] or "")}</div><pre>{ESC(z["payload"])}</pre><div class="ft">{ESC(checkpoint)} · {ESC(z["sha256"][:12])}</div></section>' for z in zettels)
    return f"""<!doctype html><html><head><meta charset="utf-8"><title>CARDS — {ESC(checkpoint)}</title><style>
body{{font:9.5px/1.3 Georgia,serif;margin:0;background:#fff;color:#111}}
.ctl{{padding:10px;border-bottom:1px solid #ccc;font-size:13px}} @media print{{.ctl{{display:none}}}}
.card{{width:6in;height:4in;padding:.22in .28in;border:1px solid #bbb;margin:8px;overflow:hidden;page-break-after:always;break-after:page;display:flex;flex-direction:column;position:relative}}
body.small .card{{width:5in;height:3in;font-size:8px}}
.hd{{display:flex;justify-content:space-between;font:9px ui-monospace,monospace;color:#555}}
.ttl{{font-size:12px;margin:3px 0 4px}} body.small .ttl{{font-size:10.5px}}
pre{{white-space:pre-wrap;font:7.4px/1.25 ui-monospace,monospace;margin:0;overflow:hidden;flex:1}} body.small pre{{font-size:6.4px}}
.ft{{font:7px ui-monospace,monospace;color:#777;text-align:right;margin-top:2px}}
@page{{margin:6mm}}
</style></head><body><div class="ctl">{len(zettels)} cards · 4×6 in (default). <label><input type="checkbox" onchange="document.body.classList.toggle('small',this.checked)"> 3×5 in</label> · Print with the browser; each card is one page. Long payloads are clipped at the card edge (the root .txt is the full payload).</div>{cards}</body></html>"""

def bibliography_html(works, checkpoint):
    rows = []
    for w in works:
        m = f'[{ESC(w["key"])}] · {ESC(w["klass"])} · cards {", ".join(str(o).zfill(3) for o in w["cards"])}'
        if w.get('doi'): m += f' · <a href="https://doi.org/{ESC(w["doi"])}">doi:{ESC(w["doi"])}</a>'
        if w.get('url'): m += f' · <a href="{ESC(w["url"])}">{ESC(w["url"])}</a>'
        if w.get('local'): m += f' · local: <a href="{ESC(w["local"])}">{ESC(w["local"])}</a>'
        var = f'<div class="m">variants: {len(w["variants"])} — {ESC(w.get("variant_note",""))}</div>' if len(w.get('variants', [])) > 1 else ''
        rows.append(f'<div class="w"><div class="c">{ESC(w["citation"])}</div><div class="m">{m}</div><details><summary>raw BibTeX</summary><pre>{ESC(w["raw"])}</pre></details>{var}</div>')
    rows = ''.join(rows)
    return f"""<!doctype html><html><head><meta charset="utf-8"><title>BIBLIOGRAPHY — {ESC(checkpoint)}</title><style>body{{font:14px/1.45 Georgia,serif;max-width:80ch;margin:24px auto;padding:0 16px;color:#111;background:#fbfaf7}} .w{{padding:8px 0;border-bottom:1px solid #ddd}} .c{{font-size:14px}} .m{{font-size:12px;color:#666}} pre{{font:11px ui-monospace,monospace;white-space:pre-wrap;background:#fff;border:1px solid #ddd;padding:6px}} summary{{font-size:12px;color:#666;cursor:pointer}}</style></head><body><h1 style="font-weight:normal;font-size:18px">Bibliography — {ESC(checkpoint)}</h1><p class="m">{len(works)} works. Classes: UNIQUE (one card) · SHARED (several cards, same entry) · BIB-CONFLICT (same key, differing fields) · BIB-ALIAS (different keys, same title) · NEEDS-CITATION · UNRESOLVED-BIBLIOGRAPHY. Return path: 000__RETURN_PATH.txt.</p>{rows}</body></html>"""

# ───────────────────────────────────────────── paper
def _cite_html(text, keymap):
    def rep(m):
        keys = [k.strip().lstrip('@') for k in m.group(1).split(';')]
        return '[' + ', '.join(f'<a href="#ref-{ESC(k)}">{keymap.get(k, "?")}</a>' for k in keys) + ']'
    return re.sub(r'\[@([^\]]+)\]', rep, text)

def _cite_tex(text):
    def rep(m):
        keys = [k.strip().lstrip('@') for k in m.group(1).split(';')]
        return '\\cite{' + ','.join(keys) + '}'
    return re.sub(r'\[@([^\]]+)\]', rep, text)

def tex_escape(s):
    return (s.replace('\\', '\\textbackslash{}').replace('&', '\\&').replace('%', '\\%').replace('$', '\\$').replace('#', '\\#').replace('_', '\\_').replace('{', '\\{').replace('}', '\\}').replace('~', '\\textasciitilde{}').replace('^', '\\textasciicircum{}')
            .replace('×', '$\\times$').replace('→', '$\\rightarrow$').replace('–', '--').replace('—', '---').replace('≤', '$\\leq$').replace('≥', '$\\geq$').replace('·', '$\\cdot$').replace('“', '``').replace('”', "''").replace('’', "'").replace('‘', '`'))

def paper_html(P, sections, works_by_key, tables_html, figures_html, appendices, mark_svg):
    keymap = {}
    order = []
    for _, ps in sections:
        for p in ps:
            for m in re.finditer(r'\[@([^\]]+)\]', p):
                for k in m.group(1).split(';'):
                    k = k.strip().lstrip('@')
                    if k not in keymap: keymap[k] = len(keymap) + 1; order.append(k)
    body = []
    for head, ps in sections:
        body.append(f'<h2>{ESC(head)}</h2>')
        for p in ps:
            if p.startswith('{TABLE:'): body.append(tables_html[p[7:-1]])
            elif p.startswith('{FIGURE:'): body.append(figures_html[p[8:-1]])
            else:
                m = re.match(r'^(\d\.\d) (.+?)\. ', p)
                if m: body.append(f'<p><span class="sub">{ESC(m.group(1))} {ESC(m.group(2))}.</span> {_cite_html(ESC(p[m.end():]), keymap)}</p>')
                else: body.append(f'<p>{_cite_html(ESC(p), keymap)}</p>')
    refs = ''.join(f'<li id="ref-{ESC(k)}">{ESC(works_by_key[k]["citation"]) if k in works_by_key else ESC(k)} <span class="key">[{ESC(k)}]</span></li>' for k in order)
    apps = ''.join(f'<h2>{ESC(t)}</h2>' + ''.join(f'<p>{ESC(x)}</p>' if not x.startswith("<") else x for x in ps) for t, ps in appendices)
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><title>{ESC(P['title'])}</title><style>
@page{{size:A4;margin:22mm 20mm}}
body{{font:11pt/1.42 Georgia,'Times New Roman',serif;color:#111;max-width:172mm;margin:0 auto;padding:0 4mm;background:#fff}}
h1{{font-size:20pt;font-weight:normal;margin:0 0 2pt;line-height:1.15}}
.sub{{font-style:italic}} h1+.subtitle{{font-size:12.5pt;font-style:italic;margin:0 0 10pt}}
.author{{font-size:10.5pt;margin:0}} .status{{font-size:9pt;color:#555;margin:2pt 0 14pt}}
h2{{font-size:12pt;font-weight:normal;letter-spacing:.02em;margin:16pt 0 6pt;border-bottom:1px solid #ccc;padding-bottom:2pt}}
p{{margin:0 0 7pt;text-align:justify;hyphens:auto}} .abstract{{font-size:10pt;margin:0 0 6pt;padding:6pt 10pt;border-left:2px solid #ccc}}
.kw{{font-size:9.5pt;color:#444;margin-bottom:8pt}}
table{{border-collapse:collapse;font-size:8.6pt;margin:6pt 0 8pt;width:100%}} td,th{{border-bottom:1px solid #ccc;padding:2pt 5pt 2pt 0;text-align:left;vertical-align:top}} th{{font-weight:normal;color:#444}}
td.n,th.n{{text-align:right}} caption{{caption-side:bottom;font-size:8.6pt;color:#444;text-align:left;padding-top:3pt}}
figure{{margin:8pt 0 10pt;page-break-inside:avoid}} figure img{{width:100%;border:1px solid #ddd}} figcaption{{font-size:8.6pt;color:#444;margin-top:3pt}}
.figrow{{display:flex;gap:6pt}} .figrow img{{flex:1 1 0;min-width:0;width:32%}}
ol.refs{{font-size:9.5pt;padding-left:18pt}} ol.refs li{{margin-bottom:3pt}} .key{{color:#777;font-size:8.5pt}}
.colophon{{font-size:8.5pt;color:#666;margin-top:20pt;border-top:1px solid #ccc;padding-top:6pt;display:flex;justify-content:space-between;align-items:flex-end}}
.colophon svg{{width:22px;height:22px;opacity:.5}}
a{{color:#111;text-decoration:none}}
</style></head><body>
<h1>{ESC(P['title'])}</h1><div class="subtitle">{ESC(P['subtitle'])}</div>
<p class="author">{ESC(P['author'])}</p><p class="status">{ESC(P['status'])} · {ESC(P['date'])}</p>
<p class="abstract"><b>Abstract.</b> {ESC(P['abstract'])}</p>
<p class="kw"><b>Keywords:</b> {ESC(', '.join(P['keywords']))}</p>
{''.join(body)}
<h2>References</h2><ol class="refs">{refs}</ol>
{apps}
<div class="colophon"><div>Working Paper · AI-augmented research process · Evidence, prompts, and making history preserved.<br>Package: {ESC(P['package'])} · Return path: 000__RETURN_PATH.txt · Transmission imprint: COOL RADIO</div><div>{mark_svg}</div></div>
</body></html>"""

def paper_tex(P, sections, works_by_key, tables_tex, figures_tex, appendices):
    order = []
    for _, ps in sections:
        for p in ps:
            for m in re.finditer(r'\[@([^\]]+)\]', p):
                for k in m.group(1).split(';'):
                    k = k.strip().lstrip('@')
                    if k not in order: order.append(k)
    body = []
    for head, ps in sections:
        body.append('\\section*{' + tex_escape(head) + '}')
        for p in ps:
            if p.startswith('{TABLE:'): body.append(tables_tex[p[7:-1]])
            elif p.startswith('{FIGURE:'): body.append(figures_tex[p[8:-1]])
            else:
                m = re.match(r'^(\d\.\d) (.+?)\. ', p)
                if m: body.append('\\paragraph{' + tex_escape(m.group(1) + ' ' + m.group(2)) + '.} ' + _cite_tex(tex_escape(p[m.end():])) + '\n')
                else: body.append(_cite_tex(tex_escape(p)) + '\n')
    refs = '\n'.join('\\bibitem{' + k + '} ' + tex_escape(works_by_key[k]['citation'] if k in works_by_key else k) for k in order)
    apps = '\n'.join('\\section*{' + tex_escape(t) + '}\n' + '\n\n'.join(tex_escape(x) for x in ps if not x.startswith('<')) for t, ps in appendices)
    return f"""% {P['slug']}__{P['date']}.tex — compiled from the slipcase; see {P['slug']}__SOURCE_MAP.txt
% Package: {P['package']} · Return path: 000__RETURN_PATH.txt
\\documentclass[11pt,a4paper]{{article}}
\\usepackage[utf8]{{inputenc}}\\usepackage[T1]{{fontenc}}\\usepackage{{graphicx}}\\usepackage{{booktabs}}\\usepackage[margin=22mm]{{geometry}}\\usepackage{{hyperref}}
\\title{{{tex_escape(P['title'])}\\\\\\large {tex_escape(P['subtitle'])}}}
\\author{{{tex_escape(P['author'])}}}
\\date{{{tex_escape(P['status'])}\\\\{P['date']}}}
\\begin{{document}}
\\maketitle
\\begin{{abstract}}{tex_escape(P['abstract'])}\\end{{abstract}}
\\noindent\\textbf{{Keywords:}} {tex_escape(', '.join(P['keywords']))}
{chr(10).join(body)}
\\begin{{thebibliography}}{{99}}
{refs}
\\end{{thebibliography}}
{apps}
\\vfill\\begin{{flushright}}\\footnotesize Working Paper $\\cdot$ AI-augmented research process $\\cdot$ Evidence, prompts, and making history preserved. \\includegraphics[height=14pt]{{MARK.svg}}\\end{{flushright}}
\\end{{document}}
"""
