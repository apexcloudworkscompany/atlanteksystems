/* ═══════════════════════════════════════════════════════════════
   Atlantek · proforma-publica.js — documentos públicos de demo
   Solo lo que un cliente puede ver: sus propias proformas.
   Sin token, sin Sheets, sin datos internos (leads, facturación).
   Estilo: Plus Jakarta Sans + JetBrains Mono, navy/ink colors
   ═══════════════════════════════════════════════════════════════ */

const PROFORMAS_PUBLICAS = {
  empresa: {
    nombre: 'Atlantek',
    linea2: 'Seguridad · CCTV · Redes',
    direccion: '70201 Guápiles, Pococí',
    pais: 'Costa Rica',
    email: 'soporte@atlanteksystems.com'
  },
  clientes: {
    c1: {
      nombre: 'CLÍNICA DENTAL ECO CLINIC',
      direccion: '70201 Guápiles, Pococí, Costa Rica',
      pais: 'Costa Rica'
    }
  },
  docs: [
    {
      id: 'd27',
      tipo: 'proforma',
      numero: 27,
      clientId: 'c1',
      fechaEmision: '2026-07-11',
      fechaEntrega: '2026-07-11',
      estado: 'enviada',
      notas: 'Garantía: Equipos con 12 meses de garantía por defectos de fábrica. Instalación con 90 días de garantía sobre mano de obra. No aplica por daños causados por mal uso, terceros, variaciones eléctricas o causas de fuerza mayor.',
      items: [
        { desc: 'GRABADOR DVR DAHUA DH-XVR1B04-IT 1080/2MP', qty: 1, precio: 25000 },
        { desc: 'CÁMARA DOMO DAHUA 2MP', qty: 2, precio: 12500 },
        { desc: 'CÁMARA BULLET DAHUA 2MP', qty: 2, precio: 12500 },
        { desc: 'DISCO DURO TOSHIBA 1TB', qty: 1, precio: 22000 },
        { desc: 'FUENTE DE PODER 12V 5A', qty: 1, precio: 1750 },
        { desc: 'CONECTOR MACHO/HEMBRA DC', qty: 8, precio: 250 },
        { desc: 'BALUN TRANSCEPTOR 2MP PASIVO ANALÓGICO VIDEO HD BAL2MP', qty: 4, precio: 750 },
        { desc: 'PATCH CORD CAT5E', qty: 1, precio: 1200 },
        { desc: 'INSTALACIÓN/CABLEADO/CONFIGURACIÓN', qty: 1, precio: 75000 },
        { desc: 'BANDEJA VENTILADA 25CM TEKLINK', qty: 1, precio: 11500 },
        { desc: 'CANALETA 200X10X5', qty: 1, precio: 5500 }
      ]
    }
  ]
};