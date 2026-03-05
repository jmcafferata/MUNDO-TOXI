import crypto from 'crypto';
import path from 'path';
import { promises as fs } from 'fs';

function base64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function makeJWT(creds, scopes) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claim = base64url(Buffer.from(JSON.stringify({
    iss: creds.client_email,
    scope: scopes.join(' '),
    aud: creds.token_uri,
    exp: now + 3600,
    iat: now,
  })));
  const input = `${header}.${claim}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(input);
  const sig = base64url(sign.sign(creds.private_key));
  return `${input}.${sig}`;
}

async function getAccessToken(creds) {
  const jwt = makeJWT(creds, ['https://www.googleapis.com/auth/drive.readonly']);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(data.error_description || JSON.stringify(data));
  return data.access_token;
}

async function driveGet(url, token) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const credsPath = path.join(process.cwd(), 'toxitv-credentials.json');
    const creds = JSON.parse(await fs.readFile(credsPath, 'utf8'));
    const token = await getAccessToken(creds);

    const { folderId } = req.query;

    // Build query: list folders (and all files if folderId specified)
    let q = folderId
      ? `'${folderId}' in parents and trashed=false`
      : `mimeType='application/vnd.google-apps.folder' and trashed=false`;

    const params = new URLSearchParams({
      q,
      fields: 'nextPageToken,files(id,name,mimeType,modifiedTime,webViewLink)',
      pageSize: '1000',
      includeItemsFromAllDrives: 'true',
      supportsAllDrives: 'true',
    });

    // Paginate through all results
    let folders = [];
    let pageToken;
    do {
      if (pageToken) params.set('pageToken', pageToken);
      else params.delete('pageToken');
      const data = await driveGet(
        `https://www.googleapis.com/drive/v3/files?${params}`,
        token
      );
      if (data.files) folders = folders.concat(data.files);
      pageToken = data.nextPageToken;
    } while (pageToken);

    // List shared drives the service account can access
    const drivesData = await driveGet(
      'https://www.googleapis.com/drive/v3/drives?pageSize=100&fields=drives(id,name)',
      token
    );
    const sharedDrives = drivesData.drives || [];

    res.status(200).json({ folders, sharedDrives });
  } catch (err) {
    console.error('[drive-projects]', err);
    res.status(500).json({ error: err.message });
  }
}
