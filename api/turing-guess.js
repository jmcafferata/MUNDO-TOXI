// POST /api/turing-guess  → user submits their guess (which respondent is human)

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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sessionId, guess } = req.body || {};
  if (!sessionId || !['A', 'B'].includes(guess)) {
    return res.status(400).json({ error: 'Invalid sessionId or guess (must be A or B)' });
  }

  const sessions = await sb('GET', 'turing_sessions', null, `?id=eq.${encodeURIComponent(sessionId)}`);
  if (!sessions?.[0]) return res.status(404).json({ error: 'Session not found' });
  const session = sessions[0];

  if (session.status === 'concluded') {
    return res.status(400).json({ error: 'Already concluded' });
  }

  const correct = guess === session.human_side;

  await sb('PATCH', 'turing_sessions', {
    status:        'concluded',
    user_guess:    guess,
    correct_guess: correct,
  }, `?id=eq.${encodeURIComponent(sessionId)}`);

  return res.status(200).json({ correct, humanSide: session.human_side });
}
