import { CATEGORIES } from './data.js';

const MODULE = 'smut_forge_sfx';
const ctx = () => SillyTavern.getContext();
const BASE_URL = new URL('./', import.meta.url);

const DEFAULTS = Object.freeze({
    visual: true,
    anim: true,
    autodetect: true,
    prompt: true,
    density: 'med',
    dynamic: true,
});

export function SX() {
    const es = ctx().extensionSettings;
    if (!es[MODULE]) es[MODULE] = Object.assign({}, DEFAULTS);
    for (const k of Object.keys(DEFAULTS)) {
        if (es[MODULE][k] === undefined) es[MODULE][k] = DEFAULTS[k];
    }
    return es[MODULE];
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export const TYPES = {
    impact: { label: 'Impacto', re: /^(?:p+l+a+p+|p+l+a+f+t*|p+l+o+f+t+|s+l+a+p+|c+l+a+p+|t+h*w+a+[pc]+k*|w+h+a+[pc]+k*|s+m+a+c+k+|s+p+a+n+k+|p+a+f+|p+o+w+|b+a+m+|t+h+u+d+|t+u+m+p+)$/ },
    crack:  { label: 'Estalo', re: /^(?:c+r+a+c*k+|k+r+a+k+|w+h+i+p+|s+n+a+p+|t+s+h+a+k+)$/ },
    wet:    { label: 'Molhado', re: /^(?:s+c*h+l+i+c*k+|s+l+i+c+k+|s+h+l+[ou]*[ckp]+|s+q+u+[ei]+l+c+h+|s+q+u+i+s+h+|s+c*h+l+o+p+|s+l+o+p+|s+l+o+s+h+|s+p+l+[oa]+s+h+|s+p+l+a+t+|c+h+l+[ae]+p+|p+l+o+[pck]+|s+q+u+i+r+t+|d+r+i+p+|g+l+o+r+p+)$/ },
    suck:   { label: 'Chupada', re: /^(?:s+c*h*l+u+r+p+|s+u+c+k+|c+h+u+p+t*|l+i+c+k+|s+h+l+p+)$/ },
    kiss:   { label: 'Beijo', re: /^(?:m+u+a+h*|m+w+a+h+|s+m+o+o+c+h+|c+h+u+(?:a+c*k*)?)$/ },
    throat: { label: 'Garganta', re: /^(?:g+u+l+p+|g+l+u+[pbk]+|g+l+[kp]+|g+a+w+k+|g+[aou]+c*k+|h+[cg]+k+|g+h+k+|g+a+g+|g+u+r+k+)$/ },
    bed:    { label: 'Cama', re: /^(?:n+h+e+c+k*|c+r+e+a+k+|k+r+e+e+k+|c+r+e+e+k+|s+q+u+e+a+k+|c+r+e+k+)$/ },
    heart:  { label: 'Coração', re: /^(?:t+u+d+u+m+|b+a+d+u+m+p*|t+h+u+m+p+|t+u+m+|d+u+m+|l+u+b+d+u+b+)$/ },
    growl:  { label: 'Rosnado', re: /^(?:g+r{2,}h*|r{3,}|r+a+w+r+|g+r+a+h+|h+r{2,})$/ },
    cloth:  { label: 'Tecido', re: /^(?:r+i+p+|z+i+p+|s+w+i+s+h+|s+h+r+e+d+)$/ },
    buzz:   { label: 'Vibrador', re: /^(?:b+z{2,}t*|v+r{2,}|v+z{2,}|b+r{3,}|z+z+t+)$/ },
    breath: { label: 'Ofego', re: /^(?:h+a{2,}h*|h+a+h{2,}|h+f{2,}|h+u+f+|h{3,}|p+a+n+t+|f+w+h+)$/ },
    moan:   { label: 'Gemido', re: /^(?:a+h+n*|a{2,}n*h*|o+h+|o{2,}h*|m{2,}h*|m+h+|n+g+h+|n{2,}g*h*|h+n+g*h*|u+h*n+h*|h+y+a+|h+a+n+|n+h+a+|a+i+|u+i{2,}|i+y+a+)$/ },
};
const LABELS = Object.assign({ generic: 'Outros' }, Object.fromEntries(Object.entries(TYPES).map(([k, t]) => [k, t.label])));

const normTok = (raw) => String(raw).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
const tokensOf = (text) => String(text).split(/[\s,.;:!?…]+/).filter(x => /\p{L}/u.test(x));

export function classify(raw, marked) {
    const first = tokensOf(raw)[0] || String(raw);
    const playful = /[~♡♥]/.test(raw);
    const cands = [normTok(first), normTok(first.split('-')[0])];
    for (const tok of cands) {
        if (!tok) continue;
        if (!marked && tok.length < 3 && !playful) continue;
        for (const [type, def] of Object.entries(TYPES)) {
            if (def.re.test(tok)) return type;
        }
    }
    return marked ? 'generic' : null;
}

export function sfxDirective() {
    const s = SX();
    if (!s.prompt) return '';
    const dens = {
        low: 'a few times (2-4 per reply)',
        med: 'frequently (5-9 per reply)',
        high: 'a LOT (10+ per reply, comic-book / hentai-style barrages)',
    }[s.density] || 'frequently';
    return '- SOUND EFFECTS: use dirty, graphic onomatopoeia ' + dens + ' — wet sounds, skin slapping, sucking, kisses, gulping, bed creaking, heartbeat, panting, growls, toy buzzing, fabric ripping, and stretched-out moans. ' +
        'Wrap EVERY onomatopoeia in double square brackets, with no other formatting inside them: [[PLAP]] [[shlick]] [[slurrp]] [[nhec nhec]] [[glk]] [[haah]] [[aahn~]] [[tu-dum]] [[bzzzz]] [[rrrip]]. ' +
        'Make the intensity of every sound readable: soft/slow sounds in lowercase, often trailing off with "…", next to words like slowly, gently, softly (devagar, suave, baixinho); hard/fast hits in CAPS with "!" next to words like hard, fast, deep, rough (forte, rápido, fundo, bruto). ' +
        'Stretch letters for longer sounds (aaahn~, shliiick). Repeat a sound 2-5 times to show rhythm, sometimes as a burst alone on its own line, e.g. [[PLAP!]] [[PLAP!]] [[PLAP!]]. ' +
        'When narrating in Portuguese, mix Brazilian onomatopoeia (nhec, chlap, plaft, ploc, tum-tum) with universal ones. Never explain the brackets.';
}

CATEGORIES.sons = { emoji: '🔊', label: 'Sons', items: [
    'Sound barrage: fill this reply with graphic onomatopoeia — at least 8, each wrapped in [[ ]], with one burst stacked alone on its own line.',
    'Wet focus: the scene is told through its wet sounds — [[shlick]], [[chlap]], [[squelch]], [[ploc]] — getting louder as it intensifies.',
    'Rhythm through sound: start with soft, spaced-out lowercase [[plap…]] and build into a frantic stacked line of [[PLAP!]] [[PLAP!]] [[PLAP!]].',
    'Moan escalation: {{char}}\'s moans escalate across the reply — [[mmh…]] → [[ahh]] → [[aahn~]] → [[AAAHN!]] — getting longer and less controlled.',
    'Furniture betrayal: the bed or furniture gives everything away — [[nhec]] [[nhec]] [[creak]] — in rhythm with the bodies.',
    'ASMR close-up: quiet, intimate, close-mic sounds only — [[haah…]] breaths, [[muah]] wet kisses, [[slurrp]], a racing [[tu-dum]] heartbeat.',
    'Oral soundtrack: throat and mouth sounds in detail — [[glk]] [[gulp]] [[slurrp]] [[gawk]] — sloppy and shameless.',
    'Toy on: a toy is switched on and its [[bzzzz]] changes in intensity, driving the reactions.',
] };

const wordRe = (list) => new RegExp('(?<![\\p{L}])(?:' + list.join('|') + ')', 'giu');
const HARD_RE = wordRe([
    'fort[ea]s?(?![\\p{L}])', 'for[cç]a', 'r[aá]pid', 'fundo', 'funda', 'brut', 'violent', 'selvag', 'fren[eé]tic', 'desesper',
    'sem parar', 'sem d[oó]', 'bate', 'bateu', 'batia', 'soca', 'socou', 'estoc', 'martel', 'arromb', 'feroz', 'insan', 'enlouq',
    'grit', 'urr', 'implac', 'intens', 'brusc', 'com tudo', 'cada vez mais', 'animal', 'descontrol',
    'hard', 'fast', 'rough', 'deep', 'pound', 'slam', 'frenz', 'wild', 'desperat', 'savage', 'relentless', 'scream', 'feral', 'brutal',
]);
const SOFT_RE = wordRe([
    'devagar', 'lent[ao]', 'lentamente', 'suav', 'gentil', 'carinh', 'delicad', 'baixinh', 'sussurr', 'murmur',
    'pregui[cç]', 'calm', 't[ií]mid', 'leve', 'levemente', 'ternur', 'tern[ao]', 'maci', 'doce', 'cuidados', 'hesit', 'contid',
    'abafad', 'fraquinh', 'demor', 'sem pressa', 'aos poucos',
    'slow', 'soft', 'gentl', 'tender', 'lazy', 'lazil', 'quiet', 'whisper', 'light', 'careful', 'sweet', 'languid', 'hesitant',
    'timid', 'faint', 'muffled', 'teas', 'unhurried',
]);
const PHASE_BIAS = { tease: -0.15, build: 0.05, frenzy: 0.18, climax: 0.22, aftercare: -0.25 };
const countRe = (re, s) => (String(s).match(re) || []).length;

export function intensityOf(raw, before = '', after = '') {
    if (!SX().dynamic) return 0.5;
    const text = String(raw);
    let I = 0.45;
    const letters = text.replace(/[^\p{L}]/gu, '');
    if (letters.length >= 2 && letters === letters.toUpperCase() && letters !== letters.toLowerCase()) I += 0.22;
    if (/(\p{L})\1{2,}/u.test(letters)) I += 0.06;
    const tail = (String(after).match(/^[^\s\p{L}]*/u) || [''])[0];
    const punct = text + tail;
    I += Math.min((punct.match(/!/g) || []).length, 3) * 0.08;
    if (/(\.\.\.|…)/.test(punct)) I -= 0.1;
    if (tokensOf(text).length >= 3) I += 0.06;
    const win = String(before).slice(-160) + ' ' + String(after).slice(0, 100);
    I += Math.min(countRe(HARD_RE, win), 3) * 0.11;
    I -= Math.min(countRe(SOFT_RE, win), 3) * 0.11;
    I += Math.min(countRe(/!/g, win), 4) * 0.02;
    const main = ctx().extensionSettings && ctx().extensionSettings.smut_forge;
    if (main && main.enabled !== false && PHASE_BIAS[main.phase]) I += PHASE_BIAS[main.phase];
    return clamp(I, 0, 1);
}
export const levelOf = (I) => (I < 0.38 ? 'soft' : (I > 0.62 ? 'hard' : 'med'));

const RE_MARK = /\[\[([^\[\]\n]{1,80})\]\]/g;
const RE_ALL = /\[\[([^\[\]\n]{1,80})\]\]|(?<![\p{L}\p{N}])(\p{L}+(?:-\p{L}+)*[~♡♥]*)(?![\p{L}\p{N}])/gu;
const SKIP = 'code, pre, textarea, script, style, .sf-sfx';

function makeSpan(text, type) {
    const sp = document.createElement('span');
    sp.className = 'sf-sfx sf-t-' + type;
    sp.dataset.sfx = type;
    sp.dataset.text = text;
    sp.textContent = text;
    return sp;
}

function wrapNode(node, re) {
    const text = node.nodeValue;
    if (!text || !text.trim()) return;
    re.lastIndex = 0;
    const parts = [];
    let last = 0, m;
    while ((m = re.exec(text))) {
        let inner, type;
        if (m[1] !== undefined) {
            inner = m[1].trim();
            if (!inner) continue;
            type = classify(inner, true);
        } else {
            inner = m[2];
            type = classify(inner, false);
            if (!type) continue;
        }
        if (m.index > last) parts.push(document.createTextNode(text.slice(last, m.index)));
        parts.push(makeSpan(inner, type));
        last = m.index + m[0].length;
    }
    if (!parts.length) return;
    if (last < text.length) parts.push(document.createTextNode(text.slice(last)));
    const frag = document.createDocumentFragment();
    parts.forEach(p => frag.appendChild(p));
    node.parentNode.replaceChild(frag, node);
}

function spanContext(sp) {
    const block = sp.closest('p, li, blockquote') || sp.closest('.mes_text') || sp.parentElement;
    try {
        const r1 = document.createRange();
        r1.selectNodeContents(block);
        r1.setEndBefore(sp);
        let before = r1.toString();
        const r2 = document.createRange();
        r2.selectNodeContents(block);
        r2.setStartAfter(sp);
        const after = r2.toString();
        if (before.length < 60 && block.previousElementSibling) before = block.previousElementSibling.textContent + ' ' + before;
        return { before: before.slice(-160), after: after.slice(0, 120) };
    } catch (e) {
        return { before: '', after: '' };
    }
}

function spanIntensity(sp) {
    if (sp.dataset.i !== undefined) return Number(sp.dataset.i);
    const c = spanContext(sp);
    return intensityOf(sp.dataset.text || sp.textContent, c.before, c.after);
}

const LV_ICON = { soft: '🌙 suave', med: '⚖️ normal', hard: '🔥 forte' };
function tagSpan(sp) {
    const I = spanIntensity(sp);
    const lv = levelOf(I);
    sp.dataset.i = I.toFixed(2);
    sp.dataset.lv = lv;
    sp.classList.remove('sf-lv-soft', 'sf-lv-med', 'sf-lv-hard');
    sp.classList.add('sf-lv-' + lv);
    sp.title = (LABELS[sp.dataset.sfx] || 'Onomatopeia') + ' • ' + LV_ICON[lv];
}

export function processMes(el) {
    if (!el || !el.isConnected || el.querySelector('textarea')) return;
    const s = SX();
    const re = s.autodetect ? RE_ALL : RE_MARK;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => (n.parentElement && n.parentElement.closest(SKIP)) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) wrapNode(node, re);

    const spans = el.querySelectorAll('.sf-sfx');
    if (!spans.length) return;
    spans.forEach(sp => {
        if (sp.dataset.lv === undefined) tagSpan(sp);
    });
    el.querySelectorAll('p').forEach(p => {
        if (!p.querySelector('.sf-sfx') || p.classList.contains('sf-sfx-line')) return;
        const clone = p.cloneNode(true);
        clone.querySelectorAll('.sf-sfx').forEach(x => x.remove());
        if (!/[\p{L}\p{N}]/u.test(clone.textContent)) p.classList.add('sf-sfx-line');
    });
}

