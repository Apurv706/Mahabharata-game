/* Character sheet, journal, menu (saves, settings, glossary) and loading a save code. */
(function (K) {
  "use strict";
  const U = K.UI;
  const row = (k, v) => '<div class="stat"><span>' + U.esc(k) + "</span><span>" + U.esc(v) + "</span></div>";

  U.openCharacter = function () {
    const S = K.S;
    const life = [
      ["Name", S.name], ["Age", S.age], ["Homeland", K.ORIGINS[S.origin]?.name || "—"],
      ["Path", K.PATHS[S.path]?.name || "Not chosen yet"], ["Teacher", K.TEACHERS[S.teacher]?.name || "None yet"],
      ["Court", K.COURTS[S.court]?.name || "None"], ["Side in the war", S.side ? (S.side === "pandava" ? "The Pandavas" : S.side === "kaurava" ? "The Kuru throne" : "Neither") : "Not chosen"],
      ["Spouse", S.spouse ? K.personName("spouse") + (K.isDead(S.spouse) ? " (died)" : "") : "None"],
      ["Child", S.child ? K.personName(S.child) + (K.isDead(S.child) ? " (died)" : "") : "None"]
    ].map(([k, v]) => row(k, v)).join("");
    const attrs = Object.entries(K.ATTRS).map(([k, n]) => {
      const base = S.attrs[k], now = K.attr(k);
      return row(n, now + (now !== base ? " (base " + base + ")" : ""));
    }).join("");
    const skills = Object.entries(K.SKILLS).map(([k, n]) => row(n, S.skills[k] + " / 6")).join("");
    const rep = Object.entries(K.FACTIONS).map(([k, n]) => row(n, S.rep[k] + " / 10")).join("");
    const extras = []
      .concat(S.boons.map((b) => "<p><b>" + U.esc(K.BOONS[b].name) + ".</b> " + U.esc(K.BOONS[b].text) + "</p>"))
      .concat(S.curses.map((c) => '<p class="curse"><b>' + U.esc(K.CURSES[c.id].name) + ".</b> " + U.esc(c.fired ? "It has struck." : K.CURSES[c.id].text) + "</p>"))
      .concat(S.injuries.map((i) => "<p><b>" + U.esc(K.INJURIES[i].name) + ".</b> " + U.esc(K.INJURIES[i].text) + "</p>"));
    U.openModal("Character", '<div class="grid2"><div><span class="lbl">Life</span>' + life + "</div><div><span class=\"lbl\">Attributes (age changes these)</span>" + attrs +
      '</div><div><span class="lbl">Skills</span>' + skills + "</div><div><span class=\"lbl\">Standing</span>" + rep +
      row("Healing herbs", S.items.herbs || 0) + "</div></div>" + (extras.length ? '<span class="lbl">Boons, curses and wounds</span>' + extras.join("") : ""));
  };

  U.openJournal = function () {
    const S = K.S;
    const items = S.journal.map((j) => "<li><span>Age " + j.age + "</span><div>" + U.esc(j.text) + "</div></li>").join("");
    U.openModal("Journal", items ? '<ol class="journal">' + items + "</ol>" : '<p class="empty">Nothing written yet.</p>');
  };

  U.openGlossary = function () {
    const d = Object.entries(K.GLOSSARY).sort((a, b) => a[0].localeCompare(b[0]))
      .map(([t, x]) => "<dt>" + U.esc(t) + "</dt><dd>" + U.esc(x) + "</dd>").join("");
    U.openModal("Glossary", '<dl class="gloss">' + d + "</dl>");
  };

  U.openLoad = function () {
    U.openModal("Load a save code", '<p class="note">Paste a save code from this game, on any device.</p><label class="lbl" for="code-in">Save code</label><textarea id="code-in" spellcheck="false"></textarea>' +
      '<div class="btnrow"><button class="cta" id="code-load" type="button">Load this life</button></div><p class="err" id="code-err"></p>', () => {
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
      '<div class="grid2"><div class="field"><span class="lbl">Saving</span>' +
      '<p class="note">The game saves itself at every new scene, in this browser only.</p>' +
      '<div class="btnrow"><button class="cta secondary" id="m-save" type="button">Save a copy</button>' +
      (manual ? '<button class="ghost" id="m-load" type="button">Load copy (' + U.esc(manual.name) + ", age " + manual.age + ")</button>" : "") + "</div>" +
      '<p class="note" id="m-saved"></p></div>' +
      '<div class="field"><span class="lbl">Settings</span>' +
      '<label class="toggle"><input type="checkbox" id="m-story"' + (S.storyMode ? " checked" : "") + "><span>Story mode<small>You cannot die in battle.</small></span></label>" +
      '<label class="toggle"><input type="checkbox" id="m-big"' + (prefs.bigText ? " checked" : "") + "><span>Larger text</span></label></div></div>" +
      '<div class="field"><span class="lbl">Move this life to another device</span><p class="note">Copy this code and paste it into "Load a save code" on another device.</p>' +
      '<textarea id="m-code" readonly spellcheck="false">' + U.esc(K.exportCode()) + '</textarea><div class="btnrow"><button class="ghost" id="m-copy" type="button">Copy code</button></div></div>' +
      '<div class="btnrow"><button class="ghost" id="m-gloss" type="button">Glossary</button><button class="ghost" id="m-title" type="button">Return to title</button></div>',
      () => {
        U.$("m-save").addEventListener("click", () => { U.$("m-saved").textContent = K.save("manual") ? "Saved." : "This browser is not allowing saves. Use the save code instead."; });
        if (manual) U.$("m-load").addEventListener("click", () => { U.closeModal(); K.S = manual; K.go(manual.scene); });
        U.$("m-story").addEventListener("change", (e) => { K.S.storyMode = e.target.checked; K.save("auto"); });
        U.$("m-big").addEventListener("change", (e) => { K.prefs({ bigText: e.target.checked }); document.body.classList.toggle("big-text", e.target.checked); });
        U.$("m-copy").addEventListener("click", async () => {
          const ta = U.$("m-code");
          try { await navigator.clipboard.writeText(ta.value); U.$("m-copy").textContent = "Copied"; }
          catch (e) { ta.focus(); ta.select(); U.$("m-copy").textContent = "Selected. Copy it now"; }
        });
        U.$("m-gloss").addEventListener("click", U.openGlossary);
        U.$("m-title").addEventListener("click", () => { U.closeModal(); U.renderTitle(); });
      });
  };
})(window.K = window.K || {});
