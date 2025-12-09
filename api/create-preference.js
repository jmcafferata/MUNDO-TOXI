import mercadopago from 'mercadopago';

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

  mercadopago.configure({ access_token: accessToken });

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
    auto_return: 'approved'
  };

  try {
    const response = await mercadopago.preferences.create(preference);
    return res.status(200).json({ preferenceId: response.body.id, initPoint: response.body.init_point });
  } catch (error) {
    console.error('MP preference error', error);
    return res.status(500).json({ error: 'Failed to create preference' });
  }
}
