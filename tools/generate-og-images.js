'use strict';
// Genera las imágenes OpenGraph (public/og/*.jpg) una sola vez, a mano.
// Ya NO corre en cada build (ver package.json). Ejecutar manualmente cuando
// cambien fotos/banners: node tools/generate-og-images.js
// Usar --force para regenerar todo aunque ya exista el archivo.

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.join(__dirname, '..');
const projects = JSON.parse(fs.readFileSync(path.join(root, 'public/data/projects.json'), 'utf8'));
const talentos = JSON.parse(fs.readFileSync(path.join(root, 'public/data/talentos.json'), 'utf8'));
const outputDir = path.join(root, 'public', 'og');
const force = process.argv.includes('--force');

async function sourceBuffer(source) {
  if (!source) return null;
  if (source.startsWith('/')) {
    return fs.promises.readFile(path.join(root, 'public', source));
  }
  const response = await fetch(source);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return Buffer.from(await response.arrayBuffer());
}

async function createCard(item, source) {
  const outFile = path.join(outputDir, `${item.slug}.jpg`);
  if (!force && fs.existsSync(outFile)) {
    process.stdout.write(`  [skip] ${item.slug} (ya existe)\n`);
    return;
  }

  let background = sharp({
    create: { width: 1200, height: 630, channels: 3, background: '#111111' }
  });

  try {
    const buffer = await sourceBuffer(source);
    if (buffer) {
      const img = sharp(buffer).rotate();
      background = img.resize(1200, 630, {
        fit: 'contain',
        background: '#111111'
      });
    }
  } catch (error) {
    console.warn(`  [sin imagen] ${item.slug}: ${error.message}`);
  }

  await background
    .jpeg({ quality: 88, progressive: true })
    .toFile(outFile);
  process.stdout.write(`  [og] ${item.slug}\n`);
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  const items = [
    ...projects.filter((item) => item.slug).map((item) => ({ item, source: item.banner || item.card })),
    ...talentos.filter((item) => item.slug).map((item) => ({ item, source: item.banner || item.photo }))
  ];

  for (const { item, source } of items) {
    await createCard(item, source);
  }

  console.log(`\n✓ listo (${items.length} items revisados) en public/og`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
