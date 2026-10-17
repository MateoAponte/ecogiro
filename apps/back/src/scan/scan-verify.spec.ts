import {
  BadGatewayException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AnalyzeResponseDto } from './dto/analyze-output.dto';
import { ScanAnalysisPipe } from './pipes/scan-analysis.pipe';
import { ScanAnalyzerProvider } from './providers/scan-analyzer.provider';
import { ScanVerifierProvider } from './providers/scan-verifier.provider';
import { calculateScanPoints, VerifiedItem } from './scan-points';
import { ScanService } from './scan.service';

const analysis: AnalyzeResponseDto = {
  materials: ['Botella PET'],
  preparation: ['1. Enjuaga'],
  impact: ['Recupera materia prima'],
  environmental_damage: ['Puede dispersarse'],
  weight_estimate: 0.045,
};
const image = { buffer: Buffer.from('photo'), size: 5, mimetype: 'image/png' };
const item: VerifiedItem = {
  material: 'PET',
  weight_kg: 0.045,
  containers: 2,
  caps: 2,
  labels: 1,
};
const match = { matches: true, issues: [], items: [item] };
const mismatch = { matches: false, issues: ['Cantidad incorrecta'], items: [] };

describe('Verify orchestration', () => {
  const analyzer = { analyze: jest.fn() };
  const verifier = { verify: jest.fn() };
  const service = new ScanService(
    analyzer as unknown as ScanAnalyzerProvider,
    verifier as unknown as ScanVerifierProvider,
  );
  beforeEach(() => jest.resetAllMocks());

  it('calculates points from verified evidence without reanalyzing', async () => {
    verifier.verify.mockResolvedValue(match);
    expect(await service.verify(image, analysis)).toEqual({
      ...analysis,
      eco_points: 7,
    });
    expect(analyzer.analyze).not.toHaveBeenCalled();
  });
  it('reanalyzes once with discrepancy feedback and returns the corrected analysis', async () => {
    verifier.verify
      .mockResolvedValueOnce(mismatch)
      .mockResolvedValueOnce(match);
    analyzer.analyze.mockResolvedValue({
      ...analysis,
      materials: ['2 botellas PET'],
      is_plastic: true,
      reason_invalid: null,
    });
    expect(await service.verify(image, analysis)).toMatchObject({
      materials: ['2 botellas PET'],
      eco_points: 7,
    });
    expect(analyzer.analyze).toHaveBeenCalledTimes(1);
    expect(analyzer.analyze).toHaveBeenCalledWith(image, mismatch.issues);
    expect(verifier.verify).toHaveBeenCalledTimes(2);
  });
  it('rejects a second mismatch and never loops', async () => {
    verifier.verify.mockResolvedValue(mismatch);
    analyzer.analyze.mockResolvedValue({
      ...analysis,
      is_plastic: true,
      reason_invalid: null,
    });
    await expect(service.verify(image, analysis)).rejects.toThrow(
      'Se requiere una foto más clara',
    );
    expect(analyzer.analyze).toHaveBeenCalledTimes(1);
    expect(verifier.verify).toHaveBeenCalledTimes(2);
  });
  it('rejects non-plastic reanalysis with the clearer photo error', async () => {
    verifier.verify.mockResolvedValue(mismatch);
    analyzer.analyze.mockResolvedValue({
      is_plastic: false,
      reason_invalid: 'No hay plástico',
    });
    await expect(service.verify(image, analysis)).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
    expect(verifier.verify).toHaveBeenCalledTimes(1);
  });
  it('does not retry provider outages', async () => {
    verifier.verify.mockRejectedValue(new ServiceUnavailableException());
    await expect(service.verify(image, analysis)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(analyzer.analyze).not.toHaveBeenCalled();
  });
});

describe('Deterministic scoring and request validation', () => {
  it('adds visible component bonuses and rounds only once', () => {
    expect(calculateScanPoints([item], 0.045).points).toBe(7);
    expect(
      calculateScanPoints(
        [{ ...item, material: 'UNKNOWN', caps: 0, labels: 0 }],
        0.045,
      ).points,
    ).toBe(0);
    expect(
      calculateScanPoints(
        [
          { ...item, weight_kg: 0.02, caps: 0, labels: 0 },
          { ...item, weight_kg: 0.025, caps: 0, labels: 0 },
        ],
        0.045,
      ).points,
    ).toBe(2);
  });
  it.each([
    { ...item, caps: 3 },
    { ...item, labels: -1 },
    { ...item, weight_kg: 0.2 },
    { ...item, weight_kg: 0.0451 },
    { ...item, material: 'INVENTED' },
    { ...item, containers: 1.5 },
  ])('rejects inconsistent evidence: %j', (invalid) => {
    expect(() => calculateScanPoints([invalid as VerifiedItem], 0.045)).toThrow(
      BadGatewayException,
    );
  });
  const pipe = new ScanAnalysisPipe();
  it('accepts only the renamed public analysis payload', () => {
    expect(pipe.transform(JSON.stringify(analysis))).toEqual(analysis);
  });
  it.each([
    null,
    '{}',
    'invalid',
    JSON.stringify({ ...analysis, points: 9999 }),
    JSON.stringify({ ...analysis, materials: [] }),
    JSON.stringify({ ...analysis, weight_estimate: -1 }),
  ])('rejects malformed input: %s', (input) => {
    expect(() => pipe.transform(input)).toThrow();
  });
});
