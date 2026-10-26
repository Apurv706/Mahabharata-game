/* Character sheet, journal, menu (saves, settings, glossary) and loading a save code. */
(function (K) {
  "use strict";
  const U = K.UI;
  const row = (k, v) => '<div class="stat"><span>' + U.tr(k) + "</span><span>" + U.esc(v) + "</span></div>";
  const died = (name, dead) => (dead ? K.tr("{name} (died)", { name }) : name);

  U.openCharacter = function () {
    const S = K.S;
    const life = [
      ["Name", S.name], ["Age", S.age], ["Homeland", S.origin ? K.tr(K.ORIGINS[S.origin].name) : "—"],
      ["Path", K.tr(K.PATHS[S.path]?.name || "Not chosen yet")], ["Teacher", K.tr(K.TEACHERS[S.teacher]?.name || "None yet")],
      ["Court", K.tr(K.COURTS[S.court]?.name || "None")], ["Side in the war", K.tr(S.side ? (S.side === "pandava" ? "The Pandavas" : S.side === "kaurava" ? "The Kuru throne" : "Neither") : "Not chosen")],
      ["Spouse", S.spouse ? died(K.personName("spouse"), K.isDead(S.spouse)) : K.tr("None")],
      ["Child", S.child ? died(K.personName(S.child), K.isDead(S.child)) : K.tr("None")]
    ].map(([k, v]) => row(k, v)).join("");
    const attrs = Object.entries(K.ATTRS).map(([k, n]) => {
      const base = S.attrs[k], now = K.attr(k);
      return row(n, now !== base ? K.tr("{now} (base {base})", { now, base }) : now);
    }).join("");
    const skills = Object.entries(K.SKILLS).map(([k, n]) => row(n, S.skills[k] + " / 6")).join("");
    const rep = Object.entries(K.FACTIONS).map(([k, n]) => row(n, S.rep[k] + " / 10")).join("");
    const extras = []
      .concat(S.boons.map((b) => "<p><b>" + U.tr(K.BOONS[b].name) + ".</b> " + U.tr(K.BOONS[b].text) + "</p>"))
      .concat(S.curses.map((c) => '<p class="curse"><b>' + U.tr(K.CURSES[c.id].name) + ".</b> " + U.tr(c.fired ? "It has struck." : K.CURSES[c.id].text) + "</p>"))
      .concat(S.injuries.map((i) => "<p><b>" + U.tr(K.INJURIES[i].name) + ".</b> " + U.tr(K.INJURIES[i].text) + "</p>"));
    const temper = S.temperament && K.tr(K.TEMPERAMENTS[S.temperament].name);
    const heir = S.heirloom && K.tr(K.HEIRLOOMS[S.heirloom].name);
    const head = '<div class="sheet-head">' +
      (S.path ? U.thumb("path_" + S.path, "emblem", K.tr(K.PATHS[S.path].name)) + "<span>" + U.tr(K.PATHS[S.path].name) + "</span>" : "") +
      (S.teacher ? U.thumb({ drona: "teacher_drona", kripa: "teacher_kripa", balarama: "teacher_balarama", hermit: "teacher_mauni", vidura: "teacher_vidura", self: "teacher_self" }[S.teacher], "card", K.tr(K.TEACHERS[S.teacher].name)) + "<span>" + U.tr(K.TEACHERS[S.teacher].short === "no one" ? "Self-taught" : K.TEACHERS[S.teacher].short) + "</span>" : "") +
      (S.temperament ? '<i class="round" role="img" aria-label="' + U.esc(temper) + '" style="background-image:url(\'' + U.artUrl("temper_" + S.temperament) + '\')"></i><span>' + U.tr("{t} by temperament", { t: temper }) + "</span>" : "") +
      (S.heirloom ? '<i role="img" aria-label="' + U.esc(heir) + '" style="background-image:url(\'' + U.artUrl("heir_" + S.heirloom) + '\')"></i><span>' +
        U.tr(S.heirloom === "amulet" && S.flags.includes("amulet_broken") ? "Heirloom: {h!} (cracked)" : "Heirloom: {h!}", { h: heir }) + "</span>" : "") + "</div>";
    U.openModal("Character", head + '<div class="grid2"><div><span class="lbl">' + U.tr("Life") + "</span>" + life + '</div><div><span class="lbl">' + U.tr("Attributes (age changes these)") + "</span>" + attrs +
      '</div><div><span class="lbl">' + U.tr("Skills") + "</span>" + skills + '</div><div><span class="lbl">' + U.tr("Standing") + "</span>" + rep +
      row("Healing herbs", S.items.herbs || 0) + "</div></div>" + (extras.length ? '<span class="lbl">' + U.tr("Boons, curses and wounds") + "</span>" + extras.join("") : ""));
  };

  U.openJournal = function () {
    const S = K.S;
    const items = S.journal.map((j) => "<li><span>" + U.tr("Age {n}", { n: j.age }) + "</span><div>" + U.esc(K.entryText(j)) + "</div></li>").join("");
    U.openModal("Journal", items ? '<ol class="journal">' + items + "</ol>" : '<p class="empty">' + U.tr("Nothing written yet.") + "</p>");
  };

  U.openGlossary = function () {
    const d = Object.entries(K.GLOSSARY).map(([t, x]) => [K.tr(t), K.tr(x)]).sort((a, b) => a[0].localeCompare(b[0], K.lang))
      .map(([t, x]) => "<dt>" + U.esc(t) + "</dt><dd>" + U.esc(x) + "</dd>").join("");
    U.openModal("Glossary", '<dl class="gloss">' + d + "</dl>");
  };

  U.openLoad = function () {
    U.openModal("Load a save code", '<p class="note">' + U.tr("Paste a save code from this game, on any device.") + '</p><label class="lbl" for="code-in">' + U.tr("Save code") + '</label><textarea id="code-in" spellcheck="false"></textarea>' +
      '<div class="btnrow"><button class="cta" id="code-load" type="button">' + U.tr("Load this life") + '</button></div><p class="err" id="code-err"></p>', () => {
      U.$("code-load").addEventListener("click", () => {
        try { const s = K.importCode(U.$("code-in").value); U.closeModal(); K.S = s; K.go(s.scene); }
        catch (e) { U.$("code-err").textContent = e.message; }
      });
    });
  };

  U.openMenu = function () {
    const S = K.S;
    const manual = K.loadSlot("manual");
    const prefs = K.prefs();
    U.openModal("Menu",
      '<div class="field"><span class="lbl">' + U.tr("Language") + '</span><div id="m-lang"></div></div>' +
      '<div class="grid2"><div class="field"><span class="lbl">' + U.tr("Saving") + "</span>" +
      '<p class="note">' + U.tr("The game saves itself at every new scene, in this browser only.") + "</p>" +
      '<div class="btnrow"><button class="cta secondary" id="m-save" type="button">' + U.tr("Save a copy") + "</button>" +
      (manual ? '<button class="ghost" id="m-load" type="button">' + U.tr("Load copy ({name}, age {n})", { name: manual.name, n: manual.age }) + "</button>" : "") + "</div>" +
      '<p class="note" id="m-saved"></p></div>' +
      '<div class="field"><span class="lbl">' + U.tr("Settings") + "</span>" +
      '<label class="toggle"><input type="checkbox" id="m-story"' + (S.storyMode ? " checked" : "") + "><span>" + U.tr("Story mode") + "<small>" + U.tr("You cannot die in battle.") + "</small></span></label>" +
      '<label class="toggle"><input type="checkbox" id="m-big"' + (prefs.bigText ? " checked" : "") + "><span>" + U.tr("Larger text") + "</span></label>" +
      '<label class="toggle"><input type="checkbox" id="m-gradual"' + (prefs.gradual !== false ? " checked" : "") + "><span>" + U.tr("Reveal the story line by line") + "<small>" + U.tr("Tap the page or press Space to show everything at once.") + "</small></span></label>" +
      '<label class="toggle"><input type="checkbox" id="m-timed"' + (prefs.timed !== false ? " checked" : "") + "><span>" + U.tr("Timed moments") + "<small>" + U.tr("At a few hard moments a lamp burns down. If it goes out, you hold your tongue.") + "</small></span></label>" +
      '<label class="toggle"><input type="checkbox" id="m-sound"' + (prefs.sound !== false ? " checked" : "") + "><span>" + U.tr("Sound") + "<small>" + U.tr("The quill, the conch, the dice and the gong.") + "</small></span></label>" +
      '<label class="toggle"><input type="checkbox" id="m-drone"' + (prefs.drone !== false && prefs.music !== false ? " checked" : "") + (prefs.sound === false ? " disabled" : "") + "><span>" + U.tr("Music") + "<small>" + U.tr("Three pieces for the stages of a life: a heroic theme, a fusion piece for the hard years, and a battle anthem for the war.") + "</small></span></label>" +
      '<label class="range"><span>' + U.tr("Music volume") + '</span><input type="range" id="m-vol" min="0" max="100" step="5" value="' + Math.round((typeof prefs.musicVol === "number" ? prefs.musicVol : 0.7) * 100) + '"></label></div></div>' +
      '<div class="field"><span class="lbl">' + U.tr("Move this life to another device") + '</span><p class="note">' + U.tr("Copy this code and paste it into \u201cLoad a save code\u201d on another device.") + "</p>" +
      '<textarea id="m-code" readonly spellcheck="false">' + U.esc(K.exportCode()) + '</textarea><div class="btnrow"><button class="ghost" id="m-copy" type="button">' + U.tr("Copy code") + "</button></div></div>" +
      '<div class="btnrow"><button class="ghost" id="m-gloss" type="button">' + U.tr("Glossary") + '</button><button class="ghost" id="m-title" type="button">' + U.tr("Return to title") + "</button></div>",
      () => {
        U.$("m-lang").appendChild(U.langSwitch((id) => { U.closeModal(); U.setLang(id, U.openMenu); }));
        U.$("m-save").addEventListener("click", () => { U.$("m-saved").textContent = K.tr(K.save("manual") ? "Saved." : "This browser is not allowing saves. Use the save code instead."); });
        if (manual) U.$("m-load").addEventListener("click", () => { U.closeModal(); K.S = manual; K.go(manual.scene); });
        U.$("m-story").addEventListener("change", (e) => { K.S.storyMode = e.target.checked; K.save("auto"); });
        U.$("m-gradual").addEventListener("change", (e) => { K.prefs({ gradual: e.target.checked }); });
        U.$("m-timed").addEventListener("change", (e) => { K.prefs({ timed: e.target.checked }); });
        U.$("m-sound").addEventListener("change", (e) => { K.prefs({ sound: e.target.checked }); U.$("m-drone").disabled = !e.target.checked; if (K.Sound) K.Sound.refresh(); });
        U.$("m-drone").addEventListener("change", (e) => { K.prefs({ drone: e.target.checked, music: e.target.checked }); if (K.Sound) K.Sound.refresh(); });
        U.$("m-vol").addEventListener("input", (e) => { K.prefs({ musicVol: e.target.value / 100 }); if (K.Sound) K.Sound.refresh(); });
        U.$("m-big").addEventListener("change", (e) => { K.prefs({ bigText: e.target.checked }); document.body.classList.toggle("big-text", e.target.checked); });
        U.$("m-copy").addEventListener("click", async () => {
          const ta = U.$("m-code");
          try { await navigator.clipboard.writeText(ta.value); U.$("m-copy").textContent = K.tr("Copied"); }
          catch (e) { ta.focus(); ta.select(); U.$("m-copy").textContent = K.tr("Selected. Copy it now"); }
        });
        U.$("m-gloss").addEventListener("click", U.openGlossary);
        U.$("m-title").addEventListener("click", () => { U.closeModal(); U.renderTitle(); });
      });
  };
})(window.K = window.K || {});
