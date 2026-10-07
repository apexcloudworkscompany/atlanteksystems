const { randomUUID } = require('node:crypto');
const WINDOW_MS = 10 * 60 * 1000;
const MAX_READS = 30;
const MAX_ACCEPTS = 5;
const buckets = new Map();
const ALLOWED_ORIGINS = new Set(['https://atlanteksystems.com', 'https://www.atlanteksystems.com']);

function reply(res, status, body) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(status).json(body);
}

function takeRateLimit(ip, action) {
  const now = Date.now();
  const key = `${ip}:${action}`;
  const recent = (buckets.get(key) || []).filter(time => now - time < WINDOW_MS);
  const limit = action === 'doc-aceptar' ? MAX_ACCEPTS : MAX_READS;
  if (recent.length >= limit) return false;
  recent.push(now);
  buckets.set(key, recent);
  if (buckets.size > 5000) {
    for (const [bucket, times] of buckets) {
      if (!times.some(time => now - time < WINDOW_MS)) buckets.delete(bucket);
    }
  }
  return true;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return reply(res, 405, { ok: false, error: 'Método no permitido' });
  const origin = req.headers.origin;
  if (origin && !ALLOWED_ORIGINS.has(origin)) return reply(res, 403, { ok: false, error: 'Origen no permitido' });

  const endpoint = process.env.SHEETS_LEADS_URL;
  const token = process.env.TOKEN_PUBLICO;
  if (!endpoint || !token) return reply(res, 503, { ok: false, error: 'Visor temporalmente no disponible' });

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    return reply(res, 400, { ok: false, error: 'Solicitud inválida' });
  }
  if (Buffer.byteLength(JSON.stringify(body)) > 12_000) return reply(res, 413, { ok: false, error: 'Solicitud demasiado grande' });

  const action = String(body.action || '');
  if (!['doc-publico', 'doc-aceptar'].includes(action)) return reply(res, 400, { ok: false, error: 'Acción no permitida' });
  const numero = Number(body.numero);
  const clave = String(body.clave || '').trim();
  if (!Number.isSafeInteger(numero) || numero < 1 || clave.length < 8 || clave.length > 120) {
    return reply(res, 400, { ok: false, error: 'Enlace inválido' });
  }

  const payload = { action, numero, clave, token };
  if (action === 'doc-aceptar') {
    const version = String(body.version || '');
    const nombre = String(body.nombre || '').trim().slice(0, 150);
    if (!/^[a-f0-9]{64}$/i.test(version) || nombre.length < 2 || body.consentimiento !== true) {
      return reply(res, 400, { ok: false, error: 'Revisá el nombre y la aceptación antes de continuar' });
    }
    payload.version = version;
    payload.nombre = nombre;
    payload.consentimiento = true;
  }

  const ip = String(req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
  if (!takeRateLimit(ip, action)) return reply(res, 429, { ok: false, error: 'Límite de solicitudes alcanzado. Intentá más tarde.' });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    let upstream, text;
    // Solo la lectura puede repetirse; una aceptación nunca se reenvía.
    for (let attempt = 0; attempt < (action === 'doc-publico' ? 2 : 1); attempt++) {
      const target = new URL(endpoint);
      target.searchParams.set('_requestId', randomUUID());
      upstream = await fetch(target, {
        method: 'POST', signal: controller.signal, cache: 'no-store',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      text = await upstream.text();
      if (action === 'doc-publico' && attempt === 0 && [404, 502, 503, 504].includes(upstream.status)) continue;
      break;
    }
    let result;
    try { result = JSON.parse(text); }
    catch {
      console.error('proforma: Apps Script no devolvió JSON', upstream.status, upstream.headers.get('content-type') || '');
      return reply(res, 502, { ok: false, error: 'El servidor de documentos no devolvió una respuesta válida' });
    }
    if (!upstream.ok) return reply(res, 502, { ok: false, error: 'No se pudo contactar el servidor de documentos' });
    return reply(res, 200, result);
  } catch (error) {
    console.error('proforma: error de conexión', error.name === 'AbortError' ? 'timeout' : 'network');
    return reply(res, 502, { ok: false, error: 'No se pudo contactar el servidor de documentos' });
  } finally {
    clearTimeout(timer);
  }
};
