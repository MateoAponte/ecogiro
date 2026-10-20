import assert from 'node:assert/strict';
import { test, afterEach } from 'node:test';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const bundle = await build({
  stdin: {
    contents:
      'export * from "../src/lib/recoveries-api"; export * from "../src/lib/recoveries-queries"; export * from "../src/lib/recovery-confirmation"; export * from "../src/lib/auth-session"; export { QueryClient, QueryObserver } from "@tanstack/react-query";',
    resolveDir: fileURLToPath(new URL('.', import.meta.url)),
    loader: 'ts',
  },
  bundle: true,
  write: false,
  platform: 'node',
  format: 'esm',
  define: { 'import.meta.env.VITE_APP_BACKEND_API': '"http://backend.test/api/v1"' },
});
const api = await import(
  'data:text/javascript;base64,' +
    Buffer.from(bundle.outputFiles[0].text).toString('base64')
);
const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  api.clearAuthTokens();
});
const recovery = {
  id: '40204db7-7240-4733-a998-aa811bca8634',
  scheduled_date: '2026-10-20T15:00:00.000Z',
  description: 'Botellas reciclables',
  address: 'Dirección real',
  comments: 'Llamar al llegar',
  recycled_kg: 12.5,
  status: 2,
  user_id: 5,
};

test('GET by ID loads the full recovery directly with access token and cancellation', async () => {
  api.saveAuthTokens({ accessToken: 'test-access', refreshToken: 'test-refresh' });
  const controller = new AbortController();
  globalThis.fetch = async (url, options) => {
    assert.equal(url, `http://backend.test/api/v1/recovery/${recovery.id}`);
    assert.equal(options.headers.Authorization, 'Bearer test-access');
    assert.equal(options.signal, controller.signal);
    assert.equal(options.cache, 'no-store');
    return new Response(JSON.stringify({ data: recovery }));
  };
  const report = await api.apiGetRecoveryById(recovery.id, 5, controller.signal);
  assert.equal(report.rre_id, recovery.id);
  assert.equal(report.comments, recovery.comments);
  assert.equal(report.rre_direccion_texto, recovery.address);
});

test('GET by ID surfaces not found and malformed response errors', async () => {
  api.saveAuthTokens({ accessToken: 'test-access', refreshToken: 'test-refresh' });
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ message: 'Recovery not found' }), { status: 404 });
  await assert.rejects(api.apiGetRecoveryById(recovery.id, 5), /Recovery not found/);
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ data: { id: recovery.id } }));
  await assert.rejects(api.apiGetRecoveryById(recovery.id, 5), /inválida/);
});

test('GET by ID rejects a recovery belonging to another user', async () => {
  api.saveAuthTokens({ accessToken: 'test-access', refreshToken: 'test-refresh' });
  globalThis.fetch = async () => new Response(JSON.stringify({ data: recovery }));
  await assert.rejects(api.apiGetRecoveryById(recovery.id, 7), /no pertenece/);
});

test('GET by ID accepts the actual detail payload without user_id', async () => {
  api.saveAuthTokens({ accessToken: 'test-access', refreshToken: 'test-refresh' });
  const data = {
    recycled_kg: 0,
    id: '60d21177-1ae5-4b9b-b77c-e39f270c363d',
    scheduled_date: '2022-01-01T00:00:00.000Z',
    description: 'description',
    address: 'address',
    comments: 'comments',
    status: 1,
  };
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ statusCode: 200, message: 'Success', data }));
  const report = await api.apiGetRecoveryById(data.id, 7);
  assert.equal(report.rre_id, data.id);
  assert.equal(report.rre_estado, 'EN_ESPERA');
  assert.equal(report.rre_direccion_texto, 'address');
  assert.equal(report.comments, 'comments');
});

test('DELETE sends the recovery UUID with auth and accepts an empty 204', async () => {
  api.saveAuthTokens({ accessToken: 'test-access', refreshToken: 'test-refresh' });
  globalThis.fetch = async (url, options) => {
    assert.equal(url, `http://backend.test/api/v1/recovery/${recovery.id}`);
    assert.equal(options.method, 'DELETE');
    assert.equal(options.headers.Authorization, 'Bearer test-access');
    assert.equal(options.body, undefined);
    return new Response(null, { status: 204 });
  };
  assert.equal(await api.apiRemoveRecovery(recovery.id), undefined);
});

test('DELETE exposes API failures instead of pretending it removed the recovery', async () => {
  api.saveAuthTokens({ accessToken: 'test-access', refreshToken: 'test-refresh' });
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ message: 'Cannot delete recovery' }), { status: 500 });
  await assert.rejects(api.apiRemoveRecovery(recovery.id), /Cannot delete recovery/);
  globalThis.fetch = async () => new Response('{}', { status: 401 });
  await assert.rejects(api.apiRemoveRecovery(recovery.id), /sesión expiró/);
});

