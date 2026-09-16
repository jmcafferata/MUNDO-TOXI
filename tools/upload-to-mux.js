/**
 * upload-to-mux.js — Sube todos los .mp4 a Mux y genera entradas para content.js
 * Uso: node tools/upload-to-mux.js
 */

const fs    = require('fs');
const path  = require('path');
const https = require('https');

const ROOT          = path.join(__dirname, '..');
const UPLOAD_FOLDER = path.join(ROOT, '..', 'para subir a mux');
const ENV_FILE      = path.join(ROOT, '.env.local');
const RESULTS_FILE  = path.join(ROOT, 'mux-upload-results.json');
const CONTENT_FILE  = path.join(ROOT, 'src', 'content.js');
const PLAYLIST_FILE = path.join(ROOT, 'api', 'playlist.mjs');

function metadataFor(filename) {
    const title = path.basename(filename, '.mp4');
    const lower = title.toLowerCase();
    let collections = [];

    if (lower.includes('what show')) collections = ['what-show'];
    else if (lower.includes('xplora')) collections = ['xplora-ciencia'];
    else if (lower.includes('ads') || lower.includes('toxi ads') || lower.includes('bigbox')) collections = ['toxi-ads'];
    else if (lower.includes('música') || lower.includes('fede vaquero') || lower.includes('big band') || lower.includes('tonto mike') || lower.includes('manu roca')) collections = ['toxi-music'];
    else if (lower.includes('laberinto')) collections = ['toxi-documentales'];
    else if (lower.includes('reel')) collections = ['toxi-media'];

    return { title, collections };
}

function escapeTitle(title) {
    return title.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function appendEntries(filePath, beforePattern, entries) {
    let source = fs.readFileSync(filePath, 'utf8');
    const missingEntries = entries.filter(({ id }) => !source.includes(`id: '${id}'`));
    if (!missingEntries.length) return;

    const lines = missingEntries.map(({ id, duration, title, collections }) =>
        `  { id: '${id}', duration: ${duration}, title: '${escapeTitle(title)}', slug: '', type: 'other', year: 2026, onTV: true, collections: ${JSON.stringify(collections)} },`
    ).join('\n');

    const match = source.match(beforePattern);
    if (!match) throw new Error('No se encontró el punto de inserción en ' + filePath);
    const lineEnding = source.includes('\r\n') ? '\r\n' : '\n';
    source = source.replace(beforePattern, lineEnding + '  // ── SUBIDOS A MUX (2026-09-16) ───────────────────────' + lineEnding + lines + match[0]);
    fs.writeFileSync(filePath, source, 'utf8');
}

function synchronizeCatalogs(entries) {
    if (!entries.length) return;
    appendEntries(CONTENT_FILE, /\r?\n\];\r?\n\r?\nconst getCollections/, entries);
    appendEntries(PLAYLIST_FILE, /\r?\n\];\r?\n\r?\n\/\/ Fusiona las versiones técnica/, entries);
    console.log('\nCatálogos actualizados: src/content.js y api/playlist.mjs');
}

// Leer .env.local
const env = {};
fs.readFileSync(ENV_FILE, 'utf8').split('\n').forEach(line => {
    const idx = line.indexOf('=');
    if (idx > 0) env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
});
const { MUX_TOKEN_ID, MUX_TOKEN_SECRET } = env;
if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
    console.error('Faltan MUX_TOKEN_ID o MUX_TOKEN_SECRET en .env.local');
    process.exit(1);
}
const AUTH = 'Basic ' + Buffer.from(MUX_TOKEN_ID + ':' + MUX_TOKEN_SECRET).toString('base64');

function muxRequest(method, urlPath, body) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const options = {
            hostname: 'api.mux.com',
            path: urlPath,
            method,
            headers: {
                'Authorization': AUTH,
                'Content-Type': 'application/json',
            },
        };
        if (payload) options.headers['Content-Length'] = Buffer.byteLength(payload);
        const req = https.request(options, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data || '{}');
                    if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
                    else reject(new Error('Mux API ' + res.statusCode + ': ' + (parsed.error?.message || data)));
                } catch {
                    reject(new Error('Mux API ' + res.statusCode + ': ' + data));
                }
            });
        });
        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

