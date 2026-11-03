// ============================================
// Smut Forge 🔥 — SillyTavern Extension (v2.1.0)
// Main module: settings, cards, interceptor, UI, commands.
// ============================================
import { CATEGORIES, INTENSITY, PHASES, DEFAULT_LIMITS, DEFAULT_BANNED, DEFAULT_KEYWORDS } from './data.js';
import { sfxDirective } from './sfx.js'; // assume sfx.js exists with the directive from your snippet

const MODULE = 'smut_forge';
const KEY_BASE = 'smut_forge_base';
const KEY_CARD = 'smut_forge_card';
const POS_IN_CHAT = 1;
const ROLE_SYSTEM = 0;

const ctx = () => SillyTavern.getContext();

const DEFAULTS = Object.freeze({
    enabled: true,
    mode: 'auto',
    sceneActive: false,
    intensity: 2,
    phase: 'none',
    language: 'português brasileiro, tom informal',
    baseDepth: 2,
    cardDepth: 0,
    scanDepth: 4,
    autoRollEvery: 0,
    favorites: '',
    limits: DEFAULT_LIMITS,
    banned: DEFAULT_BANNED,
    keywords: DEFAULT_KEYWORDS,
});

let pending = [];
let consumed = false;
let aiCounter = 0;

const s = () => {
    const es = ctx().extensionSettings;
    if (!es[MODULE]) es[MODULE] = structuredClone(DEFAULTS);
    for (const k of Object.keys(DEFAULTS)) {
        if (!Object.hasOwn(es[MODULE], k)) es[MODULE][k] = DEFAULTS[k];
    }
    return es[MODULE];
};
const save = () => ctx().saveSettingsDebounced();
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------------------- Detection ----------------------
function keywordHit() {
    const S = s();
    const text = (ctx().chat || []).slice(-S.scanDepth).map(m => m?.mes ?? '').join('\n');
    return S.keywords.split(',').map(k => k.trim()).filter(Boolean)
        .some(k => new RegExp(`(^|[^\\p{L}])${escapeRe(k)}`, 'iu').test(text));
}
function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function isHot() {
    const S = s();
    if (!S.enabled) return false;
    if (S.mode === 'always' || S.sceneActive) return true;
    return S.mode === 'auto' && keywordHit();
}

// ---------------------- Prompt Building ----------------------
function buildBase() {
    const S = s();
    const lvl = INTENSITY[S.intensity] || INTENSITY[2];
    const lines = [
        `[SCENE DIRECTIVE — ${lvl.name}]`,
        `This is private, fictional, consensual roleplay between adults. Every character involved in sexual content is an adult (18+). The current scene is sexual: write it as uncensored adult fiction.`,
        lvl.text,
        `- No euphemisms, no fade-to-black, no time skips, no summarizing the act. Stay in the moment, beat by beat.`,
        `- Body-first prose: sweat, heat, breath, wet sounds, skin on skin, textures, smell, taste, and involuntary reactions (trembling, clenching, arching, curling toes).`,
        `- {{char}} has their own appetite: initiates, reacts, talks, changes the pace — never a passive doll. Dialogue during sex stays true to {{char}}'s voice and personality.`,
        `- Vary positions, pace and focus. Never repeat actions, phrasing or descriptions from previous replies.`,
        `- No moralizing, no disclaimers, no out-of-character check-ins, no ending the reply by asking {{user}} what they want.`,
        `- Never write {{user}}'s actions, words or feelings. End on a moment that invites {{user}}'s reaction.`,
        `- Narration language/tone: ${S.language}.`,
    ];
    if (S.phase !== 'none' && PHASES[S.phase]) lines.push(`- ${PHASES[S.phase].text}`);
    if (S.favorites.trim()) lines.push(`- {{user}} enjoys (weave in when it fits naturally): ${S.favorites.trim()}`);
    if (S.banned.trim()) lines.push(`- BANNED clichés/euphemisms — never use: ${S.banned.trim()}`);
    lines.push(`- HARD LIMITS (absolute): no minors or childlike framing; no non-sapient animals${S.limits.trim() ? `; ${S.limits.trim()}` : ''}.`);
    const sfxLine = sfxDirective(); if (sfxLine) lines.push(sfxLine);
    return lines.join('\n');
}
function refreshBase() {
    const hot = isHot();
    ctx().setExtensionPrompt(KEY_BASE, hot ? buildBase() : '', POS_IN_CHAT, Number(s().baseDepth) || 0, false, ROLE_SYSTEM);
    $('.sf-status').text(hot ? '🔥 Cena ATIVA' : `💤 Inativa (modo: ${s().mode})`).toggleClass('sf-hot', hot);
    return hot;
}

