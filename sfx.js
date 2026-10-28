// sfx.js — Smut Forge 🔊 Onomatopeias visuais + sons clicáveis
import { CATEGORIES } from './data.js';

const MODULE = 'smut_forge_sfx';
const ctx = () => SillyTavern.getContext();
const BASE_URL = new URL('./', import.meta.url);

const DEFAULTS = Object.freeze({
    visual: true,
    anim: true,
    sound: true,
    autoplay: false,
    autodetect: true,
    prompt: true,
    density: 'med',
    voice: 'aguda',
    volume: 70,
    stereo: 60,
    room: 25,
});

function SX() {
    const es = ctx().extensionSettings;
    if (!es[MODULE]) es[MODULE] = Object.assign({}, DEFAULTS);
    for (const k of Object.keys(DEFAULTS)) {
        if (es[MODULE][k] === undefined) es[MODULE][k] = DEFAULTS[k];
    }
    return es[MODULE];
}

// ---------- Dicionário de onomatopeias (a ordem importa) ----------
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
        'Stretch letters for length and intensity, CAPS for loud hits, ~ or ♡ for needy moans. Sometimes put a burst alone on its own line, e.g. [[PLAP]] [[PLAP]] [[PLAP]]. ' +
        'Moans and broken sounds inside dialogue can be wrapped too. When narrating in Portuguese, mix Brazilian onomatopoeia (nhec, chlap, plaft, ploc, tum-tum) with universal ones. Never explain the brackets.';
}

// Carta extra no baralho do Smut Forge
CATEGORIES.sons = { emoji: '🔊', label: 'Sons', items: [
    'Sound barrage: fill this reply with graphic onomatopoeia — at least 8, each wrapped in [[ ]], with one burst stacked alone on its own line.',
    'Wet focus: the scene is told through its wet sounds — [[shlick]], [[chlap]], [[squelch]], [[ploc]] — getting louder as it intensifies.',
    'Rhythm through sound: show the pace with [[PLAP]] bursts that start slow and spaced out, then speed up into a frantic stacked line.',
    'Moan escalation: {{char}}\'s moans escalate across the reply — [[mmh]] → [[ahh]] → [[aahn~]] → [[AAAHN♡]] — getting longer and less controlled.',
    'Furniture betrayal: the bed or furniture gives everything away — [[nhec]] [[nhec]] [[creak]] — in rhythm with the bodies.',
    'ASMR close-up: quiet, intimate, close-mic sounds only — [[haah]] breaths, [[muah]] wet kisses, [[slurrp]], a racing [[tu-dum]] heartbeat.',
    'Oral soundtrack: throat and mouth sounds in detail — [[glk]] [[gulp]] [[slurrp]] [[gawk]] — sloppy and shameless.',
    'Toy on: a toy is switched on and its [[bzzzz]] changes in pitch and intensity, driving the reactions.',
] };

// ---------- Motor de áudio (Web Audio, sintetizado na hora) ----------
let AC = null, MASTER = null, SEND = null, NOISE = null, DIST = null;
const CUSTOM = {};
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function audio() {
    if (!AC) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return null;
        AC = new AudioCtx();
        const comp = AC.createDynamicsCompressor();
        comp.threshold.value = -14;
        comp.ratio.value = 4;
        MASTER = AC.createGain();
        MASTER.connect(comp);
        comp.connect(AC.destination);
        const conv = AC.createConvolver();
        conv.buffer = impulse(1.1);
        SEND = AC.createGain();
        SEND.connect(conv);
        conv.connect(MASTER);
        NOISE = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate);
        const d = NOISE.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        loadCustom();
    }
    applyVolumes();
    if (AC.state === 'suspended') AC.resume();
    return AC;
}

function applyVolumes() {
    if (!AC) return;
    const s = SX();
    MASTER.gain.value = (Number(s.volume) / 100) * 0.9;
    SEND.gain.value = (Number(s.room) / 100) * 0.6;
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

function distCurve(k) {
    const n = 1024, c = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        const x = i * 2 / n - 1;
        c[i] = ((3 + k) * x * 20 * Math.PI / 180) / (Math.PI + k * Math.abs(x));
    }
    return c;
}

