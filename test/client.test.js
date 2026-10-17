import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";

/**
 * Load the browser bundle the way the web shell does: register a factory, then
 * materialize it with a module-table `require`.
 * @returns the bundle exports plus what `apply()` registered.
 */
async function loadBundle() {
  const source = await readFile(new URL("../lib/client.js", import.meta.url), "utf8");
  const registrations = [];
  globalThis.window = {
    __ModuleLoader__: {
      load: (registration) => registrations.push(registration),
    },
  };
  // The bundle is a classic script, not an ES module; evaluate it directly so
  // the registration facade it targets is the one installed above.
  new Function(source)();
  assert.equal(registrations.length, 1);
  const registration = registrations[0];
  assert.equal(registration.id, "dsh-media-preview");
  const exports = registration.factory((specifier) => {
    if (specifier === "react") return { createElement: () => null, useEffect: () => {}, useRef: () => ({}), useState: () => [0, () => {}], useCallback: (fn) => fn };
    throw new Error(`unexpected module request ${specifier}`);
  });
  return exports;
}

test("the bundle registers itself under the package name and requires only react", async () => {
  const exports = await loadBundle();
  assert.equal(typeof exports.apply, "function");
  assert.deepEqual(exports.inject, ["slots", "locale", "resources", "documentPreviews"]);
});

test("mediaKindOf separates audio suffixes from video ones", async () => {
  const { mediaKindOf } = await loadBundle();
  assert.equal(mediaKindOf("C:\\codes\\a\\clip.mp4"), "video");
  assert.equal(mediaKindOf("/x/a.WEBM"), "video");
  assert.equal(mediaKindOf("/x/song.flac"), "audio");
  assert.equal(mediaKindOf("/x/voice.MP3"), "audio");
  assert.equal(mediaKindOf("/x/no-extension"), "video");
});

test("streamUrl encodes the path and keeps one query", async () => {
  const { streamUrl } = await loadBundle();
  assert.equal(
    streamUrl("/api/media-preview", "D:\\codes\\动画 素材\\clip#1.mp4"),
    "/api/media-preview?path=D%3A%5Ccodes%5C%E5%8A%A8%E7%94%BB%20%E7%B4%A0%E6%9D%90%5Cclip%231.mp4"
  );
});

test("apply registers two renderers, two bodies, and one dictionary", async () => {
  const { apply } = await loadBundle();
  globalThis.__DSH_MEDIA_PREVIEW_CONFIG__ = { routePath: "/api/custom-media" };
  const renderers = [];
  const slots = [];
  const dictionaries = [];
  const effects = [];
  const ctx = {
    effect: (factory, label) => {
      effects.push(label);
      factory();
    },
    locale: {
      bind: () => (key) => key,
      register: (namespace, value) => {
        dictionaries.push({ namespace, value });
        return () => {};
      },
    },
    documentPreviews: {
      register: (definition) => {
        renderers.push(definition);
        return () => {};
      },
    },
    slots: {
      inject: (name, factory) => {
        factory();
        return () => {};
      },
      register: (definition) => {
        slots.push(definition);
        return () => {};
      },
    },
  };
  apply(ctx);
  delete globalThis.__DSH_MEDIA_PREVIEW_CONFIG__;

  assert.equal(dictionaries.length, 1);
  assert.equal(dictionaries[0].namespace, "mediaPreview");
  assert.equal(typeof dictionaries[0].value.zh.video, "string");
  assert.equal(typeof dictionaries[0].value.en.video, "string");

  assert.equal(renderers.length, 2);
  const [video, audio] = renderers;
  assert.equal(video.id, "dsh-media-preview/media");
  assert.ok(video.extensions.includes("mp4"));
  assert.equal(video.priority, "extension");
  assert.equal(video.loading, "renderer");
  assert.equal(video.wrap, false);
  assert.deepEqual(video.binaryExtensions, video.extensions);
  assert.equal(audio.id, "dsh-media-preview/audio");
  assert.ok(audio.extensions.includes("mp3"));
  assert.ok(!audio.extensions.includes("mp4"));

  assert.equal(slots.length, 2);
  assert.deepEqual(
    slots.map((slot) => slot.key),
    ["dsh-media-preview/media", "dsh-media-preview/audio"]
  );
  for (const slot of slots) {
    assert.equal(slot.name, "sidebar.right.tab.document");
    assert.equal(slot.locale, "mediaPreview");
    const injected = slot.inject("session-1", {});
    assert.equal(injected.routePath, "/api/custom-media");
    assert.equal(typeof injected.t, "function");
  }
  assert.ok(effects.length >= 3);
});

test("apply works without any injected boot config", async () => {
  const { apply } = await loadBundle();
  globalThis.__DSH_MEDIA_PREVIEW_CONFIG__ = undefined;
  const slots = [];
  const ctx = {
    effect: (factory) => factory(),
    locale: { bind: () => (key) => key, register: () => () => {} },
    documentPreviews: { register: () => () => {} },
    slots: {
      inject: (_name, factory) => {
        factory();
        return () => {};
      },
      register: (definition) => {
        slots.push(definition);
        return () => {};
      },
    },
  };
  apply(ctx);
  assert.equal(slots[0].inject("s", {}).routePath, "/api/media-preview");
});
