import { plainToInstance, Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min, validateSync } from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

export class EnvironmentVariables {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @Transform(({ value }) => {
    if (value === undefined || value === '') {
      return 3000;
    }

    return Number(value);
  })
  @IsInt()
  @Min(1)
  PORT = 3000;

  @IsString()
  API_PREFIX = 'api';

  @IsString()
  CORS_ORIGIN =
    'http://localhost:4200,https://rootaca-admin.web.app,https://rootaca-admin.firebaseapp.com';

  @IsString()
  DATABASE_URL!: string;

  @IsOptional()
  @IsString()
  DIRECT_URL?: string;

  @IsString()
  JWT_SECRET!: string;

  @IsString()
  JWT_EXPIRES_IN = '15m';

  @IsString()
  JWT_REFRESH_EXPIRES_IN = '7d';

  @IsOptional()
  @IsString()
  LOG_LEVEL = 'info';

  /** Research discovery — optional; API starts even when unset. */
  @IsOptional()
  @IsString()
  RESEARCH_DISCOVERY_PROVIDER?: string;

  @IsOptional()
  @IsString()
  RESEARCH_DISCOVERY_API_KEY?: string;

  @IsOptional()
  @IsString()
  RESEARCH_DISCOVERY_API_URL?: string;

  @IsOptional()
  @IsString()
  RESEARCH_DISCOVERY_ENGINE?: string;

  @IsOptional()
  @IsString()
  RESEARCH_DISCOVERY_TIMEOUT_MS?: string;

  @IsOptional()
  @IsString()
  RESEARCH_DISCOVERY_MAX_RETRIES?: string;

  @IsOptional()
  @IsString()
  RESEARCH_DISCOVERY_CONCURRENCY?: string;

  @IsOptional()
  @IsString()
  RESEARCH_DISCOVERY_REQUEST_DELAY_MS?: string;

  @IsOptional()
  @IsString()
  RESEARCH_DISCOVERY_CACHE_TTL_MS?: string;

  @IsOptional()
  @IsString()
  RESEARCH_ENRICHMENT_ENABLED?: string;

  @IsOptional()
  @IsString()
  RESEARCH_ENRICHMENT_MAX_PAGES?: string;

  @IsOptional()
  @IsString()
  RESEARCH_ENRICHMENT_MAX_BYTES?: string;

  @IsOptional()
  @IsString()
  RESEARCH_ENRICHMENT_TIMEOUT_MS?: string;

  @IsOptional()
  @IsString()
  RESEARCH_OVERPASS_ENABLED?: string;

  @IsOptional()
  @IsString()
  RESEARCH_OVERPASS_API_URL?: string;

  @IsOptional()
  @IsString()
  RESEARCH_OVERPASS_USER_AGENT?: string;

  @IsOptional()
  @IsString()
  RESEARCH_OVERPASS_TIMEOUT_MS?: string;

  @IsOptional()
  @IsString()
  RESEARCH_OVERPASS_MAX_RESULTS?: string;

  @IsOptional()
  @IsString()
  RESEARCH_OVERPASS_CONCURRENCY?: string;

  @IsOptional()
  @IsString()
  RESEARCH_OVERPASS_MAX_RETRIES?: string;

  @IsOptional()
  @IsString()
  RESEARCH_OVERPASS_REQUEST_DELAY_MS?: string;

  @IsOptional()
  @IsString()
  RESEARCH_OVERPASS_CACHE_TTL_MS?: string;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, {
    skipMissingProperties: false,
    whitelist: true,
    forbidNonWhitelisted: false,
  });

  if (errors.length > 0) {
    const messages = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('; ');

    throw new Error(`Environment validation failed: ${messages}`);
  }

  return validated;
}
