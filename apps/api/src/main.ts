import { createServer } from 'node:http';
import { Logger } from 'nestjs-pino';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';
import { DEFAULT_CORS_ORIGINS } from './common/config/cors-origins';
import { EnvironmentVariables } from './common/config/env.validation';

async function bootstrap(): Promise<void> {
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      bufferLogs: true,
    });
    app.useLogger(app.get(Logger));
    app.set('trust proxy', 1);
    configureApp(app);
    const config = app.get(ConfigService<EnvironmentVariables, true>);
    const port = config.get('PORT', { infer: true });
    await app.listen(process.env.PORT ?? port);
  } catch (error) {
    console.error('ROOTACA API bootstrap failed', error);
    await listenWithDiagnostic(error);
  }
}

function listenWithDiagnostic(error: unknown): Promise<void> {
  const message = error instanceof Error ? error.message : 'Unknown bootstrap error';
  const allowedOrigins = new Set<string>(DEFAULT_CORS_ORIGINS);
  const port = Number(process.env.PORT ?? 3000);
  const server = createServer((req, res) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type,Accept,Origin');
    res.setHeader('Vary', 'Origin');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    res.statusCode = 503;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ statusCode: 503, message }));
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve());
  });
}

void bootstrap();
