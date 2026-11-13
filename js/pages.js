/* EsgotoZero · páginas: mapa público, ocorrências, meus relatos, painel de gestão e ODS 6. */
'use strict';
(function () {
  const EZ = window.EZ, { $, $$, esc, icon, ago, plural, fmtPct, hoursSince } = EZ.u;
  const C = EZ.cmp, CH = EZ.charts;
  const P = EZ.pages = {};
  const head = (eyebrow, title, lede, actions = '') => `<header class="page-head"><div class="ph-text"><p class="eyebrow">${eyebrow}</p><h1>${title}</h1>${lede ? `<p class="lede">${lede}</p>` : ''}</div>${actions ? `<div class="ph-actions">${actions}</div>` : ''}</header>`;
  const pubReports = () => EZ.store.reports.filter(r => r.published);

  /* Chips de filtros ativos (removíveis). */
  function activeChips(f) {
    const out = [];
    if (f.scope && f.scope.type !== 'br') out.push(['scope', icon('MapPin') + esc(EZ.scope.label(f.scope))]);
    if (f.q) out.push(['q', icon('Search') + `“${esc(f.q)}”`]);
    if (f.status !== 'all') out.push(['status', EZ.STATUS[f.status].label]);
    if (f.category !== 'all') out.push(['category', EZ.CATEGORY[f.category].short]);
    if (f.severity !== 'all') out.push(['severity', 'Gravidade: ' + EZ.SEVERITY[f.severity].label]);
    if (f.period !== 'all') out.push(['period', `Últimos ${f.period} dias`]);
    if (f.photo) out.push(['photo', 'Com foto']);
    if (!out.length) return '';
    return out.map(([k, l]) => `<button type="button" class="fchip is-on is-removable" data-clear="${k}" aria-label="Remover filtro">${l}${icon('X')}</button>`).join('') + (out.length > 1 ? `<button type="button" class="link-btn" data-action="clear-all">Limpar tudo</button>` : '');
  }
  EZ.clearFilter = k => { const f = EZ.state.f; if (k === 'scope') f.scope = { type: 'br' }; else if (k === 'q') { f.q = ''; $$('[data-bind-q]').forEach(i => { i.value = ''; }); } else if (k === 'photo') f.photo = false; else f[k] = 'all'; };
  EZ.clearAll = () => { Object.assign(EZ.state.f, { q: '', status: 'all', category: 'all', severity: 'all', period: 'all', photo: false, scope: { type: 'br' } }); $$('[data-bind-q]').forEach(i => { i.value = ''; }); };

  /* =========================================================
     MAPA PÚBLICO
     ========================================================= */
  let M = null, sheet = null;
  P.mapa = {
    title: 'Mapa de ocorrências',
    render() {
      return `<div class="page page-map">
      ${head('Brasil · participação cidadã', 'Mapa de ocorrências', 'Relatos da comunidade sobre esgoto e poluição em rios, canais, lagoas e praias. Cada ponto é revisado pela equipe e acompanhado até o encerramento.',
        `<button type="button" class="btn btn-outline" data-action="near">${icon('LocateFixed')}Perto de mim</button><button type="button" class="btn btn-primary" data-action="register">${icon('Plus')}Registrar ocorrência</button>`)}
      <section class="kpis" id="kpis" aria-label="Resumo dos relatos publicados"></section>
      <section class="map-wrap" id="map-wrap">
        <div class="map-pane" id="map-pane">
          <div id="map" class="map" aria-label="Mapa com os relatos publicados"></div>
          <div class="map-ui">
            <div class="map-top">
              <button type="button" class="scope-btn" data-action="scope" aria-haspopup="dialog" aria-expanded="false">${icon('MapPin')}<span id="scope-label">Todo o Brasil</span>${icon('ChevronDown')}</button>
              <button type="button" class="map-btn map-filter-btn" data-action="filters" aria-haspopup="dialog" aria-expanded="false" aria-label="Filtros">${icon('SlidersHorizontal')}<span class="map-btn-txt">Filtros</span><span class="count-dot" id="filter-dot" hidden></span></button>
            </div>
            <div class="map-chips" id="map-chips" aria-label="Filtrar por andamento"></div>
            <div class="map-tools" aria-label="Controles do mapa">
              <div class="tool-col"><button type="button" data-action="zoom-in" aria-label="Aproximar">${icon('Plus')}</button><button type="button" data-action="zoom-out" aria-label="Afastar">${icon('Minus')}</button></div>
              <button type="button" class="tool" data-action="locate" aria-label="Minha localização" data-tip="Minha localização">${icon('LocateFixed')}</button>
              <button type="button" class="tool" data-action="fit" aria-label="Ver todos os relatos do filtro" data-tip="Ver todos">${icon('Scan')}</button>
              <button type="button" class="tool" data-action="layers" aria-haspopup="dialog" aria-expanded="false" aria-label="Camadas do mapa" data-tip="Camadas">${icon('Layers')}</button>
              <button type="button" class="tool hide-mobile" data-action="fullscreen" aria-label="Expandir mapa" data-tip="Expandir">${icon('Maximize')}</button>
            </div>
            <div class="map-legend" aria-hidden="true">${['triagem', 'encaminhado', 'encerrado'].map(s => `<span><i class="st-bg-${s}"></i>${EZ.STATUS[s].label}</span>`).join('')}<span class="lg-cl"><i class="lg-cluster">3</i>Grupo</span></div>
          </div>
          <div class="map-state" id="map-state"><div class="skeleton-map"></div><p>${icon('Map')}Carregando o mapa…</p></div>
        </div>
        <aside class="results" id="results" data-snap="peek" aria-label="Lista de ocorrências">
          <div class="sheet-grab" id="sheet-grab"><button type="button" class="sheet-handle" data-action="sheet-cycle" aria-label="Expandir ou recolher a lista"><span></span></button></div>
          <header class="results-head">
            <div><h2>Ocorrências</h2><p id="res-sub" class="muted">—</p></div>
            <button type="button" class="btn btn-ghost btn-sm" data-action="sort" aria-haspopup="dialog" aria-expanded="false">${icon('ArrowUpDown')}<span id="sort-label">Recentes</span></button>
          </header>
          <div class="sheet-sel" id="sheet-sel" hidden></div>
          <div class="active-filters" id="active-filters"></div>
          <div class="results-list" id="res-list" role="list"></div>
          <footer class="results-foot">${icon('ShieldCheck')}Só aparecem relatos revisados pela equipe, sem dados pessoais.</footer>
        </aside>
      </section>
    </div>`;
    },
    mount() {
      const mapEl = $('#map');
      if (!window.L) { mapFailed(); this.refresh(); return; }
      M = EZ.createMap(mapEl, { onSelect: id => selectFromMap(id), onFail: mapFailed, popups: !EZ.isMobile() });
      M.map.on('click', () => { if (EZ.isMobile() && EZ.state.selected) hideSheetSel(); });
      // o esqueleto some no primeiro bloco carregado (ou em 1,5 s, para não esconder os pinos)
      const onLoaded = () => { const s = $('#map-state'); if (s && !s.classList.contains('is-error') && !s.classList.contains('is-degraded')) s.hidden = true; };
      mapEl.addEventListener('ez-tiles', onLoaded, { once: true });
      setTimeout(onLoaded, 1500);
      this.refresh('mount');
      fitToScope(true);
      sheet = initSheet($('#results'), $('#map-wrap'));
    },
    unmount() { if (M) { M.destroy(); M = null; } if (sheet) { sheet.destroy(); sheet = null; } },
    refresh(why) {
      const f = EZ.state.f, base = pubReports();
      const rows = EZ.filterReports(base);
      const noStatus = EZ.filterReports(base, { ...f, status: 'all' });
      const cnt = EZ.countBy(noStatus, r => r.status);
      const wk = st => EZ.weekly(st === 'all' ? noStatus : noStatus.filter(r => r.status === st), 10).map(b => b.total);
      const tiles = [['all', 'No mapa', 'MapPin', noStatus.length], ['triagem', 'Em triagem', 'ScanSearch', cnt.triagem || 0], ['encaminhado', 'Encaminhados', 'Send', cnt.encaminhado || 0], ['encerrado', 'Encerrados', 'CircleCheck', cnt.encerrado || 0]];
      $('#kpis').innerHTML = tiles.map(([k, l, ic, v]) => `<button type="button" class="kpi kpi-${k}${f.status === k ? ' is-on' : ''}" data-status-tile="${k}" aria-pressed="${f.status === k}"><span class="kpi-ic">${icon(ic)}</span><span class="kpi-txt"><span class="kpi-label">${l}</span><span class="kpi-val">${v.toLocaleString('pt-BR')}</span></span>${CH.spark(wk(k), { cls: 'spark-' + k })}</button>`).join('');
      $('#map-chips').innerHTML = tiles.map(([k, l, , v]) => `<button type="button" class="mchip${f.status === k ? ' is-on' : ''}" data-status-tile="${k}" aria-pressed="${f.status === k}">${k !== 'all' ? `<i class="st-bg-${k}"></i>` : ''}${k === 'all' ? 'Todos' : EZ.STATUS[k].label}<b>${v}</b></button>`).join('');
      $('#scope-label').textContent = EZ.scope.label(f.scope);
      $('#res-sub').textContent = `${plural(rows.length, 'relato', 'relatos')} · ${EZ.scope.short(f.scope)}`;
      $('#sort-label').textContent = { recent: 'Recentes', updated: 'Atualizados', confirmed: 'Confirmados', near: 'Perto' }[f.sort];
      const nActive = EZ.activeFilterCount({ ...f, scope: { type: 'br' }, q: '' });
      const dot = $('#filter-dot'); dot.hidden = !nActive; dot.textContent = nActive || '';
      $('#active-filters').innerHTML = activeChips(f);
      $('#res-list').innerHTML = rows.length ? rows.map(r => C.row(r, { selected: r.id === EZ.state.selected, showDist: f.sort === 'near' })).join('')
        : C.empty('SearchX' in window.EZ_ICONS ? 'SearchX' : 'Search', 'Nenhum relato com esses filtros', 'Tente outro lugar ou remova filtros.', `<button type="button" class="btn btn-outline btn-sm" data-action="clear-all">Limpar filtros</button>`);
      if (M) M.setReports(rows);
      if (EZ.state.selected && !rows.some(r => r.id === EZ.state.selected)) { EZ.state.selected = null; hideSheetSel(); }
      if (why === 'scope' || why === 'filters') fitToScope();
    },
    select(id) { selectFromList(id); },
    map: () => M
  };

  function mapFailed() {
    const s = $('#map-state'); if (!s) return;
    s.hidden = false;
    if (M) {
      // O Leaflet funciona, só o fundo (imagens/ruas) não carregou: os pinos continuam visíveis e clicáveis.
      s.classList.add('is-degraded');
      s.innerHTML = `<div class="map-degraded" role="status">${icon('WifiOff')}<span>Fundo do mapa indisponível. Os pontos continuam aqui.</span><button type="button" class="link-btn" data-action="retry-map">${icon('RefreshCw')}Tentar de novo</button></div>`;
      return;
    }
    s.classList.add('is-error');
    s.innerHTML = `<div class="map-error">${icon('WifiOff')}<h3>Não conseguimos carregar o mapa</h3><p>Verifique a conexão com a internet. A lista de ocorrências continua funcionando e você pode registrar um relato informando a cidade.</p><button type="button" class="btn btn-outline btn-sm" data-action="retry-map">${icon('RefreshCw')}Tentar de novo</button></div>`;
    if (sheet) sheet.set('half');
  }

  function fitToScope(initial = false) {
    if (!M) return;
    const f = EZ.state.f; const rows = M.reports;
    const s = f.scope;
    if (s.type === 'uf' && !rows.length) { const u = EZ.UFS[s.v]; M.map.setView([u.lat, u.lng], u.z); return; }
    if (s.type === 'near' && EZ.state.userPos) { M.map.setView([EZ.state.userPos.lat, EZ.state.userPos.lng], 11); return; }
    if (s.type === 'br' && (initial || f.status === 'all')) { M.fit(rows, { maxZoom: 5, padding: EZ.isMobile() ? [30, 30] : [40, 40] }); return; }
    const mz = s.type === 'city' ? 14 : s.type === 'uf' ? 10 : s.type === 'region' ? 7 : 6;
    M.fit(rows, { maxZoom: mz });
  }

  function selectFromMap(id) {
    EZ.state.selected = id;
    $$('.rrow').forEach(el => el.classList.toggle('is-sel', el.dataset.row === id));
    if (EZ.isMobile()) showSheetSel(id);
    else { const row = $(`.rrow[data-row="${id}"]`); if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  }
  function selectFromList(id) {
    if (EZ.isMobile()) { EZ.openDetail(id); return; }
    EZ.state.selected = id;
    $$('.rrow').forEach(el => el.classList.toggle('is-sel', el.dataset.row === id));
    if (M) M.select(id, { fly: true, popup: true });
  }
  function showSheetSel(id) {
    const r = EZ.store.byId(id), box = $('#sheet-sel'); if (!r || !box) return;
    box.innerHTML = `<article class="sel-card">${C.thumb(r, 'sel-img')}<div class="sel-body"><div class="rrow-top">${C.badge(r.status)}<span class="mono muted">${r.id}</span></div><h3>${esc(r.title)}</h3><p class="meta">${icon('MapPin')}${C.where(r)}</p><div class="sel-actions"><button type="button" class="btn btn-primary btn-sm" data-open="${r.id}">Ver detalhes</button>${r.confirmedByMe || EZ.isOwn(r) ? '' : `<button type="button" class="btn btn-outline btn-sm" data-confirm="${r.id}">${icon('ThumbsUp')}Eu também vi</button>`}</div></div><button type="button" class="icon-btn sel-close" data-action="sel-close" aria-label="Fechar">${icon('X')}</button></article>`;
    box.hidden = false; $('#results').classList.add('has-sel');
    if (sheet) sheet.set('peek');
  }
  function hideSheetSel() { const box = $('#sheet-sel'); if (box) { box.hidden = true; box.innerHTML = ''; } const r = $('#results'); if (r) r.classList.remove('has-sel'); EZ.state.selected = null; if (M) M.clearSelection(); if (sheet) sheet.set(sheet.snap === 'peek' ? 'peek' : sheet.snap); }
  EZ.hideSheetSel = hideSheetSel;

  /** Painel inferior arrastável (só no celular). */
  function initSheet(el, wrap) {
    let snap = 'peek', y = 0, startY = 0, startT = 0, dragging = false, lastT = 0, lastY = 0, vel = 0;
    const grab = $('#sheet-grab', el), headEl = $('.results-head', el);
    const H = () => wrap.clientHeight;
    const peekH = () => el.classList.contains('has-sel') ? 250 : 118;
    const pos = s => { const h = H(); return { full: Math.round(h * 0.06), half: Math.round(h * 0.48), peek: h - peekH() }[s]; };
    const apply = (px, anim = true) => { y = px; el.style.transition = anim ? '' : 'none'; el.style.transform = `translate3d(0,${px}px,0)`; wrap.style.setProperty('--sheet-peek', (H() - px) + 'px'); };
    const set = s => { if (!EZ.isSheet()) { el.style.transform = ''; wrap.style.removeProperty('--sheet-peek'); return; } snap = s; el.dataset.snap = s; apply(pos(s)); const btn = $('.sheet-handle', el); if (btn) btn.setAttribute('aria-label', s === 'full' ? 'Recolher a lista' : 'Expandir a lista'); };
    const down = e => { if (!EZ.isSheet() || (e.target.closest('button') && !e.target.closest('.sheet-handle'))) return; dragging = true; startY = e.clientY; startT = y; lastT = performance.now(); lastY = e.clientY; vel = 0; el.setPointerCapture?.(e.pointerId); };
    const move = e => { if (!dragging) return; const dy = e.clientY - startY; apply(Math.max(pos('full'), Math.min(pos('peek') + 40, startT + dy)), false); const t = performance.now(); vel = (e.clientY - lastY) / Math.max(1, t - lastT); lastT = t; lastY = e.clientY; };
    const up = () => { if (!dragging) return; dragging = false; const cands = ['full', 'half', 'peek']; let target;
      if (Math.abs(vel) > 0.6) target = vel > 0 ? (snap === 'full' ? 'half' : 'peek') : (snap === 'peek' ? 'half' : 'full');
      else target = cands.reduce((a, b) => Math.abs(pos(b) - y) < Math.abs(pos(a) - y) ? b : a);
      set(target); };
    [grab, headEl].forEach(h => { h.addEventListener('pointerdown', down); });
    addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
    const onResize = () => set(snap); addEventListener('resize', onResize);
    set('peek');
    return {
      get snap() { return snap; }, set,
      cycle() { set(snap === 'peek' ? 'half' : snap === 'half' ? 'full' : 'peek'); },
      destroy() { removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); removeEventListener('resize', onResize); }
    };
  }
  EZ.sheet = () => sheet;

  /* =========================================================
     TODAS AS OCORRÊNCIAS (lista)
     ========================================================= */
  P.ocorrencias = {
    title: 'Ocorrências',
    render() {
      const f = EZ.state.f;
      return `<div class="page">
      ${head('Relatos da comunidade', 'Todas as ocorrências', 'Relatos revisados e publicados, de todo o Brasil. Filtre por lugar, andamento ou tipo de problema.', `<a class="btn btn-outline" href="#mapa">${icon('Map')}Ver no mapa</a><button type="button" class="btn btn-primary" data-action="register">${icon('Plus')}Registrar ocorrência</button>`)}
      <div class="toolbar">
        <label class="search-field">${icon('Search')}<input type="search" data-bind-q value="${esc(f.q)}" placeholder="Buscar por rio, cidade, título ou protocolo" aria-label="Buscar ocorrências"></label>
        <button type="button" class="btn btn-outline" data-action="scope" aria-haspopup="dialog" aria-expanded="false">${icon('MapPin')}<span class="scope-txt">${esc(EZ.scope.label(f.scope))}</span>${icon('ChevronDown')}</button>
        <button type="button" class="btn btn-outline" data-action="filters" aria-haspopup="dialog" aria-expanded="false">${icon('SlidersHorizontal')}Filtros<span class="count-dot" id="filter-dot" hidden></span></button>
        <button type="button" class="btn btn-ghost" data-action="sort" aria-haspopup="dialog" aria-expanded="false">${icon('ArrowUpDown')}<span id="sort-label">Recentes</span></button>
      </div>
      <div class="list-meta"><p id="res-sub" class="muted"></p><div class="active-filters" id="active-filters"></div></div>
      <h2 class="sr-only">Lista de relatos</h2><section class="cards-grid" id="cards"></section></div>`;
    },
    mount() { this.refresh(); },
    refresh() {
      const f = EZ.state.f; const rows = EZ.filterReports(pubReports());
      $('#res-sub').textContent = `${plural(rows.length, 'relato', 'relatos')} · ${EZ.scope.label(f.scope)}`;
      $('#active-filters').innerHTML = activeChips(f);
      const n = EZ.activeFilterCount({ ...f, scope: { type: 'br' }, q: '' }); const dot = $('#filter-dot'); dot.hidden = !n; dot.textContent = n || '';
      $('#sort-label').textContent = { recent: 'Recentes', updated: 'Atualizados', confirmed: 'Confirmados', near: 'Perto' }[f.sort];
      $$('.scope-txt').forEach(s => { s.textContent = EZ.scope.label(f.scope); });
      $('#cards').innerHTML = rows.length ? rows.map(r => C.card(r)).join('') : C.empty('Search', 'Nenhum relato encontrado', 'Experimente outra busca ou remova filtros.', `<button type="button" class="btn btn-outline btn-sm" data-action="clear-all">Limpar filtros</button>`);
    }
  };

  /* =========================================================
     MEUS RELATOS
     ========================================================= */
  P['meus-relatos'] = {
    title: 'Meus relatos',
    render() {
      return `<div class="page">${head('Sua participação', 'Meus relatos', 'Acompanhe o andamento do que você registrou. Você recebe um aviso a cada mudança.', `<button type="button" class="btn btn-primary" data-action="register">${icon('Plus')}Registrar ocorrência</button>`)}
      <section class="mine-stats" id="mine-stats"></section>
      <div class="tabs" role="tablist" id="mine-tabs"></div>
      <h2 class="sr-only">Seus relatos</h2><section class="cards-grid cards-mine" id="cards"></section></div>`;
    },
    mount() { this.refresh(); },
    refresh() {
      const mine = EZ.store.reports.filter(EZ.isOwn).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      const open = mine.filter(r => r.status !== 'encerrado'), closed = mine.filter(r => r.status === 'encerrado');
      const conf = mine.reduce((s, r) => s + (r.confirmations || 0), 0);
      $('#mine-stats').innerHTML = [['FileText', mine.length, 'relatos registrados'], ['Activity', open.length, 'em andamento'], ['CircleCheck', closed.length, 'encerrados'], ['Users', conf, 'confirmações da comunidade']].map(([ic, v, l]) => `<div class="mstat">${icon(ic)}<b>${v.toLocaleString('pt-BR')}</b><span>${l}</span></div>`).join('');
      const tab = EZ.state.listTab;
      const tabs = [['all', 'Todos', mine.length], ['open', 'Em andamento', open.length], ['closed', 'Encerrados', closed.length]];
      $('#mine-tabs').innerHTML = tabs.map(([k, l, n]) => `<button type="button" role="tab" class="tab${tab === k ? ' is-on' : ''}" aria-selected="${tab === k}" data-list-tab="${k}">${l}<em>${n}</em></button>`).join('');
      const rows = tab === 'open' ? open : tab === 'closed' ? closed : mine;
      $('#cards').innerHTML = rows.length ? rows.map(r => C.card(r, { mine: true })).join('') : C.empty('FileText', mine.length ? 'Nada nesta aba' : 'Você ainda não registrou nenhum relato', mine.length ? 'Os relatos aparecem aqui conforme o andamento.' : 'Viu algo estranho em um rio, canal ou praia? Leva menos de 2 minutos.', `<button type="button" class="btn btn-primary btn-sm" data-action="register">${icon('Plus')}Registrar ocorrência</button>`);
    }
  };

  /* =========================================================
     PAINEL DE GESTÃO (equipe)
     ========================================================= */
  let A = null;
  P.gestao = {
    title: 'Painel de gestão',
    render() {
      if (!EZ.isManager()) return `<div class="page">${head('Área da equipe', 'Painel de gestão', 'Onde a equipe revisa, publica e encaminha os relatos de todo o Brasil.')}
        <div class="gate">${icon('ShieldCheck')}<h2>Entre como gestor para ver o painel</h2><p>Na demonstração você pode trocar de perfil livremente. Em uma versão real, esse acesso é concedido pela equipe.</p><button type="button" class="btn btn-primary" data-role="manager">${icon('LayoutDashboard')}Ver como gestor</button></div></div>`;
      const a = EZ.state.admin;
      return `<div class="page page-admin">
      ${head('Área da equipe · Brasil', 'Painel de gestão', 'Todas as ocorrências, inclusive as que ainda aguardam triagem. Priorize, publique e encaminhe.',
        `<label class="select-inline">${icon('CalendarDays')}<select id="adm-period" aria-label="Período">${[['7', 'Últimos 7 dias'], ['30', 'Últimos 30 dias'], ['90', 'Últimos 90 dias'], ['all', 'Todo o período']].map(([v, l]) => `<option value="${v}" ${a.period === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label><button type="button" class="btn btn-outline" data-action="export">${icon('Download')}Exportar CSV</button>`)}
      <section class="kpis kpis-5" id="adm-kpis" aria-label="Indicadores da equipe"></section>
      <section class="adm-grid">
        <article class="card adm-map-card">
          <header class="card-head"><div><h2>Mapa de todas as ocorrências</h2><p class="muted" id="adm-map-sub"></p></div>
            <div class="seg seg-sm" role="radiogroup" aria-label="Visualização"><button type="button" role="radio" data-adm-view="pins" aria-checked="${a.view === 'pins'}">${icon('MapPin')}Pinos</button><button type="button" role="radio" data-adm-view="heat" aria-checked="${a.view === 'heat'}">${icon('Flame')}Calor</button></div></header>
          <div class="adm-map"><div id="adm-map" class="map"></div>
            <div class="map-tools map-tools-sm"><div class="tool-col"><button type="button" data-action="zoom-in" aria-label="Aproximar">${icon('Plus')}</button><button type="button" data-action="zoom-out" aria-label="Afastar">${icon('Minus')}</button></div><button type="button" class="tool" data-action="fit" aria-label="Ver todos">${icon('Scan')}</button><button type="button" class="tool" data-action="layers" aria-label="Camadas" aria-haspopup="dialog" aria-expanded="false">${icon('Layers')}</button></div>
            <div class="map-legend">${EZ.STATUS_ORDER.map(s => `<span><i class="st-bg-${s}"></i>${EZ.STATUS[s].label}</span>`).join('')}<span><i class="lg-draft"></i>Fora do mapa público</span></div>
          </div>
        </article>
        <div class="adm-charts">
          <article class="card"><header class="card-head"><div><h2>Relatos por semana</h2><p class="muted">Empilhados pelo andamento atual</p></div></header><div id="ch-weekly"></div></article>
          <div class="adm-charts-2">
            <article class="card"><header class="card-head"><div><h2>Por região</h2></div></header><div id="ch-region"></div></article>
            <article class="card"><header class="card-head"><div><h2>Por tipo</h2></div></header><div id="ch-cat"></div></article>
          </div>
        </div>
      </section>
      <article class="card queue">
        <header class="card-head queue-head"><div><h2>Fila de trabalho</h2><p class="muted" id="q-sub"></p></div>
          <div class="tabs tabs-sm" role="tablist" id="q-tabs"></div></header>
        <div class="queue-tools">
          <label class="search-field">${icon('Search')}<input type="search" id="q-search" value="${esc(a.q)}" placeholder="Protocolo, título, cidade…" aria-label="Buscar na fila"></label>
          <select id="q-uf" aria-label="Estado"><option value="all">Todos os estados</option>${Object.entries(EZ.UFS).sort((x, y) => x[1].name.localeCompare(y[1].name)).map(([k, u]) => `<option value="${k}" ${a.uf === k ? 'selected' : ''}>${u.name}</option>`).join('')}</select>
          <select id="q-cat" aria-label="Tipo"><option value="all">Todos os tipos</option>${EZ.CATEGORIES.map(c => `<option value="${c.key}" ${a.category === c.key ? 'selected' : ''}>${c.short}</option>`).join('')}</select>
          <select id="q-sev" aria-label="Gravidade"><option value="all">Toda gravidade</option>${Object.entries(EZ.SEVERITY).map(([k, s]) => `<option value="${k}" ${a.severity === k ? 'selected' : ''}>${s.label}</option>`).join('')}</select>
          <select id="q-sort" aria-label="Ordenar"><option value="priority" ${a.sort === 'priority' ? 'selected' : ''}>Maior prioridade</option><option value="oldest" ${a.sort === 'oldest' ? 'selected' : ''}>Esperando há mais tempo</option><option value="recent" ${a.sort === 'recent' ? 'selected' : ''}>Mais recentes</option><option value="confirmed" ${a.sort === 'confirmed' ? 'selected' : ''}>Mais confirmados</option></select>
        </div>
        <div class="table-wrap"><table class="qtable"><thead><tr><th scope="col">Prioridade</th><th scope="col">Protocolo</th><th scope="col">Ocorrência</th><th scope="col">Local</th><th scope="col">Recebido</th><th scope="col" class="num">Confirm.</th><th scope="col">Andamento</th><th scope="col">Mapa</th><th scope="col"><span class="sr-only">Ação</span></th></tr></thead><tbody id="q-body"></tbody></table></div>
      </article></div>`;
    },
    mount() {
      if (!EZ.isManager()) return;
      const el = $('#adm-map');
      if (window.L) { A = EZ.createMap(el, { manager: true, onSelect: () => { }, popups: true }); if (EZ.state.admin.view === 'heat') A.setHeat(true); }
      this.refresh('mount');
      if (A) A.fit(A.reports, { maxZoom: 5, padding: [24, 24] });
      $('#adm-period').addEventListener('change', e => { EZ.state.admin.period = e.target.value; this.refresh('period'); if (A) A.fit(A.reports, { maxZoom: 6, padding: [24, 24] }); });
      const bind = (id, k) => $(id).addEventListener(id === '#q-search' ? 'input' : 'change', EZ.u.debounce(e => { EZ.state.admin[k] = e.target.value; this.refreshQueue(); }, id === '#q-search' ? 150 : 0));
      bind('#q-search', 'q'); bind('#q-uf', 'uf'); bind('#q-cat', 'category'); bind('#q-sev', 'severity'); bind('#q-sort', 'sort');
    },
    unmount() { if (A) { A.destroy(); A = null; } },
    periodRows() { const p = EZ.state.admin.period; const now = Date.now(); return EZ.store.reports.filter(r => p === 'all' || now - new Date(r.createdAt).getTime() <= Number(p) * 864e5); },
    refresh(why) {
      if (!EZ.isManager()) return;
      const rows = this.periodRows(); const all = EZ.store.reports;
      const pending = all.filter(r => r.status === 'recebido');
      const late = pending.filter(EZ.slaLate);
      const oldest = pending.reduce((m, r) => Math.max(m, hoursSince(r.createdAt)), 0);
      const tri = rows.map(r => { const e = r.history.find(h => h.status === 'triagem'); return e ? (new Date(e.date) - new Date(r.createdAt)) / 3600e3 : null; }).filter(v => v != null && v >= 0);
      const avgTri = tri.length ? tri.reduce((s, v) => s + v, 0) / tri.length : 0;
      const cnt = EZ.countBy(rows, r => r.status);
      const spark = EZ.weekly(rows, 10).map(b => b.total);
      const k = [
        ['recebidos', 'Relatos no período', 'Inbox', rows.length.toLocaleString('pt-BR'), `${EZ.countBy(rows, r => r.uf) ? Object.keys(EZ.countBy(rows, r => r.uf)).length : 0} estados`, CH.spark(spark)],
        ['pendentes', 'Aguardando triagem', 'Hourglass', pending.length, late.length ? `<b class="t-danger">${late.length} fora do prazo de 48&nbsp;h</b>` : oldest ? `mais antigo ${oldest < 24 ? 'há ' + Math.round(oldest) + ' h' : 'há ' + Math.round(oldest / 24) + ' dias'}` : 'fila em dia', ''],
        ['tempo', 'Tempo médio até a triagem', 'Timer', avgTri ? (avgTri < 48 ? Math.round(avgTri) + ' h' : (avgTri / 24).toFixed(1).replace('.', ',') + ' dias') : '—', 'meta: até 48 h', ''],
        ['encaminhados', 'Encaminhados', 'Send', cnt.encaminhado || 0, 'aguardando resposta do órgão', ''],
        ['encerrados', 'Encerrados', 'CircleCheck', cnt.encerrado || 0, rows.length ? `${Math.round((cnt.encerrado || 0) / rows.length * 100)}% do período` : '—', '']
      ];
      $('#adm-kpis').innerHTML = k.map(([key, l, ic, v, sub, sp]) => `<div class="kpi kpi-static kpi-${key}"><span class="kpi-ic">${icon(ic)}</span><span class="kpi-txt"><span class="kpi-label">${l}</span><span class="kpi-val">${v}</span><span class="kpi-sub">${sub}</span></span>${sp}</div>`).join('');
      $('#adm-map-sub').textContent = `${plural(rows.length, 'relato', 'relatos')} · ${rows.filter(r => !r.published).length} fora do mapa público`;
      $('#ch-weekly').innerHTML = CH.weeklyStacked(EZ.weekly(rows, 10));
      const byReg = EZ.countBy(rows, r => EZ.region(r));
      $('#ch-region').innerHTML = CH.hbars(EZ.REGIONS.map(g => ({ label: g, value: byReg[g] || 0 })).sort((x, y) => y.value - x.value), { cls: 'fill-series-1' });
      const byCat = EZ.countBy(rows, r => r.category);
      $('#ch-cat').innerHTML = CH.hbars(EZ.CATEGORIES.map(c => ({ label: c.short, value: byCat[c.key] || 0 })).filter(x => x.value).sort((x, y) => y.value - x.value), { cls: 'fill-series-2' });
      if (A) A.setReports(rows);
      this.refreshQueue();
    },
    queueRows() {
      const a = EZ.state.admin; const q = EZ.u.norm(a.q);
      let rows = this.periodRows();
      rows = rows.filter(r => a.tab === 'fila' ? r.status === 'recebido' : a.tab === 'andamento' ? (r.status === 'triagem' || r.status === 'encaminhado') : a.tab === 'encerrados' ? r.status === 'encerrado' : true)
        .filter(r => (a.uf === 'all' || r.uf === a.uf) && (a.category === 'all' || r.category === a.category) && (a.severity === 'all' || r.severity === a.severity))
        .filter(r => !q || EZ.u.norm([r.id, r.title, r.city, r.uf, r.waterName].join(' ')).includes(q));
      const s = { priority: (x, y) => EZ.priority(y).score - EZ.priority(x).score, oldest: (x, y) => new Date(x.createdAt) - new Date(y.createdAt), recent: (x, y) => new Date(y.createdAt) - new Date(x.createdAt), confirmed: (x, y) => (y.confirmations || 0) - (x.confirmations || 0) };
      return rows.sort(s[a.sort] || s.priority);
    },
    refreshQueue() {
      const a = EZ.state.admin, base = this.periodRows();
      const n = { fila: base.filter(r => r.status === 'recebido').length, andamento: base.filter(r => r.status === 'triagem' || r.status === 'encaminhado').length, encerrados: base.filter(r => r.status === 'encerrado').length, todos: base.length };
      $('#q-tabs').innerHTML = [['fila', 'Triagem pendente'], ['andamento', 'Em andamento'], ['encerrados', 'Encerrados'], ['todos', 'Todos']].map(([key, l]) => `<button type="button" role="tab" class="tab${a.tab === key ? ' is-on' : ''}" aria-selected="${a.tab === key}" data-adm-tab="${key}">${l}<em>${n[key]}</em></button>`).join('');
      const rows = this.queueRows();
      $('#q-sub').textContent = rows.length ? `${plural(rows.length, 'relato', 'relatos')} nesta visão` : 'Nenhum relato nesta visão';
      $('#q-body').innerHTML = rows.length ? rows.map(r => {
        const late = EZ.slaLate(r); const cat = EZ.CATEGORY[r.category];
        return `<tr data-open="${r.id}" data-manage="1" tabindex="0">
          <td data-label="Prioridade">${C.prio(r)}</td>
          <td data-label="Protocolo"><span class="mono">${r.id}</span></td>
          <td data-label="Ocorrência" class="q-title"><b>${esc(r.title)}</b><small>${icon(cat.icon)}${cat.short} · ${EZ.SEVERITY[r.severity].label}${r.ongoing ? ' · acontecendo' : ''}</small></td>
          <td data-label="Local"><span>${esc(r.city)}/${r.uf}</span><small>${esc(r.waterName)}</small></td>
          <td data-label="Recebido"><span class="${late ? 't-danger' : ''}">${ago(r.createdAt)}</span>${late ? `<small class="t-danger">${icon('TriangleAlert')}fora do prazo</small>` : `<small>${EZ.u.fmtShort(r.createdAt)}</small>`}</td>
          <td data-label="Confirmações" class="num">${r.confirmations || 0}</td>
          <td data-label="Andamento">${C.badge(r.status)}</td>
          <td data-label="Mapa">${r.published ? `<span class="pubflag is-on">${icon('Eye')}Público</span>` : `<span class="pubflag">${icon('EyeOff')}Oculto</span>`}</td>
          <td><button type="button" class="btn btn-outline btn-sm" data-open="${r.id}" data-manage="1">${icon('ClipboardCheck')}Revisar</button></td></tr>`;
      }).join('') : `<tr class="q-empty"><td colspan="9">${C.empty('CircleCheckBig', a.tab === 'fila' ? 'Fila de triagem em dia' : 'Nada por aqui', a.tab === 'fila' ? 'Nenhum relato aguardando triagem neste período.' : 'Ajuste os filtros para ver outros relatos.')}</td></tr>`;
    },
    exportCSV() {
      const rows = this.queueRows();
      const cols = ['protocolo', 'titulo', 'tipo', 'gravidade', 'andamento', 'publicado', 'cidade', 'uf', 'regiao', 'corpo_dagua', 'latitude', 'longitude', 'registrado_em', 'confirmacoes', 'prioridade'];
      const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const lines = [cols.join(';'), ...rows.map(r => [r.id, r.title, EZ.CATEGORY[r.category].label, EZ.SEVERITY[r.severity].label, EZ.STATUS[r.status].label, r.published ? 'sim' : 'não', r.city, r.uf, EZ.region(r), r.waterName, String(r.lat).replace('.', ','), String(r.lng).replace('.', ','), EZ.u.fmtDateTime(r.createdAt), r.confirmations || 0, EZ.priority(r).level].map(q).join(';'))];
      EZ.ui.download(`esgotozero-fila-${new Date().toISOString().slice(0, 10)}.csv`, '﻿' + lines.join('\r\n'));
      EZ.ui.toast(`${plural(rows.length, 'linha exportada', 'linhas exportadas')} (CSV para Excel).`, { type: 'ok' });
    },
    map: () => A
  };

  /* =========================================================
     ODS 6 NO BRASIL
     ========================================================= */
  P.ods = {
    title: 'ODS 6 no Brasil',
    render() {
      const o = EZ.ODS, n = o.national;
      const nums = [
        [fmtPct(n.coleta), 'da população tem coleta de esgoto', 'Droplets'],
        [fmtPct(n.tratamento), 'do esgoto gerado recebe tratamento', 'Factory'],
        [`~${n.semColetaMi} mi`, `de pessoas sem coleta (${fmtPct(n.semColetaPct)})`, 'Users'],
        [`${o.target.esgoto}%`, `meta de coleta e tratamento até ${o.target.ano}`, 'Target']
      ];
      return `<div class="page page-ods">
      <section class="ods-hero">
        <div class="ods-badge" aria-hidden="true"><span>ODS</span><b>6</b></div>
        <div class="ods-hero-txt"><p class="eyebrow">Agenda 2030 · Nações Unidas</p><h1>Água potável e saneamento para todas as pessoas</h1>
          <p class="lede">O esgoto que não é coletado nem tratado chega aos rios, córregos, lagoas e ao mar. O EsgotoZero transforma o que a comunidade observa em relatos organizados, acompanhados até uma resposta.</p>
          <div class="chips"><span class="chip chip-ods6">ODS 6 · Água potável e saneamento</span><span class="chip chip-ods14">ODS 14 · Vida na água</span></div></div>
      </section>
      <section class="ods-nums" aria-label="Saneamento no Brasil em ${o.year}">${nums.map(([v, l, ic]) => `<div class="onum">${icon(ic)}<b>${v}</b><span>${l}</span></div>`).join('')}</section>
      <p class="source-line">${icon('Info')}Dados de ${o.year} do SINISA (Ministério das Cidades), divulgados pelo Instituto Trata Brasil em 2026. Meta do Marco Legal do Saneamento (Lei 14.026/2020).</p>
      <section class="ods-grid">
        <article class="card"><header class="card-head"><div><h2>Esgoto por região</h2><p class="muted">Quem mais precisa está no Norte e no Nordeste: só ${fmtPct(o.regions.find(r => r.name === 'Norte').coleta)} da população do Norte tem coleta.</p></div></header>
          ${CH.groupedPct(o.regions, [{ key: 'coleta', label: 'População com coleta', cls: 'fill-series-1', sw: 'sw-series-1' }, { key: 'tratamento', label: 'Esgoto tratado', cls: 'fill-series-2', sw: 'sw-series-2' }], { target: o.target.esgoto, targetLabel: `Meta ${o.target.ano}: ${o.target.esgoto}%` })}
          <details class="table-toggle"><summary>Ver os números em tabela</summary><table class="mini-table"><thead><tr><th>Região</th><th class="num">Coleta</th><th class="num">Tratamento</th></tr></thead><tbody>${o.regions.map(r => `<tr><td>${r.name}</td><td class="num">${fmtPct(r.coleta)}</td><td class="num">${fmtPct(r.tratamento)}</td></tr>`).join('')}<tr><td><b>Brasil</b></td><td class="num"><b>${fmtPct(n.coleta)}</b></td><td class="num"><b>${fmtPct(n.tratamento)}</b></td></tr></tbody></table></details>
        </article>
        <article class="card metas"><header class="card-head"><div><h2>As metas que o projeto apoia</h2></div></header>
          <div class="meta-item"><span class="meta-n ods6">6.3</span><div><h3>Qualidade da água</h3><p>Até 2030, melhorar a qualidade da água, reduzindo a poluição e eliminando despejos, com metade das águas residuais não tratadas a menos.</p><p class="how">${icon('ArrowRight')}Cada relato marca um ponto provável de despejo que pode ser verificado.</p></div></div>
          <div class="meta-item"><span class="meta-n ods6">6.b</span><div><h3>Participação da comunidade</h3><p>Apoiar e fortalecer a participação das comunidades locais para melhorar a gestão da água e do saneamento.</p><p class="how">${icon('ArrowRight')}Qualquer pessoa registra, confirma e acompanha o andamento de forma pública.</p></div></div>
          <div class="meta-item"><span class="meta-n ods14">14.1</span><div><h3>Poluição marinha</h3><p>Prevenir e reduzir a poluição do mar, em especial a que vem de atividades em terra.</p><p class="how">${icon('ArrowRight')}Rios e canais urbanos levam o esgoto até as praias e manguezais.</p></div></div>
        </article>
      </section>
      <section class="card how-card"><header class="card-head"><div><h2>Como o EsgotoZero funciona</h2><p class="muted">Da observação ao acompanhamento</p></div></header>
        <ol class="how-steps">
          <li><span class="hs-n">1</span>${icon('Smartphone')}<h3>Você registra</h3><p>Marca o ponto no mapa, escolhe o que viu e, se quiser, envia uma foto tirada de um lugar seguro.</p></li>
          <li><span class="hs-n">2</span>${icon('ScanSearch')}<h3>A equipe revisa</h3><p>Confere local, fotos e privacidade antes de publicar. Relatos parecidos são reunidos.</p></li>
          <li><span class="hs-n">3</span>${icon('Send')}<h3>O relato é encaminhado</h3><p>Seguem para a companhia de saneamento, o órgão ambiental ou a prefeitura, com protocolo.</p></li>
          <li><span class="hs-n">4</span>${icon('Users')}<h3>Todos acompanham</h3><p>A comunidade confirma, acompanha cada etapa e vê o motivo do encerramento.</p></li>
        </ol></section>
      <section class="ods-grid">
        <article class="card"><header class="card-head"><div><h2>Canais oficiais</h2><p class="muted">O EsgotoZero não substitui os canais públicos. Use-os também.</p></div></header>
          <ul class="channels">
            <li>${icon('Droplets')}<div><b>Companhia de saneamento da sua cidade</b><p>Vazamento ou extravasamento de esgoto na rua. Em SP, a Sabesp atende no <span class="mono">0800 055 0195</span>.</p></div></li>
            <li>${icon('Factory')}<div><b>Órgão ambiental do seu estado</b><p>Poluição de rios e praias. Em SP, o Disque Ambiente da CETESB atende 24 h no <span class="mono">0800 500 1350</span>, e há o sistema Denúncia Ambiente (denuncia.sigam.sp.gov.br).</p></div></li>
            <li>${icon('Landmark')}<div><b>Ibama · Linha Verde</b><p>Denúncia ambiental em todo o Brasil: <span class="mono">0800 061 8080</span> ou pelo Fala.BR.</p></div></li>
            <li>${icon('Building2')}<div><b>Prefeitura</b><p>Bueiros, galerias e lixo em córregos. Em muitas cidades, pelo <span class="mono">156</span>.</p></div></li>
          </ul>
          <p class="note warn">${icon('TriangleAlert')}Risco imediato a pessoas? Ligue 193 (Bombeiros) ou 199 (Defesa Civil). Não se aproxime nem toque na água.</p>
        </article>
        <article class="card"><header class="card-head"><div><h2>Sobre esta demonstração</h2></div></header>
          <div class="prose"><p>Os relatos do mapa são <b>fictícios</b> e as fotos são <b>ilustrativas</b>. Os dados que você cria ficam só neste navegador e nada é enviado a órgãos públicos.</p><p>Você pode testar os dois lados: registrar como cidadão e revisar como gestor.</p></div>
          <div class="btn-row"><button type="button" class="btn btn-outline" data-role="${EZ.isManager() ? 'citizen' : 'manager'}">${icon('Users')}${EZ.isManager() ? 'Ver como cidadão' : 'Ver como gestor'}</button><button type="button" class="btn btn-ghost" data-action="register">${icon('Plus')}Registrar um relato</button></div>
          <h3 class="sources-title">Fontes</h3><ul class="sources">${o.sources.map(s => `<li><a href="${s.url}" target="_blank" rel="noopener">${esc(s.label)}${icon('ExternalLink')}</a></li>`).join('')}</ul>
          <h3 class="sources-title">Créditos</h3><p class="credits">Mapa: Esri (imagens: Maxar, Earthstar Geographics; ruas e nomes: Esri, HERE, Garmin) · © OpenStreetMap · Leaflet (BSD-2) · Leaflet.markercluster (MIT). Ícones: Lucide (ISC). Fontes: Bricolage Grotesque, Figtree e JetBrains Mono (SIL OFL). Municípios: IBGE via kelvins/municipios-brasileiros (MIT). Fotos ilustrativas: rio por Ingo Stiller (Unsplash License) e tubulação por Paul McIlroy/Geograph (CC BY-SA 2.0), recortadas.</p>
        </article>
      </section></div>`;
    },
    mount() { }, refresh() { }
  };
})();
