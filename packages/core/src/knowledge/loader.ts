import type { Phase } from '../types.js';
import { readText } from '../utils/fs.js';
import { businessKnowledgePath, conventionsKnowledgePath } from '../utils/paths.js';

const PHASE_KNOWLEDGE_MAP: Record<string, ('business' | 'conventions')[]> = {
  spec: ['business'],
  plan: ['business'],
  implement: ['conventions'],
  review: ['conventions'],
};

export class KnowledgeLoader {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  loadForPhase(phase: Phase): string {
    const sources = PHASE_KNOWLEDGE_MAP[phase];
    if (!sources) return '';

    const parts: string[] = [];

    for (const source of sources) {
      const path = source === 'business'
        ? businessKnowledgePath(this.projectRoot)
        : conventionsKnowledgePath(this.projectRoot);

      const content = readText(path);
      if (content) parts.push(content);
    }

    return parts.join('\n\n');
  }
}