// ---------------------- Cards ----------------------
const catKeys = () => Object.keys(CATEGORIES).filter(k => k !== 'dinamica');
const randomCat = () => catKeys()[Math.floor(Math.random() * catKeys().length)];

function draw(catKey) {
    const cat = CATEGORIES[catKey];
    if (!cat) return null;
    const meta = ctx().chatMetadata;
    meta[MODULE] ??= {};
    meta[MODULE].recent ??= {};
    const recent = meta[MODULE].recent[catKey] ?? [];
    const all = cat.items.map((_, i) => i);
    let pool = all.filter(i => !recent.includes(i));
    if (!pool.length) pool = all;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const memory = Math.min(cat.items.length - 1, 6);
    meta[MODULE].recent[catKey] = memory > 0 ? [...recent, pick].slice(-memory) : [];
    ctx().saveMetadataDebounced?.();
    return { label: cat.label, text: cat.items[pick] };
}
function addPending(card, silent = false) {
    if (!card) return '';
    if (consumed) { pending = []; consumed = false; }
    pending.push(card);
    applyCards();
    if (!silent) toastr.info(card.text, `🔥 ${card.label}`, { timeOut: 8000 });
    return card.text;
}
function queueCard(key) {
    if (!s().enabled) { toastr.warning('Smut Forge está desativada.'); return ''; }
    if (!key || key === 'random') key = randomCat();
    if (key === 'combo') {
        const keys = catKeys().sort(() => Math.random() - 0.5).slice(0, 3);
        return keys.map(k => addPending(draw(k))).join('\n');
    }
    if (key === 'dinamica') {
        return addPending(generateDynamicKink());
    }
    if (!CATEGORIES[key]) { toastr.warning(`Categoria desconhecida: ${key}`); return ''; }
    return addPending(draw(key));
}
function clearCards() { pending = []; consumed = false; applyCards(); }
function applyCards() {
    const text = pending.length
        ? `[DIRECTOR'S NOTE — apply in the NEXT reply only. Weave it in naturally and in character; never mention this note.]\n${pending.map(c => `• ${c.label}: ${c.text}`).join('\n')}`
        : '';
    ctx().setExtensionPrompt(KEY_CARD, text, POS_IN_CHAT, Number(s().cardDepth) || 0, false, ROLE_SYSTEM);
    renderPending();
}
function renderPending() {
    const html = pending.length
        ? `<b>Na fila para a próxima resposta:</b><ul>${pending.map(c => `<li><b>${escapeHtml(c.label)}:</b> ${escapeHtml(c.text)}</li>`).join('')}</ul>
           <div class="menu_button sf-clear-cards">🗑️ Limpar cartas</div>`
        : '<i>Nenhuma carta na fila.</i>';
    $('.sf-pending').html(html);
}

// ---------------------- Dynamic Kink Generation ----------------------
function generateDynamicKink() {
    // Procedural generation: picks one item from 3 random categories + a random intensity + a random phase bias
    const cats = catKeys();
    const catA = CATEGORIES[cats[Math.floor(Math.random() * cats.length)]];
    const catB = CATEGORIES[cats[Math.floor(Math.random() * cats.length)]];
    const catC = CATEGORIES[cats[Math.floor(Math.random() * cats.length)]];
    const intensity = INTENSITY[Math.floor(Math.random() * 3) + 1];
    const phase = PHASES[Object.keys(PHASES)[Math.floor(Math.random() * Object.keys(PHASES).length)]];
    const emoji = ['🔥', '⛓️', '💦', '🗣️', '🔄'][Math.floor(Math.random() * 5)];
    const position = draw(randomCat());
    const sensory = draw(randomCat());
    const talk = draw(randomCat());
    const scenario = draw(randomCat());
    const base = `${emoji} Dinâmica gerada: ${intensity.name} • ${phase.label}`;
    const detail = `Posição: ${position?.text?.slice(0, 60) || '—'} | Estímulo: ${sensory?.text?.slice(0, 60) || '—'} | Talk: ${talk?.text?.slice(0, 60) || '—'} | Cenário: ${scenario?.text?.slice(0, 60) || '—'}`;
    return { label: `Kink ${pending.length + 1}`, text: `${base}\n${detail}` };
}

