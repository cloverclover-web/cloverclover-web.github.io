/* The Shadow Theatre: the pages that are only a story.

   The rehearsal pages - A1 to A4 and B1 to B4 - are built from the model, because every
   word on them describes a measurement. These do not. The opening, the
   watching route and the ending are told, not measured, so they live here as
   plain text and the engine only shows them.

   Two things this file is careful about.

   First, WHAT IS PAINTED. The invitation, choice, audience and putting-away
   paintings have been selected for these pages. Other told pages have no picture yet, and
   a page with no picture shows no picture. The rehearsal painting is not
   borrowed to stand in for a scene it is not, because a book that looks
   finished is not the same as a book that is finished. `ART` below is the
   whole of what exists; `MISSING` names the pages that are still waiting, so
   the gap is a list rather than an impression.

   Second, WHAT IS PLAYABLE. The approved manuscript offers three ways on from
   C4: the garden giant, the little doorway, and watching a garden story.
   All three routes are implemented, but missing art and unrecorded narration
   remain explicit production gaps rather than claims of a finished book.

   Nothing here draws, measures, stores, speaks or fetches. */

(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.YoyoShadowStory = api;
})(typeof self !== "undefined" ? self : (typeof globalThis !== "undefined" ? globalThis : null), function () {
  "use strict";

  /* The paintings that really exist, with the words that describe them for a
     child who cannot see them. Provenance is in assets/shadow/ART_NOTES.md. */
  const ART = {
    invitation: {
      src: "assets/shadow/invitation-v2.jpg",
      alt: "Bunny, Bear and Duck around a low table. Bear holds open a cloth book "
        + "with a flat paper visitor lying inside it, Bunny has brought a paper "
        + "sunflower picture and Duck's paper garden doorway lies beside his wing. "
        + "The little wooden theatre stands behind them with its screen blank and unlit",
      caption: "The afternoon the play was thought of."
    },
    choice: {
      src: "assets/shadow/choice-v2.jpg",
      alt: "Bunny, Bear and Duck sit around a table with the paper puppet upright in its holder. "
        + "The sunflower and doorway pictures lie in front of them as they decide which story to tell",
      caption: "There is more than one story to tell."
    },
    puppetHolder: {
      src: "assets/shadow/puppet-holder-v1.jpg",
      alt: "Bear gently steadies the flat paper visitor in its low wooden holder while Bunny watches. "
        + "The closed book rests nearby. The lamp and screen are outside this close view",
      caption: "Getting the paper visitor ready."
    },
    audience: {
      src: "assets/shadow/audience-v3.jpg",
      alt: "Bunny sits on a cushion beside Bear's dad, ready to watch the little theatre. "
        + "The performers are outside this view",
      caption: "A place to watch together."
    },
    gardenHello: {
      src: "assets/shadow/garden-hello-v1.jpg",
      alt: "Bunny answers the garden visitor from her cushion with a small wave. "
        + "Bear's dad listens beside her. The theatre and performers are outside this view",
      caption: "A quiet hello from the audience."
    },
    uncertainVisitor: {
      src: "assets/shadow/uncertain-visitor-v1.jpg",
      alt: "Bear looks quietly down at the one flat paper visitor standing upright in its "
        + "low wooden holder on the backstage table, wondering whether he made the wrong one. "
        + "Bunny notices him from the edge of the picture. The closed book rests beside them. "
        + "The lamp, the screen and every shadow are outside this close view",
      caption: "Bear wonders about his little visitor."
    },
    doorwayInvitation: {
      src: "assets/shadow/doorway-invitation-v1.jpg",
      alt: "Duck tells his idea about the garden doorway with a feathered wing, sitting on a "
        + "floor cushion. Bear listens beside the one paper visitor. Only the narrow edge of "
        + "the theatre shows; the screen, the doorway picture and any shadow are outside this view",
      caption: "Duck's idea for the little door."
    },
    cleanup: {
      src: "assets/shadow/cleanup-v1.jpg",
      alt: "The sitting room with the room lights turned up and the theatre lamp off. "
        + "Bear lays the same paper visitor back between the pages of the book, "
        + "Bunny stacks the scenery pictures into a folio, and Duck nudges a cushion "
        + "towards its basket with a wing. The screen is empty",
      caption: "Putting the little theatre away."
    }
  };

  /* WHAT EACH PAGE HAS TO LOOK AT, and how honest the list is.

     Two kinds of picture stand in this book and they are not interchangeable.
     A PAINTING is a character moment: it says how the afternoon felt, and it
     is never evidence about a size. A MODEL VIEW is drawn in code from the
     measured geometry: the lamp, the puppet, the screen, the scenery and the
     shadow, all at the distances the model gives.

     So a page is covered when it really shows what that page is about. C3 has
     its painting AND the two precise comparisons the story turns on, because
     the painting deliberately does not carry them. B2, B3 and B4 are covered
     by the calibrated apparatus itself rather than by new paintings: what they
     are about IS the measurement, and a painted guess at it would be the one
     thing this book must not do.

     `MISSING` therefore names the pages that still have neither, and the list
     is not emptied by deciding that something else will do. */
  const MISSING = [];

  /* Which page shows which kind of picture, so the delivery table is made
     from what is really there rather than from a count of files. */
  const COVER = {
    c0: "painting", c1: "painting", c2: "painting + model side view",
    c3: "painting + two model comparisons", c4: "painting",
    a1: "model stage", a2: "model stage", a3: "model side view", a4: "model stage",
    b1: "painting + model stage", b2: "model close-up", b3: "model stage",
    b4: "model close-up", q1: "painting", q2: "painting + model close-up",
    e1: "painting"
  };

  /* Said once, near the title, rather than on every page that is waiting. */
  const ART_NOTE = "New narration is not recorded yet.";

  /* ------------------------------------------------------------------ */
  /* the opening                                                         */
  /* ------------------------------------------------------------------ */

  const PAGES = {
    c0: {
      heading: "The Shadow Theatre",
      art: "invitation",
      lines: ["A story of light, shadows and a little garden visitor."],
      next: { label: "Open the story", to: "c1" }
    },

    c1: {
      heading: "An Afternoon for a Play",
      art: "invitation",
      lines: [
        "On a quiet afternoon, Bunny and Duck came to Bear's house.",
        "Bear had drawn a little visitor. His dad had helped turn the drawing into a "
          + "paper puppet, and Bear had kept it flat inside a book.",
        "“Would you like to put on a play?” he asked.",
        "Bunny brought a sunflower picture. Duck brought a picture of a little garden doorway.",
        "“Our visitor will need somewhere to go,” said Duck."
      ],
      next: { label: "Read on", to: "c2" }
    },

    c2: {
      heading: "Behind the Screen",
      art: "puppetHolder",
      lines: [
        "Bear's dad fastened a thin white screen into the theatre frame. "
          + "He secured a small lamp behind it.",
        "“The puppet goes between the lamp and the screen,” he said. "
          + "“You can work from this side. I'll watch from the other side.”",
        "Bear slipped the puppet into its holder.",
        "A dark outline appeared on the screen.",
        "“That's our visitor's shadow,” said Bunny. "
          + "“The paper is back here, but the audience sees the shadow.”"
      ],
      /* Two words, offered and never asked about. They are folded away with
         the other secondary things, so nothing on this page is a test. */
      words: [
        "A puppet is a figure we use in a play.",
        "The screen is where we see the shadow."
      ],
      next: { label: "Read on", to: "c3" }
    },

    c3: {
      heading: "Too Small, Too Tall",
      art: "uncertainVisitor",
      lines: [
        "“Perhaps our visitor could be a giant,” said Bear.",
        "When they first tried the scenery, the shadow did not look very tall beside Bunny's sunflower picture.",
        "Then Dad changed the scenery to Duck's doorway picture.",
        "“Or he could come through this little door,” said Duck.",
        "Now the shadow was too tall for the doorway.",
        "Bear looked down at his paper puppet.",
        "“Maybe I made the wrong visitor.”"
      ],
      next: { label: "Read on", to: "c4" }
    },

    c4: {
      heading: "Which Story Shall We Tell?",
      art: "choice",
      lines: [
        "Bunny sat beside Bear.",
        "“You worked carefully on him,” she said. “We don't have to cut him up.”",
        "Duck looked from the puppet to the screen.",
        "“Could we change the shadow instead?”",
        "Bear rested his paw on the puppet holder.",
        "“We could try a giant in the garden, or a visitor who comes through the door.”",
        "“Or we could watch a little garden story just as it is,” said Bunny."
      ],
      /* All three, now that all three are built. None is recommended, marked,
         locked or worth more than the others, and none of them leads to the
         same rehearsal wearing a different name: the giant works with the
         sunflower, the doorway with the little door, and watching asks
         nothing at all. */
      choices: [
        { label: "A giant in the garden", to: "a1" },
        { label: "A visitor at the little door", to: "b1" },
        { label: "Watch a garden story", to: "q1" }
      ]
    },

    /* ---- watching, which is a whole way through and asks nothing ---- */

    q1: {
      heading: "A Place to Watch",
      art: "audience",
      lines: [
        "“Let's watch a garden story,” said Bunny.",
        "She settled onto a cushion beside Dad.",
        "Bear kept the puppet where it was, and Duck helped put the sunflower "
          + "scenery in place.",
        "“Our visitor doesn't need to be a giant in this story,” said Bear. "
          + "“He can simply come to say hello.”",
        "The little theatre grew quiet, ready for the first line."
      ],
      next: { label: "Read on", to: "q2" }
    },

    q2: {
      heading: "Hello, Little Garden",
      art: "gardenHello",
      /* Reaching this page is the whole of the watching route: the friends
         really did put on their quiet garden story. Nothing about it claims
         that anyone tried a distance, worked out a difference or made a
         giant. */
      watched: true,
      lines: [
        "“Hello, little garden,” said the visitor.",
        "“Hello,” Bunny answered from her cushion.",
        "“I've come to listen. What can I hear?”",
        "Duck made a soft shushing sound, like a breeze moving through leaves.",
        "The visitor stopped beside the sunflower.",
        "Bear waited before saying the next line. There was no hurry.",
        "Then everyone joined in a very quiet garden hello."
      ],
      next: { label: "Read on", to: "e1" }
    }
  };

  Object.keys(PAGES).forEach((id) => { PAGES[id].id = id; });

  /* The headings of the pages the model builds. They are words a child hears,
     so they belong in the list the voice will be recorded from; keeping them
     here means there is one copy of each, not two. A4's heading is not among
     them because it is decided by the shadow itself, and the model already
     enumerates both of its names. */
  const HEADINGS = {
    a1: "A Giant Beside the Sunflower",
    a2: "The Same Paper, a Different Shadow",
    a3: "Where the Light Goes",
    b1: "A Doorway for Our Visitor",
    b2: "Measuring for the Play",
    b3: "Making Room on the Screen",
    e1: "Keeping the Little Visitor"
  };

  const artFor = (page) => (page && page.art ? ART[page.art] : null);
  const hasArt = (id) => Boolean(PAGES[id] && PAGES[id].art);

  /* Every line these pages can put on screen, for the recording catalogue the
     original voice will be read from. Produced from the pages themselves, so
     a page cannot say something the list has not got. */
  function enumerateTexts() {
    const said = new Set();
    const add = (text) => { if (text) said.add(String(text).trim()); };
    Object.keys(PAGES).forEach((id) => {
      const page = PAGES[id];
      add(page.heading);
      const art = artFor(page);
      if (art) add(art.caption);
      (page.lines || []).forEach(add);
      (page.words || []).forEach(add);
      (page.choices || []).forEach((choice) => add(choice.label));
      add(page.note);
      if (page.next) add(page.next.label);
    });
    /* every painting's caption, including the ending's, which belongs to a
       page the model builds rather than to one of the told pages */
    Object.keys(ART).forEach((key) => add(ART[key].caption));
    Object.keys(HEADINGS).forEach((key) => add(HEADINGS[key]));
    add(ART_NOTE);
    return Array.from(said).sort();
  }

  return { PAGES, ART, MISSING, COVER, ART_NOTE, HEADINGS, artFor, hasArt, enumerateTexts };
});
