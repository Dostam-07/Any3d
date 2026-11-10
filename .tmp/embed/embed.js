/**
 * Any3d embed loader — one script tag, one scene, no chrome.
 *
 * Usage:
 *   <script src="embed.js" data-src="my-scene.html" data-ratio="4 / 3"
 *           data-title="Corner coffee cart"></script>
 *
 * The scene bundle is a self-contained HTML file, so this loader only has to
 * place an iframe pointing at it with `?embed=1`. That is deliberate: a plain
 * iframe `src` keeps working from `file://` (no fetch, no CORS, no module
 * loading), which is how most people will first try an embed.
 *
 * `prefers-reduced-motion` is forwarded as `?motion=none` so the scene mounts
 * still instead of animating, and the frame is reloaded when the preference
 * changes.
 */
(function () {
  'use strict';

  var reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  function attr(el, name, fallback) {
    var value = el.getAttribute(name);
    return value === null || value === '' ? fallback : value;
  }

  function withEmbed(src, reduced) {
    var url = src + (src.indexOf('?') === -1 ? '?' : '&') + 'embed=1';
    if (reduced) url += '&motion=none';
    return url;
  }

  function build(script) {
    var src = script.getAttribute('data-src');
    if (!src) {
      if (window.console) console.warn('[any3d] embed needs data-src pointing at the scene bundle');
      return null;
    }

    var wrap = document.createElement('div');
    wrap.className = 'any3d-embed';
    wrap.style.cssText =
      'position:relative;width:100%;max-width:100%;' +
      'aspect-ratio:' + attr(script, 'data-ratio', '4 / 3') + ';' +
      'border-radius:' + attr(script, 'data-radius', '14px') + ';' +
      'overflow:hidden;background:' + attr(script, 'data-bg', '#0c0e17') + ';';

    var frame = document.createElement('iframe');
    frame.title = attr(script, 'data-title', 'Any3d scene');
    frame.loading = 'lazy';
    frame.setAttribute('allow', 'fullscreen');
    frame.setAttribute('scrolling', 'no');
    frame.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;border:0;display:block;background:transparent;';

    var reduced = !!(reduce && reduce.matches);
    frame.src = withEmbed(src, reduced);

    wrap.appendChild(frame);
    script.parentNode.insertBefore(wrap, script.nextSibling);

    // A live preference change reloads the frame once, so the scene stops moving.
    if (reduce && reduce.addEventListener) {
      var onChange = function (event) {
        frame.src = withEmbed(src, event.matches);
      };
      if (reduce.addEventListener) reduce.addEventListener('change', onChange);
    }

    return wrap;
  }

  function start() {
    var scripts = document.querySelectorAll('script[data-src]');
    for (var i = 0; i < scripts.length; i++) {
      var el = scripts[i];
      if (el.getAttribute('data-any3d') === 'mounted') continue;
      if (el.getAttribute('type') && el.getAttribute('type') !== 'text/javascript') continue;
      if (build(el)) el.setAttribute('data-any3d', 'mounted');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
