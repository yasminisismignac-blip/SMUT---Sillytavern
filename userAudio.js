import { TYPES, SX, audio, setUserSounds, testMix, stopAll, testTts, refVoiceName, refreshTtsUi } from './sfx.js';

const ctx = () => SillyTavern.getContext();
const DB_NAME = 'smut_forge_audio';
const STORE = 'files';

let items = [];

function openDB() {
    return new Promise((res, rej) => {
        const r = indexedDB.open(DB_NAME, 1);
        r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: 'id' });
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
    });
}
async function dbAll() {
    const db = await openDB();
    return new Promise((res, rej) => {
        const q = db.transaction(STORE).objectStore(STORE).getAll();
        q.onsuccess = () => res(q.result);
        q.onerror = () => rej(q.error);
    });
}
async function dbPut(item) {
    const db = await openDB();
    return new Promise((res, rej) => {
        const t = db.transaction(STORE, 'readwrite');
        t.objectStore(STORE).put(item);
        t.oncomplete = () => res();
        t.onerror = () => rej(t.error);
    });
}
async function dbDelete(id) {
    const db = await openDB();
    return new Promise((res, rej) => {
        const t = db.transaction(STORE, 'readwrite');
        t.objectStore(STORE).delete(id);
        t.oncomplete = () => res();
        t.onerror = () => rej(t.error);
    });
}

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const NAME_RULES = [
    ['crack', /crack|estalo|whip|chicote|snap/],
    ['impact', /plap|tapa|slap|impact|impacto|spank|bate|smack|thud/],
    ['suck', /suck|chup|slurp|lamb|lick/],
    ['kiss', /kiss|beij|muah|smooch/],
    ['throat', /gulp|throat|garganta|engol|gag|glk/],
    ['wet', /wet|molh|squelch|shlick|chlap|splash|squish|slosh/],
    ['breath', /breath|ofeg|respir|pant|haah/],
    ['moan', /moan|gemid|aah|ahn|mmm|ngh|voz/],
    ['bed', /bed|cama|creak|rang|squeak/],
    ['heart', /heart|coracao|batim|tudum/],
    ['growl', /growl|rosn|grr|rawr/],
    ['cloth', /cloth|tecid|rip|zip|roupa|fabric/],
    ['buzz', /buzz|vibr|toy/],
];
function detectType(name, dur) {
    const n = norm(name);
    for (const [type, re] of NAME_RULES) if (re.test(n)) return type;
    if (dur < 0.6) return 'impact';
    if (dur < 1.5) return 'wet';
    return 'moan';
}

async function analyze(file) {
    const ac = audio();
    if (!ac) throw new Error('Seu navegador não suporta áudio.');
    const buf = await ac.decodeAudioData(await file.arrayBuffer());
    const d = buf.getChannelData(0);
    let peak = 0;
    for (let i = 0; i < d.length; i += 2) { const a = Math.abs(d[i]); if (a > peak) peak = a; }
    const th = Math.max(0.003, peak * 0.1);
    let sum = 0, n = 0;
    for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a >= th) { sum += a * a; n++; } }
    return { dur: buf.duration, rms: n ? Math.sqrt(sum / n) : 0 };
}

function assignLevels() {
    const groups = {};
    items.filter(i => i.kind === 'sfx').forEach(i => (groups[i.type] = groups[i.type] || []).push(i));
    for (const list of Object.values(groups)) {
        if (list.length >= 3) {
            list.sort((a, b) => a.rms - b.rms);
            list.forEach((it, idx) => { it.level = idx < list.length / 3 ? 'soft' : (idx < list.length * 2 / 3 ? 'med' : 'hard'); });
        } else {
            list.forEach(it => { it.level = it.rms < 0.08 ? 'soft' : (it.rms < 0.2 ? 'med' : 'hard'); });
        }
    }
}

function syncEngine() {
    assignLevels();
    setUserSounds(items.map(i => ({ id: i.id, kind: i.kind, type: i.type, level: i.level, name: i.name, blob: i.blob, char: i.char, dur: i.dur })));
    updateRefInfo();
}

