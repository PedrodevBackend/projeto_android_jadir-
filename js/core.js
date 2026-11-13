/* EsgotoZero · núcleo: utilitários, armazenamento local, estado, filtros e camadas de interface (diálogos, gaveta, toasts).
   Protótipo acadêmico: não há servidor. Os dados ficam no navegador (localStorage). */
'use strict';
(function () {
  const EZ = window.EZ;

  /* ---------------- utilitários ---------------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (v = '') => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (name, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${(window.EZ_ICONS || {})[name] || (window.EZ_ICONS || {}).Info || ''}</svg>`;
  const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const debounce = (fn, ms = 200) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const plural = (n, one, many) => `${n.toLocaleString('pt-BR')} ${n === 1 ? one : many}`;
  const pad = n => String(n).padStart(2, '0');

  const MONTHS = ['jan.', 'fev.', 'mar.', 'abr.', 'maio', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
  const fmtDate = d => { const x = new Date(d); return `${pad(x.getDate())} ${MONTHS[x.getMonth()]} ${x.getFullYear()}`; };
  const fmtShort = d => { const x = new Date(d); return `${pad(x.getDate())}/${pad(x.getMonth() + 1)}/${x.getFullYear()}`; };
  const fmtTime = d => { const x = new Date(d); return `${pad(x.getHours())}:${pad(x.getMinutes())}`; };
  const fmtDateTime = d => `${fmtShort(d)} · ${fmtTime(d)}`;
  function ago(d, now = Date.now()) {
    const s = Math.max(0, (now - new Date(d).getTime()) / 1000);
    if (s < 60) return 'agora';
    const m = s / 60; if (m < 60) return `há ${Math.floor(m)} min`;
    const h = m / 60; if (h < 24) return `há ${Math.floor(h)} h`;
    const days = h / 24; if (days < 2) return 'ontem';
    if (days < 7) return `há ${Math.floor(days)} dias`;
    if (days < 30) return `há ${Math.floor(days / 7)} sem.`;
    const mo = Math.floor(days / 30); return mo <= 1 ? 'há 1 mês' : `há ${mo} meses`;
  }
  const hoursSince = (d, now = Date.now()) => (now - new Date(d).getTime()) / 3600e3;
  const haversine = (a, b, c, d) => { const R = 6371, r = Math.PI / 180; const x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };
  const fmtKm = km => km < 1 ? `${Math.round(km * 1000)} m` : `${km.toLocaleString('pt-BR', { maximumFractionDigits: km < 10 ? 1 : 0 })} km`;
  const fmtCoord = (lat, lng) => `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
  const fmtPct = v => `${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

  EZ.u = { $, $$, esc, icon, norm, clamp, debounce, plural, fmtDate, fmtShort, fmtTime, fmtDateTime, ago, hoursSince, haversine, fmtKm, fmtCoord, fmtPct };

  /* ---------------- armazenamento ---------------- */
  const KEY = 'esgotozero.v2', PKEY = 'esgotozero.prefs.v2', DKEY = 'esgotozero.draft.v2', V1 = 'esgotozero.demo.v1';
  const safeGet = k => { try { return localStorage.getItem(k); } catch { return null; } };
  const safeSet = (k, v) => { try { localStorage.setItem(k, v); return true; } catch { return false; } };
  const safeDel = k => { try { localStorage.removeItem(k); } catch { /* sem armazenamento */ } };

  const store = {
    available: true,
    reports: [],
    prefs: { theme: 'system', name: 'Gustavo Mota', role: 'citizen', sidebar: 'expanded', basemap: 'satelite', labels: true, readAt: null },
    listeners: new Set(),
    on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
    emit(why) { this.listeners.forEach(fn => { try { fn(why); } catch (e) { console.error(e); } }); },
    load() {
      try { localStorage.setItem('ez.probe', '1'); localStorage.removeItem('ez.probe'); } catch { this.available = false; }
      let data = null;
      try { data = JSON.parse(safeGet(KEY) || 'null'); } catch { data = null; }
      if (this.isValid(data)) this.reports = data.reports;
      else { this.reports = [...EZ.makeSeed(), ...migrateV1()]; this.persist(); }
      try { const p = JSON.parse(safeGet(PKEY) || 'null'); if (p && typeof p === 'object') this.prefs = { ...this.prefs, ...p }; } catch { /* preferências padrão */ }
    },
    /** Confere a estrutura salva antes de usar (dados de outra aba, de versão antiga ou editados à mão). */
    isValid(data) { return !!data && data.version === 2 && Array.isArray(data.reports) && data.reports.every(r => r && r.id && EZ.STATUS[r.status] && Array.isArray(r.history) && Number.isFinite(+r.lat) && Number.isFinite(+r.lng)); },
    persist() { return safeSet(KEY, JSON.stringify({ version: 2, savedAt: new Date().toISOString(), reports: this.reports })); },
    /** Substitui a lista inteira. Retorna false se o navegador recusar (sem espaço, modo privado…). */
    commit(next, why = 'reports') {
      const prev = this.reports; this.reports = next;
      if (!this.persist()) { this.reports = prev; EZ.ui.toast('Não foi possível salvar neste navegador. Libere espaço ou saia do modo privado.', { type: 'error' }); return false; }
      this.emit(why); return true;
    },
    update(id, fn, why) { const next = this.reports.map(r => r.id === id ? fn({ ...r }) : r); return this.commit(next, why || 'update'); },
    byId(id) { return this.reports.find(r => r.id === id); },
    savePrefs() { if (!safeSet(PKEY, JSON.stringify(this.prefs))) { /* a preferência vale só nesta sessão */ } },
    nextId() { const n = Math.max(1000, ...this.reports.map(r => Number(String(r.id).split('-')[1]) || 0)) + 1; return 'EZ-' + String(n).padStart(4, '0'); },
    reset() { this.reports = EZ.makeSeed(); this.persist(); safeDel(DKEY); this.emit('reset'); },
    draft: { get() { try { return JSON.parse(safeGet(DKEY) || 'null'); } catch { return null; } }, set(d) { safeSet(DKEY, JSON.stringify(d)); }, clear() { safeDel(DKEY); } }
  };
  EZ.store = store;

  /* Relatos criados na versão 1 do protótipo (Baixada Santista) continuam aparecendo. */
  function migrateV1() {
    let v1; try { v1 = JSON.parse(safeGet(V1) || 'null'); } catch { return []; }
    if (!v1 || !Array.isArray(v1.reports)) return [];
    const seedIds = new Set(['EZ-0013', 'EZ-0014', 'EZ-0015', 'EZ-0016', 'EZ-0017', 'EZ-0018', 'EZ-0019', 'EZ-0020', 'EZ-0021', 'EZ-0022', 'EZ-0023', 'EZ-0024', 'EZ-0025', 'EZ-0026']);
    const cat = { 'Possível despejo': 'despejo', 'Resíduos na água': 'residuos', 'Alteração na água': 'aspecto', 'Outro sinal': 'outro' };
    const sign = { 'Saída de líquido': 'tubulacao', 'Odor forte': 'odor', 'Espuma': 'espuma', 'Alteração de cor': 'cor', 'Resíduos': 'lixo' };
    return v1.reports.filter(r => r && r.id && !seedIds.has(r.id) && EZ.STATUS[r.status]).map(r => ({
      id: r.id, title: r.title || 'Relato', category: cat[r.category] || 'outro', signs: (r.signs || []).map(s => sign[s]).filter(Boolean),
      severity: 'media', water: 'outro', waterName: r.place || 'curso d’água', place: r.place || '', city: r.city === 'Outra' ? 'Santos' : (r.city || 'Santos'), uf: 'SP',
      lat: r.lat, lng: r.lng, status: r.status, published: !!r.published, description: r.description || '', observed: r.observed || (r.date || '').slice(0, 10),
      createdAt: r.date || new Date().toISOString(), updatedAt: (r.history && r.history.length ? r.history[r.history.length - 1].date : r.date) || new Date().toISOString(),
      photo: r.photoData || null, photoConsent: !!r.photoConsent, photoReviewed: !!r.photoReviewed, author: r.author || 'outro', ongoing: false,
      confirmations: 0, confirmedByMe: false, closeReason: '', duplicateOf: r.duplicateOf || '', history: r.history || [], migrated: true
    }));
  }

  /* ---------------- identidade e permissões (demonstração) ---------------- */
  EZ.ME = 'cidadao-demo';
  EZ.isManager = () => store.prefs.role === 'manager';
  EZ.isOwn = r => r && r.author === EZ.ME;
  EZ.canRead = r => !!r && (r.published || EZ.isOwn(r) || EZ.isManager());
  EZ.photoSrc = (r, privateView = false) => {
    if (!r || !r.photo) return null;
    if (r.photo.startsWith('seed:')) return EZ.PHOTOS[r.photo.slice(5)] || null;
    return (privateView || r.photoReviewed) ? r.photo : null;
  };
  EZ.isIllustrative = r => !!r && typeof r.photo === 'string' && r.photo.startsWith('seed:');
  EZ.region = r => (EZ.UFS[r.uf] || {}).region || '—';

  /** Prioridade para a fila da equipe: gravidade + confirmações + tempo de espera + "acontecendo agora". */
  EZ.priority = r => {
    const sev = (EZ.SEVERITY[r.severity] || EZ.SEVERITY.media).weight;
    const waiting = (r.status === 'recebido' || r.status === 'triagem') ? Math.min(2, hoursSince(r.createdAt) / 48) : 0;
    const score = sev * 2 + Math.min(3, (r.confirmations || 0) / 8) + waiting + (r.ongoing ? 1 : 0);
    return { score, level: score >= 7 ? 'alta' : score >= 4.5 ? 'media' : 'baixa' };
  };
  /** Prazo de referência: 48 h para sair de "Recebido". */
  EZ.slaLate = r => r.status === 'recebido' && hoursSince(r.createdAt) > 48;

  /* ---------------- estado da interface ---------------- */
  EZ.state = {
    route: 'mapa',
    f: { q: '', status: 'all', category: 'all', scope: { type: 'br' }, period: 'all', severity: 'all', photo: false, sort: 'recent' },
    listTab: 'all',
    admin: { tab: 'fila', q: '', uf: 'all', category: 'all', severity: 'all', sort: 'priority', view: 'pins', period: '90' },
    selected: null,
    sheet: 'peek',
    userPos: null
  };

  /* Recorte geográfico: Brasil, região, estado ou cidade. */
  EZ.scope = {
    match(r, s) {
      if (!s || s.type === 'br') return true;
      if (s.type === 'region') return EZ.region(r) === s.v;
      if (s.type === 'uf') return r.uf === s.v;
      if (s.type === 'city') return `${r.city}|${r.uf}` === s.v;
      if (s.type === 'near') return haversine(r.lat, r.lng, s.lat, s.lng) <= (s.km || 25);
      return true;
    },
    label(s) {
      if (!s || s.type === 'br') return 'Todo o Brasil';
      if (s.type === 'region') return `Região ${s.v}`;
      if (s.type === 'uf') return EZ.UFS[s.v] ? EZ.UFS[s.v].name : s.v;
      if (s.type === 'city') { const [c, uf] = s.v.split('|'); return `${c} · ${uf}`; }
      if (s.type === 'near') return 'Perto de você';
      return 'Brasil';
    },
    short(s) { return (!s || s.type === 'br') ? 'Brasil' : this.label(s); }
  };

  /** Filtra e ordena relatos com os filtros públicos (mapa e lista). */
  EZ.filterReports = (base, f = EZ.state.f) => {
    const q = norm(f.q);
    const now = Date.now();
    const out = base.filter(r =>
      (!q || norm([r.title, r.place, r.city, r.uf, (EZ.UFS[r.uf] || {}).name, r.id, r.waterName, (EZ.CATEGORY[r.category] || {}).label].join(' ')).includes(q)) &&
      (f.status === 'all' || r.status === f.status) &&
      (f.category === 'all' || r.category === f.category) &&
      (f.severity === 'all' || r.severity === f.severity) &&
      (!f.photo || !!EZ.photoSrc(r)) &&
      (f.period === 'all' || (now - new Date(r.createdAt).getTime()) <= Number(f.period) * 864e5) &&
      EZ.scope.match(r, f.scope));
    const sorters = {
      recent: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      updated: (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
      confirmed: (a, b) => (b.confirmations || 0) - (a.confirmations || 0),
      near: (a, b) => EZ.state.userPos ? haversine(a.lat, a.lng, EZ.state.userPos.lat, EZ.state.userPos.lng) - haversine(b.lat, b.lng, EZ.state.userPos.lat, EZ.state.userPos.lng) : 0
    };
    return out.sort(sorters[f.sort] || sorters.recent);
  };
  EZ.activeFilterCount = (f = EZ.state.f) => ['status', 'category', 'period', 'severity'].filter(k => f[k] !== 'all').length + (f.photo ? 1 : 0) + (f.q ? 1 : 0) + (f.scope && f.scope.type !== 'br' ? 1 : 0);
  EZ.countBy = (list, fn) => list.reduce((m, r) => { const k = fn(r); m[k] = (m[k] || 0) + 1; return m; }, {});
  /** Contagem semanal (últimas n semanas) por data de criação. */
  EZ.weekly = (list, n = 10, now = Date.now()) => {
    const W = 7 * 864e5, start = now - n * W;
    const bins = Array.from({ length: n }, (_, i) => ({ start: start + i * W, total: 0, by: {} }));
    list.forEach(r => { const t = new Date(r.createdAt).getTime(); if (t < start) return; const i = Math.min(n - 1, Math.floor((t - start) / W)); bins[i].total++; bins[i].by[r.status] = (bins[i].by[r.status] || 0) + 1; });
    return bins;
  };

  /* ---------------- municípios (carregados sob demanda) ---------------- */
  EZ.mun = {
    list: null, loading: null,
    load() {
      if (this.list) return Promise.resolve(this.list);
      if (this.loading) return this.loading;
      this.loading = new Promise((resolve, reject) => {
        const parse = () => {
          const out = [];
          String(window.EZ_MUN_RAW || '').split('\n').forEach(line => {
            const [uf, rest] = line.split('\t'); if (!rest) return;
            rest.split('|').forEach(item => { const [n, la, lo] = item.split(';'); const cap = n.startsWith('*'); const name = cap ? n.slice(1) : n; out.push({ name, uf, lat: +la, lng: +lo, cap, key: norm(name) }); });
          });
          this.list = out; resolve(out);
        };
        if (window.EZ_MUN_RAW) return parse();
        const s = document.createElement('script'); s.src = 'js/municipios.js'; s.async = true;
        s.onload = parse; s.onerror = () => { this.loading = null; reject(new Error('municipios')); };
        document.head.appendChild(s);
      });
      return this.loading;
    },
    search(q, limit = 8) {
      if (!this.list) return [];
      const k = norm(q).replace(/\s*[-·,/]\s*([a-z]{2})$/, ' $1');
      if (!k) return [];
      const m = k.match(/^(.*?)(?:\s+([a-z]{2}))?$/); const nameQ = (m[1] || k).trim(); const ufQ = m[2] ? m[2].toUpperCase() : null;
      const res = [];
      for (const c of this.list) {
        if (ufQ && c.uf !== ufQ && !c.key.includes(k)) continue;
        const key = c.key; let score = -1;
        if (key === nameQ) score = 100; else if (key.startsWith(nameQ)) score = 80; else if (key.includes(' ' + nameQ)) score = 60; else if (key.includes(nameQ)) score = 40;
        if (score < 0) continue;
        if (ufQ && c.uf === ufQ) score += 15;
        if (c.cap) score += 8;
        res.push([score - key.length / 100, c]);
      }
      return res.sort((a, b) => b[0] - a[0]).slice(0, limit).map(x => x[1]);
    },
    nearest(lat, lng) {
      if (!this.list) return null;
      let best = null, bd = Infinity;
      const cos = Math.cos(lat * Math.PI / 180);
      for (const c of this.list) { const d = (c.lat - lat) ** 2 + ((c.lng - lng) * cos) ** 2; if (d < bd) { bd = d; best = c; } }
      return best ? { ...best, km: haversine(lat, lng, best.lat, best.lng) } : null;
    }
  };

  /* ---------------- geolocalização ---------------- */
  EZ.geo = {
    locate() {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error('Este navegador não oferece localização. Marque o ponto no mapa.'));
        navigator.geolocation.getCurrentPosition(
          p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }),
          e => reject(new Error(e && e.code === 1 ? 'Permissão de localização negada. Você pode marcar o ponto no mapa.' : 'Não foi possível obter sua localização agora. Marque o ponto no mapa.')),
          { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
      });
    }
  };

  /* ---------------- camadas de interface ---------------- */
  const ui = EZ.ui = {};
  let toastTimer = null;
  /** Mensagem curta no rodapé. type: ok | info | warn | error. action: {label, fn} */
  ui.toast = (message, opts = {}) => {
    const el = $('#toast'); if (!el) return;
    const type = opts.type || 'info';
    const ic = { ok: 'CircleCheck', info: 'Info', warn: 'TriangleAlert', error: 'CircleAlert' }[type];
    el.className = `toast toast-${type}`;
    el.innerHTML = `${icon(ic)}<span>${esc(message)}</span>${opts.action ? `<button type="button" class="toast-action">${esc(opts.action.label)}</button>` : ''}`;
    if (opts.action) $('.toast-action', el).onclick = () => { el.classList.remove('show'); opts.action.fn(); };
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), opts.timeout || 4600);
  };

  /* Diálogo modal (usa <dialog>: foco preso, Esc e fundo inerte nativos). */
  let lastFocus = null;
  ui.modal = {
    el: () => $('#dlg'),
    open({ title, subtitle = '', body, footer = '', cls = '', label, onClose } = {}) {
      const d = this.el(); if (!d.open) lastFocus = document.activeElement;
      d.className = 'dlg ' + cls; d._onClose = onClose || null;
      d.innerHTML = `<div class="dlg-card">${title ? `<header class="dlg-head"><div><h2 id="dlg-title">${title}</h2>${subtitle ? `<p>${subtitle}</p>` : ''}</div><button type="button" class="icon-btn" data-close aria-label="Fechar">${icon('X')}</button></header>` : ''}<div class="dlg-body">${body}</div>${footer ? `<footer class="dlg-foot">${footer}</footer>` : ''}</div>`;
      d.setAttribute('aria-labelledby', 'dlg-title'); if (label) d.setAttribute('aria-label', label);
      if (!d.open) { d.showModal(); ui.layerOpened(); }
      const b = $('.dlg-body', d); if (b) b.scrollTop = 0;
      return d;
    },
    close() { const d = this.el(); if (d.open) d.close(); },
    isOpen() { return this.el().open; }
  };
  ui.drawer = {
    el: () => $('#drawer'),
    open(html, cls = '') {
      const d = this.el(); if (!d.open) lastFocus = document.activeElement;
      d.className = 'drawer ' + cls; d.innerHTML = html;
      if (!d.open) { d.showModal(); ui.layerOpened(); }
      const sc = $('.drawer-scroll', d); if (sc) sc.scrollTop = 0;
      return d;
    },
    close() { const d = this.el(); if (d.open) d.close(); },
    isOpen() { return this.el().open; }
  };
  /* Botão "voltar" (Android, APK e navegador): com uma janela aberta, ele fecha a janela em vez de sair da tela.
     Enquanto houver janela aberta, existe UMA entrada extra no histórico (a "guarda"). */
  const LAYERS = ['#palette', '#drawer', '#dlg'];
  const openLayers = () => LAYERS.map(s => $(s)).filter(d => d && d.open);
  let guard = false, skipPop = 0;
  ui.layerOpened = () => { if (!guard) { guard = true; history.pushState(Object.assign({}, history.state, { ezGuard: true }), ''); } };
  ui.layerClosed = () => { if (guard && !openLayers().length) { guard = false; skipPop++; history.back(); } };
  ui.dropGuard = () => { guard = false; };   // a rota mudou por link: a guarda antiga fica para trás no histórico
  addEventListener('popstate', () => {
    if (skipPop) { skipPop--; if (openLayers().length) ui.layerOpened(); return; }
    if (!guard) return;                        // navegação normal entre telas (#mapa, #ods…)
    guard = false;
    if (ui.pop.isOpen()) ui.pop.close();
    const top = openLayers()[0];               // a de cima: busca, depois ficha, depois diálogo
    if (top) top.close();
    if (openLayers().length) ui.layerOpened(); // ainda há outra janela aberta embaixo
  });

  const restoreFocus = () => { if (lastFocus && lastFocus.isConnected && !$('#dlg').open && !$('#drawer').open) { try { lastFocus.focus({ preventScroll: true }); } catch { /* elemento removido */ } } };
  document.addEventListener('DOMContentLoaded', () => {
    ['#dlg', '#drawer', '#palette'].forEach(sel => {
      const d = $(sel); if (!d) return;
      d.addEventListener('close', () => { if (d._onClose) { const f = d._onClose; d._onClose = null; f(); } d.dispatchEvent(new CustomEvent('ez-closed')); ui.layerClosed(); setTimeout(restoreFocus, 0); });
      // clique no fundo (fora do cartão) fecha
      d.addEventListener('mousedown', e => { if (e.target === d) d._downOnBackdrop = true; });
      d.addEventListener('click', e => { if (e.target === d && d._downOnBackdrop) d.close(); d._downOnBackdrop = false; });
    });
  });

  /* Popover ancorado (notificações, menus, seletores). */
  ui.pop = {
    anchor: null, onClose: null,
    open(anchor, html, { align = 'end', width, cls = '', onClose } = {}) {
      this.close();
      const p = $('#pop'); p.className = 'pop ' + cls; p.innerHTML = html; p.hidden = false;
      if (width) p.style.width = width + 'px'; else p.style.width = '';
      this.anchor = anchor; this.onClose = onClose || null; anchor.setAttribute('aria-expanded', 'true');
      this.place(align);
      const first = p.querySelector('input,button,[href],[tabindex]:not([tabindex="-1"])'); if (first) setTimeout(() => first.focus({ preventScroll: true }), 10);
      return p;
    },
    place(align = 'end') {
      const p = $('#pop'); if (p.hidden || !this.anchor) return;
      const r = this.anchor.getBoundingClientRect(); const vw = innerWidth, vh = innerHeight;
      const w = p.offsetWidth, h = p.offsetHeight;
      let left = align === 'end' ? r.right - w : r.left; left = clamp(left, 8, vw - w - 8);
      let top = r.bottom + 8; if (top + h > vh - 8 && r.top - h - 8 > 8) top = r.top - h - 8;
      p.style.left = left + 'px'; p.style.top = Math.max(8, top) + 'px';
    },
    close() {
      const p = $('#pop'); if (!p || p.hidden) return;
      p.hidden = true; p.innerHTML = '';
      if (this.anchor) { this.anchor.setAttribute('aria-expanded', 'false'); }
      const f = this.onClose; this.onClose = null; this.anchor = null; if (f) f();
    },
    isOpen() { const p = $('#pop'); return p && !p.hidden; }
  };
  document.addEventListener('mousedown', e => { const p = $('#pop'); if (!p || p.hidden) return; if (p.contains(e.target) || (ui.pop.anchor && ui.pop.anchor.contains(e.target))) return; ui.pop.close(); });
  addEventListener('resize', debounce(() => ui.pop.place(), 60));
  addEventListener('scroll', () => { if (ui.pop.isOpen() && ui.pop.anchor && !ui.pop.anchor.closest('.map-ui')) ui.pop.place(); }, true);

  /* Copiar texto com retorno visual. */
  ui.copy = async (text, okMsg = 'Copiado.') => {
    try { await navigator.clipboard.writeText(text); ui.toast(okMsg, { type: 'ok' }); }
    catch { const t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); ui.toast(okMsg, { type: 'ok' }); } catch { ui.toast('Selecione e copie: ' + text); } t.remove(); }
  };

  /* Download de arquivo gerado (CSV do painel). */
  ui.download = (filename, content, type = 'text/csv;charset=utf-8') => {
    const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  /* Tema: claro, escuro ou do sistema. */
  EZ.applyTheme = () => {
    const t = store.prefs.theme;
    const dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    const meta = $('meta[name="theme-color"]'); if (meta) meta.content = dark ? '#07131b' : '#0b5e7e';
    // No app Android (Capacitor): ícones da barra de status claros no tema escuro e escuros no tema claro
    const cap = window.Capacitor, bars = cap && cap.isNativePlatform && cap.isNativePlatform() && cap.Plugins && cap.Plugins.SystemBars;
    if (bars && bars.setStyle) bars.setStyle({ style: dark ? 'DARK' : 'LIGHT' }).catch(() => { /* versão sem o plugin */ });
    return dark;
  };
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (store.prefs.theme === 'system') { EZ.applyTheme(); EZ.emitTheme && EZ.emitTheme(); } });

  EZ.isMobile = () => matchMedia('(max-width: 767px)').matches;
  /** Painel inferior arrastável: só no celular em pé (deitado, a lista fica ao lado do mapa). */
  EZ.isSheet = () => EZ.isMobile() && !matchMedia('(orientation: landscape) and (max-height: 500px)').matches;
})();
