import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerOrgTools } from "./orgs.js";

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

describe("org tools", () => {
  let server: ReturnType<typeof mockServer>;
  let api: ReturnType<typeof mockApi>;

  beforeEach(() => {
    server = mockServer();
    api = mockApi();
    registerOrgTools(server as any, api as any);
  });

  it("registers all 3 org tools", () => {
    expect(server.tools.size).toBe(3);
  });

  it("get_org sends GET /org/:id", async () => {
    api.request.mockResolvedValueOnce({ id: "org1", name: "ACME Corp" });
    const result = await server.call("get_org", { id: "org1" });
    expect(api.request).toHaveBeenCalledWith({ path: "/org/org1" });
    expect(JSON.parse(result.content[0].text)).toEqual({ id: "org1", name: "ACME Corp" });
  });

  it("update_org sends PATCH /org/:id", async () => {
    api.request.mockResolvedValueOnce({ id: "org1", name: "Updated" });
    const result = await server.call("update_org", { id: "org1", name: "Updated" });
    expect(api.request).toHaveBeenCalledWith({
      method: "PATCH",
      path: "/org/org1",
      body: { name: "Updated" },
    });
    expect(JSON.parse(result.content[0].text)).toEqual({ id: "org1", name: "Updated" });
  });

  it("update_favorite_carriers sends PATCH /org/:orgId/favorite-carriers", async () => {
    api.request.mockResolvedValueOnce({ success: true });
    const result = await server.call("update_favorite_carriers", {
      orgId: "org1",
      carrierIds: ["c1", "c2"],
    });
    expect(api.request).toHaveBeenCalledWith({
      method: "PATCH",
      path: "/org/org1/favorite-carriers",
      body: ["c1", "c2"],
    });
    expect(JSON.parse(result.content[0].text)).toEqual({ success: true });
  });
});