async function doImport(files, kind) {
    const list = Array.from(files || []);
    if (!list.length) return;
    const char = kind === 'voice' ? (ctx().name2 || '') : '';
    let ok = 0, fail = [];
    for (const f of list) {
        try {
            const a = await analyze(f);
            await dbPut({
                id: newId(), kind, name: f.name, char,
                type: kind === 'sfx' ? detectType(f.name, a.dur) : '',
                dur: a.dur, rms: a.rms, blob: f,
            });
            ok++;
        } catch (e) {
            console.warn('[SmutForge Áudio] erro ao importar', f.name, e);
            fail.push(f.name);
        }
    }
    items = await dbAll();
    render();
    syncEngine();
    if (ok) toastr.success(`${ok} arquivo(s) importado(s) 🎧`, '🎧 Smut Forge', { timeOut: 3000 });
    if (fail.length) toastr.warning('Não consegui ler: ' + fail.slice(0, 5).join(', ') + ' (use .mp3 ou .wav)', '🎧 Smut Forge', { timeOut: 10000 });
}

const LV = { soft: '🌙 suave', med: '⚖️ normal', hard: '🔥 forte' };
const typeOptions = (sel) => Object.entries(TYPES).map(([k, t]) => [k, t.label]).concat([['generic', 'Outros']])
    .map(([k, label]) => `<option value="${k}"${k === sel ? ' selected' : ''}>${label}</option>`).join('');

function render() {
    assignLevels();
    const sfx = items.filter(i => i.kind === 'sfx');
    const voices = items.filter(i => i.kind === 'voice');

    const $s = $('#sfa_list_sfx').empty();
    if (!sfx.length) $s.append('<div class="sfa-empty">Nenhum efeito importado ainda.</div>');
    sfx.forEach(it => {
        const row = $('<div class="sfa-item"></div>');
        row.append($('<span class="sfa-name"></span>').text(it.name).attr('title', it.name));
        row.append($('<small class="sfa-meta"></small>').text(`${it.dur.toFixed(1)}s · ${LV[it.level] || ''}`));
        const sel = $(`<select class="text_pole sfa-type" title="Categoria (troque se o programa errou)">${typeOptions(it.type)}</select>`);
        sel.on('change', async function () {
            it.type = this.value;
            await dbPut(it);
            render();
            syncEngine();
        });
        row.append(sel);
        row.append($('<span class="sfa-del" title="Apagar">✖</span>').on('click', () => removeItem(it.id)));
        $s.append(row);
    });

    const $v = $('#sfa_list_voice').empty();
    if (!voices.length) $v.append('<div class="sfa-empty">Nenhuma voz importada ainda.</div>');
    voices.forEach(it => {
        const row = $('<div class="sfa-item"></div>');
        row.append($('<span class="sfa-name"></span>').text(it.name).attr('title', it.name));
        row.append($('<small class="sfa-meta"></small>').text(`${it.dur.toFixed(1)}s${it.char ? ' · ' + it.char : ''}`));
        row.append($('<span class="sfa-del" title="Apagar">✖</span>').on('click', () => removeItem(it.id)));
        $v.append(row);
    });
}

async function removeItem(id) {
    await dbDelete(id);
    items = await dbAll();
    render();
    syncEngine();
}

function updateRefInfo() {
    const r = refVoiceName(ctx().name2 || '');
    $('#sfa_tts_ref').text(r
        ? `🎤 Referência enviada ao TTS: ${r.name}${r.dur ? ` (${r.dur.toFixed(1)}s)` : ''}`
        : '⚠️ Nenhuma voz importada — importe na seção 2 um áudio limpo de 6–30 s da voz do personagem.');
}

const LANGS = [['pt', 'Português (pt)'], ['en', 'English (en)'], ['es', 'Español (es)'], ['fr', 'Français (fr)'], ['de', 'Deutsch (de)'],
    ['it', 'Italiano (it)'], ['ja', '日本語 (ja)'], ['ko', '한국어 (ko)'], ['zh-cn', '中文 (zh-cn)'], ['ru', 'Русский (ru)']];

