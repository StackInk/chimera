import type { CodeSearchResponse } from './types.js';

export interface KnowledgeProvider {
  readonly name: string;
  isAvailable(): boolean;
  search(query: string, options?: { maxResults?: number }): Promise<CodeSearchResponse>;
}
