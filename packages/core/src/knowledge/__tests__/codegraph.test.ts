import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CodeGraphProvider } from '../codegraph.js';

// Mock child_process
vi.mock('node:child_process', () => ({
  execFileSync: vi.fn(),
}));

import { execFileSync } from 'node:child_process';
const mockExec = vi.mocked(execFileSync);

describe('CodeGraphProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('detects when codegraph is available', () => {
    mockExec.mockReturnValueOnce('/usr/local/bin/codegraph\n' as unknown as Buffer);
    const provider = new CodeGraphProvider({ enabled: true, type: 'codegraph' });
    expect(provider.isAvailable()).toBe(true);
  });

  it('detects when codegraph is not available', () => {
    mockExec.mockImplementationOnce(() => { throw new Error('not found'); });
    const provider = new CodeGraphProvider({ enabled: true, type: 'codegraph' });
    expect(provider.isAvailable()).toBe(false);
  });

  it('returns empty results when not available', async () => {
    mockExec.mockImplementation(() => { throw new Error('not found'); });
    const provider = new CodeGraphProvider({ enabled: true, type: 'codegraph' });

    const result = await provider.search('test query');
    expect(result.results).toEqual([]);
    expect(result.provider).toBe('codegraph');
    expect(result.query).toBe('test query');
  });

  it('parses JSON output from codegraph CLI', async () => {
    // isAvailable check
    mockExec.mockReturnValueOnce('/usr/local/bin/codegraph\n' as unknown as Buffer);

    // search call
    const mockOutput = JSON.stringify({
      results: [
        { file: 'src/auth.ts', start_line: 10, end_line: 25, score: 0.95, snippet: 'function authenticate() {}', context: 'Auth middleware' },
        { file: 'src/user.ts', start_line: 5, end_line: 15, score: 0.80, snippet: 'function getUser() {}' },
      ],
    });
    mockExec.mockReturnValueOnce(mockOutput as unknown as Buffer);

    const provider = new CodeGraphProvider({ enabled: true, type: 'codegraph' });
    const result = await provider.search('auth');

    expect(result.results).toHaveLength(2);
    expect(result.results[0].file).toBe('src/auth.ts');
    expect(result.results[0].score).toBe(0.95);
    expect(result.results[0].context).toBe('Auth middleware');
    expect(result.results[1].context).toBeUndefined();
  });

  it('handles codegraph command failure gracefully', async () => {
    mockExec.mockImplementation(() => { throw new Error('command failed'); });

    const provider = new CodeGraphProvider({ enabled: true, type: 'codegraph' });
    const result = await provider.search('test');

    expect(result.results).toEqual([]);
    expect(result.provider).toBe('codegraph');
  });

  it('handles invalid JSON output gracefully', async () => {
    mockExec.mockImplementation(() => 'not valid json' as unknown as Buffer);

    const provider = new CodeGraphProvider({ enabled: true, type: 'codegraph' });
    const result = await provider.search('test');

    expect(result.results).toEqual([]);
  });

  it('handles empty results array', async () => {
    mockExec.mockReturnValueOnce('/usr/local/bin/codegraph\n' as unknown as Buffer);
    mockExec.mockReturnValueOnce('{"results": []}' as unknown as Buffer);

    const provider = new CodeGraphProvider({ enabled: true, type: 'codegraph' });
    const result = await provider.search('nonexistent');

    expect(result.results).toEqual([]);
  });

  it('normalizes different field naming conventions', async () => {
    mockExec.mockReturnValueOnce('/usr/local/bin/codegraph\n' as unknown as Buffer);
    // Test camelCase field names (startLine, endLine, content)
    const mockOutput = JSON.stringify({
      results: [
        { file: 'src/foo.ts', startLine: 1, endLine: 5, score: 0.5, content: 'some code' },
      ],
    });
    mockExec.mockReturnValueOnce(mockOutput as unknown as Buffer);

    const provider = new CodeGraphProvider({ enabled: true, type: 'codegraph' });
    const result = await provider.search('foo');

    expect(result.results[0].start_line).toBe(1);
    expect(result.results[0].end_line).toBe(5);
    expect(result.results[0].snippet).toBe('some code');
  });

  it('uses custom binary path', async () => {
    mockExec.mockImplementationOnce(() => { throw new Error('not found'); });
    const provider = new CodeGraphProvider({ enabled: true, type: 'codegraph', binary: '/custom/path/codegraph' });

    const available = provider.isAvailable();
    expect(available).toBe(false);

    // Verify it tried the custom binary
    expect(mockExec).toHaveBeenCalledWith('command', ['-v', '/custom/path/codegraph'], expect.anything());
  });
});
