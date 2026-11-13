/* EsgotoZero · componentes de interface compartilhados: selos, cartões, ficha do relato (gaveta),
   formulário da equipe, notificações, perfil, seletores e paleta de comandos. */
'use strict';
(function () {
  const EZ = window.EZ, { $, $$, esc, icon, norm, ago, fmtDate, fmtDateTime, fmtShort, fmtCoord, plural, haversine, fmtKm } = EZ.u;
  const C = EZ.cmp = {};

  /* ---------- pequenos componentes ---------- */
  C.badge = s => `<span class="badge st-${s}">${icon(EZ.STATUS[s].icon)}${EZ.STATUS[s].label}</span>`;
  C.cat = (k, withIcon = true) => { const c = EZ.CATEGORY[k] || EZ.CATEGORY.outro; return `<span class="chip chip-soft">${withIcon ? icon(c.icon) : ''}${c.short}</span>`; };
  C.sev = k => { const s = EZ.SEVERITY[k] || EZ.SEVERITY.media; return `<span class="chip sev sev-${k}"><i class="sev-bars" aria-hidden="true"><b></b><b></b><b></b></i>${s.label}</span>`; };
  C.prio = r => { const p = EZ.priority(r); const lab = { alta: 'Alta', media: 'Média', baixa: 'Baixa' }[p.level]; return `<span class="prio prio-${p.level}" title="Prioridade calculada: gravidade, confirmações, espera">${icon(p.level === 'alta' ? 'TriangleAlert' : p.level === 'media' ? 'CircleAlert' : 'Circle')}${lab}</span>`; };
  C.thumb = (r, cls = 'thumb', privateView = false) => {
    const src = EZ.photoSrc(r, privateView);
    const cat = EZ.CATEGORY[r.category] || EZ.CATEGORY.outro;
    return src ? `<img class="${cls}" src="${esc(src)}" alt="${EZ.isIllustrative(r) ? 'Foto ilustrativa (não mostra o local)' : 'Foto enviada no relato'}" loading="lazy" decoding="async">`
      : `<span class="${cls} noimg cat-${r.category}" role="img" aria-label="Sem foto · ${esc(cat.short)}">${icon(cat.icon)}</span>`;
  };
  C.empty = (ic, title, text, action = '') => `<div class="empty">${icon(ic)}<h3>${title}</h3><p>${text}</p>${action}</div>`;
  C.where = r => `${esc(r.waterName)} · ${esc(r.city)}/${esc(r.uf)}`;

  /** Linha compacta da lista lateral do mapa. */
  C.row = (r, { selected = false, showDist = false } = {}) => {
    const d = showDist && EZ.state.userPos ? `<span>${icon('Navigation')}${fmtKm(haversine(r.lat, r.lng, EZ.state.userPos.lat, EZ.state.userPos.lng))}</span>` : '';
    return `<div class="rrow${selected ? ' is-sel' : ''}" data-row="${r.id}" role="listitem">
      <button type="button" class="rrow-btn" data-select="${r.id}" aria-label="${esc(r.title)} — ${EZ.STATUS[r.status].label}, ${esc(r.city)}/${esc(r.uf)}">
        ${C.thumb(r, 'rrow-img')}
        <span class="rrow-body">
          <span class="rrow-top">${C.badge(r.status)}<span class="mono muted">${r.id}</span></span>
          <span class="rrow-title">${esc(r.title)}</span>
          <span class="meta">${icon('MapPin')}${C.where(r)}</span>
          <span class="meta">${icon('Clock3')}${ago(r.createdAt)}${r.confirmations ? `<span class="sep"></span>${icon('ThumbsUp')}${r.confirmations}` : ''}${d ? '<span class="sep"></span>' + d : ''}</span>
        </span>
      </button>
    </div>`;
  };

  /** Cartão grande (lista de ocorrências e "Meus relatos"). */
  C.card = (r, { mine = false } = {}) => {
    const last = r.history[r.history.length - 1];
    return `<article class="rcard" data-row="${r.id}">
      <button type="button" class="rcard-media" data-open="${r.id}" aria-label="Abrir ${esc(r.title)}">${C.thumb(r, 'rcard-img', mine)}<span class="rcard-badge">${C.badge(r.status)}</span>${!r.published ? `<span class="rcard-flag">${icon('EyeOff')}Aguardando publicação</span>` : ''}</button>
      <div class="rcard-body">
        <div class="rcard-top">${C.cat(r.category)}<span class="mono muted">${r.id}</span></div>
        <h3><button type="button" class="linklike" data-open="${r.id}">${esc(r.title)}</button></h3>
        <p class="meta">${icon('MapPin')}${C.where(r)}</p>
        ${mine ? C.stepper(r, true) + `<p class="rcard-last">${icon(EZ.STATUS[last.status] ? EZ.STATUS[last.status].icon : 'Info')}<span><b>${esc(last.title)}</b> · ${ago(last.date)}</span></p>` : `<p class="meta">${icon('Clock3')}${ago(r.createdAt)}${r.confirmations ? `<span class="sep"></span>${icon('ThumbsUp')}${plural(r.confirmations, 'confirmação', 'confirmações')}` : ''}</p>`}
      </div>
    </article>`;
  };

  /** Etapas do acompanhamento (horizontal). */
  C.stepper = (r, compact = false) => {
    const idx = EZ.STATUS_ORDER.indexOf(r.status);
    return `<ol class="stepper${compact ? ' is-compact' : ''}" aria-label="Andamento: ${EZ.STATUS[r.status].label}">${EZ.STATUS_ORDER.map((s, i) => `<li class="${i < idx ? 'done' : i === idx ? 'now' : ''}" ${i === idx ? 'aria-current="step"' : ''}><span class="dot">${i < idx ? icon('Check') : ''}</span><span class="lbl">${EZ.STATUS[s].label}</span></li>`).join('')}</ol>`;
  };

  C.timeline = r => `<ol class="timeline">${[...r.history].reverse().map((h, i) => `<li class="${i === 0 ? 'is-last' : ''}"><span class="tl-dot st-bg-${h.status || 'recebido'}">${icon(EZ.STATUS[h.status] ? EZ.STATUS[h.status].icon : 'Info')}</span><div><strong>${esc(h.title)}</strong><p>${esc(h.note)}</p>${h.recipient ? `<p class="tl-extra">${icon('Building2')}${esc(h.recipient)}${h.external ? ` · protocolo <span class="mono">${esc(h.external)}</span>` : ''}</p>` : ''}<small>${fmtDateTime(h.date)} · ${esc(h.by)}</small></div></li>`).join('')}</ol>`;

  /* ---------- ficha do relato (gaveta lateral / tela cheia no celular) ---------- */
  let mini = null;
  EZ.openDetail = (id, { focusManage = false } = {}) => {
    const r = EZ.store.byId(id);
    if (!EZ.canRead(r)) { EZ.ui.toast('Este relato ainda não está disponível para o seu perfil.', { type: 'warn' }); return; }
    const mine = EZ.isOwn(r), mgr = EZ.isManager(), priv = mine || mgr;
    const src = EZ.photoSrc(r, priv);
    const cat = EZ.CATEGORY[r.category] || EZ.CATEGORY.outro;
    const uf = EZ.UFS[r.uf] || {};
    const caption = !src ? '' : EZ.isIllustrative(r) ? 'Foto ilustrativa: não mostra o local deste relato.' : r.photoReviewed ? 'Foto revisada e autorizada para exibição.' : 'Foto visível só para você e para a equipe até a revisão.';
    const html = `<div class="drawer-card" role="document">
      <header class="drawer-head">
        <div class="dh-id"><span class="mono">${r.id}</span>${C.badge(r.status)}${!r.published ? `<span class="chip chip-warn">${icon('EyeOff')}Fora do mapa público</span>` : ''}</div>
        <div class="dh-actions">
          <button type="button" class="icon-btn" data-copy="${r.id}" aria-label="Copiar protocolo" data-tip="Copiar protocolo">${icon('Copy')}</button>
          <button type="button" class="icon-btn hide-mobile" data-action="print" aria-label="Imprimir ficha" data-tip="Imprimir ficha">${icon('Printer')}</button>
          <button type="button" class="icon-btn" data-close aria-label="Fechar">${icon('X')}</button>
        </div>
      </header>
      <div class="drawer-scroll">
        <figure class="d-media">${src ? `<img src="${esc(src)}" alt="${esc(caption)}">` : `<div class="d-noimg cat-${r.category}">${icon(cat.icon)}<span>Sem foto</span></div>`}${caption ? `<figcaption>${icon('Info')}${caption}</figcaption>` : ''}</figure>
        <div class="d-main">
          <div class="chips">${C.cat(r.category)}${C.sev(r.severity)}${r.ongoing ? `<span class="chip chip-live"><i class="live-dot"></i>Acontecendo no momento do relato</span>` : ''}</div>
          <h2 class="d-title">${esc(r.title)}</h2>
          <p class="d-where">${icon('MapPin')}<span><b>${esc(r.waterName)}</b> · ${esc(r.place)}<br>${esc(r.city)}/${esc(r.uf)} · Região ${esc(uf.region || '')}</span></p>
          <p class="d-when">${icon('CalendarDays')}Observado em ${fmtDate(r.observed + 'T12:00:00')} · registrado ${ago(r.createdAt)}</p>
          ${C.stepper(r)}
          <section class="d-sec"><h3>O que foi observado</h3><p class="d-desc">${esc(r.description)}</p>
            ${r.signs && r.signs.length ? `<div class="chips">${r.signs.map(s => EZ.SIGN[s] ? `<span class="chip chip-line">${icon(EZ.SIGN[s].icon)}${EZ.SIGN[s].label}</span>` : '').join('')}</div>` : ''}</section>
          ${r.published ? `<section class="d-sec d-community"><div><strong>${plural(r.confirmations || 0, 'pessoa confirmou', 'pessoas confirmaram')}</strong><p>Quem viu o mesmo problema pode confirmar. Isso ajuda a equipe a priorizar e evita relatos repetidos.</p></div>
            ${mine ? `<span class="chip chip-soft">${icon('User')}Relato seu</span>` : `<button type="button" class="btn ${r.confirmedByMe ? 'btn-soft is-on' : 'btn-outline'}" data-confirm="${r.id}" aria-pressed="${!!r.confirmedByMe}">${icon(r.confirmedByMe ? 'CircleCheck' : 'ThumbsUp')}${r.confirmedByMe ? 'Você confirmou' : 'Eu também vi'}</button>`}</section>` : ''}
          <section class="d-sec"><h3>Local</h3><div class="mini-map" id="mini-map" aria-label="Mapa do local"></div>
            <dl class="facts"><dt>Coordenadas</dt><dd class="mono">${fmtCoord(r.lat, r.lng)}</dd><dt>Tipo de local</dt><dd>${esc(EZ.WATER_LABEL[r.water] || 'Outro')}</dd><dt>Município</dt><dd>${esc(r.city)} · ${esc(uf.name || r.uf)}</dd></dl>
            <div class="d-row-actions">${r.published ? `<button type="button" class="btn btn-outline btn-sm" data-show-on-map="${r.id}">${icon('MapPinned')}Ver no mapa</button>` : ''}<a class="btn btn-ghost btn-sm" href="https://www.google.com/maps/search/?api=1&query=${r.lat},${r.lng}" target="_blank" rel="noopener">${icon('ExternalLink')}Abrir em outro mapa</a></div></section>
          <section class="d-sec"><h3>Acompanhamento</h3>${C.timeline(r)}</section>
          ${mgr ? C.manageForm(r) : ''}
          <p class="d-note">${icon('ShieldCheck')}${r.seed ? 'Relato fictício, criado para demonstrar o fluxo. Não descreve uma situação real do local.' : 'Registro de demonstração salvo neste navegador. Nenhum órgão público foi contatado.'} Encerrar um relato não comprova a qualidade da água.</p>
        </div>
      </div>
      <footer class="drawer-foot">${mgr ? `<button type="button" class="btn btn-ghost" data-close>Cancelar</button><button type="submit" form="manage-form" class="btn btn-primary">${icon('Check')}Salvar e registrar no histórico</button>`
        : `<button type="button" class="btn btn-ghost" data-copy="${r.id}">${icon('Copy')}Copiar protocolo</button><button type="button" class="btn btn-primary" data-share="${r.id}">${icon('Share2')}Compartilhar</button>`}</footer>
    </div>`;
    const d = EZ.ui.drawer.open(html, 'drawer-detail');
    d.dataset.id = r.id;
    if (mini) { mini.destroy(); mini = null; }
    setTimeout(() => { const el = $('#mini-map', d); if (el && window.L) mini = EZ.createMini(el, r); }, 40);
    d.addEventListener('ez-closed', () => { if (mini) { mini.destroy(); mini = null; } }, { once: true });
    if (focusManage) setTimeout(() => { const f = $('#manage-form', d); if (f) f.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 120);
  };

  /* Formulário da equipe (dentro da ficha). */
  C.manageForm = r => {
    const near = EZ.store.reports.filter(x => x.id !== r.id && x.status !== 'encerrado' && haversine(r.lat, r.lng, x.lat, x.lng) < 30).sort((a, b) => haversine(r.lat, r.lng, a.lat, a.lng) - haversine(r.lat, r.lng, b.lat, b.lng)).slice(0, 8);
    return `<form id="manage-form" class="d-sec manage" data-id="${r.id}" data-current="${r.status}" novalidate>
      <h3>${icon('ClipboardCheck')}Atualizar andamento <span class="chip chip-soft">Equipe · demonstração</span></h3>
      <fieldset class="seg-radio" aria-label="Novo andamento">${EZ.STATUS_ORDER.map(s => `<label><input type="radio" name="status" value="${s}" ${r.status === s ? 'checked' : ''}><span>${icon(EZ.STATUS[s].icon)}${EZ.STATUS[s].label}</span></label>`).join('')}</fieldset>
      <p class="hint" id="status-hint">${EZ.STATUS[r.status].desc}</p>
      <div class="cond" data-when="encaminhado" hidden>
        <div class="grid-2"><label class="field"><span>Destinatário *</span><select name="recipient" id="mf-recipient"><option value="">Escolha…</option>${EZ.AGENCIES.map(a => `<option>${esc(a)}</option>`).join('')}</select></label>
        <label class="field"><span>Protocolo externo</span><input name="external" id="mf-external" maxlength="60" placeholder="Se o órgão informou"></label></div>
        <label class="check"><input type="checkbox" name="forwardOk" id="mf-forward"><span>Confirmo que este é um encaminhamento <b>simulado</b>: nada será enviado a um órgão real.</span></label>
      </div>
      <div class="cond" data-when="encerrado" ${r.status === 'encerrado' ? '' : 'hidden'}>
        <div class="grid-2"><label class="field"><span>Motivo do encerramento *</span><select name="closeReason" id="mf-reason"><option value="">Escolha…</option>${EZ.CLOSE_REASONS.map(c => `<option value="${c.key}" ${r.closeReason === c.key ? 'selected' : ''}>${c.label}</option>`).join('')}</select></label>
        <label class="field"><span>Relato principal (se duplicado)</span><select name="duplicateOf" id="mf-dup"><option value="">Nenhum</option>${near.map(x => `<option value="${x.id}" ${r.duplicateOf === x.id ? 'selected' : ''}>${x.id} · ${esc(x.title.slice(0, 42))} (${fmtKm(haversine(r.lat, r.lng, x.lat, x.lng))})</option>`).join('')}</select></label></div>
      </div>
      <div class="switches">
        <label class="switch"><input type="checkbox" name="published" id="mf-published" ${r.published ? 'checked' : ''}><span class="sw-ui"></span><span><b>Mostrar no mapa público</b><small>Conteúdo revisado, sem dados pessoais nem acusações. Publicar não confirma que há esgoto.</small></span></label>
        ${r.photo && !EZ.isIllustrative(r) ? `<label class="switch"><input type="checkbox" name="photoReviewed" id="mf-photo" ${r.photoReviewed ? 'checked' : ''} ${r.photoConsent ? '' : 'disabled'}><span class="sw-ui"></span><span><b>Exibir a foto</b><small>${r.photoConsent ? 'Revisei rostos, placas e outros dados pessoais.' : 'A pessoa não autorizou mostrar a foto.'}</small></span></label>` : ''}
      </div>
      <label class="field"><span>Observação da equipe *</span><textarea name="note" id="mf-note" rows="3" minlength="10" maxlength="1200" placeholder="Explique a revisão ou a mudança. Este texto aparece no histórico do relato."></textarea><small class="counter" data-for="mf-note">0/1200</small></label>
      <div id="mf-error" role="alert"></div>
    </form>`;
  };

  EZ.saveManage = form => {
    if (!EZ.isManager()) return;
    const r = EZ.store.byId(form.dataset.id); if (!r) return;
    const d = new FormData(form);
    const status = d.get('status'), note = String(d.get('note') || '').trim(), recipient = String(d.get('recipient') || '').trim();
    const published = !!d.get('published'), reason = String(d.get('closeReason') || ''), dup = String(d.get('duplicateOf') || '');
    const err = m => { $('#mf-error', form).innerHTML = `<p class="form-error">${icon('CircleAlert')}${m}</p>`; $('#mf-error', form).scrollIntoView({ block: 'nearest', behavior: 'smooth' }); };
    if (note.length < 10) return err('Escreva uma observação com pelo menos 10 caracteres. Ela fica registrada no histórico.');
    if (status === 'recebido' && published) return err('Para publicar, mude o andamento para “Em triagem” ou posterior.');
    // Só pede destinatário quando o relato MUDA para "Encaminhado". Uma nova observação num relato
    // que já estava encaminhado não cria um segundo encaminhamento.
    const forwarding = status === 'encaminhado' && r.status !== 'encaminhado';
    if (forwarding && (!recipient || !d.get('forwardOk'))) return err('Escolha o destinatário e confirme que o encaminhamento é simulado.');
    if (status === 'encerrado' && !reason) return err('Informe o motivo do encerramento.');
    if (dup && (status !== 'encerrado' || reason !== 'duplicado')) return err('Para vincular a outro relato, encerre como “Relato duplicado”.');
    const title = status === r.status ? 'Revisão da equipe' : { recebido: 'Voltou para “Recebido”', triagem: 'Triagem iniciada', encaminhado: 'Encaminhado ao órgão responsável', encerrado: 'Relato encerrado' }[status];
    const now = new Date().toISOString();
    const ev = { status, title, date: now, note, by: 'Equipe EsgotoZero', ...(forwarding ? { recipient: recipient + ' · ' + r.city, external: String(d.get('external') || '').trim() } : {}) };
    const events = [ev];
    if (published && !r.published) events.push({ status, title: 'Publicado no mapa', date: now, note: 'Conteúdo revisado e liberado para o mapa público.', by: 'Equipe EsgotoZero' });
    if (!published && r.published) events.push({ status, title: 'Retirado do mapa público', date: now, note: 'O relato continua em acompanhamento, visível só para a pessoa que registrou e para a equipe.', by: 'Equipe EsgotoZero' });
    const ok = EZ.store.update(r.id, x => ({ ...x, status, published, closeReason: status === 'encerrado' ? reason : '', duplicateOf: dup, photoReviewed: d.get('photoReviewed') ? !!x.photoConsent : (EZ.isIllustrative(x) ? x.photoReviewed : false), updatedAt: now, history: [...x.history, ...events] }), 'manage');
    if (ok) { EZ.ui.drawer.close(); EZ.ui.toast(`${r.id} atualizado: ${EZ.STATUS[status].label}${published ? ' · no mapa' : ''}.`, { type: 'ok', action: { label: 'Ver', fn: () => EZ.openDetail(r.id) } }); }
  };

  /* Confirmação comunitária ("Eu também vi"). */
  EZ.toggleConfirm = id => {
    const r = EZ.store.byId(id); if (!r || EZ.isOwn(r)) return;
    const on = !r.confirmedByMe;
    const ok = EZ.store.update(id, x => ({ ...x, confirmedByMe: on, confirmations: Math.max(0, (x.confirmations || 0) + (on ? 1 : -1)) }), 'confirm');
    if (!ok) return;
    if ($('#drawer').open && $('#drawer').dataset.id === id) EZ.openDetail(id);
    EZ.ui.toast(on ? 'Obrigado! Sua confirmação ajuda a priorizar este relato.' : 'Confirmação removida.', { type: on ? 'ok' : 'info', action: on ? { label: 'Desfazer', fn: () => EZ.toggleConfirm(id) } : null });
  };

  EZ.share = async id => {
    const r = EZ.store.byId(id); if (!r) return;
    const url = location.href.split('#')[0] + '#relato-' + r.id;
    const text = `${r.title} (${r.city}/${r.uf}) · protocolo ${r.id} no EsgotoZero`;
    if (navigator.share) { try { await navigator.share({ title: 'EsgotoZero', text, url }); return; } catch { /* cancelado */ } }
    EZ.ui.copy(`${text}\n${url}`, 'Link do relato copiado.');
  };

  /* ---------- notificações ---------- */
  EZ.notifications = () => {
    const readAt = EZ.store.prefs.readAt ? new Date(EZ.store.prefs.readAt).getTime() : 0;
    return EZ.store.reports.filter(EZ.isOwn).flatMap(r => r.history.slice(1).map(h => ({ r, h, unread: new Date(h.date).getTime() > readAt })))
      .sort((a, b) => new Date(b.h.date) - new Date(a.h.date)).slice(0, 12);
  };
  EZ.openNotifications = anchor => {
    const items = EZ.notifications();
    const html = `<div class="pop-head"><strong>Notificações</strong><button type="button" class="link-btn" data-action="read-all">Marcar como lidas</button></div>
      <div class="notif-list">${items.length ? items.map(({ r, h, unread }) => `<button type="button" class="notif${unread ? ' is-unread' : ''}" data-open="${r.id}"><span class="notif-ic st-bg-${h.status}">${icon(EZ.STATUS[h.status] ? EZ.STATUS[h.status].icon : 'Bell')}</span><span><b>${esc(h.title)}</b><small>${r.id} · ${esc(r.title)}</small><small class="muted">${ago(h.date)}</small></span></button>`).join('') : C.empty('BellRing', 'Tudo em dia', 'Quando seus relatos mudarem de andamento, você verá aqui.')}</div>`;
    if (EZ.isMobile()) { EZ.ui.modal.open({ title: 'Notificações', body: `<div class="pop pop-inline">${html}</div>`, cls: 'dlg-sheet' }); return; }
    EZ.ui.pop.open(anchor, html, { width: 360, cls: 'pop-notif' });
  };
  EZ.markAllRead = () => { EZ.store.prefs.readAt = new Date().toISOString(); EZ.store.savePrefs(); EZ.refreshChrome(); EZ.ui.pop.close(); EZ.ui.modal.close(); EZ.ui.toast('Notificações marcadas como lidas.', { type: 'ok' }); };

  /* ---------- perfil (papéis de demonstração, tema) ---------- */
  EZ.openProfile = anchor => {
    const p = EZ.store.prefs;
    const initials = p.name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase();
    const html = `<div class="profile-card"><span class="avatar avatar-lg">${esc(initials)}</span><div><strong>${esc(p.name)}</strong><small>${EZ.isManager() ? 'Gestor · demonstração' : 'Cidadão · demonstração'}</small></div></div>
      <p class="pop-label">Ver o EsgotoZero como</p>
      <div class="seg" role="radiogroup" aria-label="Perfil de demonstração"><button type="button" role="radio" aria-checked="${!EZ.isManager()}" data-role="citizen">${icon('User')}Cidadão</button><button type="button" role="radio" aria-checked="${EZ.isManager()}" data-role="manager">${icon('ShieldCheck')}Gestor</button></div>
      <p class="pop-label">Tema</p>
      <div class="seg seg-3" role="radiogroup" aria-label="Tema">${[['light', 'Sun', 'Claro'], ['dark', 'Moon', 'Escuro'], ['system', 'Monitor', 'Sistema']].map(([k, ic, l]) => `<button type="button" role="radio" aria-checked="${p.theme === k}" data-theme-set="${k}">${icon(ic)}${l}</button>`).join('')}</div>
      <form class="name-form" id="name-form"><label class="field"><span>Nome de exibição</span><input id="pf-name" name="name" value="${esc(p.name)}" maxlength="60" autocomplete="name" required></label><button class="btn btn-outline btn-sm" type="submit">Salvar</button></form>
      <div class="pop-foot"><button type="button" class="link-btn" data-action="about-demo">${icon('Info')}Sobre a demonstração</button><button type="button" class="link-btn danger" data-action="reset-demo">${icon('RotateCcw')}Reiniciar dados</button></div>
      <p class="pop-note">A troca de perfil existe só na demonstração. Com contas reais, o acesso de gestor é concedido pela equipe.</p>`;
    if (EZ.isMobile() || !anchor) { EZ.ui.modal.open({ title: 'Seu perfil', body: `<div class="pop pop-inline">${html}</div>`, cls: 'dlg-sheet' }); return; }
    EZ.ui.pop.open(anchor, html, { width: 340, cls: 'pop-profile' });
  };

  EZ.setRole = role => {
    EZ.store.prefs.role = role; EZ.store.savePrefs(); EZ.ui.pop.close(); EZ.ui.modal.close();
    EZ.refreshChrome();
    EZ.go(role === 'manager' ? 'gestao' : 'mapa');
    EZ.ui.toast(role === 'manager' ? 'Você está vendo como gestor (demonstração).' : 'Você está vendo como cidadão.', { type: 'ok' });
  };

  EZ.aboutDemo = () => EZ.ui.modal.open({
    title: 'Sobre esta demonstração', subtitle: 'Projeto acadêmico · dados fictícios',
    body: `<div class="prose"><p>O EsgotoZero mostra como a comunidade pode registrar sinais de esgoto e poluição na água e acompanhar cada relato até o encerramento. Todos os relatos exibidos são <b>fictícios</b> e as fotos são <b>ilustrativas</b>.</p>
      <p>Os dados ficam <b>apenas neste navegador</b>. Outras pessoas e outros aparelhos não veem o que você registra aqui, e nada é enviado a órgãos públicos.</p>
      <p>Para uso real, o próximo passo é conectar contas, um banco de dados compartilhado com regras de acesso e armazenamento privado das fotos.</p></div>`,
    footer: `<button type="button" class="btn btn-primary" data-close>Entendi</button>`
  });

  EZ.confirmReset = () => EZ.ui.modal.open({
    title: 'Reiniciar a demonstração?', subtitle: 'Isso afeta só este navegador.',
    body: `<p class="muted">Os ${EZ.store.reports.length} relatos atuais serão substituídos pelos exemplos originais. O que você registrou ou alterou aqui será apagado.</p>`,
    footer: `<button type="button" class="btn btn-ghost" data-close>Cancelar</button><button type="button" class="btn btn-danger" data-action="confirm-reset">${icon('RotateCcw')}Restaurar exemplos</button>`
  });

  /* ---------- seletores (recorte, filtros, ordenação, camadas) ---------- */
  EZ.openScope = (anchor, onPick) => {
    const pub = EZ.store.reports.filter(r => r.published);
    const byUf = EZ.countBy(pub, r => r.uf), byReg = EZ.countBy(pub, r => EZ.region(r)), byCity = EZ.countBy(pub, r => `${r.city}|${r.uf}`);
    const cur = EZ.state.f.scope;
    const opt = (type, v, label, n, ic, sub = '') => `<button type="button" class="opt${cur.type === type && (cur.v || '') === (v || '') ? ' is-on' : ''}" data-scope-type="${type}" data-scope-v="${esc(v || '')}" data-search="${esc(norm(label + ' ' + sub))}">${icon(ic)}<span>${esc(label)}${sub ? `<small>${esc(sub)}</small>` : ''}</span>${n != null ? `<em>${n}</em>` : ''}</button>`;
    const html = `<div class="pop-search">${icon('Search')}<input id="scope-q" placeholder="Estado, cidade ou região" aria-label="Filtrar lugares" autocomplete="off"></div>
      <div class="opt-list" id="scope-list">
        ${opt('br', '', 'Todo o Brasil', pub.length, 'Globe')}
        ${opt('near', '', 'Perto de mim', null, 'LocateFixed', 'Usa a localização do aparelho')}
        <p class="opt-group">Regiões</p>${EZ.REGIONS.map(g => opt('region', g, g, byReg[g] || 0, 'Map')).join('')}
        <p class="opt-group">Estados</p>${Object.entries(EZ.UFS).sort((a, b) => a[1].name.localeCompare(b[1].name)).map(([k, u]) => opt('uf', k, u.name, byUf[k] || 0, 'MapPinned', k)).join('')}
        <p class="opt-group">Cidades com relatos</p>${Object.entries(byCity).sort((a, b) => b[1] - a[1]).map(([k, n]) => { const [c, uf] = k.split('|'); return opt('city', k, c, n, 'Building2', uf); }).join('')}
      </div>`;
    const p = EZ.isMobile() ? EZ.ui.modal.open({ title: 'Onde?', body: `<div class="pop pop-inline pop-scope">${html}</div>`, cls: 'dlg-sheet' }) : EZ.ui.pop.open(anchor, html, { width: 330, align: 'start', cls: 'pop-scope' });
    const input = $('#scope-q', p);
    input.addEventListener('input', () => { const q = norm(input.value); $$('#scope-list .opt', p).forEach(o => { o.hidden = !!q && !o.dataset.search.includes(q); }); $$('#scope-list .opt-group', p).forEach(g => { g.hidden = !!q; }); });
    p.addEventListener('click', e => { const b = e.target.closest('[data-scope-type]'); if (!b) return; e.stopPropagation(); EZ.ui.pop.close(); EZ.ui.modal.close(); onPick({ type: b.dataset.scopeType, v: b.dataset.scopeV || undefined }); });
  };

  EZ.openFilters = (anchor, onChange) => {
    const f = EZ.state.f;
    const seg = (name, opts) => `<div class="chipset" role="group" aria-label="${name}">${opts.map(([v, l]) => `<button type="button" class="fchip${String(f[name]) === String(v) ? ' is-on' : ''}" data-f="${name}" data-v="${v}" aria-pressed="${String(f[name]) === String(v)}">${l}</button>`).join('')}</div>`;
    const html = `<div class="filters">
      <p class="pop-label">Andamento</p>${seg('status', [['all', 'Todos'], ...EZ.STATUS_ORDER.filter(s => s !== 'recebido' || EZ.isManager()).map(s => [s, EZ.STATUS[s].label])])}
      <p class="pop-label">O que foi observado</p>${seg('category', [['all', 'Tudo'], ...EZ.CATEGORIES.map(c => [c.key, c.short])])}
      <p class="pop-label">Gravidade</p>${seg('severity', [['all', 'Todas'], ...Object.entries(EZ.SEVERITY).map(([k, s]) => [k, s.label])])}
      <p class="pop-label">Período</p>${seg('period', [['all', 'Tudo'], ['7', '7 dias'], ['30', '30 dias'], ['90', '90 dias']])}
      <label class="switch switch-sm"><input type="checkbox" id="f-photo" ${f.photo ? 'checked' : ''}><span class="sw-ui"></span><span><b>Somente com foto</b></span></label>
      <div class="pop-foot"><button type="button" class="link-btn" data-action="clear-filters">${icon('FunnelX')}Limpar filtros</button><button type="button" class="btn btn-primary btn-sm" data-close-pop>Ver <span id="f-count"></span></button></div></div>`;
    const p = EZ.isMobile() ? EZ.ui.modal.open({ title: 'Filtros', body: `<div class="pop pop-inline">${html}</div>`, cls: 'dlg-sheet' }) : EZ.ui.pop.open(anchor, html, { width: 360, cls: 'pop-filters' });
    const sync = () => { const n = onChange(); const c = $('#f-count', p); if (c) c.textContent = `${n} ${n === 1 ? 'relato' : 'relatos'}`; $$('.fchip', p).forEach(b => { const on = String(f[b.dataset.f]) === b.dataset.v; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); }); const ph = $('#f-photo', p); if (ph) ph.checked = f.photo; };
    p.addEventListener('click', e => {
      const b = e.target.closest('[data-f]'); if (b) { e.stopPropagation(); f[b.dataset.f] = b.dataset.v; sync(); return; }
      if (e.target.closest('[data-action="clear-filters"]')) { e.stopPropagation(); Object.assign(f, { status: 'all', category: 'all', severity: 'all', period: 'all', photo: false }); sync(); return; }
      if (e.target.closest('[data-close-pop]')) { EZ.ui.pop.close(); EZ.ui.modal.close(); }
    });
    $('#f-photo', p).addEventListener('change', e => { f.photo = e.target.checked; sync(); });
    sync();
  };

  EZ.openSort = (anchor, onPick) => {
    const cur = EZ.state.f.sort;
    const opts = [['recent', 'Mais recentes', 'Clock3'], ['updated', 'Atualizados por último', 'History'], ['confirmed', 'Mais confirmados', 'ThumbsUp'], ['near', 'Mais perto de mim', 'Navigation']];
    const html = `<div class="opt-list">${opts.map(([k, l, ic]) => `<button type="button" class="opt${cur === k ? ' is-on' : ''}" data-sort="${k}">${icon(ic)}<span>${l}</span>${cur === k ? icon('Check') : ''}</button>`).join('')}</div>`;
    const p = EZ.ui.pop.open(anchor, html, { width: 250 });
    p.addEventListener('click', e => { const b = e.target.closest('[data-sort]'); if (!b) return; EZ.ui.pop.close(); onPick(b.dataset.sort); });
  };

  EZ.openLayers = (anchor, { heat = false, heatOn = false } = {}, onPick) => {
    const cur = EZ.store.prefs.basemap || 'satelite';
    const html = `<p class="pop-label">Fundo do mapa</p><div class="layer-grid">${Object.entries(EZ.BASEMAPS).map(([k, b]) => `<button type="button" class="layer-opt lo-${k}${cur === k ? ' is-on' : ''}" data-basemap="${k}" aria-pressed="${cur === k}"><span class="lo-swatch"></span>${b.label}</button>`).join('')}</div>
      <label class="switch switch-sm"><input type="checkbox" id="lo-labels" ${EZ.store.prefs.labels !== false ? 'checked' : ''} ${cur === 'satelite' ? '' : 'disabled'}><span class="sw-ui"></span><span><b>Nomes de lugares</b><small>Sobre a imagem de satélite</small></span></label>
      ${heat ? `<label class="switch switch-sm"><input type="checkbox" id="lo-heat" ${heatOn ? 'checked' : ''}><span class="sw-ui"></span><span><b>Mapa de calor</b><small>Concentração por gravidade e confirmações</small></span></label>` : ''}`;
    const p = EZ.ui.pop.open(anchor, html, { width: 280, cls: 'pop-layers' });
    p.addEventListener('click', e => { const b = e.target.closest('[data-basemap]'); if (!b) return; EZ.store.prefs.basemap = b.dataset.basemap; EZ.store.savePrefs(); EZ.ui.pop.close(); onPick({ basemap: b.dataset.basemap }); });
    $('#lo-labels', p).addEventListener('change', e => { EZ.store.prefs.labels = e.target.checked; EZ.store.savePrefs(); onPick({ labels: e.target.checked }); });
    const h = $('#lo-heat', p); if (h) h.addEventListener('change', e => onPick({ heat: e.target.checked }));
  };

  /* ---------- paleta de comandos (Ctrl/⌘ + K) ---------- */
  EZ.palette = {
    open(prefill = '') {
      const d = $('#palette');
      d.innerHTML = `<div class="pal-card"><div class="pal-input">${icon('Search')}<input id="pal-q" placeholder="Buscar relato, protocolo, cidade ou ação…" autocomplete="off" aria-label="Buscar" aria-controls="pal-list" role="combobox" aria-expanded="true"><kbd>Esc</kbd></div><div class="pal-list" id="pal-list" role="listbox"></div><div class="pal-foot"><span><kbd>↑</kbd><kbd>↓</kbd> navegar</span><span><kbd>Enter</kbd> abrir</span></div></div>`;
      if (!d.open) { d.showModal(); EZ.ui.layerOpened(); }
      const input = $('#pal-q', d); input.value = prefill;
      const render = () => this.render(input.value); render();
      input.addEventListener('input', EZ.u.debounce(render, 60));
      input.addEventListener('keydown', e => {
        const items = $$('.pal-item', d); let i = items.findIndex(x => x.classList.contains('is-active'));
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); i = e.key === 'ArrowDown' ? Math.min(items.length - 1, i + 1) : Math.max(0, i - 1); items.forEach((x, k) => x.classList.toggle('is-active', k === i)); if (items[i]) { items[i].scrollIntoView({ block: 'nearest' }); input.setAttribute('aria-activedescendant', items[i].id); } }
        if (e.key === 'Enter') { e.preventDefault(); const it = items[Math.max(0, i)]; if (it) it.click(); }
      });
      EZ.mun.load().then(() => { if (d.open) render(); }).catch(() => { /* sem lista de municípios */ });
      setTimeout(() => input.focus(), 20);
    },
    render(q) {
      const d = $('#palette'), list = $('#pal-list', d); const k = norm(q);
      const acts = [
        ['register', 'Registrar ocorrência', 'Plus', 'Ação'], ['go:mapa', 'Ir para o mapa', 'Map', 'Página'], ['go:ocorrencias', 'Ver todas as ocorrências', 'List', 'Página'],
        ['go:meus-relatos', 'Meus relatos', 'FileText', 'Página'], ['go:gestao', 'Painel de gestão', 'LayoutDashboard', 'Página'], ['go:ods', 'ODS 6 no Brasil', 'Target', 'Página'],
        ['theme', 'Alternar tema claro/escuro', 'Moon', 'Ação'], ['role', EZ.isManager() ? 'Ver como cidadão' : 'Ver como gestor (demonstração)', 'Users', 'Ação']
      ].filter(a => !k || norm(a[1]).includes(k));
      const reps = !k ? [] : EZ.store.reports.filter(EZ.canRead).filter(r => norm([r.id, r.title, r.city, r.uf, r.waterName].join(' ')).includes(k)).slice(0, 6);
      const ufs = !k ? [] : Object.entries(EZ.UFS).filter(([uf, u]) => norm(u.name).includes(k) || uf.toLowerCase() === k).slice(0, 3);
      const cities = !k || k.length < 3 ? [] : EZ.mun.search(q, 5);
      let html = '', n = 0;
      const item = (attrs, ic, title, sub) => `<button type="button" class="pal-item${n === 0 ? ' is-active' : ''}" id="pal-${n++}" role="option" ${attrs}>${icon(ic)}<span><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</span>${icon('ChevronRight', 'pal-go')}</button>`;
      if (reps.length) html += `<p class="pal-group">Relatos</p>` + reps.map(r => item(`data-pal-open="${r.id}"`, EZ.CATEGORY[r.category].icon, esc(r.title), `<span class="mono">${r.id}</span> · ${esc(r.city)}/${r.uf} · ${EZ.STATUS[r.status].label}`)).join('');
      if (ufs.length || cities.length) html += `<p class="pal-group">Lugares</p>` + ufs.map(([uf, u]) => item(`data-pal-scope="uf" data-v="${uf}"`, 'MapPinned', esc(u.name), `Estado · Região ${u.region}`)).join('') + cities.map(c => item(`data-pal-city="${esc(c.name)}|${c.uf}" data-lat="${c.lat}" data-lng="${c.lng}"`, 'Building2', esc(c.name), `${c.uf} · mostrar no mapa`)).join('');
      if (acts.length) html += `<p class="pal-group">Ações e páginas</p>` + acts.map(a => item(`data-pal-act="${a[0]}"`, a[2], a[1], a[3])).join('');
      list.innerHTML = html || C.empty('SearchX' in (window.EZ_ICONS || {}) ? 'SearchX' : 'Search', 'Nada encontrado', 'Tente um protocolo (EZ-1024), uma cidade ou o nome de um rio.');
    },
    close() { const d = $('#palette'); if (d.open) d.close(); }
  };
})();
