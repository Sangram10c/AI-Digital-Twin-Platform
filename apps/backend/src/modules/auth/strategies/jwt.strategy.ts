/**
 * JWT Strategy (Placeholder)
 *
 * Passport strategy for JWT token validation.
 * Will be implemented with passport-jwt.
 */
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy {
  // Will extend PassportStrategy(Strategy) from @nestjs/passport
  // validate(payload: any) { return payload; }
}
