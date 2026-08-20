# Manual de la web de MUNDO TOXI

## 1. Qué es MUNDO TOXI

MUNDO TOXI es la plataforma digital de TOXI Media para exhibir y distribuir contenidos multimedia y experiencias inmersivas. El sitio reúne proyectos, talentos, formatos, video, radio, TV, propuestas educativas y experiencias interactivas.

La web principal está publicada en:

- https://www.toxi.media/
- https://www.toxi.media/plantform

El sitio está construido con Vite y utiliza Three.js para la escena de entrada, Mercado Pago para los accesos pagos, Vite PWA para la instalación como aplicación y Vercel para el hosting y el despliegue.

## 2. Recorrido para visitantes

### 2.1 Entrada al sitio

Al ingresar a `https://www.toxi.media/` se muestra la pantalla de entrada de TOXI Media.

La persona visitante puede:

1. Ingresar una clave personal mediante el teclado numérico.
2. Elegir **Entrar como invitado** para acceder a la plataforma sin una clave.
3. Comprar un **Pase diario** mediante Mercado Pago.
4. Comprar e instalar la aplicación para obtener acceso permanente, cuando la opción esté disponible.

Los pagos se procesan mediante Mercado Pago. El acceso adquirido se guarda localmente en el navegador del dispositivo. Al borrar los datos del sitio o cambiar de navegador, puede ser necesario volver a validar el acceso.

### 2.2 Catálogo PLANTFORM

PLANTFORM es el catálogo central de MUNDO TOXI. Se puede acceder desde:

`https://www.toxi.media/plantform`

El catálogo tiene tres vistas:

- **Proyectos:** obras, producciones y experiencias.
- **Talentos:** artistas, colaboradores y personas vinculadas a los proyectos.
- **Formatos:** categorías de contenido, como cine, podcast, fotografía, texto, realidad virtual, eventos, software y música.

Para encontrar contenido se puede:

- Usar el buscador de la parte superior.
- Cambiar de vista mediante las pestañas.
- Aplicar los filtros disponibles.
- Seleccionar una tarjeta para abrir su ficha detallada.

Cada ficha puede incluir una descripción, imágenes, videos, enlaces externos, créditos, talentos asociados y otros proyectos relacionados.

### 2.3 Consulta por voz

El botón de micrófono permite preguntarle a TOXI qué contenido puede interesar. Para utilizarlo:

1. Abrir PLANTFORM.
2. Presionar el botón de micrófono.
3. Dar permiso al navegador para usar el micrófono, si lo solicita.
4. Formular una consulta breve.
5. Esperar la respuesta de la plataforma.

La función depende de que el navegador admita reconocimiento de voz y de que estén disponibles los servicios de IA y síntesis de voz configurados en el servidor. Si no funciona, se puede continuar usando el buscador y las pestañas del catálogo.

### 2.4 Páginas y experiencias especiales

Además del catálogo, el pie de la entrada enlaza a distintas experiencias de TOXI Media:

- **TOXI UNIVERSITY:** contenidos educativos.
- **TV:** transmisión y contenidos audiovisuales.
- **ZAPPING:** selección de contenidos.
- **OTRO DÍA EN LA RED:** propuesta editorial o audiovisual.
- **VR:** experiencias de realidad virtual.
- **MERS VLOG:** contenidos de vlog.
- **RADIO:** contenidos radiales.
- **XPLORA NIGHT LIVE:** experiencia o programa en vivo.
- **TRABAJOS:** información laboral o convocatorias.
- **MERS: EL JUEGO:** juego externo alojado en otra aplicación.

También existen páginas independientes para proyectos específicos, entre ellas Audion't, Ariana Grande y otras experiencias generadas desde el catálogo.

## 3. Estructura técnica

Las piezas principales del proyecto son:

```text
index.html              Entrada, clave, acceso y compra
plantform.html          Catálogo de proyectos, talentos y formatos
src/main.js              Escena 3D de la entrada
src/paywall.js           Accesos y pagos
src/style.css            Estilos globales
public/data/projects.json  Catálogo de proyectos
public/data/talentos.json  Catálogo de talentos
public/data/formatos.json  Categorías de formatos
generate-static.js       Generación de páginas por slug
vercel.json              Redirecciones y rewrites de producción
public/sitemap.xml       Mapa de URLs indexables
```

