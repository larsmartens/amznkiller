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

  function isKeepaApi(url) {
    if (typeof url !== 'string') return false;
    // Match Keepa API calls: api.keepa.com, or any URL with /api/ or product data
    return url.indexOf('api.keepa.com') !== -1 ||
      url.indexOf('/product') !== -1 ||
      url.indexOf('/api/') !== -1 ||
      url.indexOf('keepa.com/api') !== -1 ||
      (url.indexOf('keepa.com') !== -1 && url.indexOf('.js') === -1 && url.indexOf('.css') === -1 && url.indexOf('.png') === -1);
  }

  // Monkey-patch XMLHttpRequest
  var origOpen = XMLHttpRequest.prototype.open;
  var origSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url) {
    this.__amzk_url = url;
    return origOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function () {
    var xhr = this;
    if (isKeepaApi(xhr.__amzk_url)) {
      var origHandler = xhr.onreadystatechange;
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
          try {
            var text = xhr.responseText;
            if (text && text.length > 100 && text.indexOf('"csv"') !== -1) {
              deliver(text);
            }
          } catch (e) {}
        }
        if (origHandler) origHandler.apply(this, arguments);
      };
      xhr.addEventListener('load', function () {
        if (xhr.status === 200) {
          try {
            var text = xhr.responseText;
            if (text && text.length > 100 && text.indexOf('"csv"') !== -1) {
              deliver(text);
            }
          } catch (e) {}
        }
      });
    }
    return origSend.apply(this, arguments);
  };

  // Monkey-patch fetch
  var origFetch = window.fetch;
  if (origFetch) {
    window.fetch = function (input, init) {
      var url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
      var promise = origFetch.apply(this, arguments);
      if (isKeepaApi(url)) {
        promise.then(function (response) {
          var clone = response.clone();
          clone.text().then(function (text) {
            if (text && text.length > 100 && text.indexOf('"csv"') !== -1) {
              deliver(text);
            }
          }).catch(function () {});
        }).catch(function () {});
      }
      return promise;
    };
  }
})();
