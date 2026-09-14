/* The Shadow Theatre: everything the child sees, measured.

   Two views of one stage, and they must agree, because they are the same
   theatre from two sides:

     the screen   what the audience sees - the painted scenery and the
                  shadow, standing on one ground line
     backstage    a side view of the lamp, the track and the paper puppet,
                  with the optional light-path guides

   Both are drawn in centimetres. Nothing here decides a quantity: every
   number arrives from shadow-model.js, and this file turns centimetres into
   the picture. A test can therefore ask for the box of any layer and compare
   it with H = h * D / d worked out on its own.

   The painting behind the screen is atmosphere (assets/shadow/rehearsal-v1.jpg
   was made with a deliberately EMPTY screen). The scenery, the shadow, the
   ground line and the readings are evidence and are drawn on top of it from
   the model - never painted into it, and never hidden under it.

   The screen's rectangle inside that painting was measured on the delivered
   1536 x 1024 file: the visible cloth runs to about x86..786, y250..679, and
   the conservative rectangle that no curtain or frame intrudes on is
   x150..730, y260..665. Those pixels, as fractions of the painting, are
   SCREEN below. They are measured against the CONTAINED picture, never the
   element around it, because object-fit letterboxes.

   The palette is the book's: warm paper, gouache wood, soft ink. A shadow is
   a soft dark shape, not a black cut-out, and the guide lines are drawn as
   what they are - a way of picturing where the light goes, labelled as such.
   No beam, no glow, no magic. */

