'use strict';
// Script de un solo uso: limpia el texto "foto de referencia" y sube precios drásticamente (x10).
const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, '..', 'store-source');
const NOTE = 'Foto de referencia (estante) — falta reemplazar por foto del producto solo.';
const MULTIPLIER = 10;

const dirs = fs.readdirSync(SOURCE_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

let updated = 0;
for (const slug of dirs) {
  const infoPath = path.join(SOURCE_DIR, slug, 'info.json');
  if (!fs.existsSync(infoPath)) continue;

  const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
  info.description = info.description.replace(NOTE, '').replace(/\s{2,}/g, ' ').trim();
  info.price = Math.round(info.price * MULTIPLIER);
  fs.writeFileSync(infoPath, JSON.stringify(info, null, 2), 'utf8');
  updated++;
}

console.log(`\n✓ ${updated} info.json actualizados (nota quitada, precio x${MULTIPLIER})`);
