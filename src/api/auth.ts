import { Config } from "../config.js";

const AUTH_TIMEOUT_MS = 30_000;

export class AuthManager {
  private token: string | null = null;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    if (config.token) {
      this.token = config.token;
    }
  }

  async getToken(): Promise<string> {
    if (this.token && !this.isExpiringSoon(this.token)) {
      return this.token;
    }

    if (this.token) {
      try {
        this.token = await this.refresh(this.token);
        return this.token;
      } catch (err) {
        console.error("[opendock] Token refresh failed, falling back to login:", (err as Error).message);
      }
    }

    this.token = await this.login();
    return this.token;
  }

  clearToken(): void {
    this.token = null;
  }

  private isExpiringSoon(token: string): boolean {
    try {
      const payload = this.decodeJwt(token);
      if (!payload.exp) return false;
      const now = Math.floor(Date.now() / 1000);
      return payload.exp - now < 60;
    } catch {
      return false;
    }
  }

  private decodeJwt(token: string): { exp?: number; [key: string]: unknown } {
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("Invalid JWT");
    const payload = parts[1]!;
    const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(padded, "base64").toString("utf-8");
    return JSON.parse(json);
  }

  private async login(): Promise<string> {
    if (!this.config.username || !this.config.password) {
      throw new Error("No credentials available for login");
    }

    const res = await fetch(`${this.config.apiUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: this.config.username,
        password: this.config.password,
      }),
      signal: AbortSignal.timeout(AUTH_TIMEOUT_MS),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Login failed (${res.status}): ${body}`);
    }

    console.error("[opendock] Login successful");
    const data = (await res.json()) as { access_token: string };
    return data.access_token;
  }

  private async refresh(currentToken: string): Promise<string> {
    const res = await fetch(`${this.config.apiUrl}/auth/refresh`, {
      method: "GET",
      headers: { Authorization: `Bearer ${currentToken}` },
      signal: AbortSignal.timeout(AUTH_TIMEOUT_MS),
    });

    if (!res.ok) {
      throw new Error(`Token refresh failed (${res.status})`);
    }

    const data = (await res.json()) as { access_token: string };
    return data.access_token;
  }
}
