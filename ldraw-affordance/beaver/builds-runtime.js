import {BUILDS as SOURCE,BUILD_MAP as SOURCE_MAP,VOCAB_MODES} from './builds.js';

// Runtime copy: keep benchmark corrections explicit while preserving the original declarations as an audit trail.
export const BUILDS=structuredClone(SOURCE);
const starship=BUILDS.find(b=>b.id==='starship-spine');
starship.features.find(f=>f.id==='port-hardpoint').prerequisite.p=[-10,-14,-16];
starship.features.find(f=>f.id==='starboard-hardpoint').prerequisite.p=[10,-14,-16];
export const BUILD_MAP=new Map(BUILDS.map(b=>[b.id,b]));
export {VOCAB_MODES};
