import type { KnowledgeBlock, KnowledgeStatus } from './types.js';
import { readJson, writeJson, ensureDir } from '../utils/fs.js';
import { archiveBlocksDir } from '../utils/paths.js';
import { join } from 'node:path';
import { readdirSync } from 'node:fs';

export interface CreateBlockInput {
  title: string;
  summary: string;
  content: string;
  tags: string[];
  source_feature: string;
  git_ref: string;
  expires_at: string | null;
}

export class KnowledgeBlockStore {
  private blocksDir: string;
  private counter: number;

  constructor(projectRoot: string) {
    this.blocksDir = archiveBlocksDir(projectRoot);
    ensureDir(this.blocksDir);
    this.counter = this.getNextCounter();
  }

  create(input: CreateBlockInput): KnowledgeBlock {
    const id = `kb-${String(this.counter).padStart(3, '0')}`;
    this.counter++;

    const block: KnowledgeBlock = {
      id,
      title: input.title,
      summary: input.summary,
      content: input.content,
      tags: input.tags,
      source_feature: input.source_feature,
      created_at: new Date().toISOString(),
      expires_at: input.expires_at,
      git_ref: input.git_ref,
      status: 'active',
      dependencies: [],
    };

    writeJson(join(this.blocksDir, `${id}.json`), block);
    return block;
  }

  read(id: string): KnowledgeBlock | null {
    return readJson<KnowledgeBlock>(join(this.blocksDir, `${id}.json`));
  }

  updateStatus(id: string, status: KnowledgeStatus): void {
    const block = this.read(id);
    if (!block) return;
    block.status = status;
    writeJson(join(this.blocksDir, `${id}.json`), block);
  }

  list(): KnowledgeBlock[] {
    const files = readdirSync(this.blocksDir).filter(f => f.endsWith('.json'));
    return files.map(f => readJson<KnowledgeBlock>(join(this.blocksDir, f))!).filter(Boolean);
  }

  private getNextCounter(): number {
    const files = readdirSync(this.blocksDir).filter(f => f.startsWith('kb-'));
    if (files.length === 0) return 1;
    const nums = files.map(f => parseInt(f.replace('kb-', '').replace('.json', ''), 10));
    return Math.max(...nums) + 1;
  }
}
