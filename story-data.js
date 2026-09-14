/* Bunny's Birthday Picnic — story content.
   British English. Narration is split into sentences so each line can be
   replayed on its own. Audio filenames come from the same FNV-1a hash the
   practice game uses, so any clip already recorded is reused untouched.

   Illustrations: assets/story/page-1.png … page-6.png (3:2 landscape).
   Each page also carries an inline SVG fallback that is shown only when the
   painting has not been dropped in yet, so the book is never blank. */

const STORY_TITLE = "Bunny's Birthday Picnic";

/* ---------- palette ---------- */

const CREAM = "#faf3e8";
const PAPER = "#f3e7d6";
const BLUSH = "#e8a0b4";
const BLUSH_SOFT = "#f6d9e0";
const SAGE = "#a3b89a";
const SAGE_DEEP = "#7f9a77";
const HONEY = "#e3b96b";
const BARK = "#a97c50";
const COCOA = "#4a3f35";
const BERRY = "#d2553c";
const SKYWASH = "#cfe3ef";

/* ---------- small art helpers (fallback illustrations only) ---------- */

function fbBunny(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="52" rx="26" ry="5" fill="rgba(74,63,53,0.14)"/>
    <path d="M-13 -26 Q-19 -62 -9 -66 Q-3 -51 -5 -26 Z" fill="#fdf8f0" stroke="${COCOA}" stroke-width="1.7"/>
    <path d="M13 -26 Q19 -62 9 -66 Q3 -51 5 -26 Z" fill="#fdf8f0" stroke="${COCOA}" stroke-width="1.7"/>
    <path d="M-12 -32 Q-15 -56 -9 -59 Q-6 -47 -7 -32 Z" fill="${BLUSH_SOFT}"/>
    <path d="M12 -32 Q15 -56 9 -59 Q6 -47 7 -32 Z" fill="${BLUSH_SOFT}"/>
    <ellipse cx="0" cy="20" rx="23" ry="26" fill="#fdf8f0" stroke="${COCOA}" stroke-width="1.7"/>
    <path d="M-21 12 Q0 4 21 12 L19 44 Q0 50 -19 44 Z" fill="${BLUSH}" stroke="${COCOA}" stroke-width="1.6"/>
    <path d="M-11 6 L-8 14 M11 6 L8 14" stroke="${BLUSH}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="0" cy="-14" r="19" fill="#fdf8f0" stroke="${COCOA}" stroke-width="1.7"/>
    <path d="M-13 -27 Q0 -33 13 -27 L11 -23 Q0 -28 -11 -23 Z" fill="${HONEY}" stroke="#b08a37" stroke-width="1.1"/>
    <path d="M0 -36 L3.4 -28 L-3.4 -28 Z" fill="${HONEY}" stroke="#b08a37" stroke-width="1.1" stroke-linejoin="round"/>
    <circle cx="-6" cy="-16" r="2.5" fill="${COCOA}"/><circle cx="6" cy="-16" r="2.5" fill="${COCOA}"/>
    <circle cx="-5" cy="-17.2" r="0.9" fill="#fff"/><circle cx="7" cy="-17.2" r="0.9" fill="#fff"/>
    <circle cx="-12" cy="-8" r="2.6" fill="${BLUSH}" opacity="0.6"/>
    <circle cx="12" cy="-8" r="2.6" fill="${BLUSH}" opacity="0.6"/>
    <path d="M-2.4 -8 Q0 -6 2.4 -8" fill="${BLUSH}" stroke="${COCOA}" stroke-width="1"/>
    <path d="M0 -6 Q0 -2 -3.6 -2 M0 -6 Q0 -2 3.6 -2" fill="none" stroke="${COCOA}" stroke-width="1.2" stroke-linecap="round"/>
  </g>`;
}

function fbBear(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="54" rx="28" ry="5" fill="rgba(74,63,53,0.14)"/>
    <circle cx="-17" cy="-30" r="9" fill="${BARK}" stroke="${COCOA}" stroke-width="1.7"/>
    <circle cx="17" cy="-30" r="9" fill="${BARK}" stroke="${COCOA}" stroke-width="1.7"/>
    <circle cx="-17" cy="-30" r="4.4" fill="#c99a72"/><circle cx="17" cy="-30" r="4.4" fill="#c99a72"/>
    <ellipse cx="0" cy="22" rx="25" ry="27" fill="${BARK}" stroke="${COCOA}" stroke-width="1.7"/>
    <path d="M-23 14 Q0 6 23 14 L21 46 Q0 52 -21 46 Z" fill="${SAGE}" stroke="${COCOA}" stroke-width="1.6"/>
    <path d="M-12 8 L-9 16 M12 8 L9 16" stroke="${SAGE}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="0" cy="-13" r="20" fill="${BARK}" stroke="${COCOA}" stroke-width="1.7"/>
    <ellipse cx="0" cy="-6" rx="10" ry="8" fill="#e0bb96"/>
    <circle cx="-7" cy="-17" r="2.5" fill="${COCOA}"/><circle cx="7" cy="-17" r="2.5" fill="${COCOA}"/>
    <circle cx="-6" cy="-18.2" r="0.9" fill="#fff"/><circle cx="8" cy="-18.2" r="0.9" fill="#fff"/>
    <ellipse cx="0" cy="-9" rx="3.4" ry="2.6" fill="${COCOA}"/>
    <path d="M0 -6 Q0 -2 -3.6 -2 M0 -6 Q0 -2 3.6 -2" fill="none" stroke="${COCOA}" stroke-width="1.2" stroke-linecap="round"/>
  </g>`;
}

