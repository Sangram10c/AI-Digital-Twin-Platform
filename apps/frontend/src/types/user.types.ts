/**
 * User Types & Role Enums
 * Mapped to backend NestJS Identity module & Prisma schema.
 */

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  VIEWER = 'VIEWER',
}

export interface User {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  role: UserRole;
  status?: string;
  emailVerifiedAt?: string | null;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}
