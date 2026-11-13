/* EsgotoZero · gráficos em SVG puro (sem bibliotecas).
   Regras: marcas finas, pontas arredondadas de 4px, grade discreta, legenda sempre que houver 2+ séries,
   rótulos seletivos e dica (tooltip) em cada marca. As cores vêm dos tokens do CSS. */
'use strict';
(function () {
  const EZ = window.EZ, { esc } = EZ.u;
  const C = EZ.charts = {};
  const num = v => Number(v).toLocaleString('pt-BR');

  /** Linha de tendência compacta para os cartões de indicador. */
  C.spark = (values, { w = 96, h = 30, cls = '' } = {}) => {
    if (!values.length) return '';
    const max = Math.max(1, ...values), min = 0, n = values.length;
    const x = i => (i / (n - 1 || 1)) * (w - 6) + 3, y = v => h - 3 - ((v - min) / (max - min || 1)) * (h - 8);
    const pts = values.map((v, i) => [x(i), y(v)]);
    const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const area = line + ` L${pts[n - 1][0].toFixed(1)} ${h - 1} L${pts[0][0].toFixed(1)} ${h - 1} Z`;
    const last = pts[n - 1];
    return `<svg class="spark ${cls}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><path class="spark-area" d="${area}"/><path class="spark-line" d="${line}"/><circle class="spark-dot" cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="3"/></svg>`;
  };

  /** Colunas empilhadas por semana e andamento. bins: [{start,total,by:{status:n}}] */
  C.weeklyStacked = (bins, { h = 170 } = {}) => {
    const W = 560, H = h, padL = 26, padB = 22, padT = 10, padR = 6;
    const max = Math.max(4, ...bins.map(b => b.total));
    const step = niceStep(max); const top = Math.ceil(max / step) * step;
    const cw = (W - padL - padR) / bins.length; const bw = Math.min(24, cw * 0.56);
    const y = v => H - padB - (v / top) * (H - padB - padT);
    let grid = '';
    for (let v = 0; v <= top; v += step) grid += `<line class="grid" x1="${padL}" x2="${W - padR}" y1="${y(v)}" y2="${y(v)}"/><text class="tick" x="${padL - 6}" y="${y(v) + 3.5}" text-anchor="end">${v}</text>`;
    let bars = '', labels = '';
    bins.forEach((b, i) => {
      const cx = padL + cw * i + cw / 2; let acc = 0;
      const tipParts = EZ.STATUS_ORDER.filter(s => b.by[s]).map(s => `${EZ.STATUS[s].label}: ${b.by[s]}`).join(' · ');
      const d = new Date(b.start); const lab = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      const segs = EZ.STATUS_ORDER.filter(s => b.by[s]);
      segs.forEach((s, k) => {
        const v = b.by[s]; const y0 = y(acc), y1 = y(acc + v); acc += v;
        const isTop = k === segs.length - 1; const hgt = Math.max(0, y0 - y1 - (isTop ? 0 : 2));
        bars += isTop ? `<path class="bar st-fill-${s}" d="${roundTop(cx - bw / 2, y1, bw, hgt, 4)}"/>` : `<rect class="bar st-fill-${s}" x="${(cx - bw / 2).toFixed(1)}" y="${(y1 + 2).toFixed(1)}" width="${bw.toFixed(1)}" height="${hgt.toFixed(1)}"/>`;
      });
      bars += `<rect class="hit" x="${(padL + cw * i).toFixed(1)}" y="${padT}" width="${cw.toFixed(1)}" height="${H - padB - padT}" data-tip="Semana de ${lab}: ${b.total} ${b.total === 1 ? 'relato' : 'relatos'}${tipParts ? ' — ' + tipParts : ''}"/>`;
      if (i % 2 === 0 || bins.length <= 6) labels += `<text class="tick" x="${cx}" y="${H - 6}" text-anchor="middle">${lab}</text>`;
    });
    const legend = `<div class="legend">${EZ.STATUS_ORDER.map(s => `<span><i class="sw st-bg-${s}"></i>${EZ.STATUS[s].label}</span>`).join('')}</div>`;
    return `<div class="chart">${legend}<svg viewBox="0 0 ${W} ${H}" class="chart-svg" role="img" aria-label="Relatos recebidos por semana, empilhados por andamento">${grid}${bars}${labels}<line class="axis" x1="${padL}" x2="${W - padR}" y1="${y(0)}" y2="${y(0)}"/></svg></div>`;
  };

  /** Barras horizontais de uma série (ex.: por região, por categoria). rows: [{label, value, sub}] */
  C.hbars = (rows, { unit = '', max, fmt = num, cls = 'fill-series-1', emptyText = 'Sem dados no filtro.' } = {}) => {
    if (!rows.length) return `<p class="muted small">${emptyText}</p>`;
    const top = max || Math.max(1, ...rows.map(r => r.value));
    return `<div class="hbars">${rows.map(r => `<div class="hbar-row" data-tip="${esc(r.label)}: ${fmt(r.value)}${unit}${r.sub ? ' · ' + esc(r.sub) : ''}"><span class="hbar-label">${esc(r.label)}</span><span class="hbar-track"><span class="hbar-fill ${cls}" style="width:${Math.max(r.value ? 2 : 0, r.value / top * 100).toFixed(1)}%"></span></span><span class="hbar-value">${fmt(r.value)}${unit}</span></div>`).join('')}</div>`;
  };

  /** Barras horizontais agrupadas (duas séries, mesma unidade %) com linha de meta. */
  C.groupedPct = (rows, series, { target, targetLabel } = {}) => {
    const W = 560, rowH = 46, padL = 104, padR = 46, padT = 26, barH = 12, gap = 3;
    const H = padT + rows.length * rowH + 22;
    const x = v => padL + (v / 100) * (W - padL - padR);
    let g = '';
    [0, 25, 50, 75, 100].forEach(v => { g += `<line class="grid" x1="${x(v)}" x2="${x(v)}" y1="${padT - 6}" y2="${H - 20}"/><text class="tick" x="${x(v)}" y="${H - 6}" text-anchor="middle">${v}%</text>`; });
    let b = '';
    rows.forEach((r, i) => {
      const y0 = padT + i * rowH + 6;
      b += `<text class="row-label" x="${padL - 10}" y="${y0 + barH + 2}" text-anchor="end">${esc(r.name)}</text>`;
      series.forEach((s, k) => {
        const v = r[s.key]; const yy = y0 + k * (barH + gap); const w = Math.max(2, x(v) - padL);
        b += `<path class="bar ${s.cls}" d="${roundRight(padL, yy, w, barH, 4)}"/><text class="val" x="${padL + w + 6}" y="${yy + barH - 2}">${EZ.u.fmtPct(v)}</text>`;
        b += `<rect class="hit" x="${padL}" y="${yy - 1}" width="${W - padL - padR}" height="${barH + 2}" data-tip="${esc(r.name)} · ${s.label}: ${EZ.u.fmtPct(v)}"/>`;
      });
    });
    let t = '';
    if (target) t = `<line class="target" x1="${x(target)}" x2="${x(target)}" y1="${padT - 12}" y2="${H - 20}"/><text class="target-label" x="${x(target)}" y="${padT - 15}" text-anchor="middle">${esc(targetLabel || 'Meta ' + target + '%')}</text>`;
    const legend = `<div class="legend">${series.map(s => `<span><i class="sw ${s.sw}"></i>${s.label}</span>`).join('')}<span><i class="sw sw-target"></i>${esc(targetLabel || 'Meta')}</span></div>`;
    return `<div class="chart">${legend}<svg viewBox="0 0 ${W} ${H}" class="chart-svg" role="img" aria-label="Coleta e tratamento de esgoto por região">${g}${t}${b}</svg></div>`;
  };

  /** Barra 100% segmentada (composição do andamento). */
  C.segments = (counts, total) => {
    if (!total) return '<div class="segbar is-empty"></div>';
    return `<div class="segbar">${EZ.STATUS_ORDER.filter(s => counts[s]).map(s => `<span class="seg st-bg-${s}" style="flex:${counts[s]}" data-tip="${EZ.STATUS[s].label}: ${counts[s]} (${Math.round(counts[s] / total * 100)}%)"></span>`).join('')}</div>`;
  };

  function niceStep(max) { const raw = max / 4; const p = Math.pow(10, Math.floor(Math.log10(raw))); const m = raw / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; }
  function roundTop(x, y, w, h, r) { r = Math.min(r, w / 2, h); return `M${x.toFixed(1)} ${(y + h).toFixed(1)} V${(y + r).toFixed(1)} Q${x.toFixed(1)} ${y.toFixed(1)} ${(x + r).toFixed(1)} ${y.toFixed(1)} H${(x + w - r).toFixed(1)} Q${(x + w).toFixed(1)} ${y.toFixed(1)} ${(x + w).toFixed(1)} ${(y + r).toFixed(1)} V${(y + h).toFixed(1)} Z`; }
  function roundRight(x, y, w, h, r) { r = Math.min(r, h / 2, w); return `M${x.toFixed(1)} ${y.toFixed(1)} H${(x + w - r).toFixed(1)} Q${(x + w).toFixed(1)} ${y.toFixed(1)} ${(x + w).toFixed(1)} ${(y + r).toFixed(1)} V${(y + h - r).toFixed(1)} Q${(x + w).toFixed(1)} ${(y + h).toFixed(1)} ${(x + w - r).toFixed(1)} ${(y + h).toFixed(1)} H${x.toFixed(1)} Z`; }

  /* Dica flutuante para qualquer elemento com data-tip (mouse e teclado). */
  let tip;
  const show = (el, x, y) => { if (!tip) { tip = document.createElement('div'); tip.className = 'tip'; tip.setAttribute('role', 'tooltip'); document.body.appendChild(tip); } tip.textContent = el.getAttribute('data-tip'); tip.style.opacity = '1'; const w = tip.offsetWidth, h = tip.offsetHeight; tip.style.left = Math.min(innerWidth - w - 8, Math.max(8, x - w / 2)) + 'px'; tip.style.top = Math.max(8, y - h - 12) + 'px'; };
  const hide = () => { if (tip) tip.style.opacity = '0'; };
  document.addEventListener('pointermove', e => { const el = e.target.closest && e.target.closest('[data-tip]'); if (el) show(el, e.clientX, e.clientY); else hide(); }, { passive: true });
  document.addEventListener('focusin', e => { const el = e.target.closest && e.target.closest('[data-tip]'); if (el) { const r = el.getBoundingClientRect(); show(el, r.left + r.width / 2, r.top); } });
  document.addEventListener('focusout', hide);
  addEventListener('scroll', hide, true);
})();
