import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { findCreditPack } from '../src/credits-config.mjs';

const COLLAB_MIN_AMOUNT = 500;
const COLLAB_MAX_AMOUNT = 1000000;

// Voluntary contribution to Audion't (kept in this function to stay under Vercel's function limit).
async function createAudiontCollaboration(req, res, client) {
  const amount = Number(req.body?.amount);
  if (!Number.isInteger(amount) || amount < COLLAB_MIN_AMOUNT || amount > COLLAB_MAX_AMOUNT) {
    return res.status(400).json({
      error: `El monto debe ser un número entero entre $${COLLAB_MIN_AMOUNT} y $${COLLAB_MAX_AMOUNT}`
    });
  }

  const baseUrl = process.env.SITE_URL || (req.headers.host ? `https://${req.headers.host}` : 'https://www.toxi.media');

  try {
    const preference = await new Preference(client).create({
      body: {
        items: [
          {
            id: 'audiont-colaboracion',
            title: "Colaboración con Audion't",
            description: "Aporte voluntario para sostener Audion't",
            category_id: 'services',
            quantity: 1,
            currency_id: 'ARS',
            unit_price: amount
          }
        ],
        statement_descriptor: 'AUDIONT',
        external_reference: `audiont_colaboracion_${Date.now()}`,
        back_urls: {
          success: `${baseUrl}/audiont?colaboracion=ok#colaborar`,
          failure: `${baseUrl}/audiont?colaboracion=error#colaborar`,
          pending: `${baseUrl}/audiont?colaboracion=pendiente#colaborar`
        },
        auto_return: 'approved',
        notification_url: process.env.MP_WEBHOOK_URL || `${baseUrl}/api/mp-webhook`
      }
    });

    const initPoint = preference?.init_point || preference?.body?.init_point;
    if (!initPoint) {
      return res.status(502).json({ error: 'Mercado Pago no devolvió un link de pago' });
    }
    return res.status(200).json({ initPoint });
  } catch (error) {
    console.error('[TOXI][MP][AUDIONT] error creando preferencia', error?.message || error);
    return res.status(500).json({ error: 'No se pudo generar el link de pago' });
  }
}

// ── Créditos de reproducción ──
// También viven en esta función para no sumar otra al límite de Vercel.
const CREDITS_REFERENCE_PREFIX = 'toxi_credits_';
const RETURN_PATH_RE = /^\/[A-Za-z0-9/_-]{0,100}$/;

