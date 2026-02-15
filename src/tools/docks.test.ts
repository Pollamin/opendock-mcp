import { describe, it, expect, beforeEach } from "vitest";
import { registerDockTools } from "./docks.js";
import { mockServer, mockApi } from "./test-utils.js";

describe("dock tools", () => {
  let server: ReturnType<typeof mockServer>;
  let api: ReturnType<typeof mockApi>;

  beforeEach(() => {
    server = mockServer();
    api = mockApi();
    registerDockTools(server as any, api as any);
  });

  it("registers all 7 dock tools", () => {
    expect(server.tools.size).toBe(7);
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

  it("create_dock sends POST /dock", async () => {
    api.request.mockResolvedValueOnce({ id: "d2", name: "Dock B" });
    const result = await server.call("create_dock", { warehouseId: "w1", name: "Dock B", doorNumber: "2" });
    expect(api.request).toHaveBeenCalledWith({
      method: "POST",
      path: "/dock",
      body: { warehouseId: "w1", name: "Dock B", doorNumber: "2" },
    });
    expect(JSON.parse(result.content[0].text)).toEqual({ id: "d2", name: "Dock B" });
  });

  it("update_dock sends PATCH /dock/:id", async () => {
    api.request.mockResolvedValueOnce({ id: "d1", name: "Updated" });
    const result = await server.call("update_dock", { id: "d1", name: "Updated" });
    expect(api.request).toHaveBeenCalledWith({
      method: "PATCH",
      path: "/dock/d1",
      body: { name: "Updated" },
    });
    expect(JSON.parse(result.content[0].text)).toEqual({ id: "d1", name: "Updated" });
  });

  it("delete_dock sends DELETE /dock/:id", async () => {
    api.request.mockResolvedValueOnce(undefined);
    const result = await server.call("delete_dock", { id: "d1" });
    expect(api.request).toHaveBeenCalledWith({
      method: "DELETE",
      path: "/dock/d1",
      body: undefined,
    });
    expect(result.content[0].text).toContain("deleted successfully");
  });

  it("sort_docks sends POST /dock/sort", async () => {
    const docks = [{ id: "d1", sortOrder: 0 }, { id: "d2", sortOrder: 1 }];
    api.request.mockResolvedValueOnce({ success: true });
    const result = await server.call("sort_docks", { docks });
    expect(api.request).toHaveBeenCalledWith({
      method: "POST",
      path: "/dock/sort",
      body: docks,
    });
    expect(JSON.parse(result.content[0].text)).toEqual({ success: true });
  });

  it("get_dock_availability sends POST /dock/:id/get-availability", async () => {
    api.request.mockResolvedValueOnce({ slots: [] });
    const result = await server.call("get_dock_availability", {
      id: "d1",
      startDate: "2026-01-01T00:00:00Z",
      endDate: "2026-01-07T00:00:00Z",
    });
    expect(api.request).toHaveBeenCalledWith({
      method: "POST",
      path: "/dock/d1/get-availability",
      body: { start: "2026-01-01T00:00:00Z", end: "2026-01-07T00:00:00Z" },
    });
    expect(JSON.parse(result.content[0].text)).toEqual({ slots: [] });
  });
});
