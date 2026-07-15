import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { SkipTransform } from '../../common/decorators/skip-transform.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { HealthService } from './health.service';

@ApiTags('health')
@Public()
@Controller()
@SkipTransform()
@SkipThrottle()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  @ApiOperation({ summary: 'Application health summary' })
  async getHealth() {
    const result = await this.healthService.getHealth();
    if (result.status !== 'ok') {
      throw new ServiceUnavailableException(result);
    }
    return result;
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe (database + optional Redis)' })
  async getReady() {
    const result = await this.healthService.getReady();
    if (result.status !== 'ok') {
      throw new ServiceUnavailableException(result);
    }
    return result;
  }

  @Get('live')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liveness probe' })
  getLive() {
    return this.healthService.getLive();
  }
}