const dirty = new Set();
let flushTimer = null;
function markDirty(el) {
    if (!el) return;
    dirty.add(el);
    if (!flushTimer) flushTimer = setTimeout(flush, 200);
}
function flush() {
    flushTimer = null;
    const list = Array.from(dirty);
    dirty.clear();
    for (const el of list) {
        try { processMes(el); } catch (e) { console.warn('[SmutForge SFX]', e); }
    }
}
function startObserver() {
    const chat = document.getElementById('chat');
    if (!chat) return;
    new MutationObserver((muts) => {
        for (const m of muts) {
            const t = m.target.nodeType === 3 ? m.target.parentElement : m.target;
            const own = t && t.closest ? t.closest('.mes_text') : null;
            if (own) { markDirty(own); continue; }
            for (const n of m.addedNodes) {
                if (n.nodeType !== 1) continue;
                if (n.matches('.mes_text')) markDirty(n);
                else n.querySelectorAll('.mes_text').forEach(markDirty);
            }
        }
    }).observe(chat, { childList: true, subtree: true, characterData: true });
}

function reprocessAll(retag) {
    if (retag) document.querySelectorAll('#chat .sf-sfx').forEach(sp => { delete sp.dataset.lv; delete sp.dataset.i; });
    document.querySelectorAll('#chat .mes_text').forEach(el => {
        try { processMes(el); } catch (e) { console.warn('[SmutForge SFX]', e); }
    });
}

