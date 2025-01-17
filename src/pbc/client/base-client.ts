// Helper functions for building and sending get requests, and receiving json responses.

export class BaseClient {
  protected static readonly getHeaders: HeadersInit = {
    Accept: "application/json, text/plain, */*",
  };

  protected static readonly postHeaders: HeadersInit = {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
  };

  protected buildOptions<T>(method: RequestType, headers: HeadersInit, entityBytes: T) {
    const result: RequestInit = { method, headers, body: null };

    if (entityBytes != null) {
      result.body = JSON.stringify(entityBytes);
    }
    return result;
  }

  protected getRequest<R>(url: string): Promise<R | undefined> {
    const options = this.buildOptions("GET", BaseClient.getHeaders, null);
    return this.handleFetch(fetch(url, options));
  }

  protected putRequest<R, T>(url: string, object: T): Promise<R | undefined> {
    const options = this.buildOptions("PUT", BaseClient.postHeaders, object);
    return this.handleFetch(fetch(url, options));
  }

  protected async handleFetch<T>(promise: Promise<Response>): Promise<T | undefined> {
    try {
      let response = await promise;

      if (response.status === 200) {
        return response.json();
      } else {
        return undefined;
      }
    } catch (e) {
      return undefined;
    }
  }
}

export type RequestType = "GET" | "PUT";
