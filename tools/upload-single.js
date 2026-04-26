/**
 * upload-single.js — Sube un solo .mp4 a Mux
 * Uso: node tools/upload-single.js "C:\ruta\al\video.mp4" "Título del video"
 */

const fs    = require('fs');
const path  = require('path');
const https = require('https');

const ROOT      = path.join(__dirname, '..');
const ENV_FILE  = path.join(ROOT, '.env.local');
const RESULTS_FILE = path.join(ROOT, 'mux-upload-results.json');

const filePath = process.argv[2];
const title    = process.argv[3];
if (!filePath || !title) {
    console.error('Uso: node tools/upload-single.js "ruta/video.mp4" "Título"');
    process.exit(1);
}

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
            headers: { 'Authorization': AUTH, 'Content-Type': 'application/json' },
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
        const parsed    = new URL(uploadUrl);
        const fileSize  = fs.statSync(filePath).size;
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
    console.log('\n▶ ' + filePath);
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
    const playbackId = asset.playback_ids[0].id;
    const duration   = asset.duration;
    console.log('\n  ✅ ID: ' + playbackId + ' | Duration: ' + duration + 's');

    const filename = path.basename(filePath);
    let results = fs.existsSync(RESULTS_FILE)
        ? JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'))
        : [];
    results.push({ filename, title, id: playbackId, asset_id: asset.id, duration });
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));

    console.log('\n══════════════════════════════════════════════');
    console.log('Agregar a playlist.csv (elegir día):');
    console.log(`viernes,${playbackId},${duration},"${title}",true`);
    console.log('\nAgregar a src/content.js:');
    console.log(`  { id: '${playbackId}', duration: ${duration}, title: '${title}', slug: '', type: 'other', year: null, onTV: true },`);
    console.log('\nAgregar a schedule.html / api/playlist.mjs:');
    console.log(`  { id: '${playbackId}',       duration: ${duration},      title: '${title}' },`);
    console.log('\nAgregar a Playlist.kt:');
    console.log(`    val ana2          = TvItem("${playbackId}",  ${duration},      "${title}")`);
    console.log('══════════════════════════════════════════════\n');
}

main().catch(err => { console.error('❌ ' + err.message); process.exit(1); });
