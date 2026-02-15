import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerAuditLogTools } from "./audit-log.js";

function mockServer() {
  const tools = new Map<string, { opts: any; handler: Function }>();
  return {
    registerTool: vi.fn((name: string, opts: any, handler: Function) => {
      tools.set(name, { opts, handler });
    }),
    tools,
    call(name: string, params: any) {
      const tool = tools.get(name);
      if (!tool) throw new Error(`Tool "${name}" not registered`);
      return tool.handler(params);
    },
  };
}

function mockApi() {
  return { request: vi.fn() };
}

describe("audit log tools", () => {
  let server: ReturnType<typeof mockServer>;
  let api: ReturnType<typeof mockApi>;

  beforeEach(() => {
    server = mockServer();
    api = mockApi();
    registerAuditLogTools(server as any, api as any);
  });

  it("registers 1 audit log tool", () => {
    expect(server.tools.size).toBe(1);
  });

  it("get_audit_log sends GET /audit-log/:objectId", async () => {
    const log = [{ action: "created", timestamp: "2026-01-01T00:00:00Z" }];
    api.request.mockResolvedValueOnce(log);
    const result = await server.call("get_audit_log", { objectId: "w1" });
    expect(api.request).toHaveBeenCalledWith({ path: "/audit-log/w1" });
    expect(JSON.parse(result.content[0].text)).toEqual(log);
  });
});