function fbDuck(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="30" rx="18" ry="4" fill="rgba(74,63,53,0.14)"/>
    <ellipse cx="2" cy="12" rx="19" ry="15" fill="#f5d36b" stroke="${COCOA}" stroke-width="1.6"/>
    <circle cx="-11" cy="-6" r="12" fill="#f5d36b" stroke="${COCOA}" stroke-width="1.6"/>
    <path d="M-20 -2 Q-24 4 -19 6 L-13 3 Z" fill="${HONEY}" stroke="${COCOA}" stroke-width="1.4"/>
    <path d="M-20 2 Q-11 6 -2 2 L-3 7 Q-11 10 -19 7 Z" fill="#9dc9e0" stroke="${COCOA}" stroke-width="1.3"/>
    <circle cx="-13" cy="-8" r="2" fill="${COCOA}"/><circle cx="-12.3" cy="-8.8" r="0.7" fill="#fff"/>
    <path d="M8 8 Q20 12 16 20" fill="none" stroke="${COCOA}" stroke-width="1.5"/>
    <path d="M-4 26 L-4 32 M6 26 L6 32" stroke="${HONEY}" stroke-width="2.4" stroke-linecap="round"/>
  </g>`;
}

function fbBerry(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M0 13 C-8 8 -10 -2 -5 -6 C-2 -8 2 -8 5 -6 C10 -2 8 8 0 13 Z" fill="${BERRY}" stroke="#a03e2b" stroke-width="1.1"/>
    <path d="M-6 -6 L-2 -9 L0 -6 L2 -9 L6 -6 Q0 -3 -6 -6 Z" fill="${SAGE_DEEP}" stroke="#5f7a58" stroke-width="0.9"/>
    <circle cx="-2.4" cy="1" r="0.8" fill="#ffe7a8"/><circle cx="2.6" cy="3" r="0.8" fill="#ffe7a8"/>
  </g>`;
}

