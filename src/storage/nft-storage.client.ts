import { Web3StorageClientInterface } from './web3-storage-client.interface';
import axios from 'axios';
import UrlUtils from '../utils/url-utils';

export default class NftStorageClient implements Web3StorageClientInterface {
  private static readonly UPLOAD_URI = '/upload';

  constructor(
    private readonly baseUrl: string,
    private readonly authToken: string,
  ) {}

  public async uploadFile(filename: string, content: string): Promise<string> {
    const url = UrlUtils.getAbsoluteUrl(this.baseUrl, NftStorageClient.UPLOAD_URI);

    return axios
      .post(url, content, {
        headers: {
          Authorization: 'Bearer ' + this.authToken,
        },
      })
      .then((x) => {
        return x.data['value']['cid'];
      });
  }
}
