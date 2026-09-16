import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { argon2id, argon2Verify } from 'hash-wasm';
import { assertValidPassword } from '../password.policy';

const ARGON2_OPTIONS = {
  parallelism: 4,
  iterations: 3,
  memorySize: 65536,
  hashLength: 32,
  outputType: 'encoded' as const,
};

@Injectable()
export class PasswordService {
  private dummyHashPromise?: Promise<string>;

  async hash(plain: string): Promise<string> {
    assertValidPassword(plain);
    return argon2id({
      password: plain,
      salt: randomBytes(16),
      ...ARGON2_OPTIONS,
    });
  }

  async verify(hash: string | null | undefined, plain: string): Promise<boolean> {
    const dummyHash = await this.dummyHash();

    if (!hash) {
      await argon2Verify({ password: plain, hash: dummyHash }).catch(() => false);
      return false;
    }

    try {
      return await argon2Verify({ password: plain, hash });
    } catch (error) {
      throw new Error(
        `Password verification failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }

  private dummyHash(): Promise<string> {
    this.dummyHashPromise ??= argon2id({
      password: 'rootaca-dummy-password-not-used',
      salt: randomBytes(16),
      ...ARGON2_OPTIONS,
    });
    return this.dummyHashPromise;
  }
}
