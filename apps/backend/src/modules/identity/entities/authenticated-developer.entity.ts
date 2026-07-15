import { User } from '@prisma/client';

/** Authenticated principal attached by JwtStrategy (maps to Prisma User model). */
export type AuthenticatedDeveloper = User & {
  sessionId: string;
};
