import { describe, it, expect, beforeEach } from "vitest";
import { registerCarrierTools } from "./carriers.js";
import { mockServer, mockApi } from "./test-utils.js";

describe("carrier tools", () => {
  let server: ReturnType<typeof mockServer>;
  let api: ReturnType<typeof mockApi>;

  beforeEach(() => {
    server = mockServer();
    api = mockApi();
    registerCarrierTools(server as any, api as any);
  });

  it("registers all 5 carrier tools", () => {
    expect(server.tools.size).toBe(5);
  });

  it("list_carriers sends GET /carrier with query params", async () => {
    api.request.mockResolvedValueOnce([{ id: "c1" }]);
    const result = await server.call("list_carriers", { name: "ACME" });
    expect(api.request).toHaveBeenCalledWith({
      path: "/carrier",
      query: { name: "ACME" },
    });
    expect(JSON.parse(result.content[0].text)).toEqual([{ id: "c1" }]);
  });

  it("get_carrier sends GET /carrier/:id", async () => {
    api.request.mockResolvedValueOnce({ id: "c1", name: "ACME Freight" });
    const result = await server.call("get_carrier", { id: "c1" });
    expect(api.request).toHaveBeenCalledWith({ path: "/carrier/c1" });
    expect(JSON.parse(result.content[0].text)).toEqual({ id: "c1", name: "ACME Freight" });
  });

  it("create_carrier sends POST /carrier", async () => {
    api.request.mockResolvedValueOnce({ id: "c2", email: "new@acme.com" });
    const result = await server.call("create_carrier", { email: "new@acme.com", firstName: "Jane" });
    expect(api.request).toHaveBeenCalledWith({
      method: "POST",
      path: "/carrier",
      body: { email: "new@acme.com", firstName: "Jane" },
    });
    expect(JSON.parse(result.content[0].text)).toEqual({ id: "c2", email: "new@acme.com" });
  });

  it("update_carrier sends PATCH /carrier/:id", async () => {
    api.request.mockResolvedValueOnce({ id: "c1", phone: "555-1234" });
    const result = await server.call("update_carrier", { id: "c1", phone: "555-1234" });
    expect(api.request).toHaveBeenCalledWith({
      method: "PATCH",
      path: "/carrier/c1",
      body: { phone: "555-1234" },
    });
    expect(JSON.parse(result.content[0].text)).toEqual({ id: "c1", phone: "555-1234" });
  });

  it("get_booked_carriers sends GET /carrier/booked", async () => {
    api.request.mockResolvedValueOnce([{ id: "c1" }]);
    const result = await server.call("get_booked_carriers", {});
    expect(api.request).toHaveBeenCalledWith({ path: "/carrier/booked" });
    expect(JSON.parse(result.content[0].text)).toEqual([{ id: "c1" }]);
  });
});
