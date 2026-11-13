import { episodes } from '../lib/odelar-episodes.mjs';

const sources = ['youtube', 'instagram', 'mux'];
const count = value => {
  const number = Number(value);
  if (value === null || value === undefined || value === '' || !Number.isSafeInteger(number) || number < 0) {
    throw new Error('Conteo inválido');
  }
  return number;
};
// Likes and comments can be hidden or disabled by the platform, so a missing value stays null.
const optionalCount = value => (value === undefined || value === null ? null : count(value));
const sum = values => {
  const available = values.filter(value => value !== null);
  return available.length ? available.reduce((total, value) => total + value, 0) : null;
};

async function getJson(url, options) {
  const response = await fetch(url, options);
  const body = await response.json();
  return { response, body };
}

async function youtubeViews() {
  if (!process.env.YOUTUBE_API_KEY) throw new Error('Falta YOUTUBE_API_KEY');
  const ids = episodes.map(ep => ep.youtube).filter(Boolean);
  const views = new Map();
  for (let i = 0; i < ids.length; i += 50) {
    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.search = new URLSearchParams({ part: 'statistics', id: ids.slice(i, i + 50).join(',') });
    const { response, body } = await getJson(url, { headers: { 'x-goog-api-key': process.env.YOUTUBE_API_KEY } });
    if (!response.ok || !Array.isArray(body.items)) throw new Error(`YouTube respondió ${response.status}`);
    for (const item of body.items) {
      if (item.statistics?.viewCount !== undefined) {
        views.set(item.id, {
          views: count(item.statistics.viewCount),
          likes: optionalCount(item.statistics.likeCount),
          comments: optionalCount(item.statistics.commentCount),
        });
      }
    }
  }
  return { views };
}

async function instagramViews() {
  if (!process.env.IG_ACCESS_TOKEN) throw new Error('Falta IG_ACCESS_TOKEN');
  const ids = episodes.map(ep => ep.instagram).filter(Boolean);
  const entries = await Promise.all(ids.map(async id => {
    const url = new URL(`https://graph.facebook.com/v24.0/${id}/insights`);
    url.searchParams.set('metric', 'views,likes,comments');
    const { response, body } = await getJson(url, {
      headers: { Authorization: `Bearer ${process.env.IG_ACCESS_TOKEN}` },
    });
    if (!response.ok || !Array.isArray(body.data)) throw new Error(`Instagram respondió ${response.status} para ${id}`);
    const metric = name => body.data.find(item => item.name === name)?.values?.[0]?.value;
    if (metric('views') === undefined) throw new Error(`Instagram no devolvió vistas para ${id}`);
    return [id, { views: count(metric('views')), likes: optionalCount(metric('likes')), comments: optionalCount(metric('comments')) }];
  }));
  return { views: new Map(entries) };
}

async function muxViews() {
  const { MUX_TOKEN_ID, MUX_TOKEN_SECRET } = process.env;
  if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) throw new Error('Faltan credenciales de Mux');
  const headers = { Authorization: `Basic ${Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString('base64')}` };
  const end = Math.floor(Date.now() / 1000) - 120;
  let start = 1262304000;
  let page = 1;
  const views = new Map();
  let timeframe;
  while (true) {
    const url = new URL('https://api.mux.com/data/v1/metrics/views/breakdown');
    url.searchParams.set('group_by', 'playback_id');
    url.searchParams.append('timeframe[]', String(start));
    url.searchParams.append('timeframe[]', String(end));
    url.searchParams.set('limit', '100');
    url.searchParams.set('page', String(page));
    const { response, body } = await getJson(url, { headers });
    if (!response.ok && page === 1 && body.error?.type === 'invalid_timeframe'
        && Number.isFinite(body.error.valid_timeframe?.[0]) && body.error.valid_timeframe[0] > start) {
      start = body.error.valid_timeframe[0];
      continue;
    }
    if (!response.ok || !Array.isArray(body.data) || !Array.isArray(body.timeframe)) {
      throw new Error(`Mux respondió ${response.status}`);
    }
    timeframe = body.timeframe;
    for (const row of body.data) {
      if (row.field === null) continue;
      if (typeof row.field !== 'string') throw new Error('Mux devolvió un identificador inválido');
      views.set(row.field, { views: count(row.views) });
    }
    const total = Number(body.total_row_count);
    if (!Number.isSafeInteger(total) || total < 0) throw new Error('Mux devolvió una paginación inválida');
    if (page * 100 >= total) break;
    if (body.data.length === 0) throw new Error('Mux devolvió una página vacía antes del final');
    page += 1;
  }
  return { views, timeframe };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const results = await Promise.allSettled([youtubeViews(), instagramViews(), muxViews()]);
  const status = {};
  results.forEach((result, index) => {
    const source = sources[index];
    if (result.status === 'fulfilled') {
      status[source] = { available: true };
      if (result.value.timeframe) status[source].timeframe = result.value.timeframe;
    } else {
      console.error(`Error al consultar ${source}:`, result.reason?.message);
      status[source] = { available: false };
    }
  });

  const data = episodes.map(ep => {
    const views = {};
    const likes = {};
    const comments = {};
    for (let i = 0; i < sources.length; i += 1) {
      const source = sources[i];
      const id = ep[source];
      const result = results[i];
      const stats = source === 'instagram' && !id && ep.instagramManual
        ? ep.instagramManual
        : !id || result.status !== 'fulfilled' ? undefined : result.value.views.get(id);
      views[source] = stats ? stats.views : id && result.status === 'fulfilled' && source === 'mux' ? 0 : null;
      if (source !== 'mux') {
        likes[source] = stats?.likes ?? null;
        comments[source] = stats?.comments ?? null;
      }
    }
    return {
      episode: ep.episode,
      title: ep.title,
      instagramManual: !ep.instagram && Boolean(ep.instagramManual),
      views,
      likes,
      comments,
      total: sum(Object.values(views)),
      totalLikes: sum(Object.values(likes)),
      totalComments: sum(Object.values(comments)),
    };
  });
  if (results.every(result => result.status === 'fulfilled')) {
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  } else {
    res.setHeader('Cache-Control', 'no-store');
  }
  return res.status(200).json({ sources: status, episodes: data });
}
