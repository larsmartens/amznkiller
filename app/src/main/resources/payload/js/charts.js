(function () {
  if (!window.AmznKiller) window.AmznKiller = {};
  if (window.AmznKiller.injectCharts) return;

  var KEEPA_DOMAINS = {
    'amazon.com': 1, 'amazon.co.uk': 2, 'amazon.de': 3,
    'amazon.fr': 4, 'amazon.co.jp': 5, 'amazon.ca': 6,
    'amazon.it': 8, 'amazon.es': 9, 'amazon.in': 10,
    'amazon.com.mx': 11, 'amazon.com.br': 12, 'amazon.com.au': 13
  };

  var CAMEL_LOCALES = {
    'amazon.com': 'us', 'amazon.co.uk': 'uk', 'amazon.de': 'de',
    'amazon.fr': 'fr', 'amazon.co.jp': 'jp', 'amazon.ca': 'ca',
    'amazon.it': 'it', 'amazon.es': 'es', 'amazon.com.au': 'au'
  };

  var RANGE_DAYS = { '30': 30, '90': 90, '365': 365, 'all': 0 };
  var TYPE_PARAMS = {
    'amazon': { amazon: 1, new: 0, used: 0 },
    'new':    { amazon: 0, new: 1, used: 0 },
    'used':   { amazon: 0, new: 0, used: 1 },
    'all':    { amazon: 1, new: 1, used: 1 }
  };

  // Build cssText from object, all values get !important to survive Amazon's CSS
  function css(obj) {
    var s = '';
    for (var k in obj) {
      if (obj.hasOwnProperty(k)) s += k + ':' + obj[k] + ' !important;';
    }
    return s;
  }

  window.AmznKiller.injectCharts = function (args) {
    if (document.getElementById('amznkiller-charts')) return null;

    var asin = args.asin;
    var domain = args.domain || window.location.hostname.replace(/^www\./, '');
    var keepaId = args.keepaId || KEEPA_DOMAINS[domain] || 1;
    var camelLocale = args.camelLocale || CAMEL_LOCALES[domain] || 'us';
    var dark = !!(args && args.dark);
    var defaultRange = (args && args.defaultRange) || 'all';
    var interactiveEnabled = args && args.interactiveEnabled !== false;

    var currentRange = defaultRange;
    var currentType = 'all';

    var borderColor = dark ? '#333' : '#ddd';
    var bgColor = dark ? '#1a1a1a' : '#fafafa';
    var titleColor = dark ? '#e0e0e0' : '#333';
    var labelColor = dark ? '#999' : '#666';
    var btnBg = dark ? '#333' : '#e8e8e8';
    var btnActiveBg = dark ? '#555' : '#1a73e8';
    var btnColor = dark ? '#ccc' : '#555';
    var btnActiveColor = '#fff';
    var darkFilter = dark ? 'invert(1) hue-rotate(180deg) saturate(2) brightness(0.9)' : 'none';

    function buildKeepaUrl(range, type) {
      var tp = TYPE_PARAMS[type] || TYPE_PARAMS['all'];
      var rd = RANGE_DAYS[range] !== undefined ? RANGE_DAYS[range] : 0;
      return 'https://graph.keepa.com/pricehistory.png?domain=' + keepaId +
        '&asin=' + asin + '&amazon=' + tp.amazon + '&new=' + tp.new +
        '&used=' + tp.used + '&range=' + rd;
    }

    function buildCamelUrl() {
      return 'https://charts.camelcamelcamel.com/' + camelLocale + '/' + asin +
        '/amazon-new-used.png?force=1&legend=1&tp=all&w=725&h=400';
    }

    // Inject styles scoped under #amznkiller-charts
    if (!document.getElementById('amznkiller-charts-style')) {
      var styleEl = document.createElement('style');
      styleEl.id = 'amznkiller-charts-style';
      styleEl.textContent = [
        '@keyframes amzk-spin{to{transform:translate(-50%,-50%) rotate(360deg)}}',
        '#amznkiller-charts *{box-sizing:border-box !important}',
        '#amznkiller-charts button{-webkit-appearance:none !important;appearance:none !important;margin:0 !important;line-height:normal !important;min-width:0 !important;min-height:0 !important}'
      ].join('\n');
      document.head.appendChild(styleEl);
    }

    // Container
    var c = document.createElement('div');
    c.id = 'amznkiller-charts';
    c.style.cssText = css({
      margin: '16px 0', padding: '12px', 'border-radius': '8px',
      border: '1px solid ' + borderColor, background: bgColor,
      'font-family': '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif',
      display: 'block', width: '100%'
    });

    // Header row
    var headerRow = document.createElement('div');
    headerRow.style.cssText = css({
      display: 'flex', 'flex-direction': 'row', 'align-items': 'center',
      'justify-content': 'space-between', 'margin-bottom': '8px'
    });

    var title = document.createElement('span');
    title.style.cssText = css({
      'font-weight': 'bold', 'font-size': '14px', color: titleColor, display: 'inline'
    });
    title.textContent = 'Price History';
    headerRow.appendChild(title);

    // Share button
    var shareBtn = document.createElement('span');
    shareBtn.textContent = 'Share';
    shareBtn.style.cssText = css({
      background: btnBg, border: 'none', 'border-radius': '4px',
      padding: '4px 10px', 'font-size': '12px', color: btnColor,
      cursor: 'pointer', display: 'inline-block'
    });
    shareBtn.onclick = function (e) {
      e.preventDefault(); e.stopPropagation();
      var productUrl = window.location.href;
      var productTitle = document.title || 'Amazon Product';
      try {
        if (typeof AmznKillerBridge !== 'undefined') {
          AmznKillerBridge.shareProduct(productUrl, productTitle);
        }
      } catch (err) { /* bridge unavailable */ }
    };
    headerRow.appendChild(shareBtn);
    c.appendChild(headerRow);

    // Controls row — use a single row with inline-block spans as buttons
    var controls = document.createElement('div');
    controls.style.cssText = css({
      display: 'flex', 'flex-direction': 'row', 'align-items': 'center',
      'justify-content': 'space-between', 'margin-bottom': '10px',
      'flex-wrap': 'wrap', gap: '6px'
    });

    function makeButtonGroup(items, activeKey, onChange) {
      var group = document.createElement('div');
      group.style.cssText = css({
        display: 'inline-flex', 'flex-direction': 'row', gap: '2px',
        'flex-wrap': 'nowrap'
      });
      var buttons = {};
      for (var i = 0; i < items.length; i++) {
        (function (item) {
          var btn = document.createElement('span');
          btn.textContent = item.label;
          var isActive = item.key === activeKey;
          btn.style.cssText = css({
            background: isActive ? btnActiveBg : btnBg,
            color: isActive ? btnActiveColor : btnColor,
            border: 'none', 'border-radius': '4px', padding: '5px 12px',
            'font-size': '11px', 'font-weight': isActive ? '600' : '400',
            cursor: 'pointer', display: 'inline-block',
            'text-align': 'center', 'white-space': 'nowrap',
            'user-select': 'none', '-webkit-user-select': 'none',
            'line-height': '1.2'
          });
          btn.onclick = function (e) {
            e.preventDefault(); e.stopPropagation();
            onChange(item.key);
            for (var k in buttons) {
              if (buttons.hasOwnProperty(k)) {
                var a = k === item.key;
                buttons[k].style.setProperty('background', a ? btnActiveBg : btnBg, 'important');
                buttons[k].style.setProperty('color', a ? btnActiveColor : btnColor, 'important');
                buttons[k].style.setProperty('font-weight', a ? '600' : '400', 'important');
              }
            }
          };
          buttons[item.key] = btn;
          group.appendChild(btn);
        })(items[i]);
      }
      return group;
    }

    var rangeItems = [
      { key: '30', label: '1M' }, { key: '90', label: '3M' },
      { key: '365', label: '1Y' }, { key: 'all', label: 'ALL' }
    ];

    var typeItems = [
      { key: 'amazon', label: 'Amazon' }, { key: 'new', label: 'New' },
      { key: 'used', label: 'Used' }, { key: 'all', label: 'All' }
    ];

    controls.appendChild(makeButtonGroup(rangeItems, currentRange, function (key) {
      currentRange = key;
      updateKeepaImage();
    }));

    controls.appendChild(makeButtonGroup(typeItems, currentType, function (key) {
      currentType = key;
      updateKeepaImage();
    }));

    c.appendChild(controls);

    // Keepa chart
    var keepaWrap = document.createElement('div');
    keepaWrap.style.cssText = css({
      position: 'relative', 'margin-bottom': '8px', 'min-height': '120px',
      overflow: 'hidden', 'border-radius': '4px'
    });

    var spinner = document.createElement('div');
    spinner.style.cssText = css({
      position: 'absolute', top: '50%', left: '50%',
      transform: 'translate(-50%,-50%)', 'z-index': '2',
      width: '24px', height: '24px', border: '3px solid ' + borderColor,
      'border-top-color': btnActiveBg, 'border-radius': '50%',
      animation: 'amzk-spin 0.8s linear infinite', display: 'none'
    });

    keepaWrap.appendChild(spinner);

    var keepaLabel = document.createElement('div');
    keepaLabel.style.cssText = css({
      'font-size': '12px', color: labelColor, 'margin-bottom': '4px'
    });
    keepaLabel.textContent = 'Keepa';

    var keepaImg = document.createElement('img');
    keepaImg.src = buildKeepaUrl(currentRange, currentType);
    keepaImg.style.cssText = css({
      width: '100%', height: 'auto', 'border-radius': '4px',
      filter: darkFilter, transition: 'opacity 0.3s ease', display: 'block'
    });
    keepaImg.alt = 'Keepa chart for ' + asin;
    keepaImg.onerror = function () { keepaWrap.style.display = 'none'; };

    keepaWrap.appendChild(keepaLabel);
    keepaWrap.appendChild(keepaImg);
    c.appendChild(keepaWrap);

    // Update chart: swap src directly, use img's own onload instead of Image()
    function updateKeepaImage() {
      var newUrl = buildKeepaUrl(currentRange, currentType);
      spinner.style.setProperty('display', 'block', 'important');
      keepaImg.style.setProperty('opacity', '0.4', 'important');
      keepaImg.onload = function () {
        keepaImg.style.setProperty('opacity', '1', 'important');
        spinner.style.setProperty('display', 'none', 'important');
        keepaImg.onload = null;
      };
      keepaImg.onerror = function () {
        keepaImg.style.setProperty('opacity', '1', 'important');
        spinner.style.setProperty('display', 'none', 'important');
      };
      keepaImg.src = newUrl;
    }

    // CamelCamelCamel chart
    var camelWrap = document.createElement('div');
    camelWrap.style.cssText = css({ 'margin-bottom': '8px' });

    var camelLabel = document.createElement('div');
    camelLabel.style.cssText = css({
      'font-size': '12px', color: labelColor, 'margin-bottom': '4px'
    });
    camelLabel.textContent = 'CamelCamelCamel';

    var camelLink = document.createElement('a');
    camelLink.href = 'https://' + (camelLocale === 'us' ? '' : camelLocale + '.') +
      'camelcamelcamel.com/product/' + asin;
    camelLink.target = '_blank';
    camelLink.rel = 'noopener';

    var camelImg = document.createElement('img');
    camelImg.src = buildCamelUrl();
    camelImg.style.cssText = css({
      width: '100%', height: 'auto', 'border-radius': '4px',
      filter: darkFilter, display: 'block'
    });
    camelImg.alt = 'CamelCamelCamel chart for ' + asin;
    camelImg.onerror = function () { camelWrap.style.display = 'none'; };

    camelLink.appendChild(camelImg);
    camelWrap.appendChild(camelLabel);
    camelWrap.appendChild(camelLink);
    c.appendChild(camelWrap);

    // Interactive chart button — fallback to opening URL in browser if bridge missing
    if (interactiveEnabled) {
      var keepaPageUrl = 'https://keepa.com/#!product/' + keepaId + '-' + asin;
      var interactiveBtn = document.createElement('span');
      interactiveBtn.textContent = 'Open Interactive Chart';
      interactiveBtn.style.cssText = css({
        width: '100%', padding: '10px', background: btnActiveBg,
        color: '#fff', border: 'none', 'border-radius': '6px',
        'font-size': '13px', 'font-weight': '600', cursor: 'pointer',
        'margin-top': '4px', display: 'block', 'text-align': 'center',
        'user-select': 'none', '-webkit-user-select': 'none'
      });
      interactiveBtn.onclick = function (e) {
        e.preventDefault(); e.stopPropagation();
        var bridgeOk = false;
        try {
          if (typeof AmznKillerBridge !== 'undefined' && AmznKillerBridge.openInteractiveChart) {
            AmznKillerBridge.openInteractiveChart(asin, keepaId);
            bridgeOk = true;
          }
        } catch (err) { /* bridge call failed */ }
        if (!bridgeOk) {
          window.open(keepaPageUrl, '_blank');
        }
      };
      c.appendChild(interactiveBtn);
    }

    // Insert into page
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
