import assert from 'node:assert/strict';
import { test, afterEach } from 'node:test';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const bundle = await build({
  stdin: {
    contents: 'export * from "../src/lib/recoveries-api"; export * from "../src/lib/auth-session";',
    resolveDir: fileURLToPath(new URL('.', import.meta.url)), loader: 'ts',
  },
  bundle: true, write: false, platform: 'node', format: 'esm',
  define: { 'import.meta.env.VITE_APP_BACKEND_API': '"http://backend.test/api/v1"' },
});
const api = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; api.clearAuthTokens(); });
const recovery = {
  id: '40204db7-7240-4733-a998-aa811bca8634',
  scheduled_date: '2026-10-20T15:00:00.000Z',
  description: 'Botellas reciclables', address: 'Dirección real',
  comments: 'Llamar al llegar', recycled_kg: 12.5, status: 2, user_id: 5,
};

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
  const expected = ['EN_ESPERA', 'EN_ESPERA', 'ACEPTADO', 'EXPIRADO', 'CANCELADO', 'RECOGIDO'];
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
  globalThis.fetch = async () => new Response(JSON.stringify({ data: [
    { ...recovery, user_id: { id: 5, email: 'private@example.com' } },
  ] }));
  const [report] = await api.apiGetRecoveries(5);
  assert.equal(report.usu_ciudadano_id, 5);
  assert.equal(JSON.stringify(report).includes('private@example.com'), false);
});

test('does not display records belonging to another user', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ data: [{ ...recovery, user_id: 99 }] }));
  assert.deepEqual(await api.apiGetRecoveries(5), []);
});

test('accepts an empty list from the backend', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ data: [] }));
  assert.deepEqual(await api.apiGetRecoveries(5), []);
});

test('surfaces HTTP and malformed response errors instead of falling back to mock data', async () => {
  globalThis.fetch = async () => new Response('{}', { status: 500 });
  await assert.rejects(api.apiGetRecoveries(5));
  globalThis.fetch = async () => new Response(JSON.stringify({ data: [{ ...recovery, status: 99 }] }));
  await assert.rejects(api.apiGetRecoveries(5));
});
