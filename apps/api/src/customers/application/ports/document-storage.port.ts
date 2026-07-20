export interface DocumentStoragePort {
  upload(fileName: string, mimeType: string, data: Buffer): Promise<string>;
  delete(fileName: string): Promise<void>;
  getUrl(fileName: string): string;
}
