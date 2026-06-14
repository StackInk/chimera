export type KnowledgeStatus = 'active' | 'stale' | 'archived' | 'invalidated';

export interface KnowledgeBlock {
  id: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  source_feature: string;
  created_at: string;
  expires_at: string | null;
  git_ref: string;
  status: KnowledgeStatus;
  dependencies: string[];
}

export interface KnowledgeIndex {
  version: string;
  updated_at: string;
  blocks: KnowledgeIndexEntry[];
  stats: {
    total: number;
    active: number;
    stale: number;
    archived: number;
  };
}

export interface KnowledgeIndexEntry {
  id: string;
  title: string;
  tags: string[];
  status: KnowledgeStatus;
  expires_at: string | null;
  source_feature: string;
  file_path: string;
}

// ─── External Knowledge Providers ────────────────────────────────────

export interface KnowledgeProviderConfig {
  enabled: boolean;
  type: string;
  binary?: string;
  max_results?: number;
  timeout_ms?: number;
}

export interface CodeSearchResult {
  file: string;
  start_line: number;
  end_line: number;
  score: number;
  snippet: string;
  context?: string;
}

export interface CodeSearchResponse {
  query: string;
  results: CodeSearchResult[];
  provider: string;
}
