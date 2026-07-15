import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { REQUEST_ID_HEADER } from '../constants/request-id.constant';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    const requestId =
      (req as Request & { requestId?: string }).requestId ??
      req.headers[REQUEST_ID_HEADER];

    res.on('finish', () => {
      const duration = Date.now() - start;
      this.logger.log(
        `[${String(requestId)}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`,
      );
    });

    next();
  }
}
