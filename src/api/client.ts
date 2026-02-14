import { AuthManager } from "./auth.js";

export interface ApiRequestOptions {
  method?: string;
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

export class ApiClient {
  private baseUrl: string;
  private auth: AuthManager;

  constructor(baseUrl: string, auth: AuthManager) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.auth = auth;
  }

  async request<T = unknown>(opts: ApiRequestOptions): Promise<T> {
    const response = await this.doRequest(opts);

    if (response.status === 401) {
      this.auth.clearToken();
      const retry = await this.doRequest(opts);
      if (!retry.ok) {
        const body = await retry.text();
        throw new Error(`API error ${retry.status}: ${body}`);
      }
      return (await retry.json()) as T;
    }

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`API error ${response.status}: ${body}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  private async doRequest(opts: ApiRequestOptions): Promise<Response> {
    const token = await this.auth.getToken();
    const url = new URL(`${this.baseUrl}${opts.path}`);

    if (opts.query) {
      for (const [key, value] of Object.entries(opts.query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    return fetch(url.toString(), {
      method: opts.method || "GET",
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
  }
}
