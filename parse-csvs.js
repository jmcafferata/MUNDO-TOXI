// Script to parse Webflow CSV exports and generate JSON data for plantform
const { readFileSync, writeFileSync, mkdirSync } = require('fs');
const { join } = require('path');

function parseCSV(text) {
  const lines = [];
  let current = '';
  let inQuotes = false;
  let row = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"' && inQuotes && next === '"') {
      current += '"';
      i++;
    } else if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      row.push(current);
      current = '';
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && next === '\n') i++;
      row.push(current);
      current = '';
      if (row.some(c => c !== '')) lines.push(row);
      row = [];
    } else {
      current += ch;
    }
  }
  if (current || row.length) {
    row.push(current);
    if (row.some(c => c !== '')) lines.push(row);
  }

  if (lines.length === 0) return [];
  const headers = lines[0];
  return lines.slice(1).map(cols => {
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (cols[i] || '').trim(); });
    return obj;
  });
}

mkdirSync(join(__dirname, 'public/data'), { recursive: true });

// Parse Projects
const projectsRaw = parseCSV(readFileSync(
  join(__dirname, 'webflow-exports/TOXI _ Pasión por resolver - Projects - 62e2e71cb4e3ff4e29ff1d8d.csv'),
  'utf8'
));
const projects = projectsRaw
  .filter(r => r.Archived === 'false' && r.Draft === 'false')
  .map(r => ({
    name: r.Name,
    slug: r.Slug,
    description: r.Descripción || '',
    contenido: r.Contenido || '',
    card: r.Card || '',
    banner: r.Banner || '',
    thumbnail: r['Thumbnail de galería'] || r.Card || '',
    talentos: r.Talentos ? r.Talentos.split(';').map(s => s.trim()).filter(Boolean) : [],
    formato: r.Formato || '',
    credits: r.Créditos || '',
    web: r['Web propia'] || '',
    categoria: r['Categoría'] || '',
  }));

writeFileSync(join(__dirname, 'public/data/projects.json'), JSON.stringify(projects, null, 2));
console.log(`Projects written: ${projects.length}`);

// Parse Talentos
const talentosRaw = parseCSV(readFileSync(
  join(__dirname, 'webflow-exports/TOXI _ Pasión por resolver - TOXI Talentos - 6507d04e9323df393ea822d0.csv'),
  'utf8'
));
const talentos = talentosRaw
  .filter(r => r.Archived === 'false' && r.Draft === 'false')
  .map(r => ({
    name: r.Nombre,
    slug: r.Slug,
    description: r.Descripción || '',
    contenido: r.Contenido || '',
    photo: r.Foto || '',
    banner: r.Banner || '',
    quote: r.Cita || '',
    proyectos: r.Proyectos ? r.Proyectos.split(';').map(s => s.trim()).filter(Boolean) : [],
    formatos: r.Formatos ? r.Formatos.split(';').map(s => s.trim()).filter(Boolean) : [],
    web: r['Web externa'] || '',
  }));

writeFileSync(join(__dirname, 'public/data/talentos.json'), JSON.stringify(talentos, null, 2));
console.log(`Talentos written: ${talentos.length}`);

// Parse Formatos
const formatosRaw = parseCSV(readFileSync(
  join(__dirname, 'webflow-exports/TOXI _ Pasión por resolver - Formatos - 62e2e73d0c1b97b16d0a4b13.csv'),
  'utf8'
));
const formatos = formatosRaw
  .filter(r => r.Archived === 'false' && r.Draft === 'false')
  .map(r => ({
    name: r.Name,
    slug: r.Slug,
    icon: r.Icono || '',
    id: r.Formato || '',
  }));

writeFileSync(join(__dirname, 'public/data/formatos.json'), JSON.stringify(formatos, null, 2));
console.log(`Formatos written: ${formatos.length}`);
console.log('Done! JSON files written to public/data/');
