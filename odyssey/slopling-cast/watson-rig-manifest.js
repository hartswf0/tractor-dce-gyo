window.WATSON_RIG_MANIFEST = {"width": 1024, "height": 1536, "revision": "master_cut_v2_solid_source_texture_tabs", "source_file": "source/master_B.png", "source_sha256": "f663852f62dc4e4bd8723fced5b1be7e390cda5c7440c1f20ece6f3fd60e2511", "rest_angle": 0, "angle_unit": "degrees", "coordinate_system": "Global source pixels; each rect includes transparent padding. All parts render at 1:1 scale. Rotation values are deltas around global pivots; ancestors transform descendants.", "side_convention": "left/right are viewer sides in the rest master", "parts": [{"id": "pelvis", "label": "Compact pelvis cover", "file": "parts/pelvis.png", "polygon": [[381, 680], [646, 680], [650, 721], [650, 737], [647, 751], [641, 759], [632, 764], [620, 767], [608, 767], [594, 763], [580, 757], [565, 770], [544, 784], [525, 792], [514, 794], [499, 792], [480, 784], [459, 770], [444, 757], [430, 763], [416, 767], [404, 767], [392, 764], [383, 759], [377, 751], [374, 737], [376, 720]], "pivot": [512, 727], "parent": null, "layer": 40, "clip_holes": [], "underlap_pads": [], "rest_angle": 0, "rect": [362, 668, 300, 138], "core_pixels": 24488, "data": "odyssey/slopling-cast/rig/pelvis.png"}, {"id": "torso", "label": "Torso and shoulder caps", "file": "parts/torso.png", "polygon": [[333, 294], [412, 264], [430, 240], [450, 233], [457, 254], [456, 277], [453, 297], [463, 315], [489, 325], [539, 325], [558, 315], [568, 298], [565, 277], [563, 256], [572, 239], [595, 253], [615, 271], [686, 296], [697, 318], [695, 340], [688, 359], [673, 368], [656, 365], [646, 353], [648, 394], [650, 467], [650, 549], [661, 677], [661, 692], [647, 702], [632, 707], [523, 709], [505, 708], [382, 702], [366, 694], [362, 682], [374, 552], [373, 468], [375, 395], [373, 354], [364, 365], [346, 368], [329, 359], [323, 344], [323, 326]], "pivot": [512, 701], "parent": "pelvis", "layer": 50, "clip_holes": [], "underlap_pads": [{"kind": "concealed_neck_joint_backing", "center": [512, 315], "radius": 28, "donor_center": [512, 365], "source_pixel_scale": 1}], "rest_angle": 0, "rect": [311, 221, 398, 500], "core_pixels": 124356, "data": "odyssey/slopling-cast/rig/torso.png"}, {"id": "head", "label": "Head and neck", "file": "parts/head.png", "polygon": [[396, 0], [625, 0], [625, 216], [596, 241], [573, 248], [564, 269], [566, 297], [557, 314], [538, 325], [488, 326], [464, 315], [451, 297], [455, 267], [448, 245], [421, 225], [396, 196]], "pivot": [512, 302], "parent": "torso", "layer": 80, "clip_holes": [], "underlap_pads": [], "rest_angle": 0, "rect": [384, 0, 253, 338], "core_pixels": 44283, "data": "odyssey/slopling-cast/rig/head.png"}, {"id": "upper_arm_left", "label": "Viewer-left upper arm", "file": "parts/upper_arm_left.png", "polygon": [[330, 312], [356, 313], [375, 328], [381, 371], [376, 422], [364, 491], [350, 538], [335, 554], [311, 558], [283, 550], [262, 532], [264, 511], [279, 447], [293, 384], [307, 338]], "pivot": [350, 342], "parent": "torso", "layer": 45, "clip_holes": [{"center": [350, 342], "radius": 25}, {"center": [306, 545], "radius": 24}], "underlap_pads": [{"kind": "replace_nonowned_hardware_with_solid_garment_tab", "center": [350, 342], "radius": 25, "donor_center": [339, 406], "source_pixel_scale": 1}, {"kind": "replace_nonowned_hardware_with_solid_garment_tab", "center": [306, 545], "radius": 24, "donor_center": [321, 474], "source_pixel_scale": 1}], "rest_angle": 0, "rect": [250, 300, 143, 281], "core_pixels": 20225, "data": "odyssey/slopling-cast/rig/upper_arm_left.png"}, {"id": "forearm_left", "label": "Viewer-left forearm", "file": "parts/forearm_left.png", "polygon": [[281, 545], [281.8518543427733, 538.5295238724369], [284.34936490538905, 532.5], [288.3223304703363, 527.3223304703363], [293.5, 523.349364905389], [299.529523872437, 520.8518543427733], [306, 520], [312.470476127563, 520.8518543427733], [318.5, 523.349364905389], [323.67766952966366, 527.3223304703363], [327.65063509461095, 532.5], [330.1481456572267, 538.529523872437], [331, 545], [341, 554], [350, 577], [344, 619], [330, 676], [316, 726], [305, 739], [266, 747], [237, 737], [230, 719], [239, 677], [251, 607], [258, 572], [269, 554], [281, 549]], "pivot": [306, 545], "parent": "upper_arm_left", "layer": 60, "clip_holes": [{"center": [275, 734], "radius": 19}], "underlap_pads": [{"kind": "replace_nonowned_hardware_with_solid_garment_tab", "center": [275, 734], "radius": 19, "donor_center": [293, 642], "source_pixel_scale": 1}, {"kind": "solid_backing_under_owned_joint_cap", "center": [306, 545], "radius": 25, "donor_center": [302, 606], "source_pixel_scale": 1}], "rest_angle": 0, "rect": [218, 508, 144, 257], "core_pixels": 18398, "data": "odyssey/slopling-cast/rig/forearm_left.png"}, {"id": "hand_left", "label": "Viewer-left hand", "file": "parts/hand_left.png", "polygon": [[256, 734], [256.6474093005077, 729.0824381430521], [258.5455173280957, 724.5], [261.5649711574556, 720.5649711574556], [265.5, 717.5455173280957], [270.0824381430521, 715.6474093005077], [275, 715], [279.9175618569479, 715.6474093005077], [284.5, 717.5455173280957], [288.4350288425444, 720.5649711574556], [291.4544826719043, 724.5], [293.3525906994923, 729.0824381430521], [294, 734], [299, 741], [310, 773], [325, 802], [328, 832], [321, 844], [309, 846], [301, 836], [301, 855], [312, 872], [309, 882], [299, 888], [286, 880], [262, 861], [247, 844], [235, 819], [229, 797], [236, 774], [248, 739], [256, 735]], "pivot": [275, 734], "parent": "forearm_left", "layer": 70, "clip_holes": [], "underlap_pads": [], "rest_angle": 0, "rect": [217, 703, 123, 197], "core_pixels": 9972, "data": "odyssey/slopling-cast/rig/hand_left.png"}, {"id": "upper_arm_right", "label": "Viewer-right upper arm", "file": "parts/upper_arm_right.png", "polygon": [[694, 312], [668, 313], [649, 328], [643, 371], [648, 422], [660, 491], [674, 538], [689, 554], [713, 558], [741, 550], [762, 532], [760, 511], [745, 447], [731, 384], [717, 338]], "pivot": [673, 343], "parent": "torso", "layer": 45, "clip_holes": [{"center": [673, 343], "radius": 25}, {"center": [719, 545], "radius": 24}], "underlap_pads": [{"kind": "replace_nonowned_hardware_with_solid_garment_tab", "center": [673, 343], "radius": 25, "donor_center": [686, 406], "source_pixel_scale": 1}, {"kind": "replace_nonowned_hardware_with_solid_garment_tab", "center": [719, 545], "radius": 24, "donor_center": [703, 474], "source_pixel_scale": 1}], "rest_angle": 0, "rect": [631, 300, 143, 281], "core_pixels": 19973, "data": "odyssey/slopling-cast/rig/upper_arm_right.png"}, {"id": "forearm_right", "label": "Viewer-right forearm", "file": "parts/forearm_right.png", "polygon": [[743, 545], [742.1481456572267, 538.5295238724369], [739.650635094611, 532.5], [735.6776695296637, 527.3223304703363], [730.5, 523.349364905389], [724.470476127563, 520.8518543427733], [718, 520], [711.529523872437, 520.8518543427733], [705.5, 523.349364905389], [700.3223304703363, 527.3223304703363], [696.349364905389, 532.5], [693.8518543427733, 538.529523872437], [693, 545], [683, 554], [674, 577], [680, 619], [694, 676], [708, 726], [719, 739], [758, 747], [787, 737], [794, 719], [785, 677], [773, 607], [766, 572], [755, 554], [743, 549]], "pivot": [719, 545], "parent": "upper_arm_right", "layer": 60, "clip_holes": [{"center": [749, 734], "radius": 19}], "underlap_pads": [{"kind": "replace_nonowned_hardware_with_solid_garment_tab", "center": [749, 734], "radius": 19, "donor_center": [731, 642], "source_pixel_scale": 1}, {"kind": "solid_backing_under_owned_joint_cap", "center": [719, 545], "radius": 25, "donor_center": [722, 606], "source_pixel_scale": 1}], "rest_angle": 0, "rect": [662, 508, 144, 257], "core_pixels": 18457, "data": "odyssey/slopling-cast/rig/forearm_right.png"}, {"id": "hand_right", "label": "Viewer-right hand", "file": "parts/hand_right.png", "polygon": [[768, 734], [767.3525906994923, 729.0824381430521], [765.4544826719043, 724.5], [762.4350288425444, 720.5649711574556], [758.5, 717.5455173280957], [753.9175618569479, 715.6474093005077], [749, 715], [744.0824381430521, 715.6474093005077], [739.5, 717.5455173280957], [735.5649711574556, 720.5649711574556], [732.5455173280957, 724.5], [730.6474093005077, 729.0824381430521], [730, 734], [725, 741], [714, 773], [699, 802], [696, 832], [703, 844], [715, 846], [723, 836], [723, 855], [712, 872], [715, 882], [725, 888], [738, 880], [762, 861], [777, 844], [789, 819], [795, 797], [788, 774], [776, 739], [768, 735]], "pivot": [749, 734], "parent": "forearm_right", "layer": 70, "clip_holes": [], "underlap_pads": [], "rest_angle": 0, "rect": [684, 703, 123, 197], "core_pixels": 9936, "data": "odyssey/slopling-cast/rig/hand_right.png"}, {"id": "thigh_left", "label": "Viewer-left thigh", "file": "parts/thigh_left.png", "polygon": [[383, 707], [401, 704], [428, 705], [451, 714], [479, 736], [504, 771], [518, 785], [507, 832], [488, 943], [472, 1018], [464, 1052], [452, 1068], [373, 1068], [356, 1043], [353, 1000], [354, 938], [359, 863], [365, 811], [373, 761]], "pivot": [416, 727], "parent": "pelvis", "layer": 20, "clip_holes": [{"center": [416, 727], "radius": 26}, {"center": [401, 1064], "radius": 25}], "underlap_pads": [{"kind": "replace_nonowned_hardware_with_solid_garment_tab", "center": [416, 727], "radius": 26, "donor_center": [433, 852], "source_pixel_scale": 1}, {"kind": "replace_nonowned_hardware_with_solid_garment_tab", "center": [401, 1064], "radius": 25, "donor_center": [417, 980], "source_pixel_scale": 1}], "rest_angle": 0, "rect": [341, 689, 189, 412], "core_pixels": 45519, "data": "odyssey/slopling-cast/rig/thigh_left.png"}, {"id": "shin_left", "label": "Viewer-left shin", "file": "parts/shin_left.png", "polygon": [[376, 1064], [376.8518543427733, 1057.529523872437], [379.34936490538905, 1051.5], [383.3223304703363, 1046.3223304703363], [388.5, 1042.349364905389], [394.529523872437, 1039.8518543427733], [401, 1039], [407.470476127563, 1039.8518543427733], [413.5, 1042.349364905389], [418.67766952966366, 1046.3223304703363], [422.65063509461095, 1051.5], [425.1481456572267, 1057.529523872437], [426, 1064], [446, 1068], [462, 1082], [468, 1107], [457, 1207], [442, 1290], [435, 1331], [424, 1337], [329, 1330], [321, 1316], [331, 1263], [343, 1174], [351, 1113], [357, 1083], [371, 1070], [377, 1064]], "pivot": [401, 1064], "parent": "thigh_left", "layer": 30, "clip_holes": [], "underlap_pads": [{"kind": "solid_backing_under_owned_joint_cap", "center": [401, 1064], "radius": 25, "donor_center": [406, 1156], "source_pixel_scale": 1}], "rest_angle": 0, "rect": [309, 1027, 171, 322], "core_pixels": 31372, "data": "odyssey/slopling-cast/rig/shin_left.png"}, {"id": "boot_left", "label": "Viewer-left boot", "file": "parts/boot_left.png", "polygon": [[333, 1329], [416, 1329], [418, 1341], [414, 1387], [416, 1412], [418, 1449], [410, 1463], [381, 1478], [349, 1489], [283, 1492], [240, 1481], [226, 1462], [229, 1428], [241, 1410], [277, 1387], [309, 1354]], "pivot": [360, 1330], "parent": "shin_left", "layer": 10, "clip_holes": [], "underlap_pads": [{"kind": "concealed_leather_shaft_underlap", "center": [378, 1320], "radius": 46, "donor_rect": [380, 1396, 24, 24], "fill_method": "tile_source_texture_at_native_scale", "source_pixel_scale": 1, "note": "Tab is centered on the shaft rather than the off-center ankle pivot so it covers the whole angled cuff during the tested joint study."}], "rest_angle": 0, "rect": [214, 1262, 222, 242], "core_pixels": 24730, "data": "odyssey/slopling-cast/rig/boot_left.png"}, {"id": "thigh_right", "label": "Viewer-right thigh", "file": "parts/thigh_right.png", "polygon": [[641, 707], [623, 704], [596, 705], [573, 714], [545, 736], [520, 771], [506, 785], [517, 832], [536, 943], [552, 1018], [560, 1052], [572, 1068], [651, 1068], [668, 1043], [671, 1000], [670, 938], [665, 863], [659, 811], [651, 761]], "pivot": [611, 727], "parent": "pelvis", "layer": 20, "clip_holes": [{"center": [611, 727], "radius": 26}, {"center": [623, 1064], "radius": 25}], "underlap_pads": [{"kind": "replace_nonowned_hardware_with_solid_garment_tab", "center": [611, 727], "radius": 26, "donor_center": [591, 852], "source_pixel_scale": 1}, {"kind": "replace_nonowned_hardware_with_solid_garment_tab", "center": [623, 1064], "radius": 25, "donor_center": [607, 980], "source_pixel_scale": 1}], "rest_angle": 0, "rect": [494, 689, 189, 412], "core_pixels": 45903, "data": "odyssey/slopling-cast/rig/thigh_right.png"}, {"id": "shin_right", "label": "Viewer-right shin", "file": "parts/shin_right.png", "polygon": [[648, 1064], [647.1481456572267, 1057.529523872437], [644.650635094611, 1051.5], [640.6776695296637, 1046.3223304703363], [635.5, 1042.349364905389], [629.470476127563, 1039.8518543427733], [623, 1039], [616.529523872437, 1039.8518543427733], [610.5, 1042.349364905389], [605.3223304703363, 1046.3223304703363], [601.349364905389, 1051.5], [598.8518543427733, 1057.529523872437], [598, 1064], [578, 1068], [562, 1082], [556, 1107], [567, 1207], [582, 1290], [589, 1331], [600, 1337], [695, 1330], [703, 1316], [693, 1263], [681, 1174], [673, 1113], [667, 1083], [653, 1070], [647, 1064]], "pivot": [623, 1064], "parent": "thigh_right", "layer": 30, "clip_holes": [], "underlap_pads": [{"kind": "solid_backing_under_owned_joint_cap", "center": [623, 1064], "radius": 25, "donor_center": [618, 1156], "source_pixel_scale": 1}], "rest_angle": 0, "rect": [544, 1027, 171, 322], "core_pixels": 31208, "data": "odyssey/slopling-cast/rig/shin_right.png"}, {"id": "boot_right", "label": "Viewer-right boot", "file": "parts/boot_right.png", "polygon": [[691, 1329], [608, 1329], [606, 1341], [610, 1387], [608, 1412], [606, 1449], [614, 1463], [643, 1478], [675, 1489], [741, 1492], [784, 1481], [798, 1462], [795, 1428], [783, 1410], [747, 1387], [715, 1354]], "pivot": [658, 1330], "parent": "shin_right", "layer": 10, "clip_holes": [], "underlap_pads": [{"kind": "concealed_leather_shaft_underlap", "center": [646, 1320], "radius": 46, "donor_rect": [621, 1396, 24, 24], "fill_method": "tile_source_texture_at_native_scale", "source_pixel_scale": 1, "note": "Tab is centered on the shaft rather than the off-center ankle pivot so it covers the whole angled cuff during the tested joint study."}], "rest_angle": 0, "rect": [588, 1262, 222, 242], "core_pixels": 24549, "data": "odyssey/slopling-cast/rig/boot_right.png"}], "extraction_status": "One-master mechanical prototype with localized source-texture construction. Actual modest-motion review required.", "hardware_ownership": {"shoulder": "torso", "elbow": "forearm", "wrist": "hand", "hip": "pelvis", "knee": "shin", "ankle": "boot, with cuff beneath shin; boot eyelets are decorative"}, "ankle_registration": {"original_estimate_y": 1350, "verified_shared_material_y": 1330, "basis": "Actual shin and boot PNGs both have alpha253 at [360,1330] and [658,1330]. The previous y1350 pivots lay outside opaque shin material. Only the pivot changed; cards retain their dimensions and rest positions."}, "construction_policy": "Native-scale garment samples from master B are translated into small round backing tabs and nonowned hardware replacement disks. Each part records every center, radius, donor center and source scale. This deliberately changes those overlap pixels; main source silhouettes are not rescaled. Boot pivots use the verified shared cuff/shaft overlap.", "limitations": ["Source-texture sampled joint underlaps are constructed pixels, not an exact cutout of hidden material. They are recorded per part.", "Large rotations can expose cut boundaries or texture transitions outside the modest tested front-plane motion.", "Source alpha has a faint generated halo; clipping makes outside transparent.", "Overlaps and local joint construction mean the assembled image is no longer expected to be bit-identical to master B.", "Foot-lift is an isolated joint study, not a walking cycle."]};

