/* Title screen, character creation and the ending screen. */
(function (K) {
  "use strict";
  const U = K.UI;

  // ---------- Title ----------
  // A life told in paintings: the hero cross-fades through the story in order, each frame captioned
  // with the age you would be. Below it, the seven acts as a strip.
  const SLIDES = [
    ["scene_princes", 8, "The palace gardens"],
    ["scene_path", 15, "Your first year of training"],
    ["scene_swayamvara", 25, "A golden fish turning above the water"],
    ["scene_exile", 30, "The Pandavas walk into exile"],
    ["scene_day13", 44, "Kurukshetra, the thirteenth day of the war"],
    ["scene_teaching", 44, "The grandsire's last teaching"]
  ];
  const ACTS = [
    [1, "scene_princes", "Ages 6 to 12", "Grow up beside the princes. Choose a friend, make a rival, tell your first lie."],
    [2, "scene_path", "Ages 14 to 19", "Find a teacher and a path: archer, healer, spy, bard, and more."],
    [3, "scene_swayamvara", "Ages 21 to 29", "A house of lac, a swayamvara, two kingdoms. Choose where you stand."],
    [4, "scene_secret", "Age 30", "The dice game. What you do in that hall follows you for the rest of your life."],
    [5, "scene_exile", "Ages 30 to 44", "Thirteen years: a marriage, a child, and a secret about Karna."],
    [6, "scene_day13", "Age 44", "Eighteen days at Kurukshetra. You can die here."],
    [7, "scene_teaching", "Age 44 onward", "What is left, who is left, and how the bards will tell it."]
  ];
  let slideTimer = null;

  U.renderTitle = function () {
    U.redraw = U.renderTitle;
    U.setNav(false);
    document.body.classList.add("titling");
    U.where("");
    U.closeModal();
    clearInterval(slideTimer);
    const auto = K.loadSlot("auto");
    const leaf = U.$("leaf");
    const cap = (i) => K.tr("Age {n}", { n: SLIDES[i][1] }) + " · " + K.text(SLIDES[i][2]);
    leaf.innerHTML =
      '<section class="hero" aria-labelledby="title-h">' +
        '<div class="slides" aria-hidden="true">' + SLIDES.map((s, i) => '<i class="slide' + (i === 0 ? " on" : "") + '" data-art="' + s[0] + '"' + (i === 0 ? ' style="--img:url(\'' + U.artUrl(s[0]) + '\')"' : "") + "></i>").join("") + "</div>" +
        '<div class="hero-bar" id="hero-bar"></div>' +
        '<div class="hero-copy">' +
          '<h1 class="title" id="title-h">' + U.tr("Kurukshetra") + "<em>" + U.tr("A Life") + "</em></h1>" +
          '<p class="tagline">' + U.tr("You cannot change the Mahabharata. You can decide who you were inside it.") + "</p>" +
          '<div class="btnrow" id="title-btns"></div>' +
        "</div>" +
        '<p class="slide-cap" id="slide-cap">' + U.esc(cap(0)) + "</p>" +
      "</section>" +
      '<section class="life" aria-labelledby="life-h">' +
        '<div class="life-head"><h2 id="life-h">' + U.tr("One life, seven acts") + "</h2>" +
          "<p>" + U.tr("Create someone the epic never mentions and live their whole life, from a childhood beside the young princes to the eighteen days of war and what comes after. The great events always happen. Where you stand, what you swear, who you love and how you die are yours.") + "</p></div>" +
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
    U.keys(keys);
    startSlides(cap);
  };

  // Cross-fade every 7 seconds, loading each painting only just before it is shown.
  function startSlides(cap) {
    const slides = [...document.querySelectorAll(".hero .slide")];
    const capEl = U.$("slide-cap");
    const still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still || slides.length < 2) return;
    let i = 0;
    slideTimer = setInterval(() => {
      if (!document.body.contains(capEl)) return clearInterval(slideTimer);
      if (document.hidden) return;
      const next = (i + 1) % slides.length;
      const el = slides[next];
      const show = () => {
        slides[i].classList.remove("on");
        el.classList.add("on");
        capEl.textContent = cap(next);
        i = next;
      };
      if (el.style.getPropertyValue("--img")) return show();
      const url = U.artUrl(el.dataset.art);
      const img = new Image();
      img.onload = () => { el.style.setProperty("--img", "url('" + url + "')"); show(); };
      img.src = url;
    }, 7000);
  }

  // ---------- Character creation ----------
  let draft = null;
  U.renderCreate = function () {
    draft = draft || { name: "", pronoun: null, origin: null, temperament: null, heirloom: null, storyMode: false };
    U.redraw = U.renderCreate;
    U.setNav(false);
    U.where("<b>" + U.tr("A new life") + "</b>" + U.tr("Age {n}", { n: 6 }));
    const o = draft.origin && K.ORIGINS[draft.origin];
    const leaf = U.$("leaf");
    leaf.innerHTML = (o ? U.plate({ art: draft.origin, title: o.name, small: o.blurb, tag: "yours", tagText: K.tr("Your homeland") })
      : U.plate({ grad: ["#d4a84b", "#3b5ba9"], caption: "Choose a homeland below", tag: "yours", tagText: K.tr("Your life") })) +
      '<div class="text"><h1>' + U.tr("Where were you born?") + "</h1>" +
      "<p>" + U.tr("Your origin shapes how the world treats you. It never limits what you can become.") + "</p>" +
      '<div class="field"><label class="lbl" for="pname">' + U.tr("Your name") + '</label><input id="pname" type="text" maxlength="24" autocomplete="off" placeholder="' + U.tr("Name your character") + '" value="' + U.esc(draft.name) + '"></div>' +
      '<div class="field"><span class="lbl">' + U.tr("How should the bards speak of you?") + '</span><div class="opts" id="pron"></div></div>' +
      '<div class="field"><span class="lbl">' + U.tr("Homeland") + '</span><div class="origins" id="origins"></div></div>' +
      (o ? '<p class="aside">' + U.t(o.detail) + "</p>" : "") +
      '<div class="field"><span class="lbl">' + U.tr("Childhood temperament") + '</span><div class="picks" id="temps"></div></div>' +
      '<div class="field"><span class="lbl">' + U.tr("Family heirloom") + '</span><div class="picks" id="heirs"></div></div>' +
      '<label class="toggle"><input type="checkbox" id="story"' + (draft.storyMode ? " checked" : "") + "><span>" + U.tr("Story mode") + "<small>" +
        U.tr("You cannot die in battle, so you can see every chapter. Death stays a choice the story can still offer.") + "</small></span></label>" +
      '<div class="btnrow"><button class="cta" id="begin" type="button">' + U.tr("Begin this life") + '</button><button class="ghost" id="back" type="button">' + U.tr("Back") + '</button></div><p class="err" id="need"></p></div>';

    const opts = (elId, list, key) => list.forEach(([id, label, small]) => {
      const b = U.button("opt", U.tr(label) + (small ? "<small>" + U.tr(small) + "</small>" : ""), () => { draft[key] = id; U.renderCreate(); });
      b.setAttribute("aria-pressed", String(draft[key] === id));
      U.$(elId).appendChild(b);
    });
    opts("pron", [["she", "She"], ["he", "He"], ["they", "They"]], "pronoun");
    const cards = (elId, map, key, prefix, round) => Object.entries(map).forEach(([id, v]) => {
      const name = K.tr(v.name);
      const b = U.button("pick" + (round ? " round" : ""), '<i role="img" aria-label="' + U.esc(name) + '" style="background-image:url(\'' + U.artUrl(prefix + id) + '\')"></i><b>' + U.esc(name) + "</b><small>" + U.tr(v.short) + "</small>",
        () => { draft[key] = id; U.renderCreate(); });
      b.setAttribute("aria-pressed", String(draft[key] === id));
      U.$(elId).appendChild(b);
    });
    cards("temps", K.TEMPERAMENTS, "temperament", "temper_", true);
    cards("heirs", K.HEIRLOOMS, "heirloom", "heir_", false);
    for (const [id, v] of Object.entries(K.ORIGINS)) {
      const name = K.tr(v.name);
      const b = U.button("origin", '<i role="img" aria-label="' + U.esc(name) + '" style="background-image:url(\'' + U.artUrl(id) + '\')"></i><div><b>' + U.esc(name) + "</b><small>" + U.tr(v.blurb) + "</small></div>",
        () => { draft.origin = id; U.renderCreate(); });
      b.setAttribute("aria-pressed", String(draft.origin === id));
      U.$("origins").appendChild(b);
    }
    U.$("pname").addEventListener("input", (e) => { draft.name = e.target.value; });
    U.$("story").addEventListener("change", (e) => { draft.storyMode = e.target.checked; });
    U.$("back").addEventListener("click", () => { draft = null; U.renderTitle(); });
    U.$("begin").addEventListener("click", () => {
      const missing = [!draft.pronoun && "how the bards speak of you", !draft.origin && "a homeland", !draft.temperament && "a temperament", !draft.heirloom && "an heirloom"].filter(Boolean).map(K.tr);
      if (missing.length) { U.$("need").textContent = K.tr("Choose {list} to begin.", { list: K.list(missing) }); return; }
      U.beginLife(draft);
      draft = null;
    });
    U.keys([]);
  };

  U.beginLife = function (d) {
    const S = (K.S = K.newLife());
    S.name = (d.name || "").trim() || K.tr(K.ORIGINS[d.origin].defaultName || "Ira");
    S.pronoun = d.pronoun; S.origin = d.origin; S.temperament = d.temperament; S.heirloom = d.heirloom; S.storyMode = !!d.storyMode;
    K.apply(K.ORIGINS[d.origin].fx);
    K.apply(K.TEMPERAMENTS[d.temperament].fx);
    K.apply(K.HEIRLOOMS[d.heirloom].fx);
    K.apply({ flag: ["origin_" + d.origin, "temper_" + d.temperament, "heir_" + d.heirloom] });
    K.apply({ journal: "You were born in {origin}." });
    K.go(K.FIRST_SCENE);
  };

  // ---------- Ending ----------
  U.renderEnding = function (sc) {
    const S = K.S;
    U.redraw = () => U.renderEnding(sc);
    const e = sc.ending(S);
    S.ending = e.title;
    U.setNav(true);
    U.where("<b>" + U.tr("The end of a life") + "</b>" + U.tr(S.alive ? "Age {n}" : "Fell at {n}", { n: S.age }));
    const leaf = U.$("leaf");
    leaf.innerHTML = U.plate({ art: e.art, caption: e.caption, tag: "yours", tagText: K.tr("Your ending") }) +
      '<div class="text"><h1>' + U.t(e.title) + "</h1>" +
      '<div class="telling">' + e.telling.map((l) => "<p>" + U.t(l) + "</p>").join("") + "</div>" +
      (e.fates && e.fates.length ? '<div class="fates"><span class="lbl">' + U.tr("What became of them") + "</span>" + e.fates.map((l) => "<p>" + U.t(l) + "</p>").join("") + "</div>" : "") +
      '<div class="btnrow"><button class="cta" id="again" type="button">' + U.tr("Live another life") + '</button><button class="ghost" id="readj" type="button">' + U.tr("Read your journal") + "</button></div></div>";
    const again = () => { K.deleteSlot("auto"); U.renderCreate(); };
    U.$("again").addEventListener("click", again);
    U.$("readj").addEventListener("click", () => U.openJournal());
    U.keys([again]);
    U.renderLedger();
    U.scrollTop();
  };
})(window.K = window.K || {});
