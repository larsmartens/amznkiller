(function () {
  if (!window.AmznKiller) window.AmznKiller = {};
  if (window.AmznKiller.injectKeepaInline) return;

  function css(obj) {
    var s = '';
    for (var k in obj) {
      if (obj.hasOwnProperty(k)) s += k + ':' + obj[k] + ' !important;';
    }
    return s;
  }

  window.AmznKiller.injectKeepaInline = function (args) {
    if (document.getElementById('amznkiller-keepa-inline')) return null;

    var asin = args.asin;
    var keepaId = args.keepaId || 1;
    var dark = !!(args && args.dark);

    var borderColor = dark ? '#333' : '#ddd';
    var bgColor = dark ? '#1a1a1a' : '#fafafa';
    var titleColor = dark ? '#e0e0e0' : '#333';
    var labelColor = dark ? '#999' : '#666';

    // Container
    var c = document.createElement('div');
    c.id = 'amznkiller-keepa-inline';
    c.style.cssText = css({
      margin: '16px 0', padding: '0', 'border-radius': '8px',
      border: '1px solid ' + borderColor, background: bgColor,
      'font-family': '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif',
      display: 'block', width: '100%', overflow: 'hidden'
    });

    // Header
    var header = document.createElement('div');
    header.style.cssText = css({
      display: 'flex', 'align-items': 'center', 'justify-content': 'space-between',
      padding: '10px 12px', 'border-bottom': '1px solid ' + borderColor
    });

    var title = document.createElement('span');
    title.textContent = 'Keepa Price History';
    title.style.cssText = css({
      'font-weight': 'bold', 'font-size': '14px', color: titleColor
    });
    header.appendChild(title);

    var linkOut = document.createElement('a');
    linkOut.href = 'https://keepa.com/#!product/' + keepaId + '-' + asin;
    linkOut.target = '_blank';
    linkOut.rel = 'noopener';
    linkOut.textContent = 'Open in Keepa';
    linkOut.style.cssText = css({
      'font-size': '12px', color: labelColor, 'text-decoration': 'none'
    });
    header.appendChild(linkOut);
    c.appendChild(header);

    // Iframe wrapper with loading indicator
    var iframeWrap = document.createElement('div');
    iframeWrap.style.cssText = css({
      position: 'relative', width: '100%', 'min-height': '400px',
      background: bgColor
    });

    // Loading text
    var loading = document.createElement('div');
    loading.textContent = 'Loading Keepa...';
    loading.style.cssText = css({
      position: 'absolute', top: '50%', left: '50%',
      transform: 'translate(-50%,-50%)', color: labelColor,
      'font-size': '13px'
    });
    iframeWrap.appendChild(loading);

    // Keepa iframe — use the product page URL with iframe-friendly params
    var iframe = document.createElement('iframe');
    iframe.src = 'https://keepa.com/#!product/' + keepaId + '-' + asin;
    iframe.style.cssText = css({
      width: '100%', height: '400px', border: 'none',
      display: 'block', opacity: '0', transition: 'opacity 0.3s ease'
    });
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('referrerpolicy', 'no-referrer');
    iframe.onload = function () {
      loading.style.display = 'none';
      iframe.style.setProperty('opacity', '1', 'important');
    };
    // If iframe fails to load after 15 seconds, show fallback image
    var fallbackTimer = setTimeout(function () {
      if (iframe.style.opacity === '0') {
        loading.textContent = '';
        iframe.style.display = 'none';
        var img = document.createElement('img');
        img.src = 'https://graph.keepa.com/pricehistory.png?domain=' + keepaId +
          '&asin=' + asin + '&amazon=1&new=1&used=1&range=0';
        img.style.cssText = css({
          width: '100%', height: 'auto', display: 'block'
        });
        if (dark) {
          img.style.setProperty('filter', 'invert(1) hue-rotate(180deg) saturate(2) brightness(0.9)', 'important');
        }
        img.alt = 'Keepa price history for ' + asin;
        img.onerror = function () {
          c.style.display = 'none';
        };
        iframeWrap.appendChild(img);
      }
    }, 15000);

    iframe.addEventListener('load', function () {
      clearTimeout(fallbackTimer);
    });

    iframeWrap.appendChild(iframe);
    c.appendChild(iframeWrap);

    // Insert into page (same targets as charts.js)
    var targets = [
      '#buyBoxAccordion', '#corePriceDisplay_desktop_feature_div',
      '#corePrice_feature_div', '#unifiedPrice_feature_div',
      '#mobileapp_buybox_feature_div', '#desktop_buybox', '#buybox',
      '#price_feature_div', '#newAccordionRow', '#productOverview_feature_div',
      '#centerCol', '#mobileapp_accordion_feature_div'
    ];

    function isInsideButton(el) {
      var p = el;
      while (p) {
        if (p.tagName === 'BUTTON') return true;
        p = p.parentElement;
      }
      return false;
    }

    function tryInsert() {
      for (var i = 0; i < targets.length; i++) {
        var el = document.querySelector(targets[i]);
        if (el && el.parentNode && !isInsideButton(el)) {
          el.parentNode.insertBefore(c, el.nextSibling);
          return targets[i];
        }
      }
      return null;
    }

    var hit = tryInsert();
    if (!hit) {
      var obs = new MutationObserver(function (_, o) {
        var h = tryInsert();
        if (h) o.disconnect();
      });
      obs.observe(document.body || document.documentElement, { childList: true, subtree: true });
      setTimeout(function () { obs.disconnect(); }, 10000);
    }

    return null;
  };
})();
