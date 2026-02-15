import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerLoadTypeTools } from "./loadtypes.js";

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

describe("load type tools", () => {
  let server: ReturnType<typeof mockServer>;
  let api: ReturnType<typeof mockApi>;

  beforeEach(() => {
    server = mockServer();
    api = mockApi();
    registerLoadTypeTools(server as any, api as any);
  });

  it("registers all 3 load type tools", () => {
    expect(server.tools.size).toBe(3);
  });

  it("list_load_types sends GET /loadtype with query params", async () => {
    api.request.mockResolvedValueOnce([{ id: "lt1" }]);
    const result = await server.call("list_load_types", { warehouseId: "w1" });
    expect(api.request).toHaveBeenCalledWith({
      path: "/loadtype",
      query: { warehouseId: "w1" },
    });
    expect(JSON.parse(result.content[0].text)).toEqual([{ id: "lt1" }]);
  });

  it("get_load_type sends GET /loadtype/:id", async () => {
    api.request.mockResolvedValueOnce({ id: "lt1", name: "Inbound" });
    const result = await server.call("get_load_type", { id: "lt1" });
    expect(api.request).toHaveBeenCalledWith({ path: "/loadtype/lt1" });
    expect(JSON.parse(result.content[0].text)).toEqual({ id: "lt1", name: "Inbound" });
  });

  it("get_load_type_availability sends POST /loadtype/:id/get-availability", async () => {
    api.request.mockResolvedValueOnce({ slots: [] });
    const result = await server.call("get_load_type_availability", {
      id: "lt1",
      startDate: "2026-01-01",
      endDate: "2026-01-07",
    });
    expect(api.request).toHaveBeenCalledWith({
      method: "POST",
      path: "/loadtype/lt1/get-availability",
      body: { startDate: "2026-01-01", endDate: "2026-01-07" },
    });
    expect(JSON.parse(result.content[0].text)).toEqual({ slots: [] });
  });
});
