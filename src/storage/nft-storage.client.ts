import {type Web3StorageClientInterface} from './web3-storage-client.interface.js';
import axios from 'axios';
import {UrlUtils} from '../utils/url-utils.js';

export default class NftStorageClient implements Web3StorageClientInterface {
    private static readonly UPLOAD_URI = '/upload';

    constructor(
        private readonly baseUrl: string,
        private readonly authToken: string,
    ) {
    }

    public async uploadFile(_: string, content: Buffer): Promise<string> {
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
