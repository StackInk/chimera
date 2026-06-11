export type ContentType = 'json' | 'code' | 'prose' | 'log' | 'unknown';
export type CompressionEngine = 'builtin' | 'headroom';
export type HeadroomMode = 'proxy' | 'mcp' | 'cli';

export interface CompressionConfig {
  enabled: boolean;
  engine: CompressionEngine;
  mode?: HeadroomMode;
  builtin: {
    json_max_keys: number;
    code_max_lines: number;
    prose_max_sentences: number;
  };
}

export interface CompressionResult {
  original_tokens: number;
  compressed_tokens: number;
  content_type: ContentType;
  summary: string;
  cache_id: string;
}
