/**
 * films/shield-of-achilles/shared/lego3d.js
 * Real-Time 3D WebGL LDraw Stop-Motion Cinema Engine for the Nine Shield of Achilles Films.
 *
 * Production Architecture (Animal Logic / The LEGO Movie & Trevor Carlee Stop-Motion Standard):
 * - 100% un-truncated LDraw meshes from achilles/kits/forage-bundle.js & shield-dioramas-bundle.js
 * - Non-Destructive "Animating on 2s" (12 fps stepped F-curve interpolation with per-actor phase)
 * - Full Articulated Minifigure Limb Rigging (EpicFigRig in WebGL):
 *     * 1.0: Torso / Hips / Dress Skirt root (3815, 3815b, 36036, 973, 4524, 10052)
 *     * 1.1: Right Leg (3816, 3816c) swinging around the hip axle
 *     * 1.2: Left Leg (3817, 3817c) swinging in alternating stride around the hip axle
 *     * 1.3: Right Arm + Right Hand + Held Weapon/Staff/Hammer (3818, 3820, prop) swinging at shoulder socket
 *     * 1.4: Left Arm + Left Hand + Held Torch/Shield/Cup (3819, 3820, prop) swinging at shoulder socket
 *     * 1.5: Head + Beard + Hair + Crown + Corinthian Helmet (3626*, 93223, 60749, 3901, 39262, 98366) yawing on neck stud
 *     * 1.6: Quadruped Animals (64452 horse, 14734 lion, 92586 hound, 95341 bull/ox) rearing & bounding on 2s
 * - Reactive LEGO Water (role 4.0) stepping in quantized plate-height ripples & white stud foam
 * - Stop-Motion Replacement Flame Plumes & Forge Sparks (role 2.0)
 * - Master-Builder Helical Flying Brick Assembly (uBuild)
 * - Physical ABS Plastic Subsurface Scatter (SSS), Micro-Roughness/Thumbprint Normals, Stud Contact AO & ACES Filmic
 */
