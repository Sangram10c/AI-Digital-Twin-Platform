import { Injectable } from '@nestjs/common';

/**
 * Storage Service
 *
 * Abstraction layer for file storage.
 * Supports local filesystem and S3-compatible storage.
 */
@Injectable()
export class StorageService {
  async upload(_file: { originalname: string; buffer: Buffer; mimetype: string }): Promise<string> {
    // Implementation will handle local/S3 storage
    throw new Error('Not implemented');
  }

  async delete(_path: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async getSignedUrl(_path: string): Promise<string> {
    throw new Error('Not implemented');
  }
}
