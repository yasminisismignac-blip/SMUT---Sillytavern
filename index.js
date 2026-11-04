import { sfxDirective } from './sfx.js';
import { CATEGORIES, PHASES, INTENSITY, WILD, DEFAULT_BANNED, DEFAULT_KEYWORDS, DEFAULT_LIMITS } from './data.js';

const MODULE = 'smut_forge';
const KEY_BASE = 'smut_forge_base';
const KEY_CARD = 'smut_forge_card';
const POS_IN_CHAT = 1;   // extension_prompt_types.IN_CHAT
const ROLE_SYSTEM = 0;   // extension_prompt_roles.SYSTEM

const ctx = () => SillyTavern.getContext();

const DEFAULTS = Object.freeze({
    enabled: true,
    mode: 'auto',            // manual | auto | always
    sceneActive: false,
    intensity: 'explicit',   // chave de INTENSITY
    phase: 'none',
    language: 'português brasileiro, tom informal',
    baseDepth: 2,
    cardDepth: 0,
    scanDepth: 4,
    autoRollEvery: 0,
    autoKind: 'card',        // card | wild
    wildCount: 3,            // quantas cartas o Infinito cruza (2–5)
    favorites: '',
    limits: DEFAULT_LIMITS,
    banned: DEFAULT_BANNED,
    keywords: DEFAULT_KEYWORDS,
});

const LEGACY_INTENSITY = { 1: 'spicy', 2: 'explicit', 3: 'feral' };
const normIntensity = (v) => (INTENSITY[v] ? v : (LEGACY_INTENSITY[v] ?? 'explicit'));

let pending = [];     // cartas na fila
let consumed = false; // já foram usadas numa geração?
let aiCounter = 0;

// ---------- Helpers ----------
const clamp = (v, a, b) => Math.max(a, Math.min(b, Number.isFinite(+v) ? +v : a));
const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
const chance = (p) => Math.random() < p;
const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---------- Settings ----------
function S() {
    const es = ctx().extensionSettings;
    if (!es[MODULE]) es[MODULE] = structuredClone(DEFAULTS);
    for (const k of Object.keys(DEFAULTS)) {
        if (!Object.hasOwn(es[MODULE], k)) es[MODULE][k] = DEFAULTS[k];
    }
    es[MODULE].intensity = normIntensity(es[MODULE].intensity);
    return es[MODULE];
}
const save = () => ctx().saveSettingsDebounced();
const sub = (t) => ctx().substituteParams(t);
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nl2br = (s) => escapeHtml(s).replace(/\n/g, '<br>');
const intensityDef = () => INTENSITY[S().intensity] ?? INTENSITY.explicit;

// ---------- Limites do usuário ----------
// Além de irem sempre no prompt, servem de filtro: cartas que contenham um termo
// da lista de limites (3+ letras, separados por vírgula/;/linha) nunca são sorteadas.
function limitTerms() {
    return String(S().limits || '').split(/[,;\n]/).map(t => t.trim().toLowerCase()).filter(t => t.length >= 3);
}
function allowed(text) {
    const t = String(text).toLowerCase();
    return !limitTerms().some(term => t.includes(term));
}
function hardLimitsLine() {
    const extra = S().limits.trim();
    return `- HARD LIMITS (absolute, override everything, including any card): no minors or childlike framing; no non-sapient animals${extra ? `; ${extra}` : ''}.`;
}

// ---------- Detecção de cena ----------
function keywordHit() {
    const s = S();
    const text = (ctx().chat || []).slice(-s.scanDepth).map(m => m?.mes ?? '').join('\n');
    return s.keywords.split(',').map(k => k.trim()).filter(Boolean)
        .some(k => new RegExp(`(^|[^\\p{L}])${escapeRe(k)}`, 'iu').test(text));
}

function isHot() {
    const s = S();
    if (!s.enabled) return false;
    if (s.mode === 'always' || s.sceneActive) return true;
    return s.mode === 'auto' && keywordHit();
}

