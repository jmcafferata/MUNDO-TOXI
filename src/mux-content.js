/**
 * mux-content.js — Plasma el contenido de Mux: lista todos los assets,
 * permite buscar por título y guarda un snapshot JSON.
 *
 * Uso:
 *   node src/mux-content.js                 → lista todo el contenido
 *   node src/mux-content.js "Hotel Oriente" → busca por título exacto
 *
 * Sigue la misma convención que tools/upload-to-mux.js:
 * autenticación Basic con MUX_TOKEN_ID / MUX_TOKEN_SECRET de .env.local
 * (no requiere instalar @mux/mux-node).
 */

const fs    = require('fs');
const path  = require('path');
const https = require('https');

const ROOT          = path.join(__dirname, '..');
const ENV_FILE      = path.join(ROOT, '.env.local');
const SNAPSHOT_FILE = path.join(ROOT, 'mux-content-snapshot.json');

// Leer .env.local
const env = {};
fs.readFileSync(ENV_FILE, 'utf8').split('\n').forEach(line => {
    const idx = line.indexOf('=');
    if (idx > 0) env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim().replace(/^"|"$/g, '');
});
const { MUX_TOKEN_ID, MUX_TOKEN_SECRET } = env;
if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
    console.error('Faltan MUX_TOKEN_ID o MUX_TOKEN_SECRET en .env.local');
    process.exit(1);
}
const AUTH = 'Basic ' + Buffer.from(MUX_TOKEN_ID + ':' + MUX_TOKEN_SECRET).toString('base64');

function muxRequest(method, urlPath) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.mux.com',
            path: urlPath,
            method,
            headers: { 'Authorization': AUTH, 'Content-Type': 'application/json' },
        };
        const req = https.request(options, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(data); } });
        });
        req.on('error', reject);
        req.end();
    });
}

// 1. Obtiene TODOS los assets paginando de a 100
async function listarAssets() {
    const assets = [];
    let page = 1;
    while (true) {
        const res = await muxRequest('GET', `/video/v1/assets?limit=100&page=${page}`);
        const batch = res.data || [];
        assets.push(...batch);
        if (batch.length < 100) break;
        page++;
    }
    return assets;
}

// 2. Filtra los que coincidan con el título guardado en metadata
async function buscarPorTitulo(tituloBuscado) {
    const assets = await listarAssets();
    return assets.filter(asset =>
        asset.meta && asset.meta.title === tituloBuscado
    );
}

// Normaliza un asset a una fila legible
function fila(asset) {
    const playback = (asset.playback_ids && asset.playback_ids[0])
        ? asset.playback_ids[0].id : '—';
    return {
        titulo:    (asset.meta && asset.meta.title) || '(sin título)',
        estado:    asset.status,
        duracion:  asset.duration ? asset.duration.toFixed(1) + 's' : '—',
        playbackId: playback,
        assetId:   asset.id,
        creado:    asset.created_at
            ? new Date(Number(asset.created_at) * 1000).toISOString().slice(0, 10)
            : '—',
    };
}

async function main() {
    const tituloBuscado = process.argv[2];

    if (tituloBuscado) {
        const resultados = await buscarPorTitulo(tituloBuscado);
        if (!resultados.length) {
            console.log(`No se encontró ningún asset con título "${tituloBuscado}".`);
            return;
        }
        console.table(resultados.map(fila));
        return;
    }

    const assets = await listarAssets();
    console.log(`\nTotal de assets en Mux: ${assets.length}\n`);
    console.table(assets.map(fila));

    // Snapshot JSON con el contenido completo
    fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(assets, null, 2));
    console.log(`Snapshot guardado en ${path.relative(ROOT, SNAPSHOT_FILE)}`);
}

main().catch(err => {
    console.error('Error consultando Mux:', err.message || err);
    process.exit(1);
});
