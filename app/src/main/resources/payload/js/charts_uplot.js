(function () {
  if (!window.AmznKiller) window.AmznKiller = {};
  if (window.AmznKiller.injectUplotChart) return;

  // Keepa uses minutes since 2011-01-01 00:00 UTC
  var KEEPA_EPOCH = 1293840000;

  function keepaMinToUnix(min) {
    return KEEPA_EPOCH + min * 60;
  }

  function centsToPrice(cents) {
    if (cents < 0) return null;
    return cents / 100;
  }

  function css(obj) {
    var s = '';
    for (var k in obj) {
      if (obj.hasOwnProperty(k)) s += k + ':' + obj[k] + ' !important;';
    }
    return s;
  }

  // Parse Keepa CSV arrays: [keepaMin, price, keepaMin, price, ...]
  function parseSeries(arr) {
    if (!arr || !arr.length) return [];
    var out = [];
    for (var i = 0; i < arr.length - 1; i += 2) {
      var t = keepaMinToUnix(arr[i]);
      var p = centsToPrice(arr[i + 1]);
      if (p !== null) out.push({ t: t, v: p });
    }
    return out;
  }

  // Merge multiple series into aligned uPlot data
  function alignSeries(seriesMap) {
    var timeSet = {};
    var keys = Object.keys(seriesMap);
    for (var k = 0; k < keys.length; k++) {
      var pts = seriesMap[keys[k]];
      for (var i = 0; i < pts.length; i++) {
        timeSet[pts[i].t] = true;
      }
    }

    var times = Object.keys(timeSet).map(Number).sort(function (a, b) { return a - b; });
    var data = [times];

    for (var s = 0; s < keys.length; s++) {
      var pts = seriesMap[keys[s]];
      var lookup = {};
      for (var i = 0; i < pts.length; i++) lookup[pts[i].t] = pts[i].v;

      var vals = new Array(times.length);
      var last = null;
      for (var j = 0; j < times.length; j++) {
        if (lookup[times[j]] !== undefined) {
          last = lookup[times[j]];
        }
        vals[j] = last;
      }
      data.push(vals);
    }

    return data;
  }

  function filterByRange(data, rangeDays) {
    if (!rangeDays || rangeDays <= 0) return data;
    var now = Math.floor(Date.now() / 1000);
    var cutoff = now - rangeDays * 86400;
    var times = data[0];

    var startIdx = 0;
    for (var i = 0; i < times.length; i++) {
      if (times[i] >= cutoff) { startIdx = i; break; }
    }

    var out = [];
    for (var s = 0; s < data.length; s++) {
      out.push(data[s].slice(startIdx));
    }
    return out;
  }

  window.AmznKiller.injectUplotChart = function (args) {
    if (document.getElementById('amznkiller-charts')) return null;
    if (typeof uPlot === 'undefined') return 'uplot_not_loaded';

    var keepaData = args.keepaData;
    var dark = !!(args && args.dark);
    var defaultRange = (args && args.defaultRange) || 'all';

    // Keepa CSV indices: 0=Amazon, 1=New, 2=Used
    var product = keepaData && keepaData.products && keepaData.products[0];
    if (!product || !product.csv) return 'no_data';

    var amazonPts = parseSeries(product.csv[0]);
    var newPts = parseSeries(product.csv[1]);
    var usedPts = parseSeries(product.csv[2]);

    if (!amazonPts.length && !newPts.length && !usedPts.length) return 'no_price_data';

    var seriesMap = {};
    var seriesLabels = [];
    var seriesColors = [];
    if (amazonPts.length) { seriesMap['amazon'] = amazonPts; seriesLabels.push('Amazon'); seriesColors.push('#FF9900'); }
    if (newPts.length) { seriesMap['new'] = newPts; seriesLabels.push('New'); seriesColors.push('#2196F3'); }
    if (usedPts.length) { seriesMap['used'] = usedPts; seriesLabels.push('Used'); seriesColors.push('#4CAF50'); }

    var fullData = alignSeries(seriesMap);

    var RANGE_DAYS = { '30': 30, '90': 90, '365': 365, 'all': 0 };
    var currentRange = defaultRange;

    var borderColor = dark ? '#333' : '#ddd';
    var bgColor = dark ? '#1a1a1a' : '#fafafa';
    var titleColor = dark ? '#e0e0e0' : '#333';
    var btnBg = dark ? '#333' : '#e8e8e8';
    var btnActiveBg = dark ? '#555' : '#1a73e8';
    var btnColor = dark ? '#ccc' : '#555';
    var btnActiveColor = '#fff';
    var gridColor = dark ? '#333' : '#eee';
    var axisColor = dark ? '#999' : '#666';

    // Container
    var c = document.createElement('div');
    c.id = 'amznkiller-charts';
    c.style.cssText = css({
      margin: '16px 0', padding: '12px', 'border-radius': '8px',
      border: '1px solid ' + borderColor, background: bgColor,
      'font-family': '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif',
      display: 'block', width: '100%'
    });

    // Header
    var header = document.createElement('div');
    header.style.cssText = css({
      display: 'flex', 'align-items': 'center', 'justify-content': 'space-between',
      'margin-bottom': '8px'
    });
    var title = document.createElement('span');
    title.textContent = 'Price History';
    title.style.cssText = css({ 'font-weight': 'bold', 'font-size': '14px', color: titleColor });
    header.appendChild(title);
    c.appendChild(header);

    // Range buttons
    var controls = document.createElement('div');
    controls.style.cssText = css({
      display: 'flex', gap: '4px', 'margin-bottom': '10px'
    });

    var rangeItems = [
      { key: '30', label: '1M' }, { key: '90', label: '3M' },
      { key: '365', label: '1Y' }, { key: 'all', label: 'ALL' }
    ];

    var rangeButtons = {};
    for (var i = 0; i < rangeItems.length; i++) {
      (function (item) {
        var btn = document.createElement('span');
        btn.textContent = item.label;
        var isActive = item.key === currentRange;
        btn.style.cssText = css({
          background: isActive ? btnActiveBg : btnBg,
          color: isActive ? btnActiveColor : btnColor,
          border: 'none', 'border-radius': '4px', padding: '5px 12px',
          'font-size': '11px', 'font-weight': isActive ? '600' : '400',
          cursor: 'pointer', display: 'inline-block', 'user-select': 'none',
          '-webkit-user-select': 'none'
        });
        btn.onclick = function (e) {
          e.preventDefault(); e.stopPropagation();
          currentRange = item.key;
          for (var k in rangeButtons) {
            if (rangeButtons.hasOwnProperty(k)) {
              var a = k === item.key;
              rangeButtons[k].style.setProperty('background', a ? btnActiveBg : btnBg, 'important');
              rangeButtons[k].style.setProperty('color', a ? btnActiveColor : btnColor, 'important');
              rangeButtons[k].style.setProperty('font-weight', a ? '600' : '400', 'important');
            }
          }
          renderChart();
        };
        rangeButtons[item.key] = btn;
        controls.appendChild(btn);
      })(rangeItems[i]);
    }
    c.appendChild(controls);

    // Chart wrapper
    var chartWrap = document.createElement('div');
    chartWrap.style.cssText = css({ width: '100%', 'min-height': '200px' });
    c.appendChild(chartWrap);

    var uplotInstance = null;

    function renderChart() {
      chartWrap.innerHTML = '';
      var rangeDays = RANGE_DAYS[currentRange] || 0;
      var plotData = rangeDays > 0 ? filterByRange(fullData, rangeDays) : fullData;

      if (!plotData[0] || !plotData[0].length) return;

      var width = c.offsetWidth - 24;
      if (width < 200) width = 300;

      var series = [{}];
      for (var s = 0; s < seriesLabels.length; s++) {
        series.push({
          label: seriesLabels[s],
          stroke: seriesColors[s],
          width: 2,
          fill: seriesColors[s] + '15',
          value: function (u, v) { return v == null ? '--' : '$' + v.toFixed(2); }
        });
      }

      var opts = {
        width: width,
        height: 220,
        cursor: { show: true, drag: { x: true, y: false } },
        scales: {
          x: { time: true },
          y: { auto: true }
        },
        axes: [
          {
            stroke: axisColor,
            grid: { stroke: gridColor, width: 1 },
            ticks: { stroke: gridColor, width: 1 }
          },
          {
            stroke: axisColor,
            grid: { stroke: gridColor, width: 1 },
            ticks: { stroke: gridColor, width: 1 },
            values: function (u, vals) {
              return vals.map(function (v) { return '$' + v.toFixed(0); });
            }
          }
        ],
        series: series
      };

      if (uplotInstance) {
        uplotInstance.destroy();
      }
      uplotInstance = new uPlot(opts, plotData, chartWrap);
    }

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
    if (hit) {
      renderChart();
    } else {
      var obs = new MutationObserver(function (_, o) {
        var h = tryInsert();
        if (h) {
          o.disconnect();
          renderChart();
        }
      });
      obs.observe(document.body || document.documentElement, { childList: true, subtree: true });
      setTimeout(function () { obs.disconnect(); }, 10000);
    }

    return null;
  };
})();
