import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('timeline')
@Controller('timeline')
export class TimelineController {
  constructor() {}
}