function html() {
    return `
    <div id="smutforge_audio_settings">
      <div class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header">
          <b>🎧 Smut Forge — Meus áudios</b>
          <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="inline-drawer-content">
          <div class="sfa-title">1) Efeitos sonoros (SFX)</div>
          <div class="menu_button sfa-big" id="sfa_btn_sfx">🎵 Importar Áudio de Efeito (SFX)</div>
          <input type="file" id="sfa_file_sfx" accept=".mp3,.wav,.ogg,audio/*" multiple hidden>
          <div id="sfa_list_sfx" class="sfa-list"></div>

          <div class="sfa-title">2) Voz do personagem</div>
          <div class="menu_button sfa-big" id="sfa_btn_voice">🎤 Importar Voz do Personagem (.mp3 / .wav)</div>
          <input type="file" id="sfa_file_voice" accept=".mp3,.wav,.ogg,audio/*" multiple hidden>
          <div id="sfa_list_voice" class="sfa-list"></div>

          <div class="sfa-title">3) Mixagem</div>
          <label class="checkbox_label"><input type="checkbox" id="sfa_autoplay"><span>Tocar sozinho quando a resposta chegar</span></label>
          <label class="checkbox_label"><input type="checkbox" id="sfa_voice"><span>Tocar a voz importada junto com os efeitos</span></label>
          <label for="sfa_voiceVol">Volume da voz</label>
          <input id="sfa_voiceVol" type="range" min="0" max="150">
          <small>Volume dos efeitos, variação de volume e variação de tom ficam no outro painel: "Smut Forge — Sons &amp; Visual".</small>
          <div class="sfa-btns">
            <div class="menu_button" id="sfa_test">▶ Testar mixagem</div>
            <div class="menu_button" id="sfa_stop">⏹ Parar</div>
          </div>

          <div class="sfa-title">4) Narração por TTS externo (XTTS / Colab)</div>
          <label class="checkbox_label"><input type="checkbox" id="sfa_ttsOn"><span>🎙️ Narrar as respostas com o servidor TTS (sincronizado com os SFX)</span></label>
          <label for="sfa_ttsUrl">URL da API do TTS</label>
          <input id="sfa_ttsUrl" class="text_pole" type="text" placeholder="https://xxxx.trycloudflare.com/tts" autocomplete="off" spellcheck="false">
          <small>Cole a URL completa do endpoint (com o caminho, ex.: <code>/tts</code>). O servidor precisa aceitar <code>POST</code> e liberar CORS.</small>
          <div class="sfx-row2">
            <div>
              <label for="sfa_ttsLang">Idioma da narração</label>
              <select id="sfa_ttsLang" class="text_pole">${LANGS.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select>
            </div>
            <div>
              <label for="sfa_ttsMode">Formato do envio</label>
              <select id="sfa_ttsMode" class="text_pole">
                <option value="multipart">multipart/form-data (arquivo de referência)</option>
                <option value="json">JSON (referência em base64)</option>
              </select>
            </div>
          </div>
          <label for="sfa_ttsScope">O que narrar</label>
          <select id="sfa_ttsScope" class="text_pole">
            <option value="all">📖 Tudo (descrições + falas)</option>
            <option value="dialogue">💬 Apenas diálogos (entre aspas)</option>
          </select>
          <label for="sfa_ttsVol">Volume da narração</label>
          <input id="sfa_ttsVol" type="range" min="0" max="200">
          <small id="sfa_tts_ref"></small>
          <details>
            <summary>⚙️ Avançado</summary>
            <div class="sfx-row2">
              <div><label for="sfa_ttsFieldText">Campo do texto</label><input id="sfa_ttsFieldText" class="text_pole" type="text"></div>
              <div><label for="sfa_ttsFieldLang">Campo do idioma</label><input id="sfa_ttsFieldLang" class="text_pole" type="text"></div>
              <div><label for="sfa_ttsFieldRef">Campo do áudio</label><input id="sfa_ttsFieldRef" class="text_pole" type="text"></div>
            </div>
            <div class="sfx-row2">
              <div><label for="sfa_ttsMaxChars">Máx. caracteres por pedido</label><input id="sfa_ttsMaxChars" class="text_pole" type="number" min="60" max="400" step="10"></div>
              <div><label for="sfa_ttsTimeout">Timeout (segundos)</label><input id="sfa_ttsTimeout" class="text_pole" type="number" min="10" max="600" step="5"></div>
            </div>
          </details>
          <div class="sfa-btns">
            <div class="menu_button" id="sfa_tts_test">🧪 Testar conexão e voz</div>
          </div>
        </div>
      </div>
    </div>`;
}

