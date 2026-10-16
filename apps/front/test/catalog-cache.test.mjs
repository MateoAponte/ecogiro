import assert from 'node:assert/strict';
import { test, afterEach } from 'node:test';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const bundle = await build({
  stdin: {
    contents: 'export * from "../src/lib/catalog-queries"; export * from "../src/lib/catalog-api"; export { QueryClient, QueryObserver, focusManager } from "@tanstack/react-query";',
    resolveDir: fileURLToPath(new URL('.', import.meta.url)), loader: 'ts',
  },
  bundle: true, write: false, platform: 'node', format: 'esm',
  define: { 'import.meta.env.VITE_APP_BACKEND_API': '"http://backend.test/api/v1"' },
});
const api = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const medail = { id: 'medail-1', name: 'Logro', description: 'Reciclar', image_url: 'Leaf', condition_type: 'ECO_POINTS', condition_value: 100 };
const assignment = { id: 'assignment-1', user_id: 5, medail_id: 'medail-1', earned_at: '2026-10-16T12:00:00Z' };
const json = (data) => new Response(JSON.stringify({ data }));

async function enter(client, options) {
  const observer = new api.QueryObserver(client, options);
  let resolve, reject;
  const ready = new Promise((done, fail) => { resolve = done; reject = fail; });
  const unsubscribe = observer.subscribe((result) => {
    if (result.isSuccess) resolve();
    if (result.isError) reject(result.error);
  });
  if (!observer.getCurrentResult().isSuccess) await ready;
  return unsubscribe;
}

for (const [label, options, data] of [
  ['rewards', api.rewardsQueryOptions, [{ id: 'reward-1', name: 'Premio', description: 'Descripción', required_points: 500 }]],
  ['medails', api.medailsQueryOptions, [medail]],
]) {
  test(`${label} is fetched only once when leaving and reentering the view`, async () => {
    const client = new api.QueryClient();
    let calls = 0;
    globalThis.fetch = async () => { calls++; return json(data); };
    try {
      (await enter(client, options))();
      (await enter(client, options))();
      await client.fetchQuery(options);
      assert.equal(calls, 1);
    } finally { client.clear(); }
  });
}

test('earned medails are requested for the current user and map to is_unlocked', async () => {
  globalThis.fetch = async (url) => {
    assert.equal(url, 'http://backend.test/api/v1/user/5/medails');
    return json([assignment]);
  };
  const assignments = await api.apiGetUserMedails(5);
  const result = api.withMedailUnlocks([medail, { ...medail, id: 'medail-2' }], assignments, 5);
  assert.deepEqual(result.map((item) => item.is_unlocked), [true, false]);
});

test('leaving before a catalog request completes does not start a second request', async () => {
  const client = new api.QueryClient();
  let finish, calls = 0;
  globalThis.fetch = () => { calls++; return new Promise((resolve) => { finish = resolve; }); };
  try {
    const first = new api.QueryObserver(client, api.medailsQueryOptions);
    const leave = first.subscribe(() => {});
    leave();
    const reenter = enter(client, api.medailsQueryOptions);
    finish(json([medail]));
    (await reenter)();
    assert.equal(calls, 1);
  } finally { client.clear(); }
});

test('a relation belonging to another user cannot unlock a medail', async () => {
  assert.equal(api.withMedailUnlocks([medail], [{ ...assignment, user_id: 99 }], 5)[0].is_unlocked, false);
  globalThis.fetch = async () => json([{ ...assignment, user_id: 99 }]);
  await assert.rejects(api.apiGetUserMedails(5));
});

test('user assignment caches are separated and an empty list means locked', async () => {
  const client = new api.QueryClient();
  globalThis.fetch = async (url) => json(url.includes('/5/') ? [assignment] : []);
  try {
    const first = await client.fetchQuery(api.userMedailsQueryOptions(5));
    const second = await client.fetchQuery(api.userMedailsQueryOptions(6));
    assert.equal(api.withMedailUnlocks([medail], first, 5)[0].is_unlocked, true);
    assert.equal(api.withMedailUnlocks([medail], second, 6)[0].is_unlocked, false);
  } finally { client.clear(); }
});

test('failed assignment requests return an error instead of a false locked state', async () => {
  globalThis.fetch = async () => new Response('{}', { status: 500 });
  await assert.rejects(api.apiGetUserMedails(5));
});
