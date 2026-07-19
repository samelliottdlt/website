# Music sequencer

This is a shareable 16-step, browser-audio sequencer with synth and drum rows.

- The URL query string is the persistent/shareable beat state. Keep
  `encodeBeat` and `decodeBeat` mutually compatible.
- Continue accepting the legacy base64 beat format and falling back to
  `defaultBeat` for invalid input.
- Compact events encode `rowIndex * NUM_STEPS + step`; preserve that format.
- Scale or root changes transpose synth notes but never drum events.
- Web Audio and playback state belong in the client component. Keep pure beat,
  scale, and serialization logic in `util.ts`.
- The Open Graph image is static because App Router metadata images do not
  receive search params.
- Update `__tests__/music-sequencer-util.spec.ts` for serialization or default
  beat changes; exact encoded output is part of the compatibility contract.
