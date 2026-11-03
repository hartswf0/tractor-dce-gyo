/**
 * films/shield-of-achilles/shared/lego3d.js
 * Real-Time 3D WebGL LDraw Cinema Engine for the Nine Shield of Achilles Films.
 * Renders the actual pre-compiled LDraw .mpd models from achilles/kits/forage-bundle.js
 * and achilles/kits/shield-dioramas-bundle.js (up to 8,891 bricks per scene) at 1920x1080
 * with 100% un-truncated minifigure heads/hair/beards/crowns/helmets, 45-degree beveled
 * LEGO bricks, 360-degree two-sided studio PBR lighting, unified minifigure actor rigs,
 * and ACES Filmic tone mapping.
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
    const ty0 = y0;             // top surface (LDraw Y points down)
    const tyB = y0 + bev * 0.85; // bottom of top chamfer
    const by1 = y1 - ins * 0.35; // bottom of brick

    // Top inner quad (0..3), outer chamfer ring (4..7), bottom ring (8..11)
    const p = [
      [ix0, ty0, iz0], [ix1, ty0, iz0], [ix1, ty0, iz1], [ix0, ty0, iz1],
      [ox0, tyB, oz0], [ox1, tyB, oz0], [ox1, tyB, oz1], [ox0, tyB, oz1],
      [ox0, by1, oz0], [ox1, by1, oz0], [ox1, by1, oz1], [ox0, by1, oz1]
    ];
    const quads = [
      // Top flat face
      [3, 2, 1, 0],
      // 45-degree top bevel chamfer strips (catch crisp edge highlights!)
      [0, 1, 5, 4],
      [1, 2, 6, 5],
      [2, 3, 7, 6],
      [3, 0, 4, 7],
      // 4 vertical side walls
      [4, 5, 9, 8],
      [5, 6, 10, 9],
      [6, 7, 11, 10],
      [7, 4, 8, 11],
      // Bottom closure face
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

  // Minifigure & creature sub-parts that belong to a unified character/animal rig
  const FIG_SUBPARTS = new Set([
    '3815', '3815b', '3816', '3816c', '3817', '3817c', '973', '3818', '3819', '3820',
    '3626bp01', '3626bp02', '3626bp05', '3626bp08', '3626bp09', '3626bp35', '3626bp4g',
    '3626bp88', '3626bp8m', '3626bpq5', '3626bpsg',
    '93223', '3901', '39262', '3844', '98366', '4524', '11256', '12890', '13251',
    '3846', '3847', '3876', '4497', '4499', '3959', '2343', '75902', '30374'
  ]);
  const ANIMAL_ROOTS = new Set(['64452', '60749', '14734', '92586', '95341', '33322', '11264']);

  function isFigSubpart(pid) {
    const p = String(pid).toLowerCase();
    return FIG_SUBPARTS.has(p) || p.startsWith('3626') || p.startsWith('973') || p.startsWith('381');
  }

  function classifyRole(pid, col, wy, rDist, isGroupedActor) {
    const p = String(pid).toLowerCase();
    if (isGroupedActor || ANIMAL_ROOTS.has(p)) return 1.0; // unified minifigure / animal actor (including hand-held props)
    if (p.includes('6126') || p.includes('37775') || p.includes('85959') || col === 46) return 2.0; // standalone flame / trans-orange
    if (wy > 34 && (col === 297 || col === 179 || col === 80) && rDist < 220) {
      return 3.0; // elevated golden/silver boss or statue element
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
    attribute vec4 aMeta; // x: buildOrder (0..1), y: turnFlag/pivot, z: role (0..3), w: sectionId (0..10)
    attribute vec2 aPivot;

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

    void main() {
      vec3 p = aPos;
      vec3 n = aNorm;
      float buildOrder = aMeta.x;
      float turnFlag = aMeta.y;
      float role = aMeta.z;
      float secId = aMeta.w;

      // 1. Brick-by-brick assembly (spring drop-in onto studs)
      float span = 0.14;
      float localB = clamp((uBuild * (1.0 + span) - buildOrder) / span, 0.0, 1.0);
      if (localB <= 0.001) {
        gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        return;
      }
      if (localB < 1.0) {
        float inv = 1.0 - localB;
        float dropY = inv * inv * 320.0 - sin(localB * 3.14159) * 14.0 * inv;
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

      // 3. Turntable / Choros / Celestial Boss rotation
      if (turnFlag > 0.5 || (secId == 1.0 && abs(uTurnAngle) > 0.001)) {
        float ang = turnFlag > 0.5 ? uTurnAngle : uTurnAngle * 0.65;
        float c = cos(ang), s = sin(ang);
        float px = turnFlag > 0.5 ? aPivot.x : 0.0;
        float pz = turnFlag > 0.5 ? aPivot.y : 0.0;
        float dx = p.x - px;
        float dz = p.z - pz;
        p.x = px + dx * c - dz * s;
        p.z = pz + dx * s + dz * c;
        float nx = n.x * c - n.z * s;
        float nz = n.x * s + n.z * c;
        n.x = nx; n.z = nz;
      }

      // 4. Unified Minifigure / Animal / Flame choreography
      // Because all sub-parts of a minifigure share the exact same aCenter.xz torso anchor,
      // the head, hair, beard, crown, torso, arms, hands, and weapons pivot and step as ONE solid figure!
      float glow = 0.0;
      if (role > 0.5 && role < 1.5) {
        float seed = fract(sin(aCenter.x * 0.037 + aCenter.z * 0.071) * 43758.5453);
        // Expressive character turn around the minifigure's own vertical axis so both front and back faces are visible
        float figAng = sin(uTime * 1.15 + seed * 6.283) * 0.72;
        float fc = cos(figAng), fs = sin(figAng);
        float fdx = p.x - aCenter.x;
        float fdz = p.z - aCenter.z;
        p.x = aCenter.x + fdx * fc - fdz * fs;
        p.z = aCenter.z + fdx * fs + fdz * fc;
        float fnx = n.x * fc - n.z * fs;
        float fnz = n.x * fs + n.z * fc;
        n.x = fnx; n.z = fnz;

        float stepWave = abs(sin(uTime * 3.6 + seed * 6.283));
        p.y += stepWave * 1.8;
      } else if (role > 1.5 && role < 2.5) {
        // Torch flame / forge fire flicker
        float seed = fract(sin(aCenter.x * 0.11 + aCenter.z * 0.17) * 19341.2);
        float flick = 0.5 + 0.5 * sin(uTime * 18.0 + seed * 6.283);
        p.y += flick * 2.5;
        glow = 0.65 + 0.35 * flick;
      } else if (role > 2.5) {
        // Golden deity / celestial emblem gentle hover
        p.y += sin(uTime * 2.4 + aCenter.x * 0.02) * 1.8;
        glow = 0.14;
      }

      // 5. Acoustic / Forge Radial Shockwave (for beat hits & Earshot onsets)
      if (uPulseR >= 0.0 && uPulseAmp > 0.001) {
        float r = length(p.xz);
        float dist = abs(r - uPulseR);
        if (dist < 140.0) {
          float w = exp(-(dist * dist) / (2.0 * 48.0 * 48.0)) * uPulseAmp;
          p.y += w * 18.0;
          glow = max(glow, w * 0.65);
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

      // 360-Degree Two-Sided Opposing Studio Lighting Rig:
      // Lower elevation raking lights sculpt vertical minifigure faces, beards, crowns, and walls
      // on BOTH +Z (front) and -Z (back) sides without over-exposing horizontal top surfaces!
      vec3 L1 = normalize(vec3(0.68, 0.48, 0.55));
      vec3 L2 = normalize(vec3(-0.66, 0.44, -0.61));
      vec3 L3 = normalize(vec3(-0.58, 0.25, 0.77));
      vec3 L4 = normalize(vec3(0.58, 0.28, -0.76));

      float d1 = max(dot(N, L1), 0.0);
      float d2 = max(dot(N, L2), 0.0);
      float d3 = max(dot(N, L3), 0.0);
      float d4 = max(dot(N, L4), 0.0);

      float hemiMix = N.y * 0.5 + 0.5;
      vec3 hemiCol = mix(vec3(0.18, 0.16, 0.14), vec3(0.92, 0.89, 0.84), hemiMix);

      float isRect = step(1.5, vCol.a);
      float metal = mod(vCol.a, 2.0);
      vec3 base = pow(clamp(vCol.rgb, 0.0, 1.0), vec3(2.2));

      // Crisp LDraw brick/plate micro-seam shading on rectangular bricks/plates/tiles (never on smooth molded minifigures)
      float gx = abs(fract((vPos.x + 10.0) / 20.0) - 0.5) * 2.0;
      float gz = abs(fract((vPos.z + 10.0) / 20.0) - 0.5) * 2.0;
      float gy = abs(fract(vPos.y / 8.0) - 0.5) * 2.0;
      float seamH = smoothstep(0.88, 0.99, max(gx, gz)) * step(0.55, abs(N.y));
      float seamV = smoothstep(0.86, 0.985, gy) * (1.0 - step(0.65, abs(N.y)));
      float cavity = 1.0 - 0.24 * max(seamH, seamV) * isRect;

      // Directional normal shading so perpendicular brick faces have strong 3D separation
      float dirShade = 0.88 + 0.12 * (N.x * 0.6 + N.z * 0.4);

      // Dynamic Torch / Forge Point Light
      vec3 toLight = uTorchPos - vPos;
      float lDist = length(toLight);
      vec3 Lp = toLight / max(lDist, 1.0);
      float atten = uTorchStr / (1.0 + 0.0016 * lDist + 0.0000065 * lDist * lDist);
      float dp = max(dot(N, Lp), 0.0) * atten;

      vec3 diff = base * cavity * dirShade * (
        hemiCol * 0.26 +
        uSunCol * d1 * 0.74 +
        vec3(0.94, 0.91, 0.86) * d2 * 0.58 +
        vec3(0.68, 0.78, 1.0) * d3 * 0.24 +
        vec3(1.0, 0.86, 0.66) * d4 * 0.22 +
        uTorchCol * dp * 0.95
      );

      // Dual opposing Blinn-Phong studio softbox highlights + Fresnel rim gloss
      vec3 H1 = normalize(L1 + V);
      vec3 H2 = normalize(L2 + V);
      vec3 H3 = normalize(L3 + V);
      vec3 H4 = normalize(L4 + V);
      float shininess = mix(46.0, 78.0, metal);
      float specStrength = mix(0.24, 1.35, metal);
      vec3 specCol = mix(vec3(1.0, 0.98, 0.95), base * 1.45 + vec3(0.15), metal * 0.88);

      float s1 = pow(max(dot(N, H1), 0.0), shininess);
      float s2 = pow(max(dot(N, H2), 0.0), shininess) * 0.85;
      float s3 = pow(max(dot(N, H3), 0.0), shininess * 0.55) * 0.35;
      float s4 = pow(max(dot(N, H4), 0.0), shininess * 0.55) * 0.35;
      vec3 spec = specCol * (s1 + s2 + s3 + s4) * specStrength;

      // Studio environment reflection for metallic Gold (297), Silver (80/179), and Bronze (300)
      vec3 R = reflect(-V, N);
      float envBand = 0.5 + 0.5 * sin(R.y * 6.0 + R.x * 3.0 - R.z * 2.5);
      vec3 envCol = mix(vec3(0.16, 0.11, 0.06), vec3(1.0, 0.92, 0.72), smoothstep(-0.4, 0.75, R.y));
      vec3 metalEnv = base * envCol * (0.32 + 0.68 * envBand) * metal;

      // Fresnel rim sheen for both ABS plastic and forged metal
      float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.2);
      vec3 rim = mix(vec3(0.85, 0.90, 1.0) * 0.08, base * 0.48, metal) * fresnel;

      // Specular from point light
      vec3 Hp = normalize(Lp + V);
      spec += uTorchCol * pow(max(dot(N, Hp), 0.0), 52.0) * atten * (0.25 + 0.75 * metal);

      vec3 linearOut = diff * mix(1.0, 0.38, metal) + metalEnv + spec + rim + base * vGlow * 1.3 + vec3(1.0, 0.78, 0.32) * vGlow * 0.4;
      vec3 mapped = pow(acesFilm(linearOut * 0.96), vec3(1.0 / 2.2));
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
      // hips/torso root (3815*/973) and forward through its hair/beard/crown/helmet/cape, including
      // any multi-part scepters, torches, cups, or shields held in the hands!
      const rawInst = data.inst;
      const actorGroups = new Array(rawInst.length).fill(null);
      for (let i = 0; i < rawInst.length; i++) {
        const p = String(rawInst[i][1]).toLowerCase();
        if (p.startsWith('3626')) {
          const [hx, hy, hz] = rawInst[i][2];
          let rootIdx = i;
          for (let j = i - 1; j >= Math.max(0, i - 22); j--) {
            if (actorGroups[j]) break;
            const pj = String(rawInst[j][1]).toLowerCase();
            const [jx, jy, jz] = rawInst[j][2];
            if ((pj.startsWith('3815') || pj === '973') && Math.hypot(hx - jx, hz - jz) < 40) {
              rootIdx = j;
              if (pj.startsWith('3815')) break;
            }
          }
          let endIdx = i;
          for (let k = i + 1; k <= Math.min(rawInst.length - 1, i + 6); k++) {
            const pk = String(rawInst[k][1]).toLowerCase();
            if (pk.startsWith('3815') || pk === '973' || pk.startsWith('3626') || ANIMAL_ROOTS.has(pk)) break;
            const [kx, ky, kz] = rawInst[k][2];
            if (Math.hypot(kx - hx, kz - hz) < 28 && (-ky) >= (-hy) - 48) {
              endIdx = k;
            } else {
              break;
            }
          }
          const rootY = -rawInst[rootIdx][2][1];
          const grp = { ax: hx, ay: rootY, az: hz, startIdx: rootIdx };
          for (let mIdx = rootIdx; mIdx <= endIdx; mIdx++) actorGroups[mIdx] = grp;
        } else if (ANIMAL_ROOTS.has(p) && !actorGroups[i]) {
          const [ax, ay, az] = rawInst[i][2];
          actorGroups[i] = { ax, ay: -ay, az, startIdx: i };
        }
      }

      // Sort instances bottom-to-top (by world Y = -y_ldraw, then radial distance) so buildProgress constructs from baseplate upward!
      const indexedInst = rawInst.map((item, idx) => {
        const [col, pid, m, ttIdx] = item;
        const grp = actorGroups[idx];
        const wx = grp ? grp.ax : m[0];
        const wy = grp ? grp.ay : -m[1];
        const wz = grp ? grp.az : m[2];
        const rDist = Math.hypot(wx, wz);
        return { col, pid, m, ttIdx, wx, wy, wz, rDist, origIdx: idx, isActor: !!grp };
      });
      indexedInst.sort((a, b) => (a.wy - b.wy) || (a.rDist - b.rDist));

      const totalInst = Math.max(1, indexedInst.length);

      // Count exact number of triangles first so we allocate a single contiguous Float32Array
      let totalTris = 0;
      for (let idx = 0; idx < indexedInst.length; idx++) {
        const pid = indexedInst[idx].pid;
        if (rectTris[pid]) totalTris += rectTris[pid].length;
        else if (meshTris[pid]) totalTris += meshTris[pid].length;
      }

      const buf = new Float32Array(totalTris * 3 * 19);
      let ptr = 0;

      // Map actor startIdx -> unified buildOrder so a minifigure drops in as one piece
      const actorBuildMap = new Map();

      // Stride = 19 floats:
      // aPos(3), aNorm(3), aCol(4), aCenter(3), aMeta(4), aPivot(2)
      for (let idx = 0; idx < indexedInst.length; idx++) {
        const { col, pid, m, ttIdx, wx, wy, wz, rDist, origIdx, isActor } = indexedInst[idx];
        const baseRgba = colMap[String(col)] || [0.7, 0.7, 0.7, 0.0];
        const [x, y, z, a, b, c, d, e, f, g, h, i] = m;
        const turnFlag = ttIdx >= 0 ? 1.0 : 0.0;
        const pivX = (ttIdx >= 0 && data.tt && data.tt[ttIdx]) ? data.tt[ttIdx][0] : 0.0;
        const pivZ = (ttIdx >= 0 && data.tt && data.tt[ttIdx]) ? data.tt[ttIdx][1] : 0.0;

        let buildOrder = idx / totalInst;
        if (isActor && actorGroups[origIdx]) {
          const sKey = actorGroups[origIdx].startIdx;
          if (!actorBuildMap.has(sKey)) actorBuildMap.set(sKey, buildOrder);
          buildOrder = actorBuildMap.get(sKey);
        }

        const role = classifyRole(pid, col, wy, rDist, isActor);
        const secId = computeSectionId(wx, wy, wz);

        const xf = (v) => [
          x + a * v[0] + b * v[1] + c * v[2],
          -(y + d * v[0] + e * v[1] + f * v[2]),
          z + g * v[0] + h * v[1] + i * v[2]
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

      // Evict older cached models if >= 1 to keep GPU & JS heap small across multi-scene films
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
        vertCount: ptr / 19
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

      const stride = 19 * 4;
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

      const fovDeg = opts.fov || 33;
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

  // Helper to evaluate a sequence of camera shots [{ t0, t1, slug, eye0, eye1, target0, target1, fov0, fov1, build0, build1, explode0, explode1, turnSpeed, ... }]
  // Includes a two-sided orbital azimuth sweep on circular models & wide stereo parallax on dioramas so both sides of scenes & figures are visible!
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
    const baseEye = lerp3(active.eye0, active.eye1 || active.eye0, e);
    const target = lerp3(active.target0, active.target1 || active.target0, e);

    // Add smooth two-sided orbital azimuth sweep around target so both sides of Circular Shield / Rotunda / M-sections
    // and wide left-to-right stereo angles on Dioramas are clearly seen!
    const slugStr = String(active.slug || '');
    const isCircular = !slugStr.includes('diorama');
    const orbitArc = active.orbitArc !== undefined ? active.orbitArc : (isCircular ? Math.PI * 0.85 : 0.42);
    const orbitAngle = Math.sin((u - 0.5) * Math.PI) * (orbitArc * 0.5);
    const dx = baseEye[0] - target[0];
    const dz = baseEye[2] - target[2];
    const ca = Math.cos(orbitAngle), sa = Math.sin(orbitAngle);
    const eye = [
      target[0] + dx * ca - dz * sa,
      baseEye[1],
      target[2] + dx * sa + dz * ca
    ];

    return {
      shot: active,
      u,
      e,
      slug: active.slug,
      eye,
      target,
      fov: lerp(active.fov0 || 32, active.fov1 || active.fov0 || 32, e),
      build: active.buildFn ? active.buildFn(u, t) : lerp(active.build0 ?? 1, active.build1 ?? 1, u),
      explode: active.explodeFn ? active.explodeFn(u, t) : lerp(active.explode0 ?? 0, active.explode1 ?? 0, e),
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