/* Watson front-view pose study. Pure Canvas 2D renderer, shared by the HTML and proof renders. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.WatsonRig = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const IDENTITY = [1, 0, 0, 1, 0, 0];
  const PRESETS = {
    neutral: { label: 'Neutral', note: 'Original front-view arrangement', rotations: {} },
    arm_bend: {
      label: 'Bend arm', note: 'Viewer-left arm · small elbow study',
      rotations: { upper_arm_left: -4, forearm_left: -48, hand_left: 8 }
    },
    foot_lift: {
      label: 'Lift foot', note: 'Viewer-right leg · slight foot lift',
      rotations: { thigh_right: -20, shin_right: 40, boot_right: -20 }
    }
  };
  const EXPLODE = {
    head: [0, -115], torso: [0, -25], pelvis: [0, 45],
    upper_arm_left: [-100, -40], forearm_left: [-150, 30], hand_left: [-190, 125],
    upper_arm_right: [100, -40], forearm_right: [150, 30], hand_right: [190, 125],
    thigh_left: [-65, 80], shin_left: [-110, 180], boot_left: [-150, 290],
    thigh_right: [65, 80], shin_right: [110, 180], boot_right: [150, 290]
  };
  const frameCache = new WeakMap();

  function multiply(a, b) {
    return [
      a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
      a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
      a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]
    ];
  }
  function transformPoint(m, p) {
    return [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];
  }
  function rotationAt(pivot, degrees) {
    const r = degrees * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
    const [x, y] = pivot;
    return [c, s, -s, c, x - c * x + s * y, y - s * x - c * y];
  }
  function validateManifest(manifest) {
    if (!manifest || !Array.isArray(manifest.parts) || !manifest.parts.length) throw new Error('Missing rig parts.');
    const byId = new Map();
    for (const p of manifest.parts) {
      if (byId.has(p.id)) throw new Error('Duplicate part: ' + p.id);
      if (!Array.isArray(p.rect) || p.rect.length !== 4 || p.rect.some(v => !Number.isFinite(v)) || p.rect[2] <= 0 || p.rect[3] <= 0) throw new Error('Invalid part rectangle: ' + p.id);
      if (!Array.isArray(p.pivot) || p.pivot.length !== 2 || p.pivot.some(v => !Number.isFinite(v))) throw new Error('Invalid pivot: ' + p.id);
      byId.set(p.id, p);
    }
    for (const p of manifest.parts) {
      if (p.parent && !byId.has(p.parent)) throw new Error('Missing parent: ' + p.id);
      const seen = new Set([p.id]);
      let parent = p.parent;
      while (parent) {
        if (seen.has(parent)) throw new Error('Cyclic rig parent: ' + p.id);
        seen.add(parent); parent = byId.get(parent).parent;
      }
    }
    return byId;
  }
  function poseFor(preset, amount) {
    const record = PRESETS[preset] || PRESETS.neutral;
    const t = Math.max(0, Math.min(1, Number(amount) || 0));
    return Object.fromEntries(Object.entries(record.rotations).map(([id, degrees]) => [id, degrees * t]));
  }
  function computeTransforms(manifest, rotations) {
    const byId = new Map(manifest.parts.map(p => [p.id, p]));
    const matrices = {};
    function visit(id) {
      if (matrices[id]) return matrices[id];
      const p = byId.get(id), parent = p.parent ? visit(p.parent) : IDENTITY;
      return (matrices[id] = multiply(parent, rotationAt(p.pivot, Number(rotations[id]) || 0)));
    }
    manifest.parts.forEach(p => visit(p.id));
    return matrices;
  }
  function displayMatrix(part, matrices, view) {
    const m = matrices[part.id].slice();
    if (view === 'exploded') {
      const shift = EXPLODE[part.id] || [0, 0];
      m[4] += shift[0]; m[5] += shift[1];
    }
    return m;
  }
  function partCorners(p) {
    const [x, y, w, h] = p.rect;
    return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  }
  function extent(manifest, rotations, view) {
    const matrices = computeTransforms(manifest, rotations);
    const points = manifest.parts.flatMap(p => partCorners(p).map(xy => transformPoint(displayMatrix(p, matrices, view), xy)));
    return [Math.min(...points.map(p => p[0])), Math.min(...points.map(p => p[1])), Math.max(...points.map(p => p[0])), Math.max(...points.map(p => p[1]))];
  }
  function frameBounds(manifest, view) {
    let cached = frameCache.get(manifest);
    if (!cached) {
      const frames = Object.keys(PRESETS).flatMap(name => [0, .5, 1].map(t => extent(manifest, poseFor(name, t), 'assembled')));
      const union = [Math.min(...frames.map(b => b[0])), Math.min(...frames.map(b => b[1])), Math.max(...frames.map(b => b[2])), Math.max(...frames.map(b => b[3]))];
      const exploded = extent(manifest, {}, 'exploded');
      cached = { assembled: union, joints: union, exploded };
      frameCache.set(manifest, cached);
    }
    return cached[view] || cached.assembled;
  }
  function layerFor(p, rotations) {
    // The forearm and hand cross in front of the jacket. Shoulder tabs stay behind
    // the torso, which owns the visible shoulder brads.
    const leftAcross = ((rotations.upper_arm_left || 0) + (rotations.forearm_left || 0)) < -6;
    const rightAcross = ((rotations.upper_arm_right || 0) + (rotations.forearm_right || 0)) > 6;
    if ((leftAcross && /_left$/.test(p.id)) || (rightAcross && /_right$/.test(p.id))) {
      if (p.id.startsWith('forearm_')) return 66;
      if (p.id.startsWith('hand_')) return 76;
    }
    return Number(p.layer) || 0;
  }
  function draw(ctx, manifest, images, rotations, options) {
    options = options || {};
    const width = options.width || ctx.canvas.width, height = options.height || ctx.canvas.height;
    const view = options.view || 'assembled';
    const actualPose = view === 'exploded' ? {} : (rotations || {});
    const matrices = computeTransforms(manifest, actualPose);
    const bounds = options.bounds || frameBounds(manifest, view);
    const pad = options.padding === undefined ? .035 : options.padding;
    const scale = Math.min(width * (1 - 2 * pad) / (bounds[2] - bounds[0]), height * (1 - 2 * pad) / (bounds[3] - bounds[1]));
    const tx = (width - (bounds[0] + bounds[2]) * scale) / 2;
    const ty = (height - (bounds[1] + bounds[3]) * scale) / 2;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    if (options.background !== null) {
      ctx.fillStyle = options.background || '#f5f1e8'; ctx.fillRect(0, 0, width, height);
    }
    ctx.setTransform(scale, 0, 0, scale, tx, ty);
    ctx.imageSmoothingEnabled = true;
    // 'medium' keeps a 1:1 neutral sprite exact in both browsers and node-canvas.
    // The Skia 'high' filter softens even a unit-scale draw, obscuring source comparison.
    ctx.imageSmoothingQuality = 'medium';

    const ordered = manifest.parts.slice().sort((a, b) => layerFor(a, actualPose) - layerFor(b, actualPose));
    for (const p of ordered) {
      const bitmap = images[p.id];
      if (!bitmap) throw new Error('Missing image: ' + p.id);
      ctx.save();
      ctx.transform(...displayMatrix(p, matrices, view));
      // rect size is the source crop size. No per-part rescaling, skew, or replacement art.
      ctx.drawImage(bitmap, p.rect[0], p.rect[1], p.rect[2], p.rect[3]);
      ctx.restore();
    }

    const pivots = Object.fromEntries(manifest.parts.map(p => [p.id, transformPoint(displayMatrix(p, matrices, view), p.pivot)]));
    if (view === 'joints') {
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(15,85,92,.77)'; ctx.lineWidth = 4 / Math.max(scale, .6);
      ctx.setLineDash([11, 9]);
      for (const p of manifest.parts) {
        if (!p.parent) continue;
        const a = pivots[p.parent], b = pivots[p.id];
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      }
      ctx.setLineDash([]);
      for (const p of manifest.parts) {
        const xy = pivots[p.id];
        ctx.beginPath(); ctx.arc(xy[0], xy[1], 11, 0, Math.PI * 2);
        ctx.fillStyle = '#fff9e6'; ctx.fill();
        ctx.strokeStyle = '#115c61'; ctx.lineWidth = 3.5; ctx.stroke();
        ctx.beginPath(); ctx.arc(xy[0], xy[1], 3.7, 0, Math.PI * 2);
        ctx.fillStyle = '#115c61'; ctx.fill();
      }
    }
    ctx.restore();
    return { matrices, pivots, bounds: bounds.slice(), scale, tx, ty, drawOrder: ordered.map(p => p.id) };
  }
  function render(ctx, manifest, images, options) {
    options = options || {};
    return draw(ctx, manifest, images, options.rotations || poseFor(options.preset || 'neutral', options.progress === undefined ? 1 : options.progress), options);
  }
  return { PRESETS, EXPLODE, IDENTITY, validateManifest, multiply, transformPoint, rotationAt, poseFor, computeTransforms, frameBounds, layerFor, draw, render };
});

