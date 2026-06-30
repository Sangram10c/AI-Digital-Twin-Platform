import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('google')
@Controller('google')
export class GoogleController {
  constructor() {}
}
