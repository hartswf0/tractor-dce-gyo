# QA: film-07-video-director.mp4

1920x1080 @ 30.000 fps, 12.02 s, audio: True

| level | check | detail |
|---|---|---|
| PASS | frame 0 | mean 102.1, contrast 72.7; still confirm it's a finished composition |
| PASS | single-frame flashes | none |
| PASS | pops | none |
| INFO | detected cuts | [4.0, 8.0] |
| PASS | loudness | -13.3 LUFS (target -14.0 +/-1), true peak -1.3 dBTP (<= -1.0) |
| INFO | loudest moment | loudest 100 ms at 8.55 s (-1.6 dBFS); is this the payoff? |
| PASS | silence before peak | silences >= 0.4 s below -30.0 dBFS: [{'from': 7.45, 'to': 8.45}] |

Sheets: films/shield-of-achilles/07-video-director/beats_sheet.jpg, films/shield-of-achilles/07-video-director/phone_sheet.jpg, films/shield-of-achilles/07-video-director/hook_sheet.jpg
Look at all three: numbers catch broken, not bad. The hook sheet is the muted test.