function bus(pan) {
    const g = AC.createGain();
    if (AC.createStereoPanner) {
        const p = AC.createStereoPanner();
        p.pan.value = clamp(pan, -1, 1);
        g.connect(p); p.connect(MASTER); p.connect(SEND);
    } else {
        g.connect(MASTER); g.connect(SEND);
    }
    return g;
}
function G(v = 1) { const g = AC.createGain(); g.gain.value = v; return g; }
function F(type, freq, q = 1) { const f = AC.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; return f; }
function N(t, dur) { const s = AC.createBufferSource(); s.buffer = NOISE; s.loop = true; s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05); return s; }
function O(type, freq, t, dur) { const o = AC.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t); o.start(t); o.stop(t + dur + 0.05); return o; }
function env(g, t, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}
function bubble(t, out, vol) {
    const o = O('sine', rnd(220, 380), t, 0.06), g = G();
    o.frequency.exponentialRampToValueAtTime(rnd(700, 1200), t + rnd(0.02, 0.04));
    env(g, t, 0.002, vol, 0.035);
    o.connect(g).connect(out);
}

// Cada síntese recebe (tempo, saída, token normalizado, texto original) e devolve a duração.
const SYNTH = {
    impact(t, out) {
        const n = N(t, 0.15), hp = F('highpass', rnd(600, 1100)), pk = F('peaking', rnd(1800, 2600), 1), g = G();
        pk.gain.value = 6;
        env(g, t, 0.002, 1, rnd(0.05, 0.09));
        n.connect(hp).connect(pk).connect(g).connect(out);
        const o = O('sine', rnd(150, 190), t, 0.16), g2 = G();
        o.frequency.exponentialRampToValueAtTime(50, t + 0.12);
        env(g2, t, 0.002, 0.8, 0.11);
        o.connect(g2).connect(out);
        return 0.16;
    },
    crack(t, out) {
        const n = N(t, 0.2), hp = F('highpass', 2600), g = G();
        env(g, t, 0.001, 1, 0.03);
        n.connect(hp).connect(g).connect(out);
        const n2 = N(t, 0.2), bp = F('bandpass', rnd(1500, 2200), 2), g2 = G();
        env(g2, t + 0.005, 0.002, 0.5, 0.13);
        n2.connect(bp).connect(g2).connect(out);
        return 0.18;
    },
    wet(t, out) {
        const n = N(t, 0.25), bp = F('bandpass', 1200, 4), g = G();
        bp.frequency.setValueAtTime(rnd(1000, 1500), t);
        bp.frequency.exponentialRampToValueAtTime(rnd(250, 400), t + 0.14);
        env(g, t, 0.006, 1.2, rnd(0.1, 0.16));
        n.connect(bp).connect(g).connect(out);
        const k = Math.floor(rnd(2, 5));
        for (let i = 0; i < k; i++) bubble(t + rnd(0.01, 0.12), out, rnd(0.25, 0.45));
        return 0.2;
    },
    suck(t, out) {
        const d = rnd(0.32, 0.45);
        const n = N(t, d), bp = F('bandpass', 500, 9), am = G(0.6), g = G();
        bp.frequency.setValueAtTime(rnd(400, 550), t);
        bp.frequency.linearRampToValueAtTime(rnd(1400, 1900), t + d * 0.5);
        bp.frequency.linearRampToValueAtTime(rnd(600, 800), t + d);
        const lfo = O('sine', rnd(18, 28), t, d), depth = G(0.4);
        lfo.connect(depth).connect(am.gain);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(1.6, t + 0.04);
        g.gain.setValueAtTime(1.6, t + d * 0.7);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        n.connect(bp).connect(am).connect(g).connect(out);
        bubble(t + d * 0.9, out, 0.3);
        return d + 0.05;
    },
    kiss(t, out) {
        const pop = (tt, v) => {
            const n = N(tt, 0.05), hp = F('highpass', 2200), g = G();
            env(g, tt, 0.001, v, 0.025);
            n.connect(hp).connect(g).connect(out);
            const o = O('sine', rnd(1500, 2000), tt, 0.05), g2 = G();
            o.frequency.exponentialRampToValueAtTime(rnd(400, 600), tt + 0.03);
            env(g2, tt, 0.001, v * 0.6, 0.035);
            o.connect(g2).connect(out);
        };
        pop(t, 0.7);
        pop(t + rnd(0.06, 0.1), 0.45);
        return 0.18;
    },
    throat(t, out, tok) {
        const gulp = /^g+u*l/.test(tok);
        const o = O('sine', gulp ? rnd(350, 420) : rnd(160, 200), t, 0.2), lp = F('lowpass', 900), g = G();
        o.frequency.exponentialRampToValueAtTime(gulp ? 110 : 80, t + 0.13);
        env(g, t, 0.005, 0.9, 0.14);
        o.connect(lp).connect(g).connect(out);
        const n = N(t, 0.2), lp2 = F('lowpass', gulp ? 600 : 450, 3), g2 = G();
        env(g2, t, 0.005, gulp ? 0.35 : 0.8, gulp ? 0.1 : 0.16);
        n.connect(lp2).connect(g2).connect(out);
        if (!gulp) {
            const s = O('sawtooth', rnd(85, 105), t, 0.2), ws = AC.createWaveShaper(), lp3 = F('lowpass', 700), g3 = G();
            ws.curve = DIST || (DIST = distCurve(30));
            env(g3, t, 0.01, 0.35, 0.16);
            s.connect(ws).connect(lp3).connect(g3).connect(out);
        }
        return 0.22;
    },
    moan(t, out, tok, raw) {
        const s = SX();
        let vowel = 'a';
        if (/o/.test(tok)) vowel = 'o';
        else if (/^[hmn]+g*h*$/.test(tok)) vowel = 'm';
        else if (/[iy]/.test(tok) && !/a/.test(tok)) vowel = 'i';
        else if (/u/.test(tok) && !/a/.test(tok)) vowel = 'u';
        const FORM = {
            a: [[800, 1, 8], [1150, 0.5, 9], [2900, 0.2, 10]],
            o: [[450, 1, 8], [800, 0.45, 9], [2830, 0.12, 10]],
            u: [[325, 1, 8], [700, 0.35, 9], [2530, 0.1, 10]],
            i: [[300, 1, 8], [2300, 0.4, 10], [3000, 0.25, 12]],
            m: [[300, 1, 5], [2000, 0.08, 8], [2700, 0.05, 10]],
        }[vowel];
        const female = s.voice !== 'grave';
        const shift = female ? 1.15 : 1;
        const f0 = female ? rnd(215, 265) : rnd(105, 135);
        const d = clamp(0.35 + tok.length * 0.07, 0.4, 1.8);
        const playful = /[~♡♥]/.test(raw);
        const mix = G(0.5);
        const o1 = O('sawtooth', f0, t, d), o2 = O('sawtooth', f0 * 1.007, t, d);
        for (const o of [o1, o2]) {
            o.frequency.setValueAtTime(f0 * 0.9, t);
            o.frequency.linearRampToValueAtTime(f0 * rnd(1.12, 1.25), t + d * 0.3);
            o.frequency.linearRampToValueAtTime(f0 * (playful ? 1.3 : 0.82), t + d);
            o.connect(mix);
        }
        const vib = O('sine', rnd(4.5, 6), t, d), vd = G(f0 * 0.025);
        vib.connect(vd); vd.connect(o1.frequency); vd.connect(o2.frequency);
        const br = N(t, d), brHp = F('highpass', 1200), brG = G(0.12);
        br.connect(brHp).connect(brG);
        const e = G();
        e.gain.setValueAtTime(0.0001, t);
        e.gain.exponentialRampToValueAtTime(1, t + 0.09);
        e.gain.linearRampToValueAtTime(0.75, t + d * 0.65);
        e.gain.exponentialRampToValueAtTime(0.0001, t + d);
        for (const [f, a, q] of FORM) {
            const bp = F('bandpass', f * shift, q), ga = G(a * 2.2);
            mix.connect(bp); brG.connect(bp);
            bp.connect(ga).connect(e);
        }
        e.connect(F('lowpass', 5000)).connect(out);
        return d;
    },
    breath(t, out, tok) {
        const short = /f/.test(tok);
        const d = short ? rnd(0.18, 0.25) : clamp(0.3 + tok.length * 0.05, 0.35, 0.8);
        const n = N(t, d), bp = F('bandpass', rnd(900, 1400), 0.8), lp = F('lowpass', 3500), g = G();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.8, t + d * 0.3);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        n.connect(bp).connect(lp).connect(g).connect(out);
        return d;
    },
    bed(t, out) {
        const d = rnd(0.25, 0.38);
        const n = N(t, d), g = G(0);
        const b1 = F('bandpass', rnd(550, 750), 14), b2 = F('bandpass', rnd(1300, 1600), 10), g1 = G(5), g2 = G(3);
        let tt = t, gap = rnd(0.006, 0.009);
        g.gain.setValueAtTime(0, t);
        while (tt < t + d) {
            g.gain.setValueAtTime(rnd(0.6, 1), tt);
            g.gain.setValueAtTime(0, tt + 0.0015);
            tt += gap;
            gap *= rnd(1.03, 1.08);
        }
        n.connect(g);
        g.connect(b1).connect(g1).connect(out);
        g.connect(b2).connect(g2).connect(out);
        return d;
    },
    heart(t, out) {
        const thump = (tt, v) => {
            const o = O('sine', 70, tt, 0.2), lp = F('lowpass', 200), g = G();
            o.frequency.exponentialRampToValueAtTime(38, tt + 0.12);
            env(g, tt, 0.006, v, 0.14);
            o.connect(lp).connect(g).connect(out);
        };
        thump(t, 1.4);
        thump(t + 0.17, 1.0);
        return 0.42;
    },
    growl(t, out) {
        const d = rnd(0.5, 0.75);
        const o = O('sawtooth', rnd(75, 95), t, d), am = G(0.5), lfo = O('square', rnd(24, 32), t, d), depth = G(0.5);
        o.frequency.linearRampToValueAtTime(rnd(60, 70), t + d);
        lfo.connect(depth).connect(am.gain);
        const lp = F('lowpass', 750, 2), g = G();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.9, t + 0.06);
        g.gain.setValueAtTime(0.9, t + d * 0.7);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(am).connect(lp).connect(g).connect(out);
        const n = N(t, d), nlp = F('lowpass', 400), ng = G(0.4);
        n.connect(nlp).connect(ng).connect(g);
        return d;
    },
    cloth(t, out, tok) {
        const zip = /^z/.test(tok), swish = /^s/.test(tok);
        const d = swish ? 0.3 : rnd(0.28, 0.42);
        const n = N(t, d), g = G(0);
        const f = swish ? F('bandpass', 700, 1.5) : F(zip ? 'bandpass' : 'highpass', zip ? 2000 : 1500, zip ? 3 : 0.7);
        if (swish || zip) {
            f.frequency.setValueAtTime(swish ? 600 : 1800, t);
            f.frequency.exponentialRampToValueAtTime(swish ? 2600 : 5500, t + d);
        }
        if (swish) {
            env(g, t, d * 0.4, 0.7, d * 0.6);
        } else {
            let tt = t;
            while (tt < t + d) {
                g.gain.setValueAtTime(rnd(zip ? 0.4 : 0.1, 1), tt);
                tt += zip ? 0.004 : rnd(0.003, 0.012);
            }
            g.gain.setValueAtTime(0, t + d);
        }
        n.connect(f).connect(g).connect(out);
        return d;
    },
    buzz(t, out, tok) {
        const d = clamp(0.4 + tok.length * 0.1, 0.6, 1.4);
        const f0 = rnd(135, 165);
        const o1 = O('sawtooth', f0, t, d), o2 = O('square', f0 * 2.01, t, d), o2g = G(0.3);
        const trem = O('sine', rnd(6, 9), t, d), td = G(0.15), am = G(0.85);
        trem.connect(td).connect(am.gain);
        const lp = F('lowpass', 1200, 5), g = G();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.35, t + 0.05);
        g.gain.setValueAtTime(0.35, t + d - 0.08);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o1.connect(am);
        o2.connect(o2g).connect(am);
        am.connect(lp).connect(g).connect(out);
        return d;
    },
    generic(t, out) {
        const o = O('sine', rnd(500, 700), t, 0.08), g = G();
        o.frequency.exponentialRampToValueAtTime(200, t + 0.06);
        env(g, t, 0.002, 0.6, 0.06);
        o.connect(g).connect(out);
        return 0.1;
    },
};

