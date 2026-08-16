// ============================================================
// Chat Controller
// Exposes all conversational AI endpoints.
// All routes are JWT-protected (global JwtAuthGuard + optional
// workspace permission guard).
// ============================================================

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  MessageEvent,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Sse,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { CurrentDeveloper } from '../../identity/decorators/current-developer.decorator';
import type { AuthenticatedDeveloper } from '../../identity/entities/authenticated-developer.entity';
import { GithubWorkspaceGuard } from '../../github/guards/github-workspace.guard';
import { RequireWorkspacePermission } from '../../workspaces/decorators/require-workspace-permission.decorator';
import { WorkspacePermission } from '../../workspaces/constants/workspace-permissions.constants';
import {
  ChatQueryStreamDto,
  ChatRequestDto,
  ConversationListQueryDto,
  UpdateConversationDto,
} from '../dto/chat.dto';
import {
  ChatResponseDto,
  ConversationListResponseDto,
  ConversationResponseDto,
} from '../dto/chat-response.dto';
import { ConversationOrchestratorService } from '../services/conversation-orchestrator.service';
import { ChatStreamService } from '../services/chat-stream.service';
import { ConversationService } from '../services/conversation.service';

@ApiTags('chat')
@ApiBearerAuth('JWT')
@UseGuards(GithubWorkspaceGuard)
@RequireWorkspacePermission(WorkspacePermission.READ_WORKSPACE)
@Controller({ path: 'chat', version: '1' })
export class ChatController {
  constructor(
    private readonly orchestrator: ConversationOrchestratorService,
    private readonly streamService: ChatStreamService,
    private readonly conversationService: ConversationService,
  ) {}

