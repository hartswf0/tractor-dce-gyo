// argo.config.mjs — Shield of Achilles Interactive Worldtext Walkthrough (05-argo)
export default {
  baseURL: 'http://localhost:8080/shield-experiments.html',
  demosDir: 'demos',
  outputDir: 'videos',
  tts: {
    engine: 'kokoro',
    voice: 'af_heart',
    speed: 1.0,
  },
  video: {
    width: 1920,
    height: 1080,
    fps: 30,
    deviceScaleFactor: 2,
    cursorHighlight: {
      mode: 'click',
      color: '#e5bd43',
      radius: 28,
    },
  },
  export: {
    preset: 'slow',
    crf: 18,
    subtitles: true,
    chapters: true,
  },
};
