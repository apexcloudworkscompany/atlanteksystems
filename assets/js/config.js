/* ═══════════════════════════════════════════════════════════════
   Atlantek · config.js — SITIO PÚBLICO (formulario de leads)
   Uso público: solo URLs que el navegador necesita conocer.
   Las credenciales del formulario viven en variables de entorno Vercel.
   ═══════════════════════════════════════════════════════════════ */

const CONFIG = {
  // Visor de proformas. Endpoint del proyecto que está ligado a la hoja
  // VIVA (la que lee el panel admin). El de arriba está atado a una copia
  // vieja: su proforma 027 vale ₡50.000 cuando la real vale ₡196.950.
  // Proxy same-origin: TOKEN_PUBLICO permanece en las variables secretas de Vercel.
  PROFORMA_URL: '/api/proforma'
};
