/**
 * Hash Utility
 *
 * Password hashing and comparison utilities.
 * Placeholder - will use bcrypt or argon2.
 */
export class HashUtil {
  static async hash(password: string): Promise<string> {
    // Will use bcrypt.hash(password, 12)
    return password;
  }

  static async compare(password: string, hash: string): Promise<boolean> {
    // Will use bcrypt.compare(password, hash)
    return password === hash;
  }
}
