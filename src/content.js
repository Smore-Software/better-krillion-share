// Bootstraps the share kit: watches the SPA for the daily results screen and
// mounts/updates the panel under the site's "Copy result" button.
(function (root) {
  'use strict';

  const D = root.KrillionData;
  let panel = null;
  let pending = false;

  function tick() {
    pending = false;
    const view = location.pathname === '/' ? D.findDoneView() : null;
    if (!view) {
      if (panel) panel.detach();
      return;
    }
    const dive = D.readDive(view);
    if (!dive) return;
    if (!panel) panel = new root.KrillionPanel();
    panel.mount(view.copyBtn);
    panel.setDive(dive);
  }

  function schedule() {
    if (pending) return;
    pending = true;
    setTimeout(tick, 200);
  }

  // The results view renders client-side and the percentile / tiers arrive
  // asynchronously, so keep re-reading on DOM changes (debounced; setDive is
  // a no-op when nothing relevant changed).
  new MutationObserver(schedule).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['aria-label', 'src', 'width'],
  });
  addEventListener('popstate', schedule);
  schedule();
})(globalThis);
