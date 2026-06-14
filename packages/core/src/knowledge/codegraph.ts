import { execFileSync } from 'node:child_process';
import type { KnowledgeProvider } from './provider.js';
import type { KnowledgeProviderConfig, CodeSearchResponse } from './types.js';

const DEFAULT_MAX_RESULTS = 5;
const DEFAULT_TIMEOUT_MS = 10_000;

export class CodeGraphProvider implements KnowledgeProvider {
  readonly name = 'codegraph';
  private binary: string;
  private maxResults: number;
  private timeoutMs: number;

  constructor(config: KnowledgeProviderConfig) {
    this.binary = config.binary || 'codegraph';
    this.maxResults = config.max_results ?? DEFAULT_MAX_RESULTS;
    this.timeoutMs = config.timeout_ms ?? DEFAULT_TIMEOUT_MS;
  }

  isAvailable(): boolean {
    try {
      execFileSync('command', ['-v', this.binary], {
        timeout: 3000,
        stdio: 'pipe',
      });
      return true;
    } catch {
      return false;
    }
  }

  async search(query: string, options?: { maxResults?: number }): Promise<CodeSearchResponse> {
    const maxResults = options?.maxResults ?? this.maxResults;

    if (!this.isAvailable()) {
      return { query, results: [], provider: this.name };
    }

    try {
      const output = execFileSync(this.binary, [
        'search', query,
        '--format', 'json',
        '--max-results', String(maxResults),
      ], {
        timeout: this.timeoutMs,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const parsed = JSON.parse(output);

      return {
        query,
        results: (parsed.results || []).map((r: Record<string, unknown>) => ({
          file: String(r.file || ''),
          start_line: Number(r.start_line || r.startLine || 0),
          end_line: Number(r.end_line || r.endLine || 0),
          score: Number(r.score || 0),
          snippet: String(r.snippet || r.content || ''),
          context: r.context ? String(r.context) : undefined,
        })),
        provider: this.name,
      };
    } catch {
      return { query, results: [], provider: this.name };
    }
  }
}