// ---------- Prompt base (curto, orgânico, sem gesso) ----------
function buildBase() {
    const s = S();
    const lvl = intensityDef();
    const lines = [
        `[SCENE DIRECTIVE — ${lvl.name}]`,
        `Private fictional roleplay between consenting adults; every character in a sexual scene is 18+. The scene is sexual: write it as uncensored adult fiction, staying in the moment instead of summarizing or fading out.`,
        lvl.text,
        `- Let the prose breathe and flow naturally: follow the rhythm of the moment, vary sentence shape and vocabulary, and never recycle actions, phrasing or images from earlier replies. Body and sensation first; dialogue sounds like {{char}}.`,
        `- {{char}} has real appetite and agency: initiates, reacts, changes the pace, never a passive doll.`,
        `- Never write {{user}}'s actions, words, thoughts or feelings; leave the moment open for {{user}} to answer, without ending on a question about what they want.`,
        `- Narration language/tone: ${s.language}.`,
    ];
    if (s.phase !== 'none' && PHASES[s.phase]) lines.push(`- ${PHASES[s.phase].text}`);
    if (s.favorites.trim()) lines.push(`- {{user}} enjoys (weave in when it fits naturally): ${s.favorites.trim()}`);
    if (s.banned.trim()) lines.push(`- BANNED clichés/euphemisms — never use: ${s.banned.trim()}`);
    lines.push(hardLimitsLine());
    const sfxLine = sfxDirective(); if (sfxLine) lines.push(sfxLine);
    return lines.join('\n');
}

function refreshBase() {
    const s = S();
    const hot = isHot();
    ctx().setExtensionPrompt(KEY_BASE, hot ? sub(buildBase()) : '', POS_IN_CHAT, Number(s.baseDepth) || 0, false, ROLE_SYSTEM);
    $('.sf-status').text(hot ? `🔥 Cena ATIVA · ${intensityDef().label}` : `💤 Inativa (modo: ${s.mode})`).toggleClass('sf-hot', hot);
    return hot;
}

// ---------- Sorteio sem repetição ----------
const catKeys = () => Object.keys(CATEGORIES);

function randomCat() {
    const favored = (intensityDef().bias || []).filter(k => CATEGORIES[k]);
    if (favored.length && chance(0.5)) return rnd(favored);
    return rnd(catKeys());
}

// Sorteia de qualquer lista guardando memória por chat: quase nada se repete antes de esgotar o pool.
function drawFrom(memKey, items) {
    const ok = items.map((_, i) => i).filter(i => allowed(items[i]));
    if (!ok.length) return null;
    const meta = ctx().chatMetadata;
    meta[MODULE] ??= {};
    meta[MODULE].recent ??= {};
    const recent = meta[MODULE].recent[memKey] ?? [];
    let pool = ok.filter(i => !recent.includes(i));
    if (!pool.length) pool = ok;
    const pick = rnd(pool);
    const memory = Math.max(0, Math.min(ok.length - 1, Math.floor(ok.length * 0.8)));
    meta[MODULE].recent[memKey] = memory > 0 ? [...recent, pick].slice(-memory) : [];
    ctx().saveMetadataDebounced?.();
    return items[pick];
}

function draw(catKey) {
    const cat = CATEGORIES[catKey];
    if (!cat) return null;
    const text = drawFrom(`cat:${catKey}`, cat.items);
    return text ? { label: cat.label, text } : null;
}

const wildPick = (pool) => (WILD[pool] ? drawFrom(`wild:${pool}`, WILD[pool]) : null);

