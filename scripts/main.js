const MODULE_ID = "sw-mystic-psionics";
const FLAG_ROOT = "mystic";

const DEFAULTS = {
  enabled: false,
  psionicLevel: 1,
  psp: { current: 5, max: 5 },
  chakras: {
    root: true,
    sacral: false,
    plexus: false,
    heart: false,
    throat: false,
    thirdEye: false
  },
  known: {
    sciences: 1,
    devotions: 3,
    attackModes: 1,
    defenseModes: 0
  }
};

const PROGRESSION = {
  1:  {psp:5,   chakras:1, sciences:1,  devotions:3,  attackModes:1, defenseModes:0},
  2:  {psp:10,  chakras:1, sciences:1,  devotions:5,  attackModes:2, defenseModes:1},
  3:  {psp:15,  chakras:2, sciences:2,  devotions:7,  attackModes:2, defenseModes:1},
  4:  {psp:20,  chakras:2, sciences:2,  devotions:9,  attackModes:3, defenseModes:2},
  5:  {psp:25,  chakras:2, sciences:3,  devotions:10, attackModes:3, defenseModes:2},
  6:  {psp:30,  chakras:3, sciences:3,  devotions:11, attackModes:4, defenseModes:3},
  7:  {psp:35,  chakras:3, sciences:4,  devotions:12, attackModes:4, defenseModes:3},
  8:  {psp:40,  chakras:3, sciences:4,  devotions:13, attackModes:5, defenseModes:4},
  9:  {psp:45,  chakras:4, sciences:5,  devotions:14, attackModes:5, defenseModes:4},
  10: {psp:50,  chakras:4, sciences:5,  devotions:15, attackModes:5, defenseModes:5},
  11: {psp:55,  chakras:4, sciences:6,  devotions:16, attackModes:5, defenseModes:5},
  12: {psp:60,  chakras:5, sciences:6,  devotions:17, attackModes:5, defenseModes:5},
  13: {psp:65,  chakras:5, sciences:7,  devotions:18, attackModes:5, defenseModes:5},
  14: {psp:70,  chakras:6, sciences:7,  devotions:19, attackModes:5, defenseModes:5},
  15: {psp:75,  chakras:6, sciences:8,  devotions:20, attackModes:5, defenseModes:5},
  16: {psp:80,  chakras:6, sciences:8,  devotions:21, attackModes:5, defenseModes:5},
  17: {psp:85,  chakras:6, sciences:9,  devotions:22, attackModes:5, defenseModes:5},
  18: {psp:90,  chakras:6, sciences:9,  devotions:23, attackModes:5, defenseModes:5},
  19: {psp:95,  chakras:6, sciences:10, devotions:24, attackModes:5, defenseModes:5},
  20: {psp:100, chakras:6, sciences:10, devotions:25, attackModes:5, defenseModes:5}
};

const CHAKRA_ORDER = ["root", "sacral", "plexus", "heart", "throat", "thirdEye"];
const CHAKRA_LABELS = {
  root: "Root",
  sacral: "Sacral",
  plexus: "Plexus",
  heart: "Heart",
  throat: "Throat",
  thirdEye: "Third Eye"
};

function duplicateSafe(obj) {
  return foundry.utils.deepClone(obj);
}

function mergedMystic(actor) {
  const stored = actor.getFlag(MODULE_ID, FLAG_ROOT) ?? {};
  return foundry.utils.mergeObject(duplicateSafe(DEFAULTS), stored, {
    inplace: false,
    insertKeys: true,
    insertValues: true,
    overwrite: true
  });
}

async function saveMystic(actor, data) {
  return actor.setFlag(MODULE_ID, FLAG_ROOT, data);
}

function progressionFor(level) {
  level = Math.max(1, Number(level) || 1);
  if (level <= 20) return PROGRESSION[level];
  return {
    psp: 100 + ((level - 20) * 5),
    chakras: 6,
    sciences: 10 + Math.floor((level - 19) / 2),
    devotions: 25 + (level - 20),
    attackModes: 5,
    defenseModes: 5
  };
}

