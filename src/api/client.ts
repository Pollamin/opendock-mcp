import { AuthManager } from "./auth.js";

const REQUEST_TIMEOUT_MS = 30_000;
const RETRY_DELAY_MS = 1_000;
const MAX_RETRY_DELAY_MS = 60_000;
const RETRYABLE_STATUS_CODES = new Set([502, 503, 504]);

function parseRetryAfter(header: string | null): number {
  if (!header) return RETRY_DELAY_MS;
  const seconds = parseInt(header, 10);
  if (!isNaN(seconds)) return Math.min(seconds * 1000, MAX_RETRY_DELAY_MS);
  const date = new Date(header);
  if (!isNaN(date.getTime())) return Math.min(Math.max(0, date.getTime() - Date.now()), MAX_RETRY_DELAY_MS);
  return RETRY_DELAY_MS;
}

export type QueryParams = Record<string, string | number | boolean | string[] | undefined>;

export interface ApiRequestOptions {
  method?: string;
  path: string;
  query?: QueryParams;
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
      return this.handleResponse<T>(await this.doRequest(opts));
    }

    if (response.status === 429) {
      const delay = parseRetryAfter(response.headers.get("Retry-After"));
      console.error(`[opendock] Got 429 on ${opts.method || "GET"} ${opts.path}, retrying in ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.handleResponse<T>(await this.doRequest(opts));
    }

    if (RETRYABLE_STATUS_CODES.has(response.status)) {
      console.error(`[opendock] Got ${response.status} on ${opts.method || "GET"} ${opts.path}, retrying in ${RETRY_DELAY_MS}ms`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return this.handleResponse<T>(await this.doRequest(opts));
    }

    return this.handleResponse<T>(response);
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`API error ${response.status}: ${body}`);
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  private async doRequest(opts: ApiRequestOptions): Promise<Response> {
    const token = await this.auth.getToken();
    const url = new URL(`${this.baseUrl}${opts.path}`);

    if (opts.query) {
      for (const [key, value] of Object.entries(opts.query)) {
        if (value === undefined) continue;
        if (Array.isArray(value)) {
          for (const item of value) {
            url.searchParams.append(key, item);
          }
        } else {
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
