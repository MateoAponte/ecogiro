import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import {
  ScanAnalyzerProvider,
  DEFAULT_SCAN_MODEL,
} from './scan-analyzer.provider';
import { ScanService } from '../scan.service';
import { ANALYZE_JSON_SCHEMA } from '../schemas/analyze.schema';

const analysis = {
  is_plastic: true,
  reason_invalid: null,
  materials: ['2 botellas plásticas; resina no confirmada'],
  preparation: ['Vacía los envases.', 'Enjuaga y deja secar.'],
  impact: ['Recuperación de materials.'],
  environmental_damage: ['Desechados en el entorno, pueden afectar la fauna.'],
  weight_estimate: 0.045,
};
const result = (value: unknown = analysis) => ({
  candidates: [
    {
      finishReason: 'STOP',
      content: { parts: [{ text: JSON.stringify(value) }] },
    },
  ],
});
const response = (body: unknown) => new Response(JSON.stringify(body));

describe('Gemini Analyze provider', () => {
  let key: string;
  let model: string | undefined;
  const config = {
    get: (name: string) =>
      name === 'GEMINI_API_KEY'
        ? key
        : name === 'GEMINI_SCAN_MODEL'
          ? model
          : undefined,
  };
  const provider = new ScanAnalyzerProvider(config as unknown as ConfigService);
  const service = new ScanService(provider, undefined as never);
  const image = {
    buffer: Buffer.from('test-photo'),
    mimetype: 'image/png',
    size: 10,
  };
  let fetchMock: jest.SpyInstance;
  beforeEach(() => {
    key = 'fake-gemini-key';
    model = undefined;
    fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(response(result()));
  });
  afterEach(() => fetchMock.mockRestore());

  it('sends inline image data and JSON schema to Gemini, keeping credentials out of URLs', async () => {
    expect(await provider.analyze(image)).toMatchObject(analysis);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(
      `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_SCAN_MODEL}:generateContent`,
    );
    expect(url).not.toContain(key);
    expect(options.headers['x-goog-api-key']).toBe(key);
    expect(options.headers.Authorization).toBeUndefined();
    const body = JSON.parse(options.body);
    expect(body.generationConfig.responseMimeType).toBe('application/json');
    expect(body.generationConfig.responseJsonSchema).toEqual(
      ANALYZE_JSON_SCHEMA,
    );
    expect(body.generationConfig.responseFormat).toBeUndefined();
    expect(body.contents[0].parts[1].inlineData).toEqual({
      mimeType: 'image/png',
      data: image.buffer.toString('base64'),
    });
    expect(body.systemInstruction.parts[0].text).toContain('EcoGiro');
    expect(body.store).toBeUndefined();
  });
  it('uses the configured model', async () => {
    model = 'gemini-3.8-flash';
    await provider.analyze(image);
    expect(fetchMock.mock.calls[0][0]).toContain(
      '/models/gemini-3.8-flash:generateContent',
    );
  });
  it('requires the Gemini key without falling back to OpenAI', async () => {
    key = '';
    await expect(provider.analyze(image)).rejects.toThrow('GEMINI_API_KEY');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('preserves the five-field public contract and numeric kg', async () => {
    const output = await service.analyze(image);
    expect(Object.keys(output).sort()).toEqual(
      [
        'materials',
        'preparation',
        'impact',
        'environmental_damage',
        'weight_estimate',
      ].sort(),
    );
    expect(output.weight_estimate).toBe(0.045);
    expect(output.preparation).toEqual([
      '1. Vacía los envases.',
      '2. Enjuaga y deja secar.',
    ]);
  });
  it('returns 422 for images without identifiable plastic', async () => {
    fetchMock.mockResolvedValue(
      response(
        result({
          is_plastic: false,
          reason_invalid: 'No se identifica plástico.',
          materials: [],
          preparation: [],
          impact: [],
          environmental_damage: [],
          weight_estimate: null,
        }),
      ),
    );
    await expect(service.analyze(image)).rejects.toMatchObject({
      status: 422,
      message: 'No se identifica plástico.',
    });
  });
  it('ignores thinking parts and uses only the final response text', async () => {
    fetchMock.mockResolvedValue(
      response({
        candidates: [
          {
            finishReason: 'STOP',
            content: {
              parts: [
                { thought: true, text: 'Not JSON reasoning' },
                { text: JSON.stringify(analysis) },
              ],
            },
          },
        ],
      }),
    );
    expect(await provider.analyze(image)).toMatchObject(analysis);
  });
  it.each([
    { promptFeedback: { blockReason: 'SAFETY' } },
    { candidates: [{ finishReason: 'SAFETY' }] },
    { candidates: [{ finishReason: 'PROHIBITED_CONTENT' }] },
  ])('returns 422 for blocked images %#', async (body) => {
    fetchMock.mockResolvedValue(response(body));
    await expect(provider.analyze(image)).rejects.toMatchObject({
      status: 422,
    });
  });
  it.each([
    {},
    { candidates: [] },
    {
      candidates: [
        { finishReason: 'MAX_TOKENS', content: { parts: [{ text: '{}' }] } },
      ],
    },
    { candidates: [{ finishReason: 'STOP', content: { parts: [] } }] },
    result({ ...analysis, weight_estimate: '0.045' }),
    result({ ...analysis, weight_estimate: -1 }),
    result({ ...analysis, unexpected: true }),
  ])('rejects missing, malformed or truncated results %#', async (body) => {
    fetchMock.mockResolvedValue(response(body));
    await expect(provider.analyze(image)).rejects.toMatchObject({
      status: 502,
    });
  });
  it.each([
    [400, 'API_KEY_INVALID', 'API key'],
    [400, 'API_KEY_EXPIRED', 'API key'],
    [400, undefined, 'formato de la imagen o la configuración'],
    [401, undefined, 'API key'],
    [403, undefined, 'permisos'],
    [404, undefined, 'modelo de Gemini'],
    [429, undefined, 'cuota o el límite'],
    [503, undefined, 'temporalmente ocupado'],
    [500, undefined, 'no pudo completar'],
  ])(
    'maps provider status %s and reason %s without leaking details',
    async (status, reason, expected) => {
      fetchMock.mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              message: 'private-key-or-project-details',
              details: [{ reason }],
            },
          }),
          { status: Number(status) },
        ),
      );
      try {
        await provider.analyze(image);
        throw new Error('Expected failure');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as Error).message).toContain(expected);
        expect((error as Error).message).not.toContain(
          'private-key-or-project-details',
        );
      }
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );
  it('handles errors that are not JSON', async () => {
    fetchMock.mockResolvedValue(
      new Response('private raw error', { status: 403 }),
    );
    await expect(provider.analyze(image)).rejects.toThrow('permisos');
  });
  it('maps timeouts to 504', async () => {
    fetchMock.mockRejectedValue(
      Object.assign(new Error('timeout'), { name: 'TimeoutError' }),
    );
    await expect(provider.analyze(image)).rejects.toMatchObject({
      status: 504,
    });
  });
  it('does not leak network errors or automatically retry', async () => {
    fetchMock.mockRejectedValue(new Error('private network details'));
    await expect(provider.analyze(image)).rejects.toMatchObject({
      status: 502,
      message: 'No se pudo obtener un análisis válido de Gemini.',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