function uploadFile(uploadUrl, filePath) {
    return new Promise((resolve, reject) => {
        const parsed   = new URL(uploadUrl);
        const fileSize = fs.statSync(filePath).size;
        const fileStream = fs.createReadStream(filePath);
        const options = {
            hostname: parsed.hostname,
            path: parsed.pathname + parsed.search,
            method: 'PUT',
            headers: { 'Content-Type': 'video/mp4', 'Content-Length': fileSize },
        };
        const req = https.request(options, res => {
            let b = '';
            res.on('data', c => b += c);
            res.on('end', () => resolve(res.statusCode));
        });
        req.on('error', reject);

        let uploaded = 0;
        fileStream.on('data', chunk => {
            uploaded += chunk.length;
            const pct = ((uploaded / fileSize) * 100).toFixed(1);
            process.stdout.write('\r  ' + pct + '% — ' + (uploaded/1024/1024).toFixed(1) + ' MB / ' + (fileSize/1024/1024).toFixed(1) + ' MB   ');
        });
        fileStream.pipe(req);
    });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function waitForAsset(uploadId) {
    for (let i = 0; i < 80; i++) {
        const res    = await muxRequest('GET', '/video/v1/uploads/' + uploadId);
        const upload = res.data;
        if (upload.status === 'asset_created' && upload.asset_id) {
            for (let j = 0; j < 80; j++) {
                const aRes  = await muxRequest('GET', '/video/v1/assets/' + upload.asset_id);
                const asset = aRes.data;
                if (asset.status === 'ready')   return asset;
                if (asset.status === 'errored') throw new Error('Asset errored: ' + upload.asset_id);
                process.stdout.write('.');
                await sleep(5000);
            }
        }
        if (upload.status === 'errored') throw new Error('Upload errored: ' + uploadId);
        await sleep(3000);
    }
    throw new Error('Timeout esperando el asset');
}

async function findReadyAssetByTitle(title) {
    const response = await muxRequest('GET', '/video/v1/assets?limit=100');
    return (response.data || []).find(asset =>
        asset.status === 'ready' &&
        asset.meta?.title === title &&
        asset.playback_ids?.[0]?.id
    );
}

async function main() {
    const files = fs.readdirSync(UPLOAD_FOLDER)
        .filter(f => f.toLowerCase().endsWith('.mp4'))
        .sort();

    let results = fs.existsSync(RESULTS_FILE)
        ? JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'))
        : [];
    const done = new Set(results.filter(r => r.id).map(r => r.filename));

    console.log('\n═══════════════════════════════════════════');
    console.log(' TOXI Media — Uploader a Mux');
    console.log('═══════════════════════════════════════════');
    console.log(' Carpeta   : ' + UPLOAD_FOLDER);
    console.log(' Archivos  : ' + files.length);
    console.log(' Ya subidos: ' + done.size);
    console.log(' Pendientes: ' + files.filter(f => !done.has(f)).length);
    console.log('═══════════════════════════════════════════\n');

    for (const filename of files) {
        if (done.has(filename)) {
            console.log('✓ Omitido: ' + filename);
            continue;
        }

        const filePath = path.join(UPLOAD_FOLDER, filename);
        const { title, collections } = metadataFor(filename);
        console.log('\n▶ ' + filename);

        try {
            const existingAsset = await findReadyAssetByTitle(title);
            if (existingAsset) {
                console.log('  ✓ Asset existente: ' + existingAsset.playback_ids[0].id + ' | ' + existingAsset.duration + 's');
                results.push({ filename, title, collections, id: existingAsset.playback_ids[0].id, asset_id: existingAsset.id, duration: existingAsset.duration });
                fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
                continue;
            }

            const uploadRes = await muxRequest('POST', '/video/v1/uploads', {
                new_asset_settings: {
                    playback_policy: ['public'],
                    video_quality: 'basic',
                    meta: { title },
                },
                cors_origin: '*',
            });
            const uploadId  = uploadRes.data.id;
            const uploadUrl = uploadRes.data.url;

            const status = await uploadFile(uploadUrl, filePath);
            console.log('\n  HTTP: ' + status);

            process.stdout.write('  Procesando');
            const asset = await waitForAsset(uploadId);
            console.log('\n  ✅ ' + asset.playback_ids[0].id + ' | ' + asset.duration + 's');

            results.push({ filename, title, collections, id: asset.playback_ids[0].id, asset_id: asset.id, duration: asset.duration });
            fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));

        } catch (err) {
            console.error('\n  ❌ ' + err.message);
        }
    }

    const uploaded = results.filter(r => files.includes(r.filename) && r.id);
    synchronizeCatalogs(uploaded);

    // Snippet para content.js
    const ok = uploaded;
    console.log('\n\n═══════════════════════════════════════════');
    console.log(' Entradas para src/content.js (' + ok.length + ' videos):');
    console.log('═══════════════════════════════════════════\n');
    ok.forEach(r => {
        console.log("  { id: '" + r.id + "', duration: " + r.duration + ", title: '" + escapeTitle(r.title) + "', slug: '', type: 'other', year: 2026, onTV: true, collections: " + JSON.stringify(r.collections || []) + " },");
    });

    console.log('\nResultados guardados en: ' + RESULTS_FILE);
}

main().catch(err => { console.error(err); process.exit(1); });
