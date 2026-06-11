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
