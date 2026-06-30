import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor() {}
}
