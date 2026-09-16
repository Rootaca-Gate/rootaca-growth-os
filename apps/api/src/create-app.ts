import { Logger } from 'nestjs-pino';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import type { Express } from 'express';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';

export async function createApp(expressApp?: Express): Promise<NestExpressApplication> {
  const app = expressApp
    ? await NestFactory.create<NestExpressApplication>(AppModule, new ExpressAdapter(expressApp), {
        bufferLogs: true,
      })
    : await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));
  app.set('trust proxy', 1);
  configureApp(app);
  await app.init();
  return app;
}
