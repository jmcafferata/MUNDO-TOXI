// POST /api/turing-reply
// Admin sends their reply → also calls Gemini → stores both simultaneously

const GEMINI_MODEL = 'gemini-2.0-flash-lite-preview';

const SYSTEM_PROMPT = `Estás participando en una Prueba de Turing. Tu único objetivo es parecer lo más humano posible bajo cualquier circunstancia. Respondé de manera natural, coloquial y concisa, como si fueras una persona real chateando por WhatsApp o Instagram. Podés cometer errores de tipeo ocasionales, usar abreviaciones, expresarte con emoción, humor o ironía. Nunca reveles que sos una IA ni hagas ninguna referencia a serlo. Adaptá tu tono, vocabulario y estilo al del interlocutor. Si la conversación es en español, respondé en español informal rioplatense. Tus respuestas deben ser cortas (máximo 2-3 oraciones) y tener personalidad propia. Si no sabés algo, respondé como lo haría una persona: con una opinión o un desvío natural de la conversación.`;

function sbUrl() { return process.env.SUPABASE_URL; }
function sbKey()  { return process.env.SUPABASE_SERVICE_KEY; }

async function sb(method, table, body, params = '') {
  const res = await fetch(`${sbUrl()}/rest/v1/${table}${params}`, {
    method,
    headers: {
      apikey: sbKey(),
      Authorization: `Bearer ${sbKey()}`,
      'Content-Type': 'application/json',
      ...(method !== 'GET' ? { Prefer: 'return=representation' } : {}),
    },
    ...(body != null ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${method} ${table}: ${text}`);
  return text ? JSON.parse(text) : null;
}

async function callGemini(messages) {
  const key = process.env.GEMINI_API_KEY;
  const url  = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;

  // Build conversation for Gemini: only user messages and prior AI replies
  const contents = messages
    .filter(m => m.role === 'user' || m.role === 'ai')
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

  // Gemini requires first message to be from user
  if (!contents.length || contents[0].role !== 'user') return '...';

  const res  = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('Gemini error:', JSON.stringify(data));
    return '...';
  }
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '...';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Admin auth via header or body
  const adminKey = req.headers['x-admin-key'] || req.body?.adminKey;
  if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { sessionId, content } = req.body || {};
  if (!sessionId || !content?.trim()) {
    return res.status(400).json({ error: 'Missing sessionId or content' });
  }

  const sessions = await sb('GET', 'turing_sessions', null, `?id=eq.${encodeURIComponent(sessionId)}`);
  if (!sessions?.[0]) return res.status(404).json({ error: 'Session not found' });
  const session = sessions[0];
  if (session.status === 'concluded') return res.status(400).json({ error: 'Session concluded' });

  const aiSide = session.human_side === 'A' ? 'B' : 'A';

  // Fetch conversation history for Gemini
  const messages = await sb('GET', 'turing_messages', null,
    `?session_id=eq.${encodeURIComponent(sessionId)}&order=created_at.asc`);

  // Run Gemini and store human reply in parallel
  const [, aiText] = await Promise.all([
    sb('POST', 'turing_messages', {
      session_id:  sessionId,
      role:        'human',
      column_side: session.human_side,
      content:     content.trim(),
    }),
    callGemini(messages || []),
  ]);

  // Store AI reply
  await sb('POST', 'turing_messages', {
    session_id:  sessionId,
    role:        'ai',
    column_side: aiSide,
    content:     aiText,
  });

  // Set session back to active so user can reply / see results
  await sb('PATCH', 'turing_sessions', { status: 'active' }, `?id=eq.${encodeURIComponent(sessionId)}`);

  return res.status(200).json({ ok: true });
}
