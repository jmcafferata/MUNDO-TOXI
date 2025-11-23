# Guía de Streaming: De Local a Internet (GitHub Pages)

Ya lograste que funcione en tu PC (`localhost`). Ahora, para que **cualquiera en el mundo** pueda escucharlo desde tu web en GitHub Pages, hay un obstáculo técnico importante: **HTTPS**.

## El Problema: "Mixed Content"
GitHub Pages usa **HTTPS** (el candadito seguro).
Tu servidor Icecast local usa **HTTP** (inseguro).

Los navegadores **bloquean** por seguridad cualquier audio HTTP dentro de una web HTTPS. Si pones tu IP pública (ej. `http://181.20.30.40:8000/stream`), **no funcionará** en GitHub Pages.

## La Solución: Usar un Servidor Relay (Gratis)
La forma más fácil de solucionar esto sin comprar certificados SSL ni configurar servidores complejos es usar un servicio de **Radio Hosting Gratuito** que te de una URL **HTTPS**.

Recomendamos **Zeno.fm** (es gratis y estable).

### Paso 1: Crear la Estación en Zeno.fm
1.  Ve a [zeno.fm/broadcasters](https://zeno.fm/broadcasters/) y regístrate.
2.  Crea una "New Station".
3.  En el panel de control de tu estación, busca la sección **"Stream Encoder Settings"**. Ahí verás:
    *   Server Address (ej. `stream.zeno.fm`)
    *   Port (ej. `80`)
    *   Mount Point (ej. `/tu-radio`)
    *   Password (ej. `xYz123`)

### Paso 2: Configurar BUTT
1.  Abre BUTT en tu PC.
2.  Borra o edita tu configuración de `localhost`.
3.  Pon los datos que te dio Zeno.fm:
    *   **Type:** Icecast
    *   **Address:** `stream.zeno.fm`
    *   **Port:** `80`
    *   **Password:** (La que te dio Zeno)
    *   **Mountpoint:** (El que te dio Zeno)
    *   **User:** `source`
4.  Dale a conectar. Ahora estás transmitiendo tu audio a los servidores de Zeno.

### Paso 3: Actualizar tu Web
1.  En Zeno, busca la **"Stream URL"** (debe empezar con `https://`).
2.  Copia esa URL.
3.  Ve a tu archivo `src/line.js` y actualiza la constante:

```javascript
// src/line.js
const STREAM_URL = 'https://stream.zeno.fm/tu-codigo-raro'; 
```

4.  Haz `git commit` y `git push`.
5.  Cuando GitHub Pages se actualice, ¡tu radio funcionará para todo el mundo!

---

## Opción Alternativa: Ngrok (Solo para pruebas temporales)
Si solo quieres probar con un amigo un rato y no quieres registrarte en Zeno, puedes usar **Ngrok** para crear un túnel HTTPS a tu PC.
1.  Descarga Ngrok.
2.  Ejecuta: `ngrok http 8000`
3.  Copia la URL que termina en `.ngrok-free.app` (la que dice `https`).
4.  Pon esa URL + `/stream` en tu código (ej. `https://xyz.ngrok-free.app/stream`).
5.  *Nota: La URL cambia cada vez que reinicias Ngrok.*
