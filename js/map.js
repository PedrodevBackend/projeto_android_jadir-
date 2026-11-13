/* EsgotoZero · mapas (Leaflet).
   - Camadas com troca automática de provedor quando uma fonte falha (antes o mapa de ruas usava tile.openstreetmap.org,
     que bloqueia acessos sem "Referer" — por isso falhava ao abrir o arquivo localmente e em alguns navegadores).
   - Agrupamento de marcadores (clusters) com anel que mostra o andamento dos relatos do grupo.
   - Ajuste automático de tamanho (ResizeObserver) para não deixar áreas cinzas em diálogos, painéis e tela cheia. */
'use strict';
(function () {
  const EZ = window.EZ, { icon, esc } = EZ.u;
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const ATTR_IMG = 'Imagens © <a href="https://www.esri.com/" target="_blank" rel="noopener">Esri</a>, Maxar, Earthstar Geographics';
  const ATTR_ESRI = '© <a href="https://www.esri.com/" target="_blank" rel="noopener">Esri</a>, HERE, Garmin, © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';
  const ATTR_OSM = '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';
  const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/';
  /* Todos os provedores abaixo são gratuitos e sem chave de API (a CARTO passou a exigir chave em 2026). */
  const P = {
    esri: { url: ESRI + 'World_Imagery/MapServer/tile/{z}/{y}/{x}', opts: { maxZoom: 19, maxNativeZoom: 19, detectRetina: true, attribution: ATTR_IMG } },
    street: { url: ESRI + 'World_Street_Map/MapServer/tile/{z}/{y}/{x}', opts: { maxZoom: 19, maxNativeZoom: 19, attribution: ATTR_ESRI } },
    dark: { url: ESRI + 'Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', opts: { maxZoom: 19, maxNativeZoom: 16, attribution: ATTR_ESRI } },
    osm: { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', opts: { maxZoom: 19, attribution: ATTR_OSM, referrerPolicy: 'strict-origin-when-cross-origin' } },
    places: { url: ESRI + 'Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', opts: { maxZoom: 19, maxNativeZoom: 19, pane: 'labels', attribution: '' } },
    roads: { url: ESRI + 'Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', opts: { minZoom: 10, maxZoom: 19, maxNativeZoom: 19, pane: 'labels', opacity: 0.9, attribution: '' } },
    darkRef: { url: ESRI + 'Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', opts: { maxZoom: 19, maxNativeZoom: 16, pane: 'labels', attribution: '' } }
  };
  EZ.BASEMAPS = {
    satelite: { label: 'Satélite', icon: 'Satellite', providers: ['esri', 'street', 'osm'], labels: ['roads', 'places'] },
    mapa: { label: 'Mapa', icon: 'Map', providers: ['street', 'osm'] },
    escuro: { label: 'Noturno', icon: 'Moon', providers: ['dark', 'street', 'osm'], labels: ['darkRef'], always: true }
  };

  /** Camada de blocos que troca de provedor se o atual não carregar. */
  function resilientTiles(map, providerKeys, { onFail, onSwitch } = {}) {
    let idx = 0, layer = null, loaded = 0, errors = 0, timer = null, dead = false;
    const make = () => {
      const p = P[providerKeys[idx]];
      layer = L.tileLayer(p.url, p.opts);
      loaded = 0; errors = 0;
      layer.on('tileload', () => { loaded++; clearTimeout(timer); if (loaded === 1) { const c = map.getContainer(); c.classList.remove('is-tile-loading'); c.dispatchEvent(new CustomEvent('ez-tiles')); } });
      layer.on('tileerror', () => { errors++; if (!loaded && errors >= 4) next(); });
      layer.addTo(map);
      clearTimeout(timer); timer = setTimeout(() => { if (!loaded && !dead) next(); }, 9000);
    };
    const next = () => {
      if (dead) return;
      clearTimeout(timer);
      if (idx < providerKeys.length - 1) { map.removeLayer(layer); idx++; make(); onSwitch && onSwitch(providerKeys[idx]); }
      else { dead = true; onFail && onFail(); }
    };
    make();
    return { remove() { dead = true; clearTimeout(timer); if (layer) map.removeLayer(layer); }, get provider() { return providerKeys[idx]; } };
  }

  /* ---------- marcadores ---------- */
  const PIN_PATH = 'M16 39.2S3 26.9 3 16.2a13 13 0 0 1 26 0c0 10.7-13 23-13 23z';
  EZ.pinHTML = (r, { selected = false, draft = false } = {}) => {
    const cat = EZ.CATEGORY[r.category] || EZ.CATEGORY.outro;
    return `<div class="pin st-${r.status}${selected ? ' is-sel' : ''}${draft ? ' is-draft' : ''}"><svg class="pin-shape" viewBox="0 0 32 40" aria-hidden="true"><path d="${PIN_PATH}"/></svg><span class="pin-ic">${icon(cat.icon)}</span></div>`;
  };
  const pinIcon = (r, o = {}) => L.divIcon({ className: 'ez-pin', html: EZ.pinHTML(r, o), iconSize: o.selected ? [40, 50] : [32, 40], iconAnchor: o.selected ? [20, 49] : [16, 39], popupAnchor: [0, o.selected ? -46 : -36] });
  EZ.centerPinIcon = () => L.divIcon({ className: 'ez-pin', html: `<div class="pin st-novo is-sel"><svg class="pin-shape" viewBox="0 0 32 40"><path d="${PIN_PATH}"/></svg><span class="pin-ic">${icon('MapPin')}</span></div>`, iconSize: [40, 50], iconAnchor: [20, 49] });

  function clusterIcon(cluster) {
    const ms = cluster.getAllChildMarkers(); const n = ms.length;
    const c = { recebido: 0, triagem: 0, encaminhado: 0, encerrado: 0 };
    ms.forEach(m => { c[m.options.ezStatus] = (c[m.options.ezStatus] || 0) + 1; });
    let acc = 0; const stops = EZ.STATUS_ORDER.filter(s => c[s]).map(s => { const a = acc; acc += c[s] / n * 100; return `var(--st-${s}) ${a.toFixed(2)}% ${acc.toFixed(2)}%`; });
    const size = n < 10 ? 40 : n < 30 ? 48 : 56;
    return L.divIcon({ className: 'ez-cluster', html: `<div class="cluster" style="--ring:conic-gradient(${stops.join(',')});width:${size}px;height:${size}px"><span>${n}</span></div>`, iconSize: [size, size] });
  }

  EZ.popupHTML = r => {
    const src = EZ.photoSrc(r);
    const st = EZ.STATUS[r.status];
    return `<article class="map-card-pop">${src ? `<img src="${esc(src)}" alt="${EZ.isIllustrative(r) ? 'Foto ilustrativa' : 'Foto do relato'}" loading="lazy">` : `<div class="pop-noimg cat-${r.category}">${icon((EZ.CATEGORY[r.category] || {}).icon || 'Waves')}</div>`}
      <div class="pop-body"><span class="badge st-${r.status}">${icon(st.icon)}${st.label}</span><h3>${esc(r.title)}</h3>
      <p class="pop-meta">${icon('MapPin')}${esc(r.waterName)} · ${esc(r.city)}/${esc(r.uf)}</p><p class="pop-meta">${icon('Clock3')}${EZ.u.ago(r.createdAt)} · <span class="mono">${r.id}</span></p>
      <button type="button" class="link-btn" data-open="${r.id}">Ver detalhes ${icon('ArrowRight')}</button></div></article>`;
  };

  /** Mapa principal (público ou da equipe). */
  EZ.createMap = function createMap(el, { manager = false, onSelect, onFail, popups = true, zoomControl = false } = {}) {
    const map = L.map(el, { zoomControl, attributionControl: true, minZoom: 3, maxZoom: 19, worldCopyJump: true, zoomSnap: 0.5, preferCanvas: false, tap: true });
    map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
    map.createPane('labels'); map.getPane('labels').style.zIndex = 450; map.getPane('labels').style.pointerEvents = 'none';
    map.setView([-14.5, -52], 4);
    el.classList.add('is-tile-loading');
    const api = { map, markers: new Map(), selected: null, base: null, labels: null, heat: null, basemap: null, reports: [], manager };

    api.setBasemap = key => {
      const def = EZ.BASEMAPS[key] || EZ.BASEMAPS.satelite; api.basemap = key;
      if (api.base) api.base.remove(); (api.labels || []).forEach(l => l.remove()); api.labels = [];
      api.base = resilientTiles(map, def.providers, {
        onSwitch: () => EZ.ui.toast('O mapa principal não respondeu. Carregamos uma fonte alternativa.', { type: 'info' }),
        onFail: () => onFail && onFail()
      });
      if (def.labels && (def.always || EZ.store.prefs.labels !== false)) api.labels = def.labels.map(k => resilientTiles(map, [k], {}));
      el.dataset.basemap = key;
    };

    const cluster = L.markerClusterGroup({ showCoverageOnHover: false, spiderfyOnMaxZoom: true, maxClusterRadius: z => z < 6 ? 70 : z < 10 ? 55 : 40, iconCreateFunction: clusterIcon, chunkedLoading: true });
    map.addLayer(cluster);

    api.setReports = (list, { selectedId = api.selected } = {}) => {
      api.reports = list; cluster.clearLayers(); api.markers.clear();
      const ms = list.map(r => {
        const m = L.marker([r.lat, r.lng], { icon: pinIcon(r, { selected: r.id === selectedId, draft: manager && !r.published }), title: `${r.title} — ${EZ.STATUS[r.status].label}`, alt: r.title, keyboard: true, riseOnHover: true, ezStatus: r.status, ezId: r.id });
        m.on('click', () => { api.select(r.id, { fly: false, popup: true }); onSelect && onSelect(r.id, 'map'); });
        api.markers.set(r.id, m); return m;
      });
      cluster.addLayers(ms);
      if (api.heat) api.refreshHeat();
    };

    api.select = (id, { fly = true, popup = popups, zoom } = {}) => {
      const prev = api.selected; api.selected = id;
      [prev, id].forEach(k => { const m = api.markers.get(k); const r = api.reports.find(x => x.id === k); if (m && r) m.setIcon(pinIcon(r, { selected: k === id, draft: manager && !r.published })); });
      const m = api.markers.get(id); const r = api.reports.find(x => x.id === id);
      if (!m || !r) return;
      const open = () => { if (popup && popups) { m.unbindPopup(); m.bindPopup(EZ.popupHTML(r), { className: 'ez-popup', maxWidth: 340, minWidth: 300, autoPanPadding: [60, 60] }).openPopup(); } };
      if (fly) {
        const target = L.latLng(r.lat, r.lng);
        cluster.zoomToShowLayer(m, () => {
          const z = zoom || Math.max(map.getZoom(), 13);
          const near = map.latLngToContainerPoint(target).distanceTo(map.getSize().divideBy(2)) < 30 && Math.abs(map.getZoom() - z) < 0.1;
          if (near) return open();
          if (reduceMotion()) { map.setView(target, z); open(); }
          else { map.once('moveend', open); map.flyTo(target, z, { duration: 0.8 }); }
        });
      } else open();
    };
    api.clearSelection = () => { const k = api.selected; api.selected = null; const m = api.markers.get(k), r = api.reports.find(x => x.id === k); if (m && r) m.setIcon(pinIcon(r, { draft: manager && !r.published })); map.closePopup(); };
    api.highlight = (id, on) => { const m = api.markers.get(id); if (!m) return; const elx = m.getElement(); if (elx) elx.classList.toggle('is-hover', !!on); };

    api.fit = (list = api.reports, { maxZoom = 12, padding } = {}) => {
      if (!list.length) { map.fitBounds(EZ.BRAZIL_BOUNDS, { padding: [20, 20] }); return; }
      const b = L.latLngBounds(list.map(r => [r.lat, r.lng]));
      const pad = padding || (EZ.isMobile() ? [48, 48] : [56, 56]);
      if (b.getNorthEast().equals(b.getSouthWest())) map.setView(b.getCenter(), Math.min(14, maxZoom + 2), { animate: !reduceMotion() });
      else map.fitBounds(b, { padding: pad, maxZoom, animate: !reduceMotion() });
    };
    api.fitBrazil = () => map.fitBounds(EZ.BRAZIL_BOUNDS, { padding: [10, 10], animate: !reduceMotion() });

    api.setHeat = on => {
      if (!on && api.heat) { map.removeLayer(api.heat); api.heat = null; map.addLayer(cluster); return; }
      if (on && window.L.heatLayer) { map.removeLayer(cluster); api.heat = L.heatLayer([], { radius: 30, blur: 24, maxZoom: 11, minOpacity: 0.35, gradient: { 0.25: '#19b3d1', 0.55: '#e8a317', 0.85: '#e5484d' } }).addTo(map); api.refreshHeat(); }
    };
    api.refreshHeat = () => { if (!api.heat) return; api.heat.setLatLngs(api.reports.map(r => [r.lat, r.lng, (EZ.SEVERITY[r.severity] || EZ.SEVERITY.media).weight / 3 * (1 + Math.min(1, (r.confirmations || 0) / 20))])); };

    let userDot = null;
    api.showUser = (lat, lng, acc) => {
      if (userDot) map.removeLayer(userDot);
      userDot = L.layerGroup([L.circle([lat, lng], { radius: Math.min(acc || 60, 400), color: '#19b3d1', weight: 1, fillColor: '#19b3d1', fillOpacity: 0.12, interactive: false }), L.marker([lat, lng], { icon: L.divIcon({ className: 'ez-me', html: '<span class="me-dot"></span>', iconSize: [22, 22] }), interactive: false, keyboard: false })]).addTo(map);
      if (reduceMotion()) map.setView([lat, lng], 12); else map.flyTo([lat, lng], 12, { duration: 0.9 });
    };

    // mantém o tamanho certo sempre que o contêiner muda (gaveta, tela cheia, painel inferior…)
    let raf = 0; const ro = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => map.invalidateSize({ pan: false })); });
    ro.observe(el);
    api.destroy = () => { ro.disconnect(); if (api.base) api.base.remove(); (api.labels || []).forEach(l => l.remove()); map.remove(); };
    api.setBasemap(EZ.store.prefs.basemap || 'satelite');
    return api;
  };

  /** Mapa de escolha do ponto: o pino fica fixo no centro e a pessoa arrasta o mapa. */
  EZ.createPicker = function createPicker(el, { center, zoom = 16, onMove, onIdle } = {}) {
    const map = L.map(el, { zoomControl: false, attributionControl: true, minZoom: 3, maxZoom: 19, zoomSnap: 0.5, tap: true });
    map.attributionControl.setPrefix(false);
    map.createPane('labels'); map.getPane('labels').style.zIndex = 450; map.getPane('labels').style.pointerEvents = 'none';
    map.setView(center || [-14.5, -52], zoom);
    const api = { map, base: null, labels: [] };
    api.setBasemap = key => {
      const def = EZ.BASEMAPS[key] || EZ.BASEMAPS.satelite;
      if (api.base) api.base.remove(); (api.labels || []).forEach(l => l.remove()); api.labels = [];
      api.base = resilientTiles(map, def.providers, {}); if (def.labels) api.labels = def.labels.map(k => resilientTiles(map, [k], {}));
      api.basemap = key; el.dataset.basemap = key;
    };
    api.setBasemap(EZ.store.prefs.pickerBasemap || 'satelite');
    const ro = new ResizeObserver(() => map.invalidateSize({ pan: false })); ro.observe(el);
    map.on('move', () => { el.classList.add('is-moving'); onMove && onMove(map.getCenter(), map.getZoom()); });
    map.on('moveend', () => { el.classList.remove('is-moving'); onIdle && onIdle(map.getCenter(), map.getZoom()); });
    api.goto = (lat, lng, z = 16) => { if (reduceMotion()) map.setView([lat, lng], z); else map.flyTo([lat, lng], z, { duration: 0.8 }); };
    api.destroy = () => { ro.disconnect(); if (api.base) api.base.remove(); (api.labels || []).forEach(l => l.remove()); map.remove(); };
    setTimeout(() => map.invalidateSize(), 60);
    return api;
  };

  /** Mapa pequeno e estático para a ficha do relato. */
  EZ.createMini = function createMini(el, r) {
    const map = L.map(el, { zoomControl: false, attributionControl: true, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false, touchZoom: false, tap: false });
    map.attributionControl.setPrefix(false);
    map.createPane('labels'); map.getPane('labels').style.zIndex = 450; map.getPane('labels').style.pointerEvents = 'none';
    map.setView([r.lat, r.lng], 15);
    const def = EZ.BASEMAPS[EZ.store.prefs.basemap] || EZ.BASEMAPS.satelite;
    const base = resilientTiles(map, def.providers, {}); const labels = (def.labels || []).map(k => resilientTiles(map, [k], {}));
    L.marker([r.lat, r.lng], { icon: pinIcon(r, { selected: true }), keyboard: false, interactive: false }).addTo(map);
    const ro = new ResizeObserver(() => map.invalidateSize({ pan: false })); ro.observe(el);
    return { map, destroy() { ro.disconnect(); base.remove(); labels.forEach(l => l.remove()); map.remove(); } };
  };
})();
