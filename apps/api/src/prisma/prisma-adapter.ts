import { PrismaNeonHTTP } from '@prisma/adapter-neon';
import { PrismaPg } from '@prisma/adapter-pg';

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  return url;
}

export function createPrismaAdapter(): PrismaNeonHTTP | PrismaPg {
  const url = requireDatabaseUrl();

  if (process.env.VERCEL) {
    return new PrismaNeonHTTP(url, {});
  }

  return new PrismaPg({ connectionString: url });
}

export function createPrismaTcpAdapter(): PrismaPg {
  const url = process.env.DIRECT_URL?.trim() || requireDatabaseUrl();
  return new PrismaPg({ connectionString: url });
}
