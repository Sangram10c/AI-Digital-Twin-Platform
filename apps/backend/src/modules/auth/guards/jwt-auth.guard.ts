import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotImplementedException,
} from '@nestjs/common';

/**
 * JWT Auth Guard (placeholder)
 *
 * Will be implemented with PassportStrategy during the Auth module phase.
 * Intentionally rejects all requests until real JWT verification is added.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    throw new NotImplementedException(
      'JWT authentication is not yet implemented. Enable during Auth module phase.',
    );
  }
}
