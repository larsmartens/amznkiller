(function () {
  if (!window.AmznKiller) window.AmznKiller = {};
  if (window.AmznKiller.injectCustomCharts) return;

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

  var RANGE_DAYS = { '14': 14, '30': 30, '90': 90, '365': 365, 'all': 3650 };

  function css(obj) {
    var s = '';
    for (var k in obj) {
      if (obj.hasOwnProperty(k)) s += k + ':' + obj[k] + ' !important;';
    }
    return s;
  }

  window.AmznKiller.injectCustomCharts = function (args) {
    if (document.getElementById('amznkiller-charts')) return null;

    var asin = args.asin;
    var domain = args.domain || window.location.hostname.replace(/^www\./, '');
    var keepaId = args.keepaId || KEEPA_DOMAINS[domain] || 1;
    var camelLocale = args.camelLocale || CAMEL_LOCALES[domain] || 'us';
    var dark = !!(args && args.dark);
    var defaultRange = (args && args.defaultRange) || '90';
    var interactiveEnabled = args && args.interactiveEnabled !== false;

    var currentRange = defaultRange;

    // Theme-matched chart colors for Keepa graph API color params
    // These hex values are passed without the # prefix
    var chartColors;
    if (dark) {
      chartColors = {
        cAmazon: 'FF9900',    // Amazon orange
        cNew: '64B5F6',       // Bright blue
        cUsed: '81C784',      // Green
        cBB: 'FFD54F',        // Buy box gold
        cBackground: '1A1A1A' // Dark background
      };
    } else {
      chartColors = {
        cAmazon: 'E67E22',    // Amazon orange
        cNew: '1976D2',       // Blue
        cUsed: '388E3C',      // Green
        cBB: 'F57F17',        // Buy box amber
        cBackground: 'FAFAFA' // Light background
      };
    }

    // Data line toggles
    var dataLines = {
      amazon: { enabled: true, label: 'Amazon' },
      new: { enabled: true, label: 'New' },
      used: { enabled: true, label: 'Used' },
      bb: { enabled: true, label: 'Buy Box' },
      salesrank: { enabled: false, label: 'Sales Rank' },
      fba: { enabled: false, label: 'FBA' }
    };

    var borderColor = dark ? '#333' : '#ddd';
    var bgColor = dark ? '#1a1a1a' : '#fafafa';
    var titleColor = dark ? '#e0e0e0' : '#333';
    var labelColor = dark ? '#999' : '#666';
    var btnBg = dark ? '#333' : '#e8e8e8';
    var btnActiveBg = dark ? '#555' : '#1a73e8';
    var btnColor = dark ? '#ccc' : '#555';
    var btnActiveColor = '#fff';
    var toggleOnBg = dark ? '#2E7D32' : '#4CAF50';
    var toggleOffBg = dark ? '#444' : '#ccc';

    function buildKeepaUrl(range) {
      var rd = RANGE_DAYS[range] !== undefined ? RANGE_DAYS[range] : 3650;
      var url = 'https://graph.keepa.com/pricehistory.png?domain=' + keepaId +
        '&asin=' + asin +
        '&amazon=' + (dataLines.amazon.enabled ? 1 : 0) +
        '&new=' + (dataLines.new.enabled ? 1 : 0) +
        '&used=' + (dataLines.used.enabled ? 1 : 0) +
        '&bb=' + (dataLines.bb.enabled ? 1 : 0) +
        '&salesrank=' + (dataLines.salesrank.enabled ? 1 : 0) +
        '&fba=' + (dataLines.fba.enabled ? 1 : 0) +
        '&w=1000&h=500' +
        '&cAmazon=' + chartColors.cAmazon +
        '&cNew=' + chartColors.cNew +
        '&cUsed=' + chartColors.cUsed +
        '&cBuyBox=' + chartColors.cBB +
        '&cBackground=' + chartColors.cBackground;
      url += '&range=' + rd;
      return url;
    }

    function buildCamelUrl() {
      return 'https://charts.camelcamelcamel.com/' + camelLocale + '/' + asin +
        '/amazon-new-used.png?force=1&legend=1&tp=all&w=725&h=400';
    }

    // Inject styles
    if (!document.getElementById('amznkiller-custom-charts-style')) {
      var styleEl = document.createElement('style');
      styleEl.id = 'amznkiller-custom-charts-style';
      styleEl.textContent = [
        '@keyframes amzk-cspin{to{transform:translate(-50%,-50%) rotate(360deg)}}',
        '#amznkiller-charts *{box-sizing:border-box !important}',
        '#amznkiller-charts span[data-btn]{-webkit-appearance:none !important;appearance:none !important;margin:0 !important;line-height:normal !important;min-width:0 !important;min-height:0 !important}'
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

    var shareBtn = document.createElement('span');
    shareBtn.textContent = 'Share';
    shareBtn.style.cssText = css({
      background: btnBg, border: 'none', 'border-radius': '4px',
      padding: '4px 10px', 'font-size': '12px', color: btnColor,
      cursor: 'pointer', display: 'inline-block'
    });
    shareBtn.onclick = function (e) {
      e.preventDefault(); e.stopPropagation();
      try {
        if (typeof AmznKillerBridge !== 'undefined') {
          AmznKillerBridge.shareProduct(window.location.href, document.title || 'Amazon Product');
        }
      } catch (err) { /* bridge unavailable */ }
    };
    headerRow.appendChild(shareBtn);
    c.appendChild(headerRow);

    // Range controls row
    var controls = document.createElement('div');
    controls.style.cssText = css({
      display: 'flex', 'flex-direction': 'row', 'align-items': 'center',
      'justify-content': 'space-between', 'margin-bottom': '8px',
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
          btn.setAttribute('data-btn', '1');
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
      { key: '14', label: '2W' }, { key: '30', label: '1M' },
      { key: '90', label: '3M' }, { key: '365', label: '1Y' },
      { key: 'all', label: 'ALL' }
    ];

    controls.appendChild(makeButtonGroup(rangeItems, currentRange, function (key) {
      currentRange = key;
      updateKeepaImage();
    }));
    c.appendChild(controls);

    // Data line toggles row
    var toggleRow = document.createElement('div');
    toggleRow.style.cssText = css({
      display: 'flex', 'flex-direction': 'row', 'align-items': 'center',
      'margin-bottom': '10px', 'flex-wrap': 'wrap', gap: '8px'
    });

    var toggleKeys = ['amazon', 'new', 'used', 'bb', 'fba', 'salesrank'];
    var toggleColors = {
      amazon: '#' + chartColors.cAmazon,
      new: '#' + chartColors.cNew,
      used: '#' + chartColors.cUsed,
      bb: '#' + chartColors.cBB,
      fba: dark ? '#CE93D8' : '#7B1FA2',
      salesrank: dark ? '#90A4AE' : '#546E7A'
    };

    for (var ti = 0; ti < toggleKeys.length; ti++) {
      (function (key) {
        var line = dataLines[key];
        var dot = document.createElement('span');
        dot.style.cssText = css({
          width: '8px', height: '8px', 'border-radius': '50%',
          background: toggleColors[key], display: 'inline-block',
          'margin-right': '3px', 'vertical-align': 'middle',
          opacity: line.enabled ? '1' : '0.3'
        });

        var label = document.createElement('span');
        label.textContent = line.label;
        label.style.cssText = css({
          'font-size': '11px', color: line.enabled ? labelColor : (dark ? '#555' : '#bbb'),
          cursor: 'pointer', 'user-select': 'none', '-webkit-user-select': 'none',
          'vertical-align': 'middle',
          'text-decoration': line.enabled ? 'none' : 'line-through'
        });

        var toggle = document.createElement('span');
        toggle.style.cssText = css({
          display: 'inline-flex', 'align-items': 'center', cursor: 'pointer'
        });
        toggle.appendChild(dot);
        toggle.appendChild(label);

        toggle.onclick = function (e) {
          e.preventDefault(); e.stopPropagation();
          line.enabled = !line.enabled;
          dot.style.setProperty('opacity', line.enabled ? '1' : '0.3', 'important');
          label.style.setProperty('color', line.enabled ? labelColor : (dark ? '#555' : '#bbb'), 'important');
          label.style.setProperty('text-decoration', line.enabled ? 'none' : 'line-through', 'important');
          updateKeepaImage();
        };
        toggleRow.appendChild(toggle);
      })(toggleKeys[ti]);
    }
    c.appendChild(toggleRow);

    // Keepa chart image
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
      animation: 'amzk-cspin 0.8s linear infinite', display: 'none'
    });
    keepaWrap.appendChild(spinner);

    var keepaLabel = document.createElement('div');
    keepaLabel.style.cssText = css({
      'font-size': '12px', color: labelColor, 'margin-bottom': '4px'
    });
    keepaLabel.textContent = 'Keepa';

    var keepaImg = document.createElement('img');
    keepaImg.src = buildKeepaUrl(currentRange);
    keepaImg.style.cssText = css({
      width: '100%', height: 'auto', 'border-radius': '4px',
      transition: 'opacity 0.3s ease', display: 'block'
    });
    keepaImg.alt = 'Keepa chart for ' + asin;
    keepaImg.onerror = function () { keepaWrap.style.display = 'none'; };

    keepaWrap.appendChild(keepaLabel);
    keepaWrap.appendChild(keepaImg);
    c.appendChild(keepaWrap);

    function updateKeepaImage() {
      var newUrl = buildKeepaUrl(currentRange);
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
      display: 'block'
    });
    if (dark) {
      camelImg.style.setProperty('filter', 'invert(1) hue-rotate(180deg) saturate(2) brightness(0.9)', 'important');
    }
    camelImg.alt = 'CamelCamelCamel chart for ' + asin;
    camelImg.onerror = function () { camelWrap.style.display = 'none'; };

    camelLink.appendChild(camelImg);
    camelWrap.appendChild(camelLabel);
    camelWrap.appendChild(camelLink);
    c.appendChild(camelWrap);

    // Interactive chart button
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
