// Renders a shareable PNG card of the dive onto a <canvas>, in Krillion's
// pixel / deep-sea look. Uses the page's own VT323 font, tier icons and
// percentile curve so it matches what the player saw.
//
// Layout is two columns to keep the card close to square:
//   with Q/A:    [score · percentile · dive log] | [the catch]
//   without Q/A: [score · percentile]            | [dive log]
(function (root) {
  'use strict';

  const K = root.KrillionShare;
  const PAD = 80;
  const GUTTER = 88;
  const GAP = 52; // between stacked sections in a column
  const FONT = 'VT323, "VT323 Fallback", ui-monospace, monospace';

  // ---------- helpers ----------

  function palette() {
    const cs = getComputedStyle(document.documentElement);
    const v = (name, fb) => (cs.getPropertyValue(name) || '').trim() || fb;
    return {
      abyss: v('--color-abyss', '#050a14'),
      shallow: v('--color-shallow', '#101d33'),
      drift: v('--color-drift', '#7d93b8'),
      foam: v('--color-foam', '#e8f1ff'),
      line: v('--color-line', '#1b2c47'),
      cyan: v('--color-lumen-cyan', '#4de3ff'),
      pink: v('--color-lumen-pink', '#ff5d8f'),
      tier: (id) => v('--tier-' + id, K.tierOf(id).color),
    };
  }

  function hexA(color, a) {
    const m = /^#([0-9a-f]{6})/i.exec(color);
    if (!m) return `rgba(125,147,184,${a})`;
    const n = parseInt(m[1], 16);
    return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
  }

  function font(px) {
    return `${px}px ${FONT}`;
  }

  function setSpacing(ctx, px) {
    if ('letterSpacing' in ctx) ctx.letterSpacing = px + 'px';
  }

  /** Largest font size (stepping down from `start`) at which `text` fits `maxW`. */
  function fitFont(ctx, text, maxW, start, min, spacing) {
    let px = start;
    for (; px > min; px -= 2) {
      ctx.font = font(px);
      setSpacing(ctx, spacing);
      if (ctx.measureText(text).width <= maxW) break;
    }
    ctx.font = font(px);
    setSpacing(ctx, spacing);
    return px;
  }

  // Deterministic RNG so the preview doesn't shimmer on every re-render.
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => {
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      return (s >>> 0) / 4294967296;
    };
  }

  function wrapText(ctx, text, maxW) {
    const words = String(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let cur = '';
    for (const w of words) {
      const next = cur ? cur + ' ' + w : w;
      if (ctx.measureText(next).width <= maxW) {
        cur = next;
        continue;
      }
      if (cur) lines.push(cur);
      // Hard-break a single word that is wider than the column.
      let piece = w;
      while (ctx.measureText(piece).width > maxW && piece.length > 1) {
        let i = piece.length - 1;
        while (i > 1 && ctx.measureText(piece.slice(0, i)).width > maxW) i--;
        lines.push(piece.slice(0, i));
        piece = piece.slice(i);
      }
      cur = piece;
    }
    if (cur) lines.push(cur);
    return lines.length ? lines : [''];
  }

  function formatDate(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-').map(Number);
    const mon = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][m - 1];
    return mon ? `${mon} ${d}, ${y}` : '';
  }

  const imgCache = {};
  function tierImage(id) {
    if (!K.TIERS[id] || id === 'miss') return Promise.resolve(null);
    if (!imgCache[id]) {
      const img = new Image();
      img.src = `/tiers/${id}.png`;
      imgCache[id] = img
        .decode()
        .then(() => img)
        .catch(() => null);
    }
    return imgCache[id];
  }

  function drawTierIcon(ctx, P, icons, tier, cx, cy, size, glow) {
    const img = icons[tier];
    ctx.save();
    // Soft halo in the tier color so dark sprites (the anglerfish) still read
    // against the deep background.
    if (tier !== 'miss') {
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.8);
      halo.addColorStop(0, hexA(P.tier(tier), glow ? 0.42 : 0.3));
      halo.addColorStop(1, hexA(P.tier(tier), 0));
      ctx.fillStyle = halo;
      ctx.fillRect(cx - size, cy - size, size * 2, size * 2);
    }
    if (glow) {
      ctx.shadowColor = P.tier(tier);
      ctx.shadowBlur = size / 3;
    }
    if (img) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, cx - size / 2, cy - size / 2, size, size);
    } else {
      // Miss: dashed ring, like the site's svg.
      ctx.strokeStyle = P.tier('miss');
      ctx.lineWidth = Math.max(2, size / 13);
      ctx.setLineDash([size / 8, size / 5]);
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.31, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Section label in the site's "fathom" style: SMALL CAPS ─ ─ ─ ─ ─
  function drawFathom(ctx, P, x, y, w, label, sub) {
    ctx.save();
    ctx.font = font(30);
    setSpacing(ctx, 5);
    ctx.textBaseline = 'middle';
    ctx.fillStyle = P.drift;
    ctx.fillText(label, x, y);
    let lx = x + ctx.measureText(label).width + 18;
    if (sub) {
      ctx.globalAlpha = 0.55;
      ctx.fillText(sub, lx, y);
      lx += ctx.measureText(sub).width + 18;
      ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = 'rgba(125,147,184,0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(lx, y + 1);
    ctx.lineTo(x + w, y + 1);
    ctx.stroke();
    ctx.restore();
  }

  // ---------- frame ----------

  function drawBackground(ctx, P, W, H, seed) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#13284a');
    g.addColorStop(0.22, P.shallow);
    g.addColorStop(0.7, '#08111f');
    g.addColorStop(1, P.abyss);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Light shafts from the surface.
    const sx = W / 1080;
    const depth = Math.min(H, 900);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const [x0, w, a] of [
      [140, 90, 0.05],
      [420, 140, 0.04],
      [760, 70, 0.05],
    ]) {
      const sg = ctx.createLinearGradient(0, 0, 0, depth);
      sg.addColorStop(0, `rgba(77,227,255,${a})`);
      sg.addColorStop(1, 'rgba(77,227,255,0)');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.moveTo(x0 * sx, 0);
      ctx.lineTo((x0 + w) * sx, 0);
      ctx.lineTo((x0 + w) * sx + 260, depth);
      ctx.lineTo(x0 * sx + 160, depth);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Marine snow (pixel squares).
    const rand = rng(seed);
    const count = Math.round((170 * W * H) / (1080 * 2000));
    ctx.save();
    for (let i = 0; i < count; i++) {
      const s = rand() < 0.8 ? 3 : 5;
      ctx.globalAlpha = 0.05 + rand() * 0.2;
      ctx.fillStyle = rand() < 0.15 ? P.cyan : P.foam;
      ctx.fillRect(Math.round(rand() * W), Math.round(rand() * H), s, s);
    }
    ctx.restore();

    // Depth ruler down the right edge.
    ctx.save();
    ctx.strokeStyle = 'rgba(125,147,184,0.22)';
    ctx.lineWidth = 2;
    const rx = W - 34;
    ctx.beginPath();
    ctx.moveTo(rx, 40);
    ctx.lineTo(rx, H - 40);
    ctx.stroke();
    for (let y = 40, i = 0; y <= H - 40; y += 24, i++) {
      ctx.beginPath();
      ctx.moveTo(rx - (i % 5 === 0 ? 14 : 7), y);
      ctx.lineTo(rx, y);
      ctx.stroke();
    }
    ctx.restore();

    // Scanlines.
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.13)';
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
    ctx.restore();

    // Pixel-notched frame, echoing the site's button clip-path.
    const i = 18;
    const n = 10;
    const pts = [
      [i + n * 2, i], [W - i - n * 2, i], [W - i - n * 2, i + n], [W - i - n, i + n],
      [W - i - n, i + n * 2], [W - i, i + n * 2], [W - i, H - i - n * 2], [W - i - n, H - i - n * 2],
      [W - i - n, H - i - n], [W - i - n * 2, H - i - n], [W - i - n * 2, H - i], [i + n * 2, H - i],
      [i + n * 2, H - i - n], [i + n, H - i - n], [i + n, H - i - n * 2], [i, H - i - n * 2],
      [i, i + n * 2], [i + n, i + n * 2], [i + n, i + n], [i + n * 2, i + n],
    ];
    ctx.save();
    ctx.strokeStyle = P.line;
    ctx.lineWidth = 4;
    ctx.beginPath();
    pts.forEach(([px, py], k) => (k ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  function drawHeader(ctx, P, W, y, dive) {
    ctx.save();
    ctx.textBaseline = 'alphabetic';
    ctx.font = font(80);
    setSpacing(ctx, 6);
    const by = y + 62;
    ctx.fillStyle = P.pink;
    ctx.fillText('KRILLION', PAD - 4, by + 4);
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = P.cyan;
    ctx.fillText('KRILLION', PAD + 4, by - 4);
    ctx.globalAlpha = 1;
    ctx.shadowColor = 'rgba(77,227,255,0.35)';
    ctx.shadowBlur = 24;
    ctx.fillStyle = P.foam;
    ctx.fillText('KRILLION', PAD, by);
    ctx.restore();

    ctx.save();
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.font = font(36);
    setSpacing(ctx, 5);
    ctx.fillStyle = P.foam;
    ctx.fillText(`DIVE #${dive.dayNumber}`, W - PAD, y + 40);
    ctx.font = font(28);
    setSpacing(ctx, 4);
    ctx.fillStyle = P.drift;
    ctx.fillText(formatDate(dive.date) || 'THE DAILY DIVE', W - PAD, y + 74);
    ctx.restore();
    return 120;
  }

  function drawFooter(ctx, P, W, y) {
    ctx.save();
    ctx.fillStyle = 'rgba(125,147,184,0.22)';
    ctx.fillRect(PAD, y, W - PAD * 2, 2);
    ctx.textBaseline = 'middle';
    ctx.font = font(36);
    setSpacing(ctx, 5);
    ctx.fillStyle = P.cyan;
    ctx.fillText('KRILLION.IO', PAD, y + 50);
    ctx.textAlign = 'right';
    ctx.font = font(28);
    setSpacing(ctx, 4);
    ctx.fillStyle = P.drift;
    ctx.fillText('▼ RARER ANSWERS SINK DEEPER ▼', W - PAD, y + 50);
    ctx.restore();
    return 100;
  }

  // ---------- column sections (each returns its height) ----------

  function drawScore(ctx, P, icons, x, y, w, dive) {
    const band = K.bandFor(dive.score);
    const base = y + 190;
    ctx.save();
    ctx.textBaseline = 'alphabetic';
    ctx.font = font(250);
    setSpacing(ctx, 0);
    ctx.shadowColor = 'rgba(232,241,255,0.25)';
    ctx.shadowBlur = 30;
    ctx.fillStyle = P.foam;
    ctx.fillText(String(dive.score), x - 6, base);
    const sw = ctx.measureText(String(dive.score)).width;
    ctx.shadowBlur = 0;
    ctx.font = font(52);
    setSpacing(ctx, 2);
    ctx.fillStyle = P.cyan;
    ctx.fillText(`-${(dive.score * 10).toLocaleString('en-US')}m`, x + sw + 18, base - 10);
    ctx.font = font(30);
    setSpacing(ctx, 4);
    ctx.fillStyle = P.drift;
    ctx.globalAlpha = 0.7;
    ctx.fillText(`/ ${K.MAX_DAY_SCORE}`, x + sw + 22, base - 72);
    ctx.restore();

    // Verdict band: icon + NAME · verdict (verdict wraps below if too wide).
    const ry = base + 52;
    drawTierIcon(ctx, P, icons, band.tier, x + 28, ry, 60, true);
    ctx.save();
    ctx.textBaseline = 'middle';
    ctx.font = font(40);
    setSpacing(ctx, 4);
    const name = K.tierOf(band.tier).name.toUpperCase();
    ctx.fillStyle = P.tier(band.tier);
    ctx.fillText(name, x + 76, ry + 2);
    const nw = ctx.measureText(name).width;
    ctx.font = font(34);
    setSpacing(ctx, 1);
    ctx.fillStyle = P.drift;
    const verdict = band.verdict.replace(/^[^.]+\.\s*/, '');
    let h = ry + 50 - y;
    if (x + 76 + nw + 16 + ctx.measureText('· ' + verdict).width <= x + w) {
      ctx.fillText('· ' + verdict, x + 76 + nw + 16, ry + 2);
    } else {
      ctx.fillText(verdict, x + 76, ry + 46);
      h += 44;
    }
    ctx.restore();
    return h;
  }

  function drawPercentile(ctx, P, x, y, w, dive) {
    let h = 0;
    drawFathom(ctx, P, x, y + 14, w, "TODAY'S DIVERS");
    h += 50;
    if (dive.chart) {
      const s = w / 320;
      const top = y + h;
      const area = new Path2D(dive.chart.area);
      const line = new Path2D(dive.chart.line);
      ctx.save();
      ctx.translate(x, top);
      ctx.scale(s, s);

      const g = ctx.createLinearGradient(0, 0, 0, 78);
      g.addColorStop(0, 'rgba(77,227,255,0.45)');
      g.addColorStop(1, 'rgba(77,227,255,0.02)');
      ctx.fillStyle = g;
      ctx.globalAlpha = 0.28;
      ctx.fill(area);
      ctx.globalAlpha = 1;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, dive.chart.youX, 96);
      ctx.clip();
      ctx.fill(area);
      ctx.restore();

      ctx.strokeStyle = P.cyan;
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = 1.4;
      ctx.stroke(line);
      ctx.globalAlpha = 1;

      ctx.strokeStyle = 'rgba(125,147,184,0.3)';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(0, 78);
      ctx.lineTo(320, 78);
      ctx.stroke();
      ctx.restore();

      // Axis + marker drawn unscaled so text stays crisp.
      const X = (vx) => x + vx * s;
      const Y = (vy) => top + vy * s;
      const youX = dive.chart.youX;
      const labelPx = 26;
      ctx.save();
      ctx.font = font(labelPx);
      setSpacing(ctx, 1);
      ctx.textBaseline = 'top';
      ctx.fillStyle = P.drift;
      for (const v of [0, 100, 200, 300, 400, 500, 600, 700]) {
        const vx = (v / K.MAX_DAY_SCORE) * 320;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(X(vx) - 1, Y(78), 2, 10);
        if (Math.abs(X(vx) - X(youX)) < 52) continue; // don't collide with "YOU"
        ctx.globalAlpha = 0.6;
        ctx.textAlign = v === 0 ? 'left' : v === 700 ? 'right' : 'center';
        ctx.fillText(String(v), X(vx), Y(78) + 14);
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = P.pink;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(X(youX), Y(Math.min(dive.chart.youY, 74) - 3));
      ctx.lineTo(X(youX), Y(78));
      ctx.stroke();
      ctx.shadowColor = P.pink;
      ctx.shadowBlur = 16;
      ctx.fillStyle = P.pink;
      ctx.beginPath();
      ctx.arc(X(youX), Y(dive.chart.youY), 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.textAlign = 'center';
      setSpacing(ctx, 4);
      ctx.fillText('YOU', Math.min(Math.max(X(youX), x + 30), x + w - 30), Y(78) + 14);
      ctx.restore();
      h += 78 * s + 14 + labelPx + 12;
    }
    if (dive.betterThan != null) {
      const text = `BETTER THAN ${dive.betterThan}% OF TODAY'S PLAYERS`;
      ctx.save();
      fitFont(ctx, text, w, 36, 22, 4);
      ctx.textBaseline = 'middle';
      ctx.fillStyle = P.cyan;
      ctx.shadowColor = 'rgba(77,227,255,0.45)';
      ctx.shadowBlur = 14;
      ctx.fillText(text, x, y + h + 18);
      ctx.restore();
      h += 40;
    }
    return h;
  }

  function drawDiveLog(ctx, P, icons, x, y, w, dive) {
    const chartH = 300;
    drawFathom(ctx, P, x, y + 14, w, 'DIVE LOG', 'DEEPER = RARER');
    const top = y + 70;
    const left = x + 66;
    const right = x + w;
    const n = dive.rounds.length || 7;
    const col = (right - left) / n;
    const iconSize = Math.min(64, Math.floor(col * 0.82));

    ctx.save();
    ctx.font = font(24);
    setSpacing(ctx, 1);
    ctx.textBaseline = 'middle';
    for (const d of [0, 25, 50, 75, 100]) {
      const gy = top + (d / 100) * chartH;
      ctx.strokeStyle = 'rgba(125,147,184,0.18)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.moveTo(left - 10, gy);
      ctx.lineTo(right, gy);
      ctx.stroke();
      ctx.fillStyle = P.drift;
      ctx.globalAlpha = 0.55;
      ctx.fillText(d === 0 ? '0m' : `-${d}`, x, gy);
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    dive.rounds.forEach((r, i) => {
      const cx = left + col * (i + 0.5);
      const cy = top + K.tierOf(r.tier).depth * chartH;
      ctx.save();
      const lg = ctx.createLinearGradient(0, top, 0, Math.max(cy, top + 1));
      lg.addColorStop(0, 'rgba(0,0,0,0)');
      lg.addColorStop(1, P.tier(r.tier));
      ctx.strokeStyle = lg;
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, top);
      ctx.lineTo(cx, cy);
      ctx.stroke();
      ctx.restore();
      drawTierIcon(ctx, P, icons, r.tier, cx, cy, iconSize, true);

      ctx.save();
      ctx.font = font(28);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = P.drift;
      ctx.globalAlpha = 0.7;
      ctx.fillText(String(r.n), cx, top + chartH + 50);
      ctx.restore();
    });
    return 70 + chartH + 70;
  }

  const QA = { qFont: 28, qLine: 30, aFont: 46, aLine: 46, iconSize: 56, textOff: 118, scoreW: 80, padY: 18 };

  /**
   * @param targetH  if given, rows get extra padding (capped) so the column
   *                 bottoms out level with its neighbour instead of leaving a gap.
   */
  function drawCatch(ctx, P, icons, x, y, w, dive, opts, targetH) {
    const textX = x + QA.textOff;
    const textW = w - QA.textOff - QA.scoreW;
    const rows = dive.rounds.map((r) => {
      let q = [];
      let a = [];
      if (opts.includeQuestions) {
        ctx.font = font(QA.qFont);
        setSpacing(ctx, 1.5);
        q = wrapText(ctx, r.prompt.toUpperCase(), textW);
      }
      if (opts.includeAnswers) {
        ctx.font = font(QA.aFont);
        setSpacing(ctx, 0);
        a = wrapText(ctx, r.answer || '(no answer)', textW);
      }
      const textH = q.length * QA.qLine + (q.length && a.length ? 6 : 0) + a.length * QA.aLine;
      return { r, q, a, textH, h: Math.max(QA.iconSize, textH) + QA.padY * 2 };
    });

    const head = 44;
    const natural = head + rows.reduce((s, row) => s + row.h, 0);
    const extra = targetH ? Math.max(0, Math.min(40, (targetH - natural) / rows.length)) : 0;

    drawFathom(ctx, P, x, y + 14, w, 'THE CATCH');
    let cy = y + head;
    rows.forEach((row, i) => {
      const { r, q, a, textH } = row;
      const h = row.h + extra;
      const mid = cy + h / 2;
      ctx.save();
      ctx.font = font(30);
      ctx.textBaseline = 'middle';
      ctx.fillStyle = P.drift;
      ctx.globalAlpha = 0.6;
      ctx.fillText(String(r.n), x, mid);
      ctx.restore();
      drawTierIcon(ctx, P, icons, r.tier, x + 66, mid, QA.iconSize, false);

      let ty = mid - textH / 2;
      ctx.save();
      ctx.textBaseline = 'top';
      if (q.length) {
        ctx.font = font(QA.qFont);
        setSpacing(ctx, 1.5);
        ctx.fillStyle = P.drift;
        for (const l of q) {
          ctx.fillText(l, textX, ty + 2);
          ty += QA.qLine;
        }
        ty += 6;
      }
      if (a.length) {
        ctx.font = font(QA.aFont);
        setSpacing(ctx, 0);
        ctx.fillStyle = r.answer ? P.foam : P.drift;
        for (const l of a) {
          ctx.fillText(l, textX, ty);
          ty += QA.aLine;
        }
      }
      ctx.restore();

      ctx.save();
      ctx.font = font(44);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = P.tier(r.tier);
      ctx.fillText(String(K.tierOf(r.tier).score), x + w, mid);
      ctx.restore();

      cy += h;
      if (i < rows.length - 1) {
        ctx.fillStyle = 'rgba(125,147,184,0.16)';
        ctx.fillRect(x, cy - 1, w, 2);
      }
    });
    return cy - y;
  }

  // ---------- main ----------

  function stack(sections, y) {
    let cy = y;
    sections.forEach((draw, i) => {
      if (i) cy += GAP;
      cy += draw(cy);
    });
    return cy - y;
  }

  async function render(dive, opts, canvas) {
    opts = Object.assign({}, K.DEFAULT_OPTIONS, opts);
    try {
      await Promise.all([document.fonts.load(font(40)), document.fonts.ready]);
    } catch {
      /* fall back to whatever font is available */
    }
    const ids = new Set(dive.rounds.map((r) => r.tier));
    ids.add(K.bandFor(dive.score).tier);
    const icons = {};
    await Promise.all([...ids].map(async (id) => (icons[id] = await tierImage(id))));

    const P = palette();
    const showPct = opts.includePercentile && (dive.chart || dive.betterThan != null);
    const showCatch = opts.includeQuestions || opts.includeAnswers;

    const W = showCatch ? 1600 : 1280;
    const leftW = showCatch ? 660 : Math.floor((W - PAD * 2 - GUTTER) / 2);
    const rightX = PAD + leftW + GUTTER;
    const rightW = W - PAD - rightX;

    // Draws everything at the given height. Run once on a 1×1 scratch canvas
    // to measure, then for real — so heights never drift from the drawing.
    const paint = (ctx, H, targetH) => {
      if (H) drawBackground(ctx, P, W, H, (dive.dayNumber || 1) * 7919 + dive.score);
      const top = PAD + drawHeader(ctx, P, W, PAD, dive) + 36;
      const left = [(y) => drawScore(ctx, P, icons, PAD, y, leftW, dive)];
      if (showPct) left.push((y) => drawPercentile(ctx, P, PAD, y, leftW, dive));
      const right = [];
      if (showCatch) {
        left.push((y) => drawDiveLog(ctx, P, icons, PAD, y, leftW, dive));
        right.push((y) => drawCatch(ctx, P, icons, rightX, y, rightW, dive, opts, targetH));
      } else {
        right.push((y) => drawDiveLog(ctx, P, icons, rightX, y, rightW, dive));
      }
      const lh = stack(left, top);
      const rh = stack(right, top);
      const colH = Math.max(lh, rh);

      // Column divider.
      ctx.save();
      ctx.strokeStyle = 'rgba(125,147,184,0.16)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 10]);
      ctx.beginPath();
      ctx.moveTo(PAD + leftW + GUTTER / 2, top);
      ctx.lineTo(PAD + leftW + GUTTER / 2, top + colH);
      ctx.stroke();
      ctx.restore();

      const footY = top + colH + 44;
      return { H: footY + drawFooter(ctx, P, W, footY) + PAD / 2, lh, rh };
    };

    const scratch = document.createElement('canvas');
    scratch.width = scratch.height = 1;
    const m = paint(scratch.getContext('2d'), 0);
    const targetH = Math.max(m.lh, m.rh);

    canvas = canvas || document.createElement('canvas');
    canvas.width = W;
    canvas.height = Math.ceil(m.H);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paint(ctx, canvas.height, targetH);
    return canvas;
  }

  function toBlob(canvas) {
    return new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not encode card'))), 'image/png')
    );
  }

  root.KrillionCard = { render, toBlob };
})(globalThis);
