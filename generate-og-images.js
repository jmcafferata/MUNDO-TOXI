'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const projects = JSON.parse(fs.readFileSync('public/data/projects.json', 'utf8'));
const talentos = JSON.parse(fs.readFileSync('public/data/talentos.json', 'utf8'));
const outputDir = path.join('public', 'og');

function xml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrap(text, maxLength, maxLines) {
  const words = String(text || '').split(/\s+/);
  const lines = [];
  let line = '';

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= maxLength || !line) {
      line = next;
    } else {
      lines.push(line);
      line = word;
      if (lines.length === maxLines - 1) break;
    }
  }

  if (line && lines.length < maxLines) lines.push(line);
  if (words.join(' ').length > lines.join(' ').length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[. ]+$/, '')}…`;
  }
  return lines;
}

function titleSvg(title) {
  const lines = wrap(title, 25, 3);
  const text = lines.map((line, index) =>
    `<text x="72" y="${312 + index * 72}" font-family="Helvetica, Arial, sans-serif" font-size="58" font-weight="700" fill="#ffffff">${xml(line)}</text>`
  ).join('');

  return Buffer.from(`
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="rgba(0,0,0,0.52)" />
      <rect x="72" y="136" width="58" height="4" fill="#ffffff" />
      <text x="72" y="190" font-family="Helvetica, Arial, sans-serif" font-size="23" letter-spacing="4" fill="#ffffff">TOXI MEDIA</text>
      ${text}
      <text x="72" y="558" font-family="Helvetica, Arial, sans-serif" font-size="25" font-weight="700" fill="#ffffff">EXPLORÁ EN TOXI MEDIA</text>
    </svg>
  `);
}

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
    .composite([{ input: titleSvg(item.name), top: 0, left: 0 }])
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