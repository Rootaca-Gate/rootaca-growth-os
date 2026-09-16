import { ConfigService } from '@nestjs/config';
import { createApp } from './create-app';
import { EnvironmentVariables } from './common/config/env.validation';

async function bootstrap(): Promise<void> {
  const app = await createApp();
  const config = app.get(ConfigService<EnvironmentVariables, true>);
  const port = config.get('PORT', { infer: true });
  await app.listen(port);
}

void bootstrap();
