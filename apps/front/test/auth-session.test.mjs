import assert from 'node:assert/strict';
import { test, beforeEach, afterEach } from 'node:test';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const bundle = await build({
  stdin: {
    contents: 'export * from "../src/lib/api"; export * from "../src/lib/auth-session";',
    resolveDir: fileURLToPath(new URL('.', import.meta.url)),
    loader: 'ts',
  },
  bundle: true,
  write: false,
  platform: 'node',
  format: 'esm',
  define: { 'import.meta.env.VITE_APP_BACKEND_API': '"http://backend.test/api/v1"' },
});
const moduleUrl =
  'data:text/javascript;base64,' +
  Buffer.from(bundle.outputFiles[0].text).toString('base64');
let iteration = 0;
let stored;
const originalFetch = globalThis.fetch;
const originalStorage = globalThis.sessionStorage;
beforeEach(() => {
  stored = new Map();
  globalThis.sessionStorage = {
    getItem: (key) => stored.get(key) ?? null,
    setItem: (key, value) => stored.set(key, value),
    removeItem: (key) => stored.delete(key),
  };
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalStorage === undefined) delete globalThis.sessionStorage;
  else globalThis.sessionStorage = originalStorage;
});
const load = () => import(moduleUrl + '#' + iteration++);
const tokens = { accessToken: 'old-access', refreshToken: 'old-refresh' };
const profile = {
  user_id: 7,
  rol: 'CIUDADANO',
  nombres: 'John',
  apellidos: 'Doe',
  telefono: '3001234567',
  email: 'john@example.com',
  direccion: 'Calle 1',
  puntos_acumulados: 100,
  nivel_gamificacion: 1,
};

test('profile and user_id survive a reload with the session tokens', async () => {
  const first = await load();
  first.saveAuthTokens(tokens);
  first.saveAuthUser(profile);
  assert.deepEqual(JSON.parse(stored.get('eco_auth_user')), profile);
  const reloaded = await load();
  assert.deepEqual(reloaded.getAuthUser(), profile);
});

test('updated profile points persist across reload and logout clears the profile', async () => {
  const first = await load();
  first.saveAuthTokens(tokens);
  first.saveAuthUser({ ...profile, puntos_acumulados: 107 });
  const reloaded = await load();
  assert.equal(reloaded.getAuthUser().puntos_acumulados, 107);
  reloaded.clearAuthTokens();
  assert.equal(stored.has('eco_auth_user'), false);
  assert.equal((await load()).getAuthUser(), null);
});

test('a profile without tokens or with an invalid user ID cannot restore a session', async () => {
  stored.set('eco_auth_user', JSON.stringify(profile));
  assert.equal((await load()).getAuthUser(), null);
  stored.set('eco_auth_tokens', JSON.stringify(tokens));
  stored.set('eco_auth_user', JSON.stringify({ ...profile, user_id: undefined }));
  assert.equal((await load()).getAuthUser(), null);
});
const response = () =>
  new Response(
    JSON.stringify({
      data: {
        at_secret: 'new-access',
        rt_secret: 'new-refresh',
        user: {
          id: 5,
          name: 'Usuario',
          rol: 1,
          eco_points: 250,
          phone: '123',
          email: 'user@example.com',
          address: 'Dirección del usuario',
        },
      },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );

test('login returns both tokens and current user data', async () => {
  const api = await load();
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'http://backend.test/api/v1/auth/login');
    assert.deepEqual(JSON.parse(options.body), {
      email: 'user@example.com',
      password: 'test-password',
    });
    return response();
  };
  const result = await api.apiLogin('user@example.com', 'test-password');
  assert.equal(result.success, true);
  assert.deepEqual(result.tokens, {
    accessToken: 'new-access',
    refreshToken: 'new-refresh',
  });
  assert.equal(result.data.puntos_acumulados, 250);
  assert.equal(result.data.email, 'user@example.com');
  assert.equal(result.data.direccion, 'Dirección del usuario');
  assert.equal(result.data.telefono, '123');
});

test('stored tokens survive a module reload within the browser session', async () => {
  const first = await load();
  first.saveAuthTokens(tokens);
  const second = await load();
  assert.deepEqual(second.getAuthTokens(), tokens);
});

