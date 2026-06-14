import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchAll, formatResultsForInjection } from '../providers.js';
import type { KnowledgeProvider } from '../provider.js';
import type { CodeSearchResponse } from '../types.js';

function createMockProvider(name: string, results: CodeSearchResponse['results']): KnowledgeProvider {
  return {
    name,
    isAvailable: () => true,
    search: async (query: string) => ({
      query,
      results,
      provider: name,
    }),
  };
}

describe('searchAll', () => {
  it('returns empty results when no providers', async () => {
    const result = await searchAll([], 'test');
    expect(result.results).toEqual([]);
    expect(result.provider).toBe('none');
  });

  it('queries a single provider', async () => {
    const provider = createMockProvider('codegraph', [
      { file: 'a.ts', start_line: 1, end_line: 5, score: 0.9, snippet: 'code' },
    ]);

    const result = await searchAll([provider], 'test');
    expect(result.results).toHaveLength(1);
    expect(result.provider).toBe('codegraph');
  });

  it('merges and sorts results from multiple providers', async () => {
    const p1 = createMockProvider('graph', [
      { file: 'a.ts', start_line: 1, end_line: 5, score: 0.5, snippet: 'low' },
      { file: 'b.ts', start_line: 1, end_line: 5, score: 0.9, snippet: 'high' },
    ]);
    const p2 = createMockProvider('search', [
      { file: 'c.ts', start_line: 1, end_line: 5, score: 0.7, snippet: 'mid' },
    ]);

    const result = await searchAll([p1, p2], 'test');
    expect(result.results).toHaveLength(3);
    // Should be sorted by score descending
    expect(result.results[0].score).toBe(0.9);
    expect(result.results[1].score).toBe(0.7);
    expect(result.results[2].score).toBe(0.5);
    expect(result.provider).toBe('graph,search');
  });

  it('handles provider errors gracefully', async () => {
    const good = createMockProvider('good', [
      { file: 'a.ts', start_line: 1, end_line: 5, score: 0.8, snippet: 'ok' },
    ]);
    const bad: KnowledgeProvider = {
      name: 'bad',
      isAvailable: () => true,
      search: async () => { throw new Error('provider crash'); },
    };

    const result = await searchAll([bad, good], 'test');
    expect(result.results).toHaveLength(1);
    expect(result.results[0].file).toBe('a.ts');
  });

  it('passes maxResults option to providers', async () => {
    const spy = vi.fn().mockResolvedValue({
      query: 'test',
      results: [],
      provider: 'test',
    });
    const provider: KnowledgeProvider = {
      name: 'test',
      isAvailable: () => true,
      search: spy,
    };

    await searchAll([provider], 'test', { maxResults: 10 });
    expect(spy).toHaveBeenCalledWith('test', { maxResults: 10 });
  });
});

describe('formatResultsForInjection', () => {
  it('returns empty string for empty results', () => {
    const response: CodeSearchResponse = { query: 'test', results: [], provider: 'test' };
    expect(formatResultsForInjection(response)).toBe('');
  });

  it('formats results as readable text', () => {
    const response: CodeSearchResponse = {
      query: 'test',
      results: [
        { file: 'src/auth.ts', start_line: 10, end_line: 25, score: 0.9, snippet: 'function auth() {\n  return true;\n}', context: 'Auth function' },
      ],
      provider: 'test',
    };

    const output = formatResultsForInjection(response);
    expect(output).toContain('src/auth.ts:10-25');
    expect(output).toContain('score: 0.9');
    expect(output).toContain('function auth()');
    expect(output).toContain('// Auth function');
  });

  it('truncates long snippets to 15 lines', () => {
    const longSnippet = Array.from({ length: 20 }, (_, i) => `line ${i}`).join('\n');
    const response: CodeSearchResponse = {
      query: 'test',
      results: [{ file: 'a.ts', start_line: 1, end_line: 20, score: 0.5, snippet: longSnippet }],
      provider: 'test',
    };

    const output = formatResultsForInjection(response);
    const lines = output.split('\n').filter(l => l.includes('line'));
    expect(lines.length).toBeLessThanOrEqual(15);
  });
});
