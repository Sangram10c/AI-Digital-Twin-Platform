import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedDeveloper } from '../entities/authenticated-developer.entity';

/**
 * Returns the authenticated user (Prisma User model) from the JWT strategy.
 */
export const CurrentDeveloper = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedDeveloper => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user: AuthenticatedDeveloper }>();
    return request.user;
  },
);
