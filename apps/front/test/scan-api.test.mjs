import assert from 'node:assert/strict';
import { test, beforeEach, afterEach } from 'node:test';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const bundle = await build({
  stdin: {
    contents: 'export * from "../src/lib/scan-api"; export * from "../src/lib/auth-session";',
    resolveDir: fileURLToPath(new URL('.', import.meta.url)), loader: 'ts',
  },
  bundle: true, write: false, platform: 'node', format: 'esm',
  define: { 'import.meta.env.VITE_APP_BACKEND_API': '"http://backend.test/api/v1"' },
});
const api = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const originalFetch = globalThis.fetch;
const photo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZ1cAAAAASUVORK5CYII=';
const analysis = {
  materiales: ['2 botellas plásticas'],
  preparacion: ['1. Vacía los envases.', '2. Enjuaga y deja secar.'],
  impacto_inmediato: ['Recuperación de materiales.'],
  daño_ambiental: ['Riesgo para la fauna si terminan en el ambiente.'],
  peso_estimado: 0.045,
};
beforeEach(() => api.saveAuthTokens({ accessToken: 'test-access', refreshToken: 'test-refresh' }));
afterEach(() => { globalThis.fetch = originalFetch; api.clearAuthTokens(); });

test('sends one multipart photo with access token to the real Analyze endpoint', async () => {
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls++;
    assert.equal(url, 'http://backend.test/api/v1/scan/analyze');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, 'Bearer test-access');
    assert.equal(options.headers['Content-Type'], undefined);
    assert.ok(options.body instanceof FormData);
    assert.deepEqual([...options.body.keys()], ['file']);
    const file = options.body.get('file');
    assert.equal(file.name, 'scan.png');
    assert.equal(file.type, 'image/png');
    assert.deepEqual(Buffer.from(await file.arrayBuffer()), Buffer.from(photo.split(',')[1], 'base64'));
    return new Response(JSON.stringify({ statusCode: 200, data: analysis }));
  };
  assert.deepEqual(await api.apiAnalyzeImage(photo), analysis);
  assert.equal(calls, 1);
});

test('accepts Analyze without a fake points field and keeps weight numeric in kg', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ data: analysis }));
  const result = await api.apiAnalyzeImage(photo);
  assert.equal(result.peso_estimado, 0.045);
  assert.equal('puntaje' in result, false);
});

test('preserves JPEG and WEBP photo types', () => {
  assert.equal(api.scanPhotoToBlob('data:image/jpeg;base64,/9j/').type, 'image/jpeg');
  assert.equal(api.scanPhotoToBlob('data:image/webp;base64,UklGRg==').type, 'image/webp');
});

test('rejects unsupported image types and arbitrary URLs before upload', async () => {
  globalThis.fetch = async () => { throw new Error('Must not fetch'); };
  await assert.rejects(api.apiAnalyzeImage('https://example.com/photo.png'), /foto JPEG/);
  await assert.rejects(api.apiAnalyzeImage('data:image/svg+xml;base64,PHN2Zz4='), /foto JPEG/);
});

test('rejects images larger than 5 MB before upload', () => {
  const big = 'data:image/png;base64,' + Buffer.alloc(5 * 1024 * 1024 + 1).toString('base64');
  assert.throws(() => api.scanPhotoToBlob(big), /5 MB/);
});

test('requires a session without making any request', async () => {
  api.clearAuthTokens();
  globalThis.fetch = async () => { throw new Error('Must not fetch'); };
  await assert.rejects(api.apiAnalyzeImage(photo), /Inicia sesión/);
});

test('shows the backend reason when no plastic is detected and does not retry', async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return new Response(JSON.stringify({ message: 'No se identificó plástico en la foto.' }), { status: 422 });
  };
  await assert.rejects(api.apiAnalyzeImage(photo), /No se identificó plástico/);
  assert.equal(calls, 1);
});

test('shows session expiration for 401', async () => {
  globalThis.fetch = async () => new Response('{}', { status: 401 });
  await assert.rejects(api.apiAnalyzeImage(photo), /sesión expiró/);
});

test('shows backend configuration and size errors', async () => {
  for (const [status, message] of [[503, 'Configura OPENAI_API_KEY en el backend.'], [413, 'La foto no puede superar 5 MB.']]) {
    globalThis.fetch = async () => new Response(JSON.stringify({ message }), { status });
    await assert.rejects(api.apiAnalyzeImage(photo), (error) => error.message === message);
  }
});

test('rejects malformed results and old mock weight arrays', async () => {
  for (const data of [{ ...analysis, peso_estimado: ['Total: 50 g'] }, { ...analysis, materiales: [] }, { ...analysis, peso_estimado: 0 }]) {
    globalThis.fetch = async () => new Response(JSON.stringify({ data }));
    await assert.rejects(api.apiAnalyzeImage(photo), /análisis inválido/);
  }
});

test('reports connection errors', async () => {
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
  await assert.rejects(api.apiAnalyzeImage(photo), /No se pudo conectar/);
});

test('passes cancellation to fetch without replacing the abort error', async () => {
  const controller = new AbortController();
  const aborted = new DOMException('Canceled', 'AbortError');
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.signal, controller.signal);
    controller.abort();
    throw aborted;
  };
  await assert.rejects(api.apiAnalyzeImage(photo, controller.signal), (error) => error === aborted);
});