function applyProgression(data, level, preserveCurrentRatio = false) {
  const p = progressionFor(level);
  const oldMax = Math.max(1, Number(data.psp?.max) || 1);
  const oldCurrent = Math.max(0, Number(data.psp?.current) || 0);

  data.psionicLevel = Number(level);
  data.psp ??= {};
  data.psp.max = p.psp;

  if (preserveCurrentRatio) {
    data.psp.current = Math.min(p.psp, Math.round((oldCurrent / oldMax) * p.psp));
  } else {
    data.psp.current = Math.min(oldCurrent, p.psp);
  }

  data.known = {
    sciences: p.sciences,
    devotions: p.devotions,
    attackModes: p.attackModes,
    defenseModes: p.defenseModes
  };

  data.chakras ??= {};
  CHAKRA_ORDER.forEach((key, i) => data.chakras[key] = i < p.chakras);
  return data;
}

function getRoot(html) {
  if (!html) return null;
  if (html instanceof HTMLElement) return html;
  if (html[0] instanceof HTMLElement) return html[0];
  return null;
}

function findSpellsTab(root) {
  const selectors = [
    '.tab[data-tab="spells"]',
    '[data-tab="spells"].tab',
    'section[data-tab="spells"]',
    'div[data-tab="spells"]',
    '.spells.tab',
    '.tab.spells'
  ];

  for (const sel of selectors) {
    const el = root.querySelector(sel);
    if (el) return el;
  }

  const candidates = [...root.querySelectorAll('.tab, section, .sheet-body > div')];
  return candidates.find(el => /spell/i.test(el.getAttribute("data-tab") ?? "") || /spells/i.test(el.className ?? "")) ?? null;
}

function makePanel(actor, data) {
  const wrap = document.createElement("section");
  wrap.className = "swmp-panel";
  wrap.dataset.swmpActor = actor.id;

  const chakraBoxes = CHAKRA_ORDER.map(key => `
    <label class="swmp-chakra">
      <input type="checkbox" data-swmp-field="chakra.${key}" ${data.chakras?.[key] ? "checked" : ""}>
      <span>${CHAKRA_LABELS[key]}</span>
    </label>
  `).join("");

  wrap.innerHTML = `
    <header class="swmp-header">
      <div>
        <h3>Mystic Psionics</h3>
        <p>Psionic Strength, chakra access, and Mystic advancement.</p>
      </div>
      <label class="swmp-enable">
        <input type="checkbox" data-swmp-field="enabled" ${data.enabled ? "checked" : ""}>
        <span>Enable Mystic</span>
      </label>
    </header>

    <div class="swmp-body ${data.enabled ? "" : "swmp-disabled"}">
      <div class="swmp-grid swmp-summary">
        <label>
          <span>Psionic Level</span>
          <input type="number" min="1" max="99" data-swmp-field="psionicLevel" value="${data.psionicLevel ?? 1}">
        </label>

        <div class="swmp-psp">
          <span class="swmp-label">PSP</span>
          <div class="swmp-psp-row">
            <button type="button" data-swmp-action="spend" title="Spend 1 PSP">−</button>
            <input type="number" min="0" data-swmp-field="psp.current" value="${data.psp?.current ?? 0}">
            <span>/</span>
            <input type="number" min="0" data-swmp-field="psp.max" value="${data.psp?.max ?? 0}">
            <button type="button" data-swmp-action="recover" title="Recover 1 PSP">+</button>
          </div>
        </div>

        <button type="button" class="swmp-button" data-swmp-action="fullRecover">Full Recover</button>
        <button type="button" class="swmp-button" data-swmp-action="syncLevel">Sync From Level</button>
      </div>

      <div class="swmp-grid swmp-known">
        <label><span>Sciences</span><input type="number" min="0" data-swmp-field="known.sciences" value="${data.known?.sciences ?? 0}"></label>
        <label><span>Devotions</span><input type="number" min="0" data-swmp-field="known.devotions" value="${data.known?.devotions ?? 0}"></label>
        <label><span>Attack Modes</span><input type="number" min="0" max="5" data-swmp-field="known.attackModes" value="${data.known?.attackModes ?? 0}"></label>
        <label><span>Defense Modes</span><input type="number" min="0" max="5" data-swmp-field="known.defenseModes" value="${data.known?.defenseModes ?? 0}"></label>
      </div>

      <fieldset class="swmp-chakras">
        <legend>Chakras</legend>
        <div class="swmp-chakra-grid">
          ${chakraBoxes}
        </div>
      </fieldset>

      <div class="swmp-note">
        <strong>PSP Recovery:</strong> full PSP recovery normally requires 8 hours of rest followed by about 1 hour of undisturbed meditation.
      </div>
    </div>
  `;

  return wrap;
}