// ---------- Gerar o Infinito ----------
function buildWildcard(count) {
    const s = S();
    const n = clamp(count || s.wildCount || 3, 2, 5);

    // 1ª carta puxada pela intensidade atual; o resto é puro acaso entre categorias diferentes.
    const favored = (intensityDef().bias || []).filter(k => CATEGORIES[k]);
    const keys = [];
    if (favored.length && chance(0.6)) keys.push(rnd(favored));
    for (const k of shuffle(catKeys())) { if (keys.length >= n) break; if (!keys.includes(k)) keys.push(k); }

    const cards = keys.map(draw).filter(Boolean);
    if (!cards.length) return null;

    // Tom surpresa: metade das vezes mantém a intensidade escolhida, metade joga outra.
    const toneKey = chance(0.5) ? s.intensity : rnd(Object.keys(INTENSITY));
    const tone = INTENSITY[toneKey];
    const phaseKey = rnd(Object.keys(PHASES));
    const phaseText = PHASES[phaseKey].text.replace(/^PHASE\s*—\s*/, '');

    const mods = [
        ['Rhythm', wildPick('tempo')],
        ['Lens', wildPick('lente')],
        ['Twist', wildPick('reviravolta')],
        chance(0.55) ? ['Rule of the moment', wildPick('restricao')] : null,
        chance(0.5) ? ['Undercurrent', wildPick('alma')] : null,
    ].filter(m => m && m[1]);

    const lines = [
        `WILD CARD — fuse everything below into ONE coherent, surprising beat. Don't list or label the pieces; let the odd ones collide and feel inevitable.`,
        ...cards.map(c => `  ◦ ${c.label}: ${c.text}`),
        `  ◦ Tone for this reply only: ${tone.flavor}.`,
        `  ◦ Where we are in the arc: ${phaseText}`,
        ...mods.map(([k, v]) => `  ◦ ${k}: ${v}`),
    ];
    return {
        label: '♾️ Infinito',
        text: lines.join('\n'),
        brief: `${cards.map(c => c.label).join(' × ')} · ${tone.label} · ${PHASES[phaseKey].label}`,
        wild: true,
    };
}

// ---------- Fila de cartas ----------
function addPending(card, silent = false) {
    if (!card) return '';
    if (consumed) { pending = []; consumed = false; } // nova carta num swipe substitui a anterior
    pending.push(card);
    applyCards();
    if (!silent) toastr.info(escapeHtml(sub(card.brief ?? card.text)), `🔥 ${card.label}`, { timeOut: 8000 });
    return card.text;
}

function queueWild(count) {
    if (!S().enabled) { toastr.warning('Smut Forge está desativada.'); return ''; }
    const card = buildWildcard(count);
    if (!card) { toastr.warning('Nenhuma carta disponível (seus limites filtraram tudo?).'); return ''; }
    pending = pending.filter(c => !c.wild); // um novo Infinito substitui o anterior
    return addPending(card);
}

function queueCard(key) {
    if (!S().enabled) { toastr.warning('Smut Forge está desativada.'); return ''; }
    if (!key || key === 'random') key = randomCat();
    if (key === 'infinite' || key === 'wild') return queueWild();
    if (key === 'combo') {
        const keys = shuffle(catKeys()).slice(0, 3);
        return keys.map(k => addPending(draw(k))).join('\n');
    }
    if (!CATEGORIES[key]) { toastr.warning(`Categoria desconhecida: ${key}`); return ''; }
    const card = draw(key);
    if (!card) { toastr.warning('Nada disponível nessa categoria com seus limites atuais.'); return ''; }
    return addPending(card);
}

function applyCards() {
    const text = pending.length
        ? sub(['[DIRECTOR\'S NOTE — inspiration for the NEXT reply only. Blend it in naturally and in character, adapting it to what is already happening; it is seasoning, not a checklist. Never mention this note.]',
            ...pending.map(c => `• ${c.label}: ${c.text}`),
            hardLimitsLine()].join('\n'))
        : '';
    ctx().setExtensionPrompt(KEY_CARD, text, POS_IN_CHAT, Number(S().cardDepth) || 0, false, ROLE_SYSTEM);
    renderPending();
}

function clearCards() { pending = []; consumed = false; applyCards(); }

