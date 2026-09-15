/* ═══════════════════════════════════════════════════════════════
   Atlantek · store.js — capa de datos
   Local-first (localStorage) + sincronización con Google Sheets
   vía Apps Script (ver assets/js/config.js y apps-script/Code.gs).
   ═══════════════════════════════════════════════════════════════ */

const Store = (() => {
  const KEY = 'atlantek-gestion-v1';

  const GARANTIA_DEFAULT =
    'Garantía: Equipos con 12 meses de garantía por defectos de fábrica. ' +
    'Instalación con 90 días de garantía sobre mano de obra. No aplica por daños ' +
    'causados por mal uso, terceros, variaciones eléctricas o causas de fuerza mayor.';

  const EMPRESA = {
    nombre: 'Atlantek',
    linea2: 'N/A',
    direccion: '70201 Guápiles',
    pais: 'Costa Rica',
    email: 'soporte@atlanteksystems.com'
  };

  /* ── Datos semilla: cliente y proforma 027 reales ── */
  function seed() {
    return {
      nextNumber: 28,
      leads: [],
      catalogo: [
        { id: 'p1', nombre: 'Grabador DVR Dahua DH-XVR1B04-IT', categoria: 'Grabadores', imagen: 'assets/img/products/dvr-dahua.jpg', precio: 25000, descripcion: 'DVR 4 canales 1080/2MP, H.265+, detección de movimiento', unidad: 'pieza', estado: 'disponible' },
        { id: 'p2', nombre: 'Cámara Domo Dahua 2MP', categoria: 'Cámaras', precio: 12500, descripcion: 'Domo interior, IR 20m, IP67, PoE', unidad: 'pieza', estado: 'disponible' },
        { id: 'p3', nombre: 'Cámara Bullet Dahua 2MP', categoria: 'Cámaras', precio: 12500, descripcion: 'Bullet exterior, IR 30m, IP67, PoE', unidad: 'pieza', estado: 'disponible' },
        { id: 'p4', nombre: 'Disco Duro Toshiba 1TB', categoria: 'Almacenamiento', imagen: 'assets/img/products/disco-duro.jpg', precio: 22000, descripcion: 'Disco surveillance 3.5", 64MB cache, 7200RPM', unidad: 'pieza', estado: 'disponible' },
        { id: 'p5', nombre: 'Fuente de Poder 12V 5A', categoria: 'Accesorios', imagen: 'assets/img/products/fuente-poder.jpg', precio: 1750, descripcion: 'Fuente conmutada para cámaras CCTV', unidad: 'pieza', estado: 'disponible' },
        { id: 'p6', nombre: 'Balun Transceptor 2MP', categoria: 'Accesorios', imagen: 'assets/img/products/balun.jpg', precio: 750, descripcion: 'Balun pasivo analógico video HD', unidad: 'pieza', estado: 'disponible' },
        { id: 'p7', nombre: 'Cable UTP Cat5e', categoria: 'Cableado', imagen: 'assets/img/products/cable-utp.jpg', precio: 800, descripcion: 'Metro de cable UTP Cat5e exterior', unidad: 'metro', estado: 'disponible' },
        { id: 'p8', nombre: 'Canaleleta 200x10x5', categoria: 'Cableado', imagen: 'assets/img/products/canaleleta.jpg', precio: 5500, descripcion: 'Canaleleta ventilada Teklink 2.5m', unidad: 'pieza', estado: 'disponible' },
        { id: 'p9', nombre: 'Instalación y Configuración', categoria: 'Servicios', imagen: 'assets/img/products/instalacion.jpg', precio: 75000, descripcion: 'Instalación, cableado y configuración de sistema completo', unidad: 'servicio', estado: 'disponible' },
        { id: 'p10', nombre: 'Intercom Dahua VTO', categoria: 'Acceso', imagen: 'assets/img/products/intercom.jpg', precio: 85000, descripcion: 'Portalero IP con tarjeta RFID y app móvil', unidad: 'pieza', estado: 'disponible' },
        { id: 'p11', nombre: 'Switch Ruijie 8 puertos PoE', categoria: 'Redes', imagen: 'assets/img/products/switch-ruijie.jpg', precio: 35000, descripcion: 'Switch administrable 8x PoE+ 65W, Gigabit', unidad: 'pieza', estado: 'disponible' },
        { id: 'p12', nombre: 'Access Point Ruijie', categoria: 'Redes', imagen: 'assets/img/products/access-point.jpg', precio: 28000, descripcion: 'AP WiFi 6 dual band, ceiling mount, PoE', unidad: 'pieza', estado: 'disponible' }
      ],
      clients: [
        {
          id: 'c1',
          nombre: 'CLINICA DENTAL ECO CLINIC',
          contacto: '',
          telefono: '',
          email: '',
          direccion: '70201 Guápiles',
          pais: 'Costa Rica',
          notas: '',
          productos: ['CCTV 4 cámaras Dahua', 'Grabador DVR'],
          estado: 'activo'
        }
      ],
      docs: [
        {
          id: 'd27',
          tipo: 'proforma',            // proforma | factura
          numero: 27,
          clientId: 'c1',
          fechaEmision: '2026-07-11',
          fechaEntrega: '2026-07-11',
          estado: 'enviada',           // borrador | enviada | pagada
          notas: GARANTIA_DEFAULT,
          items: [
            { desc: 'GRABADOR DVR DAHUA DH-XVR1B04-IT 1080/2MP', qty: 1, precio: 25000 },
            { desc: 'CAMARA DOMO DAHUA 2MP', qty: 2, precio: 12500 },
            { desc: 'CAMARA BULLET DAHUA 2MP', qty: 2, precio: 12500 },
            { desc: 'DISCO DURO TOSHIBA 1TB', qty: 1, precio: 22000 },
            { desc: 'FUENTE DE PODER 12V 5A', qty: 1, precio: 1750 },
            { desc: 'CONECTOR MACHO/HEMBRA DC', qty: 8, precio: 250 },
            { desc: 'BALUN TRANSCEPTOR 2MP PASIVO ANALÓGICO VIDEO HD BAL2MP', qty: 4, precio: 750 },
            { desc: 'PATCH CORD CAT5E', qty: 1, precio: 1200 },
            { desc: 'INSTALACION/CABLEADO/CONFIGURACION', qty: 1, precio: 75000 },
            { desc: 'BANDEJA VENTILADA 25CM TEKLINK', qty: 1, precio: 11500 },
            { desc: 'CANALETA 200X10X5', qty: 1, precio: 5500 }
          ]
        }
      ]
    };
  }

  let data;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      data = raw ? JSON.parse(raw) : seed();
    } catch (e) {
      data = seed();
    }
    saveLocal();
  }

  function saveLocal() {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function save() {
    saveLocal();
    syncPush();
  }

  const uid = () => 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  /* Cualquier formato de fecha → yyyy-mm-dd (local, sin corrimiento UTC) */
  function isoDate(v) {
    const s = String(v || '');
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const d = new Date(s);
    if (isNaN(d)) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  /* ═══════════ SINCRONIZACIÓN CON GOOGLE SHEETS ═══════════ */

  const hasSheets = () => typeof CONFIG !== 'undefined' && !!CONFIG.SHEETS_URL;

  function emit(status, extra) {
    document.dispatchEvent(new CustomEvent('store:sync', { detail: { status, ...extra } }));
  }

  /* Pull inicial: lo que hay en Sheets manda; si Sheets está vacío,
     se sube el estado local (primer uso). */
  async function syncPull() {
    if (!hasSheets()) { emit('local'); return; }
    emit('syncing');
    try {
      const res = await fetch(`${CONFIG.SHEETS_URL}?action=load&token=${encodeURIComponent(CONFIG.TOKEN)}`);
      const out = await res.json();
      if (!out.ok) throw new Error(out.error || 'error remoto');

      const remote = out.data;
      const remoteVacio = !remote.clients.length && !remote.docs.length;

      if (remoteVacio) {
        /* Sheets sin clientes/docs: se sube el estado local, pero los
           leads del sitio (si hay) sí se adoptan — el push no los toca. */
        data.leads = Array.isArray(remote.leads) ? remote.leads : [];
        saveLocal();
        await pushNow();
        emit('pulled');
      } else {
        data = remote;
        if (!Array.isArray(data.leads)) data.leads = [];
        /* Google Sheets devuelve las fechas como Date largo
           ("Sat Jul 11 2026 00:00:00 GMT-0600...") — normalizar a yyyy-mm-dd */
        data.docs.forEach(d => {
          d.fechaEmision = isoDate(d.fechaEmision);
          d.fechaEntrega = isoDate(d.fechaEntrega);
        });
        saveLocal();
        emit('pulled');
      }
      emit('ok');
    } catch (e) {
      console.warn('Sheets sync (pull):', e);
      emit('error', { message: String(e) });
    }
  }

  /* Push con debounce: agrupa guardados seguidos en un solo POST */
  let pushTimer = null;

  function syncPush() {
    if (!hasSheets()) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(pushNow, 900);
  }

  async function pushNow() {
    if (!hasSheets()) return;
    emit('syncing');
    try {
      /* text/plain evita el preflight CORS que Apps Script no responde */
      const res = await fetch(CONFIG.SHEETS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ token: CONFIG.TOKEN, action: 'save', data })
      });
      const out = await res.json();
      if (!out.ok) throw new Error(out.error || 'error remoto');
      emit('ok');
    } catch (e) {
      console.warn('Sheets sync (push):', e);
      emit('error', { message: String(e) });
    }
  }

  /* ═══════════ CLIENTES ═══════════ */

  const getClients = () => data.clients.slice().sort((a, b) => a.nombre.localeCompare(b.nombre));
  const getClient  = (id) => data.clients.find(c => c.id === id) || null;

  function saveClient(c) {
    if (c.id) {
      const i = data.clients.findIndex(x => x.id === c.id);
      if (i >= 0) data.clients[i] = c;
    } else {
      c.id = uid();
      data.clients.push(c);
    }
    save();
    return c;
  }

  function deleteClient(id) {
    if (data.docs.some(d => d.clientId === id)) return false; // tiene documentos
    data.clients = data.clients.filter(c => c.id !== id);
    save();
    return true;
  }

  /* ═══════════ DOCUMENTOS ═══════════ */

  const getDocs = () => data.docs.slice().sort((a, b) => b.numero - a.numero);
  const getDoc  = (id) => data.docs.find(d => d.id === id) || null;

  function saveDoc(d) {
    if (d.id) {
      const i = data.docs.findIndex(x => x.id === d.id);
      if (i >= 0) data.docs[i] = d;
    } else {
      d.id = uid();
      d.numero = data.nextNumber++;
      data.docs.push(d);
    }
    save();
    return d;
  }

  function deleteDoc(id) {
    data.docs = data.docs.filter(d => d.id !== id);
    save();
  }

  function setDocStatus(id, estado) {
    const d = getDoc(id);
    if (d) { d.estado = estado; save(); }
  }

  /* ═══════════ LEADS DEL SITIO ═══════════
     Los leads NO viajan en action:'save' (el backend los ignora a
     propósito para no pisar leads nuevos del sitio). El estado se
     actualiza fila por fila con action:'lead-status'. */

  const LEAD_ESTADOS = ['nuevo', 'contactado', 'cotizado', 'ganado', 'perdido'];

  const getLeads = () => (data.leads || []).slice().sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  const getLead  = (id) => (data.leads || []).find(l => l.id === id) || null;
  const leadsNuevos = () => (data.leads || []).filter(l => l.estado === 'nuevo').length;

  /* ═══════════ CATÁLOGO ═══════════ */

  const getCatalogo = () => data.catalogo || [];
  const getCatalogoItem = (id) => (data.catalogo || []).find(p => p.id === id) || null;

  function saveCatalogoItem(p) {
    if (!data.catalogo) data.catalogo = [];
    if (p.id) {
      const i = data.catalogo.findIndex(x => x.id === p.id);
      if (i >= 0) data.catalogo[i] = p;
    } else {
      p.id = uid();
      data.catalogo.push(p);
    }
    save();
    return p;
  }

  function deleteCatalogoItem(id) {
    data.catalogo = (data.catalogo || []).filter(p => p.id !== id);
    save();
  }

  async function setLeadStatus(id, estado) {
    const l = getLead(id);
    if (!l || !LEAD_ESTADOS.includes(estado)) return false;
    l.estado = estado;
    saveLocal();
    if (!hasSheets()) return true;
    emit('syncing');
    try {
      const res = await fetch(CONFIG.SHEETS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ token: CONFIG.TOKEN, action: 'lead-status', id, estado })
      });
      const out = await res.json();
      if (!out.ok) throw new Error(out.error || 'error remoto');
      emit('ok');
    } catch (e) {
      console.warn('Sheets sync (lead-status):', e);
      emit('error', { message: String(e) });
    }
    return true;
  }

  /* ═══════════ CÁLCULOS ═══════════ */

  const docTotal = (d) => d.items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.precio) || 0), 0);

  load();
  syncPull();

  return {
    EMPRESA, GARANTIA_DEFAULT, LEAD_ESTADOS,
    getClients, getClient, saveClient, deleteClient,
    getDocs, getDoc, saveDoc, deleteDoc, setDocStatus,
    getLeads, getLead, leadsNuevos, setLeadStatus,
    getCatalogo, getCatalogoItem, saveCatalogoItem, deleteCatalogoItem,
    docTotal,
    nextNumber: () => data.nextNumber,
    sync: { pull: syncPull, enabled: hasSheets }
  };
})();
