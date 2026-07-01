import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('workspaces')
@Controller('workspaces')
export class WorkspacesController {
  constructor() {}
}