function fbBloom(x, y, colour, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M0 0 L0 11" stroke="${SAGE_DEEP}" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="0" cy="-3.6" r="3.1" fill="${colour}"/><circle cx="-4.2" cy="-0.6" r="3.1" fill="${colour}"/>
    <circle cx="4.2" cy="-0.6" r="3.1" fill="${colour}"/><circle cx="-2.6" cy="-7" r="3.1" fill="${colour}"/>
    <circle cx="2.6" cy="-7" r="3.1" fill="${colour}"/><circle cx="0" cy="-3.2" r="1.7" fill="${HONEY}"/>
  </g>`;
}

function fbGarden(extra = "", sky = SKYWASH) {
  return `<rect width="900" height="600" fill="${sky}"/>
    <circle cx="762" cy="96" r="46" fill="${HONEY}" opacity="0.85"/>
    <circle cx="762" cy="96" r="64" fill="${HONEY}" opacity="0.22"/>
    <path d="M0 352 Q190 316 420 348 Q640 380 900 336 L900 600 L0 600 Z" fill="${SAGE}"/>
    <path d="M0 424 Q240 392 480 424 Q700 452 900 414 L900 600 L0 600 Z" fill="${SAGE_DEEP}" opacity="0.5"/>
    ${extra}`;
}

/* ---------- pages ---------- */

const STORY_PAGES = [
  {
    id: "page-1",
    title: "A Birthday in the Garden",
    image: "assets/story/page-1.png",
    lines: [
      "It was a bright and sunny morning in the garden.",
      "Today was Bunny's birthday, and she wore her best pink pinafore.",
      "Her little gold crown sparkled in the sunshine.",
      "We are going to have a picnic, said Bunny happily.",
      "Duck had begun a string of paper flags for the party, but it was not finished yet."
    ],
    fallback: fbGarden(`
      ${fbBloom(120, 402, BLUSH, 2.1)}${fbBloom(196, 436, "#ffffff", 1.9)}
      ${fbBloom(760, 400, BLUSH, 2)}${fbBloom(830, 440, HONEY, 1.9)}
      <g transform="translate(150 250)">
        <path d="M-13 108 L13 108 L9 8 L-9 8 Z" fill="#8a6340"/>
        <circle cx="0" cy="-28" r="66" fill="${SAGE_DEEP}"/>
        <circle cx="-48" cy="4" r="42" fill="${SAGE}"/><circle cx="48" cy="0" r="40" fill="${SAGE}"/>
      </g>
      <g transform="translate(470 300)">
        <rect x="-90" y="0" width="180" height="12" rx="6" fill="${BARK}"/>
        <path d="M-78 0 Q-40 -46 0 -14 Q40 -46 78 0 Z" fill="${BLUSH_SOFT}" stroke="${COCOA}" stroke-width="2.4"/>
        <path d="M-52 -6 L-52 -34 M0 -18 L0 -46 M52 -6 L52 -34" stroke="${BLUSH}" stroke-width="3.4" stroke-linecap="round"/>
      </g>
      ${fbBunny(452, 402, 1.5)}
      ${fbDuck(640, 452, 1.5)}`),
    interaction: null
  },

  {
    id: "page-2",
    title: "Laying Out the Picnic",
    image: "assets/story/page-2.png",
    lines: [
      "Duck came waddling over to help get everything ready.",
      "The blanket was out, but the table still looked rather plain.",
      "We need a decoration for the picnic, said Bunny.",
      "Duck tipped out a basket of paper shapes to choose from."
    ],
    fallback: fbGarden(`
      ${fbBloom(96, 420, BLUSH, 2)}${fbBloom(842, 408, "#ffffff", 2)}
      <g transform="translate(430 430) rotate(-2)">
        <rect x="-140" y="-30" width="280" height="60" rx="12" fill="${BLUSH_SOFT}" stroke="${COCOA}" stroke-width="3.4"/>
        <path d="M-140 -4 H140 M-70 -30 V30 M0 -30 V30 M70 -30 V30" stroke="${BLUSH}" stroke-width="3.4" opacity="0.85"/>
      </g>
      <g transform="translate(250 402)">
        <path d="M-38 -12 L38 -12 L31 32 L-31 32 Z" fill="#d3a06d" stroke="#8a5c33" stroke-width="3.4"/>
        <path d="M-25 -12 Q0 -48 25 -12" fill="none" stroke="#8a5c33" stroke-width="4.6"/>
      </g>
      <g transform="translate(432 388)">
        <ellipse cx="0" cy="10" rx="26" ry="19" fill="#fdf8f0" stroke="${COCOA}" stroke-width="3"/>
        <path d="M24 4 Q38 8 33 20 Q28 26 23 22" fill="none" stroke="${COCOA}" stroke-width="3"/>
        <path d="M-24 2 Q-38 -6 -30 -14" fill="none" stroke="${COCOA}" stroke-width="3"/>
        <path d="M-13 -8 L13 -8 L10 -17 L-10 -17 Z" fill="${BLUSH}" stroke="${COCOA}" stroke-width="2.6"/>
        <circle cx="0" cy="-20" r="3.8" fill="${HONEY}" stroke="${COCOA}" stroke-width="1.8"/>
      </g>
      ${fbBunny(680, 400, 1.4)}
      ${fbDuck(148, 440, 1.6)}`),
    interaction: {
      type: "placement",
      skill: "english",
      taskId: "place-picnic",
      instructionLine: "Listen, then put each thing in the right place.",
      steps: [
        {
          itemId: "blanket", targetId: "grass",
          prompt: "Put the blanket on the grass.",
          hints: [
            "Tap the blanket first, then tap where it should go.",
            "The grass is the big green space in the middle.",
            "Tap the blanket, then tap the green grass."
          ]
        },
        {
          itemId: "basket", targetId: "beside",
          prompt: "Put the basket next to the blanket.",
          hints: [
            "Next to means right beside it.",
            "The basket does not go on top. It goes beside the blanket.",
            "Tap the basket, then tap the space beside the blanket."
          ]
        },
        {
          twoStep: true,
          prompt: "Put the plate on the blanket, then put the cup next to the plate.",
          replayPrompt: "First the plate on the blanket. Then the cup next to the plate.",
          parts: [
            { itemId: "plate", targetId: "onblanket", partPrompt: "First, the plate on the blanket." },
            { itemId: "cup", targetId: "besideplate", partPrompt: "Now the cup next to the plate." }
          ],
          hints: [
            "There are two things to do. Start with the first one.",
            "First the plate goes on the blanket. Then the cup goes beside it.",
            "Tap the plate and put it on the blanket. Then tap the cup and put it next to the plate."
          ]
        }
      ],
      successLine: "The picnic looks lovely. Thank you for helping!"
    }
  },

  {
    id: "page-3",
    title: "Bear Brings the Strawberries",
    image: "assets/story/page-3.png",
    lines: [
      "Then Bear arrived in his green dungarees, carrying a basket.",
      "There were red strawberries already inside it.",
      "I picked some more on the way, said Bear.",
      "Let us put them all in and count them together."
    ],
    fallback: fbGarden(`
      ${fbBloom(112, 428, BLUSH, 2)}${fbBloom(820, 418, HONEY, 2)}
      <g transform="translate(742 262)">
        <path d="M-12 100 L12 100 L8 6 L-8 6 Z" fill="#8a6340"/>
        <circle cx="0" cy="-24" r="58" fill="${SAGE_DEEP}"/>
        <circle cx="-42" cy="2" r="38" fill="${SAGE}"/>
      </g>
      <g transform="translate(300 400)">
        <path d="M-52 -16 L52 -16 L43 44 L-43 44 Z" fill="#d3a06d" stroke="#8a5c33" stroke-width="3.6"/>
        <path d="M-42 8 H42" stroke="#8a5c33" stroke-width="3" opacity="0.7"/>
        <path d="M-34 -16 Q0 -60 34 -16" fill="none" stroke="#8a5c33" stroke-width="5"/>
        ${fbBerry(-30, -6, 1.5)}${fbBerry(-6, -10, 1.5)}${fbBerry(18, -6, 1.5)}${fbBerry(34, -12, 1.4)}
      </g>
      ${fbBear(520, 396, 1.5)}
      ${fbBunny(150, 410, 1.35)}`),
    interaction: {
      type: "maths",
      skill: "maths",
      taskId: "add-12-5",
      operation: "add",
      startCount: 12,
      changeCount: 5,
      answer: 17,
      collectPrompt: "Tap the five strawberries to put them in the basket.",
      countPrompt: "Now count them all. How many strawberries are there?",
      equation: "12 + 5 = ?",
      choicesFrom: 10,
      choicesTo: 20,
      hints: [
        "Count the strawberries already in the basket first.",
        "There are twelve in the basket and five more. Count on: thirteen, fourteen.",
        "Twelve and five make seventeen."
      ],
      successLine: "Seventeen strawberries. The basket is full!"
    }
  },

  {
    id: "page-4",
    title: "Rain on the Picnic",
    image: "assets/story/page-4.png",
    lines: [
      "Suddenly, grey clouds crept over the sun, and the garden went dim.",
      "Pitter patter! Rain began to fall on the blanket.",
      "Duck's paper flags went soft and droopy, and Duck felt like crying.",
      "It is alright to feel cross when a plan goes wrong, said Bunny.",
      "Bunny slipped the paper flags safely inside the basket, away from the rain.",
      "If we stay here, everything will get wet, said Bear. So let us think under the tree."
    ],
    fallback: `<rect width="900" height="600" fill="#b8c6d2"/>
      <path d="M0 352 Q190 320 420 350 Q640 380 900 338 L900 600 L0 600 Z" fill="#8fa886"/>
      <path d="M0 424 Q240 396 480 426 Q700 452 900 416 L900 600 L0 600 Z" fill="#7a9272" opacity="0.55"/>
      <g opacity="0.9">
        <ellipse cx="200" cy="92" rx="86" ry="38" fill="#8e9caa"/>
        <ellipse cx="286" cy="72" rx="62" ry="32" fill="#9dabb8"/>
        <ellipse cx="470" cy="82" rx="94" ry="40" fill="#8e9caa"/>
        <ellipse cx="700" cy="98" rx="82" ry="36" fill="#8e9caa"/>
      </g>
      <g stroke="#7fa8d0" stroke-width="3.4" stroke-linecap="round" opacity="0.85">
        <path d="M160 156 L150 194"/><path d="M250 142 L240 180"/><path d="M340 162 L330 200"/>
        <path d="M430 140 L420 178"/><path d="M520 160 L510 198"/><path d="M610 146 L600 184"/>
        <path d="M700 166 L690 204"/><path d="M790 150 L780 188"/><path d="M205 224 L195 258"/>
        <path d="M385 230 L375 264"/><path d="M565 226 L555 260"/><path d="M745 236 L735 270"/>
      </g>
      <g transform="translate(232 248)">
        <path d="M-20 152 L20 152 L14 12 L-14 12 Z" fill="#7d5a3a"/>
        <circle cx="0" cy="-30" r="96" fill="#6b8f64"/>
        <circle cx="-70" cy="8" r="60" fill="#78a070"/><circle cx="70" cy="4" r="58" fill="#78a070"/>
        <circle cx="-22" cy="-86" r="50" fill="#78a070"/>
      </g>
      ${fbBunny(430, 434, 1.35)}
      ${fbBear(560, 430, 1.35)}
      ${fbDuck(680, 470, 1.4)}`,
    interaction: {
      type: "question-chain",
      skill: "english",
      taskId: "why-tree",
      questions: [
        {
          id: "why",
          prompt: "Why did they move under the big tree?",
          options: [
            { id: "rain", label: "Because it started to rain", correct: true, icon: "rain" },
            { id: "sleepy", label: "Because they were sleepy", correct: false, icon: "sleep" },
            { id: "cake", label: "Because the cake was ready", correct: false, icon: "cake" }
          ],
          hints: [
            "Think about what happened just before they moved.",
            "Something cold and wet began to fall from the grey clouds.",
            "They moved because it started to rain."
          ],
          successLine: "Yes! The rain came, so they found a dry spot."
        },
        {
          id: "order",
          prompt: "What happened first?",
          options: [
            { id: "clouds", label: "Grey clouds covered the sun", correct: true, icon: "cloudsun" },
            { id: "carry", label: "They carried the basket away", correct: false, icon: "basket" },
            { id: "dry", label: "They sat down in the dry", correct: false, icon: "tree" }
          ],
          hints: [
            "Think about the very beginning of the rain.",
            "Before the rain fell, something covered the sun.",
            "First the grey clouds covered the sun, then the rain fell."
          ],
          successLine: "That is right. The clouds came first, then the rain."
        }
      ]
    }
  },

  {
    id: "page-5",
    title: "Sharing Under the Tree",
    image: "assets/story/page-5.png",
    lines: [
      "Under the leaves it was warm and dry, because the branches held the rain off.",
      "Here is our plan, said Bear. First we lay the flags out to dry, then we finish the last one.",
      "Duck still felt a little disappointed, but was willing to try.",
      "While the flags dried, Bunny opened the basket to share the strawberries.",
      "Let us put some on Duck's plate and see how many are left."
    ],
    fallback: `<rect width="900" height="600" fill="#c6d4dd"/>
      <path d="M0 356 Q190 326 420 354 Q640 382 900 342 L900 600 L0 600 Z" fill="${SAGE}"/>
      <path d="M0 428 Q240 400 480 428 Q700 454 900 418 L900 600 L0 600 Z" fill="${SAGE_DEEP}" opacity="0.5"/>
      <g transform="translate(450 210)">
        <path d="M-26 218 L26 218 L18 20 L-18 20 Z" fill="#7d5a3a"/>
        <circle cx="0" cy="-20" r="140" fill="#6b8f64" opacity="0.95"/>
        <circle cx="-110" cy="40" r="82" fill="#78a070"/><circle cx="110" cy="36" r="80" fill="#78a070"/>
        <circle cx="-46" cy="-104" r="70" fill="#78a070"/><circle cx="52" cy="-98" r="64" fill="#6b8f64"/>
      </g>
      <g transform="translate(430 476) rotate(-1)">
        <rect x="-160" y="-26" width="320" height="52" rx="11" fill="${BLUSH_SOFT}" stroke="${COCOA}" stroke-width="3.2"/>
        <path d="M-160 -2 H160 M-80 -26 V26 M0 -26 V26 M80 -26 V26" stroke="${BLUSH}" stroke-width="3.2" opacity="0.85"/>
      </g>
      <g transform="translate(392 430)">
        <path d="M-46 -14 L46 -14 L38 38 L-38 38 Z" fill="#d3a06d" stroke="#8a5c33" stroke-width="3.4"/>
        <path d="M-30 -14 Q0 -54 30 -14" fill="none" stroke="#8a5c33" stroke-width="4.6"/>
        ${fbBerry(-22, -4, 1.4)}${fbBerry(2, -8, 1.4)}${fbBerry(24, -4, 1.4)}
      </g>
      <g transform="translate(560 452)">
        <ellipse cx="0" cy="4" rx="34" ry="15" fill="#fdf8f0" stroke="${COCOA}" stroke-width="3.2"/>
        <ellipse cx="0" cy="1" rx="22" ry="9" fill="${BLUSH_SOFT}" stroke="${COCOA}" stroke-width="2.2"/>
        ${fbBerry(-11, -1, 1.1)}${fbBerry(1, -4, 1.1)}${fbBerry(12, -1, 1.1)}${fbBerry(0, 5, 1.1)}
      </g>
      ${fbBunny(268, 448, 1.3)}
      ${fbBear(748, 440, 1.25)}
      ${fbDuck(632, 486, 1.45)}`,
    interaction: {
      type: "maths",
      skill: "maths",
      taskId: "take-17-4",
      operation: "subtract",
      startCount: 17,
      changeCount: 4,
      answer: 13,
      collectPrompt: "Tap four strawberries to put on Duck's plate.",
      countPrompt: "How many strawberries are left in the basket?",
      equation: "17 - 4 = ?",
      choicesFrom: 8,
      choicesTo: 18,
      hints: [
        "Count how many strawberries are still in the basket.",
        "Seventeen take away four. Count back: sixteen, fifteen.",
        "Seventeen take away four leaves thirteen."
      ],
      successLine: "Thirteen strawberries left in the basket. Well counted!"
    }
  },

  {
    id: "page-6",
    title: "Sunshine Again",
    image: "assets/story/page-6.png",
    lines: [
      "The rain stopped, and the sun came out again.",
      "Raindrops sparkled on the leaves, and then they saw a rainbow.",
      "Bunny's cake was ready, with a little candle on the top.",
      "Duck gathered the dry paper flags and laid them in a row.",
      "Only the bunting was missing a flag, so it could not go up yet.",
      "Let us finish it, and then you can draw the picnic for Bunny."
    ],
    fallback: fbGarden(`
      <path d="M90 352 A360 360 0 0 1 810 352" fill="none" stroke="${BLUSH}" stroke-width="18" opacity="0.5"/>
      <path d="M112 352 A338 338 0 0 1 788 352" fill="none" stroke="${HONEY}" stroke-width="18" opacity="0.5"/>
      <path d="M134 352 A316 316 0 0 1 766 352" fill="none" stroke="${SAGE}" stroke-width="18" opacity="0.5"/>
      <g transform="translate(430 452) rotate(-2)">
        <rect x="-150" y="-28" width="300" height="56" rx="12" fill="${BLUSH_SOFT}" stroke="${COCOA}" stroke-width="3.4"/>
        <path d="M-150 -2 H150 M-75 -28 V28 M0 -28 V28 M75 -28 V28" stroke="${BLUSH}" stroke-width="3.4" opacity="0.85"/>
      </g>
      <g transform="translate(430 386)">
        <ellipse cx="0" cy="44" rx="66" ry="10" fill="rgba(74,63,53,0.13)"/>
        <rect x="-58" y="-8" width="116" height="52" rx="9" fill="#fff3dd" stroke="${COCOA}" stroke-width="3.2"/>
        <rect x="-58" y="-8" width="116" height="17" rx="7" fill="${BLUSH}" stroke="${COCOA}" stroke-width="2.6"/>
        <path d="M-48 -8 Q-38 -24 -28 -8 Q-18 -24 -8 -8 Q2 -24 12 -8 Q22 -24 32 -8 Q42 -24 52 -8" fill="#fff" stroke="${COCOA}" stroke-width="2.4"/>
        <rect x="-3" y="-42" width="7" height="26" rx="2" fill="${BLUSH}" stroke="${COCOA}" stroke-width="2.2"/>
        <path d="M0.5 -44 L0.5 -50" stroke="${COCOA}" stroke-width="1.8" stroke-linecap="round"/>
        <ellipse cx="0.5" cy="-54" rx="5" ry="7.5" fill="${HONEY}" stroke="#c99a3f" stroke-width="1.6"/>
        <ellipse cx="0.5" cy="-55" rx="2.2" ry="3.4" fill="#fff6d8"/>
      </g>
      ${fbBunny(190, 424, 1.4)}
      ${fbBear(680, 420, 1.4)}
      ${fbDuck(790, 468, 1.3)}`),
    interaction: { type: "drawing", skill: null, taskId: "draw-picnic" }
  }
];

/* ---------- placement stage (page 2) ---------- */

const PLACEMENT_SCENE = {
  viewBox: "0 0 640 300",
  backdrop: `<rect width="640" height="300" fill="${SKYWASH}"/>
    <path d="M0 118 Q160 96 330 116 Q470 134 640 108 L640 300 L0 300 Z" fill="${SAGE}"/>
    <path d="M0 176 Q180 156 360 178 Q500 194 640 168 L640 300 L0 300 Z" fill="${SAGE_DEEP}" opacity="0.45"/>
    ${fbBloom(48, 254, BLUSH, 1.5)}${fbBloom(596, 244, "#ffffff", 1.5)}`,
  targets: [
    { id: "grass", label: "on the grass", x: 196, y: 178, width: 250, height: 96 },
    { id: "beside", label: "next to the blanket", x: 470, y: 190, width: 140, height: 84 },
    { id: "onblanket", label: "on the blanket", x: 236, y: 140, width: 112, height: 62 },
    { id: "besideplate", label: "next to the plate", x: 362, y: 150, width: 92, height: 56 }
  ],
  items: [
    {
      id: "blanket", label: "blanket",
      art: `<g><rect x="-66" y="-23" width="132" height="46" rx="9" fill="${BLUSH_SOFT}" stroke="${COCOA}" stroke-width="3.2"/>
        <path d="M-66 -2 H66 M-33 -23 V23 M0 -23 V23 M33 -23 V23" stroke="${BLUSH}" stroke-width="2.8" opacity="0.85"/></g>`
    },
    {
      id: "basket", label: "basket",
      art: `<g><path d="M-33 -11 L33 -11 L27 27 L-27 27 Z" fill="#d3a06d" stroke="#8a5c33" stroke-width="3.2"/>
        <path d="M-22 5 H22" stroke="#8a5c33" stroke-width="2.4" opacity="0.7"/>
        <path d="M-22 -11 Q0 -42 22 -11" fill="none" stroke="#8a5c33" stroke-width="4.2"/>
        ${fbBerry(-12, -4, 0.95)}${fbBerry(7, -6, 0.95)}</g>`
    },
    {
      id: "plate", label: "plate",
      art: `<g><ellipse cx="0" cy="4" rx="27" ry="13" fill="#fdf8f0" stroke="${COCOA}" stroke-width="3"/>
        <ellipse cx="0" cy="2" rx="17" ry="8" fill="${BLUSH_SOFT}" stroke="${COCOA}" stroke-width="2"/>
        ${fbBerry(-6, 0, 0.85)}${fbBerry(8, 2, 0.85)}</g>`
    },
    {
      id: "cup", label: "cup",
      art: `<g><path d="M-13 -10 L13 -10 L10 14 L-10 14 Z" fill="#fdf8f0" stroke="${COCOA}" stroke-width="2.8"/>
        <path d="M-13 -10 H13" stroke="${BLUSH}" stroke-width="4"/>
        <path d="M13 -4 Q24 -2 21 7 Q18 12 13 10" fill="none" stroke="${COCOA}" stroke-width="2.6"/>
        <ellipse cx="0" cy="16" rx="12" ry="3.4" fill="${BLUSH_SOFT}" stroke="${COCOA}" stroke-width="2.2"/></g>`
    }
  ]
};

/* ---------- optional extension challenges (offered after a page task) ---------- */

const EXTRA_CHALLENGES = [
  {
    id: "bridge-8-7",
    operation: "add",
    startCount: 8,
    changeCount: 7,
    answer: 15,
    equation: "8 + 7 = ?",
    collectPrompt: "Tap seven more strawberries to add them.",
    countPrompt: "How many strawberries now?",
    choicesFrom: 10, choicesTo: 20,
    hints: [
      "Fill the first ten frame right up to ten.",
      "Eight and two make ten. Then five more are left over.",
      "Eight and seven make fifteen."
    ],
    successLine: "Fifteen. You crossed over ten. Brilliant!"
  },
  {
    id: "bridge-17-9",
    operation: "subtract",
    startCount: 17,
    changeCount: 9,
    answer: 8,
    equation: "17 - 9 = ?",
    collectPrompt: "Tap nine strawberries to take them away.",
    countPrompt: "How many strawberries are left?",
    choicesFrom: 2, choicesTo: 12,
    hints: [
      "Take seven away first, to get back down to ten.",
      "Seventeen take away seven is ten. Then take two more.",
      "Seventeen take away nine leaves eight."
    ],
    successLine: "Eight. That was a tricky one. Well done!"
  },
  {
    id: "missing-12-20",
    operation: "missing",
    startCount: 12,
    answer: 8,
    total: 20,
    equation: "12 + ? = 20",
    collectPrompt: "Tap strawberries until there are twenty altogether.",
    countPrompt: "How many did you need to add?",
    choicesFrom: 3, choicesTo: 13,
    hints: [
      "Keep adding until both ten frames are full.",
      "Twelve is here. Count on to twenty and see how many you add.",
      "Twelve and eight make twenty."
    ],
    successLine: "Eight more makes twenty. Super counting!"
  }
];

/* ---------- comprehension option art ---------- */

const QUESTION_ICONS = {
  rain: `<svg viewBox="0 0 120 120" aria-hidden="true"><path d="M32 56 C34 32 66 30 72 52 C90 46 104 60 98 76 H30 C14 76 14 54 32 56 Z" fill="#9dabb8" stroke="${COCOA}" stroke-width="4"/><g stroke="#7fa8d0" stroke-width="5" stroke-linecap="round"><path d="M40 88 L34 104"/><path d="M62 88 L56 104"/><path d="M84 88 L78 104"/></g></svg>`,
  sleep: `<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="54" cy="66" r="30" fill="${HONEY}" stroke="${COCOA}" stroke-width="4"/><path d="M40 60 H50 M58 60 H68" stroke="${COCOA}" stroke-width="4" stroke-linecap="round"/><ellipse cx="54" cy="80" rx="7" ry="5" fill="${COCOA}"/><path d="M82 26 H100 L82 46 H100" fill="none" stroke="${COCOA}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  cake: `<svg viewBox="0 0 120 120" aria-hidden="true"><rect x="26" y="58" width="68" height="38" rx="6" fill="#fff3dd" stroke="${COCOA}" stroke-width="4"/><rect x="26" y="58" width="68" height="12" rx="5" fill="${BLUSH}" stroke="${COCOA}" stroke-width="3"/><rect x="56" y="36" width="6" height="20" fill="${SAGE}" stroke="${COCOA}" stroke-width="2.4"/><ellipse cx="59" cy="32" rx="4" ry="6" fill="${HONEY}" stroke="#c99a3f" stroke-width="1.6"/></svg>`,
  cloudsun: `<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="76" cy="42" r="20" fill="${HONEY}" opacity="0.9"/><path d="M28 62 C30 40 62 38 68 58 C86 52 100 66 94 82 H26 C10 82 10 60 28 62 Z" fill="#9dabb8" stroke="${COCOA}" stroke-width="4"/></svg>`,
  basket: `<svg viewBox="0 0 120 120" aria-hidden="true"><path d="M28 52 L92 52 L82 96 H38 Z" fill="#d3a06d" stroke="#8a5c33" stroke-width="4"/><path d="M40 72 H80" stroke="#8a5c33" stroke-width="3" opacity="0.7"/><path d="M42 52 Q60 20 78 52" fill="none" stroke="#8a5c33" stroke-width="5"/></svg>`,
  tree: `<svg viewBox="0 0 120 120" aria-hidden="true"><path d="M52 100 H68 L64 60 H56 Z" fill="#7d5a3a"/><circle cx="60" cy="46" r="30" fill="#6b8f64"/><circle cx="36" cy="58" r="20" fill="#78a070"/><circle cx="84" cy="56" r="19" fill="#78a070"/></svg>`
};

