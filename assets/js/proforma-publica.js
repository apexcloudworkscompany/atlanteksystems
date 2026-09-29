/* ═══════════════════════════════════════════════════════════════
   Atlantek · proforma-publica.js — datos de DEMOSTRACIÓN
   Solo carga esto si la API no responde (endpoint sin desplegar).
   Fixture ANONIMO a propósito: este archivo es público, se sube a
   Vercel y cualquiera con la URL puede leerlo. Nunca datos reales
   de cliente ni precios reales.
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
    demo: {
      nombre: 'CLIENTE DE DEMOSTRACIÓN',
      direccion: 'Dirección de ejemplo',
      pais: 'Costa Rica'
    }
  },
  docs: [
    {
      id: 'demo-027',
      tipo: 'proforma',
      numero: 27,
      clientId: 'demo',
      fechaEmision: '2026-01-01',
      fechaEntrega: '2026-01-01',
      estado: 'enviada',
      notas: 'Documento de demostración. Las notas reales del contrato (garantía de equipos, garantía de instalación, exclusiones) se imprimen aquí.',
      items: [
        { desc: 'GRABADOR DVR 4 CANALES', qty: 1, precio: 25000 },
        { desc: 'CÁMARA DOMO 2MP', qty: 4, precio: 12500 },
        { desc: 'CÁMARA BULLET 2MP', qty: 4, precio: 12500 },
        { desc: 'DISCO DURO 1TB', qty: 1, precio: 22000 },
        { desc: 'FUENTE DE PODER 12V 5A', qty: 1, precio: 1750 },
        { desc: 'INSTALACIÓN Y CONFIGURACIÓN', qty: 1, precio: 75000 }
      ]
    }
  ]
};
