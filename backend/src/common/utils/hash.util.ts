/**
 * Hash Utility
 *
 * Password hashing and comparison utilities.
 * Placeholder - will use bcrypt or argon2.
 */
export class HashUtil {
  static hash(password: string): Promise<string> {
    // Will use bcrypt.hash(password, 12)
    return Promise.resolve(password);
  }

  static compare(password: string, hash: string): Promise<boolean> {
    // Will use bcrypt.compare(password, hash)
    return Promise.resolve(password === hash);
  }
}
