const buckets = new Map();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_HOUR = 5;

function reply(res, status, body) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(status).json(body);
}

function clean(value, max) {
  return String(value ?? '').replace(/[<>]/g, '').trim().slice(0, max);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return reply(res, 405, { ok: false, error: 'Método no permitido' });
  const origin = req.headers.origin;
  if (origin && origin !== 'https://atlanteksystems.com' && origin !== 'https://www.atlanteksystems.com') {
    return reply(res, 403, { ok: false, error: 'Origen no permitido' });
  }
  if (!process.env.SHEETS_LEADS_URL || !process.env.TOKEN_PUBLICO) {
    return reply(res, 503, { ok: false, error: 'Formulario temporalmente no disponible' });
  }

  let payload;
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    return reply(res, 400, { ok: false, error: 'Solicitud inválida' });
  }
  if (payload.website) return reply(res, 200, { ok: true });
  const ip = String(req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const recent = (buckets.get(ip) || []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_PER_HOUR) return reply(res, 429, { ok: false, error: 'Límite de solicitudes alcanzado' });
  if (buckets.size > 5000) {
    for (const [key, times] of buckets) {
      if (!times.some((time) => now - time < WINDOW_MS)) buckets.delete(key);
    }
  }

  const input = payload.lead || {};
  const lead = {
    nombre: clean(input.nombre, 100),
    telefono: clean(input.telefono, 24),
    distrito: clean(input.distrito, 80),
    tipo: clean(input.tipo, 80),
    visualizacion: clean(input.visualizacion, 80),
    ubicacion: clean(input.ubicacion, 120),
    servicio: clean(input.servicio, 120),
    mensaje: clean(input.mensaje, 1200),
  };
  const phone = lead.telefono.replace(/\D/g, '');
  if (!lead.nombre || phone.length !== 8 || !/^[2-8]/.test(phone)) {
    return reply(res, 400, { ok: false, error: 'Datos del formulario inválidos' });
  }
  recent.push(now);
  buckets.set(ip, recent);

  try {
    const upstream = await fetch(process.env.SHEETS_LEADS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ token: process.env.TOKEN_PUBLICO, action: 'lead', lead }),
    });
    const result = await upstream.json();
    return reply(res, result.ok === true ? 200 : 502, { ok: result.ok === true });
  } catch {
    return reply(res, 502, { ok: false, error: 'No se pudo enviar la solicitud' });
  }
};
