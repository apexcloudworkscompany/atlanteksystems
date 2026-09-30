/* ═══════════════════════════════════════════════════════════════
   Atlantek · config.js — SITIO PÚBLICO (formulario de leads)
   Uso: index.html — solo envia leads y usuarios al backend Sheets.
   Este archivo ES PÚBLICO y no debe contener TOKEN_ADMIN (clientes,
   proformas, facturación). El panel admin vive en 02-Privado/panel-admin/
   con su propio config y TOKEN_ADMIN.
   ═══════════════════════════════════════════════════════════════ */

const CONFIG = {
  // Leads del formulario. Endpoint del proyecto público de Apps Script.
  SHEETS_URL: 'https://script.google.com/macros/s/AKfycbx3yS9Lmx8aL6wyiww_lcKMJLXPO9jRog7kKlSEwCw96wKeWzHowBQZyDM5ITTC5MSp/exec',
  TOKEN: 'atlantek-pub-cs0v95l7ae',

  // Visor de proformas. Endpoint del proyecto que está ligado a la hoja
  // VIVA (la que lee el panel admin). El de arriba está atado a una copia
  // vieja: su proforma 027 vale ₡50.000 cuando la real vale ₡196.950.
  // Mismo TOKEN (público): en este endpoint solo habilita 'doc-publico',
  // que exige además la clave del documento. Ver tests de seguridad.
  PROFORMA_URL: 'https://script.google.com/macros/s/AKfycbyfQ1Nd6oHLQVguqS3QRH-QSlhHDkkOS0B9Zakda55zlIUOxWHRm2lv7ygP7lohoY5F-A/exec'
};