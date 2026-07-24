import * as path from 'path';
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { JwtConfigModule } from './common/modules/jwt-config.module';
import { configNamespaces, envValidationSchema } from './config';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { IdentityModule } from './modules/identity/identity.module';
import { UsersModule } from './modules/users/users.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { GithubModule } from './modules/github/github.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { AiKnowledgeModule } from './modules/ai-knowledge/ai-knowledge.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { RepositoryModule } from './modules/repository/repository.module';
import { EmbeddingsModule } from './modules/embeddings/embeddings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        // Nest merges with Object.assign(parsedFile, accumulated) per file in order.
        // Files listed FIRST win on duplicate keys.
        path.resolve(process.cwd(), '.env.local'),
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), '../../.env'),
      ],
      load: configNamespaces,
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: true,
        allowUnknown: true,
      },
    }),

    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>('app.nodeEnv');
        const logLevel = configService.get<string>('app.logLevel');

        return {
          pinoHttp: {
            level: logLevel,
            transport:
              nodeEnv !== 'production'
                ? { target: 'pino-pretty', options: { colorize: true } }
                : undefined,
            autoLogging: true,
            redact: ['req.headers.authorization', 'req.headers.cookie'],
          },
        };
      },
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get<number>('app.throttleTtl')! * 1000,
            limit: configService.get<number>('app.throttleLimit')!,
          },
        ],
      }),
    }),

    DatabaseModule,
    JwtConfigModule,
    HealthModule,
    IdentityModule,
    UsersModule,
    WorkspacesModule,
    GithubModule,
    WebhookModule,
    AiKnowledgeModule,
    KnowledgeModule,
    RepositoryModule,
    EmbeddingsModule,

    // Feature modules — uncomment as implemented
    // WorkspacesModule,
    // HealthModule is active above for foundation probes
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestIdMiddleware, LoggerMiddleware)
      .exclude(
        { path: 'health', method: RequestMethod.GET },
        { path: 'ready', method: RequestMethod.GET },
        { path: 'live', method: RequestMethod.GET },
      )
      .forRoutes('*');
  }
}
