import { AuthManager } from "./auth.js";

const REQUEST_TIMEOUT_MS = 30_000;
const RETRY_DELAY_MS = 1_000;
const RETRYABLE_STATUS_CODES = new Set([502, 503, 504]);

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
      console.error(`[opendock] Got 401 on ${opts.method || "GET"} ${opts.path}, retrying with fresh token`);
      this.auth.clearToken();
      const retry = await this.doRequest(opts);
      if (!retry.ok) {
        const body = await retry.text();
        throw new Error(`API error ${retry.status}: ${body}`);
      }
      return (await retry.json()) as T;
    }

    if (RETRYABLE_STATUS_CODES.has(response.status)) {
      console.error(`[opendock] Got ${response.status} on ${opts.method || "GET"} ${opts.path}, retrying in ${RETRY_DELAY_MS}ms`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      const retry = await this.doRequest(opts);
      if (!retry.ok) {
        const body = await retry.text();
        throw new Error(`API error ${retry.status}: ${body}`);
      }
      if (retry.status === 204) return undefined as T;
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
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  }
}
