/**
 * Generate backend common module scaffold files.
 */
const fs = require('fs');
const path = require('path');

const COMMON_DIR = path.join(__dirname, '..', 'backend', 'src', 'common');

const commonDirs = {
  guards: {
    'roles.guard.ts': `import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user?.role === role);
  }
}
`,
    'index.ts': `export { RolesGuard } from './roles.guard';
`,
  },
  decorators: {
    'roles.decorator.ts': `import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
`,
    'current-user.decorator.ts': `import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (data) return request.user?.[data];
    return request.user;
  },
);
`,
    'public.decorator.ts': `import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
`,
    'index.ts': `export { Roles, ROLES_KEY } from './roles.decorator';
export { CurrentUser } from './current-user.decorator';
export { Public, IS_PUBLIC_KEY } from './public.decorator';
`,
  },
  pipes: {
    'parse-cuid.pipe.ts': `import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

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
`,
    'index.ts': `export { ParseCuidPipe } from './parse-cuid.pipe';
`,
  },
  filters: {
    'all-exceptions.filter.ts': `import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      message: typeof message === 'string' ? message : (message as any).message,
      timestamp: new Date().toISOString(),
    });
  }
}
`,
    'index.ts': `export { AllExceptionsFilter } from './all-exceptions.filter';
`,
  },
  middleware: {
    'logger.middleware.ts': `import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(\`[\${req.method}] \${req.originalUrl} - \${res.statusCode} (\${duration}ms)\`);
    });
    next();
  }
}
`,
    'index.ts': `export { LoggerMiddleware } from './logger.middleware';
`,
  },
  exceptions: {
    'business.exception.ts': `import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(message: string, statusCode: HttpStatus = HttpStatus.BAD_REQUEST) {
    super({ statusCode, message, error: 'Business Error' }, statusCode);
  }
}
`,
    'index.ts': `export { BusinessException } from './business.exception';
`,
  },
  interceptors: {
    'transform.interceptor.ts': `import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        statusCode: context.switchToHttp().getResponse().statusCode,
        message: 'Success',
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
`,
    'index.ts': `export { TransformInterceptor } from './transform.interceptor';
`,
  },
  dto: {
    'pagination.dto.ts': `import { IsOptional, IsPositive, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PaginationDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 20;
}
`,
    'index.ts': `export { PaginationDto } from './pagination.dto';
`,
  },
  interfaces: {
    'paginated-result.interface.ts': `export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
`,
    'index.ts': `export type { PaginatedResult } from './paginated-result.interface';
`,
  },
  types: {
    'index.ts': `// Common types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
`,
  },
  utils: {
    'hash.util.ts': `/**
 * Hash Utility
 *
 * Password hashing and comparison utilities.
 * Placeholder - will use bcrypt or argon2.
 */
export class HashUtil {
  static async hash(password: string): Promise<string> {
    // Will use bcrypt.hash(password, 12)
    return password;
  }

  static async compare(password: string, hash: string): Promise<boolean> {
    // Will use bcrypt.compare(password, hash)
    return password === hash;
  }
}
`,
    'index.ts': `export { HashUtil } from './hash.util';
`,
  },
  constants: {
    'index.ts': `// Common constants
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const JWT_EXPIRATION = '15m';
export const REFRESH_TOKEN_EXPIRATION = '7d';
`,
  },
};

console.log('🔧 Generating common modules...\n');

for (const [dirName, files] of Object.entries(commonDirs)) {
  const dirPath = path.join(COMMON_DIR, dirName);
  fs.mkdirSync(dirPath, { recursive: true });

  for (const [fileName, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dirPath, fileName), content);
  }
  console.log(`  ✅ common/${dirName}/`);
}

console.log('\n✅ Common modules generated');
