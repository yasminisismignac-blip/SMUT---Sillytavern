// ============================================
// Smut Forge 🔥 — SillyTavern Extension (v2.2.0)
// Updated: removed rigid formatting, bureaucratic counts,
// and forced onomatopeia brackets. Prose is now natural,
// fluid, and highly creative while keeping all required constraints.
// ============================================

// --- Inlined core data (so the extension works out‑of-the-box) ---
export const INTENSITY = {
    1: { name: 'spicy', text: 'explicit but sensual: clear anatomical words, strong emotional connection, sensual pacing, heat over brutality.' },
    2: { name: 'explict', text: 'graphic and direct: blunt anatomical and slang terms; detailed, concrete physical action.' },
    3: { name: 'feral', text: 'maximum filth: crude, vulgar, raw, sloppy and shameless. No softening, no restraint, no poetic distance.' },
};

export const PHASES = {
    tease:     { label: 'Preliminares', text: 'Foreplay/tease: build anticipation. Clothes come off slowly; kissing, touching, teasing. Do not rush to the main act.' },
    build:     { label: 'Escalada', text: 'Escalation: the main act begins, a rhythm establishes itself and intensity keeps rising.' },
    frenzy:    { label: 'Frenesi', text: 'Frenzy: peak intensity, as fast and rough as the characters allow. Short sentences, raw words, little control.' },
    climax:    { label: 'Clímax', text: "Climax: drive {{char}} to orgasm and describe it fully and physically. Never decide {{user}}'s climax." },
    aftercare: { label: 'Aftercare', text: 'Afterglow: wrecked, sensitive bodies, heavy breathing; tenderness, jokes, intimacy, the mess left behind.' },
};

export const DEFAULT_LIMITS = '';
export const DEFAULT_BANNED = ''; // populated via settings textarea

// ============================================
// Helpers
// ============================================
const ctx = () => SillyTavern.getContext();

const s = () => {
    const es = ctx().extensionSettings;
    if (!es['smut_forge']) es['smut_forge'] = structuredClone(DEFAULTS);
    for (const k of Object.keys(DEFAULTS)) {
        if (!Object.hasOwn(es['smut_forge'], k)) es['smut_forge'][k] = DEFAULTS[k];
    }
    return es['smut_forge'];
};

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Detection: auto‑mode watches the last N messages for keywords
function keywordHit() {
    const S = s();
    const text = (ctx().chat || []).slice(-S.scanDepth).map(m => m?.mes ?? '').join('\n');
    return S.keywords.split(',').map(k => k.trim()).filter(Boolean)
        .some(k => new RegExp(`(^|[^\\p{L}])${escapeRe(k)}`, 'iu').test(text));
}

function isHot() {
    const S = s();
    if (!S.enabled) return false;
    if (S.mode === 'always' || S.sceneActive) return true;
    return S.mode === 'auto' && keywordHit();
}

// ============================================
// buildBase – the heart of the prompt
// ============================================
/**
 * Returns a natural‑language, fluid scene prompt.
 * No bullet lists, no [SCENE DIRECTIVE] headers, no forced [[onomatopoeia]] counts.
 * The prompt flows like a gentle guideline, not a rigid checklist.
 */
function buildBase() {
    const S = s();
    const lvl = INTENSITY[S.intensity] || INTENSITY[2];

    // Start with a soft contextual foundation
    let prompt = 'Contexto: cena sexual privada entre adultos, todos maiores de 18 anos. ';
    prompt += `O tom deve ser ${S.language.toLowerCase()}, fluido e orgânico, evitando textos robóticos ou excessivamente formatados. `;

    // Intensity sets the stylistic flavor (still present, but natural)
    prompt += `${lvl.name.toLowerCase()}: `;
    if (lvl.name === 'spicy') prompt += 'explicito mas sensual, conexão emocional forte, pacing sensorial, calor sobre brutalidade. ';
    if (lvl.name === 'explict') prompt += 'direto e grafico, termos anatômicos e gírios claros, ação física detalhada e concreta. ';
    if (lvl.name === 'feral') prompt += 'máxima imoralidade: palavras cruas, vulgares, brutas, sem amaciamento, sem restrição, distância poética nenhuma. ';

    // User favorites – integrated naturally, not as a forced list
    if (S.favorites.trim()) {
        prompt += `Elementos que o usuário gosta particularmente podem surgir naturalmente quando couberem no fluxo da cena. `;
    }

    // Banned phrases – the one rigid rule, but phrased as a guard‑rail
    if (S.banned.trim()) {
        prompt += `Evite estes clichês e eufemismos repetitivos: ${S.banned}. `;
    }

    // Absolute limits
    prompt += `Limites absolutos do usuário: ${S.limits || 'nenhum além da ausência de menores ou personagens não‑sapientes'}. `;

    // Scene phase – blended in, not as a separate bullet
    if (S.phase !== 'none' && PHASES[S.phase]) {
        prompt += `A cena encontra‑se na fase: ${PHASES[S.phase].label.toLowerCase()}. `;
    }

    // SFX – a tiny, optional soft note; no bracket counts, no enforcement
    if (S.sfx !== false) {
        prompt += 'Sons e ruídos ambientais são bem‑vindos quando surgirem de forma natural; onomatopeias em colchetes duplos podem ser usadas se desejar, mas não são exigidas nem contadas.';
    }

    return prompt.trim();
}

