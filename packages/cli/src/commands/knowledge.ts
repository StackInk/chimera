import { KnowledgeBlockStore, checkExpiry } from '@chimera/core';
import { archiveBlocksDir } from '@chimera/core';
import { existsSync } from 'node:fs';

export type KnowledgeSubcommand = 'check' | 'read' | 'archive';

export function knowledge(projectRoot: string, subcommand: string, args: string[]): void {
  switch (subcommand) {
    case 'check':
      knowledgeCheck(projectRoot);
      break;
    case 'read':
      knowledgeRead(projectRoot, args[0]);
      break;
    case 'archive':
      knowledgeArchive(projectRoot, args[0]);
      break;
    default:
      console.error(`Unknown subcommand: ${subcommand}`);
      console.error('Usage: chimera knowledge <check|read|archive>');
      process.exit(1);
  }
}

function knowledgeCheck(projectRoot: string): void {
  const blocksDir = archiveBlocksDir(projectRoot);
  if (!existsSync(blocksDir)) {
    console.log('No knowledge blocks found.');
    return;
  }

  const store = new KnowledgeBlockStore(projectRoot);
  const blocks = store.list();

  if (blocks.length === 0) {
    console.log('No knowledge blocks found.');
    return;
  }

  console.log('Knowledge Health Report:');
  console.log('┌─────────┬────────────────────────────────────┬────────────┬──────────┐');
  console.log('│ ID      │ Title                              │ Status     │ Expired  │');
  console.log('├─────────┼────────────────────────────────────┼────────────┼──────────┤');

  let staleCount = 0;
  let activeCount = 0;

  for (const block of blocks) {
    const expiry = checkExpiry(block);
    const title = block.title.slice(0, 34).padEnd(34);
    const status = block.status.padEnd(10);
    const expired = expiry.expired ? `${expiry.daysOverdue}d ago` : '-';

    console.log(`│ ${block.id.padEnd(7)} │ ${title} │ ${status} │ ${expired.padEnd(8)} │`);

    if (expiry.expired && block.status === 'active') {
      store.updateStatus(block.id, 'stale');
      staleCount++;
    } else if (block.status === 'stale') {
      staleCount++;
    } else if (block.status === 'active') {
      activeCount++;
    }
  }

  console.log('└─────────┴────────────────────────────────────┴────────────┴──────────┘');
  console.log(`Summary: ${staleCount} stale, ${activeCount} active (total: ${blocks.length})`);

  if (staleCount > 0) {
    process.exit(1);
  }
}

function knowledgeRead(projectRoot: string, blockId: string): void {
  if (!blockId) {
    console.error('Usage: chimera knowledge read <block-id>');
    process.exit(1);
  }

  const store = new KnowledgeBlockStore(projectRoot);
  const block = store.read(blockId);

  if (!block) {
    console.error(`Error: Block '${blockId}' not found.`);
    process.exit(1);
  }

  console.log(block.content);
}

function knowledgeArchive(projectRoot: string, featureId: string): void {
  if (!featureId) {
    console.error('Usage: chimera knowledge archive <feature-id>');
    process.exit(1);
  }

  const store = new KnowledgeBlockStore(projectRoot);

  // For now, create a placeholder block from the feature
  const block = store.create({
    title: `Feature ${featureId} archive`,
    summary: `Archived knowledge from ${featureId}`,
    content: `Full archive content for ${featureId}. In production, this would parse spec/plan/tasks and split into blocks.`,
    tags: [featureId],
    source_feature: featureId,
    git_ref: 'HEAD',
    expires_at: null,
  });

  console.log(`Archived ${featureId} → ${block.id}: ${block.title}`);
}
