import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('embeddings')
@Controller('embeddings')
export class EmbeddingsController {
  constructor() {}
}
