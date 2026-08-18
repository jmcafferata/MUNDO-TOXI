'use strict';
/**
 * generate-static.js
 * Genera un public/[slug]/index.html por cada proyecto y talento.
 * Cada página tiene sus propios <title>, <meta description> y og: tags,
 * pero contiene la misma app interactiva que plantform.html.
 *
 * Uso: node generate-static.js
 * Se ejecuta antes de vite build (ver package.json "build" script).
 */
const fs   = require('fs');
const path = require('path');

const projects = JSON.parse(fs.readFileSync('public/data/projects.json', 'utf8'));
const talentos = JSON.parse(fs.readFileSync('public/data/talentos.json', 'utf8'));

// Usamos el fuente (no el build) para preservar rutas absolutas
const template = fs.readFileSync('plantform.html', 'utf8');

const BASE_URL = 'https://www.toxi.media';

function attr(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function generatePage(slug, title, description, image) {
  const fullTitle = `${title} — TOXI Media`;
  // strip any HTML tags from description (Webflow rich text)
  const desc = (description || '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
  const img = image
    ? (image.startsWith('http')
      ? image
      : image.startsWith('/')
        ? `${BASE_URL}${image}`
        : `${BASE_URL}/${image}`)
    : `${BASE_URL}/toxi-media-og.jpg`;
  const url  = `${BASE_URL}/${slug}`;

  return template
    .replace(/<title>[^<]*<\/title>/,
      `<title>${attr(fullTitle)}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/,
      `<meta name="description" content="${attr(desc)}" />`)
    .replace(/<meta property="og:title" content="[^"]*" \/>/,
      `<meta property="og:title" content="${attr(fullTitle)}" />`)
    .replace(/<meta property="og:description" content="[^"]*" \/>/,
      `<meta property="og:description" content="${attr(desc)}" />`)
    .replace(/<meta property="og:image" content="[^"]*" \/>/,
      `<meta property="og:image" content="${attr(img)}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*" \/>/,
      `<meta name="twitter:title" content="${attr(fullTitle)}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*" \/>/,
      `<meta name="twitter:description" content="${attr(desc)}" />`)
    .replace(/<meta name="twitter:image" content="[^"]*" \/>/,
      `<meta name="twitter:image" content="${attr(img)}" />`)
    // inject canonical + og:url just before </head>
    .replace('</head>',
      `  <link rel="canonical" href="${attr(url)}" />\n  <meta property="og:url" content="${attr(url)}" />\n</head>`);
}

function toIsoDate(date = new Date()) {
  return date.toISOString().split('T')[0];
}

function buildSitemap(urls) {
  const lastmod = toIsoDate();
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  ];

  for (const url of urls) {
    lines.push('  <url>');
    lines.push(`    <loc>${attr(url)}</loc>`);
    lines.push(`    <lastmod>${lastmod}</lastmod>`);
    lines.push('  </url>');
  }

  lines.push('</urlset>');
  return `${lines.join('\n')}\n`;
}

let count = 0;

for (const p of projects) {
  if (!p.slug) continue;
  const dir = path.join('public', p.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'index.html'),
    generatePage(p.slug, p.name, p.contenido || p.description, p.banner || p.card),
    'utf8'
  );
  count++;
  process.stdout.write(`  [proyecto] ${p.slug}\n`);
}

for (const t of talentos) {
  if (!t.slug) continue;
  const dir = path.join('public', t.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'index.html'),
    generatePage(t.slug, t.name, t.contenido || t.description || t.quote, t.banner || t.photo),
    'utf8'
  );
  count++;
  process.stdout.write(`  [talento]  ${t.slug}\n`);
}

const slugSet = new Set();

for (const p of projects) {
  if (p.slug) slugSet.add(p.slug);
}

for (const t of talentos) {
  if (t.slug) slugSet.add(t.slug);
}

const sitemapUrls = [
  `${BASE_URL}/`,
  `${BASE_URL}/index.html`,
  `${BASE_URL}/main.html`,
  `${BASE_URL}/avenida-q`,
  ...Array.from(slugSet).sort().map((slug) => `${BASE_URL}/${slug}`)
];

fs.writeFileSync('public/sitemap.xml', buildSitemap(sitemapUrls), 'utf8');

const robotsTxt = [
  'User-agent: *',
  'Allow: /',
  '',
  `Sitemap: ${BASE_URL}/sitemap.xml`,
  ''
].join('\n');

fs.writeFileSync('public/robots.txt', robotsTxt, 'utf8');

console.log(`\n✓ ${count} páginas generadas en public/[slug]/index.html`);
console.log(`✓ Sitemap generado con ${sitemapUrls.length} URLs en public/sitemap.xml`);
console.log('✓ Robots generado en public/robots.txt');
