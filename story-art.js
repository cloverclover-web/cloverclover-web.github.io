/* Shared picture-book components.

   Everything the child touches is drawn from one set, so an option, a flag
   waiting in the bunting and a flag already hung are literally the same
   component with different placement. Geometry stays exact: the outline is a
   real polygon or ellipse, and the painterly quality comes from a paper wash,
   a soft pigment fill and a warm pencil edge rather than from blurring the
   shape. Counted objects use the painted PNG props when they are present and
   fall back to drawn versions otherwise, so a missing file never leaves a
   blank where a strawberry should be. */

(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.YoyoArt = api;
})(typeof self !== "undefined" ? self : (typeof globalThis !== "undefined" ? globalThis : null), function () {
  "use strict";

  const PAPER = "#fdf7ec";
  const PENCIL = "#6b5a49";
  const PENCIL_SOFT = "rgba(107, 90, 73, 0.45)";

  /* One copy of the filters and washes for the whole page. */
  const DEFS = `
    <filter id="yoyoGrain" x="-12%" y="-12%" width="124%" height="124%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="11" result="n"/>
      <feColorMatrix in="n" type="saturate" values="0" result="g"/>
      <feComponentTransfer in="g" result="soft">
        <feFuncA type="linear" slope="0.13"/>
      </feComponentTransfer>
      <feComposite in="soft" in2="SourceGraphic" operator="in" result="onShape"/>
      <feBlend in="SourceGraphic" in2="onShape" mode="multiply"/>
    </filter>

    <filter id="yoyoEdge" x="-12%" y="-12%" width="124%" height="124%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="5" result="warp"/>
      <feDisplacementMap in="SourceGraphic" in2="warp" scale="1.5"
                         xChannelSelector="R" yChannelSelector="G"/>
    </filter>

    <linearGradient id="yoyoWash" x1="0" y1="0" x2="0.2" y2="1">
      <stop offset="0%"   stop-color="#ffffff" stop-opacity="0.34"/>
      <stop offset="55%"  stop-color="#ffffff" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#6b5a49" stop-opacity="0.09"/>
    </linearGradient>

    <linearGradient id="yoyoPennantPaper" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%"   stop-color="#fffaf1"/>
      <stop offset="100%" stop-color="#f2e6d3"/>
    </linearGradient>`;

  /* Exact outlines. These are the geometry the shape tasks are judged on. */
  function outline(shapeId) {
    switch (shapeId) {
      case "circle":   return `<circle cx="0" cy="0" r="26"/>`;
      case "oval":     return `<ellipse cx="0" cy="0" rx="29" ry="19"/>`;
      case "triangle": return `<path d="M0 -27 L28 22 H-28 Z"/>`;
      case "square":   return `<rect x="-24" y="-24" width="48" height="48"/>`;
      case "pentagon": return `<path d="M0 -28 L27 -8 L16 25 H-16 L-27 -8 Z"/>`;
      case "hexagon":  return `<path d="M-14 -24 H14 L28 0 L14 24 H-14 L-28 0 Z"/>`;
      case "star":     return `<path d="M0 -28 L8 -9 L28 -9 L12 4 L18 24 L0 12 L-18 24 L-12 4 L-28 -9 L-8 -9 Z"/>`;
      case "heart":    return `<path d="M0 26 C-30 6 -30 -18 -14 -22 C-6 -24 0 -17 0 -11 C0 -17 6 -24 14 -22 C30 -18 30 6 0 26 Z"/>`;
      case "flower":   return `<path d="M0 -27 A11 11 0 0 1 14.7 -12.6 A11 11 0 0 1 22.8 8.3 A11 11 0 0 1 4.4 20.6 A11 11 0 0 1 -14.4 20.6 A11 11 0 0 1 -22.8 8.3 A11 11 0 0 1 -14.7 -12.6 A11 11 0 0 1 0 -27 Z"/>`;
      default:         return `<circle cx="0" cy="0" r="26"/>`;
    }
  }

  const petals = `<g><circle cx="0" cy="-16" r="11"/><circle cx="15" cy="-5" r="11"/><circle cx="9" cy="13" r="11"/><circle cx="-9" cy="13" r="11"/><circle cx="-15" cy="-5" r="11"/></g>`;

  /* A painted paper cut-out of one shape: paper underneath, pigment on top,
     a wash for the light and a pencil line round the edge. */
  function decorationMark(shapeId, hex) {
    const body = shapeId === "flower" ? petals : outline(shapeId);
    const heart = shapeId === "flower"
      ? `<circle cx="0" cy="0" r="7" fill="#e3b96b" opacity="0.9"/>
         <circle cx="0" cy="0" r="7" fill="none" stroke="${PENCIL}" stroke-width="1.6" opacity="0.7"/>`
      : "";
    return `
      <g filter="url(#yoyoEdge)">
        <g fill="${PAPER}">${body}</g>
        <g fill="${hex}" opacity="0.86" filter="url(#yoyoGrain)">${body}</g>
        <g fill="url(#yoyoWash)">${body}</g>
        <g fill="none" stroke="${PENCIL}" stroke-width="2.1" stroke-linejoin="round"
           stroke-linecap="round" opacity="0.85">${body}</g>
        <g fill="none" stroke="${PENCIL_SOFT}" stroke-width="0.9"
           stroke-linejoin="round" transform="translate(0.7 0.9)">${body}</g>
        ${heart}
      </g>`;
  }

  function decorationSvg(shapeId, hex, extraClass = "") {
    return `<svg class="art-decor ${extraClass}" viewBox="-36 -36 72 72" aria-hidden="true">${decorationMark(shapeId, hex)}</svg>`;
  }

  /* One paper pennant carrying one shape. The paper face is a painted PNG when
     it is available; otherwise the same shape is cut from drawn paper, so the
     bunting never falls back to a flat rectangle. */
  const PENNANT_W = 74;
  const PENNANT_H = 92;

  /* pennant-paper.png is a 1254x1254 square with painted margin all round.
     Measured alpha coverage: x 4.63%-95.37%, y 3.99%-94.66%. A plain
     width/height + "meet" fit would letterbox the square into 74x74 and centre
     it, so the folded top edge would float about 9px under the rope and the
     tip would stop short. Instead the measured paper box is mapped onto the
     exact 74x92 pennant slot, which puts the fold on the rope and makes the
     painted flag and the drawn fallback occupy the same geometry. */
  const PAPER_BOX = { x0: 0.0463, x1: 0.9537, y0: 0.0399, y1: 0.9466 };

  function pennantImageRect(w, h) {
    const drawW = w / (PAPER_BOX.x1 - PAPER_BOX.x0);
    const drawH = h / (PAPER_BOX.y1 - PAPER_BOX.y0);
    return {
      x: -w / 2 - PAPER_BOX.x0 * drawW,
      y: -PAPER_BOX.y0 * drawH,
      width: drawW,
      height: drawH
    };
  }

  function pennantBody(usePng) {
    if (usePng) {
      const r = pennantImageRect(PENNANT_W, PENNANT_H);
      /* "none" is deliberate: the source square is stretched to the pennant's
         own proportions, the same proportions the drawn fallback uses. */
      return `<image href="assets/story/pennant-paper.png"
                     x="${r.x.toFixed(3)}" y="${r.y.toFixed(3)}"
                     width="${r.width.toFixed(3)}" height="${r.height.toFixed(3)}"
                     preserveAspectRatio="none"/>`;
    }
    const shape = `<path d="M${-PENNANT_W / 2} 0 H${PENNANT_W / 2} L0 ${PENNANT_H} Z"/>`;
    return `
      <g filter="url(#yoyoEdge)">
        <g fill="url(#yoyoPennantPaper)">${shape}</g>
        <g fill="none" stroke="${PENCIL}" stroke-width="2" stroke-linejoin="round" opacity="0.8">${shape}</g>
      </g>`;
  }

  /* item: { colour, shape }; hexOf resolves the palette colour */
  function pennant(item, hex, { usePng = true, index = 0 } = {}) {
    return `
      <g class="art-pennant" data-colour="${item.colour}" data-shape="${item.shape}" data-index="${index}">
        ${pennantBody(usePng)}
        <g transform="translate(0 ${PENNANT_H * 0.36}) scale(0.52)">
          ${decorationMark(item.shape, hex)}
        </g>
      </g>`;
  }

  /* A flag with nothing on it yet: the paper is cut, the decoration is not
     chosen. Used for the half-made bunting on the early pages, so the child
     sees the plan without being shown any part of this read's answer. */
  function blankPennant({ usePng = true } = {}) {
    return `<g class="art-pennant is-blank" data-blank="true">${pennantBody(usePng)}</g>`;
  }

  /* Duck's basket, for the page where the flags are put away from the rain. */
  const BASKET_SVG = `
    <svg class="art-basket" viewBox="-52 -40 104 84" aria-hidden="true">
      <g filter="url(#yoyoEdge)">
        <path d="M-38 -8 L38 -8 L31 36 L-31 36 Z" fill="#d3a06d"/>
        <path d="M-38 -8 L38 -8 L31 36 L-31 36 Z" fill="url(#yoyoWash)"/>
        <path d="M-38 -8 L38 -8 L31 36 L-31 36 Z" fill="none" stroke="#8a5c33" stroke-width="2.4"/>
        <path d="M-33 8 H33 M-22 -8 L-18 36 M0 -8 V36 M22 -8 L18 36"
              stroke="#8a5c33" stroke-width="1.6" opacity="0.6" fill="none"/>
        <path d="M-26 -8 Q0 -40 26 -8" fill="none" stroke="#8a5c33" stroke-width="3.4"/>
        <path d="M-42 -12 L42 -12 L40 -3 L-40 -3 Z" fill="#e0b483"/>
        <path d="M-42 -12 L42 -12 L40 -3 L-40 -3 Z" fill="none" stroke="#8a5c33" stroke-width="2.2"/>
        <path d="M-14 -12 L-11 -20 L-4 -13" fill="${PAPER}" stroke="${PENCIL}" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M4 -12 L9 -21 L15 -12" fill="${PAPER}" stroke="${PENCIL}" stroke-width="1.6" stroke-linejoin="round"/>
      </g>
    </svg>`;

  /* A drawn strawberry, used only when the painted prop is unavailable. */
  const BERRY_SVG = `
    <svg class="art-berry" viewBox="-22 -24 44 48" aria-hidden="true">
      <g filter="url(#yoyoEdge)">
        <path d="M0 22 C-14 12 -18 -6 -8 -12 C-3 -15 3 -15 8 -12 C18 -6 14 12 0 22 Z" fill="#fdf1e6"/>
        <path d="M0 22 C-14 12 -18 -6 -8 -12 C-3 -15 3 -15 8 -12 C18 -6 14 12 0 22 Z" fill="#d2553c" opacity="0.87" filter="url(#yoyoGrain)"/>
        <path d="M0 22 C-14 12 -18 -6 -8 -12 C-3 -15 3 -15 8 -12 C18 -6 14 12 0 22 Z" fill="url(#yoyoWash)"/>
        <path d="M0 22 C-14 12 -18 -6 -8 -12 C-3 -15 3 -15 8 -12 C18 -6 14 12 0 22 Z" fill="none" stroke="${PENCIL}" stroke-width="1.8" opacity="0.8"/>
        <path d="M-10 -12 L-4 -20 L0 -13 L4 -20 L10 -12 Q0 -7 -10 -12 Z" fill="#7f9a77" opacity="0.9"/>
        <path d="M-10 -12 L-4 -20 L0 -13 L4 -20 L10 -12 Q0 -7 -10 -12 Z" fill="none" stroke="${PENCIL}" stroke-width="1.4" opacity="0.75"/>
        <g fill="#ffe9bd" opacity="0.85">
          <ellipse cx="-5" cy="0" rx="1.5" ry="2"/><ellipse cx="4" cy="4" rx="1.5" ry="2"/>
          <ellipse cx="-1" cy="10" rx="1.5" ry="2"/><ellipse cx="6" cy="-4" rx="1.4" ry="1.9"/>
        </g>
      </g>
    </svg>`;

  /* A drawn plate, used only when the painted prop is unavailable. */
  const PLATE_SVG = `
    <svg class="art-plate" viewBox="-60 -34 120 68" aria-hidden="true">
      <g filter="url(#yoyoEdge)">
        <ellipse cx="0" cy="0" rx="56" ry="30" fill="#fdf7ec"/>
        <ellipse cx="0" cy="0" rx="56" ry="30" fill="url(#yoyoWash)"/>
        <ellipse cx="0" cy="0" rx="56" ry="30" fill="none" stroke="#e8a0b4" stroke-width="4" opacity="0.55"/>
        <ellipse cx="0" cy="0" rx="56" ry="30" fill="none" stroke="${PENCIL}" stroke-width="1.8" opacity="0.7"/>
        <ellipse cx="0" cy="1" rx="40" ry="20" fill="none" stroke="${PENCIL_SOFT}" stroke-width="1.2"/>
      </g>
    </svg>`;

  /* A paper tray for the counting frames, so the quantity model reads as a
     laid-out object rather than a spreadsheet. */
  function trayBackdrop(columns, rows) {
    return `
      <svg class="art-tray" viewBox="0 0 ${columns * 20} ${rows * 20}" preserveAspectRatio="none" aria-hidden="true">
        <rect x="1" y="1" width="${columns * 20 - 2}" height="${rows * 20 - 2}" rx="6"
              fill="#fdf7ec" filter="url(#yoyoGrain)"/>
        <rect x="1" y="1" width="${columns * 20 - 2}" height="${rows * 20 - 2}" rx="6"
              fill="none" stroke="${PENCIL_SOFT}" stroke-width="1.4"/>
      </svg>`;
  }

  /* Points and tangents along the sagging rope, so flags hang square to it. */
  function ropeCurve(from, to, sag) {
    const control = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 + sag };
    const at = (t) => ({
      x: (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * control.x + t * t * to.x,
      y: (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * control.y + t * t * to.y
    });
    const angleAt = (t) => {
      const dx = 2 * (1 - t) * (control.x - from.x) + 2 * t * (to.x - control.x);
      const dy = 2 * (1 - t) * (control.y - from.y) + 2 * t * (to.y - control.y);
      return Math.atan2(dy, dx) * 180 / Math.PI;
    };
    return {
      control,
      at,
      angleAt,
      path: `M${from.x} ${from.y} Q${control.x} ${control.y} ${to.x} ${to.y}`
    };
  }

  /* Evenly spaced hanging points for n flags, inset from the posts. */
  function hangPoints(curve, count, inset = 0.08) {
    const points = [];
    for (let i = 0; i < count; i += 1) {
      const t = inset + ((i + 0.5) / count) * (1 - inset * 2);
      points.push({ t, ...curve.at(t), angle: curve.angleAt(t) });
    }
    return points;
  }

  return {
    DEFS, PAPER, PENCIL, PENCIL_SOFT,
    PENNANT_W, PENNANT_H, PAPER_BOX, pennantImageRect,
    outline, decorationMark, decorationSvg,
    pennant, pennantBody, blankPennant,
    BERRY_SVG, PLATE_SVG, BASKET_SVG, trayBackdrop,
    ropeCurve, hangPoints
  };
});
