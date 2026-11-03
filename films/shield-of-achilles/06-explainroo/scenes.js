// scenes.js — Explainroo Scene API definition for "How the Shield Was Built: Zero Loose, Zero Clashes"
export default {
  hook(s) {
    s.title('Why Big LDraw Sets Fail — And How We Fixed It', { y: 120, size: 72, at: 0 });
    const xs = s.row(3, { width: 1320, y: 460 });
    s.box('Oct 2026 Monolith', { id: 'fail', x: xs[0], y: 460, icon: 'triangle-alert', color: 'red', w: 390, at: '#failed' });
    s.note('94+ AABB clashes · maze walls', { x: xs[0], y: 580, size: 30, at: '#clashes', color: 'red' });
    s.box('shield_diorama_lib.py', { id: 'lib', x: xs[1], y: 460, icon: 'boxes', color: 'blue', w: 390, at: '#rebuilt' });
    s.box('20 Verified Kits', { id: 'pass', x: xs[2], y: 460, icon: 'shield-check', color: 'green', w: 390, at: s.mark('rebuilt') + 0.4 });
    s.arrow('fail', 'lib', { at: '#rebuilt' });
    s.arrow('lib', 'pass', { at: s.mark('rebuilt') + 0.4 });
  },

  plinth(s) {
    s.title('Primitive 1 · Cross-Laminated Museum Plinth', { y: 120, size: 68, at: 0 });
    s.code(
      "def build_diorama_plinth(m, w=48, d=32):\n  # Layer 0: X-oriented 1x2 Dark Blue (272) plates\n  # Layer 1: Z-oriented 1x2 plates (orthogonal bond)\n  # Rim: Pearl Gold (297) tiles + 30357 corner curves",
      { id: 'code-plinth', lang: 'py', title: 'shield_diorama_lib.py', x: 620, y: 480, w: 960, size: 32, at: '#cross', reveal: 'lines', lineDelay: 0.25 }
    );
    s.box('640 Bonded Plates', { id: 'slab', x: 1460, y: 480, icon: 'layers', color: 'accent', w: 420, at: '#border' });
    s.arrow('code-plinth', 'slab', { at: '#lock' });
  },

  primitives(s) {
    s.title('Primitives 2–5 · Relief, Masonry, Flora & Beasts', { y: 120, size: 68, at: 0 });
    const xs = s.row(4, { width: 1560 });
    s.box('sculpt.Form Hills', { x: xs[0], y: 500, icon: 'mountain', color: 'blue', w: 350, at: '#hills' });
    s.box('Jumper Cornices', { x: xs[1], y: 500, icon: 'landmark', color: 'accent', w: 350, at: '#masonry' });
    s.box('Cypress & Olives', { x: xs[2], y: 500, icon: 'trees', color: 'green', w: 350, at: '#trees' });
    s.box('Oxen, Lions & Dogs', { x: xs[3], y: 500, icon: 'sparkles', color: 'purple', w: 350, at: '#beasts' });
  },

  checker(s) {
    s.title('Primitive 6 · kitlib.check() Graph BFS & AABB Audit', { y: 120, size: 68, at: 0 });
    s.box('Stud Graph BFS', { id: 'bfs', x: 460, y: 440, icon: 'git-Compare', color: 'blue', w: 420, at: '#bfs' });
    s.box('3D AABB Clash Test', { id: 'aabb', x: 960, y: 440, icon: 'scan-line', color: 'purple', w: 420, at: '#aabb' });
    s.box('24,631 Pieces: 0 / 0', { id: 'tot', x: 1460, y: 440, icon: 'check-circle-2', color: 'green', w: 420, at: '#total' });
    s.arrow('bfs', 'aabb', { at: '#aabb' });
    s.arrow('aabb', 'tot', { at: '#total' });
  }
};
