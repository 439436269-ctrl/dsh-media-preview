# Maintenance notes — dsh-media-preview

Durable notes for whoever (or whichever session) touches this package next. Verification evidence lives in [VERIFY.md](VERIFY.md); user-facing docs live in the READMEs.

## Decisions

- **Renderer-owned loading (`loading: "renderer"`) instead of `bytes-complete`.** The shared byte reader loads a whole file and has a byte cap (the deployment's `maxFileBytes` / image limit). Video wants neither: the browser seeks, so the route must serve ranges. The body therefore never sees the bytes — it only gets `resourceAddress` and calls `loaded` / `failed` back.
- **A plugin route under `/api`, not a bare webServer prefix.** The connection service fences and authenticates every `/api` request (Host/Origin + `dsh-auth-*` cookie) before the handler runs; a top-level route would be an unauthenticated local-file reader. The route name is configurable but normalized back under `/api/` if someone sets otherwise.
- **Two renderer ids, one body component.** `dsh-media-preview/media` (video suffixes) and `dsh-media-preview/audio` (audio suffixes) exist so the toolbar label says "视频" / "音频" while both key to the same body. The body derives `kind` from the address suffix, so a mis-keyed tab still renders something sensible.
- **Hand-written client bundle, no build step.** `lib/client.js` is the `window.__ModuleLoader__.load({ id, factory })` CJS factory; only `react` / `react/jsx-runtime` are required. This keeps the package buildless and impossible to desync from the host's React copy. Do not "modernize" it into an ESM file — the loader would reject it.
- **Suffix lists exist twice on purpose** (`lib/config.js` for the Host, `lib/client.js` for the browser). The Host list decides what the route accepts; the client list decides what the UI claims. Keep them in sync by hand — a shared module cannot cross the module-table boundary.

## Pitfalls (each cost a cycle)

| Symptom | Root cause | Fix |
|---|---|---|
| Edited `lib/client.js`, restarted, still old layout | pnpm **copies** a `file:` directory dependency instead of linking it | re-run `pnpm add`, or install the packed tarball / registry version |
| `plugins/dsh-media-preview/client.js` returns 404, looks unloaded | bundles are served as `plugins/??<a>/client.js,<b>/client.js&rev=…` combos | check `__DSH_BOOT__` for the row instead |
| Portrait video spills past the pane | `width: 100%` + aspect-derived height with no definite parent height | flexible `.dsh-mp-box` + `width/height:100%; object-fit: contain` |
| `dsh plugin --profile desktop …` refuses | the desktop profile is owned by the Electron app | compose with the runtime's pnpm, then add the row to `cordis.patch.yml` (or use the plugin manager UI) |
| `pnpm add file:` fails with `ERR_PNPM_UNEXPECTED_VIRTUAL_STORE` on a temp profile | junctioned `node_modules` carries the desktop virtual-store path | copy the whole profile, or install the tarball into a fresh tree |

## Releasing

1. Bump `package.json` version and add a `CHANGELOG.md` entry.
2. `node --test test/*.test.js` — must stay green.
3. `pnpm pack` and inspect `tar -tzf`; then `npm publish --access public`.
4. `npm view <name> dist-tags` (allow a minute for propagation; a brand-new package shows a placeholder `0.0.0-stage` first).
5. Reinstall into the desktop profile, confirm `dependencies` + `dsh.profile.bundles` + the `media-preview` patch row, then restart the app.
6. Commit and push, and confirm the GitHub Actions `test` workflow on the new HEAD.

## Re-verifying without touching the user's app

- Build a throwaway profile: copy `package.json` / `cordis.patch.yml` / `pnpm-workspace.yaml` / `cordis.yml` from `desktop`, junction `node_modules`, then `dsh --profile <tmp> --no-open --port 0`; the log prints an authenticated URL.
- HTTP: `scripts/e2e-probe.ps1 -Base <url> -Token <token> -File <media>`.
- Browser: `scripts/e2e-browser.mjs --base <url> --token <token> --video <media>` with `E2E_BROWSER_CHANNEL=msedge` when the bundled Chromium is unavailable. The script asserts the player's bounding box stays inside the preview pane, seeks, and plays.
- Always delete the temp profile afterwards (`node_modules` is a junction — remove the link, not the target).
