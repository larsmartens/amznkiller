(function () {
  'use strict';
  if (window.__amznkiller_enhance) return;
  window.__amznkiller_enhance = true;

  var dark = window.__amznkiller_dark !== false;

  // ---- Phase 1: Minimal CSS — only theme the background, don't hide anything yet ----
  var style = document.createElement('style');
  style.textContent = [
    dark ? 'body, html { background: #1a1a2e !important; color: #e0e0e0 !important; }' : '',

    dark ? [
      'button, [role="button"] {',
      '  background: #0f3460 !important;',
      '  color: #e0e0e0 !important;',
      '  border: 1px solid #333 !important;',
      '}',
      'select, input {',
      '  background: #16213e !important;',
      '  color: #e0e0e0 !important;',
      '  border: 1px solid #333 !important;',
      '}'
    ].join('\n') : '',

    '::-webkit-scrollbar { width: 6px; }',
    '::-webkit-scrollbar-track { background: ' + (dark ? '#1a1a2e' : '#f5f5f5') + '; }',
    '::-webkit-scrollbar-thumb { background: ' + (dark ? '#533483' : '#ccc') + '; border-radius: 3px; }'
  ].join('\n');
  (document.head || document.documentElement).appendChild(style);

  // ---- Phase 2: Wait for the chart canvas to render before hiding non-chart elements ----
  var chartRendered = false;

  // Elements to hide — only specific known non-chart elements, NOT class-pattern selectors
  var hideSelectors = [
    '#topMenu', '.footerContainer', '#ad_div', '.adsbygoogle',
    '#topBar', '.navBar', '#navContainer',
    '#headerContainer', '.announcement',
    '#productInfoBox', '#buyBoxSection',
    '#offersSection', '#productDescription'
  ];

  // Hide fixed/sticky elements (menus, banners) but preserve canvas and its parents
  function hideFixedElements() {
    try {
      var all = document.querySelectorAll('*');
      for (var i = 0; i < all.length; i++) {
        var el = all[i];
        var cs = window.getComputedStyle(el);
        if ((cs.position === 'fixed' || cs.position === 'sticky') &&
          el.tagName !== 'CANVAS' &&
          !el.querySelector('canvas') &&
          !el.closest('[class*="chart"]') &&
          !el.closest('[id*="chart"]')) {
          el.style.setProperty('display', 'none', 'important');
        }
      }
    } catch (e) { /* ignore */ }
  }

  function hideNonChartElements() {
    var hideStyle = document.getElementById('amzk-hide-style');
    if (hideStyle) return;
    hideStyle = document.createElement('style');
    hideStyle.id = 'amzk-hide-style';
    hideStyle.textContent = hideSelectors.join(', ') +
      ' { display: none !important; }';
    (document.head || document.documentElement).appendChild(hideStyle);
  }

  // ---- Phase 3: Canvas outlier clipping (opt-in after chart confirmed) ----
  var yPoints = [];
  var clipping = false;
  var clipMin = null;
  var clipMax = null;
  var canvasHookInstalled = false;

  function installCanvasHook() {
    if (canvasHookInstalled) return;
    canvasHookInstalled = true;

    var origGetCtx = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type) {
      var ctx = origGetCtx.apply(this, arguments);
      if (type === '2d' && this.width > 200 && !this.__amzk_hooked) {
        this.__amzk_hooked = true;

        var origLineTo = ctx.lineTo.bind(ctx);
        var origMoveTo = ctx.moveTo.bind(ctx);

        ctx.lineTo = function (x, y) {
          if (!clipping) {
            yPoints.push(y);
          } else if (clipMin !== null) {
            y = Math.max(clipMin, Math.min(clipMax, y));
          }
          return origLineTo(x, y);
        };

        ctx.moveTo = function (x, y) {
          if (!clipping) {
            yPoints.push(y);
          } else if (clipMin !== null) {
            y = Math.max(clipMin, Math.min(clipMax, y));
          }
          return origMoveTo(x, y);
        };
      }
      return ctx;
    };
  }

  function enableClipping() {
    if (yPoints.length < 20) return false;

    var sorted = yPoints.slice().sort(function (a, b) { return a - b; });
    var p3 = sorted[Math.floor(sorted.length * 0.03)];
    var p97 = sorted[Math.floor(sorted.length * 0.97)];
    var pRange = p97 - p3;

    var fullMin = sorted[0];
    var fullMax = sorted[sorted.length - 1];
    var fullRange = fullMax - fullMin;

    // Only clip if outliers compress the main data significantly
    if (fullRange > 0 && pRange < fullRange * 0.7) {
      clipMin = p3 - pRange * 0.15;
      clipMax = p97 + pRange * 0.15;
      clipping = true;
      window.dispatchEvent(new Event('resize'));
      return true;
    }
    return false;
  }

  // ---- Wait for chart canvas to appear, then proceed with enhancements ----
  var attempts = 0;
  var waitInterval = setInterval(function () {
    attempts++;
    var canvas = document.querySelector('canvas');
    if (canvas && canvas.width > 200) {
      clearInterval(waitInterval);
      chartRendered = true;

      // Chart is visible — now safe to hide non-chart elements
      hideNonChartElements();
      hideFixedElements();

      // Install canvas hook for outlier clipping on future re-renders
      installCanvasHook();

      // Wait for initial drawing to complete before analyzing outliers
      setTimeout(function () {
        if (enableClipping()) {
          setTimeout(hideFixedElements, 1000);
        }
      }, 2500);
    } else if (attempts >= 60) {
      // Safety timeout: 30 seconds without a chart canvas
      clearInterval(waitInterval);
      // Still hide non-chart elements even if chart didn't render
      hideNonChartElements();
      hideFixedElements();
    }
  }, 500);

  // Periodic cleanup for GWT async rendering, but only after chart is confirmed
  var cleanupN = 0;
  var cleanupIv = setInterval(function () {
    cleanupN++;
    if (chartRendered) {
      hideFixedElements();
    }
    if (cleanupN > 10) clearInterval(cleanupIv);
  }, 2000);
})();
