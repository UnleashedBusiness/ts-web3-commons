export interface Web3StorageClientInterface {
  uploadFile(filename: string, content: string): Promise<string>;
}