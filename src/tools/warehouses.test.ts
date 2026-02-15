import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerWarehouseTools } from "./warehouses.js";

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

describe("warehouse tools", () => {
  let server: ReturnType<typeof mockServer>;
  let api: ReturnType<typeof mockApi>;

  beforeEach(() => {
    server = mockServer();
    api = mockApi();
    registerWarehouseTools(server as any, api as any);
  });

  it("registers all 3 warehouse tools", () => {
    expect(server.tools.size).toBe(3);
  });

  it("list_warehouses sends GET /warehouse with query params", async () => {
    api.request.mockResolvedValueOnce([{ id: "w1" }]);
    const result = await server.call("list_warehouses", { name: "Main", state: "TX" });
    expect(api.request).toHaveBeenCalledWith({
      path: "/warehouse",
      query: { name: "Main", state: "TX" },
    });
    expect(JSON.parse(result.content[0].text)).toEqual([{ id: "w1" }]);
  });

  it("get_warehouse sends GET /warehouse/:id", async () => {
    api.request.mockResolvedValueOnce({ id: "w1", name: "Main" });
    const result = await server.call("get_warehouse", { id: "w1" });
    expect(api.request).toHaveBeenCalledWith({ path: "/warehouse/w1" });
    expect(JSON.parse(result.content[0].text)).toEqual({ id: "w1", name: "Main" });
  });

  it("get_warehouse_hours sends POST /warehouse/:id/get-hours-of-operation with dates", async () => {
    api.request.mockResolvedValueOnce({ hours: [] });
    const result = await server.call("get_warehouse_hours", {
      id: "w1",
      startDate: "2026-01-01",
      endDate: "2026-01-07",
    });
    expect(api.request).toHaveBeenCalledWith({
      method: "POST",
      path: "/warehouse/w1/get-hours-of-operation",
      body: { startDate: "2026-01-01", endDate: "2026-01-07" },
    });
    expect(JSON.parse(result.content[0].text)).toEqual({ hours: [] });
  });

  it("get_warehouse_hours omits body when no dates provided", async () => {
    api.request.mockResolvedValueOnce({ hours: [] });
    await server.call("get_warehouse_hours", { id: "w1" });
    expect(api.request).toHaveBeenCalledWith({
      method: "POST",
      path: "/warehouse/w1/get-hours-of-operation",
      body: undefined,
    });
  });
});
