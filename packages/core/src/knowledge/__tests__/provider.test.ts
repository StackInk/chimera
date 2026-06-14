import { describe, it, expect } from 'vitest';
import type { KnowledgeProvider } from '../provider.js';
import type { CodeSearchResponse } from '../types.js';

describe('KnowledgeProvider interface', () => {
  it('can be implemented by a simple provider', async () => {
    const provider: KnowledgeProvider = {
      name: 'mock',
      isAvailable: () => true,
      search: async (query: string): Promise<CodeSearchResponse> => ({
        query,
        results: [
          { file: 'test.ts', start_line: 1, end_line: 5, score: 1.0, snippet: 'test' },
        ],
        provider: 'mock',
      }),
    };

    expect(provider.name).toBe('mock');
    expect(provider.isAvailable()).toBe(true);

    const result = await provider.search('hello');
    expect(result.results).toHaveLength(1);
    expect(result.results[0].file).toBe('test.ts');
    expect(result.query).toBe('hello');
    expect(result.provider).toBe('mock');
  });

  it('supports unavailable providers', async () => {
    const provider: KnowledgeProvider = {
      name: 'unavailable',
      isAvailable: () => false,
      search: async () => ({ query: '', results: [], provider: 'unavailable' }),
    };

    expect(provider.isAvailable()).toBe(false);
  });
});
