/**
 * GET /api/playlist
 *
 * Lee la playlist de un Google Sheet publicado como CSV y devuelve JSON.
 *
 * Configuración:
 *   PLAYLIST_SHEET_CSV_URL  → URL "Publicar en la web > CSV" del Sheet
 *   MUX_TOKEN_ID            → Token ID de Mux (ya existente)
 *   MUX_TOKEN_SECRET        → Token Secret de Mux (ya existente)
 *
 * Formato del Sheet (fila 1 = encabezados, se ignora):
 *   id | duration | title | onTV
 *
 *   - id       → Mux Playback ID  (obligatorio)
 *   - duration → duración en segundos  (opcional: si está vacío se busca en Mux)
 *   - title    → título del video  (obligatorio)
 *   - onTV     → "true" para incluir, cualquier otra cosa para excluir
 *
 * Cache de 60 segundos en CDN de Vercel (s-maxage).
 * Fallback automático a content.js si el Sheet no está configurado.
 */

import { TV_PLAYLIST } from '../src/content.js';

async function fetchDurationFromMux(playbackId) {
  const tokenId     = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;
  if (!tokenId || !tokenSecret) return null;
  try {
    // Buscar el asset por playback ID
    const searchRes = await fetch(
      `https://api.mux.com/video/v1/assets?playback_id=${playbackId}`,
      { headers: { Authorization: 'Basic ' + Buffer.from(`${tokenId}:${tokenSecret}`).toString('base64') } }
    );
    if (!searchRes.ok) return null;
    const { data } = await searchRes.json();
    if (data?.length > 0) return data[0].duration ?? null;
  } catch (_) {}
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

  const csvUrl = process.env.PLAYLIST_SHEET_CSV_URL;

  if (!csvUrl) {
    return res.status(200).json(TV_PLAYLIST.map(v => ({
      id: v.id, duration: v.duration, title: v.title,
    })));
  }

  try {
    const response = await fetch(csvUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const text  = await response.text();
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    // Resolver duraciones faltantes en paralelo
    const rows = lines.slice(1).map(line => {
      const cols = parseCSVLine(line);
      const [id, durationRaw, title, onTV] = cols.map(c => c.trim().replace(/^"|"$/g, ''));
      if (!id || !title) return null;
      if (onTV && onTV.toLowerCase() !== 'true') return null;
      const duration = parseFloat(durationRaw) || 0;
      return { id, duration, title };
    }).filter(Boolean);

    // Para filas sin duración, buscar en Mux
    const resolved = await Promise.all(rows.map(async row => {
      if (row.duration > 0) return row;
      const d = await fetchDurationFromMux(row.id);
      if (!d) return null; // sin duración no se puede incluir
      return { ...row, duration: d };
    }));

    const playlist = resolved.filter(Boolean);
    if (playlist.length === 0) throw new Error('Playlist vacía');

    return res.status(200).json(playlist);
  } catch (err) {
    console.error('[/api/playlist] Error, usando fallback:', err.message);
    return res.status(200).json(TV_PLAYLIST.map(v => ({
      id: v.id, duration: v.duration, title: v.title,
    })));
  }
}

function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}
