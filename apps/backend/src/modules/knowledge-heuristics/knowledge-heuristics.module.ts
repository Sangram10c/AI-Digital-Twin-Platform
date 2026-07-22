import { Module } from '@nestjs/common';
import { KnowledgeHeuristicsService } from './services/knowledge-heuristics.service';

@Module({
  providers: [KnowledgeHeuristicsService],
  exports: [KnowledgeHeuristicsService],
})
export class KnowledgeHeuristicsModule {}