// ---------- Sons personalizados (pasta sounds/ + sounds.json) ----------
async function loadCustom() {
    try {
        const res = await fetch(new URL('sounds/sounds.json', BASE_URL), { cache: 'no-cache' });
        if (!res.ok) return;
        const map = await res.json();
        const folder = new URL('sounds/', BASE_URL);
        for (const [type, files] of Object.entries(map)) {
            if (!Array.isArray(files)) continue;
            CUSTOM[type] = [];
            for (const f of files) {
                try {
                    const r = await fetch(new URL(f, folder));
                    if (!r.ok) continue;
                    CUSTOM[type].push(await AC.decodeAudioData(await r.arrayBuffer()));
                } catch (e) {
                    console.warn('[SmutForge SFX] falha ao carregar', f, e);
                }
            }
        }
        console.log('[SmutForge SFX] sons personalizados carregados', Object.keys(CUSTOM));
    } catch (e) {
        // sem sons personalizados: tudo bem, usa os sintetizados
    }
}

function playBuffer(buf, t, out) {
    const s = AC.createBufferSource();
    s.buffer = buf;
    s.playbackRate.value = rnd(0.94, 1.06);
    s.connect(out);
    s.start(t);
    return buf.duration / s.playbackRate.value;
}

function playOne(type, raw, t) {
    const out = bus(rnd(-1, 1) * (Number(SX().stereo) / 100) * 0.8);
    const custom = CUSTOM[type];
    if (custom && custom.length) return playBuffer(custom[Math.floor(Math.random() * custom.length)], t, out);
    const fn = SYNTH[type] || SYNTH.generic;
    return fn(t, out, normTok(raw) || 'x', String(raw));
}

