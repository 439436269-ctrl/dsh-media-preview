# Changelog

## 0.1.0 — 2026-10-16

First release.

- Document preview renderers for video (`mp4`, `m4v`, `mov`, `webm`, `ogv`, `ogg`, `mkv`, `avi`, `wmv`, `flv`, `3gp`, `ts`, `m2ts`, `mts`) and audio (`mp3`, `wav`, `flac`, `m4a`, `aac`, `oga`, `opus`, `weba`, `wma`, `aiff`, `aif`), registered at the `extension` band with `loading: 'renderer'`.
- Authenticated `GET|HEAD /api/media-preview?path=<absolute>` route with `Accept-Ranges`, single-window `206` responses, `416` on an unsatisfiable window, and `HEAD` without a body.
- Chunked reads through `ctx.fs.readByteRange`, so memory stays flat regardless of file size.
- Native player body with full-screen and picture-in-picture actions for video, and a name/size card for audio.
- Config: `enabled`, `routePath`, `maxBytes`, `chunkBytes`, `videoExtensions`, `audioExtensions`.
- Tests: 32 `node --test` cases over range parsing, config normalization, HTTP status mapping, adapter mounting and the browser bundle.
