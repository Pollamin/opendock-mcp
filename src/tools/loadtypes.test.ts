import { describe, it, expect, beforeEach } from "vitest";
import { registerLoadTypeTools } from "./loadtypes.js";
import { mockServer, mockApi } from "./test-utils.js";

describe("load type tools", () => {
  let server: ReturnType<typeof mockServer>;
  let api: ReturnType<typeof mockApi>;

  beforeEach(() => {
    server = mockServer();
    api = mockApi();
    registerLoadTypeTools(server as any, api as any);
  });

  it("registers all 6 load type tools", () => {
    expect(server.tools.size).toBe(6);
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

  it("create_load_type sends POST /loadtype", async () => {
    api.request.mockResolvedValueOnce({ id: "lt2", direction: "Outbound" });
    const result = await server.call("create_load_type", {
      warehouseId: "w1",
      direction: "Outbound",
      operation: "Live",
    });
    expect(api.request).toHaveBeenCalledWith({
      method: "POST",
      path: "/loadtype",
      body: { warehouseId: "w1", direction: "Outbound", operation: "Live" },
    });
    expect(JSON.parse(result.content[0].text)).toEqual({ id: "lt2", direction: "Outbound" });
  });

  it("update_load_type sends PATCH /loadtype/:id", async () => {
    api.request.mockResolvedValueOnce({ id: "lt1", name: "Updated" });
    const result = await server.call("update_load_type", { id: "lt1", name: "Updated", duration_min: 30 });
    expect(api.request).toHaveBeenCalledWith({
      method: "PATCH",
      path: "/loadtype/lt1",
      body: { name: "Updated", duration_min: 30 },
    });
    expect(JSON.parse(result.content[0].text)).toEqual({ id: "lt1", name: "Updated" });
  });

  it("delete_load_type sends DELETE /loadtype/:id", async () => {
    api.request.mockResolvedValueOnce(undefined);
    const result = await server.call("delete_load_type", { id: "lt1" });
    expect(api.request).toHaveBeenCalledWith({
      method: "DELETE",
      path: "/loadtype/lt1",
    });
    expect(result.content[0].text).toContain("deleted successfully");
  });
});
