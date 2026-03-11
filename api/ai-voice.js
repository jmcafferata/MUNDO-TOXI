import path from 'path';
import { promises as fs } from 'fs';
import { GoogleGenAI } from '@google/genai';

// Strip HTML tags for cleaner context
function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function buildContext(projects, talentos, formatos) {
  const formatNames = Object.fromEntries(formatos.map(f => [f.id, f.name]));

  const projectLines = projects.map(p =>
    `• ${p.name} (${formatNames[p.formato] || p.formato}): ${p.description || stripHtml(p.contenido).slice(0, 200)}`
  ).join('\n');

  const talentoLines = talentos.map(t =>
    `• ${t.name} — ${t.quote || ''}: proyectos: ${(t.proyectos || []).join(', ')}`
  ).join('\n');

  return `PROYECTOS DE TOXI MEDIA:\n${projectLines}\n\nTALENTOS:\n${talentoLines}\n\nFORMATOS: ${formatos.map(f => f.name).join(', ')}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const { text } = req.body || {};
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'text is required' });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const elevenKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || 'EWuYor4DRBqsavX9uOKT';

  if (!geminiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  if (!elevenKey) return res.status(500).json({ error: 'ELEVENLABS_API_KEY not configured' });

  // Load platform data
  const dataDir = path.join(process.cwd(), 'public', 'data');
  const [projects, talentos, formatos] = await Promise.all([
    fs.readFile(path.join(dataDir, 'projects.json'), 'utf8').then(JSON.parse),
    fs.readFile(path.join(dataDir, 'talentos.json'), 'utf8').then(JSON.parse),
    fs.readFile(path.join(dataDir, 'formatos.json'), 'utf8').then(JSON.parse),
  ]);

  const context = buildContext(projects, talentos, formatos);
  const prompt = `Eres el asistente de TOXI Media. Tenés acceso a todo el contenido de la plataforma Plantform. Respondé en español, de forma conversacional, breve y entusiasta (máximo 3 oraciones). Solo hablá de lo que hay en la plataforma.\n\nCONTENIDO DE LA PLATAFORMA:\n${context}\n\nEl usuario dice: "${text.trim()}"`;

  // Call Gemini via @google/genai SDK
  const ai = new GoogleGenAI({ apiKey: geminiKey });
  let responseText;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: prompt,
      config: { temperature: 0.8, maxOutputTokens: 300 },
    });
    responseText = response.text;
  } catch (err) {
    console.error('Gemini error:', err.message);
    return res.status(502).json({ error: 'Gemini API error', detail: err.message });
  }

  if (!responseText) responseText = 'No pude generar una respuesta.';

  // Call ElevenLabs
  const elRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'xi-api-key': elevenKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: responseText,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });

  if (!elRes.ok) {
    const err = await elRes.text();
    console.error('ElevenLabs error:', err);
    return res.status(502).json({ error: 'ElevenLabs API error', detail: err });
  }

  const audioBuffer = Buffer.from(await elRes.arrayBuffer());

  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('X-Response-Text', encodeURIComponent(responseText.slice(0, 500)));
  res.send(audioBuffer);
}
