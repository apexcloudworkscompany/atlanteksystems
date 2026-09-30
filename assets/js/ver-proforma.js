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
  const WA = '50663144171';

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
    if (typeof CONFIG === 'undefined' || !CONFIG.PROFORMA_URL) throw new Error('sin CONFIG');

    const res = await fetch(CONFIG.PROFORMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        token: CONFIG.TOKEN,
        action: 'doc-publico',
        numero: Number(numero),
        clave: String(clave || '')
      })
    });
    if (!res.ok) {
      const e = new Error('HTTP ' + res.status);
      e.redCaida = true; // la API no respondió bien -> sí vale el respaldo
      throw e;
    }

    const json = await res.json();
    if (!json.ok) {
      // La API respondió y dijo que NO. Esto NO es un fallo de conexión:
      // la clave está mala o el documento no existe. Tiene que verse el
      // error, nunca datos de demostración.
      const e = new Error(json.error || 'respuesta no válida');
      e.redCaida = false;
      throw e;
    }
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
    const documentDate = (iso) => {
      const match = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
      return match ? `${match[3]}/${match[2]}/${match[1]}` : '—';
    };
    const total = (d.items || []).reduce(
      (s, it) => s + (Number(it.qty) || 0) * (Number(it.precio) || 0), 0
    );

    const esFactura = d.tipo === 'factura';
    const titulo = esFactura ? 'Factura' : 'Proforma';

    const cotNumero = d.cotizacion && !/(NaN|undefined|null)/i.test(d.cotizacion)
      ? d.cotizacion
      : `${esFactura ? 'FAC' : 'PRF'}-${numDoc(d.numero)}`;
    const estado = ['borrador', 'enviada', 'pagada'].includes(d.estado) ? d.estado : 'borrador';

    const rows = (d.items || []).map(it => `
      <tr>
        <td>${esc(it.desc)}</td>
        <td class="num" data-label="Cantidad">${esc(it.qty)}</td>
        <td class="num" data-label="Precio (CRC)">${fmtPlain(it.precio)}</td>
        <td class="num" data-label="Importe (CRC)">${fmtPlain((Number(it.qty) || 0) * (Number(it.precio) || 0))}</td>
      </tr>`).join('');

    $('v-root').innerHTML = `
      <article class="sheet">
        ${demo ? '<div class="sheet__demo">DEMOSTRACIÓN · Este documento no es una cotización válida.</div>' : ''}
        <div class="sheet__band">
          <div class="sheet__logo">
            <img src="assets/img/logo-atlantek-white.svg" alt="ATLANTEK Systems" class="sheet__logo-img">
          </div>
          <div class="sheet__doctitle">
            <span class="sheet__eyebrow">${esFactura ? 'Documento comercial' : 'Propuesta comercial'}</span>
            <h2>${esc(titulo)}</h2>
            <span class="mail">${esc(E.email)}</span>
          </div>
        </div>

      <div class="sheet__meta">
        <div class="sheet__meta-item"><b>Documento</b> ${esc(cotNumero)}</div>
        <div class="sheet__meta-item"><b>Emisión</b> ${documentDate(d.fechaEmision)}</div>
        <div class="sheet__meta-item"><b>Entrega</b> ${documentDate(d.fechaEntrega)}</div>
        <div class="sheet__meta-item"><b>Estado</b> <span class="status-badge status-${estado}">${estado}</span></div>
      </div>

      <div class="sheet__parties">
          <div class="sheet__party">
            <b>Emitido por</b>
            ${esc(E.nombre)}<br>
            ${E.linea2 && E.linea2 !== 'N/A' ? esc(E.linea2) + '<br>' : ''}
            ${esc(E.direccion)}<br>
            ${esc(E.pais)}
          </div>
          <div class="sheet__party">
            <b>Preparado para</b>
            ${esc(c.nombre)}<br>
            ${c.direccion ? esc(c.direccion) + '<br>' : ''}
            ${esc(c.pais)}
          </div>
          <div class="sheet__party sheet__party--total">
            <b>Total del documento · CRC</b>
            <div class="sheet__totaldue">${fmt(total)}</div>
          </div>
        </div>

        <div class="sheet__intro">${esFactura ? 'Detalle de facturación' : 'Equipos y servicios cotizados'}</div>

        <div class="sheet__items">
          <table class="sheet__table" aria-label="Detalle de equipos y servicios">
            <thead>
              <tr>
                <th scope="col">Descripción</th>
                <th scope="col" class="num">Cant.</th>
                <th scope="col" class="num">Precio unit. (CRC)</th>
                <th scope="col" class="num">Importe (CRC)</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="sheet__total-row">
            <span class="label">Total (CRC):</span>
            <span class="value">${fmt(total)}</span>
          </div>
        </div>

        ${d.notas ? `<section class="sheet__notes"><h3>Notas y condiciones</h3><p>${esc(d.notas)}</p></section>` : ''}
      <footer class="sheet__footer"><span>Atlantek Systems · Seguridad · CCTV · Redes</span><span>Desarrollado por Apex Cloud Work — Cartago, CR</span></footer>
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
        'Atlantek · Seguridad · CCTV · Redes · 6314-4171'
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

    if (data) {
      pintar(data);
      return;
    }

    const caida = fallo && fallo.redCaida !== false;

    // El respaldo demo existe SOLO para cuando la API no está desplegada o
    // no se puede alcanzar. Si la API contestó y rechazó el enlace (clave
    // mala, documento inexistente) se le muestra el error al cliente: si no,
    // alguien con un link viejo vería una proforma de mentira.
    if (caida) {
      const demo = pedirDemo(numero);
      if (demo) {
        pintar(demo);
        return;
      }
      noEncontrado(
        'No pudimos cargar el documento',
        'El servicio no responde en este momento. Intentá de nuevo en un rato o escribinos por WhatsApp.'
      );
      console.warn('[proforma] API caída:', fallo.message);
      return;
    }

    noEncontrado(
      'Enlace no válido',
      'Este enlace no corresponde a un documento válido. Escribinos y te lo reenviamos.'
    );
    if (fallo) console.warn('[proforma] API rechazó:', fallo.message);
  })();
})();
