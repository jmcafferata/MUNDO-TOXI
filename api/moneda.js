import { getMoneda, logScan } from '../lib/moneda-store.mjs';
import { renderInvalidPage } from '../lib/moneda-pages.mjs';

const ID_PATTERN = /^[a-z0-9]{4,64}$/i;
const ACTIVE_STATE = 'activa';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).send('Method not allowed');
  }

  const id = (req.query.id || '').toString().trim().toLowerCase();

  if (!id || !ID_PATTERN.test(id)) {
    console.warn('[TOXI][MONEDA] id malformado', { id });
    return sendInvalid(res, 'NO_EXISTE');
  }

  let moneda;
  try {
    moneda = await getMoneda(id);
  } catch (err) {
    console.error('[TOXI][MONEDA] error consultando el ledger', err);
    return sendInvalid(res, 'ERROR');
  }

  if (!moneda || moneda.estado !== ACTIVE_STATE) {
    console.warn('[TOXI][MONEDA] escaneo rechazado', { id, estado: moneda?.estado || 'inexistente' });
    return sendInvalid(res, moneda ? 'INACTIVA' : 'NO_EXISTE');
  }

  const destino = moneda.destino_url || moneda.accion;
  if (!destino) {
    console.error('[TOXI][MONEDA] moneda activa sin destino configurado', { id });
    return sendInvalid(res, 'ERROR');
  }

  try {
    await logScan(id, {
      ip: req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.socket?.remoteAddress || null,
      userAgent: req.headers['user-agent'] || null,
      loteEmision: moneda.lote_emision || null,
    });
  } catch (err) {
    console.error('[TOXI][MONEDA] error registrando la lectura', err);
  }

  res.setHeader('Cache-Control', 'no-store');
  res.writeHead(302, { Location: destino });
  return res.end();
}

function sendInvalid(res, reason) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send(renderInvalidPage(reason));
}

