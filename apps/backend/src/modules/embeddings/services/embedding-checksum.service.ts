import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmbeddingChecksumService {
  hashContent(content: string): string {
    return createHash('sha256').update(content, 'utf8').digest('hex');
  }

  /**
   * Prefer stored contentHash when present; otherwise hash live content.
   */
  resolveChunkChecksum(chunk: {
    content: string;
    contentHash?: string | null;
  }): string {
    if (chunk.contentHash && /^[a-f0-9]{64}$/i.test(chunk.contentHash)) {
      return chunk.contentHash.toLowerCase();
    }
    return this.hashContent(chunk.content);
  }
}
