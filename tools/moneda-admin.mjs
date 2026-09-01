#!/usr/bin/env node
// CLI para administrar el ledger de toximonedas en Vercel KV.
//
// Uso:
//   node tools/moneda-admin.mjs crear --destino "https://wa.me/549..." [--lote L2026-01] [--id a1b2c3d4e5]
//   node tools/moneda-admin.mjs estado <id> <activa|inactiva|pendiente>
//   node tools/moneda-admin.mjs actualizar <id> --destino "https://toxi.media/m/<id>"
//   node tools/moneda-admin.mjs ver <id>
//
// Requiere KV_REST_API_URL y KV_REST_API_TOKEN en el entorno (Vercel KV).

import { randomBytes } from 'crypto';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Node 18 has no --env-file flag; load .env.local manually so KV_REST_API_* are available.
function loadEnvLocal() {
  const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env.local');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, '');
  }
}
loadEnvLocal();

// Dynamic import: moneda-store.mjs reads process.env at import time, so it
// must load *after* loadEnvLocal() runs (static imports are hoisted).
const { getMoneda, upsertMoneda, isKvConfigured } = await import('../lib/moneda-store.mjs');

function generateId() {
  return randomBytes(5).toString('hex'); // 10 caracteres alfanuméricos aleatorios
}

function parseArgs(args) {
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      opts[args[i].slice(2)] = args[i + 1];
      i++;
    }
  }
  return opts;
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);

  if (!isKvConfigured()) {
    console.error('KV no configurado. Definí KV_REST_API_URL y KV_REST_API_TOKEN (Vercel KV) antes de usar este comando.');
    process.exit(1);
  }

  if (command === 'crear') {
    const opts = parseArgs(rest);
    if (!opts.destino) {
      console.error('Falta --destino "https://..."');
      process.exit(1);
    }
    const id = opts.id || generateId();
    const existing = await getMoneda(id);
    if (existing) {
      console.error(`El id "${id}" ya existe.`);
      process.exit(1);
    }
    const record = {
      id_moneda: id,
      estado: opts.estado || 'activa',
      lote_emision: opts.lote || null,
      destino_url: opts.destino,
      accion: opts.accion || null,
      created_at: new Date().toISOString(),
    };
    await upsertMoneda(id, record);
    console.log('Toximoneda creada:');
    console.log(JSON.stringify(record, null, 2));
    console.log(`URL: https://toxi.media/moneda/${id}`);
    return;
  }

  if (command === 'estado') {
    const [id, estado] = rest;
    if (!id || !['activa', 'inactiva', 'pendiente'].includes(estado)) {
      console.error('Uso: estado <id> <activa|inactiva|pendiente>');
      process.exit(1);
    }
    const record = await getMoneda(id);
    if (!record) {
      console.error(`No existe la moneda "${id}".`);
      process.exit(1);
    }
    record.estado = estado;
    await upsertMoneda(id, record);
    console.log(`Estado actualizado: ${id} -> ${estado}`);
    return;
  }

  if (command === 'actualizar') {
    const [id, ...flagArgs] = rest;
    const opts = parseArgs(flagArgs);
    if (!id || (!opts.destino && !opts.accion && !opts.lote)) {
      console.error('Uso: actualizar <id> [--destino <url>] [--accion <valor>] [--lote <lote>]');
      process.exit(1);
    }
    const record = await getMoneda(id);
    if (!record) {
      console.error(`No existe la moneda "${id}".`);
      process.exit(1);
    }
    if (opts.destino) record.destino_url = opts.destino;
    if (opts.accion) record.accion = opts.accion;
    if (opts.lote) record.lote_emision = opts.lote;
    await upsertMoneda(id, record);
    console.log('Toximoneda actualizada:');
    console.log(JSON.stringify(record, null, 2));
    return;
  }

  if (command === 'ver') {
    const [id] = rest;
    const record = await getMoneda(id);
    console.log(record ? JSON.stringify(record, null, 2) : `No existe la moneda "${id}".`);
    return;
  }

  console.log('Comandos: crear --destino <url> [--id id] [--lote lote] [--estado activa]');
  console.log('          estado <id> <activa|inactiva|pendiente>');
  console.log('          actualizar <id> [--destino <url>] [--accion <valor>] [--lote <lote>]');
  console.log('          ver <id>');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
