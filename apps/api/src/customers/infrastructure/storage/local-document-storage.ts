import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import type { DocumentStoragePort } from '../../application/ports/document-storage.port';

@Injectable()
export class LocalDocumentStorage implements DocumentStoragePort {
  private readonly uploadDir: string;

  constructor() {
    // ponytail: hardcoded uploads dir — switch to S3/GCS when staging demands it
    this.uploadDir = path.join(process.cwd(), 'uploads', 'documents');
    fs.mkdirSync(this.uploadDir, { recursive: true });
  }

  async upload(fileName: string, _mimeType: string, data: Buffer): Promise<string> {
    const filePath = path.join(this.uploadDir, `${Date.now()}-${fileName}`);
    await fs.promises.writeFile(filePath, data);
    return filePath;
  }

  async delete(filePath: string): Promise<void> {
    await fs.promises.unlink(filePath).catch(() => {
      // ponytail: file might not exist, ignore
    });
  }

  getUrl(filePath: string): string {
    return `/uploads/documents/${path.basename(filePath)}`;
  }
}