function setDeep(obj, path, value) {
  const parts = path.split(".");
  let cur = obj;
  while (parts.length > 1) {
    const p = parts.shift();
    cur[p] ??= {};
    cur = cur[p];
  }
  cur[parts[0]] = value;
}

function numericField(path) {
  return path !== "enabled" && !path.startsWith("chakra.");
}

async function wirePanel(panel, actor) {
  const saveField = async (input) => {
    const path = input.dataset.swmpField;
    if (!path) return;

    const data = mergedMystic(actor);
    let value;

    if (input.type === "checkbox") value = input.checked;
    else if (numericField(path)) value = Number(input.value || 0);
    else value = input.value;

    if (path.startsWith("chakra.")) {
      const key = path.split(".")[1];
      data.chakras[key] = !!value;
    } else {
      setDeep(data, path, value);
    }

    if (path === "enabled") {
      panel.querySelector(".swmp-body")?.classList.toggle("swmp-disabled", !value);
    }

    await saveMystic(actor, data);
  };

  panel.querySelectorAll("[data-swmp-field]").forEach(input => {
    input.addEventListener("change", () => saveField(input));
  });

  panel.querySelectorAll("[data-swmp-action]").forEach(button => {
    button.addEventListener("click", async () => {
      const action = button.dataset.swmpAction;
      const data = mergedMystic(actor);

      if (action === "spend") {
        data.psp.current = Math.max(0, Number(data.psp.current || 0) - 1);
      }

      if (action === "recover") {
        data.psp.current = Math.min(Number(data.psp.max || 0), Number(data.psp.current || 0) + 1);
      }

      if (action === "fullRecover") {
        data.psp.current = Number(data.psp.max || 0);
      }

      if (action === "syncLevel") {
        const levelInput = panel.querySelector('[data-swmp-field="psionicLevel"]');
        const level = Math.max(1, Number(levelInput?.value || data.psionicLevel || 1));
        applyProgression(data, level);
      }

      await saveMystic(actor, data);

      const current = panel.querySelector('[data-swmp-field="psp.current"]');
      const max = panel.querySelector('[data-swmp-field="psp.max"]');
      if (current) current.value = data.psp.current;
      if (max) max.value = data.psp.max;

      if (action === "syncLevel") {
        panel.replaceWith(makePanel(actor, data));
        const newPanel = document.querySelector(`[data-swmp-actor="${actor.id}"]`);
        if (newPanel) wirePanel(newPanel, actor);
      }
    });
  });
}

async function injectMysticPanel(app, html) {
  const actor = app?.actor ?? app?.document;
  if (!actor || actor.documentName !== "Actor" || actor.type !== "character") return;
  if (game.system.id !== "swords-wizardry") return;

  const root = getRoot(html);
  if (!root) return;
  if (root.querySelector(".swmp-panel")) return;

  const spells = findSpellsTab(root);
  if (!spells) {
    console.debug(`${MODULE_ID} | Could not locate Spells tab for`, actor.name);
    return;
  }

  const data = mergedMystic(actor);
  const panel = makePanel(actor, data);
  spells.prepend(panel);
  await wirePanel(panel, actor);
}

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initializing`);
});

Hooks.once("ready", () => {
  if (game.system.id !== "swords-wizardry") {
    ui.notifications.warn("S&W Mystic Psionics is intended for the Swords & Wizardry system.");
  }
});

Hooks.on("renderActorSheet", injectMysticPanel);

// Foundry v14 systems may render sheets through ApplicationV2.
// This hook is harmless if the system does not use it.
Hooks.on("renderActorSheetV2", injectMysticPanel);
