import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma.module';

/**
 * Database foundation module.
 * Re-exports the global PrismaModule for explicit app-level wiring.
 */
@Module({
  imports: [PrismaModule],
  exports: [PrismaModule],
})
export class DatabaseModule {}
