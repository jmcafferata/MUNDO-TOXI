import { MercadoPagoConfig, Preference } from 'mercadopago';

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