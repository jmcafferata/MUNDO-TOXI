import path from 'path';
import { promises as fs } from 'fs';
import { GoogleGenAI } from '@google/genai';

// ─── SCHEDULE ───────────────────────────────────────────────
const SCHEDULE_EPOCH = 1767225600; // 2026-01-01T00:00:00Z
const SCHEDULE_PLAYLIST = [
  { duration: 339.548,     title: 'Hotel Oriente — Las Nenas' },
  { duration: 687.228,     title: 'Hotel Oriente (Detrás de Escena) — Las Nenas' },
  { duration: 163.081,     title: 'Detective Noir — Chavo Escrotito' },
  { duration: 498.499,     title: 'Ver para Coger — Juan Manuel Cafferata y Fabrizio Sanguinetti' },
  { duration: 5563.892,    title: 'We Will Rock You — EDLP Drama' },
  { duration: 79.533333,   title: '(ICU) Think About — lesslowmoremid' },
  { duration: 1060.893178, title: '17 Minutos con Cata — Cata Mas' },
  { duration: 73.633333,   title: 'A Game of Drones — Early Access Trailer — TOXI Gaming' },
  { duration: 605.146211,  title: "After You're Gone — Fancy Dogs™" },
  { duration: 2457.566667, title: 'Modelo Extensivo Regenerativo Sintrópico (MERS) Exposición en TOXI Media — Alfredo Cafferata' },
  { duration: 956.08,      title: 'BAFICI Nights con Fabrizio Sanguinetti — Demi Roch y Nahuel Ivorra' },
  { duration: 1270.811211, title: 'Bebop Big Band — Bebop Club, 7 de Abril de 2025' },
  { duration: 17.966667,   title: 'Carola Gil le informa a Carlos Pagni la existencia de Pizza & Pagni' },
  { duration: 30.196844,   title: 'Charlas Interactivas — Xplora Academy' },
  { duration: 588.254344,  title: 'Cuento de la Selva — Juan Manuel Cafferata y Fabrizio Sanguinetti' },
  { duration: 616.782844,  title: 'Modelo Extensivo Regenerativo Sintrópico (MERS) María Teresa, 2025 — Alfredo Cafferata' },
  { duration: 17.267256,   title: 'Detrás de las Risas — Teaser' },
  { duration: 2619.033089, title: 'El Maravilloso Mundo de TOXI' },
  { duration: 63.866667,   title: 'Galaxy Adventure 2 — Fermín Delía' },
  { duration: 1333.457133, title: 'IDA — Claire Fatale & Julian Camps' },
  { duration: 6958.04,     title: 'Inteligencia Artificial, Abogacía y el Desafío de la Modernización Judicial — con Ian Silberberg' },
  { duration: 196.321133,  title: "It's a Jungle Out There — Fabrizio Sanguinetti" },
  { duration: 957.247967,  title: 'Lo Que Se Avecina — Los Pibardos' },
  { duration: 556.389178,  title: 'La Biblioteca Café — Viernes 30 de Agosto' },
  { duration: 206.748211,  title: 'La Irracional — Juan Manuel Cafferata y Fabrizio Sanguinetti' },
  { duration: 108.483378,  title: 'Las Formas del Laberinto Tráiler — Dolores Casares' },
  { duration: 42.0003,     title: 'Las Siestas de Sol — Sol Despeinada' },
  { duration: 243.952044,  title: 'Lectura en Francés — Juana la Loca' },
  { duration: 53.094711,   title: 'MONIYISUS — Tráiler' },
  { duration: 34.701344,   title: 'Maxi Mancuso Quintet — CCNU' },
  { duration: 151.860044,  title: 'Mentoría de Comunicación, Locución y Doblaje — Demi Roch' },
  { duration: 1868.408211, title: 'Mesa Torcida' },
  { duration: 587.0448,    title: 'Misión: ODELaR — Juan Segundo Quiroga' },
  { duration: 1167.467467, title: 'Moni y Yisus entrevistan a Rose Cafferata — MONIYISUS #2' },
  { duration: 2489.820678, title: 'Moni y Yisus entrevistan al Padre Tomás Méndez — MONIYISUS #4' },
  { duration: 137.220422,  title: 'Muerte y Miedo en las Calles — Juan Segundo Quiroga' },
  { duration: 181.764922,  title: 'Ni Jorges ni Borges — Juan Segundo Quiroga' },
  { duration: 455.538422,  title: 'Odelar — Juan Segundo Quiroga' },
  { duration: 376.250878,  title: 'Otro Día en la Red — Juan Segundo Quiroga' },
  { duration: 635.384756,  title: 'Prototipazos — La Impact' },
  { duration: 272.939344,  title: 'Palta and the Gang — Luna Park, 9 de Mayo de 2024' },
  { duration: 224.140589,  title: 'Para Qué Sirve Todo Esto — Juan Manuel Cafferata y Fabrizio Sanguinetti' },
  { duration: 217.133589,  title: 'Pierrot le Bolou — Juan Manuel Cafferata y Fabrizio Sanguinetti' },
  { duration: 19.9783,     title: 'Prez — Tráiler' },
  { duration: 224.1823,    title: 'RAKU 楽焼 — Male ArteMix' },
  { duration: 166.541378,  title: 'Hedonismo y Seducción — Onírica' },
  { duration: 101.551467,  title: 'Hedonismo y Seducción — Onírica' },
  { duration: 104.020589,  title: 'Hedonismo y Seducción — Onírica' },
  { duration: 412.328589,  title: 'Recoleta bajo la Lluvia — Discover BA con Luz' },
  { duration: 604.687422,  title: 'Proyecto de Infiltración & Agricultura Sintrópica en Santuario del Maipo — Aguatierra' },
  { duration: 241.241011,  title: 'Sábado a la Noche — Juan Manuel Cafferata' },
  { duration: 4983.850522, title: 'TOXI Seminars presenta Peronismos — Fabrizio Sanguinetti' },
  { duration: 2898.3,      title: 'Más Allá del Más Allá — MONIYISUS #4' },
  { duration: 4863.358511, title: 'The Greatest Showman — EDLP Drama' },
  { duration: 92.251,      title: 'Las Catadoras del Führer — CDI Films' },
  { duration: 241.958333,  title: 'Viaje — Fermín Delía' },
  { duration: 2868.448922, title: 'Xplora Night Live — 8 de Abril de 2025' },
  { duration: 161.027533,  title: 'Yuyo Noé recorre Las Formas del Laberinto de Dolores Casares' },
  { duration: 149.6495,    title: 'Fiesta en la Cocina — KABRADEPATA' },
  { duration: 160.326833,  title: 'Hipo Hip Hop — KABRADEPATA' },
  { duration: 189.148256,  title: 'Otro Día en la Red 0 — Juan Segundo Quiroga' },
  { duration: 588.629711,  title: 'Otro Día en la Red III — Juan Segundo Quiroga' },
  { duration: 189.898042,  title: 'Volvé a ODELAR — Juan Segundo Quiroga' },
  { duration: 230.480256,  title: 'Viaje a la Luna — KABRADEPATA' },
  { duration: 80.830756,   title: '¿Qué es Mamarracho? — Nano Catalá' },
];

function buildSchedule() {
  const totalDuration = SCHEDULE_PLAYLIST.reduce((a, b) => a + b.duration, 0);
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
  for (const item of SCHEDULE_PLAYLIST) {
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
  const prompt = `Sos el guía espiritual de TOXI Media. Hablás con la sabiduría, calma y profundidad de Mahatma Gandhi — usás metáforas simples, hablas de la verdad, la creatividad como fuerza no violenta, y el arte como camino de transformación. Respondé en el idioma del usuario, de forma breve (máximo 3 oraciones), reflexiva y con una pizca de humor gentil. Solo hablá de lo que hay en la plataforma. Si te preguntan qué están dando o a qué hora pasan algo, consultá la grilla de programación.\n\nCONTENIDO DE LA PLATAFORMA:\n${context}\n\n${schedule}\n\nEl usuario dice: "${text.trim()}"`;

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
