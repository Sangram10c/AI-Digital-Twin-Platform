// ============================================================
// Chat Module
// Wires together the full conversational RAG pipeline:
//   - Imports SearchModule (hybrid search), AiKnowledgeModule (providers)
//   - Provides all chat services
//   - Exports ConversationService and ConversationOrchestratorService
//     so they can be used by other modules if needed
// ============================================================

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SearchModule } from '../search/search.module';
import { AiKnowledgeModule } from '../ai-knowledge/ai-knowledge.module';
import { GithubModule } from '../github/github.module';

import { ChatController } from './controllers/chat.controller';
import { ConversationService } from './services/conversation.service';
import { TokenBudgetService } from './services/token-budget.service';
import { PromptBuilderService } from './services/prompt-builder.service';
import { CitationBuilderService } from './services/citation-builder.service';
import { AiResponseFormatterService } from './services/ai-response-formatter.service';
import { AiRequestLoggingService } from './services/ai-request-logging.service';
import { ConversationOrchestratorService } from './services/conversation-orchestrator.service';
import { ChatStreamService } from './services/chat-stream.service';

@Module({
  imports: [
    DatabaseModule,
    SearchModule,
    AiKnowledgeModule,
    // GithubModule provides GithubWorkspaceGuard used in ChatController.
    GithubModule,
  ],
  controllers: [ChatController],
  providers: [
    ConversationService,
    TokenBudgetService,
    PromptBuilderService,
    CitationBuilderService,
    AiResponseFormatterService,
    AiRequestLoggingService,
    ConversationOrchestratorService,
    ChatStreamService,
  ],
  exports: [
    ConversationService,
    ConversationOrchestratorService,
    ChatStreamService,
  ],
})
export class ChatModule {}