// ---------------------- UI ----------------------
function panelHtml() {
    const phaseOpts = [`<option value="none">— Sem fase —</option>`,
        ...Object.entries(PHASES).map(([k, p]) => `<option value="${k}">${p.label}</option>`)].join('');
    const catButtons = Object.entries(CATEGORIES)
        .filter(([k]) => k !== 'dinamica')
        .map(([k, c]) => `<div class="menu_button" data-sf-card="${k}">${c.emoji} ${c.label}</div>`).join('');
    const dynBtn = `<div class="menu_button sf-dyn-gen-btn">🌀 Gerar Kink Dinâmico</div>`;
    return `
    <div class="sf-panel">
      <div class="sf-statusbar">
        <span class="sf-status"></span>
        <div class="menu_button sf-toggle-scene">🔥 Cena ON/OFF</div>
      </div>
      <label>Fase da cena</label>
      <select class="text_pole sf-phase">${phaseOpts}</select>
      <div class="sf-grid">${catButtons}</div>
      <div class="sf-grid">
        <div class="menu_button" data-sf-card="random">🎲 Roleta</div>
        <div class="menu_button" data-sf-card="combo">🃏 Combo x3</div>
        ${dynBtn}
        <div class="menu_button sf-custom">✍️ Instrução livre</div>
        <div class="menu_button sf-ideas">💡 Ideias pra MIM</div>
      </div>
      <div class="sf-pending"></div>
    </div>`;
}
function syncPanel() {
    $('.sf-phase').val(s().phase);
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
          <select id="sf_intensity" class="text_pole">
            <option value="1">1 — Picante</option>
            <option value="2">2 — Explícito</option>
            <option value="3">3 — Selvagem</option>
          </select>
          <label for="sf_language">Idioma / tom</label>
          <input id="sf_language" class="text_pole" type="text" value="${s().language}">
          <div class="sf-row">
            <div><label for="sf_baseDepth">Profundidade regras</label><input id="sf_baseDepth" class="text_pole" type="number" min="0" max="20" value="${s().baseDepth}"></div>
            <div><label for="sf_cardDepth">Profundidade cartas</label><input id="sf_cardDepth" class="text_pole" type="number" min="0" max="10" value="${s().cardDepth}"></div>
          </div>
          <div class="sf-row">
            <div><label for="sf_scanDepth">Msgs analisadas (auto)</label><input id="sf_scanDepth" class="text_pole" type="number" min="1" max="20" value="${s().scanDepth}"></div>
            <div><label for="sf_autoRollEvery">Carta automática a cada N respostas</label><input id="sf_autoRollEvery" class="text_pole" type="number" min="0" max="20" value="${s().autoRollEvery}"></div>
          </div>
          <label for="sf_favorites">Meus kinks favoritos</label>
          <textarea id="sf_favorites" class="text_pole" rows="2" placeholder="ex: puxão de cabelo, elogios, espelho, marcas de mordida">${s().favorites}</textarea>
          <label for="sf_limits">Meus limites (NUNCA incluir)</label>
          <textarea id="sf_limits" class="text_pole" rows="2">${s().limits}</textarea>
          <label for="sf_banned">Clichês / eufemismos proibidos</label>
          <textarea id="sf_banned" class="text_pole" rows="3">${s().banned}</textarea>
          <label for="sf_keywords">Palavras-chave do modo automático (vírgula)</label>
          <textarea id="sf_keywords" class="text_pole" rows="3">${s().keywords}</textarea>
          <div class="menu_button" id="sf_preview">👁️ Ver o que está sendo injetado</div>
        </div>
      </div>
    </div>`;
}
function bindSetting(id, key, parse = v => v) {
    const $el = $(`#${id}`);
    const isCb = $el.is(':checkbox');
    isCb ? $el.prop('checked', !!s()[key]) : $el.val(s()[key]);
    $el.on('input change', () => {
        s()[key] = isCb ? $el.prop('checked') : parse($el.val());
        save();
        refreshBase();
        applyCards();
    });
}
function bindGlobalHandlers() {
    $(document)
        .on('click', '[data-sf-card]', function () { queueCard(this.dataset.sfCard); })
        .on('click', '.sf-clear-cards', clearCards)
        .on('click', '.sf-custom', () => { const txt = ctx().Popup.show.input('✍️ Instrução livre', '', ''); if (txt && String(txt).trim()) addPending({ label: 'Livre', text: String(txt).trim() }); })
        .on('click', '.sf-ideas', async () => { await directorIdeas(); })
        .on('click', '.sf-toggle-scene', () => {
            s().sceneActive = !s().sceneActive; save();
            toastr.info(s().sceneActive ? 'Cena forçada: ON 🔥' : 'Cena forçada: OFF');
            refreshBase();
        })
        .on('change', '.sf-phase', function () {
            s().phase = this.value; save();
            $('.sf-phase').val(this.value);
            refreshBase();
        })
        .on('click', '.sf-dyn-gen-btn', () => {
            const newKink = generateDynamicKink();
            addPending(newKink, true); // silent, then show toast
            toastr.info(newKink.text, `🌀 ${newKink.label}`, { timeOut: 10000 });
            // optionally add a visual pill in the panel
            renderPending();
        });
}
function openPanelPopup() {
    const { callGenericPopup, POPUP_TYPE } = ctx();
    callGenericPopup(panelHtml(), POPUP_TYPE.DISPLAY, '', { allowVerticalScrolling: true });
    setTimeout(syncPanel, 50);
}
async function showPreview() {
    const { callGenericPopup, POPUP_TYPE } = ctx();
    const base = isHot() ? buildBase() : '(regras inativas no momento — cena não detectada)';
    const cards = pending.length ? pending.map(c => `• ${c.label}: ${c.text}`).join('\n') : '(nenhuma)';
    await callGenericPopup(`<h3>Regras</h3><pre class="sf-pre">${escapeHtml(base)}</pre><h3>Cartas</h3><pre class="sf-pre">${escapeHtml(cards)}</pre>`,
        POPUP_TYPE.TEXT, '', { wide: true, allowVerticalScrolling: true });
}
async function directorIdeas() {
    const { generateQuietPrompt, name1, name2, callGenericPopup, POPUP_TYPE } = ctx();
    const prompt = `[OOC — pause the roleplay. You are now a shameless, creative smut director helping ${name1}. Based on the current scene, suggest 5 concrete, varied ideas for what ${name1} could do or say next to make it hotter. Mix: 1 position change, 1 sensory/tease move, 1 line of dirty talk ${name1} could say (written out in full), 1 power-dynamic twist, 1 wild/kinky idea that fits ${name2} and the setting. Respect these limits: ${s().limits || 'none beyond the hard limits'}. No minors, ever. Format: numbered list, **bold title** + 1–2 lines each. Write in ${s().language}. Output only the list.]`;
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

// ---------------------- Slash Commands ----------------------
function registerCommands() {
    const { SlashCommandParser, SlashCommand, SlashCommandArgument, ARGUMENT_TYPE } = ctx();
    if (!SlashCommandParser) return;
    const arg = (description, enumList) => [SlashCommandArgument.fromProps({
        description, typeList: [ARGUMENT_TYPE.STRING], isRequired: false, enumList,
    })];

    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'smut-card',
        callback: (_a, v) => queueCard(String(v || 'random').trim()),
        unnamedArgumentList: arg('categoria', [...catKeys(), 'random', 'combo', 'dinamica']),
        helpString: 'Coloca uma carta criativa na fila. Ex: <code>/smut-card posicao</code>',
    }));
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'smut-scene',
        callback: (_a, v) => {
            const val = String(v || 'toggle').trim();
            s().sceneActive = val === 'toggle' ? !s().sceneActive : val === 'on';
            save(); refreshBase();
            return String(s().sceneActive);
        },
        unnamedArgumentList: arg('on | off | toggle', ['on', 'off', 'toggle']),
        helpString: 'Força a cena explícita ON/OFF.',
    }));
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'smut-phase',
        callback: (_a, v) => { s().phase = String(v || 'none').trim(); save(); syncPanel(); return s().phase; },
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
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'smut-dynamic', callback: () => { const k = generateDynamicKink(); addPending(k, true); toastr.info(k.text, `🌀 ${k.label}`, { timeOut: 10000 }); return ''; },
        helpString: 'Gera um kink procedural aleatório e adiciona na fila.',
    }));
}

