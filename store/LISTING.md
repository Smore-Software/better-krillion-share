# Chrome Web Store submission

This file holds the copy-paste values for each tab of the [Developer Dashboard](https://chrome.google.com/webstore/devconsole).

## Package

Upload `dist/better-krillion-share-<version>.zip`, built with `npm run package`. Before each update, bump `version` in `manifest.json` and `package.json`. The store rejects a version it has already seen.

## Store listing

**Name:** taken from the manifest: `Share Kit for Krillion`

**Summary:** taken from the manifest description, which is 132 characters at most.

**Description:**

```
Finished today's Krillion dive? Share Kit adds a panel right under "Copy result" so your share can include more than just seven emojis.

TEXT SHARE
• Add your answers, the prompts, or both, one line per round
• Hide them behind Discord spoiler tags (||like this||) so friends who haven't played yet don't get spoiled
• Add your percentile ("better than 94% of today's players")
• Live preview before you copy. The header and emoji row match Krillion's own share exactly.

IMAGE CARD
• A shareable picture in Krillion's deep-sea pixel style: score, depth, verdict, the percentile curve, a dive log and your catch
• It shows whatever you've selected. Preview it on the page and click to enlarge.
• Copy it straight to the clipboard, or download a PNG

PRIVACY
• Runs only on krillion.io, and only on the daily results screen
• Reads your result from the page itself. Nothing is sent anywhere.
• No accounts, no analytics, no ads. Your options are saved with Chrome sync.

Unofficial and fan-made. Not affiliated with or endorsed by Krillion.
```

**Category:** Games, or Social Networking if Games isn't offered.

**Language:** English

**Graphic assets:**

| Field | File |
|---|---|
| Store icon (128×128) | `icons/icon-128.png` |
| Screenshots (1280×800), in this order | `store/screenshots/1-image-card.png`, `2-share-panel.png`, `3-questions-spoilers.png`, `4-card-preview.png` |
| Small promo tile (440×280) | `store/promo-440x280.png` (rendered from `store/promo-tile.html`) |
| Marquee (1400×560) | Optional. Only needed for a featured placement. |

**Homepage URL:** `https://github.com/calebdinsmore/better-krillion-share`

**Support URL:** `https://github.com/calebdinsmore/better-krillion-share/issues`

**Mature content:** No

## Privacy

**Single purpose:**

```
Adds richer sharing options to the results screen of the krillion.io daily game: the player's answers and prompts, percentile, spoiler tags, and a shareable image card.
```

**Permission justifications:**

| Permission | Justification |
|---|---|
| `storage` | Saves the user's share options (which items to include, spoiler format) so they persist between days. Nothing else is stored. |
| Host permission: `https://krillion.io/*` (content script) | The extension only works on krillion.io's results screen. It reads the finished game's result from the page and adds its share panel there. It does not run on any other site. |

**Remote code:** No, I am not using remote code. All JavaScript ships in the package.

**Data usage:** leave every data-type box unchecked. The extension processes the page's game result locally and never transmits it. If a reviewer disagrees, checking "Website content" is the conservative alternative.

Then tick all three certifications:

- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** `https://github.com/calebdinsmore/better-krillion-share/blob/main/PRIVACY.md`. This URL only works once `PRIVACY.md` is pushed.

## Distribution

- **Payments:** Free
- **Visibility:** Public, or Unlisted to share with friends by link first
- **Regions:** All regions

## Test instructions

```
No account or login is needed.
1. Open https://krillion.io and click "Begin descent".
2. Answer the 7 prompts (any answer works; letting the 25-second timer run out also works).
3. Click "Surface". On the results screen, the "Share kit" panel appears under "Copy result".
If this browser has already played today's dive, the results screen and panel appear as soon as krillion.io opens.
```
