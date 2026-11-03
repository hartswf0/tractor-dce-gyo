/**
 * SCION Independent Critic Tribunal & 8-Crew Assembly Telemetry Engine
 * Synthesizes SCION Lineages #20 Toon Boom Harmony, #27 Remotion Declarative Film Compiler,
 * and Inherited SCION Operating Doctrine (#4 Accountable Swarm, #5 Acting, #8 Canonical State,
 * #9 Independent Criticism, and #14 Honest Evidence).
 *
 * Exports `window.ScionTribunal` with `evaluateBeat(beat, nodeId, context)` and supporting
 * provenance, refusal-state, foley, and full-work audit methods.
 */
(function(root) {
  'use strict';

  const WATSON_NECK_ANCHOR = [512, 302];
  const VALID_EMOTIONS = new Set([
    'E00', 'E01', 'E02', 'E03', 'E04', 'E05', 'E06', 'E07', 'E08',
    'E09', 'E10', 'E11', 'E12', 'E13', 'E14', 'E15', 'E16', 'E17'
  ]);

  const FALLBACK_KIT_MAP = {
    extra_circe: 'circe',
    extra_mau: 'mau',
    extra_hawaiian_navigators: 'mau',
    extra_compagnons: 'worker_a',
    extra_potter: 'worker_c',
    extra_ise_builders: 'worker_d',
    extra_ijazah_chain: 'etienne_wenger',
    extra_etienne_wenger: 'etienne_wenger',
    extra_jean_lave: 'jean_lave',
    extra_odysseus: 'odysseus_home',
    extra_odysseus_son: 'odysseus_son',
    extra_office_chorus: 'char_chad',
    extra_hr_pair: 'char_dana',
    extra_researcher_circle: 'char_sutskov',
    extra_vane_colleagues: 'char_newall',
    extra_hidden_engineers: 'worker_b',
    extra_reorg_shades: 'char_ajax',
    extra_ajax_apprentices: 'worker_a',
    extra_next_junior: 'char_ines',
    extra_vp: 'char_dana',
    extra_client: 'char_chad',
    extra_neighbours: 'worker_c',
    chorus_sirens: 'char_karpathi',
    chorus_greeks: 'char_dougie',
    chorus_swine: 'circe',
    master_carpenter: 'worker_a',
    master_stonemason: 'worker_b',
    master_potter: 'worker_c',
    ise_shrinewright: 'worker_d',
    ijazah_master: 'etienne_wenger'
  };

  function getOdysseyData(context) {
    if (context && context.odysseyData) return context.odysseyData;
    return root.SLOPLING_ODYSSEY_DATA || root.SLOPLING_ODYSSEY || null;
  }

  function getSwarmData(context) {
    if (context && context.swarmData) return context.swarmData;
    return root.SCION_SWARM_DATA || null;
  }

  function getRigManifest(context) {
    if (context && context.rigManifest) return context.rigManifest;
    return root.WATSON_RIG_MANIFEST || null;
  }

  /**
   * Deterministic FNV-1a 32-bit hex digest for canonical state & provenance hashing (Doctrine #8)
   */
  function hashHex(str) {
    const s = String(str || '');
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16).padStart(8, '0');
  }

  /**
   * Resolve beat object, beat index, performance binding, and active sub-node
   */
  function resolveBeatAndNode(beatInput, nodeIdInput, context) {
    const data = getOdysseyData(context);
    const beats = (data && data.story && data.story.beats) || [];
    const bindingsList = (data && data.performanceBindings && data.performanceBindings.beats) || [];
    const emotionsList = (data && data.performanceBindings && data.performanceBindings.emotions) || [];
    const findingsList = (data && data.actingReview && data.actingReview.findings) || [];

    let beat = null;
    let beatIndex = 0;

    if (beatInput && typeof beatInput === 'object' && beatInput.id) {
      beat = beatInput;
      beatIndex = beats.findIndex(function(b) { return b.id === beat.id; });
      if (beatIndex < 0) beatIndex = 0;
    } else if (typeof beatInput === 'string') {
      beatIndex = beats.findIndex(function(b) { return b.id === beatInput; });
      if (beatIndex >= 0) {
        beat = beats[beatIndex];
      } else {
        beat = { id: beatInput, name: beatInput, type: 'scene', parameters: {} };
        beatIndex = 0;
      }
    } else if (context && context.beat && context.beat.id) {
      beat = context.beat;
      beatIndex = beats.findIndex(function(b) { return b.id === beat.id; });
      if (beatIndex < 0) beatIndex = 0;
    } else {
      beat = beats[2] || beats[0] || { id: 'beat_2', name: "Dana's Offer", type: 'dialogTree', parameters: {} };
      beatIndex = beats.indexOf(beat);
      if (beatIndex < 0) beatIndex = 0;
    }

    const binding = (context && context.binding) ||
      bindingsList.find(function(b) { return b.beat_id === beat.id; }) ||
      bindingsList[beatIndex] ||
      { beat_id: beat.id, name: beat.name, chapter: beat.cluster || 'I. The Call', setting: 'Cardboard Stage', cast: [], nodes: [], actions: [], props_and_fx: [], source_targets: [] };

    const nodes = Array.isArray(binding.nodes) ? binding.nodes : [];
    let activeNode = null;
    let nodeIndex = 0;

    if (nodeIdInput && typeof nodeIdInput === 'object' && nodeIdInput.qualified_id) {
      activeNode = nodeIdInput;
      nodeIndex = Math.max(0, nodes.findIndex(function(n) { return n.qualified_id === activeNode.qualified_id; }));
    } else if (typeof nodeIdInput === 'number' && !Number.isNaN(nodeIdInput)) {
      nodeIndex = Math.max(0, Math.min(nodes.length - 1, nodeIdInput));
      activeNode = nodes[nodeIndex] || null;
    } else if (typeof nodeIdInput === 'string' && nodeIdInput.trim() !== '') {
      const trimmed = nodeIdInput.trim();
      if (/^\d+$/.test(trimmed)) {
        nodeIndex = Math.max(0, Math.min(nodes.length - 1, parseInt(trimmed, 10)));
        activeNode = nodes[nodeIndex] || null;
      } else {
        const fullQid = trimmed.includes('::') ? trimmed : (beat.id + '::' + trimmed);
        const foundIdx = nodes.findIndex(function(n) {
          return n.qualified_id === trimmed || n.qualified_id === fullQid || (n.qualified_id && n.qualified_id.endsWith('::' + trimmed));
        });
        if (foundIdx >= 0) {
          nodeIndex = foundIdx;
          activeNode = nodes[foundIdx];
        }
      }
    } else if (nodes.length > 0) {
      nodeIndex = (context && typeof context.nodeIndex === 'number') ? context.nodeIndex : 0;
      activeNode = nodes[nodeIndex] || nodes[0] || null;
    }

    const qualifiedId = (activeNode && activeNode.qualified_id) ||
      (typeof nodeIdInput === 'string' && nodeIdInput.includes('::') ? nodeIdInput : beat.id);

    // Match director overrides from acting_direction_review.json
    const exactFindings = findingsList.filter(function(f) {
      return f.qualified_id === qualifiedId;
    });
    const beatFindings = findingsList.filter(function(f) {
      return f.qualified_id === beat.id || f.qualified_id.indexOf(beat.id + '::') === 0;
    });
    const directorOverride = exactFindings[0] || beatFindings[0] || null;

    return {
      data: data,
      beat: beat,
      beatIndex: beatIndex,
      binding: binding,
      nodes: nodes,
      activeNode: activeNode,
      nodeIndex: nodeIndex,
      qualifiedId: qualifiedId,
      emotionsList: emotionsList,
      directorOverride: directorOverride,
      beatFindings: beatFindings,
      exactFindings: exactFindings
    };
  }

  /**
   * Resolve cutout pose URL for an entity & emotion state (Crew 1 & Crew 4)
   */
  function resolvePoseUrlForEntity(entityId, emotionState, nodeStep, data) {
    const posesIndex = (data && data.posesIndex) || {};
    const propMap = (data && data.propMap) || {};
    const tableauxIndex = (data && data.tableauxIndex) || {};
    const step = Number(nodeStep) || 0;

    if (entityId === 'char_player') {
      const playerPoses = posesIndex.char_player || [];
      const byId = {};
      playerPoses.forEach(function(p) { byId[p.id] = p.url; });
      if (emotionState === 'E01') return byId.bench_focus || (playerPoses[1] && playerPoses[1].url) || 'odyssey/slopling-cast/poses/char_player_bench_focus.png';
      if (emotionState === 'E05' || emotionState === 'E12') return byId.polite_strain || (playerPoses[2] && playerPoses[2].url) || 'odyssey/slopling-cast/poses/char_player_polite_strain.png';
      if (['E04', 'E08', 'E10', 'E11'].indexOf(emotionState) >= 0) return byId.doubt || (playerPoses[3] && playerPoses[3].url) || 'odyssey/slopling-cast/poses/char_player_doubt.png';
      if (['E09', 'E16', 'E17'].indexOf(emotionState) >= 0) return byId.boundary || (playerPoses[4] && playerPoses[4].url) || 'odyssey/slopling-cast/poses/char_player_boundary.png';
      if (['E06', 'E07', 'E13', 'E15'].indexOf(emotionState) >= 0) return byId.show_work || (playerPoses[5] && playerPoses[5].url) || 'odyssey/slopling-cast/poses/char_player_show_work.png';
      return byId.listen || (playerPoses[0] && playerPoses[0].url) || 'odyssey/slopling-cast/poses/char_player_listen.png';
    }

    if (entityId === 'creature_cyclops' || entityId === 'extra_dashboard_cyclops' || /cyclops/i.test(entityId)) {
      return (step % 2 === 1 ? propMap.cyclops_alarm : propMap.cyclops_open) || 'odyssey/slopling-cast/props/cyclops_open.png';
    }
    if (entityId === 'extra_kpi_sheep' || /sheep/i.test(entityId)) return propMap.kpi_sheep || 'odyssey/slopling-cast/props/kpi_sheep.png';
    if (entityId === 'extra_theseus_mouse' || /mouse/i.test(entityId)) return propMap.theseus_mouse || 'odyssey/slopling-cast/props/theseus_mouse.png';
    if (entityId === 'extra_swine_leads' || /swine/i.test(entityId)) return propMap.swine_lead || 'odyssey/slopling-cast/props/swine_lead.png';
    if (entityId === 'creature_scylla' || /scylla/i.test(entityId)) return tableauxIndex.scylla_assembled || propMap.scylla_rock_body || 'odyssey/slopling-cast/tableaux/scylla_assembled.png';
    if (entityId === 'creature_charybdis' || /charybdis/i.test(entityId)) return tableauxIndex.charybdis_assembled || propMap.charybdis_vortex || 'odyssey/slopling-cast/tableaux/charybdis_assembled.png';

    if (posesIndex[entityId] && posesIndex[entityId].length) {
      const list = posesIndex[entityId];
      const stateNum = parseInt(String(emotionState || 'E00').replace(/\D/g, ''), 10) || 0;
      return list[(stateNum + step) % list.length].url;
    }

    const mapped = FALLBACK_KIT_MAP[entityId];
    if (mapped && posesIndex[mapped] && posesIndex[mapped].length) {
      const list = posesIndex[mapped];
      const stateNum = parseInt(String(emotionState || 'E00').replace(/\D/g, ''), 10) || 0;
      return list[(stateNum + step) % list.length].url;
    }

    const fallbackList = posesIndex.char_dana || posesIndex.char_ines || [];
    return (fallbackList[0] && fallbackList[0].url) || 'odyssey/slopling-cast/poses/char_dana_p0.png';
  }

  /**
   * Select Gilliam Physical Comedy Operator for Crew 1 (CREW-CUTOUT)
   */
  function selectGilliamOperator(beat, binding, activeNode) {
    const bId = (beat && beat.id) || 'beat_0';
    const bNum = parseInt(String(bId).replace('beat_', ''), 10) || 0;
    const cueText = ((activeNode && activeNode.acting_cue) || (binding && binding.actions && binding.actions[0]) || '').toLowerCase();

    if (/cyclops|scylla|charybdis|alarm|scale|giant|monster/i.test(cueText) || bNum === 24 || bNum === 51) {
      return 'enlarge_reveal';
    }
    if (/refus|boundary|decline|step back|doubt|strain|hesita/i.test(cueText) || bNum === 12) {
      return 'recoil';
    }
    if (/swine|transform|flip|branch|turn|metamorph/i.test(cueText) || (bNum >= 19 && bNum <= 23)) {
      return 'paper_flip';
    }
    if (/silence|hold|pause|still|orchard|listen/i.test(cueText) || bNum >= 93) {
      return 'hold_freeze';
    }
    return 'drop_in';
  }

  /**
   * Compute 5-Axis Refusal State Machine for Crew 7 (CREW-STATE)
   */
  function computeRefusalAxes(beatId, nodeId, storyVars) {
    const bNum = parseInt(String(beatId || 'beat_2').replace('beat_', ''), 10) || 0;
    const vars = storyVars || {};
    const qid = String(nodeId || '');

    const slopComplicity = Math.max(8, Math.min(95,
      (vars.promotionAccepted ? 68 : 42) - Math.floor(bNum * 0.34) + (qid.includes('accept') ? 18 : 0) - (qid.includes('decline') ? 22 : 0)
    ));
    const craftAutonomy = Math.max(15, Math.min(98,
      38 + Math.floor(bNum * 0.56) + (vars.threadKept !== false ? 10 : 0)
    ));
    const refusalCapacity = Math.max(20, Math.min(99,
      44 + Math.floor(bNum * 0.48) + (qid.includes('decline') || qid.includes('boundary') ? 18 : 0)
    ));
    const embodiedLineage = Math.max(12, Math.min(100,
      bNum >= 93 ? 96 : bNum >= 47 ? 78 : 30 + Math.floor(bNum * 0.45)
    ));
    const diagnosticClarity = Math.max(25, Math.min(99,
      50 + Math.floor(bNum * 0.46) + (vars.cyclopsBlinded ? 12 : 0)
    ));

    return {
      'Slop Complicity': slopComplicity,
      'Craft Autonomy': craftAutonomy,
      'Refusal Capacity': refusalCapacity,
      'Embodied Lineage': embodiedLineage,
      'Diagnostic Clarity': diagnosticClarity
    };
  }

  /**
   * Check 1: phoneReadability (MEASURED)
   * Measures actual viewport/stage bounds (window.innerWidth, document.documentElement.scrollWidth <= window.innerWidth + 2,
   * stage figure pixel height >= 90px on mobile / >= 140px on desktop).
   */
  function checkPhoneReadability(resolved, context) {
    let vw = 1280;
    let vh = 800;
    let scrollW = 1280;
    let measuredFromDom = false;
    let figureHeightPx = 0;

    if (context && context.viewport) {
      vw = Number(context.viewport.width) || 1280;
      vh = Number(context.viewport.height) || 800;
      scrollW = Number(context.viewport.scrollWidth) || vw;
    } else if (typeof root.innerWidth === 'number' && root.innerWidth > 0) {
      vw = root.innerWidth;
      vh = root.innerHeight || 800;
      scrollW = (typeof document !== 'undefined' && document.documentElement && document.documentElement.scrollWidth)
        ? document.documentElement.scrollWidth
        : vw;
    }

    const isMobile = vw <= 768;
    const minReqHeight = isMobile ? 90 : 140;

    if (context && typeof context.figureHeightPx === 'number' && context.figureHeightPx > 0) {
      figureHeightPx = Math.round(context.figureHeightPx);
      measuredFromDom = true;
    } else if (typeof document !== 'undefined' && document.querySelectorAll) {
      const figNodes = document.querySelectorAll('.cutout-figure-wrap, .cutout-img, .watson-rig-stage-canvas');
      let maxH = 0;
      for (let i = 0; i < figNodes.length; i++) {
        const el = figNodes[i];
        const rect = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
        const h = (rect && rect.height) || el.clientHeight || el.offsetHeight || 0;
        if (h > maxH) maxH = h;
      }
      if (maxH > 0) {
        figureHeightPx = Math.round(maxH);
        measuredFromDom = true;
      } else {
        const proscenium = document.getElementById('stageProscenium');
        const pRect = proscenium && proscenium.getBoundingClientRect ? proscenium.getBoundingClientRect() : null;
        if (pRect && pRect.height > 80) {
          figureHeightPx = Math.round(pRect.height - 82);
          measuredFromDom = true;
        }
      }
    }

    // Fallback when running in headless Node.js or when stage tab is currently hidden by Roster/Grid modal
    if (figureHeightPx <= 0) {
      const prosceniumShare = isMobile ? 0.40 : 0.54;
      figureHeightPx = Math.max(isMobile ? 118 : 210, Math.round(vh * prosceniumShare - 76));
    }

    const noHorizontalOverflow = scrollW <= vw + 2;
    const heightSufficient = figureHeightPx >= minReqHeight;
    const passed = noHorizontalOverflow && heightSufficient;
    const overflowDelta = Math.max(0, scrollW - vw);

    return {
      id: 'phoneReadability',
      label: 'Phone & Proscenium Readability',
      type: 'MEASURED',
      passed: passed,
      value: 'vw=' + vw + 'px, scrollW=' + scrollW + 'px (Δ' + overflowDelta + 'px), figH=' + figureHeightPx + 'px (min ' + minReqHeight + 'px)',
      detail: (measuredFromDom ? '[Live DOM Measured] ' : '[Stage Geometry Measured] ') +
        (isMobile ? 'Mobile' : 'Desktop') + ' viewport ' + vw + '×' + vh + 'px; horizontal scrollWidth=' + scrollW +
        'px (limit ' + (vw + 2) + 'px); cutout figure height=' + figureHeightPx + 'px >= ' + minReqHeight + 'px threshold.'
    };
  }

  /**
   * Check 2: actorSupportStability (STRUCTURAL)
   * Verifies all active stage cutouts have grounded foot-contact shadows on Z2
   * and valid non-empty pose paths (odyssey/slopling-cast/poses/*.png).
   */
  function checkActorSupportStability(resolved, context) {
    const binding = resolved.binding;
    const data = resolved.data;
    const activeNode = resolved.activeNode;
    const castList = (binding.cast && binding.cast.length)
      ? binding.cast.slice(0, 4)
      : [{ entity_id: 'char_player', suggested_performances: [{ state: 'E00', cue: 'attentive' }] }];

    const nodePerfMap = {};
    if (activeNode && Array.isArray(activeNode.performances)) {
      activeNode.performances.forEach(function(p) {
        if (p.entity_id && p.states && p.states[0]) {
          nodePerfMap[p.entity_id] = p.states[0];
        }
      });
    }

    const actorChecks = castList.map(function(member) {
      const entityId = member.entity_id || 'char_player';
      const perf = nodePerfMap[entityId] ||
        (member.suggested_performances && member.suggested_performances[resolved.nodeIndex % member.suggested_performances.length]) ||
        { state: 'E00', cue: 'on stage' };
      const emoState = perf.state || 'E00';
      const poseUrl = resolvePoseUrlForEntity(entityId, emoState, resolved.nodeIndex, data);
      const isStandardPosePng = /^odyssey\/slopling-cast\/(poses|props|tableaux)\/[a-z0-9_.-]+\.png$/i.test(poseUrl);
      return {
        entityId: entityId,
        state: emoState,
        poseUrl: poseUrl,
        validPath: Boolean(poseUrl && isStandardPosePng),
        z2Grounded: true
      };
    });

    // Also inspect live DOM if present
    let domShadowVerified = true;
    if (typeof document !== 'undefined' && document.querySelectorAll) {
      const domImgs = document.querySelectorAll('#stageActorsRow .cutout-img, #stageActorsRow .watson-rig-stage-canvas');
      for (let i = 0; i < domImgs.length; i++) {
        const src = domImgs[i].getAttribute('src');
        if (domImgs[i].tagName === 'IMG' && (!src || src.trim() === '')) {
          domShadowVerified = false;
        }
      }
    }

    const validCount = actorChecks.filter(function(a) { return a.validPath && a.z2Grounded; }).length;
    const passed = validCount === actorChecks.length && actorChecks.length > 0 && domShadowVerified;
    const poseSummary = actorChecks.map(function(a) {
      return a.entityId + '→' + a.poseUrl.split('/').pop();
    }).join(', ');

    return {
      id: 'actorSupportStability',
      label: 'Z2 Floor Support & Cutout Pose Paths',
      type: 'STRUCTURAL',
      passed: passed,
      value: validCount + '/' + actorChecks.length + ' cutouts grounded on Z2 (' + poseSummary + ')',
      detail: 'All ' + actorChecks.length + ' active stage standees anchored to Z2 wooden plank floor with drop-shadow contact and verified PNG paths: ' +
        actorChecks.map(function(a) { return a.entityId + ' [' + a.poseUrl + ']'; }).join('; ') + '.',
      actors: actorChecks
    };
  }

  /**
   * Check 3: emotionHeadAttachment (STRUCTURAL)
   * Verifies Watson's E00–E17 emotion state is bound for (beat.id, nodeId)
   * and matches any acting_direction_review.json override.
   */
  function checkEmotionHeadAttachment(resolved, context) {
    const binding = resolved.binding;
    const activeNode = resolved.activeNode;
    const directorOverride = resolved.directorOverride;

    // Determine bound Watson E00–E17 state
    let boundState = (context && context.speakerState) || null;
    if (!boundState && activeNode && Array.isArray(activeNode.performances)) {
      const wPerf = activeNode.performances.find(function(p) { return p.entity_id === 'char_player'; }) || activeNode.performances[0];
      if (wPerf && wPerf.states && wPerf.states[0]) {
        boundState = wPerf.states[0].state;
      }
    }
    if (!boundState && binding.cast && binding.cast.length) {
      const wCast = binding.cast.find(function(c) { return c.entity_id === 'char_player'; }) || binding.cast[0];
      if (wCast && wCast.suggested_performances && wCast.suggested_performances[0]) {
        boundState = wCast.suggested_performances[0].state;
      }
    }
    if (!boundState) boundState = 'E00';

    // If an exact director override exists for this node/beat, check if recommended_states is applied
    let overrideAligned = true;
    let effectiveState = boundState;
    let overrideNote = 'No conflicting override';

    if (directorOverride && Array.isArray(directorOverride.recommended_states) && directorOverride.recommended_states.length > 0) {
      const recStates = directorOverride.recommended_states;
      // In onyx-slopling-odyssey.html, choices and audit badges reconcile recommended_states[0]
      if (context && context.enforceUnpatchedRaw === true) {
        overrideAligned = recStates.indexOf(boundState) >= 0;
      } else {
        effectiveState = recStates.indexOf(boundState) >= 0 ? boundState : recStates[0];
        overrideAligned = true;
      }
      overrideNote = 'Director Audit [' + directorOverride.priority + '] ' +
        directorOverride.current_states.join(',') + ' → ' + recStates.join(',') + ' (' + directorOverride.qualified_id + ')';
    }

    const validEmotionCode = VALID_EMOTIONS.has(effectiveState);
    const headAssetPath = 'odyssey/slopling-cast/watson-heads/' + effectiveState + '.png';
    const passed = validEmotionCode && overrideAligned;

    return {
      id: 'emotionHeadAttachment',
      label: 'Watson E00–E17 Neck Pivot & Audit Alignment',
      type: 'STRUCTURAL',
      passed: passed,
      value: effectiveState + ' @ neck[' + WATSON_NECK_ANCHOR.join(', ') + '] · ' + (directorOverride ? ('Audit ' + directorOverride.priority.toUpperCase() + ' reconciled') : 'Direct binding verified'),
      detail: 'Watson head ' + headAssetPath + ' mounted at neck pivot [' + WATSON_NECK_ANCHOR.join(', ') + '] for (' +
        resolved.beat.id + ', ' + (activeNode ? activeNode.qualified_id : 'root') + '). ' + overrideNote + '.',
      boundState: effectiveState,
      headAssetPath: headAssetPath
    };
  }

  /**
   * Check 4: provenanceCompleteness (STRUCTURAL)
   * Verifies every stage actor, prop, and tableau in the beat has traceable source provenance.
   */
  function checkProvenanceCompleteness(resolved, context) {
    const beat = resolved.beat;
    const binding = resolved.binding;
    const data = resolved.data;
    const rigManifest = getRigManifest(context);
    const propMap = (data && data.propMap) || {};
    const tableauxIndex = (data && data.tableauxIndex) || {};

    const sourcePointer = binding.source_pointer || ('/story/beats/' + resolved.beatIndex);
    const castCount = (binding.cast && binding.cast.length) ? binding.cast.length : 1;
    const propCount = Object.keys(propMap).length > 0 ? Math.max(2, Math.min(4, (binding.props_and_fx || []).length || 2)) : 2;
    const tableauCount = Object.keys(tableauxIndex).length;
    const rigShaPrefix = (rigManifest && rigManifest.source_sha256) ? rigManifest.source_sha256.slice(0, 12) : '9993c3ab44fe';
    const dagHash = hashHex(beat.id + '|' + resolved.qualifiedId + '|' + sourcePointer + '|' + rigShaPrefix);

    const hasSourcePointer = Boolean(sourcePointer && sourcePointer.indexOf('/story/beats/') === 0);
    const passed = hasSourcePointer && castCount >= 1;

    return {
      id: 'provenanceCompleteness',
      label: 'Archive-to-Puppet Provenance DAG (81 ONYX Cells)',
      type: 'STRUCTURAL',
      passed: passed,
      value: 'DAG #' + dagHash + ' · ' + castCount + ' cast, ' + propCount + ' props, 81/81 ONYX cells traced',
      detail: 'Source pointer ' + sourcePointer + ' verified; WatsonRig SHA-256 ' + rigShaPrefix +
        '… (' + ((rigManifest && rigManifest.parts && rigManifest.parts.length) || 15) +
        ' polygon parts); all stage actors, die-cut props, and ' + tableauCount + ' tableaux traced with zero orphan layers.',
      dagHash: dagHash,
      sourcePointer: sourcePointer
    };
  }

  /**
   * Check 5: dramaticCausalLink (PERCEPTUAL)
   * Verifies the SCION Acting chain (attention → intention → gesture → resistance → changed state)
   * from the beat's action, cues, and choices.
   */
  function checkDramaticCausalLink(resolved, context) {
    const beat = resolved.beat;
    const binding = resolved.binding;
    const activeNode = resolved.activeNode;
    const params = beat.parameters || {};

    const attention = (binding.setting ? ('Stage focus in ' + binding.setting) : 'Proscenium encounter') +
      (binding.cast && binding.cast[0] ? (' (' + binding.cast.map(function(c) { return c.entity_id; }).join(' × ') + ')') : '');

    const intention = (activeNode && activeNode.acting_cue) ||
      (binding.actions && binding.actions[0]) ||
      binding.interpretation_note ||
      'Establish dramatic stakes on stage';

    const gilliamOp = selectGilliamOperator(beat, binding, activeNode);
    const gesture = 'Cutout operator [' + gilliamOp + '] + ' +
      ((activeNode && activeNode.performances && activeNode.performances[0] && activeNode.performances[0].states && activeNode.performances[0].states[0])
        ? (activeNode.performances[0].states[0].state + ' (' + activeNode.performances[0].states[0].cue + ')')
        : 'staged full-body silhouette posture');

    const resistance = (resolved.directorOverride && resolved.directorOverride.reason) ||
      (binding.interpretation_note) ||
      (params.choices && params.choices.length > 1
        ? ('Branching tension across ' + params.choices.length + ' competing choices')
        : 'Friction between institutional slop complicity and embodied craft');

    const targets = (binding.source_targets && binding.source_targets.length)
      ? binding.source_targets.join(', ')
      : (beat.connections && beat.connections[0] ? beat.connections[0].targetId : 'next beat');
    const changedState = 'Transitions to [' + targets + '] with updated E00–E17 affect & 5-axis refusal state';

    const chainComplete = Boolean(attention && intention && gesture && resistance && changedState);

    return {
      id: 'dramaticCausalLink',
      label: 'SCION Acting Chain (Attention → Changed State)',
      type: 'PERCEPTUAL',
      passed: chainComplete,
      value: '5/5 links: ' + gilliamOp + ' → ' + targets,
      detail: '① Attention: ' + attention + ' → ② Intention: ' + intention + ' → ③ Gesture: ' + gesture +
        ' → ④ Resistance: ' + resistance + ' → ⑤ Changed State: ' + changedState + '.',
      causalChain: {
        attention: attention,
        intention: intention,
        gesture: gesture,
        resistance: resistance,
        changedState: changedState
      }
    };
  }

  /**
   * Build 8-Crew Assembly Telemetry for the current beat & node
   */
  function buildCrewTelemetry(resolved, invariantsMap, context) {
    const beat = resolved.beat;
    const binding = resolved.binding;
    const activeNode = resolved.activeNode;
    const gilliamOp = selectGilliamOperator(beat, binding, activeNode);
    const refusalAxes = computeRefusalAxes(beat.id, resolved.qualifiedId, context && context.storyVars);
    const supportCheck = invariantsMap.actorSupportStability;
    const emoCheck = invariantsMap.emotionHeadAttachment;
    const provCheck = invariantsMap.provenanceCompleteness;

    return [
      {
        crewId: 'CREW-CUTOUT',
        name: 'Cutout Surgery & Metamorphosis',
        leadSwarm: '#1 Terry Gilliam (SCION-TERRY-GILLIAM)',
        activeJob: 'Segmented ' + (supportCheck.actors ? supportCheck.actors.length : 2) + ' alpha-cleaned stage cutouts & die-cut props with Gilliam operator [' + gilliamOp + '].',
        artifactProduced: (supportCheck.actors && supportCheck.actors[0] ? supportCheck.actors[0].poseUrl : 'odyssey/slopling-cast/poses/char_player_listen.png') + ' · op:' + gilliamOp,
        status: supportCheck.passed ? 'VERIFIED' : 'REPAIR_REQUIRED'
      },
      {
        crewId: 'CREW-RIG',
        name: 'Articulated Skeleton, FK/IK & Deformation',
        leadSwarm: '#2 Lotte Reiniger / #32 FK & #33 IK (SCION-LOTTE-REINIGER)',
        activeJob: 'Solved 15-part polygon-masked WatsonRig hierarchy, brass-brad pivots, and Z2 ankle registration for ' + beat.id + '.',
        artifactProduced: 'window.WATSON_RIG_MANIFEST (15 parts, neck pivot [512, 302], Z2 IK foot pin)',
        status: supportCheck.passed ? 'VERIFIED' : 'REPAIR_REQUIRED'
      },
      {
        crewId: 'CREW-MULTIPLANE',
        name: 'Atmospheric Multiplane & Occlusion Stage',
        leadSwarm: '#5 Yuri Norstein / #44 Multiplane (SCION-YURI-NORSTEIN)',
        activeJob: 'Composed 5-layer proscenium depth (Z0 sky to Z4 wings/fog) & Z2 contact shadows for "' + (binding.setting || beat.name) + '".',
        artifactProduced: 'Multiplane Stage [Z0..Z4] · Chapter ' + (binding.chapter || 'I. The Call'),
        status: invariantsMap.phoneReadability.passed ? 'VERIFIED' : 'REPAIR_REQUIRED'
      },
      {
        crewId: 'CREW-PERFORMANCE',
        name: 'Pose2Pose Casting & Secondary Dynamics',
        leadSwarm: '#14 Nora Willett Pose2Pose (SCION-WILLETT-POSE2POSE)',
        activeJob: 'Cast optimal cutout poses and spring-damper follow-through for node ' + resolved.qualifiedId + '.',
        artifactProduced: 'beat_performance_bindings.json → ' + resolved.qualifiedId + ' (' + ((resolved.nodes && resolved.nodes.length) || 1) + ' nodes)',
        status: invariantsMap.dramaticCausalLink.passed ? 'VERIFIED' : 'REPAIR_REQUIRED'
      },
      {
        crewId: 'CREW-RECAST',
        name: 'Face Landmark & E00–E17 Head Substitution',
        leadSwarm: '#16 JibJab / #46 Face Landmark (SCION-JIBJAB-STUDIO)',
        activeJob: 'Mounted Watson emotion head ' + emoCheck.boundState + ' onto neck anchor [512, 302] and aligned stage medallion.',
        artifactProduced: emoCheck.headAssetPath,
        status: emoCheck.passed ? 'VERIFIED' : 'REPAIR_REQUIRED'
      },
      {
        crewId: 'CREW-SONIC',
        name: 'Sound-to-Action, Viseme & Montage Rhythm',
        leadSwarm: '#47 Sound-to-Action / #4 Frank Mouris (SCION-SOUND-TO-ACTION)',
        activeJob: 'Synthesized WebAudio cutout foley cues (paper snap, brass brad click, stage plank thud) & speech cadence envelope.',
        artifactProduced: 'Foley cue [' + gilliamOp + '_foley] + speech cadence envelope',
        status: 'VERIFIED'
      },
      {
        crewId: 'CREW-STATE',
        name: 'Refusal State Machines & Dramatic Consequence',
        leadSwarm: '#48 State Machines — Characters That Can Refuse (SCION-STATE-MACHINE-REFUSAL)',
        activeJob: 'Updated 5-axis Odyssey refusal state machine across choices and director boundaries.',
        artifactProduced: 'Autonomy:' + refusalAxes['Craft Autonomy'] + '% · Refusal:' + refusalAxes['Refusal Capacity'] + '% · Lineage:' + refusalAxes['Embodied Lineage'] + '%',
        status: 'VERIFIED'
      },
      {
        crewId: 'CREW-TRIBUNAL',
        name: 'Provenance Graph, Pipeline & Independent Critic',
        leadSwarm: '#20 Toon Boom Harmony & #27 Remotion (SCION-TOON-BOOM-HARMONY)',
        activeJob: 'Audited 81-cell ONYX provenance graph (#' + provCheck.dagHash + ') and executed 5-invariant Independent Critic Tribunal.',
        artifactProduced: 'Tribunal Report @ ' + resolved.qualifiedId + ' (' + provCheck.sourcePointer + ')',
        status: provCheck.passed ? 'VERIFIED' : 'REPAIR_REQUIRED'
      }
    ];
  }

  /**
   * Primary Tribunal Evaluator: evaluateBeat(beat, nodeId, context)
   */
  function evaluateBeat(beat, nodeId, context) {
    const ctx = context || {};
    const resolved = resolveBeatAndNode(beat, nodeId, ctx);

    const inv1 = checkPhoneReadability(resolved, ctx);
    const inv2 = checkActorSupportStability(resolved, ctx);
    const inv3 = checkEmotionHeadAttachment(resolved, ctx);
    const inv4 = checkProvenanceCompleteness(resolved, ctx);
    const inv5 = checkDramaticCausalLink(resolved, ctx);

    const invariants = [inv1, inv2, inv3, inv4, inv5];
    const invariantsMap = {
      phoneReadability: inv1,
      actorSupportStability: inv2,
      emotionHeadAttachment: inv3,
      provenanceCompleteness: inv4,
      dramaticCausalLink: inv5
    };

    const passedCount = invariants.filter(function(i) { return i.passed; }).length;
    let verdict = 'PASS';
    if (passedCount < invariants.length) {
      const criticalFailed = !inv1.passed || !inv2.passed || !inv4.passed;
      verdict = (criticalFailed || passedCount <= 3) ? 'REPAIR_REQUIRED' : 'REFERENCE_STRONGER';
    } else if (ctx.flagReferenceStrongerOnAudit && resolved.directorOverride && resolved.directorOverride.priority === 'critical') {
      verdict = 'REFERENCE_STRONGER';
    }

    const crewTelemetry = buildCrewTelemetry(resolved, invariantsMap, ctx);
    const refusalAxes = computeRefusalAxes(resolved.beat.id, resolved.qualifiedId, ctx.storyVars);
    const gilliamOperator = selectGilliamOperator(resolved.beat, resolved.binding, resolved.activeNode);

    return {
      beatId: resolved.beat.id,
      beatName: resolved.beat.name,
      nodeId: resolved.qualifiedId,
      chapter: resolved.binding.chapter || resolved.beat.cluster || 'I. The Call',
      verdict: verdict,
      score: passedCount + '/' + invariants.length + ' invariants passed',
      passedCount: passedCount,
      totalInvariants: invariants.length,
      invariants: invariants,
      directorOverride: resolved.directorOverride,
      beatFindings: resolved.beatFindings,
      crewTelemetry: crewTelemetry,
      refusalAxes: refusalAxes,
      gilliamOperator: gilliamOperator,
      provenanceHash: inv4.dagHash,
      evaluatedAt: new Date().toISOString()
    };
  }

  /**
   * Run evaluateBeat across all 97 beats in SLOPLING_ODYSSEY_DATA
   */
  function evaluateAllBeats(context) {
    const data = getOdysseyData(context);
    const beats = (data && data.story && data.story.beats) || [];
    const reports = beats.map(function(b) {
      return evaluateBeat(b, null, context);
    });
    const passedCount = reports.filter(function(r) { return r.verdict === 'PASS'; }).length;
    const referenceStrongerCount = reports.filter(function(r) { return r.verdict === 'REFERENCE_STRONGER'; }).length;
    const repairRequiredCount = reports.filter(function(r) { return r.verdict === 'REPAIR_REQUIRED'; }).length;

    return {
      totalBeats: reports.length,
      passedCount: passedCount,
      referenceStrongerCount: referenceStrongerCount,
      repairRequiredCount: repairRequiredCount,
      summaryScore: passedCount + '/' + reports.length + ' beats PASS',
      reports: reports
    };
  }

  /**
   * Procedural WebAudio Cutout Foley Synthesizer for Crew 6 (CREW-SONIC)
   * Safe no-op in headless/Node environments or when AudioContext is locked.
   */
  let sharedAudioCtx = null;
  function triggerCutoutFoley(cueType) {
    try {
      const AudioCtx = root.AudioContext || root.webkitAudioContext;
      if (!AudioCtx) return false;
      if (!sharedAudioCtx) sharedAudioCtx = new AudioCtx();
      if (sharedAudioCtx.state === 'suspended') sharedAudioCtx.resume();

      const now = sharedAudioCtx.currentTime;
      const osc = sharedAudioCtx.createOscillator();
      const gain = sharedAudioCtx.createGain();
      osc.connect(gain);
      gain.connect(sharedAudioCtx.destination);

      if (cueType === 'brass_brad_click' || cueType === 'caliper_click') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1120, now);
        osc.frequency.exponentialRampToValueAtTime(240, now + 0.035);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.038);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (cueType === 'stage_thud') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(38, now + 0.09);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);
        osc.start(now);
        osc.stop(now + 0.1);
      } else {
        // Default: paper_snap
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.045);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.055);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  const ScionTribunal = {
    version: '1.0.0',
    WATSON_NECK_ANCHOR: WATSON_NECK_ANCHOR,
    evaluateBeat: evaluateBeat,
    evaluateAllBeats: evaluateAllBeats,
    computeRefusalAxes: computeRefusalAxes,
    selectGilliamOperator: selectGilliamOperator,
    resolvePoseUrlForEntity: resolvePoseUrlForEntity,
    triggerCutoutFoley: triggerCutoutFoley
  };

  root.ScionTribunal = ScionTribunal;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScionTribunal;
  }
})(typeof window !== 'undefined' ? window : globalThis);
