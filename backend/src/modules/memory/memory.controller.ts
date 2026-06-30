import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('memory')
@Controller('memory')
export class MemoryController {
  constructor() {}
}
