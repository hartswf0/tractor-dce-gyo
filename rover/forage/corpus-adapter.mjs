import { SOURCE_PRIORITY } from './forage-engine.mjs';

const uniq = (xs = []) => [...new Set(xs.filter(Boolean))];

export function normalizeCorpus(input, source) {
  if (!SOURCE_PRIORITY[source]) throw new Error(`ROVER CORPUS: unknown source ${source}`);
  const rows = Array.isArray(input) ? input : (input?.entries || input?.assets || input?.models || []);

  return rows.map((row, index) => Object.freeze({
    id: row.id || row.name || `${source.toLowerCase()}-${index + 1}`,
    source,
    assetRef: row.assetRef || row.path || row.file || row.url || null,
    name: row.name || row.title || row.id || null,
    tags: uniq([...(row.tags || []), ...(row.keywords || []), ...(row.categories || [])]),
    affordances: uniq(row.affordances || []),
    silhouette: uniq(row.silhouette || row.traits?.silhouette || []),
    attachments: uniq(row.attachments || row.traits?.attachments || []),
    cameraScales: uniq(row.cameraScales || row.traits?.cameraScales || []),
    evidence: uniq(row.evidence || []),
    raw: row,
  }));
}

export function forageQuery(target) {
  const identity = target.sourceAsset?.split('.').slice(-1)[0] || target.id;
  return Object.freeze({
    target: target.id,
    identity,
    mustSupport: [...(target.mustSupport || [])],
    referenceRoles: [...(target.referenceRoles || [])],
    terms: uniq([
      identity,
      target.id,
      ...(target.mustSupport || []),
    ]),
  });
}

export function candidateFromCorpus(target, row, scoreHints = {}) {
  return Object.freeze({
    target: target.id,
    candidate: row.id,
    source: row.source,
    assetRef: row.assetRef,
    affordances: row.affordances,
    composable: row.source === 'LDRAW_PART',
    scores: {
      semantic: scoreHints.semantic ?? 0,
      affordance: scoreHints.affordance ?? 0,
      silhouette: scoreHints.silhouette ?? 0,
      camera: scoreHints.camera ?? 0,
      continuity: scoreHints.continuity ?? 0,
      reuse: scoreHints.reuse ?? 0,
      editCost: scoreHints.editCost ?? 1,
    },
    evidence: uniq([...(row.evidence || []), ...(scoreHints.evidence || [])]),
    keep: uniq(scoreHints.keep || []),
    mayChange: uniq(scoreHints.mayChange || []),
  });
}

// Deliberately conservative lexical prefilter. It creates a candidate pool,
// never a resolution. Camera/performance scoring must still happen afterwards.
export function prefilter(target, corpus, limit = 40) {
  const query = forageQuery(target);
  const needles = query.terms.map((t) => String(t).toLowerCase().replace(/[_-]/g, ' '));

  return corpus
    .map((row) => {
      const hay = [row.id, row.name, ...(row.tags || []), ...(row.affordances || []), ...(row.silhouette || [])]
        .filter(Boolean).join(' ').toLowerCase().replace(/[_-]/g, ' ');
      const lexical = needles.reduce((n, needle) => n + (hay.includes(needle) ? 1 : 0), 0);
      const affordanceHits = query.mustSupport.filter((a) => row.affordances.includes(a)).length;
      return { row, lexical, affordanceHits };
    })
    .filter((x) => x.lexical || x.affordanceHits)
    .sort((a, b) => b.affordanceHits - a.affordanceHits || b.lexical - a.lexical || a.row.id.localeCompare(b.row.id))
    .slice(0, limit)
    .map((x) => x.row);
}
