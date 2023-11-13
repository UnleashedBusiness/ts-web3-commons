export interface Web3StorageClientInterface {
  uploadFile(filename: string, content: Buffer): Promise<string>;
}