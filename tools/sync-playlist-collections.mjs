import { readFileSync, writeFileSync } from 'node:fs';

const contentPath = 'src/content.js';
const playlistPath = 'api/playlist.mjs';
const content = readFileSync(contentPath, 'utf8');
const playlist = readFileSync(playlistPath, 'utf8');
const collectionsById = new Map();

for (const line of content.split(/\r?\n/)) {
  const idMatch = line.match(/id:\s*'([^']+)'/);
  const collectionsMatch = line.match(/collections:\s*\[([^\]]*)\]/);
  if (!idMatch || !collectionsMatch) continue;
  const collections = [...collectionsMatch[1].matchAll(/['\"]([^'\"]+)['\"]/g)].map(match => match[1]);
  collectionsById.set(idMatch[1], collections);
}

const updated = playlist.split(/\r?\n/).map(line => {
  if (line.trimStart().startsWith('//') || line.includes('collections:')) return line;
  const idMatch = line.match(/id:\s*'([^']+)'/);
  const collections = idMatch && collectionsById.get(idMatch[1]);
  if (!collections?.length || !/\s*},?\s*$/.test(line)) return line;
  const serialized = collections.map(collection => JSON.stringify(collection)).join(', ');
  return line.replace(/(\s*})(,?\s*)$/, `, collections: [${serialized}]$1$2`);
});

writeFileSync(playlistPath, updated.join('\n'), 'utf8');
console.log(`Synchronized ${collectionsById.size} content collection assignments.`);
