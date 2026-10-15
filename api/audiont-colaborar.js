import { MercadoPagoConfig, Preference } from 'mercadopago';

// Creates a Mercado Pago payment link for voluntary contributions to Audion't.
// Requires env var MP_ACCESS_TOKEN.
const MIN_AMOUNT = 500;
const MAX_AMOUNT = 1000000;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    return res.status(500).json({ error: 'MP_ACCESS_TOKEN missing on server' });
  }

  const amount = Number(req.body?.amount);
  if (!Number.isInteger(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
    return res.status(400).json({
      error: `El monto debe ser un número entero entre $${MIN_AMOUNT} y $${MAX_AMOUNT}`
    });
  }

  const baseUrl = process.env.SITE_URL || (req.headers.host ? `https://${req.headers.host}` : 'https://www.toxi.media');

  try {
    const preference = await new Preference(new MercadoPagoConfig({ accessToken })).create({
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
