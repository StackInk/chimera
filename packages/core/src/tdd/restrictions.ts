import type { TDDCycle } from './types.js';

export interface RestrictionResult {
  allowed: boolean;
  message?: string;
}

export function checkFileRestriction(cycle: TDDCycle, filePath: string): RestrictionResult {
  if (!isCodeFile(filePath)) {
    return { allowed: true };
  }

  const isTest = isTestFile(filePath);

  switch (cycle) {
    case 'red':
      if (!isTest) {
        return {
          allowed: false,
          message: `[TDD RED] Only test files can be modified. '${filePath}' is a source file.`,
        };
      }
      return { allowed: true };

    case 'green':
      if (isTest) {
        return {
          allowed: false,
          message: `[TDD GREEN] Only source files can be modified. '${filePath}' is a test file.`,
        };
      }
      return { allowed: true };

    case 'refactor':
      return { allowed: true };
  }
}

function isTestFile(filePath: string): boolean {
  return /\.(test|spec)\.(ts|js|tsx|jsx|py)$/.test(filePath) ||
    filePath.includes('/tests/') ||
    filePath.includes('/test/') ||
    filePath.includes('/__tests__/');
}

function isCodeFile(filePath: string): boolean {
  return /\.(ts|js|tsx|jsx|py|rs|go|java|rb|swift)$/.test(filePath);
}
