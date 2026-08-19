import { Test, TestingModule } from '@nestjs/testing';
import { UserRole, UserStatus } from '@prisma/client';
import { AuthenticatedDeveloper } from '../identity/entities/authenticated-developer.entity';
import {
  AnalyticsController,
  PlatformAnalyticsController,
} from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import {
  HealthAnalyticsResponseDto,
  OverviewResponseDto,
  PlatformAnalyticsResponseDto,
} from './dto/analytics-response.dto';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let platformController: PlatformAnalyticsController;

  const mockAnalyticsService = {
    getOverview: jest.fn(),
    getRepositories: jest.fn(),
    getKnowledge: jest.fn(),
    getSearch: jest.fn(),
    getRag: jest.fn(),
    getAi: jest.fn(),
    getConversations: jest.fn(),
    getJobs: jest.fn(),
    getHealth: jest.fn(),
    getPlatform: jest.fn(),
    triggerAggregation: jest.fn(),
  };

  const mockDeveloper: AuthenticatedDeveloper = {
    id: 'user-1',
    email: 'dev@example.com',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    sessionId: 'sess-1',
    passwordHash: null,
    firstName: 'Dev',
    lastName: 'User',
    displayName: 'Dev User',
    avatarUrl: null,
    emailVerifiedAt: new Date(),
    lastLoginAt: new Date(),
    timezone: 'UTC',
    locale: 'en',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController, PlatformAnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    platformController = module.get<PlatformAnalyticsController>(
      PlatformAnalyticsController,
    );
  });

  describe('getOverview', () => {
    it('passes workspaceId, filter, and user context to service', async () => {
      const mockOverview: OverviewResponseDto = {
        workspaceId: 'ws-1',
        periodStart: new Date(),
        periodEnd: new Date(),
        metrics: {} as never,
        source: 'live',
        generatedAt: new Date(),
      };
      mockAnalyticsService.getOverview.mockResolvedValue(mockOverview);

      const filter = { period: 'daily' as const };

      const result: OverviewResponseDto = await controller.getOverview(
        'ws-1',
        filter,
        mockDeveloper,
      );

      expect(mockAnalyticsService.getOverview).toHaveBeenCalledWith(
        'ws-1',
        filter,
        'user-1',
        UserRole.USER,
      );
      expect(result).toEqual(mockOverview);
    });
  });

  describe('getHealth', () => {
    it('calls getHealth with workspace and repository filters', async () => {
      const mockHealth: HealthAnalyticsResponseDto = {
        workspaceId: 'ws-1',
        periodStart: new Date(),
        periodEnd: new Date(),
        metrics: {} as never,
        source: 'live',
        generatedAt: new Date(),
      };
      mockAnalyticsService.getHealth.mockResolvedValue(mockHealth);

      const result: HealthAnalyticsResponseDto = await controller.getHealth(
        'ws-1',
        'repo-1',
        mockDeveloper,
      );

      expect(mockAnalyticsService.getHealth).toHaveBeenCalledWith(
        'ws-1',
        'repo-1',
        'user-1',
        UserRole.USER,
      );
      expect(result).toEqual(mockHealth);
    });
  });

  describe('triggerAggregation', () => {
    it('enqueues aggregation job', async () => {
      const mockResult = { message: 'job enqueued', jobId: 'job-123' };
      mockAnalyticsService.triggerAggregation.mockResolvedValue(mockResult);

      const dto = { repositoryId: 'repo-1', period: 'daily' as const };

      await controller.triggerAggregation('ws-1', dto, mockDeveloper);

      expect(mockAnalyticsService.triggerAggregation).toHaveBeenCalledWith(
        'ws-1',
        dto,
        'user-1',
        UserRole.USER,
      );
    });
  });

  describe('PlatformAnalyticsController', () => {
    it('invokes getPlatform with date range filters', async () => {
      const mockPlatform: PlatformAnalyticsResponseDto = {
        workspaceId: 'global',
        periodStart: new Date(),
        periodEnd: new Date(),
        metrics: {} as never,
        source: 'live',
        generatedAt: new Date(),
      };
      mockAnalyticsService.getPlatform.mockResolvedValue(mockPlatform);

      const result: PlatformAnalyticsResponseDto =
        await platformController.getPlatform('2026-01-01', '2026-01-31');

      expect(mockAnalyticsService.getPlatform).toHaveBeenCalledWith(
        new Date('2026-01-01'),
        new Date('2026-01-31'),
      );
      expect(result).toEqual(mockPlatform);
    });
  });
});
