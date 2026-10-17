# Changelog

## 0.1.2 — 2026-10-17

Playback speed and looping.

- A **倍速 / Speed** button cycles 1× → 1.25× → 1.5× → 1.75× → 2× → 0.5× → 0.75× and shows the rate in force. The rate is re-applied after a source change (a new `src` resets `playbackRate`).
- A **循环 / Loop** button toggles `loop`, with an active state on the button.
- Both controls appear for audio as well as video, and the choice is remembered per browser in `localStorage` (`dsh-media-preview:playback`); a blocked store silently falls back to in-memory state.

## 0.1.1 — 2026-10-16

Fit the video to the pane instead of letting it overflow.

- A portrait clip used to render at the pane's full width and spill past the bottom edge (`width: 100%` plus an aspect-derived height). The player now sits in a flexible frame that fills the pane and the video uses `object-fit: contain`, so the whole frame is visible at once with the native controls reachable.
- The frame keeps a black letterbox and a rounded border; the loading/error hint sits under it instead of over the picture.

## 0.1.0 — 2026-10-16

First release.

- Document preview renderers for video (`mp4`, `m4v`, `mov`, `webm`, `ogv`, `ogg`, `mkv`, `avi`, `wmv`, `flv`, `3gp`, `ts`, `m2ts`, `mts`) and audio (`mp3`, `wav`, `flac`, `m4a`, `aac`, `oga`, `opus`, `weba`, `wma`, `aiff`, `aif`), registered at the `extension` band with `loading: 'renderer'`.
- Authenticated `GET|HEAD /api/media-preview?path=<absolute>` route with `Accept-Ranges`, single-window `206` responses, `416` on an unsatisfiable window, and `HEAD` without a body.
- Chunked reads through `ctx.fs.readByteRange`, so memory stays flat regardless of file size.
- Native player body with full-screen and picture-in-picture actions for video, and a name/size card for audio.
- Config: `enabled`, `routePath`, `maxBytes`, `chunkBytes`, `videoExtensions`, `audioExtensions`.
- Tests: 32 `node --test` cases over range parsing, config normalization, HTTP status mapping, adapter mounting and the browser bundle.
