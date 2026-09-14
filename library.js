/* The library: choosing where to go.

   This file only draws the shelf and moves between two views. It knows nothing
   about how a book works: opening one is an ordinary link to that book's own
   page, so the storybook engine is reached exactly as it always was and is not
   touched from here.

   Everything the child reads is built from library-data.js. A category id may
   arrive in the address bar, but it is only ever used to look a category up -
   never written into the page, never turned into a path. */

(function () {
  "use strict";

  const L = window.YoyoLibrary;
  const $ = (sel) => document.querySelector(sel);

  /* Which book was opened last.

     Only so that a surprise does not hand back the book just finished. It is
     one id, in the library's own key, in sessionStorage - so it lasts as long
     as this visit and no longer. It is deliberately not progress: opening a
     book is not finishing one, nothing here counts readings, and the child's
     records and drawings live in entirely different keys that this file never
     touches.

     Storage can be unavailable or refuse to write - a private window, a full
     quota, a browser with cookies blocked. Every access is guarded and falls
     back to remembering it in memory for this page, which is enough for the
     only thing it is used for. */
  const LAST_OPENED_KEY = "yoyoLibrary.lastOpened.v1";

  const lastOpened = (() => {
    let inMemory = null;

    const store = () => {
      try {
        return window.sessionStorage || null;
      } catch (error) {
        return null;             // access itself can throw
      }
    };

    return {
      read() {
        /* What this page has already seen wins. The saved value is only a
           starting point from an earlier visit, so when a write was refused -
           private browsing, a full quota - the stale saved id must not
           override the book that was just opened, or the surprise would keep
           offering that same book again. */
        if (inMemory) return inMemory;
        const box = store();
        if (!box) return null;
        try {
          return box.getItem(LAST_OPENED_KEY) || null;
        } catch (error) {
          return null;
        }
      },
      remember(id) {
        if (!id) return;
        inMemory = String(id);
        const box = store();
        if (!box) return;
        try {
          box.setItem(LAST_OPENED_KEY, inMemory);
        } catch (error) {
          /* refused: the in-memory value above still does the job */
        }
      }
    };
  })();

  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  };

  /* A cover, or an honest note that there is not one yet.

     The label lives outside the picture, so a card is still readable and still
     tappable when an image is slow, missing or broken. Nothing essential is
     drawn inside the bitmap. */
  function coverFor(item) {
    const frame = el("div", "cover");
    if (!item.cover) {
      frame.classList.add("is-waiting");
      frame.append(el("span", "cover-note", "Cover in preparation"));
      return frame;
    }
    const img = new Image();
    img.className = "cover-art";
    img.alt = item.coverAlt || "";
    img.loading = "lazy";
    img.decoding = "async";
    /* the frame keeps its size whether or not the picture arrives, so a
       control never moves under a finger that is already reaching for it */
    img.addEventListener("error", () => {
      img.remove();
      frame.classList.add("is-waiting");
      frame.append(el("span", "cover-note", "Cover in preparation"));
    });
    img.src = item.cover;
    frame.append(img);
    return frame;
  }

  /* ------------------------------------------------------------------ */
  /* the shelf                                                           */
  /* ------------------------------------------------------------------ */

  function categoryCard(category) {
    const count = L.booksIn(category.id).length;
    const previews = L.previewsIn(category.id).length;

    const card = el("a", "card");
    card.href = category.link || `?category=${encodeURIComponent(category.id)}`;
    card.dataset.category = category.id;
    card.append(coverFor(category));

    const body = el("div", "card-body");
    body.append(el("h2", "card-title", category.label));
    if (category.blurb) body.append(el("p", "card-blurb", category.blurb));

    /* Say what is really inside, without inventing a progress number and
       without overstating the work. These shelves hold ideas that have not
       been commissioned, so "being written" would claim more than is true. */
    const status = el("p", "card-status");
    if (category.link) status.textContent = category.linkLabel || "Open";
    else if (count === 1) status.textContent = "1 story to read";
    else if (count > 1) status.textContent = `${count} stories to read`;
    /* A shelf with a preview on it is not empty, and saying so would send a
       child away from the very thing they came back for. It is also not a
       story to read yet, so it is counted separately and named as a preview. */
    else if (previews === 1) status.textContent = "1 story preview";
    else if (previews > 1) status.textContent = `${previews} story previews`;
    else status.textContent = "No stories yet";
    body.append(status);

    card.append(body);
    card.setAttribute("aria-label", `${category.label}. ${status.textContent}.`);

    if (!category.link) {
      card.addEventListener("click", (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button > 0) return;
        event.preventDefault();
        goToCategory(category.id, { push: true });
      });
    }
    return card;
  }

  function bookCard(book) {
    const card = el("a", "card");
    card.href = book.page;
    card.append(coverFor(book));
    const body = el("div", "card-body");
    body.append(el("h2", "card-title", book.title));
    if (book.blurb) body.append(el("p", "card-blurb", book.blurb));
    body.append(el("p", "card-status", "Ready to read"));
    card.append(body);
    card.setAttribute("aria-label", `Read ${book.title}`);
    /* note which book is being opened, before the browser follows the link */
    card.addEventListener("click", () => lastOpened.remember(book.id));
    return card;
  }

  /* A story that opens but is not finished. It looks like a book card and
     behaves like one, and it says plainly what it is: a preview whose
     narration has not been recorded. It is never remembered as the last book
     read, because "read me something" only ever offers ready books. */
  function previewCard(item) {
    const card = el("a", "card is-preview");
    card.href = item.page;
    card.dataset.preview = item.id;
    card.append(coverFor(item));
    const body = el("div", "card-body");
    body.append(el("h2", "card-title", item.title));
    if (item.blurb) body.append(el("p", "card-blurb", item.blurb));
    body.append(el("p", "card-status", "Story preview"));
    if (item.note) body.append(el("p", "card-note", item.note));
    card.append(body);
    card.setAttribute("aria-label", `${item.title}. Story preview. ${item.note || ""}`.trim());
    return card;
  }

  /* The one action for "just read me something", wherever it is offered.

     What it can honestly be is decided entirely by the ready list: nothing
     ready means no control at all, one book means a direct link that names it,
     and only from two does a surprise make sense. It returns null rather than
     a disabled or misleading button. */
  function readyAction() {
    const decision = L.chooseStory(L.READY, lastOpened.read());

    if (decision.mode === "none") return null;

    if (decision.mode === "direct") {
      const book = decision.book;
      const go = el("a", "btn btn-primary", `Read ${book.title}`);
      go.href = book.page;
      go.addEventListener("click", () => lastOpened.remember(book.id));
      return go;
    }

    const surprise = el("button", "btn btn-primary", "Surprise me");
    surprise.type = "button";
    surprise.addEventListener("click", () => {
      const book = L.pickStory(L.READY, lastOpened.read(), null);
      if (!book) return;
      lastOpened.remember(book.id);
      window.location.href = book.page;
    });
    return surprise;
  }

  function renderShelf() {
    const grid = $("#categoryGrid");
    grid.innerHTML = "";
    L.CATEGORIES.forEach((category) => grid.append(categoryCard(category)));
  }

  /* The previews, on the shelf itself. A child who has been reading one and
     comes back to the library should see it, rather than having to remember
     which shelf it was on. With nothing to preview the whole section is
     removed, so it never becomes an empty promise. */
  function renderPreviews() {
    const section = $("#previewSection");
    const row = $("#previewRow");
    if (!section || !row) return;
    row.innerHTML = "";
    L.PREVIEWS.forEach((item) => row.append(previewCard(item)));
    section.hidden = L.PREVIEWS.length === 0;
  }

  /* The quick way in on the shelf, sized to what is actually readable. */
  function renderQuickRead() {
    const row = $("#quickRead");
    row.innerHTML = "";
    const action = readyAction();
    if (action) row.append(action);
    else row.append(el("p", "quiet-note", "There are no stories to read yet."));
  }

  /* ------------------------------------------------------------------ */
  /* one category                                                        */
  /* ------------------------------------------------------------------ */

  function renderCategory(category) {
    $("#categoryTitle").textContent = category.label;
    $("#categoryBlurb").textContent = category.blurb || "";

    const list = $("#categoryBooks");
    list.innerHTML = "";
    const books = L.booksIn(category.id);
    const previews = L.previewsIn(category.id);

    if (books.length > 0 || previews.length > 0) {
      books.forEach((book) => list.append(bookCard(book)));
      previews.forEach((item) => list.append(previewCard(item)));
      return;
    }

    /* Nothing here yet, said plainly: not dressed up as a locked reward, and
       not claiming work is under way that has not been started. The way out is
       whatever the ready list can honestly offer - which is nothing at all
       when nothing can be read. */
    const note = el("div", "empty-note");
    note.append(el("p", null, "There are no stories on this shelf yet."));
    note.append(el("p", null, "This one has not been made yet."));

    const action = readyAction();
    if (action) {
      action.className = action.tagName === "BUTTON" ? "btn btn-secondary" : "btn btn-secondary";
      note.append(el("p", null, "You can read one of the others in the meantime."));
      note.append(action);
    }
    list.append(note);
  }

  /* ------------------------------------------------------------------ */
  /* moving between the two views                                        */
  /* ------------------------------------------------------------------ */

  function showView(name) {
    document.querySelectorAll("[data-view]").forEach((view) => {
      view.classList.toggle("is-active", view.dataset.view === name);
    });
  }

  /* The card the current category was opened from, so that coming back puts
     the keyboard where it was rather than leaving it on a panel that is now
     hidden. */
  let openedFrom = null;

  /* An unknown or missing category is not an error the child should meet: the
     shelf is a safe place to land, and the address is tidied up so a reload
     does not try the same broken value again. */
  function goToCategory(id, { push = false, replace = false } = {}) {
    const category = id ? L.categoryById(id) : null;

    if (!category || category.link) {
      showShelf();
      if (push || replace) history.replaceState({ view: "shelf" }, "", window.location.pathname);
      return;
    }

    openedFrom = category.id;
    renderCategory(category);
    showView("category");
    document.title = `${category.label} - YOYO Story Worlds`;
    const url = `?category=${encodeURIComponent(category.id)}`;
    if (push) history.pushState({ view: "category", id: category.id }, "", url);
    else if (replace) history.replaceState({ view: "category", id: category.id }, "", url);
    $("#categoryTitle").focus();
  }

  function showShelf() {
    showView("shelf");
    document.title = "YOYO Story Worlds";

    /* Put the keyboard back on the card that was opened. Without this, focus
       stays inside the category panel, which is now display:none - the child
       would be tabbing through nothing. Arriving at the shelf directly has no
       card to return to, which is fine. */
    const card = openedFrom
      ? $("#categoryGrid").querySelector(`[data-category="${openedFrom}"]`)
      : null;
    openedFrom = null;
    if (card && typeof card.focus === "function") card.focus();
  }

  function backToShelf() {
    showShelf();
    history.pushState({ view: "shelf" }, "", window.location.pathname);
  }

  function readAddress() {
    const params = new URLSearchParams(window.location.search);
    const wanted = params.get("category");
    if (wanted) goToCategory(wanted, { replace: true });
    else showShelf();
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderShelf();
    renderPreviews();
    renderQuickRead();

    $("#categoryBack").addEventListener("click", (event) => {
      event.preventDefault();
      backToShelf();
    });

    /* back and forward move between the shelf and a category the same way
       they move between pages elsewhere */
    window.addEventListener("popstate", (event) => {
      const state = event.state;
      if (state && state.view === "category") goToCategory(state.id, {});
      else readAddress();
    });

    readAddress();

    if (!window.__yoyoUpdater && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("service-worker.js", { updateViaCache: "none" }).catch(() => {});
    }
  });

  /* the library is never in the middle of something the child would lose */
  window.__yoyoBusy = function () { return false; };
})();
