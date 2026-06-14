import type { KnowledgeProvider } from './provider.js';
import type { KnowledgeProviderConfig, CodeSearchResult, CodeSearchResponse } from './types.js';
import { CodeGraphProvider } from './codegraph.js';
import { readText } from '../utils/fs.js';
import { configPath } from '../utils/paths.js';

export interface ProviderManager {
  providers: KnowledgeProvider[];
  searchAll(query: string, options?: { maxResults?: number }): Promise<CodeSearchResponse>;
}

function parseProviderConfigs(yamlContent: string): Record<string, KnowledgeProviderConfig> {
  const providers: Record<string, KnowledgeProviderConfig> = {};

  // Find the providers section under knowledge
  const providersMatch = yamlContent.match(/knowledge:[\s\S]*?providers:([\s\S]*?)(?=\n[a-z]|\n$|$)/);
  if (!providersMatch) return providers;

  const block = providersMatch[1];
  // Match provider entries: "  name:" followed by indented config
  const providerBlocks = block.split(/^  (?=[a-z])/m).filter(Boolean);

  for (const pb of providerBlocks) {
    const nameMatch = pb.match(/^(\w+):/);
    if (!nameMatch) continue;
    const name = nameMatch[1];

    const enabled = /enabled:\s*true/.test(pb);
    const binaryMatch = pb.match(/binary:\s*["']?([^"'\n]+)/);
    const maxMatch = pb.match(/max_results:\s*(\d+)/);
    const timeoutMatch = pb.match(/timeout_ms:\s*(\d+)/);

    providers[name] = {
      enabled,
      type: name,
      binary: binaryMatch?.[1]?.trim(),
      max_results: maxMatch ? Number(maxMatch[1]) : undefined,
      timeout_ms: timeoutMatch ? Number(timeoutMatch[1]) : undefined,
    };
  }

  return providers;
}

export function loadProviders(projectRoot: string): KnowledgeProvider[] {
  const config = readText(configPath(projectRoot));
  if (!config) return [];

  const configs = parseProviderConfigs(config);
  const providers: KnowledgeProvider[] = [];

  for (const [name, cfg] of Object.entries(configs)) {
    if (!cfg.enabled) continue;

    switch (name) {
      case 'codegraph':
        providers.push(new CodeGraphProvider(cfg));
        break;
      // Future providers registered here
    }
  }

  return providers;
}

export async function searchAll(
  providers: KnowledgeProvider[],
  query: string,
  options?: { maxResults?: number },
): Promise<CodeSearchResponse> {
  if (providers.length === 0) {
    return { query, results: [], provider: 'none' };
  }

  const responses = await Promise.all(
    providers.map(p => p.search(query, options).catch(() => ({
      query,
      results: [] as CodeSearchResult[],
      provider: p.name,
    }))),
  );

  // Merge all results and sort by score descending
  const allResults: CodeSearchResult[] = responses
    .flatMap(r => r.results)
    .sort((a, b) => b.score - a.score);

  return {
    query,
    results: allResults,
    provider: providers.map(p => p.name).join(','),
  };
}

export function formatResultsForInjection(response: CodeSearchResponse): string {
  if (response.results.length === 0) return '';

  const lines: string[] = [];

  for (const r of response.results) {
    const location = `${r.file}:${r.start_line}-${r.end_line}`;
    lines.push(`  [${location}] (score: ${r.score})`);

    // Indent snippet lines
    const snippetLines = r.snippet.split('\n').slice(0, 15);
    for (const sl of snippetLines) {
      lines.push(`    ${sl}`);
    }

    if (r.context) {
      lines.push(`    // ${r.context}`);
    }

    lines.push('');
  }

  return lines.join('\n');
}
