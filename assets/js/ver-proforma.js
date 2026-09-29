/* ═══════════════════════════════════════════════════════════════
   Atlantek · ver-proforma.js — visor público de un documento
   Uso: ver-proforma.html?n=27&k=<clave>

   La clave es un secreto por documento que vive en la hoja Config
   (docClave_027). Sin la clave correcta la API no devuelve nada, así
   que los links no son adivinables aunque se sepa el número.

   Fuente de datos:
     1. Apps Script  action:'doc-publico'  → proforma real
     2. Demo local   PROFORMAS_PUBLICAS    → mientras el endpoint
        no esté desplegado, para que la página nunca quede en blanco
   ═══════════════════════════════════════════════════════════════ */

(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const WA = '50672312225';

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
    const [y, m, d] = String(iso).split('-');
    return `${Number(m)}/${Number(d)}/${y}`;
  };

  const numDoc = (n) => String(n).padStart(3, '0');

  const waHref = (text) => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;

  const slug = (s) => String(s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');

  /* ── Pedir el documento a la API ── */
  async function pedir(numero, clave) {
    // `const` a nivel superior NO cuelga de window: hay que leer el identificador.
    if (typeof CONFIG === 'undefined' || !CONFIG.SHEETS_URL) throw new Error('sin CONFIG');

    const res = await fetch(CONFIG.SHEETS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        token: CONFIG.TOKEN,
        action: 'doc-publico',
        numero: Number(numero),
        clave: String(clave || '')
      })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);

    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'respuesta no válida');
    return json.data;
  }

  /* ── Demo local (respaldo si la API no responde) ── */
  function pedirDemo(numero) {
    // Igual que CONFIG: `const` no se expone en window.
    if (typeof PROFORMAS_PUBLICAS === 'undefined') return null;
    const P = PROFORMAS_PUBLICAS;

    const d = P.docs.find(x => String(x.numero) === String(numero));
    if (!d) return null;

    return {
      empresa: P.empresa,
      cliente: P.clientes[d.clientId] || { nombre: '—', direccion: '', pais: '' },
      doc: d,
      demo: true
    };
  }

  /* ── Estados ── */
  function noEncontrado(motivo, detalle) {
    $('v-loading').remove();
    $('v-root').innerHTML = `
      <div class="vstate">
        <h2>${esc(motivo)}</h2>
        <p>${esc(detalle)}</p>
        <a class="vbtn" href="${waHref('Hola Atlantek, no logro abrir el documento que me enviaron.')}">Contactar por WhatsApp</a>
      </div>`;
  }

  /* ── Render de la hoja ── */
  function pintar({ empresa: E, cliente: c, doc: d, demo }) {
    const total = (d.items || []).reduce(
      (s, it) => s + (Number(it.qty) || 0) * (Number(it.precio) || 0), 0
    );

    const esFactura = d.tipo === 'factura';
    const titulo = esFactura ? 'Factura' : 'Pro forma\ninvoice';
    const labelNo = esFactura ? 'INVOICE NO.' : 'PRO FORMA INVOICE NO.';

    const rows = (d.items || []).map(it => `
      <tr>
        <td>${esc(it.desc)}</td>
        <td class="num">${esc(it.qty)}</td>
        <td class="num">${fmtPlain(it.precio)}</td>
        <td class="num">${fmtPlain((Number(it.qty) || 0) * (Number(it.precio) || 0))}</td>
      </tr>`).join('');

    $('v-root').innerHTML = `
      <article class="sheet">
        <div class="sheet__band">
          <div class="sheet__logo">
            <img src="assets/img/logo-atlantek-dark.svg" alt="ATLANTEK Systems" class="sheet__logo-img">
            <span class="logo__word">ATLANTEK</span>
          </div>
          <div class="sheet__doctitle">
            <h2>${esc(titulo)}</h2>
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
      </article>`;

    $('v-loading').remove();
    $('v-doc').textContent = `${esFactura ? 'Factura' : 'Proforma'} Nº ${numDoc(d.numero)}`;

    document.title = `Atlantek · ${esFactura ? 'Factura' : 'Proforma'} ${numDoc(d.numero)}`;

    const etiqueta = esFactura ? 'Factura' : 'Proforma';

    $('v-print').addEventListener('click', () => {
      const prev = document.title;
      document.title = `Atlantek-${etiqueta}-${numDoc(d.numero)}${slug(c.nombre) ? '-' + slug(c.nombre) : ''}`;
      window.print();
      setTimeout(() => { document.title = prev; }, 500);
    });

    $('v-wa').addEventListener('click', () => {
      const msg = [
        `*Atlantek* — ${etiqueta} Nº ${numDoc(d.numero)}`,
        `Cliente: ${c.nombre}`,
        `Fecha: ${fmtDate(d.fechaEmision)}`,
        `Total: ${fmt(total)}`,
        '',
        'Cualquier consulta, con gusto.',
        'Atlantek · Seguridad · CCTV · Redes · 7231-2225'
      ].join('\n');
      window.open(waHref(msg), '_blank');
    });

    if (demo) {
      console.warn('[proforma] mostrando datos de demostración — la API no respondió');
    }
  }

  /* ── Arranque ── */
  (async () => {
    const q = new URLSearchParams(location.search);
    const numero = q.get('n');
    const clave = q.get('k');

    if (!numero) {
      noEncontrado(
        'Enlace incompleto',
        'Este documento necesita el número y la clave que van en el enlace que le enviamos por WhatsApp.'
      );
      return;
    }

    let data = null;
    let fallo = null;

    try {
      data = await pedir(numero, clave);
    } catch (e) {
      fallo = e;
    }

    // Respaldo: si la API aún no está desplegada, usamos el demo
    if (!data) {
      const demo = pedirDemo(numero);
      if (demo) {
        pintar(demo);
        return;
      }
      noEncontrado(
        'Documento no encontrado',
        'Verifique que el enlace esté completo. Si el problema sigue, escríbanos y se lo reenviamos.'
      );
      if (fallo) console.warn('[proforma] API:', fallo.message);
      return;
    }

    pintar(data);
  })();
})();
