import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { ScanAnalysisPipe } from './pipes/scan-analysis.pipe';
import { ScanImagePipe } from './pipes/scan-image.pipe';
import { ScanController } from './scan.controller';
import { ScanService } from './scan.service';

describe('Verify multipart contract', () => {
  let app: INestApplication;
  const service = {
    verify: jest.fn().mockResolvedValue({ eco_points: 7 }),
  };
  const analysis = {
    materials: ['Botella'],
    preparation: ['Enjuaga'],
    impact: ['Recupera materia prima'],
    environmental_damage: ['Riesgo de dispersión'],
    weight_estimate: 0.045,
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ScanController],
      providers: [
        ScanAnalysisPipe,
        { provide: ScanService, useValue: service },
        {
          provide: ScanImagePipe,
          useValue: { transform: (file: unknown) => file },
        },
      ],
    })
      .overridePipe(ScanImagePipe)
      .useValue({ transform: (file: unknown) => file })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
        transform: true,
      }),
    );
    await app.init();
  });
  afterAll(async () => app.close());
  beforeEach(() => service.verify.mockClear());

  it('parses the analysis JSON string with the application validation pipeline enabled', async () => {
    await request(app.getHttpServer())
      .post('/scan/verify')
      .field('analysis', JSON.stringify(analysis))
      .attach('file', Buffer.from('photo'), 'bottle.png')
      .expect(200);
    expect(service.verify).toHaveBeenCalledWith(expect.any(Object), analysis);
  });
  it('rejects client supplied points before invoking Gemini', async () => {
    await request(app.getHttpServer())
      .post('/scan/verify')
      .field('analysis', JSON.stringify({ ...analysis, points: 10000 }))
      .attach('file', Buffer.from('photo'), 'bottle.png')
      .expect(400);
    expect(service.verify).not.toHaveBeenCalled();
  });
});
