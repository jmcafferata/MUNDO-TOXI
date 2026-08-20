import path from 'path';
import { promises as fs } from 'fs';
import { GoogleGenAI } from '@google/genai';
import { PLAYLIST } from './playlist.mjs';

// ─── SCHEDULE ───────────────────────────────────────────────
const SCHEDULE_EPOCH = 1767225600; // 2026-01-01T00:00:00Z

function buildSchedule() {
  const totalDuration = PLAYLIST.reduce((a, b) => a + b.duration, 0);
  const nowSec = Date.now() / 1000;
  const elapsed = ((nowSec - SCHEDULE_EPOCH) % totalDuration + totalDuration) % totalDuration;
  const cycleStart = nowSec - elapsed; // unix seconds when current cycle began

  // Argentina = UTC-3
  const TZ_OFFSET_SEC = -3 * 3600;

  function toHHMM(unixSec) {
    const d = new Date((unixSec + TZ_OFFSET_SEC) * 1000);
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  let pos = 0;
  let currentTitle = '';
  const lines = [];
  for (const item of PLAYLIST) {
    const startSec = cycleStart + pos;
    const endSec = startSec + item.duration;
    const isCurrent = nowSec >= startSec && nowSec < endSec;
    const marker = isCurrent ? ' ← AHORA' : '';
    lines.push(`${toHHMM(startSec)} - ${item.title}${marker}`);
    if (isCurrent) currentTitle = item.title;
    pos += item.duration;
  }

  return `PROGRAMACIÓN EN VIVO (hora Argentina):\nAhora está pasando: ${currentTitle}\n${lines.join('\n')}`;
}
// ────────────────────────────────────────────────────────────

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
  const schedule = buildSchedule();
  const prompt = `Sos el guía espiritual de TOXI Media. Hablás con la sabiduría, calma y profundidad de Mahatma Gandhi — usás metáforas simples, hablas de la verdad, la creatividad como fuerza no violenta, y el arte como camino de transformación. Respondé en el idioma del usuario, de forma breve (máximo 3 oraciones), reflexiva y con una pizca de humor gentil. Solo hablá de lo que hay en la plataforma. Si te preguntan qué están dando o a qué hora pasan algo, consultá la grilla de programación. IMPORTANTE: los títulos de los programas en la grilla pueden sonar a comida, personas famosas, lugares u otras cosas — siempre buscá si alguna palabra de la pregunta del usuario aparece en algún título de la grilla antes de decir que algo no está en la plataforma. Por ejemplo, si preguntan por "pizza y pagni", buscá esas palabras en los títulos de la grilla.\n\nCONTENIDO DE LA PLATAFORMA:\n${context}\n\n${schedule}\n\nEl usuario dice: "${text.trim()}"`;

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
    // Fall back to returning text so the client can use browser TTS
    return res.status(200).json({ text: responseText, tts_fallback: true });
  }

  const audioBuffer = Buffer.from(await elRes.arrayBuffer());

  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('X-Response-Text', encodeURIComponent(responseText.slice(0, 500)));
  res.send(audioBuffer);
}
