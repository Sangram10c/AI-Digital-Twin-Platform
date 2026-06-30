import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EmbeddingsService } from './embeddings.service';

@ApiTags('embeddings')
@Controller('embeddings')
export class EmbeddingsController {
  constructor(private readonly embeddingsService: EmbeddingsService) {}
}
