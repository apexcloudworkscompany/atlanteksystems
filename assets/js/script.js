/* ═══════════════════════════════════════════════════════════════
   Atlantek · Landing pública — script.js
   ═══════════════════════════════════════════════════════════════ */

(() => {
  /* ── Menú móvil ── */
  const nav = document.getElementById('nav');
  const burger = document.getElementById('nav-burger');
  const links = document.getElementById('nav-links');

  burger.addEventListener('click', () => nav.classList.toggle('nav--open'));

  links.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') nav.classList.remove('nav--open');
  });

  /* ── Logo vuelve al principio ── */
  const brandLogo = document.getElementById('brand-logo');
  if (brandLogo) {
    brandLogo.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── Nav con profundidad al hacer scroll ── */
  const onScroll = () => nav.classList.toggle('nav--scrolled', window.scrollY > 12);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ── Reveal on scroll ── */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12 });

  /* Reveal escalonado: retardo creciente por posición entre hermanos */
  document.querySelectorAll('.reveal').forEach((el) => {
    const siblings = Array.prototype.filter.call(el.parentElement.children, (c) => c.classList.contains('reveal'));
    const idx = siblings.indexOf(el);
    if (idx > 0) el.style.transitionDelay = `${Math.min(idx * 0.09, 0.6)}s`;
    io.observe(el);
  });

  /* ── Stats del hero: contador animado ── */
  const countStat = (el) => {
    const target = parseFloat(el.dataset.count);
    if (Number.isNaN(target)) { el.textContent = el.dataset.count; return; }
    const dur = 900;
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const ioStats = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.querySelectorAll('[data-count]').forEach(countStat);
        ioStats.unobserve(en.target);
      }
    });
  }, { threshold: 0.4 });

  const statsEl = document.querySelector('.hero__stats');
  if (statsEl) ioStats.observe(statsEl);

  /* ── Reloj de la cámara del hero ── */
  const camTime = document.getElementById('cam-time');
  if (camTime) {
    const tick = () => {
      const d = new Date();
      camTime.textContent = [d.getHours(), d.getMinutes(), d.getSeconds()]
        .map((n) => String(n).padStart(2, '0')).join(':');
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ── Usuario opcional (pre-llenado) ──
     El formulario de cotización está SIEMPRE habilitado. Si existe un
     usuario guardado, se pre-llenan nombre y teléfono. Sin registro requerido. */
  const USER_KEY = 'atlantek-user';
  const leadFormEl = document.getElementById('lead-form');
  const leadUser = document.getElementById('lead-user');

  const getUser = () => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); }
    catch (e) { return null; }
  };

  function applyAccess() {
    if (!leadFormEl) return;
    const user = getUser();
    if (!user) {
      if (leadUser) leadUser.hidden = true;
      return;
    }
    if (!leadFormEl.nombre.value) leadFormEl.nombre.value = user.nombre || '';
    if (!leadFormEl.telefono.value) leadFormEl.telefono.value = user.telefono || '';
    if (leadUser) {
      leadUser.hidden = false;
      leadUser.innerHTML =
        `● Usuario: ${user.nombre.split(' ')[0]} <a href="#" id="lead-logout">Olvidar</a>`;
      document.getElementById('lead-logout').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem(USER_KEY);
        leadUser.hidden = true;
      });
    }
  }

  applyAccess();

  /* ── Formulario de cliente nuevo ──
     Envía el lead al Apps Script (hoja "Leads"). Si falla la conexión,
     ofrece continuar por WhatsApp con el mensaje prellenado. */
  const form = document.getElementById('lead-form');
  if (form) {
    const status = document.getElementById('lead-status');
    const WA_NUM = '50672312225';

    const show = (html, tipo) => {
      status.innerHTML = html;
      status.className = 'lead-form__status ' + (tipo === 'ok' ? 'is-ok' : 'is-error');
      status.setAttribute('role', tipo === 'ok' ? 'status' : 'alert');
      status.focus({ preventScroll: true });
    };

    const waLink = (lead) => {
      const txt =
        `Hola Atlantek, soy ${lead.nombre} (${lead.distrito}). ` +
        `Me interesa: ${lead.servicio} para ${lead.tipo.toLowerCase()}. ` +
        `Mi teléfono: ${lead.telefono}. ${lead.mensaje}`;
      return `https://wa.me/${WA_NUM}?text=${encodeURIComponent(txt.trim())}`;
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (form.website.value) return; // honeypot anti-bots

      const f = new FormData(form);
      const lead = {
        nombre: String(f.get('nombre') || '').trim(),
        telefono: String(f.get('telefono') || '').trim(),
        distrito: String(f.get('distrito') || ''),
        tipo: String(f.get('tipo') || ''),
        servicio: String(f.get('servicio') || ''),
        mensaje: String(f.get('mensaje') || '').trim()
      };

      if (!lead.nombre || !lead.telefono) {
        show('Complete al menos su nombre y teléfono.', 'error');
        return;
      }

      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Enviando…';

      let ok = false;
      if (typeof CONFIG !== 'undefined' && CONFIG.SHEETS_URL) {
        try {
          /* text/plain evita el preflight CORS que Apps Script no responde */
          const res = await fetch(CONFIG.SHEETS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ token: CONFIG.TOKEN, action: 'lead', lead })
          });
          ok = (await res.json()).ok === true;
        } catch (err) {
          ok = false;
        }
      }

      btn.disabled = false;
      btn.textContent = 'Enviar solicitud';

      if (ok) {
        form.reset();
        show(
          '✓ Solicitud recibida. Le contactamos por WhatsApp en horario hábil. ' +
          `Si es urgente, <a href="${waLink(lead)}" target="_blank" rel="noopener">escríbanos directo</a>.`,
          'ok'
        );
      } else {
        show(
          'No se pudo enviar automáticamente. ' +
          `<a href="${waLink(lead)}" target="_blank" rel="noopener">Enviar la solicitud por WhatsApp →</a>`,
          'error'
        );
      }
    });
  }

  /* ══════ Radar de cobertura: barrido con detección de puntos ══════
     El CSS mueve el barrido con una animación simple; JS toma el control
     (rAF) para saber el ángulo real y encender cada distrito al pasarlo. */
  const sweep = document.getElementById('radar-sweep');
  if (sweep) {
    const radar = sweep.parentElement;
    const blips = Array.from(radar.querySelectorAll('.radar__blip'))
      .filter((b) => !b.classList.contains('radar__blip--base'));
    const rngEl = document.getElementById('radar-rng');
    const lockEl = document.getElementById('radar-lock');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lockTimeout = 1400;
    const tolerance = 16;
    const locked = new Set();

    sweep.style.animation = 'none';
    sweep.style.transformOrigin = '50% 50%';

    const angleOf = (b) => ((parseFloat(b.dataset.ang) || 0) * Math.PI) / 180;
    const sweepAngle = (deg) => ((deg - 90) * Math.PI) / 180; /* N = -90° rad */
    const sameDir = (a, b) => {
      let d = Math.abs(a - b);
      d = d % (Math.PI * 2);
      if (d > Math.PI) d = Math.PI * 2 - d;
      return d <= (tolerance * Math.PI) / 180;
    };

    const lockBlip = (b) => {
      if (locked.has(b)) return;
      locked.add(b);
      b.classList.add('is-locked');
      lockEl.textContent = `${locked.size}/${blips.length}`;
      setTimeout(() => {
        locked.delete(b);
        b.classList.remove('is-locked');
        lockEl.textContent = `${locked.size}/${blips.length}`;
      }, lockTimeout);
    };

    const lockAll = () => {
      blips.forEach((b) => { locked.add(b); b.classList.add('is-locked'); });
      lockEl.textContent = `${blips.length}/${blips.length}`;
    };

    if (reduceMotion) {
      lockAll();
      rngEl.textContent = '—';
      return;
    }

    let deg = 0;
    let last = performance.now();

    const tick = (now) => {
      const dt = Math.min(now - last, 100);
      last = now;
      deg = (deg + (360 / 5500) * dt) % 360;
      sweep.style.transform = `rotate(${deg}deg)`;
      rngEl.textContent = `${Math.round(deg)}°`;

      const sa = sweepAngle(deg);
      blips.forEach((b) => { if (sameDir(angleOf(b), sa)) lockBlip(b); });

      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ── Chat de preguntas frecuentes ──
     Responde automáticamente con el mismo contenido del FAQ.
     Las preguntas ya respondidas se marcan para no repetirse. */
  const FAQ = [
    {
      q: '¿Cuánto cuesta instalar cámaras?',
      a: 'Depende de la cantidad de cámaras y el tipo de propiedad. Una casa típica con 4 cámaras cuesta entre <b>$350-$600 USD</b> todo incluido (equipos, cableado e instalación). Coordinamos una <b>valoración técnica en sitio</b> para preparar su cotización.'
    },
    {
      q: '¿Qué garantía tienen los equipos?',
      a: '<b>12 meses</b> de garantía en todos los equipos y <b>90 días</b> en mano de obra. Si tiene algún problema, lo resolvemos por WhatsApp o con visita técnica sin costo dentro de la garantía.'
    },
    {
      q: '¿Puedo ver las cámaras desde el celular?',
      a: 'Sí. Todos los sistemas incluyen <b>acceso remoto</b> desde la app móvil (iOS y Android): vea sus cámaras en vivo, revise grabaciones y reciba <b>alertas de movimiento</b> desde donde esté.'
    },
    {
      q: '¿Atienden fuera de Guápiles?',
      a: 'Sí. Cubrimos todo Pococí (<b>Guápiles, Jiménez, La Rita, Roxana, Cariari, Colorado, La Colonia</b>) y alrededores. Coordinamos la visita según disponibilidad.'
    },
    {
      q: '¿Cuánto tarda la instalación?',
      a: 'Una instalación típica de <b>4-8 cámaras se completa en 1 día</b>. Proyectos más grandes pueden tomar 2-3 días. Coordinamos el horario que mejor le funcione.'
    },
    {
      q: '¿Necesito contrato mensual?',
      a: 'No. El servicio es <b>por una sola vez</b>: equipos + instalación. Sin cuotas mensuales ni permanencia. Si necesita soporte pasado la garantía, se coordina por separado.'
    }
  ];

  const chatFab = document.getElementById('chat-fab');
  const chatPanel = document.getElementById('chat-panel');
  const chatClose = document.getElementById('chat-close');
  const chatBody = document.getElementById('chat-body');
  const chatChips = document.getElementById('chat-chips');
  if (chatFab && chatPanel) {
    const ICON_FAB =
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3C6.9 3 3 6.5 3 10.9c0 2.4 1.2 4.6 3.2 6L5.2 21l4.2-1.5c.8.2 1.7.3 2.6.3 5.1 0 9-3.5 9-7.9S17.1 3 12 3z"/></svg>';
    const ICON_X =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

    const openChat = () => {
      chatPanel.classList.add('is-open');
      chatFab.setAttribute('aria-expanded', 'true');
      chatFab.setAttribute('aria-label', 'Cerrar chat de preguntas frecuentes');
      chatFab.innerHTML = ICON_X;
      chatFab.classList.add('is-open');
    };

    const closeChat = () => {
      chatPanel.classList.remove('is-open');
      chatFab.setAttribute('aria-expanded', 'false');
      chatFab.setAttribute('aria-label', 'Abrir chat de preguntas frecuentes');
      chatFab.innerHTML = ICON_FAB;
      chatFab.classList.remove('is-open');
    };

    chatFab.addEventListener('click', () => (chatPanel.classList.contains('is-open') ? closeChat() : openChat()));
    chatClose.addEventListener('click', closeChat);

    /* Pinchar fuera cierra el chat (sin interferir con el CTA móvil) */
    document.addEventListener('click', (e) => {
      if (!chatPanel.classList.contains('is-open')) return;
      if (!e.target.isConnected) return; /* el FAB re-renderiza su SVG al abrir */
      if (!chatPanel.contains(e.target) && !chatFab.contains(e.target)) closeChat();
    });
  }

  /* Escritura de mensajes del chat (independiente de handle) */
  const chatApp = (() => {
    const body = chatBody;
    if (!body) return {};

    const scrollBottom = () => { body.scrollTop = body.scrollHeight; };

    const bubble = (html, who) => {
      const el = document.createElement('div');
      el.className = `chat-msg chat-msg--${who}`;
      el.innerHTML = html;
      body.appendChild(el);
      scrollBottom();
      return el;
    };

    const typing = () => {
      const el = document.createElement('div');
      el.className = 'chat-msg chat-msg--bot chat-msg--typing';
      el.innerHTML = '<span></span><span></span><span></span>';
      body.appendChild(el);
      scrollBottom();
      return el;
    };

    const showChips = (answered) => {
      chatChips.innerHTML = '';
      FAQ.forEach((item, i) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chip' + (answered[i] ? ' is-done' : '');
        chip.textContent = item.q;
        chip.disabled = answered[i];
        chip.addEventListener('click', () => {
          answered[i] = true;
          bubble(`<b>${item.q}</b>?`, 'user');
          const t = typing();
          setTimeout(() => {
            t.remove();
            bubble(item.a, 'bot');
            showChips(answered);
          }, 550 + Math.random() * 400);
        });
        chatChips.appendChild(chip);
      });
    };

    return { showChips };
  })();

  if (chatFab && chatPanel && chatChips) {
    chatApp.showChips(FAQ.map(() => false));
    window.chatApp = chatApp; /* expuesto para debug/QA */
  }
})();
