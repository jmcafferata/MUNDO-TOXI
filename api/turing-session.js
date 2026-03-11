// POST /api/turing-session  → create new session + first message
// GET  /api/turing-session?id=<uuid> → poll session data

const ADMIN_NUMBER = '541138186820';

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

async function sendWhatsApp(to, message) {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token   = process.env.WHATSAPP_TOKEN;
  try {
    await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: message } }),
    });
  } catch (e) {
    console.error('WhatsApp send error:', e.message);
  }
}

function baseUrl(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'toxi.media';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${host}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── GET: poll session ──────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing id' });

    const sessions = await sb('GET', 'turing_sessions', null, `?id=eq.${encodeURIComponent(id)}`);
    if (!sessions?.[0]) return res.status(404).json({ error: 'Not found' });
    const session = sessions[0];

    const messages = await sb('GET', 'turing_messages', null,
      `?session_id=eq.${encodeURIComponent(id)}&order=created_at.asc`);

    // Only reveal human_side after session is concluded
    return res.status(200).json({
      session: {
        id: session.id,
        status: session.status,
        message_count: session.message_count,
        ...(session.status === 'concluded'
          ? { human_side: session.human_side, correct_guess: session.correct_guess }
          : {}),
      },
      messages: messages || [],
    });
  }

  // ── POST: create session ───────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { message } = req.body || {};
    if (!message?.trim()) return res.status(400).json({ error: 'Missing message' });

    const humanSide = Math.random() < 0.5 ? 'A' : 'B';

    const [session] = await sb('POST', 'turing_sessions', {
      human_side: humanSide,
      status: 'waiting',
      message_count: 1,
    });

    await sb('POST', 'turing_messages', {
      session_id: session.id,
      role: 'user',
      content: message.trim(),
    });

    const adminUrl = `${baseUrl(req)}/turing-admin.html#${session.id}`;
    await sendWhatsApp(
      ADMIN_NUMBER,
      `🤖 *Prueba de Turing* — nueva sesión!\n\n💬 "${message.trim()}"\n\n👉 Responder: ${adminUrl}`,
    );

    return res.status(200).json({ sessionId: session.id });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