test('detail and deletion require a session and a valid UUID before requesting', async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw new Error('Unexpected request');
  };
  await assert.rejects(api.apiGetRecoveryById(recovery.id, 5), /sesión/);
  await assert.rejects(api.apiRemoveRecovery(recovery.id), /sesión/);
  api.saveAuthTokens({ accessToken: 'test-access', refreshToken: 'test-refresh' });
  await assert.rejects(api.apiGetRecoveryById('invalid', 5), /ID/);
  await assert.rejects(api.apiRemoveRecovery('invalid'), /ID/);
  await assert.rejects(api.apiGetRecoveryById(recovery.id, undefined), /usuario válido/);
  assert.equal(calls, 0);
});

const createBody = {
  scheduled_date: recovery.scheduled_date,
  description: recovery.description,
  address: recovery.address,
  status: 0,
  user_id: 5,
};
const signIn = () =>
  api.saveAuthTokens({ accessToken: 'test-access', refreshToken: 'test-refresh' });

test('invalid user IDs never produce a recoveries HTTP request', async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw new Error('Unexpected request');
  };
  for (const id of [undefined, null, NaN, 0, -1, 1.5, 'undefined', '7']) {
    await assert.rejects(api.apiGetRecoveries(id), /usuario válido/);
  }
  assert.equal(calls, 0);
});

test('entry fetch uses the restored ID even while the provider observer has its initial options', async () => {
  const client = new api.QueryClient();
  const observer = new api.QueryObserver(
    client,
    api.recoveriesQueryOptions(undefined, false),
  );
  const urls = [];
  globalThis.fetch = async (url) => {
    urls.push(url);
    return new Response(JSON.stringify({ data: [] }));
  };
  try {
    // Login or reload of Home: execute with explicit restored profile options.
    await client.fetchQuery(api.recoveriesQueryOptions(7, true));
    observer.setOptions(api.recoveriesQueryOptions(7, true));
    // Enter/reload Collections with the same user: request current server data.
    await client.fetchQuery(api.recoveriesQueryOptions(7, true));
    assert.deepEqual(urls, [
      'http://backend.test/api/v1/recovery?user_id=7',
      'http://backend.test/api/v1/recovery?user_id=7',
    ]);
  } finally {
    observer.destroy();
    client.clear();
  }
});

test('manual refetch waits for the restored user and requests the current query ID', async () => {
  const client = new api.QueryClient();
  const observer = new api.QueryObserver(
    client,
    api.recoveriesQueryOptions(undefined, false),
  );
  const refetch = observer.refetch.bind(observer);
  const urls = [];
  globalThis.fetch = async (url) => {
    urls.push(url);
    return new Response(JSON.stringify({ data: [] }));
  };
  try {
    await refetch();
    observer.setOptions(api.recoveriesQueryOptions(7, false));
    await refetch();
    assert.deepEqual(urls, []);
    observer.setOptions(api.recoveriesQueryOptions(7, true));
    await refetch();
    assert.deepEqual(urls, ['http://backend.test/api/v1/recovery?user_id=7']);
    // A previously retained refetch callback must also be safe after logout.
    observer.setOptions(api.recoveriesQueryOptions(undefined, false));
    await refetch();
    assert.equal(urls.length, 1);
  } finally {
    observer.destroy();
    client.clear();
  }
});

test('confirmation POSTs a recovery before PATCHing the sum and accepts empty 204', async () => {
  signIn();
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, method: options.method, body: JSON.parse(options.body) });
    assert.equal(options.headers.Authorization, 'Bearer test-access');
    return new Response(null, { status: options.method === 'POST' ? 201 : 204 });
  };
  const confirmation = new api.RecoveryConfirmation();
  assert.equal(await confirmation.confirm(createBody, 100, 7), 107);
  assert.deepEqual(calls, [
    { url: 'http://backend.test/api/v1/recovery', method: 'POST', body: createBody },
    {
      url: 'http://backend.test/api/v1/user/5',
      method: 'PATCH',
      body: { eco_points: 107 },
    },
  ]);
  assert.equal(await confirmation.confirm(createBody, 107, 7), 107);
  assert.equal(calls.length, 2);
});

