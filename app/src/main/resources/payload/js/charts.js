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

  var RANGE_MAP = { '30': '1M', '90': '3M', '365': '1Y', 'all': 'ALL' };
  var RANGE_DAYS = { '30': 30, '90': 90, '365': 365, 'all': 0 };
  var TYPE_PARAMS = {
    'amazon': { amazon: 1, new: 0, used: 0 },
    'new':    { amazon: 0, new: 1, used: 0 },
    'used':   { amazon: 0, new: 0, used: 1 },
    'all':    { amazon: 1, new: 1, used: 1 }
  };

  function css(obj) {
    var s = '';
    for (var k in obj) s += k + ':' + obj[k] + ';';
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

    // Container
    var c = document.createElement('div');
    c.id = 'amznkiller-charts';
    c.style.cssText = css({
      margin: '16px 0', padding: '12px', 'border-radius': '8px',
      border: '1px solid ' + borderColor, background: bgColor,
      'font-family': '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif'
    });

    // Header row
    var headerRow = document.createElement('div');
    headerRow.style.cssText = css({
      display: 'flex', 'align-items': 'center', 'justify-content': 'space-between',
      'margin-bottom': '8px'
    });

    var title = document.createElement('div');
    title.style.cssText = css({
      'font-weight': 'bold', 'font-size': '14px', color: titleColor
    });
    title.textContent = 'Price History';
    headerRow.appendChild(title);

    var headerBtns = document.createElement('div');
    headerBtns.style.cssText = css({ display: 'flex', gap: '6px' });

    // Share button
    var shareBtn = document.createElement('button');
    shareBtn.textContent = 'Share';
    shareBtn.style.cssText = css({
      background: btnBg, border: 'none', 'border-radius': '4px',
      padding: '4px 10px', 'font-size': '12px', color: btnColor, cursor: 'pointer'
    });
    shareBtn.onclick = function () {
      var productUrl = window.location.href;
      var productTitle = document.title || 'Amazon Product';
      if (typeof AmznKillerBridge !== 'undefined' && AmznKillerBridge.shareProduct) {
        AmznKillerBridge.shareProduct(productUrl, productTitle);
      }
    };
    headerBtns.appendChild(shareBtn);
    headerRow.appendChild(headerBtns);
    c.appendChild(headerRow);

    // Controls row
    var controls = document.createElement('div');
    controls.style.cssText = css({
      display: 'flex', 'align-items': 'center', 'justify-content': 'space-between',
      'margin-bottom': '10px', 'flex-wrap': 'wrap', gap: '6px'
    });

    function makeButtonGroup(items, activeKey, onChange) {
      var group = document.createElement('div');
      group.style.cssText = css({ display: 'flex', gap: '2px' });
      var buttons = {};
      items.forEach(function (item) {
        var btn = document.createElement('button');
        btn.textContent = item.label;
        btn.dataset.key = item.key;
        var isActive = item.key === activeKey;
        btn.style.cssText = css({
          background: isActive ? btnActiveBg : btnBg,
          color: isActive ? btnActiveColor : btnColor,
          border: 'none', 'border-radius': '4px', padding: '4px 10px',
          'font-size': '11px', 'font-weight': isActive ? '600' : '400',
          cursor: 'pointer', transition: 'all 0.15s ease'
        });
        btn.onclick = function () {
          onChange(item.key);
          for (var k in buttons) {
            var a = k === item.key;
            buttons[k].style.background = a ? btnActiveBg : btnBg;
            buttons[k].style.color = a ? btnActiveColor : btnColor;
            buttons[k].style.fontWeight = a ? '600' : '400';
          }
        };
        buttons[item.key] = btn;
        group.appendChild(btn);
      });
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
      'touch-action': 'pinch-zoom', overflow: 'hidden', 'border-radius': '4px'
    });

    var spinner = document.createElement('div');
    spinner.style.cssText = css({
      position: 'absolute', top: '50%', left: '50%',
      transform: 'translate(-50%,-50%)',
      width: '24px', height: '24px', border: '3px solid ' + borderColor,
      'border-top-color': btnActiveBg, 'border-radius': '50%',
      animation: 'amzk-spin 0.8s linear infinite', display: 'none'
    });

    // Inject spinner keyframes
    if (!document.getElementById('amznkiller-charts-style')) {
      var styleEl = document.createElement('style');
      styleEl.id = 'amznkiller-charts-style';
      styleEl.textContent = '@keyframes amzk-spin{to{transform:translate(-50%,-50%) rotate(360deg)}}';
      document.head.appendChild(styleEl);
    }

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
      filter: darkFilter, transition: 'opacity 0.3s ease'
    });
    keepaImg.alt = 'Keepa chart for ' + asin;
    keepaImg.onerror = function () { keepaWrap.style.display = 'none'; };

    keepaWrap.appendChild(keepaLabel);
    keepaWrap.appendChild(keepaImg);
    c.appendChild(keepaWrap);

    function updateKeepaImage() {
      var newUrl = buildKeepaUrl(currentRange, currentType);
      spinner.style.display = 'block';
      keepaImg.style.opacity = '0.4';
      var tempImg = new Image();
      tempImg.onload = function () {
        keepaImg.src = newUrl;
        keepaImg.style.opacity = '1';
        spinner.style.display = 'none';
      };
      tempImg.onerror = function () {
        keepaImg.style.opacity = '1';
        spinner.style.display = 'none';
      };
      tempImg.src = newUrl;
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
      width: '100%', height: 'auto', 'border-radius': '4px', filter: darkFilter
    });
    camelImg.alt = 'CamelCamelCamel chart for ' + asin;
    camelImg.onerror = function () { camelWrap.style.display = 'none'; };

    camelLink.appendChild(camelImg);
    camelWrap.appendChild(camelLabel);
    camelWrap.appendChild(camelLink);
    c.appendChild(camelWrap);

    // Interactive chart button
    if (interactiveEnabled) {
      var interactiveBtn = document.createElement('button');
      interactiveBtn.textContent = 'Open Interactive Chart';
      interactiveBtn.style.cssText = css({
        width: '100%', padding: '10px', background: btnActiveBg,
        color: '#fff', border: 'none', 'border-radius': '6px',
        'font-size': '13px', 'font-weight': '600', cursor: 'pointer',
        'margin-top': '4px'
      });
      interactiveBtn.onclick = function () {
        if (typeof AmznKillerBridge !== 'undefined' && AmznKillerBridge.openInteractiveChart) {
          AmznKillerBridge.openInteractiveChart(asin, keepaId);
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