function applyBodyClasses() {
    const s = SX();
    document.body.classList.toggle('sf-novisual', !s.visual);
    document.body.classList.toggle('sf-noanim', !s.anim);
}

function settingsHtml() {
    return `
    <div id="smutforge_sfx_settings">
      <div class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header">
          <b>✨ Smut Forge — Visual</b>
          <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="inline-drawer-content">
          <label class="checkbox_label"><input type="checkbox" id="sfx_dynamic"><span>🧠 Intensidade dinâmica (força visual pelo contexto)</span></label>
          <label class="checkbox_label"><input type="checkbox" id="sfx_prompt"><span>Pedir ao modelo MUITAS onomatopeias (em [[colchetes]])</span></label>
          <label for="sfx_density">Quantidade de onomatopeias</label>
          <select id="sfx_density" class="text_pole">
            <option value="low">Pouca (2–4 por resposta)</option>
            <option value="med">Média (5–9 por resposta)</option>
            <option value="high">MUITA (estilo hentai/HQ)</option>
          </select>
          <label class="checkbox_label"><input type="checkbox" id="sfx_visual"><span>Visual colorido nas onomatopeias</span></label>
          <label class="checkbox_label"><input type="checkbox" id="sfx_anim"><span>Animações (pulsos, batimentos, tremidas)</span></label>
          <label class="checkbox_label"><input type="checkbox" id="sfx_autodetect"><span>Detectar onomatopeias mesmo sem [[colchetes]]</span></label>
        </div>
      </div>
    </div>`;
}