(function (global) {
  'use strict';

  function hexToRgb(hex) {
    const v = parseInt(String(hex || '#888888').replace('#', ''), 16);
    return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
  }

  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerp3(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
  function easeInOutCubic(t) {
    t = clamp(t, 0, 1);
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function perspMat(fovRad, aspect, near, far) {
    const f = 1.0 / Math.tan(fovRad / 2), nf = 1 / (near - far);
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, (2 * far * near) * nf, 0
    ]);
  }

  function lookAtMat(eye, center, up) {
    let zx = eye[0] - center[0], zy = eye[1] - center[1], zz = eye[2] - center[2];
    let len = Math.hypot(zx, zy, zz) || 1; zx /= len; zy /= len; zz /= len;
    let xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx;
    len = Math.hypot(xx, xy, xz) || 1; xx /= len; xy /= len; xz /= len;
    const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    return new Float32Array([
      xx, yx, zx, 0,
      xy, yy, zy, 0,
      xz, yz, zz, 0,
      -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
      -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
      -(zx * eye[0] + zy * eye[1] + zz * eye[2]),
      1
    ]);
  }

  // Build rectangular brick/plate/tile with a physical 45-degree top bevel chamfer
  // so every individual brick and tile edge catches studio highlights and crisp seams.
  function buildRectTris(b, hasStuds) {
    const [x0, y0, z0, x1, y1, z1] = b;
    const ins = 0.22;
    const bev = 0.68; // 45-deg top chamfer in LDU
    const ox0 = x0 + ins, oz0 = z0 + ins;
    const ox1 = x1 - ins, oz1 = z1 - ins;
    const ix0 = x0 + ins + bev, iz0 = z0 + ins + bev;
    const ix1 = x1 - ins - bev, iz1 = z1 - ins - bev;
    const ty0 = y0 + 0.12;      // top surface slightly inset in Y so curved macaroni tiles (27925/79393/27507) never z-fight with rect tiles
    const tyB = y0 + bev * 0.85; // bottom of top chamfer
    const by1 = y1 - ins * 0.35; // bottom of brick

    const p = [
      [ix0, ty0, iz0], [ix1, ty0, iz0], [ix1, ty0, iz1], [ix0, ty0, iz1],
      [ox0, tyB, oz0], [ox1, tyB, oz0], [ox1, tyB, oz1], [ox0, tyB, oz1],
      [ox0, by1, oz0], [ox1, by1, oz0], [ox1, by1, oz1], [ox0, by1, oz1]
    ];
    const quads = [
      [3, 2, 1, 0],
      [0, 1, 5, 4],
      [1, 2, 6, 5],
      [2, 3, 7, 6],
      [3, 0, 4, 7],
      [4, 5, 9, 8],
      [5, 6, 10, 9],
      [6, 7, 11, 10],
      [7, 4, 8, 11],
      [8, 9, 10, 11]
    ];
    const tris = [];
    for (const [a, b_, c, d] of quads) {
      tris.push([p[a], p[b_], p[c]], [p[a], p[c], p[d]]);
    }
    const nx = Math.max(1, Math.round((x1 - x0) / 20));
    const nz = Math.max(1, Math.round((z1 - z0) / 20));
    if (hasStuds && nx * nz <= 48) {
      const segs = 10;
      for (let ix = 0; ix < nx; ix++) {
        for (let iz = 0; iz < nz; iz++) {
          const sx = x0 + (ix + 0.5) * 20, sz = z0 + (iz + 0.5) * 20;
          const sy0 = y0, sy1 = y0 - 4.0, sr = 6.0;
          for (let s = 0; s < segs; s++) {
            const a0 = (s / segs) * Math.PI * 2, a1 = ((s + 1) / segs) * Math.PI * 2;
            const xA = sx + Math.cos(a0) * sr, zA = sz + Math.sin(a0) * sr;
            const xB = sx + Math.cos(a1) * sr, zB = sz + Math.sin(a1) * sr;
            tris.push(
              [[xA, sy1, zA], [xB, sy1, zB], [xB, sy0, zB]],
              [[xA, sy1, zA], [xB, sy0, zB], [xA, sy0, zA]],
              [[sx, sy1, sz], [xB, sy1, zB], [xA, sy1, zA]]
            );
          }
        }
      }
    }
    return tris;
  }

  function buildMeshTris(mData) {
    const v = mData.v, idx = mData.i, tc = mData.c || [];
    const tris = [];
    for (let k = 0; k < idx.length; k += 3) {
      const i0 = idx[k] * 3, i1 = idx[k + 1] * 3, i2 = idx[k + 2] * 3;
      tris.push({
        pts: [[v[i0], v[i0 + 1], v[i0 + 2]], [v[i1], v[i1 + 1], v[i1 + 2]], [v[i2], v[i2 + 1], v[i2 + 2]]],
        col: tc[k / 3] !== undefined ? tc[k / 3] : 16
      });
    }
    return tris;
  }

  // True quadruped / creature roots (excluding minifigure beards 60749 and hair 11264, 33322!)
  const ANIMAL_ROOTS = new Set([
    '64452', '64452p01', '64452p02', '64779c01', '64835p01c01',
    '80672a', '14734', '14734p01', '48812',
    '92586', '92586p01', '98386p01',
    '95341', '95341p01', '95341p02', '95341p03',
    '10509', '10509p01', '10509p02', '4490',
    '87621', '87621p01', '87621p02',
    '11467', '11467p01', '11467p02',
    '67632p01', '67632p02', '92084p01', '41835p01', '12891', '12891p01', '2546', '2546p01', '2546p02',
    '40243', '13392p02'
  ]);
  const ANIMAL_SUBPARTS = new Set([
    '13564', '64847', '53451', '54200', '3023', '98138',
    '11777p01', '11778p01', '11777p02', '11778p02', '1613'
  ]);
  // Head-mounted accessories that yaw with the minifigure head (3626*) on the neck stud
  const HEAD_ACC = new Set([
    '3901', '39262', '3844', '98366', '11256', '12890', '13251', '32602',
    '11264', '33322', '93562', '10048', '10053', '10054', '4592', '93223', '60749',
    '60750', '93069', '11255', '20595', '27059', '30381', '40239', '40251',
    '4505a', '60747', '60751', '62711', '88283', '98138'
  ]);
  // Torso-mounted accessories (capes, armor, neck brackets)
  const TORSO_ACC = new Set(['4524', '10052', '2526', '3840', '42446']);

  function classifyRole(pid, col, wy, rDist, grpInfo) {
    if (grpInfo) return grpInfo.subRole; // 1.0..1.6 articulated minifigure or animal sub-part
    const p = String(pid).toLowerCase();
    if (p.includes('6126') || p.includes('37775') || p.includes('85959') || col === 46 || col === 57) {
      return 2.0; // Stop-motion replacement flame / trans-orange ember
    }
    if (wy > 34 && (col === 297 || col === 179 || col === 80) && rDist < 220) {
      return 3.0; // Elevated golden/silver boss or statue element
    }
    // Trevor Carlee Reactive LEGO Water: riverbeds, Oceanus rim waves, and trans-blue/white water foam studs
    if ((col === 1 || col === 73 || col === 43 || col === 212) ||
        (col === 47 && wy <= 48) ||
        (col === 15 && (p.startsWith('98138') || p.startsWith('4073') || p.startsWith('3024')) && wy <= 42)) {
      return 4.0;
    }
    // Botanical foliage, tree leaves, reeds & blossoms (subtle 12-fps stop-motion breeze on 2s)
    if (p.startsWith('2417') || p.startsWith('2423') || p.startsWith('32607') ||
        p.startsWith('24866') || p.startsWith('1997') || p.startsWith('11127')) {
      return 4.5;
    }
    return 0.0;
  }

  // Compute radial section ID (0..10) for 96x96 circular shield lift-out animation
  function computeSectionId(wx, wy, wz) {
    const r = Math.hypot(wx, wz) / 20.0;
    if (wy < 14.0) return 0.0;
    if (r <= 10.5) return 1.0;
    if (r <= 21.5) return wx < 0 ? 2.0 : 3.0;
    if (r <= 32.5) {
      if (wz < -80) return 4.0;
      return wx < 0 ? 5.0 : 6.0;
    }
    if (r <= 41.5) {
      if (wz < -80) return 7.0;
      return wx < 0 ? 8.0 : 9.0;
    }
    return 10.0;
  }

  const VS_SRC = `
    attribute vec3 aPos;
    attribute vec3 aNorm;
    attribute vec4 aCol;
    attribute vec3 aCenter;
    attribute vec4 aMeta; // x: buildOrder (0..1), y: turnFlag, z: role (0..4), w: sectionId (0..10)
    attribute vec2 aPivot;
    attribute vec3 aRig;  // x: limbPivotY, y: latX, z: latZ (minifigure shoulder/hip lateral unit axis)

    uniform mat4 uProj;
    uniform mat4 uView;
    uniform float uTime;
    uniform float uBuild;     // 0..1 (1 = fully built)
    uniform float uExplode;   // 0..1 (modular lift-out of sections)
    uniform float uTurnAngle; // turntable / boss rotation angle
    uniform float uPulseR;    // radial shockwave radius in LDU (-1 = off)
    uniform float uPulseAmp;  // shockwave vertical amplitude

    varying vec3 vNorm;
    varying vec3 vPos;
    varying vec4 vCol;
    varying float vGlow;

    // Rotate point p and normal n around horizontal unit axis u = (latX, 0, latZ) passing through (cx, pivY, cz)
    void rotateLimbX(inout vec3 p, inout vec3 n, float cx, float pivY, float cz, float latX, float latZ, float ang) {
      vec2 f = vec2(-latZ, latX); // forward facing horizontal unit vector perpendicular to lateral axis
      float dx = p.x - cx;
      float dz = p.z - cz;
      float df = dx * f.x + dz * f.y;
      float dy = p.y - pivY;
      float c = cos(ang), s = sin(ang);
      float dfNew = df * c - dy * s;
      float dyNew = df * s + dy * c;
      p.x += (dfNew - df) * f.x;
      p.y = pivY + dyNew;
      p.z += (dfNew - df) * f.y;

      float nf = n.x * f.x + n.z * f.y;
      float ny = n.y;
      float nfNew = nf * c - ny * s;
      float nyNew = nf * s + ny * c;
      n.x += (nfNew - nf) * f.x;
      n.y = nyNew;
      n.z += (nfNew - nf) * f.y;
    }

    void main() {
      vec3 p = aPos;
      vec3 n = aNorm;
      float buildOrder = aMeta.x;
      float turnFlag = aMeta.y;
      float role = aMeta.z;
      float secId = aMeta.w;

      // 1. Master-Builder Flying Brick Assembly (The LEGO Movie style helical snap-in!)
      float span = 0.14;
      float localB = clamp((uBuild * (1.0 + span) - buildOrder) / span, 0.0, 1.0);
      if (localB <= 0.001) {
        gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        return;
      }
      if (localB < 1.0) {
        // Quantize assembly on 2s (12 fps) for authentic stop-motion Master Building
        float qB = floor(localB * 10.0) / 10.0;
        float inv = 1.0 - localB;
        float dropY = inv * inv * 320.0 - sin(localB * 3.14159) * 16.0 * inv;
        float swirl = inv * 2.4 * (fract(buildOrder * 97.3) - 0.5);
        float cs = cos(swirl), ss = sin(swirl);
        float bx = p.x - aCenter.x, bz = p.z - aCenter.z;
        p.x = aCenter.x + bx * cs - bz * ss + sin(qB * 6.283 + buildOrder * 31.0) * 28.0 * inv;
        p.z = aCenter.z + bx * ss + bz * cs + cos(qB * 6.283 + buildOrder * 31.0) * 28.0 * inv;
        p.y += dropY;
      }

      // 2. Modular Section Lift-Out (Exploded view of M0..M9 above frame)
      if (uExplode > 0.001 && secId > 0.5) {
        float phase = mod(secId * 0.618, 1.0);
        float lift = uExplode * (85.0 + 55.0 * (10.0 - secId) * 0.15 + 18.0 * sin(uTime * 2.2 + phase * 6.283));
        p.y += lift;
        p.x += aCenter.x * uExplode * 0.12;
        p.z += aCenter.z * uExplode * 0.12;
      }

      // 3. Trevor Carlee Non-Destructive "Animating on 2s" (12 fps Stepped Interpolation)
      //    + Character-Specific Acting Archetypes (actStyle 1..9), 3D Ballistic Arrows (5.0) & Anvil Sparks (6.0)
      float glow = 0.0;
      float actStyleF = floor(role / 10.0 + 0.01);
      int actStyle = int(actStyleF);
      float baseRole = role - actStyleF * 10.0;

      if (baseRole > 0.5 && baseRole < 1.75) {
        float seed = fract(sin(aCenter.x * 0.037 + aCenter.z * 0.071) * 43758.5453);
        // Non-destructive 12 fps stepped F-curve modifier (holds each pose for 2 frames at 24/30 fps)
        float qTime = (floor(uTime * 12.0 + seed * 6.0) - seed * 6.0) / 12.0;
        float pivY = aRig.x;
        float latX = aRig.y;
        float latZ = aRig.z;

        if (baseRole > 1.55) {
          // 1.6: Species-Specific Quadruped Animal Acting on 2s (Hooves 100% locked onto ground studs, deltaY = 0!)
          float upperW = clamp((p.y - (pivY - 12.0)) / 24.0, 0.0, 1.0);
          float grazePitch = 0.0;
          float animYaw = 0.0;
          if (actStyle == 1) {
            // Tawny Lions (80672a / 14734): Fierce predator lunge & maul wrench on 2s
            grazePitch = (sin(qTime * 5.2 + seed * 6.283) * 0.11 - 0.04) * upperW;
            animYaw = sin(qTime * 6.4 + seed * 3.14) * 0.095 * upperW;
          } else if (actStyle == 2) {
            // Lofty-Horned Cattle & Bellowing Bull (64452*): Skyward head-toss & wide horn sweep
            grazePitch = (sin(qTime * 3.2 + seed * 6.283) * 0.085 + 0.03) * upperW;
            animYaw = sin(qTime * 2.4 + seed * 4.71) * 0.075 * upperW;
          } else if (actStyle == 3) {
            // Swift Hunting Hounds (92586*): Rapid double-bark head snaps & alert play-bow
            grazePitch = (sin(qTime * 8.5 + seed * 6.283) * 0.09) * upperW;
            animYaw = cos(qTime * 7.2 + seed * 2.1) * 0.08 * upperW;
          } else {
            // Woolly Sheep, Goats & Lambs (95341*): Calm pastoral grazing dip & flock look-around
            grazePitch = (sin(qTime * 2.6 + seed * 6.283) * 0.065 - 0.025) * upperW;
            animYaw = sin(qTime * 1.8 + seed * 4.71) * 0.055 * upperW;
          }
          rotateLimbX(p, n, aCenter.x, pivY - 12.0, aCenter.z, latX, latZ, grazePitch);
          float ac = cos(animYaw), as = sin(animYaw);
          float adx = p.x - aCenter.x, adz = p.z - aCenter.z;
          p.x = aCenter.x + adx * ac - adz * as;
          p.z = aCenter.z + adx * as + adz * ac;
          float anx = n.x * ac - n.z * as;
          float anz = n.x * as + n.z * ac;
          n.x = anx; n.z = anz;
        } else {
          // 1.0..1.5: 9 Character-Specific Minifigure Acting Archetypes on 2s (Feet & legs 100% stud-locked, deltaY = 0!)
          float rArmAng = 0.0;
          float lArmAng = 0.0;
          float headYaw = 0.0;
          float headNod = 0.0;
          float torsoLean = 0.0;
          float torsoYaw = 0.0;

          if (actStyle == 1) {
            // Archetype 1: BOWMAN / SPEARMAN (Odysseus & Telemachus in Ambush, Castle Sentry, Ares, Athena, Phalanx, 4 Herdsmen)
            // 4-Phase Asymmetric Archery Cycle (2.4s period): Draw & Aim -> Sniper Hold -> Snappy Release Recoil -> Follow-Through
            float cyc = fract(qTime / 2.4 + seed);
            if (cyc < 0.65) {
              float drawP = clamp(cyc / 0.45, 0.0, 1.0);
              rArmAng = 0.16 + 0.48 * drawP;
              lArmAng = 0.10 + 0.34 * drawP;
              torsoLean = -0.08 * drawP;
              torsoYaw = 0.15 * drawP;
              headYaw = 0.18 * drawP;
              headNod = -0.06 * drawP;
            } else if (cyc < 0.78) {
              // Snappy bowstring release & recoil!
              rArmAng = 0.20;
              lArmAng = -0.10;
              torsoLean = 0.05;
              torsoYaw = -0.06;
              headYaw = 0.08;
              headNod = 0.04;
              glow = 0.18;
            } else {
              // Lower bow & nock next arrow
              float recP = (cyc - 0.78) / 0.22;
              rArmAng = mix(0.20, 0.16, recP);
              lArmAng = mix(-0.10, 0.10, recP);
              torsoLean = mix(0.05, 0.0, recP);
              torsoYaw = mix(-0.06, 0.0, recP);
              headYaw = mix(0.08, 0.0, recP);
            }
          } else if (actStyle == 2) {
            // Archetype 2: AGORA DEBATERS (Crimson Claimant vs. Kyanos Defendant & Conversing Citizens)
            // Turn-taking 4.0s rhetorical dialogue across the Two Talents of Gold!
            float isLeft = step(aCenter.x, 0.0);
            float dPhase = fract(qTime / 4.0 + isLeft * 0.5);
            if (dPhase < 0.5) {
              // Active Speaker: leans forward, thrusts one hand toward the Two Talents of Gold and the other to the Elders
              float spT = dPhase * 2.0;
              float emp = sin(spT * 3.14159);
              float cad = sin(qTime * 6.5 + seed * 3.14);
              rArmAng = 0.28 + 0.34 * cad * emp;
              lArmAng = 0.16 - 0.24 * cos(qTime * 5.2) * emp;
              torsoLean = -0.09 * emp;
              torsoYaw = sin(qTime * 3.2) * 0.14 * emp;
              headYaw = sin(qTime * 4.2) * 0.24;
              headNod = -0.07 * abs(cad);
              glow = 0.14 * emp;
            } else {
              // Skeptical Listener -> Vigorous Head-Shaking Rebuttal ("He refuses to take anything!" Il. XVIII.500)
              float lsT = (dPhase - 0.5) * 2.0;
              if (lsT < 0.52) {
                rArmAng = 0.06;
                lArmAng = 0.08;
                torsoLean = 0.06;
                headYaw = 0.16 * sin(qTime * 1.8);
                headNod = 0.03;
              } else {
                rArmAng = 0.46 + 0.18 * sin(qTime * 8.0);
                lArmAng = 0.42 + 0.18 * cos(qTime * 8.0);
                torsoLean = 0.04;
                torsoYaw = sin(qTime * 5.5) * 0.10;
                headYaw = sin(qTime * 11.0) * 0.30;
                headNod = 0.02;
              }
            }
          } else if (actStyle == 3) {
            // Archetype 3: ENTHRONED ELDER JUDGES / SILENT KING MENELAUS / ROYAL LOGGIA / AUDITOR ATHENA
            // Deliberate left-to-right judicial survey followed by solemn nod & Golden Sceptre gavel strike!
            float jPhase = fract(qTime / 3.6 + seed * 0.5);
            if (jPhase < 0.65) {
              float sAng = (jPhase / 0.65) * 6.28318;
              rArmAng = 0.14 + 0.05 * sin(sAng);
              lArmAng = 0.06;
              headYaw = sin(sAng) * 0.28;
              torsoYaw = headYaw * 0.32;
              headNod = 0.02 * cos(sAng);
            } else {
              float gT = (jPhase - 0.65) / 0.35;
              float gArc = sin(gT * 3.14159);
              rArmAng = 0.14 + 0.52 * gArc;
              lArmAng = 0.12 * gArc;
              torsoLean = -0.06 * gArc;
              headNod = -0.10 * abs(sin(gT * 6.28318));
              glow = 0.18 * gArc;
            }
          } else if (actStyle == 4) {
            // Archetype 4: HEPHAESTUS THE MASTER SMITH (Hammer 4589/55295 + Tongs 3959 at the Anvil, 1.6s cycle)
            float hPhase = fract(qTime / 1.6 + seed);
            if (hPhase < 0.52) {
              // High overhead hammer wind-up
              float wP = hPhase / 0.52;
              rArmAng = 0.10 + 0.78 * (wP * wP);
              lArmAng = 0.24;
              torsoLean = 0.06 * wP;
              headNod = 0.05 * wP;
            } else if (hPhase < 0.66) {
              // Explosive downward anvil smash!
              rArmAng = -0.16;
              lArmAng = 0.28;
              torsoLean = -0.12;
              headNod = -0.11;
              glow = 0.32;
            } else {
              // Recovery & left-hand tongs work-piece turn
              float recP = (hPhase - 0.66) / 0.34;
              rArmAng = mix(-0.16, 0.10, recP);
              lArmAng = 0.24 + 0.22 * sin(recP * 3.14159);
              torsoYaw = 0.14 * sin(recP * 3.14159);
              headYaw = -0.18 * sin(recP * 3.14159);
            }
          } else if (actStyle == 5) {
            // Archetype 5: HARVEST REAPER & SACRIFICER (3847 Bronze Sickle Swath Cut across Wheat Stalks)
            float sPhase = fract(qTime / 2.0 + seed);
            float cutWave = sin(sPhase * 6.28318);
            rArmAng = 0.28 + 0.38 * cutWave;
            lArmAng = 0.22 - 0.26 * cutWave;
            torsoLean = -0.09 - 0.05 * max(0.0, cutWave);
            torsoYaw = cutWave * 0.28;
            headYaw = cutWave * 0.22;
            headNod = -0.07;
          } else if (actStyle == 6) {
            // Archetype 6: DIVINE BARD DEMODOCUS / BOY PHEMIUS / AULOS PIPERS EUMAEUS & PHILOETIUS
            lArmAng = 0.36 + 0.06 * sin(qTime * 3.2);
            rArmAng = 0.32 + 0.22 * sin(qTime * 9.5 + seed * 6.283);
            torsoYaw = sin(qTime * 2.8 + seed * 3.14) * 0.14;
            torsoLean = sin(qTime * 2.8) * 0.04;
            headNod = 0.08 + 0.05 * sin(qTime * 4.5);
            headYaw = sin(qTime * 2.8 + seed) * 0.22;
          } else if (actStyle == 8) {
            // Archetype 8: CUP-BEARER MEDON / SILVER-FOOTED THETIS / THREE FATES / PLOUGHMEN & SHEPHERD
            float oPhase = sin(qTime * 2.1 + seed * 6.283);
            float ext = max(0.0, oPhase);
            rArmAng = 0.24 + 0.26 * ext;
            lArmAng = 0.18 + 0.20 * ext;
            torsoLean = -0.07 * ext;
            headNod = -0.08 * ext;
            headYaw = sin(qTime * 1.4 + seed * 6.283) * 0.16;
          } else if (actStyle == 9) {
            // Archetype 9: GIT WORKTREE CODING AGENT (Rapid 12-fps alternating keystrokes & dual-monitor scan)
            rArmAng = 0.28 + 0.14 * sin(qTime * 12.0 + seed * 5.1);
            lArmAng = 0.28 - 0.14 * sin(qTime * 12.0 + seed * 5.1);
            torsoLean = -0.06;
            torsoYaw = sin(qTime * 2.4 + seed) * 0.08;
            headYaw = sin(qTime * 3.6 + seed * 4.2) * 0.22;
            headNod = -0.05 + 0.03 * sin(qTime * 7.2);
          } else {
            // Archetype 7 (Default): WHIRLING CHOROS & BRIDAL RING-DANCER / TUMBLING ACROBATS
            rArmAng = 0.34 + 0.30 * sin(qTime * 4.2 + seed * 6.283);
            lArmAng = 0.34 - 0.30 * sin(qTime * 4.2 + seed * 6.283);
            torsoYaw = cos(qTime * 4.2 + seed * 6.283) * 0.20;
            torsoLean = sin(qTime * 8.4 + seed) * 0.045;
            headYaw = sin(qTime * 4.2 + seed * 6.283) * 0.26;
            headNod = cos(qTime * 4.2) * 0.055;
          }

          if (baseRole > 1.25 && baseRole < 1.35) {
            rotateLimbX(p, n, aCenter.x, pivY, aCenter.z, latX, latZ, rArmAng);
          } else if (baseRole > 1.35 && baseRole < 1.45) {
            rotateLimbX(p, n, aCenter.x, pivY, aCenter.z, latX, latZ, lArmAng);
          } else if (baseRole > 1.45 && baseRole < 1.55) {
            float hc = cos(headYaw), hs = sin(headYaw);
            float hdx = p.x - aCenter.x, hdz = p.z - aCenter.z;
            p.x = aCenter.x + hdx * hc - hdz * hs;
            p.z = aCenter.z + hdx * hs + hdz * hc;
            float hnx = n.x * hc - n.z * hs;
            float hnz = n.x * hs + n.z * hc;
            n.x = hnx; n.z = hnz;
            rotateLimbX(p, n, aCenter.x, pivY, aCenter.z, latX, latZ, headNod);
          }

          // Upper-body waist-hinge lean & torso twist above hipY (aCenter.y), keeping legs 100% locked to studs!
          if ((baseRole < 1.05 && p.y > aCenter.y + 2.0) || baseRole > 1.25) {
            rotateLimbX(p, n, aCenter.x, aCenter.y + 4.0, aCenter.z, latX, latZ, torsoLean);
            float tc = cos(torsoYaw), ts = sin(torsoYaw);
            float tdx = p.x - aCenter.x, tdz = p.z - aCenter.z;
            p.x = aCenter.x + tdx * tc - tdz * ts;
            p.z = aCenter.z + tdx * ts + tdz * tc;
            float tnx = n.x * tc - n.z * ts;
            float tnz = n.x * ts + n.z * tc;
            n.x = tnx; n.z = tnz;
          }
        }
      } else if (role > 1.75 && role < 2.5) {
        // 2.0: Stop-Motion Replacement Flame / Forge Spark (stepped at 12 fps!)
        float seed = fract(sin(aCenter.x * 0.11 + aCenter.z * 0.17) * 19341.2);
        float qTime = floor(uTime * 12.0 + seed * 8.0) / 12.0;
        float flick = 0.5 + 0.5 * sin(qTime * 24.0 + seed * 6.283);
        float sway = sin(qTime * 19.0 + seed * 3.14) * 2.2;
        p.x += sway * clamp((p.y - aCenter.y) * 0.08, 0.0, 1.5);
        p.y += flick * 3.8;
        glow = 0.78 + 0.42 * flick;
      } else if (role > 2.5 && role < 3.5) {
        // 3.0: Golden deity / celestial emblem stepped hover
        float qTime = floor(uTime * 12.0) / 12.0;
        p.y += sin(qTime * 2.4 + aCenter.x * 0.02) * 2.0;
        glow = 0.18;
      } else if (role > 3.5 && role < 4.25) {
        // 4.0: Trevor Carlee Reactive LEGO Water (quantized plate-step ripples on 2s!)
        float qTime = floor(uTime * 12.0) / 12.0;
        float wave = sin(aCenter.x * 0.035 + aCenter.z * 0.035 - qTime * 5.0)
                   + 0.5 * cos(aCenter.x * 0.06 - aCenter.z * 0.05 + qTime * 3.8);
        float quantWave = floor(wave * 2.2) * 1.4;
        p.y += quantWave;
        glow = max(0.0, quantWave * 0.06);
      } else if (role > 4.25 && role < 4.75) {
        // 4.5: Botanical Foliage, Tree Canopy & Reed Breeze on 2s (rossark-motion-skill calm wind sway)
        float seed = fract(sin(aCenter.x * 0.053 + aCenter.z * 0.089) * 28411.7);
        float qTime = (floor(uTime * 12.0 + seed * 6.0) - seed * 6.0) / 12.0;
        float breeze = sin(qTime * 2.4 + aCenter.x * 0.018 + aCenter.z * 0.014);
        p.x += breeze * 0.85;
        p.z += cos(qTime * 2.1 + seed * 6.283) * 0.55;
        p.y += sin(qTime * 3.2 + seed * 3.14) * 0.35;
      } else if (role > 4.75 && role < 5.5) {
        // 5.0: 3D Brick-Built Ballistic Arrow (Draws on bow for cyc < 0.65, then streaks across battlefield on parabolic arc!)
        float seed = aRig.x;
        float latX = aRig.y;
        float latZ = aRig.z;
        float qTime = (floor(uTime * 12.0 + seed * 6.0) - seed * 6.0) / 12.0;
        float cyc = fract(qTime / 2.4 + seed);
        if (cyc < 0.65) {
          float drawP = clamp(cyc / 0.45, 0.0, 1.0);
          rotateLimbX(p, n, aCenter.x, aCenter.y, aCenter.z, latX, latZ, 0.22 * drawP);
          p.x -= aPivot.x * drawP * 6.0;
          p.z -= aPivot.y * drawP * 6.0;
          p.y += drawP * 4.0;
          glow = 0.16 * drawP;
        } else {
          float flightT = (cyc - 0.65) / 0.35;
          float dist = flightT * 215.0;
          float arcY = 165.0 * flightT * (1.0 - flightT) - 12.0 * flightT;
          float arrowPitch = (0.46 - flightT) * 0.60;
          rotateLimbX(p, n, aCenter.x, aCenter.y, aCenter.z, latX, latZ, arrowPitch);
          p.x += aPivot.x * dist;
          p.z += aPivot.y * dist;
          p.y += arcY;
          glow = 0.42;
        }
      } else if (role > 5.5 && role < 6.5) {
        // 6.0: 3D Brick-Built Anvil Spark Burst (Erupts radially from Hephaestus's anvil on every hammer impact!)
        float seed = aRig.x;
        float spSpeed = aRig.y;
        float spLift = aRig.z;
        float qTime = (floor(uTime * 12.0 + seed * 6.0) - seed * 6.0) / 12.0;
        float hPhase = fract(qTime / 1.6 + seed);
        if (hPhase >= 0.52) {
          float spT = (hPhase - 0.52) / 0.48;
          p.x += aPivot.x * spT * spSpeed;
          p.z += aPivot.y * spT * spSpeed;
          p.y += spLift * 4.0 * spT * (1.0 - spT);
          glow = (1.0 - spT * 0.55) * 1.15;
        } else {
          p.y -= 6.0;
          glow = 0.35;
        }
      }

      // 4. Turntable / Choros Potter's Wheel / Celestial Boss rotation
      // Only rotates turntable-mounted elements above the floor baseplate (aCenter.y >= 38.0)
      if (turnFlag > 0.5 && aCenter.y >= 38.0) {
        float ang = uTurnAngle;
        float c = cos(ang), s = sin(ang);
        float px = aPivot.x;
        float pz = aPivot.y;
        float dx = p.x - px;
        float dz = p.z - pz;
        p.x = px + dx * c - dz * s;
        p.z = pz + dx * s + dz * c;
        float nx = n.x * c - n.z * s;
        float nz = n.x * s + n.z * c;
        n.x = nx; n.z = nz;
      }

      // 5. Acoustic / Forge Radial Shockwave (for beat hits & Earshot onsets)
      // Keeps baseplates, actors, animals & masonry 100% locked to their studs (zero vertical bounce!) while pulsing flames & Master Builder rim glow
      if (uPulseR >= 0.0 && uPulseAmp > 0.001) {
        float r = length(aCenter.xz);
        float dist = abs(r - uPulseR);
        if (dist < 140.0) {
          float w = exp(-(dist * dist) / (2.0 * 48.0 * 48.0)) * uPulseAmp;
          if (role > 1.75 && role < 2.5) p.y += w * 3.5;
          glow = max(glow, w * 0.32);
        }
      }

      vPos = p;
      vNorm = n;
      vCol = aCol;
      vGlow = glow;
      gl_Position = uProj * uView * vec4(p, 1.0);
    }
  `;

  const FS_SRC = `
    precision highp float;
    varying vec3 vNorm;
    varying vec3 vPos;
    varying vec4 vCol;
    varying float vGlow;

    uniform vec3 uEye;
    uniform vec3 uTorchPos;
    uniform vec3 uTorchCol;
    uniform float uTorchStr;
    uniform vec3 uSunCol;

    vec3 acesFilm(vec3 x) {
      return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
    }

    void main() {
      vec3 N = normalize(vNorm);
      if (!gl_FrontFacing) N = -N;
      vec3 V = normalize(uEye - vPos);

      // Animal Logic / Mecabricks Molded ABS Micro-Roughness & Subtle Thumbprint Normal Perturbation
      float microGrain = sin(vPos.x * 2.9 + vPos.y * 1.7) * cos(vPos.z * 2.9 - vPos.y * 1.3);
      float thumbWave  = sin(vPos.x * 0.14 + vPos.z * 0.11) * cos(vPos.z * 0.15 - vPos.y * 0.18);
      N = normalize(N + vec3(microGrain * 0.012 + thumbWave * 0.015, thumbWave * 0.008, -microGrain * 0.012));

      // 360-Degree Two-Sided Opposing Studio Softbox Rig:
      vec3 L1 = normalize(vec3(0.68, 0.48, 0.55));
      vec3 L2 = normalize(vec3(-0.66, 0.44, -0.61));
      vec3 L3 = normalize(vec3(-0.58, 0.25, 0.77));
      vec3 L4 = normalize(vec3(0.58, 0.28, -0.76));

      float isRect = step(1.5, vCol.a);
      float metal = mod(vCol.a, 2.0);
      vec3 base = pow(clamp(vCol.rgb, 0.0, 1.0), vec3(2.2));

      // Subsurface Scattering (SSS) wrap diffuse for warm tactile ABS plastic (prevents harsh CG black shadows on minifig faces)
      float sssWrap = mix(0.28, 0.04, metal);
      float d1 = max((dot(N, L1) + sssWrap) / (1.0 + sssWrap), 0.0);
      float d2 = max((dot(N, L2) + sssWrap) / (1.0 + sssWrap), 0.0);
      float d3 = max((dot(N, L3) + sssWrap * 0.5) / (1.0 + sssWrap * 0.5), 0.0);
      float d4 = max((dot(N, L4) + sssWrap * 0.5) / (1.0 + sssWrap * 0.5), 0.0);

      float hemiMix = N.y * 0.5 + 0.5;
      vec3 hemiCol = mix(vec3(0.19, 0.16, 0.14), vec3(0.94, 0.90, 0.85), hemiMix);

      // Crisp LDraw brick/plate micro-seam shading + Stud Ring Contact Ambient Occlusion
      vec2 cellXZ = fract((vPos.xz + 10.0) / 20.0) - 0.5;
      float gx = abs(cellXZ.x) * 2.0;
      float gz = abs(cellXZ.y) * 2.0;
      float gy = abs(fract(vPos.y / 8.0) - 0.5) * 2.0;
      float seamH = smoothstep(0.87, 0.99, max(gx, gz)) * step(0.55, abs(N.y));
      float seamV = smoothstep(0.85, 0.985, gy) * (1.0 - step(0.65, abs(N.y)));

      // Stud base contact shadow ring (at r = 6 LDU -> r_norm = 6/20 = 0.30 in 20-LDU stud grid)
      // + Molded stud top bevel highlight ring (at r_norm = 0.27) for authentic LEGO injection-molded stud crowns
      float studR = length(cellXZ);
      float studRingAO = 1.0 - 0.24 * exp(-pow((studR - 0.30) / 0.062, 2.0)) * step(0.65, N.y);
      float studCrown  = 0.16 * exp(-pow((studR - 0.26) / 0.028, 2.0)) * step(0.85, N.y);
      // Ground / Plinth vertical contact shadow
      float groundAO = 0.85 + 0.15 * smoothstep(0.0, 30.0, vPos.y);
      float cavity = (1.0 - (0.26 * isRect + 0.11 * (1.0 - isRect)) * max(seamH, seamV)) * studRingAO * groundAO;

      // Directional normal shading so perpendicular brick faces & embossed 98283/15533 masonry grooves have strong 3D relief
      float dirShade = 0.84 + 0.16 * (N.x * 0.62 + N.z * 0.38);

      // Dynamic Torch / Forge Point Light
      vec3 toLight = uTorchPos - vPos;
      float lDist = length(toLight);
      vec3 Lp = toLight / max(lDist, 1.0);
      float atten = uTorchStr / (1.0 + 0.0014 * lDist + 0.0000052 * lDist * lDist);
      float dp = max((dot(N, Lp) + sssWrap) / (1.0 + sssWrap), 0.0) * atten;

      // Warm ABS subsurface scatter tint in shadow terminators
      vec3 sssTint = base * vec3(1.14, 0.92, 0.76) * (1.0 - metal) * 0.08;

      vec3 diff = (base * cavity * dirShade + sssTint) * (
        hemiCol * 0.25 +
        uSunCol * d1 * 0.82 +
        vec3(0.92, 0.90, 0.88) * d2 * 0.52 +
        vec3(0.68, 0.82, 1.0) * d3 * 0.26 +
        vec3(1.0, 0.86, 0.64) * d4 * 0.28 +
        uTorchCol * dp * 1.12
      );

      // Dual opposing Blinn-Phong studio softbox highlights + clearcoat ABS gloss + stud crown glint
      vec3 H1 = normalize(L1 + V);
      vec3 H2 = normalize(L2 + V);
      vec3 H3 = normalize(L3 + V);
      vec3 H4 = normalize(L4 + V);
      float shininess = mix(58.0, 88.0, metal);
      float specStrength = mix(0.32, 1.48, metal);
      vec3 specCol = mix(vec3(1.0, 0.98, 0.95), base * 1.48 + vec3(0.18), metal * 0.88);

      float s1 = pow(max(dot(N, H1), 0.0), shininess);
      float s2 = pow(max(dot(N, H2), 0.0), shininess) * 0.85;
      float s3 = pow(max(dot(N, H3), 0.0), shininess * 0.55) * 0.35;
      float s4 = pow(max(dot(N, H4), 0.0), shininess * 0.55) * 0.38;
      vec3 spec = specCol * ((s1 + s2 + s3 + s4) * specStrength + studCrown);

      // Studio environment reflection for metallic Gold (297), Silver (80/179), and Bronze (300)
      vec3 R = reflect(-V, N);
      float envBand = 0.5 + 0.5 * sin(R.y * 6.0 + R.x * 3.0 - R.z * 2.5);
      vec3 envCol = mix(vec3(0.16, 0.11, 0.06), vec3(1.0, 0.92, 0.72), smoothstep(-0.4, 0.75, R.y));
      vec3 metalEnv = base * envCol * (0.36 + 0.64 * envBand) * metal;

      // Animal Logic Rim Backlight & Fresnel Sheen for sculpted ABS separation against the studio cyclorama
      float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);
      float backRim = max(dot(N, normalize(vec3(-0.32, 0.58, -0.75))), 0.0) * fresnel;
      vec3 rim = mix(vec3(1.0, 0.91, 0.74) * (0.14 * fresnel + 0.22 * backRim), base * 0.58 * fresnel, metal);

      // Specular from point light
      vec3 Hp = normalize(Lp + V);
      spec += uTorchCol * pow(max(dot(N, Hp), 0.0), 56.0) * atten * (0.30 + 0.70 * metal);

      vec3 linearOut = diff * mix(1.0, 0.38, metal) + metalEnv + spec + rim + base * vGlow * 1.35 + vec3(1.0, 0.78, 0.32) * vGlow * 0.42;
      vec3 mapped = pow(acesFilm(linearOut * 0.98), vec3(1.0 / 2.2));
      gl_FragColor = vec4(mapped, 1.0);
    }
  `;

  // Fullscreen Animal Logic Studio Cyclorama, Tabletop Reflection & Anamorphic Bokeh Backdrop Pass
  const BG_VS_SRC = `
    attribute vec2 aQuad;
    varying vec2 vUv;
    void main() {
      vUv = aQuad * 0.5 + 0.5;
      gl_Position = vec4(aQuad, 0.999, 1.0);
    }
  `;
  const BG_FS_SRC = `
    precision highp float;
    varying vec2 vUv;
    uniform float uTime;
    uniform vec3 uTorchCol;
    uniform float uCamAz;

    void main() {
      vec2 uv = vUv;
      // 1. Studio Cyclorama Sky + Warm Amber Horizon Rim + Tabletop Vignette
      float horizon = exp(-pow((uv.y - 0.34) * 3.6, 2.0));
      float tableZone = smoothstep(0.38, 0.08, uv.y);
      vec3 skyTop = vec3(0.035, 0.055, 0.11);
      vec3 skyMid = vec3(0.09, 0.13, 0.23);
      vec3 horCol = mix(vec3(0.28, 0.19, 0.12), uTorchCol * 0.36, 0.55);
      vec3 tableCol = vec3(0.05, 0.06, 0.09) + uTorchCol * 0.05 * exp(-pow((uv.x - 0.5) * 2.2, 2.0));

      vec3 col = mix(skyMid, skyTop, smoothstep(0.32, 0.98, uv.y));
      col += horCol * horizon * 0.85;
      col = mix(col, tableCol, tableZone * 0.65);

      // 2. Out-of-Focus Anamorphic Studio Bokeh Orbs (stepping on 2s at 12 fps with camera parallax!)
      float qTime = floor(uTime * 12.0) / 12.0;
      for (int i = 0; i < 12; i++) {
        float fi = float(i);
        float seed = fract(sin(fi * 12.9898 + 78.233) * 43758.5453);
        float bx = fract(seed + uCamAz * (0.08 + 0.04 * fract(fi * 0.37)) + qTime * 0.004 * (mod(fi, 2.0) * 2.0 - 1.0));
        float by = 0.28 + 0.54 * fract(sin(fi * 45.164) * 19341.7) + sin(qTime * 0.8 + fi) * 0.008;
        vec2 d = (uv - vec2(bx, by)) * vec2(1.65, 1.0); // anamorphic oval bokeh aspect
        float r = length(d);
        float rad = 0.028 + 0.036 * fract(seed * 7.13);
        // Soft disc + bright cat's-eye outer bokeh ring
        float disc = smoothstep(rad, rad * 0.65, r);
        float ring = smoothstep(rad * 0.55, rad * 0.88, r) * disc;
        vec3 bCol = (mod(fi, 3.0) < 0.5)
          ? vec3(1.0, 0.78, 0.36)
          : ((mod(fi, 3.0) < 1.5) ? uTorchCol : vec3(0.48, 0.76, 1.0));
        col += bCol * (disc * 0.035 + ring * 0.055);
      }

      // Subtle cinematic radial vignette
      float vig = 1.0 - 0.28 * dot(uv - 0.5, uv - 0.5) * 2.2;
      gl_FragColor = vec4(col * vig, 0.72);
    }
  `;

  class LegoCinemaEngine {
    constructor(canvas) {
      this.canvas = canvas;
      const gl = canvas.getContext('webgl', { antialias: true, alpha: true, preserveDrawingBuffer: true });
      this.gl = gl;

      const compile = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          console.error('Shader error:', gl.getShaderInfoLog(s));
        }
        return s;
      };
      const prog = gl.createProgram();
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS_SRC));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS_SRC));
      gl.linkProgram(prog);
      gl.useProgram(prog);
      this.prog = prog;

      const bgProg = gl.createProgram();
      gl.attachShader(bgProg, compile(gl.VERTEX_SHADER, BG_VS_SRC));
      gl.attachShader(bgProg, compile(gl.FRAGMENT_SHADER, BG_FS_SRC));
      gl.linkProgram(bgProg);
      this.bgProg = bgProg;
      this.bgLocs = {
        aQuad: gl.getAttribLocation(bgProg, 'aQuad'),
        uTime: gl.getUniformLocation(bgProg, 'uTime'),
        uTorchCol: gl.getUniformLocation(bgProg, 'uTorchCol'),
        uCamAz: gl.getUniformLocation(bgProg, 'uCamAz')
      };
      this.bgVbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bgVbo);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

      this.locs = {
        aPos: gl.getAttribLocation(prog, 'aPos'),
        aNorm: gl.getAttribLocation(prog, 'aNorm'),
        aCol: gl.getAttribLocation(prog, 'aCol'),
        aCenter: gl.getAttribLocation(prog, 'aCenter'),
        aMeta: gl.getAttribLocation(prog, 'aMeta'),
        aPivot: gl.getAttribLocation(prog, 'aPivot'),
        aRig: gl.getAttribLocation(prog, 'aRig'),
        uProj: gl.getUniformLocation(prog, 'uProj'),
        uView: gl.getUniformLocation(prog, 'uView'),
        uTime: gl.getUniformLocation(prog, 'uTime'),
        uBuild: gl.getUniformLocation(prog, 'uBuild'),
        uExplode: gl.getUniformLocation(prog, 'uExplode'),
        uTurnAngle: gl.getUniformLocation(prog, 'uTurnAngle'),
        uPulseR: gl.getUniformLocation(prog, 'uPulseR'),
        uPulseAmp: gl.getUniformLocation(prog, 'uPulseAmp'),
        uEye: gl.getUniformLocation(prog, 'uEye'),
        uTorchPos: gl.getUniformLocation(prog, 'uTorchPos'),
        uTorchCol: gl.getUniformLocation(prog, 'uTorchCol'),
        uTorchStr: gl.getUniformLocation(prog, 'uTorchStr'),
        uSunCol: gl.getUniformLocation(prog, 'uSunCol')
      };

      this.models = {};
      this.activeSlug = null;

      this.textCanvas = null;
      this.textCtx = null;
      if (typeof document !== 'undefined' && canvas && canvas.parentElement && canvas.width >= 1200) {
        const tc = document.createElement('canvas');
        tc.width = canvas.width;
        tc.height = canvas.height;
        tc.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:4;';
        canvas.parentElement.appendChild(tc);
        this.textCanvas = tc;
        this.textCtx = tc.getContext('2d');
      }
    }

    loadModel(slug) {
      if (this.models[slug]) return this.models[slug];
      const bundle = global.ACHILLES_BUNDLE && (global.ACHILLES_BUNDLE[slug] || global.ACHILLES_BUNDLE['set.' + slug]);
      if (!bundle) {
        console.error('Missing ACHILLES_BUNDLE model:', slug);
        return null;
      }
      const data = bundle.data;
      const gl = this.gl;

      const rectTris = {};
      for (const [pid, rInfo] of Object.entries(data.rect)) {
        if (pid === '98366' || !Array.isArray(rInfo.b) || typeof rInfo.b[0] !== 'number') continue;
        rectTris[pid] = buildRectTris(rInfo.b, rInfo.s === 1);
      }
      const meshTris = {};
      for (const [pid, mInfo] of Object.entries(data.meshes)) {
        if (mInfo.v && mInfo.v.length > 0) meshTris[pid] = buildMeshTris(mInfo);
      }

      const colMap = {};
      for (const [code, info] of Object.entries(data.cols)) {
        const [r, g, b] = hexToRgb(info.hex);
        colMap[code] = [r, g, b, info.m ? 1.0 : 0.0];
      }
      if (!colMap['0']) colMap['0'] = [0.13, 0.16, 0.19, 0.0];

      // Group contiguous minifigure parts in data.inst by anchoring each head (3626*) back to its
      // hips/skirt/torso root (3815*/36036/973) and forward through its hair/beard/crown/helmet/cape
      // and hand-held weapons/scepters/torches/tools, assigning each sub-part its anatomical limb role & pivot!
      const cleanPid = (s) => String(s).toLowerCase().replace(/\.dat$/, '').replace(/_s$/, '');
      const glslFract = (x) => x - Math.floor(x);
      const rawInst = data.inst;
      const actorGroups = new Array(rawInst.length).fill(null);
      const projectileBlocks = [];
      for (let i = 0; i < rawInst.length; i++) {
        const p = cleanPid(rawInst[i][1]);
        if (p.startsWith('3626')) {
          const [hx, hy, hz, ma, mb, mc, md, me, mf, mg, mh, mi] = rawInst[i][2];
          let rootIdx = i;
          for (let j = i - 1; j >= Math.max(0, i - 24); j--) {
            if (actorGroups[j]) break;
            const pj = cleanPid(rawInst[j][1]);
            const [jx, jy, jz] = rawInst[j][2];
            if ((pj.startsWith('3815') || pj === '36036' || pj.startsWith('973')) && Math.hypot(hx - jx, hz - jz) < 42) {
              rootIdx = j;
              if (pj.startsWith('3815') || pj === '36036') break;
            }
          }
          let endIdx = i;
          for (let k = i + 1; k <= Math.min(rawInst.length - 1, i + 10); k++) {
            const pk = cleanPid(rawInst[k][1]);
            const rawPk = String(rawInst[k][1]).toLowerCase();
            if (pk.startsWith('3815') || pk === '36036' || pk.startsWith('973') || pk.startsWith('3626') || ANIMAL_ROOTS.has(pk) || data.rect[rawPk]) break;
            const [kx, ky, kz] = rawInst[k][2];
            if (pk === '98138' || pk === '3062b' || pk === '3024' || pk === '4073') {
              const onHead = Math.hypot(kx - hx, kz - hz) < 6.0 && (-ky) >= (-hy) - 4;
              const inHand = Math.hypot(kx - hx, kz - hz) >= 6.0 && Math.hypot(kx - hx, kz - hz) < 28.0 && (-ky) >= (-hy) - 48 && (-ky) <= (-hy) + 12;
              if (!onHead && !inHand) break;
            }
            if (Math.hypot(kx - hx, kz - hz) < 42 && (-ky) >= (-hy) - 68) {
              endIdx = k;
            } else {
              break;
            }
          }

          let rArmPos = null, lArmPos = null;
          let hipY = -rawInst[rootIdx][2][1];
          let shoulderY = -hy - 24;
          const neckY = -hy;
          const figParts = new Set();
          for (let mIdx = rootIdx; mIdx <= endIdx; mIdx++) {
            const pm = cleanPid(rawInst[mIdx][1]);
            figParts.add(pm);
            const pos = rawInst[mIdx][2];
            if (pm.startsWith('3816') || pm.startsWith('3817')) hipY = -pos[1];
            if (pm === '3818') { rArmPos = [pos[0], -pos[1], pos[2]]; shoulderY = -pos[1]; }
            if (pm === '3819') { lArmPos = [pos[0], -pos[1], pos[2]]; shoulderY = -pos[1]; }
          }
          let latX = ma || 1.0, latZ = mg || 0.0;
          if (rArmPos && lArmPos) {
            latX = rArmPos[0] - lArmPos[0];
            latZ = rArmPos[2] - lArmPos[2];
          }
          const lLen = Math.hypot(latX, latZ) || 1.0;
          latX /= lLen; latZ /= lLen;
          const fwdX = -latZ, fwdZ = latX;

          const rootY = -rawInst[rootIdx][2][1];
          const figHipY = hipY || rootY;
          const rootTT = rawInst[rootIdx][3];
          const sSlug = String(slug);
          const zNudge = (sSlug.includes('wedding') && Math.abs(hz - 110) < 3 && Math.abs(hx) > 200) ? 18.0 : 0.0;

          // Classify Minifigure into one of the 9 Character Acting Archetypes (actStyle 1..9)
          let actStyle = 7; // Default: Whirling Choros & Bridal Ring-Dancer
          if (figParts.has('4499') || figParts.has('93231') || figParts.has('4497')) actStyle = 1;
          else if (figParts.has('4589') || figParts.has('55295')) actStyle = 4;
          else if (figParts.has('3847') && (sSlug.includes('harvest') || sSlug.includes('field'))) actStyle = 5;
          else if (figParts.has('3847') && sSlug.includes('office')) actStyle = 9;
          else if ((figParts.has('95049') && figHipY > 52) || ((sSlug.includes('wedding') || sSlug.includes('choros') || sSlug.includes('office')) && figHipY > 80)) actStyle = 3;
          else if (figParts.has('3959')) actStyle = 6;
          else if (figParts.has('2343') || figParts.has('30374') || figParts.has('95049')) actStyle = 8;
          else if (sSlug.includes('agora') || sSlug.includes('peace') || (sSlug.includes('office') && hx > 200)) actStyle = 2;

          for (let mIdx = rootIdx; mIdx <= endIdx; mIdx++) {
            const pm = cleanPid(rawInst[mIdx][1]);
            const pos = rawInst[mIdx][2];
            const isCenterline = Math.hypot(pos[0] - hx, pos[2] - hz) < 5.0;
            let baseSubRole = 1.0, pivY = figHipY;
            if (pm.startsWith('3816')) { baseSubRole = 1.1; pivY = figHipY; }
            else if (pm.startsWith('3817')) { baseSubRole = 1.2; pivY = figHipY; }
            else if (pm === '3818') { baseSubRole = 1.3; pivY = shoulderY; }
            else if (pm === '3819') { baseSubRole = 1.4; pivY = shoulderY; }
            else if (pm.startsWith('3626') || HEAD_ACC.has(pm) || (isCenterline && (-pos[1]) >= neckY - 4)) {
              baseSubRole = 1.5; pivY = neckY;
            }
            else if (pm.startsWith('973') || pm.startsWith('3815') || pm === '36036' || TORSO_ACC.has(pm) || isCenterline) {
              baseSubRole = 1.0; pivY = figHipY;
            }
            else {
              // Hand (3820) or held prop (scepter, hammer, spear, sword, goblet, torch): attach to closer arm socket!
              const dR = rArmPos ? Math.hypot(pos[0] - rArmPos[0], pos[2] - rArmPos[2]) : 999;
              const dL = lArmPos ? Math.hypot(pos[0] - lArmPos[0], pos[2] - lArmPos[2]) : 999;
              baseSubRole = dR <= dL ? 1.3 : 1.4;
              pivY = shoulderY;
            }
            const subRole = baseSubRole + actStyle * 10.0;
            actorGroups[mIdx] = { ax: hx, ay: figHipY, az: hz + zNudge, startIdx: rootIdx, subRole, pivY, latX, latZ, ttIdx: rootTT, zNudge };
          }

          const actorSeed = glslFract(Math.sin(hx * 0.037 + (hz + zNudge) * 0.071) * 43758.5453);
          // Spawn 3D Brick-Built Ballistic Arrow (role = 5.0) for active bowmen (4499/93231)
          if ((figParts.has('4499') || figParts.has('93231')) && !(sSlug.includes('forge') && hx > 340)) {
            const bowX = (rArmPos ? rArmPos[0] : hx) + fwdX * 16.0;
            const bowY = shoulderY + 4.0;
            const bowZ = (rArmPos ? rArmPos[2] : hz) + zNudge + fwdZ * 16.0;
            const arrowParts = [
              { tris: buildRectTris([-1.4, -1.4, -14.0, 1.4, 1.4, 14.0], false), rgba: [0.45, 0.26, 0.14, 2.0] },
              { tris: buildRectTris([-2.8, -2.0,  14.0, 2.8, 2.0, 22.0], false), rgba: [0.92, 0.76, 0.30, 3.0] },
              { tris: buildRectTris([-3.4, -2.8, -20.0, 3.4, 2.8, -12.0], false), rgba: [0.86, 0.12, 0.14, 2.0] }
            ];
            for (const ap of arrowParts) {
              projectileBlocks.push({
                tris: ap.tris, pos: [bowX, bowY, bowZ], rgba: ap.rgba,
                lat: [latX, latZ], fwd: [fwdX, fwdZ],
                role: 5.0, piv: [fwdX, fwdZ], rig: [actorSeed, latX, latZ]
              });
            }
          }
          // Spawn 8 Radial 3D Anvil Spark Studs (role = 6.0) for Hephaestus the Master Smith (actStyle === 4)
          if (actStyle === 4) {
            const anvX = hx + fwdX * 26.0;
            const anvY = figHipY + 14.0;
            const anvZ = hz + zNudge + fwdZ * 26.0;
            const sparkTris = buildRectTris([-2.2, -2.2, -2.2, 2.2, 2.2, 2.2], false);
            for (let sIdx = 0; sIdx < 8; sIdx++) {
              const sAng = (sIdx / 8) * Math.PI * 2 + 0.25;
              const spSpeed = 28.0 + (sIdx % 3) * 8.0;
              const spLift = 32.0 + ((sIdx + 1) % 3) * 10.0;
              const rgba = (sIdx % 2 === 0) ? [1.0, 0.55, 0.12, 2.0] : [1.0, 0.86, 0.28, 3.0];
              projectileBlocks.push({
                tris: sparkTris, pos: [anvX, anvY, anvZ], rgba,
                lat: [1.0, 0.0], fwd: [0.0, 1.0],
                role: 6.0, piv: [Math.cos(sAng), Math.sin(sAng)], rig: [actorSeed, spSpeed, spLift]
              });
            }
          }
        } else if (ANIMAL_ROOTS.has(p) && !actorGroups[i]) {
          const [ax, ay, az, ma, mb, mc, md, me, mf, mg] = rawInst[i][2];
          const lLen = Math.hypot(ma || 1.0, mg || 0.0) || 1.0;
          let animStyle = 0;
          if (p.startsWith('80672') || p.startsWith('14734') || p === '48812') animStyle = 1;
          else if (p.startsWith('64452') || p.startsWith('64779') || p.startsWith('64835')) animStyle = 2;
          else if (p.startsWith('92586')) animStyle = 3;
          const aGrp = {
            ax, ay: -ay, az, startIdx: i,
            subRole: 1.6 + animStyle * 10.0, pivY: -ay,
            latX: (ma || 1.0) / lLen, latZ: (mg || 0.0) / lLen,
            ttIdx: rawInst[i][3], zNudge: 0.0
          };
          actorGroups[i] = aGrp;
          for (let k = i + 1; k <= Math.min(rawInst.length - 1, i + 7); k++) {
            const pk = cleanPid(rawInst[k][1]);
            if (!ANIMAL_SUBPARTS.has(pk) || actorGroups[k]) break;
            const [kx, ky, kz] = rawInst[k][2];
            if (Math.hypot(kx - ax, kz - az) < 110 && (-ky) >= (-ay) - 12 && (-ky) <= (-ay) + 115) {
              actorGroups[k] = aGrp;
            } else {
              break;
            }
          }
        }
      }

      // Sort instances bottom-to-top (by world Y = -y_ldraw, then radial distance) so buildProgress constructs from baseplate upward!
      const indexedInst = rawInst.map((item, idx) => {
        const [col, pid, m, rawTT] = item;
        const grp = actorGroups[idx];
        const ttIdx = grp ? grp.ttIdx : rawTT;
        const wx = grp ? grp.ax : m[0];
        const wy = grp ? grp.ay : -m[1];
        const wz = grp ? grp.az : m[2];
        const rDist = Math.hypot(wx, wz);
        return { col, pid, m, ttIdx, wx, wy, wz, rDist, origIdx: idx, grp };
      });
      indexedInst.sort((a, b) => (a.wy - b.wy) || (a.rDist - b.rDist));

      const totalInst = Math.max(1, indexedInst.length);

      let totalTris = 0;
      for (let idx = 0; idx < indexedInst.length; idx++) {
        const pid = indexedInst[idx].pid;
        if (rectTris[pid]) totalTris += rectTris[pid].length;
        else if (meshTris[pid]) totalTris += meshTris[pid].length;
      }

      // Animal Logic / The LEGO Movie Sculpted Brick-Built Sky Clouds in the upper background of 48x32 dioramas
      const cloudBlocks = [];
      if (String(slug).includes('diorama') || slug === 'achilles-forge') {
        const cloudCenters = [[-310, 275, -420], [15, 305, -450], [320, 265, -410]];
        for (const [cx, cy, cz] of cloudCenters) {
          cloudBlocks.push(
            { tris: buildRectTris([-60, 0, -20, 60, 16, 20], true),  pos: [cx, cy, cz],          rgba: [0.96, 0.97, 0.99, 2.0] },
            { tris: buildRectTris([-40, 0, -20, 40, 24, 20], true),  pos: [cx - 10, cy + 24, cz], rgba: [0.99, 0.99, 1.0, 2.0] },
            { tris: buildRectTris([-20, 0, -10, 30, 16, 10], true),  pos: [cx + 15, cy + 40, cz], rgba: [1.0, 1.0, 1.0, 2.0] }
          );
        }
        for (const cb of cloudBlocks) totalTris += cb.tris.length;
      }
      for (const pb of projectileBlocks) totalTris += pb.tris.length;

      const STRIDE = 22;
      const buf = new Float32Array(totalTris * 3 * STRIDE);
      let ptr = 0;

      const actorBuildMap = new Map();

      // Stride = 22 floats:
      // aPos(3), aNorm(3), aCol(4), aCenter(3), aMeta(4), aPivot(2), aRig(3)
      for (let idx = 0; idx < indexedInst.length; idx++) {
        const { col, pid, m, ttIdx, wx, wy, wz, rDist, origIdx, grp } = indexedInst[idx];
        const baseRgba = colMap[String(col)] || [0.7, 0.7, 0.7, 0.0];
        const [x, y, z, a, b, c, d, e, f, g, h, i] = m;
        const turnFlag = ttIdx >= 0 ? 1.0 : 0.0;
        const pivX = (ttIdx >= 0 && data.tt && data.tt[ttIdx]) ? data.tt[ttIdx][0] : 0.0;
        const pivZ = (ttIdx >= 0 && data.tt && data.tt[ttIdx]) ? data.tt[ttIdx][1] : 0.0;

        let buildOrder = idx / totalInst;
        if (grp) {
          const sKey = grp.startIdx;
          if (!actorBuildMap.has(sKey)) actorBuildMap.set(sKey, buildOrder);
          buildOrder = actorBuildMap.get(sKey);
        }

        const isCircularShield = !String(slug).includes('diorama');
        const role = classifyRole(pid, col, wy, rDist, grp);
        const secId = isCircularShield ? computeSectionId(wx, wy, wz) : 0.0;
        const limbPivY = grp ? grp.pivY : wy;
        const latX = grp ? grp.latX : 1.0;
        const latZ = grp ? grp.latZ : 0.0;
        const zOff = grp ? (grp.zNudge || 0.0) : 0.0;

        const xf = (v) => [
          x + a * v[0] + b * v[1] + c * v[2],
          -(y + d * v[0] + e * v[1] + f * v[2]),
          z + zOff + g * v[0] + h * v[1] + i * v[2]
        ];

        const pushTri = (A, B, C, rgba) => {
          const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2];
          const vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
          let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
          const len = Math.hypot(nx, ny, nz) || 1;
          nx /= len; ny /= len; nz /= len;
          const pts = [A, B, C];
          for (let k = 0; k < 3; k++) {
            const P = pts[k];
            buf[ptr++] = P[0]; buf[ptr++] = P[1]; buf[ptr++] = P[2];
            buf[ptr++] = nx;   buf[ptr++] = ny;   buf[ptr++] = nz;
            buf[ptr++] = rgba[0]; buf[ptr++] = rgba[1]; buf[ptr++] = rgba[2]; buf[ptr++] = rgba[3];
            buf[ptr++] = wx;   buf[ptr++] = wy;   buf[ptr++] = wz;
            buf[ptr++] = buildOrder; buf[ptr++] = turnFlag; buf[ptr++] = role; buf[ptr++] = secId;
            buf[ptr++] = pivX; buf[ptr++] = pivZ;
            buf[ptr++] = limbPivY; buf[ptr++] = latX; buf[ptr++] = latZ;
          }
        };

        if (rectTris[pid]) {
          const rList = rectTris[pid];
          const rectRgba = [baseRgba[0], baseRgba[1], baseRgba[2], baseRgba[3] + 2.0];
          for (let k = 0; k < rList.length; k++) {
            const [p0, p1, p2] = rList[k];
            pushTri(xf(p0), xf(p2), xf(p1), rectRgba);
          }
        } else if (meshTris[pid]) {
          const mList = meshTris[pid];
          for (let k = 0; k < mList.length; k++) {
            const tObj = mList[k];
            const [p0, p1, p2] = tObj.pts;
            const rgba = (tObj.col !== 16 && colMap[String(tObj.col)]) ? colMap[String(tObj.col)] : baseRgba;
            pushTri(xf(p0), xf(p2), xf(p1), rgba);
          }
        }
      }

      // Append the floating brick-built LEGO sky clouds (role = 3.0 -> stepped hover on 2s at 12 fps!)
      for (const cb of cloudBlocks) {
        const [cx, cy, cz] = cb.pos;
        const cxf = (v) => [cx + v[0], cy - v[1], cz + v[2]];
        for (let k = 0; k < cb.tris.length; k++) {
          const [p0, p1, p2] = cb.tris[k];
          const A = cxf(p0), B = cxf(p2), C = cxf(p1);
          const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2];
          const vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
          let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
          const len = Math.hypot(nx, ny, nz) || 1;
          nx /= len; ny /= len; nz /= len;
          for (const P of [A, B, C]) {
            buf[ptr++] = P[0]; buf[ptr++] = P[1]; buf[ptr++] = P[2];
            buf[ptr++] = nx;   buf[ptr++] = ny;   buf[ptr++] = nz;
            buf[ptr++] = cb.rgba[0]; buf[ptr++] = cb.rgba[1]; buf[ptr++] = cb.rgba[2]; buf[ptr++] = cb.rgba[3];
            buf[ptr++] = cx;   buf[ptr++] = cy;   buf[ptr++] = cz;
            buf[ptr++] = 0.96; buf[ptr++] = 0.0;  buf[ptr++] = 3.0;  buf[ptr++] = 0.0;
            buf[ptr++] = 0.0;  buf[ptr++] = 0.0;
            buf[ptr++] = cy;   buf[ptr++] = 1.0;  buf[ptr++] = 0.0;
          }
        }
      }

      // Append 3D Ballistic Flying Arrows (role = 5.0) & Hephaestus Anvil Spark Bursts (role = 6.0)
      for (const pb of projectileBlocks) {
        const [cx, cy, cz] = pb.pos;
        const [lx, lz] = pb.lat;
        const [fx, fz] = pb.fwd;
        const pxf = (v) => [
          cx + v[0] * lx + v[2] * fx,
          cy - v[1],
          cz + v[0] * lz + v[2] * fz
        ];
        for (let k = 0; k < pb.tris.length; k++) {
          const [p0, p1, p2] = pb.tris[k];
          const A = pxf(p0), B = pxf(p2), C = pxf(p1);
          const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2];
          const vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
          let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
          const len = Math.hypot(nx, ny, nz) || 1;
          nx /= len; ny /= len; nz /= len;
          for (const P of [A, B, C]) {
            buf[ptr++] = P[0]; buf[ptr++] = P[1]; buf[ptr++] = P[2];
            buf[ptr++] = nx;   buf[ptr++] = ny;   buf[ptr++] = nz;
            buf[ptr++] = pb.rgba[0]; buf[ptr++] = pb.rgba[1]; buf[ptr++] = pb.rgba[2]; buf[ptr++] = pb.rgba[3];
            buf[ptr++] = cx;   buf[ptr++] = cy;   buf[ptr++] = cz;
            buf[ptr++] = 0.88; buf[ptr++] = 0.0;  buf[ptr++] = pb.role; buf[ptr++] = 0.0;
            buf[ptr++] = pb.piv[0]; buf[ptr++] = pb.piv[1];
            buf[ptr++] = pb.rig[0]; buf[ptr++] = pb.rig[1]; buf[ptr++] = pb.rig[2];
          }
        }
      }

      const loadedKeys = Object.keys(this.models);
      if (loadedKeys.length >= 1) {
        for (const oldKey of loadedKeys) {
          if (this.models[oldKey] && this.models[oldKey].vbo) {
            gl.deleteBuffer(this.models[oldKey].vbo);
          }
          delete this.models[oldKey];
        }
      }

      const vbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(gl.ARRAY_BUFFER, buf, gl.STATIC_DRAW);

      const modelObj = {
        slug,
        title: bundle.title,
        pieces: bundle.pieces,
        hotspots: bundle.hotspots || [],
        vbo,
        vertCount: ptr / STRIDE
      };
      this.models[slug] = modelObj;
      return modelObj;
    }

    render(opts) {
      const gl = this.gl;
      const slug = opts.slug || 'shield-of-achilles';
      const model = this.loadModel(slug);
      if (!model) return;

      const w = this.canvas.width, h = this.canvas.height;
      gl.viewport(0, 0, w, h);
      gl.enable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);

      if (opts.clearColor) {
        gl.clearColor(opts.clearColor[0], opts.clearColor[1], opts.clearColor[2], opts.clearColor[3] ?? 1.0);
      } else {
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
      }
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const fovDeg = opts.fov || 30;
      const eye = opts.eye || [0, 420, 680];
      const target = opts.target || [0, 45, 0];
      const time = opts.time || 0;
      const build = opts.build !== undefined ? opts.build : 1.0;
      const explode = opts.explode || 0.0;
      const turnAngle = opts.turnAngle || 0.0;
      const pulseR = opts.pulseR !== undefined ? opts.pulseR : -1.0;
      const pulseAmp = opts.pulseAmp || 0.0;
      const torchPos = opts.torchPos || [Math.sin(time * 1.5) * 180, 140, Math.cos(time * 1.5) * 180];
      const torchCol = opts.torchCol || [1.0, 0.68, 0.25];
      const torchStr = opts.torchStr !== undefined ? opts.torchStr : 1.05;
      const sunCol = opts.sunCol || [1.0, 0.96, 0.89];

      // 1. Animal Logic Studio Cyclorama, Horizon Rim & Out-of-Focus Anamorphic Bokeh Backdrop Pass
      if (this.bgProg && !opts.clearColor) {
        for (const loc of [this.locs.aPos, this.locs.aNorm, this.locs.aCol, this.locs.aCenter, this.locs.aMeta, this.locs.aPivot, this.locs.aRig]) {
          if (loc >= 0) gl.disableVertexAttribArray(loc);
        }
        gl.disable(gl.DEPTH_TEST);
        gl.depthMask(false);
        gl.useProgram(this.bgProg);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bgVbo);
        if (this.bgLocs.aQuad >= 0) {
          gl.enableVertexAttribArray(this.bgLocs.aQuad);
          gl.vertexAttribPointer(this.bgLocs.aQuad, 2, gl.FLOAT, false, 0, 0);
        }
        const camAz = Math.atan2(eye[0] - target[0], eye[2] - target[2]) / (Math.PI * 2.0);
        gl.uniform1f(this.bgLocs.uTime, time);
        gl.uniform3fv(this.bgLocs.uTorchCol, new Float32Array(torchCol));
        gl.uniform1f(this.bgLocs.uCamAz, camAz);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        if (this.bgLocs.aQuad >= 0) gl.disableVertexAttribArray(this.bgLocs.aQuad);
        gl.depthMask(true);
        gl.enable(gl.DEPTH_TEST);
      }

      // 2. Main 3D LEGO Scene Pass
      gl.useProgram(this.prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, model.vbo);

      const stride = 22 * 4;
      const bind = (loc, size, offset) => {
        if (loc < 0) return;
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, offset * 4);
      };
      bind(this.locs.aPos, 3, 0);
      bind(this.locs.aNorm, 3, 3);
      bind(this.locs.aCol, 4, 6);
      bind(this.locs.aCenter, 3, 10);
      bind(this.locs.aMeta, 4, 13);
      bind(this.locs.aPivot, 2, 17);
      bind(this.locs.aRig, 3, 19);

      const projMat = perspMat(fovDeg * Math.PI / 180, w / Math.max(1, h), 6.0, 8000.0);
      const viewMat = lookAtMat(eye, target, [0, 1, 0]);
      gl.uniformMatrix4fv(this.locs.uProj, false, projMat);
      gl.uniformMatrix4fv(this.locs.uView, false, viewMat);
      gl.uniform1f(this.locs.uTime, time);
      gl.uniform1f(this.locs.uBuild, build);
      gl.uniform1f(this.locs.uExplode, explode);
      gl.uniform1f(this.locs.uTurnAngle, turnAngle);
      gl.uniform1f(this.locs.uPulseR, pulseR);
      gl.uniform1f(this.locs.uPulseAmp, pulseAmp);
      gl.uniform3fv(this.locs.uEye, new Float32Array(eye));
      gl.uniform3fv(this.locs.uTorchPos, new Float32Array(torchPos));
      gl.uniform3fv(this.locs.uTorchCol, new Float32Array(torchCol));
      gl.uniform1f(this.locs.uTorchStr, torchStr);
      gl.uniform3fv(this.locs.uSunCol, new Float32Array(sunCol));

      gl.drawArrays(gl.TRIANGLES, 0, model.vertCount);

      if (this.textCtx) {
        this.drawHomericScrolls(slug, projMat, viewMat, time, w, h);
      }
    }

    drawHomericScrolls(slug, P, V, time, w, h) {
      const ctx = this.textCtx;
      ctx.clearRect(0, 0, w, h);
      const key = String(slug).replace(/^set\./, '');
      const scrolls = HOMERIC_3D_SCROLLS[key] || HOMERIC_3D_SCROLLS['shield-of-achilles'];
      if (!scrolls || !scrolls.length) return;

      const proj3D = (wx, wy, wz) => {
        const vx = V[0] * wx + V[4] * wy + V[8] * wz + V[12];
        const vy = V[1] * wx + V[5] * wy + V[9] * wz + V[13];
        const vz = V[2] * wx + V[6] * wy + V[10] * wz + V[14];
        const vw = V[3] * wx + V[7] * wy + V[11] * wz + V[15];
        const cx = P[0] * vx + P[4] * vy + P[8] * vz + P[12] * vw;
        const cy = P[1] * vx + P[5] * vy + P[9] * vz + P[13] * vw;
        const cw = P[3] * vx + P[7] * vy + P[11] * vz + P[15] * vw;
        if (cw <= 10.0) return null;
        return [
          ((cx / cw) * 0.5 + 0.5) * w,
          (0.5 - (cy / cw) * 0.5) * h
        ];
      };

      const isFilm07 = typeof document !== 'undefined' && !!document.getElementById('hud');
      const isFilm05 = typeof document !== 'undefined' && !!document.getElementById('argoTag');
      const isFilm06 = typeof document !== 'undefined' && !!document.getElementById('subWords');
      const isFilm08 = typeof document !== 'undefined' && !!document.getElementById('wave');
      const qTime = Math.floor(time * 12.0) / 12.0;
      const shotU = typeof lastShotU === 'number' ? lastShotU : ((time % 4.0) / 4.0);

      // Sleek, unobtrusive top-center Operation Describe (Bolter & Hartsoe 2026) Transformation Ribbon
      if (!isFilm07) {
        ctx.save();
        const ribW = 880, ribH = 22;
        const rx = (w - ribW) * 0.5, ry = 67;
        ctx.fillStyle = 'rgba(5, 9, 17, 0.76)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.42)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(rx, ry, ribW, ribH, 11);
        else ctx.rect(rx, ry, ribW, ribH);
        ctx.fill();
        ctx.stroke();

        const stageIdx = shotU < 0.36 ? 0 : (shotU < 0.68 ? 1 : 2);
        const stages = [
          { lbl: 'I. ENARGEIA (HOMERIC GREEK)', col: '#fef08a' },
          { lbl: 'II. IMAGETEXT (THICK PROMPT)', col: '#38bdf8' },
          { lbl: 'III. WORLDTEXT (3D WORLD MODEL V·M·C)', col: '#4ade80' }
        ];
        ctx.font = '800 10.5px "SF Mono", Menlo, monospace';
        ctx.fillStyle = '#e5bd43';
        ctx.fillText('OPERATION DESCRIBE:', rx + 16, ry + 15);
        let curX = rx + 162;
        for (let s = 0; s < stages.length; s++) {
          const active = s === stageIdx;
          ctx.fillStyle = active ? stages[s].col : 'rgba(203, 213, 225, 0.55)';
          ctx.fillText(stages[s].lbl, curX, ry + 15);
          curX += ctx.measureText(stages[s].lbl).width + 12;
          if (s < 2) {
            ctx.fillStyle = 'rgba(229, 189, 67, 0.75)';
            ctx.fillText('──►', curX, ry + 15);
            curX += 32;
          }
        }
        ctx.restore();
      }

      // Render ONE un-cramped, spacious Homeric Worldtext Stele at a time:
      // Phase 1 (u < 0.50): Speaks the world into being (Scroll 0)
      // Phase 2 (u >= 0.50): Chronicles the living consequence (Scroll 1)
      const activeIdx = (scrolls.length > 1 && shotU >= 0.50) ? 1 : 0;
      const sc = scrolls[activeIdx];
      if (sc) {
        const [ax3, ay3, az3] = sc.pos;
        const pAnchor = proj3D(ax3, ay3, az3);
        if (pAnchor) {
          const boxW = 600;
          const boxH = 96;
          // Dock cleanly in negative space so the 3D actors and architecture breathe
          let bx = activeIdx === 0 ? 46 : (w - boxW - 46);
          let by = h - boxH - 98;
          if (isFilm05 || isFilm06 || isFilm08) {
            // Films 05, 06, 08 have bottom callout/subtitle bars, so dock gently at top-left
            bx = 46;
            by = 98;
          } else if (isFilm07) {
            // Film 07 has top-left OCR cards, so dock at bottom-right
            bx = w - boxW - 46;
            by = h - boxH - 92;
          }

          const stemX = clamp(pAnchor[0], bx + 28, bx + boxW - 28);
          const stemY = by > pAnchor[1] ? by : (by + boxH);

          ctx.save();
          // 1. Delicate 3D Golden Leader Filament to the acting character/landmark
          const grad = ctx.createLinearGradient(pAnchor[0], pAnchor[1], stemX, stemY);
          grad.addColorStop(0.0, 'rgba(250, 204, 21, 0.82)');
          grad.addColorStop(1.0, 'rgba(56, 189, 248, 0.32)');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(pAnchor[0], pAnchor[1]);
          ctx.lineTo(stemX, stemY);
          ctx.stroke();

          // Subtle stud target ring at character's 3D anchor
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(pAnchor[0], pAnchor[1], 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(250, 204, 21, 0.55)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(pAnchor[0], pAnchor[1], 7.5 + Math.sin(qTime * 4.0) * 1.5, 0, Math.PI * 2);
          ctx.stroke();

          // 2. Translucent Museum-Grade Obsidian & Gold Homeric Worldtext Stele
          ctx.fillStyle = 'rgba(6, 10, 18, 0.82)';
          ctx.strokeStyle = 'rgba(229, 189, 67, 0.72)';
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(bx, by, boxW, boxH, 8);
          } else {
            ctx.rect(bx, by, boxW, boxH);
          }
          ctx.fill();
          ctx.stroke();

          // Dual book-spine accent bar (Imagetext Gold -> Worldtext Cyan)
          ctx.fillStyle = '#e5bd43';
          ctx.fillRect(bx, by + 6, 3.5, 56);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(bx, by + 62, 3.5, boxH - 68);

          // Line 1: Homeric Book & Line Citation + Character Action Tag
          ctx.fillStyle = '#facc15';
          ctx.font = '800 11px "SF Mono", Menlo, monospace';
          ctx.fillText(sc.cite, bx + 14, by + 18, boxW - 24);

          // Line 2: Original Homeric Ancient Greek Hexameter (Enargeia)
          ctx.fillStyle = '#fef08a';
          ctx.font = 'italic 600 13.5px Georgia, "Times New Roman", serif';
          ctx.fillText(sc.grc, bx + 14, by + 38, boxW - 24);

          // Line 3: Verbatim English Translation from Iliad Book XVIII (Imagetext)
          ctx.fillStyle = '#f8fafc';
          ctx.font = '500 12.5px Georgia, "Times New Roman", serif';
          ctx.fillText(sc.eng, bx + 14, by + 58, boxW - 24);

          // Line 4: Operation Describe (Bolter & Hartsoe 2026) Imagetext -> Worldtext Layer
          if (sc.wt) {
            ctx.fillStyle = 'rgba(12, 26, 44, 0.82)';
            ctx.fillRect(bx + 10, by + 66, boxW - 20, 22);
            ctx.fillStyle = '#38bdf8';
            ctx.font = '700 10.5px "SF Mono", Menlo, monospace';
            ctx.fillText(sc.wt, bx + 16, by + 81, boxW - 32);
          }
          ctx.restore();
        }
      }
    }
  }

  // 3D-Anchored Original Homeric Greek, Verbatim English & Operation Describe (Imagetext -> Worldtext) Scrolls
  const HOMERIC_3D_SCROLLS = {
    'shield-diorama-forge': [
      {
        pos: [-30, 85, 0],
        cite: 'HOMER · ILIAD XVIII.474–478 · HEPHAESTUS AT THE GREAT ANVIL',
        grc: '«Χαλκὸν δ’ ἐν πυρὶ βάλλεν ἀτειρέα κασσίτερόν τε καὶ χρυσὸν τιμῆντα καὶ ἄργυρον…»',
        eng: '“He cast on the fire tough bronze and tin and precious gold and silver, and forged a great shield!”',
        wt: 'IMAGETEXT → WORLDTEXT (§3–4): Prompt as Compiler/Forge · 20 bellows compile verse into 3D rules'
      },
      {
        pos: [200, 85, 30],
        cite: 'HOMER · ILIAD XVIII.417–458 · THETIS & THE GOLDEN HANDMAIDENS (KOURAI)',
        grc: '«Χρύσειαι ζωῇσι νεήνισιν εἰοικυῖαι… υἱεῖ ἐμῷ ὠκυμόρῳ δὸς ἀσπίδα καὶ τρυφάλειαν»',
        eng: '“Living handmaidens of gold supported the King, while silver-footed Thetis begged a shield for Achilles!”',
        wt: 'WORLD MODEL (§6 · Ha & Schmidhuber 2018): Golden Automata = Vision (V) + Memory (M) + Controller (C)'
      }
    ],
    'achilles-forge': [
      {
        pos: [-45, 75, 45],
        cite: 'HOMER · ILIAD XVIII.470–478 · THE TWENTY BELLOWS & ANVIL OF HEPHAESTUS',
        grc: '«Φῦσαι δ’ ἐν χοάνοισιν ἐείκοσι πᾶσαι ἐφύσων… Ποίει δὲ πρώτιστα σάκος μέγα τε στιβαρόν τε»',
        eng: '“Twenty bellows blew into the crucibles; and first he forged a shield both great and strong!”',
        wt: 'OPERATIVE EKPHRASIS (§2 · Bajohr 2024): Describing = Generating · Word collapses into 3D geometry'
      },
      {
        pos: [0, 175, -160],
        cite: 'HOMER · ILIAD XVIII.483–489 · THE REVOLVING BEAR (ARKTOS) & ORION',
        grc: '«Ἄρκτον θ’, ἣν καὶ Ἄμαξαν ἐπίκλησιν καλέουσιν, ἥ τ’ αὐτοῦ στρέφεται καί τ’ Ὠρίωνα δοκεύει»',
        eng: '“And the Bear, which men call the Wain, that turns in one place watching Orion and never bathes in Ocean!”',
        wt: 'ORAL-FORMULAIC GENERATOR (§4 · Parry & Lord 1960): Formulaic epithets as latent-space attractors'
      }
    ],
    'shield-diorama-wedding': [
      {
        pos: [-80, 90, 20],
        cite: 'HOMER · ILIAD XVIII.491–493 · CITY AT PEACE: THE BRIDAL TORCH-PROCESSION',
        grc: '«Νύμφας δ’ ἐκ θαλάμων δαΐδων ὕπο λαμπομενάων ἠγίνεον ἀνὰ ἄστυ, πολὺς δ’ ὑμέναιος ὀρώρει·»',
        eng: '“Brides from their chambers under blazing torches they led through the city, and loud rose the bridal song!”',
        wt: 'ENARGEIA → WORLDTEXT (§2 · Webb 1999): Turning hearing into sight · Time enters the bridal street'
      },
      {
        pos: [90, 90, 60],
        cite: 'HOMER · ILIAD XVIII.494–496 · WHIRLING DANCERS, FLUTES, LYRES & DOORWAY WOMEN',
        grc: '«Κοῦροι δ’ ὀρχηστῆρες ἐδίνεον, ἐν δ’ ἄρα τοῖσιν αὐλοὶ φόρμιγγές τε βοὴν ἔχον· αἱ δὲ γυναῖκες θαύμαζον»',
        eng: '“Youthful dancers whirled as flutes and lyres sounded, and women stood marvelling at every doorway!”',
        wt: 'LESSING’S TEMPORAL ENGINE (§4): Procession moves, aulos pipes sound, dancers whirl — picture becomes world'
      }
    ],
    'shield-diorama-agora': [
      {
        pos: [-90, 85, 45],
        cite: 'HOMER · ILIAD XVIII.497–500 · BLOOD-PRICE DISPUTE: THE CLAIMANT SPEAKS',
        grc: '«Δύο δ’ ἄνδρες ἐνείκεον εἵνεκα ποινῆς ἀνδρὸς ἀποφθιμένου· ὁ μὲν εὔχετο πάντ’ ἀποδοῦναι…»',
        eng: '“Two men contended in the Agora over the blood-price of a slain man: the one vowed he had paid all!”',
        wt: 'THICK PROMPTING (§3–4 · Geertz 1973): Blood-price claim & Cohen’s sheep — Layer 6 reclassification'
      },
      {
        pos: [80, 95, -20],
        cite: 'HOMER · ILIAD XVIII.500–508 · THE DEFENDANT’S REFUSAL & TWO TALENTS OF GOLD',
        grc: '«Ὁ δ’ ἀναίνετο μηδὲν ἑλέσθαι… κεῖτο δ’ ἄρ’ ἐν μέσσοισι δύω χρυσοῖο τάλαντα»',
        eng: '“The other refused to take anything; and in the Sacred Circle lay Two Talents of Gold for the straightest judgment!”',
        wt: 'WORLD CONSEQUENCE (§6): An image has no consequences; a world does · Two Gold Talents govern judgment'
      }
    ],
    'shield-diorama-ambush': [
      {
        pos: [-290, 85, 20],
        cite: 'HOMER · ILIAD XVIII.520–526 · THE RIVERBED AMBUSH & TWO PIPING HERDSMEN',
        grc: '«Ἐν ποταμῷ, ὅθι τ’ ἀρδμὸς ἔην πάντεσσι βοτοῖσιν, ἔνθ’ ἄρα τοί γ’ ἵζοντ’ εἰλυμένοι αἴθοπι χαλκῷ·»',
        eng: '“By the river watering-place the scouts crouched in gleaming bronze as two herdsmen piped on reeds!”',
        wt: 'INTENT VS. DISTRIBUTION (§3.2 · Meyer 2025): Pruning platform realism via thick structural conflict'
      },
      {
        pos: [210, 110, -50],
        cite: 'HOMER · ILIAD XVIII.516–535 · GOLDEN ARES & ATHENA, THE WALL & DEADLY KER',
        grc: '«Ἦρχε δ’ ἄρα σφιν Ἄρης καὶ Παλλὰς Ἀθήνη, ἄμφω χρυσείω… Ἐν δ’ Ἔρις, ἐν δὲ Κυδοιμὸς, ἐν δ’ ὀλοὴ Κήρ»',
        eng: '“Golden Ares and Pallas Athena led them; and Strife, Tumult, and Deadly Fate dragged the fallen!”',
        wt: 'NEUROSYMBOLIC HYBRID (§6 · Garcez & Lamb 2023): 1.6× divine scale & ballistic 3D arrows compiled from text'
      }
    ],
    'shield-diorama-harvest': [
      {
        pos: [-200, 85, 20],
        cite: 'HOMER · ILIAD XVIII.541–549 · THE THRICE-PLOUGHED FIELD THAT DARKENS IN GOLD',
        grc: '«Ἐν δ’ ἐτίθει νειὸν μαλακὴν, πίειραν ἄρουραν, εὐρεῖαν τρίπολον… ἡ δὲ μελαίνετ’ ὄπισθεν, χρυσείη περ ἐοῦσα»',
        eng: '“He wrought a thrice-ploughed fallow that darkened behind the plough like real earth, though wrought of gold!”',
        wt: 'BEYOND THE NATURAL SIGN (§5 · Krieger 1992): Gold darkening like ploughed earth via compiled material rules'
      },
      {
        pos: [120, 95, -20],
        cite: 'HOMER · ILIAD XVIII.550–557 · SICKLE REAPERS & THE SILENT KING WITH SCEPTRE',
        grc: '«Ἔριθοι ἤμων ὀξείας δρεπάνας ἐν χερσὶν ἔχοντες… βασιλεὺς δ’ ἐν τοῖσι σιωπῇ σκῆπτρον ἔχων ἑστήκει»',
        eng: '“Reapers reaped with sharp sickles; and among them the King stood in silence with his sceptre, rejoicing!”',
        wt: 'MEMORY MODEL (M · §6): Procedural algorithm of sickle reaping, sheaf-binding & royal oak feast in time'
      }
    ],
    'shield-diorama-vineyard': [
      {
        pos: [-160, 85, 20],
        cite: 'HOMER · ILIAD XVIII.561–565 · GOLDEN VINEYARD, SILVER POLES & KYANOS TRENCH',
        grc: '«Ἐν δ’ ἐτίθει σταφυλῇσι μέγα βρίθουσαν ἀλωὴν καλὴν χρυσείην… ἀμφὶ δὲ κυανέην κάπετον, περὶ δ’ ἕρκος κασσιτέρου»',
        eng: '“He set a golden vineyard heavy with black grapes on silver poles, with a kyanos trench and fence of tin!”',
        wt: 'PRUNING THE MEAN IMAGE (§5 · Fig. 2 / Steyerl 2023): From flat Bible-book illustration to 3D architecture'
      },
      {
        pos: [40, 95, -20],
        cite: 'HOMER · ILIAD XVIII.569–572 · THE BOY WITH THE PHORMINX SINGING THE LINUS-SONG',
        grc: '«Τοῖσιν δ’ ἐν μέσσοισι πάϊς φόρμιγγι λιγείῃ ἱμερόεν κιθάριζε, λίνον δ’ ὑπὸ καλὸν ἄειδε λεπταλέῃ φωνῇ»',
        eng: '“In their midst a boy made sweet music on a clear-toned lyre and sang the fair Linus-song as they danced!”',
        wt: 'EMBODIED WORLDTEXT (§6 · Fig. S2): Inhabitant perspective & diegetic Linus-song make the vineyard habitable'
      }
    ],
    'shield-diorama-cattle': [
      {
        pos: [-220, 85, 40],
        cite: 'HOMER · ILIAD XVIII.573–578 · STRAIGHT-HORNED CATTLE OF GOLD & TIN AND NINE DOGS',
        grc: '«Αἱ δὲ βόες χρυσοῖο τετεύχατο κασσιτέρου τε… χρύσειοι δὲ νομῆες τέσσαρες, ἐννέα δέ σφι κύνες πόδας ἀργοὶ ἕποντο»',
        eng: '“He wrought cattle of gold and tin by the sounding river, with four golden herdsmen and nine swift dogs!”',
        wt: 'WORLD MODEL CONSEQUENCES (§6): “Without consequence, worldtext is only scenery” · 4 herdsmen & 9 dogs react'
      },
      {
        pos: [50, 85, 50],
        cite: 'HOMER · ILIAD XVIII.579–581 · TWO TERRIBLE LIONS SEIZING THE BELLOWING BULL',
        grc: '«Σμερδαλέω δὲ λέοντε δύ’ ἐν πρώτοισι βόεσσι ταῦρον ἐρύγμηλον ἐχέτην· ὁ δὲ μακρὰ μεμυκὼς ἕλκετο»',
        eng: '“Two terrible lions among the foremost cattle seized a loud-lowing bull, and bellowing he was dragged away!”',
        wt: 'CONTROLLER (C · Ha & Schmidhuber 2018): Predator-prey state transition & ballistic archery governed by rules'
      }
    ],
    'shield-diorama-sheepfold': [
      {
        pos: [-150, 85, 20],
        cite: 'HOMER · ILIAD XVIII.587–588 · THE FAIR MOUNTAIN GLEN OF WHITE-FLEECED SHEEP',
        grc: '«Ἐν δὲ νομὸν ποίησε περικλυτὸς Ἀμφιγυήεις ἐν καλῇ βήσσῃ μέγαν οἰῶν ἀργεννάων»',
        eng: '“And the famous lame god wrought a great pasture of white sheep in a fair mountain glen!”',
        wt: 'COHEN’S SHEEP & THICK PROMPTING (§4.2 · Geertz 1973): 6-layer contextual encoding that survives the fort'
      },
      {
        pos: [120, 95, -20],
        cite: 'HOMER · ILIAD XVIII.589 · STEADINGS, ROOFED SHEPHERD HUTS & WATTLED FOLDS',
        grc: '«Σταθμούς τε κλισίας τε κατηρεφέας ἰδὲ σηκούς· ποιμὴν δ’ ἐν προθύροισι σὺν κυσὶν φυλάσσει»',
        eng: '“With steadings, roofed huts, and wattled sheepfolds where the shepherd tends his white flock!”',
        wt: 'HABITABLE ENVIRONMENT (§6 · Genie 2 / Bruce et al. 2024): “What can a sentence make habitable?”'
      }
    ],
    'shield-diorama-choros': [
      {
        pos: [-120, 95, 30],
        cite: 'HOMER · ILIAD XVIII.590–592 · THE DANCING-FLOOR OF DAEDALUS FOR ARIADNE',
        grc: '«Ἐν δὲ χορὸν ποίκιλλε περικλυτὸς Ἀμφιγυήεις, τῷ ἴκελον οἷόν ποτ’ ἐνὶ Κνωσῷ εὐρείῃ Δαίδαλος ἤσκησεν Ἀριάδνῃ»',
        eng: '“He wrought a dancing-floor like that which in wide Knossos Daedalus contrived for fair-tressed Ariadne!”',
        wt: 'HYBRID-ONTOLOGICAL WORLDTEXT (§6.3): Language legislates spatial rules & 12-fps rotational choreography'
      },
      {
        pos: [120, 95, 30],
        cite: 'HOMER · ILIAD XVIII.599–606 · THE POTTER’S WHEEL, DIVINE BARD & TWO TUMBLERS',
        grc: '«Ὡς ὅτε τις τροχὸν ἄρμενον ἐν παλάμῃσιν ἑζόμενος κεραμεὺς πειρήσεται… δοιὼ δὲ κυβιστητῆρε ἐδίνευον»',
        eng: '“They ran round lightly as when a sitting potter tries his wheel, while two tumblers whirled in the midst!”',
        wt: 'NEUROSYMBOLIC RESONANCE (§6 · Plate B): Homeric prompt acts as both visual surface and deterministic code'
      }
    ],
    'shield-m0': [
      {
        pos: [-55, 85, 0],
        cite: 'HOMER · ILIAD XVIII.483–485 · EARTH, SKY, SEA, UNTIRING SUN & FULL MOON',
        grc: '«Ἐν μὲν γαῖαν ἔτευξ’, ἐν δ’ οὐρανόν, ἐν δὲ θάλασσαν, ἠέλιόν τ’ ἀκάμαντα σελήνην τε πλήθουσαν»',
        eng: '“Therein he wrought the Earth, the Sky, the Sea, the untiring Sun, and the Moon at her full!”',
        wt: 'CONTEXT STACK L0–L1 (§6.1 · Karpathy 2024): Cosmological physics & time governance at the Shield’s core'
      },
      {
        pos: [55, 85, 0],
        cite: 'HOMER · ILIAD XVIII.486–489 · PLEIADES, HYADES, ORION & THE UNBATHED BEAR',
        grc: '«Πληϊάδας θ’ Ὑάδας τε τό τε σθένος Ὠρίωνος Ἄρκτον θ’, ἥ τ’ αὐτοῦ στρέφεται καί τ’ Ὠρίωνα δοκεύει»',
        eng: '“Pleiades, Hyades, mighty Orion, and the Bear that turns in one place and never bathes in Oceanus!”',
        wt: 'QUINTILIAN’S STOREHOUSE ↔ CLIP EMBEDDING (§2.1 & §8.1): Coordinates transmitted to reconstruct a cosmos'
      }
    ],
    'shield-of-achilles': [
      {
        pos: [-160, 85, 0],
        cite: 'HOMER · ILIAD XVIII.478–484 · THE FIVE-FOLD COSMIC SHIELD OF ACHILLES',
        grc: '«Πέντε δ’ ἄρ’ αὐτοῦ ἔσαν σάκεος πτύχες· αὐτὰρ ἐν αὐτῷ ποίει δαίδαλα πολλὰ ἰδυίῃσι πραπίδεσσιν»',
        eng: '“Five folds were there of the shield itself; and therein he wrought Earth, Sky, Sea, and two cities of men!”',
        wt: 'UR-WORLDTEXT (§6 · Moretti 1996 / Plate A): L0–L6 Context Stack compiled into 5 concentric LDraw rings'
      },
      {
        pos: [160, 85, 180],
        cite: 'HOMER · ILIAD XVIII.607–608 · THE MIGHTY STRENGTH OF RIVER OCEANUS ON THE RIM',
        grc: '«Ἐν δ’ ἐτίθει ποταμοῖο μέγα σθένος Ὠκεανοῖο ἄντυγα πὰρ πυμάτην σάκεος πύκα ποιητοῖο.»',
        eng: '“And around the uttermost rim of the strongly-built shield he set the mighty strength of River Oceanus!”',
        wt: 'WORLDTEXT CONSTITUTION (§6.4): River Oceanus = L6 Boundary Condition bounding the habitable world-model'
      }
    ],
    'achilles-rotunda': [
      {
        pos: [-160, 95, 0],
        cite: 'HOMER · ILIAD XVIII.490–540 · THE TWIN CITIES OF MORTAL MEN: PEACE & WAR',
        grc: '«Ἐν δὲ δύω ποίησε πόλεις μερόπων ἀνθρώπων καλὰς· ἐν τῇ μέν ῥα γάμοι τ’ ἔσαν, τὴν δ’ ἑτέρην ἀμφὶ δύω στρατοὶ»',
        eng: '“Therein he wrought two fair cities of mortal men: one of bridal song and law, the other besieged in war!”',
        wt: 'THE THREE THRESHOLDS (§7 · Bolter & Hartsoe 2026): I. Ancient Enargeia → II. Imagetext → III. Worldtext'
      },
      {
        pos: [160, 95, 180],
        cite: 'HOMER · ILIAD XVIII.607–608 · RIVER OCEANUS ENCIRCLING THE LIVING WORLD',
        grc: '«Ἐν δ’ ἐτίθει ποταμοῖο μέγα σθένος Ὠκεανοῖο ἄντυγα πὰρ πυμάτην σάκεος πύκα ποιητοῖο.»',
        eng: '“And around the uttermost rim of the strongly-built shield he set the mighty strength of River Oceanus!”',
        wt: 'POLITICS OF AFFORDANCES (§7 · Davis 2015): “Homer already knew. The Shield was always a worldtext.”'
      }
    ]
  };

  let lastShotU = 0.0;

  // Evaluate a sequence of camera shots with Trevor Carlee / LEGO Movie multi-angle staging:
  // Supports intimate character close-ups (during the middle of a shot or via closeUp beats)
  // plus two-sided orbital azimuth sweeps so both faces and action of every minifigure are seen!
  function evalShotList(shots, t) {
    let active = shots[shots.length - 1];
    for (const s of shots) {
      if (t >= s.t0 && t < s.t1) {
        active = s;
        break;
      }
    }
    const u = clamp((t - active.t0) / Math.max(0.001, active.t1 - active.t0), 0, 1);
    lastShotU = u;
    const e = active.linear ? u : easeInOutCubic(u);
    let baseEye = lerp3(active.eye0, active.eye1 || active.eye0, e);
    let target = lerp3(active.target0, active.target1 || active.target0, e);
    let fov = lerp(active.fov0 || 30, active.fov1 || active.fov0 || 30, e);

    const slugStr = String(active.slug || '');
    const isCircular = !slugStr.includes('diorama');
    const orbitArc = active.orbitArc !== undefined ? active.orbitArc : (isCircular ? Math.PI * 0.72 : 0.28);
    const orbitAngle = Math.sin((u - 0.5) * Math.PI) * (orbitArc * 0.5);
    const dx = baseEye[0] - target[0];
    const dz = baseEye[2] - target[2];
    const ca = Math.cos(orbitAngle), sa = Math.sin(orbitAngle);
    let eye = [
      target[0] + dx * ca - dz * sa,
      baseEye[1],
      target[2] + dx * sa + dz * ca
    ];

    // Speaking the World into Being (Enargeia -> Worldtext):
    // During the opening 42% of each shot, as the Kokoro rhapsode recites the Homeric verse,
    // the 3D LDraw bricks materialize and snap into place with the voice, then hold at 100%
    // so the living scene has un-rushed space to act out its consequences.
    const spokenBuild = Math.min(1.0, 0.25 + easeInOutCubic(Math.min(1.0, u / 0.42)) * 0.75);
    const buildVal = active.buildFn ? active.buildFn(u, t) : spokenBuild;
    const explodeVal = active.explodeFn ? active.explodeFn(u, t) : lerp(active.explode0 ?? 0, active.explode1 ?? 0, e);
    if (explodeVal < 0.05 && buildVal > 0.85 && !active.noCloseUp) {
      const closeWindow = Math.sin(clamp((u - 0.35) / 0.45, 0.0, 1.0) * Math.PI);
      const zoomFactor = closeWindow * (isCircular ? 0.26 : 0.28);
      eye = [
        lerp(eye[0], target[0] + (eye[0] - target[0]) * 0.88, zoomFactor),
        lerp(eye[1], Math.max(eye[1], isCircular ? 220 : 295), zoomFactor),
        lerp(eye[2], target[2] + (eye[2] - target[2]) * 0.88, zoomFactor)
      ];
      fov = lerp(fov, 22.5, zoomFactor);
    }

    // Subtle stop-motion handheld camera micro-breath
    const camQ = Math.floor(t * 12.0) / 12.0;
    eye[0] += Math.sin(camQ * 2.3) * 2.2;
    eye[1] += Math.cos(camQ * 1.9) * 1.6;

    return {
      shot: active,
      u,
      e,
      slug: active.slug,
      eye,
      target,
      fov,
      build: buildVal,
      explode: explodeVal,
      turnAngle: (active.turn0 || 0) + t * (active.turnSpeed ?? 0.35),
      torchPos: active.torchPos || [Math.sin(t * 2.0) * 180, 130, Math.cos(t * 2.0) * 180],
      torchCol: active.torchCol || [1.0, 0.68, 0.25],
      torchStr: active.torchStr ?? 1.05,
      sunCol: active.sunCol || [1.0, 0.96, 0.89]
    };
  }

  global.LegoCinema = {
    Engine: LegoCinemaEngine,
    evalShotList,
    lerp,
    lerp3,
    clamp,
    easeInOutCubic
  };
})(window);
