export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const streamId = 'HBq00LLAbq5Tep79Vp8Tezjvp68TbvuFaDcbbNiHmmF4';
  const { MUX_TOKEN_ID, MUX_TOKEN_SECRET } = process.env;

  if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
    console.error('Missing MUX_TOKEN_ID or MUX_TOKEN_SECRET environment variables');
    return res.status(500).json({ error: 'Error de configuración del servidor' });
  }

  const credentials = Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString('base64');

  try {
    const response = await fetch(`https://api.mux.com/video/v1/live-streams/${streamId}`, {
      headers: { Authorization: `Basic ${credentials}` },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Mux live status request failed:', response.status, data);
      return res.status(response.status).json({ error: 'No se pudo consultar el estado del live' });
    }

    return res.status(200).json({ status: data.data?.status || 'idle' });
  } catch (error) {
    console.error('Error consulting Mux live status:', error);
    return res.status(500).json({ error: 'No se pudo consultar el estado del live' });
  }
}
