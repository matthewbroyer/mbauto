/* =====================================================================
   MB Suite v3 · "Install app" card for the Settings / More page. No dependencies.
   1) Put this where the card should appear (Settings or More), once:
        <div data-mb-install data-app-name="Money"
             data-note="Opens in its own window with its own icon. Works offline after the first visit."></div>
   2) Load this file (or inline it) once. If the Settings view is re-rendered by your app, call MBInstall.render() after it renders.
   3) Register the service worker once, at the end of the app's main script:  MBInstall.registerSW('sw.js');
   What the card shows:
     - Chrome / Edge / Android when the browser offers install: an "Install <name>" button (opens the browser's own dialog).
     - iPhone / iPad (no install API): "Tap Share, then Add to Home Screen."
     - Already installed (running as the app): a one-line "Installed on this device" status.
     - Anything else (Firefox, a browser that hasn't offered install yet, file://): nothing; the box stays hidden.
   Never shows a button that does nothing. Needs HTTPS (or localhost) for the install prompt and the service worker.
   ===================================================================== */
(function () {
  var deferred = null;
  function standalone() { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; }
  function ios() { return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
  function esc(s) { return String(s || '').replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var ICON = '<svg class="uic" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M12 7v7M9 11l3 3 3-3M10 18.5h4"/></svg>';
  function render() {
    var boxes = document.querySelectorAll('[data-mb-install]');
    for (var i = 0; i < boxes.length; i++) {
      var box = boxes[i], name = box.getAttribute('data-app-name') || document.documentElement.getAttribute('data-app-short') || 'this app';
      var note = box.getAttribute('data-note') || 'Opens in its own window with its own icon.';
      var html = '';
      if (standalone()) {
        html = '<div class="mb-install is-done" role="status">' + ICON + '<div><b>Installed on this device</b><p>You are using the app version of ' + esc(name) + '.</p></div></div>';
      } else if (deferred) {
        html = '<div class="mb-install">' + ICON + '<div><b>Install ' + esc(name) + '</b><p>' + esc(note) + '</p></div>' +
               '<button type="button" class="btn primary" data-mb-install-btn>Install</button></div>';
      } else if (ios()) {
        html = '<div class="mb-install">' + ICON + '<div><b>Add ' + esc(name) + ' to your Home Screen</b><p>On iPhone or iPad: tap <b>Share</b>, then <b>Add to Home Screen</b>. It opens full screen with its own icon.</p></div></div>';
      }
      box.innerHTML = html;
      box.hidden = !html;
    }
  }
  function install() {
    if (!deferred) return Promise.resolve(false);
    var d = deferred; deferred = null;                // the event can only be used once
    try { d.prompt(); } catch (e) { render(); return Promise.resolve(false); }
    return (d.userChoice || Promise.resolve({})).then(function (c) { render(); return c && c.outcome === 'accepted'; }, function () { render(); return false; });
  }
  function registerSW(url) {
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      return navigator.serviceWorker.register(url || 'sw.js').catch(function () {});
    }
    return Promise.resolve();
  }
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; render(); });
  window.addEventListener('appinstalled', function () { deferred = null; render(); });
  document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-mb-install-btn]'); if (b) install(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render); else render();
  window.MBInstall = { render: render, install: install, registerSW: registerSW, canInstall: function () { return !!deferred; }, isInstalled: standalone };
})();
