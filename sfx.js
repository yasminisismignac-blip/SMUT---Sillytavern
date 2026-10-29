import { CATEGORIES } from './data.js';

const MODULE = 'smut_forge_sfx';
const ctx = () => SillyTavern.getContext();
const BASE_URL = new URL('./', import.meta.url);
const SOUNDS_URL = new URL('sounds/', BASE_URL);

const DEFAULTS = Object.freeze({
    visual: true,
    anim: true,
    sound: true,
    autoplay: false,
    autodetect: true,
    prompt: true,
    density: 'med',
    dynamic: true,
    volume: 80,
    volMin: 70,
    volMax: 100,
    rateMin: 0.9,
    rateMax: 1.15,
    stereo: 50,
    room: 15,
    testLevel: 'auto',
    voice: true,
    voiceVol: 100,
    ttsEnabled: false,
    ttsUrl: '',
    ttsLang: 'pt',
    ttsMode: 'multipart',
    ttsVol: 100,
    ttsMaxChars: 200,
    ttsTimeout: 90,
    ttsFieldText: 'text',
    ttsFieldLang: 'language',
    ttsFieldRef: 'speaker_wav',
    ttsScope: 'all',
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
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const TYPES = {
    impact: { label: 'Impacto', sample: 'PLAP', re: /^(?:p+l+a+p+|p+l+a+f+t*|p+l+o+f+t+|s+l+a+p+|c+l+a+p+|t+h*w+a+[pc]+k*|w+h+a+[pc]+k*|s+m+a+c+k+|s+p+a+n+k+|p+a+f+|p+o+w+|b+a+m+|t+h+u+d+|t+u+m+p+)$/ },
    crack:  { label: 'Estalo', sample: 'CRACK', re: /^(?:c+r+a+c*k+|k+r+a+k+|w+h+i+p+|s+n+a+p+|t+s+h+a+k+)$/ },
    wet:    { label: 'Molhado', sample: 'shlick', re: /^(?:s+c*h+l+i+c*k+|s+l+i+c+k+|s+h+l+[ou]*[ckp]+|s+q+u+[ei]+l+c+h+|s+q+u+i+s+h+|s+c*h+l+o+p+|s+l+o+p+|s+l+o+s+h+|s+p+l+[oa]+s+h+|s+p+l+a+t+|c+h+l+[ae]+p+|p+l+o+[pck]+|s+q+u+i+r+t+|d+r+i+p+|g+l+o+r+p+)$/ },
    suck:   { label: 'Chupada', sample: 'slurrp', re: /^(?:s+c*h*l+u+r+p+|s+u+c+k+|c+h+u+p+t*|l+i+c+k+|s+h+l+p+)$/ },
    kiss:   { label: 'Beijo', sample: 'muah', re: /^(?:m+u+a+h*|m+w+a+h+|s+m+o+o+c+h+|c+h+u+(?:a+c*k*)?)$/ },
    throat: { label: 'Garganta', sample: 'glk', re: /^(?:g+u+l+p+|g+l+u+[pbk]+|g+l+[kp]+|g+a+w+k+|g+[aou]+c*k+|h+[cg]+k+|g+h+k+|g+a+g+|g+u+r+k+)$/ },
    bed:    { label: 'Cama', sample: 'nhec', re: /^(?:n+h+e+c+k*|c+r+e+a+k+|k+r+e+e+k+|c+r+e+e+k+|s+q+u+e+a+k+|c+r+e+k+)$/ },
    heart:  { label: 'Coração', sample: 'tu-dum', re: /^(?:t+u+d+u+m+|b+a+d+u+m+p*|t+h+u+m+p+|t+u+m+|d+u+m+|l+u+b+d+u+b+)$/ },
    growl:  { label: 'Rosnado', sample: 'grrr', re: /^(?:g+r{2,}h*|r{3,}|r+a+w+r+|g+r+a+h+|h+r{2,})$/ },
    cloth:  { label: 'Tecido', sample: 'rrrip', re: /^(?:r+i+p+|z+i+p+|s+w+i+s+h+|s+h+r+e+d+)$/ },
    buzz:   { label: 'Vibrador', sample: 'bzzzz', re: /^(?:b+z{2,}t*|v+r{2,}|v+z{2,}|b+r{3,}|z+z+t+)$/ },
    breath: { label: 'Ofego', sample: 'haah', re: /^(?:h+a{2,}h*|h+a+h{2,}|h+f{2,}|h+u+f+|h{3,}|p+a+n+t+|f+w+h+)$/ },
    moan:   { label: 'Gemido', sample: 'aahn~', re: /^(?:a+h+n*|a{2,}n*h*|o+h+|o{2,}h*|m{2,}h*|m+h+|n+g+h+|n{2,}g*h*|h+n+g*h*|u+h*n+h*|h+y+a+|h+a+n+|n+h+a+|a+i+|u+i{2,}|i+y+a+)$/ },
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

const ALIAS = {
    impact: 'impact', impacto: 'impact', tapa: 'impact', tapas: 'impact', plap: 'impact', slap: 'impact',
    crack: 'crack', estalo: 'crack', chicote: 'crack', whip: 'crack',
    wet: 'wet', molhado: 'wet', molhada: 'wet', molhados: 'wet',
    suck: 'suck', chupada: 'suck', chupar: 'suck', slurp: 'suck',
    kiss: 'kiss', beijo: 'kiss', beijos: 'kiss',
    throat: 'throat', garganta: 'throat', engolir: 'throat', gulp: 'throat',
    moan: 'moan', gemido: 'moan', gemidos: 'moan',
    breath: 'breath', ofego: 'breath', ofegar: 'breath', respiracao: 'breath',
    bed: 'bed', cama: 'bed', rangido: 'bed',
    heart: 'heart', coracao: 'heart', batimento: 'heart',
    growl: 'growl', rosnado: 'growl',
    cloth: 'cloth', tecido: 'cloth', roupa: 'cloth', ziper: 'cloth',
    buzz: 'buzz', vibrador: 'buzz',
    generic: 'generic', outro: 'generic', outros: 'generic',
};
const keyNorm = (k) => String(k).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
function levelFromWord(w) {
    const n = keyNorm(w);
    if (/(suave|soft|leve|lento|slow|fraco|baixo|gentle|light|devagar|calmo)/.test(n)) return 'soft';
    if (/(forte|hard|intens|rapid|fast|alto|loud|brut|heavy|pesado|selvagem)/.test(n)) return 'hard';
    return 'med';
}
export function parseManifest(map) {
    const out = [], unknown = [];
    for (const [key, val] of Object.entries(map || {})) {
        const type = ALIAS[keyNorm(key)];
        if (!type) { unknown.push(key); continue; }
        const add = (f, lv) => { if (typeof f === 'string' && f.trim()) out.push({ type, level: lv || levelFromWord(f), name: f.trim() }); };
        if (Array.isArray(val)) val.forEach(f => add(f));
        else if (typeof val === 'string') add(val);
        else if (val && typeof val === 'object') {
            for (const [lk, files] of Object.entries(val)) {
                const lv = levelFromWord(lk);
                (Array.isArray(files) ? files : [files]).forEach(f => add(f, lv));
            }
        }
    }
    return { out, unknown };
}

const LIB = {};
let RAW = [];
let loadState = 'idle';
let loadInfo = { missing: [], broken: [], unknown: [], jsonError: null };
const lastPick = {};
const warned = new Set();

async function fetchSounds(force) {
    if (loadState === 'fetching' || loadState === 'decoding') return;
    loadState = 'fetching';
    renderStatus();
    RAW = [];
    for (const k of Object.keys(LIB)) delete LIB[k];
    loadInfo = { missing: [], broken: [], unknown: [], jsonError: null };
    warned.clear();
    let map;
    try {
        const res = await fetch(new URL('sounds.json', SOUNDS_URL), { cache: 'no-store' });
        const txt = res.ok ? (await res.text()).replace(/^\uFEFF/, '') : '';
        if (!res.ok || txt.trim().startsWith('<')) { loadState = 'none'; renderStatus(); return; }
        try {
            map = JSON.parse(txt);
        } catch (e) {
            loadInfo.jsonError = e.message;
            loadState = 'error';
            renderStatus();
            toastr.error('Erro de digitação no sounds.json: ' + esc(e.message) + '<br>Dica: confira as vírgulas, aspas e colchetes.', '🔊 Smut Forge', { timeOut: 15000 });
            return;
        }
    } catch (e) {
        loadState = 'none';
        renderStatus();
        return;
    }
    const { out, unknown } = parseManifest(map);
    loadInfo.unknown = unknown;
    await Promise.all(out.map(async (item) => {
        try {
            const r = await fetch(new URL(item.name, SOUNDS_URL), { cache: force ? 'reload' : 'default' });
            if (!r.ok) { loadInfo.missing.push(item.name); return; }
            item.ab = await r.arrayBuffer();
            RAW.push(item);
        } catch (e) {
            loadInfo.missing.push(item.name);
        }
    }));
    loadState = 'fetched';
    if (AC) await decodeAll(); else renderStatus();
}

function trimInfo(buf) {
    const d = buf.getChannelData(0), sr = buf.sampleRate;
    let peak = 0;
    for (let i = 0; i < d.length; i += 4) { const a = Math.abs(d[i]); if (a > peak) peak = a; }
    const th = Math.max(0.003, peak * 0.06);
    let start = 0;
    while (start < d.length && Math.abs(d[start]) < th) start++;
    let end = d.length - 1;
    while (end > start && Math.abs(d[end]) < th) end--;
    const offset = Math.max(0, start / sr - 0.004);
    const dur = Math.max(0.05, Math.min(buf.duration - offset, (end - start) / sr + 0.08));
    return { offset, dur };
}

async function decodeAll() {
    if (loadState !== 'fetched' || !AC) return;
    loadState = 'decoding';
    renderStatus();
    for (const item of RAW) {
        try {
            const buf = await AC.decodeAudioData(item.ab.slice(0));
            const { offset, dur } = trimInfo(buf);
            (LIB[item.type] = LIB[item.type] || []).push({ buf, offset, dur, level: item.level, name: item.name });
        } catch (e) {
            loadInfo.broken.push(item.name);
        }
        item.ab = null;
    }
    RAW = [];
    for (const list of Object.values(LIB)) list.sort((a, b) => a.dur - b.dur);
    loadState = 'ready';
    renderStatus();
    const total = Object.values(LIB).reduce((n, l) => n + l.length, 0);
    const few = (arr) => arr.slice(0, 6).map(esc).join(', ') + (arr.length > 6 ? ` (+${arr.length - 6})` : '');
    if (total) toastr.success(`${total} sons reais prontos 🎧`, '🔊 Smut Forge', { timeOut: 3000 });
    if (loadInfo.missing.length) toastr.warning('Não encontrei estes arquivos (confira o nome exato, com maiúsculas e extensão): ' + few(loadInfo.missing), '🔊 sounds.json', { timeOut: 15000 });
    if (loadInfo.broken.length) toastr.warning('Não consegui ler estes arquivos (use .mp3, .ogg ou .wav): ' + few(loadInfo.broken), '🔊 sounds.json', { timeOut: 15000 });
    if (loadInfo.unknown.length) toastr.warning('Categorias que eu não conheço no sounds.json: ' + few(loadInfo.unknown), '🔊 sounds.json', { timeOut: 15000 });
}

const USER_RAW = [];
const USER_DEC = new Map();
const USERLIB = {};
const USERVOICE = [];
let userBusy = false, userDirty = false;

export function setUserSounds(list) {
    USER_RAW.length = 0;
    (list || []).forEach(i => USER_RAW.push(i));
    userDirty = true;
    if (AC) buildUser();
}

async function buildUser() {
    if (!AC) return;
    if (userBusy) { userDirty = true; return; }
    userBusy = true;
    try {
        do {
            userDirty = false;
            const snap = USER_RAW.slice();
            const ids = new Set(snap.map(i => i.id));
            for (const id of Array.from(USER_DEC.keys())) if (!ids.has(id)) USER_DEC.delete(id);
            for (const it of snap) {
                if (USER_DEC.has(it.id)) continue;
                try {
                    const buf = await AC.decodeAudioData(await it.blob.arrayBuffer());
                    const { offset, dur } = trimInfo(buf);
                    USER_DEC.set(it.id, { buf, offset, dur });
                } catch (e) {
                    console.warn('[SmutForge SFX] áudio importado ilegível:', it.name, e);
                    USER_DEC.set(it.id, null);
                }
            }
            for (const k of Object.keys(USERLIB)) delete USERLIB[k];
            USERVOICE.length = 0;
            for (const it of snap) {
                const d = USER_DEC.get(it.id);
                if (!d) continue;
                if (it.kind === 'voice') {
                    USERVOICE.push({ buf: d.buf, offset: d.offset, dur: d.dur, char: it.char || '', name: it.name });
                } else {
                    (USERLIB[it.type || 'generic'] = USERLIB[it.type || 'generic'] || [])
                        .push({ buf: d.buf, offset: d.offset, dur: d.dur, level: it.level || 'med', name: it.name });
                }
            }
            for (const l of Object.values(USERLIB)) l.sort((a, b) => a.dur - b.dur);
        } while (userDirty);
    } finally {
        userBusy = false;
    }
    renderStatus();
}

function libOf(t) {
    const a = LIB[t] || [], b = USERLIB[t] || [];
    if (!b.length) return a;
    if (!a.length) return b;
    return a.concat(b).sort((x, y) => x.dur - y.dur);
}

const sameName = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
function voiceFor(char) {
    if (!USERVOICE.length) return null;
    const mine = USERVOICE.filter(v => v.char && sameName(v.char, char));
    const pool = mine.length ? mine : USERVOICE.filter(v => !v.char);
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
}

let AC = null, MASTER = null, SEND = null, TTSG = null;
const VOICES = [];
const TIMERS = new Set();
let RUN = null;
let playingEl = null;
const VOCAL = ['moan', 'breath', 'growl'];
const FALLBACK = { crack: ['impact'], suck: ['wet'], throat: ['suck', 'wet'], kiss: ['suck', 'wet'], generic: ['impact', 'wet'] };
const MAX_DUR = { impact: 1.5, crack: 1.5, kiss: 1.2, wet: 2, suck: 2.5, throat: 2, bed: 2.5, cloth: 2.5, generic: 1.5 };

export function audio() {
    if (!AC) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return null;
        AC = new AudioCtx();
        const comp = AC.createDynamicsCompressor();
        comp.threshold.value = -10;
        comp.ratio.value = 3;
        comp.attack.value = 0.003;
        comp.release.value = 0.15;
        MASTER = AC.createGain();
        MASTER.connect(comp);
        comp.connect(AC.destination);
        const conv = AC.createConvolver();
        conv.buffer = impulse(1.2);
        SEND = AC.createGain();
        SEND.connect(conv);
        conv.connect(MASTER);
        TTSG = AC.createGain();
        TTSG.connect(MASTER);
        if (loadState === 'fetched') decodeAll();
        if (USER_RAW.length) buildUser();
    }
    applyVolumes();
    if (AC.state === 'suspended') AC.resume();
    return AC;
}

function applyVolumes() {
    if (!AC) return;
    const s = SX();
    MASTER.gain.value = Number(s.volume) / 100;
    SEND.gain.value = (Number(s.room) / 100) * 0.5;
    if (TTSG) TTSG.gain.value = clamp(Number(s.ttsVol) / 100, 0, 2);
}

function impulse(sec) {
    const len = Math.floor(AC.sampleRate * sec);
    const b = AC.createBuffer(2, len, AC.sampleRate);
    for (let c = 0; c < 2; c++) {
        const d = b.getChannelData(c);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    return b;
}

function poolFor(type, level) {
    const chain = [type].concat(FALLBACK[type] || []);
    for (const t of chain) {
        const all = libOf(t);
        if (!all || !all.length) continue;
        const order = level === 'soft' ? ['soft', 'med'] : level === 'hard' ? ['hard', 'med'] : ['med'];
        for (const lv of order) {
            const l = all.filter(x => x.level === lv);
            if (l.length) return { key: t + ':' + lv, list: l };
        }
        return { key: t + ':all', list: all };
    }
    return null;
}

function pickSample(type, level, lenFactor) {
    const p = poolFor(type, level);
    if (!p) return null;
    const { key, list } = p;
    let idx;
    if (VOCAL.includes(type) && list.length >= 3) {
        const target = Math.round(clamp(lenFactor, 0, 1) * (list.length - 1));
        idx = clamp(target + Math.round(rnd(-1, 1)), 0, list.length - 1);
    } else {
        idx = Math.floor(Math.random() * list.length);
    }
    if (list.length > 1 && idx === lastPick[key]) idx = (idx + 1 + Math.floor(Math.random() * (list.length - 1))) % list.length;
    lastPick[key] = idx;
    return list[idx];
}

function fadeVoice(v) {
    try {
        const n = AC.currentTime;
        v.g.gain.cancelScheduledValues(n);
        v.g.gain.setValueAtTime(v.g.gain.value, n);
        v.g.gain.linearRampToValueAtTime(0, n + 0.06);
        v.src.stop(n + 0.08);
    } catch (e) { }
}

function playSample(smp, t, I, type) {
    const s = SX();
    const vlo = clamp(Number(s.volMin) / 100, 0, 1.5);
    const vhi = Math.max(vlo, clamp(Number(s.volMax) / 100, 0, 1.5));
    const rlo = clamp(Number(s.rateMin) || 0.9, 0.5, 2);
    const rhi = Math.max(rlo, clamp(Number(s.rateMax) || 1.15, 0.5, 2));
    const tv = s.dynamic ? clamp(0.55 * I + 0.45 * Math.random(), 0, 1) : Math.random();
    const tr = s.dynamic ? clamp(0.4 * I + 0.6 * Math.random(), 0, 1) : Math.random();
    const vol = lerp(vlo, vhi, tv);
    const rate = lerp(rlo, rhi, tr);

    const cap = MAX_DUR[type] || 99;
    const bufDur = Math.min(smp.dur, cap);
    const realDur = bufDur / rate;

    const src = AC.createBufferSource();
    src.buffer = smp.buf;
    src.playbackRate.value = rate;
    const lp = AC.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = (s.dynamic && I < 0.5) ? 2500 * Math.pow(8, I * 2) : 20000;
    const g = AC.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.004);
    if (smp.dur > cap) {
        g.gain.setValueAtTime(vol, Math.max(t + 0.005, t + realDur - 0.08));
        g.gain.linearRampToValueAtTime(0, t + realDur);
    }
    src.connect(lp).connect(g);
    if (AC.createStereoPanner) {
        const pan = AC.createStereoPanner();
        pan.pan.value = clamp(rnd(-1, 1) * (Number(s.stereo) / 100) * 0.8, -1, 1);
        g.connect(pan);
        pan.connect(MASTER);
        pan.connect(SEND);
    } else {
        g.connect(MASTER);
        g.connect(SEND);
    }
    src.start(t, smp.offset, bufDur + 0.02);
    const v = { src, g };
    VOICES.push(v);
    src.onended = () => { const i = VOICES.indexOf(v); if (i >= 0) VOICES.splice(i, 1); };
    while (VOICES.length > 12) fadeVoice(VOICES.shift());
    return realDur;
}

function playVoiceClip(vc, t, I) {
    const vol = clamp(Number(SX().voiceVol) / 100, 0, 1.5) * lerp(0.8, 1, I);
    const src = AC.createBufferSource();
    src.buffer = vc.buf;
    const g = AC.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    src.connect(g);
    g.connect(MASTER);
    g.connect(SEND);
    src.start(t, vc.offset, vc.dur + 0.02);
    const v = { src, g };
    VOICES.push(v);
    src.onended = () => { const i = VOICES.indexOf(v); if (i >= 0) VOICES.splice(i, 1); };
    while (VOICES.length > 12) fadeVoice(VOICES.shift());
}

function noSoundWarn(type) {
    if (['idle', 'fetching', 'fetched', 'decoding'].includes(loadState)) {
        toastr.info('Os sons ainda estão carregando… tenta de novo em um segundinho 🎧', '🔊 Smut Forge', { timeOut: 2500 });
        return;
    }
    const key = (loadState === 'none' || loadState === 'error') ? '__none' : type;
    if (warned.has(key)) return;
    warned.add(key);
    const msg = key === '__none'
        ? 'Nenhum som real instalado ainda (falta a pasta sounds/ com o sounds.json, ou importe em "Meus áudios"). 🎧'
        : `Sem arquivo de som para "${esc(LABELS[type] || type)}". Adicione um no sounds.json 🎧`;
    toastr.info(msg, '🔊 Smut Forge', { timeOut: 6000 });
}

export function playSfx(type, text, I = 0.5, delay = 0, opts = {}) {
    const s = SX();
    if (!s.sound) return 0;
    const ac = audio();
    if (!ac) return 0;
    const level = levelOf(I);
    const toks = tokensOf(text).slice(0, 8);
    if (!toks.length) toks.push(String(text));
    const start = ac.currentTime + 0.02 + delay;
    let t = start, end = start, played = 0;
    let interval = type === 'heart' ? lerp(0.95, 0.42, I) : lerp(0.7, 0.2, I);
    for (const tk of toks) {
        const lenF = clamp((normTok(tk).length - 3) / 7, 0, 1);
        const smp = pickSample(type, level, lenF);
        if (!smp) break;
        const d = playSample(smp, t, clamp(I + rnd(-0.05, 0.05), 0, 1), type);
        played++;
        end = Math.max(end, t + d);
        if (VOCAL.includes(type) || type === 'buzz') {
            t += d * rnd(0.8, 0.92);
        } else {
            t += interval * rnd(0.88, 1.12);
            if (I > 0.5 && toks.length >= 3) interval *= 0.94;
        }
    }
    if (!played) { noSoundWarn(type); return 0; }
    if (s.voice && !opts.noVoice && VOCAL.includes(type)) {
        const vc = voiceFor(opts.char !== undefined ? opts.char : ctx().name2);
        if (vc) playVoiceClip(vc, start + 0.01, I);
    }
    return end - start;
}

export function testMix(charName = '') {
    if (!SX().sound) { toastr.info('Ative "Sons ao clicar" no painel de Sons para testar.', '🎧 Smut Forge', { timeOut: 4000 }); return; }
    const ac = audio();
    if (!ac) return;
    stopAll();
    const seq = [['wet', 'shlick', 0.3], ['impact', 'plap', 0.5], ['impact', 'PLAP! PLAP! PLAP!', 0.9], ['moan', 'aahn~', 0.6], ['breath', 'haah…', 0.2]];
    let delay = 0;
    for (const [type, text, I] of seq) {
        const d = playSfx(type, text, I, delay, { char: charName });
        delay += d + 0.35;
    }
}

export function stopAll() {
    TIMERS.forEach(clearTimeout);
    TIMERS.clear();
    if (RUN) {
        const r = RUN;
        RUN = null;
        r.dead = true;
        r.ctrls.forEach(c => { try { c.abort('stop'); } catch (e) { } });
        if (AC) r.srcs.splice(0).forEach(fadeVoice);
    }
    if (AC) VOICES.splice(0).forEach(fadeVoice);
    playingEl = null;
    updatePlayButtons();
}

const TTS_CACHE = new Map();
const REF_B64 = new Map();
const KNOWN_REFS = new Set();
let warnedNoRef = false;

export const ttsReady = () => {
    const s = SX();
    return !!(s.ttsEnabled && /^https?:\/\//i.test(String(s.ttsUrl || '').trim()));
};

function pickRef(char) {
    const voices = USER_RAW.filter(i => i.kind === 'voice' && i.blob);
    if (!voices.length) return null;
    const mine = voices.filter(v => v.char && sameName(v.char, char));
    const free = voices.filter(v => !v.char);
    const pool = mine.length ? mine : (free.length ? free : voices);
    const score = (v) => (v.dur && v.dur <= 30 ? v.dur : 0.1);
    return pool.slice().sort((a, b) => score(b) - score(a))[0];
}
export function refVoiceName(char) {
    const r = pickRef(char);
    return r ? { name: r.name, dur: r.dur } : null;
}

const blobToB64 = (blob) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(',')[1] || '');
    r.onerror = () => rej(r.error);
    r.readAsDataURL(blob);
});
function b64ToAb(b64) {
    const bin = atob(String(b64).replace(/^data:[^,]*,/, ''));
    const u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return u.buffer;
}

