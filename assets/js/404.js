/* ═══════════════════════════════════════════════════════════════
   Atlantek · 404.js — comportamiento del 404
   Sin dependencias. Todo el texto se inserta con textContent:
   la ruta que el visitante escribió en la URL nunca se
   interpreta como HTML.
   ═══════════════════════════════════════════════════════════════ */

(() => {
  'use strict';

  const WA = '50663144171';
  const MAX_PATH = 42;

  /* ── Mostrar la ruta que falló (texto plano, recortado) ── */
  function mostrarRuta() {
    const out = document.getElementById('nf-path');
    if (!out) return;

    let ruta = location.pathname || '/';
    try { ruta = decodeURIComponent(ruta); } catch (e) { /* sin decodificar */ }

    const clipped = ruta.length > MAX_PATH ? ruta.slice(0, MAX_PATH - 1) + '…' : ruta;
    out.textContent = clipped;
    out.title = ruta;
  }

  /* ── WhatsApp: mensaje con el contexto de la página perdida ── */
  function ajustarWhatsApp() {
    const btn = document.getElementById('nf-wa');
    if (!btn) return;

    let ruta = location.pathname || '/';
    try { ruta = decodeURIComponent(ruta); } catch (e) { /* sin decodificar */ }

    const msg = [
      'Hola Atlantek, llegué a una página que no existe:',
      ruta,
      '¿Me pueden ayudar?'
    ].join('\n');

    btn.href = `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
  }

  /* ── Contador del 404: 4 → 0 → 4, en monoespaciado ── */
  function animarDigitos() {
    const el = document.getElementById('nf-digits');
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const original = el.textContent;
    const secuencia = ['4', '0', '4', '.', original];
    let i = 0;

    const tick = setInterval(() => {
      el.textContent = secuencia[i];
      i += 1;
      if (i >= secuencia.length) {
        clearInterval(tick);
        el.textContent = original;
      }
    }, 190);
  }

  /* ── Atajo: Enter en el botón de WhatsApp no envía nada raro ── */
  function init() {
    mostrarRuta();
    ajustarWhatsApp();
    animarDigitos();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
