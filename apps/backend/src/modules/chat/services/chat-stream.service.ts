// ============================================================
// Chat Stream Service
// Wraps ConversationOrchestratorService with SSE streaming.
// Strategy: Buffer full response, stream word-by-word (safe with
// all providers), then emit citations and done events.
// ============================================================

import { Injectable, Logger, MessageEvent } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import type { ChatRequest } from '../interfaces/chat.interfaces';
import { ConversationOrchestratorService } from './conversation-orchestrator.service';
import { SSE_EVENTS } from '../constants/chat.constants';

@Injectable()
export class ChatStreamService {
  private readonly logger = new Logger(ChatStreamService.name);

  constructor(private readonly orchestrator: ConversationOrchestratorService) {}

  /**
   * Returns an Observable emitting NestJS MessageEvent plain objects:
   *  1. Calls the orchestrator to get the full response.
   *  2. Emits answer token-by-token (type: 'delta').
   *  3. Emits citations in a single event (type: 'citations').
   *  4. Emits full ChatResponse for metadata (type: 'done').
   *  5. Emits error if orchestrator throws (type: 'error').
   */
  stream(request: ChatRequest): Observable<MessageEvent> {
    const subject = new Subject<MessageEvent>();

    // Run async in background — Observable is cold until subscribed.
    void this.runStream(request, subject);

    return subject.asObservable();
  }

  private async runStream(
    request: ChatRequest,
    subject: Subject<MessageEvent>,
  ): Promise<void> {
    try {
      const response = await this.orchestrator.chat(request);

      // ── Stream answer word-by-word ───────────────────────────
      const words = response.answer.split(' ');
      for (let i = 0; i < words.length; i += 1) {
        const token = i < words.length - 1 ? words[i] + ' ' : words[i];
        subject.next(this.makeEvent(SSE_EVENTS.DELTA, token));
        // Micro-delay to create streaming feel without hammering client.
        await this.delay(8);
      }

      // ── Emit citations ───────────────────────────────────────
      subject.next(this.makeEvent(SSE_EVENTS.CITATIONS, response.citations));

      // ── Emit done with full metadata ─────────────────────────
      subject.next(this.makeEvent(SSE_EVENTS.DONE, response));

      subject.complete();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Internal server error';
      this.logger.error(`Chat stream error: ${message}`);
      subject.next(this.makeEvent(SSE_EVENTS.ERROR, { message }));
      subject.complete();
    }
  }

  private makeEvent(eventType: string, data: unknown): MessageEvent {
    return {
      type: eventType,
      data: data as object | string,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
