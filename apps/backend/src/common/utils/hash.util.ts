import { NotImplementedException } from '@nestjs/common';

/**
 * Hash Utility
 *
 * Password hashing placeholder — will use Argon2id during Auth module phase.
 * Intentionally throws until a secure implementation is wired.
 */
export class HashUtil {
  static hash(_password: string): Promise<string> {
    throw new NotImplementedException(
      'Password hashing is not yet implemented. Use Argon2id during Auth module phase.',
    );
  }

  static compare(_password: string, _hash: string): Promise<boolean> {
    throw new NotImplementedException(
      'Password comparison is not yet implemented. Use Argon2id during Auth module phase.',
    );
  }
}
