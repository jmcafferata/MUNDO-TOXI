import { getMoneda } from '../lib/moneda-store.mjs';
import { renderInvalidPage, renderProfilePage } from '../lib/moneda-pages.mjs';

const ID_PATTERN = /^[a-z0-9]{4,64}$/i;
const ACTIVE_STATE = 'activa';

// Landing page propia de la moneda (destino final tras el 302 de api/moneda.js).
// No registra lecturas: eso ya lo hizo api/moneda.js antes de redirigir acá.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).send('Method not allowed');
  }

  const id = (req.query.id || '').toString().trim().toLowerCase();
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (!id || !ID_PATTERN.test(id)) {
    return res.status(200).send(renderInvalidPage('NO_EXISTE'));
  }

  let moneda;
  try {
    moneda = await getMoneda(id);
  } catch (err) {
    console.error('[TOXI][MONEDA][PERFIL] error consultando el ledger', err);
    return res.status(200).send(renderInvalidPage('ERROR'));
  }

  if (!moneda || moneda.estado !== ACTIVE_STATE) {
    return res.status(200).send(renderInvalidPage(moneda ? 'INACTIVA' : 'NO_EXISTE'));
  }

  return res.status(200).send(renderProfilePage(id, moneda));
}
