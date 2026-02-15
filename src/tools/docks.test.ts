import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerDockTools } from "./docks.js";

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

describe("dock tools", () => {
  let server: ReturnType<typeof mockServer>;
  let api: ReturnType<typeof mockApi>;

  beforeEach(() => {
    server = mockServer();
    api = mockApi();
    registerDockTools(server as any, api as any);
  });

  it("registers all 2 dock tools", () => {
    expect(server.tools.size).toBe(2);
  });

  it("list_docks sends GET /dock with query params", async () => {
    api.request.mockResolvedValueOnce([{ id: "d1" }]);
    const result = await server.call("list_docks", { warehouseId: "w1" });
    expect(api.request).toHaveBeenCalledWith({
      path: "/dock",
      query: { warehouseId: "w1" },
    });
    expect(JSON.parse(result.content[0].text)).toEqual([{ id: "d1" }]);
  });

  it("get_dock sends GET /dock/:id", async () => {
    api.request.mockResolvedValueOnce({ id: "d1", name: "Dock A" });
    const result = await server.call("get_dock", { id: "d1" });
    expect(api.request).toHaveBeenCalledWith({ path: "/dock/d1" });
    expect(JSON.parse(result.content[0].text)).toEqual({ id: "d1", name: "Dock A" });
  });
});
