import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadConfig } from "./config.js";

describe("loadConfig", () => {
  beforeEach(() => {
    delete process.env.OPENDOCK_API_URL;
    delete process.env.OPENDOCK_USERNAME;
    delete process.env.OPENDOCK_PASSWORD;
    delete process.env.OPENDOCK_TOKEN;
  });

  it("returns config with token only", () => {
    process.env.OPENDOCK_TOKEN = "my-jwt";
    const config = loadConfig();
    expect(config.token).toBe("my-jwt");
    expect(config.apiUrl).toBe("https://neutron.opendock.com");
  });

  it("returns config with username and password", () => {
    process.env.OPENDOCK_USERNAME = "user";
    process.env.OPENDOCK_PASSWORD = "pass";
    const config = loadConfig();
    expect(config.username).toBe("user");
    expect(config.password).toBe("pass");
    expect(config.token).toBeUndefined();
  });

  it("uses custom API URL when set", () => {
    process.env.OPENDOCK_TOKEN = "tok";
    process.env.OPENDOCK_API_URL = "https://custom.api.com";
    const config = loadConfig();
    expect(config.apiUrl).toBe("https://custom.api.com");
  });

  it("throws when no token and no credentials", () => {
    expect(() => loadConfig()).toThrow(
      "Either OPENDOCK_TOKEN or both OPENDOCK_USERNAME and OPENDOCK_PASSWORD must be set"
    );
  });

  it("throws when only username is set (partial credentials)", () => {
    process.env.OPENDOCK_USERNAME = "user";
    expect(() => loadConfig()).toThrow();
  });

  it("throws when only password is set (partial credentials)", () => {
    process.env.OPENDOCK_PASSWORD = "pass";
    expect(() => loadConfig()).toThrow();
  });

  it("warns when both token and credentials are set", () => {
    process.env.OPENDOCK_TOKEN = "tok";
    process.env.OPENDOCK_USERNAME = "user";
    process.env.OPENDOCK_PASSWORD = "pass";
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const config = loadConfig();
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("Both OPENDOCK_TOKEN and OPENDOCK_USERNAME are set")
    );
    expect(config.token).toBe("tok");
  });
});
