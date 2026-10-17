/**
 * dsh-media-preview — play video and audio files inside the DSH right-Sidebar
 * document preview instead of the built-in "this format cannot be previewed"
 * empty state.
 *
 * Two halves, one package:
 * - this file is the Host half: it registers an authenticated
 *   `GET|HEAD /api/media-preview?path=<absolute>` route that streams file bytes
 *   with HTTP Range support, so a player can seek without downloading the whole
 *   file, and publishes the route path to the browser through the index
 *   injection table.
 * - `./client` is the browser half: it registers a document-preview renderer
 *   for video and audio suffixes and draws the native player in the preview
 *   body.
 *
 * @module dsh-media-preview
 */
import { resolveConfig } from "./config.js";
import { Config } from "./schema.js";
import { registerMediaRoute } from "./route.js";

/** Plugin name, also the settings-page namespace through the bundle patch. */
export const name = "media-preview";

/** Host services the route needs: the filesystem it streams from, and the auth fence. */
export const inject = ["fs", "connection"];

export { Config };

/**
 * Mount the streaming route and expose its path to the browser half.
 * @param ctx - host context carrying `fs`, `connection`, and the web server.
 * @param config - loader-supplied configuration.
 */
export function apply(ctx, config) {
  const settings = resolveConfig(config);
  if (!settings.enabled) return;

  ctx.effect(() => registerMediaRoute(ctx, settings), "media-preview: stream route");

  // The client reads its route from the served page, so a configured path and
  // the client's URL can never drift apart.
  ctx.on("webserver/index-inject", (table) => {
    table.push({
      kind: "global",
      name: "__DSH_MEDIA_PREVIEW_CONFIG__",
      value: { routePath: settings.routePath },
    });
  });
}
