/* ═══════════════════════════════════════════════════════════════
   Atlantek · dashboard.js — panel de resumen para el cliente
   Solo lectura: lee de Google Sheets (Apps Script); si no hay
   conexión, cae al estado local del admin (localStorage).
   ═══════════════════════════════════════════════════════════════ */

(() => {
  const $ = (id) => document.getElementById(id);
  const badge = $('sync-badge');

  const money = (n) => '₡' + Math.round(Number(n) || 0).toLocaleString('es-CR');
  const docTotal = (d) =>
    (d.items || []).reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.precio) || 0), 0);

  const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const setBadge = (txt, cls) => {
    badge.textContent = '● ' + txt;
    badge.className = 'sync-badge ' + cls;
  };

  /* ── Carga de datos ── */

  async function loadData() {
    if (typeof CONFIG !== 'undefined' && CONFIG.SHEETS_URL) {
      try {
        const res = await fetch(`${CONFIG.SHEETS_URL}?action=load&token=${encodeURIComponent(CONFIG.TOKEN)}`);
        const out = await res.json();
        if (out.ok) {
          setBadge('Sheets', 'is-ok');
          return out.data;
        }
        throw new Error(out.error || 'error remoto');
      } catch (e) {
        console.warn('Dashboard: fallo Sheets, usando datos locales.', e);
      }
    }
    try {
      const raw = localStorage.getItem('atlantek-gestion-v1');
      if (raw) {
        setBadge('Local', 'is-local');
        return JSON.parse(raw);
      }
    } catch (e) { /* sin datos locales */ }
    setBadge('Sin datos', 'is-error');
    return { clients: [], docs: [], leads: [] };
  }

  /* ── Render ── */

  function renderKpis(data) {
    const docs = data.docs || [];
    const leads = data.leads || [];

    const pagado    = docs.filter(d => d.estado === 'pagada').reduce((s, d) => s + docTotal(d), 0);
    const porCobrar = docs.filter(d => d.estado === 'enviada').reduce((s, d) => s + docTotal(d), 0);
    const nuevos    = leads.filter(l => (l.estado || 'nuevo') === 'nuevo').length;

    const kpis = [
      { label: 'Clientes',    value: (data.clients || []).length,  hint: 'registrados' },
      { label: 'Documentos',  value: docs.length,                  hint: 'proformas + facturas' },
      { label: 'Cobrado',     value: money(pagado),                hint: 'documentos pagados', cls: 'is-green' },
      { label: 'Por cobrar',  value: money(porCobrar),             hint: 'enviados sin pagar', cls: 'is-amber' },
      { label: 'Leads',       value: nuevos,                       hint: 'nuevos del sitio web', cls: nuevos ? 'is-red' : '' }
    ];

    $('kpis').innerHTML = kpis.map(k => `
      <div class="kpi">
        <div class="kpi__label">${k.label}</div>
        <div class="kpi__value ${k.cls || ''}">${k.value}</div>
        <div class="kpi__hint">${k.hint}</div>
      </div>`).join('');
  }

  function renderBars(data) {
    const docs = (data.docs || []).filter(d => d.estado !== 'borrador');
    const byMonth = {};
    docs.forEach(d => {
      const key = String(d.fechaEmision || '').slice(0, 7); // YYYY-MM
      if (!/^\d{4}-\d{2}$/.test(key)) return;
      byMonth[key] = (byMonth[key] || 0) + docTotal(d);
    });

    const meses = Object.keys(byMonth).sort().slice(-6);
    if (!meses.length) {
      $('bars').innerHTML = '<div class="empty">Sin documentos todavía</div>';
      return;
    }

    const max = Math.max(...meses.map(m => byMonth[m]));
    const nombre = (key) => {
      const [y, m] = key.split('-');
      const n = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];
      return `${n[Number(m) - 1]} ${y.slice(2)}`;
    };

    $('bars').innerHTML = meses.map(m => {
      const h = Math.max(3, Math.round((byMonth[m] / max) * 100));
      return `
        <div class="bar">
          <span class="bar__value">${money(byMonth[m])}</span>
          <div class="bar__fill" style="height:${h}%"></div>
          <span class="bar__label">${nombre(m)}</span>
        </div>`;
    }).join('');
  }

  function renderDocs(data) {
    const byId = {};
    (data.clients || []).forEach(c => { byId[c.id] = c.nombre; });

    const docs = (data.docs || [])
      .slice()
      .sort((a, b) => (b.numero || 0) - (a.numero || 0))
      .slice(0, 8);

    const tbody = $('docs-table').querySelector('tbody');
    if (!docs.length) {
      tbody.innerHTML = '<tr><td colspan="5"><div class="empty">Sin documentos</div></td></tr>';
      return;
    }

    tbody.innerHTML = docs.map(d => `
      <tr>
        <td class="mono">${String(d.numero).padStart(3, '0')}</td>
        <td>${d.tipo === 'factura' ? 'Factura' : 'Proforma'}</td>
        <td>${esc(byId[d.clientId] || '—')}</td>
        <td><span class="chip chip--${esc(d.estado)}">${esc(d.estado)}</span></td>
        <td class="ta-r mono">${money(docTotal(d))}</td>
      </tr>`).join('');
  }

  function renderLeads(data) {
    const leads = (data.leads || []).slice().reverse().slice(0, 10);
    $('leads-note').textContent = leads.length ? `Últimos ${leads.length}` : '';

    if (!leads.length) {
      $('leads-list').innerHTML =
        '<li><div class="empty">Sin leads todavía — llegan del formulario del sitio</div></li>';
      return;
    }

    $('leads-list').innerHTML = leads.map(l => {
      const tel = String(l.telefono || '').replace(/\D/g, '');
      const wa = tel ? `https://wa.me/${tel.length === 8 ? '506' + tel : tel}` : '';
      const fecha = String(l.fecha || '').slice(0, 10);
      return `
        <li>
          <div class="lead__top">
            <b>${esc(l.nombre)}</b>
            ${wa ? `<a class="lead__wa" href="${wa}" target="_blank" rel="noopener">WhatsApp →</a>` : ''}
          </div>
          <span class="lead__meta">${esc(l.telefono)} · ${esc(l.distrito)} · ${esc(l.servicio)} · ${fecha}</span>
          ${l.mensaje ? `<span class="lead__msg">${esc(l.mensaje)}</span>` : ''}
        </li>`;
    }).join('');
  }

  async function refresh() {
    setBadge('Cargando…', '');
    const data = await loadData();
    renderKpis(data);
    renderBars(data);
    renderDocs(data);
    renderLeads(data);
    $('dash-updated').textContent =
      'Actualizado ' + new Date().toLocaleString('es-CR', { dateStyle: 'medium', timeStyle: 'short' });
  }

  $('btn-refresh').addEventListener('click', refresh);
  refresh();
})();