  // ──────────────────────────────────────────────────────────
  // Chat — full response (non-streaming)
  // POST /api/v1/chat
  // ──────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ask the AI a question grounded in your codebase knowledge',
    description:
      'Performs hybrid RAG retrieval from the workspace knowledge base, ' +
      'constructs a grounded prompt, calls the AI provider with fallback, ' +
      'and returns a structured answer with citations.',
  })
  @ApiResponse({
    status: 200,
    description: 'AI answer with citations and source metadata.',
    type: ChatResponseDto,
  })
  @ApiResponse({ status: 503, description: 'All AI providers unavailable.' })
  async chat(
    @Body() dto: ChatRequestDto,
    @CurrentDeveloper() developer: AuthenticatedDeveloper,
  ): Promise<ChatResponseDto> {
    return this.orchestrator.chat({
      userId: developer.id,
      workspaceId: dto.workspaceId,
      query: dto.query,
      conversationId: dto.conversationId,
      repositoryIds: dto.repositoryIds,
      provider: dto.provider as never,
      topK: dto.topK,
      temperature: dto.temperature,
    });
  }

  // ──────────────────────────────────────────────────────────
  // Chat — SSE streaming (GET via Query for EventSource & Swagger)
  // GET /api/v1/chat/stream?query=...&workspaceId=...
  // ──────────────────────────────────────────────────────────

  @Sse('stream')
  @ApiOperation({
    summary: 'Stream AI response via GET Server-Sent Events',
    description:
      'Emits delta tokens, citations, and done events as a Server-Sent Events stream using query parameters. Compatible with browser EventSource and Swagger UI.',
  })
  @ApiResponse({
    status: 200,
    description: 'SSE stream: delta | citations | done | error events.',
  })
  chatStream(
    @Query() dto: ChatQueryStreamDto,
    @CurrentDeveloper() developer: AuthenticatedDeveloper,
  ): Observable<MessageEvent> {
    return this.streamService.stream({
      userId: developer.id,
      workspaceId: dto.workspaceId,
      query: dto.query,
      conversationId: dto.conversationId,
      provider: dto.provider as never,
      topK: dto.topK,
      temperature: dto.temperature,
      stream: true,
    });
  }

  // ──────────────────────────────────────────────────────────
  // Chat — SSE streaming (POST via Body)
  // POST /api/v1/chat/stream
  // ──────────────────────────────────────────────────────────

  @Post('stream')
  @ApiOperation({
    summary: 'Stream AI response via POST Server-Sent Events',
    description:
      'Emits delta tokens, citations, and done events as a Server-Sent Events stream for POST requests with a JSON body.',
  })
  @ApiResponse({
    status: 200,
    description: 'SSE stream: delta | citations | done | error events.',
  })
  chatPostStream(
    @Body() dto: ChatRequestDto,
    @CurrentDeveloper() developer: AuthenticatedDeveloper,
    @Res() res: Response,
  ): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream$ = this.streamService.stream({
      userId: developer.id,
      workspaceId: dto.workspaceId,
      query: dto.query,
      conversationId: dto.conversationId,
      repositoryIds: dto.repositoryIds,
      provider: dto.provider as never,
      topK: dto.topK,
      temperature: dto.temperature,
      stream: true,
    });

    const subscription = stream$.subscribe({
      next: (event: MessageEvent) => {
        const eventType = event.type ?? 'message';
        const payload =
          typeof event.data === 'string'
            ? event.data
            : JSON.stringify(event.data);
        res.write(`event: ${eventType}\ndata: ${payload}\n\n`);
      },
      complete: () => {
        res.end();
      },
      error: (err: Error) => {
        res.write(
          `event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`,
        );
        res.end();
      },
    });

    res.on('close', () => {
      subscription.unsubscribe();
    });
  }

  // ──────────────────────────────────────────────────────────
  // Conversations
  // GET /api/v1/conversations
  // ──────────────────────────────────────────────────────────

  @Get('conversations')
  @ApiOperation({
    summary: 'List all conversations for the current user in a workspace',
  })
  @ApiResponse({ status: 200, type: ConversationListResponseDto })
  async listConversations(
    @Query() query: ConversationListQueryDto,
    @CurrentDeveloper() developer: AuthenticatedDeveloper,
  ): Promise<ConversationListResponseDto> {
    const result = await this.conversationService.listConversations({
      userId: developer.id,
      workspaceId: query.workspaceId,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });

    return {
      data: result.data.map((c) => ({
        id: c.id,
        title: c.title,
        workspaceId: c.workspaceId,
        repositoryId: c.repositoryId,
        messageCount: c._count.messages,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasMore: result.hasMore,
    };
  }

  // ──────────────────────────────────────────────────────────
  // GET /api/v1/chat/conversations/:id
  // ──────────────────────────────────────────────────────────

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get a conversation with its full message history' })
  @ApiParam({ name: 'id', description: 'Conversation UUID', type: String })
  @ApiResponse({ status: 200, type: ConversationResponseDto })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getConversation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentDeveloper() developer: AuthenticatedDeveloper,
  ): Promise<ConversationResponseDto> {
    const conv = await this.conversationService.getConversation(
      id,
      developer.id,
    );
    return {
      id: conv.id,
      title: conv.title,
      workspaceId: conv.workspaceId,
      repositoryId: conv.repositoryId,
      messageCount: conv.messages.length,
      messages: conv.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        sequenceNumber: m.sequenceNumber,
        tokenCount: m.tokenCount,
        createdAt: m.createdAt,
      })),
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    };
  }

  // ──────────────────────────────────────────────────────────
  // PATCH /api/v1/chat/conversations/:id
  // ──────────────────────────────────────────────────────────

  @Patch('conversations/:id')
  @ApiOperation({ summary: 'Rename a conversation' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Conversation updated.' })
  async updateConversation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateConversationDto,
    @CurrentDeveloper() developer: AuthenticatedDeveloper,
  ) {
    return this.conversationService.updateTitle(id, developer.id, dto.title);
  }

  // ──────────────────────────────────────────────────────────
  // DELETE /api/v1/chat/conversations/:id
  // ──────────────────────────────────────────────────────────

  @Delete('conversations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a conversation' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 204, description: 'Conversation deleted.' })
  async deleteConversation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentDeveloper() developer: AuthenticatedDeveloper,
  ) {
    return this.conversationService.deleteConversation(id, developer.id);
  }

  // ──────────────────────────────────────────────────────────
  // POST /api/v1/chat/conversations/:id/pin
  // ──────────────────────────────────────────────────────────

  @Post('conversations/:id/pin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pin a conversation for quick access' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Conversation pinned.' })
  async pinConversation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentDeveloper() developer: AuthenticatedDeveloper,
  ) {
    return this.conversationService.pinConversation(id, developer.id);
  }

  // ──────────────────────────────────────────────────────────
  // DELETE /api/v1/chat/conversations/:id/pin
  // ──────────────────────────────────────────────────────────

  @Delete('conversations/:id/pin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unpin a conversation' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Conversation unpinned.' })
  async unpinConversation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentDeveloper() developer: AuthenticatedDeveloper,
  ) {
    return this.conversationService.unpinConversation(id, developer.id);
  }
}
