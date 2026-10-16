import { NestFactory, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import {
  ClassSerializerInterceptor,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/httpException.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { API_PREFIX } from 'config/constants/prefix';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(helmet());
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new ResponseInterceptor(),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: true,
      stopAtFirstError: true,
    }),
  );

  app.useLogger(new Logger());
  app.setGlobalPrefix(API_PREFIX);

  const doc = new DocumentBuilder()
    .setTitle('Template API')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addBearerAuth() // habilita el botón de Authorize
    .build();

  const document = SwaggerModule.createDocument(app, doc);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(parseInt(config.get<string>('PORT') ?? '3000', 10));
}
void bootstrap();
