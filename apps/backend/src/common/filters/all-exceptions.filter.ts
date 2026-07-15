import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { REQUEST_ID_HEADER } from '../constants/request-id.constant';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    let errorMessage = 'Internal server error';
    let details: Record<string, unknown> | undefined;

    if (typeof exceptionResponse === 'string') {
      errorMessage = exceptionResponse;
    } else if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      const msgObj = exceptionResponse as {
        message: string | string[];
        [key: string]: unknown;
      };
      errorMessage = Array.isArray(msgObj.message)
        ? msgObj.message.join(', ')
        : String(msgObj.message);
      details = msgObj;
    } else if (exceptionResponse && typeof exceptionResponse === 'object') {
      errorMessage = 'Service unavailable';
      details = exceptionResponse as Record<string, unknown>;
    }

    const requestId =
      request.requestId ?? request.headers[REQUEST_ID_HEADER] ?? 'unknown';

    if (status >= 500) {
      this.logger.error(
        `[${String(requestId)}] ${request.method} ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `[${String(requestId)}] ${request.method} ${request.url} → ${status}: ${errorMessage}`,
      );
    }

    response.status(status).json({
      statusCode: status,
      message: errorMessage,
      ...(details ?? {}),
      path: request.url,
      requestId,
      timestamp: new Date().toISOString(),
    });
  }
}
