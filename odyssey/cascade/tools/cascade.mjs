#!/usr/bin/env node
/* odyssey/cascade/tools/cascade.mjs — the project's Cascade CLI (0.7.1) with one fix applied as it loads.

   The CLI compiles a project node once per INSTANCE into the same .cascade-cache/nodes/<Name>.mjs, concurrently, and an instance
   can import the file while another is still writing it ("does not export execute"). A graph with several instances of a node
   (beflix.cascade has six Halfworld plates, five dissolves, five texts) then fails most runs. A module load hook rewrites the
   CLI's compileExecute as it is loaded so each module file is compiled once per process and every instance awaits that one
   compile. Nothing in node_modules is changed; arguments pass straight through:  node tools/cascade.mjs run beflix.cascade ... */
import { register } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const here = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const cli = path.join(here, 'node_modules/cascade/dist/cli/index.js');
const hook = `
export async function load(url, context, next) {
  const r = await next(url, context);
  if (!url.endsWith('/dist/cli/index.js')) return r;
  let src = typeof r.source === 'string' ? r.source : new TextDecoder().decode(r.source);
  const head = 'async function compileExecute(projectRoot, moduleFile) {';
  if (!src.includes(head)) { console.error('[cascade.mjs] compileExecute not found; running unpatched'); return r; }
  src = src.replace(head, 'const __compiled = new Map();\\nfunction compileExecute(projectRoot, moduleFile) {\\n  const k = projectRoot + "|" + moduleFile;\\n  if (!__compiled.has(k)) __compiled.set(k, compileExecuteOnce(projectRoot, moduleFile));\\n  return __compiled.get(k);\\n}\\nasync function compileExecuteOnce(projectRoot, moduleFile) {');
  return { ...r, source: src, shortCircuit: true };
}`;
register('data:text/javascript,' + encodeURIComponent(hook), import.meta.url);
/* argv[1] stays this file: the CLI re-runs argv[1] as its supervised child for a bounded run, and the child needs the fix too */
process.argv = [process.argv[0], path.resolve(process.argv[1]), ...process.argv.slice(2)];
await import(pathToFileURL(cli).href);
