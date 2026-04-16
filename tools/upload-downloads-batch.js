/**
 * upload-downloads-batch.js
 * Sube los 4 videos nuevos desde Downloads a Mux (calidad basic/baseline),
 * luego actualiza mux-upload-results.json, playlist.mjs y src/content.js.
 *
 * Uso: node tools/upload-downloads-batch.js
 */

const fs   = require('fs');
const path = require('path');
const https = require('https');

const ROOT         = path.join(__dirname, '..');
const ENV_FILE     = path.join(ROOT, '.env.local');
const RESULTS_FILE = path.join(ROOT, 'mux-upload-results.json');
const PLAYLIST_FILE = path.join(ROOT, 'api', 'playlist.mjs');
const CONTENT_FILE  = path.join(ROOT, 'src', 'content.js');

const VIDEOS = [
  { file: 'C:\\Users\\JM\\Downloads\\Storytelling y transgresión, con Gael P. Rossi _ TOXI University.mp4',
    title: 'Storytelling y Transgresión — Gael P. Rossi (TOXI University)' },
  { file: 'C:\\Users\\JM\\Downloads\\Literatura y realidad virtual, con Ana Arzoumanian _ TOXI University.mp4',
    title: 'Literatura y Realidad Virtual — Ana Arzoumanian (TOXI University)' },
  { file: 'C:\\Users\\JM\\Downloads\\Masterclass de Python con Nicolás Martorell _ Clase completa _ Xplora Academy.mp4',
    title: 'Masterclass de Python — Nicolás Martorell (Xplora Academy)' },
  { file: 'C:\\Users\\JM\\Downloads\\Tomátelo con ciencia - Piloto.mp4',
    title: 'Tomátelo con Ciencia — Piloto' },
];

// ── Leer credenciales ──────────────────────────────────────────────────
const env = {};
fs.readFileSync(ENV_FILE, 'utf8').split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0) {
    const k = line.slice(0, idx).trim();
    let v = line.slice(idx + 1).trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    env[k] = v;
  }
});
const { MUX_TOKEN_ID, MUX_TOKEN_SECRET } = env;
if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
  console.error('Faltan MUX_TOKEN_ID o MUX_TOKEN_SECRET en .env.local');
  process.exit(1);
}
const AUTH = 'Basic ' + Buffer.from(MUX_TOKEN_ID + ':' + MUX_TOKEN_SECRET).toString('base64');

// ── Helpers HTTP ───────────────────────────────────────────────────────
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
      process.stdout.write('\r  ' + pct + '% — ' + (uploaded/1024/1024).toFixed(0) + 'MB / ' + (fileSize/1024/1024).toFixed(0) + 'MB   ');
    });
    fileStream.pipe(req);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function waitForAsset(uploadId) {
  for (let i = 0; i < 120; i++) {
    const res    = await muxRequest('GET', '/video/v1/uploads/' + uploadId);
    const upload = res.data;
    if (upload.status === 'asset_created' && upload.asset_id) {
      for (let j = 0; j < 120; j++) {
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

// ── Actualizar archivos ────────────────────────────────────────────────
function appendToPlaylist(results) {
  let content = fs.readFileSync(PLAYLIST_FILE, 'utf8');
  const insertBefore = '\n];\n\nexport default function handler';
  const lines = results.map(r => {
    const t = r.title.replace(/'/g, "\\'");
    return `  { id: '${r.id}',  duration: ${r.duration},  title: '${t}' },`;
  }).join('\n');
  content = content.replace(insertBefore, '\n' + lines + insertBefore);
  fs.writeFileSync(PLAYLIST_FILE, content, 'utf8');
  console.log('  ✓ playlist.mjs actualizado');
}

function appendToContent(results) {
  let content = fs.readFileSync(CONTENT_FILE, 'utf8');
  // Insertar antes de la última línea (closing ];)
  const closing = '\n];\n';
  const lines = results.map(r => {
    const t = r.title.replace(/'/g, "\\'");
    return `  { id: '${r.id}', duration: ${r.duration}, title: '${t}', slug: '', type: 'other', year: null, onTV: true },`;
  }).join('\n');
  const lastClose = content.lastIndexOf(closing);
  if (lastClose === -1) {
    console.error('No encontré el cierre ]; en content.js');
    return;
  }
  content = content.slice(0, lastClose) + '\n' + lines + content.slice(lastClose);
  fs.writeFileSync(CONTENT_FILE, content, 'utf8');
  console.log('  ✓ src/content.js actualizado');
}

// ── Main ───────────────────────────────────────────────────────────────
async function main() {
  let results = fs.existsSync(RESULTS_FILE)
    ? JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'))
    : [];
  const doneByFile = new Set(results.filter(r => r.id).map(r => r.filename));

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(' TOXI Media — Subida a Mux (calidad basic)');
  console.log('═══════════════════════════════════════════════════════\n');

  const newResults = [];

  for (const { file, title } of VIDEOS) {
    const filename = path.basename(file);
    if (doneByFile.has(filename)) {
      console.log('✓ Ya subido: ' + filename);
      continue;
    }
    if (!fs.existsSync(file)) {
      console.error('❌ No encontrado: ' + file);
      continue;
    }

    console.log('\n▶ ' + title);
    console.log('  Archivo: ' + filename);

    try {
      const uploadRes = await muxRequest('POST', '/video/v1/uploads', {
        new_asset_settings: {
          playback_policy: ['public'],
          encoding_tier: 'baseline',
        },
        cors_origin: '*',
      });

      if (!uploadRes.data?.id) throw new Error('No upload ID: ' + JSON.stringify(uploadRes));
      const uploadId  = uploadRes.data.id;
      const uploadUrl = uploadRes.data.url;

      const status = await uploadFile(uploadUrl, file);
      console.log('\n  HTTP upload: ' + status);

      process.stdout.write('  Procesando asset');
      const asset = await waitForAsset(uploadId);
      const pid   = asset.playback_ids[0].id;
      const dur   = asset.duration;
      console.log('\n  ✅ ' + pid + ' | ' + dur + 's');

      const entry = { filename, title, id: pid, asset_id: asset.id, duration: dur };
      results.push(entry);
      newResults.push(entry);
      fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));

    } catch (err) {
      console.error('\n  ❌ ' + err.message);
      results.push({ filename, title, error: err.message });
      fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
    }
  }

  if (newResults.length > 0) {
    console.log('\n\n─── Actualizando archivos ───────────────────────────────');
    appendToPlaylist(newResults);
    appendToContent(newResults);
    console.log('\n  Entradas agregadas (' + newResults.length + '):');
    newResults.forEach(r => console.log('    · ' + r.title + '  →  ' + r.id));
  } else {
    console.log('\nNada nuevo que agregar.');
  }

  console.log('\n═══════════════════════════════════════════════════════\n');
}

main().catch(err => { console.error(err); process.exit(1); });