function renderPending() {
    const html = pending.length
        ? `<b>Na fila para a próxima resposta:</b><ul>${pending.map(c => `<li><b>${escapeHtml(c.label)}:</b> ${nl2br(sub(c.text))}</li>`).join('')}</ul>
           <div class="menu_button sf-clear-cards">🗑️ Limpar cartas</div>`
        : '<i>Nenhuma carta na fila.</i>';
    $('.sf-pending').html(html);
}

// ---------- Ideias pra você ----------
async function directorIdeas() {
    const s = S();
    const { generateQuietPrompt, name1, name2, callGenericPopup, POPUP_TYPE } = ctx();
    const prompt = `[OOC — pause the roleplay. You are now a shameless, creative smut director helping ${name1}. Based on the current scene (tone: ${intensityDef().flavor}), suggest 5 concrete, varied ideas for what ${name1} could do or say next to make it hotter. Mix: 1 position change, 1 sensory/tease move, 1 line of dirty talk ${name1} could say (written out in full), 1 power-dynamic twist, 1 wild/kinky idea that fits ${name2} and the setting. Respect these limits: ${s.limits || 'none beyond the hard limits'}. No minors, ever. Format: numbered list, **bold title** + 1–2 lines each. Write in ${s.language}. Output only the list.]`;
    toastr.info('O diretor está pensando…', '💡 Smut Forge');
    try {
        const res = await generateQuietPrompt({ quietPrompt: prompt });
        const { showdown, DOMPurify } = SillyTavern.libs;
        const html = DOMPurify.sanitize(new showdown.Converter().makeHtml(res || '*(sem resposta)*'));
        await callGenericPopup(`<div class="sf-ideas-out"><h3>💡 Ideias pra você</h3>${html}</div>`, POPUP_TYPE.TEXT, '', { allowVerticalScrolling: true });
    } catch (e) {
        console.error('[SmutForge]', e);
        toastr.error('Falha ao gerar ideias. Veja o console.');
    }
}

async function customCard() {
    const txt = await ctx().Popup.show.input('✍️ Instrução livre', 'O que você quer que aconteça na próxima resposta?', '');
    if (txt && String(txt).trim()) addPending({ label: 'Livre', text: String(txt).trim() });
}

// ---------- UI ----------
const intensityOptions = () => Object.entries(INTENSITY)
    .map(([k, v]) => `<option value="${k}">${v.emoji} ${escapeHtml(v.label)}</option>`).join('');

function panelHtml() {
    const phaseOpts = [`<option value="none">— Sem fase —</option>`,
        ...Object.entries(PHASES).map(([k, p]) => `<option value="${k}">${p.label}</option>`)].join('');
    const btns = Object.entries(CATEGORIES)
        .map(([k, c]) => `<div class="menu_button" data-sf-card="${k}">${c.emoji} ${c.label}</div>`).join('');
    return `
    <div class="sf-panel">
      <div class="sf-statusbar">
        <span class="sf-status"></span>
        <div class="menu_button sf-toggle-scene">🔥 Cena ON/OFF</div>
      </div>
      <div class="menu_button sf-infinite" data-sf-card="infinite">♾️ Gerar o Infinito</div>
      <div class="sf-row">
        <div><label>Intensidade</label><select class="text_pole sf-intensity">${intensityOptions()}</select></div>
        <div><label>Fase da cena</label><select class="text_pole sf-phase">${phaseOpts}</select></div>
      </div>
      <div class="sf-grid">${btns}</div>
      <div class="sf-grid">
        <div class="menu_button" data-sf-card="random">🎲 Roleta</div>
        <div class="menu_button" data-sf-card="combo">🃏 Combo x3</div>
        <div class="menu_button sf-custom">✍️ Instrução livre</div>
        <div class="menu_button sf-ideas">💡 Ideias pra MIM</div>
      </div>
      <div class="sf-pending"></div>
    </div>`;
}

