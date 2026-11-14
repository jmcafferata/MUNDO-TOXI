// Publishes the oldest due Reel from the queue to Instagram (videos hosted in Vercel Blob).
// A Reel counts as already posted when its caption is on the account's recent media, so reruns are safe.
// Env: IG_ACCESS_TOKEN, IG_USER_ID. Pass --dry to only report what would be published.
const BLOB = 'https://ilw9jqu6vllksucj.public.blob.vercel-storage.com/ig';
const API = 'https://graph.facebook.com/v21.0';
const dry = process.argv.includes('--dry');

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
].map((i) => ({ ...i, caption: `Entrevista a Nicolás Martorell (Parte ${i.n})`, url: `${BLOB}/parte-${i.n}.mp4` }));

const { IG_ACCESS_TOKEN: TOKEN, IG_USER_ID: IG_ID } = process.env;
if (!TOKEN || !IG_ID) throw new Error('Missing IG_ACCESS_TOKEN / IG_USER_ID');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function graph(method, url, params = {}) {
  const body = new URLSearchParams({ ...params, access_token: TOKEN });
  const res = await fetch(method === 'GET' ? `${url}?${body}` : url, {
    method,
    body: method === 'GET' ? undefined : body,
  });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(JSON.stringify(json.error || json));
  return json;
}

const recent = await graph('GET', `${API}/${IG_ID}/media`, { fields: 'caption', limit: '50' });
const posted = new Set((recent.data || []).map((m) => (m.caption || '').trim()));
const due = QUEUE.filter((i) => new Date(i.publishAt).getTime() <= Date.now() && !posted.has(i.caption));

if (!due.length) {
  console.log('nothing due');
  process.exit(0);
}
const item = due[0];
if (dry) {
  console.log(`dry run: would publish "${item.caption}" (${due.length} due)`);
  process.exit(0);
}

const container = await graph('POST', `${API}/${IG_ID}/media`, {
  media_type: 'REELS',
  video_url: item.url,
  caption: item.caption,
  share_to_feed: 'true',
});

for (let i = 0; ; i++) {
  const s = await graph('GET', `${API}/${container.id}`, { fields: 'status_code,status' });
  if (s.status_code === 'FINISHED') break;
  if (s.status_code === 'ERROR' || s.status_code === 'EXPIRED') throw new Error(`container ${s.status_code}: ${s.status}`);
  if (i >= 60) throw new Error('timeout waiting for container processing');
  await sleep(5000);
}

const pub = await graph('POST', `${API}/${IG_ID}/media_publish`, { creation_id: container.id });
console.log(`published "${item.caption}" -> media ${pub.id}`);