function bindField(id, key, { parse = (v) => v, after } = {}) {
    const $el = $('#' + id);
    const isCb = $el.is(':checkbox');
    if (isCb) $el.prop('checked', !!SX()[key]); else $el.val(SX()[key]);
    $el.on('input change', () => {
        SX()[key] = parse(isCb ? $el.prop('checked') : $el.val());
        ctx().saveSettingsDebounced();
        if (after) after();
    });
}

function bindCheckbox(id, key) {
    const $el = $('#' + id);
    $el.prop('checked', !!SX()[key]);
    $el.on('change', () => {
        SX()[key] = $el.prop('checked');
        ctx().saveSettingsDebounced();
        if (key === 'autoplay') $('#sfx_autoplay').prop('checked', SX().autoplay);
    });
}

async function init() {
    $('#smutforge_audio_settings').remove();
    let $target = $('#extensions_settings2');
    if (!$target.length) $target = $('#extensions_settings');
    $target.append(html());

    bindCheckbox('sfa_autoplay', 'autoplay');
    bindCheckbox('sfa_voice', 'voice');
    const $vol = $('#sfa_voiceVol');
    $vol.val(SX().voiceVol);
    $vol.on('input change', () => { SX().voiceVol = Number($vol.val()); ctx().saveSettingsDebounced(); });

    const trim = (v) => String(v).trim();
    bindField('sfa_ttsOn', 'ttsEnabled', { after: () => refreshTtsUi(true) });
    bindField('sfa_ttsUrl', 'ttsUrl', { parse: trim, after: () => refreshTtsUi(true) });
    bindField('sfa_ttsLang', 'ttsLang');
    bindField('sfa_ttsMode', 'ttsMode');
    bindField('sfa_ttsScope', 'ttsScope', { after: () => refreshTtsUi(false) });
    bindField('sfa_ttsVol', 'ttsVol', { parse: Number, after: () => refreshTtsUi(false) });
    bindField('sfa_ttsFieldText', 'ttsFieldText', { parse: trim });
    bindField('sfa_ttsFieldLang', 'ttsFieldLang', { parse: trim });
    bindField('sfa_ttsFieldRef', 'ttsFieldRef', { parse: trim });
    bindField('sfa_ttsMaxChars', 'ttsMaxChars', { parse: Number });
    bindField('sfa_ttsTimeout', 'ttsTimeout', { parse: Number });
    $('#sfa_tts_test').on('click', () => testTts(ctx().name2 || ''));

    $('#sfa_btn_sfx').on('click', () => $('#sfa_file_sfx').trigger('click'));
    $('#sfa_btn_voice').on('click', () => $('#sfa_file_voice').trigger('click'));
    $('#sfa_file_sfx').on('change', async function () { await doImport(this.files, 'sfx'); this.value = ''; });
    $('#sfa_file_voice').on('change', async function () { await doImport(this.files, 'voice'); this.value = ''; });
    $('#sfa_test').on('click', () => testMix(ctx().name2 || ''));
    $('#sfa_stop').on('click', stopAll);

    try {
        items = await dbAll();
    } catch (e) {
        console.warn('[SmutForge Áudio] não consegui abrir os arquivos salvos', e);
        items = [];
    }
    render();
    syncEngine();

    try {
        const c = ctx();
        const et = c.eventTypes || c.event_types;
        if (et && et.CHAT_CHANGED) c.eventSource.on(et.CHAT_CHANGED, updateRefInfo);
    } catch (e) { }

    console.log('[SmutForge Áudio] pronto 🎧');
}

jQuery(() => {
    init().catch(e => {
        console.error('[SmutForge Áudio] erro ao iniciar', e);
        toastr.error('Meus áudios: ' + (e && e.message ? e.message : e), 'Erro ao carregar', { timeOut: 0, extendedTimeOut: 0 });
    });
});