function syncPanel() {
    $('.sf-phase').val(S().phase);
    $('.sf-intensity, #sf_intensity').val(S().intensity);
    refreshBase();
    renderPending();
}

function settingsHtml() {
    return `
    <div id="smutforge_settings">
      <div class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header">
          <b>🔥 Smut Forge</b>
          <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="inline-drawer-content">
          ${panelHtml()}
          <hr>
          <label class="checkbox_label"><input type="checkbox" id="sf_enabled"><span>Ativar extensão</span></label>
          <label for="sf_mode">Quando ligar o modo explícito</label>
          <select id="sf_mode" class="text_pole">
            <option value="manual">Manual (botão Cena ON/OFF)</option>
            <option value="auto">Automático (palavras-chave + botão)</option>
            <option value="always">Sempre ligado</option>
          </select>
          <label for="sf_intensity">Intensidade</label>
          <select id="sf_intensity" class="text_pole">${intensityOptions()}</select>
          <label for="sf_language">Idioma / tom da narração</label>
          <input id="sf_language" class="text_pole" type="text">
          <div class="sf-row">
            <div><label for="sf_baseDepth">Profundidade das regras</label><input id="sf_baseDepth" class="text_pole" type="number" min="0" max="20"></div>
            <div><label for="sf_cardDepth">Profundidade das cartas</label><input id="sf_cardDepth" class="text_pole" type="number" min="0" max="10"></div>
          </div>
          <div class="sf-row">
            <div><label for="sf_scanDepth">Msgs analisadas (auto)</label><input id="sf_scanDepth" class="text_pole" type="number" min="1" max="20"></div>
            <div><label for="sf_autoRollEvery">Carta automática a cada N respostas (0 = off)</label><input id="sf_autoRollEvery" class="text_pole" type="number" min="0" max="20"></div>
          </div>
          <div class="sf-row">
            <div>
              <label for="sf_autoKind">A carta automática é…</label>
              <select id="sf_autoKind" class="text_pole">
                <option value="card">Uma carta comum</option>
                <option value="wild">♾️ Um Infinito</option>
              </select>
            </div>
            <div><label for="sf_wildCount">Cartas cruzadas no Infinito (2–5)</label><input id="sf_wildCount" class="text_pole" type="number" min="2" max="5"></div>
          </div>
          <label for="sf_favorites">Meus kinks favoritos (o modelo usa quando encaixar)</label>
          <textarea id="sf_favorites" class="text_pole" rows="2" placeholder="ex: puxão de cabelo, elogios, espelho, marcas de mordida"></textarea>
          <label for="sf_limits">Meus limites (NUNCA incluir — também filtram as cartas sorteadas, em inglês ou nos termos que aparecem nelas)</label>
          <textarea id="sf_limits" class="text_pole" rows="2"></textarea>
          <label for="sf_banned">Clichês / eufemismos proibidos</label>
          <textarea id="sf_banned" class="text_pole" rows="3"></textarea>
          <label for="sf_keywords">Palavras-chave do modo automático (vírgula; casam no início da palavra)</label>
          <textarea id="sf_keywords" class="text_pole" rows="3"></textarea>
          <div class="menu_button" id="sf_preview">👁️ Ver o que está sendo injetado</div>
        </div>
      </div>
    </div>`;
}

function bindSetting(id, key, parse = v => v) {
    const $el = $(`#${id}`);
    const isCb = $el.is(':checkbox');
    isCb ? $el.prop('checked', !!S()[key]) : $el.val(S()[key]);
    $el.on('input change', () => {
        S()[key] = isCb ? $el.prop('checked') : parse($el.val());
        save();
        if (key === 'intensity') $('.sf-intensity').val(S().intensity);
        refreshBase();
        applyCards();
    });
}

