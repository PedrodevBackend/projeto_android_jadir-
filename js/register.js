/* EsgotoZero · registro de ocorrência em 3 etapas (local → o que viu → revisão).
   - Pino fixo no centro: a pessoa arrasta o mapa até o ponto (padrão de apps de mobilidade).
   - Cidade detectada automaticamente entre os 5.570 municípios; busca por cidade e por endereço.
   - Aviso de relatos parecidos por perto, com opção de confirmar em vez de duplicar.
   - Rascunho salvo automaticamente; foto reduzida no próprio aparelho antes de salvar. */
'use strict';
(function () {
  const EZ = window.EZ, { $, $$, esc, icon, norm, fmtCoord, fmtKm, haversine, fmtShort, debounce, ago } = EZ.u;
  const C = EZ.cmp;
  let W = null, picker = null, photonCtl = null;
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const MIN_ZOOM = 14;
  const blank = () => ({ step: 1, lat: null, lng: null, zoom: null, city: '', uf: '', cityAuto: true, water: '', waterName: '', place: '', category: '', signs: [], severity: 'media', ongoing: false, title: '', titleAuto: true, description: '', observed: today(), photo: null, photoName: '', photoConsent: false, consent: false, savedAt: null });
  const saveDraft = debounce(() => { if (W && !W.done) { W.savedAt = new Date().toISOString(); EZ.store.draft.set(W); } }, 400);

  EZ.startRegister = (opts = {}) => {
    const d = EZ.store.draft.get();
    EZ.mun.load().catch(() => { /* segue sem detecção automática */ });
    if (d && d.step && !opts.fresh && (d.category || d.place || d.description || d.lat)) {
      EZ.ui.modal.open({
        title: 'Continuar o rascunho?', subtitle: `Você começou um relato ${d.savedAt ? ago(d.savedAt) : 'antes'}.`,
        body: `<div class="draft-box">${icon('FileText')}<div><b>${esc(d.title || (EZ.CATEGORY[d.category] || {}).label || 'Relato sem título')}</b><small>${esc([d.city && d.city + '/' + d.uf, d.place].filter(Boolean).join(' · ') || 'Local ainda não marcado')}</small></div></div>`,
        footer: `<button type="button" class="btn btn-ghost" data-action="draft-discard">Começar de novo</button><button type="button" class="btn btn-primary" data-action="draft-resume">${icon('ArrowRight')}Continuar</button>`
      });
      return;
    }
    W = { ...blank(), ...(opts.preset || {}) };
    render();
  };
  EZ.resumeDraft = () => { W = { ...blank(), ...EZ.store.draft.get(), consent: false }; render(); };
  EZ.discardDraft = () => { EZ.store.draft.clear(); W = blank(); render(); };

  function header() {
    const steps = ['Local', 'O que você viu', 'Revisão'];
    return `<div class="wz-progress" aria-label="Etapa ${W.step} de 3">${steps.map((s, i) => `<div class="wz-step${W.step === i + 1 ? ' is-now' : W.step > i + 1 ? ' is-done' : ''}"><span class="wz-bar"></span><span class="wz-lbl"><b>${W.step > i + 1 ? icon('Check') : i + 1}</b>${s}</span></div>`).join('')}</div>`;
  }

  function render(error = '') {
    if (!W) return;
    destroyPicker();
    const titles = { 1: ['Onde você viu?', 'Arraste o mapa até o ponto exato ou use sua localização.'], 2: ['O que você viu?', 'Quanto mais detalhes, mais fácil acompanhar.'], 3: ['Revise e envie', 'Confira as informações antes de enviar.'] };
    const [t, sub] = titles[W.step];
    const err = error ? `<p class="form-error" role="alert">${icon('CircleAlert')}${esc(error)}</p>` : '';
    const body = header() + err + (W.step === 1 ? step1() : W.step === 2 ? step2() : step3());
    const footer = `${W.step > 1 ? `<button type="button" class="btn btn-ghost" data-action="wz-back">${icon('ArrowLeft')}Voltar</button>` : `<button type="button" class="btn btn-ghost" data-close>Cancelar</button>`}
      <span class="wz-save" aria-live="polite">${W.savedAt ? icon('Check') + 'Rascunho salvo' : ''}</span>
      <button type="submit" form="wz-form" class="btn btn-primary" id="wz-next">${W.step === 3 ? icon('Send') + 'Enviar relato' : 'Continuar' + icon('ArrowRight')}</button>`;
    EZ.ui.modal.open({ title: `<span class="wz-kicker">Registrar ocorrência · etapa ${W.step} de 3</span>${t}`, subtitle: sub, body, footer, cls: 'dlg-wizard wz-s' + W.step, onClose: () => { destroyPicker(); saveDraft(); } });
    if (W.step === 1) mountStep1();
    if (W.step === 2) mountStep2();
    if (W.step === 3) mountStep3();
  }

  /* ---------------- Etapa 1: local ---------------- */
  function step1() {
    return `<form id="wz-form" class="wz-form wz-grid" novalidate>
      <div class="pick">
        <div class="pick-search"><label class="search-field">${icon('Search')}<input id="wz-q" type="search" autocomplete="off" placeholder="Buscar cidade ou endereço" aria-label="Buscar cidade ou endereço" aria-controls="wz-q-list"></label><div class="pick-results" id="wz-q-list" role="listbox" hidden></div></div>
        <div class="pick-map">
          <div id="wz-map" class="map"></div>
          <div class="pick-pin" aria-hidden="true">${EZ.pinHTML({ status: 'novo', category: W.category || 'outro' }, { selected: true }).replace('st-novo', 'st-novo pin-center')}<span class="pick-shadow"></span></div>
          <div class="pick-hint" id="pick-hint">${icon('Hand')}Arraste o mapa para posicionar o pino</div>
          <div class="pick-tools"><button type="button" class="tool" data-action="wz-locate" aria-label="Usar minha localização" data-tip="Usar minha localização">${icon('LocateFixed')}</button><button type="button" class="tool" data-action="wz-layer" aria-label="Alternar satélite e mapa" data-tip="Satélite / mapa">${icon('Layers')}</button><div class="tool-col"><button type="button" data-action="wz-zoom-in" aria-label="Aproximar">${icon('Plus')}</button><button type="button" data-action="wz-zoom-out" aria-label="Afastar">${icon('Minus')}</button></div></div>
          <div class="pick-coords" id="pick-coords"><span class="mono">—</span></div>
        </div>
      </div>
      <div class="pick-side">
        <div class="detected" id="wz-city"></div>
        <fieldset class="field"><legend>Onde fica? *</legend><div class="chipset">${EZ.WATER.map(w => `<label class="pchip"><input type="radio" name="water" value="${w.key}" ${W.water === w.key ? 'checked' : ''}><span>${w.label}</span></label>`).join('')}</div></fieldset>
        <label class="field"><span>Nome do rio, canal, praia… <em>(opcional)</em></span><input id="wz-waterName" name="waterName" maxlength="80" value="${esc(W.waterName)}" placeholder="Ex.: Rio Tietê, Canal 3, Praia de Ramos"></label>
        <label class="field"><span>Ponto de referência *</span><input id="wz-place" name="place" maxlength="120" value="${esc(W.place)}" placeholder="Ex.: embaixo da ponte da Av. Brasil" required></label>
        <details class="manual"><summary>${icon('Crosshair')}Informar coordenadas</summary><div class="grid-2"><label class="field"><span>Latitude</span><input id="wz-lat" inputmode="decimal" placeholder="-23.5505" value="${W.lat ?? ''}"></label><label class="field"><span>Longitude</span><input id="wz-lng" inputmode="decimal" placeholder="-46.6333" value="${W.lng ?? ''}"></label></div><button type="button" class="btn btn-outline btn-sm" data-action="wz-apply-coords">Posicionar no mapa</button></details>
        <div id="wz-near"></div>
        <p class="notice">${icon('ShieldCheck')}Marque o lugar observado, não o endereço de uma casa. Não informe nomes de pessoas ou empresas.</p>
      </div></form>`;
  }

  function mountStep1() {
    const el = $('#wz-map');
    const start = W.lat != null ? [W.lat, W.lng] : EZ.state.userPos ? [EZ.state.userPos.lat, EZ.state.userPos.lng] : scopeCenter();
    const z = W.zoom || (W.lat != null || EZ.state.userPos ? 16 : startZoom());
    if (window.L) {
      picker = EZ.createPicker(el, { center: start, zoom: z, onMove: c => showCoords(c.lat, c.lng), onIdle: (c, zz) => idle(c.lat, c.lng, zz) });
      showCoords(start[0], start[1]); idle(start[0], start[1], z);
    } else {
      el.innerHTML = `<div class="map-error">${icon('WifiOff')}<p>Mapa indisponível. Busque a cidade e informe as coordenadas em “Informar coordenadas”.</p></div>`;
      $('.pick-pin').hidden = true;
    }
    renderCity();
    const q = $('#wz-q'), list = $('#wz-q-list');
    q.addEventListener('input', debounce(() => search(q.value), 160));
    q.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); const first = $('.pr-item', list); if (first) first.click(); } if (e.key === 'Escape' && !list.hidden) { e.stopPropagation(); list.hidden = true; } });
    list.addEventListener('click', e => { const b = e.target.closest('.pr-item'); if (!b) return; list.hidden = true; q.value = b.dataset.label; const zz = Number(b.dataset.z); if (picker) picker.goto(+b.dataset.lat, +b.dataset.lng, zz); else { W.lat = +b.dataset.lat; W.lng = +b.dataset.lng; } if (b.dataset.city) { W.city = b.dataset.city; W.uf = b.dataset.uf; W.cityAuto = true; renderCity(); } saveDraft(); });
    $$('#wz-form input').forEach(i => i.addEventListener('input', () => { capture(); saveDraft(); }));
  }
  const scopeCenter = () => { const s = EZ.state.f.scope; if (s.type === 'uf' && EZ.UFS[s.v]) return [EZ.UFS[s.v].lat, EZ.UFS[s.v].lng]; if (s.type === 'city') { const r = EZ.store.reports.find(x => `${x.city}|${x.uf}` === s.v); if (r) return [r.lat, r.lng]; } return [-15.8, -50.5]; };
  const startZoom = () => { const s = EZ.state.f.scope; return s.type === 'city' ? 13 : s.type === 'uf' ? (EZ.UFS[s.v] || {}).z || 6 : 4; };
  function showCoords(lat, lng) { const el = $('#pick-coords .mono'); if (el) el.textContent = fmtCoord(lat, lng); }
  function idle(lat, lng, z) {
    if (!W) return;
    W.lat = +lat.toFixed(6); W.lng = +lng.toFixed(6); W.zoom = z;
    const hint = $('#pick-hint');
    if (hint) { hint.classList.toggle('is-warn', z < MIN_ZOOM); hint.innerHTML = z < MIN_ZOOM ? `${icon('ZoomIn')}Aproxime mais o mapa para marcar o ponto exato` : `${icon('CircleCheck')}Ponto marcado. Ajuste se precisar.`; }
    const li = $('#wz-lat'), lo = $('#wz-lng'); if (li && document.activeElement !== li) li.value = W.lat; if (lo && document.activeElement !== lo) lo.value = W.lng;
    if (W.cityAuto && z >= 9) EZ.mun.load().then(() => { const c = EZ.mun.nearest(lat, lng); if (c && W && W.cityAuto) { W.city = c.name; W.uf = c.uf; renderCity(); } }).catch(() => { });
    renderNear(); saveDraft();
  }
  function renderCity() {
    const box = $('#wz-city'); if (!box) return;
    box.innerHTML = W.city ? `${icon('MapPin')}<div><small>${W.cityAuto ? 'Cidade detectada pelo mapa' : 'Cidade escolhida'}</small><b>${esc(W.city)} · ${esc(W.uf)}</b></div><button type="button" class="link-btn" data-action="wz-city">Alterar</button>`
      : `${icon('MapPin')}<div><small>Cidade</small><b class="muted">Aproxime o mapa ou busque a cidade</b></div><button type="button" class="link-btn" data-action="wz-city">Escolher</button>`;
  }
  EZ.wzChooseCity = () => {
    const box = $('#wz-city'); if (!box) return;
    box.innerHTML = `<label class="search-field">${icon('Building2')}<input id="wz-city-q" placeholder="Digite a cidade (ex.: Belém PA)" autocomplete="off" aria-label="Cidade"></label><div class="pick-results" id="wz-city-list"></div>`;
    const inp = $('#wz-city-q'), list = $('#wz-city-list'); inp.focus();
    const run = () => { const res = EZ.mun.search(inp.value, 6); list.innerHTML = res.map(c => `<button type="button" class="pr-item" data-c="${esc(c.name)}" data-uf="${c.uf}" data-lat="${c.lat}" data-lng="${c.lng}">${icon('Building2')}<span>${esc(c.name)}<small>${c.uf} · ${EZ.UFS[c.uf].name}</small></span></button>`).join(''); };
    EZ.mun.load().then(run).catch(() => { list.innerHTML = '<p class="muted small">Lista de cidades indisponível.</p>'; });
    inp.addEventListener('input', debounce(run, 120));
    list.addEventListener('click', e => { const b = e.target.closest('.pr-item'); if (!b) return; W.city = b.dataset.c; W.uf = b.dataset.uf; W.cityAuto = false; if (picker && (W.lat == null || haversine(W.lat, W.lng, +b.dataset.lat, +b.dataset.lng) > 40)) picker.goto(+b.dataset.lat, +b.dataset.lng, 13); renderCity(); saveDraft(); });
  };

  async function search(q) {
    const list = $('#wz-q-list'); if (!list) return;
    const k = q.trim(); if (k.length < 2) { list.hidden = true; return; }
    try { await EZ.mun.load(); } catch { /* sem lista */ }
    const cities = EZ.mun.search(k, 5);
    const html = c => `<button type="button" class="pr-item" data-lat="${c.lat}" data-lng="${c.lng}" data-z="13" data-city="${esc(c.name)}" data-uf="${c.uf}" data-label="${esc(c.name)} · ${c.uf}">${icon('Building2')}<span>${esc(c.name)}<small>${c.uf} · ${EZ.UFS[c.uf].name}${c.cap ? ' · capital' : ''}</small></span></button>`;
    list.innerHTML = (cities.length ? `<p class="pr-group">Cidades</p>${cities.map(html).join('')}` : '') + `<div id="wz-addr"></div>`;
    list.hidden = !cities.length && k.length < 4;
    if (k.length >= 4) addressSearch(k);
  }
  /* Busca de endereço (Photon/Komoot, dados do OpenStreetMap). Se falhar, a busca por cidade continua. */
  async function addressSearch(k) {
    if (photonCtl) photonCtl.abort(); photonCtl = new AbortController();
    const c = picker ? picker.map.getCenter() : { lat: -15.8, lng: -50.5 };
    try {
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(k)}&limit=6&lat=${c.lat.toFixed(3)}&lon=${c.lng.toFixed(3)}`, { signal: photonCtl.signal });
      if (!res.ok) return;
      const data = await res.json();
      const feats = (data.features || []).filter(f => f.properties && f.properties.countrycode === 'BR').slice(0, 4);
      const box = $('#wz-addr'); if (!box || !feats.length) return;
      box.innerHTML = `<p class="pr-group">Endereços e lugares</p>` + feats.map(f => { const p = f.properties; const [lng, lat] = f.geometry.coordinates; const name = [p.name, p.street && p.housenumber ? p.street + ', ' + p.housenumber : p.street].filter(Boolean).join(' · ') || p.city; const sub = [p.district, p.city || p.county, p.state].filter(Boolean).join(' · '); return `<button type="button" class="pr-item" data-lat="${lat}" data-lng="${lng}" data-z="17" data-label="${esc(name)}">${icon('MapPin')}<span>${esc(name)}<small>${esc(sub)}</small></span></button>`; }).join('');
      $('#wz-q-list').hidden = false;
    } catch { /* offline ou bloqueado: segue só com cidades */ }
  }

  function renderNear() {
    const box = $('#wz-near'); if (!box || W.lat == null || (W.zoom || 0) < 11) { if (box) box.innerHTML = ''; return; }
    const near = EZ.store.reports.filter(r => (r.published || EZ.isOwn(r)) && r.status !== 'encerrado' && haversine(W.lat, W.lng, r.lat, r.lng) <= 1.5)
      .sort((a, b) => haversine(W.lat, W.lng, a.lat, a.lng) - haversine(W.lat, W.lng, b.lat, b.lng)).slice(0, 3);
    box.innerHTML = near.length ? `<div class="near-box"><p><b>${icon('Info')}Já existe relato parecido por perto</b>Se for o mesmo problema, confirme o relato existente. Isso ajuda mais do que um novo registro.</p>${near.map(r => `<div class="near-item">${C.thumb(r, 'near-img')}<div><b>${esc(r.title)}</b><small>${C.badge(r.status)} a ${fmtKm(haversine(W.lat, W.lng, r.lat, r.lng))} · ${r.confirmations || 0} confirmações</small></div>${EZ.isOwn(r) ? '<span class="chip chip-soft">Seu</span>' : r.confirmedByMe ? `<span class="chip chip-ok">${icon('Check')}Confirmado</span>` : `<button type="button" class="btn btn-outline btn-sm" data-wz-confirm="${r.id}">${icon('ThumbsUp')}É o mesmo</button>`}</div>`).join('')}</div>` : '';
  }

  /* ---------------- Etapa 2: o que viu ---------------- */
  function step2() {
    return `<form id="wz-form" class="wz-form" novalidate>
      <fieldset class="field"><legend>O que você observou? *</legend><div class="cat-grid">${EZ.CATEGORIES.map(c => `<label class="cat-card"><input type="radio" name="category" value="${c.key}" ${W.category === c.key ? 'checked' : ''} required><span class="cc-ic">${icon(c.icon)}</span><span class="cc-txt"><b>${c.label}</b><small>${c.hint}</small></span></label>`).join('')}</div></fieldset>
      <fieldset class="field"><legend>Sinais que você percebeu <em>(marque todos)</em></legend><div class="chipset">${EZ.SIGNS.map(s => `<label class="pchip"><input type="checkbox" name="signs" value="${s.key}" ${W.signs.includes(s.key) ? 'checked' : ''}><span>${icon(s.icon)}${s.label}</span></label>`).join('')}</div></fieldset>
      <div class="grid-2 wz-row">
        <fieldset class="field"><legend>Gravidade aparente</legend><div class="sev-pick">${Object.entries(EZ.SEVERITY).map(([k, s]) => `<label class="sev-opt sev-${k}"><input type="radio" name="severity" value="${k}" ${W.severity === k ? 'checked' : ''}><span><i class="sev-bars" aria-hidden="true"><b></b><b></b><b></b></i><b>${s.label}</b><small>${s.desc}</small></span></label>`).join('')}</div></fieldset>
        <div class="field"><span class="field-lbl">Quando você viu? *</span><input type="date" id="wz-date" name="observed" value="${W.observed}" max="${today()}" required aria-label="Data da observação">
          <label class="switch switch-sm"><input type="checkbox" name="ongoing" id="wz-ongoing" ${W.ongoing ? 'checked' : ''}><span class="sw-ui"></span><span><b>Está acontecendo agora</b><small>Ajuda a equipe a priorizar</small></span></label></div>
      </div>
      <label class="field"><span>Título *</span><input id="wz-title" name="title" maxlength="90" value="${esc(W.title)}" placeholder="Ex.: Líquido escuro saindo de tubulação no canal" required><small class="hint">Sugerimos um título a partir das suas respostas. Você pode editar.</small></label>
      <label class="field"><span>Descreva o que viu *</span><textarea id="wz-desc" name="description" rows="4" maxlength="1500" placeholder="Cor, cheiro, volume, desde quando acontece… Não acuse pessoas ou empresas.">${esc(W.description)}</textarea><small class="counter" data-for="wz-desc">${W.description.length}/1500 · mínimo 20</small></label>
      <div class="field"><span class="field-lbl">Foto <em>(opcional)</em></span>
        <div class="upload${W.photo ? ' has-photo' : ''}" id="wz-upload">${W.photo ? `<img src="${esc(W.photo)}" alt="Prévia da foto escolhida"><div class="up-info"><b>${esc(W.photoName || 'Foto')}</b><small>Reduzida para economizar dados</small><button type="button" class="link-btn danger" data-action="wz-photo-remove">${icon('Trash2')}Remover</button></div>`
        : `${icon('Camera')}<div><b>Uma foto ajuda a equipe a entender</b><small>JPG, PNG ou WebP · até 10 MB</small></div><div class="up-btns"><label class="btn btn-outline btn-sm up-cam">${icon('Camera')}Tirar foto<input type="file" accept="image/*" capture="environment" data-photo hidden></label><label class="btn btn-outline btn-sm">${icon('ImagePlus')}Galeria<input type="file" accept="image/jpeg,image/png,image/webp" data-photo hidden></label></div>`}</div>
        <label class="check"><input type="checkbox" name="photoConsent" ${W.photoConsent ? 'checked' : ''}><span>Autorizo mostrar a foto no mapa depois da revisão. Evitei rostos, placas e informações pessoais.</span></label></div>
      <p class="notice warn">${icon('TriangleAlert')}Fotografe de longe e de um lugar seguro. Não entre na água nem toque em resíduos.</p></form>`;
  }
  const PREP_M = /^(rio|canal|c[oó]rrego|lago|a[cç]ude|arroio|igarap[eé]|ribeir[aã]o|estu[aá]rio|mangue|mar|parque|porto|cais|dique)\b/i;
  function suggestTitle() {
    const c = EZ.CATEGORY[W.category]; if (!c) return '';
    const n = W.waterName.trim();
    const where = n ? `${PREP_M.test(n) ? 'no' : 'na'} ${n}` : W.city ? `em ${W.city}` : '';
    return `${c.label} ${where}`.trim().slice(0, 90);
  }
  function mountStep2() {
    const f = $('#wz-form');
    if (!W.title || W.titleAuto) { const t = suggestTitle(); if (t) { W.title = t; W.titleAuto = true; $('#wz-title').value = t; } }
    f.addEventListener('change', e => { if (e.target.name === 'category' && W.titleAuto) { capture(); W.title = suggestTitle(); $('#wz-title').value = W.title; } capture(); saveDraft(); });
    $('#wz-title').addEventListener('input', () => { W.titleAuto = false; });
    f.addEventListener('input', e => { if (e.target.id === 'wz-desc') { const c = $('.counter[data-for="wz-desc"]'); c.textContent = `${e.target.value.length}/1500 · mínimo 20`; } capture(); saveDraft(); });
  }
  EZ.handlePhoto = async file => {
    if (!file || !W) return;
    if (!/^image\//.test(file.type)) return EZ.ui.toast('Escolha um arquivo de imagem (JPG, PNG ou WebP).', { type: 'warn' });
    if (file.size > 10 * 1024 * 1024) return EZ.ui.toast('A foto passa de 10 MB. Escolha outra ou reduza o tamanho.', { type: 'warn' });
    capture();
    const btn = $('#wz-next'); if (btn) btn.disabled = true;
    const up = $('#wz-upload'); if (up) up.classList.add('is-busy');
    try {
      const url = URL.createObjectURL(file);
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
      const s = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight));
      const cv = document.createElement('canvas'); cv.width = Math.round(img.naturalWidth * s); cv.height = Math.round(img.naturalHeight * s);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url);
      W.photo = cv.toDataURL('image/jpeg', 0.78); W.photoName = file.name;
      render(); saveDraft();
    } catch { if (btn) btn.disabled = false; if (up) up.classList.remove('is-busy'); EZ.ui.toast('Não foi possível abrir essa imagem. Tente outra foto.', { type: 'error' }); }
  };
  EZ.removePhoto = () => { capture(); W.photo = null; W.photoName = ''; render(); saveDraft(); };

  /* ---------------- Etapa 3: revisão ---------------- */
  function step3() {
    const c = EZ.CATEGORY[W.category];
    return `<form id="wz-form" class="wz-form wz-review" novalidate>
      <div class="review">
        <div class="review-map"><div id="wz-mini" class="map"></div></div>
        <div class="review-body">
          <div class="chips">${C.cat(W.category)}${C.sev(W.severity)}${W.ongoing ? `<span class="chip chip-live"><i class="live-dot"></i>Acontecendo agora</span>` : ''}</div>
          <h3>${esc(W.title)}</h3>
          <dl class="facts"><dt>Local</dt><dd>${esc(W.waterName || EZ.WATER_LABEL[W.water] || '')}${W.waterName ? ' · ' : ''}${esc(W.place)}<br>${esc(W.city)} · ${esc(W.uf)}</dd>
          <dt>Coordenadas</dt><dd class="mono">${fmtCoord(W.lat, W.lng)}</dd><dt>Observado em</dt><dd>${fmtShort(W.observed + 'T12:00:00')}</dd>
          ${W.signs.length ? `<dt>Sinais</dt><dd>${W.signs.map(s => EZ.SIGN[s].label).join(', ')}</dd>` : ''}<dt>Descrição</dt><dd>${esc(W.description)}</dd>
          <dt>Foto</dt><dd>${W.photo ? (W.photoConsent ? 'Anexada · pode ser mostrada após revisão' : 'Anexada · só a equipe verá') : 'Sem foto'}</dd></dl>
          ${W.photo ? `<img class="review-photo" src="${esc(W.photo)}" alt="Foto anexada">` : ''}
          <button type="button" class="link-btn" data-action="wz-goto" data-step="1">${icon('Pencil')}Editar local</button> <button type="button" class="link-btn" data-action="wz-goto" data-step="2">${icon('Pencil')}Editar detalhes</button>
        </div>
      </div>
      <div class="next-box"><h4>O que acontece depois</h4><ol class="mini-steps"><li><b>Agora</b>Você recebe um protocolo e o relato aparece em “Meus relatos”.</li><li><b>Até 48 h</b>A equipe revisa local, fotos e privacidade.</li><li><b>Publicado</b>O relato vai para o mapa e pode ser encaminhado ao órgão responsável.</li></ol></div>
      <label class="check check-strong"><input type="checkbox" name="consent" id="wz-consent" ${W.consent ? 'checked' : ''} required><span>Entendo que esta é uma <b>demonstração</b>: o relato fica salvo neste navegador e não é enviado a órgãos públicos.</span></label>
    </form>`;
  }
  let reviewMini = null;
  function mountStep3() { setTimeout(() => { const el = $('#wz-mini'); if (el && window.L) reviewMini = EZ.createMini(el, { lat: W.lat, lng: W.lng, status: 'recebido', category: W.category }); }, 50); $('#wz-form').addEventListener('change', () => { capture(); saveDraft(); }); }

  /* ---------------- navegação e envio ---------------- */
  function capture() {
    const f = $('#wz-form'); if (!f || !W) return;
    const d = new FormData(f);
    if (W.step === 1) { W.water = d.get('water') || W.water; W.waterName = String(d.get('waterName') || '').trim(); W.place = String(d.get('place') || '').trim(); }
    if (W.step === 2) { W.category = d.get('category') || W.category; W.signs = d.getAll('signs'); W.severity = d.get('severity') || 'media'; W.ongoing = !!d.get('ongoing'); W.title = String(d.get('title') || '').trim(); W.description = String(d.get('description') || '').trim(); W.observed = d.get('observed') || W.observed; W.photoConsent = !!d.get('photoConsent'); }
    if (W.step === 3) { W.consent = !!d.get('consent'); }
  }
  EZ.wzNext = () => {
    capture();
    if (W.step === 1) {
      if (W.lat == null) return render('Marque o ponto no mapa ou informe as coordenadas.');
      if (picker && (W.zoom || 0) < MIN_ZOOM) return render('Aproxime mais o mapa para marcar o ponto exato (use o botão + ou dois dedos).');
      if (!W.city) return render('Escolha a cidade onde fica o local.');
      if (!W.water) return render('Diga que tipo de lugar é: rio, canal, praia…');
      if (W.place.length < 4) return render('Escreva um ponto de referência com pelo menos 4 letras.');
    }
    if (W.step === 2) {
      if (!W.category) return render('Escolha o que você observou.');
      if (W.title.length < 6) return render('Escreva um título com pelo menos 6 letras.');
      if (W.description.length < 20) return render('Descreva o que viu com pelo menos 20 caracteres.');
      if (!W.observed || W.observed > today()) return render('Informe a data em que você viu, sem usar datas futuras.');
    }
    if (W.step < 3) { W.step++; render(); saveDraft(); return; }
    if (!W.consent) return render('Confirme que entendeu como esta demonstração funciona.');
    submit();
  };
  EZ.wzBack = () => { capture(); if (W.step > 1) { W.step--; render(); saveDraft(); } };
  EZ.wzGoto = n => { capture(); W.step = n; render(); };
  EZ.wzLocate = async () => {
    EZ.ui.toast('Aguardando a permissão de localização…');
    try { const p = await EZ.geo.locate(); EZ.state.userPos = p; if (picker) picker.goto(p.lat, p.lng, 17); else { W.lat = p.lat; W.lng = p.lng; } W.cityAuto = true; EZ.ui.toast('Localização encontrada. Ajuste o pino se precisar.', { type: 'ok' }); }
    catch (e) { EZ.ui.toast(e.message, { type: 'warn' }); }
  };
  EZ.wzApplyCoords = () => {
    const la = parseFloat(String($('#wz-lat').value).replace(',', '.')), lo = parseFloat(String($('#wz-lng').value).replace(',', '.'));
    if (!isFinite(la) || !isFinite(lo) || la < -34 || la > 6 || lo < -75 || lo > -28) return EZ.ui.toast('Coordenadas fora do Brasil ou inválidas. Ex.: -23.55 e -46.63', { type: 'warn' });
    if (picker) picker.goto(la, lo, 17); else { W.lat = la; W.lng = lo; W.zoom = 17; }
  };
  EZ.wzLayer = () => { if (!picker) return; const next = picker.basemap === 'satelite' ? 'mapa' : 'satelite'; EZ.store.prefs.pickerBasemap = next; EZ.store.savePrefs(); picker.setBasemap(next); };
  EZ.wzZoom = d => { if (picker) picker.map.setZoom(picker.map.getZoom() + d); };
  EZ.wzConfirmExisting = id => {
    EZ.toggleConfirm(id); renderNear();
    EZ.ui.modal.open({ title: 'Obrigado por confirmar!', subtitle: 'Sua confirmação foi somada ao relato existente.', body: `<p class="muted">Como é o mesmo problema, não é preciso registrar de novo. Se for algo diferente, você pode continuar o seu relato.</p>`,
      footer: `<button type="button" class="btn btn-ghost" data-action="wz-resume-anyway">Continuar meu relato</button><button type="button" class="btn btn-primary" data-open="${id}">Ver o relato</button>` });
    EZ.store.draft.clear();
  };
  EZ.wzResume = () => { render(); };

  function submit() {
    const id = EZ.store.nextId(), now = new Date().toISOString();
    const report = { id, title: W.title, category: W.category, signs: W.signs, severity: W.severity, water: W.water, waterName: W.waterName || EZ.WATER_LABEL[W.water] || 'Curso d’água', place: W.place, city: W.city, uf: W.uf,
      lat: W.lat, lng: W.lng, status: 'recebido', published: false, description: W.description, observed: W.observed, createdAt: now, updatedAt: now,
      photo: W.photo, photoConsent: W.photoConsent, photoReviewed: false, author: EZ.ME, ongoing: W.ongoing, confirmations: 0, confirmedByMe: false, closeReason: '', duplicateOf: '',
      history: [{ status: 'recebido', title: 'Relato recebido', date: now, note: 'Registro salvo na demonstração. Aguarda a triagem da equipe.', by: 'Você' }] };
    if (!EZ.store.commit([...EZ.store.reports, report], 'create')) return;
    EZ.store.draft.clear(); W.done = true;
    destroyPicker();
    EZ.ui.modal.open({ cls: 'dlg-success', label: 'Relato registrado',
      body: `<div class="success"><div class="success-ic">${icon('Check')}</div><h2>Relato registrado!</h2><p>Obrigado por cuidar da água da sua cidade. Guarde o protocolo para acompanhar.</p>
        <button type="button" class="protocol" data-copy="${id}" aria-label="Copiar protocolo ${id}"><span class="mono">${id}</span>${icon('Copy')}</button>
        <ol class="stepper" aria-label="Andamento: Recebido">${EZ.STATUS_ORDER.map((s, i) => `<li class="${i === 0 ? 'now' : ''}"><span class="dot"></span><span class="lbl">${EZ.STATUS[s].label}</span></li>`).join('')}</ol>
        <p class="muted small">Demonstração: nada foi enviado a órgãos públicos. O relato aparece no mapa depois da revisão no perfil de gestor.</p></div>`,
      footer: `<button type="button" class="btn btn-ghost" data-action="register-new">${icon('Plus')}Registrar outro</button><button type="button" class="btn btn-primary" data-open="${id}">Acompanhar relato${icon('ArrowRight')}</button>` });
    W = null;
    EZ.refreshChrome();
  }

  function destroyPicker() { if (picker) { picker.destroy(); picker = null; } if (reviewMini) { reviewMini.destroy(); reviewMini = null; } if (photonCtl) { photonCtl.abort(); photonCtl = null; } }
  EZ.wzActive = () => !!W;
})();
