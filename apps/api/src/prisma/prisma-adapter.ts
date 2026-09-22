import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaPg } from '@prisma/adapter-pg';
import ws from 'ws';

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  return url;
}

function configureNeonWebSocket(): void {
  // Vercel Node runtimes need an explicit WebSocket implementation.
  neonConfig.webSocketConstructor = ws as unknown as typeof WebSocket;
  // Prefer HTTP for ordinary queries; WebSocket is used when Prisma needs a transaction.
  neonConfig.poolQueryViaFetch = true;
}

export function createPrismaAdapter(): PrismaNeon | PrismaPg {
  const url = requireDatabaseUrl();

  if (process.env.VERCEL) {
    configureNeonWebSocket();
    return new PrismaNeon({ connectionString: url });
  }

  return new PrismaPg({ connectionString: url });
}

export function createPrismaTcpAdapter(): PrismaPg {
  const url = process.env.DIRECT_URL?.trim() || requireDatabaseUrl();
  return new PrismaPg({ connectionString: url });
}
