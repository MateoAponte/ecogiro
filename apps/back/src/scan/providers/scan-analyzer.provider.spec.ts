import { ConfigService } from '@nestjs/config';
import { ScanAnalyzerProvider } from './scan-analyzer.provider';

describe('Analyze provider errors', () => {
  const provider = new ScanAnalyzerProvider({
    get: () => 'test-config',
  } as unknown as ConfigService);
  const image = { buffer: Buffer.from('test'), mimetype: 'image/png', size: 4 };
  let fetchMock: jest.SpyInstance;
  beforeEach(() => {
    fetchMock = jest.spyOn(globalThis, 'fetch');
  });
  afterEach(() => fetchMock.mockRestore());

  it.each([
    [
      429,
      'credit_balance_exhausted',
      'insufficient_quota',
      'No hay saldo disponible',
    ],
    [
      429,
      'insufficient_quota',
      'insufficient_quota',
      'cuota de OpenAI está agotada',
    ],
    [
      429,
      'project_spend_limit_exceeded',
      'insufficient_quota',
      'límite de gasto o uso',
    ],
    [
      429,
      'organization_usage_limit_exceeded',
      'insufficient_quota',
      'límite de gasto o uso',
    ],
    [429, 'rate_limit_exceeded', 'rate_limit_error', 'temporalmente'],
    [401, 'invalid_api_key', 'invalid_request_error', 'API key'],
    [403, 'permission_denied', 'invalid_request_error', 'permisos'],
    [404, 'model_not_found', 'invalid_request_error', 'modelo configurado'],
    [500, 'server_error', 'server_error', 'no pudo completar'],
  ])(
    'maps status %s / %s without returning raw provider details',
    async (status, code, type, expected) => {
      fetchMock.mockResolvedValue(
        new Response(
          JSON.stringify({
            error: { code, type, message: 'private-secret-details' },
          }),
          { status: Number(status) },
        ),
      );
      await expect(provider.analyze(image)).rejects.toThrow(String(expected));
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  it('does not expose raw provider messages even on malformed errors', async () => {
    fetchMock.mockResolvedValue(
      new Response('private-secret-details', { status: 401 }),
    );
    try {
      await provider.analyze(image);
      throw new Error('Expected an error');
    } catch (error) {
      expect((error as Error).message).not.toContain('private-secret-details');
      expect((error as Error).message).toContain('API key');
    }
  });
});
