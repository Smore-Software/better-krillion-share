# Share Kit for Krillion

An unofficial Chrome extension. It adds a configurable share panel under **Copy result** on
the results screen of [krillion.io](https://krillion.io)'s daily dive.

- **Text share**: the site's normal result. Optionally add your answers, the questions,
  your percentile, and spoiler tags on each item (Discord `||…||`). Includes a live preview.
- **Image card**: a PNG in Krillion's style showing your score, verdict, percentile curve,
  dive log and the questions and answers you selected. It has an embedded preview
  (click to enlarge), **Copy image** and **Download**.
- Options are saved with `chrome.storage.sync`.

## Install (unpacked)
1. Go to `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and select this folder.
3. Finish today's dive, or open krillion.io if you already have.

## Scripts
Requires Node 18+. There are no dependencies.

| Command | What it does |
|---|---|
| `npm test` | Runs the unit tests |
| `npm run package` | Runs the tests, then builds `dist/better-krillion-share-<version>.zip` for the Chrome Web Store |
| `npm run icons` | Regenerates `icons/` from the pixel art in `scripts/make-icons.js` |

## Publishing
`store/LISTING.md` has the Web Store listing text, the privacy-tab answers and the test
instructions. `store/` also holds the screenshots and the promo tile.
`PRIVACY.md` is the privacy policy.

## Layout
| File | Role |
|---|---|
| `src/share-text.js` | Pure text builder, tier and band tables, spoiler formats |
| `src/dive-data.js` | Reads the dive from `localStorage` and the results DOM |
| `src/card.js` | Canvas renderer for the image card |
| `src/panel.js` | Injected shadow-DOM panel (options, preview, buttons) |
| `src/content.js` | Watches the single-page app and mounts or updates the panel |
| `scripts/` | Icon generator and packager, plus a dependency-free PNG and zip writer |
| `store/` | Web Store listing copy, screenshots and promo tile |
| `reference/` | Recon notes. `NOTES.md` is tracked; saved API responses, the site bundle and screenshots are local-only and gitignored |

To add a spoiler platform, add an entry to `SPOILER_FORMATS` in `src/share-text.js`.
