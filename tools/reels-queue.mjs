// Shared publishing queue (videos hosted in Vercel Blob) used by ig-publish.mjs and yt-publish.mjs.
const BLOB = 'https://ilw9jqu6vllksucj.public.blob.vercel-storage.com/ig';

export const QUEUE = [
  { n: 2, publishAt: '2026-11-14T21:00:00Z' },
  { n: 3, publishAt: '2026-11-15T00:00:00Z' },
  { n: 4, publishAt: '2026-11-15T15:00:00Z' },
  { n: 5, publishAt: '2026-11-15T21:00:00Z' },
  { n: 6, publishAt: '2026-11-16T00:00:00Z' },
  { n: 7, publishAt: '2026-11-16T15:00:00Z' },
  { n: 8, publishAt: '2026-11-16T21:00:00Z' },
  { n: 9, publishAt: '2026-11-17T00:00:00Z' },
  { n: 10, publishAt: '2026-11-17T21:00:00Z', file: 'parte-10-v2' },
  { n: 11, publishAt: '2026-11-17T21:01:00Z', file: 'parte-11-v2' },
].map((i) => ({ ...i, caption: `Entrevista a Nicolás Martorell (Parte ${i.n})`, url: `${BLOB}/${i.file ?? `parte-${i.n}`}.mp4` }));
