window.__ModuleLoader__.load({
  id: "dsh-media-preview",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    const React = require("react");

    /** This package's copy namespace. */
    const NS = "mediaPreview";
    /** Renderer identity: the registry definition id and the body slot key. */
    const MEDIA_BODY_ID = "dsh-media-preview/media";
    /** Audio renderer identity; the same body serves both. */
    const MEDIA_AUDIO_BODY_ID = "dsh-media-preview/audio";
    /** Route that streams the bytes; the Host half owns the same default. */
    const DEFAULT_ROUTE_PATH = "/api/media-preview";
    /** Video suffixes mirrored from the Host defaults. */
    const MEDIA_VIDEO_EXTENSIONS = ["mp4", "m4v", "mov", "webm", "ogv", "ogg", "mkv", "avi", "wmv", "flv", "3gp", "ts", "m2ts", "mts"];
    /** Audio suffixes mirrored from the Host defaults. */
    const MEDIA_AUDIO_EXTENSIONS = ["mp3", "wav", "flac", "m4a", "aac", "oga", "opus", "weba", "wma", "aiff", "aif"];

    const zh = {
      video: "视频",
      audio: "音频",
      loading: "加载媒体中…",
      failed: "无法播放这个文件",
      unsupported: "浏览器不支持这个编码",
      retry: "重试",
      fullscreen: "全屏",
      pip: "画中画",
      audioOnly: "音频文件",
      streamError: "播放失败：{reason}",
    };

    const en = {
      video: "Video",
      audio: "Audio",
      loading: "Loading media...",
      failed: "This file could not be played.",
      unsupported: "This codec is not supported by the browser.",
      retry: "Retry",
      fullscreen: "Full screen",
      pip: "Picture in picture",
      audioOnly: "Audio file",
      streamError: "Playback failed: {reason}",
    };

    /** Scoped styles; every selector starts at the root attribute. */
    const STYLE = [
      '[data-media-preview]{display:flex;flex-direction:column;flex:auto;height:100%;min-height:0;box-sizing:border-box;color:var(--dsw-alias-label-primary,#1f2329)}',
      '[data-media-preview] .dsh-mp-viewport{display:flex;flex:auto;min-height:0;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;background:var(--dsw-alias-bg-document-preview,#0f1115);overflow:auto}',
      '[data-media-preview] .dsh-mp-stage{position:relative;display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;max-height:100%}',
      '[data-media-preview] .dsh-mp-player{display:block;width:100%;max-width:100%;max-height:100%;border-radius:10px;background:#000;object-fit:contain;box-shadow:0 2px 16px rgba(0,0,0,.28)}',
      '[data-media-preview] .dsh-mp-player[data-kind="audio"]{position:static;width:100%;max-width:340px;height:40px;background:transparent;box-shadow:none;border-radius:0}',
      '[data-media-preview] .dsh-mp-audio{display:flex;flex-direction:column;align-items:center;gap:12px;padding:28px 20px;width:min(420px,100%);border-radius:14px;background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.06));box-sizing:border-box;text-align:center}',
      '[data-media-preview] .dsh-mp-audio-name{font-size:14px;font-weight:600;overflow-wrap:anywhere;margin:0}',
      '[data-media-preview] .dsh-mp-audio-meta{font-size:12px;opacity:.66;margin:0}',
      '[data-media-preview] .dsh-mp-glyph{width:52px;height:52px;opacity:.7}',
      '[data-media-preview] .dsh-mp-status{display:flex;flex-direction:column;align-items:center;gap:12px;padding:32px 20px;font-size:13px;opacity:.82;text-align:center}',
      '[data-media-preview] .dsh-mp-status[data-state="failed"]{opacity:1;color:var(--dsw-alias-state-error-label,#d32029)}',
      '[data-media-preview] .dsh-mp-hint{font-size:12px;opacity:.7;margin:0}',
      '[data-media-preview] .dsh-mp-actions{display:flex;gap:8px;flex:none;align-items:center;justify-content:center;padding:2px 4px 12px}',
      '[data-media-preview] .dsh-mp-button{appearance:none;border:0;border-radius:8px;padding:6px 12px;font:inherit;font-size:12px;cursor:pointer;color:var(--dsw-alias-label-primary,#1f2329);background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.08))}',
      '[data-media-preview] .dsh-mp-button:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.14))}',
    ].join("\n");

    function installStyle() {
      if (typeof document === "undefined") return;
      const tagId = "dsh-media-preview/media.css";
      if (document.querySelector('style[data-plugin-css="' + tagId + '"]') !== null) return;
      const tag = document.createElement("style");
      tag.dataset.plugin = "dsh-media-preview";
      tag.dataset.pluginCss = tagId;
      tag.textContent = STYLE;
      document.head.appendChild(tag);
    }

    /** Decoded final path segment. */
    function basenameOf(path) {
      if (typeof path !== "string") return "";
      const normalized = path.replaceAll("\\", "/");
      return normalized.slice(normalized.lastIndexOf("/") + 1);
    }

    /** Human byte size, or the empty string when unknown. */
    function formatBytes(bytes) {
      if (typeof bytes !== "number" || !Number.isFinite(bytes) || bytes < 0) return "";
      const units = ["B", "KB", "MB", "GB", "TB"];
      let value = bytes;
      let unit = 0;
      while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit += 1;
      }
      const rounded = unit === 0 ? String(Math.round(value)) : value.toFixed(value >= 100 ? 0 : 1);
      return rounded + " " + units[unit];
    }

    /** The stream URL for one absolute path. */
    function streamUrl(routePath, absolutePath) {
      const base = typeof routePath === "string" && routePath !== "" ? routePath : DEFAULT_ROUTE_PATH;
      return base + "?path=" + encodeURIComponent(absolutePath);
    }

    /** Video, or audio, from the suffix the address carries. */
    function mediaKindOf(path) {
      const base = basenameOf(path).toLowerCase();
      const dot = base.lastIndexOf(".");
      const suffix = dot === -1 ? "" : base.slice(dot + 1);
      return MEDIA_AUDIO_EXTENSIONS.includes(suffix) ? "audio" : "video";
    }

    /**
     * Fill `{key}` placeholders.
     * @param template - localized template.
     * @param values - substitution table.
     * @returns the rendered string.
     */
    function fill(template, values) {
      return String(template).replace(/\{(\w+)\}/g, (whole, key) =>
        Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : whole
      );
    }

    /** A musical-note glyph for the audio card. */
    function audioGlyph() {
      return React.createElement(
        "svg",
        { className: "dsh-mp-glyph", viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": "true" },
        React.createElement("path", { d: "M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" })
      );
    }

    /**
     * The media body: one native element fed by the authenticated stream route.
     * @param props - document body props plus the injected route and copy.
     * @returns the player, or why it is not showing.
     */
    function MediaBody(props) {
      const { content, resourceAddress, useResource, t, routePath } = props;
      const kind = mediaKindOf(resourceAddress);
      const meta = useResource(resourceAddress);
      const absolutePath = meta.value && meta.value.absolutePath ? meta.value.absolutePath : undefined;
      const name = basenameOf(absolutePath === undefined ? resourceAddress : absolutePath);
      const version = meta.value && meta.value.version ? meta.value.version : "0";
      const revision = content !== undefined && content.kind === "renderer" ? content.revision : 0;
      const [attempt, setAttempt] = React.useState(0);
      const [state, setState] = React.useState("loading");
      const [reason, setReason] = React.useState("");
      const reported = React.useRef(-1);
      const elementRef = React.useRef(null);

      const settle = React.useCallback(
        (next) => {
          if (reported.current === revision) return;
          reported.current = revision;
          if (content === undefined || content.kind !== "renderer") return;
          if (next === "ready") content.loaded(version);
          if (next === "failed") content.failed();
        },
        [content, revision, version]
      );

      React.useEffect(() => {
        setState("loading");
        setReason("");
      }, [absolutePath, version, attempt]);

      const onRetry = React.useCallback(() => setAttempt((value) => value + 1), []);

      const onFullscreen = React.useCallback(() => {
        const element = elementRef.current;
        if (element === null || typeof element.requestFullscreen !== "function") return;
        element.requestFullscreen().catch(() => {});
      }, []);

      const onPictureInPicture = React.useCallback(() => {
        const element = elementRef.current;
        if (element === null || typeof element.requestPictureInPicture !== "function") return;
        if (document.pictureInPictureElement === element) {
          document.exitPictureInPicture().catch(() => {});
          return;
        }
        element.requestPictureInPicture().catch(() => {});
      }, []);

      if (absolutePath === undefined) {
        const failed = meta.status === "failed";
        return React.createElement(
          "div",
          {
            className: "dsh-mp-status",
            "data-state": failed ? "failed" : "loading",
            "data-media-preview-state": failed ? "failed" : "waiting",
          },
          React.createElement("p", { className: "dsh-mp-hint" }, failed ? t("failed") : t("loading")),
          failed
            ? React.createElement("button", { type: "button", className: "dsh-mp-button", onClick: onRetry }, t("retry"))
            : null
        );
      }

      const url = streamUrl(routePath, absolutePath) + "&v=" + encodeURIComponent(version) + "&a=" + String(attempt);
      const isVideo = kind === "video";

      const element = React.createElement(isVideo ? "video" : "audio", {
        key: url,
        ref: elementRef,
        className: "dsh-mp-player",
        "data-kind": isVideo ? "video" : "audio",
        "data-media-preview-player": true,
        src: url,
        controls: true,
        autoPlay: isVideo,
        playsInline: true,
        preload: "metadata",
        onLoadedMetadata: () => {
          setState("ready");
          settle("ready");
        },
        onCanPlay: () => setState("ready"),
        onError: () => {
          const code = elementRef.current && elementRef.current.error ? elementRef.current.error.code : 0;
          setReason(code === 4 ? t("unsupported") : "");
          setState("failed");
          settle("failed");
        },
      });

      const status =
        state === "loading"
          ? React.createElement("p", { className: "dsh-mp-hint" }, t("loading"))
          : state === "failed"
            ? React.createElement(
                "p",
                { className: "dsh-mp-hint" },
                reason === "" ? t("failed") : fill(t("streamError"), { reason })
              )
            : null;
      const actions = isVideo
        ? React.createElement(
            "div",
            { className: "dsh-mp-actions" },
            React.createElement("button", { type: "button", className: "dsh-mp-button", onClick: onFullscreen }, t("fullscreen")),
            React.createElement("button", { type: "button", className: "dsh-mp-button", onClick: onPictureInPicture }, t("pip"))
          )
        : null;

      const audioCard = isVideo
        ? null
        : React.createElement(
            "div",
            { className: "dsh-mp-audio" },
            audioGlyph(),
            React.createElement("p", { className: "dsh-mp-audio-name" }, name),
            React.createElement(
              "p",
              { className: "dsh-mp-audio-meta" },
              formatBytes(meta.value && meta.value.bytes) === "" ? t("audioOnly") : formatBytes(meta.value.bytes)
            ),
            element
          );

      return React.createElement(
        "div",
        { "data-media-preview": true, "data-media-preview-state": state, "data-media-kind": kind },
        React.createElement(
          "div",
          { className: "dsh-mp-viewport" },
          React.createElement("div", { className: "dsh-mp-stage" }, audioCard, isVideo ? element : null, status)
        ),
        isVideo ? actions : null
      );
    }

    const inject = ["slots", "locale", "resources", "documentPreviews"];

    /** The route the Host half actually registered, as injected at boot. */
    function configuredRoutePath() {
      const config = globalThis.__DSH_MEDIA_PREVIEW_CONFIG__;
      return typeof config === "object" && config !== null && typeof config.routePath === "string"
        ? config.routePath
        : DEFAULT_ROUTE_PATH;
    }

    /**
     * Register the media renderer and its body for the plugin's lifetime.
     * @param ctx - client root context.
     */
    function apply(ctx) {
      installStyle();
      const t = ctx.locale.bind(NS);
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), "media-preview: dictionaries");
      const routePath = configuredRoutePath();
      const bodyInject = () => ({ routePath, t });
      ctx.effect(
        () =>
          ctx.documentPreviews.register({
            id: MEDIA_BODY_ID,
            extensions: MEDIA_VIDEO_EXTENSIONS,
            binaryExtensions: MEDIA_VIDEO_EXTENSIONS,
            priority: "extension",
            title: () => t("video"),
            loading: "renderer",
            wrap: false,
          }),
        "media-preview: metadata"
      );
      ctx.effect(
        () =>
          ctx.documentPreviews.register({
            id: MEDIA_AUDIO_BODY_ID,
            extensions: MEDIA_AUDIO_EXTENSIONS,
            binaryExtensions: MEDIA_AUDIO_EXTENSIONS,
            priority: "extension",
            title: () => t("audio"),
            loading: "renderer",
            wrap: false,
          }),
        "media-preview: audio metadata"
      );
      for (const key of [MEDIA_BODY_ID, MEDIA_AUDIO_BODY_ID]) {
        ctx.effect(
          () =>
            ctx.slots.inject("sidebar.right.tab.document", () =>
              ctx.slots.register(
                {
                  name: "sidebar.right.tab.document",
                  key,
                  locale: NS,
                  inject: bodyInject,
                },
                MediaBody
              )
            ),
          `media-preview: body ${key}`
        );
      }
    }

    exports.apply = apply;
    exports.inject = inject;
    exports.mediaKindOf = mediaKindOf;
    exports.streamUrl = streamUrl;
    return module.exports;
  },
});
