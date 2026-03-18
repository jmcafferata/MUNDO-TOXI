# MUNDO-TOXI — toxi.media

Sitio web principal de [TOXI Media](https://toxi.media). Construido con Vite + Three.js. Deployado en Vercel.

## Stack

| Herramienta | Uso |
|---|---|
| Vite | Bundler / dev server |
| Three.js | Escena 3D en la entrada |
| Mercado Pago SDK | Pagos de entradas |
| Vite PWA | Service worker / instalable |
| Vercel | Hosting y routing |

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:5000
```

## Build y deploy

```bash
npm run build      # genera /dist
git push           # Vercel hace el deploy automático en merge a main
```

## Estructura

```
index.html          # Entrada principal (keypad + paywall)
plantform.html      # Página dinámica de proyectos y talentos
audiont.html        # Landing de Audion't (toxi.media/audiont)
detective-noir.html # Página de Detective Noir
hotel-oriente.html  # Página de Hotel Oriente
src/
  main.js           # Escena Three.js
  paywall.js        # Lógica de pagos y acceso
  style.css         # Estilos globales
public/
  data/
    projects.json   # Catálogo de proyectos
    talentos.json   # Catálogo de talentos
    formatos.json   # Categorías (Cine, Software, VR, etc.)
```

## Routing (vercel.json)

| Ruta | Destino |
|---|---|
| `/audiont` | `audiont.html` |
| `/:slug` | `plantform.html` (proyectos y talentos dinámicos) |

## Agregar un proyecto

### Paso 1 — Imágenes

**Opción A: imágenes locales** (archivos en el repo)
1. Crear la carpeta `public/[slug-del-proyecto]/`
2. Copiar ahí el thumbnail (1280×720) y el poster/banner (1920×1080)
3. Referenciarlas en el JSON como `/[slug-del-proyecto]/thumb.jpg`

**Opción B: imágenes externas** (CDN, Webflow, etc.)
- Usar la URL completa: `https://cdn.ejemplo.com/imagen.jpg`

> Las imágenes locales se sirven directo desde `public/` tanto en dev como en producción.

### Paso 2 — Agregar entrada al JSON

Abrir `public/data/projects.json` y agregar un objeto **antes del cierre `]`**:

```json
{
  "name": "Nombre del proyecto",
  "slug": "nombre-del-proyecto",
  "description": "Descripción corta (se usa en cards y SEO).",
  "contenido": "<p>Cuerpo en HTML. Puede incluir iframes, videos, imágenes.</p>",
  "card": "/nombre-del-proyecto/thumb.jpg",
  "banner": "/nombre-del-proyecto/poster.jpg",
  "thumbnail": "/nombre-del-proyecto/thumb.jpg",
  "talentos": ["slug-talento-1", "slug-talento-2"],
  "formato": "1",
  "credits": "<h4>Dirección</h4><p>Nombre Apellido</p>",
  "web": "https://url-externa.com",
  "categoria": ""
}
```

**IDs de formato:** 1 Cine · 2 Podcast · 3 Foto · 4 Texto · 5 VR · 6 Eventos · 7 Software · 8 Música

Los slugs de `talentos` deben existir en `public/data/talentos.json`. Si no existe, crearlo primero ahí.

### Paso 3 — Regenerar páginas estáticas

```bash
npm run gen
# equivale a: node generate-static.js
# genera public/[slug]/index.html con los meta tags correctos (SEO, OG)
```

### Paso 4 — Commit y push

```bash
git add public/data/projects.json public/[slug]/
git commit -m "feat: agregar [Nombre del proyecto]"
git push
# Vercel hace el deploy automático
```

### Ejemplo real — Hedonismo y Seducción

```
public/hedonismo-y-seduccion/
  thumb.jpg    ← copiado de "material grafico/thumb 1280x720.jpg"
  poster.jpg   ← copiado de "material grafico/poster 1920x1080.jpg"
  index.html   ← generado automáticamente por generate-static.js
```

Entry en `projects.json`:
```json
{
  "name": "Hedonismo y Seducción",
  "slug": "hedonismo-y-seduccion",
  "card": "/hedonismo-y-seduccion/thumb.jpg",
  "banner": "/hedonismo-y-seduccion/poster.jpg",
  "thumbnail": "/hedonismo-y-seduccion/thumb.jpg",
  ...
}
```

## Proyectos con web propia

| Proyecto | URL |
|---|---|
| Audion't | https://toxi.media/audiont |

## Variables de entorno en Vercel

Las variables se gestionan con la CLI de Vercel. **Importante:** nunca usar `echo` ni `Write-Output` para pasar el valor, ya que agregan un salto de línea que corrompe la clave. Usar siempre `node -e "process.stdout.write(...)"`:

```bash
# Agregar una variable (sin newline)
node -e "process.stdout.write('EL_VALOR_AQUI')" | npx vercel env add NOMBRE_VAR production

# Eliminar una variable
node -e "process.stdout.write('y')" | npx vercel env rm NOMBRE_VAR production

# Listar variables actuales
npx vercel env ls
```

Variables actuales del proyecto:

| Variable | Descripción |
|---|---|
| `GEMINI_API_KEY` | API key de Google Gemini (IA de voz en plantform) |
| `ELEVENLABS_API_KEY` | API key de ElevenLabs (TTS de voz en plantform) |
| `ELEVENLABS_VOICE_ID` | ID de voz ElevenLabs usada en plantform |
| `MP_ACCESS_TOKEN` | Token de MercadoPago (producción) |
| `VITE_MP_PUBLIC_KEY` | Public key de MercadoPago (frontend) |
| `ENV_MP_PUBLIC_KEY` | Public key de MercadoPago (serverless) |
| `ZOHO_EMAIL` | Email de Zoho para notificaciones |
| `ZOHO_PASSWORD` | Contraseña de Zoho |
| `MUX_TOKEN_ID` | Token ID de Mux (video) |
| `MUX_TOKEN_SECRET` | Token Secret de Mux (video) |

Después de agregar o modificar variables, hacer un redeploy:

```bash
npx vercel --prod
```

## Links útiles

- Repo: https://github.com/jmcafferata/mundo-toxi *(privado)*
- Dashboard Vercel: https://vercel.com/dashboard
- MercadoPago: credenciales en `.env` local (no commitear)

---

## Toxi Media TV — App Android

App para Android TV / Google TV que reproduce el canal en vivo sincronizado.

### Estructura

```
toxi-tv-android/
  app/src/main/java/media/toxi/tv/
    MainActivity.kt   # Actividad principal, ExoPlayer, fetch de playlist
    Playlist.kt       # Playlist hardcodeada + lógica de slot sincronizado
  app/src/main/res/
    drawable/banner.png           # Banner del launcher TV (320×180)
    mipmap-anydpi-v26/ic_launcher.png  # Ícono de app
  app/src/main/AndroidManifest.xml
  app/build.gradle.kts
```

### Cómo funciona

- Al arrancar, busca `https://toxi.media/api/playlist` y reemplaza la playlist hardcodeada
- Si no hay red o falla el fetch, usa `HARDCODED_PLAYLIST` en `Playlist.kt`
- El video que se reproduce se calcula con `EPOCH_SEC = 2026-01-01T00:00:00Z` como referencia, igual que la web
- Cada 30 segundos corrige el drift (si hay diferencia > 5 segundos, hace seek)

### Actualizar la playlist

Editá **ambos** archivos y pusheá:
1. `src/content.js` → agrega o modificá entradas con `onTV: true` (para la web)
2. `api/playlist.mjs` → agregá el mismo item al array `PLAYLIST` (para la app)

La app descarga la playlist al arrancar, así que los cambios se propagan sin actualizar el APK.

### Build y distribución

1. Abrí `toxi-tv-android/` en Android Studio
2. Build → Generate Signed Bundle / APK → Android App Bundle
3. Subí el `.aab` al Play Console → Toxi Media TV

### Variables de entorno relevantes (Vercel)

| Variable | Descripción |
|---|---|
| `MUX_TOKEN_ID` | Token ID de Mux |
| `MUX_TOKEN_SECRET` | Token Secret de Mux |

### Endpoint de playlist

`GET https://toxi.media/api/playlist` → devuelve JSON:
```json
[{ "id": "MuxPlaybackID", "duration": 339.5, "title": "Título" }, ...]
```

Fuente: `api/playlist.mjs` — lista hardcodeada, **sin dependencias externas**.

### Política de privacidad

URL para Google Play: `https://toxi.media/privacy-policy`

Archivo fuente: `privacy-policy.html` (compilado por Vite, ruteado en `vercel.json`)
