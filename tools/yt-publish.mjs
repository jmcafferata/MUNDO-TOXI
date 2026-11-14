// Publishes the oldest due video from the queue to YouTube as a Short.
// A video counts as already posted when a recent upload of the channel has the same title prefix, so reruns are safe.
// Env: YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN. Pass --dry to only report what would be published.
import { QUEUE } from './reels-queue.mjs';

const dry = process.argv.includes('--dry');
const { YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN } = process.env;
if (!YT_CLIENT_ID || !YT_CLIENT_SECRET || !YT_REFRESH_TOKEN) {
  throw new Error('Missing YT_CLIENT_ID / YT_CLIENT_SECRET / YT_REFRESH_TOKEN');
}

async function json(res) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) throw new Error(`${res.status} ${JSON.stringify(body.error || body)}`);
  return body;
}

const { access_token: TOKEN } = await json(
  await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: YT_CLIENT_ID,
      client_secret: YT_CLIENT_SECRET,
      refresh_token: YT_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  }),
);
const auth = { Authorization: `Bearer ${TOKEN}` };
const yt = (path) => fetch(`https://www.googleapis.com/youtube/v3/${path}`, { headers: auth }).then(json);

const channel = await yt('channels?part=contentDetails&mine=true');
const uploads = channel.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
if (!uploads) throw new Error('No channel found for this account');
const recent = await yt(`playlistItems?part=snippet&maxResults=50&playlistId=${uploads}`);
const titles = (recent.items || []).map((i) => i.snippet.title);

const due = QUEUE.filter((i) => new Date(i.publishAt).getTime() <= Date.now() && !titles.some((t) => t.startsWith(i.caption)));
if (!due.length) {
  console.log('nothing due');
  process.exit(0);
}
const item = due[0];
if (dry) {
  console.log(`dry run: would publish "${item.caption}" (${due.length} due)`);
  process.exit(0);
}

const video = Buffer.from(await (await fetch(item.url)).arrayBuffer());
const start = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
  method: 'POST',
  headers: {
    ...auth,
    'Content-Type': 'application/json; charset=UTF-8',
    'X-Upload-Content-Type': 'video/mp4',
    'X-Upload-Content-Length': String(video.length),
  },
  body: JSON.stringify({
    snippet: {
      title: `${item.caption} #Shorts`,
      description: `${item.caption}\n\n#Shorts`,
      categoryId: '24',
      defaultLanguage: 'es',
    },
    status: { privacyStatus: 'public', selfDeclaredMadeForKids: false },
  }),
});
if (!start.ok) throw new Error(`upload init failed: ${start.status} ${await start.text()}`);

const uploaded = await json(
  await fetch(start.headers.get('location'), {
    method: 'PUT',
    headers: { 'Content-Type': 'video/mp4', 'Content-Length': String(video.length) },
    body: video,
  }),
);
console.log(`published "${item.caption}" -> https://youtube.com/shorts/${uploaded.id} (privacy: ${uploaded.status?.privacyStatus})`);
