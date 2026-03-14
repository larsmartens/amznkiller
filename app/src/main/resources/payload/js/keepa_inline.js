(function () {
  if (!window.AmznKiller) window.AmznKiller = {};
  if (window.AmznKiller.injectKeepaInline) return;

  var KEEPA_DOMAINS = {
    'amazon.com': 1, 'amazon.co.uk': 2, 'amazon.de': 3,
    'amazon.fr': 4, 'amazon.co.jp': 5, 'amazon.ca': 6,
    'amazon.it': 8, 'amazon.es': 9, 'amazon.in': 10,
    'amazon.com.mx': 11, 'amazon.com.br': 12, 'amazon.com.au': 13
  };

  var RANGE_DAYS = { '14': 14, '30': 30, '90': 90, '365': 365, 'all': 3650 };
  var TYPE_PARAMS = {
    'amazon': { amazon: 1, new: 0, used: 0, bb: 0 },
    'new':    { amazon: 0, new: 1, used: 0, bb: 0 },
    'used':   { amazon: 0, new: 0, used: 1, bb: 0 },
    'all':    { amazon: 1, new: 1, used: 1, bb: 1 }
  };

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
    var defaultRange = (args && args.defaultRange) || '90';

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

    function buildUrl(range, type) {
      var tp = TYPE_PARAMS[type] || TYPE_PARAMS['all'];
      var rd = RANGE_DAYS[range] !== undefined ? RANGE_DAYS[range] : 3650;
      var url = 'https://graph.keepa.com/pricehistory.png?domain=' + keepaId +
        '&asin=' + asin + '&amazon=' + tp.amazon + '&new=' + tp.new +
        '&used=' + tp.used + '&bb=' + tp.bb + '&w=1000&h=500';
      url += '&range=' + rd;
      return url;
    }

    // Inject styles
    if (!document.getElementById('amznkiller-keepa-inline-style')) {
      var styleEl = document.createElement('style');
      styleEl.id = 'amznkiller-keepa-inline-style';
      styleEl.textContent = [
        '@keyframes amzk-spin-inline{to{transform:translate(-50%,-50%) rotate(360deg)}}',
        '#amznkiller-keepa-inline *{box-sizing:border-box !important}',
        '#amznkiller-keepa-inline span[data-btn]{-webkit-appearance:none !important;appearance:none !important;margin:0 !important;line-height:normal !important;min-width:0 !important;min-height:0 !important}'
      ].join('\n');
      document.head.appendChild(styleEl);
    }

    // Container
    var c = document.createElement('div');
    c.id = 'amznkiller-keepa-inline';
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
    title.textContent = 'Keepa Price History';
    headerRow.appendChild(title);

    var linkOut = document.createElement('a');
    linkOut.href = 'https://keepa.com/#!product/' + keepaId + '-' + asin;
    linkOut.target = '_blank';
    linkOut.rel = 'noopener';
    linkOut.textContent = 'Open in Keepa';
    linkOut.style.cssText = css({
      'font-size': '12px', color: labelColor, 'text-decoration': 'none'
    });
    headerRow.appendChild(linkOut);
    c.appendChild(headerRow);

    // Controls row
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

    var typeItems = [
      { key: 'amazon', label: 'Amazon' }, { key: 'new', label: 'New' },
      { key: 'used', label: 'Used' }, { key: 'all', label: 'All' }
    ];

    controls.appendChild(makeButtonGroup(rangeItems, currentRange, function (key) {
      currentRange = key;
      updateImage();
    }));

    controls.appendChild(makeButtonGroup(typeItems, currentType, function (key) {
      currentType = key;
      updateImage();
    }));

    c.appendChild(controls);

    // Chart image wrapper
    var imgWrap = document.createElement('div');
    imgWrap.style.cssText = css({
      position: 'relative', 'margin-bottom': '8px', 'min-height': '200px',
      overflow: 'hidden', 'border-radius': '4px'
    });

    var spinner = document.createElement('div');
    spinner.style.cssText = css({
      position: 'absolute', top: '50%', left: '50%',
      transform: 'translate(-50%,-50%)', 'z-index': '2',
      width: '24px', height: '24px', border: '3px solid ' + borderColor,
      'border-top-color': btnActiveBg, 'border-radius': '50%',
      animation: 'amzk-spin-inline 0.8s linear infinite', display: 'none'
    });
    imgWrap.appendChild(spinner);

    var chartImg = document.createElement('img');
    chartImg.src = buildUrl(currentRange, currentType);
    chartImg.style.cssText = css({
      width: '100%', height: 'auto', 'border-radius': '4px',
      filter: darkFilter, transition: 'opacity 0.3s ease', display: 'block'
    });
    chartImg.alt = 'Keepa price history for ' + asin;
    chartImg.onerror = function () {
      imgWrap.style.setProperty('min-height', '0', 'important');
      chartImg.style.display = 'none';
      spinner.style.display = 'none';
    };
    imgWrap.appendChild(chartImg);
    c.appendChild(imgWrap);

    function updateImage() {
      var newUrl = buildUrl(currentRange, currentType);
      spinner.style.setProperty('display', 'block', 'important');
      chartImg.style.setProperty('opacity', '0.4', 'important');
      chartImg.onload = function () {
        chartImg.style.setProperty('opacity', '1', 'important');
        spinner.style.setProperty('display', 'none', 'important');
        chartImg.onload = null;
      };
      chartImg.onerror = function () {
        chartImg.style.setProperty('opacity', '1', 'important');
        spinner.style.setProperty('display', 'none', 'important');
      };
      chartImg.src = newUrl;
    }

    // Interactive chart button
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
