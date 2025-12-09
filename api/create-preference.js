import { MercadoPagoConfig, Preference } from 'mercadopago';

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
