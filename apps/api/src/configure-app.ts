import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { isAllowedCorsOrigin, mergeCorsOrigins } from './common/config/cors-origins';
import { EnvironmentVariables } from './common/config/env.validation';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService<EnvironmentVariables, true>);
  const globalPrefix = config.get('API_PREFIX', { infer: true });

  app.setGlobalPrefix(globalPrefix);
  if (!process.env.VERCEL) {
    app.enableShutdownHooks();
  }
  const allowedOrigins = mergeCorsOrigins(config.get('CORS_ORIGIN', { infer: true }));
  app.enableCors({
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
      callback(null, isAllowedCorsOrigin(origin, allowedOrigins));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'Origin'],
    optionsSuccessStatus: 204,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  if (process.env.VERCEL) {
    return;
  }

  const swaggerConfig = new DocumentBuilder()
    .setTitle('ROOTACA Growth OS API')
    .setDescription(
      'HTTP API for ROOTACA Growth OS. Use the Authorize button with a JWT access token from /auth/login.',
    )
    .setVersion('0.0.1')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'JWT',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${globalPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}
