/* ═══════════════════════════════════════════════════════════════
   Atlantek · app.js — vistas, router y eventos
   ═══════════════════════════════════════════════════════════════ */

(() => {
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const main    = $('#main');
  const docview = $('#docview');
  const sheet   = $('#sheet');
  const modal   = $('#modal');
  const modalPanel = $('#modal-panel');

  /* ── Helpers ── */
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
  const hoy = () => new Date().toISOString().slice(0, 10);

  const ESTADOS = ['borrador', 'enviada', 'pagada'];
  const chipEstado = (e) => `<span class="chip chip--${e}">${e}</span>`;
  const chipTipo   = (t) => `<span class="chip chip--${t}">${t}</span>`;

  /* Días transcurridos desde una fecha ISO (yyyy-mm-dd) */
  const daysSince = (iso) => {
    if (!iso) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(iso.slice(0, 10) + 'T00:00:00')) / 864e5));
  };

  /* Link de WhatsApp: 8 dígitos → prefijo 506 · sin teléfono → selector */
  const waHref = (tel, text) => {
    const d = String(tel || '').replace(/\D/g, '');
    const phone = d.length === 8 ? '506' + d : d;
    const q = text ? `?text=${encodeURIComponent(text)}` : '';
    return phone ? `https://wa.me/${phone}${q}` : `https://wa.me/${q}`;
  };

  /* Fecha corta de un lead (ISO datetime) */
  const fmtLeadFecha = (iso) => {
    const d = new Date(iso);
    if (isNaN(d)) return '—';
    const dias = Math.floor((Date.now() - d.getTime()) / 864e5);
    const fecha = `${d.getDate()}/${d.getMonth() + 1}`;
    return dias === 0 ? `hoy ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}` : `${fecha} · hace ${dias} d`;
  };

  /* Badge de leads nuevos en el sidebar */
  function updateLeadsBadge() {
    const b = $('#nav-badge-leads');
    if (!b) return;
    const n = Store.leadsNuevos();
    b.hidden = !n;
    b.textContent = n;
  }

  /* ═══════════ ROUTER ═══════════ */

  function route() {
    const hash = location.hash || '#/dashboard';
    const [, view, param] = hash.split('/');

    docview.hidden = true;
    closeModal();

    $$('.nav-item').forEach(a => a.classList.toggle('is-active', a.dataset.nav === view));

    if (view === 'clientes')        renderClientes();
    else if (view === 'catalogo')   renderCatalogo();
    else if (view === 'documentos') renderDocumentos();
    else if (view === 'leads')      renderLeads();
    else if (view === 'editor')     renderEditor(param || null);
    else if (view === 'doc' && param) renderDocView(param);
    else renderDashboard();

    updateLeadsBadge();
  }

  window.addEventListener('hashchange', route);

  /* ═══════════ DASHBOARD ═══════════ */

  function renderDashboard() {
    const docs = Store.getDocs();
    const clients = Store.getClients();

    const totalPagado    = docs.filter(d => d.estado === 'pagada').reduce((s, d) => s + Store.docTotal(d), 0);
    const totalPendiente = docs.filter(d => d.estado === 'enviada').reduce((s, d) => s + Store.docTotal(d), 0);

    const recientes = docs.slice(0, 6);

    main.innerHTML = `
      <div class="view-head">
        <div>
          <span class="view-head__kicker">Atlantek · Gestión</span>
          <h1>Dashboard</h1>
        </div>
        <a href="#/editor" class="btn btn--navy">+ Nueva proforma</a>
      </div>

      <div class="stats">
        <div class="stat stat--red">
          <span class="stat__label">Por cobrar</span>
          <span class="stat__value">${fmt(totalPendiente)}</span>
          <span class="stat__hint">documentos enviados</span>
        </div>
        <div class="stat">
          <span class="stat__label">Cobrado</span>
          <span class="stat__value">${fmt(totalPagado)}</span>
          <span class="stat__hint">documentos pagados</span>
        </div>
        <div class="stat">
          <span class="stat__label">Documentos</span>
          <span class="stat__value">${docs.length}</span>
          <span class="stat__hint">próximo Nº ${numDoc(Store.nextNumber())}</span>
        </div>
        <div class="stat">
          <span class="stat__label">Clientes</span>
          <span class="stat__value">${clients.length}</span>
          <span class="stat__hint">registrados</span>
        </div>
        <a href="#/leads" class="stat stat--link ${Store.leadsNuevos() ? 'stat--red' : ''}">
          <span class="stat__label">Leads nuevos</span>
          <span class="stat__value">${Store.leadsNuevos()}</span>
          <span class="stat__hint">del sitio web · ver →</span>
        </a>
      </div>

      <div class="panel">
        <div class="panel__head">
          <span class="panel__title">Documentos recientes</span>
          <a href="#/documentos" class="btn btn--ghost btn--sm">Ver todos</a>
        </div>
        ${tablaDocs(recientes)}
      </div>
    `;
    bindDocRows();
  }

  /* ═══════════ CLIENTES ═══════════ */

  function renderClientes() {
    const clients = Store.getClients();
    const docs = Store.getDocs();

    const rows = clients.map(c => {
      const cDocs = docs.filter(d => d.clientId === c.id);
      const total = cDocs.reduce((s, d) => s + Store.docTotal(d), 0);
      const productos = (c.productos || []).slice(0, 2).join(', ');
      const moreCount = (c.productos || []).length > 2 ? ` +${c.productos.length - 2}` : '';
      const estado = c.estado || 'activo';
      const estadoChip = estado === 'activo'
        ? '<span class="chip chip--pagada">activo</span>'
        : '<span class="chip chip--borrador">inactivo</span>';
      return `
        <tr>
          <td><b>${esc(c.nombre)}</b></td>
          <td>${esc(c.contacto) || '<span style="color:var(--muted)">—</span>'}</td>
          <td>${esc(c.telefono) || '<span style="color:var(--muted)">—</span>'}</td>
          <td>${estadoChip}</td>
          <td><span style="font-size:12.5px">${esc(productos) || '<span style="color:var(--muted)">—</span>'}${moreCount ? '<span style="color:var(--faint)">'+esc(moreCount)+'</span>' : ''}</span></td>
          <td>${cDocs.length}</td>
          <td class="num money">${fmt(total)}</td>
          <td class="num">
            <button class="btn--icon btn" data-edit-client="${c.id}">Editar</button>
            <button class="btn--icon btn" data-del-client="${c.id}">Eliminar</button>
          </td>
        </tr>`;
    }).join('');

    main.innerHTML = `
      <div class="view-head">
        <div>
          <span class="view-head__kicker">Atlantek · Gestión</span>
          <h1>Clientes</h1>
        </div>
        <button class="btn btn--red" id="btn-new-client">+ Nuevo cliente</button>
      </div>

      <div class="panel">
        <table class="table">
          <thead>
            <tr>
              <th>Cliente</th><th>Contacto</th><th>Teléfono</th>
              <th>Estado</th><th>Productos / Servicios</th>
              <th>Docs</th><th class="num">Total histórico</th><th class="num"></th>
            </tr>
          </thead>
          <tbody>${rows || ''}</tbody>
        </table>
        ${clients.length ? '' : '<div class="empty">Sin clientes todavía. Agregá el primero.</div>'}
      </div>
    `;

    $('#btn-new-client').addEventListener('click', () => openClientModal(null));
    $$('[data-edit-client]').forEach(b =>
      b.addEventListener('click', () => openClientModal(b.dataset.editClient)));
    $$('[data-del-client]').forEach(b =>
      b.addEventListener('click', () => {
        const c = Store.getClient(b.dataset.delClient);
        if (!c) return;
        if (!confirm(`¿Eliminar a ${c.nombre}?`)) return;
        if (!Store.deleteClient(c.id)) {
          alert('Este cliente tiene documentos asociados. Eliminá primero sus documentos.');
          return;
        }
        renderClientes();
      }));
  }

  /* prefill: datos iniciales (ej. desde un lead) · onSaved: qué hacer al guardar
     (por defecto re-renderiza Clientes) */
  function openClientModal(id, prefill = null, onSaved = null) {
    const c = id
      ? Store.getClient(id)
      : Object.assign({ nombre: '', contacto: '', telefono: '', email: '', direccion: '', pais: 'Costa Rica', notas: '', productos: [], estado: 'activo' }, prefill || {});

    const productosText = (c.productos || []).join('\n');

    modalPanel.innerHTML = `
      <div class="modal__title">${id ? 'Editar cliente' : 'Nuevo cliente'}</div>
      <form class="modal__form" id="client-form">
        <div class="field">
          <label class="field__label">Nombre / Razón social *</label>
          <input class="input" name="nombre" required value="${esc(c.nombre)}">
        </div>
        <div class="field">
          <label class="field__label">Persona de contacto</label>
          <input class="input" name="contacto" value="${esc(c.contacto)}">
        </div>
        <div class="field">
          <label class="field__label">Teléfono</label>
          <input class="input" name="telefono" value="${esc(c.telefono)}">
        </div>
        <div class="field">
          <label class="field__label">Email</label>
          <input class="input" type="email" name="email" value="${esc(c.email)}">
        </div>
        <div class="field">
          <label class="field__label">Dirección</label>
          <input class="input" name="direccion" value="${esc(c.direccion)}">
        </div>
        <div class="field">
          <label class="field__label">País</label>
          <input class="input" name="pais" value="${esc(c.pais)}">
        </div>
        <div class="field">
          <label class="field__label">Estado</label>
          <select class="input input--select" name="estado">
            <option value="activo" ${c.estado === 'activo' ? 'selected' : ''}>Activo</option>
            <option value="inactivo" ${c.estado === 'inactivo' ? 'selected' : ''}>Inactivo</option>
          </select>
        </div>
        <div class="field">
          <label class="field__label">Productos / Servicios <i>(uno por línea)</i></label>
          <textarea class="input" name="productos" placeholder="Ej: CCTV 4 cámaras Dahua&#10;Grabador DVR">${esc(productosText)}</textarea>
        </div>
        <div class="field">
          <label class="field__label">Notas internas</label>
          <textarea class="input" name="notas" placeholder="Info relevante sobre el cliente…">${esc(c.notas)}</textarea>
        </div>
        <div class="modal__actions">
          <button type="button" class="btn btn--ghost" data-close>Cancelar</button>
          <button type="submit" class="btn btn--red">Guardar</button>
        </div>
      </form>
    `;
    modal.hidden = false;

    $('#client-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const productosRaw = fd.get('productos').trim();
      const productos = productosRaw ? productosRaw.split('\n').map(s => s.trim()).filter(Boolean) : [];
      const saved = Store.saveClient({
        id: id || null,
        nombre: fd.get('nombre').trim(),
        contacto: fd.get('contacto').trim(),
        telefono: fd.get('telefono').trim(),
        email: fd.get('email').trim(),
        direccion: fd.get('direccion').trim(),
        pais: fd.get('pais').trim(),
        estado: fd.get('estado'),
        productos,
        notas: fd.get('notas').trim()
      });
      closeModal();
      if (onSaved) onSaved(saved); else renderClientes();
    });

    $$('[data-close]', modalPanel).forEach(b => b.addEventListener('click', closeModal));
  }

  function closeModal() {
    modal.hidden = true;
    modalPanel.innerHTML = '';
  }
  $('.modal__backdrop').addEventListener('click', closeModal);

  /* ═══════════ DOCUMENTOS (lista) ═══════════ */

  function tablaDocs(docs) {
    if (!docs.length) return '<div class="empty">Sin documentos todavía.</div>';
    const rows = docs.map(d => {
      const c = Store.getClient(d.clientId);
      const dias = d.estado === 'enviada' ? daysSince(d.fechaEmision) : 0;
      const due = dias > 0
        ? `<span class="due ${dias > 7 ? 'due--red' : dias > 3 ? 'due--amber' : ''}">hace ${dias} d</span>`
        : '';
      return `
        <tr class="row-link" data-open-doc="${d.id}">
          <td class="doc-num">Nº ${numDoc(d.numero)}</td>
          <td>${chipTipo(d.tipo)}</td>
          <td><b>${esc(c ? c.nombre : '—')}</b></td>
          <td>${fmtDate(d.fechaEmision)}</td>
          <td>${chipEstado(d.estado)}${due}</td>
          <td class="num money money--red">${fmt(Store.docTotal(d))}</td>
          <td class="num">
            <button class="btn--icon btn" data-edit-doc="${d.id}">Editar</button>
            <button class="btn--icon btn" data-del-doc="${d.id}">Eliminar</button>
          </td>
        </tr>`;
    }).join('');
    return `
      <table class="table">
        <thead>
          <tr>
            <th>Número</th><th>Tipo</th><th>Cliente</th>
            <th>Emisión</th><th>Estado</th><th class="num">Total (CRC)</th><th class="num"></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  function bindDocRows() {
    $$('[data-open-doc]').forEach(tr =>
      tr.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        location.hash = `#/doc/${tr.dataset.openDoc}`;
      }));
    $$('[data-edit-doc]').forEach(b =>
      b.addEventListener('click', () => { location.hash = `#/editor/${b.dataset.editDoc}`; }));
    $$('[data-del-doc]').forEach(b =>
      b.addEventListener('click', () => {
        const d = Store.getDoc(b.dataset.delDoc);
        if (!d) return;
        if (!confirm(`¿Eliminar ${d.tipo} Nº ${numDoc(d.numero)}?`)) return;
        Store.deleteDoc(d.id);
        route();
      }));
  }

  function renderDocumentos() {
    main.innerHTML = `
      <div class="view-head">
        <div>
          <span class="view-head__kicker">Atlantek · Gestión</span>
          <h1>Proformas / Facturas</h1>
        </div>
        <a href="#/editor" class="btn btn--red">+ Nuevo documento</a>
      </div>
      <div class="filters">
        <input class="input" id="f-q" type="search" placeholder="Buscar por cliente o número…">
        <select class="input input--select" id="f-tipo">
          <option value="">Tipo: todos</option>
          <option value="proforma">Proformas</option>
          <option value="factura">Facturas</option>
        </select>
        <select class="input input--select" id="f-estado">
          <option value="">Estado: todos</option>
          ${ESTADOS.map(e => `<option value="${e}">${e[0].toUpperCase() + e.slice(1)}</option>`).join('')}
        </select>
      </div>
      <div class="panel" id="docs-panel">${tablaDocs(Store.getDocs())}</div>
    `;
    bindDocRows();

    const applyFilters = () => {
      const q   = $('#f-q').value.trim().toLowerCase();
      const t   = $('#f-tipo').value;
      const est = $('#f-estado').value;
      const docs = Store.getDocs().filter(d => {
        if (t && d.tipo !== t) return false;
        if (est && d.estado !== est) return false;
        if (q) {
          const c = Store.getClient(d.clientId);
          const hay = `${numDoc(d.numero)} ${c ? c.nombre : ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
      $('#docs-panel').innerHTML = (q || t || est) && !docs.length
        ? '<div class="empty">Sin resultados con esos filtros.</div>'
        : tablaDocs(docs);
      bindDocRows();
    };
    ['f-q', 'f-tipo', 'f-estado'].forEach(id =>
      $('#' + id).addEventListener('input', applyFilters));
  }

  /* ═══════════ LEADS DEL SITIO ═══════════ */

  function renderLeads() {
    const leads = Store.getLeads();

    const rows = leads.map(l => {
      const opts = Store.LEAD_ESTADOS.map(e =>
        `<option value="${e}" ${e === l.estado ? 'selected' : ''}>${e.toUpperCase()}</option>`).join('');
      const meta = [l.distrito, l.tipo].filter(Boolean).map(esc).join(' · ');
      const waMsg = `Hola ${l.nombre}, le saluda Atlantek. Recibimos su consulta por ${l.servicio || 'nuestros servicios'} y con gusto le preparamos una cotización. ¿Cuándo podemos coordinar una visita?`;
      return `
        <tr class="${l.estado === 'nuevo' ? 'lead-row--nuevo' : ''}">
          <td class="lead-fecha">${fmtLeadFecha(l.fecha)}</td>
          <td>
            <b>${esc(l.nombre)}</b>
            ${meta ? `<div class="lead-meta">${meta}</div>` : ''}
          </td>
          <td class="mono-cell">${esc(l.telefono)}</td>
          <td>${esc(l.servicio) || '<span style="color:var(--faint)">—</span>'}</td>
          <td class="lead-msg" title="${esc(l.mensaje)}">${esc(l.mensaje) || '<span style="color:var(--faint)">—</span>'}</td>
          <td>
            <select class="input input--sm input--select lead-estado" data-lead-estado="${l.id}">${opts}</select>
          </td>
          <td class="num lead-actions">
            <a class="btn btn--icon lead-wa" target="_blank" rel="noopener" href="${waHref(l.telefono, waMsg)}">WhatsApp</a>
            <button class="btn btn--icon" data-lead-cliente="${l.id}">→ Cliente</button>
          </td>
        </tr>`;
    }).join('');

    main.innerHTML = `
      <div class="view-head">
        <div>
          <span class="view-head__kicker">Atlantek · Gestión</span>
          <h1>Leads del sitio</h1>
        </div>
        <span class="lead-count">${Store.leadsNuevos()} nuevos · ${leads.length} en total</span>
      </div>

      <div class="panel">
        ${leads.length ? `
        <table class="table">
          <thead>
            <tr>
              <th>Fecha</th><th>Nombre</th><th>Teléfono</th>
              <th>Servicio</th><th>Mensaje</th><th>Estado</th><th class="num"></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>` : '<div class="empty">Sin leads todavía. Los que entren por el formulario del sitio aparecen aquí.</div>'}
      </div>
    `;

    $$('[data-lead-estado]').forEach(sel =>
      sel.addEventListener('change', async () => {
        await Store.setLeadStatus(sel.dataset.leadEstado, sel.value);
        updateLeadsBadge();
      }));

    $$('[data-lead-cliente]').forEach(b =>
      b.addEventListener('click', () => {
        const l = Store.getLead(b.dataset.leadCliente);
        if (!l) return;
        openClientModal(null, { nombre: l.nombre, telefono: l.telefono }, () => {
          Store.setLeadStatus(l.id, 'cotizado');
          renderLeads();
        });
      }));
  }

  /* ═══════════ CATÁLOGO ═══════════ */

  function renderCatalogo() {
    const items = Store.getCatalogo();
    const cats = [...new Set(items.map(p => p.categoria))].sort();

    const rows = items.map(p => {
      const estado = p.estado || 'disponible';
      const chip = estado === 'disponible'
        ? '<span class="chip chip--pagada">disponible</span>'
        : '<span class="chip chip--borrador">agotado</span>';
      return `
        <tr>
          <td><b>${esc(p.nombre)}</b></td>
          <td><span class="chip chip--proforma">${esc(p.categoria)}</span></td>
          <td class="num money">${fmt(p.precio)}</td>
          <td>${chip}</td>
          <td style="max-width:280px;font-size:12.5px;color:var(--muted)">${esc(p.descripcion) || '—'}</td>
          <td class="num">
            <button class="btn--icon btn" data-edit-item="${p.id}">Editar</button>
            <button class="btn--icon btn" data-del-item="${p.id}">Eliminar</button>
          </td>
        </tr>`;
    }).join('');

    main.innerHTML = `
      <div class="view-head">
        <div>
          <span class="view-head__kicker">Atlantek · Gestión</span>
          <h1>Catálogo de Productos</h1>
        </div>
        <button class="btn btn--red" id="btn-new-item">+ Nuevo producto</button>
      </div>

      <div class="filters">
        <input class="input" id="f-cat-q" type="search" placeholder="Buscar por nombre o categoría…">
        <select class="input input--select" id="f-cat-categoria">
          <option value="">Categoría: todas</option>
          ${cats.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}
        </select>
      </div>

      <div class="panel" id="catalogo-panel">
        ${items.length ? `
        <table class="table">
          <thead>
            <tr>
              <th>Producto</th><th>Categoría</th><th class="num">Precio (₡)</th>
              <th>Estado</th><th>Descripción</th><th class="num"></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>` : '<div class="empty">Sin productos en el catálogo. Agregá el primero.</div>'}
      </div>
    `;

    $('#btn-new-item').addEventListener('click', () => openCatalogoModal(null));
    $$('[data-edit-item]').forEach(b =>
      b.addEventListener('click', () => openCatalogoModal(b.dataset.editItem)));
    $$('[data-del-item]').forEach(b =>
      b.addEventListener('click', () => {
        const p = Store.getCatalogoItem(b.dataset.delItem);
        if (!p) return;
        if (!confirm(`¿Eliminar "${p.nombre}" del catálogo?`)) return;
        Store.deleteCatalogoItem(p.id);
        renderCatalogo();
      }));

    const applyFilters = () => {
      const q = $('#f-cat-q').value.trim().toLowerCase();
      const cat = $('#f-cat-categoria').value;
      const filtered = items.filter(p => {
        if (cat && p.categoria !== cat) return false;
        if (q) {
          const hay = `${p.nombre} ${p.categoria} ${p.descripcion}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
      $('#catalogo-panel').innerHTML = (q || cat) && !filtered.length
        ? '<div class="empty">Sin resultados con esos filtros.</div>'
        : `<table class="table">
            <thead>
              <tr>
                <th>Producto</th><th>Categoría</th><th class="num">Precio (₡)</th>
                <th>Estado</th><th>Descripción</th><th class="num"></th>
              </tr>
            </thead>
            <tbody>${filtered.map(p => {
              const estado = p.estado || 'disponible';
              const chip = estado === 'disponible'
                ? '<span class="chip chip--pagada">disponible</span>'
                : '<span class="chip chip--borrador">agotado</span>';
              return `
                <tr>
                  <td><b>${esc(p.nombre)}</b></td>
                  <td><span class="chip chip--proforma">${esc(p.categoria)}</span></td>
                  <td class="num money">${fmt(p.precio)}</td>
                  <td>${chip}</td>
                  <td style="max-width:280px;font-size:12.5px;color:var(--muted)">${esc(p.descripcion) || '—'}</td>
                  <td class="num">
                    <button class="btn--icon btn" data-edit-item="${p.id}">Editar</button>
                    <button class="btn--icon btn" data-del-item="${p.id}">Eliminar</button>
                  </td>
                </tr>`;
            }).join('')}</tbody>
          </table>`;
      $$('[data-edit-item]').forEach(b =>
        b.addEventListener('click', () => openCatalogoModal(b.dataset.editItem)));
      $$('[data-del-item]').forEach(b =>
        b.addEventListener('click', () => {
          const p = Store.getCatalogoItem(b.dataset.delItem);
          if (!p) return;
          if (!confirm(`¿Eliminar "${p.nombre}" del catálogo?`)) return;
          Store.deleteCatalogoItem(p.id);
          renderCatalogo();
        }));
    };
    ['f-cat-q', 'f-cat-categoria'].forEach(id =>
      $('#' + id).addEventListener('input', applyFilters));
  }

  function openCatalogoModal(id) {
    const p = id
      ? Store.getCatalogoItem(id)
      : { nombre: '', categoria: '', precio: 0, descripcion: '', unidad: 'pieza', estado: 'disponible' };

    const categorias = ['Cámaras', 'Grabadores', 'Almacenamiento', 'Accesorios', 'Cableado', 'Redes', 'Acceso', 'Servicios', 'Otros'];

    modalPanel.innerHTML = `
      <div class="modal__title">${id ? 'Editar producto' : 'Nuevo producto'}</div>
      <form class="modal__form" id="item-form">
        <div class="field">
          <label class="field__label">Nombre *</label>
          <input class="input" name="nombre" required value="${esc(p.nombre)}" placeholder="Ej: Cámara Domo Dahua 2MP">
        </div>
        <div class="field">
          <label class="field__label">Categoría</label>
          <input class="input" name="categoria" value="${esc(p.categoria)}" list="cat-list" placeholder="Seleccionar o escribir">
          <datalist id="cat-list">
            ${categorias.map(c => `<option value="${esc(c)}">`).join('')}
          </datalist>
        </div>
        <div class="field">
          <label class="field__label">Precio unitario (₡)</label>
          <input class="input" type="number" name="precio" min="0" step="100" value="${esc(p.precio)}">
        </div>
        <div class="field">
          <label class="field__label">Unidad</label>
          <select class="input input--select" name="unidad">
            <option value="pieza" ${p.unidad === 'pieza' ? 'selected' : ''}>Pieza</option>
            <option value="metro" ${p.unidad === 'metro' ? 'selected' : ''}>Metro</option>
            <option value="servicio" ${p.unidad === 'servicio' ? 'selected' : ''}>Servicio</option>
            <option value="kit" ${p.unidad === 'kit' ? 'selected' : ''}>Kit</option>
          </select>
        </div>
        <div class="field">
          <label class="field__label">Estado</label>
          <select class="input input--select" name="estado">
            <option value="disponible" ${p.estado === 'disponible' ? 'selected' : ''}>Disponible</option>
            <option value="agotado" ${p.estado === 'agotado' ? 'selected' : ''}>Agotado</option>
          </select>
        </div>
        <div class="field">
          <label class="field__label">Descripción</label>
          <textarea class="input" name="descripcion" placeholder="Especificaciones, notas…">${esc(p.descripcion)}</textarea>
        </div>
        <div class="modal__actions">
          <button type="button" class="btn btn--ghost" data-close>Cancelar</button>
          <button type="submit" class="btn btn--red">Guardar</button>
        </div>
      </form>
    `;
    modal.hidden = false;

    $('#item-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      Store.saveCatalogoItem({
        id: id || null,
        nombre: fd.get('nombre').trim(),
        categoria: fd.get('categoria').trim(),
        precio: Number(fd.get('precio')) || 0,
        unidad: fd.get('unidad'),
        estado: fd.get('estado'),
        descripcion: fd.get('descripcion').trim()
      });
      closeModal();
      renderCatalogo();
    });

    $$('[data-close]', modalPanel).forEach(b => b.addEventListener('click', closeModal));
  }

  /* ═══════════ EDITOR ═══════════ */

  function renderEditor(docId) {
    const existing = docId ? Store.getDoc(docId) : null;
    const d = existing ? JSON.parse(JSON.stringify(existing)) : {
      id: null,
      tipo: 'proforma',
      clientId: '',
      fechaEmision: hoy(),
      fechaEntrega: hoy(),
      estado: 'borrador',
      notas: Store.GARANTIA_DEFAULT,
      items: [{ desc: '', qty: 1, precio: 0 }]
    };

    const clients = Store.getClients();
    const clientOpts = clients.map(c =>
      `<option value="${c.id}" ${c.id === d.clientId ? 'selected' : ''}>${esc(c.nombre)}</option>`).join('');

    const numeroLabel = existing ? `Nº ${numDoc(existing.numero)}` : `Nº ${numDoc(Store.nextNumber())} (auto)`;

    main.innerHTML = `
      <div class="view-head">
        <div>
          <span class="view-head__kicker">${existing ? 'Editar documento' : 'Nuevo documento'} · ${numeroLabel}</span>
          <h1>${existing ? 'Editar' : 'Crear'} ${d.tipo}</h1>
        </div>
      </div>

      <div class="editor">
        <div class="editor__grid">
          <div class="field">
            <label class="field__label">Cliente *</label>
            <select class="input input--select" id="ed-client" required>
              <option value="">— Seleccionar —</option>
              ${clientOpts}
            </select>
          </div>
          <div class="field">
            <label class="field__label">Tipo</label>
            <select class="input input--select" id="ed-tipo">
              <option value="proforma" ${d.tipo === 'proforma' ? 'selected' : ''}>Proforma</option>
              <option value="factura"  ${d.tipo === 'factura'  ? 'selected' : ''}>Factura</option>
            </select>
          </div>
          <div class="field">
            <label class="field__label">Fecha emisión</label>
            <input class="input" type="date" id="ed-emision" value="${esc(d.fechaEmision)}">
          </div>
          <div class="field">
            <label class="field__label">Fecha entrega</label>
            <input class="input" type="date" id="ed-entrega" value="${esc(d.fechaEntrega)}">
          </div>
        </div>

        <div class="panel editor__items">
          <div class="panel__head">
            <span class="panel__title">Líneas del documento</span>
            <button class="btn btn--slate btn--sm" id="ed-add-item">+ Agregar línea</button>
          </div>
          <table class="table">
            <thead>
              <tr>
                <th style="width:52%">Descripción</th>
                <th style="width:12%" class="num">Cantidad</th>
                <th style="width:16%" class="num">Precio unit. (₡)</th>
                <th style="width:16%" class="num">Monto (₡)</th>
                <th style="width:4%"></th>
              </tr>
            </thead>
            <tbody id="ed-items"></tbody>
          </table>
        </div>

        <div class="field">
          <label class="field__label">Notas / Garantía (pie del documento)</label>
          <textarea class="input" id="ed-notas">${esc(d.notas)}</textarea>
        </div>

        <div class="editor__totalbar">
          <span class="label">Total (CRC)</span>
          <span class="value" id="ed-total">₡0.00</span>
        </div>

        <div class="editor__actions">
          <a href="#/documentos" class="btn btn--ghost">Cancelar</a>
          <button class="btn btn--navy" id="ed-save">Guardar ${existing ? 'cambios' : 'documento'}</button>
        </div>
      </div>
    `;

    if (d.clientId) $('#ed-client').value = d.clientId;

    const tbody = $('#ed-items');

    function renderItems() {
      tbody.innerHTML = d.items.map((it, i) => `
        <tr>
          <td><input class="input" data-f="desc" data-i="${i}" value="${esc(it.desc)}" placeholder="Descripción del producto o servicio"></td>
          <td><input class="input num" type="number" min="0" step="1" data-f="qty" data-i="${i}" value="${esc(it.qty)}"></td>
          <td><input class="input num" type="number" min="0" step="0.01" data-f="precio" data-i="${i}" value="${esc(it.precio)}"></td>
          <td class="num money" data-amount="${i}">${fmt((Number(it.qty) || 0) * (Number(it.precio) || 0))}</td>
          <td class="num"><button class="btn btn--icon" data-rm="${i}" title="Quitar línea">✕</button></td>
        </tr>`).join('');

      $$('input[data-f]', tbody).forEach(inp => {
        inp.addEventListener('input', () => {
          const i = Number(inp.dataset.i);
          const f = inp.dataset.f;
          d.items[i][f] = f === 'desc' ? inp.value : Number(inp.value);
          $(`[data-amount="${i}"]`).textContent =
            fmt((Number(d.items[i].qty) || 0) * (Number(d.items[i].precio) || 0));
          updateTotal();
        });
      });

      $$('[data-rm]', tbody).forEach(b => {
        b.addEventListener('click', () => {
          d.items.splice(Number(b.dataset.rm), 1);
          if (!d.items.length) d.items.push({ desc: '', qty: 1, precio: 0 });
          renderItems();
          updateTotal();
        });
      });
    }

    function updateTotal() {
      $('#ed-total').textContent = fmt(Store.docTotal(d));
    }

    $('#ed-add-item').addEventListener('click', () => {
      d.items.push({ desc: '', qty: 1, precio: 0 });
      renderItems();
    });

    $('#ed-save').addEventListener('click', () => {
      const clientId = $('#ed-client').value;
      if (!clientId) { alert('Seleccioná un cliente (o creálo primero en Clientes).'); return; }

      const items = d.items.filter(it => it.desc.trim());
      if (!items.length) { alert('Agregá al menos una línea con descripción.'); return; }

      const saved = Store.saveDoc({
        id: existing ? existing.id : null,
        numero: existing ? existing.numero : undefined,
        tipo: $('#ed-tipo').value,
        clientId,
        fechaEmision: $('#ed-emision').value,
        fechaEntrega: $('#ed-entrega').value,
        estado: d.estado,
        notas: $('#ed-notas').value.trim(),
        items
      });
      location.hash = `#/doc/${saved.id}`;
    });

    renderItems();
    updateTotal();
  }

  /* ═══════════ VISTA DOCUMENTO — réplica del PDF ═══════════ */

  function renderDocView(docId) {
    const d = Store.getDoc(docId);
    if (!d) { location.hash = '#/documentos'; return; }
    const c = Store.getClient(d.clientId) || { nombre: '—', direccion: '', pais: '' };
    const E = Store.EMPRESA;
    const total = Store.docTotal(d);

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

    /* barra de acciones */
    const sel = $('#doc-status');
    sel.innerHTML = ESTADOS.map(e =>
      `<option value="${e}" ${e === d.estado ? 'selected' : ''}>${e.toUpperCase()}</option>`).join('');
    sel.onchange = () => {
      Store.setDocStatus(d.id, sel.value);
      d.estado = sel.value;
      btnCobro.hidden = d.estado !== 'enviada';
    };

    /* Recordatorio de cobro por WhatsApp — solo documentos enviados */
    const btnCobro = $('#doc-cobro');
    btnCobro.hidden = d.estado !== 'enviada';
    btnCobro.onclick = () => {
      const dias = daysSince(d.fechaEmision);
      const msg = [
        `Hola${c.contacto ? ' ' + c.contacto : ''}, le saluda Atlantek 👋`,
        '',
        `Le recordamos el pago pendiente de la ${d.tipo} Nº ${numDoc(d.numero)}` +
          (dias > 0 ? ` (emitida hace ${dias} día${dias === 1 ? '' : 's'})` : '') + ':',
        `Total: ${fmt(total)}`,
        '',
        'SINPE Móvil o transferencia — con gusto le confirmamos al recibirlo.',
        'Atlantek · Seguridad · CCTV · Redes · 7231-2225'
      ].join('\n');
      window.open(waHref(c.telefono, msg), '_blank');
    };

    $('#doc-back').onclick  = () => { location.hash = '#/documentos'; };
    $('#doc-edit').onclick  = () => { location.hash = `#/editor/${d.id}`; };

    /* Imprimir con nombre de archivo útil: Atlantek-Proforma-027-CLIENTE */
    $('#doc-print').onclick = () => {
      const prev = document.title;
      const cliente = String(c.nombre || '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
      document.title = `Atlantek-${d.tipo === 'factura' ? 'Factura' : 'Proforma'}-${numDoc(d.numero)}${cliente ? '-' + cliente : ''}`;
      window.print();
      setTimeout(() => { document.title = prev; }, 500);
    };

    /* Convertir proforma → factura (crea documento nuevo, la proforma queda) */
    const btnFactura = $('#doc-to-factura');
    btnFactura.hidden = d.tipo !== 'proforma';
    btnFactura.onclick = () => {
      if (!confirm(`¿Crear la factura Nº ${numDoc(Store.nextNumber())} a partir de la proforma Nº ${numDoc(d.numero)}?`)) return;
      const f = Store.saveDoc({
        id: null,
        tipo: 'factura',
        clientId: d.clientId,
        fechaEmision: hoy(),
        fechaEntrega: d.fechaEntrega,
        estado: 'borrador',
        notas: d.notas,
        items: JSON.parse(JSON.stringify(d.items))
      });
      location.hash = `#/doc/${f.id}`;
    };

    /* Compartir por WhatsApp al teléfono del cliente */
    $('#doc-wa').onclick = () => {
      const msg = [
        `*Atlantek* — ${d.tipo === 'factura' ? 'Factura' : 'Proforma'} Nº ${numDoc(d.numero)}`,
        `Cliente: ${c.nombre}`,
        `Fecha: ${fmtDate(d.fechaEmision)}`,
        `Total: ${fmt(total)}`,
        '',
        'Le compartimos el detalle del documento. Cualquier consulta, con gusto.',
        'Atlantek · Seguridad · CCTV · Redes · 7231-2225'
      ].join('\n');
      window.open(waHref(c.telefono, msg), '_blank');
    };

    docview.hidden = false;
    docview.scrollTop = 0;
  }

  /* ═══════════ SINCRONIZACIÓN (badge + re-render) ═══════════ */

  const badge = $('#sync-badge');

  document.addEventListener('store:sync', (e) => {
    const { status } = e.detail;

    if (badge) {
      const map = {
        local:   ['● Local (sin Sheets)', ''],
        syncing: ['⟳ Sincronizando…', 'sync-badge--busy'],
        ok:      ['● Google Sheets ✓', 'sync-badge--ok'],
        pulled:  ['● Google Sheets ✓', 'sync-badge--ok'],
        error:   ['● Error de sync — datos locales OK', 'sync-badge--err']
      };
      const [txt, cls] = map[status] || map.local;
      badge.textContent = txt;
      badge.className = 'sync-badge ' + cls;
    }

    /* Si llegaron datos de Sheets, re-render de vistas de lista
       (nunca el editor, para no pisar lo que se está escribiendo) */
    if (status === 'pulled') {
      const view = (location.hash || '#/dashboard').split('/')[1];
      if (['dashboard', 'clientes', 'documentos', 'leads', ''].includes(view || '')) route();
      else updateLeadsBadge();
    }
  });

  /* ═══════════ INIT ═══════════ */
  route();
})();