const EXTRA_CSS = `
.sf-sfx.sf-lv-hard { font-weight: 900; filter: saturate(1.5) brightness(1.2); }
.sf-sfx.sf-lv-soft { opacity: .72; font-weight: 600; filter: saturate(.8); }
body.sf-novisual .sf-sfx { opacity: 1; filter: none; }
`;

function bind(id, key, parse) {
    const $el = $('#' + id);
    const isCb = $el.is(':checkbox');
    if (isCb) $el.prop('checked', !!SX()[key]); else $el.val(SX()[key]);
    $el.on('input change', () => {
        const raw = isCb ? $el.prop('checked') : $el.val();
        SX()[key] = parse ? parse(raw) : raw;
        ctx().saveSettingsDebounced();
        applyBodyClasses();
        if (key === 'autodetect') reprocessAll(false);
        if (key === 'dynamic') reprocessAll(true);
    });
}

function init() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL('sfx.css', BASE_URL).href;
    document.head.appendChild(link);
    const style = document.createElement('style');
    style.textContent = EXTRA_CSS;
    document.head.appendChild(style);

    let $target = $('#extensions_settings2');
    if (!$target.length) $target = $('#extensions_settings');
    $('#smutforge_sfx_settings').remove();
    $target.append(settingsHtml());

    bind('sfx_dynamic', 'dynamic');
    bind('sfx_prompt', 'prompt');
    bind('sfx_density', 'density');
    bind('sfx_visual', 'visual');
    bind('sfx_anim', 'anim');
    bind('sfx_autodetect', 'autodetect');
    applyBodyClasses();

    startObserver();
    reprocessAll(false);
    console.log('[SmutForge SFX] visual carregado');
}

jQuery(() => {
    try {
        init();
    } catch (e) {
        console.error('[SmutForge SFX] erro ao iniciar', e);
        toastr.error('Smut Forge Visual: ' + (e && e.message ? e.message : e), 'Erro ao carregar', { timeOut: 0, extendedTimeOut: 0 });
    }
});
