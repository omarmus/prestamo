import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

// ponytail: Direct fs usage instead of DocumentStoragePort wrapper.
// DocumentStoragePort is not yet wired in any module; this service
// owns the contracts/ subdirectory convention directly.
@Injectable()
export class ContractStorageService {
  private readonly contractsDir: string;

  constructor(uploadsDir?: string) {
    const base = uploadsDir ?? path.join(process.cwd(), 'uploads');
    this.contractsDir = path.join(base, 'contracts');
  }

  async save(loanId: string, buffer: Buffer, fileName: string): Promise<string> {
    const dir = path.join(this.contractsDir, loanId);
    await fs.promises.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, fileName);
    await fs.promises.writeFile(filePath, buffer);
    return filePath;
  }

  async get(filePath: string): Promise<Buffer> {
    return fs.promises.readFile(filePath);
  }

  async delete(filePath: string): Promise<void> {
    await fs.promises.unlink(filePath).catch(() => {
      // ponytail: file might not exist, ignore
    });
  }
}
