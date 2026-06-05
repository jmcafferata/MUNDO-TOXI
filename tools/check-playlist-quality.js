/**
 * check-playlist-quality.js
 *
 * Cruza api/playlist.mjs contra los assets de Mux y muestra el tier de calidad
 * de cada video (basic / plus / premium).
 *
 * Uso:
 *   node tools/check-playlist-quality.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { pathToFileURL } = require('url');

const ROOT = path.join(__dirname, '..');
const ENV_FILE = path.join(ROOT, '.env.local');
const PLAYLIST_FILE = path.join(ROOT, 'api', 'playlist.mjs');

function loadEnv(filePath) {
  const env = {};
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    env[key] = val;
  }
  return env;
}

function muxRequest(auth, method, apiPath) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.mux.com',
        path: apiPath,
        method,
        headers: {
          Authorization: auth,
          'Content-Type': 'application/json',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data || '{}');
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
              return;
            }
            reject(new Error('Mux API ' + res.statusCode + ': ' + (parsed.error?.message || data)));
          } catch (err) {
            reject(err);
          }
        });
      }
    );

    req.on('error', reject);
    req.end();
  });
}

async function fetchAllMuxAssets(auth) {
  let page = 1;
  const assets = [];

  while (true) {
    const response = await muxRequest(auth, 'GET', '/video/v1/assets?limit=100&page=' + page);
    const pageData = response.data || [];
    assets.push(...pageData);

    if (!response.pagination || !response.pagination.next_page) break;
    page = response.pagination.next_page;
  }

  return assets;
}

function buildPlaybackIndex(assets) {
  const byPlaybackId = new Map();

  for (const asset of assets) {
    const quality = asset.video_quality || 'unknown';
    const playbackIds = asset.playback_ids || [];
    for (const playback of playbackIds) {
      byPlaybackId.set(playback.id, {
        quality,
        assetId: asset.id,
      });
    }
  }

  return byPlaybackId;
}

function printSection(title, rows) {
  console.log('\n=== ' + title + ' (' + rows.length + ') ===');
  if (rows.length === 0) {
    console.log('- sin resultados');
    return;
  }

  for (const row of rows) {
    console.log('- ' + row.title + ' | ' + row.id + ' | asset: ' + row.assetId);
  }
}

async function main() {
  if (!fs.existsSync(ENV_FILE)) {
    throw new Error('No existe .env.local en: ' + ENV_FILE);
  }

  const env = loadEnv(ENV_FILE);
  const tokenId = env.MUX_TOKEN_ID;
  const tokenSecret = env.MUX_TOKEN_SECRET;
  if (!tokenId || !tokenSecret) {
    throw new Error('Faltan MUX_TOKEN_ID o MUX_TOKEN_SECRET en .env.local');
  }

  const auth = 'Basic ' + Buffer.from(tokenId + ':' + tokenSecret).toString('base64');

  const playlistModule = await import(pathToFileURL(PLAYLIST_FILE).href);
  const playlist = playlistModule.PLAYLIST || [];

  const assets = await fetchAllMuxAssets(auth);
  const byPlaybackId = buildPlaybackIndex(assets);

  const rows = playlist.map((item) => {
    const found = byPlaybackId.get(item.id);
    return {
      id: item.id,
      title: item.title,
      quality: found ? found.quality : 'not_found',
      assetId: found ? found.assetId : '-',
    };
  });

  const counts = rows.reduce((acc, row) => {
    acc[row.quality] = (acc[row.quality] || 0) + 1;
    return acc;
  }, {});

  console.log('=== RESUMEN PLAYLIST ===');
  Object.keys(counts)
    .sort()
    .forEach((k) => {
      console.log(k + ': ' + counts[k]);
    });

  printSection('BASIC', rows.filter((r) => r.quality === 'basic'));
  printSection('PLUS', rows.filter((r) => r.quality === 'plus'));
  printSection('PREMIUM', rows.filter((r) => r.quality === 'premium'));
  printSection('NO ENCONTRADOS', rows.filter((r) => r.quality === 'not_found'));
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
