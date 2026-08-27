'use strict';
/**
 * build-store-images.js
 * Optimiza las fotos de store-source/ con sharp (local, gratis) y arma public/data/store.json.
 * Las imágenes optimizadas quedan en public/store/ y se sirven por el CDN de Vercel,
 * igual que public/og/*.jpg.
 *
 * Convención:
 *   store-source/<slug>/1.jpg, 2.jpg, ...   → fotos del producto, en orden alfabético/numérico
 *   store-source/<slug>/info.json           → { name, price, currency, description, stock, hidden }
 *
 * Atajo: una foto suelta directamente en store-source/ (sin subcarpeta) se organiza
 * sola en store-source/<slug-del-archivo>/1.<ext> — útil para cargar productos de a uno.
 *
 * Si un producto no tiene info.json, se crea uno con hidden:true para que lo completes
 * antes de publicarlo.
 *
 * Uso: node tools/upload-store-images.js
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'store-source');
const PUBLIC_STORE_DIR = path.join(ROOT, 'public', 'store');
const OUTPUT_FILE = path.join(ROOT, 'public', 'data', 'store.json');

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const FULL_WIDTH = 1600;
const THUMB_WIDTH = 480;

function slugify(name) {
  return name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'producto';
}

function defaultInfo(slug) {
  return {
    name: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    price: 0,
    currency: 'ARS',
    description: '',
    stock: 1,
    // el producto no aparece en la tienda hasta que completes esto y saques el hidden
    hidden: true,
  };
}

// Una foto suelta en la raíz de store-source/ se convierte en su propio producto.
function organizeLooseFiles() {
  const entries = fs.readdirSync(SOURCE_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!IMAGE_EXT.has(ext)) continue;

    const slug = slugify(path.basename(entry.name, ext));
    const productDir = path.join(SOURCE_DIR, slug);
    fs.mkdirSync(productDir, { recursive: true });
    fs.renameSync(path.join(SOURCE_DIR, entry.name), path.join(productDir, `1${ext}`));
    console.log(`[organizando] ${entry.name} → store-source/${slug}/1${ext}`);
  }
}

async function buildVariant(inputPath, outputPath, width) {
  await sharp(inputPath)
    .rotate() // respeta la orientación EXIF de fotos sacadas con celular
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(outputPath);
}

async function main() {
  fs.mkdirSync(SOURCE_DIR, { recursive: true });
  organizeLooseFiles();

  const products = [];
  let processedCount = 0;
  let skippedCount = 0;

  const slugs = fs.readdirSync(SOURCE_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  for (const slug of slugs) {
    const dir = path.join(SOURCE_DIR, slug);
    const infoPath = path.join(dir, 'info.json');

    if (!fs.existsSync(infoPath)) {
      fs.writeFileSync(infoPath, JSON.stringify(defaultInfo(slug), null, 2), 'utf8');
      console.log(`[info] Creé ${slug}/info.json — completalo y volvé a correr el script`);
    }

    const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));

    const files = fs.readdirSync(dir)
      .filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    if (files.length === 0) {
      console.log(`[!] ${slug}: no tiene imágenes, la salteo`);
      continue;
    }

    const outDir = path.join(PUBLIC_STORE_DIR, slug);
    fs.mkdirSync(outDir, { recursive: true });

    const images = [];
    for (let i = 0; i < files.length; i++) {
      const inputPath = path.join(dir, files[i]);
      const fullOut = path.join(outDir, `${i + 1}.webp`);
      const thumbOut = path.join(outDir, `${i + 1}-thumb.webp`);
      const stat = fs.statSync(inputPath);

      const upToDate = fs.existsSync(fullOut) && fs.statSync(fullOut).mtimeMs >= stat.mtimeMs;
      if (upToDate) {
        skippedCount++;
      } else {
        await buildVariant(inputPath, fullOut, FULL_WIDTH);
        await buildVariant(inputPath, thumbOut, THUMB_WIDTH);
        processedCount++;
        console.log(`  [ok] ${slug}/${files[i]}`);
      }

      images.push({
        full: `/store/${slug}/${i + 1}.webp`,
        thumb: `/store/${slug}/${i + 1}-thumb.webp`,
      });
    }

    products.push({
      slug,
      name: info.name,
      price: info.price,
      currency: info.currency || 'ARS',
      description: info.description || '',
      stock: info.stock ?? 0,
      hidden: !!info.hidden,
      images,
    });
  }

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(products, null, 2), 'utf8');

  console.log(`\n✓ ${products.length} producto(s) escritos en public/data/store.json`);
  console.log(`  Procesadas: ${processedCount} | Sin cambios: ${skippedCount}`);
  const hiddenCount = products.filter((p) => p.hidden).length;
  if (hiddenCount) {
    console.log(`  ⚠ ${hiddenCount} producto(s) con hidden:true — completá su info.json y sacá el hidden para publicarlos`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
