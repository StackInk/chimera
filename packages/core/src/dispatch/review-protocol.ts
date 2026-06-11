export type ReviewStage = 'spec_compliance' | 'code_quality';
export type ReviewVerdict = 'approved' | 'changes_requested' | 'needs_discussion';

export interface ReviewFinding {
  stage: ReviewStage;
  severity: 'error' | 'warning' | 'info';
  file?: string;
  line?: number;
  message: string;
}

export interface ReviewResult {
  stage: ReviewStage;
  verdict: ReviewVerdict;
  findings: ReviewFinding[];
}

export interface TwoStageReviewResult {
  specCompliance: ReviewResult;
  codeQuality: ReviewResult;
  overallVerdict: ReviewVerdict;
}

export function combineReviews(specReview: ReviewResult, codeReview: ReviewResult): TwoStageReviewResult {
  let overallVerdict: ReviewVerdict = 'approved';

  if (specReview.verdict === 'changes_requested' || codeReview.verdict === 'changes_requested') {
    overallVerdict = 'changes_requested';
  } else if (specReview.verdict === 'needs_discussion' || codeReview.verdict === 'needs_discussion') {
    overallVerdict = 'needs_discussion';
  }

  return {
    specCompliance: specReview,
    codeQuality: codeReview,
    overallVerdict,
  };
}

export function createSpecCompliancePrompt(taskDescription: string, specContent: string): string {
  return `Review this completed task for spec compliance:

Task: ${taskDescription}

Spec requirements:
${specContent}

Check:
1. Does the implementation match the acceptance criteria?
2. Are all edge cases from the spec handled?
3. Does it follow the data model defined in the spec?

Respond with: APPROVED, CHANGES_REQUESTED, or NEEDS_DISCUSSION + findings.`;
}

export function createCodeQualityPrompt(taskDescription: string, conventionsContent: string): string {
  return `Review this completed task for code quality:

Task: ${taskDescription}

Code conventions:
${conventionsContent}

Check:
1. Naming conventions followed?
2. Test coverage adequate?
3. No duplication or unnecessary complexity?
4. Error handling appropriate?

Respond with: APPROVED, CHANGES_REQUESTED, or NEEDS_DISCUSSION + findings.`;
}
