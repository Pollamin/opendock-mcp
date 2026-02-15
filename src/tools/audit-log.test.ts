import { describe, it, expect, beforeEach } from "vitest";
import { registerAuditLogTools } from "./audit-log.js";
import { mockServer, mockApi } from "./test-utils.js";

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