/* ---------- drawing stickers ---------- */

const DRAWING_STICKERS = [
  { id: "strawberry", label: "Strawberry", art: fbBerry(0, 0, 2.6) },
  { id: "flower-pink", label: "Pink flower", art: fbBloom(0, 0, BLUSH, 2.6) },
  { id: "flower-white", label: "White flower", art: fbBloom(0, 0, "#ffffff", 2.6) },
  { id: "sun", label: "Sun", art: `<g><circle cx="0" cy="0" r="15" fill="${HONEY}" stroke="#c99a3f" stroke-width="2.4"/><g stroke="${HONEY}" stroke-width="4" stroke-linecap="round"><path d="M0 -23 V-30"/><path d="M0 23 V30"/><path d="M-23 0 H-30"/><path d="M23 0 H30"/><path d="M-16 -16 L-21 -21"/><path d="M16 16 L21 21"/><path d="M-16 16 L-21 21"/><path d="M16 -16 L21 -21"/></g></g>` },
  { id: "cloud", label: "Cloud", art: `<path d="M-22 8 C-24 -10 2 -14 8 2 C24 -4 34 8 28 18 H-16 C-30 18 -30 6 -22 8 Z" fill="#fff" stroke="${COCOA}" stroke-width="2.4"/>` },
  { id: "heart", label: "Heart", art: `<path d="M0 19 C-21 4 -21 -11 -10 -15 C-4 -17 0 -12 0 -8 C0 -12 4 -17 10 -15 C21 -11 21 4 0 19 Z" fill="${BLUSH}" stroke="${COCOA}" stroke-width="2.4"/>` },
  { id: "star", label: "Star", art: `<path d="M0 -19 L6 -6 L20 -6 L9 3 L13 18 L0 9 L-13 18 L-9 3 L-20 -6 L-6 -6 Z" fill="${HONEY}" stroke="#c99a3f" stroke-width="2.2"/>` },
  { id: "cake", label: "Cake", art: `<g><rect x="-22" y="-6" width="44" height="22" rx="4" fill="#fff3dd" stroke="${COCOA}" stroke-width="2.4"/><rect x="-22" y="-6" width="44" height="7" rx="3" fill="${BLUSH}" stroke="${COCOA}" stroke-width="2"/><rect x="-2" y="-19" width="4" height="12" fill="${SAGE}" stroke="${COCOA}" stroke-width="1.6"/><ellipse cx="0" cy="-21" rx="3" ry="4" fill="${HONEY}" stroke="#c99a3f" stroke-width="1.2"/></g>` }
];

const DRAWING_COLOURS = [
  "#d2553c", "#e8a0b4", "#e3b96b", "#a3b89a",
  "#7fa8d0", "#b79ad0", "#a97c50", "#4a3f35"
];

/* ---------- spoken helper lines ---------- */

const STORY_UI_LINES = {
  welcome: "Hello! Would you like to hear Bunny's Birthday Picnic?",
  listenAgain: "Let us listen to that page again.",
  tryAgain: "Not quite. Let us try that again together.",
  encourage: "Have another go. I am right here with you.",
  drawIntro: "Draw anything you like for Bunny's picnic.",
  drawSaved: "What a lovely picture. Thank you!",
  storyEnd: "The end. Thank you for listening."
};

window.YoyoStory = {
  title: STORY_TITLE,
  pages: STORY_PAGES,
  placementScene: PLACEMENT_SCENE,
  questionIcons: QUESTION_ICONS,
  stickers: DRAWING_STICKERS,
  colours: DRAWING_COLOURS,
  uiLines: STORY_UI_LINES,
  extraChallenges: EXTRA_CHALLENGES
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = window.YoyoStory;
}
