/* The Tower That Fell: a branching preview.

   Thirteen short nodes. The opening is shared - Bunny's own wish, the moment
   it falls, Bear's company, and then a real decision. From there the story
   goes one of three ways, and the three are not the same story with different
   labels on the same task:

       wish -> aftermath -> company -> choice
                                         |- rest -> rest-close   (no task)
                                         |- plan -> build -> close
                                         |          `------------^ (or listen)
                                         `- play -> forest-close
                                                 |- pond-close
                                                 `- own-close

   Resting is a complete ending. Playing another way is a complete ending. Only
   the plan route has a board, a tray or a number in it; neither of the others
   leads back to compulsory building, and none of the three is ranked above the
   others.

   Everything countable comes from tower-preview-data.js. This file only shows
   the model and takes input; it never decides a quantity of its own, and it
   never writes anything to the device.

   Nothing about the story is graded. There is no score, no timer, no feelings
   question, no correct answer required to read on, and no automatic scroll or
   entrance animation - the result is simply there when it happens. */

(function () {
  "use strict";

  const T = window.YoyoTower;
  /* The materials and the arithmetic for the new flat plan. Everything
     countable on this route comes from here; this file only shows the model
     and takes input, and never decides a quantity of its own. */
  const MAT = window.YoyoTowerMaterials;
  const $ = (sel) => document.querySelector(sel);

  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  };

  /* ------------------------------------------------------------------ */
  /* the four pieces, drawn exactly                                      */
  /* ------------------------------------------------------------------ */

  /* These are shapes, and the shape is the thing being taught, so they are
     drawn from their own geometry rather than by stretching the painted
     wooden block. A square really is square, a long rectangle really is twice
     as wide as it is tall, a triangle has three straight edges and a circle is
     round - at any size, on the tray and on the board alike.

     They keep the book's wood: the same warm timber tones and the same fine
     pencil edge as the painting they sit on, not a flat game counter. The
     painted block cut-out stays on disk untouched; it is a 2.12:1 face, so
     using it for a 2:1 rectangle would have meant squashing the wood, and
     using it for a square would have meant squashing it a great deal more. */

  const WOOD = { face: "#e2bf88", edge: "#8a6a3a", grain: "#c79f65" };

  /* Each piece is drawn inside its own box, inset a little so that two pieces
     side by side are visibly two pieces. The inset is a fraction of the box,
     applied to each axis in proportion, so the drawn face keeps the box's own
     ratio exactly: a long rectangle's face is 172 by 86, which is exactly 2:1,
     and a square's is 86 by 86. An equal absolute inset would have made them
     186 by 86 and 86 by 86 - close, but not the ratio the story claims. */
  const INSET = 0.07;
  const boxFor = (shapeId) => ({ w: shapeId === "long" ? 200 : 100, h: 100 });

  /* the drawn face, so a test can check the ratio rather than trust it */
  function faceFor(shapeId) {
    const box = boxFor(shapeId);
    /* whole numbers, so the drawn coordinates read as exactly what they are */
    const ix = Math.round(box.w * INSET);
    const iy = Math.round(box.h * INSET);
    return { x: ix, y: iy, width: box.w - 2 * ix, height: box.h - 2 * iy };
  }

  function shapeSvg(shapeId) {
    const box = boxFor(shapeId);
    const face = faceFor(shapeId);
    const common = `fill="${WOOD.face}" stroke="${WOOD.edge}" stroke-width="4" stroke-linejoin="round"`;
    let body;
    if (shapeId === "circle") {
      const r = Math.min(face.width, face.height) / 2;
      body = `<circle cx="${box.w / 2}" cy="${box.h / 2}" r="${r}" ${common}/>`
        + `<circle cx="${box.w / 2}" cy="${box.h / 2}" r="${Math.round(r * 0.55)}" fill="none" `
        + `stroke="${WOOD.grain}" stroke-width="3"/>`;
    } else if (shapeId === "triangle") {
      const bottom = face.y + face.height;
      body = `<path d="M ${box.w / 2} ${face.y} L ${face.x + face.width} ${bottom} `
        + `L ${face.x} ${bottom} Z" ${common}/>`
        + `<path d="M ${box.w / 2} ${face.y + 14} L ${face.x + face.width - 12} ${bottom - 6} `
        + `L ${face.x + 12} ${bottom - 6} Z" fill="none" stroke="${WOOD.grain}" stroke-width="3"/>`;
    } else {
      body = `<rect x="${face.x}" y="${face.y}" width="${face.width}" height="${face.height}" `
        + `rx="6" ${common}/>`
        + `<path d="M ${face.x + 8} ${Math.round(box.h * 0.38)} H ${face.x + face.width - 8} `
        + `M ${face.x + 8} ${Math.round(box.h * 0.66)} H ${face.x + face.width - 8}" `
        + `fill="none" stroke="${WOOD.grain}" stroke-width="3" stroke-linecap="round"/>`;
    }
    /* No preserveAspectRatio="none": the drawing keeps its own proportions
       wherever it is put, so a long rectangle in a small help diagram is still
       a long rectangle and not a squashed square. */
    return `<svg viewBox="0 0 ${box.w} ${box.h}" aria-hidden="true" focusable="false">${body}</svg>`;
  }

  /* A waiting space: the same rectangle the piece will fill, as a soft pencil
     outline of that piece's own shape, so the plan is legible before anything
     is in it and the piece lands exactly on the outline. */
  function slotSvg(shapeId) {
    const box = boxFor(shapeId);
    const face = faceFor(shapeId);
    const line = `fill="#fdf7ec" fill-opacity="0.30" stroke="${WOOD.edge}" stroke-width="4" `
      + `stroke-dasharray="10 7" stroke-linejoin="round" opacity="0.66"`;
    let body;
    if (shapeId === "circle") {
      body = `<circle cx="${box.w / 2}" cy="${box.h / 2}" `
        + `r="${Math.min(face.width, face.height) / 2}" ${line}/>`;
    } else if (shapeId === "triangle") {
      const bottom = face.y + face.height;
      body = `<path d="M ${box.w / 2} ${face.y} L ${face.x + face.width} ${bottom} `
        + `L ${face.x} ${bottom} Z" ${line}/>`;
    } else {
      body = `<rect x="${face.x}" y="${face.y}" width="${face.width}" height="${face.height}" `
        + `rx="6" ${line}/>`;
    }
    return `<svg viewBox="0 0 ${box.w} ${box.h}" aria-hidden="true" focusable="false">${body}</svg>`;
  }

  function shapeSprite(shapeId) {
    const wrap = el("span", `piece-sprite is-${shapeId}`);
    wrap.innerHTML = shapeSvg(shapeId);
    return wrap;
  }

  /* ------------------------------------------------------------------ */
  /* the paintings                                                       */
  /* ------------------------------------------------------------------ */

  /* Ten paintings across thirteen nodes. Every one of them was looked at
     before it was used here, and each alt line describes what is actually in
     the picture rather than what the story says about it.

     All ten are the wardrobe set: Bunny in her ice-blue gown with the pink
     waist bow, Bear in his pink top and purple trousers, throughout one
     continuous afternoon. A reading must never mix these with the earlier
     pinafore-and-overalls paintings, which stay on disk untouched. */
  const ART = {
    wish: {
      src: "assets/tower/wish-wardrobe-v1.jpg",
      alt: "Bunny kneeling on the rug, reaching up to place a block on a tall stack of "
        + "wooden blocks, while Bear sits nearby with an open picture book",
      caption: "Bunny building her lookout, with Bear reading nearby."
    },
    aftermath: {
      src: "assets/tower/aftermath-wardrobe-v1.jpg",
      alt: "Bunny sitting among scattered wooden blocks with a paw at her mouth, "
        + "and Bear beside her reaching out gently",
      /* atmosphere only: the blocks painted here are part of the room, not the
         blocks the plan counts */
      caption: "The blocks scattered across the rug."
    },
    company: {
      src: "assets/tower/company-wardrobe-v1.jpg",
      alt: "Bunny sitting with her ears lowered and her gaze down, and Bear kneeling a "
        + "little way off with his paws in his lap and a closed book beside him",
      caption: "Bear staying nearby, without fixing anything."
    },
    quiet: {
      src: "assets/tower/quiet-company-wardrobe-v1.jpg",
      alt: "Bunny and Bear sitting quietly side by side on the rug in a patch of sunlight, "
        + "with the wooden toy duck and a few loose blocks nearby",
      caption: "Bunny and Bear, sitting together in the sunlight."
    },
    restClose: {
      src: "assets/tower/rest-close-wardrobe-v1.jpg",
      alt: "Bunny and Bear seen from behind, sitting together on the rug and looking "
        + "toward the sunlit window, with the wooden toy duck and a few blocks nearby",
      caption: "The quiet end of the afternoon."
    },
    board: {
      src: "assets/tower/building-board-wardrobe-v1.jpg",
      alt: "Bunny and Bear sitting at a wide empty wooden building board, with a small "
        + "wooden toy duck beside it",
      caption: "The building board, with the wooden toy duck waiting beside it."
    },
    planClose: {
      src: "assets/tower/plan-close-wardrobe-v1.jpg",
      alt: "Bunny with both paws in her lap, looking across the wide wooden building "
        + "board toward Bear, who is turning gently toward her",
      caption: "The building board at the end of the afternoon."
    },
    play: {
      src: "assets/tower/play-wardrobe-v1.jpg",
      alt: "Bunny leaning forward on the rug to roll her wooden toy duck along, with "
        + "Bear resting on his elbows and watching at the same level",
      caption: "Bunny rolling the wooden duck across the rug."
    },
    forest: {
      src: "assets/tower/forest-wardrobe-v1.jpg",
      alt: "An imagined forest path between tall ferns, with the same wooden toy duck on "
        + "the dry path and Bunny and Bear crouching to look through the leaves",
      caption: "The forest they imagined."
    },
    pond: {
      src: "assets/tower/pond-wardrobe-v1.jpg",
      alt: "An imagined pond with reeds and ripples, Bunny and Bear sitting back on the "
        + "dry bank, and the wooden toy duck beside them with its wheels on the ground",
      caption: "The pond they imagined."
    }
  };

  /* ------------------------------------------------------------------ */
  /* where the flat picture sits in each board painting                  */
  /* ------------------------------------------------------------------ */

  /* Two different paintings hold the board, and they are not the same pixels.
     Both were measured from the delivered files rather than from the prompt
     that asked for matching geometry:

       building-board-wardrobe : painted surface y 0.638 (back) to 0.912
                                 (front), narrowest span x 0.243..0.760
       plan-close-wardrobe     : painted surface y 0.643 (back) to 0.906
                                 (front), narrowest span x 0.254..0.765

     Each one therefore gets its own stage: the rectangle of that painting
     inside which the whole flat picture is laid out, kept clear of both edges
     and nowhere near the wooden duck, which stays outside the board on the
     right in both. The widest list needs 8 cells across and every list needs
     4 bands deep; the cell is square in the painting's own pixels, so a square
     piece is square on screen at every size. */
  const STAGES = {
    [ART.board.src]: { x0: 0.300, x1: 0.700, y0: 0.665, y1: 0.895 },
    [ART.planClose.src]: { x0: 0.305, x1: 0.700, y0: 0.670, y1: 0.892 }
  };

  /* The rectangle the painting is really drawn in. object-fit: contain
     letterboxes whenever the box and the picture disagree, so the pieces are
     placed against this, never against the outer element. */
  function containedRect(img) {
    const boxW = img.clientWidth || img.offsetWidth || 0;
    const boxH = img.clientHeight || img.offsetHeight || 0;
    const natW = img.naturalWidth || 0;
    const natH = img.naturalHeight || 0;
    if (!boxW || !boxH || !natW || !natH) return null;
    const scale = Math.min(boxW / natW, boxH / natH);
    const w = natW * scale;
    const h = natH * scale;
    return { left: (boxW - w) / 2, top: (boxH - h) / 2, width: w, height: h };
  }

  /* One square cell, and where the grid of cells begins, for this painting at
     this size. The picture is centred across the stage and rests on its front
     edge, so a small list is not pushed into a corner. */
  function cellPlan(rect, stage, across, rows) {
    const availW = rect.width * (stage.x1 - stage.x0);
    const availH = rect.height * (stage.y1 - stage.y0);
    const size = Math.min(availW / across, availH / rows);
    return {
      size,
      left: rect.left + rect.width * stage.x0 + (availW - size * across) / 2,
      bottom: rect.top + rect.height * stage.y1
    };
  }

  /* One piece, or the space waiting for it, in the picture's own pixels.
     Row 0 is the front band; each row above it is one cell further back. */
  function slotBox(cells, slot) {
    return {
      left: cells.left + slot.column * cells.size,
      top: cells.bottom - (slot.row + 1) * cells.size,
      width: slot.cells * cells.size,
      height: cells.size
    };
  }

  /* ------------------------------------------------------------------ */
  /* the thirteen nodes                                                  */
  /* ------------------------------------------------------------------ */

  const NODES = {

    /* ---- the shared opening ---- */

    wish: {
      route: null,
      heading: "A picture in her head",
      art: ART.wish,
      /* the wooden duck, the blocks and Bunny's own wish are established here,
         before anything later refers to them */
      lines: [
        "Bunny wanted to make a lookout for her little wooden duck.",
        "“From up here, you could see right across my pretend forest,” she whispered.",
        "She placed another block. She imagined the lookout reaching almost to the windowsill.",
        "Bear was looking at a picture book nearby. Bunny wanted to show him when it was ready."
      ],
      next: { label: "Read on", to: "aftermath" }
    },

    aftermath: {
      route: null,
      heading: "Not the picture in her head",
      art: ART.aftermath,
      lines: [
        "One block leaned. Another slipped. The top of the tower tumbled across the rug.",
        "Bunny stared at the scattered blocks. This was not the picture she had imagined.",
        "“It was supposed to stay up!” Her cheeks felt hot. “I don’t want these blocks anymore.”",
        "The wooden duck waited beside the rug. Bear put down his book."
      ],
      next: { label: "Read on", to: "company" }
    },

    company: {
      route: null,
      heading: "Room for the feeling",
      art: ART.company,
      lines: [
        "Bear stopped beside the rug. “You wanted it to look the way you imagined,” he said.",
        "Bunny nodded, but she did not look up.",
        "“Would you like me nearby?”",
        "“Nearby,” Bunny said. “But please don’t fix it yet.”",
        "Bear settled beside her. He left the blocks alone."
      ],
      next: { label: "Read on", to: "choice" }
    },

    /* The decision comes before the story has decided that Bunny rebuilds.
       Three actions, none of them scored, none of them the right one, and no
       plan, board or number anywhere on this page. */
    choice: {
      route: null,
      heading: "What shall we do next?",
      art: ART.company,
      lines: [
        "For a little while, they watched a patch of sunlight on the floor.",
        "“I’m still cross,” Bunny said.",
        "“I’m here,” said Bear. “We can leave the blocks alone, look at a new plan, "
          + "or play a different way.”",
        "Bunny did not have to choose the idea Bear liked best. It was her next step to choose."
      ],
      choices: [
        { label: "Stay with me for a while.", to: "rest" },
        { label: "Let’s look at a new plan together.", to: "plan" },
        { label: "I’d like to play a different way.", to: "play" }
      ]
    },

    /* ---- resting: a complete route with no task in it ---- */

    rest: {
      route: "rest",
      heading: "A little while",
      art: ART.quiet,
      lines: [
        "“Stay with me for a while,” Bunny said.",
        "“All right.” Bear rested his paws in his lap. He did not pick up the blocks.",
        "Bunny watched the sunlight with him. She did not have to decide what to build next.",
        "Her wooden duck waited nearby. The blocks could stay where they were."
      ],
      next: { label: "Read on", to: "rest-close" }
    },

    "rest-close": {
      route: "rest",
      heading: "Room to leave it",
      art: ART.restClose,
      ending: true,
      lines: [
        "The tower was still down. Bunny still wished it had stayed up.",
        "“We don’t have to fix it now,” she said.",
        "“We don’t,” said Bear.",
        "The room grew quiet around them. They could leave the blocks alone today "
          + "and still have this time together."
      ]
    },

    /* ---- the plan: the only route with a building board in it ---- */

    plan: {
      route: "plan",
      heading: "A different picture",
      art: ART.board,
      showPlan: true,
      /* the materials list, the question and the three numbers live here; the
         countable pieces and their waiting spaces do not appear until the
         child asks to check, because a row of answer-shaped spaces is the
         answer */
      asking: true,
      /* Coming back to a plan that has already been worked on is a read-back,
         not a second delivery of pieces. The past tense matters: describing a
         transfer that is not happening would leave the board disagreeing with
         the words. */
      lines: (plan) => (plan.placed.length > 0
        ? [
          "The pieces Bunny had already laid out were still on the board.",
          "“We can look at your plan together,” said Bear."
        ]
        : [
          "“Let’s look at a new plan together,” Bunny said. She pulled the building board closer.",
          "“Not the tall lookout today,” she said. “The tall one fell over. "
            + "What if we lay the pieces flat instead, and make a picture of a lookout "
            + "for my wooden duck to visit?”",
          "Bear helped her write down what the picture would need: square pieces for the wall, "
            + "long rectangle pieces for the path, triangle pieces for the roof and round pieces "
            + "for the little windows.",
          "“Could you work out how many pieces that is altogether?” Bunny asked."
        ]),
      next: { label: "Let’s check with the pieces", to: "build" },
      skip: { label: "Let’s just read", to: "close" }
    },

    build: {
      route: "plan",
      heading: "Making the picture",
      art: ART.board,
      showPlan: true,
      building: true,
      /* On this node the words are folded away by default. The picture and the
         tray have to be visible together on a phone while a child is choosing
         a piece; a wall of narration between them pushed the board off the top
         of the screen. Nothing here is hidden that the child needs. */
      foldLines: true,
      lines: [
        "“Here are the shapes,” Bunny said. “These spaces are waiting for them.”",
        "There were more pieces on the tray than the picture needed. Bunny could bring one over, "
          + "look at the plan, and bring another.",
        "The pieces lie flat on the board. They are a picture of a lookout, not a tower "
          + "standing up.",
        "“Could you stay while I try?”",
        "“Yes,” said Bear. “And we can stop whenever you want.”"
      ],
      next: { label: "Read on", to: "close" },
      skip: { label: "Stop building", to: "close" }
    },

    close: {
      route: "plan",
      heading: "Still here",
      /* A different painting from the building board: the two of them attend
         to each other instead of staying frozen in the planning pose. It is an
         empty board, not a baked finished picture - whatever the child
         actually laid down is drawn onto it from the model, and this board is
         measured separately because a costume edit does not preserve pixels. */
      art: ART.planClose,
      showPlan: true,
      ending: true,
      /* the close changes with what really happened, and neither branch is a
         better ending than the other */
      lines: (plan) => [
        MAT.isComplete(plan)
          ? "The last space had its piece. Bunny looked at the flat picture lying on the board. "
            + "“That is my lookout,” she said. “Duck can visit it without it falling over.”"
          : "Some spaces were still waiting. Bunny left her plan beside the pieces. "
            + "“Another time,” she said.",
        "The wooden duck waited beside the building board.",
        "“I still wish the first tower hadn’t fallen,” Bunny said.",
        "Bear nodded. He had not gone anywhere.",
        "There was room for today’s feeling. And room for another idea, whenever Bunny wanted one."
      ]
    },

    /* ---- playing another way: three imagined destinations, no task ---- */

    play: {
      route: "play",
      heading: "Another sort of adventure",
      art: ART.play,
      lines: [
        "Bunny looked at her wooden duck. “Perhaps you don’t need a lookout today.”",
        "She rolled him a little way across the rug. “Perhaps you could go on a journey instead.”",
        "“Where shall we imagine he goes?” asked Bear.",
        "The room was still their playroom. The journey could happen in their story."
      ],
      choices: [
        { label: "A forest adventure.", to: "forest-close" },
        { label: "A quiet pond.", to: "pond-close" },
        { label: "Somewhere I imagine.", to: "own-close" }
      ]
    },

    "forest-close": {
      route: "play",
      heading: "Between the ferns",
      art: ART.forest,
      ending: true,
      lines: [
        "“A forest,” Bunny said. “With ferns tall enough to hide a wooden duck.”",
        "In their story, Duck rolled along a soft path. Sunlight made little patches between the leaves.",
        "“There is a clearing just ahead,” Bear whispered. Bunny imagined what Duck might find there.",
        "The first tower still had not worked out. But Bunny had found another story to tell, "
          + "and Bear was there to listen."
      ]
    },

    "pond-close": {
      route: "play",
      heading: "Beside the water",
      art: ART.pond,
      ending: true,
      lines: [
        "“A quiet pond,” Bunny said. “Duck can watch the ripples from the bank.”",
        "In their story, the wooden duck stopped on a dry little path beside the water. "
          + "He did not need to swim.",
        "“The reeds are moving,” Bear said softly. Bunny imagined the sound of the breeze.",
        "The first tower still had not worked out. This was a different idea, "
          + "not a way to pretend the tower had stayed up."
      ]
    },

    /* An invitation, and nothing more. The preview cannot hear, read, keep or
       draw the child's idea, so it never says that it did, and it never
       substitutes a stock picture and calls that their place. */
    "own-close": {
      route: "play",
      heading: "A place of your own",
      art: ART.play,
      ending: true,
      lines: [
        "“Somewhere I imagine,” Bunny said.",
        "Bear waited. He did not guess the place or finish Bunny’s idea for her.",
        "There could be a whole journey, one small detail, or an idea she was not ready to tell.",
        "You can tell someone your idea, draw it on paper, or keep imagining. "
          + "There is no picture you have to copy."
      ]
    }
  };

  /* Each node knows its own name, so anything holding one can say where it
     is without having to look it up in the table it came from. */
  Object.keys(NODES).forEach((id) => { NODES[id].id = id; });

  const START = "wish";
  const PLAN_NODE = "plan";
  const CLOSE_NODE = "close";
  const BUILD_NODE = "build";
  const CHOICE_NODE = "choice";
  const PLAY_NODE = "play";
  /* the node each route begins at, which is where an alternative telling is
     framed - not on every page of it */
  const ROUTE_ENTRY = { rest: "rest", plan: "plan", play: "play" };
  /* the imagined place each play ending settles on */
  const DESTINATION = { "forest-close": "forest", "pond-close": "pond", "own-close": "own" };

  /* The narration: which words are read aloud, in what order, and the bounded
     list of every line the player can ever ask for. It is a separate file so
     that the recording catalogue can be produced without a browser, from the
     same description this page is drawn from. */
  const NAR = window.YoyoTowerNarration;
  const Sound = window.YoyoSound && window.YoyoSound.createSound
    ? window.YoyoSound.createSound({ Audio: window.Audio })
    : null;

  const ALTERNATIVE = "Let’s imagine another way this story could go.";
  const RETAINED = "Your building will be here if you come back.";
  const RESTART = "A new reading starts this preview again from the beginning, with a different "
    + "plan. This reading’s building is cleared. Nothing you have drawn or saved anywhere else "
    + "changes.";

  /* ------------------------------------------------------------------ */
  /* the preview's whole state, in memory only                           */
  /* ------------------------------------------------------------------ */

  const preview = {
    /* bumped by a new reading, so a control captured before it is dead */
    reading: 0,
    /* Bumped by every full draw of the page. This, not the reading and the
       node, is what a control belongs to: the exact view that put it on
       screen. See `guarded` below for why the other two were not enough. */
    view: 0,
    node: START,
    /* where this reading has actually been, so Back retraces the child's own
       path rather than an index into an array they never saw */
    path: [START],
    plan: null,
    previousList: null,
    /* the number the child chose, if they chose one. It is kept apart from the
       pieces: a chosen number never creates or removes one. */
    said: null,
    /* the explicit "let's check": until it happens the countable pieces and
       their waiting spaces are not on the board at all */
    checked: false,
    /* how many steps of the worked example have actually been asked for, and
       whether any were */
    helpStep: 0,
    guided: false,
    /* the routes this reading has entered, in order; the first one is the
       telling, any later one is an alternative telling of the same reading */
    routesTaken: [],
    /* the imagined places this reading has settled on, in order. Kept for the
       same reason: coming back to the question must not act as though the
       first journey never happened, and picking a second one is another
       telling rather than a reroll. */
    destinations: [],
    helpOn: false,
    explained: false,
    confirmingRestart: false,
    /* whether the child has asked to be read to. Set by the first deliberate
       press of Listen, cleared by Stop and by starting a new reading; never
       set by the page opening. */
    listening: false,
    /* the pages of this reading that have really been heard, so a control
       never offers to repeat something that has not happened */
    heard: new Set()
  };

  function startReading() {
    const list = MAT.chooseList(preview.previousList, null);
    preview.previousList = list;
    preview.plan = MAT.createPlan(list);
    preview.said = null;
    preview.checked = false;
    preview.helpStep = 0;
    preview.guided = false;
    preview.reading += 1;
    preview.node = START;
    preview.path = [START];
    preview.routesTaken = [];
    preview.destinations = [];
    preview.helpOn = false;
    preview.explained = false;
    preview.confirmingRestart = false;
    preview.listening = false;
    /* a new reading has heard nothing yet */
    preview.heard = new Set();
    render();
  }

  /* Going on to another node. The plan is never re-rolled here: one reading
     has one plan, and choosing, changing course or coming back cannot replace
     it or empty the board. The imagined destination is remembered the same
     way. */
  function enter(id) {
    const node = NODES[id];
    if (!node) return;
    preview.node = id;
    preview.path.push(id);
    if (node.route && !preview.routesTaken.includes(node.route)) preview.routesTaken.push(node.route);
    const place = DESTINATION[id];
    if (place && !preview.destinations.includes(place)) preview.destinations.push(place);
    preview.confirmingRestart = false;
    render();
  }

  function back() {
    if (preview.path.length < 2) return;
    preview.path.pop();
    preview.node = preview.path[preview.path.length - 1];
    preview.confirmingRestart = false;
    render();
  }

  /* A control belongs to the view that drew it - one particular drawing of one
     particular page - and it stops working the moment that view is replaced.

     Asking "same reading, same node?" was not enough, because both of those
     come back. Leaving the building page for another route and then returning
     to it put the child on `build` in the same reading again, so a block
     button abandoned on the first visit matched the test and moved a block
     into the plan the child had come back to. Cancelling the new-reading
     question had the same shape: the ending node never changed, so the
     confirmation left behind still matched and restarted the reading.

     A view number cannot come back. Coming back to a page draws it again,
     which is a new view, and everything from the old one is dead for good.

     It is bumped by a full draw, not by every change. Placing a block redraws
     the picture, the tray's state and the buttons underneath, but it does not
     redraw the page - so the other blocks the child can still see, and is
     already reaching for, keep working. */
  function guarded(fn) {
    const view = preview.view;
    return () => {
      if (preview.view !== view) return;
      fn();
    };
  }

  /* Whether this page is showing the reader another way the same story could
     go. Only the two questions and the entrance to a route or a destination
     the reading did not take first: repeating it on every later page would
     nag. */
  /* Worked out from state alone, so that the words the page shows and the
     words it reads aloud are decided in one place. */
  function framingFor(view) {
    const node = NODES[view.nodeId];
    const firstRoute = view.routesTaken[0];
    const firstPlace = view.destinations[0];
    let framing = false;

    if (firstRoute) {
      if (view.nodeId === CHOICE_NODE) framing = true;
      else if (ROUTE_ENTRY[node.route] === view.nodeId && node.route !== firstRoute) framing = true;
    }
    if (firstPlace) {
      if (view.nodeId === PLAY_NODE) framing = true;
      else if (DESTINATION[view.nodeId] && DESTINATION[view.nodeId] !== firstPlace) framing = true;
    }
    if (!framing) return "";

    /* Work already done is kept, not undone. Saying so is the difference
       between an alternative telling and a claim that the towers came down. */
    return view.plan.placed.length > 0 ? `${ALTERNATIVE} ${RETAINED}` : ALTERNATIVE;
  }

  const alternativeNote = () => framingFor(currentView());

  /* ------------------------------------------------------------------ */
  /* what this page says, as data                                        */
  /* ------------------------------------------------------------------ */

  /* The wording that belongs to the page rather than to the story: the
     invitations, the notes under the tray and the labels on the actions. They
     are gathered here because they are read aloud as well as shown, and a
     second copy of them somewhere else is how a recording list stops matching
     the page. */
  const SAY = {
    hintAsk: "What do you think the answer will be? "
      + "You can choose a number, or go straight to the pieces.",
    hintEnding: "This is what the plan needed.",
    planDone: "Every space in the plan has its piece.",
    planWaiting: "Some spaces are still waiting.",
    noteDone: "There are still pieces on the tray. The picture does not need them.",
    noteWaiting: "Bring over any piece that fits a waiting space.",
    showSpaces: "Show the waiting spaces",
    hideSpaces: "Hide the waiting spaces",
    explainAsk: "Show what the plan needed",
    saidOpen: (n) => `Your idea: ${MAT.numeralFor(n)}. You can change it.`,
    saidLocked: (n) => `Your idea: ${MAT.numeralFor(n)}.`,
    layRest: (shapeId, left) => `Lay ${MAT.numeralFor(left)} ${MAT.nameFor(shapeId, left)}`
  };

  /* Everything this page is currently saying, worked out from state alone.

     One function, two readers: `render` draws from it and the narration reads
     from it. That is deliberate. A recording list assembled separately from
     the page is a list of what someone remembered to write down; this one
     cannot drift, because the words the child hears and the words Codex is
     asked to record come out of the same call. */
  function describePage(view) {
    const node = NODES[view.nodeId];
    if (!node) return null;
    const plan = view.plan;
    const lines = typeof node.lines === "function" ? node.lines(plan) : node.lines;
    const asks = Boolean(node.asking);
    const builds = Boolean(node.building);
    const closing = Boolean(node.showPlan && node.ending);
    const shows = asks || builds || closing;

    const page = {
      id: node.id,
      routeNote: framingFor(view),
      heading: node.heading,
      caption: node.art ? node.art.caption : "",
      lines: lines.slice(),
      ask: null,
      help: [],
      said: null,
      compare: null,
      build: null,
      actions: [],
      choices: (node.choices || []).map((choice) => choice.label),
      restart: view.confirmingRestart ? RESTART : null
    };

    if (shows && !closing) {
      page.ask = {
        question: MAT.questionFor(plan.list),
        givens: MAT.givensFor(plan.list)
          .map((given) => `${MAT.numeralFor(given.value)} ${given.label}`),
        /* while pieces are being laid out the invitation has been answered
           and is put away, so it is not read either */
        hint: builds ? "" : SAY.hintAsk
      };
      /* only the steps that have really been asked for */
      page.help = MAT.helpSteps(plan.list).slice(0, view.helpStep).map((s) => s.text);
      if (view.said !== null) {
        page.said = view.checked ? SAY.saidLocked(view.said) : SAY.saidOpen(view.said);
      }
    } else if (closing) {
      page.ask = { question: "", givens: [], hint: SAY.hintEnding };
    }

    if (shows && MAT.isComplete(plan) && view.said !== null) {
      page.compare = MAT.comparisonFor(view.said, MAT.totalFor(plan.list));
    }

    if (builds) {
      const done = MAT.isComplete(plan);
      page.build = {
        plan: done ? SAY.planDone : SAY.planWaiting,
        note: done ? SAY.noteDone : SAY.noteWaiting,
        explain: view.explained ? MAT.explanation(plan) : ""
      };
      MAT.SHAPE_IDS.forEach((shapeId) => {
        const left = MAT.remaining(plan, shapeId);
        if (left) page.actions.push(SAY.layRest(shapeId, left));
      });
      page.actions.push(view.helpOn ? SAY.hideSpaces : SAY.showSpaces);
      if (done && !view.explained) page.actions.push(SAY.explainAsk);
    }
    return page;
  }

  /* The state the page is in, as the plain object describePage reads. */
  const currentView = () => ({
    nodeId: preview.node,
    plan: preview.plan,
    said: preview.said,
    checked: preview.checked,
    helpStep: preview.helpStep,
    helpOn: preview.helpOn,
    explained: preview.explained && preview.node === BUILD_NODE,
    confirmingRestart: preview.confirmingRestart,
    routesTaken: preview.routesTaken,
    destinations: preview.destinations
  });

  /* ------------------------------------------------------------------ */
  /* drawing                                                             */
  /* ------------------------------------------------------------------ */

  let placeBlocks = () => {};

  function renderScene(node) {
    const img = $("#sceneArt");
    const layer = $("#sceneBlocks");
    layer.innerHTML = "";

    if (img.getAttribute("src") !== node.art.src) img.setAttribute("src", node.art.src);
    img.alt = node.art.alt;
    $("#sceneCaption").textContent = node.art.caption;

    /* The quiet route and the play route have no plan in them. Nothing is
       drawn over their paintings: no board, no waiting spaces, no pieces,
       finished or otherwise.

       On the planning node the picture is only drawn once the child has asked
       to check. Laying out one waiting space per piece before that would
       answer the question by letting them be counted. */
    const stage = node.showPlan ? STAGES[node.art.src] : null;
    const showPieces = Boolean(stage) && (!node.asking || preview.checked);
    if (!showPieces) {
      layer.classList.toggle("is-helping", false);
      placeBlocks = () => {};
      return;
    }

    const slots = MAT.layout(preview.plan);
    const across = MAT.cellsAcross(preview.plan.list);
    const nodes = [];
    slots.forEach((slot) => {
      const item = el("span", slot.pieceId ? "board-piece" : "board-slot");
      item.dataset.shape = slot.shape;
      item.dataset.row = String(slot.row);
      item.dataset.column = String(slot.column);
      if (slot.pieceId) {
        item.dataset.piece = slot.pieceId;
        item.append(shapeSprite(slot.shape));
      } else {
        item.innerHTML = slotSvg(slot.shape);
      }
      layer.append(item);
      nodes.push({ node: item, slot });
    });

    placeBlocks = () => {
      const rect = containedRect(img);
      if (!rect) return false;
      const cells = cellPlan(rect, stage, across, MAT.ROWS);
      nodes.forEach(({ node: item, slot }) => {
        const box = slotBox(cells, slot);
        item.style.left = `${box.left.toFixed(2)}px`;
        item.style.top = `${box.top.toFixed(2)}px`;
        item.style.width = `${box.width.toFixed(2)}px`;
        item.style.height = `${box.height.toFixed(2)}px`;
      });
      return true;
    };

    if (!placeBlocks()) img.addEventListener("load", () => placeBlocks(), { once: true });
    layer.classList.toggle("is-helping", preview.helpOn);
  }

  /* The tray is laid out once per building node, one place for every block
     that started there. Taking a block empties its own place and leaves every
     other place exactly where it was - nothing slides along to fill the gap
     under the child's finger, and an emptied place keeps its own height so
     the rows below it do not move either. */
  function buildTray() {
    const tray = $("#tray");
    tray.innerHTML = "";
    /* One row per kind, so the pieces on the tray are as easy to tell apart as
       the pieces on the board, and a group action can be about one kind. */
    MAT.SHAPE_IDS.forEach((shapeId) => {
      const row = el("div", "tray-row");
      row.dataset.shape = shapeId;
      const label = el("p", "tray-row-label");
      label.textContent = MAT.nameFor(shapeId, 2);
      const places = el("div", "tray-places");
      places.setAttribute("role", "group");
      places.setAttribute("aria-label", MAT.nameFor(shapeId, 2));
      MAT.idsFor(shapeId).forEach((pieceId) => {
        const slot = el("span", `tray-slot is-${shapeId}`);
        slot.dataset.slot = pieceId;
        const button = el("button", "tray-block");
        button.type = "button";
        button.dataset.block = pieceId;
        button.dataset.shape = shapeId;
        button.setAttribute("aria-label", `put this ${MAT.nameFor(shapeId, 1)} on the plan`);
        button.append(shapeSprite(shapeId));
        button.addEventListener("click", guarded(() => takeBlock(pieceId)));
        slot.append(button);
        places.append(slot);
      });
      row.append(label, places);
      tray.append(row);
    });
    refreshTray();
  }

  function refreshTray() {
    const plan = preview.plan;
    const done = MAT.isComplete(plan);

    Array.from($("#tray").querySelectorAll(".tray-slot")).forEach((slot) => {
      const pieceId = slot.dataset.slot;
      const still = plan.tray.indexOf(pieceId) !== -1;
      const button = slot.querySelector(".tray-block");
      slot.classList.toggle("is-empty", !still);
      if (!button) return;
      button.hidden = !still;
      /* A kind whose part of the plan is complete stops accepting pieces, and
         at the target nothing more is needed at all. The spare pieces are
         still there and still visible - they simply are not wanted. Being
         switched off is not the same as being gone. */
      button.disabled = !still || done || MAT.quotaFull(plan, button.dataset.shape);
    });

    /* No number before the child has acted: a count of what is missing is the
       answer to the question the plan is asking. */
    $("#buildPlan").textContent = done ? SAY.planDone : SAY.planWaiting;
    $("#buildNote").textContent = done ? SAY.noteDone : SAY.noteWaiting;
  }

  /* One block moves, and the count commits before anything is drawn. Input
     that arrives from anywhere but the live building node on the plan route is
     refused outright, so a control left behind by another page - or by an
     abandoned route, or by a previous reading - cannot touch the plan.

     Deliberately not a full redraw: the picture, the tray's state and the
     buttons underneath are refreshed, but the page is not drawn again, so the
     blocks still on screen keep working for the next tap. */
  function takeBlock(blockId) {
    if (preview.node !== BUILD_NODE) return;
    const node = NODES[preview.node];
    if (!node || node.route !== "plan" || !node.building) return;

    const result = MAT.place(preview.plan, blockId);
    if (!result.moved) return;
    preview.plan = result.plan;
    /* the notes under the tray and the group actions have changed, so a
       reading of the old ones is stale; the pieces themselves are untouched */
    hushAudio();
    renderScene(node);
    refreshTray();
    renderActions(node);
    refreshReading();
  }

  /* The rest of one kind in a single action. It moves only the pieces that
     kind still needs, so pressing it after laying two by hand brings the ones
     that are left and never the number the list asked for over again. */
  function takeRest(shapeId) {
    if (preview.node !== BUILD_NODE) return;
    const node = NODES[preview.node];
    if (!node || node.route !== "plan" || !node.building) return;

    const result = MAT.placeRest(preview.plan, shapeId);
    if (!result.moved.length) return;
    preview.plan = result.plan;
    hushAudio();
    renderScene(node);
    refreshTray();
    renderActions(node);
    refreshReading();
  }

  /* ------------------------------------------------------------------ */
  /* the plan: what it needs, what it asks, and one way to work it out    */
  /* ------------------------------------------------------------------ */

  /* Written when the page is drawn and not again while pieces are moving.
     The amounts here are what the plan needs from the start; what is on the
     board right now is said under the tray, where it can change without
     moving anything the child is reaching for. */
  function renderPlanPanel(node) {
    const panelNode = $("#planAsk");
    const show = Boolean(node.asking || node.building || (node.showPlan && node.ending));
    panelNode.hidden = !show;
    if (!show) return;

    /* At the ending the task is over. The question, the list, the numbers and
       the worked example are all put away, so the last page is a calm close
       rather than something still asking to be answered. What is left is what
       actually happened. */
    const closing = Boolean(node.ending);
    $("#planQuestion").hidden = closing;
    $("#planList").hidden = closing;
    $("#planPredict").hidden = closing;
    $("#planHelp").hidden = closing;

    /* While the pieces are being laid out, this panel sits under the board and
       the tray rather than between them, and it keeps only what is still
       useful: the materials list, the number that was chosen and any worked
       example that was asked for. The invitation to choose a number has been
       answered by then, and repeating it pushed the board off a phone screen
       above the first row of pieces. */
    $("#planHint").hidden = Boolean(node.building);
    $("#planAsk").classList.toggle("is-compact", Boolean(node.building));

    const list = preview.plan.list;
    $("#planQuestion").textContent = MAT.questionFor(list);

    const items = $("#planList");
    items.innerHTML = "";
    MAT.givensFor(list).forEach((given) => {
      const item = el("li", "plan-item");
      item.dataset.shape = given.shape;
      item.dataset.count = String(given.value);
      /* one accurate sample of the shape, and its amount as a numeral */
      const sample = el("span", "plan-sample");
      sample.append(shapeSprite(given.shape));
      const count = el("b", null, MAT.numeralFor(given.value));
      const words = el("span", null, ` ${given.label}`);
      item.append(sample, count, words);
      items.append(item);
    });

    $("#planHint").textContent = node.ending
      ? "This is what the plan needed."
      : "What do you think the answer will be? You can choose a number, or go straight to the pieces.";

    renderPlanChoices(node);
    renderPlanHelp();

    const compare = $("#planCompare");
    /* only once the pieces themselves have answered it, and only if a number
       was actually chosen */
    const answered = MAT.isComplete(preview.plan);
    compare.textContent = answered && preview.said !== null
      ? MAT.comparisonFor(preview.said, MAT.totalFor(list))
      : "";
    compare.hidden = !compare.textContent;
  }

  function renderPlanChoices(node) {
    const grid = $("#planChoices");
    grid.innerHTML = "";
    const locked = preview.checked || Boolean(node.ending);
    MAT.answerChoices(preview.plan.list).forEach((n) => {
      const button = el("button", "plan-choice", MAT.numeralFor(n));
      button.type = "button";
      button.dataset.value = String(n);
      button.setAttribute("aria-pressed", preview.said === n ? "true" : "false");
      /* changing your mind is allowed right up until the pieces come out */
      button.disabled = locked;
      button.addEventListener("click", guarded(() => {
        if (preview.checked) return;
        preview.said = n;
        /* a different number is a different thing to read */
        hushAudio();
        renderPlanChoices(node);
        const again = Array.from($("#planChoices").querySelectorAll(".plan-choice"))
          .find((b) => b.dataset.value === String(n));
        if (again && again.focus) again.focus();
        refreshReading();
      }));
      grid.append(button);
    });
    $("#planSaid").textContent = saidLine();
  }

  function saidLine() {
    if (preview.said === null) return "";
    return preview.checked
      ? `Your idea: ${MAT.numeralFor(preview.said)}.`
      : `Your idea: ${MAT.numeralFor(preview.said)}. You can change it.`;
  }

  function renderPlanHelp() {
    const steps = MAT.helpSteps(preview.plan.list);
    const list = $("#planHelpSteps");
    list.innerHTML = "";
    steps.slice(0, preview.helpStep).forEach((s) => {
      const item = el("li", "plan-help-step");
      const text = el("span", "plan-help-text", s.text);
      const symbols = el("span", "plan-help-symbols", s.symbols);
      item.append(text, symbols);
      /* the pieces a step is talking about, drawn as the actual shapes in the
         actual mixture. They are a diagram: asking for help never moves a
         piece, and a partial sum is never drawn as that many squares. */
      if (s.groups) {
        const parts = el("span", "plan-help-parts");
        s.groups.forEach((group, i) => {
          const amount = group.reduce((n, one) => n + one.count, 0);
          const part = el("span", "plan-help-part");
          part.dataset.helpPart = String(amount);
          if (s.roles && s.roles[i]) part.dataset.helpRole = s.roles[i];
          const drawn = el("span", "plan-help-shapes");
          group.forEach((one) => {
            for (let n = 0; n < one.count; n += 1) drawn.append(shapeSprite(one.shape));
          });
          const count = el("span", "plan-help-count", MAT.numeralFor(amount));
          part.append(drawn, count);
          parts.append(part);
        });
        item.append(parts);
      }
      list.append(item);
    });

    const controls = $("#planHelpControls");
    controls.innerHTML = "";
    if (preview.helpStep > 0 && preview.helpStep < steps.length) {
      const more = el("button", "btn btn-secondary", "Show the next step");
      more.type = "button";
      more.dataset.help = "next";
      more.addEventListener("click", guarded(() => {
        preview.helpStep += 1;
        preview.guided = true;
        hushAudio();
        renderPlanHelp();
        refreshReading();
        const again = $("#planHelpControls").querySelector("[data-help]");
        if (again && again.focus) again.focus();
        else if ($("#planHelpToggle").focus) $("#planHelpToggle").focus();
      }));
      controls.append(more);
    }
  }

  /* Opening the panel supplies its first step at once: an open panel with
     nothing in it is not help. Later steps are asked for one at a time. */
  function bindPlanHelp() {
    const help = $("#planHelp");
    if (help._bound) return;
    help._bound = true;
    help.addEventListener("toggle", () => {
      if (!help.open) return;
      if (preview.helpStep === 0) {
        preview.helpStep = 1;
        hushAudio();
        renderPlanHelp();
        refreshReading();
      }
    });
  }

  function renderActions(node) {
    const row = $("#beatActions");
    row.innerHTML = "";

    const button = (cls, label, fn) => {
      const b = el("button", `btn ${cls}`, label);
      b.type = "button";
      b.addEventListener("click", guarded(fn));
      return b;
    };

    /* Starting over is explained first and confirmed second. While the
       explanation is on screen it is the only thing being offered, so it
       cannot be walked past by accident. */
    if (preview.confirmingRestart) {
      row.append(button("btn-primary", "Yes, start a new reading", () => startReading()));
      row.append(button("btn-quiet", "No, keep reading this one", () => {
        preview.confirmingRestart = false;
        render();
      }));
      return;
    }

    if (node.building) {
      /* one group action per kind that still needs pieces, so no child has to
         tap five times to put five squares down */
      MAT.SHAPE_IDS.forEach((shapeId) => {
        const left = MAT.remaining(preview.plan, shapeId);
        if (!left) return;
        row.append(button("btn-secondary",
          `Lay ${MAT.numeralFor(left)} ${MAT.nameFor(shapeId, left)}`,
          () => takeRest(shapeId)));
      });

      row.append(button("btn-secondary",
        preview.helpOn ? "Hide the waiting spaces" : "Show the waiting spaces",
        () => {
          /* Help only points at the empty spaces. It fills nothing, changes no
             number and never starts a different plan. */
          preview.helpOn = !preview.helpOn;
          hushAudio();
          $("#sceneBlocks").classList.toggle("is-helping", preview.helpOn);
          renderActions(node);
          refreshReading();
        }));

      if (MAT.isComplete(preview.plan) && !preview.explained) {
        row.append(button("btn-quiet", "Show what the plan needed", () => {
          preview.explained = true;
          /* the sentence lives in the node's text, so the whole page is drawn
             again - showing only the buttons left the explanation unwritten */
          render();
        }));
      }
    }

    /* Every choice looks the same and reads the same. None of them is the
       primary action, because none of them is the right one. */
    (node.choices || []).forEach((choice) => {
      row.append(button("btn-secondary", choice.label, () => enter(choice.to)));
    });

    if (node.skip) row.append(button("btn-quiet", node.skip.label, () => enter(node.skip.to)));
    if (node.next) {
      row.append(button("btn-primary", node.next.label, () => {
        /* On the planning node this is the explicit check: it is what brings
           the countable pieces out, and it settles the number the child said
           without ever judging it. */
        if (node.asking) preview.checked = true;
        enter(node.next.to);
      }));
    }

    /* Every ending offers exactly the same things, so that no way of getting
       here is dressed up as the better one. */
    if (node.ending) {
      row.append(button("btn-secondary", "Try another way", () => enter(CHOICE_NODE)));
      row.append(button("btn-quiet", "Start a new reading", () => {
        preview.confirmingRestart = true;
        render();
      }));
      const out = el("a", "btn btn-primary", "Return to library");
      out.setAttribute("href", "index.html");
      row.append(out);
    }

    if (preview.path.length > 1) row.append(button("btn-quiet", "Back", () => back()));
  }

  /* ------------------------------------------------------------------ */
  /* reading the page aloud                                              */
  /* ------------------------------------------------------------------ */

  /* The reader belongs to the drawing of the page that started it. A reading
     that outlives its page reports nothing and changes nothing: the guard is
     the same view number every control on the page is bound to. */
  const reader = NAR && NAR.createReader
    ? NAR.createReader({ sound: Sound, onChange: () => paintAudio() })
    : null;
  let readingView = -1;

  const alive = (view) => () => preview.view === view && readingView === view;

  /* Stop for the reasons the contract names: turning the page, changing
     route, a new reading, opening or cancelling the new-reading question, and
     any change to the task that changes what there is to read. Valid work is
     never touched - only the sound. */
  function hushAudio() {
    if (!reader) return;
    readingView = -1;
    reader.stop();
  }

  /* The kinds of the lines of the reading that is running, in order, so that
     the part being said can be tinted while it is being said. */
  let readingKeys = [];

  function speak(fromKey) {
    if (!reader) return;
    const page = describePage(currentView());
    const said = NAR.linesFor(page);
    readingKeys = NAR.keysFor(page);
    const at = NAR.segmentsFor(page);
    const start = fromKey && at[fromKey] != null ? at[fromKey] : 0;
    readingView = preview.view;
    reader.read(said, start, alive(preview.view));
  }

  /* Which element on the page holds each kind of line. A reading is a walk
     through the page's own parts, so marking where the voice is means finding
     the part it is on - not guessing from a paragraph index. */
  function nodeForKey(key) {
    if (!key) return null;
    const at = (sel, i) => {
      const host = $(sel);
      return host && host.children ? host.children[i] || null : null;
    };
    const n = Number(String(key).match(/-(\d+)$/) ? RegExp.$1 : -1);
    switch (NAR.kindOf(key)) {
      case "route": return $("#routeNote");
      case "restart": return $("#restartNote");
      case "line": {
        const host = $("#beatFold") && !$("#beatFold").hidden ? "#beatFoldText" : "#beatText";
        return at(host, n);
      }
      case "question": return $("#planQuestion");
      case "given": return at("#planList", n);
      case "hint": return $("#planHint");
      case "help": return at("#planHelpSteps", n);
      case "said": return $("#planSaid");
      case "compare": return $("#planCompare");
      case "build": return null;
      default: return null;
    }
  }

  /* The tint follows the voice and moves nothing. Exactly one part carries it
     at a time, and when nothing is being said nothing carries it. */
  function markSpeaking() {
    if (typeof document === "undefined" || !document.querySelectorAll) return;
    const lit = reader && reader.playing && readingView === preview.view
      ? nodeForKey(readingKeys[reader.index])
      : null;
    document.querySelectorAll(".reader-speaking").forEach((node) => {
      if (node !== lit) node.classList.remove("reader-speaking");
    });
    if (lit && lit.classList) lit.classList.add("reader-speaking");
  }

  /* ONE control for the page, and only once there is something to play.

     Until the recordings exist, offering a Listen button would be offering a
     button that does nothing: the honest thing is a sentence saying the voice
     is not made yet. NAR.READY is the single, verified availability switch.
     It is not a test hook - it is the fact, written down where the page and
     the reviewer can both read it, and it turns true when the clips land. */
  const canListen = () => Boolean(reader && NAR && NAR.READY);

  function paintAudio() {
    const audio = $("#beatAudio");
    const listen = $("#listenBtn");
    const stop = $("#stopBtn");
    const status = $("#audioStatus");
    if (!audio || !listen || !stop || !status) return;

    const cover = $("#readerCover");
    const available = canListen();
    const ready = available && !(cover && !cover.hidden);
    listen.hidden = !ready;
    // The compatibility stop handler remains, but the visible toggle does both jobs.
    stop.hidden = true;
    const previewNote = $("#previewTag");
    if (previewNote) previewNote.textContent = available
      ? "Story preview. Original narration is ready. Read together."
      : "Story preview. Read together. New narration is not recorded yet.";
    /* The preview's own notice at the top of the page already says that the
       narration is not recorded yet. Repeating it here made two sentences say
       the same thing on one screen, so this area simply offers nothing. */
    audio.hidden = !ready;

    if (!ready) { status.textContent = NAR.TEXT.idle; markSpeaking(); return; }
    /* Anything really heard on this page makes it a page that can be heard
       AGAIN; until then the offer is simply to read it. A page whose clips
       were all missing has not been heard, and still says Listen. */
    if (reader.heard > 0 && readingView === preview.view) preview.heard.add(preview.node);
    const again = preview.heard.has(preview.node);
    listen.textContent = reader.playing
      ? NAR.TEXT.stop
      : (again ? NAR.TEXT.listen : NAR.TEXT.listenFirst);
    listen.setAttribute("aria-pressed", reader.playing ? "true" : "false");
    stop.disabled = !reader.playing;
    stop.textContent = NAR.TEXT.stop;
    const message = readingView === preview.view ? reader.status : NAR.TEXT.idle;
    status.textContent = again ? message : message.replace(/Listen again/g, "Listen");
    markSpeaking();
  }

  function render() {
    const node = NODES[preview.node];
    /* A full draw of the page. Everything below is built fresh and belongs to
       this view; everything from the previous one stops working here. */
    preview.view += 1;
    $("#beatHeading").textContent = node.heading;
    /* how far this reading has actually come. There is no total: the story
       branches, so promising "of 13" would be a promise about a path the child
       has not chosen. */
    $("#beatProgress").textContent = `Part ${preview.path.length} of this reading`;
    $("#beat").classList.toggle("is-building", Boolean(node.building));

    const lines = typeof node.lines === "function" ? node.lines(preview.plan) : node.lines;

    /* On the building node the words are folded away so that the picture and
       the tray sit together on a small screen. They are one tap away and are
       never required in order to build. */
    const fold = $("#beatFold");
    const text = $("#beatText");
    fold.hidden = !node.foldLines;
    text.hidden = Boolean(node.foldLines);
    const target = node.foldLines ? $("#beatFoldText") : text;
    /* Empty the one that is not being used as well. It was already hidden,
       but it still held the previous page's paragraphs, and each of those now
       carries its own "hear it again": two controls for the same part, one of
       them belonging to a page the child has left. */
    (node.foldLines ? text : $("#beatFoldText")).innerHTML = "";
    target.innerHTML = "";
    lines.forEach((line) => target.append(el("p", "beat-line reader-prose", line)));


    const route = $("#routeNote");
    route.textContent = alternativeNote();
    route.hidden = !route.textContent;

    const restart = $("#restartNote");
    restart.textContent = preview.confirmingRestart ? RESTART : "";
    restart.hidden = !restart.textContent;

    if (preview.explained && preview.node === BUILD_NODE) {
      const said = MAT.explanation(preview.plan);
      /* the explanation is not folded away: it is the thing that was just
         asked for */
      $("#buildExplain").textContent = said || "";
    } else {
      $("#buildExplain").textContent = "";
    }
    $("#buildExplain").hidden = !$("#buildExplain").textContent;

    renderPlanPanel(node);
    bindPlanHelp();
    /* the panel's open state belongs to the reading, not to the page: a step
       asked for here is still there on the building node */
    $("#planHelp").open = preview.helpStep > 0;

    renderScene(node);

    const build = $("#build");
    build.hidden = !node.building;
    if (node.building) buildTray();
    else $("#tray").innerHTML = "";

    renderActions(node);

    /* A new drawing of the page is a new page as far as the sound is
       concerned: whatever was being read belonged to the one before it. */
    hushAudio();
    bindAudioControls();
    refreshReading();

    /* Once the child has asked to listen, later pages read themselves. That
       first press is the gesture a browser needs before it will let anything
       play, and it is also the child saying they want to be read to; after it
       they should not have to ask again on every page. Turning the page while
       nothing is playing does not start it. */
    if (preview.listening && canListen()) speak(null);
  }

  /* What there is to read, now. Called after anything that changes it, so
     that a replay control and the Listen button always mean the page as it
     stands rather than the page as it was drawn. */
  function refreshReading() {
    paintAudio();
  }

  function bindAudioControls() {
    const listen = $("#listenBtn");
    const stop = $("#stopBtn");
    if (!listen || !stop) return;
    if (!listen._bound) {
      listen._bound = true;
      listen.addEventListener("click", () => {
        if (reader && reader.playing) {
          /* the same control stops it: one button, two states */
          preview.listening = false;
          hushAudio();
          paintAudio();
          return;
        }
        preview.listening = true;
        speak(null);
      });
      stop.addEventListener("click", () => {
        /* Stop means stop, including on the pages after this one. */
        preview.listening = false;
        hushAudio();
        paintAudio();
      });
    }
  }

  if (typeof document !== "undefined" && document.addEventListener) {
    document.addEventListener("DOMContentLoaded", () => {
      startReading();
      const cover = $("#readerCover"), start = $("#readWithMe");
      if (cover && start) start.addEventListener("click", () => {
        cover.hidden = true;
        $("#beat").hidden = false;
        $("#beatProgress").hidden = false;
        preview.listening = true;
        paintAudio();
        if (canListen()) speak(null);
      });
      if (window.addEventListener) window.addEventListener("resize", () => placeBlocks());
    });

    /* Leaving the page, or putting it in the background, is not a request to
       keep talking. The reading stops; nothing the child has built moves. */
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { hushAudio(); paintAudio(); }
    });
    /* the same for leaving the page altogether */
    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("pagehide", () => hushAudio());
    }
  }

  /* Read by the tests to drive the same engine the child uses. */
  /* The runtime the recording catalogue is produced from. It is the real
     table, the real materials model and the real description function, so the
     list Codex records is the list this page can actually ask for. */
  const NARRATION_RUNTIME = {
    MAT, NODES, describe: describePage,
    ROUTE_ENTRY, DESTINATION,
    CHOICE_NODE, PLAY_NODE, BUILD_NODE, PLAN_NODE, CLOSE_NODE
  };
  window.__towerNarration = {
    runtime: NARRATION_RUNTIME,
    catalogue: () => (NAR ? NAR.catalogue(NARRATION_RUNTIME) : []),
    describePage, currentView, SAY
  };

  window.__towerPreview = {
    preview, enter, back, takeBlock, startReading,
    describePage, currentView, NARRATION_RUNTIME, speak, hushAudio, reader,
    NODES, ART, START, BUILD_NODE, CHOICE_NODE, PLAY_NODE, ROUTE_ENTRY, DESTINATION,
    ALTERNATIVE, RETAINED, RESTART,
    takeRest, STAGES, containedRect, cellPlan, slotBox,
    shapeSprite, shapeSvg, slotSvg, faceFor, boxFor, INSET
  };
})();
