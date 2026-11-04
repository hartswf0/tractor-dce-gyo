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
  const ANIMAL_ROOTS = new Set(['64452', '14734', '92586', '95341', '40243', '4490', '2546']);
  // Head-mounted accessories that yaw with the minifigure head (3626*) on the neck stud
  const HEAD_ACC = new Set([
    '3901', '39262', '3844', '98366', '11256', '12890', '13251', '32602',
    '11264', '33322', '93562', '10048', '10053', '10054', '4592', '93223', '60749'
  ]);
  // Torso-mounted accessories (capes, armor)
  const TORSO_ACC = new Set(['4524', '10052']);

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
      //    + EpicFigRig Articulated Minifigure Limbs & Reactive LEGO Water
      float glow = 0.0;
      if (role > 0.5 && role < 1.75) {
        float seed = fract(sin(aCenter.x * 0.037 + aCenter.z * 0.071) * 43758.5453);
        // Non-destructive 12 fps stepped F-curve modifier (holds each pose for 2 frames at 24/30 fps)
        float qTime = (floor(uTime * 12.0 + seed * 6.0) - seed * 6.0) / 12.0;
        float pivY = aRig.x;
        float latX = aRig.y;
        float latZ = aRig.z;

        if (role > 1.55) {
          // 1.6: Quadruped Animal (horse, lion, hound, bull) rearing/galloping on 2s
          float rearAng = sin(qTime * 5.2 + seed * 6.283) * 0.19;
          rotateLimbX(p, n, aCenter.x, pivY, aCenter.z, latX, latZ, rearAng);
          p.y += abs(sin(qTime * 5.2 + seed * 6.283)) * 3.2;
        } else {
          // 1.1..1.5: Articulated Minifigure Limb Sub-Part Rotations (prior to whole-body turn)
          float walkCycle = sin(qTime * 6.4 + seed * 6.283);
          float actCycle  = sin(qTime * 4.2 + seed * 11.13);

          if (role > 1.05 && role < 1.15) {
            // 1.1: Right Leg (3816c) swings around hip axle
            rotateLimbX(p, n, aCenter.x, pivY, aCenter.z, latX, latZ, walkCycle * 0.42);
          } else if (role > 1.15 && role < 1.25) {
            // 1.2: Left Leg (3817c) swings in opposite stride around hip axle
            rotateLimbX(p, n, aCenter.x, pivY, aCenter.z, latX, latZ, -walkCycle * 0.42);
          } else if (role > 1.25 && role < 1.35) {
            // 1.3: Right Arm + Right Hand + Held Weapon/Staff/Hammer swings at shoulder socket
            float rArmAng = 0.18 + actCycle * 0.46 + walkCycle * 0.18;
            rotateLimbX(p, n, aCenter.x, pivY, aCenter.z, latX, latZ, rArmAng);
          } else if (role > 1.35 && role < 1.45) {
            // 1.4: Left Arm + Left Hand + Held Torch/Shield/Cup swings in counterpoint at shoulder socket
            float lArmAng = 0.12 - actCycle * 0.36 - walkCycle * 0.18;
            rotateLimbX(p, n, aCenter.x, pivY, aCenter.z, latX, latZ, lArmAng);
          } else if (role > 1.45 && role < 1.55) {
            // 1.5: Head + Beard + Hair + Crown + Helmet yaws left/right on the cylindrical neck stud
            float headYaw = sin(qTime * 2.7 + seed * 9.42) * 0.46;
            float hc = cos(headYaw), hs = sin(headYaw);
            float hdx = p.x - aCenter.x, hdz = p.z - aCenter.z;
            p.x = aCenter.x + hdx * hc - hdz * hs;
            p.z = aCenter.z + hdx * hs + hdz * hc;
            float hnx = n.x * hc - n.z * hs;
            float hnz = n.x * hs + n.z * hc;
            n.x = hnx; n.z = hnz;
          }

          // Subtle upper-body hip-hinge lean during stride (applies to torso, arms, head)
          if (role < 1.05 || role > 1.25) {
            float torsoLean = sin(qTime * 3.2 + seed * 6.283) * 0.08;
            rotateLimbX(p, n, aCenter.x, aCenter.y, aCenter.z, latX, latZ, torsoLean);
          }
        }

        // Whole-actor stepped stop-motion body turn & plastic stud-hop
        float figAng = sin(qTime * 1.25 + seed * 6.283) * 0.68;
        float fc = cos(figAng), fs = sin(figAng);
        float fdx = p.x - aCenter.x;
        float fdz = p.z - aCenter.z;
        p.x = aCenter.x + fdx * fc - fdz * fs;
        p.z = aCenter.z + fdx * fs + fdz * fc;
        float fnx = n.x * fc - n.z * fs;
        float fnz = n.x * fs + n.z * fc;
        n.x = fnx; n.z = fnz;

        float stepHop = abs(sin(qTime * 6.4 + seed * 6.283));
        p.y += stepHop * 2.2;
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
      } else if (role > 3.5) {
        // 4.0: Trevor Carlee Reactive LEGO Water (quantized plate-step ripples on 2s!)
        float qTime = floor(uTime * 12.0) / 12.0;
        float wave = sin(aCenter.x * 0.035 + aCenter.z * 0.035 - qTime * 5.0)
                   + 0.5 * cos(aCenter.x * 0.06 - aCenter.z * 0.05 + qTime * 3.8);
        float quantWave = floor(wave * 2.2) * 1.4;
        p.y += quantWave;
        glow = max(0.0, quantWave * 0.06);
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
      // Keeps baseplates & floor masonry 100% rigid (no floor-plate tilting!) while pulsing actors & rim glow
      if (uPulseR >= 0.0 && uPulseAmp > 0.001) {
        float r = length(aCenter.xz);
        float dist = abs(r - uPulseR);
        if (dist < 140.0) {
          float w = exp(-(dist * dist) / (2.0 * 48.0 * 48.0)) * uPulseAmp;
          if (role > 0.5) p.y += w * 4.0;
          glow = max(glow, w * 0.35);
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
      float studR = length(cellXZ);
      float studRingAO = (1.0 - 0.18 * exp(-pow((studR - 0.30) / 0.065, 2.0))) * step(0.65, N.y);
      // Ground / Plinth vertical contact shadow
      float groundAO = 0.86 + 0.14 * smoothstep(0.0, 28.0, vPos.y);
      float cavity = (1.0 - 0.25 * max(seamH, seamV) * isRect) * mix(1.0, studRingAO, isRect) * groundAO;

      // Directional normal shading so perpendicular brick faces have strong 3D separation
      float dirShade = 0.88 + 0.12 * (N.x * 0.6 + N.z * 0.4);

      // Dynamic Torch / Forge Point Light
      vec3 toLight = uTorchPos - vPos;
      float lDist = length(toLight);
      vec3 Lp = toLight / max(lDist, 1.0);
      float atten = uTorchStr / (1.0 + 0.0015 * lDist + 0.0000058 * lDist * lDist);
      float dp = max((dot(N, Lp) + sssWrap) / (1.0 + sssWrap), 0.0) * atten;

      // Warm ABS subsurface scatter tint in shadow terminators
      vec3 sssTint = base * vec3(1.12, 0.92, 0.78) * (1.0 - metal) * 0.07;

      vec3 diff = (base * cavity * dirShade + sssTint) * (
        hemiCol * 0.27 +
        uSunCol * d1 * 0.74 +
        vec3(0.95, 0.91, 0.86) * d2 * 0.58 +
        vec3(0.70, 0.80, 1.0) * d3 * 0.25 +
        vec3(1.0, 0.87, 0.68) * d4 * 0.23 +
        uTorchCol * dp * 1.05
      );

      // Dual opposing Blinn-Phong studio softbox highlights + clearcoat ABS gloss
      vec3 H1 = normalize(L1 + V);
      vec3 H2 = normalize(L2 + V);
      vec3 H3 = normalize(L3 + V);
      vec3 H4 = normalize(L4 + V);
      float shininess = mix(54.0, 84.0, metal);
      float specStrength = mix(0.28, 1.42, metal);
      vec3 specCol = mix(vec3(1.0, 0.98, 0.95), base * 1.45 + vec3(0.16), metal * 0.88);

      float s1 = pow(max(dot(N, H1), 0.0), shininess);
      float s2 = pow(max(dot(N, H2), 0.0), shininess) * 0.85;
      float s3 = pow(max(dot(N, H3), 0.0), shininess * 0.55) * 0.35;
      float s4 = pow(max(dot(N, H4), 0.0), shininess * 0.55) * 0.35;
      vec3 spec = specCol * (s1 + s2 + s3 + s4) * specStrength;

      // Studio environment reflection for metallic Gold (297), Silver (80/179), and Bronze (300)
      vec3 R = reflect(-V, N);
      float envBand = 0.5 + 0.5 * sin(R.y * 6.0 + R.x * 3.0 - R.z * 2.5);
      vec3 envCol = mix(vec3(0.16, 0.11, 0.06), vec3(1.0, 0.92, 0.72), smoothstep(-0.4, 0.75, R.y));
      vec3 metalEnv = base * envCol * (0.34 + 0.66 * envBand) * metal;

      // Fresnel rim sheen for both ABS plastic and forged metal
      float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.2);
      vec3 rim = mix(vec3(0.88, 0.92, 1.0) * 0.10, base * 0.52, metal) * fresnel;

      // Specular from point light
      vec3 Hp = normalize(Lp + V);
      spec += uTorchCol * pow(max(dot(N, Hp), 0.0), 56.0) * atten * (0.28 + 0.72 * metal);

      vec3 linearOut = diff * mix(1.0, 0.38, metal) + metalEnv + spec + rim + base * vGlow * 1.35 + vec3(1.0, 0.78, 0.32) * vGlow * 0.42;
      vec3 mapped = pow(acesFilm(linearOut * 0.97), vec3(1.0 / 2.2));
      gl_FragColor = vec4(mapped, 1.0);
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
      const rawInst = data.inst;
      const actorGroups = new Array(rawInst.length).fill(null);
      for (let i = 0; i < rawInst.length; i++) {
        const p = String(rawInst[i][1]).toLowerCase();
        if (p.startsWith('3626')) {
          const [hx, hy, hz, ma, mb, mc, md, me, mf, mg, mh, mi] = rawInst[i][2];
          let rootIdx = i;
          for (let j = i - 1; j >= Math.max(0, i - 24); j--) {
            if (actorGroups[j]) break;
            const pj = String(rawInst[j][1]).toLowerCase();
            const [jx, jy, jz] = rawInst[j][2];
            if ((pj.startsWith('3815') || pj === '36036' || pj === '973') && Math.hypot(hx - jx, hz - jz) < 42) {
              rootIdx = j;
              if (pj.startsWith('3815') || pj === '36036') break;
            }
          }
          let endIdx = i;
          for (let k = i + 1; k <= Math.min(rawInst.length - 1, i + 10); k++) {
            const pk = String(rawInst[k][1]).toLowerCase();
            if (pk.startsWith('3815') || pk === '36036' || pk === '973' || pk.startsWith('3626') || ANIMAL_ROOTS.has(pk) || data.rect[pk]) break;
            const [kx, ky, kz] = rawInst[k][2];
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
          for (let mIdx = rootIdx; mIdx <= endIdx; mIdx++) {
            const pm = String(rawInst[mIdx][1]).toLowerCase();
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

          const rootY = -rawInst[rootIdx][2][1];
          const rootTT = rawInst[rootIdx][3];
          const zNudge = (String(slug).includes('wedding') && Math.abs(hz - 110) < 3 && Math.abs(hx) > 200) ? 18.0 : 0.0;
          for (let mIdx = rootIdx; mIdx <= endIdx; mIdx++) {
            const pm = String(rawInst[mIdx][1]).toLowerCase();
            const pos = rawInst[mIdx][2];
            let subRole = 1.0, pivY = rootY;
            if (pm.startsWith('3816')) { subRole = 1.1; pivY = hipY; }
            else if (pm.startsWith('3817')) { subRole = 1.2; pivY = hipY; }
            else if (pm === '3818') { subRole = 1.3; pivY = shoulderY; }
            else if (pm === '3819') { subRole = 1.4; pivY = shoulderY; }
            else if (pm.startsWith('3626') || HEAD_ACC.has(pm)) { subRole = 1.5; pivY = neckY; }
            else if (pm === '973' || pm.startsWith('3815') || pm === '36036' || TORSO_ACC.has(pm)) { subRole = 1.0; pivY = rootY; }
            else {
              // Hand (3820) or held prop (scepter, hammer, spear, sword, goblet, torch): attach to closer arm socket!
              const dR = rArmPos ? Math.hypot(pos[0] - rArmPos[0], pos[2] - rArmPos[2]) : 999;
              const dL = lArmPos ? Math.hypot(pos[0] - lArmPos[0], pos[2] - lArmPos[2]) : 999;
              subRole = dR <= dL ? 1.3 : 1.4;
              pivY = shoulderY;
            }
            actorGroups[mIdx] = { ax: hx, ay: rootY, az: hz + zNudge, startIdx: rootIdx, subRole, pivY, latX, latZ, ttIdx: rootTT, zNudge };
          }
        } else if (ANIMAL_ROOTS.has(p) && !actorGroups[i]) {
          const [ax, ay, az, ma, mb, mc, md, me, mf, mg] = rawInst[i][2];
          const lLen = Math.hypot(ma || 1.0, mg || 0.0) || 1.0;
          actorGroups[i] = {
            ax, ay: -ay, az, startIdx: i,
            subRole: 1.6, pivY: -ay,
            latX: (ma || 1.0) / lLen, latZ: (mg || 0.0) / lLen,
            ttIdx: rawInst[i][3], zNudge: 0.0
          };
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

      gl.uniformMatrix4fv(this.locs.uProj, false, perspMat(fovDeg * Math.PI / 180, w / Math.max(1, h), 6.0, 8000.0));
      gl.uniformMatrix4fv(this.locs.uView, false, lookAtMat(eye, target, [0, 1, 0]));
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
    }
  }

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
    const e = active.linear ? u : easeInOutCubic(u);
    let baseEye = lerp3(active.eye0, active.eye1 || active.eye0, e);
    let target = lerp3(active.target0, active.target1 || active.target0, e);
    let fov = lerp(active.fov0 || 30, active.fov1 || active.fov0 || 30, e);

    const slugStr = String(active.slug || '');
    const isCircular = !slugStr.includes('diorama');
    const orbitArc = active.orbitArc !== undefined ? active.orbitArc : (isCircular ? Math.PI * 0.85 : 0.44);
    const orbitAngle = Math.sin((u - 0.5) * Math.PI) * (orbitArc * 0.5);
    const dx = baseEye[0] - target[0];
    const dz = baseEye[2] - target[2];
    const ca = Math.cos(orbitAngle), sa = Math.sin(orbitAngle);
    let eye = [
      target[0] + dx * ca - dz * sa,
      baseEye[1],
      target[2] + dx * sa + dz * ca
    ];

    // LEGO Movie / Trevor Carlee Macro Telephoto Hero Close-Up:
    // Just like a physical DSLR macro lens on a LEGO stop-motion table (which cannot pass through LEGO roofs/walls),
    // we rack the lens focal length (narrowing FOV down to 20.5 deg) with a gentle sightline push so minifigures
    // fill the frame without ever clipping behind colonnade architraves or townhouse roofs!
    const buildVal = active.buildFn ? active.buildFn(u, t) : lerp(active.build0 ?? 1, active.build1 ?? 1, u);
    const explodeVal = active.explodeFn ? active.explodeFn(u, t) : lerp(active.explode0 ?? 0, active.explode1 ?? 0, e);
    if (explodeVal < 0.05 && buildVal > 0.85 && !active.noCloseUp) {
      const closeWindow = Math.sin(clamp((u - 0.35) / 0.45, 0.0, 1.0) * Math.PI);
      const zoomFactor = closeWindow * (isCircular ? 0.30 : 0.34);
      eye = [
        lerp(eye[0], target[0] + (eye[0] - target[0]) * 0.86, zoomFactor),
        Math.max(eye[1], isCircular ? 240 : 330),
        lerp(eye[2], target[2] + (eye[2] - target[2]) * 0.86, zoomFactor)
      ];
      fov = lerp(fov, 21.0, zoomFactor);
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
