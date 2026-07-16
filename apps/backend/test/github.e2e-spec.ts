import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { App } from 'supertest/types';
import { GithubController } from '../src/modules/github/github.controller';
import { GithubWorkspaceGuard } from '../src/modules/github/guards/github-workspace.guard';
import { GithubService } from '../src/modules/github/github.service';

describe('GithubController (integration)', () => {
  let app: INestApplication<App>;

  const githubService = {
    initiateConnect: jest.fn(),
    handleCallback: jest.fn(),
    listUserGithubAccounts: jest.fn(),
    listWorkspaceAccounts: jest.fn(),
    disconnectUserGithubAccount: jest.fn(),
    disconnectWorkspaceAccount: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [GithubController],
      providers: [{ provide: GithubService, useValue: githubService }],
    })
      .overrideGuard(GithubWorkspaceGuard)
      .useValue({ canActivate: () => true })
      .compile();

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
    app.use((req: Request, _res: Response, next: NextFunction) => {
      (req as Request & { user?: { id: string } }).user = { id: 'user-1' };
      next();
    });
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /api/v1/github/account validates workspaceId', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/github/account')
      .expect(400);

    expect(githubService.listWorkspaceAccounts).not.toHaveBeenCalled();
  });

  it('GET /api/v1/github/connect accepts user-level flow without workspaceId', async () => {
    githubService.initiateConnect.mockResolvedValue(
      'https://github.com/login/oauth/authorize?client_id=test',
    );

    await request(app.getHttpServer())
      .get('/api/v1/github/connect')
      .query({ returnUrl: 'true' })
      .expect(200);

    expect(githubService.initiateConnect).toHaveBeenCalledWith(
      expect.any(String),
      undefined,
      expect.any(Object),
    );
  });

  it('GET /api/v1/github/callback redirects after OAuth processing', async () => {
    githubService.handleCallback.mockResolvedValue({
      redirectUrl: 'http://localhost:3000/success?status=connected',
    });

    await request(app.getHttpServer())
      .get('/api/v1/github/callback')
      .query({ code: 'auth-code', state: 'signed-state' })
      .expect(302);

    expect(githubService.handleCallback).toHaveBeenCalled();
  });

  it('DELETE /api/v1/github/disconnect validates query params', async () => {
    await request(app.getHttpServer())
      .delete('/api/v1/github/disconnect')
      .query({ workspaceId: '550e8400-e29b-41d4-a716-446655440000' })
      .expect(400);

    expect(githubService.disconnectWorkspaceAccount).not.toHaveBeenCalled();
  });
});
