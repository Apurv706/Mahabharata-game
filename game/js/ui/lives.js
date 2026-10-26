/* The Book of Lives: every finished life is written into this browser's book, with how it ended.
   The book shows the lives on a shelf and every ending in a gallery, the undiscovered ones as a
   hint. A new life may remember one of the old ones (rebirth): it starts with that life's karma. */
(function (K) {
  "use strict";
  const U = K.UI;
  const KEY = "kurukshetra.v2.lives";
  const MAX = 50;

  K.lives = function () {
    try { const a = JSON.parse(K.store.get(KEY) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; }
  };

  // Called once per life, when its ending is first shown.
  K.recordLife = function (S, e) {
    if (S.recorded) return;
    S.recorded = true;
    const has = (f) => S.flags.includes(f);
    const rec = {
      at: new Date().toISOString(),
      me: { name: S.name, pronoun: S.pronoun, origin: S.origin, teacher: S.teacher, path: S.path, spouse: S.spouse, friend: S.friend, court: S.court, child: S.child },
      title: e.title, art: e.art, alive: S.alive, age: S.age, side: S.side, telling: e.telling,
      kept: S.vows.length > 0 && S.vows.every((v) => !v.broken || v.released),
      broke: S.vows.some((v) => v.broken && !v.released),
      karna: (S.bonds.karna || 0) >= 7 || has("died_with_karna") || has("pledged_to_karna"),
      teller: S.endChoice === "teller",
      conscience: S.duty.conscience
    };
    const all = K.lives();
    all.unshift(rec);
    K.store.set(KEY, JSON.stringify(all.slice(0, MAX)));
    K.save("auto");
  };

  // What a remembered life gives the next one: [label, effects] pairs.
  K.karmaOf = function (rec) {
    const out = [];
    if (rec.kept || rec.conscience >= 8) out.push(["A life of kept promises", { duty: { conscience: 1 }, rep: { sages: 1 } }]);
    if (rec.broke) out.push(["A broken vow, still owed", { duty: { conscience: -1 }, flag: "karmic_debt" }]);
    if (rec.karna) out.push(["Karna's friend, once", { bond: { karna: 2 } }]);
    if (rec.teller) out.push(["A teller's memory", { skill: { lore: 1 } }]);
    if (!rec.alive) out.push(["A death in battle", { attr: { might: 1 } }]);
    if (!out.length) out.push(["A quiet life", { attr: { wisdom: 1 } }]);
    return out;
  };
  K.rebirth = function (S, rec) {
    S.karma = { name: rec.me.name, origin: rec.me.origin, title: rec.title };
    for (const [, fx] of K.karmaOf(rec)) K.apply(fx, S);
    K.apply({ flag: "reborn", journal: { src: "You were born remembering another life, as {past}.", p: { past: rec.me.name } } }, S);
  };

  const when = (iso) => { try { return new Date(iso).toLocaleDateString(K.lang === "hi" ? "hi-IN" : "en-GB", { day: "numeric", month: "short", year: "numeric" }); } catch (e) { return ""; } };

  U.openLives = function () {
    const lives = K.lives();
    const found = {};
    for (const r of lives) (found[r.title] = found[r.title] || []).push(r);
    const n = K.ENDINGS.filter((e) => found[e.title]).length;
    const gallery = K.ENDINGS.map((e) => {
      const got = found[e.title];
      return got
        ? '<figure class="ending found"><i style="--img:url(\'' + U.artUrl(got[0].art || e.art) + '\')" aria-hidden="true"></i><figcaption><b>' + U.tr(e.title) + "</b><small>" +
          U.tr(got.length === 1 ? "Reached once" : "Reached {n} times", { n: got.length }) + "</small></figcaption></figure>"
        : '<figure class="ending"><i aria-hidden="true"></i><figcaption><b>' + U.tr("Not yet found") + "</b><small>" + U.tr(e.hint) + "</small></figcaption></figure>";
    }).join("");
    const shelf = lives.map((r) => {
      const lines = (r.telling || []).map((l) => "<p>" + U.esc(K.text(l, null, r.me)) + "</p>").join("");
      return '<details class="lifecard"><summary>' + U.thumb(r.art, "card") + '<span><b>' + U.esc(r.me.name) + "</b><small>" + U.tr(r.title) + " · " +
        U.tr(r.alive ? "Age {n}" : "Fell at {n}", { n: r.age }) + " · " + U.esc(when(r.at)) + '</small></span></summary><div class="telling">' + lines + "</div></details>";
    }).join("");
    U.openModal("Book of Lives",
      '<span class="lbl">' + U.tr("Endings found: {n} of {m}", { n, m: K.ENDINGS.length }) + '</span><div class="endings">' + gallery + "</div>" +
      '<span class="lbl">' + U.tr("Lives lived ({n})", { n: lives.length }) + "</span>" +
      (shelf ? '<div class="shelf">' + shelf + "</div>" : '<p class="empty">' + U.tr("No lives written yet. Every life you finish is kept here.") + "</p>") +
      (lives.length ? '<div class="btnrow"><button class="ghost" id="lives-clear" type="button">' + U.tr("Clear the book") + "</button></div>" : ""),
      () => {
        const b = U.$("lives-clear");
        if (!b) return;
        let armed = false;
        b.addEventListener("click", () => {
          if (!armed) { armed = true; b.textContent = K.tr("Tap again to erase every life in this book"); return; }
          K.store.del(KEY);
          U.closeModal();
          if (document.body.classList.contains("titling")) U.renderTitle();
        });
      });
  };
})(window.K = window.K || {});
