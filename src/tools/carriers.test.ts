import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerCarrierTools } from "./carriers.js";

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

describe("carrier tools", () => {
  let server: ReturnType<typeof mockServer>;
  let api: ReturnType<typeof mockApi>;

  beforeEach(() => {
    server = mockServer();
    api = mockApi();
    registerCarrierTools(server as any, api as any);
  });

  it("registers all 2 carrier tools", () => {
    expect(server.tools.size).toBe(2);
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
});
