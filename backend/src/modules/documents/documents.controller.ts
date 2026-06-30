import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor() {}
}
