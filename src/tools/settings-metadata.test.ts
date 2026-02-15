import { describe, it, expect, beforeEach } from "vitest";
import { registerSettingsMetadataTools } from "./settings-metadata.js";
import { mockServer, mockApi } from "./test-utils.js";

describe("settings-metadata tools", () => {
  let server: ReturnType<typeof mockServer>;
  let api: ReturnType<typeof mockApi>;

  beforeEach(() => {
    server = mockServer();
    api = mockApi();
    registerSettingsMetadataTools(server as any, api as any);
  });

  it("registers all 3 settings-metadata tools", () => {
    expect(server.tools.size).toBe(3);
  });

  it("get_settings_metadata sends GET /settings-metadata/:entityType", async () => {
    api.request.mockResolvedValueOnce([{ key: "timezone", type: "string" }]);
    const result = await server.call("get_settings_metadata", { entityType: "warehouse" });
    expect(api.request).toHaveBeenCalledWith({ path: "/settings-metadata/warehouse" });
    expect(JSON.parse(result.content[0].text)).toEqual([{ key: "timezone", type: "string" }]);
  });

  it("get_setting_metadata sends GET /settings-metadata/:entityType/:settingKey", async () => {
    api.request.mockResolvedValueOnce({ key: "timezone", type: "string", required: true });
    const result = await server.call("get_setting_metadata", { entityType: "warehouse", settingKey: "timezone" });
    expect(api.request).toHaveBeenCalledWith({ path: "/settings-metadata/warehouse/timezone" });
    expect(JSON.parse(result.content[0].text)).toEqual({ key: "timezone", type: "string", required: true });
  });

  it("validate_settings_metadata sends POST /settings-metadata/validate/:entityType", async () => {
    api.request.mockResolvedValueOnce({ valid: true });
    const result = await server.call("validate_settings_metadata", { entityType: "dock" });
    expect(api.request).toHaveBeenCalledWith({
      method: "POST",
      path: "/settings-metadata/validate/dock",
    });
    expect(JSON.parse(result.content[0].text)).toEqual({ valid: true });
  });
});
