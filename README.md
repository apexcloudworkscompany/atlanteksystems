# Atlantek Systems — Sitio público

Producción: https://atlanteksystems.com · Hosting: Vercel.

## Estado al 7 de octubre de 2026

Web operativa, registro publicado y visor de proformas con aceptación e impresión. CSP configurada en `vercel.json` y comprobada en producción. El visor rechaza claves inválidas.

## Arquitectura

HTML, CSS y JavaScript separados, sin framework. `index.html` contiene la landing; `assets/js/registration.js` gestiona el registro mediante el panel; `ver-proforma.html` y sus scripts presentan los documentos.

`api/proforma.js` ejecuta el proxy de documentos en Vercel. Requiere `SHEETS_LEADS_URL` y `TOKEN_PUBLICO` en el entorno del servidor. Valida acciones, origen y parámetros; solo reintenta lecturas. La aceptación nunca se reenvía automáticamente.

`assets/js/config.js` es público: nunca colocar credenciales administrativas allí. Las variables privadas y `.vercel/` quedan fuera de Git. `.vercelignore` excluye archivos de entorno y este README del despliegue.

## Validación y despliegue

No requiere compilación del frontend. Revisar sintaxis JavaScript, `git diff --check`, registro y visor antes de publicar. Las pruebas del proxy están en el directorio privado de pruebas del proyecto.

El repositorio está conectado a Vercel: **push a main publica automáticamente**. Crear un commit local no publica. El panel se mantiene en su propio repositorio privado.

## Límites pendientes

Google Apps Script presenta latencia variable. Los importes existentes siguen en CRC hasta resolver la decisión comercial; no convertirlos automáticamente. El correo comercial quedó configurado en Apps Script v21 según el cierre del 6 de octubre; la entrega real al buzón no se ha probado.

No actualizar implementaciones de Apps Script mediante CLI: el antecedente de 403 requiere publicar desde la cuenta propietaria en Google.
