import { describe, it, expect, beforeEach } from "vitest";
import { registerWarehouseTools } from "./warehouses.js";
import { mockServer, mockApi } from "./test-utils.js";

describe("warehouse tools", () => {
  let server: ReturnType<typeof mockServer>;
  let api: ReturnType<typeof mockApi>;

  beforeEach(() => {
    server = mockServer();
    api = mockApi();
    registerWarehouseTools(server as any, api as any);
  });

  it("registers all 6 warehouse tools", () => {
    expect(server.tools.size).toBe(6);
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

  it("create_warehouse sends POST /warehouse", async () => {
    api.request.mockResolvedValueOnce({ id: "w2", name: "New WH" });
    const result = await server.call("create_warehouse", { name: "New WH", timezone: "America/Chicago" });
    expect(api.request).toHaveBeenCalledWith({
      method: "POST",
      path: "/warehouse",
      body: { name: "New WH", timezone: "America/Chicago" },
    });
    expect(JSON.parse(result.content[0].text)).toEqual({ id: "w2", name: "New WH" });
  });

  it("update_warehouse sends PATCH /warehouse/:id", async () => {
    api.request.mockResolvedValueOnce({ id: "w1", name: "Updated" });
    const result = await server.call("update_warehouse", { id: "w1", name: "Updated" });
    expect(api.request).toHaveBeenCalledWith({
      method: "PATCH",
      path: "/warehouse/w1",
      body: { name: "Updated" },
    });
    expect(JSON.parse(result.content[0].text)).toEqual({ id: "w1", name: "Updated" });
  });

  it("delete_warehouse sends DELETE /warehouse/:id", async () => {
    api.request.mockResolvedValueOnce(undefined);
    const result = await server.call("delete_warehouse", { id: "w1" });
    expect(api.request).toHaveBeenCalledWith({
      method: "DELETE",
      path: "/warehouse/w1",
    });
    expect(result.content[0].text).toContain("deleted successfully");
  });
});
