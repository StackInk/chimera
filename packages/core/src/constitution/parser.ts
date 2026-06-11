import type { ConstitutionRule, RulePriority } from './types.js';
import type { Phase } from '../types.js';

export function parseConstitution(content: string): ConstitutionRule[] {
  if (!content.trim()) return [];

  const rules: ConstitutionRule[] = [];
  let currentPriority: RulePriority | null = null;

  const lines = content.split('\n');

  for (const line of lines) {
    const headerMatch = line.match(/^##\s+(MUST|SHOULD|MAY)\s*$/);
    if (headerMatch) {
      currentPriority = headerMatch[1] as RulePriority;
      continue;
    }

    if (!currentPriority) continue;

    const ruleMatch = line.match(/^-\s+(C-\d+):\s*(?:\[scope:([\w,]+)\]\s*)?(.+)/);
    if (ruleMatch) {
      const [, id, scopeStr, description] = ruleMatch;
      const scope = scopeStr
        ? scopeStr.split(',').map(s => s.trim() as Phase)
        : undefined;

      rules.push({
        id,
        priority: currentPriority,
        description: description.trim(),
        scope,
        check_type: inferCheckType(description),
        pattern: inferPattern(description),
        threshold: inferThreshold(description),
      });
    }
  }

  return rules;
}

function inferCheckType(description: string): ConstitutionRule['check_type'] {
  const lower = description.toLowerCase();
  if (lower.includes('coverage') || lower.includes('%')) return 'coverage';
  if (lower.includes('file') || lower.includes('delete') || lower.includes('modif')) return 'file_pattern';
  return 'content_match';
}

function inferPattern(description: string): string | undefined {
  const lower = description.toLowerCase();
  if (lower.includes('test file')) return '**/*.test.ts';
  if (lower.includes('src')) return 'src/**';
  return undefined;
}

function inferThreshold(description: string): number | undefined {
  const match = description.match(/(\d+)\s*%/);
  if (match) return parseInt(match[1], 10);
  return undefined;
}
