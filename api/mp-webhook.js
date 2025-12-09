import mercadopago from 'mercadopago';

// Webhook receiver for Mercado Pago notifications.
// Configure the webhook URL in your Mercado Pago app or via preference.notification_url.
export default async function handler(req, res) {
  // Mercado Pago sends POST; reply 200 quickly to avoid retries.
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Log basic info for debugging (avoid logging sensitive headers in production if not needed).
  try {
    console.log('[TOXI][MP][WH] headers', req.headers);
    console.log('[TOXI][MP][WH] query', req.query);
    console.log('[TOXI][MP][WH] body', req.body);
  } catch (e) {
    console.error('[TOXI][MP][WH] log error', e);
  }

  // Optional: fetch payment detail if topic/type is payment and data.id exists.
  try {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (accessToken) {
      mercadopago.configure({ access_token: accessToken });
      const topic = req.query.topic || req.query.type;
      const dataId = req.query['data.id'] || req.body?.data?.id;
      if (topic === 'payment' && dataId) {
        const payment = await mercadopago.payment.findById(dataId);
        console.log('[TOXI][MP][WH] payment detail', payment.body?.id, payment.body?.status);
      }
    } else {
      console.warn('[TOXI][MP][WH] MP_ACCESS_TOKEN missing; cannot fetch payment detail');
    }
  } catch (err) {
    console.error('[TOXI][MP][WH] error fetching payment', err);
  }

  // Always acknowledge.
  return res.status(200).json({ received: true });
}
