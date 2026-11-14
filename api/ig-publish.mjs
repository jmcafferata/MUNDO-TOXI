// Cron-driven Instagram Reels publisher. Videos live in Vercel Blob (ig/parte-N.mp4).
// Each invocation publishes the oldest due Reel that is not on the account yet (matched by caption),
// so duplicate or late cron invocations are safe.
const BLOB = 'https://ilw9jqu6vllksucj.public.blob.vercel-storage.com/ig';
const API = 'https://graph.facebook.com/v21.0';

const title = (n) => `Entrevista a Nicolás Martorell (Parte ${n})`;
const QUEUE = [
  { n: 2, publishAt: '2026-11-14T21:00:00Z' },
  { n: 3, publishAt: '2026-11-15T00:00:00Z' },
  { n: 4, publishAt: '2026-11-15T15:00:00Z' },
  { n: 5, publishAt: '2026-11-15T21:00:00Z' },
  { n: 6, publishAt: '2026-11-16T00:00:00Z' },
  { n: 7, publishAt: '2026-11-16T15:00:00Z' },
  { n: 8, publishAt: '2026-11-16T21:00:00Z' },
  { n: 9, publishAt: '2026-11-17T00:00:00Z' },
  { n: 10, publishAt: '2026-11-17T15:00:00Z' },
].map((i) => ({ ...i, caption: title(i.n), url: `${BLOB}/parte-${i.n}.mp4` }));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function graph(method, url, params, token) {
  const body = new URLSearchParams({ ...params, access_token: token });
  const res = await fetch(method === 'GET' ? `${url}?${body}` : url, {
    method,
    body: method === 'GET' ? undefined : body,
  });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(JSON.stringify(json.error || json));
  return json;
}

export default async function handler(req, res) {
  const { CRON_SECRET, IG_ACCESS_TOKEN, IG_USER_ID } = process.env;
  if (!CRON_SECRET || req.headers.authorization !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!IG_ACCESS_TOKEN || !IG_USER_ID) {
    return res.status(500).json({ error: 'Missing IG_ACCESS_TOKEN / IG_USER_ID' });
  }

  try {
    const recent = await graph('GET', `${API}/${IG_USER_ID}/media`, { fields: 'caption', limit: '50' }, IG_ACCESS_TOKEN);
    const posted = new Set((recent.data || []).map((m) => (m.caption || '').trim()));
    const due = QUEUE.filter((i) => new Date(i.publishAt).getTime() <= Date.now() && !posted.has(i.caption));
    if (!due.length) return res.status(200).json({ status: 'nothing due' });
    const item = due[0];

    if (req.query?.dry === '1') return res.status(200).json({ status: 'dry run', wouldPublish: item.caption, remainingDue: due.length });

    const container = await graph('POST', `${API}/${IG_USER_ID}/media`, {
      media_type: 'REELS',
      video_url: item.url,
      caption: item.caption,
      share_to_feed: 'true',
    }, IG_ACCESS_TOKEN);

    for (let i = 0; i < 48; i++) {
      const s = await graph('GET', `${API}/${container.id}`, { fields: 'status_code,status' }, IG_ACCESS_TOKEN);
      if (s.status_code === 'FINISHED') break;
      if (s.status_code === 'ERROR' || s.status_code === 'EXPIRED') throw new Error(`container ${s.status_code}: ${s.status}`);
      if (i === 47) throw new Error('timeout waiting for container processing');
      await sleep(5000);
    }

    const pub = await graph('POST', `${API}/${IG_USER_ID}/media_publish`, { creation_id: container.id }, IG_ACCESS_TOKEN);
    console.log(`published ${item.caption} -> ${pub.id}`);
    return res.status(200).json({ status: 'published', caption: item.caption, mediaId: pub.id });
  } catch (e) {
    console.error('ig-publish failed', e);
    return res.status(500).json({ error: String(e.message || e) });
  }
}
