/* Title screen, character creation and the ending screen. */
(function (K) {
  "use strict";
  const U = K.UI;

  U.renderTitle = function () {
    U.setNav(false);
    U.where("");
    U.closeModal();
    const auto = K.loadSlot("auto");
    const leaf = U.$("leaf");
    leaf.innerHTML = U.plate({ art: "scene_day13", tall: true, caption: "Kurukshetra, the thirteenth day of the war" }) +
      '<div class="text title-screen"><h1>Kurukshetra: A Life</h1>' +
      '<p class="tagline">You cannot change the Mahabharata. You can decide who you were inside it.</p>' +
      "<p>Create someone the epic never mentions and live their whole life, from a childhood beside the young princes to the eighteen days of war and what comes after. " +
      "The great events always happen. Where you stand, what you swear, who you love and how you die are yours.</p>" +
      '<div class="btnrow" id="title-btns"></div>' +
      '<p class="note">Pre-production build. All story text is a working draft and still needs review by scholars and community advisors.</p></div>';
    const row = U.$("title-btns");
    const keys = [];
    if (auto && auto.scene !== "title") {
      const info = (auto.name || "Unnamed") + ", age " + auto.age + (auto.alive ? "" : " (ended)");
      const cont = () => { K.S = auto; K.go(auto.scene); };
      row.appendChild(U.button("cta", "Continue · " + U.esc(info), cont, "btn-continue"));
      keys.push(cont);
    }
    const fresh = () => U.renderCreate();
    row.appendChild(U.button(auto ? "cta secondary" : "cta", "Begin a new life", fresh, "btn-new"));
    keys.push(fresh);
    const load = () => U.openLoad();
    row.appendChild(U.button("ghost", "Load a save code", load));
    keys.push(load);
    U.keys(keys);
  };

  // ---------- Character creation ----------
  let draft = null;
  U.renderCreate = function () {
    draft = draft || { name: "", pronoun: null, origin: null, temperament: null, heirloom: null, storyMode: false };
    U.setNav(false);
    U.where("<b>A new life</b>Age 6");
    const o = draft.origin && K.ORIGINS[draft.origin];
    const leaf = U.$("leaf");
    leaf.innerHTML = (o ? U.plate({ art: draft.origin, title: o.name, small: o.blurb, tag: "yours", tagText: "Your homeland" })
      : U.plate({ grad: ["#d4a84b", "#3b5ba9"], caption: "Choose a homeland below", tag: "yours", tagText: "Your life" })) +
      '<div class="text"><h1>Where were you born?</h1>' +
      "<p>Your origin shapes how the world treats you. It never limits what you can become.</p>" +
      '<div class="field"><label class="lbl" for="pname">Your name</label><input id="pname" type="text" maxlength="24" autocomplete="off" placeholder="Name your character" value="' + U.esc(draft.name) + '"></div>' +
      '<div class="field"><span class="lbl">How should the bards speak of you?</span><div class="opts" id="pron"></div></div>' +
      '<div class="field"><span class="lbl">Homeland</span><div class="origins" id="origins"></div></div>' +
      (o ? '<p class="aside">' + U.t(o.detail) + "</p>" : "") +
      '<div class="field"><span class="lbl">Childhood temperament</span><div class="picks" id="temps"></div></div>' +
      '<div class="field"><span class="lbl">Family heirloom</span><div class="picks" id="heirs"></div></div>' +
      '<label class="toggle"><input type="checkbox" id="story"' + (draft.storyMode ? " checked" : "") + "><span>Story mode<small>You cannot die in battle, so you can see every chapter. Death stays a choice the story can still offer.</small></span></label>" +
      '<div class="btnrow"><button class="cta" id="begin" type="button">Begin this life</button><button class="ghost" id="back" type="button">Back</button></div><p class="err" id="need"></p></div>';

    const opts = (elId, list, key) => list.forEach(([id, label, small]) => {
      const b = U.button("opt", U.esc(label) + (small ? "<small>" + U.esc(small) + "</small>" : ""), () => { draft[key] = id; U.renderCreate(); });
      b.setAttribute("aria-pressed", String(draft[key] === id));
      U.$(elId).appendChild(b);
    });
    opts("pron", [["she", "She"], ["he", "He"], ["they", "They"]], "pronoun");
    const cards = (elId, map, key, prefix, round) => Object.entries(map).forEach(([id, v]) => {
      const b = U.button("pick" + (round ? " round" : ""), '<i role="img" aria-label="' + U.esc(v.name) + '" style="background-image:url(\'' + U.artUrl(prefix + id) + '\')"></i><b>' + U.esc(v.name) + "</b><small>" + U.esc(v.short) + "</small>",
        () => { draft[key] = id; U.renderCreate(); });
      b.setAttribute("aria-pressed", String(draft[key] === id));
      U.$(elId).appendChild(b);
    });
    cards("temps", K.TEMPERAMENTS, "temperament", "temper_", true);
    cards("heirs", K.HEIRLOOMS, "heirloom", "heir_", false);
    for (const [id, v] of Object.entries(K.ORIGINS)) {
      const b = U.button("origin", '<i role="img" aria-label="' + U.esc(v.name) + '" style="background-image:url(\'' + U.artUrl(id) + '\')"></i><div><b>' + U.esc(v.name) + "</b><small>" + U.esc(v.blurb) + "</small></div>",
        () => { draft.origin = id; U.renderCreate(); });
      b.setAttribute("aria-pressed", String(draft.origin === id));
      U.$("origins").appendChild(b);
    }
    U.$("pname").addEventListener("input", (e) => { draft.name = e.target.value; });
    U.$("story").addEventListener("change", (e) => { draft.storyMode = e.target.checked; });
    U.$("back").addEventListener("click", () => { draft = null; U.renderTitle(); });
    U.$("begin").addEventListener("click", () => {
      const missing = [!draft.pronoun && "how the bards speak of you", !draft.origin && "a homeland", !draft.temperament && "a temperament", !draft.heirloom && "an heirloom"].filter(Boolean);
      if (missing.length) { U.$("need").textContent = "Choose " + missing.join(", ") + " to begin."; return; }
      U.beginLife(draft);
      draft = null;
    });
    U.keys([]);
  };

  U.beginLife = function (d) {
    const S = (K.S = K.newLife());
    S.name = (d.name || "").trim() || K.ORIGINS[d.origin].defaultName || "Ira";
    S.pronoun = d.pronoun; S.origin = d.origin; S.temperament = d.temperament; S.heirloom = d.heirloom; S.storyMode = !!d.storyMode;
    K.apply(K.ORIGINS[d.origin].fx);
    K.apply(K.TEMPERAMENTS[d.temperament].fx);
    K.apply(K.HEIRLOOMS[d.heirloom].fx);
    K.apply({ flag: ["origin_" + d.origin, "temper_" + d.temperament, "heir_" + d.heirloom] });
    K.apply({ journal: "You were born in " + K.ORIGINS[d.origin].name + "." });
    K.go(K.FIRST_SCENE);
  };

  // ---------- Ending ----------
  U.renderEnding = function (sc) {
    const S = K.S;
    const e = sc.ending(S);
    S.ending = e.title;
    U.setNav(true);
    U.where("<b>The end of a life</b>" + (S.alive ? "Age " + S.age : "Fell at " + S.age));
    const leaf = U.$("leaf");
    leaf.innerHTML = U.plate({ art: e.art, caption: e.caption, tag: "yours", tagText: "Your ending" }) +
      '<div class="text"><h1>' + U.t(e.title) + "</h1>" +
      '<div class="telling">' + e.telling.map((l) => "<p>" + U.t(l) + "</p>").join("") + "</div>" +
      (e.fates && e.fates.length ? '<div class="fates"><span class="lbl">What became of them</span>' + e.fates.map((l) => "<p>" + U.t(l) + "</p>").join("") + "</div>" : "") +
      '<div class="btnrow"><button class="cta" id="again" type="button">Live another life</button><button class="ghost" id="readj" type="button">Read your journal</button></div></div>';
    const again = () => { K.deleteSlot("auto"); U.renderCreate(); };
    U.$("again").addEventListener("click", again);
    U.$("readj").addEventListener("click", () => U.openJournal());
    U.keys([again]);
    U.renderLedger();
    U.scrollTop();
  };
})(window.K = window.K || {});
