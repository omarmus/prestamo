import { Injectable } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';
import type { PasswordHasher } from '../../application/ports/password-hasher.port';

@Injectable()
export class PasswordHasherService implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return hash(password, {
      algorithm: 2, // argon2id
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });
  }

  async verify(hashValue: string, password: string): Promise<boolean> {
    return verify(hashValue, password);
  }
}
