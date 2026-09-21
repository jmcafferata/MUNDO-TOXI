import { readFileSync, writeFileSync } from 'node:fs';

const contentPath = 'src/content.js';
const playlistPath = 'api/playlist.mjs';
const content = readFileSync(contentPath, 'utf8');
const source = content.match(/const CONTENT_SOURCE = \[(.*)\];\s*\n\s*const getCollections/s)?.[1];

if (!source) throw new Error(`Could not find CONTENT_SOURCE in ${contentPath}`);

const entries = source
  .split(/\r?\n/)
  .map(line => line.trim())
  .filter(line => line.startsWith('{ id:'))
  .map(line => line.replace(/,\s*$/, ''));

if (!entries.length) throw new Error(`No active content entries found in ${contentPath}`);

const output = `// GENERATED FILE. Edit src/content.js and run npm run playlist:sync.\n\nconst PLAYLIST_SOURCE = [\n${entries.map(entry => `  ${entry},`).join('\n')}\n];\n\nexport const PLAYLIST = [...PLAYLIST_SOURCE.reduce((playlist, video) => {\n  const previous = playlist.get(video.id);\n  const collections = new Set([\n    ...(previous?.collections || []),\n    ...(video.collections || []),\n  ]);\n  playlist.set(video.id, { ...previous, ...video, collections: [...collections] });\n  return playlist;\n}, new Map()).values()];\n\nexport default function handler(req, res) {\n  res.setHeader('Access-Control-Allow-Origin', '*');\n  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');\n  res.status(200).json(PLAYLIST);\n}\n`;

writeFileSync(playlistPath, output, 'utf8');
console.log(`Generated ${playlistPath} from ${entries.length} entries in ${contentPath}.`);
