export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { MUX_TOKEN_ID, MUX_TOKEN_SECRET } = process.env;
  if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
    console.error('Missing MUX_TOKEN_ID or MUX_TOKEN_SECRET environment variables');
    return res.status(500).json({ error: 'Error de configuración del servidor' });
  }

  const credentials = Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString('base64');
  const params = new URLSearchParams({
    'group_by': 'playback_id',
    'timeframe[]': '30:days',
    limit: '10',
    order_by: 'views',
    order_direction: 'desc',
  });

  try {
    const response = await fetch(`https://api.mux.com/data/v1/metrics/views/breakdown?${params}`, {
      headers: { Authorization: `Basic ${credentials}` },
    });
    const result = await response.json();

    if (!response.ok) {
      console.error('Mux most-viewed request failed:', response.status, result);
      return res.status(response.status).json({ error: 'No se pudo consultar el ranking de videos' });
    }

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json((result.data || [])
      .map(row => ({ playbackId: row.field, views: row.views ?? row.value ?? 0 }))
      .filter(row => row.playbackId && row.views > 0));
  } catch (error) {
    console.error('Error consulting Mux most-viewed videos:', error);
    return res.status(500).json({ error: 'No se pudo consultar el ranking de videos' });
  }
}