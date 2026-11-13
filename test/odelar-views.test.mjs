import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/odelar-views.mjs';
import { episodes } from '../lib/odelar-episodes.mjs';

function response(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function resMock() {
  return {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(value) { this.statusCode = value; return this; },
    json(value) { this.body = value; return this; },
  };
}

test('aggregates available views, exposes retention and reports failures', async () => {
  const keys = ['YOUTUBE_API_KEY', 'IG_ACCESS_TOKEN', 'MUX_TOKEN_ID', 'MUX_TOKEN_SECRET'];
  const oldEnv = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  const oldFetch = globalThis.fetch;
  for (const key of keys) process.env[key] = 'test';
  let instagramFails = false;
  globalThis.fetch = async url => {
    if (url.hostname === 'www.googleapis.com') {
      return response({ items: episodes.filter(ep => ep.youtube).map(ep => ({
        id: ep.youtube, statistics: ep.episode === '1x01' ? { viewCount: '10', commentCount: '1' } : { viewCount: '10', likeCount: '2', commentCount: '1' },
      })) });
    }
    if (url.hostname === 'graph.facebook.com') {
      return instagramFails
        ? response({ error: { code: 190 } }, 401)
        : response({ data: [
          { name: 'views', values: [{ value: 3 }] },
          { name: 'likes', values: [{ value: 5 }] },
          { name: 'comments', values: [{ value: 0 }] },
        ] });
    }
    if (url.hostname === 'api.mux.com') {
      const start = Number(url.searchParams.getAll('timeframe[]')[0]);
      if (start === 1262304000) {
        return response({ error: { type: 'invalid_timeframe', valid_timeframe: [1700000000, 1800000000] } }, 400);
      }
      assert.equal(start, 1700000000);
      const page = Number(url.searchParams.get('page'));
      const rows = page === 1
        ? [{ field: episodes[0].mux, views: 7 }, { field: null, views: 2 },
          ...Array.from({ length: 98 }, (_, i) => ({ field: `other-${i}`, views: 1 }))]
        : [{ field: episodes[1].mux, views: 4 }];
      return response({ data: rows, total_row_count: 101, timeframe: [1700000000, 1701000000] });
    }
    throw new Error('Unexpected API');
  };
  try {
    const res = resMock();
    await handler({ method: 'GET' }, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.sources.mux.timeframe, [1700000000, 1701000000]);
    assert.deepEqual(res.body.episodes[0].views, { youtube: 10, instagram: null, mux: 7 });
    assert.equal(res.body.episodes[0].total, 17);
    assert.equal(res.body.episodes[1].views.mux, 4);
    const secondSeason = res.body.episodes.find(ep => ep.episode === '2x01');
    assert.deepEqual(secondSeason.views, { youtube: 10, instagram: 3, mux: 0 });
    assert.equal(secondSeason.total, 13);
    const manual = res.body.episodes.find(ep => ep.episode === '2x03');
    assert.equal(manual.instagramManual, true);
    assert.deepEqual([manual.views.instagram, manual.likes.instagram, manual.comments.instagram], [617, 24, 11]);
    const commentsOnly = res.body.episodes.find(ep => ep.episode === '1x07');
    assert.deepEqual([commentsOnly.views.instagram, commentsOnly.likes.instagram, commentsOnly.comments.instagram], [null, null, 16]);
    assert.deepEqual(secondSeason.likes, { youtube: 2, instagram: 5 });
    assert.deepEqual(secondSeason.comments, { youtube: 1, instagram: 0 });
    assert.equal(secondSeason.totalLikes, 7);
    assert.equal(secondSeason.totalComments, 1);
    assert.deepEqual(res.body.episodes[0].likes, { youtube: null, instagram: null });
    assert.equal(res.body.episodes[0].totalLikes, null);
    assert.equal(res.body.episodes[0].totalComments, 1);
    assert.match(res.headers['Cache-Control'], /s-maxage=3600/);

    instagramFails = true;
    const failed = resMock();
    await handler({ method: 'GET' }, failed);
    assert.equal(failed.body.sources.instagram.available, false);
    assert.equal(failed.body.episodes.find(ep => ep.episode === '2x01').views.instagram, null);
    assert.equal(failed.headers['Cache-Control'], 'no-store');

    const wrongMethod = resMock();
    await handler({ method: 'POST' }, wrongMethod);
    assert.equal(wrongMethod.statusCode, 405);
  } finally {
    globalThis.fetch = oldFetch;
    for (const key of keys) {
      if (oldEnv[key] === undefined) delete process.env[key];
      else process.env[key] = oldEnv[key];
    }
  }
});
