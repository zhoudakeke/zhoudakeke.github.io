(function bootstrapPlatformMetrics() {
  "use strict";

  const DESIGN_WIDTH_RPX = 750;
  const DEFAULT_PRESET = "standard";
  const MOBILE_STAGE_BREAKPOINT = 840;

  const PRESETS = Object.freeze({
    compact: Object.freeze({
      label: "小屏 · 320 × 568",
      windowWidth: 320,
      windowHeight: 568,
      statusBarHeight: 24,
      safeAreaInsets: { top: 24, right: 0, bottom: 0, left: 0 },
      menuButton: { top: 30, width: 87, height: 32, rightInset: 7 }
    }),
    standard: Object.freeze({
      label: "标准 · 375 × 812",
      windowWidth: 375,
      windowHeight: 812,
      statusBarHeight: 32,
      safeAreaInsets: { top: 32, right: 0, bottom: 0, left: 0 },
      menuButton: { top: 42, width: 88, height: 32, rightInset: 7 }
    }),
    modern: Object.freeze({
      label: "全面屏 · 390 × 844",
      windowWidth: 390,
      windowHeight: 844,
      statusBarHeight: 47,
      safeAreaInsets: { top: 47, right: 0, bottom: 34, left: 0 },
      menuButton: { top: 55, width: 87, height: 32, rightInset: 7 }
    }),
    large: Object.freeze({
      label: "大屏 · 430 × 932",
      windowWidth: 430,
      windowHeight: 932,
      statusBarHeight: 47,
      safeAreaInsets: { top: 47, right: 0, bottom: 34, left: 0 },
      menuButton: { top: 55, width: 87, height: 32, rightInset: 8 }
    })
  });

  const DESIGN_TOKENS_RPX = Object.freeze({
    "--td-radius-small": 8,
    "--td-radius-default": 16,
    "--td-radius-large": 24,
    "--td-radius-extra-large": 32,
    "--td-spacer": 8,
    "--td-spacer-1": 16,
    "--td-spacer-2": 24,
    "--td-spacer-3": 32,
    "--td-spacer-4": 48,
    "--td-spacer-5": 64,
    "--space-2xs": 8,
    "--space-xs": 16,
    "--space-sm": 24,
    "--space-md": 32,
    "--space-lg": 48,
    "--space-xl": 64,
    "--space-2xl": 96,
    "--page-gutter": 32,
    "--platform-touch-target": 88,
    "--platform-tab-base-height": 112,
    "--platform-tab-protrusion": 44
  });

  const params = new URLSearchParams(window.location.search);
  const requestedPreset = params.get("device");
  const keepDeviceFrame = document.documentElement.hasAttribute("data-frame-preview");

  function nearestPreset(width) {
    return Object.entries(PRESETS).reduce((nearest, entry) => {
      const distance = Math.abs(entry[1].windowWidth - width);
      return distance < nearest.distance ? { key: entry[0], value: entry[1], distance } : nearest;
    }, { key: DEFAULT_PRESET, value: PRESETS[DEFAULT_PRESET], distance: Infinity });
  }

  function normalizeMetrics(key, source, dimensions) {
    const windowWidth = dimensions?.windowWidth ?? source.windowWidth;
    const windowHeight = dimensions?.windowHeight ?? source.windowHeight;
    const rpxUnit = windowWidth / DESIGN_WIDTH_RPX;
    const menuLeft = windowWidth - source.menuButton.rightInset - source.menuButton.width;
    const menuBottom = source.menuButton.top + source.menuButton.height;
    const menuGap = Math.max(4, source.menuButton.top - source.statusBarHeight);
    const navigationHeight = Math.max(44, menuBottom - source.statusBarHeight + menuGap);

    return Object.freeze({
      source: key === "viewport" ? "html-viewport-simulation" : "html-device-preset",
      preset: key,
      label: key === "viewport" ? `当前视口 · ${windowWidth} × ${windowHeight}` : source.label,
      designWidthRpx: DESIGN_WIDTH_RPX,
      rpxUnit,
      windowWidth,
      windowHeight,
      statusBarHeight: source.statusBarHeight,
      navigationHeight,
      menuRect: Object.freeze({
        top: source.menuButton.top,
        right: windowWidth - source.menuButton.rightInset,
        bottom: menuBottom,
        left: menuLeft,
        width: source.menuButton.width,
        height: source.menuButton.height
      }),
      safeArea: Object.freeze({
        top: source.safeAreaInsets.top,
        right: windowWidth - source.safeAreaInsets.right,
        bottom: windowHeight - source.safeAreaInsets.bottom,
        left: source.safeAreaInsets.left,
        width: windowWidth - source.safeAreaInsets.left - source.safeAreaInsets.right,
        height: windowHeight - source.safeAreaInsets.top - source.safeAreaInsets.bottom
      }),
      safeAreaInsets: Object.freeze({ ...source.safeAreaInsets })
    });
  }

  function resolveMetrics() {
    if (requestedPreset && PRESETS[requestedPreset]) {
      return normalizeMetrics(requestedPreset, PRESETS[requestedPreset]);
    }
    if (!keepDeviceFrame && window.innerWidth <= MOBILE_STAGE_BREAKPOINT) {
      const viewportWidth = Math.max(320, Math.round(window.visualViewport?.width || window.innerWidth));
      const viewportHeight = Math.max(568, Math.round(window.visualViewport?.height || window.innerHeight));
      const nearest = nearestPreset(viewportWidth);
      return normalizeMetrics("viewport", nearest.value, {
        windowWidth: viewportWidth,
        windowHeight: viewportHeight
      });
    }
    return normalizeMetrics(DEFAULT_PRESET, PRESETS[DEFAULT_PRESET]);
  }

  function px(value) {
    return `${Number(value.toFixed(4))}px`;
  }

  function applyMetrics(metrics) {
    const root = document.documentElement;
    const style = root.style;
    const framePadding = metrics.preset === "viewport" ? 0 : 8;
    const tabBaseHeight = DESIGN_TOKENS_RPX["--platform-tab-base-height"] * metrics.rpxUnit;
    const tabProtrusion = DESIGN_TOKENS_RPX["--platform-tab-protrusion"] * metrics.rpxUnit;
    const touchTarget = DESIGN_TOKENS_RPX["--platform-touch-target"] * metrics.rpxUnit;
    const homeNavigationHeight = Math.max(metrics.navigationHeight, 128 * metrics.rpxUnit);
    const homeHeroContentHeight = Math.min(160, Math.max(140, metrics.windowHeight * 0.18));

    root.dataset.platform = "wechat-mini-program-prototype";
    root.dataset.devicePreset = metrics.preset;
    root.dataset.metricsSource = metrics.source;

    style.setProperty("--device-width", px(metrics.windowWidth));
    style.setProperty("--device-height", px(metrics.windowHeight));
    style.setProperty("--device-frame-width", px(metrics.windowWidth + framePadding * 2));
    style.setProperty("--device-frame-height", px(metrics.windowHeight + framePadding * 2));
    style.setProperty("--device-frame-padding", px(framePadding));
    style.setProperty("--platform-rpx-unit", px(metrics.rpxUnit));
    style.setProperty("--platform-status-bar-height", px(metrics.statusBarHeight));
    style.setProperty("--platform-navigation-height", px(metrics.navigationHeight));
    style.setProperty("--platform-home-navigation-height", px(homeNavigationHeight));
    style.setProperty("--platform-home-hero-content-height", px(homeHeroContentHeight));
    style.setProperty("--platform-menu-offset-top", px(metrics.menuRect.top - metrics.statusBarHeight));
    style.setProperty("--platform-menu-width", px(metrics.menuRect.width));
    style.setProperty("--platform-menu-height", px(metrics.menuRect.height));
    style.setProperty("--platform-menu-right-inset", px(metrics.windowWidth - metrics.menuRect.right));
    style.setProperty("--platform-safe-top", px(metrics.safeAreaInsets.top));
    style.setProperty("--platform-safe-right", px(metrics.safeAreaInsets.right));
    style.setProperty("--platform-safe-bottom", px(metrics.safeAreaInsets.bottom));
    style.setProperty("--platform-safe-left", px(metrics.safeAreaInsets.left));
    style.setProperty("--platform-status-padding-bottom", px(12 * metrics.rpxUnit));
    style.setProperty("--platform-tab-base-height", px(tabBaseHeight));
    style.setProperty("--platform-tab-total-height", px(tabBaseHeight + metrics.safeAreaInsets.bottom));
    style.setProperty("--platform-tab-protrusion", px(Math.max(20, tabProtrusion)));
    style.setProperty("--platform-touch-target", px(Math.max(44, touchTarget)));
    style.setProperty("--platform-support-gap", px(24 * metrics.rpxUnit));
    style.setProperty("--platform-support-width", px(Math.max(78, 164 * metrics.rpxUnit)));
    style.setProperty("--platform-support-height", px(Math.max(44, 88 * metrics.rpxUnit)));
    style.setProperty("--platform-support-peek", px(Math.max(24, 48 * metrics.rpxUnit)));
    style.setProperty("--platform-create-dock-height", px(168 * metrics.rpxUnit));

    const designTokenTargets = [
      document.querySelector("#device"),
      document.querySelector("#bottom-sheet")
    ].filter(Boolean);
    designTokenTargets.forEach(target => {
      Object.entries(DESIGN_TOKENS_RPX).forEach(([name, value]) => {
        if (name.startsWith("--platform-")) return;
        target.style.setProperty(name, px(value * metrics.rpxUnit));
      });
    });

    window.ShilvpaiPlatform.metrics = metrics;
    window.dispatchEvent(new CustomEvent("shilvpai:platformchange", { detail: metrics }));
  }

  function updateDeviceQuery(value) {
    const nextUrl = new URL(window.location.href);
    if (value === "auto") nextUrl.searchParams.delete("device");
    else nextUrl.searchParams.set("device", value);
    window.location.assign(nextUrl);
  }

  function bindPresetControl() {
    const select = document.querySelector("#device-preset");
    if (!select) return;
    select.value = requestedPreset && PRESETS[requestedPreset] ? requestedPreset : "auto";
    select.addEventListener("change", event => updateDeviceQuery(event.target.value));
  }

  let resizeFrame;
  function handleResize() {
    if (requestedPreset) return;
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => applyMetrics(resolveMetrics()));
  }

  window.ShilvpaiPlatform = {
    designWidthRpx: DESIGN_WIDTH_RPX,
    presets: PRESETS,
    metrics: null,
    resolveMetrics,
    applyMetrics,
    toPx(rpxValue) {
      return rpxValue * (window.ShilvpaiPlatform.metrics?.rpxUnit || 0.5);
    }
  };

  applyMetrics(resolveMetrics());
  bindPresetControl();
  window.addEventListener("resize", handleResize, { passive: true });
  window.visualViewport?.addEventListener("resize", handleResize, { passive: true });
})();
