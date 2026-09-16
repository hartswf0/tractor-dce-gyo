# Word to World time machine

Open `../word-to-world-time-machine.html`. The manifest records a fixed 24-hour
history window, all reachable commits in that window, and the preceding
first-parent baseline. Commit time is displayed in the viewer's local timezone.

Each snapshot preserves the historical HTML and every directly linked local
script and stylesheet. Code blobs are deduplicated by Git SHA-1 and verified
byte-for-byte. Model libraries, textures, external CDNs and remote APIs remain
live dependencies. This is a UI/code archive, not a frozen network recording.

The archive adapter adds a repository-relative base URL and separate storage
namespaces for each revision and comparison pane. It also namespaces broadcast
channels, preventing older builds from stealing the current demo's graphics
lease. The standard launch uses `noloc=1&lease=share&mute=1` to compare the baked
Hlíðarendi location without asking for location. No rollback is performed.

Only explicitly started panes run. Stop removes the iframe. Code uses original
handlers, so a historical fault remains a fault. Phone dimensions reproduce CSS
breakpoints, not physical device performance or touch hardware.

`node time-machine/verify.cjs` checks blob integrity, reference coverage, and
storage/lease separation. `python time-machine/build_archive.py` rebuilds the
archive from the checkout's HEAD and its preceding 24 hours. `runs.json` records
the Pages workflow evidence available when this archive was assembled.

Mark usable/broken revisions and export review notes to identify a rollback
candidate. Use the exact commit SHA when requesting a rollback. The archive
intentionally contains no button that silently replaces the live demo.
