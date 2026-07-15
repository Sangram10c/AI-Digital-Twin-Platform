import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { WorkspacesController } from '../src/modules/workspaces/workspaces.controller';
import { WorkspaceMemberGuard } from '../src/modules/workspaces/guards/workspace-member.guard';
import { WorkspacesService } from '../src/modules/workspaces/workspaces.service';

describe('WorkspacesController (integration)', () => {
  let app: INestApplication<App>;

  const workspacesService = {
    create: jest.fn(),
    findAllForUser: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [WorkspacesController],
      providers: [{ provide: WorkspacesService, useValue: workspacesService }],
    })
      .overrideGuard(WorkspaceMemberGuard)
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
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('POST /api/v1/workspaces validates body', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/workspaces')
      .send({ name: 'A' })
      .expect(400);

    expect(workspacesService.create).not.toHaveBeenCalled();
  });
});
