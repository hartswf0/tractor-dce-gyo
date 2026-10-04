"""tools/making/hop_script.py — Hearts of Plastic, the episodes' scripts (odyssey/writers-room/BIBLE.md). Read by tools/making/voices.py
through lego_script.py (CAST and SCENES are merged there), by tools/making/hop_keys.py and by the assembly (tools/making/hop_film.py).

Every gag is from the record; each episode's EVIDENCE lists what each one stands on (a camera note in odyssey/perform/camera.html, a
take in films/odyssey/takes/index.json, a commit). A line is (key, speaker, addressee, pause before it in seconds, text[, opts]).
Besides the cast, three speakers lay events on the clock and are not voices:
  'clap'     the clapperboard (a sound in the bed; text unused)
  'dailies'  the crew watch a real take on the monitor: text 'file@from+seconds|caption' (films/odyssey/...), cut in over the
             episode's picture by hop_film.py while the room is quiet; the clock waits for it
  'beat'     silence held for action, text 'seconds|what happens'
"""

# the Odyssey's actors, each in one Kokoro voice for every episode (the crew's voices are lego_script.py's). fx: 'giant' lowers the
# voice by resampling (a third slower and deeper); 'shade' the faint echo the restored Achilles line has (odyssey/kits/cut-restore.json)
CAST = {
    'polyphemus': dict(name='Polyphemus', face=None, voice='am_fenrir', speed=1.08, fx='giant'),
}