function bindGlobalHandlers() {
    $(document)
        .on('click', '[data-sf-card]', function () { queueCard(this.dataset.sfCard); })
        .on('click', '.sf-clear-cards', clearCards)
        .on('click', '.sf-custom', customCard)
        .on('click', '.sf-ideas', directorIdeas)
        .on('click', '.sf-toggle-scene', () => {
            S().sceneActive = !S().sceneActive; save();
            toastr.info(S().sceneActive ? 'Cena forçada: ON 🔥' : 'Cena forçada: OFF');
            refreshBase();
        })
        .on('change', '.sf-phase', function () {
            S().phase = this.value; save();
            $('.sf-phase').val(this.value);
            refreshBase();
        })
        .on('change', '.sf-intensity', function () {
            S().intensity = normIntensity(this.value); save();
            $('.sf-intensity, #sf_intensity').val(S().intensity);
            refreshBase();
        });
}

function openPanelPopup() {
    const { callGenericPopup, POPUP_TYPE } = ctx();
    callGenericPopup(panelHtml(), POPUP_TYPE.DISPLAY, '', { allowVerticalScrolling: true });
    setTimeout(syncPanel, 50);
}

async function showPreview() {
    const { callGenericPopup, POPUP_TYPE } = ctx();
    const base = isHot() ? sub(buildBase()) : '(regras inativas no momento — cena não detectada)';
    const cards = pending.length ? pending.map(c => `• ${c.label}: ${sub(c.text)}`).join('\n') : '(nenhuma)';
    await callGenericPopup(`<h3>Regras</h3><pre class="sf-pre">${escapeHtml(base)}</pre><h3>Cartas</h3><pre class="sf-pre">${escapeHtml(cards)}</pre>`,
        POPUP_TYPE.TEXT, '', { wide: true, allowVerticalScrolling: true });
}

// ---------- Slash commands ----------
function registerCommands() {
    const { SlashCommandParser, SlashCommand, SlashCommandArgument, ARGUMENT_TYPE } = ctx();
    if (!SlashCommandParser) return;
    const arg = (description, enumList) => [SlashCommandArgument.fromProps({
        description, typeList: [ARGUMENT_TYPE.STRING], isRequired: false, enumList,
    })];

    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'smut-card',
        callback: (_a, v) => queueCard(String(v || 'random').trim()),
        unnamedArgumentList: arg('categoria', [...catKeys(), 'random', 'combo', 'infinite']),
        helpString: 'Coloca uma carta criativa na fila para a próxima resposta. Ex: <code>/smut-card posicao</code>',
    }));
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'smut-infinite',
        aliases: ['smut-wild', 'smut-infinito'],
        callback: (_a, v) => queueWild(parseInt(String(v || '').trim(), 10) || undefined),
        unnamedArgumentList: arg('quantas cartas cruzar (2–5, opcional)'),
        helpString: 'Gera o Infinito: cruza várias categorias, um tom, uma fase e reviravoltas aleatórias numa única carta curinga. Ex: <code>/smut-infinite 4</code>',
    }));
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'smut-intensity',
        callback: (_a, v) => {
            const key = String(v || '').trim().toLowerCase();
            if (!INTENSITY[key]) { toastr.warning(`Intensidade desconhecida: ${key || '(vazio)'}`); return S().intensity; }
            S().intensity = key; save(); syncPanel();
            return key;
        },
        unnamedArgumentList: arg('intensidade', Object.keys(INTENSITY)),
        helpString: `Muda a intensidade. Opções: <code>${Object.keys(INTENSITY).join(', ')}</code>`,
    }));
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'smut-scene',
        callback: (_a, v) => {
            const val = String(v || 'toggle').trim();
            S().sceneActive = val === 'toggle' ? !S().sceneActive : val === 'on';
            save(); refreshBase();
            return String(S().sceneActive);
        },
        unnamedArgumentList: arg('on | off | toggle', ['on', 'off', 'toggle']),
        helpString: 'Força a cena explícita ON/OFF.',
    }));
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'smut-phase',
        callback: (_a, v) => {
            const key = String(v || 'none').trim();
            S().phase = (key === 'none' || PHASES[key]) ? key : 'none';
            save(); syncPanel(); return S().phase;
        },
        unnamedArgumentList: arg('fase', ['none', ...Object.keys(PHASES)]),
        helpString: 'Define a fase da cena.',
    }));
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'smut-idea', callback: async () => { await directorIdeas(); return ''; },
        helpString: 'Gera ideias para VOCÊ continuar a cena.',
    }));
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'smut-clear', callback: () => { clearCards(); return ''; },
        helpString: 'Limpa as cartas na fila.',
    }));
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'smut-panel', callback: () => { openPanelPopup(); return ''; },
        helpString: 'Abre o painel do Smut Forge.',
    }));
}