function makeLimiter(n) {
    let active = 0;
    const q = [];
    const next = () => {
        if (active >= n || !q.length) return;
        active++;
        const { fn, res, rej } = q.shift();
        fn().then(res, rej).finally(() => { active--; next(); });
    };
    return (fn) => new Promise((res, rej) => { q.push({ fn, res, rej }); next(); });
}

function cleanForTts(t) {
    let s = String(t)
        .replace(/(?:\s*¦)+/g, '¦')
        .replace(/([.!?,;:…])?\s*¦\s*/g, (m, p) => (p ? p + ' ' : '. '))
        .replace(/https?:\/\/\S+/gi, ' ')
        .replace(/[\p{Extended_Pictographic}\u2661\u2665\uFE0F\u200D]/gu, ' ')
        .replace(/\u00a0/g, ' ')
        .replace(/…/g, '...')
        .replace(/[*_~`#<>|^\\\/\[\]{}()=+]/g, ' ')
        .replace(/["“”«»„]/g, ' ')
        .replace(/(^|[\s,.;:!?])['‘’]+|['‘’]+(?=$|[\s,.;:!?])/g, (m, a) => (a || '') + ' ')
        .replace(/\s*[—–]+\s*/g, ', ')
        .replace(/\s-+\s/g, ', ')
        .replace(/\.{2,}\s*$/, '.')
        .replace(/\.{2,}/g, ', ')
        .replace(/[;:]+(?=\s|$)/g, ',')
        .replace(/[!?]{2,}/g, m => (m.includes('?') ? '?' : '!'))
        .replace(/([.!?,])\1+/g, '$1')
        .replace(/([!?])\./g, '$1')
        .replace(/([.!?])\s*[,;]+/g, '$1')
        .replace(/,\s*([.!?])/g, '$1')
        .replace(/(\p{L})\1{2,}/gu, '$1$1')
        .replace(/\p{Lu}{2,}/gu, w => w.toLowerCase())
        .replace(/\s+/g, ' ')
        .replace(/\s+([,.!?])/g, '$1')
        .replace(/([,.!?])(?=\p{L})/gu, '$1 ')
        .replace(/^[\s,.;:!?-]+/, '')
        .trim();
    if (s && !/[.!?]$/.test(s)) s = s.replace(/[\s,;:-]+$/, '') + '.';
    return s;
}

function pauseAfter(text) {
    const c = String(text).trim().slice(-1);
    if ('.!?'.includes(c)) return 0.22;
    if (c === ',') return 0.1;
    return 0.05;
}

function chunkText(text, max, firstMax = max) {
    const out = [];
    const lim = () => (out.length ? max : firstMax);
    const sentences = text.match(/[^.!?…]+[.!?…]*["”')]*\s*/g) || [text];
    let cur = '';
    const push = () => { if (cur.trim()) out.push(cur.trim()); cur = ''; };
    for (let s of sentences) {
        s = s.trim();
        if (!s) continue;
        while (s.length > lim()) {
            const L = lim();
            let cut = s.lastIndexOf(',', L - 1);
            if (cut < L * 0.4) cut = s.lastIndexOf(' ', L - 1);
            const take = cut < 1 ? L : cut + 1;
            push();
            out.push(s.slice(0, take).trim());
            s = s.slice(take).trim();
        }
        if (!s) continue;
        if (cur && (cur + ' ' + s).length > lim()) push();
        cur = cur ? cur + ' ' + s : s;
    }
    push();
    return out.filter(c => /[\p{L}\p{N}]/u.test(c));
}

function buildTimeline(el, max) {
    const onlyDialogue = SX().ttsScope === 'dialogue';
    const items = [];
    const q = { open: false };
    let buf = '';
    let lastBlk = null, lastSpan = null;
    const flush = () => {
        const t = cleanForTts(buf);
        buf = '';
        if (!/[\p{L}\p{N}]/u.test(t)) return;
        chunkText(t, max, items.some(i => i.kind === 'tts') ? max : Math.min(max, 90))
            .forEach(c => items.push({ kind: 'tts', text: c }));
    };
    const take = (str) => {
        if (!onlyDialogue) return str;
        let out = '';
        for (const ch of str) {
            if (ch === '"') {
                q.open = !q.open;
                if (!q.open) out += '¦';
            } else if (ch === '“' || ch === '«') {
                q.open = true;
            } else if (ch === '”' || ch === '»') {
                if (q.open) out += '¦';
                q.open = false;
            } else if (q.open) {
                out += ch;
            }
        }
        return out;
    };
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
        const n = walker.currentNode, p = n.parentElement;
        if (!p || p.closest('.sf-playall, code, pre, style, script, textarea')) continue;
        const sp = p.closest('.sf-sfx');
        if (sp) {
            if (sp !== lastSpan) { flush(); items.push({ kind: 'sfx', span: sp }); lastSpan = sp; }
            continue;
        }
        lastSpan = null;
        const blk = p.closest('p, li, blockquote, h1, h2, h3, h4') || el;
        if (lastBlk && blk !== lastBlk) {
            if (onlyDialogue) {
                q.open = false;
                if (buf.trim()) buf += '¦';
            } else if (!/[.!?…:;,]\s*$/.test(buf)) {
                buf += '.';
            }
        }
        lastBlk = blk;
        buf += ' ' + take(n.nodeValue);
    }
    flush();
    let ttsCount = 0;
    return items.filter(it => it.kind !== 'tts' || ++ttsCount <= 40);
}

function reportTtsError(e, run) {
    if (run) { if (run.reported) return; run.reported = true; }
    console.warn('[SmutForge TTS]', e);
    toastr.error(esc(e && e.message ? e.message : e), '🎙️ TTS externo', { timeOut: 12000 });
}

async function requestTts(text, ref, run) {
    const s = SX();
    const url = String(s.ttsUrl || '').trim();
    const key = [url, ref ? ref.id : '-', s.ttsLang, text].join('|');
    if (TTS_CACHE.has(key)) return TTS_CACHE.get(key);
    if (run && run.failed) throw new Error('skip');
    const ac = audio();
    if (!ac) throw new Error('Seu navegador não suporta áudio.');

    const timeoutSec = Math.max(10, Number(s.ttsTimeout) || 90);
    const ctrl = new AbortController();
    if (run) run.ctrls.add(ctrl);
    const timer = setTimeout(() => ctrl.abort('timeout'), timeoutSec * 1000);
    try {
        const fText = (s.ttsFieldText || 'text').trim();
        const fLang = (s.ttsFieldLang || 'language').trim();
        const fRef = (s.ttsFieldRef || 'speaker_wav').trim();
        const isJson = s.ttsMode === 'json';
        const baseHeaders = {};
        if (/ngrok/i.test(url)) baseHeaders['ngrok-skip-browser-warning'] = '1';
        const refKey = ref ? `${ref.id}-${ref.blob.size}` : '';
        const knownKey = url + '|' + refKey;

        const makeReq = async (withFile) => {
            const headers = Object.assign({}, baseHeaders);
            if (isJson) {
                headers['Content-Type'] = 'application/json';
                const o = { [fText]: text, [fLang]: s.ttsLang };
                if (ref) {
                    if (!REF_B64.has(ref.id)) REF_B64.set(ref.id, await blobToB64(ref.blob));
                    o[fRef] = REF_B64.get(ref.id);
                }
                return { headers, body: JSON.stringify(o) };
            }
            const fd = new FormData();
            fd.append(fText, text);
            fd.append(fLang, s.ttsLang);
            if (ref) {
                fd.append('ref_key', refKey);
                if (withFile) fd.append(fRef, ref.blob, ref.name || 'referencia.wav');
            }
            return { headers, body: fd };
        };
        const send = async (withFile) => fetch(url, { method: 'POST', signal: ctrl.signal, ...(await makeReq(withFile)) });

        let res = await send(!(ref && !isJson && KNOWN_REFS.has(knownKey)));
        if (res.status === 428 && ref && !isJson) {
            KNOWN_REFS.delete(knownKey);
            res = await send(true);
        }
        if (res.ok && ref && !isJson && res.headers.get('x-ref-cached') === '1') KNOWN_REFS.add(knownKey);
        if (!res.ok) {
            const detail = (await res.text().catch(() => '')).replace(/\s+/g, ' ').slice(0, 200);
            throw new Error(`O servidor TTS respondeu HTTP ${res.status}. ${detail}`);
        }
        const ct = (res.headers.get('content-type') || '').toLowerCase();
        let ab;
        if (ct.includes('json')) {
            const j = await res.json();
            const b64 = j.audio_base64 || j.audio || j.data || j.wav;
            const link = j.audio_url || j.url || j.file;
            if (b64 && typeof b64 === 'string') ab = b64ToAb(b64);
            else if (link) ab = await (await fetch(new URL(link, url).href, { signal: ctrl.signal })).arrayBuffer();
            else throw new Error('A resposta JSON não tem áudio (esperado: audio_base64 ou audio_url).');
        } else {
            ab = await res.arrayBuffer();
        }
        let buf;
        try {
            buf = await ac.decodeAudioData(ab);
        } catch (e) {
            throw new Error('A resposta do servidor não é um áudio válido (wav/mp3/ogg).');
        }
        TTS_CACHE.set(key, buf);
        if (TTS_CACHE.size > 60) TTS_CACHE.delete(TTS_CACHE.keys().next().value);
        return buf;
    } catch (e) {
        if (ctrl.signal.aborted) {
            const timedOut = ctrl.signal.reason === 'timeout';
            const err = new Error(timedOut ? `Tempo esgotado (${timeoutSec}s) esperando o servidor TTS.` : 'cancelado');
            err.fatal = timedOut;
            throw err;
        }
        if (e instanceof TypeError) {
            const err = new Error('Não consegui conectar ao servidor TTS: URL errada, Colab/túnel desligado, CORS bloqueado, ou http em página https.');
            err.fatal = true;
            throw err;
        }
        throw e;
    } finally {
        clearTimeout(timer);
        if (run) run.ctrls.delete(ctrl);
    }
}

function newRun() {
    return { dead: false, failed: false, reported: false, ctrls: new Set(), srcs: [] };
}

function scheduleBuf(run, buf, at) {
    const src = AC.createBufferSource();
    src.buffer = buf;
    const g = AC.createGain();
    src.connect(g);
    g.connect(TTSG);
    src.start(at);
    const v = { src, g };
    run.srcs.push(v);
    src.onended = () => { const i = run.srcs.indexOf(v); if (i >= 0) run.srcs.splice(i, 1); };
}

async function narrate(el) {
    const ac = audio();
    if (!ac) return;
    stopAll();
    const s = SX();
    const items = buildTimeline(el, clamp(Number(s.ttsMaxChars) || 200, 60, 400));
    if (s.ttsScope === 'dialogue' && !items.some(i => i.kind === 'tts')) toastr.info('Não achei falas entre aspas nesta mensagem.', '🎙️ TTS externo', { timeOut: 4000 });
    if (!items.length) return;

    const run = newRun();
    RUN = run;
    playingEl = el;
    updatePlayButtons();

    const mes = el.closest('.mes');
    const char = (mes && mes.getAttribute('ch_name')) || ctx().name2 || '';
    const ref = pickRef(char);
    if (!ref && !warnedNoRef) {
        warnedNoRef = true;
        toastr.info('Nenhuma voz de referência importada — enviando só o texto. Importe a voz do personagem em "Meus áudios".', '🎙️ TTS externo', { timeOut: 7000 });
    }

    const limit = makeLimiter(2);
    for (const it of items) {
        if (it.kind !== 'tts') continue;
        it.p = limit(async () => {
            try {
                return await requestTts(it.text, ref, run);
            } catch (e) {
                if (!run.dead && e.message !== 'skip' && e.message !== 'cancelado') {
                    if (e.fatal) {
                        run.failed = true;
                        run.ctrls.forEach(c => { try { c.abort('stop'); } catch (x) { } });
                    }
                    reportTtsError(e, run);
                }
                throw e;
            }
        });
        it.p.catch(() => {});
    }

    let cursor = ac.currentTime + 0.15;
    for (const it of items) {
        if (run.dead) return;
        if (it.kind === 'tts') {
            let buf;
            try { buf = await it.p; } catch (e) { if (run.dead) return; continue; }
            if (run.dead) return;
            const at = Math.max(cursor, ac.currentTime + 0.05);
            scheduleBuf(run, buf, at);
            cursor = at + buf.duration + pauseAfter(it.text);
        } else {
            const sp = it.span;
            if (!sp.isConnected) continue;
            const I = spanIntensity(sp);
            const at = Math.max(cursor, ac.currentTime + 0.03);
            const wait = Math.max(0, at - ac.currentTime);
            const d = playSfx(sp.dataset.sfx, sp.dataset.text || sp.textContent, I, wait, { noVoice: true, char });
            const tm = setTimeout(() => { TIMERS.delete(tm); popFx(sp); }, wait * 1000);
            TIMERS.add(tm);
            cursor = at + d * 0.9 + lerp(0.3, 0.08, I);
        }
    }
    if (run.dead) return;
    const done = setTimeout(() => {
        TIMERS.delete(done);
        if (RUN === run) { RUN = null; playingEl = null; updatePlayButtons(); }
    }, Math.max(0, cursor - ac.currentTime) * 1000 + 300);
    TIMERS.add(done);
}

export async function testTts(charName = '') {
    if (!ttsReady()) {
        toastr.warning('Ative o TTS e preencha uma URL começando com http:// ou https://', '🎙️ TTS externo', { timeOut: 5000 });
        return;
    }
    const ac = audio();
    if (!ac) return;
    stopAll();
    const run = newRun();
    RUN = run;
    const ref = pickRef(charName);
    toastr.info('Enviando texto de teste…', '🎙️ TTS externo', { timeOut: 2500 });
    const t0 = performance.now();
    try {
        const buf = await requestTts('Olá! Esta é uma voz de teste, narrando em português do Brasil.', ref, run);
        if (run.dead) return;
        scheduleBuf(run, buf, ac.currentTime + 0.05);
        toastr.success(`Servidor respondeu em ${((performance.now() - t0) / 1000).toFixed(1)}s ✅${ref ? '' : ' (sem áudio de referência)'}`, '🎙️ TTS externo', { timeOut: 5000 });
    } catch (e) {
        if (!run.dead) reportTtsError(e);
        if (RUN === run) RUN = null;
    }
}

export function playMessage(el) {
    if (!el) return;
    if (ttsReady()) {
        narrate(el).catch(e => { console.error('[SmutForge TTS]', e); reportTtsError(e); });
    } else {
        playAll(el);
    }
}

export function refreshTtsUi(reprocess) {
    applyVolumes();
    updatePlayButtons();
    if (reprocess) reprocessAll(false);
}

const RE_MARK = /\[\[([^\[\]\n]{1,80})\]\]/g;
const RE_ALL = /\[\[([^\[\]\n]{1,80})\]\]|(?<![\p{L}\p{N}])(\p{L}+(?:-\p{L}+)*[~♡♥]*)(?![\p{L}\p{N}])/gu;
const SKIP = 'code, pre, textarea, script, style, .sf-sfx, .sf-playall';

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
    sp.title = (LABELS[sp.dataset.sfx] || 'Som') + ' • ' + LV_ICON[lv] + ' — clique para ouvir 🔊';
}

function markAvailability(sp) {
    if (loadState !== 'ready' && loadState !== 'none' && loadState !== 'error') return;
    sp.classList.toggle('sf-nosnd', !poolFor(sp.dataset.sfx, 'med'));
}
function refreshAvailability() {
    document.querySelectorAll('.sf-sfx').forEach(markAvailability);
}

const playLabel = () => (ttsReady() ? (SX().ttsScope === 'dialogue' ? '🎙️ Narrar diálogos + sons' : '🎙️ Narrar com TTS + sons') : '🔊 Tocar os sons desta mensagem');
function isCharMes(el) {
    const m = el.closest('.mes');
    return !!m && m.getAttribute('is_user') !== 'true' && m.getAttribute('is_system') !== 'true';
}

export function processMes(el) {
    if (!el || !el.isConnected || el.querySelector('textarea')) return;
    const s = SX();
    const wantTts = ttsReady() && isCharMes(el);
    const re = s.autodetect ? RE_ALL : RE_MARK;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => (n.parentElement && n.parentElement.closest(SKIP)) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) wrapNode(node, re);

    const spans = el.querySelectorAll('.sf-sfx');
    if (!spans.length && !wantTts) return;
    spans.forEach(sp => {
        if (sp.dataset.lv === undefined) tagSpan(sp);
        markAvailability(sp);
    });
    el.querySelectorAll('p').forEach(p => {
        if (!p.querySelector('.sf-sfx') || p.classList.contains('sf-sfx-line')) return;
        const clone = p.cloneNode(true);
        clone.querySelectorAll('.sf-sfx').forEach(x => x.remove());
        if (!/[\p{L}\p{N}]/u.test(clone.textContent)) p.classList.add('sf-sfx-line');
    });
    if (((spans.length >= 2 && s.sound) || wantTts) && !el.querySelector('.sf-playall')) {
        const b = document.createElement('div');
        b.className = 'sf-playall';
        b.textContent = playLabel();
        el.appendChild(b);
    }
}

function popFx(sp) {
    sp.classList.remove('sf-pop');
    void sp.offsetWidth;
    sp.classList.add('sf-pop');
    if (SX().anim && (sp.dataset.lv === 'hard' || ['impact', 'crack', 'bed', 'growl'].includes(sp.dataset.sfx))) {
        const mes = sp.closest('.mes');
        if (mes) {
            mes.classList.remove('sf-shake');
            void mes.offsetWidth;
            mes.classList.add('sf-shake');
        }
    }
}

function updatePlayButtons() {
    document.querySelectorAll('.sf-playall').forEach(b => {
        const on = !!playingEl && b.closest('.mes_text') === playingEl;
        const label = on ? '⏹️ Parar' : playLabel();
        if (b.textContent !== label) b.textContent = label;
        b.classList.toggle('sf-playing', on);
    });
}

export function playAll(el) {
    if (!el) return;
    stopAll();
    const spans = Array.from(el.querySelectorAll('.sf-sfx')).slice(0, 30);
    if (!spans.length) return;
    playingEl = el;
    updatePlayButtons();
    let delay = 0;
    for (const sp of spans) {
        const I = spanIntensity(sp);
        const myDelay = delay;
        const d = playSfx(sp.dataset.sfx, sp.dataset.text || sp.textContent, I, myDelay);
        const tm = setTimeout(() => { TIMERS.delete(tm); popFx(sp); }, myDelay * 1000);
        TIMERS.add(tm);
        delay += d + lerp(0.55, 0.12, I) * rnd(0.8, 1.2);
        if (delay > 25) break;
    }
    const done = setTimeout(() => { TIMERS.delete(done); playingEl = null; updatePlayButtons(); }, delay * 1000 + 300);
    TIMERS.add(done);
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

const TEST_I = { soft: 0.15, med: 0.5, hard: 0.9 };
function boardText(sample) {
    const lv = SX().testLevel;
    if (lv === 'soft') return sample.toLowerCase() + '…';
    if (lv === 'hard') return sample.toUpperCase() + '!';
    return sample;
}

function renderStatus() {
    const $st = $('#sfx_status');
    if ($st.length) {
        let html = '';
        const hasUser = Object.values(USERLIB).some(l => l.length);
        if (loadState === 'none' && !hasUser) html = '📭 Nenhum <code>sounds/sounds.json</code> encontrado — ainda sem sons reais.';
        else if (loadState === 'error') html = '❌ Erro de digitação no sounds.json: ' + esc(loadInfo.jsonError || '');
        else if (loadState === 'fetching' || loadState === 'decoding' || loadState === 'idle') html = '⏳ Carregando sons…';
        else if (loadState === 'fetched') html = '👆 Sons baixados — clique em qualquer lugar da página para ativar o áudio.';
        else {
            const rows = Object.keys(LABELS).map(k => {
                const l = libOf(k);
                if (!l.length) return '';
                const c = (lv) => l.filter(x => x.level === lv).length;
                return `<div>${esc(LABELS[k])}: <b>${l.length}</b> <small>(🌙${c('soft')} ⚖️${c('med')} 🔥${c('hard')})</small></div>`;
            }).join('');
            html = rows ? `<div class="sfx-status-grid">${rows}</div>` : '📭 O sounds.json está vazio ou nenhum arquivo foi encontrado.';
            if (loadInfo.missing.length) html += `<div class="sfx-warn">⚠️ Não encontrados: ${loadInfo.missing.map(esc).join(', ')}</div>`;
            if (loadInfo.broken.length) html += `<div class="sfx-warn">⚠️ Ilegíveis: ${loadInfo.broken.map(esc).join(', ')}</div>`;
        }
        $st.html(html);
    }
    refreshAvailability();
}

function settingsHtml() {
    const board = Object.entries(TYPES).map(([k, t]) =>
        `<span class="sf-sfx sf-t-${k} sf-board" data-sfx="${k}" data-sample="${t.sample}" data-text="${t.sample}" title="${t.label} — clique: ouvir | Shift+clique: inserir na sua mensagem">${t.sample}</span>`,
    ).join(' ');
    return `
    <div id="smutforge_sfx_settings">
      <div class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header">
          <b>🔊 Smut Forge — Sons &amp; Visual</b>
          <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="inline-drawer-content">
          <small>🎧 Mesa de som — clique para ouvir • Shift+clique insere na sua mensagem</small>
          <div class="sf-board-wrap">${board}</div>
          <div class="sfx-row2">
            <div>
              <label for="sfx_testLevel">Testar a mesa como</label>
              <select id="sfx_testLevel" class="text_pole">
                <option value="auto">Automático</option>
                <option value="soft">🌙 Suave / lento</option>
                <option value="med">⚖️ Normal</option>
                <option value="hard">🔥 Forte / rápido</option>
              </select>
            </div>
            <div class="sfx-btns">
              <div class="menu_button" id="sfx_reload">🔄 Recarregar sons</div>
              <div class="menu_button" id="sfx_stop">⏹️ Parar tudo</div>
            </div>
          </div>
          <div id="sfx_status" class="sfx-status"></div>
          <hr>
          <label class="checkbox_label"><input type="checkbox" id="sfx_dynamic"><span>🧠 Áudio dinâmico (ritmo, força e tom pelo contexto)</span></label>
          <div class="sfx-row2">
            <div><label for="sfx_volMin">Variação de volume — mín %</label><input id="sfx_volMin" class="text_pole" type="number" min="10" max="150" step="5"></div>
            <div><label for="sfx_volMax">máx %</label><input id="sfx_volMax" class="text_pole" type="number" min="10" max="150" step="5"></div>
          </div>
          <div class="sfx-row2">
            <div><label for="sfx_rateMin">Velocidade/tom — mín ×</label><input id="sfx_rateMin" class="text_pole" type="number" min="0.5" max="2" step="0.01"></div>
            <div><label for="sfx_rateMax">máx ×</label><input id="sfx_rateMax" class="text_pole" type="number" min="0.5" max="2" step="0.01"></div>
          </div>
          <label for="sfx_volume">Volume geral</label>
          <input id="sfx_volume" type="range" min="0" max="100">
          <label for="sfx_stereo">Estéreo (sons passeando entre os fones)</label>
          <input id="sfx_stereo" type="range" min="0" max="100">
          <label for="sfx_room">Eco do quarto (ambiente)</label>
          <input id="sfx_room" type="range" min="0" max="100">
          <hr>
          <label class="checkbox_label"><input type="checkbox" id="sfx_prompt"><span>Pedir ao modelo MUITAS onomatopeias (em [[colchetes]])</span></label>
          <label for="sfx_density">Quantidade de onomatopeias</label>
          <select id="sfx_density" class="text_pole">
            <option value="low">Pouca (2–4 por resposta)</option>
            <option value="med">Média (5–9 por resposta)</option>
            <option value="high">MUITA (estilo hentai/HQ)</option>
          </select>
          <label class="checkbox_label"><input type="checkbox" id="sfx_visual"><span>Visual colorido nas onomatopeias</span></label>
          <label class="checkbox_label"><input type="checkbox" id="sfx_anim"><span>Animações (tremidas, pulsos, batimentos)</span></label>
          <label class="checkbox_label"><input type="checkbox" id="sfx_autodetect"><span>Detectar onomatopeias mesmo sem [[colchetes]]</span></label>
          <label class="checkbox_label"><input type="checkbox" id="sfx_sound"><span>Sons ao clicar</span></label>
          <label class="checkbox_label"><input type="checkbox" id="sfx_autoplay"><span>Tocar sozinho quando a resposta chegar</span></label>
          <small>🎙️ A narração por TTS externo (URL da API) fica no painel "Meus áudios".</small>
        </div>
      </div>
    </div>`;
}

const EXTRA_CSS = `
.sf-sfx.sf-lv-hard { font-weight: 900; filter: saturate(1.5) brightness(1.2); }
.sf-sfx.sf-lv-soft { opacity: .72; font-weight: 600; filter: saturate(.8); }
.sf-sfx.sf-nosnd { cursor: help; }
body.sf-novisual .sf-sfx { opacity: 1; filter: none; }
.sf-playall.sf-playing { background: rgba(255, 90, 150, .4); }
.sfx-row2 { display: flex; gap: 8px; align-items: flex-end; }
.sfx-row2 > div { flex: 1; }
.sfx-btns { display: flex; gap: 4px; }
.sfx-btns .menu_button { flex: 1; margin: 0; text-align: center; }
.sfx-status { font-size: .85em; margin: 6px 0; padding: 6px 8px; border-radius: 6px; background: rgba(0, 0, 0, .25); }
.sfx-status-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 2px 10px; }
.sfx-warn { margin-top: 4px; color: #ffcf6b; }
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
        applyVolumes();
        if (key === 'testLevel') $('.sf-board').each(function () { this.dataset.text = boardText(this.dataset.sample); this.textContent = this.dataset.text; });
        if (key === 'autodetect' || key === 'sound') reprocessAll(false);
        if (key === 'dynamic') reprocessAll(true);
    });
}

