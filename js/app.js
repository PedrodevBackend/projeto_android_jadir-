/* EsgotoZero · rotas, eventos globais e inicialização. */
'use strict';
(function () {
  const EZ = window.EZ, { $, $$, icon, debounce } = EZ.u;
  const ROUTES = ['mapa', 'ocorrencias', 'meus-relatos', 'gestao', 'ods'];
  const TITLES = { mapa: 'Mapa de ocorrências', ocorrencias: 'Ocorrências', 'meus-relatos': 'Meus relatos', gestao: 'Painel de gestão', ods: 'ODS 6 no Brasil' };
  let current = null;
  const page = () => EZ.pages[current];
  const mapApi = () => (page() && page().map ? page().map() : null);

  /* ---------------- rotas ---------------- */
  function route() {
    let h = decodeURIComponent(location.hash.slice(1));
    let openId = null;
    if (h.startsWith('relato-')) { openId = h.slice(7); h = current || 'mapa'; history.replaceState(null, '', '#' + h); }
    let openRegister = false;
    if (h === 'registrar') { openRegister = true; h = current || 'mapa'; history.replaceState(null, '', '#' + h); }
    if (!ROUTES.includes(h)) h = 'mapa';
    if (h !== current || !$('#main').firstElementChild) {
      if (page() && page().unmount) page().unmount();
      EZ.ui.pop.close();
      current = h; EZ.state.route = h;
      const main = $('#main');
      main.innerHTML = page().render();
      document.body.dataset.route = h;
      if (page().mount) page().mount();
      main.focus({ preventScroll: true });
      if (!openId) window.scrollTo(0, 0);
    }
    $$('[data-nav]').forEach(a => { const on = a.dataset.nav === current; a.classList.toggle('is-active', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    document.title = `${TITLES[current]} · EsgotoZero`;
    const mt = $('#mobile-title'); if (mt) mt.textContent = TITLES[current];
    if (openId) setTimeout(() => EZ.openDetail(openId), 250);
    if (openRegister) setTimeout(() => EZ.startRegister(), 250);
  }
  EZ.go = r => { if (location.hash === '#' + r) route(); else { EZ.ui.dropGuard(); location.hash = r; } };
  EZ.currentRoute = () => current;
  EZ.refreshPage = (why = 'data') => { const p = page(); if (p && p.refresh) p.refresh(why); };

  /* ---------------- moldura (menu lateral, barra superior, navegação inferior) ---------------- */
  EZ.refreshChrome = () => {
    const p = EZ.store.prefs, mgr = EZ.isManager();
    const mine = EZ.store.reports.filter(EZ.isOwn);
    const pending = EZ.store.reports.filter(r => r.status === 'recebido').length;
    const unread = EZ.notifications().filter(n => n.unread).length;
    const initials = p.name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'EZ';
    $$('[data-count="mine"]').forEach(e => { e.textContent = mine.length; e.hidden = !mine.length; });
    $$('[data-count="pending"]').forEach(e => { e.textContent = pending; e.hidden = !pending; });
    $$('[data-unread]').forEach(e => { e.hidden = !unread; e.textContent = unread > 9 ? '9+' : unread; });
    $$('.mgr-only').forEach(e => { e.hidden = !mgr; });
    $$('.cit-only').forEach(e => { e.hidden = mgr; });
    $$('[data-avatar]').forEach(e => { e.textContent = initials; });
    $$('[data-username]').forEach(e => { e.textContent = p.name.split(' ')[0]; });
    $$('[data-rolelabel]').forEach(e => { e.textContent = mgr ? 'Gestor · demonstração' : 'Cidadão · demonstração'; });
    $$('[data-role-seg]').forEach(b => { b.setAttribute('aria-checked', String((b.dataset.roleSeg === 'manager') === mgr)); });
    const dark = document.documentElement.dataset.theme === 'dark';
    $$('[data-action="theme"]').forEach(b => { b.innerHTML = icon(dark ? 'Sun' : 'Moon'); b.setAttribute('aria-label', dark ? 'Usar tema claro' : 'Usar tema escuro'); b.dataset.tip = dark ? 'Tema claro' : 'Tema escuro'; });
    document.body.classList.toggle('is-manager', mgr);
    document.body.classList.toggle('sb-collapsed', p.sidebar === 'collapsed');
  };
  EZ.emitTheme = () => { EZ.refreshChrome(); };

  /* ---------------- ações ---------------- */
  async function nearMe() {
    EZ.ui.toast('Aguardando a permissão de localização…');
    try {
      const p = await EZ.geo.locate();
      EZ.state.userPos = p; EZ.state.f.scope = { type: 'near', lat: p.lat, lng: p.lng, km: 50 }; EZ.state.f.sort = 'near';
      if (current !== 'mapa' && current !== 'ocorrencias') EZ.go('mapa');
      EZ.refreshPage('scope');
      const m = mapApi(); if (m) m.showUser(p.lat, p.lng, p.acc);
      EZ.ui.toast('Mostrando relatos até 50 km de você.', { type: 'ok', action: { label: 'Brasil todo', fn: () => { EZ.state.f.scope = { type: 'br' }; EZ.state.f.sort = 'recent'; EZ.refreshPage('scope'); } } });
    } catch (e) { EZ.ui.toast(e.message, { type: 'warn' }); }
  }
  function showOnMap(id) {
    EZ.ui.drawer.close(); EZ.ui.modal.close();
    EZ.clearAll(); EZ.state.selected = id;
    const go = () => { const m = mapApi(); if (m) { m.select(id, { fly: true, popup: !EZ.isMobile(), zoom: 15 }); if (EZ.isMobile()) { const s = EZ.sheet && EZ.sheet(); if (s) s.set('peek'); } } };
    if (current !== 'mapa') { EZ.go('mapa'); setTimeout(go, 500); } else { EZ.refreshPage('filters'); setTimeout(go, 350); }
  }
  function toggleFullscreen(btn) {
    const pane = $('#map-pane'); if (!pane) return;
    const on = !pane.classList.contains('is-full'); pane.classList.toggle('is-full', on); document.body.classList.toggle('map-full', on);
    btn.innerHTML = icon(on ? 'Minimize' : 'Maximize'); btn.setAttribute('aria-label', on ? 'Sair da tela cheia' : 'Expandir mapa');
  }
  function setScope(s) {
    if (s.type === 'near') { nearMe(); return; }
    EZ.state.f.scope = s;
    if (EZ.state.f.sort === 'near') EZ.state.f.sort = 'recent';
    EZ.refreshPage('scope');
  }

  const actions = {
    register: () => { EZ.ui.pop.close(); EZ.ui.drawer.close(); EZ.startRegister(); },
    'register-new': () => EZ.startRegister({ fresh: true }),
    near: nearMe,
    locate: nearMe,
    scope: b => EZ.openScope(b, setScope),
    filters: b => EZ.openFilters(b, () => { EZ.refreshPage('filters'); return EZ.filterReports(EZ.store.reports.filter(r => r.published)).length; }),
    sort: b => EZ.openSort(b, k => { if (k === 'near' && !EZ.state.userPos) { nearMe(); return; } EZ.state.f.sort = k; EZ.refreshPage('sort'); }),
    layers: b => { const m = mapApi(); EZ.openLayers(b, { heat: current === 'gestao', heatOn: EZ.state.admin.view === 'heat' }, ch => { if (!m) return; if (ch.basemap || 'labels' in ch) m.setBasemap(EZ.store.prefs.basemap); if ('heat' in ch) { EZ.state.admin.view = ch.heat ? 'heat' : 'pins'; m.setHeat(ch.heat); $$('[data-adm-view]').forEach(x => x.setAttribute('aria-checked', String(x.dataset.admView === EZ.state.admin.view))); } }); },
    'zoom-in': () => { const m = mapApi(); if (m) m.map.zoomIn(); },
    'zoom-out': () => { const m = mapApi(); if (m) m.map.zoomOut(); },
    fit: () => { const m = mapApi(); if (m) m.fit(m.reports, { maxZoom: 12 }); },
    fullscreen: b => toggleFullscreen(b),
    'sheet-cycle': () => { const s = EZ.sheet && EZ.sheet(); if (s) s.cycle(); },
    'sel-close': () => EZ.hideSheetSel(),
    'retry-map': () => { const r = current; current = null; location.hash === '#' + r ? route() : EZ.go(r); },
    'clear-all': () => { EZ.clearAll(); EZ.ui.pop.close(); EZ.refreshPage('filters'); },
    export: () => EZ.pages.gestao.exportCSV(),
    print: () => window.print(),
    theme: () => { const dark = document.documentElement.dataset.theme === 'dark'; EZ.store.prefs.theme = dark ? 'light' : 'dark'; EZ.store.savePrefs(); EZ.applyTheme(); EZ.refreshChrome(); },
    notifications: b => EZ.openNotifications(b),
    profile: b => EZ.openProfile(b),
    palette: () => EZ.palette.open(),
    'read-all': () => EZ.markAllRead(),
    'about-demo': () => { EZ.ui.pop.close(); EZ.aboutDemo(); },
    'reset-demo': () => { EZ.ui.pop.close(); EZ.confirmReset(); },
    'confirm-reset': () => { EZ.store.reset(); EZ.ui.modal.close(); EZ.clearAll(); EZ.ui.toast('Exemplos originais restaurados.', { type: 'ok' }); },
    'draft-resume': () => EZ.resumeDraft(),
    'draft-discard': () => EZ.discardDraft(),
    'wz-back': () => EZ.wzBack(),
    'wz-locate': () => EZ.wzLocate(),
    'wz-layer': () => EZ.wzLayer(),
    'wz-zoom-in': () => EZ.wzZoom(1),
    'wz-zoom-out': () => EZ.wzZoom(-1),
    'wz-apply-coords': () => EZ.wzApplyCoords(),
    'wz-city': () => EZ.wzChooseCity(),
    'wz-photo-remove': () => EZ.removePhoto(),
    'wz-goto': b => EZ.wzGoto(Number(b.dataset.step)),
    'wz-resume-anyway': () => EZ.wzResume(),
    'sidebar-toggle': () => { EZ.store.prefs.sidebar = EZ.store.prefs.sidebar === 'collapsed' ? 'expanded' : 'collapsed'; EZ.store.savePrefs(); EZ.refreshChrome(); }
  };

  document.addEventListener('click', e => {
    const t = e.target;
    const closeBtn = t.closest('[data-close]');
    if (closeBtn) { const d = closeBtn.closest('dialog'); if (d) d.close(); else EZ.ui.pop.close(); return; }
    const pal = t.closest('.pal-item');
    if (pal) {
      EZ.palette.close();
      if (pal.dataset.palOpen) EZ.openDetail(pal.dataset.palOpen);
      else if (pal.dataset.palScope) { setScope({ type: 'uf', v: pal.dataset.v }); if (current !== 'mapa') EZ.go('mapa'); }
      else if (pal.dataset.palCity) { const [c, uf] = pal.dataset.palCity.split('|'); const has = EZ.store.reports.some(r => r.published && r.city === c && r.uf === uf); if (has) setScope({ type: 'city', v: pal.dataset.palCity }); if (current !== 'mapa') EZ.go('mapa'); setTimeout(() => { const m = mapApi(); if (m) m.map.setView([+pal.dataset.lat, +pal.dataset.lng], 12); if (!has) EZ.ui.toast(`Ainda não há relatos publicados em ${c}/${uf}.`, { action: { label: 'Registrar', fn: () => EZ.startRegister() } }); }, current === 'mapa' ? 50 : 500); }
      else if (pal.dataset.palAct) { const a = pal.dataset.palAct; if (a.startsWith('go:')) EZ.go(a.slice(3)); else if (a === 'register') EZ.startRegister(); else if (a === 'theme') actions.theme(); else if (a === 'role') EZ.setRole(EZ.isManager() ? 'citizen' : 'manager'); }
      return;
    }
    const el = t.closest('button, a, [data-open], [data-select]');
    if (!el) return;
    const ds = el.dataset;
    if (ds.open) { e.preventDefault(); EZ.ui.pop.close(); if ($('#dlg').open && !el.closest('#drawer')) EZ.ui.modal.close(); EZ.openDetail(ds.open, { focusManage: !!ds.manage }); return; }
    if (ds.select) { EZ.pages.mapa.select(ds.select); return; }
    if (ds.confirm) { EZ.toggleConfirm(ds.confirm); if (EZ.currentRoute() === 'mapa' && EZ.isMobile()) { const b = $('#sheet-sel [data-confirm]'); if (b) b.remove(); } return; }
    if (ds.wzConfirm) { EZ.wzConfirmExisting(ds.wzConfirm); return; }
    if (ds.copy) { EZ.ui.copy(ds.copy, `Protocolo ${ds.copy} copiado.`); return; }
    if (ds.share) { EZ.share(ds.share); return; }
    if (ds.showOnMap) { showOnMap(ds.showOnMap); return; }
    if (ds.statusTile) { const f = EZ.state.f; f.status = (f.status === ds.statusTile || ds.statusTile === 'all') ? 'all' : ds.statusTile; EZ.refreshPage('status'); return; }
    if (ds.clear) { EZ.clearFilter(ds.clear); EZ.refreshPage(ds.clear === 'scope' ? 'scope' : 'filters'); return; }
    if (ds.role) { EZ.setRole(ds.role); return; }
    if (ds.roleSeg) { EZ.setRole(ds.roleSeg); return; }
    if (ds.themeSet) { EZ.store.prefs.theme = ds.themeSet; EZ.store.savePrefs(); EZ.applyTheme(); EZ.refreshChrome(); $$('[data-theme-set]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.themeSet === ds.themeSet))); return; }
    if (ds.listTab) { EZ.state.listTab = ds.listTab; EZ.refreshPage('tab'); return; }
    if (ds.admTab) { EZ.state.admin.tab = ds.admTab; EZ.pages.gestao.refreshQueue(); return; }
    if (ds.admView) { EZ.state.admin.view = ds.admView; const m = mapApi(); if (m) m.setHeat(ds.admView === 'heat'); $$('[data-adm-view]').forEach(x => x.setAttribute('aria-checked', String(x.dataset.admView === ds.admView))); return; }
    if (ds.action && actions[ds.action]) { e.preventDefault(); actions[ds.action](el, e); }
  });

  /* Linhas da tabela da equipe: clique e Enter abrem a ficha. */
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.matches('tr[data-open]')) { EZ.openDetail(e.target.dataset.open, { focusManage: true }); return; }
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
    if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); EZ.palette.open(); return; }
    if (e.key === '/' && !typing && !$('dialog[open]')) { e.preventDefault(); EZ.palette.open(); return; }
    if (e.key === 'Escape') {
      if (EZ.ui.pop.isOpen()) { EZ.ui.pop.close(); return; }
      const pane = $('#map-pane.is-full'); if (pane && !$('dialog[open]')) { const b = $('[data-action="fullscreen"]'); if (b) toggleFullscreen(b); }
    }
  });

  document.addEventListener('submit', e => {
    const f = e.target;
    if (f.id === 'wz-form') { e.preventDefault(); EZ.wzNext(); }
    else if (f.id === 'manage-form') { e.preventDefault(); EZ.saveManage(f); }
    else if (f.id === 'name-form') { e.preventDefault(); const v = String(new FormData(f).get('name') || '').trim(); if (v.length < 2) { EZ.ui.toast('Informe um nome com pelo menos 2 letras.', { type: 'warn' }); return; } EZ.store.prefs.name = v; EZ.store.savePrefs(); EZ.refreshChrome(); EZ.ui.pop.close(); EZ.ui.modal.close(); EZ.ui.toast('Nome atualizado.', { type: 'ok' }); }
  });

  document.addEventListener('change', e => {
    const t = e.target;
    if (t.matches('[data-photo]')) { EZ.handlePhoto(t.files && t.files[0]); t.value = ''; return; }
    if (t.closest('#manage-form') && t.name === 'status') {
      const f = t.closest('form');
      // os campos de encaminhamento só aparecem quando o relato MUDA para "Encaminhado"
      $$('.cond', f).forEach(c => { c.hidden = c.dataset.when !== t.value || (c.dataset.when === 'encaminhado' && f.dataset.current === 'encaminhado'); });
      const hint = $('#status-hint', f); if (hint) hint.textContent = EZ.STATUS[t.value].desc;
      const pub = $('#mf-published', f); if (pub && t.value === 'recebido') pub.checked = false;
      if (pub && (t.value === 'triagem') && !pub.checked && !EZ.store.byId(f.dataset.id).published) pub.checked = true;
    }
  });

  const refreshQ = debounce(() => EZ.refreshPage('q'), 180);
  document.addEventListener('input', e => {
    const t = e.target;
    if (t.matches('[data-bind-q]')) { EZ.state.f.q = t.value.trim(); refreshQ(); return; }
    if (t.matches('textarea[maxlength], input[maxlength]')) { const c = $(`.counter[data-for="${t.id}"]`); if (c && t.id === 'mf-note') c.textContent = `${t.value.length}/${t.maxLength}`; }
  });

  /* Mudanças nos dados (esta aba ou outra aba do mesmo site). */
  EZ.store.on(why => { EZ.refreshChrome(); EZ.refreshPage(why); });
  addEventListener('storage', e => { if (e.key === 'esgotozero.v2' && e.newValue) { try { const d = JSON.parse(e.newValue); if (EZ.store.isValid(d)) { EZ.store.reports = d.reports; EZ.store.emit('sync'); } } catch { /* ignora dados inválidos */ } } });
  addEventListener('hashchange', () => { EZ.ui.dropGuard(); EZ.ui.modal.close(); if (!location.hash.startsWith('#relato-')) EZ.ui.drawer.close(); route(); });
  let wasMobile = EZ.isMobile();
  addEventListener('resize', debounce(() => { const m = EZ.isMobile(); if (m !== wasMobile) { wasMobile = m; const r = current; current = null; if (r) { location.hash === '#' + r ? route() : EZ.go(r); } } }, 250));

  /* ---------------- início ---------------- */
  document.addEventListener('DOMContentLoaded', () => {
    EZ.store.load();
    EZ.applyTheme();
    $$('[data-icon]').forEach(n => { n.outerHTML = icon(n.dataset.icon); });
    EZ.refreshChrome();
    route();
    if (!EZ.store.available) setTimeout(() => EZ.ui.toast('Seu navegador não permite salvar dados aqui (modo privado?). Você pode navegar, mas novos relatos não serão guardados.', { type: 'warn', timeout: 8000 }), 900);
    else if (navigator.onLine === false) setTimeout(() => EZ.ui.toast('Você está sem internet. Os relatos guardados neste aparelho continuam disponíveis.', { type: 'info', timeout: 7000 }), 900);
    document.documentElement.classList.add('is-ready');
  });

  /* Avisos de conexão e modo offline (service worker: sw.js). Não funciona abrindo o arquivo direto (file://). */
  addEventListener('offline', () => EZ.ui.toast('Sem internet. Você pode continuar usando o que já está neste aparelho.', { type: 'warn' }));
  addEventListener('online', () => EZ.ui.toast('Conexão restabelecida.', { type: 'ok' }));
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => { /* segue sem modo offline */ }); });
  }
})();
