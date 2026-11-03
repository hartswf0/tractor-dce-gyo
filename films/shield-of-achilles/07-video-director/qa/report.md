# QA: film-07-video-director.mp4

1920x1080 @ 30.000 fps, 12.00 s, audio: True

| level | check | detail |
|---|---|---|
| PASS | frame 0 | mean 110.0, contrast 77.8; still confirm it's a finished composition |
| PASS | hook text | 'NINE DOGS & TWO LIONS' at 0.1 s: ~86.1 px font (>= 84), contrast 19.7:1 (>= 7:1) |
| PASS | cta text | 'SHIELD-EXPERIMENTS.HTML · 6,404 PCS' at 0.1 s: ~48.6 px font (>= 48), contrast 15.2:1 (>= 7:1) |
| PASS | term text | 'CHOROS WHEEL · 2,081 PCS' at 4.1 s: ~56.9 px font (>= 48), contrast 19.7:1 (>= 7:1) |
| PASS | single-frame flashes | none |
| PASS | pops | none |
| INFO | detected cuts | [4.0, 8.0] |
| PASS | loudness | -14.0 LUFS (target -14.0 +/-1), true peak -2.1 dBTP (<= -1.0) |
| PASS | loudest moment | loudest 100 ms at 8.5 s (-7.3 dBFS); hero moment at 8.5 s (offset +0.00 s) |
| PASS | silence before peak | silences >= 0.4 s below -30.0 dBFS: [{'from': 7.45, 'to': 8.35}] |
| PASS | planned silence | 7.5-8.3 s peaks at -120.0 dBFS, 107.9 dB under p90 (needs < -30.0 dBFS) |

Sheets: films/shield-of-achilles/07-video-director/qa/beats_sheet.jpg, films/shield-of-achilles/07-video-director/qa/phone_sheet.jpg, films/shield-of-achilles/07-video-director/qa/hook_sheet.jpg
Look at all three: numbers catch broken, not bad. The hook sheet is the muted test.