Las páginas individuales se publican dentro de `public/[slug]/index.html`. No conviene editar manualmente esas páginas si fueron generadas desde los catálogos, porque el siguiente `npm run gen` puede sobrescribirlas.

## 4. Agregar o modificar un proyecto

### Paso 1. Preparar las imágenes

Se pueden usar imágenes locales o externas.

Para imágenes locales, crear una carpeta:

```text
public/nombre-del-slug/
```

Guardar allí, por ejemplo:

```text
thumb.jpg       Imagen de tarjeta, idealmente 1280 x 720
poster.jpg      Banner o imagen principal, idealmente 1920 x 1080
```

Las rutas locales se escriben comenzando con `/`:

```json
"card": "/nombre-del-slug/thumb.jpg",
"banner": "/nombre-del-slug/poster.jpg",
"thumbnail": "/nombre-del-slug/thumb.jpg"
```

También se pueden utilizar URLs completas de un CDN confiable.

### Paso 2. Editar `public/data/projects.json`

Agregar un objeto con esta estructura:

```json
{
  "name": "Nombre del proyecto",
  "slug": "nombre-del-slug",
  "description": "Descripción corta para tarjetas y SEO.",
  "contenido": "<p>Contenido completo de la ficha.</p>",
  "card": "/nombre-del-slug/thumb.jpg",
  "banner": "/nombre-del-slug/poster.jpg",
  "thumbnail": "/nombre-del-slug/thumb.jpg",
  "talentos": ["slug-del-talento"],
  "formato": "1",
  "credits": "<h4>Dirección</h4><p>Nombre Apellido</p>",
  "web": "https://sitio-externo.example",
  "categoria": ""
}
```

El `slug` debe estar en minúsculas y usar guiones. No debe repetirse.

Los identificadores de formato vigentes son:

| ID | Formato |
|---:|---|
| 1 | Cine |
| 2 | Podcast |
| 3 | Foto |
| 4 | Texto |
| 5 | VR |
| 6 | Eventos |
| 7 | Software |
| 8 | Música |

El campo `contenido` admite HTML enriquecido, imágenes, enlaces y videos embebidos. Los videos deben utilizar el iframe o la URL de inserción correspondiente de YouTube u otro proveedor autorizado.

### Paso 3. Relacionar talentos

Cada valor de `talentos` debe coincidir con un `slug` existente en `public/data/talentos.json`. Si el talento todavía no existe, hay que crearlo antes o junto con el proyecto.

### Paso 4. Regenerar las páginas

Desde la carpeta raíz del proyecto:

```bash
npm install
npm run gen
```

El generador crea las fichas estáticas de proyectos y talentos, actualiza los metadatos SEO, genera el sitemap y actualiza `robots.txt`.

### Paso 5. Verificar y publicar

Ejecutar:

```bash
npm run build
```

Para revisar el sitio localmente:

```bash
npm run dev
```

Vite mostrará la dirección local, normalmente `http://localhost:5173` o el puerto configurado por el entorno.

Después de comprobar el resultado, publicar los cambios en el repositorio. Vercel realiza el despliegue automático según la configuración del proyecto.

## 5. Agregar o modificar un talento

Editar `public/data/talentos.json` con una estructura como esta:

```json
{
  "name": "Nombre Apellido",
  "slug": "nombre-apellido",
  "description": "Descripción breve.",
  "contenido": "<p>Biografía o presentación.</p>",
  "photo": "/nombre-apellido/photo.jpg",
  "banner": "/nombre-apellido/banner.jpg",
  "quote": "Frase o identificación breve",
  "proyectos": ["nombre-del-slug"],
  "formatos": ["vr"],
  "web": "https://sitio-externo.example"
}
```

Los slugs incluidos en `proyectos` deben existir en `projects.json`. Luego de modificar el archivo, ejecutar `npm run gen` y `npm run build`.

## 6. Contenido y buenas prácticas

