import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Module imports will be added here as they are implemented
// import { AuthModule } from './modules/auth/auth.module';
// import { UsersModule } from './modules/users/users.module';
// import { DatabaseModule } from './database/prisma.module';
// import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),

    // Database
    // DatabaseModule,

    // Feature modules (uncomment as implemented)
    // AuthModule,
    // UsersModule,
    // OrganizationsModule,
    // WorkspacesModule,
    // GithubModule,
    // GoogleModule,
    // DocumentsModule,
    // UploadsModule,
    // AiModule,
    // EmbeddingsModule,
    // SearchModule,
    // KnowledgeModule,
    // MemoryModule,
    // TimelineModule,
    // NotificationsModule,
    // IntegrationsModule,
    // AnalyticsModule,
    // SettingsModule,
    // AdminModule,
    // HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
