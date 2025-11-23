# Guía de Streaming con Icecast para Mundo Toxi

Para transmitir audio desde tu PC a la web, necesitas 3 componentes funcionando juntos:

1.  **Tu PC (Fuente de Audio)**: Reproduciendo música o usando el micrófono.
2.  **Encoder (BUTT)**: Un programa que captura el audio de tu PC y lo envía al servidor.
3.  **Servidor (Icecast)**: Recibe el audio y lo distribuye a los oyentes en la web.

---

## Paso 1: Instalar y Configurar Icecast

Icecast es el servidor. Puedes instalarlo en tu propia PC (para pruebas locales) o alquilar un servidor de radio online.

### Si lo instalas en tu PC (Windows):
1.  Descarga **Icecast** desde [icecast.org](https://icecast.org/download/).
2.  Instálalo y busca el archivo de configuración `icecast.xml` (usualmente en la carpeta de instalación).
3.  **IMPORTANTE (CORS)**: Para que la onda visual se mueva en la web, debes habilitar CORS.
    *   Abre `icecast.xml` con un editor de texto.
    *   Busca la sección `<http-headers>`. Si no existe, agrégala dentro de `<icecast>`.
    *   Debe quedar así:
    ```xml
    <http-headers>
        <header name="Access-Control-Allow-Origin" value="*" />
    </http-headers>
    ```
    *   *Nota: Si tu versión de Icecast es muy vieja y no soporta esto, la onda visual no se moverá (aunque el audio se escuchará).*

4.  Inicia el servidor Icecast (ejecuta `icecast.bat` o el ejecutable).

---

## Paso 2: Instalar y Configurar BUTT (Broadcast Using This Tool)

BUTT es el programa que envía tu audio al servidor.

1.  Descarga **BUTT** desde [danielnoethen.de/butt/](https://danielnoethen.de/butt/).
2.  Ábrelo y ve a **Settings**.
3.  En la pestaña **Main** -> **Server**, dale a **Add**.
4.  Configura los datos de tu Icecast (si es local):
    *   **Type:** Icecast
    *   **Address:** localhost (o tu IP pública si es para otros)
    *   **Port:** 8000 (por defecto)
    *   **User:** source (¡IMPORTANTE! El usuario por defecto para transmitir es "source", no "admin")
    *   **Password:** hackme (es la clave por defecto de Icecast, cámbiala en el xml si quieres)
    *   **Mountpoint:** /stream (o el nombre que quieras darle a tu radio)
5.  En la pestaña **Audio**, selecciona tu dispositivo de entrada (Micrófono o "Stereo Mix" para transmitir lo que suena en la PC).
6.  Dale al botón **Play** (el triángulo) en la pantalla principal de BUTT. Debería decir "Connecting..." y luego mostrar el tiempo corriendo.

---

## Paso 3: Conectar la Web

1.  Abre el archivo `src/line.js` en este proyecto.
2.  Busca la constante `STREAM_URL`.
3.  Pon la dirección completa de tu stream.
    *   Si es local: `http://localhost:8000/stream`
    *   Si usas un servidor externo: `https://tu-radio.com/stream`

```javascript
const STREAM_URL = 'http://localhost:8000/stream';
```

4.  Guarda y recarga la página.
5.  Haz clic en "CONECTAR A TRANSMISIÓN EN VIVO".

---

## Solución de Problemas

*   **No puedo entrar a localhost:8000:**
    *   **¿Está corriendo el servidor?** Debes tener abierta la ventana de consola de Icecast. Si la cierras, el servidor se apaga.
    *   **Prueba la IP numérica:** A veces `localhost` falla. Intenta entrar a `http://127.0.0.1:8000`.
    *   **Revisa el puerto:** Mira la ventana de Icecast. Debería decir algo como "Listening on port 8000". Si dice otro número, usa ese.
*   **No se escucha nada:** Revisa que BUTT esté conectado y transmitiendo. Abre la URL del stream directamente en una pestaña nueva del navegador para ver si suena.
*   **Se escucha pero la onda es plana:** Es un problema de CORS. El navegador está bloqueando el acceso a los datos de audio. Revisa el paso 1.
*   **Error de Mixed Content:** Si tu web está en `https://`, el stream NO puede ser `http://`. Ambos deben ser seguros.
