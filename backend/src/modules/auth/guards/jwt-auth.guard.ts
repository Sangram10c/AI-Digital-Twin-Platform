import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

/**
 * JWT Auth Guard (Placeholder)
 *
 * Validates JWT token from Authorization header.
 * Will be implemented with @nestjs/passport.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Placeholder - will use PassportStrategy
    const request = context.switchToHttp().getRequest();
    return !!request.headers.authorization;
  }
}
