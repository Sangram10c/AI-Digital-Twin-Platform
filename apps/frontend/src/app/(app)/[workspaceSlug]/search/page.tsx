'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SearchPage() {
  const [query, setQuery] = React.useState('');
  const [searchMode, setSearchMode] = React.useState('hybrid');

  const mockResults = [
    {
      title: 'hybrid-search.service.ts',
      path: 'apps/backend/src/modules/search/services/hybrid-search.service.ts',
      snippet: 'const combinedRankings = this.reciprocalRankFusion(vectorResults, keywordResults);',
      score: '0.96',
      type: 'CODE_SYMBOL',
    },
    {
      title: 'Pull Request #10: Implement pgvector HNSW Index',
      path: 'pull_requests/10',
      snippet:
        'Restores specialized search indexes on embeddings.vector using pgvector HNSW operator class.',
      score: '0.89',
      type: 'PULL_REQUEST',
    },
    {
      title: 'docs/13-search-engine-design/README.md',
      path: 'docs/13-search-engine-design/README.md',
      snippet:
        'Hybrid search combines PostgreSQL full-text search (tsvector) with pgvector embeddings.',
      score: '0.84',
      type: 'DOCUMENTATION',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
          Hybrid Code & History Search
        </h1>
        <p className="text-xs text-muted-foreground">
          Combines vector semantic embeddings with PostgreSQL full-text search and RRF ranking.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search functions, architecture, commit diffs, or pull requests..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
          leftIcon={
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          }
        />
        <Tabs value={searchMode} onValueChange={setSearchMode} className="w-auto">
          <TabsList>
            <TabsTrigger value="hybrid">Hybrid</TabsTrigger>
            <TabsTrigger value="vector">Vector</TabsTrigger>
            <TabsTrigger value="keyword">Keyword</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="default">Search</Button>
      </div>

      <div className="space-y-3 pt-2">
        <div className="text-xs font-semibold text-muted-foreground">
          Top Results ({mockResults.length})
        </div>

        {mockResults.map((res, i) => (
          <Card key={i} interactive className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge size="sm" variant="secondary">
                  {res.type}
                </Badge>
                <CardTitle className="text-sm">{res.title}</CardTitle>
              </div>
              <span className="text-[11px] font-mono text-ai font-semibold">
                Score: {res.score}
              </span>
            </div>
            <p className="text-xs font-mono text-muted-foreground truncate">{res.path}</p>
            <p className="rounded bg-muted/40 p-2 font-mono text-[11px] text-foreground/90">
              {res.snippet}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
