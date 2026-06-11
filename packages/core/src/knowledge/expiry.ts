import type { KnowledgeBlock } from './types.js';

export interface ExpiryResult {
  expired: boolean;
  daysOverdue?: number;
}

export function checkExpiry(block: KnowledgeBlock): ExpiryResult {
  if (!block.expires_at) {
    return { expired: false };
  }

  const expiresAt = new Date(block.expires_at).getTime();
  const now = Date.now();

  if (now > expiresAt) {
    const daysOverdue = Math.floor((now - expiresAt) / (1000 * 60 * 60 * 24));
    return { expired: true, daysOverdue };
  }

  return { expired: false };
}
