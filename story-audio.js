/* Recorded-narration player.

   Two independent cancellation tokens:

     clipToken  cancels one clip. Every play() bumps it, because starting a
                new clip must abandon whatever is sounding right now.
     seqToken   cancels a whole reading. Only stop(), or a newer sequence,
                bumps it.

   Keeping them apart is the point: playSequence holds a seqToken across the
   whole page, while each play() inside it bumps only clipToken. If the two
   shared a counter, the first clip would invalidate its own sequence and the
   story would stop after one line.

   Never falls back to speech synthesis. A missing file resolves "missing" and
   the caller keeps the words on screen. */

(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.YoyoSound = api;
})(typeof self !== "undefined" ? self : (typeof globalThis !== "undefined" ? globalThis : null), function () {
  "use strict";

  function audioKeyForText(text) {
    let hash = 0x811c9dc5;
    const value = String(text);
    for (let i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function clipPath(text) {
    return `audio/${audioKeyForText(text)}.mp3`;
  }

  function createSound(options) {
    const settings = options || {};
    const AudioCtor = settings.Audio;
    const setTimer = settings.setTimeout || ((fn, ms) => setTimeout(fn, ms));
    const clearTimer = settings.clearTimeout || ((id) => clearTimeout(id));
    const missingGapMs = settings.missingGapMs == null ? 1500 : settings.missingGapMs;

    return {
      el: null,
      clipToken: 0,
      seqToken: 0,
      pending: new Set(),
      missing: new Set(),

      init() {
        if (this.el || !AudioCtor) return;
        this.el = new AudioCtor();
        this.el.preload = "auto";
      },

      /* Settle everything in flight as cancelled and detach listeners. */
      _cancelPending() {
        const waiting = [...this.pending];
        this.pending.clear();
        waiting.forEach((settle) => settle("cancelled"));
      },

      /* Full stop: abandons the clip and the reading. */
      stop() {
        this.clipToken += 1;
        this.seqToken += 1;
        this._cancelPending();
        if (!this.el) return;
        try { this.el.pause(); } catch (_) {}
        try { this.el.removeAttribute("src"); } catch (_) {}
        try { this.el.load(); } catch (_) {}
      },

      /* One clip. Bumps clipToken only, so a sequence around it survives. */
      play(text) {
        this.init();
        this.clipToken += 1;
        this._cancelPending();
        if (!this.el) return Promise.resolve("missing");

        const audio = this.el;
        return new Promise((resolve) => {
          let settled = false;

          const settle = (status) => {
            if (settled) return;
            settled = true;
            this.pending.delete(settle);
            audio.removeEventListener("ended", onEnded);
            audio.removeEventListener("error", onError);
            resolve(status);
          };
          const onEnded = () => settle("ended");
          const onError = () => { this.missing.add(String(text)); settle("missing"); };

          this.pending.add(settle);
          audio.addEventListener("ended", onEnded);
          audio.addEventListener("error", onError);
          audio.src = clipPath(text);

          let attempt;
          try { attempt = audio.play(); } catch (_) { settle("blocked"); return; }
          if (attempt && typeof attempt.catch === "function") {
            attempt.catch(() => settle("blocked"));
          }
        });
      },

      /* Reads lines in order from startAt. Returns "cancelled" as soon as a
         newer sequence or a stop() claims the player. */
      async playSequence(lines, startAt, onEach) {
        const seq = this.seqToken + 1;
        this.seqToken = seq;

        for (let i = Math.max(0, startAt || 0); i < lines.length; i += 1) {
          if (seq !== this.seqToken) return "cancelled";
          if (onEach) onEach(i);

          const status = await this.play(lines[i]);
          if (seq !== this.seqToken) return "cancelled";
          if (status === "cancelled") return "cancelled";
          if (status === "blocked") return "blocked";

          if (status === "missing") {
            const survived = await this.hold(missingGapMs, seq);
            if (!survived) return "cancelled";
          }
        }
        return "ended";
      },

      /* A wait that gives up if the sequence is superseded. */
      hold(ms, seq) {
        return new Promise((resolve) => {
          let done = false;
          const finish = (value) => {
            if (done) return;
            done = true;
            this.pending.delete(cancel);
            clearTimer(timer);
            resolve(value);
          };
          const cancel = () => finish(false);
          const timer = setTimer(() => finish(seq === this.seqToken), ms);
          this.pending.add(cancel);
        });
      }
    };
  }

  return { audioKeyForText, clipPath, createSound };
});