SCENES = {
 'OD-B26-S01': dict(title='The Cave', episode=1, head=1.0, tail=2.6, location='OD-B09-S06',
  hypothesis='A camera goes where the heat is.',
  lines=[
    ('K1', 'firstad', 'director', 0.0, "Book nine. The Cyclops's cave. Escape beneath the rams. Take one."),
    ('K1', 'clap', None, 0.4, ''),
    ('K1', 'director', 'cinematographer', 0.5, "Action."),
    ('K1', 'beat', None, 0.3, '2.0|the rams go by; nothing else'),
    ('K1', 'director', 'cinematographer', 0.2, "Where is the camera?"),
    ('K1', 'cinematographer', 'director', 0.6, "In the ram."),
    ('K2', 'firstad', 'cinematographer', 1.6, "Why is the camera in the ram?"),
    ('K2', 'cinematographer', 'firstad', 0.6, "The ram was the hottest thing in the scene. I go where the heat is."),
    ('K2', 'dailies', None, 0.6, 'films/odyssey/takes/OD-B09-S10/take1.mp4@10.6+3.4|DAILIES · Escape beneath the Rams, take 1 (1 Oct, 88b35af3): the lens in the wool'),
    ('K2', 'director', 'firstad', 0.5, "Wool."),
    ('K2', 'firstad', 'cinematographer', 0.6, "He means: get out of the sheep."),
    ('K2', 'cinematographer', 'firstad', 0.8, "New rule. No lens inside an animal."),
    ('K2', 'cinematographer', 'firstad', 0.9, "Or a face."),
    ('K3', 'firstad', 'director', 1.8, "The night wide. Take one."),
    ('K3', 'clap', None, 0.4, ''),
    ('K3', 'dailies', None, 0.6, 'films/odyssey/takes/OD-B09-S10/take1.mp4@19.6+3.0|DAILIES · Escape beneath the Rams, take 1: the night wide'),
    ('K3', 'director', 'cinematographer', 0.5, "Is anyone in this shot?"),
    ('K3', 'cinematographer', 'director', 0.6, "Odysseus, six men, three rams, a ship and a giant."),
    ('K3', 'director', 'cinematographer', 0.9, "I'll take your word for it."),
    ('K3', 'cinematographer', 'director', 0.8, "New rule. A frame that is nearly black is refused."),
    ('K4', 'firstad', 'polyphemus', 2.0, "Polyphemus, your close-up."),
    ('K4', 'polyphemus', 'firstad', 0.8, "From below."),
    ('K4', 'firstad', 'director', 0.6, "He wants to be shot from below."),
    ('K4', 'cinematographer', 'director', 0.7, "From above, the eye was never where his head was."),
    ('K4', 'clap', None, 1.0, ''),
    ('K4', 'polyphemus', None, 0.6, "Strangers, who are you?"),
    ('K4', 'director', 'polyphemus', 1.2, "Half your face is in shadow."),
    ('K4', 'polyphemus', 'director', 0.8, "That is my good side."),
    ('K5', 'firstad', 'director', 1.8, "The stone. He seals the cave. Take one."),
    ('K5', 'clap', None, 0.4, ''),
    ('K5', 'director', 'polyphemus', 0.5, "Action."),
    ('K5', 'beat', None, 0.2, '3.2|the giant reaches for the stone; the cut; the stone is in the door'),
    ('K5', 'director', 'cinematographer', 0.3, "Did it move?"),
    ('K5', 'cinematographer', 'director', 0.6, "It was beside the door. Now it is in the door."),
    ('K5', 'director', 'odysseus', 0.9, "Did anyone see it move?"),
    ('K5', 'odysseus', 'director', 0.7, "Nobody."),
    ('K5', 'director', 'odysseus', 0.8, "Nobody?"),
    ('K5', 'odysseus', 'director', 0.6, "That's my name."),
    ('K5', 'firstad', None, 1.4, "Back to one."),
    ('K6', 'firstad', 'polyphemus', 2.6, "Take two. This time he carries it."),
    ('K6', 'clap', None, 0.4, ''),
    ('K6', 'director', 'polyphemus', 0.5, "Action."),
    ('K6', 'beat', None, 0.2, '5.0|the giant carries the great stone into the door, seen'),
    ('K6', 'director', 'firstad', 0.4, "Print it."),
    ('K7', 'firstad', 'director', 1.8, "The milking. We lit it again."),
    ('K7', 'dailies', None, 0.6, 'films/odyssey/takes/OD-B09-S06/take1.mp4@24.0+2.6|DAILIES · Polyphemus Seals the Cave, take 1 (3 Oct, f46a0238)'),
    ('K7', 'dailies', None, 0.0, 'films/odyssey/OD-B09-S06-performed.mp4@24.0+2.6|DAILIES · take 2 (53c9b5e4): the fill up, the fire brighter'),
    ('K7', 'cinematographer', 'director', 0.5, "The background is still black."),
    ('K7', 'director', 'cinematographer', 1.2, "Keep it."),
  ],
  evidence=[
    ('the camera in the ram', 'films/odyssey/takes/index.json OD-B09-S10 take 1 (88b35af3): "some frames from inside a ram\'s body or a face"; take 2 (8c8d4374): "no frame inside a ram or a face"; tools/cinematographer/solve.js L1c (the lens out of a creature\'s sphere)'),
    ('the hottest thing in the scene', 'tools/cinematographer/plan.js R1 heat: the shot goes to the hottest figure'),
    ('is anyone in this shot?', 'OD-B09-S10 take 1: "a night wide almost black"; take 2: "the black night wide refused"; solve.js exposure: a frame nearly black is refused'),
    ('from below', 'camera note OD-B09-S06: "the giant\'s question is low and close, half his face in shadow"; plan.js R8: a shot on a creature is low; 1c64c8e6: "the Cyclops\'s eye centred on his head"'),
    ('the stone that was not seen to move', 'OD-B09-S06 take 1 (f46a0238): "the great stone did not read as the giant\'s doing"; take 2 (53c9b5e4): "carried into the doorway with the giant\'s heave (a new engine feature: a set piece carried by a body)"'),
    ('the milking still black', 'camera note OD-B09-S06: "the milking\'s background is still black"; take 2: "the sealed cave and the milking lit"'),
  ]),
}