function insertIntoInput(text) {
    const ta = document.getElementById('send_textarea');
    if (!ta) return;
    const sep = ta.value && !/\s$/.test(ta.value) ? ' ' : '';
    ta.value += sep + '[[' + text + ']] ';
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.focus();
}

function registerSlash() {
    const c = ctx();
    const P = c.SlashCommandParser, Cmd = c.SlashCommand, Arg = c.SlashCommandArgument, T = c.ARGUMENT_TYPE;
    if (!P || !Cmd || !Arg || !T) return;
    P.addCommandObject(Cmd.fromProps({
        name: 'sfx',
        callback: (_a, v) => {
            const text = String(v || 'PLAP').trim();
            playSfx(classify(text, true), text, intensityOf(text));
            return '';
        },
        unnamedArgumentList: [Arg.fromProps({ description: 'onomatopeia', typeList: [T.STRING], isRequired: false })],
        helpString: 'Toca o som de uma onomatopeia. Ex: <code>/sfx PLAP! PLAP! PLAP!</code>, <code>/sfx aahn…</code>',
    }));
    P.addCommandObject(Cmd.fromProps({
        name: 'sfx-stop',
        callback: () => { stopAll(); return ''; },
        helpString: 'Para todos os sons.',
    }));
    P.addCommandObject(Cmd.fromProps({
        name: 'sfx-reload',
        callback: () => { fetchSounds(true); return ''; },
        helpString: 'Recarrega os sons da pasta sounds/.',
    }));
    P.addCommandObject(Cmd.fromProps({
        name: 'sfx-narrate',
        callback: () => {
            const els = document.querySelectorAll('#chat .mes:not([is_user="true"]) .mes_text');
            const el = els[els.length - 1];
            if (el) { processMes(el); playMessage(el); }
            return '';
        },
        helpString: 'Narra a última resposta (TTS externo, se ligado) junto com os efeitos sonoros.',
    }));
}

