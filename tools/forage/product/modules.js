#!/usr/bin/env node
/* tools/forage/product/modules.js — the citadel of Troy as kits someone would buy: each module of the film's set (tools/forage/sets.js
   MODULES) written as its own LDraw build, odyssey/cards/set.<name>.mpd, for studio photographs and the product sheet.
     set.temple-of-athena   the temple on its stylobate, the Palladion in the cella, the altar
     set.scaean-gate       the lower wall with the gate, its two towers and the breach
     set.trojan-house      one house of the street (buy several: they stand side by side)
     set.trojan-street     three houses in a row with the market stall, the well and a dog: the vignette the citadel is made of */
'use strict';
const fs = require('fs'), path = require('path');
const S = require('../sets.js'), B = require('../build.js'), L = require('../ldraw.js');
const M = S.MODULES, rowsOf = c => B.rowsOf(c.comp || c);
function write(name, title, parts) {
  const lines = [`0 FILE ${name}.ldr`, `0 ${title}`, `0 Name: ${name}.ldr`, '0 Author: word to world, tools/forage/product/modules.js', '0 !LDRAW_ORG Unofficial_Model', ''];
  for (const r of parts) lines.push(`1 ${r.col} ${r.m.map(v => +(+v).toFixed(3)).join(' ')} ${r.part.endsWith('.dat') ? r.part : r.part + '.dat'}`);
  fs.writeFileSync(path.join(L.ROOT, 'odyssey/cards', name + '.mpd'), lines.join('\n') + '\n');
  const au = L.audit(parts); console.log(name, parts.length, 'pieces,', au.floating.length, 'touching nothing');
}
const move = (rows, dx, dz, q = 0) => rows.map(r => ({ ...r, m: L.mul(L.mul(L.T(dx * 20, 0, dz * 20), L.RY(q)), r.m) }));
/* a display base under a module: dark tan plates over its footprint, a stud beyond it all round, their tops where the module's feet are */
function onBase(rows, col = 28) {
  const xs = rows.map(r => r.m[0]), zs = rows.map(r => r.m[2]);
  const x0 = Math.floor(Math.min(...xs) / 40) * 2 - 2, x1 = Math.ceil(Math.max(...xs) / 40) * 2 + 2, z0 = Math.floor(Math.min(...zs) / 40) * 2 - 2, z1 = Math.ceil(Math.max(...zs) / 40) * 2 + 2;
  const out = []; for (let x = x0; x < x1; x += 2) for (let z = z0; z < z1; z += 8) out.push({ part: '3034', col, m: [x * 20 + 20, -8, Math.min(z + 4, z1 - 4 + 4) * 20, 0, 0, 1, 0, 1, 0, -1, 0, 0] });
  return [...out, ...rows];
}
write('set.temple-of-athena', 'The Temple of Athena', onBase(rowsOf(M.templeOfAthena())));
write('set.scaean-gate', 'The Scaean Gate', onBase(rowsOf(M.scaeanGate())));
write('set.trojan-house', 'A Trojan House', onBase(rowsOf(M.trojanHouse({ w: 14, d: 10 }))));
const floor = []; for (let x = -24; x < 24; x += 2) for (let z = -10; z < 14; z += 2) floor.push({ part: '3068b', col: (x * 3 + z * 5 + 99) % 7 ? 71 : 28, m: [x * 20 + 20, -8, z * 20 + 20, 1, 0, 0, 0, 1, 0, 0, 0, 1] });
const base = []; for (let x = -24; x < 24; x += 4) for (let z = -10; z < 14; z += 2) base.push({ part: '3001', col: 72, m: [x * 20 + 40, 0, z * 20 + 20, 1, 0, 0, 0, 1, 0, 0, 0, 1] });
const lift = rows => rows;
write('set.trojan-street', 'A Street in Troy', [...base, ...floor,
  ...lift(move(rowsOf(M.trojanHouse({ w: 14, d: 10, col: 15 })), -16, -4)), ...lift(move(rowsOf(M.trojanHouse({ w: 12, d: 10, col: 19, low: 28, dark: true })), -2, -4)),
  ...lift(move(rowsOf(M.trojanHouse({ w: 12, d: 10, col: 15, bare: true })), 11, -4)),
  ...lift(move(rowsOf(M.marketStall()), 9, 8)), ...lift(move(rowsOf(M.well()), -20, 8)),
  ...lift(move(rowsOf(S.REAL('a dog', [{ id: '92586', col: 308, x: 0, z: 0, base: -8 }])), -8, 5))]);
/* the Palace of Odysseus at Ithaca: modules built together share one frame (make() centres each build on its own footprint) */
const greatHallList = () => S.LISTS.greatHall([]), roofList = () => S.LISTS.hallRoof([]), courtList = () => S.LISTS.palaceCourt([]);
write('set.great-hall', 'The Great Hall of Odysseus (east wall lifted out)', onBase(rowsOf(M.greatHallOpen())));
write('set.great-hall-roofed', 'The Great Hall of Odysseus, roofed', onBase(rowsOf(S.REAL('the hall roofed', [...greatHallList(), ...roofList()]))));
write('set.palace-court', 'The Court of the Palace', onBase(rowsOf(M.palaceCourt())));
write('set.storeroom', 'The Storeroom', onBase(rowsOf(M.storeroom())));
write('set.penelope-chamber', "Penelope's Chamber", onBase(rowsOf(M.penelopeChamber())));
write('set.palace-of-odysseus', 'The Palace of Odysseus', onBase(rowsOf(S.REAL('the palace', [...greatHallList(), ...courtList()]))));
