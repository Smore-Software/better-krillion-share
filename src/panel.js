// The injected "Share kit" panel: options, live text preview, image card.
// Lives in a shadow root so the site's CSS can't touch it (and vice versa);
// fonts and colors are copied from the site so it looks native.
(function (root) {
  'use strict';

  const K = root.KrillionShare;
  const C = root.KrillionCard;
  const STORE_KEY = 'krillionShareKit:options';

  const CHECK_SVG =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 7 6' shape-rendering='crispEdges' fill='%23050a14'%3E%3Crect x='6' y='0' width='1' height='1'/%3E%3Crect x='5' y='1' width='2' height='1'/%3E%3Crect x='0' y='2' width='1' height='1'/%3E%3Crect x='4' y='2' width='2' height='1'/%3E%3Crect x='0' y='3' width='2' height='1'/%3E%3Crect x='3' y='3' width='2' height='1'/%3E%3Crect x='1' y='4' width='3' height='1'/%3E%3Crect x='2' y='5' width='1' height='1'/%3E%3C/svg%3E\")";

  const PIXEL_CLIP =
    'polygon(0 8px,4px 8px,4px 4px,8px 4px,8px 0,calc(100% - 8px) 0,calc(100% - 8px) 4px,calc(100% - 4px) 4px,calc(100% - 4px) 8px,100% 8px,100% calc(100% - 8px),calc(100% - 4px) calc(100% - 8px),calc(100% - 4px) calc(100% - 4px),calc(100% - 8px) calc(100% - 4px),calc(100% - 8px) 100%,8px 100%,8px calc(100% - 4px),4px calc(100% - 4px),4px calc(100% - 8px),0 calc(100% - 8px))';
  const SMALL_CLIP =
    'polygon(0 3px,3px 3px,3px 0,calc(100% - 3px) 0,calc(100% - 3px) 3px,100% 3px,100% calc(100% - 3px),calc(100% - 3px) calc(100% - 3px),calc(100% - 3px) 100%,3px 100%,3px calc(100% - 3px),0 calc(100% - 3px))';

  const CSS = `
:host {
  all: initial;
  display: block;
  --abyss: var(--color-abyss, #050a14);
  --shallow: var(--color-shallow, #101d33);
  --drift: var(--color-drift, #7d93b8);
  --foam: var(--color-foam, #e8f1ff);
  --line: var(--color-line, #1b2c47);
  --cyan: var(--color-lumen-cyan, #4de3ff);
  --pink: var(--color-lumen-pink, #ff5d8f);
  --hair: var(--hairline, #7d93b838);
  font-family: VT323, "VT323 Fallback", ui-monospace, monospace;
  color: var(--foam);
  -webkit-font-smoothing: antialiased;
}
* { box-sizing: border-box; }
.kit {
  position: relative;
  padding: 18px 18px 20px;
  background: linear-gradient(#13223df7, #070d1afa);
  clip-path: ${PIXEL_CLIP};
  box-shadow: inset 0 0 0 2px var(--line);
}
.fathom {
  display: flex; align-items: center; gap: .75rem; margin: 0;
  font-size: 15px; letter-spacing: .14em; text-transform: uppercase;
  color: var(--drift); white-space: nowrap;
}
.fathom::after { content: ""; flex: 1; border-top: 1px dashed var(--hair); }
.fathom .sub { opacity: .5; }
.fathom + * { margin-top: 12px; }
.section + .section { margin-top: 22px; }

.opts { display: grid; gap: 2px; }
.chk {
  display: flex; align-items: center; gap: 12px; padding: 5px 0;
  font-size: 19px; letter-spacing: .1em; text-transform: uppercase;
  color: var(--drift); cursor: pointer; user-select: none; position: relative;
}
.chk input { position: absolute; opacity: 0; width: 1px; height: 1px; margin: 0; }
.box {
  width: 20px; height: 20px; flex: none; position: relative;
  background: #070d1a; box-shadow: inset 0 0 0 2px #3d4f6e;
  clip-path: ${SMALL_CLIP};
  transition: background .12s steps(2, end);
}
.chk:hover .box { box-shadow: inset 0 0 0 2px var(--drift); }
.chk input:checked + .box { background: var(--pink); box-shadow: inset 0 0 0 2px #cf3a6b; }
.chk input:checked + .box::after {
  content: ""; position: absolute; inset: 4px 3px 5px 4px;
  background: ${CHECK_SVG} center / contain no-repeat; image-rendering: pixelated;
}
.chk input:checked ~ .lbl { color: var(--foam); }
.chk input:focus-visible + .box { outline: 2px solid var(--cyan); outline-offset: 2px; }
.chk.off { opacity: .4; cursor: default; }

.fmt {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  margin: 2px 0 4px 10px; padding-left: 22px; position: relative;
  font-size: 16px; letter-spacing: .14em; text-transform: uppercase; color: var(--drift);
}
.fmt::before {
  content: ""; position: absolute; left: 0; top: -6px; width: 12px; height: 18px;
  border-left: 2px solid #3d4f6e; border-bottom: 2px solid #3d4f6e;
}
.fmt.off { opacity: .35; }
.chip {
  font: inherit; font-size: 16px; letter-spacing: .14em; text-transform: uppercase;
  border: none; cursor: pointer; padding: 4px 12px;
  color: var(--drift); background: #0b1526; box-shadow: inset 0 0 0 2px #24365a;
  clip-path: ${SMALL_CLIP};
}
.chip[aria-checked="true"] { color: var(--abyss); background: var(--cyan); box-shadow: inset 0 0 0 2px #2bb3d1; }
.chip:disabled { cursor: default; }
.chip:focus-visible { outline: 2px solid var(--pink); outline-offset: 2px; }

.preview {
  margin: 0; padding: 12px 14px; max-height: 280px; overflow: auto;
  background: #050a14d9; box-shadow: inset 0 0 0 2px var(--line);
  clip-path: ${SMALL_CLIP};
  font-family: inherit; font-size: 18px; line-height: 1.2; color: var(--foam);
  white-space: pre-wrap; word-break: break-word;
}
.preview .spoil { color: var(--cyan); }

.btn {
  font-family: inherit; text-transform: uppercase; border: none; border-radius: 0;
  clip-path: ${PIXEL_CLIP}; cursor: pointer; position: relative; width: 100%;
  transition: transform 60ms steps(2, end), filter .15s;
}
.btn:active { transform: translateY(2px); }
.btn:focus-visible { outline: 2px solid var(--cyan); outline-offset: 3px; }
.btn:disabled { filter: saturate(.25) brightness(.7); cursor: default; }
.btn-pink {
  letter-spacing: .18em; color: var(--abyss); font-size: 17px; font-weight: 600; padding: .9rem 1.4rem;
  background: linear-gradient(#ffa3bf 0 5px, #ff5d8f 5px calc(100% - 6px), #cf3a6b calc(100% - 6px) 100%);
  box-shadow: inset 0 0 0 2px #040810d9; filter: drop-shadow(0 0 14px #ff5d8f66);
}
.btn-cyan {
  letter-spacing: .18em; color: var(--abyss); font-size: 17px; font-weight: 600; padding: .9rem 1.4rem;
  background: linear-gradient(#b5f5ff 0 5px, #4de3ff 5px calc(100% - 6px), #2bb3d1 calc(100% - 6px) 100%);
  box-shadow: inset 0 0 0 2px #040810d9; filter: drop-shadow(0 0 14px #4de3ff55);
}
.btn-quiet {
  letter-spacing: .14em; color: var(--drift); font-size: 16px; padding: .85rem 1.2rem;
  background: linear-gradient(#24365a 0 5px, #101d33 5px calc(100% - 6px), #070d1a calc(100% - 6px) 100%);
  box-shadow: inset 0 0 0 2px #040810d9;
}
.row { display: flex; gap: 10px; margin-top: 12px; }
.row > * { flex: 1; }

.card-frame {
  position: relative; padding: 6px; background: #050a14;
  max-height: 70vh; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #24365a #050a14;
  box-shadow: inset 0 0 0 2px var(--line); clip-path: ${SMALL_CLIP};
}
.card-frame canvas { display: block; width: 100%; height: auto; cursor: zoom-in; }
.card-frame canvas:focus-visible { outline: 2px solid var(--cyan); outline-offset: 2px; }
.card-frame.busy canvas { opacity: .55; }
.hint { margin: 8px 0 0; font-size: 15px; letter-spacing: .08em; color: var(--drift); opacity: .7; }
.hint[hidden] { display: none; }
`;

  const OPTIONS = [
    { key: 'includeQuestions', label: 'Include questions' },
    { key: 'includeAnswers', label: 'Include answers' },
    { key: 'includePercentile', label: 'Include percentile' },
    { key: 'spoiler', label: 'Spoiler tag Q&A' },
  ];

  function el(tag, attrs, children) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else n.setAttribute(k, v);
    }
    for (const c of children || []) n.append(c);
    return n;
  }

  // chrome.storage when running as an extension; localStorage otherwise
  // (lets the same code be injected by hand for debugging).
  const store = {
    async get() {
      try {
        if (root.chrome && chrome.storage && chrome.storage.sync) {
          const r = await chrome.storage.sync.get(STORE_KEY);
          return r[STORE_KEY] || {};
        }
        return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
      } catch {
        return {};
      }
    },
    async set(v) {
      try {
        if (root.chrome && chrome.storage && chrome.storage.sync) await chrome.storage.sync.set({ [STORE_KEY]: v });
        else localStorage.setItem(STORE_KEY, JSON.stringify(v));
      } catch {
        /* settings just won't persist */
      }
    },
  };

  // Async Clipboard API first; fall back to the hidden-textarea execCommand
  // trick the site itself uses (works where clipboard-write is unavailable).
  async function writeClipboardText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (err) {
      const prev = document.activeElement;
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.readOnly = true;
      ta.style.cssText = 'position:fixed;left:0;top:0;opacity:0;font-size:16px;pointer-events:none';
      document.body.append(ta);
      try {
        ta.select();
        ta.setSelectionRange(0, text.length);
        if (!document.execCommand('copy')) throw err;
      } finally {
        ta.remove();
        if (prev instanceof HTMLElement) prev.focus({ preventScroll: true });
      }
    }
  }

  class Panel {
    constructor() {
      this.opts = Object.assign({}, K.DEFAULT_OPTIONS);
      this.dive = null;
      this.sig = '';
      this.renderToken = 0;
      this.host = el('div', { id: 'krillion-share-kit' });
      this.host.style.cssText = 'display:block;margin:2px 0 0;';
      const shadow = this.host.attachShadow({ mode: 'open' });
      shadow.append(el('style', { text: CSS }), this.build());
      this.ready = store.get().then((saved) => {
        Object.assign(this.opts, saved);
        if (!K.SPOILER_FORMATS[this.opts.spoilerFormat]) this.opts.spoilerFormat = K.DEFAULT_OPTIONS.spoilerFormat;
        this.syncControls();
      });
    }

    build() {
      const kit = el('section', { class: 'kit', 'aria-label': 'Share kit' });

      // Options
      const opts = el('div', { class: 'opts' });
      this.inputs = {};
      this.labels = {};
      for (const o of OPTIONS) {
        const input = el('input', { type: 'checkbox' });
        input.addEventListener('change', () => this.setOpt(o.key, input.checked));
        const label = el('label', { class: 'chk' }, [input, el('span', { class: 'box' }), el('span', { class: 'lbl', text: o.label })]);
        this.inputs[o.key] = input;
        this.labels[o.key] = label;
        opts.append(label);
      }
      this.fmt = el('div', { class: 'fmt', role: 'radiogroup', 'aria-label': 'Spoiler format' }, [
        el('span', { text: 'Format' }),
      ]);
      this.chips = {};
      for (const [id, f] of Object.entries(K.SPOILER_FORMATS)) {
        const chip = el('button', { type: 'button', class: 'chip', role: 'radio', text: f.label });
        chip.addEventListener('click', () => this.setOpt('spoilerFormat', id));
        this.chips[id] = chip;
        this.fmt.append(chip);
      }
      opts.append(this.fmt);

      // Text
      this.preview = el('pre', { class: 'preview', 'aria-label': 'Share text preview' });
      this.copyTextBtn = el('button', { type: 'button', class: 'btn btn-pink', text: 'Copy text' });
      this.copyTextBtn.addEventListener('click', () => this.copyText());

      // Card
      this.canvas = el('canvas', { role: 'img', 'aria-label': 'Share card preview (click to enlarge)', tabindex: '0' });
      this.canvas.addEventListener('click', () => this.openLightbox());
      this.canvas.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        this.openLightbox();
      });
      this.frame = el('div', { class: 'card-frame busy' }, [this.canvas]);
      this.copyImgBtn = el('button', { type: 'button', class: 'btn btn-cyan', text: 'Copy image' });
      this.copyImgBtn.addEventListener('click', () => this.copyImage());
      this.dlBtn = el('button', { type: 'button', class: 'btn btn-quiet', text: 'Download' });
      this.dlBtn.addEventListener('click', () => this.download());
      this.pctHint = el('p', { class: 'hint', text: 'Percentile appears once today’s results load.' });
      this.pctHint.hidden = true;

      kit.append(
        el('div', { class: 'section' }, [
          el('p', { class: 'fathom' }, [el('span', { text: 'Share kit' }), el('span', { class: 'sub', text: 'extension' })]),
          opts,
        ]),
        el('div', { class: 'section' }, [
          el('p', { class: 'fathom' }, [el('span', { text: 'Text' })]),
          this.preview,
          el('div', { class: 'row' }, [this.copyTextBtn]),
        ]),
        el('div', { class: 'section' }, [
          el('p', { class: 'fathom' }, [el('span', { text: 'Image card' })]),
          this.frame,
          this.pctHint,
          el('div', { class: 'row' }, [this.copyImgBtn, this.dlBtn]),
        ])
      );
      return kit;
    }

    /** Insert right below the site's "Copy result" button row. */
    mount(copyBtn) {
      const anchor = copyBtn.parentElement || copyBtn;
      if (this.host.previousElementSibling !== anchor || !this.host.isConnected) anchor.after(this.host);
    }

    detach() {
      this.host.remove();
    }

    setDive(dive) {
      const sig = JSON.stringify(dive);
      if (sig === this.sig) return;
      this.sig = sig;
      this.dive = dive;
      this.ready.then(() => this.update());
    }

    setOpt(key, value) {
      this.opts[key] = value;
      store.set(this.opts);
      this.syncControls();
      this.update();
    }

    syncControls() {
      const o = this.opts;
      for (const { key } of OPTIONS) this.inputs[key].checked = !!o[key];
      const qa = o.includeQuestions || o.includeAnswers;
      this.inputs.spoiler.disabled = !qa;
      this.labels.spoiler.classList.toggle('off', !qa);
      const fmtOn = qa && o.spoiler;
      this.fmt.classList.toggle('off', !fmtOn);
      for (const [id, chip] of Object.entries(this.chips)) {
        chip.disabled = !fmtOn;
        chip.setAttribute('aria-checked', String(o.spoilerFormat === id));
      }
    }

    text() {
      return this.dive ? K.buildShareText(this.dive, this.opts) : '';
    }

    update() {
      if (!this.dive) return;
      this.renderPreview(this.text());
      this.pctHint.hidden = !(this.opts.includePercentile && this.dive.betterThan == null);
      this.renderCard();
    }

    renderPreview(text) {
      // Highlight spoiler spans so it's obvious what will be hidden.
      this.preview.replaceChildren();
      const re = /\|\|(?:\\.|[^|\\])*\|\|/g;
      let last = 0;
      for (const m of text.matchAll(re)) {
        this.preview.append(text.slice(last, m.index), el('span', { class: 'spoil', text: m[0] }));
        last = m.index + m[0].length;
      }
      this.preview.append(text.slice(last));
    }

    async renderCard() {
      const token = ++this.renderToken;
      this.frame.classList.add('busy');
      // Render off-screen, then swap in, so the preview never shows a half-drawn card.
      const off = await C.render(this.dive, this.opts);
      if (token !== this.renderToken) return;
      this.canvas.width = off.width;
      this.canvas.height = off.height;
      this.canvas.getContext('2d').drawImage(off, 0, 0);
      this.frame.classList.remove('busy');
    }

    openLightbox() {
      if (!this.canvas.width) return;
      // Lives on <body> (not in the panel) so the panel's clip-path and the
      // site's scroll container can't clip or offset it.
      const img = el('img', { src: this.canvas.toDataURL('image/png'), alt: 'Share card' });
      img.style.cssText =
        'max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;box-shadow:0 0 0 2px #1b2c47,0 0 40px #4de3ff33;';
      const box = el('div', { role: 'dialog', 'aria-label': 'Share card', tabindex: '-1' }, [img]);
      box.style.cssText =
        'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:24px;background:#050a14e6;cursor:zoom-out;outline:none;';
      const close = () => {
        box.remove();
        removeEventListener('keydown', onKey, true);
        this.canvas.focus({ preventScroll: true });
      };
      const onKey = (e) => e.key === 'Escape' && close();
      box.addEventListener('click', close);
      addEventListener('keydown', onKey, true);
      document.body.append(box);
      box.focus();
    }

    flash(btn, label, ok) {
      const orig = btn.dataset.label || btn.textContent;
      btn.dataset.label = orig;
      btn.textContent = label;
      clearTimeout(btn._t);
      btn._t = setTimeout(() => (btn.textContent = orig), ok ? 1600 : 2600);
    }

    async copyText() {
      try {
        await writeClipboardText(this.text());
        this.flash(this.copyTextBtn, 'Copied ✓', true);
      } catch (e) {
        console.warn('[krillion-share-kit] copy text failed', e);
        this.flash(this.copyTextBtn, 'Copy failed', false);
      }
    }

    cardBlob() {
      // Always encode a fresh render so the image matches the current options
      // even if the preview is mid-update.
      return C.render(this.dive, this.opts).then(C.toBlob);
    }

    async copyImage() {
      try {
        // Pass the promise straight to ClipboardItem so the user-activation
        // from this click is still valid when the PNG is ready.
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': this.cardBlob() })]);
        this.flash(this.copyImgBtn, 'Copied ✓', true);
      } catch (e) {
        console.warn('[krillion-share-kit] copy image failed', e);
        this.flash(this.copyImgBtn, 'Copy failed', false);
      }
    }

    async download() {
      try {
        const blob = await this.cardBlob();
        const url = URL.createObjectURL(blob);
        const a = el('a', { href: url, download: `krillion-${this.dive.dayNumber}.png` });
        document.body.append(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      } catch (e) {
        console.warn('[krillion-share-kit] download failed', e);
        this.flash(this.dlBtn, 'Failed', false);
      }
    }
  }

  root.KrillionPanel = Panel;
})(globalThis);