let autoplayId = null;
function fireAutoplay(id) {
    autoplayId = null;
    const el = document.querySelector(`#chat .mes[mesid="${id}"] .mes_text`);
    if (!el) return;
    processMes(el);
    playMessage(el);
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

    bind('sfx_testLevel', 'testLevel');
    bind('sfx_dynamic', 'dynamic');
    bind('sfx_volMin', 'volMin', Number);
    bind('sfx_volMax', 'volMax', Number);
    bind('sfx_rateMin', 'rateMin', Number);
    bind('sfx_rateMax', 'rateMax', Number);
    bind('sfx_volume', 'volume', Number);
    bind('sfx_stereo', 'stereo', Number);
    bind('sfx_room', 'room', Number);
    bind('sfx_prompt', 'prompt');
    bind('sfx_density', 'density');
    bind('sfx_visual', 'visual');
    bind('sfx_anim', 'anim');
    bind('sfx_autodetect', 'autodetect');
    bind('sfx_sound', 'sound');
    bind('sfx_autoplay', 'autoplay');
    $('.sf-board').each(function () { this.dataset.text = boardText(this.dataset.sample); this.textContent = this.dataset.text; });
    $('#sfx_reload').on('click', () => fetchSounds(true));
    $('#sfx_stop').on('click', stopAll);
    applyBodyClasses();

    $(document).on('click', '.sf-sfx', function (e) {
        e.stopPropagation();
        if (this.classList.contains('sf-board')) {
            if (e.shiftKey) { insertIntoInput(this.dataset.text); return; }
            const lv = SX().testLevel;
            const I = TEST_I[lv] !== undefined ? TEST_I[lv] : intensityOf(this.dataset.text);
            playSfx(this.dataset.sfx, this.dataset.text, I);
            popFx(this);
            return;
        }
        playSfx(this.dataset.sfx, this.dataset.text || this.textContent, spanIntensity(this));
        popFx(this);
    });
    $(document).on('click', '.sf-playall', function (e) {
        e.stopPropagation();
        const el = this.closest('.mes_text');
        if (playingEl && playingEl === el) stopAll(); else playMessage(el);
    });

    const unlock = () => {
        audio();
        document.removeEventListener('pointerdown', unlock, true);
        document.removeEventListener('keydown', unlock, true);
    };
    document.addEventListener('pointerdown', unlock, true);
    document.addEventListener('keydown', unlock, true);

    const c = ctx();
    const ev = c.eventSource, et = c.eventTypes || c.event_types;
    ev.on(et.MESSAGE_RECEIVED, (id, type) => {
        const s = SX();
        if (!s.autoplay || !(s.sound || ttsReady()) || type === 'quiet' || type === 'first_message') return;
        autoplayId = Number(id);
        setTimeout(() => { if (autoplayId === Number(id)) fireAutoplay(id); }, 1500);
    });
    if (et.CHARACTER_MESSAGE_RENDERED) {
        ev.on(et.CHARACTER_MESSAGE_RENDERED, (id) => {
            if (autoplayId !== null && Number(id) === autoplayId) setTimeout(() => fireAutoplay(id), 100);
        });
    }
    if (et.CHAT_CHANGED) ev.on(et.CHAT_CHANGED, stopAll);

    try { registerSlash(); } catch (e) { console.warn('[SmutForge SFX] comandos não registrados', e); }
    startObserver();
    reprocessAll(false);
    fetchSounds(false);
    console.log('[SmutForge SFX] v2 + TTS externo carregado 🔊');
}

jQuery(() => {
    try {
        init();
    } catch (e) {
        console.error('[SmutForge SFX] erro ao iniciar', e);
        toastr.error('Smut Forge SFX: ' + (e && e.message ? e.message : e), 'Erro ao carregar', { timeOut: 0, extendedTimeOut: 0 });
    }
});
