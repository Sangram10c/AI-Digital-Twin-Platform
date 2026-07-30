import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { GithubModule } from '../github/github.module';
import { QueryProcessor } from './query/query-processor.service';
import { SearchRepository } from './repositories/search.repository';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { KeywordSearchService } from './services/keyword-search.service';
import { RankingService } from './services/ranking.service';
import { SearchCacheService } from './services/search-cache.service';
import { SearchLogger } from './services/search-logger.service';
import { SearchMetricsService } from './services/search-metrics.service';
import { VectorSearchService } from './services/vector-search.service';

@Module({
  imports: [ConfigModule, DatabaseModule, EmbeddingsModule, GithubModule],
  controllers: [SearchController],
  providers: [
    SearchService,
    QueryProcessor,
    SearchRepository,
    VectorSearchService,
    KeywordSearchService,
    RankingService,
    SearchCacheService,
    SearchMetricsService,
    SearchLogger,
  ],
  exports: [SearchService, QueryProcessor, RankingService],
})
export class SearchModule {}
