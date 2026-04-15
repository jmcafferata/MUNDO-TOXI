export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY no configurada en el servidor.' });
  }

  const { file, name, type } = req.body || {};
  if (!file || typeof file !== 'string') {
    return res.status(400).json({ error: 'Se requiere el campo "file" en base64.' });
  }

  let buffer;
  try {
    buffer = Buffer.from(file, 'base64');
  } catch {
    return res.status(400).json({ error: 'El archivo base64 no es válido.' });
  }

  const mimeType = type || 'audio/mpeg';
  const filename = name || 'audio.mp3';

  const form = new FormData();
  const blob = new Blob([buffer], { type: mimeType });
  form.append('file', blob, filename);
  form.append('model', 'whisper-large-v3-turbo');
  form.append('response_format', 'json');

  let groqRes;
  try {
    groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${groqKey}` },
      body: form,
    });
  } catch (err) {
    return res.status(502).json({ error: 'No se pudo conectar con Groq.', detail: err.message });
  }

  if (!groqRes.ok) {
    const detail = await groqRes.text();
    return res.status(502).json({ error: 'Error en Groq.', detail });
  }

  const data = await groqRes.json();
  return res.status(200).json({ text: data.text });
}
