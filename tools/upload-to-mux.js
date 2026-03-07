/**
 * upload-to-mux.js — Sube todos los .mp4 a Mux y genera entradas para content.js
 * Uso: node tools/upload-to-mux.js
 */

const fs    = require('fs');
const path  = require('path');
const https = require('https');

const ROOT          = path.join(__dirname, '..');
const UPLOAD_FOLDER = path.join(ROOT, '..', 'para subir a mux y toxi tv');
const ENV_FILE      = path.join(ROOT, '.env.local');
const RESULTS_FILE  = path.join(ROOT, 'mux-upload-results.json');

// Leer .env.local
const env = {};
fs.readFileSync(ENV_FILE, 'utf8').split('\n').forEach(line => {
    const idx = line.indexOf('=');
    if (idx > 0) env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
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
            res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(data); } });
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
        const title    = path.basename(filename, '.mp4');
        console.log('\n▶ ' + filename);

        try {
            const uploadRes = await muxRequest('POST', '/video/v1/uploads', {
                new_asset_settings: { playback_policy: ['public'] },
                cors_origin: '*',
            });
            const uploadId  = uploadRes.data.id;
            const uploadUrl = uploadRes.data.url;

            const status = await uploadFile(uploadUrl, filePath);
            console.log('\n  HTTP: ' + status);

            process.stdout.write('  Procesando');
            const asset = await waitForAsset(uploadId);
            console.log('\n  ✅ ' + asset.playback_ids[0].id + ' | ' + asset.duration + 's');

            results.push({ filename, title, id: asset.playback_ids[0].id, asset_id: asset.id, duration: asset.duration });
            fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));

        } catch (err) {
            console.error('\n  ❌ ' + err.message);
            results.push({ filename, title, error: err.message });
            fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
        }
    }

    // Snippet para content.js
    const ok = results.filter(r => r.id);
    console.log('\n\n═══════════════════════════════════════════');
    console.log(' Entradas para src/content.js (' + ok.length + ' videos):');
    console.log('═══════════════════════════════════════════\n');
    ok.forEach(r => {
        console.log("  { id: '" + r.id + "', duration: " + r.duration + ", title: '" + r.title.replace(/'/g, "\\'") + "', slug: '', type: 'other', year: null, onTV: false },");
    });

    console.log('\nResultados guardados en: ' + RESULTS_FILE);
}

main().catch(err => { console.error(err); process.exit(1); });
