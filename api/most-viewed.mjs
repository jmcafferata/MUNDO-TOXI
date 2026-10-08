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
  const rows = [];
  const limit = 100;

  try {
    let totalRows = Infinity;
    for (let page = 1; rows.length < totalRows; page += 1) {
      const params = new URLSearchParams({
        group_by: 'playback_id',
        'timeframe[]': '30:days',
        limit: String(limit),
        page: String(page),
        order_by: 'views',
        order_direction: 'desc',
      });
      const response = await fetch(`https://api.mux.com/data/v1/metrics/views/breakdown?${params}`, {
        headers: { Authorization: `Basic ${credentials}` },
      });
      const result = await response.json();

      if (!response.ok) {
        console.error('Mux most-viewed request failed:', response.status, result);
        return res.status(response.status).json({ error: 'No se pudo consultar el ranking de videos' });
      }

      const pageRows = result.data || [];
      rows.push(...pageRows);
      totalRows = Number(result.total_row_count);
      if (!pageRows.length || pageRows.length < limit || !Number.isFinite(totalRows)) break;
    }

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json(rows
      .map(row => ({
        playbackId: row.field,
        views: Number(row.views ?? row.value ?? 0),
        totalPlayingTime: Number(row.total_playing_time ?? 0),
      }))
      .filter(row => row.playbackId && row.views > 0));
  } catch (error) {
    console.error('Error consulting Mux most-viewed videos:', error);
    return res.status(500).json({ error: 'No se pudo consultar el ranking de videos' });
  }
}