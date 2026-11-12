# Krillion recon (dive #119, 2026-11-11)

Browser session: `agent-browser --session krillion --profile ./.browser-profile`
(persistent profile — today's dive is complete and survives reloads).

## Game state (localStorage)
- `krillion:stats:v1` — `{ history: { "YYYY-MM-DD": { dayNumber, score, tiers[7], results[7]{promptId, promptText, rawAnswer, answer, tier, score} } }, gamesPlayed, totalScore, bestScore, currentStreak, maxStreak, lastPlayedDate }`
- `krillion:player:v1` — player UUID
- Day boundary: America/New_York (`resetsAt` in /api/today).

## Share text (module 17335 in bundle/11s5m2o9pa8bd.js)
```
Krillion #119 🦐
445

🏮🦑🦑🦑🦑🦑🦑
```
- Variants: archive `Krillion ⟲ #N 🦐`, unlimited `Krillion ∞ #N 🦐`; `withShareLink` appends `\n\nhttps://krillion.io<path>`.
- Copy: hidden textarea + `document.execCommand("copy")`, falls back to `navigator.clipboard.writeText`.
- Tiers (module 86062 in bundle/3a2smk51t1yib.js): plankton 🫧 10, tooclever 🤡 15, schooler 🐟 30, rare 🦑 60, deepcut 🏮 85, krillion 🌟 100, miss ⬛ 0. Max 700.

## Results DOM
- Container `.ds-done-inner`; Copy button is `button.btn-descend` text "COPY RESULT" (→ "Copied ✓"), followed by "KEEP DIVING ∞" link.
- Percentile: svg `aria-label="Score distribution of today's players; your score beats 95% of them"`.
- "The Catch": one `<button>` per round with prompt, answer, "N other players chose this", score.

## Public GET APIs (same origin)
- `/api/today` — date, dayNumber, resetsAt, prompts
- `/api/answer-popularity?date=YYYY-MM-DD` — per prompt `{answer: count}`
- `/api/reveal?date=YYYY-MM-DD` — per prompt every accepted answer with tier/score (+ quip for the krillion answer)
Saved copies: `api-*.json`.
