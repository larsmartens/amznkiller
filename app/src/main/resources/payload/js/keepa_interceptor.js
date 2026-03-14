(function () {
  if (window.__amznkiller_interceptor) return;
  window.__amznkiller_interceptor = true;

  var delivered = false;

  function deliver(data) {
    if (delivered) return;
    delivered = true;
    try {
      if (typeof AmznKillerBridge !== 'undefined' && AmznKillerBridge.onKeepaData) {
        AmznKillerBridge.onKeepaData(data);
      }
    } catch (e) { /* bridge unavailable */ }
  }

  function hasProductData(text) {
    return text && text.length > 200 &&
      (text.indexOf('"csv"') !== -1 || text.indexOf('"products"') !== -1);
  }

  function tryDecompress(buf, encoding) {
    return new Response(
      new Blob([buf]).stream().pipeThrough(new DecompressionStream(encoding))
    ).text();
  }

  function handleBinary(buf) {
    tryDecompress(buf, 'deflate').then(function (text) {
      if (hasProductData(text)) deliver(text);
    }).catch(function () {
      tryDecompress(buf, 'deflate-raw').then(function (text) {
        if (hasProductData(text)) deliver(text);
      }).catch(function () {
        new Blob([buf]).text().then(function (text) {
          if (hasProductData(text)) deliver(text);
        }).catch(function () {});
      });
    });
  }

  // 1. Hook WebSocket — Keepa uses wss://push.keepa.com for data delivery
  var OrigWS = window.WebSocket;
  window.WebSocket = function (url, protocols) {
    var ws = protocols ? new OrigWS(url, protocols) : new OrigWS(url);

    ws.addEventListener('message', function (evt) {
      if (delivered) return;
      try {
        var data = evt.data;
        if (typeof data === 'string') {
          if (hasProductData(data)) deliver(data);
        } else if (data instanceof Blob) {
          data.arrayBuffer().then(handleBinary).catch(function () {});
        } else if (data instanceof ArrayBuffer) {
          handleBinary(data);
        }
      } catch (e) {}
    });

    return ws;
  };
  window.WebSocket.CONNECTING = OrigWS.CONNECTING;
  window.WebSocket.OPEN = OrigWS.OPEN;
  window.WebSocket.CLOSING = OrigWS.CLOSING;
  window.WebSocket.CLOSED = OrigWS.CLOSED;
  window.WebSocket.prototype = OrigWS.prototype;

  // 2. Hook XMLHttpRequest
  var origOpen = XMLHttpRequest.prototype.open;
  var origSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url) {
    this.__amzk_url = url;
    return origOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function () {
    var xhr = this;
    if (xhr.__amzk_url && xhr.__amzk_url.indexOf('keepa') !== -1) {
      xhr.addEventListener('load', function () {
        if (xhr.status === 200 && !delivered) {
          try {
            if (hasProductData(xhr.responseText)) deliver(xhr.responseText);
          } catch (e) {}
        }
      });
    }
    return origSend.apply(this, arguments);
  };

  // 3. Hook fetch
  var origFetch = window.fetch;
  if (origFetch) {
    window.fetch = function (input, init) {
      var url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
      var promise = origFetch.apply(this, arguments);
      if (url.indexOf('keepa') !== -1) {
        promise.then(function (response) {
          if (!delivered) {
            response.clone().text().then(function (text) {
              if (hasProductData(text)) deliver(text);
            }).catch(function () {});
          }
        }).catch(function () {});
      }
      return promise;
    };
  }

  // 4. Periodic scan for product data in global JS variables
  var scanCount = 0;
  var scanInterval = setInterval(function () {
    scanCount++;
    if (scanCount > 40 || delivered) {
      clearInterval(scanInterval);
      return;
    }
    try {
      var keys = Object.keys(window);
      for (var i = 0; i < keys.length; i++) {
        try {
          var val = window[keys[i]];
          if (val && typeof val === 'object' && !Array.isArray(val)) {
            if (val.csv && Array.isArray(val.csv)) {
              deliver(JSON.stringify({ products: [val] }));
              return;
            }
            if (val.products && Array.isArray(val.products) &&
              val.products[0] && val.products[0].csv) {
              deliver(JSON.stringify(val));
              return;
            }
          }
        } catch (e) {} // some properties may throw on access
      }
    } catch (e) {}
  }, 1000);
})();