// Toca a onomatopeia inteira (ex.: "PLAP PLAP PLAP" = 3 batidas). Devolve a duração total.
export function playSfx(type, text, delay = 0) {
    if (!SX().sound) return 0;
    const ac = audio();
    if (!ac) return 0;
    const toks = tokensOf(text).slice(0, 6);
    if (!toks.length) toks.push(String(text));
    const start = ac.currentTime + 0.03 + delay;
    let t = start;
    for (const tk of toks) {
        try {
            const d = playOne(type, tk, t);
            t += d * rnd(0.75, 0.95) + rnd(0.04, 0.1);
        } catch (e) {
            console.warn('[SmutForge SFX]', e);
        }
    }
    return t - start;
}

// ---------- Visual: transforma onomatopeias do chat em botões estilizados ----------
const RE_MARK = /\[\[([^\[\]\n]{1,80})\]\]/g;
const RE_ALL = /\[\[([^\[\]\n]{1,80})\]\]|(?<![\p{L}\p{N}])(\p{L}+(?:-\p{L}+)*[~♡♥]*)(?![\p{L}\p{N}])/gu;
const SKIP = 'code, pre, textarea, script, style, .sf-sfx, .sf-playall';

function makeSpan(text, type) {
    const sp = document.createElement('span');
    sp.className = 'sf-sfx sf-t-' + type;
    sp.dataset.sfx = type;
    sp.dataset.text = text;
    sp.title = ((TYPES[type] && TYPES[type].label) || 'Som') + ' — clique para ouvir 🔊';
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
    el.querySelectorAll('p').forEach(p => {
        if (!p.querySelector('.sf-sfx') || p.classList.contains('sf-sfx-line')) return;
        const clone = p.cloneNode(true);
        clone.querySelectorAll('.sf-sfx').forEach(x => x.remove());
        if (!/[\p{L}\p{N}]/u.test(clone.textContent)) p.classList.add('sf-sfx-line');
    });
    if (spans.length >= 2 && s.sound && !el.querySelector('.sf-playall')) {
        const b = document.createElement('div');
        b.className = 'sf-playall';
        b.textContent = '🔊 Tocar os sons desta mensagem';
        el.appendChild(b);
    }
}

