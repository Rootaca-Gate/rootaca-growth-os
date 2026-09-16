import { join } from 'node:path';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { createPrismaAdapter } from './prisma-adapter';

void join(__dirname, '..', '..', '..', '..', 'node_modules', '.prisma', 'client', 'query_compiler_bg.wasm');
void join(__dirname, '..', '..', '..', '..', 'node_modules', '.prisma', 'client', 'query_compiler_bg.js');
void join(__dirname, '..', '..', '..', '..', 'node_modules', '.prisma', 'client', 'schema.prisma');
void join(__dirname, '..', '..', '..', 'node_modules', '.prisma', 'client', 'query_compiler_bg.wasm');
void join(__dirname, '..', '..', '..', 'node_modules', '.prisma', 'client', 'query_compiler_bg.js');
void join(__dirname, '..', '..', '..', 'node_modules', '.prisma', 'client', 'schema.prisma');

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    super({ adapter: createPrismaAdapter() });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
