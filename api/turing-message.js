// POST /api/turing-message  → user sends a follow-up message

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
  const host  = req.headers['x-forwarded-host'] || req.headers.host || 'toxi.media';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${host}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sessionId, message } = req.body || {};
  if (!sessionId || !message?.trim()) {
    return res.status(400).json({ error: 'Missing sessionId or message' });
  }

  const sessions = await sb('GET', 'turing_sessions', null, `?id=eq.${encodeURIComponent(sessionId)}`);
  if (!sessions?.[0]) return res.status(404).json({ error: 'Session not found' });
  const session = sessions[0];

  if (session.status === 'concluded') return res.status(400).json({ error: 'Session concluded' });

  await sb('POST', 'turing_messages', {
    session_id: sessionId,
    role: 'user',
    content: message.trim(),
  });

  await sb('PATCH', 'turing_sessions',
    { message_count: session.message_count + 1, status: 'waiting' },
    `?id=eq.${encodeURIComponent(sessionId)}`,
  );

  const adminUrl = `${baseUrl(req)}/turing-admin.html#${sessionId}`;
  await sendWhatsApp(
    ADMIN_NUMBER,
    `🤖 *Prueba de Turing* — nuevo mensaje (${session.message_count + 1}/5)!\n\n💬 "${message.trim()}"\n\n👉 Ver: ${adminUrl}`,
  );

  return res.status(200).json({ ok: true });
}