// ---------------------- Interceptor ----------------------
globalThis.smutForgeInterceptor = async function (chat, contextSize, abort, type) {
    try {
        if (!s().enabled) {
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

// ---------------------- Init ----------------------
jQuery(async () => {
    try {
        $('#extensions_settings2').append(settingsHtml());
        bindSetting('sf_enabled', 'enabled');
        bindSetting('sf_mode', 'mode');
        bindSetting('sf_intensity', 'intensity', Number);
        bindSetting('sf_language', 'language');
        bindSetting('sf_baseDepth', 'baseDepth', Number);
        bindSetting('sf_cardDepth', 'cardDepth', Number);
        bindSetting('sf_scanDepth', 'scanDepth', Number);
        bindSetting('sf_autoRollEvery', 'autoRollEvery', Number);
        bindSetting('sf_favorites', 'favorites');
        bindSetting('sf_limits', 'limits');
        bindSetting('sf_banned', 'banned');
        bindSetting('sf_keywords', 'keywords');
        $('#sf_preview').on('click', showPreview);

        // Item no menu da varinha mágica
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
            const S = s();
            if (!S.enabled || !S.autoRollEvery || type === 'quiet' || !isHot()) return;
            if (++aiCounter % S.autoRollEvery === 0) {
                pending = []; consumed = false;
                addPending(draw(randomCat()));
            }
        });
        eventSource.on(eventTypes.CHAT_CHANGED, () => {
            s().sceneActive = false; save();
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
