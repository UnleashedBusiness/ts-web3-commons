import NftStorageClient from "../src/storage/nft-storage.client";

const client = new NftStorageClient('https://api.nft.storage', process.argv[2]);

client.uploadFile('test.txt', '{"test": "test1"}').then(cid => {
  console.log(cid);
});