// Arma el link de pago de Mercado Pago para un paquete de créditos.
// El precio sale de CREDIT_PACKS (servidor); el cliente solo elige el paquete.
async function createCreditsPreference(req, res, client) {
  const pack = findCreditPack(req.body?.pack);
  if (!pack) {
    return res.status(400).json({ error: 'Paquete de créditos inválido' });
  }

  const baseUrl = process.env.SITE_URL || (req.headers.host ? `https://${req.headers.host}` : 'https://www.toxi.media');
  const requestedPath = String(req.body?.returnPath || '');
  const returnPath = RETURN_PATH_RE.test(requestedPath) ? requestedPath : '/content';
  const returnUrl = (result) => `${baseUrl}${returnPath}?creditos=${result}`;

  try {
    const preference = await new Preference(client).create({
      body: {
        items: [
          {
            id: `toxi-creditos-${pack.id}`,
            title: `${pack.credits} créditos TOXI Media`,
            description: `${pack.credits} minutos de reproducción en TOXI Media`,
            category_id: 'services',
            quantity: 1,
            currency_id: 'ARS',
            unit_price: pack.price
          }
        ],
        statement_descriptor: 'TOXI MEDIA',
        external_reference: `${CREDITS_REFERENCE_PREFIX}${pack.id}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
        back_urls: {
          success: returnUrl('ok'),
          failure: returnUrl('error'),
          pending: returnUrl('pendiente')
        },
        auto_return: 'approved',
        notification_url: process.env.MP_WEBHOOK_URL || `${baseUrl}/api/mp-webhook`
      }
    });

    const initPoint = preference?.init_point || preference?.body?.init_point;
    if (!initPoint) {
      return res.status(502).json({ error: 'Mercado Pago no devolvió un link de pago' });
    }
    return res.status(200).json({ initPoint });
  } catch (error) {
    console.error('[TOXI][MP][CREDITOS] error creando preferencia', error?.message || error);
    return res.status(500).json({ error: 'No se pudo generar el link de pago' });
  }
}

// Consulta un pago en Mercado Pago y dice cuántos créditos corresponden.
// Solo devuelve créditos si el pago está aprobado, es de un paquete de créditos
// y el monto cobrado coincide con el precio del paquete.
async function confirmCreditsPayment(req, res, client) {
  const paymentId = String(req.body?.paymentId ?? '');
  if (!/^\d{1,24}$/.test(paymentId)) {
    return res.status(400).json({ error: 'paymentId inválido' });
  }

  let payment;
  try {
    const response = await new Payment(client).get({ id: paymentId });
    payment = response?.body ?? response;
  } catch (error) {
    const status = error?.status || error?.response?.status;
    if (status === 404) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }
    console.error('[TOXI][MP][CREDITOS] error consultando pago', paymentId, error?.message || error);
    return res.status(502).json({ error: 'No se pudo consultar el pago' });
  }

  const reference = String(payment?.external_reference || '');
  const packId = reference.startsWith(CREDITS_REFERENCE_PREFIX)
    ? reference.slice(CREDITS_REFERENCE_PREFIX.length).split('_')[0]
    : null;
  const pack = findCreditPack(packId);
  if (!pack) {
    return res.status(400).json({ error: 'El pago no corresponde a una compra de créditos' });
  }

  const status = payment?.status || 'unknown';
  if (status !== 'approved') {
    return res.status(200).json({ paymentId, status, credits: 0 });
  }

  if (payment?.currency_id !== 'ARS' || Number(payment?.transaction_amount) < pack.price) {
    console.warn('[TOXI][MP][CREDITOS] monto no coincide', paymentId, payment?.transaction_amount, payment?.currency_id);
    return res.status(400).json({ error: 'El monto del pago no coincide con el paquete' });
  }

  return res.status(200).json({ paymentId, status, credits: pack.credits });
}

// Serverless function for Vercel to create a Mercado Pago preference.
// Requires env var MP_ACCESS_TOKEN (never expose to client).
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    return res.status(500).json({ error: 'MP_ACCESS_TOKEN missing on server' });
  }

  if (req.body?.purpose === 'audiont-colaboracion') {
    return createAudiontCollaboration(req, res, new MercadoPagoConfig({ accessToken }));
  }
  if (req.body?.purpose === 'creditos') {
    return createCreditsPreference(req, res, new MercadoPagoConfig({ accessToken }));
  }
  if (req.body?.purpose === 'creditos-confirmar') {
    return confirmCreditsPayment(req, res, new MercadoPagoConfig({ accessToken }));
  }

  const { successUrl, failUrl, title = 'Pase diario TOXI', price = 100 } = req.body || {};

  if (!successUrl || !failUrl) {
    return res.status(400).json({ error: 'successUrl and failUrl are required' });
  }

  const client = new MercadoPagoConfig({ accessToken });
  const preferenceClient = new Preference(client);

  const host = req.headers.host ? `https://${req.headers.host}` : undefined;
  const notificationUrl = process.env.MP_WEBHOOK_URL || (host ? `${host}/api/mp-webhook` : undefined);

  const preference = {
    items: [
      {
        title,
        quantity: 1,
        currency_id: 'ARS',
        unit_price: Number(price) || 100
      }
    ],
    back_urls: {
      success: successUrl,
      failure: failUrl,
      pending: failUrl
    },
    auto_return: 'approved',
    notification_url: notificationUrl
  };

  try {
    console.log('[TOXI][MP] creando preferencia', preference);
    const response = await preferenceClient.create({ body: preference });
    const preferenceId = response?.id || response?.body?.id;
    const initPoint = response?.init_point || response?.body?.init_point;
    console.log('[TOXI][MP] preferencia creada', preferenceId);
    return res.status(200).json({ preferenceId, initPoint });
  } catch (error) {
    const mpMessage = error?.response?.body?.message || error?.message || 'Unknown error';
    const mpStatus = error?.status || error?.response?.status || 500;
    console.error('[TOXI][MP] error creando preferencia', mpStatus, mpMessage, error);
    return res.status(500).json({ error: 'Failed to create preference', detail: mpMessage, status: mpStatus });
  }
}