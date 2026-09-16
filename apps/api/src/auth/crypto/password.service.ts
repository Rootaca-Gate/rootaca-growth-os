import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { assertValidPassword } from '../password.policy';

@Injectable()
export class PasswordService {
  private readonly dummyHashPromise = argon2.hash('rootaca-dummy-password-not-used', {
    type: argon2.argon2id,
  });

  async hash(plain: string): Promise<string> {
    assertValidPassword(plain);
    return argon2.hash(plain, { type: argon2.argon2id });
  }

  async verify(hash: string | null | undefined, plain: string): Promise<boolean> {
    const dummyHash = await this.dummyHashPromise;

    if (!hash) {
      await argon2.verify(dummyHash, plain).catch(() => false);
      return false;
    }

    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }
}
