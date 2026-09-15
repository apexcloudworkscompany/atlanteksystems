/* ═══════════════════════════════════════════════════════════════
   Atlantek · ver-proforma.js — vista pública de un documento
   Uso: ver-proforma.html?n=27  (por número)  |  ?id=d27  (por id)
   Renderiza la misma hoja del admin (assets/css/admin.css) sin
   datos internos. Sin gate, sin login — solo el documento.
   ═══════════════════════════════════════════════════════════════ */

(() => {
  const sheet = document.getElementById('sheet');

  const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const fmt = (n) => '₡' + (Number(n) || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });

  const fmtPlain = (n) => (Number(n) || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });

  const fmtDate = (iso) => {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${Number(m)}/${Number(d)}/${y}`;
  };

  const numDoc = (n) => String(n).padStart(3, '0');

  const waHref = (text) => `https://wa.me/50672312225?text=${encodeURIComponent(text)}`;

  /* ── Buscar documento por ?n= o ?id= ── */
  const q = new URLSearchParams(location.search);
  const porNumero = q.get('n');
  const porId = q.get('id');

  const d = porId
    ? PROFORMAS_PUBLICAS.docs.find(x => x.id === porId)
    : PROFORMAS_PUBLICAS.docs.find(x => String(x.numero) === String(porNumero));

  if (!d) {
    sheet.innerHTML = `
      <div style="padding:80px 46px;text-align:center;color:#333">
        <h2 style="font-size:22px;margin-bottom:10px">Documento no encontrado</h2>
        <p style="font-size:13px">Verifique el enlace o escríbanos por WhatsApp y se lo reenviamos.</p>
        <a href="${waHref('Hola Atlantek, no encuentro el documento que me enviaron.')}"
           style="display:inline-block;margin-top:18px;background:#1a6aff;color:#fff;padding:12px 22px;text-decoration:none;font-size:13px;border-radius:6px;font-weight:600">Contactar por WhatsApp</a>
      </div>`;
    return;
  }

  const c = PROFORMAS_PUBLICAS.clientes[d.clientId] || { nombre: '—', direccion: '', pais: '' };
  const E = PROFORMAS_PUBLICAS.empresa;
  const total = d.items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.precio) || 0), 0);

  const titulo = d.tipo === 'factura' ? 'Factura' : 'Pro forma\ninvoice';
  const labelNo = d.tipo === 'factura' ? 'INVOICE NO.' : 'PRO FORMA INVOICE NO.';

  const rows = d.items.map(it => `
    <tr>
      <td>${esc(it.desc)}</td>
      <td class="num">${esc(it.qty)}</td>
      <td class="num">${fmtPlain(it.precio)}</td>
      <td class="num">${fmtPlain((Number(it.qty) || 0) * (Number(it.precio) || 0))}</td>
    </tr>`).join('');

  sheet.innerHTML = `
    <div class="sheet__band">
      <div class="sheet__logo">
        <img src="assets/img/logo-atlantek-dark.png" alt="ATLANTEK Systems" class="sheet__logo-img">
        <span class="logo__word">ATLANTEK</span>
      </div>
      <div class="sheet__doctitle">
        <h2>${titulo}</h2>
        <span class="mail">${esc(E.email)}</span>
      </div>
    </div>

    <div class="sheet__meta">
      <div class="sheet__meta-item"><b>${labelNo}</b> ${numDoc(d.numero)}</div>
      <div class="sheet__meta-item"><b>Issue date</b> ${fmtDate(d.fechaEmision)}</div>
      <div class="sheet__meta-item"><b>Delivery date</b> ${fmtDate(d.fechaEntrega)}</div>
    </div>

    <div class="sheet__parties">
      <div class="sheet__party">
        <b>FROM</b>
        ${esc(E.nombre)}<br>
        ${esc(E.linea2)}<br>
        ${esc(E.direccion)}<br>
        ${esc(E.pais)}
      </div>
      <div class="sheet__party">
        <b>TO</b>
        ${esc(c.nombre)}<br>
        ${c.direccion ? esc(c.direccion) + '<br>' : ''}
        ${esc(c.pais)}
      </div>
      <div class="sheet__party sheet__party--total">
        <b>Total due</b>
        <div class="sheet__totaldue">${fmt(total)}</div>
      </div>
    </div>

    <div class="sheet__intro">Te facturamos:</div>

    <div class="sheet__items">
      <table class="sheet__table">
        <thead>
          <tr>
            <th style="width:52%">Description</th>
            <th style="width:12%" class="num">Quantity</th>
            <th style="width:18%" class="num">Unit price (₡)</th>
            <th style="width:18%" class="num">Amount (₡)</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="sheet__total-row">
        <span class="label">Total (CRC):</span>
        <span class="value">${fmt(total)}</span>
      </div>
    </div>

    <div class="sheet__notes">${esc(d.notas)}</div>
  `;

  document.getElementById('v-print').addEventListener('click', () => {
    const prev = document.title;
    const cliente = String(c.nombre || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
    document.title = `Atlantek-${d.tipo === 'factura' ? 'Factura' : 'Proforma'}-${numDoc(d.numero)}${cliente ? '-' + cliente : ''}`;
    window.print();
    setTimeout(() => { document.title = prev; }, 500);
  });

  document.getElementById('v-wa').addEventListener('click', () => {
    const msg = [
      `*Atlantek* — ${d.tipo === 'factura' ? 'Factura' : 'Proforma'} Nº ${numDoc(d.numero)}`,
      `Cliente: ${c.nombre}`,
      `Fecha: ${fmtDate(d.fechaEmision)}`,
      `Total: ${fmt(total)}`,
      '',
      'Cualquier consulta, con gusto.',
      'Atlantek · Seguridad · CCTV · Redes · 7231-2225'
    ].join('\n');
    window.open(waHref(msg), '_blank');
  });
})();