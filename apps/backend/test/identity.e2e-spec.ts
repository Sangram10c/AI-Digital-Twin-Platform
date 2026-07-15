import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import jwtConfig from '../src/config/jwt.config';
import { IdentityController } from '../src/modules/identity/identity.controller';
import { IdentityService } from '../src/modules/identity/identity.service';

describe('IdentityController (integration)', () => {
  let app: INestApplication<App>;

  const identityService = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    forgotPassword: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [jwtConfig],
        }),
      ],
      controllers: [IdentityController],
      providers: [{ provide: IdentityService, useValue: identityService }],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('POST /api/v1/auth/register validates request body', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', password: 'weak' })
      .expect(400);

    expect(identityService.register).not.toHaveBeenCalled();
  });

  it('POST /api/v1/auth/login delegates to IdentityService', async () => {
    identityService.login.mockResolvedValue({
      user: { id: 'user-1', email: 'jane@example.com' },
      tokens: {
        accessToken: 'access',
        refreshToken: 'refresh',
        tokenType: 'Bearer',
        expiresIn: '15m',
      },
    });

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'jane@example.com', password: 'Str0ng!Pass' })
      .expect(200);

    expect(identityService.login).toHaveBeenCalled();
  });

  it('POST /api/v1/auth/forgot-password returns generic success message', async () => {
    identityService.forgotPassword.mockResolvedValue({
      message:
        'If an account exists for that email, password reset instructions have been sent.',
    });

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'jane@example.com' })
      .expect(200);

    expect((response.body as { message: string }).message).toContain(
      'If an account exists',
    );
  });
});
