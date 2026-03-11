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

Editar `public/data/projects.json` con el siguiente esquema:

```json
{
  "name": "Nombre del proyecto",
  "slug": "nombre-del-proyecto",
  "description": "Descripción corta.",
  "contenido": "<p>HTML del cuerpo.</p>",
  "card": "/imagen-card.jpg",
  "banner": "/imagen-banner.jpg",
  "thumbnail": "/imagen-thumb.jpg",
  "talentos": ["slug-talento"],
  "formato": "7",
  "credits": "<h4>Rol</h4><p>Nombre</p>",
  "web": "https://url-externa.com",
  "categoria": ""
}
```

**IDs de formato:** 1 Cine · 2 Podcast · 3 Foto · 4 Texto · 5 VR · 6 Eventos · 7 Software · 8 Música

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
