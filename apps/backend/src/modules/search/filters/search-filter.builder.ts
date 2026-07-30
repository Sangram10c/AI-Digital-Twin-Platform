import type { SearchFilters } from '../interfaces/search.interfaces';

export interface SqlFilterClause {
  /** AND-joined SQL fragments using bound $N placeholders. */
  clauses: string[];
  params: unknown[];
}

/**
 * Builds parameterized SQL filter clauses for hybrid search.
 * All values are bound parameters — never interpolated into SQL text.
 */
export function buildSearchFilterSql(
  filters: SearchFilters,
  startIndex = 1,
): SqlFilterClause {
  const clauses: string[] = [
    `kc.workspace_id = $${startIndex}::uuid`,
    `kc.deleted_at IS NULL`,
  ];
  const params: unknown[] = [filters.workspaceId];
  let idx = startIndex + 1;

  const add = (sql: string, ...values: unknown[]) => {
    let fragment = sql;
    for (const value of values) {
      fragment = fragment.replace('$?', `$${idx}`);
      params.push(value);
      idx += 1;
    }
    clauses.push(fragment);
  };

  if (filters.repositoryIds?.length) {
    add(`kc.repository_id = ANY($?::uuid[])`, filters.repositoryIds);
  }

  if (filters.knowledgeSourceType) {
    add(
      `ks.source_type = $?::"KnowledgeSourceType"`,
      filters.knowledgeSourceType,
    );
  }

  if (filters.branch) {
    add(
      `(kc.metadata->>'branch' = $? OR r.default_branch = $?)`,
      filters.branch,
      filters.branch,
    );
  }

  if (filters.language) {
    add(
      `(kc.metadata->>'language' ILIKE $? OR r.language ILIKE $?)`,
      filters.language,
      filters.language,
    );
  }

  if (filters.framework) {
    add(`kc.metadata->>'framework' ILIKE $?`, `%${filters.framework}%`);
  }

  if (filters.module) {
    add(
      `(kc.metadata->>'module' ILIKE $? OR ks.path ILIKE $?)`,
      `%${filters.module}%`,
      `%${filters.module}%`,
    );
  }

  if (filters.directory) {
    add(
      `(kc.metadata->>'directory' ILIKE $? OR coalesce(ks.path, d.file_path, '') ILIKE $?)`,
      `${filters.directory}%`,
      `${filters.directory}%`,
    );
  }

  if (filters.fileExtension) {
    const ext = filters.fileExtension.replace(/^\./, '');
    add(
      `(coalesce(ks.path, d.file_path, '') ILIKE $? OR kc.metadata->>'fileExtension' ILIKE $?)`,
      `%.${ext}`,
      ext,
    );
  }

  if (filters.documentType) {
    add(
      `(d.type::text ILIKE $? OR kc.metadata->>'documentType' ILIKE $?)`,
      filters.documentType,
      filters.documentType,
    );
  }

  if (filters.commitSha) {
    add(
      `(ks.external_ref_id = $? OR kc.metadata->>'commitSha' = $? OR kc.metadata->>'sha' = $?)`,
      filters.commitSha,
      filters.commitSha,
      filters.commitSha,
    );
  }

  if (filters.pullRequestId) {
    add(
      `(ks.internal_ref_id = $?::uuid OR kc.metadata->>'pullRequestId' = $?)`,
      filters.pullRequestId,
      filters.pullRequestId,
    );
  }

  if (filters.issueId) {
    add(
      `(ks.internal_ref_id = $?::uuid OR kc.metadata->>'issueId' = $?)`,
      filters.issueId,
      filters.issueId,
    );
  }

  if (filters.tag) {
    add(
      `(kc.metadata->'tags' ? $? OR kc.metadata->>'tag' ILIKE $?)`,
      filters.tag,
      filters.tag,
    );
  }

  if (filters.dateFrom) {
    add(`kc.created_at >= $?::timestamptz`, filters.dateFrom.toISOString());
  }

  if (filters.dateTo) {
    add(`kc.created_at <= $?::timestamptz`, filters.dateTo.toISOString());
  }

  return { clauses, params };
}
