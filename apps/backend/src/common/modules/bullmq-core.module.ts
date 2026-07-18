import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * Shared BullMQ root configuration for all queue workers in the application.
 */
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('bullmq.connection.url');
        if (url) {
          return {
            connection: { url },
            prefix: configService.get<string>('bullmq.prefix') ?? 'ai-twin',
          };
        }

        return {
          connection: {
            host:
              configService.get<string>('bullmq.connection.host') ??
              'localhost',
            port: configService.get<number>('bullmq.connection.port') ?? 6379,
            password: configService.get<string>('bullmq.connection.password'),
            db: configService.get<number>('bullmq.connection.db') ?? 0,
          },
          prefix: configService.get<string>('bullmq.prefix') ?? 'ai-twin',
        };
      },
    }),
  ],
  exports: [BullModule],
})
export class BullMqCoreModule {}
