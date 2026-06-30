import { Injectable } from '@nestjs/common';

/**
 * Storage Service
 *
 * Abstraction layer for file storage.
 * Supports local filesystem and S3-compatible storage.
 */
@Injectable()
export class StorageService {
  upload(_file: {
    originalname: string;
    buffer: Buffer;
    mimetype: string;
  }): Promise<string> {
    // Implementation will handle local/S3 storage
    return Promise.reject(new Error('Not implemented'));
  }

  delete(_path: string): Promise<void> {
    return Promise.reject(new Error('Not implemented'));
  }

  getSignedUrl(_path: string): Promise<string> {
    return Promise.reject(new Error('Not implemented'));
  }
}
