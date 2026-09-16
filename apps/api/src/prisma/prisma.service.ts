import '@prisma/client/runtime/query_compiler_bg.postgresql.wasm-base64.js';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaNeonHTTP } from '@prisma/adapter-neon';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

function createAdapter(): PrismaNeonHTTP | PrismaPg {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }

  if (process.env.VERCEL || url.includes('neon.tech')) {
    return new PrismaNeonHTTP(url, {});
  }

  return new PrismaPg({ connectionString: url });
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    super({ adapter: createAdapter() });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
