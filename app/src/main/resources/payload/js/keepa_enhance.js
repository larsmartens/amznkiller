(function () {
  'use strict';
  if (window.__amznkiller_enhance) return;
  window.__amznkiller_enhance = true;

  var dark = window.__amznkiller_dark !== false;

  // ---- CSS Injection ----
  var style = document.createElement('style');
  style.textContent = [
    dark ? 'body, html { background: #1a1a2e !important; color: #e0e0e0 !important; }' : '',

    '#topMenu, .footerContainer, #ad_div, .adsbygoogle, ' +
    '[id*="banner"], #topBar, .navBar, #navContainer, ' +
    '#headerContainer, .announcement, [id*="cookie"], ' +
    '[class*="cookie"], #productInfoBox, #buyBoxSection, ' +
    '#offersSection, #productDescription, [class*="footer"], ' +
    'iframe:not([src*="keepa"]) { display: none !important; }',

    '[class*="chart"], [id*="chart"] {' +
    '  max-width: 100vw !important; margin: 0 auto !important; }',

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

  // ---- Hide fixed/sticky elements ----
  function hideFixedElements() {
    try {
      var all = document.querySelectorAll('*');
      for (var i = 0; i < all.length; i++) {
        var cs = window.getComputedStyle(all[i]);
        if ((cs.position === 'fixed' || cs.position === 'sticky') &&
          all[i].tagName !== 'CANVAS' && !all[i].querySelector('canvas')) {
          all[i].style.setProperty('display', 'none', 'important');
        }
      }
    } catch (e) {}
  }

  // ---- Canvas outlier clipping ----
  var yPoints = [];
  var clipping = false;
  var clipMin = null;
  var clipMax = null;

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

      // Force chart re-render by dispatching resize
      window.dispatchEvent(new Event('resize'));
      return true;
    }
    return false;
  }

  // ---- Wait for chart canvas, then apply ----
  var attempts = 0;
  var waitInterval = setInterval(function () {
    attempts++;
    var canvas = document.querySelector('canvas');
    if (canvas && canvas.width > 200) {
      clearInterval(waitInterval);
      hideFixedElements();

      // Wait for initial drawing to complete before analyzing outliers
      setTimeout(function () {
        if (enableClipping()) {
          setTimeout(hideFixedElements, 1000);
        }
      }, 2500);
    } else if (attempts >= 60) {
      clearInterval(waitInterval);
    }
  }, 500);

  // Periodic UI cleanup (GWT renders asynchronously)
  var cleanupN = 0;
  var cleanupIv = setInterval(function () {
    cleanupN++;
    hideFixedElements();
    if (cleanupN > 10) clearInterval(cleanupIv);
  }, 2000);
})();
