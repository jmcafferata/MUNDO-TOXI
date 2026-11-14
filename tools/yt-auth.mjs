// One-time helper: obtains the YouTube refresh token for tools/yt-publish.mjs.
// Usage: YT_CLIENT_ID=... YT_CLIENT_SECRET=... node tools/yt-auth.mjs
// Create an OAuth client of type "Desktop app" (or Web app with redirect http://127.0.0.1:53682) first.
import http from 'node:http';

const { YT_CLIENT_ID, YT_CLIENT_SECRET } = process.env;
if (!YT_CLIENT_ID || !YT_CLIENT_SECRET) throw new Error('Set YT_CLIENT_ID and YT_CLIENT_SECRET');

const redirect = 'http://127.0.0.1:53682';
const url = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
  client_id: YT_CLIENT_ID,
  redirect_uri: redirect,
  response_type: 'code',
  access_type: 'offline',
  prompt: 'consent',
  scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly',
});
console.log('Open this URL and authorize with the Google account that owns the channel:\n\n' + url + '\n');

const code = await new Promise((resolve, reject) => {
  const server = http.createServer((req, res) => {
    const q = new URL(req.url, redirect).searchParams;
    res.end(q.get('code') ? 'Listo, ya podés cerrar esta pestaña.' : 'Error: ' + q.get('error'));
    server.close();
    q.get('code') ? resolve(q.get('code')) : reject(new Error(q.get('error') || 'no code'));
  }).listen(53682, '127.0.0.1');
});

const res = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  body: new URLSearchParams({
    code,
    client_id: YT_CLIENT_ID,
    client_secret: YT_CLIENT_SECRET,
    redirect_uri: redirect,
    grant_type: 'authorization_code',
  }),
});
const body = await res.json();
if (!body.refresh_token) throw new Error('No refresh token: ' + JSON.stringify(body));
console.log('YT_REFRESH_TOKEN=' + body.refresh_token);
