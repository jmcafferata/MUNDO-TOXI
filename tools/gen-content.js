const fs = require('fs');
const results = JSON.parse(fs.readFileSync('C:/Users/JM/Desktop/MUNDO TOXI/mux-upload-results.json', 'utf8'));

const existing = [
  { id: 'iytKgjz1JJhz3Kl01WLcTCFZ9DTVClWf00kn71ACPW1AU', duration: 339.548, title: 'Hotel Oriente', slug: 'hotel-oriente', type: 'film', year: 2025, onTV: true },
  { id: 'iVB2ZU00L1WZDQJpqXrIAMg02Cmq4l6C2kKnP02sNP01CQM', duration: 687.228, title: 'Hotel Oriente — Detrás de Escena', slug: 'hotel-oriente-bts', type: 'short', year: 2025, onTV: true },
  { id: 'IHikcrMnpK00Dxsyb7xKpi1qpju01I00JmCpNXXrhg1WZg', duration: 163.081, title: 'Detective Noir', slug: 'detective-noir', type: 'short', year: 2025, onTV: true },
  { id: 'RUULhR2QDMRZT01YDXggu7WPKI01nzGyzvK1RPwGY3GyQ', duration: 498.499, title: 'Ver para Coger', slug: 'ver-para-coger', type: 'film', year: 2025, onTV: true },
  { id: 'Mqf9GhKKFmd01IH28ITZ00KT4oGLxmr6gvqbNQjGIv301Y', duration: 5563.892, title: 'We Will Rock You', slug: 'we-will-rock-you', type: 'event', year: 2025, onTV: true },
];
const existingIds = new Set(existing.map(e => e.id));

function entry(v) {
  const t = v.title.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `  { id: '${v.id}', duration: ${v.duration}, title: '${t}', slug: '${v.slug || ''}', type: '${v.type || 'other'}', year: ${v.year || 'null'}, onTV: ${v.onTV ? 'true' : 'false'} },`;
}

const newVideos = results.filter(r => r.id && !existingIds.has(r.id)).map(r => ({
  id: r.id, duration: r.duration, title: r.title, slug: '', type: 'other', year: null, onTV: false,
}));

const lines = [
  '// TOXI Media — Catálogo de contenidos en Mux',
  '// Fuente de verdad para tv.html y grillas de contenidos.',
  '//',
  '//   id       → Mux Playback ID (on-demand)',
  '//   duration → Duración en segundos',
  '//   title    → Título de pantalla',
  '//   slug     → Para URLs futuras',
  '//   type     → film | short | series | live | event | other',
  '//   year     → Año de producción',
  '//   onTV     → true = incluido en la playlist del canal',
  '',
  'export const CONTENT = [',
  '',
  '  // ── CURADOS: en el canal ───────────────────────────────────',
  ...existing.map(entry),
  '',
  '  // ── CATÁLOGO: pendientes de clasificar ────────────────────',
  ...newVideos.map(entry),
  '];',
  '',
  '/** Solo los videos marcados onTV: true, en orden para la playlist del canal */',
  'export const TV_PLAYLIST = CONTENT.filter(v => v.onTV && v.title);',
].join('\n');

fs.writeFileSync('C:/Users/JM/Desktop/MUNDO TOXI/src/content.js', lines, 'utf8');
console.log('Listo:', existing.length + newVideos.length, 'videos en content.js');