test('POST failure never updates the user balance', async () => {
  signIn();
  const calls = [];
  globalThis.fetch = async (_url, options) => {
    calls.push(options.method);
    return new Response(JSON.stringify({ message: ['Invalid date'] }), { status: 400 });
  };
  const confirmation = new api.RecoveryConfirmation();
  await assert.rejects(confirmation.confirm(createBody, 100, 7), /Invalid date/);
  assert.deepEqual(calls, ['POST']);
  assert.equal(confirmation.recoveryCreated, false);
});

test('PATCH retry keeps the original total and does not create another recovery', async () => {
  signIn();
  const calls = [];
  let failPatch = true;
  globalThis.fetch = async (_url, options) => {
    calls.push({ method: options.method, body: JSON.parse(options.body) });
    if (options.method === 'PATCH' && failPatch)
      return new Response('{}', { status: 500 });
    return new Response(null, { status: options.method === 'POST' ? 201 : 204 });
  };
  const confirmation = new api.RecoveryConfirmation();
  await assert.rejects(confirmation.confirm(createBody, 100, 7));
  assert.equal(confirmation.recoveryCreated, true);
  failPatch = false;
  assert.equal(await confirmation.confirm(createBody, 107, 7), 107);
  assert.deepEqual(
    calls.map((call) => call.method),
    ['POST', 'PATCH', 'PATCH'],
  );
  assert.deepEqual(calls[2].body, { eco_points: 107 });
});

test('rejects duplicate submissions while the first request is pending', async () => {
  signIn();
  let resolvePost;
  globalThis.fetch = async (_url, options) =>
    options.method === 'POST'
      ? new Promise((resolve) => {
          resolvePost = resolve;
        })
      : new Response(null, { status: 204 });
  const confirmation = new api.RecoveryConfirmation();
  const first = confirmation.confirm(createBody, 100, 7);
  await assert.rejects(confirmation.confirm(createBody, 100, 7), /enviando/);
  resolvePost(new Response(null, { status: 201 }));
  assert.equal(await first, 107);
});

test('requires a session and nonnegative integer points before sending a request', async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw new Error('Unexpected');
  };
  for (const points of [-1, NaN, 1.5, Infinity]) {
    await assert.rejects(new api.RecoveryConfirmation().confirm(createBody, 100, points));
  }
  await assert.rejects(
    new api.RecoveryConfirmation().confirm(createBody, 100, 7),
    /sesión/,
  );
  assert.equal(calls, 0);
});

test('preserves UUID, scheduled date, address, description, weight and comments', () => {
  const report = api.recoveryToReport(recovery);
  assert.equal(report.rre_id, recovery.id);
  assert.equal(report.rre_fecha_reporte, recovery.scheduled_date);
  assert.equal(report.rre_direccion_texto, recovery.address);
  assert.equal(report.rre_foto_descripcion, recovery.description);
  assert.equal(report.rre_cantidad_kg, '12.5');
  assert.equal(report.comments, recovery.comments);
});

test('maps every backend status without treating canceled or expired requests as active', () => {
  const expected = [
    'EN_ESPERA',
    'EN_ESPERA',
    'ACEPTADO',
    'EXPIRADO',
    'CANCELADO',
    'RECOGIDO',
  ];
  expected.forEach((state, status) => {
    assert.equal(api.recoveryToReport({ ...recovery, status }).rre_estado, state);
  });
});

test('GET requests the current user and includes the access token', async () => {
  api.saveAuthTokens({ accessToken: 'test-access', refreshToken: 'test-refresh' });
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'http://backend.test/api/v1/recovery?user_id=5');
    assert.equal(options.headers.Authorization, 'Bearer test-access');
    return new Response(JSON.stringify({ data: [recovery] }));
  };
  assert.equal((await api.apiGetRecoveries(5))[0].rre_id, recovery.id);
});

test('handles nested user relations without storing unrelated user fields', async () => {
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        data: [{ ...recovery, user_id: { id: 5, email: 'private@example.com' } }],
      }),
    );
  const [report] = await api.apiGetRecoveries(5);
  assert.equal(report.usu_ciudadano_id, 5);
  assert.equal(JSON.stringify(report).includes('private@example.com'), false);
});

test('does not display records belonging to another user', async () => {
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ data: [{ ...recovery, user_id: 99 }] }));
  assert.deepEqual(await api.apiGetRecoveries(5), []);
});

test('accepts an empty list from the backend', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ data: [] }));
  assert.deepEqual(await api.apiGetRecoveries(5), []);
});

test('surfaces HTTP and malformed response errors instead of falling back to mock data', async () => {
  globalThis.fetch = async () => new Response('{}', { status: 500 });
  await assert.rejects(api.apiGetRecoveries(5));
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ data: [{ ...recovery, status: 99 }] }));
  await assert.rejects(api.apiGetRecoveries(5));
});
