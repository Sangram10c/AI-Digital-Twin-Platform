import { createHash } from 'crypto';

export function contentChecksum(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

export function estimateTokenCount(content: string, ratio = 4): number {
  return Math.max(1, Math.ceil(content.length / ratio));
}
