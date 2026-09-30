# Atlantek Systems — Sitio público

Landing de captación para **Atlantek Systems** (cámaras de seguridad, cableado estructurado y redes en Guápiles, Pococí, Costa Rica).

**Producción:** https://atlanteksystems.com

> Sitio público. El panel de gestión es privado y vive en otro repo: [`atlanteksystems-admin`](https://github.com/apexcloudworkscompany/atlanteksystems-admin).

---

## Stack

HTML · CSS · JS estático puro. **Sin build, sin framework, sin dependencias.** Se sube y funciona.

- Hosting: **Vercel** (proyecto `web`) — es el único host que sirve producción
- DNS: `atlanteksystems.com` → Vercel (A records)
- Fuente: Plus Jakarta Sans + JetBrains Mono (Google Fonts)

## Estructura

```
.
├── index.html              # Landing completa (6 secciones)
├── 404.html                # Página de error 404
├── ver-proforma.html       # Visor público de proformas (link por documento)
├── vercel.json             # Rewrites + Cache-Control
├── CNAME                   # Dominio custom (GitHub Pages, ahora redirector)
├── robots.txt / sitemap.xml
├── .nojekyll               # GitHub Pages: no pasar por Jekyll
└── assets/
    ├── css/
    │   ├── style.css       # Sistema de diseño "Control Room" (navy)
    │   ├── proforma.css    # Visor de proformas
    │   └── 404.css
    ├── js/
    │   ├── config.js       # ⚠️ Endpoint Apps Script + TOKEN PÚBLICO
    │   ├── script.js       # Leads, chat bot, radar, FABs, rate limit
    │   ├── proforma-publica.js
    │   ├── ver-proforma.js
    │   └── 404.js
    └── img/                # Logos, hero, marcas, iconos SVG
```

Código siempre en archivos separados. Nada inline.

## Secciones de `index.html`

| id | Contenido |
|---|---|
| `inicio` | Hero con fondo CCTV real + HUD animado |
| `servicios` | 6 cards: CCTV, cableado, WiFi, equipos, asesoría, soporte |
| `cobertura` | Radar SVG animado — 7 distritos de Pococí + Guácimo |
| `proceso` | 4 pasos de trabajo |
| `guapiles` | Bloque SEO de Guápiles |
| `contacto` | Formulario de 8 campos → Google Sheets |

## ⚠️ `assets/js/config.js` — leer antes de tocar

Es **público**. Va al navegador de cualquiera. Contiene:

- `SHEETS_URL` — endpoint de Apps Script para leads
- `TOKEN` — `atlantek-pub-*`, alcance limitado a `action=lead` y `action=user`
- `PROFORMA_URL` — endpoint del visor de proformas

**Nunca** debe aparecer aquí el `TOKEN_ADMIN` (`atlantek-adm-*`). Ese da lectura y escritura completa de la hoja: clientes, proformas, facturación. Vive solo en el repo privado del panel.

Hay dos endpoints distintos de Apps Script a propósito: el de leads está atado a una copia vieja de la hoja, el de proformas a la hoja viva. No unificarlos sin revisar los montos de la proforma 027.

## Deploy

Vercel tiene el repo conectado en la rama `main`. Push a `main` = deploy.

```bash
git add -A
git commit -m "..."
git push origin main
```

Si se necesita redeploy manual:

```bash
npm i -g vercel
vercel --prod
```

## GitHub Pages

`has_pages` está activo con `CNAME: atlanteksystems.com`. Sirve de **redirector**: `apexcloudworkscompany.github.io/atlanteksystems/` → `atlanteksystems.com`. No es el host de producción.

## Pendientes conocidos

- [ ] **Los security headers no se aplican.** `_headers` era para Cloudflare, pero el host es Vercel y Vercel solo lee `vercel.json`. En producción hoy no hay CSP, ni `X-Frame-Options`, ni `X-Content-Type-Options`, ni `Permissions-Policy`. Solo HSTS, que Vercel pone por default. Hay que traducir el bloque CSP a `vercel.json > headers`.
- [ ] `assets/img/products/` se borró: eran 12 archivos `.jpg` que en realidad eran SVG de 383 bytes, y no los referenciaba nadie. El catálogo real usa imágenes en base64 que llegan desde Sheets.
- [ ] Considerar `max-age` real para `assets/` — hoy es `must-revalidate`, se revalida en cada visita.

## Licencia

Proyecto privado — Apex Cloud Work / Atlantek Systems.
