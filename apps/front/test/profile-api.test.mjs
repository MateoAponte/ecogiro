import assert from 'node:assert/strict';
import { test, beforeEach, afterEach } from 'node:test';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const bundle = await build({
  stdin: {
    contents:
      'export * from "../src/lib/profile-api"; export * from "../src/lib/auth-session";',
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
const form = {
  nombres: ' John ',
  apellidos: ' Doe ',
  email: ' john@example.com ',
  telefono: '+573001234567',
  direccion: ' Calle 1 ',
  imageUrl: 'data:image/png;base64,photo',
};
beforeEach(() =>
  api.saveAuthTokens({ accessToken: 'test-access', refreshToken: 'test-refresh' }),
);
afterEach(() => {
  globalThis.fetch = originalFetch;
  api.clearAuthTokens();
});

test('PATCH maps the editable profile to backend fields and accepts an empty 204', async () => {
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls++;
    assert.equal(url, 'http://backend.test/api/v1/user/7');
    assert.equal(options.method, 'PATCH');
    assert.equal(options.headers.Authorization, 'Bearer test-access');
    assert.equal(options.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(options.body), {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+573001234567',
      address: 'Calle 1',
    });
    return new Response(null, { status: 204 });
  };
  const saved = await api.apiUpdateUserProfile(7, form);
  assert.equal(saved.name, 'John Doe');
  assert.equal(calls, 1);
});

test('does not require a separate surname and normalizes national and +57 phones', async () => {
  globalThis.fetch = async (_url, options) => {
    assert.equal(JSON.parse(options.body).name, 'John Doe');
    assert.equal(JSON.parse(options.body).phone, '+573001234567');
    return new Response(null, { status: 204 });
  };
  await api.apiUpdateUserProfile(7, {
    ...form,
    nombres: 'John Doe',
    apellidos: '',
    telefono: '3001234567',
  });
  assert.equal(api.localPhone('+57 300 123 4567'), '3001234567');
});

test('propagates server validation and session expiration errors', async () => {
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ message: ['Email already exists'] }), { status: 409 });
  await assert.rejects(api.apiUpdateUserProfile(7, form), /Email already exists/);
  globalThis.fetch = async () => new Response(null, { status: 401 });
  await assert.rejects(api.apiUpdateUserProfile(7, form), /sesión expiró/);
});

test('validates profile and user ID before sending a request', async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw new Error('Unexpected');
  };
  for (const invalid of [
    { ...form, email: 'invalid' },
    { ...form, nombres: '', apellidos: '' },
    { ...form, telefono: '123' },
    { ...form, direccion: '' },
  ]) {
    await assert.rejects(api.apiUpdateUserProfile(7, invalid));
  }
  await assert.rejects(api.apiUpdateUserProfile(undefined, form));
  api.clearAuthTokens();
  await assert.rejects(api.apiUpdateUserProfile(7, form), /sesión/);
  assert.equal(calls, 0);
});
