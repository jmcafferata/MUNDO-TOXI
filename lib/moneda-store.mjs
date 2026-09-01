import { Redis } from '@upstash/redis';
import { promises as fs } from 'fs';
import path from 'path';

// Ledger backend: Vercel KV in production, a local JSON file as read-only
// fallback for dev/preview environments without KV configured.
const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

const kv = KV_URL && KV_TOKEN ? new Redis({ url: KV_URL, token: KV_TOKEN }) : null;

const LEDGER_PATH = path.join(process.cwd(), 'data', 'monedas.json');
const MAX_SCAN_HISTORY = 500;

const keyFor = (id) => `moneda:${id}`;
const scansKeyFor = (id) => `moneda:${id}:scans`;

async function readLedgerFile() {
  try {
    const raw = await fs.readFile(LEDGER_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function isKvConfigured() {
  return !!kv;
}

export async function getMoneda(id) {
  if (!id) return null;
  if (kv) return (await kv.get(keyFor(id))) || null;
  const ledger = await readLedgerFile();
  return ledger[id] || null;
}

// Only available when KV is configured; the file ledger is read-only.
export async function upsertMoneda(id, record) {
  if (!kv) {
    throw new Error('KV no configurado (KV_REST_API_URL / KV_REST_API_TOKEN). No se pueden crear ni actualizar toximonedas.');
  }
  await kv.set(keyFor(id), record);
}

export async function logScan(id, meta) {
  if (!kv) return; // sin KV no hay dónde persistir el historial de lecturas
  await kv.lpush(scansKeyFor(id), JSON.stringify({ ...meta, ts: new Date().toISOString() }));
  await kv.ltrim(scansKeyFor(id), 0, MAX_SCAN_HISTORY - 1);
}

export async function getScans(id, limit = 50) {
  if (!kv) return [];
  const raw = await kv.lrange(scansKeyFor(id), 0, limit - 1);
  return raw.map((entry) => {
    try {
      return typeof entry === 'string' ? JSON.parse(entry) : entry;
    } catch {
      return null;
    }
  }).filter(Boolean);
}
