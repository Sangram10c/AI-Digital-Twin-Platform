import { Injectable, Logger } from '@nestjs/common';
import type { SearchMode } from '../constants/search.constants';
import type { SearchTiming } from '../interfaces/search.interfaces';

@Injectable()
export class SearchLogger {
  private readonly logger = new Logger('HybridSearch');

  logSearch(input: {
    workspaceId: string;
    userId: string;
    mode: SearchMode;
    query: string;
    resultsCount: number;
    timing: SearchTiming;
  }): void {
    this.logger.log({
      msg: 'search.completed',
      workspaceId: input.workspaceId,
      userId: input.userId,
      mode: input.mode,
      queryLength: input.query.length,
      resultsCount: input.resultsCount,
      ...input.timing,
    });
  }

  logError(context: string, error: unknown): void {
    this.logger.error(
      `search.error ${context}: ${
        error instanceof Error ? error.message : String(error)
      }`,
      error instanceof Error ? error.stack : undefined,
    );
  }
}
