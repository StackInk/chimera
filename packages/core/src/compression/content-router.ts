import type { ContentType, CompressionResult } from './types.js';

export function detectContentType(content: string): ContentType {
  const trimmed = content.trim();
  if (!trimmed) return 'unknown';

  if (/^\s*[\[{]/.test(trimmed)) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch { /* not valid JSON */ }
  }

  const codeIndicators = [
    /^(import|export|from)\s/m,
    /^(function|const|let|var|class)\s/m,
    /^(def|class|import)\s/m,
    /^(pub\s+fn|fn|impl|struct|enum)\s/m,
    /^\s*(if|for|while|return)\s*[({]/m,
  ];
  const codeScore = codeIndicators.filter(r => r.test(trimmed)).length;
  if (codeScore >= 1) return 'code';

  return 'prose';
}

export class ContentRouter {
  compress(content: string): CompressionResult {
    const contentType = detectContentType(content);

    switch (contentType) {
      case 'json':
        return this.compressJson(content);
      case 'code':
        return this.compressCode(content);
      case 'prose':
        return this.compressProse(content);
      default:
        return {
          original_tokens: estimateTokens(content),
          compressed_tokens: estimateTokens(content),
          content_type: 'unknown',
          summary: content.slice(0, 200),
          cache_id: '',
        };
    }
  }

  private compressJson(content: string): CompressionResult {
    try {
      const parsed = JSON.parse(content);
      const schema = extractJsonSchema(parsed);
      const summary = JSON.stringify(schema);
      return {
        original_tokens: estimateTokens(content),
        compressed_tokens: estimateTokens(summary),
        content_type: 'json',
        summary,
        cache_id: '',
      };
    } catch {
      return { original_tokens: estimateTokens(content), compressed_tokens: estimateTokens(content), content_type: 'json', summary: content.slice(0, 100), cache_id: '' };
    }
  }

  private compressCode(content: string): CompressionResult {
    const signatures = extractSignatures(content);
    const summary = signatures.join('\n');
    return {
      original_tokens: estimateTokens(content),
      compressed_tokens: estimateTokens(summary),
      content_type: 'code',
      summary,
      cache_id: '',
    };
  }

  private compressProse(content: string): CompressionResult {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const summary = sentences.slice(0, 3).map(s => s.trim()).join('. ') + '.';
    return {
      original_tokens: estimateTokens(content),
      compressed_tokens: estimateTokens(summary),
      content_type: 'prose',
      summary,
      cache_id: '',
    };
  }
}

function extractJsonSchema(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    return [`Array(${obj.length}): ${typeof obj[0]}`];
  }
  if (obj && typeof obj === 'object') {
    const schema: Record<string, string> = {};
    for (const [key, value] of Object.entries(obj)) {
      schema[key] = Array.isArray(value) ? `[${value.length}]` : typeof value;
    }
    return schema;
  }
  return typeof obj;
}

function extractSignatures(code: string): string[] {
  const lines = code.split('\n');
  const signatures: string[] = [];

  for (const line of lines) {
    const match = line.match(/^(export\s+)?(function|const|class|def|pub\s+fn|fn)\s+(\w+)/);
    if (match) {
      const sigLine = line.replace(/\{.*$/, '').trim();
      signatures.push(sigLine);
    }
  }

  return signatures.length > 0 ? signatures : [code.split('\n')[0]];
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