test('restoration sends the refresh token, updates both tokens and returns user data', async () => {
  const api = await load();
  api.saveAuthTokens(tokens);
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'http://backend.test/api/v1/auth/refresh');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, 'Bearer old-refresh');
    return response();
  };
  const result = await api.apiRestoreSession();
  assert.equal(result.data.user_id, 5);
  assert.equal(result.data.puntos_acumulados, 250);
  assert.deepEqual(api.getAuthTokens(), {
    accessToken: 'new-access',
    refreshToken: 'new-refresh',
  });
});

test('concurrent restorations share a single refresh request', async () => {
  const api = await load();
  api.saveAuthTokens(tokens);
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return response();
  };
  const first = api.apiRestoreSession();
  const second = api.apiRestoreSession();
  assert.equal(first, second);
  await Promise.all([first, second]);
  assert.equal(calls, 1);
});

test('refresh uses data.user for every profile field instead of top-level stale data', async () => {
  const api = await load();
  api.saveAuthTokens(tokens);
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        user: { id: 99, name: 'Outdated', email: 'old@example.com', eco_points: 1 },
        data: {
          at_secret: 'refreshed-access',
          rt_secret: 'refreshed-refresh',
          user: {
            id: 5,
            name: 'Nombre actualizado',
            email: 'current@example.com',
            phone: '+573001234567',
            address: 'Dirección actualizada',
            eco_points: 725,
            rol: 2,
          },
        },
      }),
    );
  const result = await api.apiRestoreSession();
  assert.equal(result.success, true);
  assert.deepEqual(result.data, {
    user_id: 5,
    nombres: 'Nombre actualizado',
    apellidos: '',
    email: 'current@example.com',
    telefono: '+573001234567',
    direccion: 'Dirección actualizada',
    puntos_acumulados: 725,
    rol: '2',
    nivel_gamificacion: 1,
  });
});

test('refresh refuses to restore a user outside data.user', async () => {
  const api = await load();
  api.saveAuthTokens(tokens);
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        user: { id: 5, name: 'Wrong location', rol: 1 },
        data: { at_secret: 'access', rt_secret: 'refresh' },
      }),
    );
  assert.equal((await api.apiRestoreSession()).success, false);
  assert.equal(api.getAuthTokens(), null);
});

test('rejected refresh clears persisted and memory tokens', async () => {
  const api = await load();
  api.saveAuthTokens(tokens);
  globalThis.fetch = async () => new Response('{}', { status: 401 });
  assert.equal((await api.apiRestoreSession()).success, false);
  assert.equal(api.getAuthTokens(), null);
  assert.equal(stored.size, 0);
});

test('logout during a pending refresh prevents restoration', async () => {
  const api = await load();
  api.saveAuthTokens(tokens);
  let resolve;
  globalThis.fetch = () =>
    new Promise((done) => {
      resolve = done;
    });
  const pending = api.apiRestoreSession();
  api.clearAuthTokens();
  resolve(response());
  assert.equal((await pending).success, false);
  assert.equal(api.getAuthTokens(), null);
});

test('a late refresh cannot overwrite a newer login', async () => {
  const api = await load();
  api.saveAuthTokens(tokens);
  let resolve;
  globalThis.fetch = () =>
    new Promise((done) => {
      resolve = done;
    });
  const pending = api.apiRestoreSession();
  const newLogin = { accessToken: 'another-access', refreshToken: 'another-refresh' };
  api.saveAuthTokens(newLogin);
  resolve(response());
  assert.equal((await pending).success, false);
  assert.deepEqual(api.getAuthTokens(), newLogin);
});

test('a malformed refresh response cannot authenticate the user', async () => {
  const api = await load();
  api.saveAuthTokens(tokens);
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ data: { user: { id: 5, name: 'Usuario', rol: 1 } } }));
  assert.equal((await api.apiRestoreSession()).success, false);
  assert.equal(api.getAuthTokens(), null);
});

test('without stored tokens there is no refresh request', async () => {
  const api = await load();
  globalThis.fetch = async () => {
    throw new Error('Must not request');
  };
  assert.equal((await api.apiRestoreSession()).success, false);
});

test('unavailable browser storage still allows an in-memory session', async () => {
  const api = await load();
  globalThis.sessionStorage = {
    setItem() {
      throw new Error('Unavailable');
    },
    getItem() {
      throw new Error('Unavailable');
    },
    removeItem() {
      throw new Error('Unavailable');
    },
  };
  api.saveAuthTokens(tokens);
  assert.deepEqual(api.getAuthTokens(), tokens);
  api.clearAuthTokens();
  assert.equal(api.getAuthTokens(), null);
});
