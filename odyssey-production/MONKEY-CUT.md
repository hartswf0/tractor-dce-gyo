# Monkey Business · Night Shift — final cut

An original 83-second, 13-shot comic short adapted from the Monkey Data Center corpus. Open `monkey-film.html` and press **Watch film**. Sound starts with the click. **Stage / rehearse** exposes shot selection, scrubbing and a shot loop. **Record film** plays from the start and downloads a WebM with recorded synthetic dialogue, original procedural music and effects. Keep the tab active while recording.

## Dramatic pass

Alpha runs the shift, Beta touches the red key, and Gamma repairs the rack. The inspector arrives during the repair. The crew freezes, admits responsibility, and wins recognition when the system reports better throughput. Beta reaches for the key again at the end.

The cut has establishing and reaction shots, close framing, dolly moves, a climb, rhythmic typing, an inspection entrance, alarm lighting, green recovery and a pullback. The score changes from a major arpeggio to a tense semitone pattern; synthetic keyboard clicks, alarm beeps and a recovery chord follow the action. Dialogue is prerecorded macOS synthetic speech, not human voice acting. Captions are always present.

`monkey-cut.json` is the editable shot list: timing, two camera positions, target, line, and acting direction. `monkey-film.mjs` contains deterministic blocking and limb animation.

## Sources and adaptation

Source repository: https://github.com/hartswf0/tractor-dce-gyo

Seven unchanged MPD source variants are retained in `monkey-sources/`. The story comes from the LEGOS premise in `monkey-data-center-complete.mpd`: three capuchins, an early inspection, optimized operations. This cut rebuilds a spaced, open server floor for photography; it is not an exact rendering of one donor MPD. Several donor annotations misidentify monkey assemblies as rack doors and use inconsistent stud dimensions.

The cast uses native LDraw 2550 monkey bodies, articulated 3818/3819 arms and 3820 hands, based on the 2550c01 shortcut by Andy Westrate. Native bricks form the floor, consoles and racks. LDraw licensing/author headers are retained in the native library. Original donor files declare CCAL 2.0; inspect their headers for attribution. The new staging and score are created for this cut.

## Hand Butter

**Open in Hand Butter** transfers the current moment into the independent `native/hand-butter-scenes.html` app via same-origin IndexedDB. It transfers geometry as named assemblies. Save an adapted scene there to keep the geometry. This is a staging snapshot: it does not transfer the film's animation curves, score, voice tracks or live actor rigs. Editing individual limbs through a semantic rig and returning changes to the film remain unimplemented.

## Final export and verification

Watch `films/NIGHT-SHIFT.mp4`: 83.000 seconds, 1280 × 720, 12 fps (996 deterministic frames), H.264 video and AAC audio. The rendered edition includes all 13 shots, 11 recorded synthetic dialogue lines, original music, key clicks, alarm/recovery cues and an ending audio fade. `monkey-film.html` remains the interactive rehearsal edition. The 12 fps export gives the LEGO animation a stepped cadence.

The final pass adds animated workstation displays, lowered consoles and timed key/arm movement, native bananas and a plant, a proportioned Minifig inspector with a printed face, earlier rack climbing and a new title. Checks cover contiguous shot timing, finite camera positions, voice assets and voice duration fitting each shot; browser visual checks covered the workstation and inspector, plus the rendered ending. Playback restarts after the end, and recording disables shot looping.

## Practical limits

This is a stylized animated short, not physically simulated contact animation. Typing and climbing are keyed gestures; hands are not constrained to keys/rack grips. The inspector uses the native minifigure skeleton. No lip sync. Recording is real time and depends on browser performance. The finished MP4 is the watch-only edition; the web player is the editable rehearsal edition.
