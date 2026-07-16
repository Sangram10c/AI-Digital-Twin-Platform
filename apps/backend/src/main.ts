import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { SWAGGER_AUTH_PERSIST_SCRIPT } from './swagger/swagger-auth.persist';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });

  const configService = app.get(ConfigService);
  const logger = app.get(Logger);
  app.useLogger(logger);

  const nodeEnv = configService.get<string>('app.nodeEnv');
  const apiPrefix = configService.get<string>('app.apiPrefix') ?? 'api';
  const apiVersion = configService.get<string>('app.apiVersion') ?? 'v1';
  const port = configService.get<number>('app.port') ?? 4000;
  const host = configService.get<string>('app.host') ?? '0.0.0.0';
  const corsOrigin = configService.get<string>('app.corsOrigin');
  const corsCredentials = configService.get<boolean>('app.corsCredentials');
  const trustProxy = configService.get<boolean>('app.trustProxy');
  const bodyLimit = configService.get<string>('app.bodyLimit') ?? '1mb';
  const isProduction = configService.get<boolean>('app.isProduction');

  if (trustProxy) {
    const expressApp = app.getHttpAdapter().getInstance() as {
      set: (key: string, value: unknown) => void;
    };
    expressApp.set('trust proxy', 1);
  }

  // Relax CSP in non-production so Swagger custom scripts can persist JWT auth.
  app.use(
    helmet({
      contentSecurityPolicy: isProduction
        ? undefined
        : {
            directives: {
              defaultSrc: [`'self'`],
              styleSrc: [`'self'`, `'unsafe-inline'`],
              scriptSrc: [`'self'`, `'unsafe-inline'`, `'unsafe-eval'`],
              imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
              connectSrc: [`'self'`],
              fontSrc: [`'self'`, 'data:'],
            },
          },
    }),
  );
  app.use(compression());
  app.use(
    json({
      limit: bodyLimit,
      verify: (req, _res, buf) => {
        (req as { rawBody?: Buffer }).rawBody = buf;
      },
    }),
  );
  app.use(urlencoded({ extended: true, limit: bodyLimit }));

  app.setGlobalPrefix(apiPrefix, {
    exclude: ['health', 'ready', 'live'],
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: apiVersion.replace(/^v/, ''),
  });

  app.enableCors({
    origin: corsOrigin,
    credentials: corsCredentials,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Request-Id',
      'X-Hub-Signature-256',
      'X-GitHub-Event',
      'X-GitHub-Delivery',
      'X-GitHub-Hook-ID',
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableShutdownHooks();

  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('AI Digital Twin Platform API')
      .setDescription(
        [
          'Enterprise AI Digital Twin Platform — REST API Documentation',
          '',
          '**Swagger auth tip:** Call `POST /auth/login` once. The access token is applied automatically and kept after page refresh (browser localStorage). Server restart does not clear it; you only need to login again when the JWT expires.',
        ].join('\n'),
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'JWT access token. After login it is auto-filled and persisted across refresh.',
          in: 'header',
        },
        'JWT',
      )
      .addTag('health', 'Health checks')
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management (admin)')
      .addTag('workspaces', 'Workspace management')
      .addTag('github', 'GitHub OAuth integration')
      .addTag('webhooks', 'GitHub webhook ingestion and monitoring')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);

    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
      customSiteTitle: 'AI Digital Twin API',
      customJsStr: SWAGGER_AUTH_PERSIST_SCRIPT,
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'list',
        filter: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
        tryItOutEnabled: true,
      },
    });
    logger.log(`Swagger docs: http://localhost:${port}/${apiPrefix}/docs`);
  }

  await app.listen(port, host);

  const versionSegment = apiVersion.replace(/^v/, '');
  logger.log(`Environment: ${nodeEnv}`);
  logger.log(
    `Application running: http://${host}:${port}/${apiPrefix}/v${versionSegment}`,
  );
  logger.log(`Health: http://${host}:${port}/health`);
  logger.log(`Ready:  http://${host}:${port}/ready`);
  logger.log(`Live:   http://${host}:${port}/live`);
}

bootstrap().catch((error: unknown) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
