'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const projects = JSON.parse(fs.readFileSync('public/data/projects.json', 'utf8'));
const talentos = JSON.parse(fs.readFileSync('public/data/talentos.json', 'utf8'));
const outputDir = path.join('public', 'og');

async function sourceBuffer(source) {
  if (!source) return null;
  if (source.startsWith('/')) {
    return fs.promises.readFile(path.join('public', source));
  }
  const response = await fetch(source);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return Buffer.from(await response.arrayBuffer());
}

async function createCard(item, source) {
  let background = sharp({
    create: { width: 1200, height: 630, channels: 3, background: '#111111' }
  });

  try {
    const buffer = await sourceBuffer(source);
    if (buffer) {
      background = sharp(buffer).rotate().resize(1200, 630, { fit: 'cover', position: 'attention' });
    }
  } catch (error) {
    console.warn(`  [sin imagen] ${item.slug}: ${error.message}`);
  }

  await background
    .jpeg({ quality: 88, progressive: true })
    .toFile(path.join(outputDir, `${item.slug}.jpg`));
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  const items = [
    ...projects.filter((item) => item.slug).map((item) => ({ item, source: item.banner || item.card })),
    ...talentos.filter((item) => item.slug).map((item) => ({ item, source: item.photo || item.banner }))
  ];

  for (const { item, source } of items) {
    await createCard(item, source);
    process.stdout.write(`  [og] ${item.slug}\n`);
  }

  console.log(`\n✓ ${items.length} imágenes sociales generadas en public/og`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});