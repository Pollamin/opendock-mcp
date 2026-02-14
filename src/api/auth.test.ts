import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthManager } from "./auth.js";

function fakeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.fakesig`;
}

function futureExp(seconds: number): number {
  return Math.floor(Date.now() / 1000) + seconds;
}

describe("AuthManager", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns cached token when not expiring", async () => {
    const token = fakeJwt({ exp: futureExp(300) });
    const auth = new AuthManager({ apiUrl: "https://api.test", token });
    const result = await auth.getToken();
    expect(result).toBe(token);
  });

  it("refreshes when token expires within 60s", async () => {
    const oldToken = fakeJwt({ exp: futureExp(30) });
    const newToken = fakeJwt({ exp: futureExp(3600) });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: newToken }),
      })
    );

    const auth = new AuthManager({ apiUrl: "https://api.test", token: oldToken });
    const result = await auth.getToken();
    expect(result).toBe(newToken);
    expect(fetch).toHaveBeenCalledWith(
      "https://api.test/auth/refresh",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("falls back to login when refresh fails", async () => {
    const oldToken = fakeJwt({ exp: futureExp(30) });
    const loginToken = fakeJwt({ exp: futureExp(3600) });

    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({ ok: false, status: 401 })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: loginToken }),
        })
    );

    const auth = new AuthManager({
      apiUrl: "https://api.test",
      token: oldToken,
      username: "user",
      password: "pass",
    });
    const result = await auth.getToken();
    expect(result).toBe(loginToken);
  });

  it("logs in when no cached token", async () => {
    const loginToken = fakeJwt({ exp: futureExp(3600) });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: loginToken }),
      })
    );

    const auth = new AuthManager({
      apiUrl: "https://api.test",
      username: "user",
      password: "pass",
    });
    const result = await auth.getToken();
    expect(result).toBe(loginToken);
    expect(fetch).toHaveBeenCalledWith(
      "https://api.test/auth/login",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("throws on login failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => "Forbidden",
      })
    );

    const auth = new AuthManager({
      apiUrl: "https://api.test",
      username: "user",
      password: "pass",
    });
    await expect(auth.getToken()).rejects.toThrow("Login failed (403): Forbidden");
  });

  it("throws on missing credentials when login is needed", async () => {
    const auth = new AuthManager({ apiUrl: "https://api.test" });
    await expect(auth.getToken()).rejects.toThrow("No credentials available for login");
  });

  it("clearToken forces re-auth on next getToken", async () => {
    const oldToken = fakeJwt({ exp: futureExp(300) });
    const loginToken = fakeJwt({ exp: futureExp(3600) });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: loginToken }),
      })
    );

    const auth = new AuthManager({
      apiUrl: "https://api.test",
      token: oldToken,
      username: "user",
      password: "pass",
    });

    expect(await auth.getToken()).toBe(oldToken);
    auth.clearToken();
    expect(await auth.getToken()).toBe(loginToken);
  });

  it("treats token without exp as valid (no refresh)", async () => {
    const token = fakeJwt({ sub: "user123" });
    const auth = new AuthManager({ apiUrl: "https://api.test", token });
    const result = await auth.getToken();
    expect(result).toBe(token);
  });
});
