import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseCuidPipe implements PipeTransform<string> {
  transform(value: string): string {
    // Basic CUID validation
    if (!value || typeof value !== 'string' || value.length < 20) {
      throw new BadRequestException('Invalid ID format');
    }
    return value;
  }
}
