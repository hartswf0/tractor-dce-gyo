// demos/shield-worldtext.demo.ts — Argo Playwright Demo Script for Shield of Achilles
import {
  test,
  showOverlay,
  spotlight,
  focusRing,
  zoomTo,
  resetCamera,
  createHumanCursor,
  cursorHighlight,
} from '@argo-video/cli';

test.setTimeout(180_000);

test('Shield of Achilles — Navigating the Worldtext & 3D Studio', async ({ page, narration }) => {
  await page.goto('/shield-experiments.html');
  const cursor = await createHumanCursor(page, { seed: 42 });
  await cursorHighlight(page, { mode: 'click', color: '#e5bd43' });

  await narration.startRecording(page);

  // Scene 1: Hero Telemetry & Experiment Log
  narration.mark('hero-telemetry');
  const s1Ms = narration.durationFor('hero-telemetry');
  showOverlay(page, 'hero-telemetry', narration.sceneDuration('hero-telemetry'));
  await cursor.moveTo('#telemetry-summary');
  focusRing(page, '#telemetry-summary', { color: '#e5bd43', duration: Math.floor(s1Ms * 0.7) });
  await page.waitForTimeout(s1Ms);

  // Scene 2: 8 Monumental 48x32 Dioramas Inspector
  narration.mark('diorama-inspector');
  const s2Ms = narration.durationFor('diorama-inspector');
  showOverlay(page, 'diorama-inspector', narration.sceneDuration('diorama-inspector'));
  await cursor.moveTo('#diorama-grid');
  await cursor.click('#diorama-card-cattle');
  spotlight(page, '#diorama-card-cattle', { duration: Math.floor(s2Ms * 0.65) });
  await page.waitForTimeout(s2Ms);

  // Scene 3: Interactive 3D WebGL Studio (odyssey-forage.html)
  narration.mark('webgl-studio');
  const s3Ms = narration.durationFor('webgl-studio');
  showOverlay(page, 'webgl-studio', narration.sceneDuration('webgl-studio'));
  await cursor.moveTo('#btn-launch-3d');
  await cursor.click('#btn-launch-3d');
  await zoomTo(page, '#webgl-viewport', { narration, scale: 1.35, holdMs: 2200 });
  await page.waitForTimeout(s3Ms);
  await resetCamera(page);

  // Scene 4: 4-Angle Contact Sheets & kitlib.check() Verification
  narration.mark('verification-loop');
  const s4Ms = narration.durationFor('verification-loop');
  showOverlay(page, 'verification-loop', narration.sceneDuration('verification-loop'));
  await cursor.moveTo('#contact-sheets-section');
  focusRing(page, '#contact-sheets-section', { color: '#51cf66', duration: Math.floor(s4Ms * 0.75) });
  await page.waitForTimeout(s4Ms);

  await cursor.dispose();
});
