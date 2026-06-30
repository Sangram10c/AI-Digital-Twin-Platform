import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MemoryService } from './memory.service';

@ApiTags('memory')
@Controller('memory')
export class MemoryController {
  constructor(private readonly memoryService: MemoryService) {}
}
