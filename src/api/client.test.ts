import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiClient } from "./client.js";

function mockAuth(token = "test-token") {
  return {
    getToken: vi.fn().mockResolvedValue(token),
    clearToken: vi.fn(),
  };
}

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

function errorResponse(status: number, body = "error", headers: Record<string, string> = {}) {
  const headerMap = new Map(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  return {
    ok: false,
    status,
    headers: { get: (key: string) => headerMap.get(key.toLowerCase()) ?? null },
    json: async () => ({ error: body }),
    text: async () => body,
  };
}

describe("ApiClient", () => {
  let auth: ReturnType<typeof mockAuth>;

  beforeEach(() => {
    auth = mockAuth();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("sends GET with auth header", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(jsonResponse({ id: 1 })));
    const client = new ApiClient("https://api.test", auth as any);

    const result = await client.request({ path: "/items" });
    expect(result).toEqual({ id: 1 });
    expect(fetch).toHaveBeenCalledWith(
      "https://api.test/items",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer test-token" }),
      })
    );
  });

  it("sends POST with JSON body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(jsonResponse({ ok: true })));
    const client = new ApiClient("https://api.test", auth as any);

    await client.request({ method: "POST", path: "/items", body: { name: "test" } });
    expect(fetch).toHaveBeenCalledWith(
      "https://api.test/items",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "test" }),
      })
    );
  });

  it("appends query params and skips undefined values", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(jsonResponse([])));
    const client = new ApiClient("https://api.test", auth as any);

    await client.request({
      path: "/items",
      query: { page: 1, search: "foo", empty: undefined },
    });
    const url = (fetch as any).mock.calls[0][0] as string;
    expect(url).toContain("page=1");
    expect(url).toContain("search=foo");
    expect(url).not.toContain("empty");
  });

  it("returns undefined for 204 responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({ ok: true, status: 204 })
    );
    const client = new ApiClient("https://api.test", auth as any);

    const result = await client.request({ method: "DELETE", path: "/items/1" });
    expect(result).toBeUndefined();
  });

  it("clears token and retries on 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce(errorResponse(401))
        .mockResolvedValueOnce(jsonResponse({ id: 1 }))
    );
    const client = new ApiClient("https://api.test", auth as any);

    const result = await client.request({ path: "/items" });
    expect(auth.clearToken).toHaveBeenCalled();
    expect(result).toEqual({ id: 1 });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("throws if 401 retry also fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce(errorResponse(401))
        .mockResolvedValueOnce(errorResponse(401, "still unauthorized"))
    );
    const client = new ApiClient("https://api.test", auth as any);

    await expect(client.request({ path: "/items" })).rejects.toThrow(
      "API error 401: still unauthorized"
    );
  });

  it("retries on 502 after 1s delay", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce(errorResponse(502))
        .mockResolvedValueOnce(jsonResponse({ ok: true }))
    );
    const client = new ApiClient("https://api.test", auth as any);

    const promise = client.request({ path: "/items" });
    await vi.advanceTimersByTimeAsync(1000);
    const result = await promise;
    expect(result).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("retries on 503 after 1s delay", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce(errorResponse(503))
        .mockResolvedValueOnce(jsonResponse({ ok: true }))
    );
    const client = new ApiClient("https://api.test", auth as any);

    const promise = client.request({ path: "/items" });
    await vi.advanceTimersByTimeAsync(1000);
    const result = await promise;
    expect(result).toEqual({ ok: true });
    vi.useRealTimers();
  });

  it("retries on 504 after 1s delay", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce(errorResponse(504))
        .mockResolvedValueOnce(jsonResponse({ ok: true }))
    );
    const client = new ApiClient("https://api.test", auth as any);

    const promise = client.request({ path: "/items" });
    await vi.advanceTimersByTimeAsync(1000);
    const result = await promise;
    expect(result).toEqual({ ok: true });
    vi.useRealTimers();
  });

  it("throws if 5xx retry also fails", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce(errorResponse(502))
        .mockResolvedValueOnce(errorResponse(502, "still down"))
    );
    const client = new ApiClient("https://api.test", auth as any);

    const promise = client.request({ path: "/items" });
    const assertion = expect(promise).rejects.toThrow("API error 502: still down");
    await vi.advanceTimersByTimeAsync(1000);
    await assertion;
    vi.useRealTimers();
  });

  it("returns undefined when 5xx retry gives 204", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce(errorResponse(503))
        .mockResolvedValueOnce({ ok: true, status: 204 })
    );
    const client = new ApiClient("https://api.test", auth as any);

    const promise = client.request({ path: "/items" });
    await vi.advanceTimersByTimeAsync(1000);
    const result = await promise;
    expect(result).toBeUndefined();
    vi.useRealTimers();
  });

  it("throws immediately on 400 (no retry)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(errorResponse(400, "bad request")));
    const client = new ApiClient("https://api.test", auth as any);

    await expect(client.request({ path: "/items" })).rejects.toThrow("API error 400: bad request");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("throws immediately on 404 (no retry)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(errorResponse(404, "not found")));
    const client = new ApiClient("https://api.test", auth as any);

    await expect(client.request({ path: "/items/999" })).rejects.toThrow("API error 404: not found");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("throws immediately on 500 (no retry)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(errorResponse(500, "server error")));
    const client = new ApiClient("https://api.test", auth as any);

    await expect(client.request({ path: "/items" })).rejects.toThrow("API error 500: server error");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("returns undefined when 401 retry gives 204", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce(errorResponse(401))
        .mockResolvedValueOnce({ ok: true, status: 204 })
    );
    const client = new ApiClient("https://api.test", auth as any);

    const result = await client.request({ method: "DELETE", path: "/items/1" });
    expect(result).toBeUndefined();
  });

  it("retries on 429 with default 1s delay when no Retry-After header", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce(errorResponse(429))
        .mockResolvedValueOnce(jsonResponse({ ok: true }))
    );
    const client = new ApiClient("https://api.test", auth as any);

    const promise = client.request({ path: "/items" });
    await vi.advanceTimersByTimeAsync(1000);
    const result = await promise;
    expect(result).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("retries on 429 using Retry-After seconds header", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce(errorResponse(429, "rate limited", { "Retry-After": "5" }))
        .mockResolvedValueOnce(jsonResponse({ ok: true }))
    );
    const client = new ApiClient("https://api.test", auth as any);

    const promise = client.request({ path: "/items" });
    await vi.advanceTimersByTimeAsync(5000);
    const result = await promise;
    expect(result).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("throws if 429 retry also fails", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce(errorResponse(429))
        .mockResolvedValueOnce(errorResponse(429, "still rate limited"))
    );
    const client = new ApiClient("https://api.test", auth as any);

    const promise = client.request({ path: "/items" });
    const assertion = expect(promise).rejects.toThrow("API error 429: still rate limited");
    await vi.advanceTimersByTimeAsync(1000);
    await assertion;
    vi.useRealTimers();
  });

  it("propagates network errors from fetch", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(new TypeError("fetch failed")));
    const client = new ApiClient("https://api.test", auth as any);

    await expect(client.request({ path: "/items" })).rejects.toThrow("fetch failed");
  });

  it("appends array query params as repeated keys", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(jsonResponse([])));
    const client = new ApiClient("https://api.test", auth as any);

    await client.request({
      path: "/items",
      query: { join: ["user||email", "user.company||name"] as any },
    });
    const url = (fetch as any).mock.calls[0][0] as string;
    expect(url).toContain("join=user%7C%7Cemail");
    expect(url).toContain("join=user.company%7C%7Cname");
  });

  it("strips trailing slashes from base URL", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(jsonResponse({})));
    const client = new ApiClient("https://api.test///", auth as any);

    await client.request({ path: "/items" });
    const url = (fetch as any).mock.calls[0][0] as string;
    expect(url).toBe("https://api.test/items");
  });
});
