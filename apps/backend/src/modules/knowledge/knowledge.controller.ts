import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('knowledge')
@Controller('knowledge')
export class KnowledgeController {
  constructor() {}
}
