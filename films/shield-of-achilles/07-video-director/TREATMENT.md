# TREATMENT — The Nine Dogs & The Two Tawny Lions (`07-video-director`)

## One-Sentence Idea
Direct a 12-second, music-grid pastoral & dance film across Ring 3 of the Shield of Achilles (`6,404` pieces across Cattle `#6`, Sheepfold `#7`, and Choros `#8`), validated pre-build by `check_timeline.py` and verified post-render by `qa_video.py`.

## Dials (`SKILL.md` §Decide the dials)
- **Clock:** `music` (`120 BPM`, `4/4` meter, `12.0s` = `6` exact bars)
- **Continuity Mode:** `Morph chain` (smooth cross-dissolves + continuous camera drift so `qa_video.py` detects 0 unplanned hard cuts and 0 frozen frames)
- **Register:** `Editorial/documentary` (`30 fps`, high-contrast text boxes verified by Otsu luminance segmentation)
- **Text Policy:** `Type as hero` (`hook >= 84 px` and `cta >= 48 px` at Frame 0, contrast `> 12:1`)
- **Planned Silence & Hero Moment:** `0.8s` complete acoustic hush (`7.50s–8.30s`) immediately preceding the Hero Moment at `8.50s` (`70.8%` of runtime) when the Two Tawny Lions seize the bellowing bull (`-14.0 LUFS` integrated loudness).
