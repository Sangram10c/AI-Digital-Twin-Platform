/**
 * Injected into Swagger UI (development only).
 * Auto-authorizes after login/register and restores JWT after page refresh.
 */
export const SWAGGER_AUTH_PERSIST_SCRIPT = `
(function () {
  var AUTH_KEY = 'JWT';
  var STORAGE_KEY = 'swagger_jwt_access_token';

  function applyToken(token) {
    if (!token || typeof token !== 'string') return;
    try { localStorage.setItem(STORAGE_KEY, token); } catch (_) {}

    var ui = window.ui;
    if (!ui) return;

    try {
      if (typeof ui.preauthorizeApiKey === 'function') {
        ui.preauthorizeApiKey(AUTH_KEY, token);
      }
      if (typeof ui.preauthorizeBearer === 'function') {
        ui.preauthorizeBearer(AUTH_KEY, token);
      }
    } catch (_) {}
  }

  function extractAccessToken(payload) {
    if (!payload || typeof payload !== 'object') return null;
    if (payload.data && payload.data.tokens && payload.data.tokens.accessToken) {
      return payload.data.tokens.accessToken;
    }
    if (payload.tokens && payload.tokens.accessToken) {
      return payload.tokens.accessToken;
    }
    if (payload.accessToken) {
      return payload.accessToken;
    }
    return null;
  }

  function isAuthPath(url) {
    if (!url) return false;
    return url.indexOf('/auth/login') !== -1 || url.indexOf('/auth/register') !== -1;
  }

  function restoreSavedToken() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) applyToken(saved);
    } catch (_) {}
  }

  var originalFetch = window.fetch;
  if (typeof originalFetch === 'function') {
    window.fetch = function () {
      var args = arguments;
      var input = args[0];
      var url = typeof input === 'string' ? input : (input && input.url ? input.url : '');

      return originalFetch.apply(this, args).then(function (response) {
        if (!isAuthPath(url) || !response || !response.clone) {
          return response;
        }

        response.clone().json().then(function (body) {
          var token = extractAccessToken(body);
          if (token) applyToken(token);
        }).catch(function () {});

        return response;
      });
    };
  }

  var attempts = 0;
  var timer = setInterval(function () {
    attempts += 1;
    if (window.ui || attempts > 40) {
      clearInterval(timer);
      restoreSavedToken();
    }
  }, 250);

  window.addEventListener('load', function () {
    setTimeout(restoreSavedToken, 500);
  });
})();
`;
