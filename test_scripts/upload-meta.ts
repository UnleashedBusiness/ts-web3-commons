import NftStorageClient from "../src/storage/nft-storage.client.js";

const client = new NftStorageClient('https://api.nft.storage', process.argv[2]);

client.uploadFile('test.txt', Buffer.from('{"test": "test1"}')).then((cid: string) => {
  console.log(cid);
});