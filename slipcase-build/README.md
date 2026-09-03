# slipcase-build

The compiler that produced `../slipcase/` (the research desk) and
`slipcase__ldraw-assembly-field__2026-09-03.zip` (the same desk, zipped) from the
87 zettels and the POML "SLIPCASE — PORTABLE RESEARCH FIELD" prompt pasted on 2026-09-03.

Open `../slipcase/index.html` (or `000__START_HERE.txt`) to read the field. The working
paper is `../slipcase/the-field-not-the-window__2026-09-03.pdf`; the seed prompts are in
`../slipcase/_PROMPTS/`; the measured numbers are in `../slipcase/_RESOURCES/field-results.json`.

Pipeline (from the repository root, with `python3 -m http.server 8899` running for the viewer):

    python3 slipcase-build/extract.py      # raw paste → work/zettels.json, work/poml.txt
    node    slipcase-build/measure-field.js # open-stud field + closing passes → work/field/
    node    slipcase-build/render-field.js  # before/after renders (Chromium)
    python3 slipcase-build/compile.py       # → desk/ and the ZIP (rebuild test, PDF, zip test)

`raw/` holds the paste exactly as received. `work/field/field-results.json` is committed;
the MPD/PNG variants it describes live in `../slipcase/_RESOURCES/`.