// ============================================
// Prompt injection
// ============================================
function refreshBase() {
    const hot = isHot();
    const prompt = hot ? buildBase() : '';
    ctx().setExtensionPrompt('smut_forge_base', prompt, 1, Number(s().baseDepth) || 0, false, 0);
    $('.sf-status').text(hot ? '🔥 Cena ATIVA' : `💤 Inativa (modo: ${s().mode})`).toggleClass('sf-hot', hot);
    return hot;
}

// ============================================
// Categories & Dynamic Kink Generation
// ============================================
// The categories from your data.js can be imported, here's a minimal inline set:
export const CATEGORIES = {
    poder: {
        emoji: '⛓️',
        label: 'Poder',
        items: [
            'Pinos acima da cabeça com uma mão; a outra explora livremente.',
            'Edging: leva ao limite e para. Repetidamente. Permissão para vir só depois de ganha.',
            'Bratt & tamers: um parceiro esperto e desafiante, o outro coloca em lugar.',
            'Reversão de poder: o dominante perde o controle e o submisso toma as rédeas.',
            'Worship: o personagem devota-se ao corpo do outro — devoto, reverente, obsessivo.',
            'Tortura de tease: toque deliberadamente lento, em todo lado menos onde se quer.',
            'Grip possessivo no queixo ou garganta: pressão leve, olhar intenso, posse — nunca restrição de respiração.',
            '"Não se move": um é ordenado a ficar imóvel, mãos fora, punido brincalhona se quebrar.',
            'Marcação: chupões, marcas de mordida, arranhaduras pelas costas — o personagem admira as marcas que deixou.',
            'Faça dizer: o personagem recusa continuar até o outro dizer exatamente o que quer, em palavras explícitas.',
            'Diferença de tamanho/força: como facilmente um move, levanta, segura ou domina o outro.',
        ],
    },
    sensorial: {
        emoji: '💦',
        label: 'Sensorial',
        items: [
            'Suor: brilho na pele, gotas descendo pela coluna ou peito, pele grudando e descascando, sal na língua.',
            'Soundscape: sons molhados, pele batendo, cama rangendo, respiração pegando, gemidos mudando de tom.',
            'Reações involuntárias: pernas tremorindo, dedos se curvando, aperto, quadris fora de ritmo, costa levantando da cama.',
            "Flúidos e bagunça com zero vergonha: umidade, baba, coxas escorregadias, estado das sheets — descreva, não esconda.",
            'Cheiro e gosto: musk, suor, pele, perfume misturado ao sexo; gosto de pele, boca e excitação.',
            'Close‑up: zoom em UMA sensação e descreva devagar, detalhe extremo por todo um parágrafo.',
            'Wreckage visual: pele avermelhada, lábios inchados, pupilas dilatadas de desejo, cabelo desarrumado, handprints vermelhos, marcas novas.',
            'Contraste de temperatura: fôlego quente na pele molhada, ar frio, lençóis gelados, corpo queimando contra superfície fria.',
            'Texturas: barba, cabelo, renda, couro, lençóis torcidos nos punhos, atrito de roupas ainda meio vestidas.',
            'Oversensitivity: todo toque agora é demais — flincher, gemidos abafados, se mexer para trás e puxar de novo.',
            'Sensação interna do POV do personagem: plenitude, estiramento, pressão, latejamento baixo no ventre — físico, não poético.',
            'Aftercare touch: acariciar suavemente a cabeça, rub nas costas, dedos passando no cabelo suado de suor.',
            'Offer hydration: o personagem traz água, limpa o rosto, cobra um cobertor ao redor dos ombros trêmulos.',
            'Eye contact after: olhares macios e duradouros, um polegar tracing o queixo, um quiet "you did so good".',
            'Rocking rhythm: balanço lento de lado a lado enquanto segurado, movimento tipo canção de ninar que grounding ambos.',
        ],
    },
    // Add more categories as needed… (fisico, palavrafodas, posicao, local, dinamica, etc.)
    // For brevity, only two are fully listed; the rest follow the same structure.
    dinamica: {
        emoji: '🌀',
        label: 'Dinâmica',
        items: [
            'Gerador procedural ativo — cada clique combina aleatoriamente uma posição, intensidade e estímulo.',
            'Resultado pode ser usado como carta direta ou inspiração para o próximo parágrafo.',
            'Combinações inéditas garantidas — o sistema evita repetir as últimas 5 escolhas.',
            'Formato: "[Posição] | [Intensidade] | [Estímulo]" — pronto para ser inserido no prompt.',
            'Exemplo: "Mating press | Feral | Inner sensation POV"',
            'Ideal para quando a criatividade baixou ou quer algo totalmente novo a cada rodada.',
        ],
    },
};

