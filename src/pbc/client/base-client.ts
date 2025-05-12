// Helper functions for building and sending get requests, and receiving json responses.

import axios, { AxiosHeaders } from 'axios';

export type ClientResponse<D> = {
  code: number,
  data: D | undefined
}

export class BaseClient {
  protected static readonly getHeaders = {
    Accept: "application/json, text/plain, */*",
  };

  protected static readonly postHeaders = {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
  };

  protected async getRequest<R>(url: string, params: Record<string, any> = {}): Promise<ClientResponse<R>> {
    const headers = new AxiosHeaders();
    for (const [name, header] of Object.entries(BaseClient.getHeaders)) {
      headers.set(name, header);
    }

    const response = await axios.get(url, { headers: headers, params: params, validateStatus: () => true });
    return ({ code: response.status, data: response.data });
  }

  protected async putRequest<R, T>(url: string, object: T): Promise<ClientResponse<R>> {
    const headers = new AxiosHeaders();
    for (const [name, header] of Object.entries(BaseClient.postHeaders)) {
      headers.set(name, header);
    }

    const response = await axios.put(url, object, { headers: headers, validateStatus: () => true });
    return ({ code: response.status, data: response.data });
  }

  protected async postRequest<R, T>(url: string, object: T): Promise<ClientResponse<R>> {
    const headers = new AxiosHeaders();
    for (const [name, header] of Object.entries(BaseClient.postHeaders)) {
      headers.set(name, header);
    }

    const response = await axios.post(url, object, { headers: headers, validateStatus: () => true });
    return ({ code: response.status, data: response.data });
  }
}
