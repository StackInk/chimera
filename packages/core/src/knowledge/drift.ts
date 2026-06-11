import { execSync } from 'node:child_process';

export interface DriftResult {
  drifted: boolean;
  changePercent: number;
  insertions: number;
  deletions: number;
  error?: string;
}

const DRIFT_THRESHOLD = 50; // percent

export function checkDrift(
  projectRoot: string,
  gitRef: string,
  filePath: string,
  threshold: number = DRIFT_THRESHOLD
): DriftResult {
  try {
    // Get file line count at the old ref
    let originalLines: number;
    try {
      const content = execSync(`git show ${gitRef}:${filePath}`, {
        cwd: projectRoot,
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf-8',
      });
      originalLines = content.split('\n').length;
    } catch {
      return { drifted: false, changePercent: 0, insertions: 0, deletions: 0 };
    }

    if (originalLines === 0) {
      return { drifted: false, changePercent: 0, insertions: 0, deletions: 0 };
    }

    // Get diff stats
    const diffOutput = execSync(`git diff --numstat ${gitRef}..HEAD -- ${filePath}`, {
      cwd: projectRoot,
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf-8',
    }).trim();

    if (!diffOutput) {
      return { drifted: false, changePercent: 0, insertions: 0, deletions: 0 };
    }

    const parts = diffOutput.split('\t');
    const insertions = parseInt(parts[0], 10) || 0;
    const deletions = parseInt(parts[1], 10) || 0;
    const totalChanges = insertions + deletions;
    const changePercent = Math.round((totalChanges / originalLines) * 100);

    return {
      drifted: changePercent >= threshold,
      changePercent,
      insertions,
      deletions,
    };
  } catch (err) {
    return {
      drifted: false,
      changePercent: 0,
      insertions: 0,
      deletions: 0,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