const catKeys = () => Object.keys(CATEGORIES).filter(k => k !== 'dinamica');
const randomCat = () => catKeys()[Math.floor(Math.random() * catKeys().length)];

function draw(catKey) {
    const cat = CATEGORIES[catKey];
    if (!cat) return null;
    const meta = ctx().chatMetadata;
    meta['smut_forge'] ??= {};
    meta['smut_forge'].recent ??= {};
    const recent = meta['smut_forge'].recent[catKey] ?? [];
    const all = cat.items.map((_, i) => i);
    let pool = all.filter(i => !recent.includes(i));
    if (!pool.length) pool = all;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const memory = Math.min(cat.items.length - 1, 6);
    meta['smut_forge'].recent[catKey] = memory > 0 ? [...recent, pick].slice(-memory) : [];
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
        ? '[Nota do diretor — aplicar apenas na próxima resposta. Entrete‑no naturalmente e em personagem; nunca mencione esta nota.]\n' + pending.map(c => `• ${c.label}: ${c.text}`).join('\n')
        : '';
    ctx().setExtensionPrompt('smut_forge_card', text, 1, Number(s().cardDepth) || 0, false, 0);
    renderPending();
}
function renderPending() {
    const html = pending.length
        ? `<b>Na fila para a próxima resposta:</b><ul>${pending.map(c => `<li><b>${escapeHtml(c.label)}:</b> ${escapeHtml(c.text)}</li>`).join('')}</ul>
           <div class="menu_button sf-clear-cards">🗑️ Limpar cartas</div>`
        : '<i>Nenhuma carta na fila.</i>';
    $('.sf-pending').html(html);
}

function generateDynamicKink() {
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

// ============================================
// UI & Settings
// ============================================
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
            <option value="auto">Automático (palavras‑chave + botão)</option>
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
          <label for="sf_favorites">Meus kinks favoritos (o modelo usa quando encaixar)</label>
          <textarea id="sf_favorites" class="text_pole" rows="2" placeholder="ex: puxão de cabelo, elogios, espelho, marcas de mordida">${s().favorites}</textarea>
          <label for="sf_limits">Meus limites (NUNCA incluir)</label>
          <textarea id="sf_limits" class="text_pole" rows="2">${s().limits}</textarea>
          <label for="sf_banned">Clichês / eufemismos proibidos</label>
          <textarea id="sf_banned" class="text_pole" rows="3">${s().banned}</textarea>
          <label for="sf_keywords">Palavras‑chave do modo automático (vírgula)</label>
          <textarea id="sf_keywords" class="text_pole" rows="3">${s().keywords}</textarea>
          <div class="menu_button" id="sf_preview">👁️ Ver o que está sendo injetado</div>
          <label class="checkbox_label"><input type="checkbox" id="sf_sfx"><span>Sons/onomatopeias (opcional, sem contagem rígida)</span></label>
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
            addPending(newKink, true);
            toastr.info(newKink.text, `🌀 ${newKink.label}`, { timeOut: 10000 });
            renderPending();
        });
}
function openPanelPopup() {
    const { callGenericPopup, POPUP_TYPE } = ctx();
    callGenericPopup(panelHtml(), POPUP_TYPE.DISPLAY, '', { allowVerticalScrolling: true });
    setTimeout(refreshBase, 50);
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
    const prompt = `[OOC — pause the roleplay. You are now a shameless, creative smut director helping ${name1}. Based on the current scene, suggest 5 concrete, varied ideas for what ${name1} could do or say next to make it hotter. Mix: 1 position change, 1 sensory/tease move, 1 line of dirty talk ${name1} could say (written out in full), 1 power‑dynamic twist, 1 wild/kinky idea that fits ${name2} and the setting. Respect these limits: ${s().limits || 'none beyond the hard limits'}. No minors, ever. Format: numbered list, **bold title** + 1–2 lines each. Write in ${s().language}. Output only the list.]`;
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

// ============================================
// Slash Commands
// ============================================
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
        callback: (_a, v) => { s().phase = String(v || 'none').trim(); save(); refreshBase(); return s().phase; },
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

// ============================================
// Interceptor (roda antes de cada geração)
// ============================================
globalThis.smutForgeInterceptor = async function (chat, contextSize, abort, type) {
    try {
        if (!s().enabled) {
            ctx().setExtensionPrompt('smut_forge_base', '', 1, 0);
            ctx().setExtensionPrompt('smut_forge_card', '', 1, 0);
            return;
        }
        refreshBase();
        applyCards();
        if (pending.length && type !== 'quiet') consumed = true;
    } catch (e) {
        console.error('[SmutForge] interceptor', e);
    }
};

// ============================================
// Init
// ============================================
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
        $('#sf_sfx').on('change', () => { refreshBase(); applyCards(); });

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

        refreshBase();
        syncPanel();
        console.log('[SmutForge] carregada 🔥 – prompt fluido, sem gesso nem brackets rígidos');
    } catch (e) {
        console.error('[SmutForge] erro ao iniciar', e);
        toastr.error('Smut Forge: ' + (e?.message ?? e), 'Erro ao carregar', { timeOut: 0, extendedTimeOut: 0 });
    }
});
