# Krillion Share Kit

Chrome extension that adds a configurable share panel under **Copy result** on
[krillion.io](https://krillion.io)'s daily-dive results screen.

- **Text share**: the site's normal result, plus optional answers, questions,
  percentile, and per-item spoiler tags (Discord `||…||`). Live preview.
- **Image card**: a PNG in Krillion's look: score, verdict, percentile curve,
  dive log and the selected Q&A. Embedded preview, **Copy image** and **Download**.
- Options persist via `chrome.storage.sync`.

## Install (unpacked)
1. `chrome://extensions` → enable **Developer mode**.
2. **Load unpacked** → select this folder.
3. Finish today's dive (or open krillion.io if you already have).

## Layout
| File | Role |
|---|---|
| `src/share-text.js` | Pure text builder + tier/band tables, spoiler formats |
| `src/dive-data.js` | Reads the dive from `localStorage` + results DOM |
| `src/card.js` | Canvas renderer for the image card |
| `src/panel.js` | Injected shadow-DOM panel (options, preview, buttons) |
| `src/content.js` | Watches the SPA, mounts/updates the panel |
| `reference/` | Recon notes (`NOTES.md` is tracked; saved API responses, site bundle and screenshots are local-only and gitignored) |

Add a spoiler platform by adding an entry to `SPOILER_FORMATS` in `src/share-text.js`.

## Tests
`node --test test/`
