/* Title screen, character creation and the ending screen. */
(function (K) {
  "use strict";
  const U = K.UI;

  // ---------- Title ----------
  // The hero: the title key art. Someone the epic never names stands on a ridge at dawn above the two
  // armies; the figure is right of centre, clear of the title.
  const HERO = { art: "key_art", caption: "Kurukshetra, at dawn on the first day", mirror: false };
  const ACTS = [
    [1, "scene_princes", "Ages 6 to 12", "Grow up beside the princes. Choose a friend, make a rival, tell your first lie."],
    [2, "scene_path", "Ages 14 to 19", "Find a teacher and a path: archer, healer, spy, bard, and more."],
    [3, "scene_swayamvara", "Ages 21 to 29", "A house of lac, a swayamvara, two kingdoms. Choose where you stand."],
    [4, "scene_secret", "Age 30", "The dice game. What you do in that hall follows you for the rest of your life."],
    [5, "scene_exile", "Ages 30 to 44", "Thirteen years: a marriage, a child, and a secret about Karna."],
    [6, "scene_day13", "Age 44", "Eighteen days at Kurukshetra. You can die here."],
    [7, "scene_teaching", "Age 44 onward", "What is left, who is left, and how the bards will tell it."]
  ];

  U.renderTitle = function () {
    U.redraw = U.renderTitle;
    if (K.Sound) K.Sound.mood("calm");
    U.setNav(false);
    document.body.classList.add("titling");
    U.where("");
    U.closeModal();
    const auto = K.loadSlot("auto");
    const leaf = U.$("leaf");
    leaf.innerHTML =
      '<section class="hero" aria-labelledby="title-h">' +
        '<div class="slides" aria-hidden="true"><i class="slide on' + (HERO.mirror ? " mirror" : "") + '" style="--img:url(\'' + U.artUrl(HERO.art) + '\')"></i></div>' +
        '<div class="hero-bar" id="hero-bar"></div>' +
        '<div class="hero-copy">' +
          '<h1 class="title" id="title-h"><img class="logo ' + K.lang + '" src="brand/logo_' + (K.lang === "hi" ? "hi" : "en") + '_dark.svg" alt="' + U.tr("Kurukshetra: A Life") + '"></h1>' +
          '<p class="tagline">' + U.tr("You cannot change the Mahabharata. You can decide who you were inside it.") + "</p>" +
          '<div class="btnrow" id="title-btns"></div>' +
        "</div>" +
        '<p class="slide-cap">' + U.t(HERO.caption) + "</p>" +
      "</section>" +
      '<section class="life" aria-labelledby="life-h">' +
        '<div class="life-head"><h2 id="life-h">' + U.tr("One life, seven acts") + "</h2>" +
          "<p>" + U.tr("Create someone the epic never mentions and live their whole life, from a childhood beside the young princes to the eighteen days of war and what comes after. The great events are written. Where you stand, what you swear, who you love and how you die are unwritten, and yours.") + "</p></div>" +
        '<ol class="acts">' + ACTS.map(([n, art, ages, line]) => {
          const [act, name] = K.tr(K.ACT_TITLES[n]).split(" · ");
          return '<li><i style="--img:url(\'' + U.artUrl(art) + '\')" aria-hidden="true"></i><div><span>' + U.esc(act) + " · " + U.tr(ages) + "</span><b>" + U.esc(name || act) + "</b><small>" + U.tr(line) + "</small></div></li>";
        }).join("") + "</ol>" +
        '<p class="note">' + U.tr("Pre-production build. All story text is a working draft and still needs review by scholars and community advisors.") + "</p>" +
      "</section>";

    U.$("hero-bar").appendChild(U.langSwitch((id) => U.setLang(id)));
    const row = U.$("title-btns");
    const keys = [];
    if (auto && auto.scene !== "title") {
      const info = auto.alive ? K.tr("{name}, age {n}", { name: auto.name || K.tr("Unnamed"), n: auto.age }) : K.tr("{name}, age {n} (ended)", { name: auto.name || K.tr("Unnamed"), n: auto.age });
      const cont = () => { K.S = auto; K.go(auto.scene); };
      row.appendChild(U.button("cta", U.tr("Continue · {info}", { info }), cont, "btn-continue"));
      keys.push(cont);
    }
    const fresh = () => U.renderCreate();
    row.appendChild(U.button(auto ? "cta secondary" : "cta", U.tr("Begin a new life"), fresh, "btn-new"));
    keys.push(fresh);
    const load = () => U.openLoad();
    row.appendChild(U.button("ghost", U.tr("Load a save code"), load));
    keys.push(load);
    if (K.lives().length) { row.appendChild(U.button("ghost", U.tr("Book of Lives"), U.openLives, "btn-lives")); keys.push(U.openLives); }
    U.keys(keys);
    // The introduction is written in, like every other page.
    const q = (sel) => leaf.querySelector(sel);
    q(".tagline").classList.add("write");
    q(".life-head p").classList.add("write");
    q(".title").dataset.hold = 700;
    U.stage([q(".title"), q(".tagline"), q(".hero .btnrow"), q(".slide-cap"), q(".life-head h2"), q(".life-head p"), ...leaf.querySelectorAll(".acts li"), q(".life .note")]);
  };

  // ---------- Character creation ----------
  // Step one is the homeland: a picture of each land, then a page about the chosen region written
  // out by the quill. Step two is the rest of the character.
  let draft = null;
  const newDraft = () => ({ step: "land", look: null, name: "", pronoun: null, origin: null, temperament: null, heirloom: null, storyMode: false, past: null });
  const writeAll = (els) => els.forEach((el) => el && el.classList.add("write"));

  U.renderCreate = function () {
    draft = draft || newDraft();
    U.redraw = U.renderCreate;
    U.setNav(false);
    U.where("<b>" + U.tr("A new life") + "</b><span>" + U.tr("Age {n}", { n: 6 }) + "</span>");
    if (draft.step === "land") return draft.look ? landPage(draft.look) : landList();
    return selfPage();
  };

  function landList() {
    const leaf = U.$("leaf");
    // On wider screens the map comes first and the pictures wait behind a button; phones get the list.
    leaf.innerHTML = '<div class="text"><h1>' + U.tr("Where were you born?") + "</h1>" +
      "<p>" + U.tr("Your homeland shapes how the world treats you. It never limits what you can become. Choose a land to read about it.") + "</p>" +
      (U.homeMap ? '<div class="homes-wrap">' + U.homeMap(draft.origin, window.matchMedia && matchMedia("(max-width: 720px)").matches ? 1.55 : 1) + '<button type="button" class="ghost" id="as-list">' + U.tr("See the lands as pictures") + "</button></div>" : "") +
      '<div class="lands under-map' + (draft.asList ? " shown" : "") + '" id="origins"></div><p class="err" id="need"></p></div>';
    if (U.fitEmblems) U.fitEmblems(leaf);
    const pickHome = (id) => { draft.look = id; U.renderCreate(); };
    leaf.querySelectorAll(".m-home").forEach((g) => {
      g.addEventListener("click", () => pickHome(g.dataset.home));
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pickHome(g.dataset.home); } });
    });
    const asList = U.$("as-list");
    if (asList) asList.addEventListener("click", () => { draft.asList = true; U.$("origins").classList.add("shown"); asList.hidden = true; U.$("origins").scrollIntoView({ behavior: "smooth", block: "start" }); });
    if (asList && draft.asList) asList.hidden = true;
    const box = U.$("origins");
    for (const [id, v] of Object.entries(K.ORIGINS)) {
      const b = U.button("origin land", '<i style="--img:url(\'' + U.artUrl("home_" + id) + '\')" aria-hidden="true"></i><div><b>' + U.tr(v.name) + "</b><span>" + U.tr(v.region) + "</span><small>" + U.tr(v.blurb) + "</small></div>",
        () => { draft.look = id; U.renderCreate(); });
      b.setAttribute("aria-pressed", String(draft.origin === id));
      box.appendChild(b);
    }
    U.keys([]);
    const t = leaf.querySelector(".text");
    writeAll([t.children[1]]);
    [...box.children].forEach((c) => { c.dataset.hold = 140; });
    U.stage([t.children[0], t.children[1], leaf.querySelector(".homes-wrap"), ...box.children].filter(Boolean));
  }

  function landPage(id) {
    const v = K.ORIGINS[id];
    const gives = K.preview({ fx: v.fx }).map(([cls, txt]) => '<span class="chip ' + (cls === "down" ? "bad" : "good") + '">' + U.esc(txt) + "</span>").join("");
    const leaf = U.$("leaf");
    leaf.innerHTML = '<div class="land-hero" style="--img:url(\'' + U.artUrl("home_" + id) + '\')"><span class="cap"><span class="kind">' + U.tr("Your homeland") + "</span><b>" + U.tr(v.name) + "</b><small>" + U.tr(v.region) + "</small></span></div>" +
      '<div class="text">' + (v.context || [v.detail]).map((pp) => "<p>" + U.t(pp) + "</p>").join("") +
      '<div class="field"><span class="lbl">' + U.tr("You begin with") + '</span><div class="chips">' + gives + "</div></div>" +
      '<div class="btnrow"><button class="cta" id="land-ok" type="button">' + U.tr("Be born here") + '</button><button class="ghost" id="land-back" type="button">' + U.tr("See the other lands") + "</button></div></div>";
    const ok = () => { draft.origin = id; draft.look = null; draft.step = "self"; U.renderCreate(); };
    const back = () => { draft.look = null; U.renderCreate(); };
    U.$("land-ok").addEventListener("click", ok);
    U.$("land-back").addEventListener("click", back);
    U.keys([]);
    U.scrollTop();
    const hero = leaf.querySelector(".land-hero"); hero.dataset.hold = 900;
    const t = leaf.querySelector(".text");
    const paras = [...t.querySelectorAll(":scope > p")];
    writeAll(paras);
    U.stage([hero, ...paras, t.querySelector(".field"), t.querySelector(".btnrow")], () => U.keys([ok, back]));
  }

  function selfPage() {
    const o = K.ORIGINS[draft.origin];
    const leaf = U.$("leaf");
    leaf.innerHTML = U.plate({ art: "home_" + draft.origin, title: o.name, small: o.region, tag: "yours", tagText: K.tr("Your homeland") }) +
      '<div class="text"><h1>' + U.tr("Who were you?") + "</h1>" +
      "<p>" + U.tr("Now give the child a name, a nature and something handed down.") + "</p>" +
      '<div class="field"><label class="lbl" for="pname">' + U.tr("Your name") + '</label><input id="pname" type="text" maxlength="24" autocomplete="off" placeholder="' + U.tr("Name your character") + '" value="' + U.esc(draft.name) + '"></div>' +
      '<div class="field"><span class="lbl">' + U.tr("How should the bards speak of you?") + '</span><div class="opts" id="pron"></div></div>' +
      '<div class="field"><span class="lbl">' + U.tr("Childhood temperament") + '</span><div class="picks" id="temps"></div></div>' +
      '<div class="field"><span class="lbl">' + U.tr("Family heirloom") + '</span><div class="picks" id="heirs"></div></div>' +
      (K.lives().length ? '<div class="field"><span class="lbl">' + U.tr("Remember a past life?") + '</span><p class="note">' + U.tr("A life from your Book of Lives can be born again in this one, and bring its karma with it.") + '</p><div class="picks pasts" id="pasts"></div></div>' : "") +
      '<label class="toggle"><input type="checkbox" id="story"' + (draft.storyMode ? " checked" : "") + "><span>" + U.tr("Story mode") + "<small>" +
        U.tr("You cannot die in battle, so you can see every chapter. Death stays a choice the story can still offer.") + "</small></span></label>" +
      '<div class="btnrow"><button class="cta" id="begin" type="button">' + U.tr("Begin this life") + '</button><button class="ghost" id="back" type="button">' + U.tr("Choose another homeland") + '</button></div><p class="err" id="need"></p></div>';

    const opts = (elId, list, key) => list.forEach(([id, label]) => {
      const b = U.button("opt", U.tr(label), () => { draft[key] = id; refresh(); });
      b.dataset.id = id;
      b.setAttribute("aria-pressed", String(draft[key] === id));
      U.$(elId).appendChild(b);
    });
    // Picking updates the buttons in place, so the page does not re-stage on every click.
    const refresh = () => leaf.querySelectorAll("[data-key]").forEach((b) => b.setAttribute("aria-pressed", String(String(draft[b.dataset.key]) === b.dataset.id)));
    opts("pron", [["she", "She"], ["he", "He"], ["they", "They"]], "pronoun");
    U.$("pron").querySelectorAll(".opt").forEach((b) => { b.dataset.key = "pronoun"; });
    const cards = (elId, map, key, prefix, round) => Object.entries(map).forEach(([id, v]) => {
      const name = K.tr(v.name);
      const b = U.button("pick" + (round ? " round" : ""), '<i role="img" aria-label="' + U.esc(name) + '" style="background-image:url(\'' + U.artUrl(prefix + id) + '\')"></i><b>' + U.esc(name) + "</b><small>" + U.tr(v.short) + "</small>",
        () => { draft[key] = id; refresh(); });
      b.dataset.key = key; b.dataset.id = id;
      b.setAttribute("aria-pressed", String(draft[key] === id));
      U.$(elId).appendChild(b);
    });
    cards("temps", K.TEMPERAMENTS, "temperament", "temper_", true);
    cards("heirs", K.HEIRLOOMS, "heirloom", "heir_", false);
    if (U.$("pasts")) {
      const lives = K.lives().slice(0, 4);
      const past = (idx, html) => {
        const b = U.button("pick past", html, () => { draft.past = idx; refresh(); });
        b.dataset.key = "past"; b.dataset.id = String(idx);
        b.setAttribute("aria-pressed", String(String(draft.past) === String(idx)));
        U.$("pasts").appendChild(b);
      };
      past(null, '<i class="none" aria-hidden="true"></i><b>' + U.tr("No") + "</b><small>" + U.tr("Begin with nothing remembered") + "</small>");
      lives.forEach((r, i) => past(i, '<i style="background-image:url(\'' + U.artUrl(r.art) + '\')" aria-hidden="true"></i><b>' + U.esc(r.me.name) + "</b><small>" +
        U.tr(r.title) + "</small><small class=\"karma\">" + K.karmaOf(r).map(([label]) => U.tr(label)).join(" · ") + "</small>"));
    }
    U.$("pname").addEventListener("input", (e) => { draft.name = e.target.value; });
    U.$("story").addEventListener("change", (e) => { draft.storyMode = e.target.checked; });
    U.$("back").addEventListener("click", () => { draft.step = "land"; U.renderCreate(); });
    U.$("begin").addEventListener("click", () => {
      const missing = [!draft.pronoun && "how the bards speak of you", !draft.temperament && "a temperament", !draft.heirloom && "an heirloom"].filter(Boolean).map(K.tr);
      if (missing.length) { U.$("need").textContent = K.tr("Choose {list} to begin.", { list: K.list(missing) }); return; }
      U.beginLife(draft);
      draft = null;
    });
    U.keys([]);
    const plate = leaf.querySelector(".plate"); if (plate) plate.dataset.hold = 600;
    const t = leaf.querySelector(".text");
    writeAll([t.children[1]]);
    U.stage([plate, ...t.children]);
  }

  U.beginLife = function (d) {
    const S = (K.S = K.newLife());
    S.name = (d.name || "").trim() || K.tr(K.ORIGINS[d.origin].defaultName || "Ira");
    S.pronoun = d.pronoun; S.origin = d.origin; S.temperament = d.temperament; S.heirloom = d.heirloom; S.storyMode = !!d.storyMode;
    K.apply(K.ORIGINS[d.origin].fx);
    K.apply(K.TEMPERAMENTS[d.temperament].fx);
    K.apply(K.HEIRLOOMS[d.heirloom].fx);
    K.apply({ flag: ["origin_" + d.origin, "temper_" + d.temperament, "heir_" + d.heirloom] });
    K.apply({ journal: "You were born in {origin}." });
    const past = d.past != null && K.lives()[d.past];
    if (past) K.rebirth(S, past);
    K.go(K.FIRST_SCENE);
  };

  // ---------- Ending ----------
  U.renderEnding = function (sc) {
    const S = K.S;
    U.redraw = () => U.renderEnding(sc);
    if (K.Sound) K.Sound.mood("calm");
    const e = sc.ending(S);
    S.ending = e.title;
    K.recordLife(S, e);
    U.setNav(true);
    U.where("<b>" + U.tr("The end of a life") + "</b><span>" + U.tr(S.alive ? "Age {n}" : "Fell at {n}", { n: S.age }) + "</span>");
    const leaf = U.$("leaf");
    leaf.innerHTML = U.plate({ art: e.art, caption: e.caption, tag: "yours", tagText: K.tr("Your ending"), heading: e.title, pose: S.alive ? "stand" : "dead", big: true }) +
      '<div class="text">' +
      '<div class="telling">' + e.telling.map((l) => "<p>" + U.t(l) + "</p>").join("") + "</div>" +
      (e.fates && e.fates.length ? '<div class="fates"><span class="lbl">' + U.tr("What became of them") + "</span>" + e.fates.map((l) => "<p>" + U.t(l) + "</p>").join("") + "</div>" : "") +
      '<p class="record-line">' + U.tr("Your record: {w} fights won, {l} lost · {p} of {t} tests passed · {g} games won", { w: K.record(S).won, l: K.record(S).lost, p: K.record(S).passed, t: K.record(S).passed + K.record(S).failed, g: K.record(S).gamesWon }) + "</p>" +
      (S.road && S.road.length > 1 && U.mapOf ? '<div class="end-map"><span class="lbl">' + U.tr("Your road") + "</span>" + U.mapOf(S, { px: Math.min(700, window.innerWidth - 40) }) + "</div>" : "") +
      '<div class="btnrow"><button class="cta" id="again" type="button">' + U.tr("Live another life") + '</button><button class="ghost" id="readj" type="button">' + U.tr("Read your journal") + "</button></div></div>";
    const again = () => { K.deleteSlot("auto"); U.renderCreate(); };
    if (U.fitEmblems) U.fitEmblems(leaf);
    U.$("again").addEventListener("click", again);
    U.$("readj").addEventListener("click", () => U.openJournal());
    U.renderLedger();
    U.scrollTop();
    // The bards' telling arrives line by line.
    const plate = leaf.querySelector(".pagehead,.plate"); if (plate) plate.dataset.hold = 1400;
    const h1 = null;
    const lines = [...leaf.querySelectorAll(".telling p")];
    lines.forEach((l) => l.classList.add("write"));
    const fates = leaf.querySelector(".fates");
    U.keys([]);
    U.stage([plate, ...lines, fates, ...(fates ? fates.children : []), leaf.querySelector(".text .btnrow")], () => U.keys([again]));
  };
})(window.K = window.K || {});
