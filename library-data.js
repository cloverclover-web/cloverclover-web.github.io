/* What the library actually has.

   Three lists, kept deliberately apart. CATEGORIES is the shelf the child
   browses: the eleven registered editorial directions, every one of them
   allowed to be empty. READY is the far shorter list of finished books that
   can be opened today. PREVIEWS is a third list for stories that open but are
   not finished: they can be found and read together, and they are never
   offered as ready, counted as stories to read, or picked by "read me
   something".

   A category having a name, a colour and a picture says nothing about whether
   anything inside it can be read, and nothing here may imply a book exists
   before it does. Adding a category does not add a book. A book becomes
   readable only by appearing in READY with a page that opens; appearing in
   PREVIEWS says something weaker, and says it out loud. */

(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.YoyoLibrary = api;
})(typeof self !== "undefined" ? self : (typeof globalThis !== "undefined" ? globalThis : null), function () {
  "use strict";

  /* The eleven registered category IDs and their child-facing labels, exactly
     as the roadmap defines them, in its order. A twelfth direction,
     technology-digital, is reserved in the roadmap and deliberately absent
     here: it is not a shelf until its own story and scope are approved.

     `cover` is a painting when one has been made and approved; null means the
     slot is honestly unfinished and the card shows a written placeholder
     rather than a stand-in picture from another story.

     `link` sends the whole category somewhere instead of listing books, which
     only My Stories does. */
  const CATEGORIES = [
    {
      id: "growing-together",
      label: "Growing Together",
      blurb: "Feelings, mistakes and trying again.",
      cover: "assets/library/growing-together-cover-v1.jpg",
      coverAlt: "Bunny and Bear sitting together beside a toppled tower of wooden blocks"
    },
    {
      id: "friends-school",
      label: "Friends & School",
      blurb: "Playing together, taking turns and new places.",
      cover: null
    },
    {
      id: "everyday-adventures",
      label: "Everyday Adventures",
      blurb: "Picnics, shopping and days out.",
      /* A library-sized derivative of the approved picnic scene. The story's
         own page-1.png is several megabytes and stays exactly as it is: a
         shelf of thumbnails must not pull the book's full-resolution art. */
      cover: "assets/library/everyday-adventures-cover-v1.jpg",
      coverAlt: "Bunny, Bear and Duck setting out a picnic in the garden"
    },
    {
      id: "little-kitchen",
      label: "Little Kitchen",
      blurb: "Making food and drinks for someone.",
      cover: "assets/library/little-kitchen-cover-v1.jpg",
      coverAlt: "Bear welcoming Bunny and Duck into his cottage kitchen"
    },
    {
      id: "little-detectives",
      label: "Little Detectives",
      blurb: "Clues, questions and working things out.",
      cover: null
    },
    {
      id: "make-discover",
      label: "Make & Discover",
      blurb: "Building, mixing and finding out what happens.",
      cover: "assets/library/make-discover-cover-v1.jpg",
      coverAlt: "Bunny, Bear and Duck planning a play beside their little wooden theatre"
    },
    {
      id: "amazing-world",
      label: "Our Amazing World",
      blurb: "Space, weather, gardens and faraway places.",
      cover: null
    },
    {
      id: "my-stories",
      label: "My Stories",
      blurb: "A place kept for the stories you make up.",
      cover: null,
      link: "my-stories.html",
      linkLabel: "Open My Stories"
    },
    {
      id: "time-explorers",
      label: "Time Explorers",
      blurb: "How people lived long ago, and what they left behind.",
      cover: null
    },
    {
      id: "arts-music",
      label: "Arts & Music",
      blurb: "Making, listening and showing what you imagine.",
      cover: null
    },
    {
      id: "move-play",
      label: "Move & Play",
      blurb: "Games, moving your body and playing together fairly.",
      cover: null
    }
  ];

  /* Books that can be read right now. One, at the moment. A proposed title
     must not be listed here, and neither may the V1 practice games or the My
     Stories reservation: those are not books this list can offer. */
  const READY = [
    {
      id: "bunnys-birthday-picnic",
      title: "Bunny's Birthday Picnic",
      category: "everyday-adventures",
      page: "picnic.html",
      /* the same shelf-sized derivative; the book itself still opens its own
         full-resolution paintings */
      cover: "assets/library/everyday-adventures-cover-v1.jpg",
      coverAlt: "Bunny, Bear and Duck setting out a picnic in the garden",
      blurb: "A picnic in the garden, a shower of rain, and a basket of strawberries to count."
    }
  ];

  /* Stories that can be opened but are not finished books.

     Deliberately a third list, not a flag on READY. A preview still has open
     release or parent-review gates (even when narration exists), so it must
     never be handed out by "read me something", counted as a story to read,
     or described as ready. It is here because the parent asked for the latest
     Tower reading to be reachable from the shelf, and because a child who
     went looking for it should find it rather than an empty room.

     `note` is the honest state of the thing, shown wherever it is offered. */
  const PREVIEWS = [
    {
      id: "the-tower-that-fell",
      title: "The Tower That Fell",
      category: "growing-together",
      page: "tower-preview.html",
      /* an approved wardrobe painting from the story itself, used exactly as
         it was delivered */
      cover: "assets/tower/pond-wardrobe-v1.jpg",
      coverAlt: "Bunny and Bear sitting on the bank of an imagined pond with "
        + "their wooden toy duck beside them",
      blurb: "Bunny's tower falls, and she decides what to do next.",
      note: "Original narration is ready. Read together."
    },
    {
      id: "juice-for-our-friends",
      title: "Juice for Our Friends",
      category: "little-kitchen",
      page: "juice-preview.html",
      cover: "assets/library/little-kitchen-cover-v1.jpg",
      coverAlt: "Bear welcoming Bunny and Duck into his sunny kitchen",
      blurb: "Make a jug to share, follow a friend's request, or invent your own juice recipes.",
      note: "Original-voice narration. Read together and try the story."
    },
    {
      id: "the-shadow-theatre",
      title: "The Shadow Theatre",
      category: "make-discover",
      page: "shadow-preview.html",
      cover: "assets/library/make-discover-cover-v1.jpg",
      coverAlt: "Bunny, Bear and Duck planning a play beside their little wooden theatre",
      blurb: "Move a paper puppet, explore its shadow, or watch a little garden play.",
      note: "Original-voice narration. Choose a play, move the puppet, or watch together."
    }
  ];

  /* What a category can honestly say about itself. */
  function booksIn(categoryId, ready) {
    return (ready || READY).filter((book) => book.category === categoryId);
  }

  /* The previews on one shelf. Separate from booksIn on purpose: a caller has
     to ask for previews explicitly, so they cannot be counted as books by
     accident. */
  function previewsIn(categoryId, previews) {
    return (previews || PREVIEWS).filter((item) => item.category === categoryId);
  }

  /* The one action the library offers for "just read me something".

     Zero ready books means there is no action at all, rather than a button
     that goes nowhere. One means going straight to it and saying which book it
     is. Only from two does choosing become interesting enough to be a
     surprise, and then it avoids handing back the book just read when there is
     another one to offer. This is deliberately pure: it decides from a list
     that is passed in, so a catalogue of any size can be checked without
     inventing books that do not exist. */
  function chooseStory(ready, lastReadId) {
    const books = Array.isArray(ready) ? ready.filter(Boolean) : [];
    if (books.length === 0) return { mode: "none", book: null, choices: [] };
    if (books.length === 1) return { mode: "direct", book: books[0], choices: books.slice() };

    const fresh = books.filter((book) => book.id !== lastReadId);
    const choices = fresh.length > 0 ? fresh : books.slice();
    return { mode: "surprise", book: null, choices };
  }

  /* Pick one of the choices chooseStory allows. `pick` is passed in so a test
     can decide rather than hope; it never widens the allowed set. */
  function pickStory(ready, lastReadId, pick) {
    const decision = chooseStory(ready, lastReadId);
    if (decision.choices.length === 0) return null;
    const roll = typeof pick === "function" ? pick(decision.choices.length) : Math.floor(Math.random() * decision.choices.length);
    const index = Math.min(Math.max(Math.floor(roll) || 0, 0), decision.choices.length - 1);
    return decision.choices[index];
  }

  /* A category id that arrived from a URL is only ever looked up here. It is
     never inserted into the page, and never turned into a path. */
  function categoryById(id) {
    return CATEGORIES.find((category) => category.id === id) || null;
  }

  return { CATEGORIES, READY, PREVIEWS, booksIn, previewsIn, chooseStory, pickStory, categoryById };
});
