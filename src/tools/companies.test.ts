import { describe, it, expect, beforeEach } from "vitest";
import { registerCompanyTools } from "./companies.js";
import { mockServer, mockApi } from "./test-utils.js";

describe("company tools", () => {
  let server: ReturnType<typeof mockServer>;
  let api: ReturnType<typeof mockApi>;

  beforeEach(() => {
    server = mockServer();
    api = mockApi();
    registerCompanyTools(server as any, api as any);
  });

  it("registers all 4 company tools", () => {
    expect(server.tools.size).toBe(4);
  });

  it("list_companies sends GET /company with query params", async () => {
    api.request.mockResolvedValueOnce({ data: [{ id: "co1" }], total: 1 });
    const result = await server.call("list_companies", { limit: 10 });
    expect(api.request).toHaveBeenCalledWith({
      path: "/company",
      query: { limit: 10 },
    });
    expect(JSON.parse(result.content[0].text)).toEqual({ data: [{ id: "co1" }], total: 1 });
  });

  it("get_company sends GET /company/:id", async () => {
    api.request.mockResolvedValueOnce({ id: "co1", name: "ACME Logistics" });
    const result = await server.call("get_company", { id: "co1" });
    expect(api.request).toHaveBeenCalledWith({ path: "/company/co1" });
    expect(JSON.parse(result.content[0].text)).toEqual({ id: "co1", name: "ACME Logistics" });
  });

  it("update_company sends PATCH /company/:id", async () => {
    api.request.mockResolvedValueOnce({ id: "co1", name: "Updated Name", scac: "UPDT" });
    const result = await server.call("update_company", { id: "co1", name: "Updated Name", scac: "UPDT" });
    expect(api.request).toHaveBeenCalledWith({
      method: "PATCH",
      path: "/company/co1",
      body: { name: "Updated Name", scac: "UPDT" },
    });
    expect(JSON.parse(result.content[0].text)).toEqual({ id: "co1", name: "Updated Name", scac: "UPDT" });
  });

  it("create_company sends POST /company", async () => {
    api.request.mockResolvedValueOnce({ id: "co2", name: "NewCo", type: "type_carrier" });
    const result = await server.call("create_company", { name: "NewCo", type: "type_carrier", scac: "NEWC" });
    expect(api.request).toHaveBeenCalledWith({
      method: "POST",
      path: "/company",
      body: { name: "NewCo", type: "type_carrier", scac: "NEWC" },
    });
    expect(JSON.parse(result.content[0].text)).toEqual({ id: "co2", name: "NewCo", type: "type_carrier" });
  });
});