(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.YoyoShadowArt = api;
})(typeof self !== "undefined" ? self : (typeof globalThis !== "undefined" ? globalThis : null), function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* the measured screen, and the scale                                  */
  /* ------------------------------------------------------------------ */

  const PAINTING = { width: 1536, height: 1024 };
  const SCREEN = {
    x0: 150 / PAINTING.width, x1: 730 / PAINTING.width,
    y0: 260 / PAINTING.height, y1: 665 / PAINTING.height
  };

  /* How much of the theatre the screen shows, top to bottom. The tallest
     shadow this book can make is 20 cm, so 24 cm leaves it standing clear of
     the top edge instead of running off the cloth. */
  const STAGE_CM = 24;

  /* Where the two things being compared stand along the ground line, as
     fractions of the screen's width. They are side by side, on one line, far
     enough apart that neither hides the other at its widest. */
  const SHADOW_AT = 0.34;
  const FLOWER_AT = 0.68;

  /* The layers, in the order they are drawn, and what each one is for. A
     picture is atmosphere; a measurement is evidence. Evidence is never
     painted into the atmosphere, and never sits underneath it. */
  const LAYERS = [
    { id: "painting", role: "atmosphere", from: "artwork" },
    { id: "screen", role: "frame", from: "measured" },
    { id: "ground", role: "evidence", from: "model" },
    { id: "scenery", role: "evidence", from: "model" },
    { id: "shadow", role: "evidence", from: "model" },
    { id: "readout", role: "evidence", from: "model", outsidePainting: true }
  ].map(Object.freeze);

  const INK = {
    shadow: "#4a4038",
    shadowEdge: "#3b332c",
    flower: "#c8922f",
    flowerDeep: "#a8761f",
    flowerLeaf: "#7f9668",
    leaf: "#7f9668",
    stem: "#6f8459",
    stemDeep: "#55684a",
    seed: "#8a6a3a",
    seedDark: "#5f4726",
    ground: "#8a6a3a",
    wood: "#c79f65",
    woodDeep: "#b08a52",
    woodEdge: "#8a6a3a",
    paper: "#fdf7ec",
    paperFold: "#e4d6bd",
    paperEdge: "#d9c49f",
    paperGrain: "#efe2c9",
    lamp: "#e8c877",
    lampCore: "#fffaf0",
    guide: "#a3714f"
  };

  const round = (n) => Math.round(n * 100) / 100;

  /* The rectangle the painting is really drawn in, inside its box. */
  function containedRect(img) {
    const boxW = img.clientWidth || img.offsetWidth || 0;
    const boxH = img.clientHeight || img.offsetHeight || 0;
    const natW = img.naturalWidth || PAINTING.width;
    const natH = img.naturalHeight || PAINTING.height;
    if (!boxW || !boxH || !natW || !natH) return null;
    const scale = Math.min(boxW / natW, boxH / natH);
    const w = natW * scale;
    const h = natH * scale;
    return { left: (boxW - w) / 2, top: (boxH - h) / 2, width: w, height: h };
  }

  /* The screen, in the pixels of that contained painting. */
  function screenBox(rect) {
    if (!rect) return null;
    return {
      left: rect.left + rect.width * SCREEN.x0,
      top: rect.top + rect.height * SCREEN.y0,
      width: rect.width * (SCREEN.x1 - SCREEN.x0),
      height: rect.height * (SCREEN.y1 - SCREEN.y0)
    };
  }

  /* How wide the screen is, in the theatre's own centimetres. It follows from
     the shape of the measured rectangle, so a centimetre is the same length
     across as it is up. */
  const stageWidthCm = (box) => (box && box.height ? STAGE_CM * (box.width / box.height) : STAGE_CM);

  /* ------------------------------------------------------------------ */
  /* what stands on the screen                                           */
  /* ------------------------------------------------------------------ */

  /* Both the shadow and the scenery are boxes in centimetres standing on the
     ground line. Their sizes come from the model; only where they stand
     along the line is decided here. */
  function shadowBox(model, config, mark, widthCm) {
    const height = model.shadowHeight(config, mark);
    const width = model.shadowWidth(config, mark);
    return {
      role: "shadow",
      widthCm: round(width),
      heightCm: round(height),
      leftCm: round(widthCm * SHADOW_AT - width / 2),
      bottomCm: 0
    };
  }

  function sceneryBox(model, config, widthCm) {
    /* the painted sunflower is drawn about half as wide as it is tall, which
       is the prop, not a measurement the story asks about */
    const width = config.sunflower / 2;
    return {
      role: "scenery",
      widthCm: round(width),
      heightCm: round(config.sunflower),
      leftCm: round(widthCm * FLOWER_AT - width / 2),
      bottomCm: 0
    };
  }

  /* THE LITTLE DOOR.

     A picture on the flat screen, not a real door: a paper garden wall with an
     opening cut out of it. The opening is the only part that matters to the
     story, so it is the part that is measured - exactly `doorway` centimetres
     high and `doorWidth` across, standing on the same ground line as the
     shadow. The wall around it is decoration and is drawn OUTWARDS from the
     opening, so no amount of prettying it up can quietly make the gap bigger.

     The hole is a real hole: one path, two rings, even-odd fill. Nothing is
     painted over the opening, so what a browser measures inside it is what the
     shadow really has to pass through. */
  function doorBox(model, config, widthCm) {
    return {
      role: "door",
      widthCm: round(config.doorWidth),
      heightCm: round(config.doorway),
      leftCm: round(widthCm * FLOWER_AT - config.doorWidth / 2),
      bottomCm: 0
    };
  }

  /* The opening, as a rectangle standing on the ground line. This is what the
     shadow is checked against, and it is the same rectangle the drawing cuts
     out below. */
  function doorOutline(box) {
    return {
      left: round(box.leftCm),
      top: round(STAGE_CM - box.heightCm),
      width: round(box.widthCm),
      height: round(box.heightCm)
    };
  }

  function doorSvg(box) {
    const gap = doorOutline(box);
    /* the wall grows outwards from the opening and never inwards */
    const jamb = round(gap.width * 0.34);
    const lintel = round(gap.height * 0.16);
    const wall = {
      left: round(gap.left - jamb),
      top: round(gap.top - lintel),
      width: round(gap.width + jamb * 2),
      height: round(gap.height + lintel)
    };
    const right = round(gap.left + gap.width);
    const wallRight = round(wall.left + wall.width);
    const ground = STAGE_CM;
    /* the garden behind: a path leading away, drawn only inside the opening */
    const pathTop = round(gap.top + gap.height * 0.42);
    const inset = round(gap.width * 0.22);
    const bricks = [0.34, 0.62, 0.86].map((f) => {
      const y = round(wall.top + wall.height * f);
      return `<path d="M ${wall.left} ${y} H ${gap.left} M ${right} ${y} H ${wallRight}"`
        + ` stroke="${INK.stemDeep}" stroke-width="${round(gap.height * 0.012)}"`
        + ` stroke-opacity="0.35" fill="none"/>`;
    }).join("");
    return `<g class="shadow-door" data-layer="scenery">`
      /* what can be seen through the opening, clipped to it by being drawn
         inside it and nowhere else */
      + `<rect x="${gap.left}" y="${gap.top}" width="${gap.width}" height="${gap.height}"`
      + ` fill="${INK.flowerLeaf}" fill-opacity="0.18"/>`
      + `<path d="M ${round(gap.left + inset)} ${ground} L ${round(right - inset)} ${ground}`
      + ` L ${round(right - inset * 1.7)} ${pathTop} L ${round(gap.left + inset * 1.7)} ${pathTop} Z"`
      + ` fill="${INK.stem}" fill-opacity="0.28"/>`
      /* the wall itself: outer ring clockwise, opening anticlockwise, so the
         opening is genuinely empty rather than covered by a paler rectangle */
      + `<path fill-rule="evenodd" fill="${INK.flower}" fill-opacity="0.9" d="`
      + `M ${wall.left} ${wall.top} H ${wallRight} V ${ground} H ${wall.left} Z `
      + `M ${gap.left} ${gap.top} V ${ground} H ${right} V ${gap.top} Z"/>`
      + bricks
      + `</g>`;
  }

  /* A PAPER CUT-OUT VISITOR.

     The whole visible outline fills exactly the width and height it is given,
     and the same outline is used three times: dark on the screen as the
     shadow, pale in the side view as the paper itself, and again on the
     holder the child takes hold of. One shape, three uses - which is what
     makes the prop and its shadow read as one thing.

     The first version was a straight-sided figure that looked like a road
     sign rather than something cut out of paper for a play. This one is a
     rounded paper doll in a long coat: the outline is a dense polygon rather
     than a curve, so at these sizes it reads as smooth while every one of its
     points is still an exact number this file can measure. That matters -
     an arc's bounding box is approximate, and the whole point of the outline
     is that an independent measurement of the DRAWN silhouette agrees with
     H = h * D / d.

     The points below are fractions: across, of the box's width from its left
     edge; down, of the body's own height from the neck to the feet. The right
     half is written out and the left half is its mirror, so the figure is
     symmetrical by construction. The hand reaches 1 - the full width - and
     the hem reaches the floor, so the extremes are exact. */
  const BODY_RIGHT = [
    [0.560, 0.000], [0.606, 0.006], [0.648, 0.024], [0.686, 0.053],
    [0.727, 0.093], [0.775, 0.142], [0.828, 0.196], [0.878, 0.248],
    [0.930, 0.297], [0.972, 0.336], [1.000, 0.372], [0.996, 0.408],
    [0.972, 0.424], [0.936, 0.416], [0.888, 0.384], [0.836, 0.342],
    [0.784, 0.297], [0.744, 0.262], [0.722, 0.300], [0.712, 0.360],
    [0.710, 0.440], [0.717, 0.530], [0.730, 0.620], [0.748, 0.706],
    [0.768, 0.784], [0.788, 0.854], [0.804, 0.916], [0.814, 0.966],
    [0.816, 0.994], [0.812, 1.000]
  ];

  function puppetShapes(box, groundY) {
    const ground = typeof groundY === "number" ? groundY : STAGE_CM;
    const w = box.widthCm;
    const h = box.heightCm;
    const x = box.leftCm;
    /* y grows downward in the drawing; the feet sit on the ground line */
    const top = ground - h - box.bottomCm;
    const foot = ground - box.bottomCm;
    const cx = x + w / 2;
    /* the head is the topmost thing: its circle touches the top of the box */
    const headR = Math.min(w * 0.28, h * 0.16);
    const headCy = top + headR;
    /* the body runs from just under the chin to the floor */
    const neck = headCy + headR * 0.86;
    const span = foot - neck;
    const right = BODY_RIGHT.map(([fx, fy]) => [x + w * fx, neck + span * fy]);
    const left = BODY_RIGHT.slice().reverse().map(([fx, fy]) => [x + w * (1 - fx), neck + span * fy]);
    return { headR, headCy, cx, top, foot, neck, span, body: right.concat(left) };
  }

  /* Where the drawn figure really reaches, worked out from the same shapes
     that are drawn. It must be the box the model asked for. */
  function shadowOutline(box, groundY) {
    const parts = puppetShapes(box, groundY);
    const xs = parts.body.map((p) => p[0]).concat([parts.cx - parts.headR, parts.cx + parts.headR]);
    const ys = parts.body.map((p) => p[1]).concat([parts.headCy - parts.headR, parts.headCy + parts.headR]);
    const left = Math.min(...xs);
    const right = Math.max(...xs);
    const top = Math.min(...ys);
    const bottom = Math.max(...ys);
    return { left: round(left), top: round(top), width: round(right - left), height: round(bottom - top) };
  }

  /* The outline again, with the box divided out: the same numbers whatever
     size the puppet is drawn at. A badge that carries "the same shape" can be
     compared against this, rather than against the fact that it called the
     same function. */
  function puppetOutline(box, groundY) {
    const parts = puppetShapes(box, groundY);
    const h = box.heightCm;
    const x = box.leftCm;
    const top = parts.foot - h;
    /* deliberately NOT rounded: two drawings of the same shape at different
       sizes differ in the last bits of a float, and rounding turns that into a
       false difference at a boundary. A comparison uses a tolerance. */
    const at = ([px, py]) => [(px - x) / h, (py - top) / h];
    return {
      ratio: box.widthCm / h,
      head: at([parts.cx, parts.headCy]).concat([parts.headR / h]),
      body: parts.body.map(at)
    };
  }

  const pointsOf = (body) => body.map(([x, y]) => `${round(x)} ${round(y)}`).join(" L ");

  /* The shadow. One flat dark shape and nothing else: no face, no clothes, no
     glow and no soft rim. A soft rim would be a picture of a penumbra, and
     this model is a point lamp with none. */
  function puppetSvg(box) {
    const parts = puppetShapes(box);
    return `<g class="shadow-figure" data-layer="shadow" fill="${INK.shadow}" fill-opacity="0.82">`
      + `<circle cx="${round(parts.cx)}" cy="${round(parts.headCy)}" r="${round(parts.headR)}"/>`
      + `<path d="M ${pointsOf(parts.body)} Z"/>`
      + `</g>`;
  }

  /* The paper puppet: the SAME outline, in paper rather than dark.

     Every mark on it - the edge, the fold of the coat, the grain of the paper
     - is CLIPPED to that outline. An earlier version drew the edge as an
     ordinary stroke, which a browser centres on the path: a 0.26 cm pen put
     0.13 cm of ink outside the silhouette all the way round, so the paper the
     child saw was wider and taller than the paper the model measured, while
     getBBox - which ignores stroke - still reported the right number. The
     clip removes the ambiguity: what is drawn cannot be outside what is
     measured, and the drawn edge is the inner half of the pen. */
  function puppetProp(box, groundY, clipId) {
    const parts = puppetShapes(box, groundY);
    const id = clipId || "shadow-paper-clip";
    const w = box.widthCm;
    const h = box.heightCm;
    const outline = `<path d="M ${pointsOf(parts.body)} Z"/>`
      + `<circle cx="${round(parts.cx)}" cy="${round(parts.headCy)}" r="${round(parts.headR)}"/>`;
    const pen = round(Math.max(w * 0.12, 0.3));
    const grain = [0.30, 0.46, 0.62, 0.78].map((fy) => {
      const y = round(parts.neck + parts.span * fy);
      return `<path d="M ${round(box.leftCm)} ${y} L ${round(box.leftCm + w)} ${y}"`
        + ` stroke="${INK.paperGrain}" stroke-width="${round(h * 0.012)}" stroke-opacity="0.55"/>`;
    }).join("");
    /* The definition sits outside the group so that the group holds nothing
       but rendered geometry: getBBox then measures the paper and only the
       paper. The clip is on the group itself, so no ink of any kind - edge,
       grain or fold - can land outside the measured silhouette. */
    return `<defs><clipPath id="${id}">${outline}</clipPath></defs>`
      + `<g class="shadow-puppet" data-layer="puppet" clip-path="url(#${id})">`
      + `<g fill="${INK.paper}">${outline}</g>`
      /* the paper's own grain, cut off at the edge like a real cut-out */
      + grain
      /* the warm inner edge: a pen on the outline, of which the clip keeps
         only the half that lies inside */
      + `<g fill="none" stroke="${INK.paperEdge}" stroke-width="${pen}"`
      + ` stroke-linejoin="round">${outline}</g>`
      /* and the fold down the coat, well clear of both edges */
      + `<path d="M ${round(parts.cx)} ${round(parts.neck + parts.span * 0.24)}`
      + ` L ${round(parts.cx)} ${round(parts.neck + parts.span * 0.92)}"`
      + ` stroke="${INK.paperFold}" stroke-width="${round(Math.max(w * 0.05, 0.12))}"`
      + ` fill="none" stroke-opacity="0.9"/>`
      + `</g>`;
  }

  /* THE SUNFLOWER, AS A PAINTED PAPER PROP.

     Its whole visible outline is exactly the height the model gives, standing
     on the same ground line as the shadow. That is the one number the story
     compares, so it is exact by construction: one petal points straight up and
     reaches the stated outer radius, so the top of the drawing IS the top of
     the flower. The petals beside it are deliberately a little shorter and a
     little uneven, which is what stops it looking like a printed icon; being
     shorter, none of them can reach past the top.

     Everything else - the crease in each petal, the seeds, the leaf veins, the
     fold in the stem - is drawn strictly inside a shape that is already part
     of the outline, so none of it can move the measured edge. */
  function flowerShapes(box) {
    const h = box.heightCm;
    const w = box.widthCm;
    const x = box.leftCm;
    const top = STAGE_CM - h - box.bottomCm;
    const foot = STAGE_CM - box.bottomCm;
    const cx = x + w / 2;
    /* the head, petals included, is a quarter of the flower's height across
       its radius, which keeps the whole thing inside the declared width */
    const outer = h * 0.25;
    const headCy = top + outer;
    const petals = [];
    const count = 12;
    for (let i = 0; i < count; i += 1) {
      /* one petal points exactly upwards and is the longest, so the top of
         the drawing is the top of the flower rather than wherever an arc
         happened to land */
      const degrees = -90 + (360 * i) / count;
      const angle = (degrees * Math.PI) / 180;
      const reach = i === 0 ? 1 : [0.9, 0.965, 0.925][i % 3];
      petals.push({
        cx: cx + Math.cos(angle) * outer * 0.62 * reach,
        cy: headCy + Math.sin(angle) * outer * 0.62 * reach,
        rx: outer * 0.38 * reach,
        ry: outer * (i % 2 ? 0.2 : 0.235),
        degrees
      });
    }
    /* a stem with a bend in it, drawn as a narrow ribbon of points rather
       than a rectangle: the same dense-polygon trick as the puppet, so it can
       curve and still be measured exactly */
    const stemTop = headCy;
    const lean = w * 0.055;
    const half = w * 0.045;
    const spine = [0, 0.22, 0.44, 0.64, 0.82, 1].map((t) => ({
      t,
      x: cx + Math.sin(t * Math.PI * 0.92) * lean,
      y: stemTop + (foot - stemTop) * t
    }));
    const stem = spine.map((s) => [s.x - half, s.y])
      .concat(spine.slice().reverse().map((s) => [s.x + half, s.y]));
    return {
      cx, top, foot, headCy, outer, petals, spine, stem,
      leaves: [
        { cx: cx - w * 0.2, cy: top + h * 0.62, rx: w * 0.26, ry: h * 0.055, degrees: -18 },
        { cx: cx + w * 0.2, cy: top + h * 0.8, rx: w * 0.21, ry: h * 0.045, degrees: 16 }
      ]
    };
  }

  /* The same measurement for the flower: every petal's farthest point along
     its own axis is its centre plus rx, and the petal at the top is vertical,
     so the outline's top is exactly headCy - outer. */
  function sceneryOutline(box) {
    const parts = flowerShapes(box);
    let left = Math.min(...parts.stem.map((p) => p[0]));
    let right = Math.max(...parts.stem.map((p) => p[0]));
    let top = parts.headCy - parts.outer;
    let bottom = parts.foot;
    const spread = (one) => {
      const angle = (one.degrees * Math.PI) / 180;
      /* the half-extent of a turned ellipse along each axis */
      const dx = Math.sqrt((one.rx * Math.cos(angle)) ** 2 + (one.ry * Math.sin(angle)) ** 2);
      const dy = Math.sqrt((one.rx * Math.sin(angle)) ** 2 + (one.ry * Math.cos(angle)) ** 2);
      left = Math.min(left, one.cx - dx);
      right = Math.max(right, one.cx + dx);
      top = Math.min(top, one.cy - dy);
      bottom = Math.max(bottom, one.cy + dy);
    };
    parts.petals.forEach(spread);
    parts.leaves.forEach(spread);
    return { left: round(left), top: round(top), width: round(right - left), height: round(bottom - top) };
  }

  const turned = (one, fill, extra) =>
    `<ellipse cx="${round(one.cx)}" cy="${round(one.cy)}" rx="${round(one.rx)}"`
    + ` ry="${round(one.ry)}" transform="rotate(${round(one.degrees)} ${round(one.cx)}`
    + ` ${round(one.cy)})" fill="${fill}"${extra || ""}/>`;

  function flowerSvg(box) {
    const parts = flowerShapes(box);
    const h = box.heightCm;
    const petals = parts.petals.map((one) => turned(one, INK.flower)).join("");
    /* the crease down each petal: 62% of it, same centre, same turn, so it
       cannot reach the petal's own edge */
    const creases = parts.petals.map((one) => turned(
      { ...one, rx: one.rx * 0.62, ry: one.ry * 0.34 }, INK.flowerDeep, ' fill-opacity="0.5"'
    )).join("");
    const seedR = parts.outer * 0.44;
    const seeds = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
      const angle = (i * Math.PI) / 4;
      const ring = i % 2 ? 0.34 : 0.62;
      return `<circle cx="${round(parts.cx + Math.cos(angle) * seedR * ring)}"`
        + ` cy="${round(parts.headCy + Math.sin(angle) * seedR * ring)}"`
        + ` r="${round(seedR * 0.15)}" fill="${INK.seedDark}" fill-opacity="0.55"/>`;
    }).join("");
    const leaves = parts.leaves.map((one) => turned(one, INK.flowerLeaf)).join("");
    const veins = parts.leaves.map((one) => turned(
      { ...one, rx: one.rx * 0.74, ry: one.ry * 0.22 }, INK.stemDeep, ' fill-opacity="0.45"'
    )).join("");
    /* the fold down the stem, following its bend and inset from both edges */
    const fold = parts.spine.map((s, i) =>
      `${i ? "L" : "M"} ${round(s.x)} ${round(s.y)}`).join(" ");
    return `<g class="shadow-flower" data-layer="scenery">`
      + `<path d="M ${pointsOf(parts.stem)} Z" fill="${INK.stem}"/>`
      + `<path d="${fold}" fill="none" stroke="${INK.stemDeep}"`
      + ` stroke-width="${round(h * 0.008)}" stroke-opacity="0.5"/>`
      + leaves
      + veins
      + petals
      + creases
      + `<circle cx="${round(parts.cx)}" cy="${round(parts.headCy)}" r="${round(seedR)}"`
      + ` fill="${INK.seed}"/>`
      + seeds
      + `</g>`;
  }

  /* Everything on the screen, in one centimetre-space drawing. */
  /* WHERE THE VISITOR STANDS IN THE PLAY.

     The doorway performance is not a change of words with the same picture
     behind it. The shadow really moves along the bottom of the screen - the
     one thing a shadow on a flat screen can do without changing its size -
     and where it ends up is decided by whether it actually fits:

       through   centred in the opening, standing in the garden behind it
       outside   stopped beside the doorway, clear of the opening

     Everything else is untouched. The puppet is at the same mark, so the
     shadow is the same height and the same width it was a moment ago, drawn
     from the same outline; the opening is the same opening. Nothing is scaled
     to make it fit, nothing is cropped to hide the part that does not, and
     the picture cannot disagree with the model because both come from the
     same two numbers. */
  function performanceLeft(model, config, mark, widthCm, through) {
    const width = model.shadowWidth(config, mark);
    const gap = doorBox(model, config, widthCm);
    const middle = gap.leftCm + gap.widthCm / 2;
    if (through) return round(middle - width / 2);
    /* beside it: clear of the opening's near edge by a quarter of the
       opening's own width, so the two shapes never overlap */
    return round(gap.leftCm - gap.widthCm * 0.25 - width);
  }

  /* A CLOSER LOOK AT THE SAME SCREEN.

     At 375 px the whole 36 cm screen is about 350 px across, so a 6 cm
     visitor came out around 20 px tall: the arithmetic was right and the
     child could not see it. This crops the view to the part of the cloth the
     page is about.

     It is a crop and nothing else. Every object keeps its own size in
     centimetres and its own place on the ground line, so the shadow, the
     doorway and the sunflower all grow by exactly the same factor; nothing is
     enlarged on its own, nothing is shrunk to fit beside it, and no physical
     value changes. It is the same apparatus seen from closer, not a second
     one.

     The window keeps the bottom of the screen, because that is where
     everything stands, and its shape is handed back so the frame around it
     can take the same shape - a crop of a different shape than its frame
     would stretch a centimetre across differently from a centimetre up, and
     then the picture would be lying about the geometry. */
  const CLOSE = { aspect: 1.8, headroom: 1.2, margin: 1.25 };

  function closeUpWindow(model, state, widthCm) {
    const shadow = shadowBox(model, state.config, state.mark, widthCm);
    const door = state.scenery === "doorway";
    const scenery = door
      ? doorBox(model, state.config, widthCm)
      : sceneryBox(model, state.config, widthCm);
    if (state.performing) {
      shadow.leftCm = performanceLeft(model, state.config, state.mark, widthCm,
        model.doorFit(state.config, state.mark).fits);
    }
    // A before/after pair shares one crop: changing scenery must not zoom the shadow.
    const props = state.compareScenery
      ? [sceneryBox(model, state.config, widthCm), doorBox(model, state.config, widthCm)]
      : [scenery];
    const left = Math.min(shadow.leftCm, ...props.map(prop => prop.leftCm));
    const right = Math.max(shadow.leftCm + shadow.widthCm,
      ...props.map(prop => prop.leftCm + prop.widthCm));
    const tallest = Math.max(shadow.heightCm, ...props.map(prop => prop.heightCm));

    /* tall enough for the tallest thing, wide enough for both of them, and
       the same shape as the frame it will be drawn in */
    let h = tallest * CLOSE.headroom;
    const needed = (right - left) * CLOSE.margin;
    if (h * CLOSE.aspect < needed) h = needed / CLOSE.aspect;
    h = Math.min(h, STAGE_CM);
    let w = h * CLOSE.aspect;
    if (w > widthCm) { w = widthCm; h = w / CLOSE.aspect; }

    /* centred on the two of them, and never past the edge of the cloth */
    const middle = (left + right) / 2;
    let x = middle - w / 2;
    x = Math.max(0, Math.min(x, widthCm - w));
    return {
      x: round(x), y: round(STAGE_CM - h), w: round(w), h: round(h),
      aspect: round(w / h),
      /* how much bigger everything is than in the whole-screen view */
      scale: round(widthCm / w)
    };
  }

  function screenSvg(model, state, box) {
    const widthCm = stageWidthCm(box);
    const shadow = shadowBox(model, state.config, state.mark, widthCm);
    /* Which picture is in the frame is a fact about the stage, carried by the
       rehearsal itself. The shadow, the ground line and the geometry are
       exactly the same either way: only the painting behind changes. */
    const door = state.scenery === "doorway";
    const scenery = door
      ? doorBox(model, state.config, widthCm)
      : sceneryBox(model, state.config, widthCm);

    /* In the play, the visitor walks. Its SIZE is not touched - only where it
       stands along the same ground line - and where it stands is whether it
       really fits, not what the words would like to be true. */
    const playing = door && state.performing;
    if (playing) {
      const through = model.doorFit(state.config, state.mark).fits;
      shadow.leftCm = performanceLeft(model, state.config, state.mark, widthCm, through);
      shadow.role = through ? "shadow-inside" : "shadow-outside";
    }

    /* the same picture, cropped closer when the page's job is to look at the
       result rather than to work on it */
    const near = state.closeUp ? closeUpWindow(model, state, widthCm) : null;
    const view = near
      ? `${near.x} ${near.y} ${near.w} ${near.h}`
      : `0 0 ${round(widthCm)} ${STAGE_CM}`;
    return {
      widthCm: round(widthCm),
      heightCm: STAGE_CM,
      /* the crop, so the frame can take the same shape and a test can measure
         how big the visitor really comes out */
      closeUp: near,
      shadow,
      scenery,
      /* what the play actually shows, so it can be measured rather than
         taken on trust from the sentence underneath it */
      performance: playing
        ? { through: model.doorFit(state.config, state.mark).fits }
        : null,
      shadowOutline: shadowOutline(shadow),
      sceneryOutline: door ? doorOutline(scenery) : sceneryOutline(scenery),
      /* preserveAspectRatio is none because the screen's own rectangle was
         measured to this shape: a centimetre up and a centimetre across are
         the same length in it, so nothing is stretched by saying so. */
      svg: `<svg class="shadow-screen-art" viewBox="${view}"`
        + ` preserveAspectRatio="none" aria-hidden="true" focusable="false">`
        + (door ? doorSvg(scenery) : flowerSvg(scenery))
        + puppetSvg(shadow)
        + `<path class="shadow-ground" data-layer="ground" d="M 0 ${STAGE_CM} H ${round(widthCm)}"`
        + ` stroke="${INK.ground}" stroke-width="0.14" stroke-opacity="0.55"/>`
        + `</svg>`
    };
  }

  /* ------------------------------------------------------------------ */
  /* the view from the side                                              */
  /* ------------------------------------------------------------------ */

  /* The lamp at 0, the screen at D, the puppet at its mark, all standing on
     the same line the shadow's feet stand on. The optional guides are the two
     straight lines from the lamp past the puppet's top and bottom edges: they
     meet the screen exactly at the height the model gives, which is the whole
     point of showing them. */
  /* The label sizes are in the diagram's own centimetres, and the view box is
     kept only as wide as the labels really need, because that is what decides
     how big they come out on a phone. At 375 px the side view is about 320 px
     wide for 82 units across, so a 4-unit label is about 15.6 px on screen.
     The old 1.5-unit labels in a 78-unit box came out at about 6 px, which is
     not a label at all, and the lamp's name sat below the bottom edge.

     The names sit on THREE rows, and that is the point of them. At true scale
     the 15 and 20 marks are only 5 units apart, so at a readable size their
     numbers crowd each other. Alternating rows gives every label its own band:
     the 15 and 30 marks on the first, the 20 mark with the two fixed things on
     the second, and the puppet - the only label that moves - alone on the
     third. All three bands are inside the view box, so nothing is cut off.

     The gap between the rows is a real line box, not a guess from how many
     letters a word has. A browser measures a piece of SVG text by its font's
     own box - ascender to descender - which is taller than the letters that
     happen to be in it: about 1.3 to 1.4 times the font size for a serif. The
     first attempt spaced the rows 5 units apart for a 4-unit font and the real
     boxes of "20" and "puppet" still touched at every width. LINE_BOX below is
     a deliberately generous allowance for that box, and ROW_GAP clears it. */
  const LINE_BOX = 1.5;   /* x font size: taller than any of these fonts' boxes */
  const ROW_GAP = 1.8;    /* x font size: the line box, plus room to see */

  const SIDE = {
    top: 24,        /* the y of 0 cm; the drawing runs 0..top upward */
    left: -6,       /* room for the lamp's own label */
    right: 16,      /* room past the screen for its name and the height */
    below: 24,      /* room under the track for the base and three name rows */
    font: 4,
    lineBox: 4 * LINE_BOX,
    /* the wooden base the whole theatre stands on, entirely BELOW the line the
       lamp, the puppet's feet and the shadow's feet share */
    baseDepth: 0.55,
    holderDepth: 1.1,
    markRow: 6.6,    /* the marks at an even index: 15 and 30 */
    midRow: 13.8,    /* the mark between them, and the lamp and the screen */
    nameRow: 21      /* the puppet, which is the label that moves */
  };

  /* Where each label really sits, AND how big its box really is, so that a
     test can check they do not collide rather than someone looking at a
     screenshot and deciding they look fine. The box is the font's, not the
     letters'. */
  const labelBox = (one) => ({
    text: one.text,
    left: one.x - (one.text.length * SIDE.font * 0.62) / 2,
    right: one.x + (one.text.length * SIDE.font * 0.62) / 2,
    /* a serif box sits roughly three quarters above its baseline */
    top: one.y - SIDE.lineBox * 0.78,
    bottom: one.y + SIDE.lineBox * 0.28
  });

  function sideLabels(model, state) {
    const d = state.mark;
    const floor = SIDE.top;
    const rows = model.MARKS.map((mark, i) => ({
      text: String(mark),
      x: mark,
      y: floor + (i % 2 === 0 ? SIDE.markRow : SIDE.midRow),
      anchor: "middle"
    }));
    return rows.concat([
      { text: "lamp", x: 0, y: floor + SIDE.midRow, anchor: "middle" },
      { text: "screen", x: model.LAMP_TO_SCREEN, y: floor + SIDE.midRow, anchor: "middle" },
      { text: "puppet", x: d, y: floor + SIDE.nameRow, anchor: "middle" }
    ]);
  }

  function backstageSvg(model, state, { guides = false, moving = false } = {}) {
    const D = model.LAMP_TO_SCREEN;
    const h = state.config.puppet;
    const d = state.mark;
    const H = model.shadowHeight(state.config, d);

    const y = (cm) => round(SIDE.top - cm);
    const floor = y(0);
    const label = (x, yy, text, extra) =>
      `<text x="${round(x)}" y="${round(yy)}" font-size="${SIDE.font}" text-anchor="middle"`
      + ` fill="${INK.woodEdge}"${extra || ""}>${text}</text>`;

    /* Each mark's tick runs down to just above its own label, so a number on
       the lower row still plainly belongs to its place on the track. Every
       part of it starts AT the floor line and goes down: see the note on the
       base below. */
    const marks = model.MARKS.map((mark, i) => {
      const on = Math.abs(mark - d) < 0.001;
      const row = i % 2 === 0 ? SIDE.markRow : SIDE.midRow;
      const drop = row - SIDE.lineBox * 0.9;
      return `<g class="shadow-mark${on ? " is-here" : ""}" data-mark="${mark}">`
        + `<rect x="${round(mark - 0.11)}" y="${floor}" width="0.22" height="${round(drop)}"`
        + ` fill="${INK.woodEdge}" fill-opacity="0.7"/>`
        + label(mark, floor + row, mark)
        + `</g>`;
    }).join("");

    const guideLines = guides
      ? `<g class="shadow-guides" data-layer="guides">`
        + `<path d="M 0 ${floor} L ${D} ${floor}" stroke="${INK.guide}" stroke-width="0.18"`
        + ` stroke-dasharray="1.2 1" fill="none"/>`
        + `<path d="M 0 ${floor} L ${D} ${y(H)}" stroke="${INK.guide}" stroke-width="0.18"`
        + ` stroke-dasharray="1.2 1" fill="none"/>`
        + `<path d="M ${d} ${y(h)} L ${d} ${floor}" stroke="${INK.guide}" stroke-width="0.14"`
        + ` stroke-dasharray="0.8 0.8" fill="none"/></g>`
      : "";

    const viewBox = `${SIDE.left} 0 ${D + SIDE.right - SIDE.left} ${SIDE.top + SIDE.below}`;

    return {
      lampAt: 0,
      screenAt: D,
      puppetAt: d,
      puppetCm: h,
      shadowCm: H,
      guides: Boolean(guides),
      viewBox,
      /* everything that must stay inside the view box, so it can be checked
         rather than eyeballed */
      labelBottom: round(floor + SIDE.nameRow + SIDE.lineBox * 0.28),
      viewBottom: SIDE.top + SIDE.below,
      labels: sideLabels(model, state),
      /* what a test can compare against the floor line without guessing */
      floorY: floor,
      baseTop: floor,
      holderTop: round(floor + SIDE.baseDepth),
      svg: `<svg class="shadow-side-art" viewBox="${viewBox}"`
        + ` aria-hidden="true" focusable="false">`
        /* THE BASE BOARD, AND WHY IT IS WHERE IT IS.

           The lamp's centre, the puppet's feet and the shadow's feet are one
           line - that is what keeps H = h * D / d true and the shadow's feet
           on the ground for every d. Everything above that line, between the
           lamp and the screen, is in the light. So every solid thing that is
           not the paper puppet is drawn wholly BELOW it: the board's top face
           IS the floor line, and the holder runs under the board.

           A first attempt drew a pretty wooden rail straddling the line and a
           holder rising above it. Both were opaque objects standing in the
           modelled light path while the projection was still worked out from
           the paper alone - a picture that could not happen. Calling the
           drawing a diagram would not have made it true. */
        + `<rect x="${round(SIDE.left + 1)}" y="${floor}" width="${round(D + SIDE.right - SIDE.left - 3)}"`
        + ` height="${round(SIDE.baseDepth)}" fill="${INK.wood}" stroke-width="0"/>`
        + `<rect x="${round(SIDE.left + 1)}" y="${round(floor + SIDE.baseDepth * 0.62)}"`
        + ` width="${round(D + SIDE.right - SIDE.left - 3)}" height="${round(SIDE.baseDepth * 0.3)}"`
        + ` fill="${INK.woodDeep}" fill-opacity="0.55"/>`
        + marks
        + guideLines
        /* The lamp. Its housing is drawn behind the source - to the left of
           it, away from the screen - so that nothing opaque stands between the
           lamp and the puppet. The small bright dot IS the source, on the
           floor line, where the model puts it. */
        + `<path class="shadow-lamp" data-layer="lamp" d="M 0 ${round(floor - 1.6)}`
        + ` A 1.6 1.6 0 0 0 -1.6 ${floor} L 0 ${floor} Z" fill="${INK.lamp}"`
        + ` stroke="${INK.woodEdge}" stroke-width="0.18" stroke-linejoin="round"/>`
        + `<circle cx="0" cy="${floor}" r="0.42" fill="${INK.lampCore}"/>`
        + label(0, floor + SIDE.midRow, "lamp")
        /* The paper puppet, at its real height, standing on the board. It is
           drawn from the SAME outline as the shadow it casts, turned towards
           us so its shape can be read; the caption beside the diagram says so,
           because a flat puppet really faces the screen and would be an edge
           from here. */
        + puppetProp({ leftCm: d - h / 4, widthCm: h / 2, heightCm: h, bottomCm: 0 },
          SIDE.top, "shadow-paper-side")
        /* the holder the child slides, running under the board in its groove */
        + `<rect class="shadow-holder" data-layer="holder" x="${round(d - h / 3)}"`
        + ` y="${round(floor + SIDE.baseDepth)}" width="${round((2 * h) / 3)}"`
        + ` height="${round(SIDE.holderDepth)}" rx="0.35" fill="${INK.wood}"`
        /* stroke-width is stated as zero rather than left out: a browser
           reports the initial 1 user unit for an unpainted stroke, and half of
           that would put the holder's declared top above the floor line */
        + ` stroke="none" stroke-width="0"/>`
        + `<rect x="${round(d - h / 4)}" y="${round(floor + SIDE.baseDepth + 0.22)}"`
        + ` width="${round(h / 2)}" height="0.22" fill="${INK.woodDeep}" fill-opacity="0.5"/>`
        + label(d, floor + SIDE.nameRow, "puppet")
        /* the screen, and the shadow's height on it */
        + `<path d="M ${D} ${y(SIDE.top - 1)} V ${floor}" stroke="${INK.woodEdge}" stroke-width="0.4"/>`
        + `<path class="shadow-height" data-layer="height" d="M ${D} ${floor} V ${y(H)}"`
        + ` stroke="${INK.shadow}" stroke-width="0.8" stroke-opacity="0.75"/>`
        + label(D, floor + SIDE.midRow, "screen")
        /* While a hand is still on the holder the height is not a whole
           centimetre, so the number is put away rather than printed as a long
           fraction or rounded into a claim it cannot support. The dark line
           beside the screen keeps showing how tall the shadow is. */
        + (moving ? "" : `<text class="shadow-height-label" x="${round(D + 1.4)}"`
          + ` y="${round(y(H) + 1)}" font-size="${SIDE.font}"`
          + ` fill="${INK.shadow}">${model.cm(H)}</text>`)
        + `</svg>`
    };
  }

  /* ------------------------------------------------------------------ */
  /* the strip the child slides                                          */
  /* ------------------------------------------------------------------ */

  /* The side view is drawn at true scale, so the part of the track the puppet
     can actually stand on - 15 cm to 30 cm out of 60 - is a quarter of it. On
     a phone that is about sixty pixels, which is not something a finger can
     hold. The strip below the screen carries only that part, spread across its
     whole width.

     It is a magnifying glass, not a different theatre: the position along the
     strip is exactly linear in d, the same d the drawing and the model use, so
     equal distances on the strip are equal distances on the track. The strip
     says in words that it is the 15-to-30 part drawn larger, and the side view
     keeps the real proportions beside it. */
  function slideFraction(model, d) {
    const near = model.TRACK_NEAR;
    const far = model.TRACK_FAR;
    if (far === near) return 0;
    const at = model.clampToTrack(d);
    return (at - near) / (far - near);
  }

  /* And the inverse, for turning where a finger is into where the puppet is. */
  function slideDistance(model, fraction) {
    const near = model.TRACK_NEAR;
    const far = model.TRACK_FAR;
    const at = Number(fraction);
    if (!Number.isFinite(at)) return near;
    return model.clampToTrack(near + (far - near) * at);
  }

  /* Where each mark sits along the strip, as a percentage. On the strip the
     three marks land at 0%, 33.3% and 100%: far enough apart that their
     numbers are separate at any width, which is the other reason for it. */
  const slideMarks = (model) => model.MARKS.map((mark) => ({
    mark,
    percent: round(slideFraction(model, mark) * 100)
  }));

  /* The holder, drawn small for the grip the child actually takes hold of. It
     is the same puppet outline again, standing in the same wooden holder, so
     the thing under the finger is plainly the thing on the track - and the
     side view next to it, at true scale, is what says how big the paper really
     is. Making the grip big does not make the paper big. */
  function gripSvg(model) {
    /* The badge carries the puppet at the SAME proportions as the real prop:
       the paper is no wider than half its height, and so is this. Calling the
       same helper is not enough on its own - an earlier badge used a 6 by 13
       box, which is not one to two - so the numbers come from the model. */
    const tall = 12;
    const wide = tall * (model ? model.puppetWidth({ puppet: 1 }) * 2 : 1) / 2;
    const ground = 16;
    const box = { leftCm: 6 - wide / 2, widthCm: wide, heightCm: tall, bottomCm: 0 };
    return `<svg class="grip-art" viewBox="0 0 12 18" aria-hidden="true" focusable="false">`
      /* the holder, under the paper's feet, exactly as it is on the track */
      + `<rect x="0.6" y="${ground}" width="10.8" height="1.6" rx="0.7" fill="${INK.wood}"/>`
      + `<rect x="0.6" y="${ground + 0.55}" width="10.8" height="0.3" fill="${INK.woodDeep}"`
      + ` fill-opacity="0.55"/>`
      + puppetProp(box, ground, "shadow-paper-grip")
      + `</svg>`;
  }

  /* Where the guide lines really land, so a test can check the picture rather
     than trust it: the top line leaves the lamp at the foot line, passes the
     puppet's top edge and meets the screen at the shadow's height. */
  function guideMeets(model, state) {
    const D = model.LAMP_TO_SCREEN;
    const h = state.config.puppet;
    const d = state.mark;
    return { atPuppet: h, atScreen: round((h * D) / d), footLine: 0 };
  }

  return {
    PAINTING, SCREEN, STAGE_CM, SHADOW_AT, FLOWER_AT, LAYERS, INK,
    containedRect, screenBox, stageWidthCm,
    SIDE, shadowBox, sceneryBox, puppetShapes, puppetSvg, puppetProp,
    doorBox, doorOutline, doorSvg, performanceLeft, closeUpWindow, CLOSE,
    flowerShapes, flowerSvg, shadowOutline, sceneryOutline, puppetOutline,
    sideLabels, labelBox, LINE_BOX, ROW_GAP,
    slideFraction, slideDistance, slideMarks, gripSvg,
    screenSvg, backstageSvg, guideMeets
  };
});