// ---------- Interceptor (roda antes de cada geração) ----------
globalThis.smutForgeInterceptor = async function (chat, contextSize, abort, type) {
    try {
        if (!S().enabled) {
            ctx().setExtensionPrompt(KEY_BASE, '', POS_IN_CHAT, 0);
            ctx().setExtensionPrompt(KEY_CARD, '', POS_IN_CHAT, 0);
            return;
        }
        refreshBase();
        applyCards();
        if (pending.length && type !== 'quiet') consumed = true;
    } catch (e) {
        console.error('[SmutForge] interceptor', e);
    }
};

// ---------- Init ----------
jQuery(async () => {
    try {
        $('#extensions_settings2').append(settingsHtml());
        bindSetting('sf_enabled', 'enabled');
        bindSetting('sf_mode', 'mode');
        bindSetting('sf_intensity', 'intensity', normIntensity);
        bindSetting('sf_language', 'language');
        bindSetting('sf_baseDepth', 'baseDepth', Number);
        bindSetting('sf_cardDepth', 'cardDepth', Number);
        bindSetting('sf_scanDepth', 'scanDepth', Number);
        bindSetting('sf_autoRollEvery', 'autoRollEvery', Number);
        bindSetting('sf_autoKind', 'autoKind');
        bindSetting('sf_wildCount', 'wildCount', v => clamp(v, 2, 5));
        bindSetting('sf_favorites', 'favorites');
        bindSetting('sf_limits', 'limits');
        bindSetting('sf_banned', 'banned');
        bindSetting('sf_keywords', 'keywords');
        $('#sf_preview').on('click', showPreview);

        // Item no menu da varinha mágica (🪄)
        $('#extensionsMenu').append(`
          <div id="sf_wand" class="list-group-item flex-container flexGap5 interactable" tabindex="0">
            <div class="fa-solid fa-fire extensionsMenuExtensionButton"></div>
            <span>Smut Forge</span>
          </div>`);
        $('#sf_wand').on('click', openPanelPopup);

        bindGlobalHandlers();
        registerCommands();

        const { eventSource, eventTypes } = ctx();
        eventSource.on(eventTypes.MESSAGE_SENT, () => { if (consumed) clearCards(); refreshBase(); });
        eventSource.on(eventTypes.MESSAGE_RECEIVED, (_id, type) => {
            refreshBase();
            const s = S();
            if (!s.enabled || !s.autoRollEvery || type === 'quiet' || !isHot()) return;
            if (++aiCounter % s.autoRollEvery === 0) {
                pending = []; consumed = false;
                if (s.autoKind === 'wild') queueWild(); else addPending(draw(randomCat()));
            }
        });
        eventSource.on(eventTypes.CHAT_CHANGED, () => {
            S().sceneActive = false; save();
            aiCounter = 0;
            clearCards();
            syncPanel();
        });

        syncPanel();
        console.log('[SmutForge] carregada 🔥');
    } catch (e) {
        console.error('[SmutForge] erro ao iniciar', e);
        toastr.error('Smut Forge: ' + (e?.message ?? e), 'Erro ao carregar', { timeOut: 0, extendedTimeOut: 0 });
    }
});
