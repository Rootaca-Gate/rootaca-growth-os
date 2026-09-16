import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from './crypto/password.service';
import { DEV_SEED_USERS } from './dev-seed-users';

function isUniqueConflict(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === 'P2002'
  );
}

@Injectable()
export class EmptyUserTableSeed implements OnModuleInit {
  private readonly logger = new Logger(EmptyUserTableSeed.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    const existingUsers = await this.prisma.user.count();
    if (existingUsers > 0) {
      return;
    }

    this.logger.warn('User table is empty; seeding staff accounts');

    for (const user of DEV_SEED_USERS) {
      try {
        await this.prisma.user.create({
          data: {
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            passwordHash: await this.passwords.hash(user.password),
            isActive: true,
          },
        });
      } catch (error) {
        if (isUniqueConflict(error)) {
          continue;
        }
        throw error;
      }
    }
  }
}
