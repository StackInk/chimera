import { KnowledgeBlockStore, checkExpiry } from '@chimera/core';
import { archiveBlocksDir } from '@chimera/core';
import { existsSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

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


  const featureDir = join(projectRoot, '.chimera', 'features', featureId);
  const store = new KnowledgeBlockStore(projectRoot);

  let gitRef = 'HEAD';
  try {
    gitRef = execSync('git rev-parse --short HEAD', { cwd: projectRoot, encoding: 'utf-8' }).trim();
  } catch { /* fallback to HEAD */ }

  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const createdBlocks: string[] = [];

  // Parse spec.md and plan.md into knowledge blocks
  const files = ['spec.md', 'plan.md'];
  for (const fileName of files) {
    const filePath = join(featureDir, fileName);
    let content: string;
    try {
      content = readFileSync(filePath, 'utf-8');
    } catch {
      continue;
    }

    const sections = splitByHeadings(content);
    for (const section of sections) {
      if (section.content.trim().length < 20) continue;
      if (section.title.toLowerCase().includes('placeholder')) continue;

      const summary = extractSummary(section.content);
      const tags = extractTags(section.title, section.content, featureId);

      const block = store.create({
        title: section.title,
        summary,
        content: section.content,
        tags,
        source_feature: featureId,
        git_ref: gitRef,
        expires_at: expiresAt,
      });

      createdBlocks.push(`  ${block.id}: ${block.title}`);
    }
  }

  if (createdBlocks.length === 0) {
    console.log(`No content found in .chimera/features/${featureId}/ to archive.`);
    console.log(`Ensure spec.md or plan.md exist with ## headings.`);
    return;
  }

  console.log(`Archived ${featureId} → ${createdBlocks.length} knowledge blocks:`);
  for (const line of createdBlocks) {
    console.log(line);
  }
}

interface Section {
  title: string;
  content: string;
}

function splitByHeadings(markdown: string): Section[] {
  const sections: Section[] = [];
  const lines = markdown.split('\n');
  let currentTitle = '';
  let currentContent: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)/);
    if (headingMatch) {
      if (currentTitle && currentContent.length > 0) {
        sections.push({ title: currentTitle, content: currentContent.join('\n').trim() });
      }
      currentTitle = headingMatch[1];
      currentContent = [];
    } else if (currentTitle) {
      currentContent.push(line);
    }
  }

  if (currentTitle && currentContent.length > 0) {
    sections.push({ title: currentTitle, content: currentContent.join('\n').trim() });
  }

  return sections;
}

function extractSummary(content: string): string {
  const cleaned = content
    .replace(/^[-*]\s+/gm, '')
    .replace(/\n+/g, ' ')
    .trim();
  return cleaned.slice(0, 80) + (cleaned.length > 80 ? '...' : '');
}

function extractTags(title: string, content: string, featureId: string): string[] {
  const tags = new Set<string>([featureId]);

  const techTerms = (title + ' ' + content).match(/\b(API|CLI|REST|JSON|SQL|JWT|OAuth|TDD|HTTP|CRUD|UI|DB)\b/gi);
  if (techTerms) {
    for (const t of techTerms) tags.add(t.toLowerCase());
  }

  const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  for (const w of titleWords.slice(0, 3)) tags.add(w);

  return [...tags];
}