- Validar que los archivos JSON tengan comas, comillas y corchetes correctos.
- Mantener nombres y slugs consistentes para evitar fichas rotas.
- Usar imágenes optimizadas para no ralentizar la carga.
- Escribir una descripción corta clara: se utiliza en tarjetas y metadatos sociales.
- Comprobar que todos los enlaces externos funcionen.
- Añadir texto alternativo descriptivo a las imágenes nuevas cuando el contenido lo permita.
- Evitar guardar claves, tokens o contraseñas en archivos versionados.
- Verificar las fichas en móvil y escritorio después de cada cambio.

## 7. Variables de entorno y servicios

Las credenciales se configuran en Vercel y, para el desarrollo local, en un archivo `.env` que no debe subirse al repositorio.

Entre las variables utilizadas por el proyecto se encuentran:

| Variable | Uso |
|---|---|
| `GEMINI_API_KEY` | IA de la función de voz |
| `ELEVENLABS_API_KEY` | Síntesis de voz |
| `ELEVENLABS_VOICE_ID` | Voz utilizada por ElevenLabs |
| `MP_ACCESS_TOKEN` | Mercado Pago en el servidor |
| `VITE_MP_PUBLIC_KEY` | Mercado Pago en el frontend |
| `ENV_MP_PUBLIC_KEY` | Clave pública para funciones serverless |
| `ZOHO_EMAIL` | Notificaciones por correo |
| `ZOHO_PASSWORD` | Autenticación de Zoho |
| `MUX_TOKEN_ID` | Acceso a Mux |
| `MUX_TOKEN_SECRET` | Secreto de Mux |

Nunca colocar los valores reales en este manual, en `README.md`, en el frontend ni en un commit.

Después de cambiar variables en producción, realizar un redeploy:

```bash
npx vercel --prod
```

## 8. Diagnóstico rápido

### La ficha no aparece

Comprobar que el objeto tenga `slug`, que el JSON sea válido y que se haya ejecutado `npm run gen`.

### La imagen no carga

Revisar la ruta, las mayúsculas y minúsculas, la extensión y que el archivo exista dentro de `public/`. Si es una URL externa, comprobar que el CDN permita el acceso desde el navegador.

### El catálogo no muestra cambios

Ejecutar nuevamente `npm run gen`, levantar el servidor con `npm run dev` y recargar sin caché. PLANTFORM solicita los JSON con `cache: 'no-store'`, por lo que el problema suele estar en el archivo o en la generación de la página.

### El pago no funciona

Revisar que Mercado Pago esté disponible, que `VITE_MP_PUBLIC_KEY` esté definida en el frontend y que las credenciales del servidor estén configuradas en Vercel. No imprimir ni compartir los valores de las claves.

### La consulta por voz no responde

Comprobar permisos de micrófono, compatibilidad del navegador, conexión a internet y disponibilidad de las variables de Gemini y ElevenLabs. El buscador manual sigue disponible como alternativa.

### El despliegue falla

Ejecutar localmente:

```bash
npm install
npm run gen
npm run build
```

Corregir primero los errores de JSON, generación o build. Luego revisar los logs del proyecto en Vercel.

## 9. Publicación y mantenimiento

Flujo recomendado:

1. Editar los JSON y agregar los recursos necesarios.
2. Ejecutar `npm run gen`.
3. Revisar la página generada y la navegación desde PLANTFORM.
4. Ejecutar `npm run build`.
5. Probar la versión local en móvil y escritorio.
6. Publicar los cambios en la rama configurada para Vercel.
7. Revisar el despliegue y las rutas públicas.
8. Confirmar que la ficha, las imágenes, los videos y los metadatos sociales funcionen en producción.

## 10. Referencias

- Sitio: https://www.toxi.media/
- Catálogo: https://www.toxi.media/plantform
- Repositorio: https://github.com/jmcafferata/mundo-toxi
- Panel de Vercel: https://vercel.com/dashboard
- Datos de proyectos: `public/data/projects.json`
- Datos de talentos: `public/data/talentos.json`
- Configuración de rutas: `vercel.json`