function popFx(sp) {
    sp.classList.remove('sf-pop');
    void sp.offsetWidth;
    sp.classList.add('sf-pop');
    if (SX().anim && ['impact', 'crack', 'bed', 'growl'].includes(sp.dataset.sfx)) {
        const mes = sp.closest('.mes');
        if (mes) {
            mes.classList.remove('sf-shake');
            void mes.offsetWidth;
            mes.classList.add('sf-shake');
        }
    }
}

export function playAll(el) {
    if (!el) return;
    const spans = Array.from(el.querySelectorAll('.sf-sfx')).slice(0, 24);
    let delay = 0;
    for (const sp of spans) {
        const myDelay = delay;
        const d = playSfx(sp.dataset.sfx, sp.dataset.text || sp.textContent, myDelay);
        setTimeout(() => popFx(sp), myDelay * 1000);
        delay += d + rnd(0.2, 0.45);
        if (delay > 15) break;
    }
}

// Observa o chat (mensagens novas, streaming, edições, swipes)
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

function reprocessAll() {
    document.querySelectorAll('#chat .mes_text').forEach(el => {
        try { processMes(el); } catch (e) { console.warn('[SmutForge SFX]', e); }
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

function applyBodyClasses() {
    const s = SX();
    document.body.classList.toggle('sf-novisual', !s.visual);
    document.body.classList.toggle('sf-noanim', !s.anim);
}

// ---------- Painel de configurações ----------
function settingsHtml() {
    const board = Object.entries(TYPES).map(([k, t]) =>
        `<span class="sf-sfx sf-t-${k} sf-board" data-sfx="${k}" data-text="${t.sample}" title="${t.label} — clique: ouvir | Shift+clique: inserir na sua mensagem">${t.sample}</span>`,
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
          <label for="sfx_voice">Voz dos gemidos sintetizados</label>
          <select id="sfx_voice" class="text_pole">
            <option value="aguda">Aguda</option>
            <option value="grave">Grave</option>
          </select>
          <label for="sfx_volume">Volume</label>
          <input id="sfx_volume" type="range" min="0" max="100">
          <label for="sfx_stereo">Estéreo (sons passeando entre os fones)</label>
          <input id="sfx_stereo" type="range" min="0" max="100">
          <label for="sfx_room">Eco do quarto (ambiente)</label>
          <input id="sfx_room" type="range" min="0" max="100">
        </div>
      </div>
    </div>`;
}

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
        if (key === 'autodetect' || key === 'sound') reprocessAll();
    });
}

function registerSlash() {
    const c = ctx();
    const P = c.SlashCommandParser, Cmd = c.SlashCommand, Arg = c.SlashCommandArgument, T = c.ARGUMENT_TYPE;
    if (!P || !Cmd || !Arg || !T) return;
    P.addCommandObject(Cmd.fromProps({
        name: 'sfx',
        callback: (_a, v) => {
            const text = String(v || 'PLAP').trim();
            playSfx(classify(text, true), text);
            return '';
        },
        unnamedArgumentList: [Arg.fromProps({ description: 'onomatopeia', typeList: [T.STRING], isRequired: false })],
        helpString: 'Toca o som de uma onomatopeia. Ex: <code>/sfx PLAP PLAP</code>, <code>/sfx aahn~</code>',
    }));
}

// ---------- Inicialização ----------
let autoplayId = null;
function fireAutoplay(id) {
    autoplayId = null;
    const el = document.querySelector(`#chat .mes[mesid="${id}"] .mes_text`);
    if (!el) return;
    processMes(el);
    playAll(el);
}

function init() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL('sfx.css', BASE_URL).href;
    document.head.appendChild(link);

    let $target = $('#extensions_settings2');
    if (!$target.length) $target = $('#extensions_settings');
    $('#smutforge_sfx_settings').remove();
    $target.append(settingsHtml());

    bind('sfx_prompt', 'prompt');
    bind('sfx_density', 'density');
    bind('sfx_visual', 'visual');
    bind('sfx_anim', 'anim');
    bind('sfx_autodetect', 'autodetect');
    bind('sfx_sound', 'sound');
    bind('sfx_autoplay', 'autoplay');
    bind('sfx_voice', 'voice');
    bind('sfx_volume', 'volume', Number);
    bind('sfx_stereo', 'stereo', Number);
    bind('sfx_room', 'room', Number);
    applyBodyClasses();

    $(document).on('click', '.sf-sfx', function (e) {
        if (e.shiftKey && this.classList.contains('sf-board')) { insertIntoInput(this.dataset.text); return; }
        e.stopPropagation();
        playSfx(this.dataset.sfx, this.dataset.text || this.textContent);
        popFx(this);
    });
    $(document).on('click', '.sf-playall', function (e) {
        e.stopPropagation();
        playAll(this.closest('.mes_text'));
    });

    // O navegador só libera áudio depois do primeiro clique/tecla
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
        if (!SX().autoplay || !SX().sound || type === 'quiet' || type === 'first_message') return;
        autoplayId = Number(id);
        setTimeout(() => { if (autoplayId === Number(id)) fireAutoplay(id); }, 1500);
    });
    if (et.CHARACTER_MESSAGE_RENDERED) {
        ev.on(et.CHARACTER_MESSAGE_RENDERED, (id) => {
            if (autoplayId !== null && Number(id) === autoplayId) setTimeout(() => fireAutoplay(id), 100);
        });
    }

    try { registerSlash(); } catch (e) { console.warn('[SmutForge SFX] /sfx não registrado', e); }
    startObserver();
    reprocessAll();
    console.log('[SmutForge SFX] carregado 🔊');
}

jQuery(() => {
    try {
        init();
    } catch (e) {
        console.error('[SmutForge SFX] erro ao iniciar', e);
        toastr.error('Smut Forge SFX: ' + (e && e.message ? e.message : e), 'Erro ao carregar', { timeOut: 0, extendedTimeOut: 0 });
    }
});
