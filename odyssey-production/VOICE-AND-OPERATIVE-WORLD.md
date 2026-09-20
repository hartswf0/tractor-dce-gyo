# Speech as an input to the operative world

## Observed failure
The production Word to World page contained no local Whisper loader. `put-that-there.js` requested camera and microphone together, loaded hand and pose models, and only then started browser speech recognition. A second recorder used `gpt-4o-transcribe` with the builder key. A camera/model failure could therefore prevent speech. The two recognition paths could also overlap.

## Repair
`native/world/odyssey-voice.js` adds an independent Voice surface, preserving the world renderer, library, horse controller, builder and pointing systems.

- **Whisper local:** explicit Load, file progress, Ready, Cancel, timeout, Retry. Quantized English Whisper tiny runs in a module worker using Transformers.js 3.8.1 and WASM with one thread. Assets download from Hugging Face and are browser-cached. Microphone audio remains on the device. Loading the model does not open the microphone.
- **Browser speech:** independently available where supported; no local Whisper claim.
- **Whisper cloud:** explicit `whisper-1` transcription via OpenAI, using the existing builder key. UI identifies the remote provider and missing credentials. This is not a local model.
- Recording requests audio only and has a 30-second limit. Media tracks stop on completion/cancel. Late permission grants and late results cannot restart or overwrite cancelled work.
- The transcript is editable and never automatically executes.
- **Do command:** direct movement, light/weather commands, and existing bound-object operations. Stop reaches the mounted controller too.
- **Ask model:** a separate, read-only discussion request with scene metadata, current bindings and recent discussion. No image is sent by this route; it cannot honestly claim visual inspection. Reply playback is optional browser speech synthesis.
- **Send to builder:** transfers the words to the existing builder without automatically starting it.
- **Connect model:** opens the existing key entry. Local transcription needs no key; model discussion and cloud transcription do.

## Information architecture implication
Speech recognition, interpretation and action are separate states, not one microphone toggle. Voice and direct manipulation should operate on the same object selection and operation model. A conversation transcript is not the canonical scene state.

The next fusion surface should show an instruction card containing:
1. The phrase heard, editable.
2. The referenced actor/object and destination, visibly highlighted.
3. The interpreted operation and its live parameters.
4. Preview, apply, stop and recovery appropriate to that operation.
5. Its link to the shot/time interval when it becomes a recorded performance.

For example, “move that horse behind the gate” needs a specific horse and gate, a visible destination and a reversible move. “Why does this shot feel flat?” is a discussion, not a build instruction. “Slower” needs a selected performance and a speed parameter, not an unrelated new prompt.

This repair provides the independent input channel and explicit action split. It does **not** yet implement spatially anchored instruction cards, continuous realtime conversation, timeline-bound utterances, or universal undo for every legacy operation. It does not replace the production menu or complete the proposed Hand Butter library fusion.

## Verification and limits
- Browser: local Whisper reached Ready inside the real Odyssey world.
- Browser: the public JFK sample transcribed locally into the expected sentence, with no scene mutation.
- Browser: reviewed `weather fog` changed weather and reported the new condition.
- Browser: Ask model without a key preserved the question and reported the missing prerequisite.
- `tests/voice-channel.cjs`: mocked audio-only constraints, late permission cleanup, MIME/file compatibility, Whisper API model, transcript review, cancellation, direct commands and read-only discussion.
- All existing production suites remain required.
- No real microphone recording or paid cloud/model request was tested. Recognition quality, browser permissions and latency on the user's microphone still need a live rehearsal. English tiny is a compact model; accented speech, noise and other languages may need a larger/multilingual model later.

## Sources
- [Transformers.js pipeline API](https://huggingface.co/docs/transformers.js/v3.8.1/pipelines)
- [OpenAI file transcription](https://developers.openai.com/api/docs/guides/speech-to-text)
